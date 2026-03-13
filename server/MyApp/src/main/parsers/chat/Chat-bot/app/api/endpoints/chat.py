from models.chat import (
    Conversation, MessageStatus, SendMessageRequest, SendMessageResponse, CreateConversationRequest,
    Message, ConversationListResponse, ConversationFilter,
    StreamResponse, StreamChunk, StreamEventType,
    APIResponse, ErrorResponse
)
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status, WebSocket, WebSocketDisconnect, Query
from core.security import get_current_user, get_current_active_user
from typing import  Any, AsyncGenerator, Dict, List, Optional, cast
from fastapi.responses import StreamingResponse, JSONResponse 
from services.user_service import RedisManager, user_service
from core import require_permission, Permission
from models.user import ModerationService, User
from api.websockets import WebSocketManager
from services.ai_service import AIService
from datetime import datetime, timezone
from models.chat import ChatService
from services import redis_client
from uuid import UUID, uuid4
import logging
import time
import json
import uuid

router: APIRouter = APIRouter(prefix="/api/chat", tags=["chat"])

# Инициализация сервисов
chat_service = ChatService()
ai_service = AIService()
moderation_service = ModerationService()
websocket_manager = WebSocketManager()
app = FastAPI()

logger = logging.getLogger(__name__)

async def get_redis_client() -> RedisManager:
    """Dependency для получения Redis клиента"""
    return redis_client

@router.post("/conversations", response_model=APIResponse)
async def create_conversation(
    conversation_data: CreateConversationRequest,
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Создание нового диалога с использованием цепочки Redis операций """
    try:
        conversation_id = str(uuid4())
        
        conversation = chat_service.create_conversation(
            conversation_id=conversation_id,
            user_id=str(current_user.id),
            title=str(conversation_data.title),
            conversation_type=conversation_data.conversation_type,
            tags=conversation_data.tags,
            initial_message=conversation_data.initial_message
        )
        
        redis_results = await redis_client\
            .setex_chain(f"conversation:{conversation_id}", 3600, f"user:{current_user.id}")\
            .sadd_chain(f"user:{current_user.id}:conversations", conversation_id)\
            .hincrby_chain(f"user:{current_user.id}:stats", "conversations_count", 1)\
            .execute()
        
        if conversation_data.initial_message:
            await redis_client.lpush(
                f"conversation:{conversation_id}:messages",
                conversation_data.initial_message
            )
        
        return APIResponse(
            success=True,
            data={
                "conversation": conversation,
                "redis_operations": len(redis_results)
            },
            message="Диалог успешно создан"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании диалога: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=APIResponse)
async def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    pinned_only: bool = False,
    archived_only: bool = False,
    use_cache: bool = Query(True, description="Использовать кеширование"),
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Получение списка диалогов пользователя с пагинацией и фильтрацией"""
    try:
        cache_key = f"user:{current_user.id}:conversations:{skip}:{limit}:{hash(str([search, tags, pinned_only, archived_only]))}"
        cached = False
        if use_cache and not search:
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                cached_response = json.loads(cached_data.decode())
                return APIResponse(
                    success=True,
                    data=cached_response,
                    message="Диалоги загружены из кеша"
                )
        
        filter_obj = ConversationFilter(
            search_term=search,
            tags=tags,
            pinned_only=pinned_only,
            archived_only=archived_only,
            sort_by="updated_at",
            sort_order="desc"
        )
        
        conversations, total = await chat_service.get_user_conversations(
            user_id=str(current_user.id),
            skip=skip,
            limit=limit,
            filter_obj=filter_obj.model_dump() if filter_obj else None
        )
        
        response_data = ConversationListResponse(
            conversations=[Conversation(**conv) for conv in conversations], 
            total=total,
            page=skip // limit + 1,
            page_size=limit,
            has_more=skip + limit < total
        )
        
        cache_ttl = 300 if not search else 60
        
        if use_cache:
            await redis_client.setex(
                cache_key,
                cache_ttl,
                json.dumps(response_data.model_dump())
            )
        await redis_client.hincrby(
            f"user:{current_user.id}:stats",
            "conversations_requests",
            1
        )
        
        return APIResponse(
            success=True,
            data=response_data,
            message="Диалоги успешно получены" + (" (из кеша)" if cached else "")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении диалогов: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=APIResponse)
async def get_conversation(
    conversation_id: UUID,
    use_cache: bool = Query(True, description="Использовать кеширование"),
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Получение конкретного диалога с сообщениями """
    try:
        cache_key = f"conversation:{conversation_id}:user:{current_user.id}"
        version_key = f"conversation:{conversation_id}:version"
        cached = False

        async def update_conversation_stats(
            redis_client: RedisManager, 
            conversation_id: UUID, 
            user_id: int
        ):
            """Обновление статистики диалога"""
            pipeline = redis_client.pipeline()
            pipeline.hincrby(f"conversation:{conversation_id}:stats", "views_count", 1)
            pipeline.hset(f"user:{user_id}:recent_views", {str(conversation_id): str(datetime.now())})
            pipeline.hincrby(f"user:{user_id}:stats", "conversation_views", 1)
            pipeline.zadd(f"conversation:popularity", {str(conversation_id): int(time.time())})
    
            await pipeline.execute()
        await update_conversation_stats(redis_client, conversation_id, current_user.id)
        if use_cache:
            current_version = await redis_client.get(version_key) or "0"
            cached_conversation = await redis_client.get(f"{cache_key}:v{current_version}")
            if cached_conversation:
                conversation_data = json.loads(cached_conversation.decode())
                cached = True
                await update_conversation_stats(redis_client, conversation_id, current_user.id)
                return APIResponse(
                    success=True,
                    data=conversation_data,
                    message="Диалог загружен из кеша"
                )
        conversation = await chat_service.get_conversation_with_messages(str(conversation_id)) 
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Диалог не найден"
            )
        if conversation.get('user_id') != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нет доступа к этому диалогу"
            )
        
        async def cache_conversation_data(
            redis_client: RedisManager, 
            conversation_id: UUID, 
            user_id: int, 
            conversation_data: Dict[str, Any]
        ):
            """Кеширование данных диалога"""
            version_key = f"conversation:{conversation_id}:version"
            cache_key = f"conversation:{conversation_id}:user:{user_id}"
            current_version = await redis_client.get(version_key)
            if not current_version:
                current_version = "1"
                await redis_client.set(version_key, current_version)
            else:
                current_version = current_version.decode()
            await redis_client.setex(f"{cache_key}:v{current_version}",300, json.dumps(conversation_data))
        if use_cache:
            await cache_conversation_data(
                redis_client, 
                conversation_id, 
                current_user.id, 
                conversation
            )
        return APIResponse(
            success=True,
            data=conversation,
            message="Диалог успешно получен" + (" (из кеша)" if cached else "")
        )
    except HTTPException:
        raise
    except Exception as e:
        
        async def log_conversation_error(
            redis_client: RedisManager, 
            conversation_id: UUID, 
            error_message: str
        ):
            """Логирование ошибок диалога"""
            error_key = f"conversation:{conversation_id}:errors"
            await redis_client.lpush(error_key, f"{datetime.now()}: {error_message}")
            await redis_client.ltrim(error_key, 0, 9) 

        await log_conversation_error(redis_client, conversation_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении диалога: {str(e)}"
        )

@router.put("/conversations/{conversation_id}", response_model=APIResponse)
async def update_conversation(
    conversation_id: UUID,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Обновление диалога (название, теги, закрепление) """
    try:
        conversation: Optional[Dict[str, Any]] = await chat_service.update_conversation(
            conversation_id=str(conversation_id),
            update_data=update_data,
            user_id=str(current_user.id),
            db=redis_client 
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Диалог не найден"
            )
        
        return APIResponse(
            success=True,
            data=conversation,
            message="Диалог успешно обновлен"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении диалога: {str(e)}"
        )

@router.delete("/conversations/{conversation_id}", response_model=APIResponse)
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Удаление диалога """
    try:
        success: bool = await chat_service.delete_conversation(
            conversation_id=str(conversation_id),
            user_id=str(current_user.id),
            db=redis_client
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Диалог не найден"
            )
        
        return APIResponse(
            success=True,
            message="Диалог успешно удален"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении диалога: {str(e)}"
        )

@router.post("/message", response_model=SendMessageResponse)
async def send_message(
    message_request: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)   
) -> SendMessageResponse:
    """ Отправка сообщения (не потоковый режим) """
    try:
        moderation_result = await moderation_service.moderate_content(
            content=message_request.message,
            user_id=str(current_user.id),
            db=redis_client
        )
        if not moderation_result["is_approved"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Сообщение содержит недопустимый контент: {', '.join(moderation_result['moderation_notes'])}"
            )
        result = await chat_service.send_message(
            user_service=user_service,
            db=redis_client,
            user_id=str(current_user.id),
            message_request=message_request,
            moderation_result=moderation_result
        )
        
        return cast(SendMessageResponse, result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при отправке сообщения: {str(e)}"
        )

@router.post("/message/stream")
async def send_message_stream(
    user_id: str,
    conversation_id: str,
    message_request: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client),
) -> StreamingResponse:
    """ Отправка сообщения с потоковой генерацией ответа (SSE) """
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            moderation_result = await moderation_service.moderate_content(
                content=message_request.message,
                user_id=str(current_user.id),
                db=redis_client
            )
            if not moderation_result["is_approved"]:
                error_data = StreamResponse(
                    event=StreamEventType.ERROR,
                    data=StreamChunk(
                        chunk="Сообщение содержит недопустимый контент",
                        done=True
                    )
                )
                yield f"data: {error_data.model_dump_json()}\n\n"
                return
            user_message = await chat_service.create_user_message(
                user_service=user_service,
                db=redis_client,
                user_id=str(current_user.id),
                message_request=message_request,
                moderation_result=moderation_result
            )
            message_id = str(uuid.uuid4())
            full_response = ""
            tokens_used = 0
            
            async for chunk in ai_service.generate_stream_response(
                prompt=message_request.message,
                conversation_history=await chat_service.get_conversation_history(
                    user_service=user_service,
                    db=redis_client,
                    conversation_id=str(message_request.conversation_id),
                    user_id=str(current_user.id)
                ) if message_request.conversation_id else [],
                conversation_id=conversation_id,
                user_id=user_id,
                model=message_request.model,
                temperature=message_request.temperature,
                max_tokens=message_request.max_tokens or 1000
            ):
                full_response += chunk
                tokens_used += 1
                
                stream_data = StreamResponse(
                    event=StreamEventType.CHUNK,
                    data=StreamChunk(
                        chunk=chunk,
                        done=False,
                        message_id=UUID(message_id),
                        tokens=tokens_used
                    ),
                    conversation_id=message_request.conversation_id
                )
                yield f"data: {stream_data.model_dump_json()}\n\n"

            if user_message and user_message.get("id"):
                parent_message_id = str(user_message["id"])
            else:
                parent_message_id = str(uuid.uuid4()) 
            assistant_message = await chat_service.create_assistant_message(
                user_service=user_service,
                db=redis_client,
                user_id=user_id,
                conversation_id=conversation_id,
                content=full_response,
                parent_message_id=parent_message_id,
                message_id=message_id,
                usage_data={
                    "prompt_tokens": len(message_request.message.split()),
                    "completion_tokens": tokens_used,
                    "total_tokens": len(message_request.message.split()) + tokens_used
                }
            )
            if assistant_message and assistant_message.get("content"):
                complete_data = StreamResponse(
                    event=StreamEventType.COMPLETE,
                    data=StreamChunk(
                        chunk=assistant_message["content"],
                        done=True,
                        message_id=UUID(message_id),
                        full_message=assistant_message 
                    ),
                    conversation_id=UUID(conversation_id)
                )
                yield f"data: {complete_data.model_dump_json()}\n\n"
            logger.info(f"Processing message: {message_request.message[:100]}...")
        except Exception as e:
            error_data = StreamResponse(
                event=StreamEventType.ERROR,
                data=StreamChunk(
                    chunk=f"Ошибка при генерации ответа: {str(e)}",
                    done=True
                )
            )
            yield f"data: {error_data.model_dump_json()}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.websocket("/ws/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: UUID,
    token: str = Query(...)
):
    """ WebSocket endpoint для реального времени"""
    try:
        user = await get_current_user(token=token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        await websocket_manager.connect(websocket, str(user.id))
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                if message_data["type"] == "chat_message":
                    await handle_websocket_message(
                        websocket=websocket,
                        user=user,
                        conversation_id=conversation_id,
                        message_data=message_data
                    )
                    
                elif message_data["type"] == "typing_indicator":
                    await websocket_manager.broadcast_typing(
                        conversation_id=str(conversation_id),
                        user_id=str(user.id), 
                        is_typing=message_data["payload"]["is_typing"]
                    )
                        
        except WebSocketDisconnect:
            await websocket_manager.connect(websocket, str(user.id))
            
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

async def handle_websocket_message(
    websocket: WebSocket,
    user: User,
    conversation_id: UUID,
    message_data: Dict[str, Any],
    redis_client: RedisManager = Depends(get_redis_client),
):
    """ Обработка WebSocket сообщений """
    try:
        moderation_result = await moderation_service.moderate_content(
            content=message_data["payload"]["content"],
            user_id=str(user.id),
            db=redis_client 
        )
        if not moderation_result.get("is_approved", True):
            reasons = moderation_result.get("reasons", [])
            error_response: Dict[str, Any] = {
                "type": "error",
                "payload": {
                    "message": f"Сообщение содержит недопустимый контент: {', '.join(reasons)}",
                    "message_id": message_data["payload"]["message_id"]
                }
            }
            await websocket.send_text(json.dumps(error_response))
            return
        
        user_message = await chat_service.create_user_message(
            user_service=user_service,
            db=redis_client,
            user_id=str(user.id),
            message_request=SendMessageRequest(
                message=message_data["payload"]["content"],
                conversation_id=conversation_id,
                parent_message_id=message_data["payload"].get("parent_message_id"),
                stream=True,
                max_tokens=1000,
                temperature=0.7 
            ),
            moderation_result=moderation_result
        )
        
        await websocket_manager.broadcast_message(
            conversation_id=str(conversation_id),
            message=user_message,
            exclude_user_id=str(user.id)
        )
        await generate_ai_websocket_response(
            websocket=websocket,
            user=user,
            user_id=str(user.id),
            message_request=SendMessageRequest(
                message=message_data["payload"]["content"],
                conversation_id=conversation_id,
                parent_message_id=message_data["payload"].get("parent_message_id"),
                stream=True,
                max_tokens=1000,
                temperature=0.7 
            ),
            conversation_id=str(conversation_id),
            user_message=Message(
                id=UUID(user_message["id"]),
                content=user_message["content"],
                role=user_message["role"], 
                conversation_id=conversation_id,
                parent_message_id=UUID(user_message["parent_message_id"]) if user_message.get("parent_message_id") else None,
                status=MessageStatus.SENT,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
        )
        
    except Exception as e:
        error_response = {
            "type": "error",
            "payload": {
                "message": f"Ошибка обработки сообщения: {str(e)}",
                "message_id": message_data.get("payload", {}).get("message_id")
            }
        }
        await websocket.send_text(json.dumps(error_response))

async def generate_ai_websocket_response(
    user_id: str,  
    user: User,  
    websocket: WebSocket,
    conversation_id: str,
    user_message: Message,
    message_request: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
):
    """ Генерация AI ответа через WebSocket"""
    try:
        message_id = str(uuid4())
        start_response: Dict[str, Any] = {
            "type": "generation_start",
            "payload": {
                "message_id": message_id,
                "conversation_id": str(conversation_id)
            }
        }
        await websocket.send_text(json.dumps(start_response))
        full_response = ""
        tokens_used = 0
        async for chunk in ai_service.generate_stream_response(
            prompt=message_request.message,
            conversation_history=await chat_service.get_conversation_history(
                user_service=user_service,
                db=redis_client,
                conversation_id=str(message_request.conversation_id),
                user_id=str(current_user.id)
            ) if message_request.conversation_id else [],
            conversation_id=conversation_id,
            user_id=user_id,
            model=message_request.model,
            temperature=message_request.temperature,
            max_tokens=message_request.max_tokens or 1000
        ):
            full_response += chunk
            tokens_used += 1
            
            await websocket.send_text(json.dumps({
                "type": "chunk",
                "payload": {
                    "chunk": chunk,
                    "message_id": message_id,
                    "done": False
                }
            }))

        assistant_message = await chat_service.create_assistant_message(
            user_service=user_service,
            db=redis_client,
            user_id=user_id,
            conversation_id=conversation_id,
            content=full_response,
            parent_message_id=str(user_message.id) if user_message and user_message.id else str(uuid.uuid4()),
            message_id=message_id,
            usage_data={
                "prompt_tokens": len(message_request.message.split()),
                "completion_tokens": tokens_used,
                "total_tokens": len(message_request.message.split()) + tokens_used
            }
        )

        await websocket_manager.broadcast_message(
            conversation_id=conversation_id,
            message=assistant_message,
            exclude_user_id=str(user.id)
        )
        
        complete_response: Dict[str, Any] = {
            "type": "generation_complete",
            "payload": {
                "message_id": message_id,
                "content": full_response
            }
        }
        await websocket.send_text(json.dumps(complete_response))
        
    except Exception as e:
        message_id = str(uuid4())
        error_response: Dict[str, Any] = {
            "type": "generation_error",
            "payload": {
                "message": f"Ошибка генерации: {str(e)}",
                "message_id": message_id if 'message_id' in locals() else None
            }
        }
        await websocket.send_text(json.dumps(error_response))

async def generate_stream_response( 
    user_id: str,
    websocket: WebSocket,
    conversation_id: str,
    message_request: SendMessageRequest,
    current_user: User = Depends(get_current_active_user)
) -> AsyncGenerator[str, None]:
    """ Генерирует потоковый ответ используя AI сервис"""
    try:
        tokens_used = 0
        full_response = ""
        async for chunk in ai_service.generate_stream_response(
            prompt=message_request.message,
            conversation_history=await chat_service.get_conversation_history(
                user_service=user_service,
                db=redis_client,
                conversation_id=str(message_request.conversation_id),
                user_id=str(current_user.id)
            ) if message_request.conversation_id else [],
            conversation_id=conversation_id,
            user_id=user_id,
            model=message_request.model,
            temperature=message_request.temperature,
            max_tokens=message_request.max_tokens or 1000
        ):
            full_response += chunk
            tokens_used += 1
            
            message_id = str(uuid4()),
            await websocket.send_text(json.dumps({
                "type": "chunk",
                "payload": {
                    "chunk": chunk,
                    "message_id": message_id,
                    "done": False
                }
            }))
            yield chunk
    except Exception as e:
        yield f"Ошибка генерации: {str(e)}"

@router.get("/search", response_model=APIResponse)
async def search_messages(
    q: str = Query(..., min_length=1, max_length=100),
    conversation_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Поиск сообщений по содержанию"""
    try:
        results = await chat_service.search_messages(
            user_service=user_service,
            db=redis_client,
            user_id=str(current_user.id),
            query=q,
            conversation_id=str(conversation_id)
        )
        
        return APIResponse(
            success=True,
            data=results,
            message="Поиск выполнен успешно"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при поиске: {str(e)}"
        )

@router.get("/analytics", response_model=APIResponse)
@require_permission([Permission.SYSTEM_CONFIG, Permission.ADMIN])
async def get_chat_analytics(
    current_user: User = Depends(get_current_active_user),
    redis_client: RedisManager = Depends(get_redis_client)  
) -> APIResponse:
    """ Получение аналитики чата (только для администраторов)"""
    try:
        analytics = await chat_service.get_chat_analytics(
            user_service=user_service,
            db=redis_client,
            user_id=str(current_user.id),
            days=30
        )
        
        return APIResponse(
            success=True,
            data=analytics,
            message="Аналитика успешно получена"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении аналитики: {str(e)}"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    error_details: Dict[str, Any]  = {
        "path": request.url.path,
        "method": request.method,
        "query_params": dict(request.query_params),
        "client_host": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "timestamp": time.time()
    }
    
    print(f"Error {exc.status_code} at {error_details['path']}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            error=exc.detail,
            details=error_details,
            error_code=f"HTTP_{exc.status_code}",
            timestamp=error_details["timestamp"]
        ).model_dump()
    )
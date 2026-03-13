from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, APIRouter, WebSocketException, status
from core.security import SecurityService, get_current_user
from typing import Any, Optional, Dict, List, Set, Tuple
from services.user_service import authenticate_user
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from services.user_service import user_service
from services.auth import create_access_token
from services import ai_service, redis_client
from datetime import datetime, timezone
from models.chat import chat_service
from schemas import LoginRequest
from models.user import User
from core import settings
from uuid import uuid4
import logging
import json
import jwt

logger = logging.getLogger(__name__)
websocket_router = APIRouter()

class WebSocketManager:
    """  Менеджер для управления WebSocket соединениями """
    
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.groups: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """ Подключение пользователя к WebSocket"""
        await websocket.accept()
        connection_id = str(uuid4())
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        
        self.active_connections[user_id][connection_id] = websocket
        logger.info(f"User {user_id} connected with connection {connection_id}")
        
        return connection_id
    
    def disconnect(self, user_id: str, connection_id: str) -> None:
        """ Отключение пользователя от WebSocket """
        if user_id in self.active_connections:
            if connection_id in self.active_connections[user_id]:
                del self.active_connections[user_id][connection_id]
                logger.info(f"User {user_id} disconnected connection {connection_id}")
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: Dict[str, Any], user_id: str) -> bool:
        """ Отправка личного сообщения пользователю"""
        if user_id not in self.active_connections:
            return False
        
        success = True
        disconnected_connections: List[str] = []
        
        for connection_id, websocket in self.active_connections[user_id].items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {user_id}: {e}")
                disconnected_connections.append(connection_id)
                success = False
        for connection_id in disconnected_connections:
            self.disconnect(user_id, connection_id)
        
        return success
    
    async def broadcast(self, message: Dict[str, Any]) -> None:
        """ Рассылка сообщения всем подключенным пользователям """
        disconnected_users: List[Tuple[str, str]] = []
        
        for user_id, connections in self.active_connections.items():
            for connection_id, websocket in connections.items():
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to broadcast to {user_id}: {e}")
                    disconnected_users.append((user_id, connection_id))
        for user_id, connection_id in disconnected_users:
            self.disconnect(user_id, connection_id)

    async def broadcast_typing(self, user_id: str, conversation_id: str, is_typing: bool = True) -> None:
        """Отправляет статус набора сообщения"""
        if user_id in self.active_connections:
            message: Dict[str, Any] = {
                "type": "typing",
                "user_id": user_id,
                "conversation_id": conversation_id,
                "is_typing": is_typing
            }
            for connection in self.active_connections[user_id].values():
                await connection.send_json(message)  

    async def broadcast_message(self, conversation_id: str, message: Dict[str, Any], exclude_user_id: str) -> None:
        """Отправляет сообщение всем участникам диалога кроме указанного пользователя"""
        for user_id, connections in self.active_connections.items():
            if user_id != exclude_user_id:
                for connection in connections.values():
                    await connection.send_json({
                        "type": "message",
                        "conversation_id": conversation_id,
                        "message": message
                    })              
    
    async def send_to_group(self, message: Dict[str, Any], group_name: str) -> None:
        """ Отправка сообщения всем пользователям в группе """
        if group_name not in self.groups:
            return
        
        disconnected_users: List[Tuple[str, str]] = []
        
        for user_id in self.groups[group_name]:
            if user_id in self.active_connections:
                for connection_id, websocket in self.active_connections[user_id].items():
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        logger.error(f"Failed to send to group {group_name} user {user_id}: {e}")
                        disconnected_users.append((user_id, connection_id))
        for user_id, connection_id in disconnected_users:
            self.disconnect(user_id, connection_id)
    
    def add_to_group(self, user_id: str, group_name: str) -> None:
        """ Добавление пользователя в группу """
        if group_name not in self.groups:
            self.groups[group_name] = set()
        
        self.groups[group_name].add(user_id)
        logger.info(f"User {user_id} added to group {group_name}")
    
    def remove_from_group(self, user_id: str, group_name: str) -> None:
        """ Удаление пользователя из группы """
        if group_name in self.groups and user_id in self.groups[group_name]:
            self.groups[group_name].remove(user_id)
            logger.info(f"User {user_id} removed from group {group_name}")
            if not self.groups[group_name]:
                del self.groups[group_name]
    
    def get_online_users(self) -> List[str]:
        """ Получение списка онлайн пользователей"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """ Проверка, онлайн ли пользователь """
        return user_id in self.active_connections
    
    def get_user_connections_count(self, user_id: str) -> int:
        """ Получение количества активных соединений пользователя """
        if user_id in self.active_connections:
            return len(self.active_connections[user_id])
        return 0
    
    async def close_all_connections(self) -> None:
        """ Закрытие всех соединений """
        for user_connections in self.active_connections.values():
            for connection_id, websocket in user_connections.items():
                try:
                    await websocket.close()
                except Exception as e:
                    logger.error(f"Error closing connection {connection_id}: {e}")
        
        self.active_connections.clear()
        self.groups.clear()

# Глобальный экземпляр менеджера WebSocket
websocket_manager = WebSocketManager()

app = FastAPI()

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    user = await authenticate_user(credentials.username, credentials.password) 
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/chat/stream")
async def chat_stream(prompt: str, user: User = Depends(get_current_user)):
    async def generate():
        try:
            async for chunk in ai_service.generate_stream_response(
                prompt=prompt,
                conversation_history=[], 
                conversation_id="some_conversation_id",
                user_id="some_user_id",
                model="gpt-3.5-turbo",
                temperature=0.7,
                max_tokens=1000
            ):
                yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
            
            yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive", 
            "Access-Control-Allow-Origin": "*",
        }
    )

@websocket_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint для подключения пользователей """
    connection_id = await websocket_manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            await handle_websocket_message(user_id, message_data)
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id, connection_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        websocket_manager.disconnect(user_id, connection_id)

async def get_current_user_from_ws(websocket: WebSocket, require_auth: bool = True) -> Optional[User]:
    """ Получение пользователя из WebSocket соединения """
    try:
        token = websocket.query_params.get("token")
        if not token:
            token = websocket.cookies.get("access_token")
        if not token:
            if require_auth:
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="Authentication required"
                )
            return None
        payload = SecurityService.verify_token(token)
        if not payload:
            if require_auth:
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="Invalid token"
                )
            return None
        user_id = payload.get("sub")
        
        if not user_id:
            if require_auth:
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="Invalid token payload"
                )
            return None
        
        user = await user_service.get_user_by_id(redis_client, str(user_id))
        if not user:
            if require_auth:
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="User not found"
                )
            return None
        if not user.is_active:
            if require_auth:
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="User inactive"
                )
            return None
        return user
    except jwt.InvalidTokenError:
        if require_auth:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Invalid token"
            )
        return None
    except Exception as e:
        if require_auth:
            raise WebSocketException(
                code=status.WS_1011_INTERNAL_ERROR,
                reason=f"Authentication error: {str(e)}"
            )
        return None
    
@websocket_router.websocket("/ws/chat/{conversation_id}")
async def chat_websocket_endpoint(
    websocket: WebSocket, 
    conversation_id: str,
    user_id: str = Depends(get_current_user_from_ws)
):
    """ WebSocket endpoint для чат-комнат """
    connection_id = await websocket_manager.connect(websocket, user_id)
    websocket_manager.add_to_group(user_id, f"chat_{conversation_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            await websocket_manager.send_to_group(
                {
                    "type": "chat_message",
                    "user_id": user_id,
                    "message": message_data.get("content"),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                f"chat_{conversation_id}"
            )
    except WebSocketDisconnect:
        websocket_manager.remove_from_group(user_id, f"chat_{conversation_id}")
        websocket_manager.disconnect(user_id, connection_id)
    except Exception as e:
        logger.error(f"Chat WebSocket error: {e}")
        websocket_manager.remove_from_group(user_id, f"chat_{conversation_id}")
        websocket_manager.disconnect(user_id, connection_id)

async def handle_websocket_message(user_id: str, message_data: Dict[str, Any]):
    """ Обработка входящих WebSocket сообщений """
    message_type = message_data.get("type")
    if message_type == "ping":
        await websocket_manager.send_personal_message(
            {"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()},
            user_id
        )
    elif message_type == "chat_message":
        content = message_data.get("content")
        conversation_id = message_data.get("conversation_id")
        if content and conversation_id:
            message = await chat_service.add_message(
                conversation_id, 
                user_id, 
                content, 
                "user"
            )
            await websocket_manager.send_personal_message(
                {
                    "type": "message_sent",
                    "message_id": message["id"],
                    "timestamp": message["timestamp"]
                },
                user_id
            )
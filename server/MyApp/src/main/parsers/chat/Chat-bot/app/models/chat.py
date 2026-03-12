from typing import List, Optional, Dict, Any, Literal, Set, Tuple
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta, timezone
from services import UserService, redis_client
from core.redis import RedisManager
from uuid import UUID, uuid4
from models.user import User
from enum import Enum
import logging
import uuid
import json

logger = logging.getLogger(__name__)

class ChatService:
    """ Сервис для управления чатами и сообщениями """
    
    def __init__(self):
        self.conversations: Dict[str, Dict[str, Any]] = {}  
        self.user_conversations: Dict[str, Set[str]] = {}
        self.message_counter = 0
    
    async def create_conversation(self, conversation_id: str, user_id: str, title: str = "Новый чат", conversation_type: str = "general", tags: Optional[List[str]] = None, initial_message: Optional[str] = None) -> Dict[str, Any]:
        """ Создание нового чата """
        conversation: Dict[str, Any] = {
            "id": conversation_id,
            "title": title,
            "user_id": user_id,
            "conversation_type": conversation_type,
            "tags": tags or [],
            "initial_message": initial_message,
            "created_at": datetime.now(timezone.utc),
            "messages": [],
            "updated_at": datetime.now(timezone.utc)
        }
        self.conversations[conversation_id] = conversation
        if user_id not in self.user_conversations:
            self.user_conversations[user_id] = set()
        self.user_conversations[user_id].add(conversation_id)
        
        logger.info(f"Conversation {conversation_id} created for user {user_id}")
        return conversation
    
    async def add_message(self, conversation_id: str, user_id: str,  content: str, role: str = "user") -> Dict[str, Any]:
        """ Добавление сообщения в чат """
        if conversation_id not in self.conversations:
            raise ValueError(f"Conversation {conversation_id} not found")
        message_id = str(uuid4())
        message: Dict[str, Any] = {
            "id": message_id,
            "content": content,
            "role": role,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc),
            "conversation_id": conversation_id
        }
        self.conversations[conversation_id]["messages"].append(message)
        self.conversations[conversation_id]["updated_at"] = datetime.now(timezone.utc)
        self.message_counter += 1
        logger.info(f"Message added to conversation {conversation_id} by user {user_id}")
        return message

    async def send_message(
        self, 
        user_service: UserService, 
        user_id: str, 
        message_request: Any, 
        moderation_result: Dict[str, Any],
        db: Optional[RedisManager]
    ) -> Optional[Dict[str, Any]]:
        """Отправка сообщения в диалог"""
        try:
            redis_db = db if db is not None else redis_client
            
            conversation_id = str(message_request.conversation_id)
            content = message_request.message
            
            user: Optional[User] = await user_service.get_user_by_id(redis_db, user_id)
            
            if not user:
                return None
            
            user_name: str = user.username
            
            if conversation_id not in self.conversations:
                return None
                
            if self.conversations[conversation_id].get("user_id") != user_id:
                return None
                
            message: Dict[str, Any] = {
                "id": str(uuid.uuid4()),
                "content": content,
                "role": "user", 
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": user_id,
                "user_name": user_name,
                "moderation_passed": moderation_result.get("is_approved", True),
                "moderation_notes": ", ".join(moderation_result.get("moderation_notes", []))
            }
            
            if "messages" not in self.conversations[conversation_id]:
                self.conversations[conversation_id]["messages"] = []
                
            self.conversations[conversation_id]["messages"].append(message)
            self.conversations[conversation_id]["updated_at"] = datetime.now(timezone.utc)
            
            conversation_key = f"conversation:{conversation_id}"
            await redis_db.hset(conversation_key, {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "last_message": content[:100],
                "last_message_user": user_name
            })
            
            await user_service.update_user_conversations(
                user_id=user_id, 
                conversation_id=conversation_id,
                db=redis_db
            )
            
            return message
            
        except Exception as e:
            print(f"Error sending message: {e}")
            return None
        
    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Получение чата по ID """
        return self.conversations.get(conversation_id)
    
    async def get_user_conversations(self, user_id: str, skip: int = 0, limit: int = 50, filter_obj: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """Получение чатов пользователя с пагинацией и фильтрацией"""
        if user_id not in self.user_conversations:
            return [], 0
        conversations: List[Dict[str, Any]] = []  
        for conv_id in self.user_conversations[user_id]:
            if conv_id in self.conversations:
                conv_data: Dict[str, Any] = self.conversations[conv_id]
                conversations.append(conv_data)
        if filter_obj:
            filtered_conversations: List[Dict[str, Any]] = []
            for conv in conversations:
                matches = True
                for key, value in filter_obj.items():
                    if key in conv and conv[key] != value:
                        matches = False
                        break
                if matches:
                    filtered_conversations.append(conv)
            conversations = filtered_conversations
        total = len(conversations)
        paginated_conversations = conversations[skip:skip + limit]
        return paginated_conversations, total

    async def get_conversation_with_messages(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Получение диалога с сообщениями по ID"""
        if conversation_id not in self.conversations:
            return None
        conversation = self.conversations[conversation_id]
        return {
            "id": conversation["id"],
            "user_id": conversation["user_id"],
            "title": conversation.get("title"),
            "created_at": conversation["created_at"],
            "updated_at": conversation["updated_at"],
            "messages": conversation.get("messages", [])
        }
    
    def _apply_conversation_filters(self, conversations: List[Dict[str, Any]], filter_obj: Dict[str, Any]) -> List[Dict[str, Any]]:
        """ Применение фильтров к списку чатов """
        filtered = conversations
        if filter_obj.get("conversation_type"):
            filtered = [conv for conv in filtered if conv.get("conversation_type") == filter_obj["conversation_type"]]
        if filter_obj.get("tags"):
            tags_filter = set(filter_obj["tags"])
            filtered = [conv for conv in filtered if tags_filter.issubset(set(conv.get("tags", [])))]
        if filter_obj.get("pinned_only"):
            filtered = [conv for conv in filtered if conv.get("is_pinned", False)]
        if filter_obj.get("archived_only"):
            filtered = [conv for conv in filtered if conv.get("is_archived", False)]
        if filter_obj.get("search_term"):
            search_term = filter_obj["search_term"].lower()
            filtered = [conv for conv in filtered if search_term in conv.get("title", "").lower()]
        return filtered
        
    async def update_conversation(self, conversation_id: str, update_data: Dict[str, Any], user_id: str, db: Optional[RedisManager] = None) -> Optional[Dict[str, Any]]:
        """Обновление диалога"""
        try:
            if db and db.client:
                conversation_key = f"conversation:{conversation_id}"
                conversation_data = await db.hgetall(conversation_key)
                if not conversation_data:
                    return None
                conversation: Dict[str, Any] = {
                    "id": conversation_id,
                    "user_id": user_id
                }
                if conversation.get("user_id") != user_id:
                    return None
                conversation.update(update_data)
                conversation["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.hset(conversation_key, mapping=conversation)
                if conversation_id in self.conversations:
                    self.conversations[conversation_id].update(conversation)
                return conversation
            if conversation_id not in self.conversations:
                return None
            if self.conversations[conversation_id].get("user_id") != user_id:
                return None
            for key, value in update_data.items():
                self.conversations[conversation_id][key] = value
            self.conversations[conversation_id]["updated_at"] = datetime.now(timezone.utc)
            return self.conversations[conversation_id]
        except Exception as e:
            raise e
        
    async def delete_conversation(self, conversation_id: str,user_id: str, db: Optional[RedisManager]) -> bool:
        """Удаление диалога"""
        try:
            if db:
                conversation_key = f"conversation:{conversation_id}"
                conversation_data = await db.hgetall(conversation_key)
                if conversation_data:
                    conversation = {}
                    for key_bytes, value_bytes in conversation_data.items():
                        key = key_bytes.decode('utf-8')
                        value = value_bytes.decode('utf-8')
                        conversation[key] = value
                    conversation: Dict[str, str] = {
                        key_bytes.decode('utf-8'): value_bytes.decode('utf-8')
                        for key_bytes, value_bytes in conversation_data.items()
                    }
                    if conversation.get("user_id") != user_id:
                        return False
                await db.delete(conversation_key)
            if conversation_id in self.conversations:
                if self.conversations[conversation_id].get("user_id") != user_id:
                    return False
                del self.conversations[conversation_id]
            if user_id in self.user_conversations:
                if conversation_id in self.user_conversations[user_id]:
                    self.user_conversations[user_id].remove(conversation_id)
            return True
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False  
        
    async def create_user_message(self, user_service: UserService, db: Optional[RedisManager], user_id: str, message_request: Any, moderation_result: Dict[str, Any]) -> Dict[str, Any]:
        """ Создание сообщения пользователя """
        try:
            message_id = str(uuid4())
            message_data: Dict[str, Any] = {
                "id": message_id,
                "content": message_request.message,
                "role": "user",
                "user_id": user_id,
                "conversation_id": str(message_request.conversation_id) if message_request.conversation_id else None,
                "parent_message_id": str(message_request.parent_message_id) if message_request.parent_message_id else None,
                "timestamp": datetime.now(timezone.utc),
                "moderation_passed": moderation_result.get("is_approved", True),
                "moderation_notes": moderation_result.get("moderation_notes", []),
                "status": "sent"
            }
            if message_request.conversation_id and str(message_request.conversation_id) in self.conversations:
                conv_id = str(message_request.conversation_id)
                if "messages" not in self.conversations[conv_id]:
                    self.conversations[conv_id]["messages"] = []
                self.conversations[conv_id]["messages"].append(message_data)
                self.conversations[conv_id]["updated_at"] = datetime.now(timezone.utc)
            if user_service and db:
                try:
                    await user_service.save_message(
                        db=db,
                        message_data=message_data
                    )
                    logger.info(f"Message {message_id} saved to database via user_service")
                except Exception as e:
                    logger.warning(f"Could not save message to database via user_service: {e}")
            if db and message_request.conversation_id:
                try:
                    conversation_key = f"conversation:{message_request.conversation_id}"
                    await db.hset(conversation_key, {
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "last_message": message_request.message[:100],
                        "last_message_user": user_id
                    })
                except Exception as e:
                    logger.warning(f"Could not update conversation in Redis: {e}")
            logger.info(f"User message created: {message_id} for user {user_id}")
            return message_data
            
        except Exception as e:
            logger.error(f"Error creating user message: {e}")
            raise
    
    async def create_assistant_message(self, user_service: UserService, db: Optional[RedisManager], user_id: str, conversation_id: str, content: str, parent_message_id: str, message_id: str, usage_data: Dict[str, Any]) -> Dict[str, Any]:
        """Создание сообщения ассистента с сохранением в Redis"""
        try:
            message_data: Dict[str, Any] = {
                "id": message_id,
                "content": content,
                "role": "assistant",
                "user_id": user_id,
                "conversation_id": conversation_id,
                "parent_message_id": parent_message_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "usage_data": usage_data or {},
                "status": "sent"
            }
            if conversation_id in self.conversations:
                if "messages" not in self.conversations[conversation_id]:
                    self.conversations[conversation_id]["messages"] = []
                self.conversations[conversation_id]["messages"].append(message_data)
                self.conversations[conversation_id]["updated_at"] = datetime.now(timezone.utc)
            if user_service:
                try:
                    await user_service.update_user_usage(user_id, usage_data, redis_client)
                    logger.info(f"User usage updated for {user_id}")
                except Exception as usage_error:
                    logger.error(f"Error updating user usage: {usage_error}")
            if db:
                try:
                    message_key = f"message:{message_id}"
                    conversation_messages_key = f"conversation:{conversation_id}:messages"
                    await (db
                        .hset_chain(message_key, mapping={
                            "id": message_id,
                            "content": content,
                            "role": "assistant", 
                            "user_id": user_id,
                            "conversation_id": conversation_id,
                            "parent_message_id": parent_message_id,
                            "timestamp": message_data["timestamp"],
                            "usage_data": json.dumps(usage_data) if usage_data else "{}",
                            "status": "sent"
                        })
                        .expire_chain(message_key, 30 * 24 * 60 * 60)
                        .lpush_chain(conversation_messages_key, message_id)
                        .ltrim_chain(conversation_messages_key, 0, 99)
                        .execute())
                    logger.info(f"Assistant message saved to Redis: {message_id}")
                    
                except Exception as redis_error:
                    logger.error(f"Redis error while saving message: {redis_error}")
            logger.info(f"Assistant message created: {message_id} in conversation {conversation_id}")
            return message_data
        except Exception as e:
            logger.error(f"Error creating assistant message: {e}")
            raise
    
    async def get_conversation_history(self, user_service: UserService, db: Optional[RedisManager], conversation_id: str, user_id: str) -> List[Dict[str, Any]]:
        """ Получение истории диалога """
        try:
            if conversation_id in self.conversations:
                conversation = self.conversations[conversation_id]
                if conversation.get("user_id") != user_id:
                    return []
                messages = conversation.get("messages", [])
                sorted_messages = sorted(messages, key=lambda x: x.get("timestamp", datetime.min))
                logger.info(f"Retrieved {len(sorted_messages)} messages from memory for conversation {conversation_id}")
                return sorted_messages
            if db is not None:
                try:
                    user_conversations_list, total_conversations = await self.get_user_conversations(user_id)
                    user_conversation_ids = {conv.get("id") for conv in user_conversations_list}
                    logger.info(f"User {user_id} has {total_conversations} total conversations")
                    if conversation_id not in user_conversation_ids:
                        logger.warning(f"User {user_id} has no access to conversation {conversation_id}")
                        return []
                    await user_service.update_user_activity(user_id)
                    messages_list_key = f"conversation:{conversation_id}:messages"
                    message_ids = await db.lrange(messages_list_key, 0, -1)
                    messages: List[Dict[str, Any]] = []
                    for message_id_bytes in message_ids:
                        message_id = message_id_bytes.decode('utf-8')
                        message_key = f"message:{message_id}"
                        message_data_bytes = await db.hgetall(message_key)
                        if message_data_bytes:
                            message_data: Dict[str, Any] = {}
                            for key_bytes, value_bytes in message_data_bytes.items():
                                key = key_bytes.decode('utf-8')
                                value = value_bytes.decode('utf-8')
                                message_data[key] = value
                            messages.append(message_data)
                    sorted_messages = sorted(messages, key=lambda x: x.get("timestamp", datetime.min))
                    logger.info(f"Retrieved {len(sorted_messages)} messages from Redis for conversation {conversation_id}")
                    return sorted_messages
                except Exception as redis_error:
                    logger.error(f"Redis error while getting conversation history: {redis_error}")
            return []
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
        
    async def search_messages(
        self,
        user_service: UserService,
        db: RedisManager,
        user_id: str,
        query: str,
        conversation_id: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Поиск сообщений по текстовому запросу с аналитикой"""
        
        async def calculate_chat_analytics(user_id: str, days: int) -> Dict[str, Any]:
            """Внутренняя функция для расчета аналитики чата"""
            try:
                conversations  = await self.get_user_conversations(
                    user_id=user_id,
                    skip=0,
                    limit=100,  
                    filter_obj=None
                )
                
                total_messages = 0
                active_conversations = 0
                total_tokens = 0 
                
                for conversation_item in conversations:
                    item: Any = conversation_item
                    conv_id: Optional[str] = None
                    conv_id = getattr(item, 'id', None)
                    if conv_id:
                        history = await self.get_conversation_history(
                            user_service=user_service,
                            db=db,
                            user_id=user_id,
                            conversation_id=str(conv_id)
                        )
                        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
                        recent_messages = [
                            msg for msg in history 
                            if hasattr(msg, 'created_at') and getattr(msg, 'created_at', datetime.min) >= cutoff_date
                        ]
                        
                        if recent_messages:
                            active_conversations += 1
                            total_messages += len(recent_messages)
                            total_tokens += 1 
                            msg_tokens = 0
                            for msg in recent_messages:
                                if hasattr(msg, 'usage_data'):
                                    usage_data = getattr(msg, 'usage_data', None)
                                    if usage_data:
                                        if hasattr(usage_data, 'total_tokens'):
                                            msg_tokens = getattr(usage_data, 'total_tokens', 0)
                                        if isinstance(usage_data, dict):
                                            usage_data = getattr(msg, 'usage_data', None)
                                        else:
                                            msg_tokens = getattr(usage_data, 'total_tokens', 0)
                            total_tokens += msg_tokens
                    
                return {
                    "total_messages": total_messages,
                    "active_conversations": active_conversations,
                    "total_tokens": total_tokens,
                    "period_days": days,
                    "avg_messages_per_day": round(total_messages / days, 2) if days > 0 else 0,
                    "avg_tokens_per_day": round(total_tokens / days, 2) if days > 0 else 0
                }
                
            except Exception as e:
                logger.error(f"Error calculating chat analytics: {e}")
                return {
                    "total_messages": 0,
                    "active_conversations": 0,
                    "total_tokens": 0,
                    "period_days": days,
                    "avg_messages_per_day": 0,
                    "avg_tokens_per_day": 0
                }
        
        try:
            results: List[Dict[str, Any]] = []
            search_history = await self.get_conversation_history(
                user_service=user_service,
                db=db,
                user_id=user_id,
                conversation_id=conversation_id
            ) if conversation_id else []
            query_lower = query.lower()
            for message in search_history:
                if hasattr(message, 'get') and hasattr(message, 'keys'):
                    content = message.get('content', '')
                    if query_lower in content.lower():
                        results.append(message)
                elif hasattr(message, 'content'):
                    content = getattr(message, 'content', '')
                    if query_lower in content.lower():
                        results.append({
                            'id': str(getattr(message, 'id', '')),
                            'content': content,
                            'role': getattr(message, 'role', 'user'),
                            'conversation_id': getattr(message, 'conversation_id', ''),
                            'timestamp': getattr(message, 'created_at', None),
                            'usage_data': getattr(message, 'usage_data', {})
                        })
            results.sort(key=lambda x: x.get('timestamp') or '', reverse=True)
            analytics = await calculate_chat_analytics(user_id, days)
            return {
                "search_results": results,
                "chat_analytics": analytics
            }
            
        except Exception as e:
            logger.error(f"Error in search_messages: {e}")
            return {
                "search_results": [],
                "chat_analytics": await calculate_chat_analytics(user_id, days)
            }

    async def get_chat_analytics(
        self,
        user_service: UserService,
        db: RedisManager,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Получение аналитики чата за указанный период"""
        try:
            # Получаем все диалоги пользователя
            conversations = await self.get_user_conversations(
                user_id=user_id,
                skip=0,
                limit=100,  
                filter_obj=None
            )
            
            total_messages = 0
            active_conversations = 0
            total_tokens = 0
            for conversation in conversations:
                conv_id: Optional[str] = getattr(conversation, 'id', None)
                
                if conv_id:
                    history = await self.get_conversation_history(
                        user_service=user_service,
                        db=db,
                        user_id=user_id,
                        conversation_id=str(conv_id)
                    )
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
                    recent_messages = [
                        msg for msg in history 
                        if hasattr(msg, 'created_at') and getattr(msg, 'created_at', datetime.min) >= cutoff_date
                    ]
                    
                    if recent_messages:
                        active_conversations += 1
                        total_messages += len(recent_messages)
                        for msg in recent_messages:
                            msg_tokens = 0
                            if hasattr(msg, 'usage_data'):
                                usage_data = getattr(msg, 'usage_data', None)
                                if usage_data:
                                    msg_tokens = getattr(usage_data, 'total_tokens', 0)
                            total_tokens += msg_tokens
            
            return {
                "total_messages": total_messages,
                "active_conversations": active_conversations,
                "total_tokens": total_tokens,
                "period_days": days,
                "avg_messages_per_day": round(total_messages / days, 2) if days > 0 else 0,
                "avg_tokens_per_day": round(total_tokens / days, 2) if days > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting chat analytics: {e}")
            return {
                "total_messages": 0,
                "active_conversations": 0,
                "total_tokens": 0,
                "period_days": days,
                "avg_messages_per_day": 0,
                "avg_tokens_per_day": 0
            }        
chat_service = ChatService()

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    CODE = "code"

class MessageStatus(str, Enum):
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ERROR = "error"

class ConversationType(str, Enum):
    DIRECT = "direct"
    GROUP = "group"
    SUPPORT = "support"
    TRAINING = "training"

class StreamEventType(str, Enum):
    CHUNK = "chunk"
    COMPLETE = "complete"
    ERROR = "error"
    USAGE = "usage"

class MessageMetadata(BaseModel):
    sources: Optional[List[Dict[str, Any]]] = None
    processing_time: Optional[float] = None
    filtered_reason: Optional[str] = None
    confidence: Optional[float] = None
    language: Optional[str] = None
    is_inappropriate: bool = False
    tokens: Optional[int] = None
    model: Optional[str] = None

class SourceReference(BaseModel):
    source_type: str = "web"
    confidence: float
    snippet: str
    title: str
    url: str

class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    metadata: Optional[MessageMetadata] = None
    type: MessageType = MessageType.TEXT
    role: MessageRole

class MessageCreate(MessageBase):
    parent_message_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    stream: bool = False

class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    metadata: Optional[MessageMetadata] = None
    status: Optional[MessageStatus] = None

class Message(MessageBase):
    model_config = { "from_attributes": True, "json_encoders": { datetime: lambda v: v.isoformat(), UUID: lambda v: str(v) } }
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: MessageStatus = MessageStatus.SENT
    parent_message_id: Optional[UUID] = None
    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID

class ConversationBase(BaseModel):
    conversation_type: ConversationType = ConversationType.DIRECT
    title: Optional[str] = Field(None, max_length=200)
    tags: List[str] = Field(default_factory=list)
    is_pinned: bool = False

class ConversationCreate(ConversationBase):
    initial_message: Optional[str] = None
    user_id: UUID

class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None

class Conversation(ConversationBase):
    model_config = { "from_attributes": True, "json_encoders": { datetime: lambda v: v.isoformat(), UUID: lambda v: str(v) } }
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_message_at: Optional[datetime] = None
    id: UUID = Field(default_factory=uuid4)
    last_message: Optional[Message] = None
    is_archived: bool = False
    message_count: int = 0
    user_id: UUID

class SearchResults(BaseModel):
    messages: List[Dict[str, Any]]
    title: Optional[str]
    created_at: Any
    updated_at: Any
    total: int = 0
    user_id: str
    query: str
    id: str
    
    def __init__(self, chat_service: Optional[ChatService], **data: Any):
        super().__init__(**data)
        self.chat_service = chat_service or ChatService()
    
    async def perform_search(self, user_id: str) -> "SearchResults":
        """Выполняет поиск используя методы ChatService"""
        conversations_result: Tuple[List[Dict[str, Any]], int] = await self.chat_service.get_user_conversations(user_id)
        all_conversations: List[Dict[str, Any]] = conversations_result[0]
        filtered_conversations: List[Dict[str, Any]] = [] 
        query_lower = self.query.lower()
        for conversation in all_conversations:
            title: str = conversation.get("title", "")
            if query_lower in title.lower():
                filtered_conversations.append(conversation)
                continue
            messages: List[Dict[str, Any]] = conversation.get("messages", [])
                
            for message in messages:
                content: str = message.get("content", "")
                if query_lower in content.lower():
                    filtered_conversations.append(conversation)
                    break
        unique_conversations: List[Dict[str, Any]] = []
        seen_ids: Set[str] = set()
        for conv in filtered_conversations:
            conv_id: Optional[str] = conv.get("id")
            if conv_id and conv_id not in seen_ids:
                seen_ids.add(conv_id)
                unique_conversations.append(conv)
        self.search_conversations = [
            Conversation(
                id=UUID(conv["id"]),
                user_id=UUID(conv["user_id"]),
                title=conv.get("title"),
                created_at=conv["created_at"],
                updated_at=conv["updated_at"],
                message_count=len(conv.get("messages", []))
            ) for conv in unique_conversations
        ]
        self.total = len(self.search_conversations)
        return self

class StreamChunk(BaseModel):
    event_type: StreamEventType = StreamEventType.CHUNK
    full_message: Optional[Dict[str, Any]] = None
    message_id: Optional[UUID] = None
    tokens: Optional[int] = None
    done: bool = False
    chunk: str
    
    @field_validator('chunk')
    @classmethod
    def chunk_not_empty(cls, v: Optional[str]) -> str:
        if v is None:
            return ""
        return v

class StreamResponse(BaseModel):
    conversation_id: Optional[UUID] = None
    event: StreamEventType
    data: StreamChunk

class StreamUsage(BaseModel):
    completion_tokens: int
    prompt_tokens: int
    total_tokens: int
    model: str

class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    max_tokens: Optional[int] = Field(None, ge=1, le=4000)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    parent_message_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    model: str = "gpt-3.5-turbo"
    stream: bool = True
    
    @field_validator('temperature')
    @classmethod
    def validate_temperature(cls, v: float) -> float:
        if v < 0 or v > 2:
            raise ValueError('Temperature must be between 0 and 2')
        return v

class SendMessageResponse(BaseModel):
    usage: Optional[StreamUsage] = None
    stream_complete: bool = True
    processing_time: float
    conversation_id: UUID
    message: Message

class CreateConversationRequest(BaseModel):
    conversation_type: ConversationType = ConversationType.DIRECT
    title: Optional[str] = Field(None, max_length=200)
    tags: List[str] = Field(default_factory=list)
    initial_message: Optional[str] = None

class ConversationListResponse(BaseModel):
    conversations: List[Conversation]
    page_size: int
    has_more: bool
    total: int
    page: int

class ConversationFilter(BaseModel):
    conversation_type: Optional[ConversationType] = None
    date_range: Optional[Dict[str, datetime]] = None
    search_term: Optional[str] = None
    tags: Optional[List[str]] = None
    archived_only: bool = False
    sort_by: str = "updated_at"
    pinned_only: bool = False
    sort_order: str = "desc"
    
    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        allowed_fields = ['created_at', 'updated_at', 'last_message_at', 'title']
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of {allowed_fields}')
        return v
    
    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, v: str) -> str:
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be "asc" or "desc"')
        return v

class ModelConfig(BaseModel):
    supported_features: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    is_available: bool = True
    context_length: int
    max_tokens: int
    provider: str
    id: str

class ChatSettings(BaseModel):
    context_window: int = Field(10, ge=1, le=100)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = None
    show_timestamps: bool = True
    enable_markdown: bool = True
    retain_context: bool = True
    model: str = "gpt-3.5-turbo"
    auto_scroll: bool = True
    safe_mode: bool = False
    stream: bool = True

class UserChatPreferences(BaseModel):
    settings: ChatSettings = Field(default_factory=lambda: ChatSettings(model="gpt-3.5-turbo", temperature=0.7, context_window=10 ))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    recent_models: List[str] = Field(default_factory=list)
    user_id: UUID

class ModerationResult(BaseModel):
    category_scores: Dict[str, float] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)
    flags: List[str] = Field(default_factory=list)
    score: float = Field(0.0, ge=0.0, le=1.0)
    filtered_content: Optional[str] = None
    is_approved: bool

class ContentFilterConfig(BaseModel):
    blocked_patterns: List[str] = Field(default_factory=list)
    allowed_domains: List[str] = Field(default_factory=list)
    strictness: Literal["low", "medium", "high"] = "medium"
    enabled: bool = True

class WebSocketMessage(BaseModel):
    timestamp: float = Field(default_factory=lambda: datetime.now(timezone.utc).timestamp())
    message_id: Optional[UUID] = None
    payload: Dict[str, Any]
    type: str

class ChatMessagePayload(BaseModel):
    message_id: UUID = Field(default_factory=uuid4)
    parent_message_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    stream: bool = True
    content: str

class TypingIndicatorPayload(BaseModel):
    conversation_id: UUID
    is_typing: bool
    user_id: UUID

class ChatAnalytics(BaseModel):
    popular_topics: List[str] = Field(default_factory=list)
    user_satisfaction: Optional[float] = None
    most_active_hours: Optional[str] = None
    average_response_time: float
    total_conversations: int
    period_start: datetime
    period_end: datetime
    total_messages: int

class MessageStats(BaseModel):
    messages_per_hour: Dict[str, int] = Field(default_factory=dict)
    average_message_length: float
    assistant_messages: int
    total_messages: int
    user_messages: int
    busiest_day: str

class ExportData(BaseModel):
    export_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    conversations: Optional[Conversation] = None
    settings: Optional[UserChatPreferences] = None
    user_preferences: Optional[Dict[str, Any]] = None
    version: str = "1.0"

class ImportResult(BaseModel):
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    imported_conversations: int = 0
    imported_messages: int = 0
    success: bool

class APIResponse(BaseModel):
    error_code: Optional[str] = None
    message: Optional[str] = None
    data: Optional[Any] = None
    success: bool

class ErrorResponse(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    details: Optional[Dict[str, Any]] = None
    success: bool = False
    error_code: str
    error: str

class PaginatedResponse(BaseModel):
    data: List[Any]
    page_size: int
    has_more: bool
    total: int
    page: int

class HealthCheck(BaseModel):
    timestamp: float = Field(default_factory=lambda: datetime.now(timezone.utc).timestamp())
    database_status: str
    cache_status: str
    version: str
    status: str
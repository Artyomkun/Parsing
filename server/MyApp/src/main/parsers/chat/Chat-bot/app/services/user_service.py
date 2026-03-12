import secrets
from models.user import User, UserCreate, UserFilters, UserResponse, UserSearchResults
from datetime import datetime, timedelta, timezone
from core.redis import RedisManager, redis_client
from typing import Any, Dict, Optional, List, Set 
from core.security import SecurityService
from pydantic import SecretStr
import logging
import uuid
import json

logger = logging.getLogger(__name__)

async def authenticate_user(username: str, password: str) -> Optional[User]:
    """Функция для аутентификации пользователя"""
    return await user_service.authenticate_user(username, password)


class UserService:
    """Сервис для работы с пользователями через Redis"""
    
    def __init__(self):
        self.security_service = SecurityService()
        self.user_conversations: Dict[str, Set[str]] = {}

    async def get_user_by_id(self, db: RedisManager, user_id: str) -> Optional[User]:
        """Получение пользователя по ID"""
        if db.client:
            user_data = await db.client.get(f"user:{user_id}")
        else:
            user_data = await db.get(f"user:{user_id}")
        
        if user_data:
            if isinstance(user_data, bytes):
                user_data = user_data.decode('utf-8')
            return User(**json.loads(user_data))
        return None

    async def get_user_by_username(self, db: RedisManager, username: str) -> Optional[User]:
        """Получение пользователя по username"""
        if db.client:
            user_id_bytes = await db.client.get(f"user:username:{username}")
        else:
            user_id_bytes = await db.get(f"user:username:{username}")
        
        if user_id_bytes:
            user_id = user_id_bytes.decode('utf-8')
            return await self.get_user_by_id(db, user_id)
        return None

    async def get_user_by_email(self, db: RedisManager, email: str) -> Optional[User]:
        """Получение пользователя по email"""
        if db.client:
            user_id_bytes = await db.client.get(f"user:email:{email}")
        else:
            user_id_bytes = await db.get(f"user:email:{email}")
        
        if user_id_bytes:
            user_id = user_id_bytes.decode('utf-8') if isinstance(user_id_bytes, bytes) else str(user_id_bytes)
            return await self.get_user_by_id(db, user_id)
        return None

    async def create_user(self, db: RedisManager, user_data: UserCreate) -> User:
        """Создание нового пользователя"""

        if await self.get_user_by_email(db, user_data.email):
            raise ValueError("User with this email already exists")
        
        if await self.get_user_by_username(db, user_data.username):
            raise ValueError("User with this username already exists")
        
        hashed_password = self.security_service.get_password_hash(user_data.password)
        user_id = int(uuid.uuid4())
        user = User(
            id=user_id,
            username=user_data.username,
            email=user_data.email,
            hashed_password=SecretStr(hashed_password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=getattr(user_data, 'role', 'user'), 
            is_active=getattr(user_data, 'is_active', True),
            timezone=getattr(user_data, 'timezone', 'UTC'),
            language=getattr(user_data, 'language', 'ru'),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            last_login=getattr(user_data, 'last_login', datetime.now(timezone.utc)),
            last_activity=getattr(user_data, 'last_activity', datetime.now(timezone.utc))
        )
        user_dict = user.model_dump()
        
        await db.set(f"user:{user_id}", json.dumps(user_dict, ensure_ascii=False, default=str))
        await db.set(f"user:username:{user.username}", str(user_id))
        await db.set(f"user:email:{user.email}", str(user_id))
        await db.sadd("users:all", str(user_id))
        
        logger.info(f"User created successfully: {user.username}")
        return user
    
    async def update_last_login(self, db: RedisManager, user_id: str) -> None:
        """Обновление времени последнего входа пользователя"""
        user = await self.get_user_by_id(db, user_id)
        if user:
            user.last_login = datetime.now(timezone.utc)
            # Сохраняем обновленного пользователя
            user_dict = user.model_dump()
            await db.set(
                f"user:{user_id}", 
                json.dumps(user_dict, ensure_ascii=False, default=str)
            )
            logger.info(f"Updated last login for user: {user_id}")

    async def update_user(self, db: RedisManager, user_id: str, update_data: Dict[str, Any]) -> Optional[User]:
        """Обновление пользователя"""
        user = await self.get_user_by_id(db, user_id) 
        if not user:
            return None
        
        # Обновляем поля
        for field, value in update_data.items():
            if field == "password" and value:
                user.hashed_password = SecretStr(self.security_service.get_password_hash(value))
            elif field != "password":
                setattr(user, field, value)
        
        # Обновляем время изменения
        user.updated_at = datetime.now(timezone.utc)
        
        # Сохраняем в Redis
        user_dict = user.model_dump()
        await db.set(
            f"user:{user_id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        # Если изменился username, обновляем индекс
        if "username" in update_data:
            await db.set(f"user:username:{user.username}", str(user_id))
        
        # Если изменился email, обновляем индекс  
        if "email" in update_data:
            await db.set(f"user:email:{user.email}", str(user_id))
        
        logger.info(f"User updated: {user_id}")
        return user

    async def update_user_conversations(
        self,
        user_id: str,
        conversation_id: str,
        db: Optional[RedisManager]
    ) -> bool:
        """Обновление списка диалогов пользователя"""
        try:
            # Обновляем в памяти
            if user_id not in self.user_conversations:
                self.user_conversations[user_id] = set()
            
            self.user_conversations[user_id].add(conversation_id)
            
            # Сохраняем в Redis если передан db
            if db:
                user_key = f"user:{user_id}:conversations"
                await db.sadd(user_key, conversation_id)
            
            return True
            
        except Exception as e:
            print(f"Error updating user conversations: {e}")
            return False
        
    async def delete_user(self, user_id: str) -> bool:
        """Удаление пользователя"""
        user = await self.get_user_by_id(redis_client, user_id)
        if not user:
            return False
        
        await redis_client.delete(f"user:{user_id}")
        await redis_client.delete(f"user:username:{user.username}")
        await redis_client.delete(f"user:email:{user.email}")
        await redis_client.srem(f"users:all", user_id)
        
        return True

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Аутентификация пользователя"""
        user = await self.get_user_by_username(redis_client, username)
        if not user:
            user = await self.get_user_by_email(redis_client, username)

        if not user:
            return None
        
        if not self.security_service.verify_password(password, str(user.hashed_password)):
            return None
        
        if not user.is_active:
            return None
        
        user.last_login = datetime.now(timezone.utc)
        user_dict = user.model_dump()
        await redis_client.set(
            f"user:{user.id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        return user

    async def get_users(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[UserFilters] = None
    ) -> UserSearchResults:
        """Получение списка пользователей с фильтрацией"""
        user_ids_bytes = await redis_client.smembers("users:all")
        user_ids = [user_id.decode('utf-8') for user_id in user_ids_bytes]
        
        users: List[User] = []
        for user_id in user_ids[skip:skip + limit]:
            user = await self.get_user_by_id(redis_client, user_id)
            if user and filters:
                # Применяем фильтры
                if filters.search:
                    search_lower = filters.search.lower()
                    if not (search_lower in user.username.lower() or 
                            search_lower in user.email.lower() or 
                            (user.first_name and search_lower in user.first_name.lower()) or
                            (user.last_name and search_lower in user.last_name.lower())):
                        continue
                
                if filters.role and user.role != filters.role:
                    continue
                
                if filters.is_active is not None and user.is_active != filters.is_active:
                    continue
                
                if filters.created_after and user.created_at < filters.created_after:
                    continue
                    
                if filters.created_before and user.created_at > filters.created_before:
                    continue
            
            if user:
                users.append(user)
        
        total = len(users)
        user_responses = [UserResponse(**user.model_dump()) for user in users]
        return UserSearchResults(
            users=user_responses,
            total=total,
            page_size=limit, 
            page=skip // limit + 1 if limit > 0 else 1,
            has_next=skip + limit < total, 
            has_prev=skip > 0
        )

    async def update_user_activity(self, user_id: str) -> None:
        """Обновление времени последней активности пользователя"""
        user = await self.get_user_by_id(redis_client, user_id)
        if user:
            user.last_activity = datetime.now(timezone.utc)
            user_dict = user.model_dump()
            await redis_client.set(
                f"user:{user_id}", 
                json.dumps(user_dict, ensure_ascii=False, default=str)
            )

    async def change_password(
        self, 
        user_id: str, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """Смена пароля пользователя"""
        user = await self.get_user_by_id(redis_client, user_id)
        if not user:
            return False
        
        if not self.security_service.verify_password(current_password, str(user.hashed_password)):
            return False
        
        user.hashed_password = SecretStr(self.security_service.get_password_hash(new_password))
        user.updated_at = datetime.now(timezone.utc)
        
        user_dict = user.model_dump()
        await redis_client.set(
            f"user:{user_id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        return True

    async def reset_password(self, user_id: str, new_password: str) -> bool:
        """Сброс пароля (для администратора)"""
        user = await self.get_user_by_id(redis_client, user_id)
        if not user:
            return False
        
        user.hashed_password = SecretStr(self.security_service.get_password_hash(new_password))
        user.updated_at = datetime.now(timezone.utc)
        
        user_dict = user.model_dump()
        await redis_client.set(
            f"user:{user_id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        return True

    async def activate_user(self, db: RedisManager, user_id: str) -> bool:
        """Активация пользователя"""
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        user.is_active = True
        user.updated_at = datetime.now(timezone.utc)
        
        user_dict = user.model_dump()
        await db.set(
            f"user:{user_id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        return True

    async def deactivate_user(self, db: RedisManager, user_id: str) -> bool:
        """Деактивация пользователя"""
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.now(timezone.utc)
        
        user_dict = user.model_dump()
        await db.set( 
            f"user:{user_id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        return True

    async def verify_email(self, user_id: str) -> bool:
        """Подтверждение email пользователя"""
        user = await self.get_user_by_id(redis_client, user_id)
        if not user:
            return False
        
        user.email_verified = True
        user.updated_at = datetime.now(timezone.utc)
        
        user_dict = user.model_dump()
        await redis_client.set(
            f"user:{user_id}", 
            json.dumps(user_dict, ensure_ascii=False, default=str)
        )
        
        return True

    async def verify_email_token(self, db: RedisManager, token: str) -> bool:
        """Верификация токена подтверждения email"""
        try:
            # Получаем user_id из Redis по токену
            user_id_bytes = await db.get(f"email_verification:{token}")
            if not user_id_bytes:
                return False
            
            user_id = user_id_bytes.decode('utf-8')
            
            # Находим пользователя
            user = await self.get_user_by_id(db, user_id)
            if not user:
                return False
            
            # Обновляем статус подтверждения email
            user.email_verified = True
            user.email_verification_token = None
            user.updated_at = datetime.now(timezone.utc)
            
            # Сохраняем обновленного пользователя
            user_dict = user.model_dump()
            await db.set(
                f"user:{user_id}", 
                json.dumps(user_dict, ensure_ascii=False, default=str)
            )
            
            # Удаляем использованный токен
            await db.delete(f"email_verification:{token}")
            
            logger.info(f"Email verified for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying email token: {e}")
            return False
    
    async def get_users_by_role(self, role: str) -> List[User]:
        """Получение пользователей по роли"""
        user_ids_bytes = await redis_client.smembers("users:all")
        users: List[User] = []
        for user_id_bytes in user_ids_bytes:
            user_id = user_id_bytes.decode('utf-8')
            user = await self.get_user_by_id(redis_client, user_id)
            if user and user.role == role:
                users.append(user)
        return users

    async def search_users(self, query: str, limit: int = 10) -> List[User]:
        """Поиск пользователей"""
        user_ids_bytes = await redis_client.smembers("users:all")
        users: List[User] = []
        query_lower = query.lower()
        
        for user_id_bytes in user_ids_bytes:
            if len(users) >= limit:
                break
                
            user_id = user_id_bytes.decode('utf-8')
            user = await self.get_user_by_id(redis_client, user_id)
            if user and (query_lower in user.username.lower() or 
                        query_lower in user.email.lower() or 
                        (user.first_name and query_lower in user.first_name.lower()) or
                        (user.last_name and query_lower in user.last_name.lower())):
                users.append(user)
        
        return users

    async def user_exists(self, db: RedisManager, username: str, email: str) -> bool:
        """Проверка существования пользователя"""
        user_by_username = await self.get_user_by_username(db, username)
        user_by_email = await self.get_user_by_email(db, email)
        return user_by_username is not None or user_by_email is not None

    async def get_active_users_count(self) -> int:
        """Получение количества активных пользователей"""
        user_ids_bytes = await redis_client.smembers("users:all")
        count = 0
        for user_id_bytes in user_ids_bytes:
            user_id = user_id_bytes.decode('utf-8')
            user = await self.get_user_by_id(redis_client, user_id)
            if user and user.is_active:
                count += 1
        return count

    async def get_recent_users(self, days: int = 7) -> List[User]:
        """Получение пользователей, зарегистрированных за последние N дней"""
        since_date = datetime.now(timezone.utc) - timedelta(days=days)
        user_ids_bytes = await redis_client.smembers("users:all")
        users: List[User] = []
        for user_id_bytes in user_ids_bytes:
            user_id = user_id_bytes.decode('utf-8')
            user = await self.get_user_by_id(redis_client, user_id)
            if user and user.created_at >= since_date:
                users.append(user)
        return users
    
    async def update_user_usage(self, user_id: str, usage_data: Dict[str, Any], redis_client: RedisManager ) -> None:
        """Обновляет статистику использования токенов пользователя"""
        try:
            if not usage_data:
                return
            
            prompt_tokens = usage_data.get('prompt_tokens', 0)
            completion_tokens = usage_data.get('completion_tokens', 0)
            total_tokens = usage_data.get('total_tokens', 0)
            
            user = await self.get_user_by_id(redis_client, user_id)
            if user:
                today = datetime.now(timezone.utc).date().isoformat()
                await redis_client.hincrby(f"user_stats:{user_id}", "ai_tokens_used", total_tokens)
                await redis_client.hincrby(f"user_stats:{user_id}", "ai_requests_total", 1)
                await redis_client.hincrby(f"user_stats:{user_id}", "prompt_tokens_total", prompt_tokens)
                await redis_client.hincrby(f"user_stats:{user_id}", "completion_tokens_total", completion_tokens)
                await redis_client.hincrby(f"user_stats:{user_id}:{today}", "ai_requests_today", 1)
                await redis_client.hincrby(f"user_stats:{user_id}:{today}", "tokens_today", total_tokens)
                await redis_client.expire(f"user_stats:{user_id}:{today}", 24 * 60 * 60) 
                await redis_client.hset(f"user_stats:{user_id}", mapping={"last_usage_date": today})
                
                logger.info(f"User usage updated - User: {user_id}, "
                        f"Prompt tokens: {prompt_tokens}, "
                        f"Completion tokens: {completion_tokens}, "
                        f"Total tokens: {total_tokens}")
                
            else:
                logger.warning(f"User {user_id} not found for usage update")
                
        except Exception as e:
            logger.error(f"Error updating user usage for {user_id}: {e}")

    async def get_user_usage_stats(self, user_id: str, redis_client: RedisManager ) -> Dict[str, Any]:
        """Получает статистику использования пользователя"""
        try:
            stats = await redis_client.hgetall(f"user_stats:{user_id}")
            
            return {
                "ai_tokens_used": int(stats.get(b'ai_tokens_used', 0)),
                "ai_requests_total": int(stats.get(b'ai_requests_total', 0)),
                "prompt_tokens_total": int(stats.get(b'prompt_tokens_total', 0)),
                "completion_tokens_total": int(stats.get(b'completion_tokens_total', 0)),
                "last_usage_date": stats.get(b'last_usage_date', b'').decode()
            }
        except Exception as e:
            logger.error(f"Error getting user usage stats for {user_id}: {e}")
            return {}        

    async def save_message(self, db: Optional[RedisManager], message_data: Dict[str, Any]) -> bool:
        """Сохранение сообщения в Redis"""
        try:
            if not db:
                logger.warning("Redis client not available for saving message")
                return False
            
            message_id = message_data.get("id")
            conversation_id = message_data.get("conversation_id")
            
            if not message_id or not conversation_id:
                logger.warning("Message ID or Conversation ID missing")
                return False
            
            message_key = f"message:{message_id}"
            conversation_key = f"conversation:{conversation_id}"
            
            await db.hset(message_key, mapping={
                "id": message_id,
                "content": message_data.get("content", ""),
                "role": message_data.get("role", "user"),
                "user_id": message_data.get("user_id", ""),
                "conversation_id": conversation_id,
                "parent_message_id": message_data.get("parent_message_id", ""),
                "timestamp": message_data.get("timestamp", datetime.now(timezone.utc)).isoformat(),
                "status": message_data.get("status", "sent"),
                "moderation_passed": str(message_data.get("moderation_passed", True)),
                "moderation_notes": ",".join(message_data.get("moderation_notes", []))
            })
            
            await db.hset(conversation_key, mapping={
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "last_message": message_data.get("content", "")[:100],
                "last_message_id": message_id,
                "last_message_user": message_data.get("user_id", "")
            })
            
            messages_list_key = f"conversation:{conversation_id}:messages"
            await db.lpush(messages_list_key, message_id)
            await db.expire(message_key, 30 * 24 * 60 * 60)
            logger.info(f"Message {message_id} saved to Redis for conversation {conversation_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving message to Redis: {e}")
            return False
        
    async def create_email_verification_token(self, db: RedisManager, user_id: int, token: str) -> None:
        """Создание токена для подтверждения email"""
        # Сохраняем токен в Redis на 24 часа
        await db.setex(f"email_verification:{token}", 86400, str(user_id))
        
        # Также сохраняем в пользователе информацию о токене
        user = await self.get_user_by_id(db, str(user_id))
        if user:
            user.email_verification_token = token
            user.email_verified = False
            await self.update_user(db, str(user_id), {"email_verification_token": token, "email_verified": False})  
            
    async def create_password_reset_token(self, db: RedisManager, user_id: int, token: str) -> None:
        """Создание токена для сброса пароля"""
        try:
            # Сохраняем токен в Redis на 1 час
            await db.setex(f"password_reset:{token}", 3600, str(user_id))
            
            logger.info(f"Password reset token created for user: {user_id}")
            
        except Exception as e:
            logger.error(f"Error creating password reset token: {e}")
            raise 
        
    async def reset_password_with_token(self, db: RedisManager, token: str, new_password: str) -> bool:
        """Сброс пароля с использованием токена"""
        try:
            # Получаем user_id из Redis по токену
            user_id_bytes = await db.get(f"password_reset:{token}")
            if not user_id_bytes:
                return False
            
            user_id = user_id_bytes.decode('utf-8')
            
            # Находим пользователя
            user = await self.get_user_by_id(db, user_id)
            if not user:
                return False
            
            # Хешируем новый пароль
            hashed_password = self.security_service.get_password_hash(new_password)
            
            # Обновляем пароль
            user.hashed_password = SecretStr(hashed_password)
            user.password_reset_token = None
            user.updated_at = datetime.now(timezone.utc)
            
            # Сохраняем обновленного пользователя
            user_dict = user.model_dump()
            await db.set(
                f"user:{user_id}", 
                json.dumps(user_dict, ensure_ascii=False, default=str)
            )
            
            # Удаляем использованный токен
            await db.delete(f"password_reset:{token}")
            
            logger.info(f"Password reset successfully for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting password with token: {e}")
            return False  
        
    async def update_password(self, db: RedisManager, user_id: str, new_password: str) -> bool:
        """Обновление пароля пользователя"""
        try:
            user = await self.get_user_by_id(db, user_id)
            if not user:
                return False
            
            # Хешируем новый пароль
            hashed_password = self.security_service.get_password_hash(new_password)
            
            # Обновляем пароль
            user.hashed_password = SecretStr(hashed_password)
            user.updated_at = datetime.now(timezone.utc)
            
            # Сохраняем обновленного пользователя
            user_dict = user.model_dump()
            await db.set(
                f"user:{user_id}", 
                json.dumps(user_dict, ensure_ascii=False, default=str)
            )
            
            logger.info(f"Password updated for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating password for user {user_id}: {e}")
            return False  
                
    async def admin_reset_password(self, db: RedisManager, user_id: str) -> str:
        """Сброс пароля пользователя администратором"""
        try:
            new_password: str = secrets.token_urlsafe(12)
            hashed_password: str = self.security_service.get_password_hash(new_password)
            user: Optional[User] = await self.get_user_by_id(db, user_id)
            if not user:
                raise ValueError("Пользователь не найден")
            user.hashed_password = SecretStr(hashed_password)
            user.updated_at = datetime.now(timezone.utc)
            user_dict: Dict[str, Any] = user.model_dump()
            await db.set(
                f"user:{user_id}", 
                json.dumps(user_dict, ensure_ascii=False, default=str)
            )
            logger.info(f"Password reset by admin for user: {user_id}")
            return new_password
        except Exception as e:
            logger.error(f"Error resetting password by admin for user {user_id}: {e}")
            raise
        
    async def get_all_users(
        self, 
        db: RedisManager, 
        skip: int = 0, 
        limit: int = 100,
        active_only: bool = False
    ) -> List[User]:
        """Получение списка всех пользователей"""
        try:
            user_ids_bytes = await db.smembers("users:all")
            user_ids = [user_id.decode('utf-8') for user_id in user_ids_bytes]
            
            users: List[User] = []
            for user_id in user_ids[skip:skip + limit]:
                user = await self.get_user_by_id(db, user_id)
                if user:
                    if active_only and not user.is_active:
                        continue
                    users.append(user)
            
            return users
            
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []

    async def get_users_count(self, db: RedisManager, active_only: bool = False) -> int:
        """Получение общего количества пользователей"""
        try:
            user_ids_bytes = await db.smembers("users:all")
            
            if not active_only:
                return len(user_ids_bytes)
            
            # Если нужны только активные, считаем их
            active_count = 0
            for user_id_bytes in user_ids_bytes:
                user_id = user_id_bytes.decode('utf-8')
                user = await self.get_user_by_id(db, user_id)
                if user and user.is_active:
                    active_count += 1
            
            return active_count
            
        except Exception as e:
            logger.error(f"Error getting users count: {e}")
            return 0    
    
user_service = UserService()
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
from core.redis import RedisManager, redis_client
from api.endpoints.auth import get_redis_client
from services.user_service import UserService
from core.rbac import RBACService, Permission
from passlib.context import CryptContext
from typing import Optional, Any, Dict
from functools import lru_cache
from jose import JWTError, jwt
from models.user import User
import secrets
import logging
import html
import os
import re

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 
REFRESH_TOKEN_EXPIRE_DAYS = 30
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

class SecurityService:
    """ Сервис для управления безопасностью: аутентификация, авторизация, JWT токены """
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """ Проверка пароля """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """ Хеширование пароля """
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(
        data: Dict[str, Any], 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """ Создание JWT access token """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc)+ expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access"
        })
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """ Создание JWT refresh token """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh"
        })
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, is_refresh: bool = False) -> Optional[Dict[str, Any]]:
        """ Верификация JWT токена """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            token_type = payload.get("type")
            expected_type = "refresh" if is_refresh else "access"
            if token_type != expected_type:
                return None
            exp = payload.get("exp")
            if exp is None:
                return None
            if datetime.now(timezone.utc) > datetime.fromtimestamp(exp):
                return None
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def generate_password_reset_token() -> str:
        """ Генерация токена для сброса пароля """
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_email_verification_token() -> str:
        """ Генерация токена для подтверждения email """
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_api_key() -> str:
        """ Генерация API ключа """
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """ Проверка сложности пароля """
        result: Dict[str, Any] = {
            "is_valid": True,
            "errors": [],
            "score": 0
        }
        if len(password) < 8:
            result["is_valid"] = False
            result["errors"].append("Пароль должен содержать минимум 8 символов")
        if not any(char.isdigit() for char in password):
            result["is_valid"] = False
            result["errors"].append("Пароль должен содержать хотя бы одну цифру")
        
        if not any(char.isupper() for char in password):
            result["is_valid"] = False
            result["errors"].append("Пароль должен содержать хотя бы одну заглавную букву")
        
        if not any(char.islower() for char in password):
            result["is_valid"] = False
            result["errors"].append("Пароль должен содержать хотя бы одну строчную букву")
        
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(char in special_chars for char in password):
            result["is_valid"] = False
            result["errors"].append("Пароль должен содержать хотя бы один специальный символ")
        
        score = 0
        score += min(len(password) * 3, 30)
        
        if any(char.isdigit() for char in password):
            score += 10
        if any(char.isupper() for char in password):
            score += 10
        if any(char.islower() for char in password):
            score += 10
        if any(char in special_chars for char in password):
            score += 20
        if any(password[i:i+3].isdigit() for i in range(len(password)-2)):
            score -= 5
        if any(password[i:i+3].isalpha() for i in range(len(password)-2)):
            score -= 5
        
        result["score"] = min(max(score, 0), 100)
        return result
    
    @staticmethod
    def sanitize_input(input_string: str) -> str:
        """ Очистка пользовательского ввода от потенциально опасных символов """
        sanitized = html.escape(input_string)
        dangerous_patterns = [
            "<script", "javascript:", "onload=", "onerror=", 
            "onclick=", "vbscript:", "data:"
        ]
        for pattern in dangerous_patterns:
            sanitized = sanitized.replace(pattern, "")
        return sanitized.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """ Валидация email адреса """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    async def rate_limit_check(user_id: str, action: str, limit: int, window_seconds: int) -> bool:
        """ Проверка rate limit для пользователя """
        key = f"rate_limit:{user_id}:{action}"
        current = await redis_client.get(key)
        if current is None:
            await redis_client.setex(key, window_seconds, "1")
            return True
        current_count = int(current.decode('utf-8'))
        if current_count >= limit:
            return False
        await redis_client.incr(key)
        return True

    @staticmethod
    async def get_rate_limit_info(user_id: str, action: str, limit: int) -> Dict[str, Any]:
        """ Получение информации о rate limit """
        key = f"rate_limit:{user_id}:{action}"
        current = await redis_client.get(key)
        if current is None:
            current_count = 0
        else:
            current_count = int(current.decode('utf-8'))
        return {
            "current_requests": current_count,
            "remaining_requests": max(0, limit - current_count),
            "limit": limit,
            "is_exceeded": current_count >= limit
        }
        
    @staticmethod
    async def reset_rate_limit(user_id: str, action: str) -> bool:
        """ Сброс rate limit для пользователя """
        key = f"rate_limit:{user_id}:{action}"
        deleted = await redis_client.delete(key)
        return deleted > 0

@lru_cache(maxsize=None) 
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: RedisManager = Depends(get_redis_client),
) -> User:
    """Зависимость для получения текущего пользователя из JWT токена"""
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = SecurityService.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str = str(user_id)
    try:
        user_service = UserService()
        
        try:
            user = await user_service.get_user_by_id(db, str(user_id))
        except Exception as redis_error:
            logger.warning(f"Redis error for user {user_id_str}: {redis_error}")
            user = None
        if user is None:
            try:
                db_user = await redis_client.get(f"user:{user_id}")
                if db_user:
                    user = User.model_validate(db_user)
                    try:
                        await redis_client.set(f"user:{user.id}", str(user))
                    except Exception as save_error:
                        logger.error(f"Failed to save user {user_id_str} to Redis: {save_error}")
                else:
                    logger.warning(f"User {user_id_str} not found in database")
            except Exception as db_error:
                logger.error(f"Database error for user {user_id_str}: {db_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error",
                )
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.id or not user.username or not user.email:
            logger.error(f"Invalid user data for {user_id_str}: missing required fields")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid user data",
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user for {user_id_str}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )

async def get_current_active_user(
    users: User = Depends(get_current_user),
) -> User:
    """Зависимость для получения активного пользователя с проверкой"""
    
    if not users.is_active:
        logger.error(f"Database error verifying user activity {users.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return users

def require_permission(permission: Permission):
    """ Декоратор для проверки прав доступа """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not RBACService.has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return current_user
    
    return permission_checker


def require_role(role: str):
    """ Декоратор для проверки роли """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role privileges"
            )
        
        return current_user
    
    return role_checker

security_service = SecurityService()
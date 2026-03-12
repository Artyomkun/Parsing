from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.core.redis import redis_client
from typing import Optional, Dict, Any
from app.core.config import settings
from services import user_service
from app.models.user import User
import logging
import httpx
import json
import re
import os

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

logger = logging.getLogger(__name__)

class AuthService:
    """Сервис для работы с аутентификацией и JWT токенами"""
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 30)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля"""

        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    def get_password_hash(self, password: str) -> str:
        """Хеширование пароля"""

        return pwd_context.hash(password)

    def validate_password_strength(self, password: str) -> Dict[str, Any]:
        """Проверка сложности пароля"""

        if len(password) < 8:
            return {"valid": False, "message": "Пароль должен содержать минимум 8 символов"}
        if not re.search(r"[A-Z]", password):
            return {"valid": False, "message": "Пароль должен содержать хотя бы одну заглавную букву"}
        if not re.search(r"[a-z]", password):
            return {"valid": False, "message": "Пароль должен содержать хотя бы одну строчную букву"}
        if not re.search(r"\d", password):
            return {"valid": False, "message": "Пароль должен содержать хотя бы одну цифру"}
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return {"valid": False, "message": "Пароль должен содержать хотя бы один специальный символ"}
        return {"valid": True, "message": "Пароль соответствует требованиям безопасности"}

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Создание JWT access токена"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.access_token_expire_minutes
            )
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.now(timezone.utc)
        })
        encoded_jwt = jwt.encode(
            to_encode, 
            self.secret_key, 
            algorithm=self.algorithm
        )
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Создание JWT refresh токена"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                days=self.refresh_token_expire_days
            )
        to_encode.update({
            "exp": expire,
            "type": "refresh",
            "iat": datetime.now(timezone.utc)
        })
        encoded_jwt = jwt.encode(
            to_encode, 
            self.secret_key, 
            algorithm=self.algorithm
        )
        return encoded_jwt

    def verify_token(self, token: str, is_refresh: bool = False) -> Dict[str, Any]:
        """Верификация JWT токена"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            
            # Проверяем тип токена
            token_type = payload.get("type")
            if is_refresh and token_type != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
                
            return payload
        except ExpiredSignatureError:
            logger.warning("Token expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError as e:
            logger.warning(f"Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def refresh_access_token(self, refresh_token: str) -> str:
        """Обновление access токена с помощью refresh токена"""
        try:
            payload = self.verify_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            user_data = {
                "sub": payload.get("sub"),
                "username": payload.get("username"),
                "role": payload.get("role")
            }
            return self.create_access_token(user_data)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )

    def create_tokens_pair(self, user_data: Dict[str, Any]) -> Dict[str, str]:
        """Создание пары access и refresh токенов"""
        access_token = self.create_access_token(user_data)
        refresh_token = self.create_refresh_token(user_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """Dependency для получения текущего пользователя из токена"""
        token = credentials.credentials
        payload = self.verify_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        return payload

    def extract_token_data(self, token: str) -> Dict[str, Any]:
        """Извлечение данных из токена без верификации (для отладки)"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                options={"verify_exp": False}
            )
            return payload
        except Exception as e:
            logger.error(f"Token extraction error: {e}")
            return {}

auth_service = AuthService()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return auth_service.verify_password(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return auth_service.get_password_hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    return auth_service.create_access_token(data, expires_delta)

def create_refresh_token(data: Dict[str, Any]) -> str:
    """Создание refresh token"""
    return auth_service.create_refresh_token(data=data)

def verify_token(token: str, is_refresh: bool = False) -> Dict[str, Any]:
    return auth_service.verify_token(token, is_refresh=is_refresh)

async def authenticate_user(username: str, password: str) -> Optional[User]:
    """Аутентификация пользователя по username/email и паролю через Redis"""
    try:
        user_id_by_username = await redis_client.get(f"user:username:{username}")
        user_id_by_email = await redis_client.get(f"user:email:{username}")
        
        user_id_bytes = user_id_by_username or user_id_by_email
        
        if not user_id_bytes:
            logger.warning(f"User not found: {username}")
            return None
        
        # Декодируем user_id из bytes в строку
        user_id = user_id_bytes.decode('utf-8')
        
        user_data = await redis_client.get(f"user:{user_id}") 
        if not user_data:
            logger.warning(f"User data not found for ID: {user_id}")
            return None
        
        # Исправленная проверка isinstance
        user_data = user_data.decode('utf-8')
        
        user_dict = json.loads(user_data)
        user = User(**user_dict)
        
        if not auth_service.verify_password(password, user.hashed_password.get_secret_value()):
            logger.warning(f"Invalid password for user: {username}")
            return None
        
        # Исправленная проверка is_active
        if not user.is_active:
            logger.warning(f"User is inactive: {username}")
            return None
        
        # Обновляем время последнего входа
        user.last_login = datetime.now(timezone.utc)
        
        # Сохраняем обновленного пользователя
        await redis_client.set(  
            f"user:{user.id}", 
            json.dumps(user.model_dump(), ensure_ascii=False, default=str)
        )
        
        logger.info(f"User authenticated successfully: {username}")
        return user
        
    except Exception as e:
        logger.error(f"Authentication error for user {username}: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """ Получение текущего пользователя из JWT токена"""
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = await user_service.get_user_by_id(redis_client, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_current_active_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency для получения текущего активного пользователя из Redis"""
    try:
        token_data = await auth_service.get_current_user(credentials)
        username = token_data.get("sub")
        
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        user_id_by_username = await redis_client.get(f"user:username:{username}")  
        user_id_by_email = await redis_client.get(f"user:email:{username}") 
        
        user_id = user_id_by_username or user_id_by_email
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if redis_client.client:
            user_data = await redis_client.client.get(f"user:{user_id}")
        else:
            user_data = await redis_client.get(f"user:{user_id}")
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User data not found"
            )
        
        user_dict = json.loads(user_data)
        user = User(**user_dict)
        
        if user.is_active is not bool and not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
            
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def validate_password(password: str) -> Dict[str, Any]:
    return auth_service.validate_password_strength(password)

class EmailService:
    """Сервис для отправки email сообщений через API"""
    
    def __init__(self) -> None:
        self.api_key = os.getenv('EMAIL_API_KEY')
        self.api_url = os.getenv('EMAIL_API_URL')
        self.from_email = os.getenv('FROM_EMAIL')
        self.frontend_url = os.getenv('FRONTEND_URL')
    
    async def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Отправка email через API"""
        try:
            if not self.api_url or not self.api_key or not self.from_email:
                print("Отсутствуют необходимые переменные окружения для отправки email")
                return False
            
            api_url = self.api_url
            api_key = self.api_key
            from_email = self.from_email
            
            async with httpx.AsyncClient() as client:
                payload: Dict[str, str] = {
                    "to": to_email,
                    "from": from_email,
                    "subject": subject,
                    "html": html_content,
                    "text": text_content
                }
                
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                
                response = await client.post(
                    api_url,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                return response.status_code == 200
                
        except Exception as e:
            print(f"Ошибка отправки email: {e}")
            return False
    
    async def send_welcome_email(self, to_email: str, username: str) -> bool:
        """Отправка приветственного письма"""
        subject = "Добро пожаловать в ChatBot!"
        
        html_content = f"""
        <html>
            <body>
                <h1>Добро пожаловать, {username}!</h1>
                <p>Спасибо за регистрацию в нашем сервисе ChatBot.</p>
                <p>Теперь вы можете начать общаться с нашим AI-ассистентом.</p>
                <br>
                <p>С уважением,<br>Команда ChatBot</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Добро пожаловать, {username}!
        
        Спасибо за регистрацию в нашем сервисе ChatBot.
        Теперь вы можете начать общаться с нашим AI-ассистентом.
        
        С уважением,
        Команда ChatBot
        """
        
        return await self._send_email(to_email, subject, html_content, text_content)
    
    async def send_password_reset_email(self, to_email: str, username: str, reset_token: str) -> bool:
        """Отправка письма для сброса пароля"""
        subject = "Сброс пароля ChatBot"
        
        reset_url = f"{self.frontend_url}/reset-password?token={reset_token}" if self.frontend_url else f"/reset-password?token={reset_token}"
        
        html_content = f"""
        <html>
            <body>
                <h1>Сброс пароля</h1>
                <p>Здравствуйте, {username}!</p>
                <p>Вы запросили сброс пароля для вашего аккаунта.</p>
                <p>Для установки нового пароля перейдите по ссылке:</p>
                <p><a href="{reset_url}">Сбросить пароль</a></p>
                <p>Ссылка действительна в течение 1 часа.</p>
                <br>
                <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
                <p>С уважением,<br>Команда ChatBot</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Сброс пароля
        
        Здравствуйте, {username}!
        
        Вы запросили сброс пароля для вашего аккаунта.
        Для установки нового пароля перейдите по ссылке:
        {reset_url}
        
        Ссылка действительна в течение 1 часа.
        
        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
        
        С уважением,
        Команда ChatBot
        """
        
        return await self._send_email(to_email, subject, html_content, text_content)
    
    async def send_email_verification(self, to_email: str, verification_token: str) -> bool:
        """Отправка письма для подтверждения email"""
        subject = "Подтверждение email адреса"
        
        verification_url = f"{self.frontend_url}/verify-email?token={verification_token}" if self.frontend_url else f"/verify-email?token={verification_token}"
        
        html_content = f"""
        <html>
            <body>
                <h1>Подтверждение email адреса</h1>
                <p>Пожалуйста, подтвердите ваш email адрес для активации аккаунта.</p>
                <p>Для подтверждения перейдите по ссылке:</p>
                <p><a href="{verification_url}">Подтвердить email</a></p>
                <br>
                <p>С уважением,<br>Команда ChatBot</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Подтверждение email адреса
        
        Пожалуйста, подтвердите ваш email адрес для активации аккаунта.
        Для подтверждения перейдите по ссылке:
        {verification_url}
        
        С уважением,
        Команда ChatBot
        """
        
        return await self._send_email(to_email, subject, html_content, text_content)
    
    async def send_verification_email(self, email: str, username: str, verification_url: str) -> None:
        """Отправка email для подтверждения регистрации"""
        subject = "Подтверждение email адреса"
        
        html_content = f"""
        <html>
            <body>
                <h2>Здравствуйте, {username}!</h2>
                <p>Для завершения регистрации подтвердите ваш email адрес, перейдя по ссылке:</p>
                <p><a href="{verification_url}">Подтвердить email</a></p>
                <p>Ссылка действительна в течение 24 часов.</p>
                <br>
                <p>С уважением,<br>Команда поддержки</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Здравствуйте, {username}!
        
        Для завершения регистрации подтвердите ваш email адрес, перейдя по ссылке:
        {verification_url}
        
        Ссылка действительна в течение 24 часов.
        
        С уважением,
        Команда поддержки
        """
        
        success = await self._send_email(email, subject, html_content, text_content)
        
        if success:
            print(f"Verification email sent to {email}")
        else:
            print(f"Failed to send verification email to {email}")
            
    async def send_new_password_email(self, to_email: str, username: str, new_password: str) -> bool:
        """Отправка нового пароля пользователю"""
        subject = "Новый пароль для ChatBot"
        
        html_content = f"""
        <html>
            <body>
                <h1>Новый пароль</h1>
                <p>Здравствуйте, {username}!</p>
                <p>Администратор сбросил ваш пароль.</p>
                <p>Ваш новый пароль: <strong>{new_password}</strong></p>
                <p>Рекомендуем изменить пароль после входа в систему.</p>
                <br>
                <p>С уважением,<br>Команда ChatBot</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Новый пароль
        
        Здравствуйте, {username}!
        
        Администратор сбросил ваш пароль.
        Ваш новый пароль: {new_password}
        
        Рекомендуем изменить пароль после входа в систему.
        
        С уважением,
        Команда ChatBot
        """
        
        return await self._send_email(to_email, subject, html_content, text_content)        


# Создаем глобальный экземпляр email service
email_service = EmailService()
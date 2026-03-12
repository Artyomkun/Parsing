from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict, model_validator, SecretStr 
from typing import Any, List, Optional, Dict, Self, Set, Union
from datetime import date, datetime, timezone, timedelta
from core.redis import RedisManager
from uuid import UUID, uuid4
from enum import Enum
import bcrypt

RedisDict = Dict[bytes, bytes]
RedisList = List[bytes]
RedisSet = Set[bytes]
RedisString = bytes

class User(BaseModel):
    first_name: Optional[str] = Field(min_length=1, max_length=100)
    language: str = Field(default="en", min_length=2, max_length=5)
    last_name: Optional[str] = Field(min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    status: str = Field(default="active", min_length=1)
    timezone: str = Field(default="UTC", min_length=1)
    role: str = Field(default="user", min_length=1)
    email_verification_token: Optional[str] = None
    password_reset_token: Optional[str] = None
    last_activity: Optional[datetime]
    last_login: Optional[datetime]
    email_verified: bool = False
    hashed_password: SecretStr
    is_active: bool = True
    login_count: int = 0
    created_at: datetime
    updated_at: datetime
    email: EmailStr
    id: int
    
    @field_validator('last_login', 'created_at', 'updated_at')
    @classmethod
    def ensure_timezone(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Обеспечивает наличие часового пояса у времени"""
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v
    
    @model_validator(mode='after')
    def set_timestamps(self) -> Self:
        """Устанавливает временные метки при создании"""
        now = datetime.now(timezone.utc)
        if not hasattr(self, 'created_at') or self.created_at:
            self.created_at = now
        self.updated_at = now
        return self
    
    def record_login(self) -> None:
        """Записывает факт входа пользователя"""
        self.last_login = datetime.now(timezone.utc)
        self.login_count += 1
        self.updated_at = datetime.now(timezone.utc)
    
    def is_recently_active(self, hours: int = 24) -> bool:
        """Проверяет, был ли пользователь активен в последние N часов"""
        if not self.last_login:
            return False
        return (datetime.now(timezone.utc) - self.last_login) <= timedelta(hours=hours)
    
    def days_since_last_login(self) -> Optional[int]:
        """Возвращает количество дней с последнего входа"""
        if not self.last_login:
            return None
        return (datetime.now(timezone.utc) - self.last_login).days
    
    def verify_password(self, password: str) -> bool:
        """Проверяет пароль с использованием bcrypt"""
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'), 
                self.hashed_password.get_secret_value().encode('utf-8')
            )
        except Exception:
            return False
    
    def to_redis_dict(self):  
        """Сериализация для Redis с правильным форматом времени"""
        data = self.model_dump()
        for field in ['last_login', 'created_at', 'updated_at']:
            if data.get(field):
                data[field] = data[field].isoformat()
        if 'hashed_password' in data:
            data['hashed_password'] = self.hashed_password.get_secret_value()
        return data
    
    @classmethod
    def from_redis_dict(cls, redis_data: Dict[str, Any]) -> Self:
        """Десериализация из Redis с явным извлечением полей"""
        user_data = {}
        for field in ['id', 'username', 'email', 'first_name', 'last_name', 
                    'role', 'status', 'is_active', 'login_count']:
            if field in redis_data:
                user_data[field] = redis_data[field]
        for field in ['last_login', 'created_at', 'updated_at']:
            if field in redis_data and redis_data[field]:
                if isinstance(redis_data[field], str):
                    user_data[field] = datetime.fromisoformat(redis_data[field])
                else:
                    user_data[field] = redis_data[field]
        if 'hashed_password' in redis_data:
            user_data['hashed_password'] = SecretStr(redis_data['hashed_password'])
        
        return cls.model_validate(user_data)

    @classmethod
    def create_user(cls, username: str, password: str, email: str, first_name: Optional[str] = None, last_name: Optional[str] = None, role: str = "user", status: str = "active") -> Self:
        """Фабричный метод для создания нового пользователя с хешированием пароля"""
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_id = uuid4()
        return cls(
            hashed_password=SecretStr(hashed_password),
            last_activity=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            last_login=datetime.now(timezone.utc), 
            first_name=first_name,
            last_name=last_name, 
            username=username,
            id=int(user_id),
            status=status,
            email=email,
            role=role
        )
    
    def update_profile(self, email: Optional[str] = None, first_name: Optional[str] = None, last_name: Optional[str] = None, role: Optional[str] = None, status: Optional[str] = None) -> None:
        """Обновляет профиль пользователя"""
        if email is not None:
            self.email = email
        if first_name is not None:
            self.first_name = first_name
        if last_name is not None:
            self.last_name = last_name
        if role is not None:
            self.role = role
        if status is not None:
            self.status = status
        self.updated_at = datetime.now(timezone.utc)
    
    def get_full_name(self) -> str:
        """Возвращает полное имя пользователя"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.username

    def change_password(self, new_password: str) -> None:
        """Изменяет пароль пользователя"""
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.hashed_password = SecretStr(hashed_password)
        self.updated_at = datetime.now(timezone.utc)

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    ALL = "all" 

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class MessageRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    ASSISTANT = "assistant"
    ALL = "all" 

class UserBase(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric')
        return v


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime
    status: UserStatus
    role: UserRole
    id: UUID

class UserUpdate(BaseModel):
    """Модель для обновления данных пользователя"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[UserStatus] = None
    email: Optional[EmailStr] = None

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class UserFilters(BaseModel):
    """Модель для фильтрации пользователей"""
    created_after: Optional[datetime] = Field(description="Дата создания после")
    created_before: Optional[datetime] = Field(description="Дата создания до")
    status: Optional[UserStatus] = Field(description="Статус пользователя")
    is_active: Optional[bool] = Field(description="Статус активности")
    role: Optional[UserRole] = Field(description="Роль пользователя")
    username: Optional[str] = Field(description="Имя пользователя")
    email: Optional[str] = Field(description="Email пользователя")
    search: Optional[str] = Field(description="Поисковый запрос")

class UserSearchResults(BaseModel):
    """Модель для результатов поиска пользователей"""
    users: List[UserResponse]
    page_size: int
    has_next: bool
    has_prev: bool
    total: int
    page: int

class UserStats(BaseModel):
    """Модель для статистики пользователей"""
    last_active: Optional[datetime] = None
    avg_message_length: float = 0.0
    total_conversations: int = 0
    ai_requests_total: int = 0
    ai_requests_today: int = 0
    new_users_this_month: int
    new_users_this_week: int
    total_messages: int = 0
    ai_tokens_used: int = 0
    new_users_today: int
    active_days: int = 0
    inactive_users: int
    regular_users: int
    active_users: int
    total_users: int
    admin_users: int

    def get_user_statistics(self) -> "UserStats":
        """Получение статистики пользователей"""
        users = self.get_all_users()
        
        return UserStats(
            inactive_users=users.total_users - users.active_users,
            regular_users=users.total_users - users.admin_users,
            new_users_this_week=users.new_users_this_week,
            new_users_this_month=users.new_users_this_month,
            new_users_today=users.new_users_today,
            active_users=users.active_users,
            admin_users=users.admin_users,
            total_users=users.total_users,
        )

    def get_all_users(self) -> "UserStats":
        """Получение всех пользователей напрямую из статистики"""
        try:
            return self.model_copy()
        except Exception as e:
            print(f"Error getting users from statistics: {e}")
            return self.model_copy()

class StreamEventType(str, Enum):
    COMPLETE = "complete"
    MESSAGE = "message"
    TOKEN = "token"
    ERROR = "error"

class SendMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    model: Optional[str] = None
    provider: str = "openai"
    message: str

class SendMessageResponse(BaseModel):
    conversation_id: str
    timestamp: datetime
    message_id: str
    content: str

class CreateConversationRequest(BaseModel):
    participants: List[str] = []
    title: Optional[str] = None

class Message(BaseModel):
    conversation_id: str
    timestamp: datetime
    content: str
    role: str
    id: str

class ConversationListResponse(BaseModel):
    conversations: List[Dict[str, Any]]
    page_size: int
    total: int
    page: int

class ConversationFilter(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    participant: Optional[str] = None

class StreamResponse(BaseModel):
    event_type: StreamEventType
    data: Dict[str, Any]

class StreamChunk(BaseModel):
    is_complete: bool = False
    content: str

class APIResponse(BaseModel):
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    success: bool

class ErrorResponse(BaseModel):
    details: Optional[Dict[str, Any]] = None
    error: str
    code: str

class Token(BaseModel):
    user: Optional[UserResponse] = None
    token_type: str = "bearer"
    refresh_token: str
    access_token: str


class ConversationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime
    user_id: UUID
    title: str
    id: UUID

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    conversation_id: UUID
    role: MessageRole

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    conversation_id: UUID
    created_at: datetime
    role: MessageRole
    user_id: UUID
    content: str
    id: UUID

class UserRepository:

    @staticmethod
    async def create_user(user_data: UserCreate, hashed_password: str) -> User:
        user_id = uuid4()
        now = datetime.now(timezone.utc)
        user = User(
            hashed_password=SecretStr(hashed_password),
            status=UserStatus.ACTIVE.value,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            username=user_data.username,
            role=UserRole.USER.value,
            email=user_data.email,
            last_activity=now, 
            id=int(user_id),
            created_at=now,
            updated_at=now,
            last_login=now,  
        )
        return user

class ConversationRepository:

    @staticmethod
    async def create_conversation(user_id: UUID, conversation_data: ConversationCreate) -> ConversationResponse:
        conversation_id = uuid4()
        now = datetime.now(timezone.utc)
        conversation = ConversationResponse(
            title=conversation_data.title,
            id=conversation_id,
            user_id=user_id,
            created_at=now,
            updated_at=now,
        )
        return conversation

    @staticmethod
    async def get_user_conversations() -> List[ConversationResponse]:
        conversations: List[ConversationResponse] = []
        return conversations

class MessageRepository:

    @staticmethod
    async def create_message(user_id: UUID, message_data: MessageCreate) -> MessageResponse:
        message_id = uuid4()
        now = datetime.now(timezone.utc)
        message = MessageResponse(
            conversation_id=message_data.conversation_id,
            content=message_data.content,
            role=message_data.role,
            user_id=user_id,
            created_at=now,
            id=message_id,
        )
        return message

    @staticmethod
    async def get_conversation_messages() -> List[MessageResponse]:
        messages: List[MessageResponse] = []
        return messages


class UserProfileUpdate(BaseModel):
    """Обновление профиля пользователя"""
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    full_name: Optional[str] = None
    location: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None

class TokenPayload(BaseModel):
    """Полезная нагрузка JWT токена"""
    role: UserRole
    exp: datetime
    iat: datetime
    email: str
    sub: str 

class PasswordResetRequest(BaseModel):
    """Запрос на сброс пароля"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Подтверждение сброса пароля"""
    confirm_password: SecretStr = Field(..., min_length=8)
    new_password: SecretStr = Field(..., min_length=8)
    model_config = ConfigDict(from_attributes=True)
    token: str = Field(..., min_length=1)

    @field_validator('confirm_password')
    def check_passwords_match(self) -> 'PasswordResetConfirm':
        if self.new_password != self.confirm_password:
            raise ValueError('passwords do not match')
        return self


class ChangePasswordRequest(BaseModel):
    """Смена пароля (для авторизованных пользователей)"""
    current_password: SecretStr = Field(..., min_length=1)
    confirm_password: SecretStr = Field(..., min_length=8)
    new_password: SecretStr = Field(..., min_length=8)
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def check_passwords_match(self) -> 'ChangePasswordRequest':
        if self.new_password != self.confirm_password:
            raise ValueError('passwords do not match')
        return self

class UserPreferences(BaseModel):
    """Настройки пользователя"""
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    marketing_emails: bool = False
    email_digest: bool = True
    timezone: str = "UTC"
    theme: str = "light"
    language: str = "en"

class BulkUserOperation(BaseModel):
    """Массовая операция с пользователями"""
    user_ids: List[Union[int, UUID, str]]
    data: Optional[Dict[str, Any]] = None
    operation: str 

class AdminUserCreate(UserCreate):
    """Создание пользователя администратором"""
    status: UserStatus = UserStatus.ACTIVE
    send_welcome_email: bool = True
    role: UserRole = UserRole.USER
    email_verified: bool = False

class AdminUserUpdate(BaseModel):
    """Обновление пользователя администратором"""
    email_verified: Optional[bool] = None
    status: Optional[UserStatus] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    username: Optional[str] = None

class ModerationService:
    """ Сервис для модерации контента """
    
    def __init__(self):
        self.banned_words = {"спам", "реклама", "оскорбление", "мат"}
        self.suspicious_patterns = {"http://", "https://", "www."}
        self.user_warnings: Dict[str, int] = {}
    
    async def moderate_text(self, text: str, user_id: str) -> Dict[str, Any]:
        """ Модерация текстового контента """
        result: Dict[str, Any] = {
            "approved": True,
            "reasons": [],
            "warning_level": self.user_warnings.get(user_id, 0)
        }
        for word in self.banned_words:
            if word in text.lower():
                result["approved"] = False
                result["reasons"].append(f"Обнаружено запрещенное слово: {word}")
        for pattern in self.suspicious_patterns:
            if pattern in text.lower():
                result["approved"] = False
                result["reasons"].append("Обнаружена подозрительная ссылка")
        if len(text) > 1000:
            result["approved"] = False
            result["reasons"].append("Сообщение слишком длинное")
        if not result["approved"]:
            self.user_warnings[user_id] = self.user_warnings.get(user_id, 0) + 1
            result["warning_level"] = self.user_warnings[user_id]
        return result
    
    async def moderate_content(
        self,
        content: str,
        user_id: str,
        db: Optional[RedisManager]
    ) -> Dict[str, Any]:
        """Модерация контента"""
        try:
            banned_words: List[str] = ["спам", "оскорбление", "реклама"]
            found_banned_words: List[str] = []
            for word in banned_words:
                if word.lower() in content.lower():
                    found_banned_words.append(word)
            is_too_long = len(content) > 1000
            if db:
                rate_key = f"user_rate:{user_id}"
                current_count = await db.incr(rate_key)
                await db.expire(rate_key, 60)
                
                is_rate_limited = current_count > 10 
            else:
                is_rate_limited = False
            moderation_result: Dict[str, Any] = {
                "is_approved": len(found_banned_words) == 0 and not is_too_long and not is_rate_limited,
                "banned_words_found": found_banned_words,
                "is_too_long": is_too_long,
                "is_rate_limited": is_rate_limited,
                "moderation_notes": []
            }
            if found_banned_words:
                moderation_result["moderation_notes"].append(f"Найдены запрещенные слова: {', '.join(found_banned_words)}")
            if is_too_long:
                moderation_result["moderation_notes"].append("Сообщение слишком длинное")
            
            if is_rate_limited:
                moderation_result["moderation_notes"].append("Превышен лимит сообщений")
            return moderation_result
        except Exception as e:
            return {
                "is_approved": True,
                "banned_words_found": [],
                "is_too_long": False,
                "is_rate_limited": False,
                "moderation_notes": [f"Ошибка модерации: {str(e)}"],
                "error": str(e)
            }
    
    async def check_user_restrictions(self, user_id: str) -> bool:
        """ Проверка ограничений пользователя """
        warnings = self.user_warnings.get(user_id, 0)
        return warnings < 3  
    
    def reset_user_warnings(self, user_id: str) -> None:
        """ Сброс предупреждений пользователя """
        if user_id in self.user_warnings:
            del self.user_warnings[user_id]
    
    def get_moderation_stats(self) -> Dict[str, Any]:
        """ Получение статистики модерации"""
        return {
            "total_banned_words": len(self.banned_words),
            "total_warned_users": len(self.user_warnings),
            "user_warnings": self.user_warnings
        }
    
class UserModel(BaseModel):
    """Модель пользователя для базы данных"""
    model_config = ConfigDict(from_attributes=True)
    last_login: Optional[datetime] = None
    is_verified: bool = False
    is_active: bool = True
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    status: UserStatus
    role: UserRole
    username: str
    email: str
    id: int

class UserAuditLog(BaseModel):
    """Модель для аудита действий пользователя"""
    model_config = ConfigDict(from_attributes=True)
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    resource_type: str
    user_id: UUID
    action: str
    id: UUID

class UserSummary(BaseModel):
    """Сводная информация о пользователе"""
    model_config = ConfigDict(from_attributes=True)
    last_login: Optional[datetime]
    conversation_count: int = 0
    message_count: int = 0
    created_at: datetime
    status: UserStatus
    login_count: int
    is_active: bool
    role: UserRole
    username: str
    email: str
    id: UUID

class OnlineUser(BaseModel):
    """Информация об онлайн пользователе"""
    model_config = ConfigDict(from_attributes=True)
    last_activity: datetime
    is_online: bool = True
    role: UserRole
    user_id: UUID
    username: str
    email: str

def user_model_to_response(user: User) -> UserResponse:
    """Преобразует User в UserResponse"""
    return UserResponse(
        status=UserStatus(user.status),
        first_name=user.first_name,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_name=user.last_name,
        role=UserRole(user.role),
        username=user.username,
        id=UUID(int=user.id),
        email=user.email
    )

def user_model_to_summary(user: User) -> UserSummary:
    """Преобразует User в UserSummary"""
    return UserSummary(
        status=UserStatus(user.status),
        login_count=user.login_count,
        last_login=user.last_login,
        created_at=user.created_at,
        role=UserRole(user.role),
        is_active=user.is_active,
        username=user.username,
        id=UUID(int=user.id),
        email=user.email
    )
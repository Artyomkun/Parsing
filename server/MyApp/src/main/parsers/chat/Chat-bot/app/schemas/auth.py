from pydantic import BaseModel, EmailStr, ConfigDict, Field, model_validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str = ""
    role: str = "user"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str = ""
    last_name: str = ""

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    username: str
    email: str
    first_name: str = ""
    last_name: str = ""
    role: str = "user"
    is_active: bool = True
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    last_login: datetime = datetime.now()
    last_activity: datetime = datetime.now()

class UserProfileUpdate(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: EmailStr
    phone: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = ""
    profile_picture: str = ""
    bio: str = ""
    skills: List[str] = []
    preferences: Dict[str, Any] = {}
    timezone: str = "UTC"
    language: str = "en"

class UserPreferences(BaseModel):
    theme: str = "light"
    language: str = "en"
    notifications: bool = True
    email_notifications: bool = True
    sms_notifications: bool = False
    push_notifications: bool = True
    email_notifications_frequency: str = "instant"
    sms_notifications_frequency: str = "daily"
    push_notifications_frequency: str = "instant"
    email_notifications_channels: List[str] = ["transactional", "marketing"]
    sms_notifications_channels: List[str] = ["alerts"]
    push_notifications_channels: List[str] = ["all"]

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class AdminUserCreate(UserCreate):
    role: str = "user"
    status: str = "active"

class AdminUserUpdate(BaseModel):
    username: str = ""
    email: EmailStr
    password: str = ""
    first_name: str = ""
    last_name: str = ""
    role: str = "user"
    status: str = "active"

class UserFilters(BaseModel):
    id: str = ""
    username: str = ""
    email: str = ""
    first_name: str = ""
    last_name: str = ""
    role: str = ""
    is_active: bool = True
    created_at_start: datetime = datetime.now()
    created_at_end: datetime = datetime.now()

class UserPaginatedResponse(BaseModel):
    users: List[UserResponse] = []
    total: int = 0
    page: int = 1
    size: int = 20

class BulkUserOperation(BaseModel):
    users: List[UserResponse] = []
    operation: str = "create"
    status: str = "pending"
    created_at: datetime = datetime.now()

class UserAuditLog(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    data: Dict[str, Any] = {}
    created_at: datetime = datetime.now()
    user_agent: str = ""
    ip_address: str = ""

class UserStats(BaseModel):
    total_users: int = 0
    active_users: int = 0
    inactive_users: int = 0
    total_messages: int = 0
    total_conversations: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0

class UserSummary(UserResponse):
    total_messages: int = 0
    total_conversations: int = 0
    total_tokens: int = 0

class MessageCreate(BaseModel):
    content: str
    role: str = "user"
    message_type: str = "text"
    tokens_used: int = 0
    ai_model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    conversation_id: str = ""

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    conversation_id: UUID
    user_id: UUID
    content: str
    role: str = "user"
    message_type: str = "text"
    tokens_used: int = 0
    ai_model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class MessageUpdate(BaseModel):
    content: str = ""
    role: str = "user"
    message_type: str = "text"
    tokens_used: int = 0
    ai_model: str = "gpt-3.5-turbo"
    temperature: float = 0.7

class ConversationBase(BaseModel):
    name: str = "New Conversation"
    description: str = ""

class ConversationCreate(ConversationBase):
    """Модель для создания диалога"""
    title: str = Field(..., min_length=1, max_length=255, description="Название диалога")
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Мой первый диалог",
                "description": "Обсуждение важных вопросов"
            }
        }
    )

class ConversationResponse(ConversationBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class ConversationUpdate(BaseModel):
    """Модель для обновления диалога - все поля опциональны"""
    name: Optional[str] = Field(None, description="Название диалога")
    description: Optional[str] = Field(None, description="Описание диалога")
    
    @model_validator(mode='before')
    @classmethod
    def check_at_least_one_field(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Проверяет что передан хотя бы один field для обновления"""
        if not any(values.get(field) is not None for field in ['name', 'description']):
            raise ValueError('Должно быть указано хотя бы одно поле для обновления')
        return values
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Обновленное название",
                "description": "Новое описание диалога"
            }
        }
    )

class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse] = []
    total: int = 0

class SendMessageRequest(BaseModel):
    message: str
    conversation_id: str = ""
    ai_model: str = "gpt-3.5-turbo"
    temperature: float = 0.7

class SendMessageResponse(BaseModel):
    message: MessageResponse
    conversation: ConversationResponse

class StreamChunk(BaseModel):
    chunk: str
    is_final: bool = False

class StreamUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class StreamResponse(BaseModel):
    content: str
    usage: StreamUsage = StreamUsage()
    is_complete: bool = False

class APIResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Dict[str, Any] = {}

class ErrorResponse(BaseModel):
    error: str = "An error occurred"
    message: str = "Please try again later"
    code: int = 500
    details: Dict[str, Any] = {}

class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]] = []
    total: int = 0
    page: int = 1
    size: int = 20

class HealthCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = datetime.now()
    version: str = "1.0.0"
    uptime: float = 0.0

class UserRoleLabels(BaseModel):
    USER: str = "user"
    ADMIN: str = "admin"
    SUPER_ADMIN: str = "super_admin"
    MODERATOR: str = "moderator"
    SUPPORT: str = "support"

class UserStatusLabels(BaseModel):
    ACTIVE: str = "active"
    INACTIVE: str = "inactive"
    PENDING: str = "pending"
    SUSPENDED: str = "suspended"
    BLOCKED: str = "blocked"

class ValidationResult(BaseModel):
    is_valid: bool = False
    message: str = ""
    error: str = ""

class UserValidation(ValidationResult):
    user: UserResponse

class UsersValidation(ValidationResult):
    users: List[UserResponse] = []

class PermissionCheck(ValidationResult):
    can_manage: bool = False
    can_delete: bool = False
    can_reset: bool = False

class UserInfo(BaseModel):
    full_name: str = ""
    initials: str = ""
    email: EmailStr
    avatar_url: str = ""

class SearchResults(BaseModel):
    results: List[Dict[str, Any]] = []
    total: int = 0
    page: int = 1
    size: int = 20
    query: str = ""

class ExportData(BaseModel):
    data: Dict[str, Any] = {}
    format: str = "json"
    filename: str = "export"

class ImportResult(BaseModel):
    imported: int = 0
    failed: int = 0
    errors: List[str] = []
    total: int = 0

class ChatSettings(BaseModel):
    max_tokens: int = 1000
    temperature: float = 0.7
    model: str = "gpt-3.5-turbo"
    stream: bool = True
    system_prompt: str = "You are a helpful assistant."

class ModerationResult(BaseModel):
    is_approved: bool = True
    score: float = 0.0
    flags: List[str] = []
    reasons: List[str] = []

class OnlineUser(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    first_name: str = ""
    last_name: str = ""
    role: str = "user"
    is_active: bool = True
    last_activity: datetime = datetime.now()
    status: str = "online"
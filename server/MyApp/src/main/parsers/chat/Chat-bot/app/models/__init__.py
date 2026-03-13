"""
Модели данных для Chat Bot приложения

Этот модуль предоставляет все Pydantic и SQLAlchemy модели
для работы с пользователями, чатами и системными сущностями.
"""

# Реэкспорт всех моделей из chat.py
from typing import Any, Dict, Type, TypeVar

from pydantic import BaseModel
from .chat import (
    MessageRole, MessageType, MessageStatus, ConversationType, StreamEventType,
    MessageMetadata, SourceReference, MessageBase, MessageCreate, MessageUpdate, Message,
    ConversationBase, ConversationCreate, ConversationUpdate, Conversation,
    StreamChunk, StreamResponse, StreamUsage,
    SendMessageRequest, SendMessageResponse, CreateConversationRequest,
    ConversationListResponse, ConversationFilter, SearchResults,
    ModelConfig, ChatSettings, UserChatPreferences,
    ModerationResult, ContentFilterConfig,
    WebSocketMessage, ChatMessagePayload, TypingIndicatorPayload,
    ChatAnalytics, MessageStats,
    ExportData, ImportResult,
    APIResponse, ErrorResponse, PaginatedResponse,
    HealthCheck, chat_service
)

# Реэкспорт всех моделей из user.py
from .user import (
    UserRole, UserStatus,
    UserModel,
    UserBase, UserCreate, UserUpdate, UserProfileUpdate, UserResponse,
    UserLogin, Token, TokenPayload,
    PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest,
    UserPreferences, UserStats, UserSearchResults, BulkUserOperation,
    AdminUserCreate, AdminUserUpdate, UserAuditLog, UserSummary, OnlineUser,
    ModerationService, user_model_to_response, user_model_to_summary
)

# Версия моделей
MODELS_VERSION = "1.0.0"

__all__ = [
    # Enums
    "MessageRole", "MessageType", "MessageStatus", "ConversationType", "StreamEventType",
    "UserRole", "UserStatus",
    
    # SQLAlchemy Models
    "UserModel",
    
    # Chat Models
    "MessageMetadata", "SourceReference", "MessageBase", "MessageCreate", "MessageUpdate", "Message",
    "ConversationBase", "ConversationCreate", "ConversationUpdate", "Conversation",
    "StreamChunk", "StreamResponse", "StreamUsage",
    "SendMessageRequest", "SendMessageResponse", "CreateConversationRequest",
    "ConversationListResponse", "ConversationFilter", "SearchResults",
    "ModelConfig", "ChatSettings", "UserChatPreferences",
    "ModerationResult", "ContentFilterConfig",
    "WebSocketMessage", "ChatMessagePayload", "TypingIndicatorPayload",
    "ChatAnalytics", "MessageStats",
    "ExportData", "ImportResult",
    
    # User Models
    "UserBase", "UserCreate", "UserUpdate", "UserProfileUpdate", "UserResponse",
    "UserLogin", "Token", "TokenPayload",
    "PasswordResetRequest", "PasswordResetConfirm", "ChangePasswordRequest",
    "UserPreferences", "UserStats", "UserSearchResults", "BulkUserOperation",
    "AdminUserCreate", "AdminUserUpdate", "UserAuditLog", "UserSummary", "OnlineUser",
    "ModerationService",
    
    # Response Models
    "APIResponse", "ErrorResponse", "PaginatedResponse",
    
    # Utility Models
    "HealthCheck",
    
    # Utility Functions
    "user_model_to_response", "user_model_to_summary",
    
    # Version
    "MODELS_VERSION", "chat_service",
]

# Дополнительные группировки для удобного импорта
class Models:
    """Группировка моделей для удобного импорта"""
    
    # Chat models
    Chat = type('ChatModels', (), {
        'MessageRole': MessageRole,
        'MessageType': MessageType, 
        'MessageStatus': MessageStatus,
        'ConversationType': ConversationType,
        'StreamEventType': StreamEventType,
        'MessageMetadata': MessageMetadata,
        'SourceReference': SourceReference,
        'MessageBase': MessageBase,
        'MessageCreate': MessageCreate,
        'MessageUpdate': MessageUpdate,
        'Message': Message,
        'ConversationBase': ConversationBase,
        'ConversationCreate': ConversationCreate,
        'ConversationUpdate': ConversationUpdate,
        'Conversation': Conversation,
        'StreamChunk': StreamChunk,
        'StreamResponse': StreamResponse,
        'StreamUsage': StreamUsage,
        'SendMessageRequest': SendMessageRequest,
        'SendMessageResponse': SendMessageResponse,
        'CreateConversationRequest': CreateConversationRequest,
        'ConversationListResponse': ConversationListResponse,
        'ConversationFilter': ConversationFilter,
        'SearchResults': SearchResults,
        'ModelConfig': ModelConfig,
        'ChatSettings': ChatSettings,
        'UserChatPreferences': UserChatPreferences,
        'ModerationResult': ModerationResult,
        'ContentFilterConfig': ContentFilterConfig,
        'WebSocketMessage': WebSocketMessage,
        'ChatMessagePayload': ChatMessagePayload,
        'TypingIndicatorPayload': TypingIndicatorPayload,
        'ChatAnalytics': ChatAnalytics,
        'MessageStats': MessageStats,
        'ExportData': ExportData,
        'ImportResult': ImportResult,
    })
    
    # User models
    User = type('UserModels', (), {
        'UserRole': UserRole,
        'UserStatus': UserStatus,
        'UserModel': UserModel,
        'UserBase': UserBase,
        'UserCreate': UserCreate,
        'UserUpdate': UserUpdate,
        'UserProfileUpdate': UserProfileUpdate,
        'UserResponse': UserResponse,
        'UserLogin': UserLogin,
        'Token': Token,
        'TokenPayload': TokenPayload,
        'PasswordResetRequest': PasswordResetRequest,
        'PasswordResetConfirm': PasswordResetConfirm,
        'ChangePasswordRequest': ChangePasswordRequest,
        'UserPreferences': UserPreferences,
        'UserStats': UserStats,
        'UserSearchResults': UserSearchResults,
        'BulkUserOperation': BulkUserOperation,
        'AdminUserCreate': AdminUserCreate,
        'AdminUserUpdate': AdminUserUpdate,
        'UserAuditLog': UserAuditLog,
        'UserSummary': UserSummary,
        'OnlineUser': OnlineUser,
        'user_model_to_response': user_model_to_response,
        'user_model_to_summary': user_model_to_summary,
    })
    
    # Response models
    Response = type('ResponseModels', (), {
        'APIResponse': APIResponse,
        'ErrorResponse': ErrorResponse,
        'PaginatedResponse': PaginatedResponse,
        'HealthCheck': HealthCheck,
    })

# Создаем экземпляры групп
ChatModels = Models.Chat
UserModels = Models.User
ResponseModels = Models.Response

# Утилитарные функции для работы с моделями
def get_model_version() -> str:
    """Получить версию моделей"""
    return MODELS_VERSION

def list_all_models():
    """Получить список всех доступных моделей"""
    return {
        'chat_models': [model for model in __all__ if any([
            model.startswith('Message'),
            model.startswith('Conversation'), 
            model.startswith('Stream'),
            model.startswith('Chat'),
            model in ['SendMessageRequest', 'SendMessageResponse', 'CreateConversationRequest']
        ])],
        'user_models': [model for model in __all__ if model.startswith('User') or model in [
            'Token', 'TokenPayload', 'PasswordResetRequest', 'PasswordResetConfirm'
        ]],
        'response_models': [model for model in __all__ if model.endswith('Response')],
        'utility_models': [model for model in __all__ if model not in [
            'MODELS_VERSION', 'user_model_to_response', 'user_model_to_summary'
        ] and not any([
            model.startswith('Message'),
            model.startswith('Conversation'),
            model.startswith('User'),
            model.startswith('Token'),
            model.endswith('Response')
        ])]
    }

T = TypeVar('T', bound=BaseModel)

def validate_model_data(
    model_class: Type[T], 
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Валидация данных для модели Pydantic
    """
    try:
        instance = model_class(**data)
        return instance.model_dump()
    except Exception as e:
        raise ValueError(f"Validation error for {model_class.__name__}: {e}")

MODULE_INFO: Dict[str, Any] = {
    'name': 'app.models',
    'version': MODELS_VERSION,
    'description': 'Data models for Chat Bot application',
    'models_count': len(__all__) - 2,  # Exclude version and utility functions
    'categories': {
        'chat': 25,  # Количество chat моделей
        'user': 20,  # Количество user моделей
        'response': 4,  # Количество response моделей
        'utility': 2   # Количество utility функций
    }
}

print(f"Models module v{MODELS_VERSION} loaded successfully!")
print(f"Available models: {MODULE_INFO['models_count']}")
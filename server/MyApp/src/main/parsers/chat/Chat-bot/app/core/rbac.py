from typing import Coroutine, Optional, Set, List, Any, Callable, TypeVar, cast
from fastapi import HTTPException, status
from models.user import User
from functools import wraps
from enum import Enum

# Определяем типы для лучшей типиз
T = TypeVar('T')
F = TypeVar('F', bound=Callable[..., Any])
P = TypeVar('P', bound=Callable[..., Coroutine[Any, Any, Any]])

class Permission(str, Enum):
    """Перечень доступных прав"""
    CHAT_READ = "chat:read"
    CHAT_WRITE = "chat:write"
    CHAT_DELETE = "chat:delete"
    USER_READ = "user:read"
    USER_MANAGE = "user:manage"
    USER_DELETE = "user:delete"
    USER_RESET_PASSWORD = "user:reset_password"
    SYSTEM_CONFIG = "system:config"
    SYSTEM_MONITOR = "system:monitor"
    SYSTEM_BACKUP = "system:backup"
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"
    MODERATE = "moderate"

class Role(str, Enum):
    """Роли пользователей"""
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    GUEST = "guest"

ROLE_PERMISSIONS = {
    Role.ADMIN: {
        Permission.CHAT_READ,
        Permission.CHAT_WRITE,
        Permission.CHAT_DELETE,
        Permission.USER_READ,
        Permission.USER_MANAGE,
        Permission.USER_DELETE,
        Permission.USER_RESET_PASSWORD,
        Permission.SYSTEM_CONFIG,
        Permission.SYSTEM_MONITOR,
        Permission.SYSTEM_BACKUP,
    },
    Role.MANAGER: {
        Permission.CHAT_READ,
        Permission.CHAT_WRITE,
        Permission.CHAT_DELETE,
        Permission.USER_READ,
        Permission.USER_MANAGE,
    },
    Role.USER: {
        Permission.CHAT_READ,
        Permission.CHAT_WRITE,
    },
    Role.GUEST: {
        Permission.CHAT_READ,
    },
}

def get_user_permissions(user: Any) -> Set[Permission]:
    """Получение прав пользователя на основе его роли"""
    if not user or not hasattr(user, 'role'):
        return set()
    
    try:
        user_role = Role(user.role)
        return ROLE_PERMISSIONS.get(user_role, set())
    except ValueError:
        return set()

def require_permission(permissions: List[Permission]):
    """Декоратор для проверки прав доступа"""
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_permissions = get_user_permissions(current_user)
            
            # Проверяем все требуемые права
            for perm in permissions:
                if perm not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Insufficient permissions. Required: {perm}"
                    )
            
            return await func(*args, **kwargs)
        return cast(F, wrapper)
    return decorator


class RBACService:
    """Сервис для управления доступом на основе ролей"""
    
    @staticmethod
    def has_permission(role: str, permission: Permission) -> bool:
        """Проверка наличия права у роли"""
        try:
            role_enum = Role(role)
            return permission in ROLE_PERMISSIONS.get(role_enum, set())
        except ValueError:
            return False
    
    @staticmethod
    def get_role_permissions(role: str) -> Set[Permission]:
        """Получение всех прав для роли"""
        try:
            role_enum = Role(role)
            return ROLE_PERMISSIONS.get(role_enum, set())
        except ValueError:
            return set()
    
    @staticmethod
    def can_escalate_privileges(current_role: str, target_role: str) -> bool:
        """Проверка возможности повышения привилегий"""
        role_hierarchy = {
            Role.ADMIN: 4,
            Role.MANAGER: 3,
            Role.USER: 2,
            Role.GUEST: 1,
        }
        
        try:
            current_level = role_hierarchy.get(Role(current_role), 0)
            target_level = role_hierarchy.get(Role(target_role), 0)
            return current_level >= target_level
        except ValueError:
            return False

    @staticmethod
    def permission(permission_name: Permission) -> Callable[[P], P]:
        """Декоратор для проверки прав доступа"""
        def decorator(func: P) -> P:
            @wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                current_user: Optional[User] = kwargs.get('current_user')
                if not current_user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication required"
                    )
                
                if not RBACService.has_permission(current_user.role, permission_name):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Insufficient permissions: {permission_name}"
                    )
                
                return await func(*args, **kwargs)
            return cast(P, wrapper)
        return decorator
from models.user import (
    User, UserCreate, UserResponse, Token, PasswordResetRequest, PasswordResetConfirm,
    ChangePasswordRequest, UserProfileUpdate
)
from services.auth import EmailService, create_access_token, create_refresh_token, verify_token, verify_password
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from services.user_service import UserService, user_service
from core import require_permission, Permission
from models import APIResponse, ErrorResponse
from fastapi.responses import JSONResponse 
from core.security import get_current_user
from datetime import datetime, timezone
from core.redis import RedisManager
from services import redis_client
from typing import Dict, Any
import logging
import secrets
import time

user_service = UserService()
email_service = EmailService()
router = APIRouter(prefix="/api/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
app = FastAPI()

logger = logging.getLogger(__name__)

async def get_redis_client() -> RedisManager:
    """Dependency для получения Redis клиента"""
    return redis_client

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> User:
    """
    Зависимость для получения активного пользователя
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Аккаунт деактивирован"
        )
    return current_user

@router.post("/register", response_model=APIResponse)
async def register(
    user_data: UserCreate,
    request: Request,
    db: RedisManager = Depends(get_redis_client),
) -> APIResponse:
    """
    Регистрация нового пользователя
    """
    try:
        existing_user = await user_service.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )

        existing_user = await user_service.get_user_by_username(db, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким username уже существует"
            )
        user = await user_service.create_user(db, user_data)
        verification_token = secrets.token_urlsafe(32)
        user_id = getattr(user, 'id', None)
        if user_id is not None:
            await user_service.create_email_verification_token(db, user_id, verification_token)
        verification_url = f"{request.base_url}api/auth/verify-email?token={verification_token}"
        await email_service.send_verification_email(user.email, user.username, verification_url)
        
        return APIResponse(
            success=True,
            data=UserResponse.model_validate(user),
            message="Пользователь успешно зарегистрирован. Проверьте email для подтверждения."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при регистрации: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: RedisManager = Depends(get_redis_client)
) -> Token:
    """
    Аутентификация пользователя и получение токенов
    """
    try:
        user = await user_service.get_user_by_username(db, form_data.username)
        if not user:
            user = await user_service.get_user_by_email(db, form_data.username)
        
        if not user or not verify_password(form_data.password, user.hashed_password.get_secret_value()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверные учетные данные",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Аккаунт деактивирован"
            )
        
        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email не подтвержден. Проверьте вашу почту."
            )
        
        await user_service.update_last_login(db, str(user.id))
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role}) 
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при входе: {str(e)}"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: RedisManager
) -> Token:
    """
    Обновление access token с помощью refresh token
    """
    try:
        payload = verify_token(refresh_token, is_refresh=True)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный refresh token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный токен"
            )
        
        user = await user_service.get_user_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Пользователь не найден или неактивен"
            )
        
        access_token = create_access_token(data={"sub": user.id, "role": user.role})
        new_refresh_token = create_refresh_token(data={"sub": user.id})
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении токена: {str(e)}"
        )

@router.post("/logout", response_model=APIResponse)
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Выход пользователя с инвалидацией токенов на сервере
    """
    try:
        logout_time = int(time.time())
        await db.setex(
            f"user:{current_user.id}:logout_time", 
            3600,
            str(logout_time)
        )
        
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        logger.info(f"User logged out: {current_user.username} (ID: {current_user.id})")
        
        return APIResponse(
            success=True,
            data={"user_id": str(current_user.id), "logout_time": logout_time},
            message="Успешный выход из системы"
        )
        
    except Exception as e:
        logger.error(f"Logout error for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при выходе: {str(e)}"
        )

@router.get("/verify-email", response_model=APIResponse)
async def verify_email(
    token: str,
    db: RedisManager
) -> APIResponse:
    """
    Подтверждение email адреса
    """
    try:
        success = await user_service.verify_email_token(db, token)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный или просроченный токен подтверждения"
            )
        
        return APIResponse(
            success=True,
            message="Email успешно подтвержден"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при подтверждении email: {str(e)}"
        )

@router.post("/resend-verification", response_model=APIResponse)
async def resend_verification(
    email: str,
    request: Request,
    db: RedisManager
) -> APIResponse:
    """
    Повторная отправка email для подтверждения
    """
    try:
        user = await user_service.get_user_by_email(db, email)
        if not user:
            return APIResponse(
                success=True,
                message="Если email зарегистрирован, письмо для подтверждения отправлено"
            )
        
        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email уже подтвержден"
            )
        
        verification_token = secrets.token_urlsafe(32)
        await user_service.create_email_verification_token(db, user.id, verification_token)
        verification_url = f"{request.base_url}api/auth/verify-email?token={verification_token}"
        await email_service.send_verification_email(user.email, user.username, verification_url)
        
        return APIResponse(
            success=True,
            message="Письмо для подтверждения отправлено"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при отправке письма: {str(e)}"
        )

@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(
    reset_data: PasswordResetRequest,
    request: Request,
    db: RedisManager
) -> APIResponse:
    """
    Запрос на сброс пароля
    """
    try:
        user = await user_service.get_user_by_email(db, reset_data.email)
        if not user:
            return APIResponse(
                success=True,
                message="Если email зарегистрирован, инструкции по сбросу пароля отправлены"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Аккаунт деактивирован"
            )
        reset_token = secrets.token_urlsafe(32)
        await user_service.create_password_reset_token(db, user.id, reset_token)
        reset_url = f"{request.base_url}reset-password?token={reset_token}"
        await email_service.send_password_reset_email(user.email, user.username, reset_url)
        
        return APIResponse(
            success=True,
            message="Инструкции по сбросу пароля отправлены на email"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при запросе сброса пароля: {str(e)}"
        )

@router.post("/reset-password", response_model=APIResponse)
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: RedisManager
) -> APIResponse:
    """
    Сброс пароля с использованием токена
    """
    try:
        success = await user_service.reset_password_with_token(
            db, reset_data.token, reset_data.new_password.get_secret_value()
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный или просроченный токен сброса пароля"
            )
        
        return APIResponse(
            success=True,
            message="Пароль успешно изменен"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сбросе пароля: {str(e)}"
        )

@router.post("/change-password", response_model=APIResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Изменение пароля текущим пользователем
    """
    try:
        if not verify_password(password_data.current_password.get_secret_value(), current_user.hashed_password.get_secret_value()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный текущий пароль"
            )
        
        await user_service.update_password(db, str(current_user.id), password_data.new_password.get_secret_value())
        
        return APIResponse(
            success=True,
            message="Пароль успешно изменен"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при изменении пароля: {str(e)}"
        )

@router.get("/me", response_model=APIResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Получение информации о текущем пользователе
    """
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Данные пользователя получены"
    )

@router.put("/me", response_model=APIResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Обновление профиля текущего пользователя
    """
    try:
        if profile_data.email and profile_data.email != current_user.email:
            email_str: str = str(profile_data.email)
            existing_user = await user_service.get_user_by_email(db, email_str)
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким email уже существует"
                )
        
        if profile_data.username and profile_data.username != current_user.username:
            existing_user = await user_service.get_user_by_username(db, profile_data.username)
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким username уже существует"
                )
        
        updated_user = await user_service.update_user(
            db, str(current_user.id), profile_data.model_dump(exclude_unset=True)
        )
        
        return APIResponse(
            success=True,
            data=UserResponse.model_validate(updated_user),
            message="Профиль успешно обновлен"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении профиля: {str(e)}"
        )

@router.post("/me/deactivate", response_model=APIResponse)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Деактивация аккаунта текущего пользователя
    """
    try:
        await user_service.deactivate_user(db, str(current_user.id))
        
        return APIResponse(
            success=True,
            message="Аккаунт успешно деактивирован"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при деактивации аккаунта: {str(e)}"
        )
    
@router.post("/admin/users/{user_id}/activate", response_model=APIResponse)
@require_permission([Permission.ADMIN])
async def activate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Активация пользователя администратором
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения операции"
            )
        
        success = await user_service.activate_user(db, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        activated_user = await user_service.get_user_by_id(db, user_id)
        
        return APIResponse(
            success=True,
            data=UserResponse.model_validate(activated_user) if activated_user else None,
            message="Пользователь успешно активирован"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при активации пользователя: {str(e)}"
        )

@router.post("/admin/users/{user_id}/deactivate", response_model=APIResponse)
@require_permission([Permission.SYSTEM_CONFIG, Permission.ADMIN, Permission.USER_DELETE])
async def deactivate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Деактивация пользователя администратором
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения операции"
            )
        
        success = await user_service.deactivate_user(db, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        deactivated_user = await user_service.get_user_by_id(db, user_id)
        
        return APIResponse(
            success=True,
            data=UserResponse.model_validate(deactivated_user) if deactivated_user else None,
            message="Пользователь успешно деактивирован"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при деактивации пользователя: {str(e)}"
        )

@router.post("/admin/users/{user_id}/reset-password", response_model=APIResponse)
@require_permission([Permission.USER_RESET_PASSWORD])
async def admin_reset_password(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Сброс пароля пользователя администратором
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения операции"
            )
        
        new_password = await user_service.admin_reset_password(db, user_id)
        
        user = await user_service.get_user_by_id(db, user_id)
        if user:
            await email_service.send_new_password_email(user.email, user.username, new_password)
        
        return APIResponse(
            success=True,
            message="Пароль успешно сброшен и отправлен пользователю"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сбросе пароля: {str(e)}"
        )

@router.get("/admin/users", response_model=APIResponse)
@require_permission([Permission.USER_MANAGE])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: RedisManager = Depends(get_redis_client)
) -> APIResponse:
    """
    Получение списка всех пользователей (для администраторов)
    """
    try:
        users = await user_service.get_all_users(db, skip=skip, limit=limit, active_only=active_only)
        total = await user_service.get_users_count(db, active_only=active_only)
        
        response_data: Dict[str, Any] = {
            "users": [UserResponse.model_validate(user) for user in users],
            "total": total,
            "page": skip // limit + 1 if limit > 0 else 1,
            "page_size": limit,
            "has_more": skip + limit < total
        }
        
        return APIResponse(
            success=True,
            data=response_data,
            message="Пользователи успешно получены"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении пользователей: {str(e)}"
        )

# Вспомогательные эндпоинты
@router.get("/health")
async def health_check(db: RedisManager = Depends(get_redis_client)) -> Dict[str, Any]:
    """
    Проверка здоровья сервиса аутентификации
    """
    try:
        user_count = user_service.get_users_count(db)
        
        return {
            "status": "healthy",
            "database": "connected",
            "users_count": user_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
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


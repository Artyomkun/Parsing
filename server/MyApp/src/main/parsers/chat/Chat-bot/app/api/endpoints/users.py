from models.user import User, UserFilters, UserResponse, UserCreate, UserUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from services import redis_client, user_service
from typing import List, Optional, Dict, Any
from auth import get_current_active_user
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/users", tags=["users"],)

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
    title: Optional[str] = None
    participants: List[str] = []

class Message(BaseModel):
    conversation_id: str
    timestamp: datetime
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

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    try:
        # Теперь передаем db как параметр
        created_user = await user_service.create_user(db=redis_client, user_data=user)
        return UserResponse.model_validate(created_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 10) -> List[UserResponse]:
    
    filters = UserFilters.model_construct()
    users = await user_service.get_users(skip=skip, limit=limit, filters = filters)
    return [UserResponse.model_validate(user) for user in users]

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(user_id: str, current_user: User = Depends(get_current_active_user)) -> UserResponse:
    if str(current_user.id) != user_id and not getattr(current_user, 'is_superuser', False):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = await user_service.get_user_by_id(db=redis_client, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate) -> UserResponse:
    updated_user = await user_service.update_user(db=redis_client, user_id=user_id, update_data=user_update.model_dump(exclude_unset=True))
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(updated_user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str) -> None:
    success = await user_service.delete_user(user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
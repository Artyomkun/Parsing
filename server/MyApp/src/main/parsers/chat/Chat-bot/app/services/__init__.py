from .auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token,
    get_current_user,
    validate_password,
    security,
    authenticate_user,
)
from .auth  import authenticate_user
from .user_service import user_service, UserService
from .ai_service import ai_service
from .ai import ai

# Создаем алиасы для обратной совместимости
security_service = security

from models.user import User, UserCreate, UserFilters, UserSearchResults, UserStats, UserUpdate
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, AsyncGenerator, Optional
from fastapi import HTTPException, status, Depends
from models.chat import Message, MessageRole
from core.security import SecurityService
from passlib.context import CryptContext
from datetime import datetime, timedelta
from core import redis_client, settings
import google.generativeai as genai
from anthropic import Anthropic
from openai import OpenAI
from jose import jwt
import anthropic
import logging
import asyncio
import openai
import random
import uuid
import json
import re

__all__ = [
    # Auth
    "verify_password",
    "get_password_hash",
    "create_access_token", 
    "verify_token",
    "authenticate_user",
    "get_current_user",
    "validate_password",
    "security",
    "security_service",
    
    # Services
    "UserService",
    "user_service", 
    "ai_service",
    "ai",
    
    "User",
    "UserCreate",
    "UserFilters",
    "UserSearchResults",
    "UserStats",
    "UserUpdate",
    "HTTPBearer",
    "HTTPAuthorizationCredentials",
    "List",
    "Dict",
    "Any",
    "AsyncGenerator",
    "Optional",
    "HTTPException",
    "status",
    "Depends",
    "Message",
    "MessageRole",
    "SecurityService",
    "CryptContext",
    "datetime",
    "timedelta",
    "redis_client",
    "settings",
    "genai",
    "Anthropic",
    "anthropic",
    "OpenAI",
    "openai",
    "jwt",
    "logging",
    "asyncio",
    "random",
    "uuid",
    "json",
    "re"
]
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import auth, chat, users
from api.websockets import websocket_router
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from fastapi import FastAPI
from core import settings
import uvicorn

# Загружаем переменные окружения
load_dotenv()

app = FastAPI(
    title="Chat Bot API",
    description="AI Chat Bot with FastAPI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(websocket_router, prefix="/ws", tags=["websockets"])

# Статические файлы для фронтенда (если нужно)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "Chat Bot API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
from fastapi import FastAPI
from typing import Dict, Any, Optional
import redis
import json

app = FastAPI(title="AI Platform API")

# Подключение к Redis с аннотациями типов
redis_client: Optional[redis.Redis] = None

@app.on_event("startup")
async def startup_event():
    """Инициализация подключений при запуске"""
    global redis_client
    try:
        redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
        # Проверяем подключение
        redis_client.ping()
        print("✅ Redis connected successfully")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        redis_client = None

@app.get("/")
async def root() -> Dict[str, Any]:
    return {"message": "AI Platform API", "version": "1.0"}

@app.get("/health")
async def health() -> Dict[str, Any]:
    redis_status = "connected" if redis_client and redis_client.ping() else "disconnected"
    return {
        "status": "healthy", 
        "redis": redis_status,
        "services": ["ai-app", "postgres", "redis"]
    }

@app.post("/predict")
async def predict(data: Dict[str, Any]) -> Dict[str, Any]:
    # Пример AI логики
    prediction = {"result": "AI prediction", "confidence": 0.95, "input": data}
    
    # Кэшируем результат если Redis доступен
    if redis_client:
        try:
            redis_client.setex(
                f"prediction:{json.dumps(data, sort_keys=True)}", 
                300, 
                json.dumps(prediction)
            )
        except Exception as e:
            print(f"Redis cache error: {e}")
    
    return prediction

@app.get("/cache/stats")
async def cache_stats() -> Dict[str, Any]:
    if not redis_client:
        return {"connected": False, "error": "Redis not available"}
    
    try:
        return {
            "connected": redis_client.ping(),
            "keys": len(redis_client.keys("*")),
            "info": redis_client.info()
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}

# Добавим тип для запросов
from pydantic import BaseModel

class PredictionRequest(BaseModel):
    features: list
    model: str = "default"

@app.post("/predict/v2")
async def predict_v2(request: PredictionRequest) -> Dict[str, Any]:
    """Версия с Pydantic моделями для лучшей типизации"""
    prediction = {
        "result": f"Prediction from {request.model}",
        "confidence": 0.95,
        "features": request.features
    }
    
    return prediction

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
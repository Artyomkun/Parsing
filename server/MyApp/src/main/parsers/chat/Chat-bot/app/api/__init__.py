import importlib
from .websockets import app, login

# Автоматически импортируем все роутеры из endpoints
routers = []
endpoint_modules = ["auth", "chat", "users"]

for module_name in endpoint_modules:
    try:
        module = importlib.import_module(f".endpoints.{module_name}", __package__)
        if hasattr(module, 'router'):
            # Добавляем в глобальную область видимости
            globals()[f"{module_name}_router"] = module.router
    except ImportError as e:
        print(f"Warning: Could not import {module_name}: {e}")


__all__ = [ 
            "routers",
            "app",
            "login"
        ]
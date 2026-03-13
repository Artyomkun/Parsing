from typing import AsyncGenerator, Dict, Any, Optional, List
from datetime import datetime, timezone
from app.core.config import settings
import google.generativeai as genai
import anthropic
import asyncio
import logging
import openai

logger = logging.getLogger(__name__)


class AI:
    """Унифицированный сервис для работы с различными AI провайдерами"""
    MODEL_CONFIGS: Dict[str, Dict[str, Any]] = {
        "openai": {
            "default_model": "gpt-3.5-turbo",
            "models": {
                "gpt-3.5-turbo": {"max_tokens": 4096, "display_name": "GPT-3.5 Turbo"},
                "gpt-3.5-turbo-16k": {"max_tokens": 16384, "display_name": "GPT-3.5 Turbo 16K"},
                "gpt-4": {"max_tokens": 8192, "display_name": "GPT-4"},
                "gpt-4-turbo": {"max_tokens": 128000, "display_name": "GPT-4 Turbo"},
            },
            "temperature": 0.7,
            "max_tokens": 1000,
        },
        "anthropic": {
            "default_model": "claude-3-sonnet-20240229",
            "models": {
                "claude-3-haiku-20240307": {"max_tokens": 200000, "display_name": "Claude 3 Haiku"},
                "claude-3-sonnet-20240229": {"max_tokens": 200000, "display_name": "Claude 3 Sonnet"},
                "claude-3-opus-20240229": {"max_tokens": 200000, "display_name": "Claude 3 Opus"},
            },
            "temperature": 0.7,
            "max_tokens": 1000,
        },
        "google": {
            "default_model": "gemini-pro",
            "models": {
                "gemini-pro": {"max_tokens": 30720, "display_name": "Gemini Pro"},
                "gemini-pro-vision": {"max_tokens": 12288, "display_name": "Gemini Pro Vision"},
            },
            "temperature": 0.7,
            "max_tokens": 1000,
        }
    }

    def __init__(self):
        self.clients: Dict[str, Any] = {}
        self._initialized = False

    async def initialize(self):
        """Асинхронная инициализация клиентов AI провайдеров"""
        if self._initialized:
            return
            
        try:
            if getattr(settings, 'OPENAI_API_KEY', None):
                self.clients["openai"] = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("✅ OpenAI client initialized")
            if getattr(settings, 'ANTHROPIC_API_KEY', None):
                self.clients["anthropic"] = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic client initialized")
            if getattr(settings, 'GOOGLE_API_KEY', None):
                configure_func = getattr(genai, 'configure', None)
                if configure_func:
                    configure_func(api_key=settings.GOOGLE_API_KEY)
                self.clients["google"] = genai
                logger.info(" Google AI client initialized")
                
            if not self.clients:
                logger.warning("No AI providers configured - using mock responses only")
                
            self._initialized = True
            logger.info("AI service initialized with providers: %s", list(self.clients.keys()))
                
        except Exception as e:
            logger.error("Error initializing AI clients: %s", e)
            raise

    async def generate(self, prompt: str, provider: str = "openai", model: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None, system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs: Any) -> AsyncGenerator[str, None]:
        """ Генерация ответа AI с потоковой передачей """
        if not self._initialized:
            await self.initialize()

        try:
            if provider not in self.MODEL_CONFIGS:
                raise ValueError(f"Unsupported provider: {provider}. Available: {list(self.MODEL_CONFIGS.keys())}")
            config = self._get_config(provider, model, temperature, max_tokens)
            if provider in self.clients:
                if provider == "openai":
                    async for chunk in self._generate_openai(prompt, config, system_message, conversation_history, **kwargs):
                        yield chunk
                elif provider == "anthropic":
                    async for chunk in self._generate_anthropic(prompt, config, system_message, conversation_history, **kwargs):
                        yield chunk
                elif provider == "google":
                    async for chunk in self._generate_google(prompt, config, system_message, conversation_history, **kwargs):
                        yield chunk
            else:
                logger.warning("Provider %s not available, using mock response", provider)
                async for chunk in self._generate_fallback(prompt):
                    yield chunk
                    
        except Exception as e:
            logger.error("Error generating AI response: %s", e)
            yield f"Ошибка: {str(e)}"

    async def _generate_openai(self, prompt: str, config: Dict[str, Any], system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> AsyncGenerator[str, None]:
        """Генерация ответа через OpenAI"""
        messages = self._prepare_openai_messages(prompt, system_message, conversation_history)
        
        try:
            stream = await self.clients["openai"].chat.completions.create(
                model=config["model"],
                messages=messages,
                temperature=config["temperature"],
                max_tokens=config["max_tokens"],
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error("OpenAI API error: %s", e)
            yield f"OpenAI error: {str(e)}"

    async def _generate_anthropic(self, prompt: str, config: Dict[str, Any], system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> AsyncGenerator[str, None]:
        """Генерация ответа через Anthropic"""
        actual_system_message = system_message or ""
        actual_conversation_history = conversation_history or []
        
        messages = self._prepare_anthropic_messages(prompt, actual_system_message, actual_conversation_history)
        
        try:
            async with self.clients["anthropic"].messages.stream(
                model=config["model"],
                max_tokens=config["max_tokens"],
                temperature=config["temperature"],
                messages=messages,
                system=actual_system_message
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            logger.error("Anthropic API error: %s", e)
            yield f"Anthropic error: {str(e)}"

    async def _generate_google(self, prompt: str, config: Dict[str, Any], system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> AsyncGenerator[str, None]:
        """Генерация ответа через Google Gemini"""
        contents = self._prepare_google_contents(prompt, system_message, conversation_history)
        
        try:
            model = self.clients["google"].GenerativeModel(config["model"])
            generation_config = {
                'temperature': config["temperature"],
                'max_output_tokens': config["max_tokens"],
            }
            response = model.generate_content(
                contents,
                generation_config=generation_config, 
                stream=True
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error("Google AI API error: %s", e)
            yield f"Google AI error: {str(e)}"

    async def _generate_fallback(self, prompt: str, system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs: Any) -> AsyncGenerator[str, None]:
        """Fallback на доступные провайдеры когда основной недоступен"""
        fallback_providers = ["google", "openai", "anthropic"]
        
        for provider in fallback_providers:
            if provider in self.clients and provider in self.MODEL_CONFIGS:
                try:
                    logger.info("Using fallback provider: %s", provider)
                    config = self._get_config(provider, None, None, None)
                    
                    if provider == "openai":
                        async for chunk in self._generate_openai(prompt, config, system_message, conversation_history, **kwargs):
                            yield chunk
                        return
                    elif provider == "anthropic":
                        async for chunk in self._generate_anthropic(prompt, config, system_message, conversation_history, **kwargs):
                            yield chunk
                        return
                    elif provider == "google":
                        async for chunk in self._generate_google(prompt, config, system_message, conversation_history, **kwargs):
                            yield chunk
                        return
                        
                except Exception as e:
                    logger.warning("Fallback provider %s failed: %s", provider, e)
                    continue
        response = "Извините, все сервисы временно недоступны. Попробуйте позже."
        for word in response.split():
            yield word + " "
            await asyncio.sleep(0.02)

    def _get_config(self, provider: str, model: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """Получение конфигурации для провайдера"""
        provider_config = self.MODEL_CONFIGS[provider]
        config: Dict[str, Any] = {
            "model": model or provider_config["default_model"],
            "temperature": temperature if temperature is not None else provider_config["temperature"],
            "max_tokens": max_tokens or provider_config["max_tokens"],
        }
        if config["model"] not in provider_config["models"]:
            available_models = list(provider_config["models"].keys())
            logger.warning(f"Model {config['model']} not found for provider {provider}. Using default. Available: {available_models}")
        return config

    def _prepare_openai_messages(self, prompt: str, system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> List[Dict[str, str]]:
        """Подготовка сообщений для OpenAI"""
        messages: List[Dict[str, str]] = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        if conversation_history:
            for msg in conversation_history[-10:]:
                if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                    messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": prompt})
        return messages

    def _prepare_anthropic_messages(self, prompt: str, system_message: Optional[str], conversation_history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Подготовка сообщений для Anthropic"""
        messages: List[Dict[str, str]] = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        for msg in conversation_history[-10:]:
            if msg["role"] in ["user", "assistant"] and len(msg["content"]) > 0:
                messages.append(msg)
        messages.append({"role": "user", "content": prompt})
        return messages

    def _prepare_google_contents(self, prompt: str, system_message: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> List[str]:
        """Подготовка контента для Google Gemini"""
        contents: List[str] = []
        
        if system_message:
            contents.append(f"System: {system_message}")
        
        if conversation_history:
            for msg in conversation_history[-10:]:
                if msg.get("content"):
                    role = "User" if msg.get("role") == "user" else "Assistant"
                    contents.append(f"{role}: {msg['content']}")
        
        contents.append(f"User: {prompt}")
        return contents

    def get_available_providers(self) -> List[str]:
        """Получение списка доступных провайдеров"""
        return list(self.clients.keys())

    def get_available_models(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Получение доступных моделей"""
        if provider:
            return self.MODEL_CONFIGS.get(provider, {}).get("models", {})
        
        return {
            provider: config["models"] 
            for provider, config in self.MODEL_CONFIGS.items()
        }

    async def health_check(self) -> Dict[str, Any]:
        """Проверка здоровья сервиса"""
        health_status: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "healthy",
            "providers": {}
        }
        
        for provider, client in self.clients.items():
            try:
                if provider == "openai":
                    await client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": "ping"}],
                        max_tokens=5
                    )
                elif provider == "anthropic":
                    await client.messages.create(
                        model="claude-3-haiku-20240307",
                        max_tokens=5,
                        messages=[{"role": "user", "content": "ping"}]
                    )
                health_status["providers"][provider] = {"status": "healthy"}
            except Exception as e:
                health_status["providers"][provider] = {
                    "status": "unhealthy", 
                    "error": str(e)
                }
                health_status["status"] = "degraded"
        
        if not self.clients:
            health_status["status"] = "no_providers"
            
        return health_status

    async def close(self):
        """Корректное закрытие клиентов"""
        for provider, client in self.clients.items():
            try:
                if hasattr(client, 'close'):
                    await client.close()
                    logger.info("Closed client for %s", provider)
            except Exception as e:
                logger.error("Error closing client for %s: %s", provider, e)

ai = AI()
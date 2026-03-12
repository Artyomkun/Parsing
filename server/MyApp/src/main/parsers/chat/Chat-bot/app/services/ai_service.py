from typing import List, Dict, Any, AsyncGenerator, Optional, Union
from models.chat import Message, MessageRole, MessageType, chat_service
from datetime import datetime, timezone
from core.redis import redis_client
import google.generativeai as genai
from services import user_service 
from core.config import settings
from anthropic import Anthropic
from openai import OpenAI
from uuid import UUID
import logging
import asyncio

logger = logging.getLogger(__name__)

class AIService:
    """
    Сервис для взаимодействия с различными AI провайдерами
    Поддерживает OpenAI, Anthropic, Google Gemini
    """
    
    # Константы для моделей
    MODEL_CONFIGS: Dict[str, Dict[str, Dict[str, Any]]] = {
        'openai': {
            'gpt-4': {'context': 8192, 'display': 'GPT-4'},
            'gpt-4-turbo': {'context': 128000, 'display': 'GPT-4 Turbo'},
            'gpt-3.5-turbo': {'context': 4096, 'display': 'GPT-3.5 Turbo'},
            'gpt-3.5-turbo-16k': {'context': 16384, 'display': 'GPT-3.5 Turbo 16K'},
        },
        'anthropic': {
            'claude-3-opus-20240229': {'context': 200000, 'display': 'Claude 3 Opus'},
            'claude-3-sonnet-20240229': {'context': 200000, 'display': 'Claude 3 Sonnet'},
            'claude-3-haiku-20240307': {'context': 200000, 'display': 'Claude 3 Haiku'},
        },
        'google': {
            'gemini-pro': {'context': 30720, 'display': 'Gemini Pro'},
            'gemini-pro-vision': {'context': 12288, 'display': 'Gemini Pro Vision'},
        }
    }
    
    MODEL_DESCRIPTIONS: Dict[str, str] = {
        'gpt-4': 'Самый продвинутый модель OpenAI с отличными reasoning способностями',
        'gpt-4-turbo': 'Улучшенная версия GPT-4 с большим контекстом',
        'gpt-3.5-turbo': 'Быстрая и эффективная модель для большинства задач',
        'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo с увеличенным контекстом',
        'claude-3-opus-20240229': 'Самый мощный модель Claude от Anthropic',
        'claude-3-sonnet-20240229': 'Сбалансированный модель Claude',
        'claude-3-haiku-20240307': 'Быстрый и эффективный модель Claude',
        'gemini-pro': 'Продвинутый модель от Google для текстовых задач',
        'gemini-pro-vision': 'Gemini Pro с поддержкой изображений'
    }
    
    SYSTEM_PROMPT = """Ты полезный AI ассистент. Отвечай вежливо и информативно.
    Будь краток, но содержателен в ответах. Если не знаешь ответа, так и скажи.
    Не придумывай информацию. Будь честным и полезным помощником."""

    def __init__(self):
        self.providers: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self._init_lock = asyncio.Lock()
        
    async def initialize(self):
        """Асинхронная инициализация провайдеров"""
        if self._initialized:
            return
            
        async with self._init_lock:
            if self._initialized:
                return
                
            try:
                await self.setup_providers()
                self._initialized = True
                self.logger.info("AIService успешно инициализирован")
            except Exception as e:
                self.logger.error(f"Ошибка при инициализации AIService: {e}")
                raise

    async def setup_providers(self):
        """Инициализация провайдеров AI"""
        try:
            if settings.OPENAI_API_KEY:
                self.providers['openai'] = {
                    'client': OpenAI(api_key=settings.OPENAI_API_KEY),
                    'models': list(self.MODEL_CONFIGS['openai'].keys())
                }
                self.logger.info("OpenAI provider initialized")
            if settings.ANTHROPIC_API_KEY:
                self.providers['anthropic'] = {
                    'client': Anthropic(api_key=settings.ANTHROPIC_API_KEY),
                    'models': list(self.MODEL_CONFIGS['anthropic'].keys())
                }
                self.logger.info("Anthropic provider initialized")
            if settings.GOOGLE_API_KEY:
                self.providers['google'] = {
                    'client': genai,
                    'models': list(self.MODEL_CONFIGS['google'].keys())
                }
                configure_func = getattr(genai, 'configure', None)
                if configure_func:
                    configure_func(api_key=settings.GOOGLE_API_KEY)
                self.logger.info("Google Gemini provider initialized")
                
            if not self.providers:
                self.logger.warning("No AI providers configured")
        except Exception as e:
            self.logger.error(f"Error initializing AI providers: {e}")
            raise

    async def ensure_initialized(self):
        """Гарантирует инициализацию сервиса"""
        if not self._initialized:
            await self.initialize()

    async def generate_ai_response(self, prompt: str, model: str = "gpt-3.5-turbo", temperature: float = 0.7,  max_tokens: int = 1000, system_prompt: Optional[str] = None) -> str:
        """ Упрощенная версия генерации AI ответа без истории диалога """
        await self.ensure_initialized()
        try:
            provider = self._get_provider_by_model(model)
            if provider == 'openai':
                return await self._generate_openai_response(prompt, [], model, temperature, max_tokens, system_prompt)
            elif provider == 'anthropic':
                return await self._generate_anthropic_response(prompt, [], model, temperature, max_tokens, system_prompt)
            elif provider == 'google':
                return await self._generate_google_response(prompt, [], model, temperature, max_tokens, system_prompt)
            else:
                raise ValueError(f"Unsupported model: {model}")
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return "Извините, произошла ошибка при генерации ответа."
    
    async def generate_stream_response(self, prompt: str, conversation_history: List[Dict[str, Any]], conversation_id: str, user_id: str, model: str, temperature: float, max_tokens: Optional[int] = None, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Упрощенная потоковая генерация с поддержкой истории диалога"""
        await self.ensure_initialized()
        if not conversation_history:
            conversation_history = await chat_service.get_conversation_history(
                user_service=user_service,
                db=redis_client,
                conversation_id=conversation_id, 
                user_id=user_id
            )
        try:
            provider = self._get_provider_by_model(model)
            message_history = self._convert_dicts_to_messages(conversation_history, UUID(conversation_id))
            if provider == 'openai':
                async for chunk in self._generate_openai_stream_response( prompt, message_history, model, temperature, max_tokens, system_prompt):
                    yield chunk
            elif provider == 'anthropic':
                async for chunk in self._generate_anthropic_stream_response(prompt, message_history, model, temperature, max_tokens, system_prompt):
                    yield chunk
            elif provider == 'google':
                async for chunk in self._generate_google_stream_response(prompt, message_history, model, temperature, max_tokens, system_prompt):
                    yield chunk
            else:
                yield "Извините, выбранная модель временно недоступна."
                
        except Exception as e:
            self.logger.error(f"Ошибка в потоковом ответе: {e}")
            yield "Произошла ошибка при генерации ответа."
    
    async def generate_response(self, message: str, user_id: str, conversation_id: str, conversation_history: List[Message], model: str = "gpt-3.5-turbo", temperature: float = 0.7, max_tokens: int = 1000, stream: bool = False, system_prompt: Optional[str] = None) -> Union[AsyncGenerator[str, None], str]:
        """Генерация ответа AI"""
        await self.ensure_initialized()
        conversation_history_dicts = self._convert_messages_to_dicts(conversation_history)
        if stream:
            return self.generate_stream_response(
                prompt=message,
                conversation_history=conversation_history_dicts,
                conversation_id=conversation_id,
                user_id=user_id,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                system_prompt=system_prompt
            )
        try:
            provider = self._get_provider_by_model(model)
            
            if provider == 'openai':
                return await self._generate_openai_response(message, conversation_history, model, temperature, max_tokens, system_prompt)
            elif provider == 'anthropic':
                return await self._generate_anthropic_response(message, conversation_history, model, temperature, max_tokens, system_prompt)
            elif provider == 'google':
                return await self._generate_google_response(message, conversation_history, model, temperature, max_tokens, system_prompt)
            else:
                raise ValueError(f"Unsupported model: {model}")
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return "Извините, произошла ошибка при генерации ответа. Пожалуйста, попробуйте еще раз."
        
    def _convert_messages_to_dicts(self, messages: List[Message]) -> List[Dict[str, Any]]:
        """Конвертирует список объектов Message обратно в словари"""
        return [
            {
                "role": str(msg.role),
                "content": msg.content
            }
            for msg in messages
        ]

    def _convert_dicts_to_messages(self, history: List[Dict[str, Any]], conversation_id: UUID) -> List[Message]:
        """Конвертирует список словарей в список объектов Message"""
        messages: List[Message] = []
        for msg in history:
            message = Message(
                content=msg.get('content', ''),
                role=MessageRole(msg.get('role', 'user')),
                type=MessageType.TEXT,
                conversation_id=conversation_id
            )
            messages.append(message)
        return messages
    
    async def _generate_openai_response(self, message: str, conversation_history: List[Message], model: str, temperature: float, max_tokens: int, system_prompt: Optional[str] = None) -> str:
        """Генерация ответа через OpenAI"""
        messages = self._prepare_openai_messages(message, conversation_history, system_prompt)
        
        def _call_openai():
            return self.providers['openai']['client'].chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
        
        response = await asyncio.get_event_loop().run_in_executor(None, _call_openai)
        return response.choices[0].message.content

    async def _generate_openai_stream_response(self, message: str, conversation_history: List[Message], model: str, temperature: float, max_tokens: Optional[int] = None, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Потоковая генерация через OpenAI"""
        messages = self._prepare_openai_messages(message, conversation_history, system_prompt)
        def _call_openai_stream():
            return self.providers['openai']['client'].chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
        stream = await asyncio.get_event_loop().run_in_executor(None, _call_openai_stream)
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

    async def _generate_anthropic_response(self, message: str, conversation_history: List[Message], model: str, temperature: float, max_tokens: int, system_prompt: Optional[str] = None) -> str:
        """Генерация ответа через Anthropic Claude"""
        prompt = self._prepare_anthropic_prompt(message, conversation_history, system_prompt)
        def _call_anthropic():
            return self.providers['anthropic']['client'].completions.create(
                model=model,
                prompt=prompt,
                temperature=temperature,
                max_tokens_to_sample=max_tokens,
                stream=False
            )
        response = await asyncio.get_event_loop().run_in_executor(None, _call_anthropic)
        return response.completion

    async def _generate_anthropic_stream_response(self, message: str, conversation_history: List[Message], model: str, temperature: float, max_tokens: Optional[int] = None, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Потоковая генерация через Anthropic"""
        prompt = self._prepare_anthropic_prompt(message, conversation_history, system_prompt)
        def _call_anthropic_stream():
            return self.providers['anthropic']['client'].completions.create(
                model=model,
                prompt=prompt,
                temperature=temperature,
                max_tokens_to_sample=max_tokens,
                stream=True
            )
        stream = await asyncio.get_event_loop().run_in_executor(None, _call_anthropic_stream)
        for completion in stream:
            yield completion.completion

    async def _generate_google_response(self, message: str, conversation_history: List[Message], model: str, temperature: float, max_tokens: int, system_prompt: Optional[str] = None) -> str:
        """Генерация ответа через Google Gemini"""
        history = self._prepare_gemini_history(conversation_history, system_prompt)
        model_obj = self.providers['google']['client'].GenerativeModel(model)
        
        contents = history + [message]
        
        def _call_google():
            # Используем словарь для конфигурации вместо GenerationConfig
            generation_config: Dict[str, Union[float, int]] = {
                'temperature': temperature,
                'max_output_tokens': max_tokens,
            }
            return model_obj.generate_content(
                contents,
                generation_config=generation_config
            )
        
        response = await asyncio.get_event_loop().run_in_executor(None, _call_google)
        return response.text

    async def _generate_google_stream_response(self,  message: str, conversation_history: List[Message], model: str, temperature: float, max_tokens: Optional[int] = None, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Потоковая генерация через Google Gemini"""
        history = self._prepare_gemini_history(conversation_history, system_prompt)
        model_obj = self.providers['google']['client'].GenerativeModel(model)
        contents = history + [message]
        generation_config: Dict[str, Union[float, int]] = {
            'temperature': temperature,
        }
        if max_tokens is not None: 
            generation_config['max_output_tokens'] = max_tokens
        def _call_google_stream():
            return model_obj.generate_content(
                contents,
                generation_config=generation_config,
                stream=True
            )
        response = await asyncio.get_event_loop().run_in_executor(None, _call_google_stream)
        for chunk in response:
            if hasattr(chunk, 'text') and chunk.text:
                yield chunk.text

    def _prepare_openai_messages(self, message: str,conversation_history: List[Message], system_prompt: Optional[str] = None) -> List[Dict[str, str]]:
        """Подготовка сообщений для OpenAI формата"""
        messages: List[Dict[str, str]] = []
        system_content = system_prompt or self.SYSTEM_PROMPT
        messages.append({"role": "system", "content": system_content})
        for msg in self._get_truncated_history(conversation_history, 'openai'):
            role = "user" if msg.role == MessageRole.USER else "assistant"
            messages.append({"role": role, "content": msg.content})
        messages.append({"role": "user", "content": message})
        return messages

    def _prepare_anthropic_prompt(self, message: str, conversation_history: List[Message], system_prompt: Optional[str] = None) -> str:
        """Подготовка промпта для Anthropic Claude"""
        system_content = system_prompt or self.SYSTEM_PROMPT
        prompt = f"\n\nHuman: {system_content}\n\n"
        for msg in self._get_truncated_history(conversation_history, 'anthropic'):
            role = "Human" if msg.role == MessageRole.USER else "Assistant"
            prompt += f"{role}: {msg.content}\n\n"
        prompt += f"Human: {message}\n\nAssistant:"
        return prompt

    def _prepare_gemini_history(self, conversation_history: List[Message], system_prompt: Optional[str] = None) -> List[str]:
        """Подготовка истории для Google Gemini"""
        history: List[str] = []
        if system_prompt or self.SYSTEM_PROMPT:
            history.append(system_prompt or self.SYSTEM_PROMPT)
        for msg in self._get_truncated_history(conversation_history, 'google'):
            history.append(msg.content)
        
        return history

    def _get_truncated_history(self, conversation_history: List[Message], provider: str, max_messages: int = 10) -> List[Message]:
        """Обрезает историю до максимального количества сообщений с учетом провайдера"""
        if provider == 'openai':
            max_messages = 20
        elif provider == 'anthropic':
            max_messages = 5
        
        return conversation_history[-max_messages:]

    def _get_provider_by_model(self, model: str) -> str:
        """Определение провайдера по названию модели"""
        model_lower = model.lower()
        
        if any(openai_model in model_lower for openai_model in ['gpt-3', 'gpt-4']):
            return 'openai'
        elif 'claude' in model_lower:
            return 'anthropic'
        elif 'gemini' in model_lower:
            return 'google'
        else:
            return 'openai'

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Получение списка доступных моделей"""
        await self.ensure_initialized()
        models: List[Dict[str, Any]] = []
        for provider_name, provider_info in self.providers.items():
            for model_name in provider_info['models']:
                model_config = self.MODEL_CONFIGS[provider_name].get(model_name, {})
                models.append({
                    'id': model_name,
                    'name': model_config.get('display', model_name),
                    'provider': provider_name,
                    'context_length': model_config.get('context', 4096),
                    'description': self.MODEL_DESCRIPTIONS.get(model_name, 'AI модель для генерации текста')
                })
        
        return models

    async def check_health(self) -> Dict[str, Any]:
        """Проверка здоровья AI сервисов"""
        await self.ensure_initialized()
        
        health_status : Dict[str, Any] = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'providers': {}
        }
        
        for provider_name, provider_info in self.providers.items():
            try:
                if provider_name == 'openai':
                    def _check_openai():
                        return provider_info['client'].chat.completions.create(
                            model="gpt-3.5-turbo",
                            messages=[{"role": "user", "content": "Say 'OK'"}],
                            max_tokens=5
                        )
                    await asyncio.get_event_loop().run_in_executor(None, _check_openai)
                elif provider_name == 'anthropic':
                    def _check_anthropic():
                        return provider_info['client'].completions.create(
                            model="claude-3-haiku-20240307",
                            prompt="\n\nHuman: Say 'OK'\n\nAssistant:",
                            max_tokens_to_sample=5
                        )
                    await asyncio.get_event_loop().run_in_executor(None, _check_anthropic)
                elif provider_name == 'google':
                    def _check_google():
                        return provider_info['client'].GenerativeModel('gemini-pro').generate_content("Say 'OK'")
                    await asyncio.get_event_loop().run_in_executor(None, _check_google)
                health_status['providers'][provider_name] = {'status': 'healthy'}
            except Exception as e:
                health_status['providers'][provider_name] = {
                    'status': 'unhealthy',
                    'error': str(e)
                }
        return health_status

ai_service = AIService()
from typing import Any, Awaitable, Callable, Dict, List, Optional, Set, Union
from redis.exceptions import ConnectionError, TimeoutError
from redis.asyncio import Redis as AsyncRedis
from core.database import DatabaseUtils
from datetime import datetime as dt
from config import settings
import logging

RedisDict = Dict[bytes, bytes]
RedisSet = Set[bytes]
RedisList = List[bytes]
RedisString = Union[bytes, None]
logger = logging.getLogger(__name__)

class MemoryStorage:
    def __init__(self):
        self._storage: Dict[str, str] = {}
        self._expiry: Dict[str, float] = {}
        self._counters: Dict[str, int] = {}
        self._lists: Dict[str, List[str]] = {}
        self._sets: Dict[str, Set[str]] = {}
        self._zsets: Dict[str, Dict[str, float]] = {} 
        self._operations: List[Callable[[], Awaitable[Union[bool, int]]]] = []
        self._hashes: Dict[str, Dict[str, str]] = {}
        
    async def get(self, key: str) -> Optional[bytes]:
        if key in self._expiry and self._expiry[key] < dt.now().timestamp():
            self._storage.pop(key, None)
            self._expiry.pop(key, None)
            return None
        value = self._storage.get(key)
        return value.encode('utf-8') if value is not None else None
    
    async def setex(self, key: str, seconds: int, value: str) -> None:
        self._storage[key] = value
        self._expiry[key] = dt.now().timestamp() + seconds
    
    async def set(self, key: str, value: str) -> None:
        self._storage[key] = value
    
    async def incr(self, key: str) -> int:
        current = self._counters.get(key, 0)
        self._counters[key] = current + 1
        return current + 1
    
    async def delete(self, *keys: str) -> int:
        count = 0
        for key in keys:
            if key in self._storage:
                del self._storage[key]
                count += 1
            self._expiry.pop(key, None)
            self._counters.pop(key, None)
        return count
    
    async def smembers(self, key: str) -> Set[bytes]:
        members = self._sets.get(key, set())
        return {member.encode('utf-8') for member in members}
    
    async def sismember(self, key: str, member: str) -> bool:
        """Проверяет наличие элемента в множестве"""
        if key not in self._sets:
            return False
        return member in self._sets[key]
    
    async def sadd(self, key: str, *members: str) -> int:
        if key not in self._sets:
            self._sets[key] = set()
        count = 0
        for member in members:
            if member not in self._sets[key]:
                self._sets[key].add(member)
                count += 1
        return count
    
    async def lrange(self, key: str, start: int, end: int) -> List[bytes]:
        lst = self._lists.get(key, [])
        if end == -1:
            sliced = lst[start:]
        else:
            sliced = lst[start:end+1]
        return [item.encode('utf-8') for item in sliced]
    
    async def lpush(self, key: str, *values: str) -> int:
        """Добавляет значения в начало списка (LPUSH)"""
        if key not in self._lists:
            self._lists[key] = []

        for value in reversed(values):
            self._lists[key].insert(0, value)
        
        return len(self._lists[key])
    
    async def ltrim(self, key: str, start: int, end: int) -> bool:
        """Обрезает список до указанного диапазона"""
        if key not in self._lists:
            return False
        
        lst = self._lists[key]
        if end == -1:
            self._lists[key] = lst[start:]
        else:
            self._lists[key] = lst[start:end+1]
        return True
    
    async def rpush(self, key: str, *values: str) -> int:
        if key not in self._lists:
            self._lists[key] = []
        self._lists[key].extend(values)
        return len(self._lists[key])
    
    async def ttl(self, key: str) -> int:
        if key not in self._expiry:
            return -2
        ttl = self._expiry[key] - dt.now().timestamp()
        return int(ttl) if ttl > 0 else -1
    
    async def ping(self) -> bool:
        return True  
    
    async def hset(self, key: str, mapping: Dict[str, str]) -> int:
        """Установка значений в хэш"""
        if key not in self._hashes:
            self._hashes[key] = {}
        self._hashes[key].update(mapping)
        return len(mapping)
    
    async def hget(self, key: str, field: str) -> Optional[bytes]:
        """Получение значения поля из хэша"""
        if key not in self._hashes:
            return None
        value = self._hashes[key].get(field)
        return value.encode('utf-8') if value is not None else None
    
    async def hgetall(self, key: str) -> Dict[bytes, bytes]:
        """Получение всех полей хэша"""
        if key not in self._hashes:
            return {}
        return {k.encode('utf-8'): v.encode('utf-8') for k, v in self._hashes[key].items()}
    
    async def hdel(self, key: str, *fields: str) -> int:
        """Удаление полей из хэша"""
        if key not in self._hashes:
            return 0
        count = 0
        for field in fields:
            if field in self._hashes[key]:
                del self._hashes[key][field]
                count += 1
        return count
    
    async def srem(self, key: str, *members: str) -> int:
        """Удаляет элементы из множества"""
        if key not in self._sets:
            return 0
        
        count = 0
        for member in members:
            if member in self._sets[key]:
                self._sets[key].remove(member)
                count += 1
        
        if not self._sets[key]:
            del self._sets[key]
            
        return count
    
    async def zadd(self, key: str, mapping: Dict[str, float]) -> int:
        """Добавляет элементы в sorted set"""
        if key not in self._zsets:
            self._zsets[key] = {}
        
        added_count = 0
        for member, score in mapping.items():
            if member not in self._zsets[key] or self._zsets[key][member] != score:
                self._zsets[key][member] = score
                added_count += 1
        
        return added_count

    async def zrange(self, key: str, start: int, end: int, withscores: bool = False) -> List[Any]:
        """Получает диапазон элементов из sorted set"""
        if key not in self._zsets:
            return []
        sorted_items = sorted(self._zsets[key].items(), key=lambda x: x[1])
        if end == -1:
            items = sorted_items[start:]
        else:
            items = sorted_items[start:end+1]
        
        if withscores:
            return [(member.encode('utf-8'), score) for member, score in items]
        else:
            return [member.encode('utf-8') for member, _ in items]
    
    async def execute(self) -> List[Union[bool, int]]:
        results: List[Union[bool, int]] = []
        for operation in self._operations: 
            result = await operation() 
            results.append(result) 
        self._operations.clear()
        return results
    
    def key_exists(self, key: str) -> bool:
        """Проверяет существование ключа"""
        return key in self._storage
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Установка времени жизни ключа"""
        try:
            if self._expiry:
                return await self.expire(key, seconds)
            else:
                current_value = await self.get(key)
                if current_value:
                    await self.setex(key, seconds, current_value.decode('utf-8'))
                    return True
                return False
        except Exception as e:
            print(f"Error setting expire: {e}")
            return False

    def hset_chain(self, key: str, mapping: Dict[str, str]) -> "MemoryStorage":
        async def operation() -> int:
            return await self.hset(key, mapping)
        self._operations.append(operation)
        return self

    def expire_chain(self, key: str, seconds: int) -> "MemoryStorage":
        async def operation() -> bool:
            return await self.expire(key, seconds)
        self._operations.append(operation)
        return self

    def lpush_chain(self, key: str, *values: str) -> "MemoryStorage":
        async def operation() -> int:
            return await self.lpush(key, *values)
        self._operations.append(operation)
        return self

    def ltrim_chain(self, key: str, start: int, end: int) -> "MemoryStorage":
        async def operation() -> bool:
            return await self.ltrim(key, start, end)
        self._operations.append(operation)
        return self

    def __len__(self) -> int:
        """Поддержка функции len()"""
        return len(self._storage)

    def __iter__(self):
        """Итерация по ключам"""
        return iter(self._storage)

    def keys(self) -> List[str]:
        """Получить все ключи"""
        return list(self._storage.keys())
    
    def exists(self, key: str) -> bool:
        """Проверяет существование ключа"""
        return key in self._storage

class MemoryPipeline:
    def __init__(self, storage: MemoryStorage):
        self._storage = storage
        self._operations: List[Callable[[], Awaitable[Any]]] = []
        self._zsets: Dict[str, Dict[str, float]] = {} 

    def pipeline(self) -> "MemoryPipeline":
        """Создание pipeline"""
        return MemoryPipeline(self._storage) 
    
    def set(self, key: str, value: str) -> "MemoryPipeline":
        async def operation() -> bool:
            await self._storage.set(key, value)
            return True
        self._operations.append(operation)
        return self
    
    def setex(self, key: str, seconds: int, value: str) -> "MemoryPipeline":
        async def operation() -> bool:
            await self._storage.setex(key, seconds, value)
            return True
        self._operations.append(operation) 
        return self
    
    def delete(self, *keys: str) -> "MemoryPipeline":
        async def operation() -> int:
            return await self._storage.delete(*keys)
        self._operations.append(operation) 
        return self
    
    def sadd(self, key: str, *members: str) -> "MemoryPipeline":
        async def operation() -> int:
            return await self._storage.sadd(key, *members)
        self._operations.append(operation)
        return self
    
    def rpush(self, key: str, *values: str) -> "MemoryPipeline":
        async def operation() -> int:
            return await self._storage.rpush(key, *values)
        self._operations.append(operation)
        return self
    
    def lpush(self, key: str, *values: str) -> "MemoryPipeline":
        async def operation() -> int:
            return await self._storage.lpush(key, *values)
        self._operations.append(operation)
        return self

    def ltrim(self, key: str, start: int, end: int) -> "MemoryPipeline":
        async def operation() -> bool:
            return await self._storage.ltrim(key, start, end)
        self._operations.append(operation)
        return self
    
    def hset(self, key: str, mapping: Dict[str, str]) -> "MemoryPipeline":
        async def operation() -> int:
            return await self._storage.hset(key, mapping)
        self._operations.append(operation)
        return self

    def hget(self, key: str, field: str) -> "MemoryPipeline":
        async def operation() -> Optional[bytes]:
            return await self._storage.hget(key, field)
        self._operations.append(operation)
        return self

    def hdel(self, key: str, *fields: str) -> "MemoryPipeline":
        async def operation() -> int:
            return await self._storage.hdel(key, *fields)
        self._operations.append(operation)
        return self

    def hincrby(self, key: str, field: str, increment: int = 1) -> "MemoryPipeline":
        async def operation() -> int:
            current_value = await self._storage.hget(key, field)
            if current_value is None:
                new_value = increment
            else:
                current_str = current_value.decode('utf-8')
                new_value = int(current_str) + increment
            await self._storage.hset(key, {field: str(new_value)})
            return new_value
        self._operations.append(operation)
        return self

    def expire(self, key: str, seconds: int) -> "MemoryPipeline":
        async def operation() -> bool:
            return await self._storage.expire(key, seconds)
        self._operations.append(operation)
        return self
    
    async def execute(self) -> List[Any]:
        results: List[Any] = []
        for operation in self._operations: 
            result = await operation() 
            results.append(result) 
        self._operations.clear()
        return results
    
    def zadd(self, key: str, mapping: Dict[str, float]) -> "MemoryPipeline":
        """Добавляет элементы в sorted set с их scores"""
        async def operation() -> int:
            if key not in self._zsets:
                self._zsets[key] = {}
            
            added_count = 0
            for member, score in mapping.items():
                if member not in self._zsets[key] or self._zsets[key][member] != score:
                    self._zsets[key][member] = score
                    added_count += 1
            
            return added_count
        self._operations.append(operation)
        return self

class RedisManager(DatabaseUtils):
    def __init__(self):
        if hasattr(DatabaseUtils, '__init__'):
            DatabaseUtils.__init__(self)
            
        self.client: Optional[AsyncRedis] = None
        self._storage = MemoryStorage()
        self._pipeline: Optional[MemoryPipeline] = None
        self._operations: List[Callable[[], Awaitable[Any]]] = []
        self._hashes: Dict[str, Dict[str, str]] = {}
        self._zsets: Dict[str, Dict[str, float]] = {} 
        self.connect()

    async def initialize(self) -> "RedisManager":
        """Инициализация Redis клиента"""
        try:
            self.client = AsyncRedis(
                host=settings.REDIS_HOST or "localhost",
                port=settings.REDIS_PORT or 6379,
                db=0,
                decode_responses=False,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
            )
                
            if await self.check_connection():
                print("Redis connection successful")
            else:
                print("Redis connection failed")
                await self.close()
                    
        except Exception as e:
            print(f"Redis initialization failed: {e}")
            self.client = None
            
        return self
    
    def connect(self) -> "RedisManager":
        """Базовое подключение"""
        try:
            self.client = AsyncRedis(host='localhost', port=6379, db=0)
        except Exception as e:
            print(f"Connect failed: {e}")
            self.client = None
        return self

    async def get(self, key: str) -> Optional[bytes]:
        return await self._storage.get(key)
    
    async def setex(self, key: str, seconds: int, value: str) -> None:
        await self._storage.setex(key, seconds, value)
    
    async def set(self, key: str, value: str) -> None:
        await self._storage.set(key, value)
    
    async def incr(self, key: str) -> int:
        return await self._storage.incr(key)
    
    async def delete(self, *keys: str) -> int:
        return await self._storage.delete(*keys)
    
    async def smembers(self, key: str) -> Set[bytes]:
        return await self._storage.smembers(key)
    
    async def sadd(self, key: str, *members: str) -> int:
        return await self._storage.sadd(key, *members)
    
    async def lrange(self, key: str, start: int, end: int) -> List[bytes]:
        return await self._storage.lrange(key, start, end)
    
    async def rpush(self, key: str, *values: str) -> int:
        return await self._storage.rpush(key, *values)
    
    async def lpush(self, key: str, *values: str) -> int:
        """Добавляет значения в начало списка"""
        return await self._storage.lpush(key, *values)
    
    async def ltrim(self, key: str, start: int, end: int) -> bool:
        """Обрезает список до указанного диапазона"""
        if self.client:
            try:
                await self._storage.ltrim(key, start, end)
                return True
            except Exception:
                return False
        else:
            return await self._storage.ltrim(key, start, end)
            
    async def ttl(self, key: str) -> int:
        return await self._storage.ttl(key)
    
    async def ping(self) -> bool:
        return await self._storage.ping()
    
    async def srem(self, key: str, *members: str) -> int:
        return await self._storage.srem(key, *members)
    
    async def sismember(self, key: str, member: str) -> bool:
        """Проверяет наличие элемента в множестве"""
        return await self._storage.sismember(key, member)
    
    async def hdel(self, key: str, *fields: str) -> int:
        """Удаление полей из хэша"""
        return await self._storage.hdel(key, *fields)
    
    async def hget(self, key: str, field: str) -> Optional[bytes]:
        """Получение значения поля из хэша"""
        return await self._storage.hget(key, field)
    
    async def hgetall(self, key: str) -> Dict[bytes, bytes]:
        """Получение всех полей хэша"""
        return await self._storage.hgetall(key)
    
    async def hset(self, key: str, mapping: Dict[str, str]) -> int:
        return await self._storage.hset(key, mapping)
    
    async def hincrby(self, key: str, field: str, increment: int = 1) -> int:
        """Увеличивает значение поля в хэше"""
        try:
            current_value = await self.hget(key, field)
            if current_value is None:
                new_value = increment
            else:
                current_str = current_value.decode('utf-8')
                new_value = int(current_str) + increment
            
            await self.hset(key, {field: str(new_value)})
            return new_value
            
        except Exception as e:
            logger.error(f"Error in hincrby for key {key}, field {field}: {e}")
            raise
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Установка времени жизни ключа"""
        try:
            if self.client:
                return await self.client.expire(key, seconds)
            else:
                if self._storage.key_exists(key):
                    current_value = await self._storage.get(key)
                    if current_value:
                        await self._storage.setex(key, seconds, current_value.decode('utf-8'))
                        return True
                return False
        except Exception as e:
            print(f"Error setting expire: {e}")
            return False
        
    def pipeline(self) -> "MemoryPipeline":
        self._pipeline = MemoryPipeline(self._storage)
        return self._pipeline

    def set_chain(self, key: str, value: str) -> "RedisManager":
        async def operation() -> bool:
            await self._storage.set(key, value)
            return True
        self._operations.append(operation)
        return self
    
    def setex_chain(self, key: str, seconds: int, value: str) -> "RedisManager":
        async def operation() -> bool:
            await self._storage.setex(key, seconds, value)
            return True
        self._operations.append(operation)
        return self
    
    def delete_chain(self, *keys: str) -> "RedisManager":
        async def operation() -> int:
            return await self._storage.delete(*keys)
        self._operations.append(operation)
        return self
    
    def sadd_chain(self, key: str, *members: str) -> "RedisManager":
        async def operation() -> int:
            return await self._storage.sadd(key, *members)
        self._operations.append(operation)
        return self
    
    def rpush_chain(self, key: str, *values: str) -> "RedisManager":
        async def operation() -> int:
            return await self._storage.rpush(key, *values)
        self._operations.append(operation)
        return self

    def hset_chain(self, key: str, mapping: Dict[str, str]) -> "RedisManager":
        async def operation() -> int:
            return await self.hset(key, mapping)
        self._operations.append(operation)
        return self

    def expire_chain(self, key: str, seconds: int) -> "RedisManager":
        async def operation() -> bool:
            return await self.expire(key, seconds)
        self._operations.append(operation)
        return self
    
    def lpush_chain(self, key: str, *values: str) -> "RedisManager":
        async def operation() -> int:
            return await self.lpush(key, *values)
        self._operations.append(operation)
        return self

    def ltrim_chain(self, key: str, start: int, end: int) -> "RedisManager":
        async def operation() -> bool:
            return await self.ltrim(key, start, end)
        self._operations.append(operation)
        return self
    
    def hincrby_chain(self, key: str, field: str, increment: int = 1) -> "RedisManager":
        async def operation() -> int:
            return await self.hincrby(key, field, increment)
        self._operations.append(operation)
        return self

    def hget_chain(self, key: str, field: str) -> "RedisManager":
        async def operation() -> Optional[bytes]:
            return await self.hget(key, field)
        self._operations.append(operation)
        return self

    def hdel_chain(self, key: str, *fields: str) -> "RedisManager":
        async def operation() -> int:
            return await self.hdel(key, *fields)
        self._operations.append(operation)
        return self

    def hgetall_chain(self, key: str) -> "RedisManager":
        async def operation() -> Dict[bytes, bytes]:
            return await self.hgetall(key)
        self._operations.append(operation)
        return self

    def incr_chain(self, key: str) -> "RedisManager":
        async def operation() -> int:
            return await self.incr(key)
        self._operations.append(operation)
        return self

    def smembers_chain(self, key: str) -> "RedisManager":
        async def operation() -> Set[bytes]:
            return await self.smembers(key)
        self._operations.append(operation)
        return self

    def sismember_chain(self, key: str, member: str) -> "RedisManager":
        async def operation() -> bool:
            return await self.sismember(key, member)
        self._operations.append(operation)
        return self

    def srem_chain(self, key: str, *members: str) -> "RedisManager":
        async def operation() -> int:
            return await self.srem(key, *members)
        self._operations.append(operation)
        return self

    def lrange_chain(self, key: str, start: int, end: int) -> "RedisManager":
        async def operation() -> List[bytes]:
            return await self.lrange(key, start, end)
        self._operations.append(operation)
        return self

    def get_chain(self, key: str) -> "RedisManager":
        async def operation() -> Optional[bytes]:
            return await self.get(key)
        self._operations.append(operation)
        return self

    def ttl_chain(self, key: str) -> "RedisManager":
        async def operation() -> int:
            return await self.ttl(key)
        self._operations.append(operation)
        return self
    
    async def zadd(self, key: str, mapping: Dict[str, float]) -> int:
        """Добавляет элементы в sorted set"""
        try:
            if self.client:
                return await self.client.zadd(key, mapping)
            else:
                # Реализация для MemoryStorage
                if key not in self._zsets:
                    self._zsets[key] = {}
                
                added_count = 0
                for member, score in mapping.items():
                    if member not in self._zsets[key] or self._zsets[key][member] != score:
                        self._zsets[key][member] = score
                        added_count += 1
                
                return added_count
        except Exception as e:
            logger.error(f"Error in zadd for key {key}: {e}")
            return 0

    def zadd_chain(self, key: str, mapping: Dict[str, float]) -> "RedisManager":
        """Цепочка для zadd"""
        async def operation() -> int:
            return await self.zadd(key, mapping)
        self._operations.append(operation)
        return self
    
    async def check_connection(self) -> bool:
        """Проверка подключения к Redis"""
        try:
            if self._storage:
                await self._storage.ping()
                return True
            return False
        except (ConnectionError, TimeoutError) as e:
            print(f"Redis connection error: {e}")
            return False
        except Exception as e:
            print(f"Redis check failed: {e}")
            return False

    async def dbsize(self) -> int:
        """Возвращает количество ключей в хранилище"""
        return len(self._storage)
    
    def keys(self, pattern: str = "*") -> List[str]:
        """Получить все ключи по паттерну"""
        all_keys = self._storage.keys()
        if pattern == "*":
            return all_keys
        return [key for key in all_keys if pattern in key]
    
    async def execute_command(self, command: str) -> Any:
        """Выполняет Redis команды для совместимости"""
        command = command.upper()
        
        if command == "PING":
            return b"PONG"
        elif command == "DBSIZE":
            return len(self._storage)
        elif command == "INFO":
            return b"# MemoryStorage info\n"
        else:
            raise NotImplementedError(f"Command {command} not implemented in MemoryStorage")
    
    async def exists(self, key: str) -> bool:
        """Проверяет существование ключа"""
        try:
            if self.client:
                return await self.client.exists(key) > 0
            else:
                return self._storage.exists(key)
        except Exception:
            return self._storage.exists(key)
    
    async def execute(self) -> List[Any]:
        """Выполняет накопленные операции"""
        results: List[Any] = []
        for operation in self._operations:
            result = await operation()
            results.append(result)
        self._operations.clear()
        return results
    
    async def close(self) -> None:
        """Закрытие соединения"""
        if self.client:
            await self.client.aclose()

redis_client = RedisManager()

async def initialize_redis():
    await redis_client.initialize()
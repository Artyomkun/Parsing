from sqlalchemy.engine.base import Connection
from sqlalchemy.exc import IntegrityError
from typing import Optional, Any, Dict
from models.user import Message, User
from sqlalchemy.orm import Session
from alembic.config import Config
from datetime import datetime
from alembic import command
from uuid import UUID
import logging
import json

logger = logging.getLogger(__name__)

def run_migrations() -> None:
    """ Запуск миграций Alembic"""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "core/migrations")
    command.upgrade(alembic_cfg, "head")

def create_migration(message: str) -> None:
    """ Создание новой миграции"""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "core/migrations")
    command.revision(alembic_cfg, message=message, autogenerate=True)

async def migrate_redis_data(connection: Connection) -> None:
    """Миграция данных из Redis в SQL во время alembic миграции"""
    session = None
    try:
        # Импорты внутри функции чтобы избежать циклических зависимостей
        from app.core.redis import redis_client
        from app.models.user import User

        # Создаем сессию из connection
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=connection)
        session = Session()
        
        # Миграция пользователей
        user_ids_bytes = await redis_client.smembers("users:all")
        if not user_ids_bytes:
            logger.info("No users found in Redis")
            return
        
        user_ids = [uid.decode('utf-8') for uid in user_ids_bytes]
        
        migrated_count = 0
        failed_count = 0
        skipped_count = 0
        
        for user_id in user_ids:
            try:
                # Проверяем существование в SQL
                existing = session.query(User).filter_by(id=user_id).first()
                if existing:
                    logger.debug(f"User {user_id} already exists in SQL")
                    skipped_count += 1
                    continue
                
                # Получаем данные из Redis
                user_data_bytes = await redis_client.get(f"user:{user_id}")
                if not user_data_bytes:
                    logger.warning(f"User data not found for {user_id}")
                    failed_count += 1
                    continue
                
                # Конвертируем данные
                user_data = json.loads(user_data_bytes.decode('utf-8'))
                
                # Обрабатываем даты
                created_at = None
                updated_at = None
                last_login = None
                last_activity = None
                
                if user_data.get('created_at'):
                    try:
                        created_at = datetime.fromisoformat(
                            user_data['created_at'].replace('Z', '+00:00')
                        )
                    except (ValueError, AttributeError):
                        created_at = datetime.now()
                
                if user_data.get('updated_at'):
                    try:
                        updated_at = datetime.fromisoformat(
                            user_data['updated_at'].replace('Z', '+00:00')
                        )
                    except (ValueError, AttributeError):
                        updated_at = datetime.now()
                
                if user_data.get('last_login'):
                    try:
                        last_login = datetime.fromisoformat(
                            user_data['last_login'].replace('Z', '+00:00')
                        )
                    except (ValueError, AttributeError):
                        last_login = None
                
                if user_data.get('last_activity'):
                    try:
                        last_activity = datetime.fromisoformat(
                            user_data['last_activity'].replace('Z', '+00:00')
                        )
                    except (ValueError, AttributeError):
                        last_activity = None
                
                # Создаем SQL запись
                sql_user = User(
                    id=int(user_data.get('id') or user_id),
                    username=user_data.get('username'),
                    email=user_data.get('email'),
                    hashed_password=user_data.get('hashed_password', ''),
                    first_name=user_data.get('first_name'),
                    last_name=user_data.get('last_name'),
                    role=user_data.get('role', 'user'),
                    is_active=user_data.get('is_active', True),
                    timezone=user_data.get('timezone', 'UTC'),
                    language=user_data.get('language', 'ru'),
                    created_at=created_at or datetime.now(),
                    updated_at=updated_at or datetime.now(),
                    last_login=last_login,
                    last_activity=last_activity
                )
                
                session.add(sql_user)
                session.commit()
                migrated_count += 1
                logger.info(f"User {user_id} migrated successfully")
                
            except IntegrityError as e:
                if session:
                    session.rollback()
                logger.error(f"Integrity error for user {user_id}: {e}")
                failed_count += 1
            except Exception as e:
                if session:
                    session.rollback()
                logger.error(f"Error migrating user {user_id}: {e}")
                failed_count += 1
        
        logger.info(
            f"Migration completed: "
            f"Migrated: {migrated_count}, "
            f"Failed: {failed_count}, "
            f"Skipped: {skipped_count}, "
            f"Total in Redis: {len(user_ids)}"
        )
        
        # Миграция диалогов если нужно
        if session:
            await _migrate_conversations(session, redis_client)
        
    except ImportError as e:
        logger.warning(f"Cannot import modules for data migration: {e}")
    except Exception as e:
        logger.error(f"Data migration failed: {e}")
        raise
    finally:
        if session is not None:
            session.close()

async def _migrate_conversations(session: Session, redis_client: Any) -> None:
    """Миграция диалогов из Redis в SQL"""
    try:
        # Получаем все ключи диалогов
        keys = await redis_client.keys("conversation:*")
        conversation_keys = [k.decode('utf-8') for k in keys if b':messages' not in k]
        
        migrated_count = 0
        
        for key in conversation_keys:
            try:
                # Пропускаем ключи с messages
                if ':messages' in key:
                    continue
                    
                # Получаем данные диалога
                conv_data_bytes = await redis_client.hgetall(key)
                if not conv_data_bytes:
                    continue
                
                # Конвертируем данные
                conv_data = {
                    k.decode('utf-8'): v.decode('utf-8') 
                    for k, v in conv_data_bytes.items()
                }
                
                # Ищем модель Conversation (если существует)
                try:
                    from models import Conversation
                    
                    # Создаем запись диалога
                    conversation = Conversation(
                        id=UUID(key.split(':')[1]),
                        user_id=UUID(conv_data.get('user_id')),
                        title=conv_data.get('title', ''),
                        created_at=datetime.fromisoformat(
                            conv_data.get('created_at', datetime.now().isoformat())
                            .replace('Z', '+00:00')
                        ) if conv_data.get('created_at') else datetime.now(),
                        updated_at=datetime.fromisoformat(
                            conv_data.get('updated_at', datetime.now().isoformat())
                            .replace('Z', '+00:00')
                        ) if conv_data.get('updated_at') else datetime.now()
                    )
                    
                    session.add(conversation)
                    session.commit()
                    migrated_count += 1
                    
                    # Миграция сообщений диалога
                    await _migrate_conversation_messages(
                        session, redis_client, key.split(':')[1]
                    )
                    
                except ImportError:
                    logger.debug("Conversation model not found, skipping conversations")
                    break
                    
            except Exception as e:
                session.rollback()
                logger.error(f"Error migrating conversation {key}: {e}")
                continue
        
        if migrated_count > 0:
            logger.info(f"Migrated {migrated_count} conversations")
            
    except Exception as e:
        logger.error(f"Error migrating conversations: {e}")

async def _migrate_conversation_messages(
    session: Session, 
    redis_client: Any, 
    conversation_id: str
) -> None:
    """Миграция сообщений диалога"""
    try:
        
        # Получаем список ID сообщений
        messages_key = f"conversation:{conversation_id}:messages"
        message_ids_bytes = await redis_client.lrange(messages_key, 0, -1)
        
        if not message_ids_bytes:
            return
        
        message_ids = [msg_id.decode('utf-8') for msg_id in message_ids_bytes]
        
        for msg_id in message_ids:
            try:
                # Получаем данные сообщения
                msg_key = f"message:{msg_id}"
                msg_data_bytes = await redis_client.hgetall(msg_key)
                
                if not msg_data_bytes:
                    continue
                
                msg_data = {
                    k.decode('utf-8'): v.decode('utf-8') 
                    for k, v in msg_data_bytes.items()
                }
                
                # Создаем запись сообщения
                message = Message(
                    id=msg_id,
                    conversation_id=conversation_id,
                    content=msg_data.get('content', ''),
                    role=msg_data.get('role', 'user'),
                    timestamp=datetime.fromisoformat(
                        msg_data.get('timestamp', datetime.now().isoformat())
                        .replace('Z', '+00:00')
                    ) if msg_data.get('timestamp') else datetime.now()
                )
                
                session.add(message)
                
            except Exception as e:
                logger.error(f"Error migrating message {msg_id}: {e}")
                continue
        
        session.commit()
        logger.debug(f"Migrated {len(message_ids)} messages for conversation {conversation_id}")
        
    except ImportError:
        logger.debug("Message model not found, skipping messages")
    except Exception as e:
        session.rollback()
        logger.error(f"Error migrating messages for conversation {conversation_id}: {e}")

# Класс для миграции (если используется в других местах)
class RedisToSQLMigrator:
    def __init__(self, redis_manager: Any, sql_session_factory: Any):
        self.redis = redis_manager
        self.sql_session_factory = sql_session_factory
    
    async def migrate_users(self) -> Dict[str, Any]:
        """Миграция пользователей"""
        session = None
        session = self.sql_session_factory()
        try:
            user_ids_bytes = await self.redis.smembers("users:all")
            if not user_ids_bytes:
                return {"status": "no_data", "message": "No users in Redis"}
            
            user_ids = [uid.decode('utf-8') for uid in user_ids_bytes]

            stats: Dict[str, Any] = {
                "total": len(user_ids),
                "success": 0,
                "failed": 0,
                "skipped": 0,
                "errors": []
            }
            
            for user_id in user_ids:
                try:
                    # Проверяем существование в SQL
                    existing = session.query(User).filter_by(id=user_id).first()
                    if existing:
                        stats["skipped"] += 1
                        continue
                    
                    # Получаем данные из Redis
                    user_data_bytes = await self.redis.get(f"user:{user_id}")
                    if not user_data_bytes:
                        stats["failed"] += 1
                        stats["errors"].append(f"User {user_id} not found in Redis")
                        continue
                    
                    # Конвертируем данные
                    user_data = json.loads(user_data_bytes.decode('utf-8'))
                    
                    # Обрабатываем даты
                    created_at = self._parse_date(user_data.get('created_at'))
                    updated_at = self._parse_date(user_data.get('updated_at'))
                    last_login = self._parse_date(user_data.get('last_login'))
                    last_activity = self._parse_date(user_data.get('last_activity'))
                    
                    # Создаем SQL запись
                    sql_user = User(
                        id=int(user_data.get('id') or user_id),
                        username=user_data.get('username'),
                        email=user_data.get('email'),
                        hashed_password=user_data.get('hashed_password', ''),
                        first_name=user_data.get('first_name'),
                        last_name=user_data.get('last_name'),
                        role=user_data.get('role', 'user'),
                        is_active=user_data.get('is_active', True),
                        timezone=user_data.get('timezone', 'UTC'),
                        language=user_data.get('language', 'ru'),
                        created_at=created_at or datetime.now(),
                        updated_at=updated_at or datetime.now(),
                        last_login=last_login,
                        last_activity=last_activity
                    )
                    
                    session.add(sql_user)
                    session.commit()
                    stats["success"] += 1
                    
                except IntegrityError as e:
                    if session:
                        session.rollback()
                    stats["failed"] += 1
                    stats["errors"].append(f"Integrity error for {user_id}: {str(e)}")
                except Exception as e:
                    if session:
                        session.rollback()
                    stats["failed"] += 1
                    stats["errors"].append(f"Error migrating {user_id}: {str(e)}")
            
            return stats
            
        finally:
            if session:
                session.close()
    
    def _parse_date(self, date_str: Any) -> Optional[datetime]:
        """Парсинг даты из строки"""
        if not date_str:
            return None
        if isinstance(date_str, str):
            try:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except ValueError:
                return None
        return None
    
    async def migrate_all(self) -> Dict[str, Any]:
        """Полная миграция всех данных"""
        results: Dict[str, Any] = {
            "users": await self.migrate_users(),
            "timestamp": datetime.now().isoformat()
        }
        return results
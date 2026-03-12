from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator, List, Dict, Any, Optional, Type, TypeVar
from config import settings
import logging

logger = logging.getLogger(__name__)

# Создание engine для PostgreSQL/MySQL
DATABASE_URL = settings.DATABASE_URL or "postgresql://user:password@localhost/dbname"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DEBUG
)

# Создание фабрики сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()
metadata = MetaData()

# TypeVar для точной типизации
T = TypeVar('T')

# Type для моделей SQLAlchemy
ModelType = Type[Base]

def get_db() -> Generator[Session, None, None]:
    """Зависимость для получения сессии базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables() -> bool:
    """Создание таблиц в базе данных"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Таблицы базы данных созданы")
        return True
    except Exception as e:
        logger.error(f"Ошибка создания таблиц: {e}")
        return False

def drop_tables() -> bool:
    """Удаление всех таблиц (для тестирования)"""
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Таблицы базы данных удалены")
        return True
    except Exception as e:
        logger.error(f"Ошибка удаления таблиц: {e}")
        return False

def init_db() -> bool:
    """Инициализация базы данных"""
    create_tables()
    logger.info("База данных инициализирована")
    return True

class DatabaseUtils:
    """Утилиты для работы с базой данных"""
    
    def __init__(self):
        self.engine = engine
        
    def health_check(self) -> Dict[str, Any]:
        """Проверка здоровья базы данных"""
        try:
            with self.engine.connect() as conn:
                # Используем text() для SQL запроса
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
                
            return {
                "status": "healthy",
                "database": self.engine.url.database,
                "dialect": self.engine.url.drivername,
                "host": self.engine.url.host,
                "port": self.engine.url.port
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy", 
                "error": str(e),
                "database": self.engine.url.database if hasattr(self.engine, 'url') else "unknown"
            }
    
    def get_database_info(self) -> Dict[str, Any]:
        """Получение информации о базе данных"""
        try:
            with self.engine.connect() as conn:
                db_info: Dict[str, Any] = {
                    "type": self.engine.url.drivername,
                    "database": self.engine.url.database,
                }
                
                # Маскируем пароль в URL для логирования
                if self.engine.url.password:
                    db_info["connection_url"] = str(self.engine.url).replace(
                        self.engine.url.password, "***"
                    )
                else:
                    db_info["connection_url"] = str(self.engine.url)
                
                # Получаем версию БД
                version = "unknown"
                size_mb = 0.0
                
                if self.engine.url.drivername == 'postgresql':
                    version_result = conn.execute(text("SELECT version()"))
                    version_row = version_result.fetchone()
                    if version_row:
                        version = version_row[0]
                    
                    size_result = conn.execute(text("SELECT pg_database_size(current_database())"))
                    size_row = size_result.fetchone()
                    if size_row and size_row[0]:
                        size_bytes = size_row[0]
                        size_mb = size_bytes / (1024 * 1024)
                    
                elif self.engine.url.drivername == 'mysql':
                    version_result = conn.execute(text("SELECT VERSION()"))
                    version_row = version_result.fetchone()
                    if version_row:
                        version = version_row[0]
                    
                    size_result = conn.execute(text("""
                        SELECT SUM(data_length + index_length) / 1024 / 1024 
                        FROM information_schema.TABLES 
                        WHERE table_schema = DATABASE()
                    """))
                    size_row = size_result.fetchone()
                    if size_row and size_row[0]:
                        size_mb = float(size_row[0])
                
                # Получаем количество таблиц
                table_count = len(Base.metadata.tables)
                
                db_info.update({
                    "version": version,
                    "size_mb": round(size_mb, 2),
                    "tables_count": table_count,
                })
                
                return db_info
                
        except Exception as e:
            logger.error(f"Failed to get database info: {e}")
            return {"type": "unknown", "error": str(e)}
    
    def execute_raw_sql(
        self, 
        query: str, 
        params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Выполнение сырого SQL запроса"""
        try:
            with self.engine.connect() as conn:
                # Используем text() для SQL запроса
                result = conn.execute(text(query), params or {})
                
                # Если это SELECT, возвращаем результаты
                if query.strip().upper().startswith('SELECT'):
                    columns = result.keys()
                    rows = result.fetchall()
                    # Преобразуем Row objects в dict
                    return [dict(zip(columns, row)) for row in rows]
                else:
                    # Для INSERT/UPDATE/DELETE возвращаем количество затронутых строк
                    return [{"rows_affected": result.rowcount}]
                    
        except Exception as e:
            logger.error(f"SQL execution failed: {e}")
            raise e
    
    def bulk_insert[T](
        self,
        model_class: Type[T],  # Используем Type[T] для точной типизации
        data: List[Dict[str, Any]]
    ) -> int:
        """Массовая вставка данных"""
        try:
            with SessionLocal() as session:
                # Создаем объекты модели
                objects: List[T] = []  # Точная типизация: список экземпляров model_class
                for item in data:
                    try:
                        obj = model_class(**item)
                        objects.append(obj)
                    except Exception as e:
                        logger.error(f"Error creating model instance: {e}")
                        continue
                
                if objects:
                    session.bulk_save_objects(objects)
                    session.commit()
                    
                    # Получаем имя таблицы
                    table_name = getattr(model_class, '__tablename__', 'unknown')
                    
                    logger.info(f"Bulk insert completed: {len(objects)} items to {table_name}")
                    return len(objects)
                else:
                    logger.warning("No objects to insert")
                    return 0
                    
        except Exception as e:
            logger.error(f"Bulk insert failed: {e}")
            raise e
    
    def get_table_stats(self, table_name: str) -> Dict[str, Any]:
        """Статистика по таблице"""
        try:
            with self.engine.connect() as conn:
                if self.engine.url.drivername == 'postgresql':
                    # Для PostgreSQL используем форматирование с осторожностью
                    query = text(f"""
                        SELECT 
                            COUNT(*) as row_count,
                            pg_size_pretty(pg_total_relation_size('{table_name}')) as total_size,
                            pg_size_pretty(pg_table_size('{table_name}')) as table_size,
                            pg_size_pretty(pg_indexes_size('{table_name}')) as index_size
                        FROM {table_name}
                    """)
                    result = conn.execute(query)
                    
                elif self.engine.url.drivername == 'mysql':
                    # Для MySQL
                    query = text("""
                        SELECT 
                            COUNT(*) as row_count,
                            data_length as table_size,
                            index_length as index_size
                        FROM information_schema.TABLES
                        WHERE table_schema = DATABASE() AND table_name = :table_name
                    """)
                    result = conn.execute(query, {"table_name": table_name})
                else:
                    # Для SQLite или других
                    query = text(f"SELECT COUNT(*) as row_count FROM {table_name}")
                    result = conn.execute(query)
                
                row = result.fetchone()
                if row:
                    # Преобразуем Row в dict через dict() и zip
                    columns = result.keys()
                    return dict(zip(columns, row))
                return {}
                
        except Exception as e:
            logger.error(f"Failed to get table stats: {e}")
            return {}

# Создаем экземпляр утилит
db_utils = DatabaseUtils()

# Проверка соединения при запуске
if settings.DEBUG:
    try:
        health = db_utils.health_check()
        if health["status"] == "healthy":
            logger.info(f"Database connected: {health['database']}")
        else:
            logger.warning(f"Database health check failed: {health.get('error')}")
    except Exception as e:
        logger.error(f"Could not connect to database: {e}")
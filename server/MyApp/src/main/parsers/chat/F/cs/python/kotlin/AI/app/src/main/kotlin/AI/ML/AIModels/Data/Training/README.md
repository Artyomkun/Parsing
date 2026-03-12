# Training Data Directory

Универсальная система для работы с тренировочными данными AI моделей парсера.

## 🏗️ Структура

### Основные модули

- `data_loader.py` - Загрузка и управление данными
- `data_generator.py` - Генерация синтетических данных  
- `data_validator.py` - Валидация качества данных
- `data_collector.py` - Сбор данных с веб-сайтов
- `data_analyzer.py` - Анализ и статистика данных
- `data_cleaner.py` - Очистка и подготовка данных
- `config.py` - Конфигурационные параметры

## 🚀 Использование

### Загрузка данных

```python
from training_data.data_loader import TrainingDataLoader

loader = TrainingDataLoader()
data = loader.load_all_training_data()
stats = loader.get_training_stats()

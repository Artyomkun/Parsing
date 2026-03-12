import pytest
import sys
import os

# Добавляем путь к проекту в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Настройка тестового окружения"""
    # Мокаем функции, которые не должны выполняться в тестах
    monkeypatch.setattr('ваш_файл_с_парсером.save_html_to_file', lambda *args, **kwargs: True)
    monkeypatch.setattr('ваш_файл_с_парсером.save_result', lambda *args, **kwargs: None)


@pytest.fixture
def sample_html():
    """Фикстура с примером HTML"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Page</title>
        <meta name="description" content="Test description">
    </head>
    <body>
        <h1>Main Heading</h1>
        <p>Test paragraph</p>
        <a href="/link1">Link 1</a>
        <a href="/link2">Link 2</a>
    </body>
    </html>
    """


@pytest.fixture
def sample_json():
    """Фикстура с примером JSON"""
    return '{"name": "John", "age": 30, "active": true}'


@pytest.fixture
def sample_csv():
    """Фикстура с примером CSV"""
    return """id,name,value
1,Item1,100
2,Item2,200
3,Item3,300"""
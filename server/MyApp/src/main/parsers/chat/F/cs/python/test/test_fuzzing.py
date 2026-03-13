import pytest
import random
import string
import json
import sys
import os

from html_parser import parse_html_direct, parse_input_data, parse_json, parse_text, parse_xml

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class TestFuzzing:
    """Фаззинг тесты для обнаружения уязвимостей"""

    def generate_fuzz_inputs(self, count=100):
        """Генератор случайных входных данных для фаззинга"""
        fuzz_inputs = []
        
        for _ in range(count):
            # Различные типы фаззинг данных
            length = random.randint(1, 1000)
            
            # Случайные строки
            random_chars = ''.join(random.choices(
                string.printable + '\\x00\\x0b\\x0c\\x1b\\xff', 
                k=length
            ))
            fuzz_inputs.append(random_chars)
            
            # Специальные паттерны
            fuzz_inputs.append('A' * length)  # Одинаковые символы
            fuzz_inputs.append('<' * length)  # Много тегов
            fuzz_inputs.append('{' * length)  # Много скобок
            fuzz_inputs.append('"' * length)  # Много кавычек
            fuzz_inputs.append('\\' * length)  # Много слешей
            
            # Числовые переполнения
            fuzz_inputs.append(str(2**64))
            fuzz_inputs.append(str(-2**64))
            
        return fuzz_inputs

    def test_fuzz_json_parser(self):
        """Фаззинг JSON парсера"""
        fuzz_inputs = self.generate_fuzz_inputs(50)
        
        for fuzz_input in fuzz_inputs:
            try:
                result = parse_json(fuzz_input)
                # Главное - нет падения
                assert result is not None
            except Exception as e:
                # Падения должны быть обработаны внутри функции
                pytest.fail(f"JSON parser crashed on input: {repr(fuzz_input)} with error: {e}")

    def test_fuzz_xml_parser(self):
        """Фаззинг XML парсера"""
        fuzz_inputs = self.generate_fuzz_inputs(50)
        
        for fuzz_input in fuzz_inputs:
            try:
                result = parse_xml(fuzz_input)
                assert result is not None
            except Exception as e:
                pytest.fail(f"XML parser crashed on input: {repr(fuzz_input)} with error: {e}")

    def test_fuzz_html_parser(self):
        """Фаззинг HTML парсера"""
        fuzz_inputs = self.generate_fuzz_inputs(50)
        
        for fuzz_input in fuzz_inputs:
            try:
                result = parse_html_direct(fuzz_input)
                assert result is not None
            except Exception as e:
                pytest.fail(f"HTML parser crashed on input: {repr(fuzz_input)} with error: {e}")

    def test_fuzz_text_parser(self):
        """Фаззинг текстового парсера"""
        fuzz_inputs = self.generate_fuzz_inputs(50)
        
        for fuzz_input in fuzz_inputs:
            try:
                result = parse_text(fuzz_input)
                assert result is not None
            except Exception as e:
                pytest.fail(f"Text parser crashed on input: {repr(fuzz_input)} with error: {e}")

    def test_fuzz_main_parser(self):
        """Фаззинг основного парсера"""
        fuzz_inputs = self.generate_fuzz_inputs(50)
        
        for fuzz_input in fuzz_inputs:
            try:
                # Создаем структуру входных данных
                input_data = {
                    'type': 'html',
                    'content': fuzz_input,
                    'options': {}
                }
                result = parse_input_data(json.dumps(input_data))
                assert result is not None
            except Exception as e:
                pytest.fail(f"Main parser crashed on input: {repr(fuzz_input)} with error: {e}")


def test_unicode_fuzzing():
    """Фаззинг с Unicode символами"""
    unicode_test_cases = [
        "🚀" * 1000,  # Много emoji
        "𝕏" * 1000,   # Математические символы  
        ";" * 1000,    # Греческие символы
        "𠜎" * 1000,   # CJK иероглифы
    ]
    
    for test_case in unicode_test_cases:
        result = parse_text(test_case)
        assert result['success'] == True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
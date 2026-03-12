#include "python_parser.h"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iostream>

#ifdef _WIN32
#include <windows.h>
#else
#include <dlfcn.h>
#endif

#include <Python.h>

PythonParser::PythonParser() {
    initialize_python();
}

PythonParser::~PythonParser() {
    finalize_python();
}

void PythonParser::initialize_python() {
    // Динамическая загрузка Python DLL
#ifdef _WIN32
    HMODULE python_dll = LoadLibraryA("C:\\Python313\\python313.dll");
    if (!python_dll) {
        std::cerr << "Failed to load C:\\Python313\\python313.dll. Error: " << GetLastError() << std::endl;
        python_dll = LoadLibraryA("python313.dll");
        if (!python_dll) {
            std::cerr << "Failed to load python313.dll from system path. Error: " << GetLastError() << std::endl;
            return;
        }
        std::cout << "Python DLL loaded successfully from system path" << std::endl;
    } else {
        std::cout << "Python DLL loaded successfully from C:\\Python313\\python313.dll" << std::endl;
    }
#else
    void* python_lib = dlopen("libpython3.13.so", RTLD_LAZY | RTLD_GLOBAL);
    if (!python_lib) {
        std::cerr << "Failed to load libpython: " << dlerror() << std::endl;
        return;
    }
    std::cout << "Python library loaded successfully" << std::endl;
#endif

    // Инициализация Python
    if (!Py_IsInitialized()) {
#ifdef _WIN32
        const wchar_t* pythonHome = L"C:\\Python313";
        Py_SetPythonHome(pythonHome);
        // Включаем UTF-8 для консоли
        SetConsoleOutputCP(65001);
#endif

        Py_Initialize();
        if (Py_IsInitialized()) {
            // Добавляем пути к Python модулям через sys.path
            PyRun_SimpleString("import sys");
            
            // Основные пути Python
            PyRun_SimpleString("sys.path.insert(0, 'C:\\\\Python313\\\\Lib')");
            PyRun_SimpleString("sys.path.insert(0, 'C:\\\\Python313\\\\DLLs')");
            PyRun_SimpleString("sys.path.insert(0, 'C:\\\\Python313\\\\Lib\\\\site-packages')");
            
            // Пути к нашему проекту
            PyRun_SimpleString("sys.path.insert(0, 'D:\\\\Parsing-main\\\\server\\\\MyApp\\\\src\\\\main\\\\parsers\\\\python')");
            PyRun_SimpleString("sys.path.insert(0, 'D:\\\\Parsing-main\\\\server\\\\MyApp\\\\src\\\\main\\\\parsers\\\\python\\\\packages')");
            
            std::cout << "HTML parser initialized successfully" << std::endl;
            python_initialized_ = true;
        } else {
            std::cerr << "Failed to initialize Python" << std::endl;
        }
    }
}

void PythonParser::finalize_python() {
    if (python_initialized_ && Py_IsInitialized()) {
        Py_Finalize();
        python_initialized_ = false;
    }
}

std::string PythonParser::call_python_function(const std::string& input_data) const {
    if (!Py_IsInitialized()) {
        return "<html><body><h1>Error: Python not initialized</h1></body></html>";
    }

    PyObject *pModule = nullptr, *pFunc = nullptr, *pArgs = nullptr, *pValue = nullptr;
    
    try {
        std::cout << "Calling Python with input length: " << input_data.length() << std::endl;
        
        // Импортируем модуль
        pModule = PyImport_ImportModule("html_parser");
        if (pModule == nullptr) {
            PyErr_Print();
            return "<html><body><h1>Error: Failed to import html_parser module</h1></body></html>";
        }
        
        // Получаем функцию parse_html_direct
        pFunc = PyObject_GetAttrString(pModule, "parse_html_direct");
        if (pFunc == nullptr || !PyCallable_Check(pFunc)) {
            Py_XDECREF(pFunc);
            Py_DECREF(pModule);
            return "<html><body><h1>Error: Cannot find parse_html_direct function</h1></body></html>";
        }
        
        // Создаем аргументы для вызова - передаем контент напрямую
        pArgs = PyTuple_New(1);
        PyObject* pInputString = PyUnicode_FromStringAndSize(input_data.c_str(), input_data.length());
        PyTuple_SetItem(pArgs, 0, pInputString);
        
        // Вызываем функцию с аргументами
        pValue = PyObject_CallObject(pFunc, pArgs);
        Py_DECREF(pArgs);
        
        if (pValue == nullptr) {
            PyErr_Print();
            Py_DECREF(pFunc);
            Py_DECREF(pModule);
            return "<html><body><h1>Error: Python function call failed</h1></body></html>";
        }
        
        // Преобразуем результат в строку
        std::string result;
        if (PyUnicode_Check(pValue)) {
            PyObject* temp_bytes = PyUnicode_AsEncodedString(pValue, "UTF-8", "strict");
            if (temp_bytes != nullptr) {
                result = std::string(PyBytes_AS_STRING(temp_bytes));
                Py_DECREF(temp_bytes);
            }
        } else if (PyBytes_Check(pValue)) {
            result = std::string(PyBytes_AS_STRING(pValue));
        } else {
            // Пробуем преобразовать в строку
            PyObject* str_obj = PyObject_Str(pValue);
            if (str_obj != nullptr) {
                PyObject* temp_bytes = PyUnicode_AsEncodedString(str_obj, "UTF-8", "strict");
                if (temp_bytes != nullptr) {
                    result = std::string(PyBytes_AS_STRING(temp_bytes));
                    Py_DECREF(temp_bytes);
                }
                Py_DECREF(str_obj);
            }
        }
        
        Py_DECREF(pValue);
        Py_DECREF(pFunc);
        Py_DECREF(pModule);
        
        return result;
        
    } catch (const std::exception& e) {
        if (pFunc) Py_DECREF(pFunc);
        if (pModule) Py_DECREF(pModule);
        if (pValue) Py_DECREF(pValue);
        return "<html><body><h1>Error: Exception in Python call: " + std::string(e.what()) + "</h1></body></html>";
    }
}

std::string PythonParser::parse(const std::string& content) const {
    try {
        // Передаем контент напрямую в Python парсер
        return call_python_function(content);
    } catch (const std::exception& e) {
        return "<html><body><h1>Error: " + std::string(e.what()) + "</h1></body></html>";
    }
}

std::string PythonParser::parse_file(const std::string& filename) const {
    try {
        // Читаем файл
        std::ifstream file(filename);
        if (!file.is_open()) {
            return "<html><body><h1>Error: Cannot open file: " + filename + "</h1></body></html>";
        }
        
        std::stringstream buffer;
        buffer << file.rdbuf();
        std::string content = buffer.str();
        
        // Передаем содержимое файла напрямую в Python парсер
        return call_python_function(content);
    } catch (const std::exception& e) {
        return "<html><body><h1>Error reading file: " + std::string(e.what()) + "</h1></body></html>";
    }
}
#include "html_parser.h"
#include "file_utils.h"
#include <stdexcept>
#include <Python.h>
#include <iostream>
#include <iomanip>
#include <sstream>
#include <filesystem>

HtmlParser::HtmlParser() {
    initialize_python();
}

HtmlParser::~HtmlParser() {
    finalize_python();
}

void HtmlParser::initialize_python() {
    if (!Py_IsInitialized()) {
        Py_Initialize();
        python_initialized_ = true;
        
        // Add current directory to Python path
        PyRun_SimpleString("import sys");
        PyRun_SimpleString("sys.path.append('.')");
        PyRun_SimpleString("sys.path.append('./src')");
    }
}

void HtmlParser::finalize_python() {
    if (python_initialized_ && Py_IsInitialized()) {
        Py_Finalize();
    }
}

void HtmlParser::show_progress_bar(size_t current, size_t total, const std::string& current_item) const {
    float progress = (float)current / total;
    int bar_width = 50;
    
    std::cout << "[";
    int pos = bar_width * progress;
    for (int i = 0; i < bar_width; ++i) {
        if (i < pos) std::cout << "=";
        else if (i == pos) std::cout << ">";
        else std::cout << " ";
    }
    std::cout << "] " << int(progress * 100.0) << "% ";
    std::cout << "(" << current << "/" << total << ")";
    
    if (!current_item.empty()) {
        // Обрезаем длинные URL для лучшего отображения
        std::string display_item = current_item;
        if (display_item.length() > 30) {
            display_item = display_item.substr(0, 27) + "...";
        }
        std::cout << " " << display_item;
    }
    std::cout << "\r";
    std::cout.flush();
}

void HtmlParser::show_final_summary(const std::vector<std::pair<std::string, std::string>>& results) const {
    std::cout << std::endl << std::endl;
    std::cout << "✓ All URLs processed successfully" << std::endl;
    std::cout << "Results summary:" << std::endl;
    
    size_t total_chars = 0;
    for (const auto& result : results) {
        total_chars += result.second.length();
        std::string name = result.first;
        if (name.length() > 40) {
            name = name.substr(0, 37) + "...";
        }
        std::cout << "  - " << std::left << std::setw(40) << name 
                  << " (" << result.second.length() << " chars)" << std::endl;
    }
    
    std::cout << "Total: " << results.size() << " items, " << total_chars << " characters" << std::endl;
}

std::vector<std::pair<std::string, std::string>> HtmlParser::parse_urls(const std::vector<std::string>& urls, bool show_progress) const {
    std::vector<std::pair<std::string, std::string>> results;
    
    if (show_progress) {
        std::cout << "Processing " << urls.size() << " URLs..." << std::endl;
    }
    
    for (size_t i = 0; i < urls.size(); ++i) {
        if (show_progress) {
            show_progress_bar(i + 1, urls.size(), urls[i]);
        }
        
        try {
            std::string parsed_content = parse_url(urls[i]);
            results.emplace_back(urls[i], parsed_content);
        } catch (const std::exception& e) {
            // В случае ошибки сохраняем сообщение об ошибке
            results.emplace_back(urls[i], "ERROR: " + std::string(e.what()));
        }
    }
    
    if (show_progress) {
        show_final_summary(results);
    }
    
    return results;
}

std::vector<std::pair<std::string, std::string>> HtmlParser::parse_files(const std::vector<std::string>& filenames, bool show_progress) const {
    std::vector<std::pair<std::string, std::string>> results;
    
    if (show_progress) {
        std::cout << "Processing " << filenames.size() << " files..." << std::endl;
    }
    
    for (size_t i = 0; i < filenames.size(); ++i) {
        if (show_progress) {
            show_progress_bar(i + 1, filenames.size(), filenames[i]);
        }
        
        try {
            std::string parsed_content = parse_file(filenames[i]);
            results.emplace_back(filenames[i], parsed_content);
        } catch (const std::exception& e) {
            results.emplace_back(filenames[i], "ERROR: " + std::string(e.what()));
        }
    }
    
    if (show_progress) {
        show_final_summary(results);
    }
    
    return results;
}

void HtmlParser::save_results(const std::vector<std::pair<std::string, std::string>>& results, 
                            const std::string& output_dir) const {
    // Создаем директорию если не существует
    std::filesystem::create_directories(output_dir);
    
    std::cout << "Saving results to: " << output_dir << "/" << std::endl;
    
    for (const auto& result : results) {
        // Создаем безопасное имя файла из URL
        std::string filename = result.first;
        
        // Заменяем недопустимые символы в имени файла
        for (char& c : filename) {
            if (c == '/' || c == '\\' || c == ':' || c == '*' || c == '?' || c == '"' || c == '<' || c == '>' || c == '|') {
                c = '_';
            }
        }
        
        // Обрезаем слишком длинные имена
        if (filename.length() > 100) {
            filename = filename.substr(0, 100);
        }
        
        std::string output_path = output_dir + "/" + filename + ".html";
        
        // Используем write_to_file вместо write_file
        write_to_file(output_path, result.second);
    }
    
    std::cout << "✓ Saved " << results.size() << " files" << std::endl;
}

// Остальные методы остаются без изменений
std::string HtmlParser::call_python_direct(const std::string& content) const {
    if (!Py_IsInitialized()) {
        throw std::runtime_error("Python interpreter not initialized");
    }
    
    PyObject *pModule = nullptr, *pFunc = nullptr, *pArgs = nullptr, *pValue = nullptr;
    
    try {
        // Import the python module
        pModule = PyImport_ImportModule("html_parser_python");
        if (pModule == nullptr) {
            PyErr_Print();
            throw std::runtime_error("Failed to import Python module");
        }
        
        // Get the direct parse function
        pFunc = PyObject_GetAttrString(pModule, "parse_html_direct");
        if (pFunc == nullptr || !PyCallable_Check(pFunc)) {
            Py_XDECREF(pFunc);
            Py_XDECREF(pModule);
            throw std::runtime_error("Failed to get Python function parse_html_direct");
        }
        
        // Prepare arguments - передаем контент напрямую
        pArgs = PyTuple_New(1);
        PyTuple_SetItem(pArgs, 0, PyUnicode_FromString(content.c_str()));
        
        // Call the function
        pValue = PyObject_CallObject(pFunc, pArgs);
        if (pValue == nullptr) {
            PyErr_Print();
            throw std::runtime_error("Python function call failed");
        }
        
        // Convert result to string
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
            // Try to convert to string representation
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
        
        // Cleanup
        Py_XDECREF(pValue);
        Py_XDECREF(pArgs);
        Py_XDECREF(pFunc);
        Py_XDECREF(pModule);
        
        return result;
        
    } catch (const std::exception& e) {
        // Cleanup on error
        Py_XDECREF(pValue);
        Py_XDECREF(pArgs);
        Py_XDECREF(pFunc);
        Py_XDECREF(pModule);
        throw;
    }
}

std::string HtmlParser::call_python_parser(const std::string& content, const std::string& parser_type) const {
    if (!Py_IsInitialized()) {
        throw std::runtime_error("Python interpreter not initialized");
    }
    
    PyObject *pModule = nullptr, *pFunc = nullptr, *pArgs = nullptr, *pValue = nullptr;
    
    try {
        // Import the python module
        pModule = PyImport_ImportModule("html_parser_python");
        if (pModule == nullptr) {
            PyErr_Print();
            throw std::runtime_error("Failed to import Python module");
        }
        
        // Get the parse function
        pFunc = PyObject_GetAttrString(pModule, "parse_input_data");
        if (pFunc == nullptr || !PyCallable_Check(pFunc)) {
            Py_XDECREF(pFunc);
            Py_XDECREF(pModule);
            throw std::runtime_error("Failed to get Python function parse_input_data");
        }
        
        // Prepare JSON arguments as string
        std::string json_input = R"({
            "type": ")" + parser_type + R"(",
            "content": ")" + content + R"(",
            "options": {
                "return_raw_html": false,
                "input_type": "content"
            }
        })";
        
        pArgs = PyTuple_New(1);
        PyTuple_SetItem(pArgs, 0, PyUnicode_FromString(json_input.c_str()));
        
        // Call the function
        pValue = PyObject_CallObject(pFunc, pArgs);
        if (pValue == nullptr) {
            PyErr_Print();
            throw std::runtime_error("Python function call failed");
        }
        
        // Convert result to string
        std::string result;
        if (PyUnicode_Check(pValue)) {
            PyObject* temp_bytes = PyUnicode_AsEncodedString(pValue, "UTF-8", "strict");
            if (temp_bytes != nullptr) {
                result = std::string(PyBytes_AS_STRING(temp_bytes));
                Py_DECREF(temp_bytes);
            }
        } else {
            // Try to convert to string representation
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
        
        // Cleanup
        Py_XDECREF(pValue);
        Py_XDECREF(pArgs);
        Py_XDECREF(pFunc);
        Py_XDECREF(pModule);
        
        return result;
        
    } catch (const std::exception& e) {
        // Cleanup on error
        Py_XDECREF(pValue);
        Py_XDECREF(pArgs);
        Py_XDECREF(pFunc);
        Py_XDECREF(pModule);
        throw;
    }
}

std::string HtmlParser::parse(const std::string& content) const {
    try {
        // Use direct Python parser for HTML content
        return call_python_direct(content);
    } catch (const std::exception& e) {
        return "Error: " + std::string(e.what());
    }
}

std::string HtmlParser::parse_file(const std::string& filename) const {
    try {
        std::string content = read_file(filename);
        return parse(content);
    } catch (const std::exception& e) {
        return "Error reading file: " + std::string(e.what());
    }
}

std::string HtmlParser::parse_url(const std::string& url) const {
    try {
        // Pass URL directly to Python parser
        return call_python_direct(url);
    } catch (const std::exception& e) {
        return "Error parsing URL: " + std::string(e.what());
    }
}
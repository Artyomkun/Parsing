#ifndef PYTHON_PARSER_H
#define PYTHON_PARSER_H

#include <string>

class PythonParser {
public:
    PythonParser();
    ~PythonParser();
    
    std::string parse(const std::string& content) const;
    std::string parse_file(const std::string& filename) const;
    
private:
    std::string call_python_function(const std::string& input_data) const;
    void initialize_python();
    void finalize_python();
    
    bool python_initialized_{false};
};

#endif // PYTHON_PARSER_H
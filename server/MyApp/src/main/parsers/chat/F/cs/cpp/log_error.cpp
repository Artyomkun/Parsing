#include "log_error.h"
#include <fstream>
#include <iostream>

void log_error(const std::string& message) {
    std::ofstream log_file("parser_errors.log", std::ios::app);
    log_file << "[" << __TIMESTAMP__ << "] " << message << std::endl;
    log_file.close();
    std::cerr << "ОШИБКА: " << message << std::endl;
}
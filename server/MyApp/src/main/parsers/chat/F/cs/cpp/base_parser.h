#pragma once
#include "parse_result.h"  // Включаем общее определение

class BaseParser {
public:
    virtual ~BaseParser() = default;
    virtual ParseResult parse(const std::string& input) = 0;
    virtual ParseResult parse_file(const std::string& file_path) = 0;
};
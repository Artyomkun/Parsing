#ifndef FILE_UTILS_H
#define FILE_UTILS_H

#include <string>
#include <nlohmann/json.hpp>
#include "parse_result.h"
#include "file_type.h"

std::string read_file(const std::string& file_path);
bool save_result(const ParseResult& result, const std::string& filename, const std::string& extension);
std::string read_file(const std::string& filename);
void write_to_file(const std::string& filename, const std::string& content);

#endif // FILE_UTILS_H
#ifndef UNIVERSAL_PARSER_H
#define UNIVERSAL_PARSER_H

#include <string>
#include <nlohmann/json.hpp>
#include "parse_result.h"

// Forward declarations
enum class FileType;
struct ParseResult;

class UniversalParser {
public:
    virtual ~UniversalParser() = default;
    virtual nlohmann::json parse(const std::string& content) const = 0;
    virtual nlohmann::json parse_file(const std::string& filename) const = 0;
};

FileType detect_file_type(const std::string& filename, const std::string& content, const std::string& mime_type);
std::string read_file(const std::string& file_path);
std::string download_url(const std::string& url, std::string& error);
ParseResult parse_content(const std::string& content, FileType type);
ParseResult parse_input(const std::string& input);

#endif // UNIVERSAL_PARSER_H
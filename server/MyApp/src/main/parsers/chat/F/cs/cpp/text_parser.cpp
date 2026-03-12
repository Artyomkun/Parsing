#include "text_parser.h"
#include "file_utils.h"
#include <nlohmann/json.hpp>
#include <stdexcept>

nlohmann::json TextParser::parse(const std::string& content) const {
    nlohmann::json result;
    try {
        result["type"] = "text";
        result["content"] = content;
    } catch (const std::exception& e) {
        result["error"] = "Text parsing error: " + std::string(e.what());
    }
    return result;
}

nlohmann::json TextParser::parse_file(const std::string& filename) const {
    nlohmann::json result;
    try {
        std::string content = read_file(filename);
        result = parse(content);
    } catch (const std::exception& e) {
        result["error"] = "Text file parsing error: " + std::string(e.what());
    }
    return result;
}
#include "json_parser.h"
#include "file_utils.h"
#include <nlohmann/json.hpp>

nlohmann::json JsonParser::parse(const std::string& content) const {
    try {
        return nlohmann::json::parse(content);
    } catch (const std::exception& e) {
        return {{"error", "Failed to parse JSON: " + std::string(e.what())}};
    }
}

nlohmann::json JsonParser::parse_file(const std::string& filename) const {
    try {
        std::string content = read_file(filename);
        return parse(content);
    } catch (const std::exception& e) {
        return {{"error", "Failed to parse JSON file: " + std::string(e.what())}};
    }
}
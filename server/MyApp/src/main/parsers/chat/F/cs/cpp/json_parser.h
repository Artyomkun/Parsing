#ifndef JSON_PARSER_H
#define JSON_PARSER_H

#include <nlohmann/json.hpp>
#include <string>
#include "universal_parser.h" // Include base class

class JsonParser : public UniversalParser {
public:
    nlohmann::json parse(const std::string& content) const override;
    nlohmann::json parse_file(const std::string& filename) const override;
};

#endif // JSON_PARSER_H
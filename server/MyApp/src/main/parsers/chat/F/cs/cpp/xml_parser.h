#ifndef XML_PARSER_H
#define XML_PARSER_H

#include <nlohmann/json.hpp>
#include <string>
#include "universal_parser.h" // Include base class

class XmlParser : public UniversalParser {
public:
    nlohmann::json parse(const std::string& content) const override;
    nlohmann::json parse_file(const std::string& filename) const override;
};

#endif // XML_PARSER_H
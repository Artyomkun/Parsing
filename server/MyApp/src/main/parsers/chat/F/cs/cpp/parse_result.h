#ifndef PARSE_RESULT_H
#define PARSE_RESULT_H

#include <nlohmann/json.hpp>
#include <string>

struct ParseResult {
    bool success;
    std::string error;
    nlohmann::json data;

    ParseResult() : success(false), error(""), data({}) {}
    ParseResult(bool success_, const std::string& error_, const nlohmann::json& data_)
        : success(success_), error(error_), data(data_) {}
};

#endif // PARSE_RESULT_H
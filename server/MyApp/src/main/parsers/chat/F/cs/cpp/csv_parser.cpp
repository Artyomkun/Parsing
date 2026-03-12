#include "csv_parser.h"
#include "file_utils.h"
#include <nlohmann/json.hpp>
#include <stdexcept>
#include <sstream>

nlohmann::json CsvParser::parse(const std::string& content) const {
    nlohmann::json result;
    try {
        std::stringstream ss(content);
        std::string line;
        std::vector<std::string> headers;
        std::vector<nlohmann::json> rows;
        bool first_line = true;

        while (std::getline(ss, line)) {
            std::vector<std::string> fields;
            std::stringstream ls(line);
            std::string field;
            while (std::getline(ls, field, ',')) {
                fields.push_back(field);
            }
            if (first_line) {
                headers = fields;
                first_line = false;
            } else {
                nlohmann::json row;
                for (size_t i = 0; i < fields.size() && i < headers.size(); ++i) {
                    row[headers[i]] = fields[i];
                }
                rows.push_back(row);
            }
        }
        result["type"] = "csv";
        result["data"] = rows;
    } catch (const std::exception& e) {
        result["error"] = "CSV parsing error: " + std::string(e.what());
    }
    return result;
}

nlohmann::json CsvParser::parse_file(const std::string& filename) const {
    nlohmann::json result;
    try {
        std::string content = read_file(filename);
        result = parse(content);
    } catch (const std::exception& e) {
        result["error"] = "CSV file parsing error: " + std::string(e.what());
    }
    return result;
}
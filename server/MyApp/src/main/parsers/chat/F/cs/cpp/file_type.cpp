#include "file_type.h"
#include <string>
#include <algorithm>

FileType detect_file_type(const std::string& filename, const std::string& content, const std::string& mime_type) {
    if (!mime_type.empty()) {
        if (mime_type.find("application/json") != std::string::npos) return FileType::JSON;
        if (mime_type.find("application/xml") != std::string::npos || mime_type.find("text/xml") != std::string::npos) return FileType::XML;
        if (mime_type.find("text/csv") != std::string::npos) return FileType::CSV;
        if (mime_type.find("text/html") != std::string::npos) return FileType::HTML;
        if (mime_type.find("text/plain") != std::string::npos) return FileType::TEXT;
    }

    if (!content.empty()) {
        if (content[0] == '{' || content[0] == '[') return FileType::JSON;
        if (content.find("<?xml") != std::string::npos) return FileType::XML;
        if (content.find("<html") != std::string::npos || content.find("<!DOCTYPE html") != std::string::npos) return FileType::HTML;
        if (content.find(",") != std::string::npos) return FileType::CSV;
    }

    std::string ext = filename.substr(filename.find_last_of(".") + 1);
    std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c) { return std::tolower(c); });
    if (ext == "json") return FileType::JSON;
    if (ext == "xml") return FileType::XML;
    if (ext == "csv") return FileType::CSV;
    if (ext == "html" || ext == "htm") return FileType::HTML;
    if (ext == "txt") return FileType::TEXT;

    return FileType::UNKNOWN;
}
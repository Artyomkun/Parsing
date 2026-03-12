#include "universal_parser.h"
#include "python_parser.h"
#include "json_parser.h"
#include "csv_parser.h"
#include "xml_parser.h"
#include "text_parser.h"
#include "file_type.h"
#include "log_error.h"
#include <nlohmann/json.hpp>
#include <curl/curl.h>
#include <stdexcept>
#include <fstream>
#include <iostream>

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

std::string download_url(const std::string& url, std::string& error) {
    std::cout << "Downloading URL: " << url << std::endl;
    CURL* curl;
    CURLcode res;
    std::string read_buffer;

    curl = curl_easy_init();
    if (!curl) {
        error = "Failed to initialize curl";
        log_error(error);
        return "";
    }

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    headers = curl_slist_append(headers, "Accept-Language: en-US,en;q=0.9");
    headers = curl_slist_append(headers, "Connection: keep-alive");
    headers = curl_slist_append(headers, "Upgrade-Insecure-Requests: 1");
    headers = curl_slist_append(headers, "Cache-Control: no-cache");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &read_buffer);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36");

    res = curl_easy_perform(curl);
    if (res != CURLE_OK) {
        error = "curl_easy_perform() failed: " + std::string(curl_easy_strerror(res));
        log_error(error);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        return "";
    }

    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    if (http_code != 200) {
        error = "HTTP request failed with status code: " + std::to_string(http_code);
        log_error(error);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        return "";
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    std::cout << "Downloaded content length: " << read_buffer.size() << " bytes" << std::endl;
    return read_buffer;
}

ParseResult parse_content(const std::string& content, FileType type) {
    ParseResult result;
    try {
        std::cout << "Parsing content of type: " << static_cast<int>(type) << std::endl;
        switch (type) {
            case FileType::JSON: {
                JsonParser parser;
                result = ParseResult(true, "", parser.parse(content));
                break;
            }
            case FileType::XML: {
                XmlParser parser;
                result = ParseResult(true, "", parser.parse(content));
                break;
            }
            case FileType::CSV: {
                CsvParser parser;
                result = ParseResult(true, "", parser.parse(content));
                break;
            }
            case FileType::HTML: {
                PythonParser parser;
                result = ParseResult(true, "", parser.parse(content));
                break;
            }
            case FileType::TEXT: {
                TextParser parser;
                result = ParseResult(true, "", parser.parse(content));
                break;
            }
            default:
                result = ParseResult(false, "Unknown file type", {});
        }
    } catch (const std::exception& e) {
        std::string error = "Parsing error: " + std::string(e.what());
        log_error(error);
        result = ParseResult(false, error, {});
    }
    return result;
}

ParseResult parse_input(const std::string& input) {
    std::cout << "Parsing input: " << input << std::endl;
    std::string error;
    if (input.find("http://") == 0 || input.find("https://") == 0) {
        std::string content = download_url(input, error);
        if (!error.empty()) {
            log_error("Download failed: " + error);
            return ParseResult(false, error, {});
        }
        FileType type = detect_file_type(input, content, "");
        std::cout << "Detected file type: " << static_cast<int>(type) << std::endl;
        return parse_content(content, type);
    } else {
        std::string content;
        try {
            content = read_file(input);
            std::cout << "Read file content length: " << content.size() << " bytes" << std::endl;
        } catch (const std::exception& e) {
            std::string error = "File read error: " + std::string(e.what());
            log_error(error);
            return ParseResult(false, error, {});
        }
        FileType type = detect_file_type(input, content, "");
        std::cout << "Detected file type: " << static_cast<int>(type) << std::endl;
        return parse_content(content, type);
    }
}
#include "universal_parser.h"
#include <nlohmann/json.hpp>
#include <iostream>

int main(int argc, char* argv[]) {
    std::cout << "Number of arguments: " << argc << std::endl;
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <file_path_or_url>" << std::endl;
        return 1;
    }

    std::string input = argv[1];
    std::cout << "Starting parsing for: " << input << std::endl;
    try {
        ParseResult result = parse_input(input);
        if (result.success) {
            std::cout << "Parsed successfully: " << result.data.dump(4) << std::endl;
        } else {
            std::cerr << "Error: " << result.error << std::endl;
        }
        return result.success ? 0 : 1;
    } catch (const std::exception& e) {
        std::cerr << "Unexpected error: " << e.what() << std::endl;
        return 1;
    }
}
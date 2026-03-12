#ifndef HTML_PARSER_H
#define HTML_PARSER_H

#include <string>
#include <vector>
#include <utility>

class HtmlParser {
public:
    HtmlParser();
    ~HtmlParser();

    // Основные методы парсинга
    std::string parse(const std::string& content) const;
    std::string parse_file(const std::string& filename) const;
    std::string parse_url(const std::string& url) const;
    
    // Новые методы для множественной обработки
    std::vector<std::pair<std::string, std::string>> parse_urls(const std::vector<std::string>& urls, bool show_progress = true) const;
    std::vector<std::pair<std::string, std::string>> parse_files(const std::vector<std::string>& filenames, bool show_progress = true) const;
    
    // Метод для сохранения результатов
    void save_results(const std::vector<std::pair<std::string, std::string>>& results, 
                     const std::string& output_dir = "output") const;

private:
    void initialize_python();
    void finalize_python();
    std::string call_python_direct(const std::string& content) const;
    std::string call_python_parser(const std::string& content, const std::string& parser_type) const;
    
    // Методы для прогресс-бара
    void show_progress_bar(size_t current, size_t total, const std::string& current_item = "") const;
    void show_final_summary(const std::vector<std::pair<std::string, std::string>>& results) const;
    
    bool python_initialized_ = false;
};

#endif
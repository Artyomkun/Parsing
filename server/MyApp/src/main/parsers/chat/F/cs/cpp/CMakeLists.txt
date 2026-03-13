cmake_minimum_required(VERSION 3.16)
set(CMAKE_TOOLCHAIN_FILE "D:/Parsing-main/server/MyApp/src/main/parsers/cpp/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")
project(Parsers)

set(CMAKE_PREFIX_PATH "${CMAKE_PREFIX_PATH};D:/Parsing-main/server/MyApp/src/main/parsers/cpp/vcpkg/installed/x64-windows")
set(nlohmann_json_DIR "D:/Parsing-main/server/MyApp/src/main/parsers/cpp/vcpkg/installed/x64-windows/share/nlohmann_json" CACHE PATH "Path to nlohmann_json config")
set(CURL_DIR "D:/Parsing-main/server/MyApp/src/main/parsers/cpp/vcpkg/installed/x64-windows/share/curl" CACHE PATH "Path to CURL config")

find_package(nlohmann_json CONFIG REQUIRED)
find_package(CURL CONFIG REQUIRED)

# Указываем пути к Python 3.13 из C:\Python313
set(Python3_ROOT_DIR "C:/Python313")
set(Python3_EXECUTABLE "C:/Python313/DLLs/python.exe")
set(Python3_LIBRARY "C:/Python313/libs/python313.lib")
set(Python3_INCLUDE_DIR "C:/Python313/include")
set(Python3_DLL "C:/Python313/DLLs/python313.dll") # Путь к python313.dll

find_package(Python3 COMPONENTS Interpreter Development REQUIRED)

add_executable(parsers
    main.cpp
    universal_parser.cpp
    text_parser.cpp
    json_parser.cpp
    csv_parser.cpp
    xml_parser.cpp
    python_parser.cpp
    html_parser.cpp
    file_utils.cpp
    file_type.cpp
    log_error.cpp # Добавляем новый файл
)

target_include_directories(parsers PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}
    "D:/Parsing-main/server/MyApp/src/main/parsers/cpp/vcpkg/installed/x64-windows/include"
    ${Python3_INCLUDE_DIRS}
)

target_link_libraries(parsers PRIVATE 
    nlohmann_json::nlohmann_json 
    Python3::Python 
    CURL::libcurl
)

# Копируем python313.dll в папку с исполняемым файлом
if(EXISTS "${Python3_DLL}")
    add_custom_command(TARGET parsers POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${Python3_DLL}" $<TARGET_FILE_DIR:parsers>
        COMMENT "Копирование python313.dll в папку с исполняемым файлом"
    )
else()
    message(FATAL_ERROR "python313.dll не найден по пути: ${Python3_DLL}")
endif()

target_compile_definitions(parsers PRIVATE HAVE_PYTHON)
set_property(TARGET parsers PROPERTY CXX_STANDARD 17)
#!/bin/bash

echo "🚀 Starting 5D AI System..."
echo "📊 Version: $(cat version.properties | grep version= | cut -d'=' -f2)"
echo "👤 Author: $(cat version.properties | grep author= | cut -d'=' -f2)"
echo ""

# Проверяем наличие Java
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 11 or higher."
    exit 1
fi

# Проверяем версию Java
JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | sed 's/^1\.//' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt "11" ]; then
    echo "❌ Java 11 or higher required. Current version: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java version: $(java -version 2>&1 | head -n1)"

# Компилируем Kotlin код
echo "🔨 Compiling Kotlin code..."
if [ -f "AI.kt" ]; then
    kotlin AI.kt -d . -cp "lib/*"
else
    echo "❌ Main AI.kt file not found"
    exit 1
fi

# Проверяем успешность компиляции
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful"

    # Создаем необходимые директории
    mkdir -p ai_components/download logs data

    echo "🎯 Starting 5D AI System..."
    echo "🌐 Web interface will be available at: http://localhost:8080"
    echo "📁 Components directory: ai_components/"
    echo "🔧 Configuration: version.properties"
    echo ""
    echo "Features:"
    echo "  🎨 5D Neural Network Visualization"
    echo "  🤖 Multi-dimensional AI Analysis"
    echo "  🔄 Real-time Component Updates"
    echo "  📊 Performance Monitoring"
    echo "  🔗 Web Search Integration"
    echo ""
    echo "Press Ctrl+C to stop the system"
    echo ""

    # Запускаем AI систему
    java -cp ".:lib/*" AIKt
else
    echo "❌ Compilation failed"
    exit 1
fi

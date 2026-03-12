#!/bin/bash

echo "🧠 Starting High Performance Neural Server..."
echo "🚀 This server can handle massive neural networks"
echo "📊 Capacity: 50+ concurrent connections"
echo "🎯 Port: 8080"
echo ""

# Проверяем наличие Kotlin
if ! command -v kotlin &> /dev/null; then
    echo "❌ Kotlin not found. Please install Kotlin first."
    exit 1
fi

# Проверяем наличие Java
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 11 or higher."
    exit 1
fi

echo "✅ Dependencies check passed"

# Компилируем высокопроизводительный сервер
echo "🔨 Compiling HighPerformanceServer.kt..."
kotlin HighPerformanceServer.kt -d . -cp "lib/*"

if [ $? -eq 0 ]; then
    echo "✅ High Performance Server compiled successfully"

    # Создаем необходимые директории
    mkdir -p neural_data logs performance_data

    echo "🎯 Starting Neural Server..."
    echo "🌐 Server URL: http://localhost:8080"
    echo "📊 API Endpoints:"
    echo "  🔗 /neural/state  - Get neural network state"
    echo "  🔗 /neural/add    - Add neurons to network"
    echo "  🔗 /neural/process - Process neural network"
    echo "  🔗 /stats        - Get server statistics"
    echo "  🔗 /health       - Health check"
    echo ""
    echo "Features:"
    echo "  🧠 Handles 10,000+ neurons"
    echo "  ⚡ 50 concurrent threads"
    echo "  📊 Real-time performance monitoring"
    echo "  🔄 Automatic neural processing"
    echo "  💾 Massive data processing"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Запускаем высокопроизводительный сервер
    kotlin HighPerformanceNeuralServerKt
else
    echo "❌ Compilation failed"
    exit 1
fi

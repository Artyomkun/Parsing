#!/bin/bash

echo "🚀 Starting 5D AI Update Server..."
echo "📡 Server will be available at: http://localhost:8080"

# Проверяем наличие Kotlin
if ! command -v kotlin &> /dev/null; then
    echo "❌ Kotlin not found. Please install Kotlin first."
    exit 1
fi

# Компилируем сервер обновлений
echo "🔨 Compiling UpdateServer.kt..."
kotlin UpdateServer.kt -d .

# Проверяем успешность компиляции
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful"

    # Создаем папку для скачивания обновлений
    mkdir -p download

    echo "🎯 Starting server..."
    echo "📖 Your AI system will connect to: http://localhost:8080"
    echo "🔗 Example API endpoint: http://localhost:8080/updates"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Запускаем сервер
    kotlin UpdateServerKt
else
    echo "❌ Compilation failed"
    exit 1
fi

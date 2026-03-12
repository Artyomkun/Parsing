#!/bin/bash

echo "🚀 Starting Complete 5D AI Ecosystem..."
echo "🧠 High Performance Neural Server + 5D AI System"
echo ""

# Проверяем зависимости
echo "🔍 Checking dependencies..."

if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 11+"
    exit 1
fi

if ! command -v kotlin &> /dev/null; then
    echo "❌ Kotlin not found. Please install Kotlin 1.7+"
    exit 1
fi

echo "✅ All dependencies found"

# Создаем необходимые директории
echo "📁 Creating directories..."
mkdir -p ai_components neural_data logs performance_data download

# Компилируем все компоненты
echo "🔨 Compiling all components..."

echo "  🔧 Compiling High Performance Server..."
kotlin HighPerformanceServer.kt -d . -cp "lib/*"

echo "  🔧 Compiling Update Server..."
kotlin UpdateServer.kt -d . -cp "lib/*"

echo "  🔧 Compiling Main AI System..."
kotlin AI.kt -d . -cp "lib/*"

echo "✅ All components compiled successfully"

# Запускаем серверы в фоновом режиме
echo "🎯 Starting servers..."

echo "  🌐 Starting High Performance Neural Server (Port 8080)..."
kotlin HighPerformanceNeuralServerKt > logs/neural_server.log 2>&1 &
NEURAL_SERVER_PID=$!
echo "    ✅ Started with PID: $NEURAL_SERVER_PID"

echo "  📡 Starting Update Server (Port 8081)..."
kotlin UpdateServerKt > logs/update_server.log 2>&1 &
UPDATE_SERVER_PID=$!
echo "    ✅ Started with PID: $UPDATE_SERVER_PID"

echo ""
echo "🎉 All servers started successfully!"
echo ""
echo "📊 System Information:"
echo "  🧠 Neural Server: http://localhost:8080"
echo "  📡 Update Server: http://localhost:8081"
echo "  🤖 AI System: http://localhost:8080"
echo ""
echo "📁 Component Directory: ai_components/"
echo "📋 Version: $(cat version.properties | grep version= | cut -d'=' -f2)"
echo ""
echo "🔧 Available Operations:"
echo "  🎨 Neural Network Visualization"
echo "  🤖 5D AI Analysis"
echo "  🔄 Real-time Updates"
echo "  📊 Performance Monitoring"
echo "  💾 Massive Data Processing"
echo ""
echo "📝 Logs:"
echo "  📄 Neural Server: logs/neural_server.log"
echo "  📄 Update Server: logs/update_server.log"
echo "  📄 System Logs: logs/system.log"
echo ""
echo "⚠️  Press Ctrl+C to stop all systems"
echo ""

# Ожидаем завершения работы
wait $NEURAL_SERVER_PID $UPDATE_SERVER_PID

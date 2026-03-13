FROM openjdk:17-jdk-slim

WORKDIR /app

# Копируем Gradle wrapper и кэш
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Копируем исходный код
COPY src/ src/
COPY modules/ modules/

# Даем права на выполнение gradlew
RUN chmod +x ./gradlew

# Собираем приложение
RUN ./gradlew build

# Запускаем приложение
CMD ["./gradlew", "run"]
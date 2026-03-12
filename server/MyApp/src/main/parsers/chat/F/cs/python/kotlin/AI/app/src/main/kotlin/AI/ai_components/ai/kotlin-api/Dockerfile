FROM openjdk:17-jdk-slim

WORKDIR /app

COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle.kts .
COPY settings.gradle.kts .

COPY src/ src/
COPY modules/ modules/

RUN chmod +x ./gradlew

RUN ./gradlew build

CMD ["./gradlew", "run"]
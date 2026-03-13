package AI.ML.AIModels.Data.Training
import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import kotlin.system.exitProcess
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.Path
import java.time.Instant
import mu.KotlinLogging
import java.io.File

val logger = KotlinLogging.logger {}

object TrainingDataFixer {

    val mapper: ObjectMapper = ObjectMapper().registerModule(KotlinModule())

    @JvmStatic
    fun fixTrainingData(dataDir: Path = defaultDataDir(), minValidFiles: Int = 10): Boolean {
        val dirFile = dataDir.toFile()
        if (!dirFile.exists() || !dirFile.isDirectory) {
            logger.error { "Директория данных не найдена: $dataDir" }
            return false
        }

        val trainingFiles = dirFile.listFiles { f -> 
            f.isFile && f.name.startsWith("training_") && f.name.endsWith(".json") 
        }?.toList() ?: emptyList()

        if (trainingFiles.isEmpty()) {
            logger.error { "Нет тренировочных файлов!" }
            return false
        }

        logger.info { "Найдено ${trainingFiles.size} тренировочных файлов" }

        var validFiles = 0
        var fixedFiles = 0
        var corruptedFiles = 0

        for (file in trainingFiles) {
            try {
                val data: Map<String, Any?> = mapper.readValue(file, object : TypeReference<Map<String, Any?>>() {})
                if (data !is Map<*, *>) {
                    logger.warn { "Файл ${file.name}: неверный формат (не словарь)" }
                    corruptedFiles++
                    continue
                }

                val requiredFields = listOf("timestamp", "source_url", "content_type", "data")
                val missingFields = requiredFields.filter { !data.containsKey(it) }

                if (missingFields.isNotEmpty()) {
                    logger.warn { "Файл ${file.name}: отсутствуют поля $missingFields" }
                    val fixed = fixMissingFields(data.toMutableMap(), file.name)
                    if (fixed != null) {
                        mapper.writerWithDefaultPrettyPrinter().writeValue(file, fixed)
                        fixedFiles++
                        logger.info { "Файл ${file.name}: исправлен" }
                        validFiles++
                    } else {
                        corruptedFiles++
                    }
                    continue
                }

                val contentData = (data["data"] as? Map<*, *>)?.mapKeys { it.key.toString() } ?: emptyMap<String, Any?>()
                if (contentData.isEmpty()) {
                    logger.warn { "Файл ${file.name}: нет данных в поле 'data'" }
                    corruptedFiles++
                    continue
                }

                val textContent = extractTextContent(contentData)
                if (textContent.isBlank() || textContent.trim().length < 50) {
                    logger.warn { "Файл ${file.name}: недостаточно текстового контента" }
                    corruptedFiles++
                    continue
                }

                validFiles++
            } catch (ex: Exception) {
                logger.error(ex) { "Ошибка обработки файла ${file.name}" }
                corruptedFiles++
            }
        }

        logger.info { "РЕЗУЛЬТАТЫ ПРОВЕРКИ:" }
        logger.info { "  Валидных файлов: $validFiles/${trainingFiles.size}" }
        logger.info { "  Исправленных файлов: $fixedFiles" }
        logger.info { "  Поврежденных файлов: $corruptedFiles" }

        val success = validFiles >= minValidFiles
        if (success) {
            logger.info { "Проверка пройдена: достаточно валидных файлов ($validFiles >= $minValidFiles)" }
        } else {
            logger.warn { "Проверка не пройдена: недостаточно валидных файлов ($validFiles < $minValidFiles)" }
        }

        return success
    }

    fun extractTextContent(data: Map<String, Any?>): String {
        val parts = mutableListOf<String>()

        (data["title"] as? String)?.takeIf { it.isNotBlank() }?.let { parts.add(it) }
        (data["meta_description"] as? String)?.takeIf { it.isNotBlank() }?.let { parts.add(it) }

        val headings = (data["headings"] as? List<*>) ?: emptyList<Any?>()
        for (h in headings.take(10)) {
            if (h is Map<*, *> && h["text"] is String) {
                (h["text"] as String).takeIf { it.isNotBlank() }?.let { parts.add(it) }
            }
        }

        val paragraphs = (data["paragraphs"] as? List<*>) ?: emptyList<Any?>()
        for (p in paragraphs.take(5)) {
            if (p != null) parts.add(p.toString())
        }

        return parts.joinToString(" ")
    }

    fun fixMissingFields(data: MutableMap<String, Any?>, filename: String): Map<String, Any?>? {
        try {
            if (!data.containsKey("timestamp") || (data["timestamp"] == null)) {
                data["timestamp"] = Instant.now().epochSecond
            }

            if (!data.containsKey("source_url") || (data["source_url"] == null) || (data["source_url"].toString().isBlank())) {
                data["source_url"] = "unknown_${kotlin.math.abs(filename.hashCode()) % 10000}"
            }

            if (!data.containsKey("content_type") || (data["content_type"] == null) || (data["content_type"].toString().isBlank())) {
                val contentData = (data["data"] as? Map<*, *>)?.mapKeys { it.key.toString() } ?: emptyMap<String, Any?>()
                val text = extractTextContent(contentData).lowercase()

                val contentType = when {
                    listOf("новости", "news", "события").any { it in text } -> "news"
                    listOf("купить", "цена", "товар").any { it in text } -> "ecommerce"
                    listOf("блог", "статья", "автор").any { it in text } -> "blog"
                    listOf("технич", "программир", "код").any { it in text } -> "technical"
                    else -> "general"
                }
                data["content_type"] = contentType
            }

            if (!data.containsKey("data") || data["data"] == null) {
                data["data"] = emptyMap<String, Any?>()
            }

            return data
        } catch (ex: Exception) {
            logger.error(ex) { "Ошибка при исправлении файла $filename" }
            return null
        }
    }

    fun createSampleTrainingData(dataDir: Path = defaultDataDir(), numberOfSamples: Int = 5) {
        Files.createDirectories(dataDir)

        val sampleData = listOf(
            mapOf(
                "content_type" to "news",
                "data" to mapOf(
                    "title" to "Важные новости политики и экономики",
                    "meta_description" to "Свежие новости о событиях в мире политики и экономики сегодня",
                    "headings" to listOf(
                        mapOf("level" to 1, "text" to "Главные новости дня"), 
                        mapOf("level" to 2, "text" to "Политические события")
                    ),
                    "paragraphs" to listOf(
                        "Сегодня произошли важные события в политической жизни страны.",
                        "Эксперты анализируют последние изменения в экономической политике.",
                        "Международные отношения продолжают развиваться стремительными темпами."
                    )
                )
            ),
            mapOf(
                "content_type" to "ecommerce",
                "data" to mapOf(
                    "title" to "Интернет-магазин электроники - лучшие цены",
                    "meta_description" to "Купить электронику по выгодным ценам с доставкой",
                    "headings" to listOf(
                        mapOf("level" to 1, "text" to "Популярные товары"), 
                        mapOf("level" to 2, "text" to "Скидки и акции")
                    ),
                    "paragraphs" to listOf(
                        "В нашем магазине вы найдете широкий выбор электроники.",
                        "Специальные предложения и скидки для постоянных клиентов.",
                        "Быстрая доставка по всей стране."
                    )
                )
            ),
            mapOf(
                "content_type" to "blog",
                "data" to mapOf(
                    "title" to "Личный блог о путешествиях и приключениях",
                    "meta_description" to "Истории из путешествий по разным странам мира",
                    "headings" to listOf(
                        mapOf("level" to 1, "text" to "Мое последнее путешествие"), 
                        mapOf("level" to 2, "text" to "Впечатления и открытия")
                    ),
                    "paragraphs" to listOf(
                        "В этом году мне удалось посетить несколько удивительных стран.",
                        "Каждое путешествие приносит новые знания и опыт.",
                        "Путешествия помогают лучше понимать мир и себя."
                    )
                )
            ),
            mapOf(
                "content_type" to "technical",
                "data" to mapOf(
                    "title" to "Руководство по программированию на Kotlin",
                    "meta_description" to "Основы программирования на языке Kotlin для начинающих",
                    "headings" to listOf(
                        mapOf("level" to 1, "text" to "Введение в Kotlin"), 
                        mapOf("level" to 2, "text" to "Основные концепции")
                    ),
                    "paragraphs" to listOf(
                        "Kotlin - современный язык программирования для JVM.",
                        "Язык сочетает в себе простоту и выразительность.",
                        "Kotlin полностью совместим с Java и может использоваться в любых проектах."
                    )
                )
            ),
            mapOf(
                "content_type" to "general",
                "data" to mapOf(
                    "title" to "Общая информация о различных темах",
                    "meta_description" to "Разнообразная информация на разные темы",
                    "headings" to listOf(
                        mapOf("level" to 1, "text" to "Разнообразие информации"), 
                        mapOf("level" to 2, "text" to "Интересные факты")
                    ),
                    "paragraphs" to listOf(
                        "В современном мире информация играет ключевую роль.",
                        "Доступ к качественной информации помогает принимать правильные решения.",
                        "Образование и саморазвитие важны для личного роста."
                    )
                )
            )
        )

        val now = Instant.now().epochSecond
        sampleData.take(numberOfSamples).forEachIndexed { i, entry ->
            val filename = "training_sample_$i.json"
            val file = dataDir.resolve(filename).toFile()
            val out = mapOf(
                "timestamp" to now,
                "source_url" to "sample_$i",
                "content_type" to (entry["content_type"] ?: "general"),
                "data" to (entry["data"] ?: emptyMap<String, Any?>())
            )
            mapper.writerWithDefaultPrettyPrinter().writeValue(file, out)
            logger.info { "Создан образцовый файл: $filename" }
        }

        logger.info { "Создано ${sampleData.take(numberOfSamples).size} образцовых файлов данных" }
    }

    fun analyzeTrainingData(dataDir: Path = defaultDataDir()): Map<String, Any> {
        val dirFile = dataDir.toFile()
        if (!dirFile.exists() || !dirFile.isDirectory) {
            return mapOf("error" to "Директория не найдена")
        }

        val trainingFiles = dirFile.listFiles { f -> 
            f.isFile && f.name.startsWith("training_") && f.name.endsWith(".json") 
        }?.toList() ?: emptyList()

        val contentTypeDistribution = mutableMapOf<String, Int>()
        var totalTextLength = 0
        var validFiles = 0

        trainingFiles.forEach { file ->
            try {
                val data: Map<String, Any?> = mapper.readValue(file, object : TypeReference<Map<String, Any?>>() {})
                val contentType = data["content_type"] as? String ?: "unknown"
                contentTypeDistribution[contentType] = contentTypeDistribution.getOrDefault(contentType, 0) + 1

                val contentData = (data["data"] as? Map<*, *>) ?: emptyMap<Any, Any>()
                val textContent = extractTextContent(contentData.mapKeys { it.key.toString() })
                totalTextLength += textContent.length
                validFiles++
            } catch (ex: Exception) {
                // Пропускаем невалидные файлы
            }
        }

        return mapOf(
            "total_files" to trainingFiles.size,
            "valid_files" to validFiles,
            "content_type_distribution" to contentTypeDistribution,
            "average_text_length" to if (validFiles > 0) totalTextLength / validFiles else 0
        )
    }

    private fun defaultDataDir(): Path {
        val env = System.getenv("TRAINING_DATA_DIR")
        return if (!env.isNullOrBlank()) {
            Paths.get(env)
        } else {
            Paths.get(System.getProperty("user.dir"), "AI", "data")
        }
    }
}

fun main() {
    println("ИСПРАВЛЕНИЕ ТРЕНИРОВОЧНЫХ ДАННЫХ")
    println("=".repeat(50))

    val defaultDir = Paths.get(System.getProperty("user.dir"), "AI", "data")

    val dir = defaultDir.toFile()
    val trainingFiles = dir.listFiles { f -> 
        f.isFile && f.name.startsWith("training_") && f.name.endsWith(".json") 
    }?.toList() ?: emptyList()

    if (trainingFiles.isEmpty()) {
        println("Нет тренировочных данных. Создаем образцы...")
        TrainingDataFixer.createSampleTrainingData()
    } else {
        println("Проверяем и исправляем существующие данные...")
        val analysis = TrainingDataFixer.analyzeTrainingData()
        println("АНАЛИЗ ДАННЫХ:")
        println("  Всего файлов: ${analysis["total_files"]}")
        println("  Валидных файлов: ${analysis["valid_files"]}")
        println("  Распределение по типам: ${analysis["content_type_distribution"]}")
        println("  Средняя длина текста: ${analysis["average_text_length"]} символов")
        
        val ok = TrainingDataFixer.fixTrainingData()
        if (!ok) {
            println("ВНИМАНИЕ: Меньше требуемого количества валидных файлов или произошли ошибки.")
        }
    }

    println("Готово!")
    println("Для запуска используйте: gradle run -PmainClass=AI.ML.AIModels.Data.Training.TrainingDataFixerKt")
}
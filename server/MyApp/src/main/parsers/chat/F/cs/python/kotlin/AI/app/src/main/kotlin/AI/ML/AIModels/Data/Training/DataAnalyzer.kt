package AI.ML.AIModels.Data.Training

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.Data.Training.*
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlin.math.roundToInt
import mu.KotlinLogging
import java.io.File
import tornadofx.*

class DataAnalyzer(private val dataDir: String = Config.DATA_DIR) {
    
    private val logger = KotlinLogging.logger {}
    
    init {
        logger.info { "DataAnalyzer initialized with directory: $dataDir" }
    }
    
    fun getStats(): DataStats {
        val trainingFiles = getTrainingFiles()
        
        if (trainingFiles.isEmpty()) {
            return DataStats(
                totalSamples = 0,
                contentTypes = emptyMap(),
                fileCount = 0,
                dataQuality = "no_data"
            )
        }
        
        val contentTypes = mutableMapOf<String, Int>()
        var totalTextLength = 0L
        var sampleCount = 0
        
        trainingFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())  // ← TrainingData → Data
                val contentType = data.contentType
                contentTypes[contentType] = contentTypes.getOrDefault(contentType, 0) + 1
                val textLength = calculateTextLength(data)
                totalTextLength += textLength
                sampleCount++
                
            } catch (e: Exception) {
                logger.warn { "Error analyzing file ${file.name}: ${e.message}" }
            }
        }

        val avgTextLength = if (sampleCount > 0) totalTextLength / sampleCount else 0
        val dataQuality = assessDataQuality(avgTextLength, contentTypes.size)
        
        return DataStats(
            totalSamples = sampleCount,
            contentTypes = contentTypes,
            fileCount = trainingFiles.size,
            averageTextLength = avgTextLength,
            dataQuality = dataQuality,
            classBalance = assessClassBalance(contentTypes)
        )
    }
    
    fun analyzeContentTypes(): ContentTypeAnalysis {
        val stats = getStats()
        
        val recommendations = mutableListOf<String>()
        val totalSamples = stats.totalSamples
        if (totalSamples < 10) {
            recommendations.add("Собрать больше данных (минимум 10 samples)")
        }
        
        if (stats.classBalance == "unbalanced") {
            recommendations.add("Данные несбалансированы - добавить samples для редких классов")
        }
        
        if (stats.dataQuality == "poor") {
            recommendations.add("Качество данных низкое - проверить источники")
        }
        
        if (stats.contentTypes.size < 3) {
            recommendations.add("Добавить больше разнообразных типов контента")
        }
        
        return ContentTypeAnalysis(
            totalSamples = stats.totalSamples,
            contentTypeDistribution = stats.contentTypes,
            classBalanceAssessment = stats.classBalance,
            recommendations = recommendations
        )
    }

    fun exportToRecords(): List<DataRecord> {
        val trainingFiles = getTrainingFiles()
        val records = mutableListOf<DataRecord>()
        
        trainingFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())
                
                val record = DataRecord(
                    sourceUrl = data.sourceUrl,
                    timestamp = data.timestamp,
                    contentType = data.contentType,
                    title = data.data.title,
                    metaDescription = data.data.paragraphs.firstOrNull() ?: "",
                    headingCount = data.data.headings.size,
                    paragraphCount = data.data.paragraphs.size,
                    totalTextLength = calculateTextLength(data)
                )
                
                records.add(record)
                
            } catch (e: Exception) {
                logger.warn { "Error exporting file ${file.name}: ${e.message}" }
            }
        }
        
        return records
    }
    
    fun findDataGaps(): List<String> {
        val stats = getStats()
        val contentTypes = stats.contentTypes
        val totalSamples = stats.totalSamples
        
        val gaps = mutableListOf<String>()
        if (totalSamples < 10) {
            gaps.add("Недостаточно данных: $totalSamples samples (нужно минимум 10)")
        }
        if (contentTypes.size < 3) {
            gaps.add("Мало разнообразия: только ${contentTypes.size} типов контента")
        }
        if (contentTypes.isNotEmpty()) {
            val maxCount = contentTypes.values.max()
            val minCount = contentTypes.values.min()
            if (minCount == 0) {
                gaps.add("Есть классы без samples")
            } else if (maxCount.toDouble() / minCount > 5) {
                gaps.add("Сильный дисбаланс классов")
            }
        }
        if (stats.averageTextLength < 100) {
            gaps.add("Средняя длина текста мала: ${stats.averageTextLength} символов")
        }
        
        return gaps
    }

    fun getDetailedStats(): Map<String, TypeStats> {
        val trainingFiles = getTrainingFiles()
        val typeStats = mutableMapOf<String, MutableList<Long>>()
        
        trainingFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())  // ← TrainingData → Data
                val contentType = data.contentType
                val textLength = calculateTextLength(data)
                
                if (!typeStats.containsKey(contentType)) {
                    typeStats[contentType] = mutableListOf()
                }
                typeStats[contentType]?.add(textLength)
                
            } catch (e: Exception) {
                logger.warn { "Error analyzing file ${file.name}: ${e.message}" }
            }
        }
        
        return typeStats.mapValues { (_, lengths) ->
            TypeStats(
                count = lengths.size,
                avgTextLength = lengths.average().toLong(),
                minTextLength = lengths.min(),
                maxTextLength = lengths.max(),
                totalTextLength = lengths.sum()
            )
        }
    }
    
    fun generateReport(): String {
        val stats = getStats()
        val gaps = findDataGaps()
        val detailedStats = getDetailedStats()
        
        return buildString {
            appendLine("ОТЧЕТ ПО ТРЕНИРОВОЧНЫМ ДАННЫМ")
            appendLine("=".repeat(50))
            appendLine("Общая статистика:")
            appendLine("   • Всего samples: ${stats.totalSamples}")
            appendLine("   • Файлов: ${stats.fileCount}")
            appendLine("   • Средняя длина текста: ${stats.averageTextLength} символов")
            appendLine("   • Качество данных: ${stats.dataQuality}")
            appendLine("   • Баланс классов: ${stats.classBalance}")
            
            appendLine("\nРаспределение по типам:")
            stats.contentTypes.forEach { (type, count) ->
                val percentage = (count.toDouble() / stats.totalSamples * 100).roundToInt()
                appendLine("   • $type: $count samples ($percentage%)")
            }
            
            appendLine("\nДетальная статистика:")
            detailedStats.forEach { (type, typeStat) ->
                appendLine("   • $type:")
                appendLine("     - Samples: ${typeStat.count}")
                appendLine("     - Средняя длина: ${typeStat.avgTextLength} символов")
                appendLine("     - Диапазон: ${typeStat.minTextLength}-${typeStat.maxTextLength}")
            }
            
            if (gaps.isNotEmpty()) {
                appendLine("\nПробелы в данных:")
                gaps.forEach { gap ->
                    appendLine("   • $gap")
                }
            }
            
            appendLine("\nРекомендации:")
            analyzeContentTypes().recommendations.forEach { rec ->
                appendLine("   • $rec")
            }
        }
    }
    
    // ==================== ПРИВАТНЫЕ МЕТОДЫ ====================
    
    private fun getTrainingFiles(): List<File> {
        val dataDirFile = File(dataDir)
        if (!dataDirFile.exists()) return emptyList()
        
        return dataDirFile.listFiles { file ->
            file.isFile && file.name.startsWith("training_") && file.name.endsWith(".json")
        }?.toList() ?: emptyList()
    }
    
    private fun calculateTextLength(data: Data): Long {  // ← TrainingData → Data
        var length = 0L
        length += data.data.title.length
        data.data.headings.forEach { heading -> length += heading.text.length }
        data.data.paragraphs.forEach { paragraph -> length += paragraph.length }
        return length
    }
    
    private fun assessDataQuality(avgTextLength: Long, uniqueClasses: Int): String {
        return when {
            avgTextLength == 0L -> "no_data"
            avgTextLength > 500 && uniqueClasses >= 3 -> "excellent"
            avgTextLength > 200 && uniqueClasses >= 2 -> "good"
            avgTextLength > 100 -> "fair"
            else -> "poor"
        }
    }
    
    private fun assessClassBalance(contentTypes: Map<String, Int>): String {
        if (contentTypes.isEmpty()) return "no_data"
        
        val counts = contentTypes.values
        val maxCount = counts.max()
        val minCount = counts.min()
        
        return when {
            minCount == 0 -> "very_unbalanced"
            maxCount.toDouble() / minCount > 3 -> "unbalanced"
            else -> "balanced"
        }
    }
}

fun main() {
    launch<UniversalApp>()
}
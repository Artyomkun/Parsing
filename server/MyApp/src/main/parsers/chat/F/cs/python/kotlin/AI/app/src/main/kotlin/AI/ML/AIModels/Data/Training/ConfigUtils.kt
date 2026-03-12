package AI.ML.AIModels.Data.Training

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.Data.Training.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import tornadofx.*

class ConfigUtils {
    
    fun saveConfigToFile(filePath: String) {
        val configData = mapOf(
            "predefined_urls" to Config.PREDEFINED_URLS,
            "collection_config" to mapOf(
                "request_delay" to Config.DEFAULT_COLLECTION_CONFIG.requestDelay,
                "timeout" to Config.DEFAULT_COLLECTION_CONFIG.timeout,
                "max_retries" to Config.DEFAULT_COLLECTION_CONFIG.maxRetries,
                "min_text_length" to Config.DEFAULT_COLLECTION_CONFIG.minTextLength,
                "max_files_per_type" to Config.DEFAULT_COLLECTION_CONFIG.maxFilesPerType
            ),
            "quality_thresholds" to mapOf(
                "min_headings" to Config.DEFAULT_QUALITY_THRESHOLDS.minHeadings,
                "min_paragraphs" to Config.DEFAULT_QUALITY_THRESHOLDS.minParagraphs,
                "min_text_length" to Config.DEFAULT_QUALITY_THRESHOLDS.minTextLength,
                "max_duplicate_ratio" to Config.DEFAULT_QUALITY_THRESHOLDS.maxDuplicateRatio
            )
        )
        
        val json = Json { prettyPrint = true }
        val jsonString = json.encodeToString(configData)
        
        File(filePath).writeText(jsonString)
    }
    
    fun loadCustomConfig(filePath: String): Map<String, Any>? {
        return try {
            val file = File(filePath)
            if (file.exists()) {
                val jsonString = file.readText()
                Json.decodeFromString<Map<String, Any>>(jsonString)
            } else {
                null
            }
        } catch (e: Exception) {
            println("Ошибка загрузки конфигурации: ${e.message}")
            null
        }
    }
    
    fun getUrlsStats(): Map<String, Any> {
        val urlsByType = Config.PREDEFINED_URLS.mapValues { it.value.size }
        val totalUrls = urlsByType.values.sum()
        
        return mapOf(
            "total_urls" to totalUrls,
            "urls_by_type" to urlsByType,
            "content_types" to Config.PREDEFINED_URLS.keys.toList()
        )
    }
    
    fun validateUrls(): Map<String, List<String>> {
        val validUrls = mutableMapOf<String, List<String>>()
        Config.PREDEFINED_URLS.forEach { (type, urls) ->
            validUrls[type] = urls
        }
        
        return mapOf(
            "valid" to validUrls.values.flatten(),
            "invalid" to emptyList<String>()
        )
    }
}

fun main() {
    launch<UniversalApp>()
}
package AI.ML.AIModels

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleBooleanProperty
import javafx.beans.property.SimpleDoubleProperty
import javafx.beans.property.SimpleStringProperty
import java.time.format.DateTimeFormatter
import javafx.collections.FXCollections
import kotlinx.serialization.json.*
import javafx.scene.text.FontWeight
import java.time.LocalDateTime
import kotlinx.serialization.*
import javafx.scene.control.*
import java.io.File
import kotlin.math.*
import tornadofx.*

class JsonUtils {
    fun toJson(obj: Any) = Json.encodeToString(obj)
    inline fun <reified T> fromJson(json: String) = Json.decodeFromString<T>(json)
}

class TextAnalysisUtils {
    fun analyzeContent(text: String) = mapOf(
        "word_count" to text.split("\\s+".toRegex()).size,
        "sentence_count" to text.split('.').count { it.isNotBlank() },
        "content_quality" to when {
            text.length > 1000 -> "high"
            text.length > 500 -> "medium" 
            else -> "low"
        }
    )

    fun extractKeywords(text: String): List<String> {
        return text.split("\\s+".toRegex())
            .filter { it.length > 3 }
            .take(10)
            .distinct()
    }
}

class DataProcessor {
    fun processWebData(data: Map<String, Any>): Map<String, Any> {
        val title = data["title"] as? String ?: ""
        val content = data["content"] as? String ?: ""
        val url = data["url"] as? String ?: ""
        
        val analysis = TextAnalysisUtils().analyzeContent(content)
        val keywords = TextAnalysisUtils().extractKeywords("$title $content")
        
        return mapOf(
            "source" to url,
            "title" to title,
            "content_preview" to content.take(200) + if (content.length > 200) "..." else "",
            "analysis" to analysis,
            "keywords" to keywords,
            "processed_at" to LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            "content_length" to content.length
        )
    }
    
    fun processMultipleData(dataList: List<Map<String, Any>>): List<Map<String, Any>> {
        return dataList.map { processWebData(it) }
    }
}

class ContentClassifier {
    private val categories = listOf("technology", "science", "business", "health", "entertainment")
    
    fun classifyContent(content: String): String {
        val text = content.lowercase()
        return when {
            text.contains("tech") || text.contains("ai") || text.contains("software") -> "technology"
            text.contains("research") || text.contains("study") || text.contains("scient") -> "science"
            text.contains("business") || text.contains("market") || text.contains("company") -> "business"
            text.contains("health") || text.contains("medical") || text.contains("doctor") -> "health"
            text.contains("movie") || text.contains("music") || text.contains("game") -> "entertainment"
            else -> "general"
        }
    }
    
    fun getContentStats(processedData: List<Map<String, Any>>): Map<String, Any> {
        val categoriesCount = mutableMapOf<String, Int>()
        var totalContentLength = 0
        
        processedData.forEach { data ->
            val content = data["content_preview"] as? String ?: ""
            val category = classifyContent(content)
            categoriesCount[category] = categoriesCount.getOrDefault(category, 0) + 1
            totalContentLength += content.length
        }
        
        return mapOf(
            "total_items" to processedData.size,
            "categories_distribution" to categoriesCount,
            "average_content_length" to if (processedData.isNotEmpty()) totalContentLength / processedData.size else 0,
            "processed_at" to LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }
}

class ModelManager(val dataDir: String = "ai_data") {
    val dataProcessor = DataProcessor()
    val contentClassifier = ContentClassifier()
    val processedData = mutableListOf<Map<String, Any>>()

    init { File(dataDir).takeIf { !it.exists() }?.mkdirs() }

    fun processWebData(webData: Map<String, Any>): Map<String, Any> {
        val result = dataProcessor.processWebData(webData)
        processedData.add(result)
        saveProcessedData()
        return result
    }

    fun processBatchData(dataList: List<Map<String, Any>>): Map<String, Any> {
        val results = dataProcessor.processMultipleData(dataList)
        processedData.addAll(results)
        saveProcessedData()
        
        return mapOf(
            "processed_count" to results.size,
            "stats" to contentClassifier.getContentStats(results),
            "status" to "completed"
        )
    }

    fun getDataStats(): Map<String, Any> {
        return contentClassifier.getContentStats(processedData) + mapOf(
            "total_processed" to processedData.size,
            "data_directory" to dataDir
        )
    }

    fun exportData(format: String = "json"): String {
        return when (format) {
            "json" -> Json { prettyPrint = true }.encodeToString(processedData)
            "csv" -> convertToCsv()
            else -> "Unsupported format: $format"
        }
    }

    private fun convertToCsv(): String {
        if (processedData.isEmpty()) return ""
        
        val headers = listOf("title", "source", "content_length", "keywords")
        val csv = StringBuilder(headers.joinToString(",") + "\n")
        
        processedData.forEach { data ->
            val row = listOf(
                "\"${(data["title"] as? String ?: "").replace("\"", "\"\"")}\"",
                "\"${(data["source"] as? String ?: "").replace("\"", "\"\"")}\"",
                data["content_length"].toString(),
                "\"${(data["keywords"] as? List<*> ?: emptyList()).joinToString(";")}\""
            )
            csv.append(row.joinToString(",") + "\n")
        }
        
        return csv.toString()
    }

    private fun saveProcessedData() {
        val dataFile = File("$dataDir/processed_data.json")
        dataFile.writeText(Json { prettyPrint = true }.encodeToString(processedData))
    }

    fun loadProcessedData() {
        val dataFile = File("$dataDir/processed_data.json")
        if (dataFile.exists()) {
            processedData.clear()
            processedData.addAll(Json.decodeFromString<List<Map<String, Any>>>(dataFile.readText()))
        }
    }

    fun clearData() {
        processedData.clear()
        File("$dataDir/processed_data.json").takeIf { it.exists() }?.delete()
    }
}

class ModelManagerViewModel : ViewModel() {
    val modelManager = ModelManager()
    val statusMessage = SimpleStringProperty("Система обработки данных готова")
    val isLoading = SimpleBooleanProperty(false)
    val dataStats = SimpleStringProperty()
    val processedCount = SimpleStringProperty("0")

    init { 
        modelManager.loadProcessedData()
        updateStats() 
    }

    fun processData(data: Map<String, Any>) = runAsync {
        isLoading.value = true
        statusMessage.value = "Обработка данных..."
        modelManager.processWebData(data)
    } ui { result ->
        isLoading.value = false
        statusMessage.value = "Данные обработаны: ${result["title"]}"
        updateStats()
    }

    fun processBatchData(dataList: List<Map<String, Any>>) = runAsync {
        isLoading.value = true
        statusMessage.value = "Пакетная обработка ${dataList.size} элементов..."
        modelManager.processBatchData(dataList)
    } ui { result ->
        isLoading.value = false
        statusMessage.value = "Обработано: ${result["processed_count"]} элементов"
        updateStats()
    }

    fun exportData(format: String) = runAsync {
        isLoading.value = true
        statusMessage.value = "Экспорт данных в формате $format..."
        modelManager.exportData(format)
    } ui { result ->
        isLoading.value = false
        if (result.length > 500) {
            statusMessage.value = "Данные экспортированы (${result.length} символов)"
        } else {
            statusMessage.value = "Экспорт завершен: $result"
        }
    }

    fun clearData() {
        modelManager.clearData()
        statusMessage.value = "Все данные очищены"
        updateStats()
    }

    fun updateStats() {
        val stats = modelManager.getDataStats()
        processedCount.value = "Обработано: ${stats["total_processed"] ?: 0}"
        dataStats.value = buildString {
            appendLine("Статистика данных:")
            appendLine("• Всего элементов: ${stats["total_processed"]}")
            appendLine("• Категории: ${stats["categories_distribution"]}")
            appendLine("• Средняя длина: ${stats["average_content_length"]} симв.")
        }
    }
}

class ModelManagerView : View("AI Data Processor") {
    val viewModel = ModelManagerViewModel()

    override val root = borderpane {
        paddingAll = 20.0
        top = vbox(10.0) {
            label("AI Data Processor") { 
                style { 
                    fontSize = 24.px
                    fontWeight = FontWeight.BOLD 
                }
            }
            label(viewModel.statusMessage)
            label(viewModel.processedCount)
        }
        center = tabpane {
            tab("Обработка данных") {
                vbox(20.0) {
                    label("Система обработки веб-данных") {
                        style { fontSize = 16.px; fontWeight = FontWeight.BOLD }
                    }
                    button("Обновить статистику") { 
                        action { viewModel.updateStats() }
                    }
                    textarea(viewModel.dataStats) {
                        isEditable = false
                        prefRowCount = 6
                    }
                }
            }
            tab("Экспорт данных") {
                vbox(20.0) {
                    label("Экспорт обработанных данных") {
                        style { fontSize = 16.px; fontWeight = FontWeight.BOLD }
                    }
                    hbox(10.0) {
                        button("Экспорт в JSON") { 
                            action { viewModel.exportData("json") }
                        }
                        button("Экспорт в CSV") { 
                            action { viewModel.exportData("csv") }
                        }
                    }
                }
            }
            tab("Управление") {
                vbox(20.0) {
                    label("Управление данными") {
                        style { fontSize = 16.px; fontWeight = FontWeight.BOLD }
                    }
                    button("Очистить все данные") { 
                        action { viewModel.clearData() }
                    }
                }
            }
        }
    }
}

class ModelManagerApp : App(ModelManagerView::class)

fun main() {
    launch<UniversalApp>()
}
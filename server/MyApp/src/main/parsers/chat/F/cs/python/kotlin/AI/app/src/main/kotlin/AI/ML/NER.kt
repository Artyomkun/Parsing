package AI.ML

import AI.FiveD.*
import AI.Utils.*
import AI.Core.*
import AI.ML.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleBooleanProperty
import javafx.beans.property.SimpleDoubleProperty
import javafx.beans.property.SimpleStringProperty
import java.util.concurrent.ConcurrentHashMap
import kotlinx.serialization.Serializable
import java.time.format.DateTimeFormatter
import javafx.collections.FXCollections
import javafx.scene.text.FontWeight
import java.time.LocalDateTime
import kotlinx.coroutines.*
import javafx.util.Duration
import javafx.geometry.Pos
import javafx.stage.Stage
import javafx.animation.*
import kotlin.math.*
import tornadofx.*

// ==================== NER PROCESSOR ====================
@Serializable
data class NEREntity(
    val text: String,
    val type: String,
    val start: Int,
    val end: Int,
    val confidence: Double = 0.9
)

@Serializable
data class NERResult(
    val success: Boolean = true,
    val text: String = "",
    val entities: List<NEREntity> = emptyList(),
    val entitiesCount: Int = 0,
    val processingTime: Double = 0.0,
    val timestamp: String = "",
    val language: String = "ru",
    val error: String? = null
)

class NERProcessor : Controller() {
    val history = mutableListOf<NERResult>()
    val cache = ConcurrentHashMap<String, NERResult>()
    val maxCacheSize = 1000

    fun analyzeText(text: String, language: String = "ru"): NERResult {
        val key = "$language:${text.hashCode()}"
        cache[key]?.let { return it.copy(processingTime = 0.0) }

        val start = System.currentTimeMillis()
        val entities = extractEntities(text, language)
        val timeSec = (System.currentTimeMillis() - start) / 1000.0

        val result = NERResult(
            success = true,
            text = text,
            entities = entities,
            entitiesCount = entities.size,
            processingTime = timeSec,
            timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            language = language
        )

        synchronized(history) {
            history.add(result)
            if (history.size > 200) history.removeAt(0)
        }

        synchronized(cache) {
            if (cache.size >= maxCacheSize) cache.clear()
            cache[key] = result
        }

        return result
    }

    fun getHistory(limit: Int = 20) = history.takeLast(limit)
    fun clear() { history.clear(); cache.clear() }
    fun getStats() = mapOf(
        "totalTexts" to history.size,
        "totalEntities" to history.sumOf { it.entitiesCount }
    )

    fun extractEntities(text: String, language: String): List<NEREntity> {
        val patterns = if (language == "en") englishPatterns() else russianPatterns()
        return patterns.flatMap { (type, regex) ->
            regex.findAll(text).map { m ->
                NEREntity(
                    text = m.value,
                    type = type,
                    start = m.range.first,
                    end = m.range.last + 1,
                    confidence = confidence(type, m.value)
                )
            }
        }.distinctBy { it.text to it.type }.sortedBy { it.start }
    }

    fun russianPatterns() = mapOf(
        "PERSON" to Regex("\\b[А-ЯЁ][а-яё]+\\s+[А-ЯЁ][а-яё]+\\b"),
        "ORG" to Regex("\\b(ООО|АО|ПАО|ЗАО|Компания|Фирма)\\b", RegexOption.IGNORE_CASE),
        "EMAIL" to Regex("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b"),
        "PHONE" to Regex("\\+?[78][\\d\\s()-]{9,15}")
    )

    fun englishPatterns() = mapOf(
        "PERSON" to Regex("\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b"),
        "ORG" to Regex("\\b(Inc|Corp|Company|LLC|Ltd)\\b", RegexOption.IGNORE_CASE),
        "EMAIL" to Regex("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b")
    )

    fun confidence(type: String, value: String) = when (type) {
        "EMAIL", "PHONE" -> 0.99
        "PERSON" -> if (value.split(" ").size >= 2) 0.92 else 0.7
        else -> 0.85
    }
}

// ==================== TORNADOFX APP ====================
class MLTextAnalysisApp : App(MLAnalysisView::class) {

    override fun start(stage: Stage) {
        stage.width = 1000.0
        stage.height = 700.0
        super.start(stage)
    }
}

fun main() {
    launch<UniversalApp>()
}
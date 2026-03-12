package AI.FiveD

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlinx.serialization.Serializable
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Serializable
data class AnalysisResult(
    val text: String,
    val overallScore: Double,
    val modelsUsed: List<String>,
    val sentiment: SentimentAnalysis? = null,
    val topic: TopicAnalysis? = null,
    val spam: SpamAnalysis? = null,
    val language: LanguageAnalysis? = null,
    val processingTime: Long = 0,
    val timestamp: String = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
) {
    val success: Boolean get() = overallScore > 0.1
}

@Serializable
data class SentimentAnalysis(
    val label: String,
    val confidence: Double,
    val score: Double
)

@Serializable
data class TopicAnalysis(
    val topic: String,
    val confidence: Double,
    val keywords: List<String> = emptyList()
)

@Serializable
data class SpamAnalysis(
    val isSpam: Boolean,
    val probability: Double,
    val confidence: Double
)

@Serializable
data class LanguageAnalysis(
    val language: String,
    val confidence: Double
)
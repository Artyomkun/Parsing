package AI.FiveD.Visualization

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.Data.Training.*
import com.fasterxml.jackson.module.kotlin.KotlinFeature
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import javafx.scene.control.Alert.AlertType
import java.time.format.DateTimeFormatter
import javafx.application.Platform
import javafx.scene.control.Alert
import kotlin.system.exitProcess
import javafx.scene.layout.VBox
import java.time.LocalDateTime
import javafx.scene.chart.*
import java.nio.file.Paths
import javafx.scene.Scene
import javafx.stage.Stage
import java.nio.file.Path
import java.time.Instant
import java.time.ZoneId
import mu.KotlinLogging
import tornadofx.*

class DataVisualizer(
    val dataDir: Path = Paths.get(System.getProperty("user.dir"), "AI", "ML"),
     val objectMapper: ObjectMapper = ObjectMapper().registerModule(
        KotlinModule.Builder()
            .withReflectionCacheSize(512)
            .configure(KotlinFeature.NullToEmptyCollection, false)
            .configure(KotlinFeature.NullToEmptyMap, false)
            .configure(KotlinFeature.NullIsSameAsDefault, false)
            .configure(KotlinFeature.SingletonSupport, false)
            .configure(KotlinFeature.StrictNullChecks, false)
            .build())
) {
    
    val logger = KotlinLogging.logger {}

    companion object {
        const val WINDOW_WIDTH = 1400.0
        const val WINDOW_HEIGHT = 900.0
        const val CHART_HEIGHT = 300.0
        val REPORT_FILE_PATTERN = Regex("""data_report_\d+\.json""")
        val DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    }

    data class DataReport(
        val timestamp: Long,
        val data_stats: DataStats,
        val processing: DataProcessing,
        val analysis_demonstration: AnalysisDemo? = null
    )

    data class DataStats(
        val total_samples: Int,
        val content_types: Map<String, Int>
    )

    data class DataProcessing(
        val is_processed: Boolean,
        val processing_duration_seconds: Double? = null,
        val data_metrics: DataMetrics? = null
    )

    data class DataMetrics(
        val quality_score: Double? = null,
        val diversity_score: Double? = null,
        val completeness_score: Double? = null,
        val consistency_score: Double? = null
    )

    data class AnalysisDemo(
        val sample_predictions: List<SamplePrediction>? = null
    )

    data class Prediction(
        val predicted_class: String,
        val confidence: Double
    )

    data class SamplePrediction(
        val text: String,
        val prediction: Prediction?,
        val actual_class: String? = null
    )

    data class DataProgress(
        val timestamps: List<LocalDateTime>,
        val sampleCounts: List<Int>,
        val contentTypeEvolution: Map<String, List<Int>>,
        val metricsOverTime: List<DataMetrics?>
    )

    fun loadAndAnalyzeReports(): DataProgress? {
        return try {
            val reports = loadReports()
            if (reports.isEmpty()) return null

            val timestamps = reports.map { 
                LocalDateTime.ofInstant(Instant.ofEpochMilli(it.timestamp), ZoneId.systemDefault()) 
            }
            val sampleCounts = reports.map { it.data_stats.total_samples }
            
            val contentTypeEvolution = buildContentTypeEvolution(reports)
            val metricsOverTime = reports.map { it.processing.data_metrics }

            DataProgress(timestamps, sampleCounts, contentTypeEvolution, metricsOverTime)
        } catch (ex: Exception) {
            logger.error(ex) { "Failed to analyze data reports" }
            null
        }
    }

    fun buildContentTypeEvolution(reports: List<DataReport>): Map<String, List<Int>> {
        val allContentTypes = reports.flatMap { it.data_stats.content_types.keys }.toSet()
        
        return allContentTypes.associateWith { contentType ->
            reports.map { report ->
                report.data_stats.content_types[contentType] ?: 0
            }
        }
    }

    fun loadReports(): List<DataReport> {
        val dirFile = dataDir.toFile()
        if (!dirFile.exists() || !dirFile.isDirectory) {
            logger.error { "Data directory not found: $dataDir" }
            return emptyList()
        }

        return dirFile.listFiles { file ->
            file.isFile && REPORT_FILE_PATTERN.matches(file.name)
        }?.sortedBy { it.name }
            ?.mapNotNull { file ->
                try {
                    objectMapper.readValue<DataReport>(file)
                } catch (ex: Exception) {
                    logger.error(ex) { "Failed to load or parse report ${file.name}" }
                    null
                }
            } ?: emptyList()
    }

    fun plotDataProgress() {
        val progress = loadAndAnalyzeReports() ?: run {
            showErrorAlert("No valid data found", "Cannot visualize data progress")
            return
        }

        Platform.runLater {
            try {
                createAndShowVisualization(progress)
            } catch (ex: Exception) {
                logger.error(ex) { "Failed to create visualization" }
                showErrorAlert("Visualization error", "Failed to create charts: ${ex.message}")
            }
        }
    }

    fun createAndShowVisualization(progress: DataProgress) {
        val stage = Stage().apply {
            title = "AI Data Progress Visualization"
            setOnCloseRequest { Platform.exit() }
        }

        val root = VBox(15.0).apply {
            style = "-fx-padding: 20px; -fx-background-color: #f5f5f5;"
        }

        val charts = listOfNotNull(
            createSamplesChart(progress),
            createContentTypeChart(progress),
            createConfidenceChart(progress),
            createMetricsChart(progress)
        )

        root.children.addAll(charts)
        
        stage.scene = Scene(root, WINDOW_WIDTH, WINDOW_HEIGHT)
        stage.show()
    }

    fun createSamplesChart(progress: DataProgress): LineChart<String, Number> {
        val xAxis = CategoryAxis().apply { 
            label = "Time" 
        }
        val yAxis = NumberAxis().apply { 
            label = "Number of Samples" 
        }

        return LineChart(xAxis, yAxis).apply {
            title = "Data Samples Over Time"
            prefHeight = CHART_HEIGHT
            isLegendVisible = true

            val series = XYChart.Series<String, Number>().apply {
                name = "Data Samples"
            }

            progress.timestamps.forEachIndexed { index, timestamp ->
                val timeLabel = timestamp.format(DATE_FORMATTER)
                series.data.add(XYChart.Data(timeLabel, progress.sampleCounts[index]))
            }

            data.add(series)
        }
    }

    fun createContentTypeChart(progress: DataProgress): StackedAreaChart<String, Number>? {
        val latestReport = loadReports().lastOrNull() ?: return null
        val contentTypes = latestReport.data_stats.content_types

        val xAxis = CategoryAxis().apply { label = "Content Type" }
        val yAxis = NumberAxis().apply { label = "Count" }

        return StackedAreaChart(xAxis, yAxis).apply {
            title = "Class Distribution (Latest Data)"
            prefHeight = CHART_HEIGHT

            contentTypes.forEach { (contentType, count) ->
                val series = XYChart.Series<String, Number>().apply {
                    name = contentType
                }
                series.data.add(XYChart.Data(contentType, count))
                data.add(series)
            }
        }
    }

    fun createConfidenceChart(progress: DataProgress): BarChart<String, Number>? {
        val latestReport = loadReports().lastOrNull() ?: return null
        val confidences = latestReport.analysis_demonstration?.sample_predictions
            ?.mapNotNull { it.prediction?.confidence }
            ?.filter { it > 0 } ?: emptyList()

        if (confidences.isEmpty()) return null

        val xAxis = CategoryAxis().apply { label = "Confidence Range" }
        val yAxis = NumberAxis().apply { label = "Frequency" }

        return BarChart(xAxis, yAxis).apply {
            title = "Prediction Confidence Distribution"
            prefHeight = CHART_HEIGHT

            val bins = 10
            val step = 1.0 / bins
            val counts = IntArray(bins)

            confidences.forEach { confidence ->
                val index = (confidence / step).toInt().coerceIn(0, bins - 1)
                counts[index]++
            }

            val series = XYChart.Series<String, Number>().apply {
                name = "Predictions"
            }

            for (i in 0 until bins) {
                val rangeStart = i * step
                val rangeEnd = (i + 1) * step
                val rangeLabel = "%.1f-%.1f".format(rangeStart, rangeEnd)
                series.data.add(XYChart.Data(rangeLabel, counts[i]))
            }

            data.add(series)
        }
    }

    fun createMetricsChart(progress: DataProgress): LineChart<String, Number>? {
        val metrics = progress.metricsOverTime.filterNotNull()
        if (metrics.isEmpty()) return null

        val xAxis = CategoryAxis().apply { label = "Processing Session" }
        val yAxis = NumberAxis().apply { 
            label = "Score" 
            isAutoRanging = true
        }

        return LineChart(xAxis, yAxis).apply {
            title = "Data Metrics Over Time"
            prefHeight = CHART_HEIGHT
            isLegendVisible = true

            val availableMetrics = listOf(
                "Quality" to metrics.map { it.quality_score },
                "Diversity" to metrics.map { it.diversity_score },
                "Completeness" to metrics.map { it.completeness_score },
                "Consistency" to metrics.map { it.consistency_score }
            ).filter { (_, values) -> values.any { it != null } }

            availableMetrics.forEach { (metricName, values) ->
                val series = XYChart.Series<String, Number>().apply {
                    name = metricName
                }
                
                values.forEachIndexed { index, value ->
                    value?.let {
                        series.data.add(XYChart.Data("Session ${index + 1}", it))
                    }
                }
                
                if (series.data.isNotEmpty()) {
                    data.add(series)
                }
            }
        }
    }

    fun generateDataReport(): String {
        val reports = loadReports()
        if (reports.isEmpty()) return "No data reports available"

        val latest = reports.last()
        val progress = loadAndAnalyzeReports()

        return buildString {
            appendLine("AI DATA REPORT")
            appendLine("=".repeat(50))
            appendLine()
            
            appendDataSummary(latest, progress)
            appendLine()
            appendDataStatistics(latest, progress)
            appendLine()
            appendDataMetrics(latest)
            appendLine()
            appendAnalysisDemo(latest)
        }
    }

    fun StringBuilder.appendDataSummary(report: DataReport, progress: DataProgress?) {
        appendLine("DATA SUMMARY")
        appendLine("   Latest Processing: ${formatTimestamp(report.timestamp)}")
        appendLine("   Data Status: ${if (report.processing.is_processed) "Processed" else "Not Processed"}")
        report.processing.processing_duration_seconds?.let {
            appendLine("   Processing Duration: ${"%.2f".format(it)} seconds")
        }
        progress?.let {
            appendLine("   Total Processing Sessions: ${it.timestamps.size}")
            appendLine("   Data Growth: ${it.sampleCounts.first()} -> ${it.sampleCounts.last()} samples")
        }
    }

    fun StringBuilder.appendDataStatistics(report: DataReport, progress: DataProgress?) {
        appendLine("DATA STATISTICS")
        appendLine("   Current Samples: ${report.data_stats.total_samples}")
        appendLine("   Content Types:")
        report.data_stats.content_types.forEach { (type, count) ->
            val percentage = (count.toDouble() / report.data_stats.total_samples) * 100
            appendLine("     - $type: $count (${"%.1f".format(percentage)}%)")
        }
        
        progress?.contentTypeEvolution?.let { evolution ->
            appendLine("   Data Evolution:")
            evolution.forEach { (type, counts) ->
                if (counts.isNotEmpty()) {
                    appendLine("     - $type: ${counts.first()} -> ${counts.last()}")
                }
            }
        }
    }

    fun StringBuilder.appendDataMetrics(report: DataReport) {
        appendLine("DATA QUALITY")
        report.processing.data_metrics?.let { metrics ->
            metrics.quality_score?.let { appendLine("   Quality Score: ${"%.2f".format(it * 100)}%") }
            metrics.diversity_score?.let { appendLine("   Diversity Score: ${"%.2f".format(it * 100)}%") }
            metrics.completeness_score?.let { appendLine("   Completeness Score: ${"%.2f".format(it * 100)}%") }
            metrics.consistency_score?.let { appendLine("   Consistency Score: ${"%.2f".format(it * 100)}%") }
        } ?: appendLine("   No detailed metrics available")
    }

    fun StringBuilder.appendAnalysisDemo(report: DataReport) {
        appendLine("ANALYSIS DEMONSTRATION")
        val predictions = report.analysis_demonstration?.sample_predictions
        
        if (predictions.isNullOrEmpty()) {
            appendLine("   No sample predictions available")
            return
        }

        predictions.take(5).forEach { samplePred ->
            val prediction = samplePred.prediction
            if (prediction != null) {
                val confidenceLevel = when {
                    prediction.confidence > 0.8 -> "HIGH"
                    prediction.confidence > 0.5 -> "MEDIUM"
                    else -> "LOW"
                }
                appendLine("   [$confidenceLevel] '${samplePred.text.take(50)}...'")
                appendLine("      -> ${prediction.predicted_class} (confidence: ${"%.2f".format(prediction.confidence * 100)}%)")
                samplePred.actual_class?.let { actual ->
                    val status = if (actual == prediction.predicted_class) "CORRECT" else "INCORRECT"
                    appendLine("      Actual: $actual [$status]")
                }
                appendLine()
            }
        }
        
        if (predictions.size > 5) {
            appendLine("   ... and ${predictions.size - 5} more predictions")
        }
    }

    fun formatTimestamp(timestamp: Long): String {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault())
            .format(DATE_FORMATTER)
    }

    fun showErrorAlert(title: String, message: String) {
        Platform.runLater {
            Alert(AlertType.ERROR).apply {
                this.title = title
                headerText = null
                contentText = message
            }.showAndWait()
        }
    }
}

fun main() {
    launch<UniversalApp>()
}
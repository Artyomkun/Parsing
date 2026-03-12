package AI.ML

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import java.time.format.DateTimeFormatter
import javafx.collections.FXCollections
import javafx.scene.text.FontWeight
import kotlinx.serialization.json.* 
import javafx.scene.paint.Color
import java.time.LocalDateTime
import javafx.scene.text.Font
import javafx.geometry.Insets
import kotlinx.serialization.*
import javafx.beans.property.*
import kotlinx.coroutines.*
import kotlin.math.*
import tornadofx.*

// ==================== TORNADOFX МОДЕЛИ ДАННЫХ ====================

open class BaseModel {
    var id: String = ""
    var name: String = ""
    var description: String = ""
    var createdAt: Long = System.currentTimeMillis()
    var updatedAt: Long = System.currentTimeMillis()
}

class MLModelItem {
    val nameProperty = SimpleStringProperty()
    var name by nameProperty

    val typeProperty = SimpleStringProperty()
    var type by typeProperty

    val statusProperty = SimpleStringProperty()
    var status by statusProperty

    val accuracyProperty = SimpleDoubleProperty()
    var accuracy by accuracyProperty

    val descriptionProperty = SimpleStringProperty()
    var description by descriptionProperty
    val accuracyPercentProperty = SimpleStringProperty()
    var accuracyPercent by accuracyPercentProperty 
}

class AnalysisResultItem {
    val textProperty = SimpleStringProperty()
    var text by textProperty

    val overallScoreProperty = SimpleDoubleProperty()
    var overallScore by overallScoreProperty

    val sentimentProperty = SimpleStringProperty()
    var sentiment by sentimentProperty

    val spamProperty = SimpleStringProperty()
    var spam by spamProperty

    val languageProperty = SimpleStringProperty()
    var language by languageProperty

    val wordCountProperty = SimpleStringProperty()
    var wordCount by wordCountProperty

    val readabilityProperty = SimpleStringProperty()
    var readability by readabilityProperty

    val timestampProperty = SimpleStringProperty()
    var timestamp by timestampProperty

    val accuracyPercentProperty = SimpleStringProperty()
    var accuracyPercent by accuracyPercentProperty 
}


// ==================== TORNADOFX VIEW ====================

class MLAnalysisView : View("ML Text Analysis System") {

    val mlService = MLService()
    val nerProcessor = NERProcessor()  
    // Properties for data binding
    val inputText = SimpleStringProperty()
    val analysisInProgress = SimpleBooleanProperty(false)
    val modelsInitialized = SimpleBooleanProperty(false)
    val overallScore = SimpleDoubleProperty(0.0)
    val analysisStatus = SimpleStringProperty("Ready")
    
    // Analysis results
    val sentimentResult = SimpleStringProperty("Not analyzed")
    val spamResult = SimpleStringProperty("Not analyzed")
    val languageResult = SimpleStringProperty("Not analyzed")
    val contentResult = SimpleStringProperty("Not analyzed")
    
    // Model status
    val modelItems = FXCollections.observableArrayList<MLModelItem>()
    val analysisHistory = FXCollections.observableArrayList<AnalysisResultItem>()

    override val root = borderpane {
        center = vbox {
            spacing = 15.0
            padding = Insets(20.0)
            hbox {
                spacing = 15.0
                label("ML Text Analysis System") {
                    style {
                        fontSize = 24.px
                        fontWeight = FontWeight.BOLD
                    }
                }
                button("Initialize Models") {
                    action {
                        initializeModels()
                    }
                }
                label("Status:") {
                    style { fontWeight = FontWeight.BOLD }
                }
                label(analysisStatus)
                progressindicator {
                    visibleWhen(analysisInProgress)
                }
            }

            separator()
            vbox {
                label("Input Text:") {
                    style { fontWeight = FontWeight.BOLD }
                }
                textarea(inputText) {
                    prefRowCount = 6
                    promptText = "Enter text here for ML analysis..."
                    prefWidth = 800.0
                }
            }
            hbox {
                spacing = 10.0
                button("Analyze Text") {
                    enableWhen(modelsInitialized.and(inputText.isNotEmpty))
                    action {
                        analyzeText()
                    }
                }
                button("Clear") {
                    action {
                        clearResults()
                    }
                }
            }
            vbox {
                label("Analysis Results:") {
                    style { fontWeight = FontWeight.BOLD }
                }
                
                hbox {
                    spacing = 20.0
                    
                    vbox {
                        label("Overall Score:") { style { fontWeight = FontWeight.BOLD } }
                        progressbar(overallScore) {
                            prefWidth = 200.0
                        }
                        label("${(overallScore.value * 100).toInt()}%")
                    }
                    form {
                        fieldset("Detailed Analysis") {
                            field("Sentiment:") { label(sentimentResult) }
                            field("Spam Detection:") { label(spamResult) }
                            field("Language:") { label(languageResult) }
                            field("Content Analysis:") { label(contentResult) }
                        }
                    }
                }
            }
            tabpane {
                tab("ML Models Status") {
                    tableview<MLModelItem>(modelItems) {
                        prefHeight = 200.0
                        
                        column("Model", MLModelItem::nameProperty)
                        column("Type", MLModelItem::typeProperty)
                        column("Status", MLModelItem::statusProperty)
                        column("Accuracy", MLModelItem::accuracyPercentProperty)
                        
                        onUserSelect {
                            showModelDetails(it)
                        }
                    }
                }
                
                tab("Analysis History") {
                    tableview<AnalysisResultItem>(analysisHistory) {
                        prefHeight = 200.0
                        
                        column("Text", AnalysisResultItem::textProperty)
                        column("Score", AnalysisResultItem::overallScoreProperty).cellFormat {
                            text = "%.1f%%".format(it.toDouble() * 100)
                        }
                        column("Sentiment", AnalysisResultItem::sentimentProperty)
                        column("Spam", AnalysisResultItem::spamProperty)
                        column("Time", AnalysisResultItem::timestampProperty)
                    }
                }
            }
        }
    }

    init {
        loadModelStatus()
    }

    fun initializeModels() {
        analysisInProgress.value = true
        analysisStatus.value = "Initializing ML models..."

        runLater {
            try {
                val result = mlService.initializeMLModels()
                modelsInitialized.value = result["success"] as? Boolean ?: false
                
                if (modelsInitialized.value) {
                    analysisStatus.value = "Models initialized successfully!"
                    loadModelStatus()
                    information("Success", "ML models have been initialized successfully!")
                } else {
                    analysisStatus.value = "Failed to initialize models"
                    error("Failed to initialize ML models")
                }
            } catch (e: Exception) {
                analysisStatus.value = "Initialization error"
                error("Initialization failed: ${e.message}")
            } finally {
                analysisInProgress.value = false
            }
        }
    }

    fun analyzeText() {
        val text = inputText.value.trim()
        if (text.isEmpty()) {
            warning("Input Error", "Please enter some text to analyze.")
            return
        }

        analysisInProgress.value = true
        analysisStatus.value = "Analyzing text..."

        runLater {
            try {
                val startTime = System.currentTimeMillis()
                val result = mlService.analyzeText(text)
                val endTime = System.currentTimeMillis()

                updateUIWithResults(result)
                addToHistory(result, text)
                analysisStatus.value = "Analysis completed in ${endTime - startTime}ms"

            } catch (e: Exception) {
                analysisStatus.value = "Analysis failed"
                error("Analysis error: ${e.message}")
            } finally {
                analysisInProgress.value = false
            }
        }
    }

    fun updateUIWithResults(result: Map<String, Any>) {
        val success = result["success"] as? Boolean ?: false
        if (!success) {
            error("Analysis failed: ${result["error"]}")
            return
        }
        overallScore.value = result["overallScore"] as? Double ?: 0.0
        val sentiment = result["sentiment"] as? Map<String, Any>
        val spam = result["spam"] as? Map<String, Any>
        val language = result["language"] as? Map<String, Any>
        val content = result["contentAnalysis"] as? Map<String, Any>

        sentimentResult.value = formatSentiment(sentiment)
        spamResult.value = formatSpam(spam)
        languageResult.value = formatLanguage(language)
        contentResult.value = formatContent(content)
    }

    fun formatSentiment(sentiment: Map<String, Any>?): String {
        if (sentiment.isNullOrEmpty()) return "No data"
        val label = sentiment["label"] as? String ?: "unknown"
        val confidence = sentiment["confidence"] as? Double ?: 0.0
        return "$label (${(confidence * 100).toInt()}% confidence)"
    }

    fun formatSpam(spam: Map<String, Any>?): String {
        if (spam.isNullOrEmpty()) return "No data"
        val isSpam = spam["is_spam"] as? Boolean ?: false
        val probability = spam["spam_probability"] as? Double ?: 0.0
        return if (isSpam) "SPAM (${(probability * 100).toInt()}%)" else "Not spam (${(probability * 100).toInt()}%)"
    }

    fun formatLanguage(language: Map<String, Any>?): String {
        if (language.isNullOrEmpty()) return "No data"
        val lang = language["language"] as? String ?: "unknown"
        val confidence = language["confidence"] as? Double ?: 0.0
        return "$lang (${(confidence * 100).toInt()}% confidence)"
    }

    fun formatContent(content: Map<String, Any>?): String {
        if (content.isNullOrEmpty()) return "No data"
        val words = content["word_count"] as? Int ?: 0
        val readability = content["readability_score"] as? Double ?: 0.0
        val complexity = content["complexity"] as? String ?: "unknown"
        return "$words words, ${(readability * 100).toInt()}% readable, $complexity complexity"
    }

    fun addToHistory(result: Map<String, Any>, originalText: String) {
        val item = AnalysisResultItem().apply {
            text = originalText.take(50) + if (originalText.length > 50) "..." else ""
            overallScore = result["overallScore"] as? Double ?: 0.0
            
            val sentiment = result["sentiment"] as? Map<String, Any>
            val spam = result["spam"] as? Map<String, Any>
            val language = result["language"] as? Map<String, Any>
            
            this.sentiment = formatSentiment(sentiment)
            this.spam = formatSpam(spam)
            this.language = formatLanguage(language)
            this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        }
        
        analysisHistory.add(0, item)
        if (analysisHistory.size > 10) {
            analysisHistory.removeAt(analysisHistory.size - 1)
        }
    }

    fun loadModelStatus() {
        runLater {
            try {
                val models = mlService.getModelStatus()
                modelItems.setAll(models)
            } catch (e: Exception) {
                error("Failed to load model status: ${e.message}")
            }
        }
    }

    fun showModelDetails(model: MLModelItem) {
        information(
            "Model Details - ${model.name}",
            "Type: ${model.type}\n" +
            "Status: ${model.status}\n" +
            "Accuracy: ${"%.1f".format(model.accuracy * 100)}%\n" +
            "Description: ${model.description}"
        )
    }

    fun clearResults() {
        inputText.value = ""
        overallScore.value = 0.0
        sentimentResult.value = "Not analyzed"
        spamResult.value = "Not analyzed"
        languageResult.value = "Not analyzed"
        contentResult.value = "Not analyzed"
        analysisStatus.value = "Ready"
    }
}

fun main() {
    launch<UniversalApp>()
}
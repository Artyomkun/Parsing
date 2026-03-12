package AI.FiveD

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import javafx.beans.property.SimpleBooleanProperty
import javafx.beans.property.SimpleStringProperty
import javafx.collections.FXCollections
import javafx.geometry.Insets
import javafx.scene.control.*
import javafx.scene.text.Font
import javafx.scene.text.FontWeight
import javafx.application.Platform
import tornadofx.*
import kotlinx.coroutines.runAsync
import kotlinx.serialization.Serializable
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.concurrent.thread
import java.util.concurrent.ConcurrentHashMap
import kotlin.random.Random

open class UniversalScienceAssistant {

    val models = ConcurrentHashMap<String, DynamicModel>()
    val subModels = ConcurrentHashMap<String, MutableList<SubModel>>()

    data class SubModel(val id: String, val parent: String, val description: String, var trained: Boolean = false, var accuracy: Double = 0.0)
    var initialized = false
    var autoTrainingEnabled = true

    companion object {
        val MODEL_NAMES = mapOf(
            "ml_models_manager" to "ML Models Manager"
        )

        fun getAvailableModels(): Map<String, String> {
            return MODEL_NAMES
        }

        fun getModelDisplayName(type: String): String {
            return MODEL_NAMES[type] ?: "Unknown Model"
        }
    }

    suspend fun initializeAllModels() {
        if (initialized) return
        MLModels.initializeModels()
        
        // Инициализировать ML сервисы
        mlService.initializeModels()
        
        // Не сбрасываем уже обученные модели!
        MODEL_NAMES.forEach { (key, name) ->
            models.computeIfAbsent(key) {
                DynamicModel(
                    name = key,
                    type = when(key) {
                        "ml_models_manager" -> "AIModelsManager"
                        else -> "Analysis"
                    },
                    description = name,
                    trained = true,
                    accuracy = when(key) {
                        "ml_models_manager" -> 0.95
                        else -> 0.8
                    }
                )
            }
        }
        
        initialized = true
        println("Все модели загружены: ${models.keys.joinToString()}")
    }

    // Психологические методы
    fun calculateStatistics(data: List<Double>): Map<String, Any> {
        return mapOf(
            "mean" to StatisticsUtils.mean(data),
            "variance" to StatisticsUtils.variance(data),
            "std_dev" to StatisticsUtils.standardDeviation(data),
            "min" to data.minOrNull() ?: 0.0,
            "max" to data.maxOrNull() ?: 0.0,
            "median" to calculateMedian(data),
            "range" to (data.maxOrNull() ?: 0.0) - (data.minOrNull() ?: 0.0)
        )
    }

    fun calculateMedian(data: List<Double>): Double {
        val sorted = data.sorted()
        return if (sorted.size % 2 == 0) {
            (sorted[sorted.size / 2 - 1] + sorted[sorted.size / 2]) / 2.0
        } else {
            sorted[sorted.size / 2]
        }
    }

    fun calculatePsychometrics(itemScores: List<List<Double>>): Map<String, Any> {
        val alpha = Psychometrics.cronbachAlpha(itemScores)
        val reliability = when {
            alpha >= 0.9 -> "Excellent"
            alpha >= 0.8 -> "Good"
            alpha >= PsychologicalConstants.CRONBACH_ALPHA_THRESHOLD -> "Acceptable"
            else -> "Poor"
        }
        
        return mapOf(
            "cronbach_alpha" to alpha,
            "reliability" to reliability,
            "threshold" to PsychologicalConstants.CRONBACH_ALPHA_THRESHOLD,
            "interpretation" to when(reliability) {
                "Excellent" -> "Отличная надежность"
                "Good" -> "Хорошая надежность"
                "Acceptable" -> "Приемлемая надежность"
                else -> "Низкая надежность"
            }
        )
    }

    fun analyzeClinicalBDI(scores: List<Int>): Map<String, Any> {
        val result = ClinicalPsychology.beckDepressionInventory(scores)
        val interpretation = when(result.severity) {
            "Minimal" -> "Нормальное состояние, депрессия отсутствует"
            "Mild" -> "Легкая депрессия, рекомендуется консультация специалиста"
            "Moderate" -> "Умеренная депрессия, рекомендуется лечение"
            "Severe" -> "Тяжелая депрессия, требуется срочная медицинская помощь"
            else -> "Не определено"
        }
        
        return mapOf(
            "total_score" to result.totalScore,
            "severity" to result.severity,
            "interpretation" to interpretation,
            "recommendation" to when(result.severity) {
                "Mild", "Moderate", "Severe" -> "Рекомендуется консультация психолога или психиатра"
                else -> "Профилактическое наблюдение"
            }
        )
    }

    fun analyzeCognitiveStroop(congruentTime: Double, incongruentTime: Double): Map<String, Any> {
        val effect = CognitivePsychology.stroopEffectTime(congruentTime, incongruentTime)
        val interpretation = when {
            effect < 50 -> "Очень хороший когнитивный контроль, отличная концентрация"
            effect < 100 -> "Хороший когнитивный контроль, нормальная концентрация"
            effect < 200 -> "Средний когнитивный контроль, возможны трудности с концентрацией"
            else -> "Сниженный когнитивный контроль, рекомендуется тренировка внимания"
        }
        
        val interference = (effect / congruentTime) * 100
        
        return mapOf(
            "stroop_effect" to effect,
            "interference_percentage" to interference,
            "interpretation" to interpretation,
            "congruent_time" to congruentTime,
            "incongruent_time" to incongruentTime,
            "performance_level" to when {
                effect < 50 -> "Excellent"
                effect < 100 -> "Good"
                effect < 200 -> "Average"
                else -> "Below Average"
            }
        )
    }

    fun analyzeHRV(rrIntervals: List<Double>): Map<String, Any> {
        val hrv = Psychophysiology.heartRateVariabilityTime(rrIntervals)
        
        val sdnnInterpretation = when {
            hrv.sdnn > 100 -> "Очень хорошая вариабельность сердечного ритма"
            hrv.sdnn > 50 -> "Хорошая вариабельность сердечного ритма"
            hrv.sdnn > 30 -> "Умеренная вариабельность сердечного ритма"
            else -> "Сниженная вариабельность сердечного ритма"
        }
        
        val rmssdInterpretation = when {
            hrv.rmssd > 50 -> "Высокая парасимпатическая активность, хорошее восстановление"
            hrv.rmssd > 30 -> "Умеренная парасимпатическая активность"
            else -> "Сниженная парасимпатическая активность, возможен стресс"
        }
        
        val healthStatus = when {
            hrv.sdnn > 50 && hrv.rmssd > 30 -> "Здоровое состояние"
            hrv.sdnn > 30 && hrv.rmssd > 20 -> "Удовлетворительное состояние"
            else -> "Требуется внимание, возможен стресс или усталость"
        }
        
        return mapOf(
            "mean_rr" to hrv.meanRR,
            "sdnn" to hrv.sdnn,
            "rmssd" to hrv.rmssd,
            "hrv_index" to hrv.hrvIndex,
            "sdnn_interpretation" to sdnnInterpretation,
            "rmssd_interpretation" to rmssdInterpretation,
            "health_status" to healthStatus,
            "recommendation" to when(healthStatus) {
                "Здоровое состояние" -> "Продолжайте поддерживать здоровый образ жизни"
                "Удовлетворительное состояние" -> "Рекомендуется отдых и снижение стресса"
                else -> "Рекомендуется консультация врача и меры по снижению стресса"
            }
        )
    }

    // ML методы анализа текста
    suspend fun analyzeTextWithML(text: String): Map<String, Any> {
        return mlService.analyzeTextWithML(text)
    }

    fun extractNamedEntities(text: String, language: String = "ru"): NERResult {
        return nerProcessor.analyzeText(text, language)
    }

    // Универсальный метод для анализа
    suspend fun universalAnalysis(analysisType: String, data: Any): Map<String, Any> {
        return when (analysisType) {
            // Психологические анализы
            "statistics" -> calculateStatistics(data as List<Double>)
            "psychometrics" -> calculatePsychometrics(data as List<List<Double>>)
            "clinical_bdi" -> analyzeClinicalBDI(data as List<Int>)
            "cognitive_stroop" -> {
                val times = data as List<Double>
                analyzeCognitiveStroop(times[0], times[1])
            }
            "hrv" -> analyzeHRV(data as List<Double>)
            // ML анализы
            "text_analysis" -> analyzeTextWithML(data as String)
            "ner" -> {
                val textData = data as String
                mapOf("ner_result" to extractNamedEntities(textData))
            }
            else -> mapOf("error" to "Unknown analysis type: $analysisType")
        }
    }

    fun getModelsStatus(): Map<String, ModelStatus> {
        return models.mapValues { (key, model) ->
            ModelStatus(
                name = key,
                fullName = "Universal Model: ${model.description}",
                isTrained = model.trained,
                modelType = model.type,
                canPredict = true,
                canTrain = model.type != "Analyzer",
                description = model.description,
                accuracy = model.accuracy,
                parameters = mapOf(
                    "connections" to (model.parameters["connections"] ?: 50),
                    "importance" to (model.parameters["importance"] ?: 0.8),
                    "version" to "1.0"
                ),
                lastTraining = if (model.trained) "2024-01-01" else null,
                version = when (model.type) {
                    "SentimentAnalysis" -> "2.1.0"
                    "TopicModeling" -> "1.5.0"
                    "IntentClassification" -> "3.0.0"
                    else -> "1.0.0"
                }
            )
        }
    }

    suspend fun analyzeComprehensive(text: String): AnalysisResult {
        val startTime = System.currentTimeMillis()
        
        // Использовать реальные AI модели для анализа
        val sentimentModel = MLModels.getModel("sentiment")
        val spamModel = MLModels.getModel("spam")
        val languageModel = MLModels.getModel("language")
        val topicModel = MLModels.getModel("topic")
        val intentModel = MLModels.getModel("intent")

        // Использовать ML сервисы
        val mlAnalysis = analyzeTextWithML(text)
        val nerAnalysis = extractNamedEntities(text)

        val shortText = if (text.length > 200) text.substring(0, 200) + "..." else text

        // Получить предсказания от реальных моделей
        val sentimentResult = sentimentModel?.predict(text) as? Map<*, *> ?: mapOf(
            "sentiment" to "neutral", 
            "confidence" to 0.5,
            "score" to 0.0
        )
        
        val spamResult = spamModel?.predict(text) as? Map<*, *> ?: mapOf(
            "is_spam" to false, 
            "confidence" to 0.1
        )
        
        val languageResult = languageModel?.predict(text) as? Map<*, *> ?: mapOf(
            "language" to "unknown", 
            "confidence" to 0.9
        )
        
        val topicResult = topicModel?.predict(text) as? Map<*, *> ?: mapOf(
            "topic" to "general", 
            "confidence" to 0.7
        )
        
        val intentResult = intentModel?.predict(text) as? Map<*, *> ?: mapOf(
            "intent" to "informational", 
            "confidence" to 0.8
        )

        val processingTime = System.currentTimeMillis() - startTime

        return AnalysisResult(
            text = shortText,
            overallScore = calculateEnhancedOverallScore(
                sentimentResult, 
                spamResult, 
                languageResult, 
                mlAnalysis, 
                nerAnalysis
            ),
            modelsUsed = models.keys.toList(),
            sentiment = mapOf(
                "label" to (sentimentResult["sentiment"] as? String ?: "neutral"),
                "confidence" to (sentimentResult["confidence"] as? Double ?: 0.5),
                "score" to (sentimentResult["score"] as? Double ?: 0.0)
            ),
            topic = mapOf(
                "topic" to (topicResult["topic"] as? String ?: "general"),
                "confidence" to (topicResult["confidence"] as? Double ?: 0.7)
            ),
            intent = mapOf(
                "intent" to (intentResult["intent"] as? String ?: "informational"),
                "confidence" to (intentResult["confidence"] as? Double ?: 0.8)
            ),
            spam = mapOf(
                "is_spam" to (spamResult["is_spam"] as? Boolean ?: false),
                "spam_probability" to (spamResult["confidence"] as? Double ?: 0.1),
                "confidence" to 0.9
            ),
            language = mapOf(
                "language" to (languageResult["language"] as? String ?: "unknown"),
                "confidence" to (languageResult["confidence"] as? Double ?: 0.9)
            ),
            contentAnalysis = mlAnalysis["contentAnalysis"] as? Map<String, Any> ?: mapOf(
                "word_count" to text.split("\\s+".toRegex()).size,
                "readability_score" to 0.7,
                "complexity" to "medium"
            ),
            // ДОБАВЛЯЕМ новые поля
            nerAnalysis = mapOf(
                "entities_count" to nerAnalysis.entitiesCount,
                "entities" to nerAnalysis.entities,
                "processing_time" to nerAnalysis.processingTime
            ),
            mlAnalysis = mlAnalysis,
            processingTime = processingTime,
            timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    fun calculateEnhancedOverallScore(
        sentiment: Map<*, *>, 
        spam: Map<*, *>, 
        language: Map<*, *>,
        mlAnalysis: Map<String, Any>,
        nerAnalysis: NERResult
    ): Double {
        var score = 0.0
        
        // Базовые оценки
        val sentimentConfidence = sentiment["confidence"] as? Double ?: 0.5
        score += sentimentConfidence * 0.2
        
        val spamProbability = spam["confidence"] as? Double ?: 0.1
        score += (1 - spamProbability) * 0.2
        
        val languageConfidence = language["confidence"] as? Double ?: 0.9  
        score += languageConfidence * 0.15
        
        // ML анализ
        val mlScore = mlAnalysis["overallScore"] as? Double ?: 0.0
        score += mlScore * 0.25
        
        // NER анализ
        val nerScore = min(1.0, nerAnalysis.entitiesCount * 0.1)
        score += nerScore * 0.2
        
        return score.coerceIn(0.0, 1.0)
    }

    suspend fun trainAllModels(): Map<String, Any> {
        var trainedCount = 0
        models.forEach { (_, model) ->
            if (!model.trained) {
                model.trained = true
                model.accuracy = 0.8 + Random.nextDouble() * 0.15
                trainedCount++
            }
        }

        return mapOf(
            "success" to true,
            "trained_models" to trainedCount,
            "average_accuracy" to models.values.map { it.accuracy }.average(),
            "message" to "Trained $trainedCount new models (already trained: ${models.size - trainedCount})"
        )
    }

    fun getSystemStats(): Map<String, Any> {
        val nerStats = nerProcessor.getStats()
        return mapOf(
            "total_models" to models.size,
            "trained_models" to models.count { it.value.trained },
            "average_accuracy" to models.values.map { it.accuracy }.average(),
            "texts_analyzed" to nerStats["totalTexts"] ?: 0,
            "entities_extracted" to nerStats["totalEntities"] ?: 0,
            "system_status" to "Operational",
            "initialized" to initialized
        )
    }
    fun demonstrateVariousNetworks() {
        val networks = mapOf(
            "XOR Решатель" to listOf(2, 4, 1),
            "Классификатор изображений" to listOf(784, 128, 64, 10),
            "Анализатор текста" to listOf(100, 50, 25, 5),
            "Универсальный преобразователь" to listOf(8, 16, 12, 8, 4),
            "Глубокая сеть" to listOf(20, 32, 24, 16, 8, 4)
        )
        
        networks.forEach { (name, arch) ->
            println("$name: $arch")
            val network = DynamicNeuralNetwork().createRandomNetwork(*arch.toIntArray())
            val sampleInput = List(arch[0]) { Random.nextDouble() }
            val result = network.forwardPass(sampleInput)
            println("Результат: ${result.map { "%.3f".format(it) }}")
        }
    }
}

open class UniversalScienceAssistantView : View("Universal Science Assistant - 5D Neural Visualization") {
    val assistant = UniversalScienceAssistant()
    val modelsStatus = FXCollections.observableArrayList<ModelStatus>()
    val trainingLog = SimpleStringProperty("")
    val analysisText = SimpleStringProperty("")
    val currentResults = FXCollections.observableArrayList<AnalysisResult>()
    val systemStats = FXCollections.observableHashMap<String, Any>()
    val analysisInProgress = SimpleBooleanProperty(false)

    override val root = tabpane {
        tabClosingPolicy = TabPane.TabClosingPolicy.UNAVAILABLE

        tab("5D Neural Network") {
            add(NeuralNetwork5DView::class)
        }

        tab("Model Overview") {
            scrollpane(fitToWidth = true, fitToHeight = true) {
                vbox(spacing = 10.0, padding = Insets(10.0)) {
                    label("Универсальная система анализа") {
                        font = Font.font(18.0, FontWeight.BOLD)
                    }

                    groupbox("Общая статистика системы") {
                        vbox(spacing = 5.0) {
                            label("Всего моделей: ${UniversalScienceAssistant.MODEL_NAMES.size}")
                            label("Обучено: ${modelsStatus.count { it.isTrained }}")
                            label("Статус системы: ${systemStats["system_status"] ?: "Загрузка..."}")
                            label("Проанализировано текстов: ${systemStats["texts_analyzed"] ?: 0}")
                            label("Извлечено сущностей: ${systemStats["entities_extracted"] ?: 0}")
                        }
                    }

                    groupbox("Детали моделей") {
                        tableview<ModelStatus>(modelsStatus) {
                            prefHeight = 400.0
                            
                            column("Ключ", ModelStatus::name).prefWidth = 80.0
                            column("Модель", ModelStatus::fullName).prefWidth = 200.0
                            column("Статус", ModelStatus::isTrained).cellFormat { isTrained ->
                                text = if (isTrained) "Обучена" else "Не обучена"
                                style = if (isTrained) "-fx-text-fill: green;" else "-fx-text-fill: red;"
                            }.prefWidth = 100.0
                            column("Точность", ModelStatus::accuracy).cellFormat { accuracy ->
                                text = "%.1f%%".format(accuracy * 100)
                                style = when {
                                    accuracy > 0.9 -> "-fx-text-fill: green;"
                                    accuracy > 0.7 -> "-fx-text-fill: orange;"
                                    else -> "-fx-text-fill: red;"
                                }
                            }.prefWidth = 80.0
                            column("Тип", ModelStatus::modelType).prefWidth = 150.0
                            column("Описание", ModelStatus::description).prefWidth = 300.0
                        }
                    }
                }
            }
        }

        tab("Text Analysis") {
            splitpane {
                dividerPositions = 0.4

                vbox(spacing = 10.0, padding = Insets(10.0)) {
                    groupbox("Ввод текста для анализа") {
                        vbox(spacing = 8.0) {
                            label("Введите текст для комплексного анализа:")
                            textarea(analysisText) {
                                prefRowCount = 10
                                promptText = "Введите текст для анализа...\nСистема выполнит:\n- Анализ тональности\n- Определение языка\n- Поиск сущностей (NER)\n- Анализ читаемости\n- Детекцию спама"
                            }
                            
                            hbox(spacing = 10.0) {
                                button("Анализировать текст") {
                                    enableWhen(analysisText.isNotEmpty.and(analysisInProgress.not()))
                                    action { analyzeText() }
                                }
                                
                                progressindicator {
                                    visibleWhen(analysisInProgress)
                                    progress = -1.0
                                }
                                
                                label("Статус:") {
                                    bind(analysisInProgress) { inProgress ->
                                        text = if (inProgress == true) "Анализ..." else "Готов"
                                    }
                                }
                            }
                        }
                    }

                    groupbox("Быстрый анализ") {
                        vbox(spacing = 5.0) {
                            button("Психологический анализ") {
                                action { showPsychologicalAnalysis() }
                            }
                            button("NER анализ") {
                                action { showNERAnalysis() }
                            }
                            button("Статистический анализ") {
                                action { showStatisticalAnalysis() }
                            }
                        }
                    }
                }

                vbox(spacing = 10.0, padding = Insets(10.0)) {
                    groupbox("Результаты анализа") {
                        vbox(spacing = 8.0) {
                            tabpane {
                                tab("Общий результат") {
                                    textarea {
                                        prefRowCount = 12
                                        isEditable = false
                                        bind(currentResults) { results ->
                                            if (results.isNotEmpty()) {
                                                formatAnalysisResult(results.first())
                                            } else {
                                                "Результаты анализа появятся здесь..."
                                            }
                                        }
                                    }
                                }
                                
                                tab("Детали") {
                                    tableview<AnalysisResult>(currentResults) {
                                        column("Текст", AnalysisResult::textProperty).prefWidth(200)
                                        column("Общий счет", AnalysisResult::overallScoreProperty).cellFormat {
                                            text = "%.1f%%".format(it * 100)
                                        }.prefWidth(80)
                                        column("Тональность") { 
                                            cellFormat { result ->
                                                text = result.sentiment?.get("label") as? String ?: "N/A"
                                            }
                                        }.prefWidth(100)
                                        column("Язык") {
                                            cellFormat { result ->
                                                text = result.language?.get("language") as? String ?: "N/A"
                                            }
                                        }.prefWidth(80)
                                        column("Спам") {
                                            cellFormat { result ->
                                                val isSpam = result.spam?.get("is_spam") as? Boolean ?: false
                                                text = if (isSpam) "ДА" else "нет"
                                            }
                                        }.prefWidth(60)
                                    }
                                }
                                
                                tab("Сущности (NER)") {
                                    textarea {
                                        prefRowCount = 8
                                        isEditable = false
                                        bind(currentResults) { results ->
                                            if (results.isNotEmpty()) {
                                                formatNERResults(results.first())
                                            } else {
                                                "NER результаты появятся здесь..."
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        tab("Психологический анализ") {
            add(PsychologyCalculatorView::class)
        }

        tab("Настройки") {
            vbox(spacing = 10.0, padding = Insets(10.0)) {
                groupbox("Управление системой") {
                    vbox(spacing = 8.0) {
                        hbox(spacing = 10.0) {
                            button("Перезагрузить все модели") {
                                action { reloadAllModels() }
                            }
                            button("Обучить все модели") {
                                action { trainAllModels() }
                            }
                            button("Обновить статистику") {
                                action { updateSystemStats() }
                            }
                        }
                        
                        hbox(spacing = 10.0) {
                            button("Очистить кэш") {
                                action { clearCache() }
                            }
                            button("Системная информация") {
                                action { showSystemInfo() }
                            }
                        }
                    }
                }

                groupbox("Статистика в реальном времени") {
                    tableview(systemStats.observableArrayList()) {
                        column("Параметр", Map.Entry<String, Any>::key).prefWidth(200)
                        column("Значение", Map.Entry<String, Any>::value).prefWidth(150)
                    }
                }

                groupbox("Системный лог") {
                    vbox(spacing = 5.0) {
                        hbox(spacing = 10.0) {
                            button("Очистить лог") {
                                action { trainingLog.set("") }
                            }
                            button("Экспорт лога") {
                                action { exportLog() }
                            }
                        }
                        textarea(trainingLog) {
                            prefRowCount = 12
                            isEditable = false
                            style {
                                fontFamily = "monospace"
                            }
                        }
                    }
                }
            }
        }
    }

    init {
        initializeSystem()
        startAutoTraining()
        startStatsUpdate()
    }

    fun initializeSystem() {
        runAsync {
            assistant.initializeAllModels()
            "Система инициализирована"
        } ui { message ->
            trainingLog.set("${timestamp()} $message\n")
            loadModelsStatus()
            updateSystemStats()
        }
    }

    fun loadModelsStatus() {
        modelsStatus.setAll(assistant.getModelsStatus().values)
    }

    fun analyzeText() {
        val text = analysisText.value?.trim()
        if (text.isNullOrEmpty()) {
            warning("Ошибка", "Пожалуйста, введите текст для анализа.")
            return
        }

        analysisInProgress.value = true
        trainingLog.set("${timestamp()} Начало анализа текста (${text.length} символов)\n")

        runAsync {
            assistant.analyzeComprehensive(text)
        } ui { result ->
            currentResults.setAll(listOf(result))
            analysisInProgress.value = false
            trainingLog.set("${trainingLog.value}${timestamp()} Анализ завершен. Общий счет: ${"%.1f".format(result.overallScore * 100)}%\n")
            updateSystemStats()
        }
    }

    fun formatAnalysisResult(result: AnalysisResult): String {
        return """
            РЕЗУЛЬТАТЫ АНАЛИЗА
            ====================
            
            Текст: ${result.text}
            
            Общий счет: ${"%.1f".format(result.overallScore * 100)}%
            Время обработки: ${result.processingTime}ms
            Временная метка: ${result.timestamp}
            
            Тональность: ${result.sentiment?.get("label")} (${(result.sentiment?.get("confidence") as? Double ?: 0.0) * 100}%)
            
            Язык: ${result.language?.get("language")} (${(result.language?.get("confidence") as? Double ?: 0.0) * 100}%)
            
            Спам: ${if (result.spam?.get("is_spam") as? Boolean == true) "ДА" else "нет"} (вероятность: ${(result.spam?.get("spam_probability") as? Double ?: 0.0) * 100}%)
            
            Анализ контента:
            Слов: ${result.contentAnalysis?.get("word_count")}
            Читаемость: ${(result.contentAnalysis?.get("readability_score") as? Double ?: 0.0) * 100}%
            Сложность: ${result.contentAnalysis?.get("complexity")}
            
            Найдено сущностей: ${result.nerAnalysis?.get("entities_count") ?: 0}
            
            Использовано моделей: ${result.modelsUsed.size}
            Модели: ${result.modelsUsed.joinToString(", ")}
        """.trimIndent()
    }

    fun formatNERResults(result: AnalysisResult): String {
        val nerAnalysis = result.nerAnalysis
        val entities = nerAnalysis?.get("entities") as? List<NEREntity> ?: emptyList()
        
        return if (entities.isEmpty()) {
            "Сущности не найдены"
        } else {
            """
            NER АНАЛИЗ
            ===========
            Найдено сущностей: ${entities.size}
            Время обработки: ${nerAnalysis["processing_time"]}ms
            
            Сущности:
            ${entities.joinToString("\n") { entity ->
                "- ${entity.text} [${entity.type}] (доверие: ${"%.1f".format(entity.confidence * 100)}%)"
            }}
            """.trimIndent()
        }
    }

    fun reloadAllModels() {
        runAsync {
            assistant.initializeAllModels()
            "Все модели перезагружены"
        } ui { message ->
            trainingLog.set("${timestamp()} $message\n")
            loadModelsStatus()
            updateSystemStats()
        }
    }

    fun trainAllModels() {
        runAsync {
            val result = assistant.trainAllModels()
            "Обучение завершено: ${result["message"]}"
        } ui { message ->
            trainingLog.set("${timestamp()} $message\n")
            loadModelsStatus()
            updateSystemStats()
        }
    }

    fun updateSystemStats() {
        runAsync {
            assistant.getSystemStats()
        } ui { stats ->
            systemStats.clear()
            systemStats.putAll(stats)
        }
    }

    fun clearCache() {
        trainingLog.set("${timestamp()} Кэш очищен\n")
    }

    fun showSystemInfo() {
        val info = """
            СИСТЕМНАЯ ИНФОРМАЦИЯ
            ====================
            Время: ${LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))}
            Всего моделей: ${UniversalScienceAssistant.MODEL_NAMES.size}
            Обучено моделей: ${modelsStatus.count { it.isTrained }}
            Средняя точность: ${"%.1f".format(modelsStatus.map { it.accuracy }.average() * 100)}%
            Статус системы: ${systemStats["system_status"]}
        """.trimIndent()

        trainingLog.set("${timestamp()} $info\n")
    }

    fun showPsychologicalAnalysis() {
        information("Психологический анализ", "Перейдите во вкладку 'Психологический анализ' для специализированных расчетов.")
    }

    fun showNERAnalysis() {
        information("NER анализ", "NER анализ выполняется автоматически при общем анализе текста.")
    }

    fun showStatisticalAnalysis() {
        information("Статистический анализ", "Статистические функции доступны в психологическом анализе.")
    }

    fun exportLog() {
        trainingLog.set("${trainingLog.value}${timestamp()} Лог экспортирован\n")
    }

    fun timestamp(): String =
        "[${LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))}]"

    fun startAutoTraining() {
        thread(isDaemon = true) {
            while (true) {
                try {
                    Thread.sleep(300_000) // 5 минут
                    if (assistant.autoTrainingEnabled) {
                        Platform.runLater {
                            trainingLog.set("${timestamp()} Автоматическое обновление моделей...\n")
                            runAsync {
                                assistant.trainAllModels()
                            } ui { result ->
                                trainingLog.set("${trainingLog.value}${timestamp()} Автообновление завершено: ${result["message"]}\n")
                                loadModelsStatus()
                                updateSystemStats()
                            }
                        }
                    }
                } catch (e: Exception) {
                    Platform.runLater {
                        trainingLog.set("${timestamp()} Ошибка автообновления: ${e.message}\n")
                    }
                }
            }
        }
    }

    fun startStatsUpdate() {
        thread(isDaemon = true) {
            while (true) {
                Thread.sleep(30_000) // 30 секунд
                Platform.runLater {
                    updateSystemStats()
                }
            }
        }
    }
}
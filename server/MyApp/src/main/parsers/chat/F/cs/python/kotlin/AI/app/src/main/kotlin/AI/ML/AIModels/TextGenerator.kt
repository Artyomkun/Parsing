package AI.ML.AIModels

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleIntegerProperty
import javafx.beans.property.SimpleStringProperty
import javafx.collections.FXCollections
import javafx.scene.text.FontWeight
import javafx.scene.control.TabPane
import javafx.scene.control.Tab
import kotlin.random.Random
import javafx.geometry.Pos
import tornadofx.*

// ==================== TEXT GENERATOR ====================
class TextGeneratorModule(val seed: Long? = null) {
    val rnd = if (seed == null) Random.Default else Random(seed)
    val categoryTexts = mutableMapOf<String, List<String>>()
    val ngramModels = mutableMapOf<String, NGramModel>()

    class NGramModel(val n: Int = 3) {
        val ngrams = mutableMapOf<String, MutableList<String>>()
        val startTokens = mutableListOf<String>()
        
        fun addSentence(tokens: List<String>) {
            if (tokens.size < n) return
            
            startTokens.add(tokens.take(n).joinToString(" "))
            
            for (i in 0..tokens.size - n) {
                val ngram = tokens.subList(i, i + n - 1).joinToString(" ")
                val nextToken = tokens[i + n - 1]
                
                ngrams.getOrPut(ngram) { mutableListOf() }.add(nextToken)
            }
        }
        
        fun generateNextToken(context: List<String>): String? {
            if (context.size < n - 1) return null
            
            val currentNgram = context.takeLast(n - 1).joinToString(" ")
            val possibleNext = ngrams[currentNgram]
            
            return possibleNext?.random()
        }
        
        fun getStartSequence(): List<String> {
            return if (startTokens.isNotEmpty()) startTokens.random().split(" ") else emptyList()
        }
        
        val isTrained: Boolean
            get() = startTokens.isNotEmpty() && ngrams.isNotEmpty()
    }

    fun trainCategory(category: String, trainingTexts: List<String>) {
        categoryTexts[category] = trainingTexts
        val model = NGramModel(3)
        
        trainingTexts.forEach { text ->
            val tokens = tokenizeText(text)
            if (tokens.isNotEmpty()) {
                model.addSentence(tokens)
            }
        }
        
        ngramModels[category] = model
    }

    fun generateText(
        category: String,
        maxLength: Int = 50,
        temperature: Double = 0.8
    ): String {
        val model = ngramModels[category] ?: return "Модель для категории '$category' не обучена"
        if (!model.isTrained) return "Недостаточно данных для генерации"

        val tokens = mutableListOf<String>()
        val startSeq = model.getStartSequence()
        if (startSeq.isNotEmpty()) {
            tokens.addAll(startSeq)
        } else {
            return "Нет стартовых последовательностей"
        }
        
        while (tokens.size < maxLength) {
            val nextToken = model.generateNextToken(tokens)
            if (nextToken == null || nextToken == "</s>") break
            
            tokens.add(nextToken)
            
            if (nextToken.endsWith('.') || nextToken.endsWith('!') || nextToken.endsWith('?')) {
                if (tokens.size > 15) break
            }
        }
        
        return detokenizeText(tokens)
    }

    fun tokenizeText(text: String): List<String> {
        return text.toLowerCase()
            .replace(Regex("[^а-яёa-z0-9\\s]"), " ")
            .split(" ")
            .filter { it.isNotBlank() }
            .plus("</s>")
    }

    fun detokenizeText(tokens: List<String>): String {
        if (tokens.isEmpty()) return ""
        
        val result = StringBuilder()
        var prevToken = ""
        
        tokens.forEach { token ->
            when {
                token.matches(Regex("[.,!?;:]")) -> result.append(token)
                prevToken.isEmpty() -> result.append(token.replaceFirstChar { it.uppercase() })
                prevToken.matches(Regex("[.?!]")) -> result.append(" " + token.replaceFirstChar { it.uppercase() })
                else -> result.append(" $token")
            }
            prevToken = token
        }
        
        if (!prevToken.matches(Regex(".*[.?!]$"))) {
            result.append(".")
        }
        
        return result.toString().replace("\\s+".toRegex(), " ").trim()
    }

    fun availableCategories(): List<String> = ngramModels.keys.toList()

    fun isCategoryTrained(category: String): Boolean {
        return ngramModels[category]?.isTrained ?: false
    }

    fun getCategoryInfo(category: String): String {
        val model = ngramModels[category]
        return if (model != null) {
            "Модель '$category': ${model.ngrams.size} N-gram, ${model.startTokens.size} стартовых последовательностей"
        } else {
            "Модель '$category' не найдена"
        }
    }

    fun getTrainingStats(): Map<String, Int> {
        return ngramModels.mapValues { it.value.ngrams.size }
    }

    fun clearCategory(category: String) {
        categoryTexts.remove(category)
        ngramModels.remove(category)
    }

    fun clearAll() {
        categoryTexts.clear()
        ngramModels.clear()
    }
}

// ==================== VIEWMODEL ====================
class TextGeneratorViewModel : ViewModel() {
    val textGenerator = TextGeneratorModule()
    
    // UI Properties
    val inputCategory = SimpleStringProperty("")
    val inputTrainingText = SimpleStringProperty("")
    val generatedText = SimpleStringProperty("")
    val statusMessage = SimpleStringProperty("Генератор готов к работе")
    val selectedCategory = SimpleStringProperty("")
    val maxLength = SimpleIntegerProperty(50)
    val temperature = SimpleIntegerProperty(80)
    
    val availableCategories = FXCollections.observableArrayList<String>()
    val generationHistory = FXCollections.observableArrayList<String>()

    init {
        updateCategories()
    }

    fun updateCategories() {
        availableCategories.setAll(textGenerator.availableCategories())
        if (availableCategories.isNotEmpty() && selectedCategory.value.isBlank()) {
            selectedCategory.value = availableCategories.first()
        }
    }

    fun trainCategory() {
        val category = inputCategory.value.trim()
        val trainingText = inputTrainingText.value.trim()
        
        if (category.isEmpty() || trainingText.isEmpty()) {
            statusMessage.value = "Ошибка: заполните название категории и текст для обучения"
            return
        }
        
        runAsync {
            val sentences = trainingText.split(Regex("[.!?]+"))
                .map { it.trim() }
                .filter { it.isNotBlank() }
            
            if (sentences.size < 3) {
                "Нужно больше текста для обучения (минимум 3 предложения)"
            } else {
                textGenerator.trainCategory(category, sentences)
                updateCategories()
                "Категория '$category' обучена на ${sentences.size} предложениях"
            }
        } ui { message ->
            statusMessage.value = message
        }
    }

    fun generateText() {
        val category = selectedCategory.value
        if (category.isEmpty()) {
            statusMessage.value = "Выберите категорию для генерации"
            return
        }
        
        if (!textGenerator.isCategoryTrained(category)) {
            statusMessage.value = "Категория '$category' не обучена"
            return
        }
        
        runAsync {
            val actualTemperature = temperature.value / 100.0
            textGenerator.generateText(
                category = category,
                maxLength = maxLength.value,
                temperature = actualTemperature
            )
        } ui { result ->
            generatedText.value = result
            if (!result.contains("ошибка", ignoreCase = true) && !result.contains("не обучена")) {
                generationHistory.add(0, "[$category] $result")
                if (generationHistory.size > 20) generationHistory.removeLast()
                statusMessage.value = "Текст сгенерирован для категории '$category'"
            } else {
                statusMessage.value = result
            }
        }
    }

    fun getCategoryInfo(): String {
        val category = selectedCategory.value
        return if (category.isNotBlank()) {
            textGenerator.getCategoryInfo(category)
        } else {
            "Категория не выбрана"
        }
    }

    fun getTrainingStats(): String {
        val stats = textGenerator.getTrainingStats()
        return if (stats.isNotEmpty()) {
            "Обучено категорий: ${stats.size}\n" +
            stats.entries.joinToString("\n") { " • ${it.key}: ${it.value} N-gram" }
        } else {
            "Модели не обучены"
        }
    }

    fun clearCategory() {
        val category = selectedCategory.value
        if (category.isNotBlank()) {
            textGenerator.clearCategory(category)
            updateCategories()
            statusMessage.value = "Категория '$category' очищена"
        }
    }

    fun clearAllModels() {
        textGenerator.clearAll()
        updateCategories()
        statusMessage.value = "Все модели очищены"
        generationHistory.clear()
    }

    fun exportTrainingData(): String {
        val stats = textGenerator.getTrainingStats()
        val history = generationHistory.take(10)
        
        return buildString {
            appendLine("=== Статистика обучения TextGenerator ===")
            appendLine("Обучено категорий: ${stats.size}")
            appendLine()
            appendLine("Детали по категориям:")
            stats.forEach { (category, ngramCount) ->
                appendLine(" • $category: $ngramCount N-gram")
            }
            appendLine()
            appendLine("Последние генерации:")
            history.forEachIndexed { index, text ->
                appendLine("${index + 1}. $text")
            }
        }
    }
}

// ==================== MAIN VIEW ====================
class TextGeneratorView : View("Text Generator - N-gram модели") {
    val viewModel = TextGeneratorViewModel()

    override val root = borderpane {
        paddingAll = 20.0

        top = vbox(10.0) {
            label("Генератор текста на N-gram моделях") {
                style {
                    fontSize = 24.px
                    fontWeight = FontWeight.BOLD
                }
            }
            label(viewModel.statusMessage)
        }

        center = tabpane {
            tabClosingPolicy = TabPane.TabClosingPolicy.UNAVAILABLE

            tab("Обучение моделей") {
                trainingTab()
            }

            tab("Генерация текста") {
                generationTab()
            }

            tab("Управление моделями") {
                managementTab()
            }

            tab("История генераций") {
                historyTab()
            }
        }
    }

    private fun Tab.trainingTab() {
        content = form {
            fieldset("Обучение новой категории") {
                field("Название категории") {
                    textfield(viewModel.inputCategory) {
                        promptText = "Введите название категории (например: наука, техника, литература)..."
                    }
                }

                field("Текст для обучения") {
                    textarea(viewModel.inputTrainingText) {
                        promptText = "Введите текст для обучения модели. Разделяйте предложения точками..."
                        prefRowCount = 8
                    }
                }

                button("Обучить модель") {
                    action { viewModel.trainCategory() }
                    enableWhen { 
                        viewModel.inputCategory.isNotEmpty()
                            .and(viewModel.inputTrainingText.isNotEmpty()) 
                    }
                }

                field("Статус обучения") {
                    textarea(viewModel.statusMessage) {
                        isEditable = false
                        prefRowCount = 2
                    }
                }
            }
        }
    }

    private fun Tab.generationTab() {
        content = form {
            fieldset("Генерация текста") {
                field("Выберите категорию") {
                    combobox(viewModel.selectedCategory, viewModel.availableCategories)
                }

                field("Настройки генерации") {
                    hbox(20.0) {
                        vbox(5.0) {
                            label("Макс. длина: ${viewModel.maxLength.value}")
                            slider(10, 200, viewModel.maxLength.value) {
                                bind(viewModel.maxLength)
                            }
                        }
                        
                        vbox(5.0) {
                            label("Температура: ${viewModel.temperature.value}%")
                            slider(0, 100, viewModel.temperature.value) {
                                bind(viewModel.temperature)
                            }
                        }
                    }
                }

                button("Сгенерировать текст") {
                    action { viewModel.generateText() }
                    enableWhen { viewModel.selectedCategory.isNotEmpty() }
                }

                field("Сгенерированный текст") {
                    textarea(viewModel.generatedText) {
                        isEditable = false
                        prefRowCount = 6
                    }
                }

                field("Информация о категории") {
                    textarea(viewModel.getCategoryInfo()) {
                        isEditable = false
                        prefRowCount = 2
                    }
                }
            }
        }
    }

    private fun Tab.managementTab() {
        content = vbox(20.0) {
            label("Управление моделями") {
                style {
                    fontSize = 18.px
                    fontWeight = FontWeight.BOLD
                }
            }

            form {
                fieldset("Операции с моделями") {
                    field("Выберите категорию") {
                        combobox(viewModel.selectedCategory, viewModel.availableCategories)
                    }

                    hbox(10.0) {
                        button("Очистить категорию") {
                            action { viewModel.clearCategory() }
                            enableWhen { viewModel.selectedCategory.isNotEmpty() }
                        }

                        button("Очистить все модели") {
                            action { viewModel.clearAllModels() }
                        }

                        button("Экспорт статистики") {
                            action {
                                val stats = viewModel.exportTrainingData()
                                find<StatsDialog>().openModal(stats)
                            }
                        }
                    }
                }

                fieldset("Статистика обучения") {
                    textarea(viewModel.getTrainingStats()) {
                        isEditable = false
                        prefRowCount = 6
                    }
                }
            }
        }
    }

    private fun Tab.historyTab() {
        content = vbox(10.0) {
            label("История генераций") {
                style {
                    fontSize = 18.px
                    fontWeight = FontWeight.BOLD
                }
            }

            listview(viewModel.generationHistory) {
                prefHeight = 400.0
                cellFormat { text = it }
            }

            hbox(10.0) {
                button("Очистить историю") {
                    action { viewModel.generationHistory.clear() }
                }

                button("Экспорт истории") {
                    action {
                        val historyText = viewModel.generationHistory.joinToString("\n\n")
                        find<HistoryDialog>().openModal(historyText)
                    }
                }
            }
        }
    }
}

// ==================== DIALOGS ====================
class StatsDialog : Fragment() {
    var statsText: String = ""
    
    fun openModal(stats: String) {
        statsText = stats
        openModal(block = true)
    }
    
    override val root = borderpane {
        title = "Статистика обучения"
        paddingAll = 20.0
        
        center = textarea(statsText) {
            isEditable = false
            prefRowCount = 15
            prefColumnCount = 60
        }
        
        bottom = hbox(10.0) {
            alignment = Pos.CENTER_RIGHT
            button("Закрыть") {
                action { close() }
            }
        }
    }
}

class HistoryDialog : Fragment() {
    var historyText: String = ""
    
    fun openModal(history: String) {
        historyText = history
        openModal(block = true)
    }
    
    override val root = borderpane {
        title = "История генераций"
        paddingAll = 20.0
        
        center = textarea(historyText) {
            isEditable = false
            prefRowCount = 15
            prefColumnCount = 60
        }
        
        bottom = hbox(10.0) {
            alignment = Pos.CENTER_RIGHT
            button("Закрыть") {
                action { close() }
            }
        }
    }
}

// ==================== APPLICATION LAUNCHER ====================
class TextGeneratorApp : App(TextGeneratorView::class)

fun main() {
    launch<UniversalApp>()
}
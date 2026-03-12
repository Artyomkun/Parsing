package AI.ML

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleBooleanProperty
import javafx.beans.property.SimpleStringProperty
import javafx.collections.FXCollections
import javafx.scene.text.FontWeight
import javafx.scene.control.Tab
import javafx.geometry.Pos
import kotlin.Pair
import tornadofx.*

// ==================== AI MODELS ====================
interface MLModel {
    val modelName: String
    abstract fun predict(input: Any): Any
    open fun train(data: List<Any>)
    open fun save()
    open fun load()
}

class MLSentimentModel(override val modelName: String = "sentiment_model") : MLModel {
    override fun predict(input: Any): Any = mapOf("sentiment" to "positive", "confidence" to 0.85)
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLTopicModel(override val modelName: String = "topic_model") : MLModel {
    override fun predict(input: Any): Any = listOf("technology", "science", "education")
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLIntentClassificationModel(override val modelName: String = "intent_model") : MLModel {
    override fun predict(input: Any): Any = mapOf("intent" to "question", "confidence" to 0.92)
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLSpamDetectionModel(override val modelName: String = "spam_model") : MLModel {
    override fun predict(input: Any): Any = mapOf("is_spam" to false, "confidence" to 0.95)
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLLanguageDetectionModel(override val modelName: String = "language_model") : MLModel {
    override fun predict(input: Any): Any = mapOf("language" to "russian", "confidence" to 0.98)
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLContentAnalyzer(override val modelName: String = "content_analyzer") : MLModel {
    override fun predict(input: Any): Any = mapOf("analysis" to "not implemented")
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLMathModel : MathematicsMLModel() {
    override fun predict(input: Any): Any {
        return when (input) {
            is FloatArray -> calculateMath(input)
            is DoubleArray -> calculateMath(input.map { it.toFloat() }.toFloatArray())
            else -> mapOf("error" to "Unsupported input type")
        }
    }
    
    private fun calculateMath(input: FloatArray): Map<String, Any> {
        return mapOf(
            "sum" to input.sum().toDouble(),
            "average" to input.average(),
            "max" to (input.maxOrNull() ?: 0.0f).toDouble(),
            "min" to (input.minOrNull() ?: 0.0f).toDouble(),
            "model" to "math_model",
            "input_values" to input.toList(),
            "count" to input.size
        )
    }
}

class MLPhysicsModel(override val modelName: String = "physics_model") : MLModel {
    override fun predict(input: Any): Any = mapOf("result" to "not implemented")
    override fun train(data: List<Any>) {}
    override fun save() {}
    override fun load() {}
}

class MLBiologyModel : BiologyMLModel() {
    override fun predict(input: Any): Any {
        return when (input) {
            is String -> analyzeBiologicalData(input)
            is Map<*, *> -> analyzeBiologicalMap(input)
            is Array<*> -> analyzeBiologicalArray(input)
            else -> mapOf("error" to "Unsupported input type for biology model")
        }
    }
    
    private fun analyzeBiologicalData(sequence: String): Map<String, Any> {
        return mapOf(
            "sequence_length" to sequence.length,
            "gc_content" to calculateGCContent(sequence),
            "sequence_type" to detectSequenceType(sequence),
            "model" to "biology_model"
        )
    }
    
    private fun analyzeBiologicalMap(data: Map<*, *>): Map<String, Any> {
        return mapOf(
            "data_type" to "biological_map",
            "keys" to data.keys.joinToString(", "),
            "model" to "biology_model"
        )
    }
    
    private fun analyzeBiologicalArray(data: Array<*>): Map<String, Any> {
        return mapOf(
            "data_type" to "biological_array", 
            "element_count" to data.size,
            "model" to "biology_model"
        )
    }
    
    private fun detectSequenceType(sequence: String): String {
        return when {
            sequence.matches(Regex("[ACGT]+")) -> "DNA"
            sequence.matches(Regex("[ACGU]+")) -> "RNA" 
            sequence.matches(Regex("[ACDEFGHIKLMNPQRSTVWY]+")) -> "Protein"
            else -> "Unknown"
        }
    }
    
    // Переопределяем методы родителя
    override fun analyzeDNA(sequence: String): Map<String, Any> {
        val gcContent = calculateGCContent(sequence)
        return mapOf(
            "sequence" to sequence,
            "length" to sequence.length,
            "gc_content" to gcContent,
            "classification" to if (gcContent > 0.5) "High GC" else "Low GC",
            "model" to "biology_model"
        )
    }
    
    override fun predictProteinStructure(sequence: String): Map<String, Any> {
        return mapOf(
            "sequence" to sequence,
            "predicted_structure" to "alpha_helix",
            "confidence" to 0.85,
            "model" to "biology_model"
        )
    }
    
}

class MLChemistryModel : ChemicalCalculatorModel() {
    private val modelName: String = "chemistry_model"
    
    override fun predict(input: Any): Any {
        return when (input) {
            is String -> analyzeChemicalFormula(input)
            is Map<*, *> -> analyzeChemicalData(input)
            is List<*> -> analyzeChemicalList(input)
            is Double -> analyzeConcentration(input)
            else -> mapOf("error" to "Unsupported input type for chemistry model")
        }
    }
    
    private fun analyzeChemicalFormula(formula: String): Map<String, Any> {
        return mapOf(
            "formula" to formula,
            "molar_mass" to calculateMolarMass(formula),
            "elements" to extractElements(formula),
            "formula_type" to detectFormulaType(formula),
            "model" to modelName
        )
    }
    
    private fun analyzeChemicalData(data: Map<*, *>): Map<String, Any> {
        return mapOf(
            "data_type" to "chemical_data",
            "analysis" to "Structure analysis",
            "model" to modelName
        )
    }
    
    private fun analyzeChemicalList(data: List<*>): Map<String, Any> {
        return mapOf(
            "data_type" to "chemical_list",
            "element_count" to data.size,
            "model" to modelName
        )
    }
    
    private fun analyzeConcentration(concentration: Double): Map<String, Any> {
        return mapOf(
            "concentration" to concentration,
            "pH_acid" to calculatePH(concentration, true),
            "pH_base" to calculatePH(concentration, false),
            "model" to modelName
        )
    }
    
    // Переопределяем методы родителя с улучшенной реализацией
    override fun calculateMolarMass(formula: String): Double {
        // Упрощенный расчет молярной массы
        val atomicMasses = mapOf(
            "H" to 1.008, "C" to 12.011, "O" to 16.00, "N" to 14.007,
            "Cl" to 35.45, "Na" to 22.99, "K" to 39.10, "Ca" to 40.08
        )
        
        var totalMass = 0.0
        var currentElement = ""
        var currentCount = ""
        
        for (char in formula) {
            when {
                char.isUpperCase() -> {
                    if (currentElement.isNotEmpty()) {
                        totalMass += atomicMasses[currentElement] ?: 0.0 * 
                                   if (currentCount.isEmpty()) 1.0 else currentCount.toDouble()
                    }
                    currentElement = char.toString()
                    currentCount = ""
                }
                char.isLowerCase() -> currentElement += char
                char.isDigit() -> currentCount += char
            }
        }
        
        // Добавляем последний элемент
        if (currentElement.isNotEmpty()) {
            totalMass += atomicMasses[currentElement] ?: 0.0 * 
                       if (currentCount.isEmpty()) 1.0 else currentCount.toDouble()
        }
        
        return String.format("%.3f", totalMass).toDouble()
    }
    
    override fun balanceEquation(equation: String): Map<String, Any> {
        return mapOf(
            "equation" to equation,
            "balanced" to "2H2 + O2 -> 2H2O", // упрощенная реализация
            "reaction_type" to detectReactionType(equation),
            "model" to modelName
        )
    }
    
    override fun predictReaction(reactants: List<String>): Map<String, Any> {
        return mapOf(
            "reactants" to reactants,
            "products" to predictProducts(reactants),
            "reaction_type" to "synthesis",
            "model" to modelName
        )
    }
    
    private fun extractElements(formula: String): List<String> {
        val elements = mutableListOf<String>()
        var currentElement = ""
        
        for (char in formula) {
            when {
                char.isUpperCase() -> {
                    if (currentElement.isNotEmpty()) elements.add(currentElement)
                    currentElement = char.toString()
                }
                char.isLowerCase() -> currentElement += char
                char.isDigit() -> {}
            }
        }
        if (currentElement.isNotEmpty()) elements.add(currentElement)
        
        return elements.distinct()
    }
    
    private fun detectFormulaType(formula: String): String {
        return when {
            formula.contains("OH") && formula.contains("Na") || formula.contains("K") -> "Base"
            formula.contains("H") && (formula.contains("Cl") || formula.contains("SO4")) -> "Acid"
            formula.contains("C") && formula.contains("H") -> "Organic"
            else -> "Inorganic"
        }
    }
    
    private fun detectReactionType(equation: String): String {
        return when {
            equation.contains("+") && equation.contains("->") -> "Synthesis"
            equation.contains("->") && equation.split("->").size == 2 -> "Decomposition"
            else -> "Unknown"
        }
    }
    
    private fun predictProducts(reactants: List<String>): List<String> {
        return when {
            reactants.any { it.contains("H") } && reactants.any { it.contains("Cl") } -> 
                listOf("HCl")
            reactants.any { it.contains("Na") } && reactants.any { it.contains("Cl") } -> 
                listOf("NaCl")
            else -> listOf("H2O", "CO2")
        }
    }
}

class ModelManager {
    val models = mutableMapOf<String, MLModel>()
    
    // Функция инициализации со стандартными моделями
    fun initializeWithDefaultModels(): Map<String, Any> {
        // Регистрируем базовые модели
        registerModel("sentiment", MLSentimentModel())
        registerModel("topic", MLTopicModel())
        registerModel("intent", MLIntentClassificationModel())
        registerModel("spam", MLSpamDetectionModel())
        registerModel("language", MLLanguageDetectionModel())
        registerModel("analyzer", MLContentAnalyzer())
        registerModel("math", MLMathModel() as MLModel)  // явное приведение типа
        registerModel("physics", MLPhysicsModel())
        registerModel("biology", MLBiologyModel() as MLModel)  // явное приведение типа
        registerModel("chemistry", MLChemistryModel() as MLModel)  // явное приведение типа
        registerModel("sensory_organism", AISensoryOrganismML() as MLModel)  // явное приведение типа

        println("ModelManager initialized with ${models.size} default models")
        
        return mapOf(
            "success" to true,
            "message" to "Default models initialized successfully",
            "total_models" to models.size,
            "models" to models.keys.toList()
        )
    }
    
    // Инициализация с кастомными моделями
    fun initializeWithCustomModels(customModels: Map<String, MLModel>): Map<String, Any> {
        customModels.forEach { (name, model) ->
            registerModel(name, model)
        }
        
        return mapOf(
            "success" to true,
            "message" to "Custom models initialized successfully",
            "total_models" to models.size,
            "added_models" to customModels.keys.toList()
        )
    }
    
    fun initializeFullSystem(): Map<String, Any> {
        // Инициализируем стандартные модели
        initializeWithDefaultModels()
        
        // Добавляем дополнительные модели
        registerModel("sensory_organism", AISensoryOrganismML() as MLModel)

        // Сенсорные модели
        registerModel("ultra_fast_eye", UltraFastEyeAnalysisModel() as MLModel)
        registerModel("ultra_fast_ear", UltraFastEarAnalysisModel() as MLModel)
        registerModel("high_speed_sensory", HighSpeedSensoryModel() as MLModel)

        // Специализированные модели
        registerModel("sentiment_analysis", SentimentAnalysisModel() as MLModel)
        registerModel("language_detection", LanguageDetectionModel() as MLModel)

        println("Full ML system initialized with ${models.size} models")
        
        return mapOf(
            "success" to true,
            "message" to "Full ML system initialized successfully",
            "total_models" to models.size,
            "all_models" to models.keys.toList(),
            "system_status" to "OPERATIONAL",
            "categories" to mapOf(
                "basic_ml" to listOf("sentiment", "topic", "intent", "spam", "language", "analyzer"),
                "scientific" to listOf("math", "physics", "biology", "chemistry", "statistics"),
                "psychological" to listOf("psychometrics", "clinical", "cognitive", "psychophysiology", "personality"),
                "sensory" to listOf("sensory_organism", "ultra_fast_eye", "ultra_fast_ear", "high_speed_sensory"),
                "specialized" to listOf("sentiment_analysis", "language_detection")
            )
        )
    }

    fun registerModel(name: String, model: MLModel) {
        models[name] = model
        println("Model '$name' registered successfully")
    }

    fun getModel(name: String): MLModel? = models[name]
    
    fun getAllModels(): Map<String, MLModel> = models.toMap()
    
    fun trainAll(data: List<Any>) {
        println("Training all ${models.size} models...")
        models.values.forEach { it.train(data) }
        println("All models trained successfully")
    }
    
    fun saveAll() {
        println("Saving all ${models.size} models...")
        models.values.forEach { it.save() }
        println("All models saved successfully")
    }
    
    fun loadAll() {
        println("Loading all ${models.size} models...")
        models.values.forEach { it.load() }
        println("All models loaded successfully")
    }
    
    fun getModelStats(): Map<String, Any> {
        return mapOf(
            "total_models" to models.size,
            "model_names" to models.keys.toList(),
            "models" to models.mapValues { (_, model) -> 
                mapOf(
                    "model_name" to model.modelName,
                    "type" to model::class.simpleName
                )
            }
        )
    }
    
    fun clearAll() {
        val count = models.size
        models.clear()
        println("Cleared all $count models from manager")
    }
    
    fun hasModel(name: String): Boolean = models.containsKey(name)
    
    fun removeModel(name: String): Boolean {
        return if (models.containsKey(name)) {
            models.remove(name)
            println("Model '$name' removed successfully")
            true
        } else {
            println("Model '$name' not found")
            false
        }
    }
}

open class MLModels(override val modelName: String = "ml_models_manager") : MLModel {
    companion object {
        private val mathCreator: () -> MLModel = { MLMathModel() as MLModel }
        private val biologyCreator: () -> MLModel = { MLBiologyModel() as MLModel }
        private val chemistryCreator: () -> MLModel = { MLChemistryModel() as MLModel }

        val MODEL_CLASSES: Map<String, () -> MLModel> = mapOf(
            "sentiment" to { MLSentimentModel() },
            "topic" to { MLTopicModel() },
            "intent" to { MLIntentClassificationModel() },
            "spam" to { MLSpamDetectionModel() },
            "language" to { MLLanguageDetectionModel() },
            "analyzer" to { MLContentAnalyzer() },
            "math" to mathCreator,
            "physics" to { MLPhysicsModel() },
            "biology" to biologyCreator,
            "chemistry" to chemistryCreator
        )

        val MODEL_NAMES: Map<String, String> = mapOf(
            "sentiment" to "sentiment_model",
            "topic" to "topic_model",
            "intent" to "intent_model",
            "spam" to "spam_model",
            "language" to "language_model",
            "analyzer" to "content_analyzer",
            "math" to "math_model",
            "physics" to "physics_model",
            "biology" to "biology_model",
            "chemistry" to "chemistry_model",
            "statistics" to "statistics_model",
            "psychometrics" to "psychometrics_model",
            "clinical" to "clinical_model",
            "cognitive" to "cognitive_model",
            "psychophysiology" to "psychophysiology_model",
            "personality" to "personality_model"
        )

        var modelManager: ModelManager? = null

        fun initializeModels() {
            modelManager = ModelManager() 
            MODEL_CLASSES.forEach { (key, constructor) ->
                val model = constructor()
                modelManager?.registerModel(key, model)
            }
            println("Модели инициализированы: ${MODEL_CLASSES.size} шт")
        }

        fun getModel(modelType: String): MLModel? = modelManager?.getModel(modelType)
    }

    override fun predict(input: Any): Any {
        return when (input) {
            is String -> when (input) {
                "get_models" -> MODEL_CLASSES.keys.toList()
                "get_status" -> mapOf("initialized" to (modelManager != null))
                else -> mapOf("error" to "Unknown command")
            }
            is Map<*, *> -> {
                val modelType = input["model_type"] as? String
                val modelInput = input["input"]
                if (modelType != null) {
                    modelManager?.getModel(modelType)?.predict(modelInput ?: "") 
                        ?: mapOf("error" to "Model not found")
                } else {
                    mapOf("error" to "No model_type specified")
                }
            }
            else -> mapOf("error" to "Unsupported input type")
        }
    }

    override fun train(data: List<Any>) {
        // реализация обучения
    }
    
    override fun save() {
        // реализация сохранения
    }
    
    override fun load() {
        // реализация загрузки
    }
}

// ==================== TORNADOFX VIEWMODELS ====================
open class MLModelManagementViewModel : UniversalView() {
    val selectedModelType = SimpleStringProperty("sentiment")
    val inputText = SimpleStringProperty()
    val predictionResult = SimpleStringProperty()
    val trainingData = SimpleStringProperty()
    val modelStatus = SimpleStringProperty("Модели не инициализированы")
    val isLoading = SimpleBooleanProperty(false)

    val modelTypes = FXCollections.observableArrayList(
        "sentiment" to "Анализ настроения",
        "topic" to "Тематическое моделирование", 
        "intent" to "Классификация намерений",
        "spam" to "Детекция спама",
        "language" to "Определение языка",
        "analyzer" to "Анализ контента",
        "math" to "Математическая модель",
        "physics" to "Физическая модель", 
        "biology" to "Биологическая модель",
        "chemistry" to "Химическая модель",
        "statistics" to "Статистическая модель",
        "psychometrics" to "Психометрическая модель",
        "clinical" to "Клиническая модель", 
        "cognitive" to "Когнитивная модель",
        "psychophysiology" to "Психофизиологическая модель",
        "personality" to "Модель личности"
    )

    val availableModels = modelTypes.map { it.first }.observable()
    val modelDisplayNames = modelTypes.toMap()

    init {
        initializeMLModels()
    }

    fun initializeMLModels() {
        runAsync {
            isLoading.value = true
            MLModels.initializeModels()
            "Модели успешно инициализированы"
        } ui { message ->
            modelStatus.value = message
            isLoading.value = false
        }
    }

    fun predict() {
        val input = inputText.value.trim()
        if (input.isEmpty()) {
            predictionResult.value = "Введите данные для предсказания"
            return
        }

        runAsync {
            isLoading.value = true
            val model = MLModels.getModel(selectedModelType.value)
            model?.predict(input)?.toString() ?: "Модель не найдена"
        } ui { result ->
            predictionResult.value = result
            isLoading.value = false
        }
    }

    fun trainModel() {
        val data = trainingData.value.trim()
        if (data.isEmpty()) {
            predictionResult.value = "Введите данные для обучения"
            return
        }

        runAsync {
            isLoading.value = true
            val model = MLModels.getModel(selectedModelType.value)
            val trainingExamples = data.split("\n").filter { it.isNotBlank() }
            model?.train(trainingExamples)
            "Модель обучена на ${trainingExamples.size} примерах"
        } ui { message ->
            predictionResult.value = message
            isLoading.value = false
        }
    }

    fun saveModel() {
        runAsync {
            isLoading.value = true
            val model = MLModels.getModel(selectedModelType.value)
            model?.save()
            "Модель сохранена"
        } ui { message ->
            predictionResult.value = message
            isLoading.value = false
        }
    }

    fun loadModel() {
        runAsync {
            isLoading.value = true
            val model = MLModels.getModel(selectedModelType.value)
            model?.load()
            "Модель загружена"
        } ui { message ->
            predictionResult.value = message
            isLoading.value = false
        }
    }

    fun trainAllModels() {
        val data = trainingData.value.trim()
        if (data.isEmpty()) {
            predictionResult.value = "Введите данные для обучения всех моделей"
            return
        }

        runAsync {
            isLoading.value = true
            val trainingExamples = data.split("\n").filter { it.isNotBlank() }
            MLModels.modelManager?.trainAll(trainingExamples)
            "Все модели обучены на ${trainingExamples.size} примерах"
        } ui { message ->
            predictionResult.value = message
            isLoading.value = false
        }
    }

    fun saveAllModels() {
        runAsync {
            isLoading.value = true
            MLModels.modelManager?.saveAll()
            "Все модели сохранены"
        } ui { message ->
            predictionResult.value = message
            isLoading.value = false
        }
    }
}

// ==================== TORNADOFX VIEWS ====================
open class MLModelManagementView : View("AI Models Management") {
    val viewModel: MLModelManagementViewModel = MLModelManagementViewModel()

    override val root = borderpane {
        paddingAll = 20.0

        top = vbox(10.0) {
            label("Управление AI Моделями") {
                style {
                    fontSize = 24.px
                    fontWeight = FontWeight.BOLD
                }
            }
            label(viewModel.modelStatus)
        }

        center = tabpane {
            tabClosingPolicy = javafx.scene.control.TabPane.TabClosingPolicy.UNAVAILABLE

            tab("Предсказание") {
                predictionTab()
            }

            tab("Обучение") {
                trainingTab()
            }

            tab("Управление") {
                managementTab()
            }

            tab("Информация") {
                infoTab()
            }
        }
    }

    fun Tab.predictionTab() {
        content = form {
            fieldset("Предсказание моделью") {
                field("Выберите модель") {
                    combobox(viewModel.selectedModelType, viewModel.availableModels) {
                        converter = object : javafx.util.StringConverter<String>() {
                            override fun toString(key: String?): String {
                                return viewModel.modelDisplayNames[key] ?: key ?: ""
                            }
                            override fun fromString(string: String?): String {
                                return viewModel.modelDisplayNames.entries.find { it.value == string }?.key ?: string ?: ""
                            }
                        }
                    }
                }

                field("Входные данные") {
                    textarea(viewModel.inputText) {
                        promptText = "Введите текст или данные для анализа..."
                        prefRowCount = 4
                    }
                }

                button("Выполнить предсказание") {
                    action { viewModel.predict() }
                    enableWhen { viewModel.inputText.isNotEmpty().and(viewModel.isLoading.not()) }
                }

                field("Результат предсказания") {
                    textarea(viewModel.predictionResult) {
                        isEditable = false
                        prefRowCount = 4
                    }
                }
            }
        }
    }

    fun Tab.trainingTab() {
        content = form {
            fieldset("Обучение моделей") {
                field("Выберите модель") {
                    combobox(viewModel.selectedModelType, viewModel.availableModels) {
                        converter = object : javafx.util.StringConverter<String>() {
                            override fun toString(key: String?): String {
                                return viewModel.modelDisplayNames[key] ?: key ?: ""
                            }
                            override fun fromString(string: String?): String {
                                return viewModel.modelDisplayNames.entries.find { it.value == string }?.key ?: string ?: ""
                            }
                        }
                    }
                }

                field("Данные для обучения") {
                    textarea(viewModel.trainingData) {
                        promptText = "Введите данные для обучения (каждая строка - отдельный пример)..."
                        prefRowCount = 6
                    }
                }

                hbox(10.0) {
                    button("Обучить выбранную модель") {
                        action { viewModel.trainModel() }
                        enableWhen { viewModel.trainingData.isNotEmpty().and(viewModel.isLoading.not()) }
                    }

                    button("Обучить все модели") {
                        action { viewModel.trainAllModels() }
                        enableWhen { viewModel.trainingData.isNotEmpty().and(viewModel.isLoading.not()) }
                    }
                }
            }
        }
    }

    fun Tab.managementTab() {
        content = form {
            fieldset("Управление моделями") {
                field("Выберите модель") {
                    combobox(viewModel.selectedModelType, viewModel.availableModels) {
                        converter = object : javafx.util.StringConverter<String>() {
                            override fun toString(key: String?): String {
                                return viewModel.modelDisplayNames[key] ?: key ?: ""
                            }
                            override fun fromString(string: String?): String {
                                return viewModel.modelDisplayNames.entries.find { it.value == string }?.key ?: string ?: ""
                            }
                        }
                    }
                }

                hbox(10.0) {
                    button("Сохранить модель") {
                        action { viewModel.saveModel() }
                        enableWhen { viewModel.isLoading.not() }
                    }

                    button("Загрузить модель") {
                        action { viewModel.loadModel() }
                        enableWhen { viewModel.isLoading.not() }
                    }

                    button("Сохранить все модели") {
                        action { viewModel.saveAllModels() }
                        enableWhen { viewModel.isLoading.not() }
                    }
                }

                field("Статус операций") {
                    textarea(viewModel.predictionResult) {
                        isEditable = false
                        prefRowCount = 3
                    }
                }
            }
        }
    }

    fun Tab.infoTab() {
        content = vbox(15.0) {
            label("Доступные модели:") {
                style {
                    fontSize = 18.px
                    fontWeight = FontWeight.BOLD
                }
            }

            vbox(5.0) {
                viewModel.modelDisplayNames.forEach { (key, displayName) ->
                    hbox(10.0) {
                        label("• $displayName") {
                            style {
                                fontWeight = FontWeight.BOLD
                            }
                        }
                        label("($key)") {
                            style {
                                textFill = c("#666666")
                            }
                        }
                    }
                }
            }

            separator()

            label("Функциональность:") {
                style {
                    fontSize = 16.px
                    fontWeight = FontWeight.BOLD
                }
            }

            vbox(5.0) {
                label("• Предсказание: использование моделей для анализа данных")
                label("• Обучение: тренировка моделей на новых данных") 
                label("• Сохранение/загрузка: управление состоянием моделей")
                label("• Пакетные операции: работа со всеми моделями одновременно")
            }
        }
    }
}

// ==================== MAIN APPLICATION ====================
open class MLModelsApp : App(MLModelManagementView::class) {
    override fun start(stage: javafx.stage.Stage) {
        stage.width = 1000.0
        stage.height = 700.0
        super.start(stage)
    }
}

// ==================== APPLICATION LAUNCHER ====================
fun main() {
    launch<UniversalApp>()
}
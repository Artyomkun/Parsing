package AI.ML

import AI.Core.*
import AI.ML.*
import AI.ML.MLModels
import AI.ML.AIModels.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import tornadofx.*

interface MLModelService : MLModel {
    fun predict(text: String): Map<String, Any>
}

class MLService {
    val models = mutableMapOf<String, MLModelService>()
    val modelStatus = mutableMapOf<String, ModelStatus>()
    val modelManager = ModelManager()

    init {
        initializeMLModels()
    }

    fun initializeMLModels(): Map<String, Any> {
        val initResult = modelManager.initializeFullSystem()
        
        modelManager.getAllModels().forEach { (key, model) ->
            // Убираем as? и используем безопасное приведение
            val modelService = model as? MLModelService
            if (modelService != null) {
                models[key] = modelService
                
                // Создаем MemoryUsage с правильными параметрами
                val runtime = Runtime.getRuntime()
                val totalGB = runtime.maxMemory() / 1024.0 / 1024.0 / 1024.0
                val availableGB = runtime.freeMemory() / 1024.0 / 1024.0 / 1024.0
                val usedPercent = ((runtime.totalMemory() - runtime.freeMemory()) / runtime.maxMemory().toDouble()) * 100.0
                
                modelStatus[key] = ModelStatus(
                    categoriesLoaded = listOf("default"),
                    trainingHistoryCount = 0,
                    memoryUsage = MemoryUsage(
                        totalGB = totalGB,
                        availableGB = availableGB,
                        usedPercent = usedPercent,
                        modelsInMemory = models.size
                    ),
                    lastTraining = mapOf("timestamp" to System.currentTimeMillis())
                )
            }
        }

        val modelCount = models.size
        val modelNames = models.keys.joinToString()
        
        println("Все AI модели инициализированы через MLModels: $modelCount моделей")
        println("Доступные модели: $modelNames")

        return mapOf(
            "success" to true,
            "message" to "Models initialized successfully through MLModels system",
            "total_models" to modelCount,
            "models" to modelNames.split(", "),
            "initialized_via" to "MLModelsManager",
            "system_status" to "OPERATIONAL"
        )
    }

    fun analyzeText(text: String): Map<String, Any> {
        val results = mutableMapOf<String, Any>()
        
        models["sentiment"]?.let { 
            results["sentiment"] = it.predict(text)
        }
        models["spam"]?.let {
            results["spam"] = it.predict(text)
        }
        models["language"]?.let {
            results["language"] = it.predict(text)
        }
        models["analyzer"]?.let {
            results["contentAnalysis"] = it.predict(text)
        }

        return mapOf(
            "success" to true,
            "analysis" to results,
            "text_length" to text.length,
            "word_count" to text.split("\\s+".toRegex()).size,
            "models_used" to results.keys.toList()
        )
    }

    fun getModelStatus(): List<MLModelItem> {
        return models.map { (key, model) ->
            MLModelItem().apply {
                name = key.replaceFirstChar { it.uppercase() }
                type = model::class.simpleName ?: "Unknown"
                status = "ACTIVE"
                accuracy = when (key) {
                    "sentiment" -> 0.87
                    "spam" -> 0.92
                    "language" -> 0.95
                    else -> 0.8
                }
                description = when (key) {
                    "sentiment" -> "Analyzes text sentiment"
                    "spam" -> "Detects spam content"
                    "language" -> "Identifies text language"
                    "analyzer" -> "Content analysis and classification"
                    else -> "AI model for various tasks"
                }
                accuracyPercent = "${(accuracy * 100).toInt()}%"
            }
        }
    }

    fun getModelStatusInfo(modelName: String): ModelStatus? {
        return modelStatus[modelName]
    }

    fun updateModelStatus(modelName: String, categories: List<String> = emptyList()) {
        val runtime = Runtime.getRuntime()
        val totalGB = runtime.maxMemory() / 1024.0 / 1024.0 / 1024.0
        val availableGB = runtime.freeMemory() / 1024.0 / 1024.0 / 1024.0
        val usedPercent = ((runtime.totalMemory() - runtime.freeMemory()) / runtime.maxMemory().toDouble()) * 100.0
        
        modelStatus[modelName] = ModelStatus(
            categoriesLoaded = categories,
            trainingHistoryCount = modelStatus[modelName]?.trainingHistoryCount?.plus(1) ?: 0,
            memoryUsage = MemoryUsage(
                totalGB = totalGB,
                availableGB = availableGB,
                usedPercent = usedPercent,
                modelsInMemory = models.size
            ),
            lastTraining = mapOf("timestamp" to System.currentTimeMillis())
        )
    }

    fun getModel(name: String): MLModelService? = models[name]
    
    fun trainModel(name: String, data: List<Any>): Boolean {
        return models[name]?.let { model ->
            model.train(data)
            updateModelStatus(name, listOf("trained"))
            true
        } ?: false
    }
    
    fun getSystemInfo(): Map<String, Any> {
        val runtime = Runtime.getRuntime()
        val totalGB = runtime.maxMemory() / 1024.0 / 1024.0 / 1024.0
        val availableGB = runtime.freeMemory() / 1024.0 / 1024.0 / 1024.0
        val usedPercent = ((runtime.totalMemory() - runtime.freeMemory()) / runtime.maxMemory().toDouble()) * 100.0
        
        return mapOf(
            "total_models" to models.size,
            "active_models" to modelStatus.size,
            "model_names" to models.keys.toList(),
            "service_status" to "RUNNING",
            "memory_usage" to MemoryUsage(
                totalGB = totalGB,
                availableGB = availableGB,
                usedPercent = usedPercent,
                modelsInMemory = models.size
            )
        )
    }
}

fun main() {
    launch<UniversalApp>()
}
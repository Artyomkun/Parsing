package AI.FiveD.Services

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlinx.serialization.Serializable


@Serializable
data class NeuralNetworkState(
    val neurons: Map<String, UniversalModel>,
    val totalNeurons: Int,
    val totalConnections: Int,
    val dimensions: Int,
    val memoryUsage: Long,
    val processingTime: Long,
    val timestamp: String,
    val x: Double, 
    val y: Double,
    val z: Double
)

@Serializable
data class UniversalModel(
    val x: Double,
    val y: Double,
    val z: Double,
    val layer: Int,
    val dimension: String,
    val activation: Double,
    val connections: List<String>,
    val weights: Map<String, Double>,
    val bias: Double,
    val lastUpdate: String,
    val modelType: String,
    val category: String,
    val accuracy: Double = 0.0,
    val isActive: Boolean = true,
    val id: String,
    val name: String, 
    val architecture: List<Int> = emptyList(),
    val parameters: Map<String, Any> = emptyMap(),
    val capabilities: List<String> = emptyList(),
    val position: List<Double> = emptyList()
) {
    fun toNeuralNode(): Neural5D = Neural5D(
        id = id,
        name = name,
        modelType = modelType,
        category = category,
        architecture = architecture,
        weights = weights,
        bias = bias,
        lastUpdate = lastUpdate,
        isActive = isActive,
        activation = activation,
        connections = connections,  
        position = position.ifEmpty { calculate5DPosition(category, id) },
        parameters = parameters + mapOf(
            "x" to x,
            "y" to y,
            "z" to z,
            "layer" to layer,
            "dimension" to dimension,
            "accuracy" to accuracy,
            "connections" to capabilities.size.toDouble(),
            "isActive" to isActive,
            "id" to id,
            "name" to name,
            "modelType" to modelType,
            "category" to category,
            "architecture" to architecture,
            "parameters" to parameters,
            "capabilities" to capabilities,
            "position" to position
        ),
        description = "$category: $modelType",
        currentActivation = if (isActive) 0.7 else 0.1,
        isInputNode = category == "input",
        isOutputNode = category == "output"
    )
    
    fun calculate5DPosition(category: String, id: String): List<Double> {
        val cHash = category.hashCode().toDouble()
        val iHash = id.hashCode().toDouble()
        return listOf(
            kotlin.math.sin(cHash * 0.1) * 2.0, 
            kotlin.math.cos(cHash * 0.1) * 2.0,
            kotlin.math.sin(iHash * 0.01) * 1.0,
            (cHash % 100) * 0.01,
            (iHash % 100) * 0.01
        )
    }
}

// ==================== DATA CLASSES ====================


@Serializable
data class ModelStatus(
    val categoriesLoaded: List<String>,
    val trainingHistoryCount: Int,
    val memoryUsage: MemoryUsage,
    val lastTraining: Map<String, Any>? = null
)

@Serializable
data class MemoryUsage(
    val totalGB: Double,
    val availableGB: Double, 
    val usedPercent: Double,
    val modelsInMemory: Int,
    val usedGB: Double = totalGB - availableGB,
    val freeGB: Double = availableGB, 
    val status: String = when {
        usedPercent > 90.0 -> "CRITICAL"
        usedPercent > 75.0 -> "HIGH" 
        usedPercent > 50.0 -> "MODERATE"
        else -> "LOW"
    },
    val timestamp: Long = System.currentTimeMillis(),
    val jvmHeapUsed: Long = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory(),
    val jvmHeapMax: Long = Runtime.getRuntime().maxMemory(),
    val jvmHeapFree: Long = Runtime.getRuntime().freeMemory()
)

@Serializable
data class ContentAnalysis(
    val textAnalysis: Map<String, Any>,
    val structureAnalysis: Map<String, Any>,
    val classification: Map<String, Any>,
    val summary: Map<String, Any>,
    val combinedTextLength: Int,
    val memoryEfficient: Boolean
)

@Serializable
data class Data(
    val data: DataSection,
    val analysis: AnalysisSection,
    val contentType: String,
    val sourceUrl: String,
    val timestamp: Long
)

@Serializable
data class DataSection(
    val title: String,
    val headings: List<Heading>,
    val paragraphs: List<String>,
    val links: List<String>,
    val images: List<String>
)

@Serializable
data class AnalysisSection(
    val headingCount: Int,
    val paragraphCount: Int,
    val linkCount: Int,
    val imageCount: Int,
    val totalTextLength: Int
)

@Serializable
data class DataLoader(
    val dataDir: String = DataLoaderConfig.DATA_DIR,
    val Files: List<String> = emptyList(),
    val stats: DataLoaderStats? = null,
    val config: DataLoaderConfig = DataLoaderConfig()
) {
    fun saveDataToZip(
        dataList: List<Data>, 
        customDir: String? = null,
        zipFileName: String = "${System.currentTimeMillis().toString(16)}.zip"
    ) {
        val savePath = customDir ?: dataDir
        val zipFile = File(savePath, zipFileName)
        
        ZipOutputStream(FileOutputStream(zipFile)).use { zipOut ->
            val allData = dataList.joinToString("|##|") { data ->
                "${data.data.title}||${data.contentType}||${data.sourceUrl}||${data.timestamp}||${
                    data.data.paragraphs.joinToString("|||")
                }"
            }
            
            val entry = ZipEntry("data.dat")
            zipOut.putNextEntry(entry)
            zipOut.write(allData.toByteArray())
            zipOut.closeEntry()
        }
        
        println("Saved to ZIP: ${zipFile.absolutePath}")
    }
}

@Serializable
data class Heading(
    val level: Int,
    val text: String,
    val id: String = "",
    val metadata: Map<String, Any> = emptyMap()
)

@Serializable
data class DataStats(
    val totalSamples: Int,
    val contentTypes: Map<String, Int>,
    val fileCount: Int,
    val averageTextLength: Long = 0,
    val dataQuality: String = "no_data",
    val classBalance: String = "no_data"
)

@Serializable
data class ContentTypeAnalysis(
    val totalSamples: Int,
    val contentTypeDistribution: Map<String, Int>,
    val classBalanceAssessment: String,
    val recommendations: List<String>
)

@Serializable
data class DataRecord(
    val sourceUrl: String,
    val timestamp: Long,
    val contentType: String,
    val title: String,
    val metaDescription: String,
    val headingCount: Int,
    val paragraphCount: Int,
    val totalTextLength: Long,
)

@Serializable
data class TypeStats(
    val count: Int,
    val avgTextLength: Long,
    val minTextLength: Long,
    val maxTextLength: Long,
    val totalTextLength: Long
)

@Serializable
data class BatchCleaningResult(
    val operations: MutableMap<String, Any> = mutableMapOf()
)

@Serializable
data class DuplicateAnalysis(
    val totalFiles: Int,
    val uniqueFiles: Int,
    val duplicateGroups: Int,
    val duplicateFiles: Int,
    val duplicateGroupsDetail: Map<String, List<String>>
)

@Serializable
data class FixResult(
    var fixedFiles: Int = 0,
    var fixedContentTypes: Int = 0,
    var fixedTitles: Int = 0,
    val errors: MutableList<String> = mutableListOf()
)

@Serializable
data class CollectionResult(
    val totalUrls: Int,
    var successful: Int,
    var failed: Int,
    val errors: MutableList<String>
)

@Serializable
data class AnalysisData(
    val headingCount: Int,
    val paragraphCount: Int,
    val linkCount: Int,
    val imageCount: Int,
    val totalTextLength: Int
)

@Serializable
data class Link(
    val text: String,
    val href: String
)

@Serializable
data class Image(
    val src: String,
    val alt: String
)

@Serializable
data class ContentData(
    val title: String,
    val metaDescription: String,
    val headings: List<Heading>,
    val paragraphs: List<String>,
    val links: List<Link>,
    val images: List<Image>
)

@Serializable
data class WebResult(
    val title: String,
    val link: String,
    val snippet: String
) {
    fun toMap(): Map<String, Any> = mapOf(
        "title" to title,
        "link" to link,
        "snippet" to snippet
    )
}

open class UniversalModelSystem {
    val modelRegistry = mutableMapOf<String, UniversalModel>()
    val categoryRegistry = mutableMapOf<String, MutableList<String>>()
    
    fun autoDiscoverAndInitialize() {   
        println("Initializing Universal Model System...")
        registerAllModels()
    }
    
    fun registerAllModels() { 
        println("Registering all models...")
    }
    
    fun registerModel(model: UniversalModel) {
        println("Registering model: ${model.id}")
        modelRegistry[model.id] = model
        categoryRegistry.getOrPut(model.category) { mutableListOf() }.add(model.id)
    }
    
    fun getAllModels(): List<UniversalModel> = modelRegistry.values.toList()
    
    fun getModelsByCategory(category: String): List<UniversalModel> {
        println("Getting models by category: $category")
        return categoryRegistry[category]?.mapNotNull { modelRegistry[it] } ?: emptyList()
    }
    
    fun findModelsByCapability(capability: String): List<UniversalModel> {
        println("Finding models by capability: $capability")
        return modelRegistry.values.filter { capability in it.capabilities }
    }
        
    fun getModelById(id: String): UniversalModel? {
        println("Getting model by id: $id")
        return modelRegistry[id]
    }
}
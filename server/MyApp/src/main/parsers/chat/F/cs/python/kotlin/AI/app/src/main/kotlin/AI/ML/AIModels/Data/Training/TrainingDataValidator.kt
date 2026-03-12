package AI.ML.AIModels.Data.Training
import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlinx.serialization.Serializable
import java.net.URLEncoder
import kotlinx.serialization.json.Json
import mu.KotlinLogging
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant

val logger = KotlinLogging.logger {}

class GoogleCSESearch {
    
    val apiKey: String = System.getenv("GOOGLE_API_KEY")
    val searchEngineId: String = System.getenv("GOOGLE_CX") 
    val baseUrl: String = "https://www.googleapis.com/customsearch/v1"
    val maxResultsPerType: Int = System.getenv("MAX_RESULTS_PER_TYPE")?.toIntOrNull() ?: 20
    val requestDelayMs: Long = System.getenv("REQUEST_DELAY_MS")?.toLongOrNull() ?: 1000L
    
    companion object {
        private const val MAX_RESULTS_PER_QUERY = 10
    }
    
    /**
     * Результат поиска
     */
    @Serializable
    data class SearchResult(
        val title: String,
        val link: String,
        val snippet: String,
        val displayLink: String
    )
    
    /**
     * Ответ API Google Custom Search
     */
    @Serializable
    data class GoogleSearchResponse(
        val items: List<SearchItem>? = null,
        val queries: SearchQueries? = null,
        val error: GoogleError? = null
    )
    
    @Serializable
    data class SearchItem(
        val title: String,
        val link: String,
        val snippet: String,
        val displayLink: String
    )
    
    @Serializable
    data class SearchQueries(
        val request: List<QueryInfo>? = null,
        val nextPage: List<QueryInfo>? = null
    )
    
    @Serializable
    data class QueryInfo(
        val startIndex: Int? = null,
        val count: Int? = null
    )
    
    @Serializable
    data class GoogleError(
        val code: Int,
        val message: String
    )

    fun validateConfiguration(): ConfigurationStatus {
        return ConfigurationStatus(
            apiKeyConfigured = apiKey.isNotBlank(),
            searchEngineIdConfigured = searchEngineId.isNotBlank(),
            searchEngineId = searchEngineId,
            apiKeyPreview = if (apiKey.length > 10) "${apiKey.take(10)}..." else "invalid",
            maxResultsPerType = maxResultsPerType,
            requestDelayMs = requestDelayMs,
            missingConfigurations = getMissingConfigurations()
        )
    }
    
    fun getMissingConfigurations(): List<String> {
        val missing = mutableListOf<String>()
        if (apiKey.isBlank()) {
            missing.add("GOOGLE_API_KEY not properly configured")
        }
        if (searchEngineId.isBlank()) {
            missing.add("GOOGLE_CX not configured")
        }
        return missing
    }
    
    fun searchByContentType(contentType: String, maxResults: Int = maxResultsPerType): List<SearchResult> {
        val configStatus = validateConfiguration()
        if (!configStatus.isFullyConfigured) {
            throw IllegalStateException("Google CSE not properly configured. Missing: ${configStatus.missingConfigurations.joinToString()}")
        }
        
        logger.info { "Searching for $contentType content (max: $maxResults results)" }
        
        val queries = generateSearchQueries(contentType)
        val allResults = mutableListOf<SearchResult>()
        
        queries.forEachIndexed { index, query ->
            try {
                logger.debug { "Executing search query ${index + 1}/${queries.size}: '$query'" }
                
                val results = performSearch(query, maxResultsPerQuery = MAX_RESULTS_PER_QUERY)
                allResults.addAll(results)
                
                logger.info { "Found ${results.size} results for query: '$query' (total: ${allResults.size})" }
                
                // Задержка для соблюдения лимитов API
                if (index < queries.size - 1) {
                    Thread.sleep(requestDelayMs)
                }
                
            } catch (e: Exception) {
                logger.error(e) { "Failed to search for query: '$query'" }
            }
        }
        
        val distinctResults = allResults.distinctBy { it.link }.take(maxResults)
        logger.info { "Total unique results for $contentType: ${distinctResults.size}" }
        return distinctResults
    }
    
    fun generateSearchQueries(contentType: String): List<String> {
        return when (contentType.lowercase()) {
            "news" -> listOf(
                "новости технологии сегодня",
                "искусственный интеллект новости",
                "машинное обучение события",
                "IT новости 2024",
                "технологические инновации"
            )
            "ecommerce" -> listOf(
                "интернет магазин электроники",
                "онлайн покупки отзывы",
                "доставка товаров интернет",
                "распродажа техники",
                "купить онлайн безопасно"
            )
            "blog" -> listOf(
                "технический блог программирование",
                "личный опыт разработки",
                "IT блог советы",
                "опыт использования технологий",
                "блог машинное обучение"
            )
            "technical" -> listOf(
                "техническая документация API",
                "руководство программирование Kotlin",
                "код примеры алгоритмы",
                "технические спецификации",
                "документация библиотеки"
            )
            "educational" -> listOf(
                "обучение программированию онлайн",
                "курсы машинное обучение",
                "образовательные материалы ИИ",
                "учебные пособия технологии",
                "онлайн образование IT"
            )
            "entertainment" -> listOf(
                "игры технологии обзор",
                "развлечения технологии",
                "технологии в кино",
                "искусственный интеллект развлечения",
                "технологии музыка"
            )
            else -> listOf(
                "технологии будущее",
                "инновации 2024",
                "цифровая трансформация",
                "современные технологии"
            )
        }
    }

    fun performSearch(query: String, maxResultsPerQuery: Int = 10): List<SearchResult> {
        val results = mutableListOf<SearchResult>()
        var startIndex = 1
        
        while (results.size < maxResultsPerQuery) {
            val url = buildSearchUrl(query, startIndex)
            val response = makeApiRequest(url)
            
            response?.items?.let { items ->
                val searchResults = items.map { item ->
                    SearchResult(
                        title = item.title,
                        link = item.link,
                        snippet = item.snippet,
                        displayLink = item.displayLink
                    )
                }
                results.addAll(searchResults)
                
                if (searchResults.size < MAX_RESULTS_PER_QUERY) {
                    break
                }
                startIndex += MAX_RESULTS_PER_QUERY
            } ?: break

            if (results.size >= maxResultsPerQuery) {
                break
            }
        }
        
        return results.take(maxResultsPerQuery)
    }

    private fun buildSearchUrl(query: String, startIndex: Int = 1): String {
        val encodedQuery = URLEncoder.encode(query, "UTF-8")
        return "$baseUrl?key=$apiKey&cx=$searchEngineId&q=$encodedQuery&start=$startIndex&num=$MAX_RESULTS_PER_QUERY"
    }
    
    private fun makeApiRequest(urlString: String): GoogleSearchResponse? {
        return try {
            val url = URL(urlString)
            val connection = url.openConnection() as HttpURLConnection
            connection.apply {
                requestMethod = "GET"
                connectTimeout = 15000
                readTimeout = 15000
                setRequestProperty("User-Agent", "ML-Training-Data-Collector/1.0")
                setRequestProperty("Accept", "application/json")
            }
            
            logger.debug { "Making API request to: ${urlString.replace(apiKey, "***")}" }
            
            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                connection.inputStream.use { inputStream ->
                    val jsonString = inputStream.bufferedReader().use { it.readText() }
                    Json.decodeFromString<GoogleSearchResponse>(jsonString)
                }
            } else {
                val errorStream = connection.errorStream?.bufferedReader()?.use { it.readText() }
                logger.error { "API request failed with status: ${connection.responseCode}. Response: $errorStream" }
                null
            }
        } catch (e: Exception) {
            logger.error(e) { "Failed to make API request" }
            null
        }
    }
    
    fun convertToTrainingData(searchResults: List<SearchResult>, contentType: String): List<TrainingData> {
        return searchResults.mapIndexed { index, result ->
            TrainingData(
                data = DataSection(
                    title = result.title,
                    headings = listOf(Heading(level = 1, text = result.title)),
                    paragraphs = listOf(result.snippet),
                    links = listOf(result.link),
                    images = emptyList()
                ),
                analysis = AnalysisSection(
                    headingCount = 1,
                    paragraphCount = 1,
                    linkCount = 1,
                    imageCount = 0,
                    totalTextLength = result.snippet.length
                ),
                contentType = contentType,
                sourceUrl = result.link,
                timestamp = Instant.now().epochSecond + index
            )
        }
    }
    
    fun testConnection(): Boolean {
        return try {
            val testQuery = "технологии"
            val results = performSearch(testQuery, 1)
            results.isNotEmpty().also { success ->
                if (success) {
                    logger.info { "Google CSE connection test successful" }
                } else {
                    logger.error { "Google CSE connection test failed - no results returned" }
                }
            }
        } catch (e: Exception) {
            logger.error(e) { "Google CSE connection test failed" }
            false
        }
    }
}

@Serializable
data class ConfigurationStatus(
    val apiKeyConfigured: Boolean,
    val searchEngineIdConfigured: Boolean,
    val searchEngineId: String,
    val apiKeyPreview: String,
    val maxResultsPerType: Int,
    val requestDelayMs: Long,
    val missingConfigurations: List<String>
) {
    val isFullyConfigured: Boolean
        get() = apiKeyConfigured && searchEngineIdConfigured
}


class EnhancedDataCollector(
    val googleSearch: GoogleCSESearch = GoogleCSESearch(),
    val dataLoader: TrainingDataLoader = TrainingDataLoader()
) {
    
    fun collectComprehensiveDataset(
        samplesPerType: Int? = null,
        contentTypes: List<String> = listOf("news", "blog", "technical", "educational", "ecommerce")
    ): DataCollectionResult {
        val configStatus = googleSearch.validateConfiguration()
        if (!configStatus.isFullyConfigured) {
            return DataCollectionResult(
                success = false,
                collectedData = emptyList(),
                error = "Configuration incomplete: ${configStatus.missingConfigurations.joinToString()}",
                configurationStatus = configStatus
            )
        }
        
        if (!googleSearch.testConnection()) {
            return DataCollectionResult(
                success = false,
                collectedData = emptyList(),
                error = "Google CSE connection test failed",
                configurationStatus = configStatus
            )
        }
        
        val actualSamplesPerType = samplesPerType ?: configStatus.maxResultsPerType
        val allData = mutableListOf<TrainingData>()
        
        contentTypes.forEachIndexed { typeIndex, contentType ->
            try {
                logger.info { "[${typeIndex + 1}/${contentTypes.size}] Collecting $contentType content..." }
                
                val searchResults = googleSearch.searchByContentType(contentType, actualSamplesPerType)
                val trainingData = googleSearch.convertToTrainingData(searchResults, contentType)
                trainingData.forEach { data ->
                    dataLoader.saveTrainingData(data)
                }
                
                allData.addAll(trainingData)
                logger.info { "Collected ${trainingData.size} samples for $contentType" }
                
            } catch (e: Exception) {
                logger.error(e) { "Failed to collect data for content type: $contentType" }
            }
        }
        
        return DataCollectionResult(
            success = true,
            collectedData = allData,
            error = null,
            configurationStatus = configStatus,
            summary = CollectionSummary(
                totalSamples = allData.size,
                contentTypes = contentTypes.size,
                uniqueSources = allData.map { it.sourceUrl }.toSet().size
            )
        )
    }
}


@Serializable
data class DataCollectionResult(
    val success: Boolean,
    val collectedData: List<TrainingData>,
    val error: String?,
    val configurationStatus: ConfigurationStatus,
    val summary: CollectionSummary? = null
)

@Serializable
data class CollectionSummary(
    val totalSamples: Int,
    val contentTypes: Int,
    val uniqueSources: Int
)

class CSEUtils {
    companion object {
        fun generateUsageReport(result: DataCollectionResult): String {
            val collectedData = result.collectedData
            val byType = collectedData.groupBy { it.contentType }
            
            return buildString {
                appendLine("GOOGLE CSE DATA COLLECTION REPORT")
                appendLine("==================================================")
                appendLine("Collection Status: ${if (result.success) "SUCCESS" else "FAILED"}")
                appendLine("Timestamp: ${Instant.now()}")
                appendLine("")
                
                appendLine("CONFIGURATION:")
                appendLine("  Search Engine ID: ${result.configurationStatus.searchEngineId}")
                appendLine("  API Key: ${result.configurationStatus.apiKeyPreview}")
                appendLine("  Max Results Per Type: ${result.configurationStatus.maxResultsPerType}")
                appendLine("  Request Delay: ${result.configurationStatus.requestDelayMs}ms")
                appendLine("")
                
                if (result.success) {
                    appendLine("COLLECTION RESULTS:")
                    appendLine("  Total samples collected: ${collectedData.size}")
                    appendLine("  Content types: ${result.summary?.contentTypes ?: 0}")
                    appendLine("  Unique sources: ${result.summary?.uniqueSources ?: 0}")
                    appendLine("")
                    
                    appendLine("DISTRIBUTION BY CONTENT TYPE:")
                    byType.entries.sortedByDescending { it.value.size }.forEach { (type, data) ->
                        val percentage = (data.size.toDouble() / collectedData.size * 100).toInt()
                        appendLine("  $type: ${data.size} samples ($percentage%)")
                    }
                } else {
                    appendLine("ERROR: ${result.error}")
                }
            }
        }
    }
}

// ==================== ПРИМЕР ИСПОЛЬЗОВАНИЯ ====================

fun main() {
    println("Google CSE Data Collection")
    println("Using your configured API key and Search Engine ID")
    println()
    
    val googleSearch = GoogleCSESearch()
    
    // Проверка конфигурации
    val configStatus = googleSearch.validateConfiguration()
    println("CONFIGURATION STATUS:")
    println("  Search Engine ID: ${configStatus.searchEngineId}")
    println("  API Key: ${configStatus.apiKeyPreview}")
    println("  Max Results: ${configStatus.maxResultsPerType}")
    println("  Request Delay: ${configStatus.requestDelayMs}ms")
    println("  Fully configured: ${if (configStatus.isFullyConfigured) "YES" else "NO"}")
    
    if (!configStatus.isFullyConfigured) {
        println("\nConfiguration issues found:")
        configStatus.missingConfigurations.forEach { println("  - $it") }
        return
    }
    
    // Тестирование соединения
    println("\nTesting Google CSE connection...")
    val connectionTest = googleSearch.testConnection()
    if (!connectionTest) {
        println("Connection test failed. Please check your API key and network connection.")
        return
    }
    
    println("Connection test successful!")
    
    val collector = EnhancedDataCollector()
    
    try {
        println("\nStarting data collection...")
        val result = collector.collectComprehensiveDataset(
            samplesPerType = 10,
            contentTypes = listOf("news", "blog", "technical", "educational")
        )
        
        val report = CSEUtils.generateUsageReport(result)
        println(report)
        
        if (result.success) {
            val validator = TrainingDataValidator()
            val validationResult = validator.validateDataset(result.collectedData)
            val validationReport = validator.generateValidationReport(validationResult)
            
            println("\nDATA VALIDATION RESULTS")
            println("==================================================")
            println(validationReport)
            println("\nSaving collected data...")
            result.collectedData.forEach { data ->
                collector.dataLoader.saveTrainingData(data)
            }
            println("Data collection completed successfully!")
        }
        
    } catch (e: Exception) {
        println("Data collection failed: ${e.message}")
        e.printStackTrace()
    }
}
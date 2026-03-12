package AI.ML.AIModels.Data

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.Data.Training.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import mu.KotlinLogging
import org.jsoup.Jsoup
import java.io.File
import tornadofx.*

class DataCollector(val dataDir: String = "data") {
    
    private val logger = KotlinLogging.logger {}
    
    private val USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
    init {
        File(dataDir).mkdirs()
        logger.info { "DataCollector initialized with directory: $dataDir" }
    }
    
    fun collectFromUrls(
        urls: List<String>,
        delay: Double = 1.0,
        timeout: Int = 15
    ): CollectionResult {
        val result = CollectionResult(
            totalUrls = urls.size,
            successful = 0,
            failed = 0,
            errors = mutableListOf()
        )
        
        urls.forEachIndexed { index, url ->
            try {
                logger.info { "Collecting from ${index + 1}/${urls.size}: $url" }
                
                if (index > 0) {
                    Thread.sleep((delay * 1000).toLong())
                }
                
                val data = parseUrl(url, timeout)
                if (data != null) {
                    if (saveData(data, url)) {
                        result.successful++
                        logger.info { "Successfully collected data from $url" }
                    } else {
                        result.failed++
                        result.errors.add("Failed to save data from $url")
                        logger.error { "Failed to save data from $url" }
                    }
                } else {
                    result.failed++
                    result.errors.add("No data collected from $url")
                    logger.warn { "No data collected from $url" }
                }
                
            } catch (e: Exception) {
                result.failed++
                result.errors.add("Error collecting from $url: ${e.message}")
                logger.error { "Error collecting from $url: ${e.message}" }
            }
        }
        
        logger.info { "Collection completed: ${result.successful}/${urls.size} successful" }
        return result
    }
    
    fun collectByContentType(
        contentTypes: List<String> = listOf("news", "technical", "educational"),
        maxPerType: Int = 10,
        delay: Double = 1.0
    ): Map<String, CollectionResult> {
        val results = mutableMapOf<String, CollectionResult>()
        
        contentTypes.forEach { contentType ->
            // Используем базовые URL для каждого типа контента
            val baseUrls = getBaseUrlsForType(contentType)
            val urlsToProcess = baseUrls.take(maxPerType)
            
            logger.info { "Collecting $contentType data from ${urlsToProcess.size} URLs" }
            
            val result = collectFromUrls(urlsToProcess, delay)
            results[contentType] = result
        }
        
        return results
    }
    
    private fun getBaseUrlsForType(contentType: String): List<String> {
        return when (contentType) {
            "news" -> listOf("https://ria.ru", "https://rbc.ru", "https://lenta.ru")
            "technical" -> listOf("https://habr.com", "https://stackoverflow.com")
            "educational" -> listOf("https://stepik.org", "https://coursera.org")
            else -> emptyList()
        }
    }
    
    fun parseUrl(url: String, timeout: Int = 15): Data? {
        return try {
            val response = Jsoup.connect(url)
                .userAgent(USER_AGENT)
                .timeout(timeout * 1000)
                .execute()
            
            val soup = response.parse()
            soup.select("script, style, nav, footer, header, aside").forEach { it.remove() }
            
            val title = soup.title()?.trim() ?: ""
            val metaDesc = soup.selectFirst("meta[name=description]")
            val metaDescription = metaDesc?.attr("content")?.trim() ?: ""
            
            val headings = mutableListOf<Heading>()
            for (i in 1..6) {
                soup.select("h$i").forEach { heading ->
                    val text = heading.text().trim()
                    if (text.isNotEmpty() && text.length > 3) {
                        headings.add(Heading(level = i, text = text))
                    }
                }
            }
            
            val paragraphs = mutableListOf<String>()
            soup.select("p").forEach { p ->
                val text = p.text().trim()
                if (text.isNotEmpty() && text.length > 20) {
                    paragraphs.add(text)
                }
            }
            
            val links = mutableListOf<Link>()
            soup.select("a[href]").forEach { a ->
                val href = a.attr("href")
                val text = a.text().trim()
                if (href.startsWith("http") && text.isNotEmpty()) {
                    links.add(Link(text = text, href = href))
                }
            }
            
            val images = mutableListOf<Image>()
            soup.select("img[src]").forEach { img ->
                val src = img.attr("src")
                val alt = img.attr("alt")
                if (src.startsWith("http")) {
                    images.add(Image(src = src, alt = alt))
                }
            }
            
            val contentType = detectContentType(title, headings, paragraphs, url)
            
            Data(
                data = DataSection(
                    title = title,
                    headings = headings.take(15),
                    paragraphs = paragraphs.take(30),
                    links = links.map { it.href }.take(20),
                    images = images.map { it.src }.take(10)
                ),
                analysis = AnalysisSection(
                    headingCount = headings.size,
                    paragraphCount = paragraphs.size,
                    linkCount = links.size,
                    imageCount = images.size,
                    totalTextLength = paragraphs.sumOf { it.length } + title.length
                ),
                contentType = contentType,
                sourceUrl = url,
                timestamp = System.currentTimeMillis()
            )
            
        } catch (e: Exception) {
            logger.error { "Error parsing URL $url: ${e.message}" }
            null
        }
    }
    
    fun detectContentType(
        title: String,
        headings: List<Heading>,
        paragraphs: List<String>,
        url: String
    ): String {
        val headingTexts = headings.joinToString(" ") { it.text }
        val firstParagraphs = paragraphs.take(3).joinToString(" ")
        val combinedText = "$title $headingTexts $firstParagraphs".lowercase()
        
        val keywordPatterns = mapOf(
            "news" to listOf("новости", "news", "события", "политика", "экономика"),
            "technical" to listOf("технологи", "программирование", "код", "it", "digital"),
            "educational" to listOf("обучение", "курс", "урок", "образование", "студент")
        )
        
        val scores = mutableMapOf<String, Int>()
        keywordPatterns.forEach { (contentType, keywords) ->
            val score = keywords.count { keyword -> keyword in combinedText }
            scores[contentType] = score
        }
        
        return if (scores.isNotEmpty()) {
            val predictedType = scores.maxByOrNull { it.value }?.key ?: "general"
            if (scores[predictedType]!! > 0) predictedType else "general"
        } else {
            "general"
        }
    }
    
    fun saveData(data: Data, url: String): Boolean {
        return try {
            val safeFilename = url.replace(Regex("[^\\w\\-_.]"), "_").take(50)
            val filename = "data_${System.currentTimeMillis()}_${safeFilename}.json"
            val filepath = File(dataDir, filename)
            
            val json = Json { prettyPrint = true }
            filepath.writeText(json.encodeToString(data))
            
            true
        } catch (e: Exception) {
            logger.error { "Error saving data: ${e.message}" }
            false
        }
    }

    fun getAvailableContentTypes(): List<String> {
        return listOf("news", "technical", "educational", "general")
    }
}

fun main() {
    launch<UniversalApp>()
}
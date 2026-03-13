package AI.ML.AIModels.Data
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.Data.Training.*
import kotlinx.serialization.encodeToString
import kotlin.io.path.createDirectories
import kotlinx.serialization.json.Json
import kotlin.random.Random
import kotlin.io.path.Path
import org.jsoup.Jsoup
import java.io.File
import tornadofx.*

fun enhancedCollectData(): Int {

    val qualityUrls = listOf(
        "https://ria.ru/",
        "https://www.rbc.ru/",
        "https://lenta.ru/",
        "https://www.kommersant.ru/",
        "https://habr.com/ru/all/",
        "https://vc.ru/",
        "https://dzen.ru/",
        "https://www.wildberries.ru/",
        "https://www.ozon.ru/",
        "https://market.yandex.ru/",
        "https://stepik.org/",
        "https://openedu.ru/"
    )

    val dataDir = Path("AI", "data").toFile()
    dataDir.mkdirs()

    var collected = 0

    for (url in qualityUrls) {
        try {
            println("Собираем данные с: $url")

            val response = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(10000)
                .execute()

            val soup = response.parse()
            soup.select("script, style, nav, footer, header").forEach { it.remove() }

            val title = soup.title()?.trim() ?: ""

            val metaDesc = soup.selectFirst("meta[name=description]")
            val metaDescription = metaDesc?.attr("content")?.trim() ?: ""

            val headings = mutableListOf<Map<String, Any>>()
            for (i in 1..3) {
                soup.select("h$i").forEach { heading ->
                    val text = heading.text().trim()
                    if (text.isNotEmpty() && text.length > 5) {
                        headings.add(mapOf("level" to i, "text" to text))
                    }
                }
            }

            val paragraphs = mutableListOf<String>()
            soup.select("p").forEach { p ->
                val text = p.text().trim()
                if (text.isNotEmpty() && text.length > 50) paragraphs.add(text)
            }

            val combinedText = "$title ${headings.joinToString(" ") { it["text"].toString() }}".lowercase()

            val contentType = when {
                arrayOf("новости", "news", "события", "политика").any { it in combinedText } -> "news"
                arrayOf("купить", "цена", "товар", "продажа", "магазин").any { it in combinedText } -> "ecommerce"
                arrayOf("блог", "статья", "автор", "мнение").any { it in combinedText } -> "blog"
                arrayOf("технич", "программир", "код", "it").any { it in combinedText } -> "technical"
                arrayOf("обучен", "курс", "образован", "учеб").any { it in combinedText } -> "educational"
                else -> "general"
            }

            if (paragraphs.size >= 2 && headings.size >= 1 && title.isNotEmpty()) {
                val trainingData = mapOf(
                    "timestamp" to System.currentTimeMillis() / 1000,
                    "source_url" to url,
                    "content_type" to contentType,
                    "data" to mapOf(
                        "title" to title,
                        "meta_description" to metaDescription,
                        "headings" to headings.take(5),
                        "paragraphs" to paragraphs.take(10)
                    )
                )

                val safeFilename = url.replace(Regex("[^\\w\\-_.]"), "_").take(50)
                val filename = "training_enhanced_${System.currentTimeMillis() / 1000}_$safeFilename.json"
                val filepath = File(dataDir, filename)

                filepath.writeText(Json.encodeToString(trainingData))

                collected++
                println("Сохранено: $filename ($contentType)")
            } else {
                println("Пропущено: недостаточно контента")
            }

        } catch (e: Exception) {
            println("Ошибка с $url: ${e.message}")
            e.printStackTrace()
        }
        Thread.sleep(Random.nextLong(1000, 3000))
    }

    println("\nСобрано $collected качественных образцов!")
    return collected
}

fun main() {
    launch<UniversalApp>()
}
package AI.ML.AIModels.Data.Training

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlinx.serialization.Serializable
import tornadofx.*

class Config {
    companion object {
        val PREDEFINED_URLS = mapOf(
            "news" to listOf(
                "https://ria.ru/",
                "https://www.rbc.ru/", 
                "https://lenta.ru/",
                "https://www.kommersant.ru/",
                "https://www.vedomosti.ru/",
                "https://www.gazeta.ru/", 
                "https://www.rt.com/",
                "https://tass.ru/"
            ),
            "ecommerce" to listOf(
                "https://www.wildberries.ru/",
                "https://www.ozon.ru/",
                "https://market.yandex.ru/",
                "https://aliexpress.ru/",
                "https://www.citilink.ru/",
                "https://www.dns-shop.ru/",
                "https://www.mvideo.ru/",
                "https://www.eldorado.ru/"
            ),
            "blog" to listOf(
                "https://habr.com/ru/all/",
                "https://vc.ru/",
                "https://dzen.ru/", 
                "https://livejournal.com/",
                "https://pikabu.ru/",
                "https://journal.tinkoff.ru/"
            ),
            "technical" to listOf(
                "https://stackoverflow.com/",
                "https://github.com/",
                "https://www.python.org/",
                "https://developer.mozilla.org/",
                "https://redis.io/",
                "https://www.docker.com/"
            ),
            "educational" to listOf(
                "https://stepik.org/",
                "https://openedu.ru/",
                "https://coursera.org/",
                "https://edx.org/",
                "https://universarium.org/",
                "https://lectory.org/"
            ),
            "entertainment" to listOf(
                "https://www.kinopoisk.ru/",
                "https://music.yandex.ru/",
                "https://www.youtube.com/",
                "https://www.twitch.tv/",
                "https://www.ivi.ru/",
                "https://okko.tv/"
            )
        )

        val DEFAULT_COLLECTION_CONFIG = CollectionConfig()
        val DEFAULT_QUALITY_THRESHOLDS = QualityThresholds()
        const val DATA_DIR = "AI/ML/AIModels/Data/Training"
        const val TRAINING_DIR = "Training"
        const val BACKUP_DIR = "backups"
        const val USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        const val MAX_FILE_SIZE_MB = 10
        const val MAX_CONTENT_LENGTH = 10000
        const val REQUEST_TIMEOUT_MS = 15000
        const val DELAY_BETWEEN_REQUESTS_MS = 1000L
        const val MAX_RETRY_DELAY_MS = 5000L
        
        val CONTENT_PATTERNS = mapOf(
            "news" to listOf("новости", "news", "события", "политика", "репортаж", "корреспондент"),
            "ecommerce" to listOf("купить", "цена", "товар", "продажа", "магазин", "доставка", "акция", "скидка"),
            "blog" to listOf("блог", "статья", "автор", "мнение", "читатель", "комментарий", "пост"),
            "technical" to listOf("технич", "программир", "код", "it", "разработк", "api", "фреймворк", "библиотека"),
            "educational" to listOf("обучен", "курс", "образован", "учеб", "лекция", "студент", "преподаватель"),
            "entertainment" to listOf("фильм", "музыка", "игра", "кино", "сериал", "развлечен", "отдых")
        )
        
        fun getAllUrls(): List<String> = PREDEFINED_URLS.values.flatten().distinct()
        
        fun getUrlsByType(type: String): List<String> = PREDEFINED_URLS[type] ?: emptyList()
    }
}

@Serializable
data class CollectionConfig(
    val requestDelay: Double = 1.0,
    val timeout: Int = 15,
    val maxRetries: Int = 3,
    val minTextLength: Int = 100,
    val maxFilesPerType: Int = 50
)

@Serializable
data class QualityThresholds(
    val minHeadings: Int = 1,
    val minParagraphs: Int = 2, 
    val minTextLength: Int = 100,
    val maxDuplicateRatio: Double = 0.1
)

fun main() {
    launch<UniversalApp>()
}
package AI.Core

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import org.koin.core.context.startKoin
import javafx.stage.Stage
import tornadofx.*

open class UniversalView : View("5D Neural System") {
    
    override val root = tabpane {
        tab("5D Network") {
            add(NeuralNetwork5DView::class)
        }

        tab("Models") {
            vbox(10.0, insets(10)) {
                val stats = FiveDimensionalSystem.getSystemStats()
                label("Models: ${stats["total_models"]}") { style { fontSize = 16.px } }
                label("Neural: ${stats["neural_models"]}")
                label("AI: ${stats["ai_models"]}") 
                label("Science: ${stats["science_models"]}")
                label("Accuracy: ${"%.1f".format(stats["average_accuracy"] as Double * 100)}%")
            }
        }
    }
}

open class UniversalApp : App(UniversalView::class) {
    val server = McpServer().createServer()
    server.startStdio()
    val updater = AppUpdater()
    
    init {
        startKoin {
            modules(scienceModule)
        }
    }
    
    override fun start(stage: Stage) {
        stage.width = 1400.0
        stage.height = 900.0
        
        FiveDimensionalSystem.autoDiscoverAndInitialize()
        super.start(stage)
        
        updater.setupUpdater()
        updater.checkForUpdates { updated ->
            if (updated) {
                println("Обновление приложения завершено. Перезапуск...")
                restartApp()
            } else {
                updater.startBackgroundAutoUpdate()
            }
        }
    }
    
    fun restartApp() {
        try {
            println("Перезапуск приложения...")
            exitProcess(0)
        } catch (e: Exception) {
            println("Ошибка перезапуска: ${e.message}")
        }
    }
}

fun main() {
    launch<UniversalApp>()
}
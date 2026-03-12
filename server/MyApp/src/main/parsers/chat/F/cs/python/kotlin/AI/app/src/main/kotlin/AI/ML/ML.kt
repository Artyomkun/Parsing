package AI.ML

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.*
import javafx.beans.property.SimpleDoubleProperty
import javafx.beans.property.SimpleObjectProperty
import javafx.beans.property.SimpleStringProperty
import org.koin.core.module.dsl.singleOf
import javafx.collections.FXCollections
import javafx.scene.paint.PhongMaterial
import javafx.scene.transform.Rotate
import javafx.scene.text.FontWeight
import kotlinx.serialization.json.*
import kotlin.system.exitProcess
import javafx.scene.paint.Color
import kotlin.concurrent.thread
import kotlinx.serialization.*
import javafx.geometry.Insets
import javafx.scene.text.Font
import javafx.scene.text.Text
import javafx.util.Duration
import javafx.scene.shape.*
import org.koin.dsl.module
import javafx.stage.Stage
import javafx.animation.*
import mu.KotlinLogging
import javafx.scene.*
import kotlin.math.*
import java.io.File
import java.net.URL
import tornadofx.*

class UniversalScienceAssistantApp : App(UniversalScienceAssistantView::class) {
    private val updater = AppUpdater()
    private val logger = KotlinLogging.logger {} 
    val scienceMLModule = module {
        // Core ML Services
        single<MLService> { MLService() }
        single<NERProcessor> { NERProcessor() }
        
        // Scientific ViewModels (ИСПРАВЛЕННЫЕ ИМЕНА)
        single<PhysicsMLViewModel> { PhysicsMLViewModel() }
        single<BiologyMLViewModel> { BiologyMLViewModel() }
        single<ChemicalCalculatorViewModel> { ChemicalCalculatorViewModel() }
        single<MathMLViewModel> { MathMLViewModel() }
        
        // Psychological ViewModels  
        single<StatisticsMLViewModel> { StatisticsMLViewModel() }
        single<PsychometricsMLViewModel> { PsychometricsMLViewModel() }
        single<ClinicalMLViewModel> { ClinicalMLViewModel() }
        single<CognitiveMLViewModel> { CognitiveMLViewModel() }
        single<PsychophysiologyMLViewModel> { PsychophysiologyMLViewModel() }
        
        // Text ML Models
        single<MLSentimentModel> { MLSentimentModel() }
        single<MLTopicModel> { MLTopicModel() }
        single<MLIntentClassificationModel> { MLIntentClassificationModel() }
        single<MLSpamDetectionModel> { MLSpamDetectionModel() }
        single<MLLanguageDetectionModel> { MLLanguageDetectionModel() }
        single<MLContentAnalyzer> { MLContentAnalyzer() }
        
        // Scientific ML Models
        single<MLMathModel> { MLMathModel() }
        single<MLPhysicsModel> { MLPhysicsModel() }
        single<MLBiologyModel> { MLBiologyModel() }
        single<MLChemistryModel> { MLChemistryModel() }
        
        // Psychological ML Models
        single<StatisticsMLViewModel> { StatisticsMLViewModel() }
        single<PsychometricsMLViewModel> { PsychometricsMLViewModel() }
        single<ClinicalMLViewModel> { ClinicalMLViewModel() }
        single<CognitiveMLViewModel> { CognitiveMLViewModel() }
        single<PsychophysiologyMLViewModel> { PsychophysiologyMLViewModel() }
        single<AISensoryOrganismML> { AISensoryOrganismML() }
        single<TextGeneratorViewModel> { TextGeneratorViewModel() }
        single<ModelManagerViewModel> { ModelManagerViewModel() }
    }

    override fun start(stage: javafx.stage.Stage) {
        stage.width = 1600.0
        stage.height = 1000.0
        stage.isMaximized = true

        fun setupUpdater() {
            updater.onUpdateMessage = { type, message ->
                logger.info { "[Updater][$type] $message" }
            }

            updater.onUpdateComplete = { updated, version ->
                if (updated) {
                    logger.info { "Updated to version $version" }
                } else {
                    logger.info { "No new updates available" }
                }
            }

            updater.checkForUpdates { updated ->
                if (updated) {
                    println("Обновление приложения завершено. Перезапуск...")
                    restartApp()
                } else {
                    updater.startBackgroundAutoUpdate()
                    val modelSystem = UniversalModelSystem()
                    modelSystem.autoDiscoverAndInitialize()
                    startBackgroundServices()
                }
            }
        }
    }

    fun startBackgroundServices() {
        thread(isDaemon = true) {
            while (true) {
                Thread.sleep(60000)
                println("Background service running...")
            }
        }
    }

    fun restartApp() {
        val runtime = Runtime.getRuntime()
        val javaBin = System.getProperty("java.home") + File.separator + "bin" + File.separator + "java"
        val currentJar = File(UniversalScienceAssistantApp::class.java.protectionDomain.codeSource.location.toURI())
        if (currentJar.name.endsWith(".jar")) {
            runtime.exec(arrayOf(javaBin, "-jar", currentJar.path))
            exitProcess(0)
        }
    }
}



class UniversalMLView : View("Universal Science Workbench") {
    override val root = tabpane {
        tab("5D Neural Network") {
            add(NeuralNetwork5DView::class)
        }
        tab("Universal Science Assistant") {
            add(UniversalScienceAssistantView::class)
        }
        tab("ML Text Analysis") {
            add(MLAnalysisView::class)
        }
        tab("AI Models Management") {
            add(MLModelManagementView::class)
        }
        tab("Mathematics Calculator") {
            add(MathMLViewModel::class)
        }
        tab("Physics Calculator") {
            add(PhysicsMLView::class)
        }
        tab("Chemistry Calculator") {
            add(ChemicalCalculatorView::class)
        }
        tab("Biology Calculator") {
            add(BiologyMLViewModel::class)
        }
        tab("Psychology Calculator") {
            add(PsychologyMLView::class)
        }
    }
}

fun main() {
    launch<UniversalApp>()
}
package AI.ML

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleStringProperty
import java.time.format.DateTimeFormatter
import javafx.collections.FXCollections
import javafx.scene.control.TabPane
import javafx.scene.text.FontWeight
import javafx.scene.control.Tab
import java.time.LocalDateTime
import javafx.scene.control.*
import javafx.scene.text.Font
import javafx.geometry.Insets
import javafx.beans.property.*
import javafx.scene.layout.*
import kotlinx.coroutines.*
import kotlin.math.*
import tornadofx.*

// --------------------------- Константы и утилиты ---------------------------
object PsychologicalConstants {
    const val IQ_MEAN = 100.0
    const val IQ_STD = 15.0
    const val T_SCORE_MEAN = 50.0
    const val T_SCORE_STD = 10.0
    const val Z_SCORE_MEAN = 0.0
    const val Z_SCORE_STD = 1.0

    const val CRONBACH_ALPHA_THRESHOLD = 0.7
    const val FACTOR_LOADING_THRESHOLD = 0.4
    const val EFFECT_SIZE_SMALL = 0.2
    const val EFFECT_SIZE_MEDIUM = 0.5
    const val EFFECT_SIZE_LARGE = 0.8

    const val REACTION_TIME_NORMAL = 250.0
    const val ATTENTION_SPAN_ADULT = 20.0
}

// --------------------------- Statistics Utils ---------------------------
object StatisticsUtils {
    fun mean(data: List<Double>): Double = if (data.isEmpty()) 0.0 else data.average()

    fun variance(data: List<Double>, isSample: Boolean = true): Double {
        if (data.size < 2) return 0.0
        val m = mean(data)
        val sumSquares = data.sumOf { (it - m).pow(2) }
        val denom = if (isSample) data.size - 1 else data.size
        return sumSquares / denom
    }

    fun standardDeviation(data: List<Double>, isSample: Boolean = true): Double = sqrt(variance(data, isSample))

    fun correlation(x: List<Double>, y: List<Double>): Double {
        if (x.size != y.size || x.size < 2) return 0.0
        val meanX = mean(x)
        val meanY = mean(y)
        val stdX = standardDeviation(x)
        val stdY = standardDeviation(y)
        if (stdX == 0.0 || stdY == 0.0) return 0.0
        val covariance = x.zip(y).sumOf { (xi, yi) -> (xi - meanX) * (yi - meanY) } / (x.size - 1)
        return covariance / (stdX * stdY)
    }

    fun erf(x: Double): Double {
        val a1 = 0.254829592
        val a2 = -0.284496736
        val a3 = 1.421413741
        val a4 = -1.453152027
        val a5 = 1.061405429
        val p = 0.3275911
        val sign = if (x < 0) -1 else 1
        val absX = abs(x)
        val t = 1.0 / (1.0 + p * absX)
        val y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * exp(-absX * absX)
        return sign * y
    }

    fun normalCDF(x: Double, mean: Double = 0.0, std: Double = 1.0): Double {
        val z = (x - mean) / std
        return 0.5 * (1 + erf(z / sqrt(2.0)))
    }

    fun normalQuantile(p: Double, mean: Double = 0.0, std: Double = 1.0): Double {
        require(p in 0.0..1.0) { "p must be in [0,1]" }
        if (p == 0.0) return Double.NEGATIVE_INFINITY
        if (p == 1.0) return Double.POSITIVE_INFINITY
        val t = sqrt(-2.0 * ln(1 - p))
        val c0 = 2.515517
        val c1 = 0.802853
        val c2 = 0.010328
        val d1 = 1.432788
        val d2 = 0.189269
        val d3 = 0.001308
        val numerator = c0 + c1 * t + c2 * t * t
        val denominator = 1.0 + d1 * t + d2 * t * t + d3 * t * t * t
        val z = t - numerator / denominator
        return mean + z * std
    }
}

// --------------------------- Psychometrics ---------------------------
object Psychometrics {
    fun cronbachAlpha(itemScores: List<List<Double>>): Double {
        if (itemScores.size < 2) return 0.0
        val k = itemScores.size
        val nPersons = itemScores[0].size
        val totalScores = DoubleArray(nPersons) { i -> itemScores.sumOf { it[i] } }
        val itemVariances = itemScores.map { StatisticsUtils.variance(it) }
        val totalVariance = StatisticsUtils.variance(totalScores.toList())
        if (totalVariance == 0.0) return 0.0
        return (k.toDouble() / (k - 1)) * (1 - itemVariances.sum() / totalVariance)
    }

    fun standardErrorMeasurement(std: Double, reliability: Double): Double = std * sqrt(1 - reliability)

    fun kuderRichardson20(scores: List<List<Int>>): Double {
        if (scores.isEmpty()) return 0.0
        val k = scores.size
        val n = scores[0].size
        val totalScores = IntArray(n) { i -> scores.sumOf { it[i] } }
        val totalVariance = StatisticsUtils.variance(totalScores.map { it.toDouble() })
        if (totalVariance == 0.0) return 0.0
        val pValues = scores.map { item -> item.average() }
        val sumPq = pValues.sumOf { p -> p * (1 - p) }
        return (k.toDouble() / (k - 1)) * (1 - sumPq / totalVariance)
    }
}

// --------------------------- Clinical Psychology ---------------------------
object ClinicalPsychology {
    data class BDIResult(val totalScore: Int, val severity: String)
    
    fun beckDepressionInventory(scores: List<Int>): BDIResult {
        val total = scores.sum()
        val severity = when {
            total <= 13 -> "Minimal"
            total <= 19 -> "Mild"
            total <= 28 -> "Moderate"
            else -> "Severe"
        }
        return BDIResult(total, severity)
    }

    fun miniMentalStateExamination(scores: List<Int>): Pair<Int, String> {
        val total = scores.sum()
        val interpretation = when {
            total >= 24 -> "Normal"
            total >= 18 -> "Mild cognitive impairment"
            total >= 10 -> "Moderate cognitive impairment"
            else -> "Severe cognitive impairment"
        }
        return Pair(total, interpretation)
    }
}

// --------------------------- Cognitive Psychology ---------------------------
object CognitivePsychology {
    fun stroopEffectTime(congruent: Double, incongruent: Double) = incongruent - congruent
    
    fun memoryRecognitionDPrime(hits: Int, falseAlarms: Int, signalTrials: Int, noiseTrials: Int): Double {
        val hitRate = (hits + 0.5) / (signalTrials + 1)
        val faRate = (falseAlarms + 0.5) / (noiseTrials + 1)
        return StatisticsUtils.normalQuantile(hitRate) - StatisticsUtils.normalQuantile(faRate)
    }
}

// --------------------------- Psychophysiology ---------------------------
object Psychophysiology {
    data class HRVResult(val meanRR: Double, val sdnn: Double, val rmssd: Double, val hrvIndex: Double)
    
    fun heartRateVariabilityTime(rr: List<Double>): HRVResult {
        if (rr.isEmpty()) return HRVResult(0.0, 0.0, 0.0, 0.0)
        val mean = StatisticsUtils.mean(rr)
        val sdnn = StatisticsUtils.standardDeviation(rr)
        val diffs = (0 until rr.size - 1).map { rr[it + 1] - rr[it] }
        val rmssd = if (diffs.isNotEmpty()) sqrt(diffs.map { it * it }.average()) else 0.0
        val hrvIndex = if (mean != 0.0) sdnn / mean else 0.0
        return HRVResult(mean, sdnn, rmssd, hrvIndex)
    }
}

// --------------------------- ViewModels ---------------------------
class StatisticsMLViewModel : ViewModel() {
    val inputData = SimpleStringProperty()
    val result = SimpleStringProperty()
    
    fun calculateMean() {
        val data = parseDoubles(inputData.value)
        result.value = "Mean = ${StatisticsUtils.mean(data)}"
    }
    
    fun calculateStdDev() {
        val data = parseDoubles(inputData.value)
        result.value = "Standard Deviation = ${StatisticsUtils.standardDeviation(data)}"
    }
    
    fun calculateCorrelation() {
        val parts = inputData.value.split("|")
        if (parts.size < 2) {
            result.value = "Format: x1,x2,x3|y1,y2,y3"
            return
        }
        val x = parseDoubles(parts[0])
        val y = parseDoubles(parts[1])
        result.value = "Correlation = ${StatisticsUtils.correlation(x, y)}"
    }
}

class PsychometricsMLViewModel : ViewModel() {
    val inputMatrix = SimpleStringProperty()
    val result = SimpleStringProperty()
    
    fun calculateCronbachAlpha() {
        val matrix = parseMatrix(inputMatrix.value)
        val alpha = Psychometrics.cronbachAlpha(matrix)
        result.value = "Cronbach's Alpha = ${"%.4f".format(alpha)}"
    }
}

class ClinicalMLViewModel : ViewModel() {
    val inputScores = SimpleStringProperty()
    val result = SimpleStringProperty()
    
    fun calculateBDI() {
        val scores = parseInts(inputScores.value)
        val bdiResult = ClinicalPsychology.beckDepressionInventory(scores)
        result.value = "BDI Total: ${bdiResult.totalScore}, Severity: ${bdiResult.severity}"
    }
    
    fun calculateMMSE() {
        val scores = parseInts(inputScores.value)
        val (total, interpretation) = ClinicalPsychology.miniMentalStateExamination(scores)
        result.value = "MMSE Total: $total, Interpretation: $interpretation"
    }
}

class CognitiveMLViewModel : ViewModel() {
    val inputData = SimpleStringProperty()
    val result = SimpleStringProperty()
    
    fun calculateStroopEffect() {
        val data = parseDoubles(inputData.value)
        if (data.size >= 2) {
            val effect = CognitivePsychology.stroopEffectTime(data[0], data[1])
            result.value = "Stroop Effect = ${"%.3f".format(effect)}"
        } else {
            result.value = "Format: congruentTime,incongruentTime"
        }
    }
    
    fun calculateDPrime() {
        val data = parseDoubles(inputData.value)
        if (data.size >= 4) {
            val dprime = CognitivePsychology.memoryRecognitionDPrime(
                data[0].toInt(), data[1].toInt(), data[2].toInt(), data[3].toInt()
            )
            result.value = "d' = ${"%.3f".format(dprime)}"
        } else {
            result.value = "Format: hits,falseAlarms,signalTrials,noiseTrials"
        }
    }
}

class PsychophysiologyMLViewModel : ViewModel() {
    val inputData = SimpleStringProperty()
    val result = SimpleStringProperty()
    
    fun calculateHRV() {
        val rrIntervals = parseDoubles(inputData.value)
        val hrv = Psychophysiology.heartRateVariabilityTime(rrIntervals)
        result.value = """
            HRV Analysis:
            Mean RR: ${"%.3f".format(hrv.meanRR)} ms
            SDNN: ${"%.3f".format(hrv.sdnn)} ms
            RMSSD: ${"%.3f".format(hrv.rmssd)} ms
            HRV Index: ${"%.3f".format(hrv.hrvIndex)}
        """.trimIndent()
    }
}

// --------------------------- Utility Functions ---------------------------
fun parseDoubles(text: String): List<Double> {
    return text.split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .mapNotNull { it.toDoubleOrNull() }
}

fun parseInts(text: String): List<Int> {
    return text.split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .mapNotNull { it.toIntOrNull() }
}

fun parseMatrix(text: String): List<List<Double>> {
    return text.split(";")
        .map { row ->
            row.split(",")
                .map { it.trim() }
                .filter { it.isNotEmpty() }
                .mapNotNull { it.toDoubleOrNull() }
        }
        .filter { it.isNotEmpty() }
}

// --------------------------- Views ---------------------------
class StatisticsMLView : View("Statistics") {
    val viewModel = StatisticsMLViewModel()
    
    override val root = form {
        fieldset {
            field("Input Data (comma-separated)") {
                textarea(viewModel.inputData) {
                    promptText = "Enter numbers separated by commas\nFor correlation: x1,x2,x3|y1,y2,y3"
                    prefRowCount = 4
                }
            }
            
            hbox(10.0) {
                button("Calculate Mean") {
                    action { viewModel.calculateMean() }
                }
                button("Calculate Std Dev") {
                    action { viewModel.calculateStdDev() }
                }
                button("Calculate Correlation") {
                    action { viewModel.calculateCorrelation() }
                }
            }
            
            field("Result") {
                textarea(viewModel.result) {
                    isEditable = false
                    prefRowCount = 3
                }
            }
        }
    }
}

class PsychometricsMLView : View("Psychometrics") {
    val viewModel = PsychometricsMLViewModel()
    
    override val root = form {
        fieldset {
            field("Input Matrix") {
                textarea(viewModel.inputMatrix) {
                    promptText = "Enter item scores as rows separated by ';'\nExample: 1,2,3;2,3,4;1,2,2"
                    prefRowCount = 4
                }
            }
            
            button("Calculate Cronbach's Alpha") {
                action { viewModel.calculateCronbachAlpha() }
            }
            
            field("Result") {
                textarea(viewModel.result) {
                    isEditable = false
                    prefRowCount = 3
                }
            }
        }
    }
}

class ClinicalMLView : View("Clinical Psychology") {
    val viewModel = ClinicalMLViewModel()
    
    override val root = form {
        fieldset {
            field("Input Scores (comma-separated)") {
                textarea(viewModel.inputScores) {
                    promptText = "Enter test scores as integers separated by commas"
                    prefRowCount = 4
                }
            }
            
            hbox(10.0) {
                button("Beck Depression Inventory") {
                    action { viewModel.calculateBDI() }
                }
                button("Mini-Mental State Exam") {
                    action { viewModel.calculateMMSE() }
                }
            }
            
            field("Result") {
                textarea(viewModel.result) {
                    isEditable = false
                    prefRowCount = 3
                }
            }
        }
    }
}

class CognitiveMLView : View("Cognitive Psychology") {
    val viewModel = CognitiveMLViewModel()
    
    override val root = form {
        fieldset {
            field("Input Data") {
                textarea(viewModel.inputData) {
                    promptText = """
                        For Stroop: congruentTime,incongruentTime
                        For d': hits,falseAlarms,signalTrials,noiseTrials
                    """.trimIndent()
                    prefRowCount = 4
                }
            }
            
            hbox(10.0) {
                button("Stroop Effect") {
                    action { viewModel.calculateStroopEffect() }
                }
                button("Recognition d'") {
                    action { viewModel.calculateDPrime() }
                }
            }
            
            field("Result") {
                textarea(viewModel.result) {
                    isEditable = false
                    prefRowCount = 3
                }
            }
        }
    }
}

class PsychophysiologyMLView : View("Psychophysiology") {
    val viewModel = PsychophysiologyMLViewModel()
    
    override val root = form {
        fieldset {
            field("RR Intervals (comma-separated, ms)") {
                textarea(viewModel.inputData) {
                    promptText = "Enter RR intervals in milliseconds separated by commas"
                    prefRowCount = 4
                }
            }
            
            button("Calculate HRV") {
                action { viewModel.calculateHRV() }
            }
            
            field("Result") {
                textarea(viewModel.result) {
                    isEditable = false
                    prefRowCount = 6
                }
            }
        }
    }
}

// --------------------------- Main Application ---------------------------
class PsychologyMLView : View("Psychology") {
    override val root = tabpane {
        tabClosingPolicy = TabPane.TabClosingPolicy.UNAVAILABLE
        
        tab("Statistics") {
            add(StatisticsMLView::class)
        }
        tab("Psychometrics") {
            add(PsychometricsMLView::class)
        }
        tab("Clinical Psychology") {
            add(ClinicalMLView::class)
        }
        tab("Cognitive Psychology") {
            add(CognitiveMLView::class)
        }
        tab("Psychophysiology") {
            add(PsychophysiologyMLView::class)
        }
    }
}

fun main() {
    launch<UniversalApp>()
}
package AI.ML

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleStringProperty
import javafx.collections.FXCollections
import javafx.scene.text.FontWeight
import javafx.scene.paint.Color
import javafx.scene.text.Font
import javafx.stage.Stage
import kotlin.math.*
import tornadofx.*

// ==================== БАЗОВАЯ МОДЕЛЬ ДЛЯ БИОЛОГИЧЕСКИХ РАСЧЕТОВ ====================

open class BaseBiologyModel {
    
    open fun calculate(method: String, vararg params: Double): String {
        return try {
            when (method) {
                "Michaelis-Menten" -> calculateMichaelisMenten(params)
                "Henderson-Hasselbalch" -> calculateHendersonHasselbalch(params)
                "Osmotic-Pressure" -> calculateOsmoticPressure(params)
                "Nernst-Equation" -> calculateNernstEquation(params)
                "Hardy-Weinberg" -> calculateHardyWeinberg(params)
                "Body-Mass-Index" -> calculateBMI(params)
                "Cardiac-Output" -> calculateCardiacOutput(params)
                "Mean-Arterial-Pressure" -> calculateMAP(params)
                "Respiratory-Minute-Volume" -> calculateRespiratoryVolume(params)
                "Population-Growth" -> calculatePopulationGrowth(params)
                "Species-Diversity" -> calculateSpeciesDiversity(params)
                "Bacterial-Growth" -> calculateBacterialGrowth(params)
                "Generation-Time" -> calculateGenerationTime(params)
                else -> "Неизвестный метод"
            }
        } catch (e: Exception) {
            "Ошибка расчета: ${e.message}"
        }
    }

    protected open fun calculateMichaelisMenten(params: DoubleArray): String {
        if (params.size < 3) throw IllegalArgumentException("Нужно 3 параметра")
        val vmax = params[0]
        val km = params[1]
        val s = params[2]
        val v = (vmax * s) / (km + s)
        return "Скорость реакции: ${"%.4f".format(v)}"
    }

    protected open fun calculateHendersonHasselbalch(params: DoubleArray): String {
        if (params.size < 3) throw IllegalArgumentException("Нужно 3 параметра")
        val pka = params[0]
        val ha = params[1]
        val a = params[2]
        val ph = pka + log10(a / ha)
        return "pH: ${"%.4f".format(ph)}"
    }

    protected open fun calculateOsmoticPressure(params: DoubleArray): String {
        if (params.isEmpty()) throw IllegalArgumentException("Нужна концентрация")
        val c = params[0]
        val pi = c * 0.0821 * 310 
        return "Осмотическое давление: ${"%.4f".format(pi)} атм"
    }

    protected open fun calculateNernstEquation(params: DoubleArray): String {
        if (params.size < 3) throw IllegalArgumentException("Нужно 3 параметра")
        val z = params[0]
        val cout = params[1]
        val cin = params[2]
        val emf = (61.5 / z) * log10(cout / cin)
        return "Потенциал: ${"%.4f".format(emf)} мВ"
    }

    protected open fun calculateHardyWeinberg(params: DoubleArray): String {
        if (params.isEmpty()) throw IllegalArgumentException("Нужна частота p")
        val p = params[0]
        val q = 1 - p
        val p2 = p * p
        val q2 = q * q
        val pq2 = 2 * p * q
        return "p²=${"%.4f".format(p2)}, 2pq=${"%.4f".format(pq2)}, q²=${"%.4f".format(q2)}"
    }

    protected open fun calculateBMI(params: DoubleArray): String {
        if (params.size < 2) throw IllegalArgumentException("Нужны вес и рост")
        val weight = params[0]
        val height = params[1] / 100
        val bmi = weight / (height * height)
        val category = when {
            bmi < 18.5 -> "Недостаточный вес"
            bmi < 25 -> "Нормальный вес"
            bmi < 30 -> "Избыточный вес"
            else -> "Ожирение"
        }
        return "ИМТ: ${"%.2f".format(bmi)} ($category)"
    }

    protected open fun calculateCardiacOutput(params: DoubleArray): String {
        if (params.size < 2) throw IllegalArgumentException("Нужны ЧСС и ударный объем")
        val hr = params[0]
        val sv = params[1]
        val co = hr * sv
        return "Сердечный выброс: ${"%.2f".format(co)} мл/мин"
    }

    protected open fun calculateMAP(params: DoubleArray): String {
        if (params.size < 2) throw IllegalArgumentException("Нужны систолическое и диастолическое давление")
        val sbp = params[0]
        val dbp = params[1]
        val map = dbp + (sbp - dbp) / 3
        return "Среднее артериальное давление: ${"%.2f".format(map)} мм рт.ст."
    }

    protected open fun calculateRespiratoryVolume(params: DoubleArray): String {
        if (params.size < 2) throw IllegalArgumentException("Нужны частота дыхания и дыхательный объем")
        val rr = params[0]
        val tv = params[1]
        val mvv = rr * tv
        return "Минутный объем дыхания: ${"%.2f".format(mvv)} мл/мин"
    }

    protected open fun calculatePopulationGrowth(params: DoubleArray): String {
        if (params.size < 3) throw IllegalArgumentException("Нужны начальная популяция, рост и время")
        val n0 = params[0]
        val r = params[1]
        val t = params[2]
        val nt = n0 * exp(r * t)
        return "Популяция через время t: ${"%.2f".format(nt)}"
    }

    protected open fun calculateSpeciesDiversity(params: DoubleArray): String {
        if (params.isEmpty()) throw IllegalArgumentException("Нужны пропорции видов")
        val proportions = params.toList()
        val total = proportions.sum()
        if (total <= 0) throw IllegalArgumentException("Сумма пропорций должна быть > 0")
        
        val normalized = proportions.map { it / total }
        val shannon = -normalized.sumOf { p -> 
            if (p > 0) p * ln(p) else 0.0 
        }
        
        // Добавим интерпретацию
        val interpretation = when {
            shannon < 1.0 -> "низкое разнообразие"
            shannon < 3.0 -> "среднее разнообразие" 
            else -> "высокое разнообразие"
        }
        
        return "Индекс Шеннона: ${"%.4f".format(shannon)} ($interpretation)"
    }

    protected open fun calculateBacterialGrowth(params: DoubleArray): String {
        if (params.size < 3) throw IllegalArgumentException("Нужны начальное число, время генерации и время")
        val n0 = params[0]
        val g = params[1]
        val t = params[2]
        val n = n0 * 2.0.pow(t / g)
        return "Количество бактерий: ${"%.2f".format(n)}"
    }

    protected open fun calculateGenerationTime(params: DoubleArray): String {
        if (params.size < 3) throw IllegalArgumentException("Нужны начальное число, конечное число и время")
        val n0 = params[0]
        val nt = params[1]
        val t = params[2]
        val g = t * ln(2.0) / ln(nt / n0)
        return "Время генерации: ${"%.2f".format(g)}"
    }
}

// ==================== КОНКРЕТНАЯ РЕАЛИЗАЦИЯ БИОЛОГИЧЕСКОЙ МОДЕЛИ ====================

open class BiologyMLModel : BaseBiologyModel() {
    
    open fun predict(input: Any): Any = mapOf("result" to "base biology prediction")
    
    // Базовые методы для биологической модели
    open fun analyzeDNA(sequence: String): Map<String, Any> {
        return mapOf("result" to "DNA analysis not implemented")
    }
    
    open fun predictProteinStructure(sequence: String): Map<String, Any> {
        return mapOf("result" to "Protein structure prediction not implemented")
    }
    
    fun calculateGCContent(sequence: String): Double {
        val gcCount = sequence.count { it == 'G' || it == 'C' }
        return if (sequence.isNotEmpty()) gcCount.toDouble() / sequence.length else 0.0
    }

    override fun calculate(method: String, vararg params: Double): String {
        println("Выполняется расчет: $method с параметрами: ${params.joinToString()}")
        val result = super.calculate(method, *params)
        println("Результат: $result")
        
        return result
    }
    
    fun calculateAllMethods(vararg params: Double): Map<String, String> {
        val methods = listOf(
            "Michaelis-Menten", "Henderson-Hasselbalch", "Osmotic-Pressure",
            "Nernst-Equation", "Hardy-Weinberg", "Body-Mass-Index"
        )
        
        return methods.associateWith { method ->
            try {
                calculate(method, *params)
            } catch (e: Exception) {
                "Ошибка для $method: ${e.message}"
            }
        }
    }
}

// ==================== БИОЛОГИЧЕСКИЙ ИНТЕРФЕЙС ====================

class BiologyMLViewModel: View("Biology Calculator") {

    val model = BiologyMLModel()

    val methods = listOf(
        "Michaelis-Menten", "Henderson-Hasselbalch", "Osmotic-Pressure",
        "Nernst-Equation", "Hardy-Weinberg", "Body-Mass-Index",
        "Cardiac-Output", "Mean-Arterial-Pressure", "Respiratory-Minute-Volume",
        "Population-Growth", "Species-Diversity", "Bacterial-Growth", "Generation-Time"
    )

    val selectedMethod = SimpleStringProperty(methods.first())
    val parameterValues = List(8) { SimpleStringProperty("") }
    val resultProperty = SimpleStringProperty("")
    val historyItems = mutableListOf<String>().asObservable()
    
    override val root = borderpane {
        left = vbox {
            spacing = 10.0
            paddingAll = 16.0

            label("Биологический калькулятор") {
                style { fontSize = 18.px; fontWeight = FontWeight.BOLD }
            }

            label("Методы расчета:") {
                style { fontSize = 14.px; fontWeight = FontWeight.BOLD }
            }
            
            // ИСПРАВЛЕННАЯ СТРОКА
            listview(FXCollections.observableArrayList(methods)) {
                selectionModel.selectFirst()
                selectionModel.selectedItemProperty().addListener { _, _, new ->
                    selectedMethod.set(new)
                    parameterValues.forEach { it.set("") }
                    resultProperty.set("")
                }
            }
            
            button("Расширенный анализ") {
                action {
                    showAdvancedAnalysis()
                }
            }
        }

        center = vbox {
            spacing = 10.0
            paddingAll = 16.0

            label("Параметры расчета:") {
                style { fontSize = 14.px; fontWeight = FontWeight.BOLD }
            }

            val placeholders = parameterValues.mapIndexed { i, prop -> 
                textfield(prop) { 
                    promptText = "" 
                } 
            }

            fun updatePlaceholders() {
                val ph = getParameterPlaceholders(selectedMethod.value)
                for (i in parameterValues.indices) {
                    if (i < ph.size) placeholders[i].promptText = ph[i]
                    else placeholders[i].promptText = ""
                    placeholders[i].isVisible = i < ph.size
                }
            }

            selectedMethod.addListener { _, _, _ -> updatePlaceholders() }
            updatePlaceholders()

            hbox {
                spacing = 10.0
                button("Рассчитать") {
                    action {
                        val params = parameterValues.take(getParameterPlaceholders(selectedMethod.value).size)
                            .mapNotNull { it.value.toDoubleOrNull() }
                            .toDoubleArray()
                        
                        val placeholdersNeeded = getParameterPlaceholders(selectedMethod.value).size
                        if (params.size == placeholdersNeeded) {
                            val res = model.calculate(selectedMethod.value, *params)
                            resultProperty.set(res)
                            historyItems.add(0, "${selectedMethod.value}: $res")
                        } else {
                            resultProperty.set("Заполните все параметры корректными числами")
                        }
                    }
                }
                button("Очистить") {
                    action {
                        parameterValues.forEach { it.set("") }
                        resultProperty.set("")
                    }
                }
            }

            label("Результат:") {
                style { fontSize = 14.px; fontWeight = FontWeight.BOLD }
            }
            
            textarea(resultProperty) {
                isEditable = false
                prefRowCount = 3
            }

            label("История расчетов:") {
                style { fontSize = 14.px; fontWeight = FontWeight.BOLD }
            }
            
            listview(historyItems) {
                prefHeight = 150.0
            }
        }
    }
    
    fun showAdvancedAnalysis() {
        val params = parameterValues.take(3)
            .mapNotNull { it.value.toDoubleOrNull() }
            .toDoubleArray()
            
        if (params.size >= 2) {
            val results = model.calculateAllMethods(*params)
            val resultText = results.entries.joinToString("\n") { (method, result) ->
                "$method: $result"
            }
            information("Расширенный анализ", resultText)
        } else {
            error("Для расширенного анализа нужно заполнить хотя бы 2 параметра")
        }
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

fun getParameterPlaceholders(method: String): List<String> {
    return when(method) {
        "Michaelis-Menten" -> listOf("Vmax", "Km", "[S]")
        "Henderson-Hasselbalch" -> listOf("pKa", "[HA]", "[A⁻]")
        "Osmotic-Pressure" -> listOf("Концентрация")
        "Nernst-Equation" -> listOf("z", "[Вне]", "[Внутри]")
        "Hardy-Weinberg" -> listOf("Частота p")
        "Body-Mass-Index" -> listOf("Вес (кг)", "Рост (см)")
        "Cardiac-Output" -> listOf("Частота сердц.сокр.", "Ударный объем")
        "Mean-Arterial-Pressure" -> listOf("Систолическое", "Диастолическое")
        "Respiratory-Minute-Volume" -> listOf("Частота дыхания", "Дыхательный объем")
        "Population-Growth" -> listOf("Начальная популяция", "Рост r", "Время t")
        "Species-Diversity" -> listOf("Пропорции (через запятую)")
        "Bacterial-Growth" -> listOf("Начальное число", "Время генерации", "Время")
        "Generation-Time" -> listOf("Начальное число", "Конечное число", "Время")
        else -> listOf("Параметр 1", "Параметр 2")
    }
}

fun main() {
    launch<UniversalApp>()
}
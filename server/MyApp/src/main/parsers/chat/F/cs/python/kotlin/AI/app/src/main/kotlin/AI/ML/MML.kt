package AI.ML

import AI.ML.*
import AI.Core.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleStringProperty
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonObject
import org.ejml.dense.row.CommonOps_DDRM
import javafx.collections.FXCollections
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.put
import org.ejml.simple.SimpleMatrix
import org.ejml.data.DMatrixRMaj
import javafx.stage.Stage
import kotlin.math.*
import tornadofx.*

open class BaseMathematicsModel {
    
    open fun basicArithmetic(a: Double, b: Double): Map<String, Double> {
        return mapOf(
            "addition" to (a + b),
            "subtraction" to (a - b),
            "multiplication" to (a * b),
            "division" to (a / b),
            "exponentiation" to a.pow(b)
        )
    }

    open fun trigonometricFunctions(x: Double): Map<String, Double> {
        return mapOf(
            "sin" to sin(x),
            "cos" to cos(x),
            "tan" to tan(x)
        )
    }

    open fun complexAddition(a: Complex, b: Complex): Complex {
        return a + b
    }

    open fun complexMultiplication(a: Complex, b: Complex): Complex {
        return a * b
    }

    open fun matrixAddition(a: SimpleMatrix, b: SimpleMatrix): SimpleMatrix {
        return a.plus(b)
    }

    open fun matrixMultiplication(a: SimpleMatrix, b: SimpleMatrix): SimpleMatrix {
        return a.mult(b)
    }

    open fun integrateTrapezoid(f: (Double) -> Double, a: Double, b: Double): Double {
        val n = 1000
        val h = (b - a) / n
        var sum = 0.5 * (f(a) + f(b))
        for (i in 1 until n) {
            val x = a + i * h
            sum += f(x)
        }
        return sum * h
    }

    open fun integrateSimpson(f: (Double) -> Double, a: Double, b: Double): Double {
        val n = 1000
        val h = (b - a) / n
        var sum = f(a) + f(b)
        for (i in 1 until n) {
            val x = a + i * h
            sum += if (i % 2 == 0) 2.0 * f(x) else 4.0 * f(x)
        }
        return sum * h / 3.0
    }

    open fun solveEuler(f: (Double, Double) -> Double, y0: Double, x0: Double, xEnd: Double, n: Int): List<Pair<Double, Double>> {
        val h = (xEnd - x0) / n
        val result = mutableListOf<Pair<Double, Double>>()
        var x = x0
        var y = y0
        result.add(Pair(x, y))
        for (i in 1..n) {
            y += h * f(x, y)
            x += h
            result.add(Pair(x, y))
        }
        return result
    }
}

open class MathematicsMLModel : BaseMathematicsModel() {

    open fun predict(input: Any): Any {
        return mapOf("result" to "base prediction not implemented")
    }

    override fun basicArithmetic(a: Double, b: Double): Map<String, Double> {
        println("Выполняется базовая арифметика: $a, $b")
        return super.basicArithmetic(a, b)
    }

    override fun trigonometricFunctions(x: Double): Map<String, Double> {
        println("Вычисляются тригонометрические функции для: $x")
        return super.trigonometricFunctions(x)
    }

    fun calculateFactorial(n: Int): Long {
        if (n < 0) throw IllegalArgumentException("Факториал определен только для неотрицательных чисел")
        return if (n <= 1) 1 else n * calculateFactorial(n - 1)
    }

    fun solveQuadratic(a: Double, b: Double, c: Double): Pair<Double, Double> {
        val discriminant = b * b - 4 * a * c
        if (discriminant < 0) throw IllegalArgumentException("Дискриминант отрицательный")
        val sqrtD = sqrt(discriminant)
        val x1 = (-b + sqrtD) / (2 * a)
        val x2 = (-b - sqrtD) / (2 * a)
        return Pair(x1, x2)
    }
}

class Complex(val real: Double, val imaginary: Double) {
    operator fun plus(other: Complex): Complex {
        return Complex(real + other.real, imaginary + other.imaginary)
    }

    operator fun times(other: Complex): Complex {
        return Complex(
            real * other.real - imaginary * other.imaginary,
            real * other.imaginary + imaginary * other.real
        )
    }

    override fun toString(): String {
        return if (imaginary >= 0) "$real + ${imaginary}i" else "$real - ${-imaginary}i"
    }
}

class MathMLViewModel : View("Универсальная математика") {

    val mathematics = MathematicsMLModel()
    val selectedFunction = SimpleStringProperty()
    val param1 = SimpleStringProperty()
    val param2 = SimpleStringProperty()
    val resultText = SimpleStringProperty()
    val history = FXCollections.observableArrayList<String>()

    val functions = listOf(
        "Сложение", "Вычитание", "Умножение", "Деление",
        "Возведение в степень", "Синус", "Косинус", "Тангенс",
        "Комплексное сложение", "Комплексное умножение",
        "Матрица: сложение", "Матрица: умножение",
        "Интеграл (трапеции)", "Интеграл (Симпсон)", "Эйлер",
        "Факториал", "Квадратное уравнение"
    )

    override val root = hbox {
        spacing = 16.0
        paddingAll = 16.0

        vbox {
            spacing = 8.0
            prefWidth = 350.0

            label("Выберите функцию")
            combobox(selectedFunction, functions)

            label("Параметр 1")
            textarea(param1) { promptText = "Число, комплекс (a+bi), матрица (через ; и ,)" }

            label("Параметр 2")
            textarea(param2) { promptText = "Число, комплекс, матрица или x0/y0 для Эйлера" }

            hbox {
                spacing = 8.0
                button("Вычислить") { action { calculate() } }
                button("Очистить") {
                    action {
                        param1.set("")
                        param2.set("")
                        resultText.set("")
                    }
                }
            }
        }

        vbox {
            spacing = 8.0
            label("Результат")
            textarea(resultText) { isEditable = false; prefRowCount = 10 }

            label("История")
            listview(history)
        }
    }

    fun parseComplex(input: String): Complex {
        val s = input.replace(" ", "")
        val regex = Regex("([+-]?\\d*\\.?\\d+)?([+-]?\\d*\\.?\\d*)i?")
        val match = regex.matchEntire(s) ?: return Complex(0.0, 0.0)
        val re = match.groups[1]?.value?.toDoubleOrNull() ?: 0.0
        val im = match.groups[2]?.value?.toDoubleOrNull() ?: 0.0
        return Complex(re, im)
    }

    fun parseRealMatrix(text: String): SimpleMatrix {
        try {
            val rows = text.trim().split(";")
            if (rows.isEmpty()) throw IllegalArgumentException("Пустая матрица")
            
            val matrixData = rows.map { row ->
                row.split(",").map { it.trim().toDouble() }.toDoubleArray()
            }.toTypedArray()
            
            val numRows = matrixData.size
            val numCols = matrixData[0].size
            for (i in 1 until numRows) {
                if (matrixData[i].size != numCols) {
                    throw IllegalArgumentException("Все строки матрицы должны иметь одинаковое количество элементов")
                }
            }
            
            val dmatrix = DMatrixRMaj(numRows, numCols)
            for (i in 0 until numRows) {
                for (j in 0 until numCols) {
                    dmatrix[i, j] = matrixData[i][j]
                }
            }
            return SimpleMatrix(dmatrix)
            
        } catch (e: NumberFormatException) {
            throw IllegalArgumentException("Некорректный числовой формат: ${e.message}")
        }
    }

    fun calculate() {
        val func = selectedFunction.value ?: return
        try {
            val result = when (func) {
                "Сложение" -> {
                    val a = param1.value.toDouble()
                    val b = param2.value.toDouble()
                    mathematics.basicArithmetic(a, b)["addition"]
                }
                "Вычитание" -> {
                    val a = param1.value.toDouble()
                    val b = param2.value.toDouble()
                    mathematics.basicArithmetic(a, b)["subtraction"]
                }
                "Умножение" -> {
                    val a = param1.value.toDouble()
                    val b = param2.value.toDouble()
                    mathematics.basicArithmetic(a, b)["multiplication"]
                }
                "Деление" -> {
                    val a = param1.value.toDouble()
                    val b = param2.value.toDouble()
                    mathematics.basicArithmetic(a, b)["division"]
                }
                "Возведение в степень" -> {
                    val a = param1.value.toDouble()
                    val b = param2.value.toDouble()
                    mathematics.basicArithmetic(a, b)["exponentiation"]
                }
                "Синус" -> mathematics.trigonometricFunctions(param1.value.toDouble())["sin"]
                "Косинус" -> mathematics.trigonometricFunctions(param1.value.toDouble())["cos"]
                "Тангенс" -> mathematics.trigonometricFunctions(param1.value.toDouble())["tan"]
                "Комплексное сложение" -> {
                    val a = parseComplex(param1.value)
                    val b = parseComplex(param2.value)
                    mathematics.complexAddition(a, b)
                }
                "Комплексное умножение" -> {
                    val a = parseComplex(param1.value)
                    val b = parseComplex(param2.value)
                    mathematics.complexMultiplication(a, b)
                }
                "Матрица: сложение" -> {
                    val m1 = parseRealMatrix(param1.value)
                    val m2 = parseRealMatrix(param2.value)
                    mathematics.matrixAddition(m1, m2).toString()
                }
                "Матрица: умножение" -> {
                    val m1 = parseRealMatrix(param1.value)
                    val m2 = parseRealMatrix(param2.value)
                    mathematics.matrixMultiplication(m1, m2).toString()
                }
                "Интеграл (трапеции)" -> {
                    val f = { x: Double -> x.pow(2) }
                    mathematics.integrateTrapezoid(f, param1.value.toDouble(), param2.value.toDouble())
                }
                "Интеграл (Симпсон)" -> {
                    val f = { x: Double -> x.pow(2) }
                    mathematics.integrateSimpson(f, param1.value.toDouble(), param2.value.toDouble())
                }
                "Эйлер" -> {
                    val y0 = param1.value.toDouble()
                    val x0 = param2.value.toDouble()
                    val f = { x: Double, y: Double -> x + y }
                    mathematics.solveEuler(f, y0, x0, x0 + 1.0, 10).joinToString { "(${it.first}, ${it.second})" }
                }
                "Факториал" -> {
                    val n = param1.value.toInt()
                    mathematics.calculateFactorial(n).toString()
                }
                "Квадратное уравнение" -> {
                    val a = param1.value.toDouble()
                    val b = param2.value.toDouble()
                    val c = param1.value.toDouble() 
                    val roots = mathematics.solveQuadratic(a, b, c)
                    "Корни: x1 = ${roots.first}, x2 = ${roots.second}"
                }
                else -> "Неизвестная функция"
            }

            val resText = result?.toString() ?: "Ошибка"
            resultText.set(resText)
            if (!resText.contains("Ошибка")) {
                history.add(0, "$func => $resText")
                if (history.size > 20) history.removeLast()
            }

        } catch (e: Exception) {
            resultText.set("Ошибка: ${e.message}")
        }
    }
}

class MathMLApp : App(MathMLViewModel::class) {

    override fun start(stage: Stage) {
        stage.width = 900.0
        stage.height = 600.0
        super.start(stage)
    }
}

fun main() {
    launch<UniversalApp>()
}
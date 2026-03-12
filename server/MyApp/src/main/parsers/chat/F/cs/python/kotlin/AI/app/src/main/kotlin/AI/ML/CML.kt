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
import javafx.geometry.Insets
import javafx.scene.control.* 
import javafx.scene.text.Font
import javafx.scene.layout.*
import javafx.geometry.Pos
import kotlin.math.*
import tornadofx.*

// ==================== ХИМИЧЕСКАЯ МОДЕЛЬ ====================

open class ChemicalBaseModel {
    
    open fun getSections(): List<String> {
        return listOf(
            "Стехиометрия",
            "Газовые законы", 
            "Термохимия",
            "Кинетика",
            "Электрохимия",
            "Квантовая химия"
        )
    }

    open fun getAvailableMethods(section: String): List<String> {
        return when(section) {
            "Стехиометрия" -> listOf("Molar-Mass", "Reaction-Stoichiometry", "Mass-Percent")
            "Газовые законы" -> listOf("Ideal-Gas", "Combined-Gas", "Van-der-Waals")
            "Термохимия" -> listOf("Enthalpy", "Entropy", "Gibbs-Free-Energy")
            "Кинетика" -> listOf("Reaction-Rate", "Arrhenius-Equation")
            "Электрохимия" -> listOf("Cell-Potential", "Nernst-Equation")
            "Квантовая химия" -> listOf("De-Broglie", "Heisenberg")
            else -> listOf("Molar-Mass")
        }
    }

    open fun getParameterPlaceholders(method: String): List<String> {
        return when(method) {
            "Molar-Mass" -> listOf("Формула вещества")
            "Reaction-Stoichiometry" -> listOf("Количество вещества A", "Количество вещества B")
            "Mass-Percent" -> listOf("Масса элемента", "Масса соединения")
            "Ideal-Gas" -> listOf("Давление (Pa)", "Объем (L)", "Температура (K)")
            "Combined-Gas" -> listOf("P1", "V1", "T1", "P2", "V2", "T2")
            "Van-der-Waals" -> listOf("a", "b", "V", "T")
            "Enthalpy" -> listOf("ΔH реакции (кДж)")
            "Entropy" -> listOf("ΔS (Дж/К)")
            "Gibbs-Free-Energy" -> listOf("ΔH", "ΔS", "T")
            "Reaction-Rate" -> listOf("Концентрация", "Константа скорости")
            "Arrhenius-Equation" -> listOf("A", "Ea", "T")
            "Cell-Potential" -> listOf("E° катод", "E° анод")
            "Nernst-Equation" -> listOf("E°", "n", "[Ox]", "[Red]")
            "De-Broglie" -> listOf("Масса (кг)", "Скорость (м/с)")
            "Heisenberg" -> listOf("Δx", "Δp")
            else -> listOf("Параметр 1", "Параметр 2")
        }
    }

    open fun calculate(section: String, method: String, params: List<String>): String {
        return try {
            when(method) {
                "Molar-Mass" -> calculateMolarMass(params)
                "Reaction-Stoichiometry" -> calculateStoichiometry(params)
                "Mass-Percent" -> calculateMassPercent(params)
                "Ideal-Gas" -> calculateIdealGas(params)
                "Combined-Gas" -> calculateCombinedGas(params)
                "Van-der-Waals" -> calculateVanDerWaals(params)
                "Enthalpy" -> calculateEnthalpy(params)
                "Entropy" -> calculateEntropy(params)
                "Gibbs-Free-Energy" -> calculateGibbsEnergy(params)
                "Reaction-Rate" -> calculateReactionRate(params)
                "Arrhenius-Equation" -> calculateArrhenius(params)
                "Cell-Potential" -> calculateCellPotential(params)
                "Nernst-Equation" -> calculateNernst(params)
                "De-Broglie" -> calculateDeBroglie(params)
                "Heisenberg" -> calculateHeisenberg(params)
                else -> "Метод не реализован"
            }
        } catch(e: Exception) {
            "Ошибка: ${e.message}"
        }
    }

    protected open fun calculateMolarMass(params: List<String>): String {
        if (params.isEmpty() || params[0].isBlank()) throw IllegalArgumentException("Введите формулу вещества")
        val formula = params[0]
        val molarMass = when (formula.uppercase()) {
            "H2O" -> 18.0
            "CO2" -> 44.0
            "CH4" -> 16.0
            "H2SO4" -> 98.0
            "HCL" -> 36.5
            "NAOH" -> 40.0
            "NACL" -> 58.5
            else -> 0.0
        }
        return if (molarMass > 0) "Молярная масса $formula: ${"%.2f".format(molarMass)} г/моль" 
               else "Неизвестное вещество: $formula"
    }

    protected open fun calculateStoichiometry(params: List<String>): String {
        if (params.size < 2) throw IllegalArgumentException("Нужно 2 параметра")
        val nA = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверное число")
        val nB = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверное число")
        return "Соотношение A:B = ${"%.2f".format(nA/nB)}"
    }

    protected open fun calculateMassPercent(params: List<String>): String {
        if (params.size < 2) throw IllegalArgumentException("Нужно 2 параметра")
        val massElement = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная масса элемента")
        val massCompound = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная масса соединения")
        val percent = (massElement / massCompound) * 100
        return "Массовая доля: ${"%.2f".format(percent)}%"
    }

    protected open fun calculateIdealGas(params: List<String>): String {
        if (params.size < 3) throw IllegalArgumentException("Нужно 3 параметра")
        val p = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверное давление")
        val v = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный объем")
        val t = params[2].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная температура")
        val n = (p * v) / (8.314 * t)
        return "n = ${"%.4f".format(n)} моль"
    }

    protected open fun calculateCombinedGas(params: List<String>): String {
        if (params.size < 6) throw IllegalArgumentException("Нужно 6 параметров")
        val values = params.map { it.toDoubleOrNull() ?: throw IllegalArgumentException("Неверный параметр") }
        
        val p1 = values[0]
        val v1 = values[1]
        val t1 = values[2]
        val p2 = values[3]
        val v2 = values[4]
        val t2 = values[5]
        
        val result = (p2 * v2 * t1) / (p1 * v1 * t2)
        return "Отношение состояний: ${"%.4f".format(result)}"
    }

    protected open fun calculateVanDerWaals(params: List<String>): String {
        if (params.size < 4) throw IllegalArgumentException("Нужно 4 параметра")
        val values = params.map { it.toDoubleOrNull() ?: throw IllegalArgumentException("Неверный параметр") }
        val (a, b, v, t) = values
        val p = (8.314 * t) / (v - b) - a / (v * v)
        return "Давление: ${"%.2f".format(p)} Па"
    }

    protected open fun calculateEnthalpy(params: List<String>): String {
        if (params.isEmpty()) throw IllegalArgumentException("Нужен параметр ΔH")
        val deltaH = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный ΔH")
        return "ΔH = ${"%.2f".format(deltaH)} кДж/моль"
    }

    protected open fun calculateEntropy(params: List<String>): String {
        if (params.isEmpty()) throw IllegalArgumentException("Нужен параметр ΔS")
        val deltaS = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный ΔS")
        return "ΔS = ${"%.2f".format(deltaS)} Дж/(моль·К)"
    }

    protected open fun calculateGibbsEnergy(params: List<String>): String {
        if (params.size < 3) throw IllegalArgumentException("Нужно 3 параметра")
        val deltaH = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный ΔH")
        val deltaS = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный ΔS")
        val t = params[2].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная температура")
        val deltaG = deltaH - t * deltaS / 1000
        return "ΔG = ${"%.2f".format(deltaG)} кДж/моль"
    }

    protected open fun calculateReactionRate(params: List<String>): String {
        if (params.size < 2) throw IllegalArgumentException("Нужно 2 параметра")
        val conc = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная концентрация")
        val k = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная константа")
        val rate = k * conc
        return "Скорость реакции: ${"%.4f".format(rate)}"
    }

    protected open fun calculateArrhenius(params: List<String>): String {
        if (params.size < 3) throw IllegalArgumentException("Нужно 3 параметра: A, Ea, T")
        
        val a = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный параметр A")
        val ea = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный параметр Ea")
        val t = params[2].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный параметр T")
        
        val r = 8.314
        val exponent = -ea / (r * t)
        val k = a * exp(exponent)
        
        return "Константа скорости: ${"%.6e".format(k)}"
    }

    protected open fun calculateCellPotential(params: List<String>): String {
        if (params.size < 2) throw IllegalArgumentException("Нужно 2 параметра")
        val eCathode = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный потенциал катода")
        val eAnode = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный потенциал анода")
        val eCell = eCathode - eAnode
        return "ЭДС элемента: ${"%.3f".format(eCell)} В"
    }

    protected open fun calculateNernst(params: List<String>): String {
        if (params.size < 4) throw IllegalArgumentException("Нужно 4 параметра")
        val e0 = params[0].toDouble()
        val n = params[1].toDouble()
        val ox = params[2].toDouble()
        val red = params[3].toDouble()
        
        val e = e0 - (0.059 / n) * log10(ox / red)
        
        val result = if (abs(e) < 0.001 || abs(e) > 1000) {
            "%.3e".format(e)
        } else {
            "%.3f".format(e)
        }
        
        return "Потенциал: $result В"
    }

    protected open fun calculateDeBroglie(params: List<String>): String {
        if (params.size < 2) throw IllegalArgumentException("Нужно 2 параметра")
        val m = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная масса")
        val v = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверная скорость")
        val lambda = 6.626e-34 / (m * v)
        return "Длина волны де Бройля: ${"%.2e".format(lambda)} м"
    }

    protected open fun calculateHeisenberg(params: List<String>): String {
        if (params.size < 2) throw IllegalArgumentException("Нужно 2 параметра")
        val dx = params[0].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный Δx")
        val dp = params[1].toDoubleOrNull() ?: throw IllegalArgumentException("Неверный Δp")
        val uncertainty = dx * dp
        val limit = 1.0545718e-34 / 2
        return "Произведение неопределенностей: ${"%.2e".format(uncertainty)} (предел: ${"%.2e".format(limit)})"
    }
}

open class ChemicalCalculatorModel : ChemicalBaseModel() {
    open fun predict(input: Any): Any = mapOf("result" to "base chemistry prediction")
    
    open fun calculateMolarMass(formula: String): Double {
        return 0.0
    }
    
    open fun balanceEquation(equation: String): Map<String, Any> {
        return mapOf("result" to "Equation balancing not implemented")
    }
    
    open fun predictReaction(reactants: List<String>): Map<String, Any> {
        return mapOf("result" to "Reaction prediction not implemented")
    }
    
    fun calculatePH(concentration: Double, isAcid: Boolean = true): Double {
        return if (isAcid) -log10(concentration) else 14 + log10(concentration)
    }

    override fun getSections() = listOf(
        "Стехиометрия", "Газовые законы", "Термохимия",
        "Химическое равновесие", "Кинетика", "Электрохимия", "Квантовая химия"
    )

    override fun getAvailableMethods(section: String) = when(section) {
        "Стехиометрия" -> listOf("Molar-Mass", "Reaction-Stoichiometry")
        "Газовые законы" -> listOf("Ideal-Gas", "Combined-Gas")
        "Термохимия" -> listOf("Enthalpy", "Entropy")
        "Кинетика" -> listOf("Reaction-Rate")
        "Электрохимия" -> listOf("Cell-Potential")
        else -> listOf("Molar-Mass")
    }

    override fun getParameterPlaceholders(method: String) = when(method) {
        "Molar-Mass" -> listOf("Формула вещества")
        "Reaction-Stoichiometry" -> listOf("Количество вещества A", "Количество вещества B")
        "Ideal-Gas" -> listOf("Давление (Pa)", "Объем (L)", "Температура (K)")
        "Combined-Gas" -> listOf("P1", "V1", "T1", "P2", "V2", "T2")
        "Enthalpy" -> listOf("ΔH реакции (кДж)")
        "Entropy" -> listOf("ΔS (Дж/К)")
        "Reaction-Rate" -> listOf("Концентрация", "Константа скорости")
        "Cell-Potential" -> listOf("Электрод 1", "Электрод 2")
        else -> listOf("Параметр 1", "Параметр 2")
    }
}

// ==================== VIEWMODEL ====================

class ChemicalCalculatorViewModel : ViewModel() {
    val calculator = ChemicalCalculatorModel()

    val selectedSection = SimpleStringProperty(calculator.getSections().first())
    val selectedMethod = SimpleStringProperty()
    val calculationResult = SimpleStringProperty()
    val parameterValues = FXCollections.observableArrayList<String>()
    val calculationHistory = FXCollections.observableArrayList<String>()

    init {
        val methods = calculator.getAvailableMethods(selectedSection.value)
        if (methods.isNotEmpty()) {
            selectedMethod.value = methods.first()
        }
        
        selectedSection.addListener { _, _, _ ->
            updateMethods()
        }
    }

    fun updateMethods() {
        val methods = calculator.getAvailableMethods(selectedSection.value)
        if (methods.isNotEmpty()) {
            if (!methods.contains(selectedMethod.value)) {
                selectedMethod.value = methods.first()
            }
        }
    }

    fun getParameterPlaceholders(): List<String> {
        return calculator.getParameterPlaceholders(selectedMethod.value ?: "")
    }

    fun performCalculation() {
        val method = selectedMethod.value ?: return
        val placeholders = getParameterPlaceholders()
        
        if (parameterValues.size != placeholders.size || parameterValues.any { it.isBlank() }) {
            calculationResult.value = "Заполните все параметры корректно"
            return
        }

        try {
            val result = calculator.calculate(
                selectedSection.value, 
                method, 
                parameterValues.toList()
            )
            
            calculationResult.value = result
            
            val historyEntry = "${selectedSection.value} - $method: $result"
            calculationHistory.add(0, historyEntry)
            
            if (calculationHistory.size > 15) {
                calculationHistory.removeAt(calculationHistory.size - 1)
            }
            
        } catch (e: Exception) {
            calculationResult.value = "Ошибка: ${e.message}"
        }
    }

    fun clearFields() {
        parameterValues.clear()
        calculationResult.value = ""
    }
}

// ==================== VIEW ====================

class ChemicalCalculatorView : View("Химический калькулятор") {
    val viewModel = ChemicalCalculatorViewModel()

    override val root = borderpane {
        paddingAll = 20.0

        left = createLeftPanel()
        center = createCenterPanel()
    }

    private fun createLeftPanel() = vbox {
        spacing = 15.0
        prefWidth = 300.0

        label("Химический калькулятор") {
            style { 
                fontSize = 18.px
                fontWeight = FontWeight.BOLD
            }
        }

        vbox {
            spacing = 8.0
            label("Раздел химии:") {
                style { fontWeight = FontWeight.BOLD }
            }
            combobox(viewModel.selectedSection, FXCollections.observableArrayList(viewModel.calculator.getSections())) {
                prefWidth = 280.0
            }
        }

        vbox {
            spacing = 8.0
            label("Метод расчета:") {
                style { fontWeight = FontWeight.BOLD }
            }
            combobox(viewModel.selectedMethod) {
                prefWidth = 280.0
                itemsProperty().bind(
                    viewModel.selectedSection.objectBinding { section ->
                        FXCollections.observableArrayList(viewModel.calculator.getAvailableMethods(section ?: ""))
                    }
                )
            }
        }

        vbox {
            spacing = 8.0
            label("Параметры:") {
                style { fontWeight = FontWeight.BOLD }
            }
            vbox(5.0) {
                id = "parametersContainer"
                
                viewModel.selectedMethod.addListener { _, _, _ ->
                    updateParameterFields()
                }
                
                updateParameterFields()
            }
        }

        hbox {
            spacing = 10.0
            button("Рассчитать") {
                action {
                    viewModel.performCalculation()
                }
            }
            button("Очистить") {
                action {
                    viewModel.clearFields()
                }
            }
        }
    }

    private fun createCenterPanel() = vbox {
        spacing = 15.0

        label("Результаты расчета:") {
            style { 
                fontSize = 16.px
                fontWeight = FontWeight.BOLD
            }
        }

        textarea(viewModel.calculationResult) {
            isEditable = false
            prefRowCount = 6
            style { fontSize = 14.px }
        }

        label("История расчетов:") {
            style { 
                fontSize = 16.px
                fontWeight = FontWeight.BOLD
            }
        }

        listview(viewModel.calculationHistory) {
            prefHeight = 200.0
            cellFormat { text = it }
        }
    }

    private fun updateParameterFields() {
        val placeholders = viewModel.getParameterPlaceholders()
        
        val container = root.lookup("#parametersContainer") as? VBox ?: return
        container.children.clear()
        viewModel.parameterValues.clear()

        placeholders.forEachIndexed { index, placeholder ->
            container.vbox(5.0) {
                label("${placeholder}:")
                textfield {
                    promptText = "Введите значение..."
                    textProperty().addListener { _, _, newValue ->
                        if (index >= viewModel.parameterValues.size) {
                            viewModel.parameterValues.add(newValue)
                        } else {
                            viewModel.parameterValues[index] = newValue
                        }
                    }
                }
            }
        }
    }
}

// ==================== Приложение ====================
class UniversalApp : App(ChemicalCalculatorView::class)

fun main() {
    launch<UniversalApp>()
}
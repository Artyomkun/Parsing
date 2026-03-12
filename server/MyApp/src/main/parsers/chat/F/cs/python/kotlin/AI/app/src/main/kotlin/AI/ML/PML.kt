package AI.ML

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import javafx.beans.property.SimpleStringProperty
import javafx.collections.FXCollections
import kotlin.math.*
import tornadofx.*

// --------------------------- Core Formulas ---------------------------
object PhysicsConstants {
    const val c = 299792458.0
    const val G = 6.67430e-11
    const val R = 8.314462618
    const val g = 9.80665
    const val eps0 = 8.8541878128e-12
}

object AngleUtils {
    fun deg2rad(d: Double) = d * PI / 180.0
}

object PhysicsFormulas {
    fun uniformMotion(s0: Double, v: Double, t: Double) = s0 + v * t
    
    fun acceleratedMotion(s0: Double, v0: Double, a: Double, t: Double) = mapOf(
        "position" to (s0 + v0 * t + 0.5 * a * t * t),
        "velocity" to (v0 + a * t),
        "acceleration" to a
    )
    
    fun projectile(v0: Double, angleDeg: Double, t: Double): Map<String, Double> {
        val a = AngleUtils.deg2rad(angleDeg)
        val v0x = v0 * cos(a)
        val v0y = v0 * sin(a)
        return mapOf(
            "x" to v0x * t,
            "y" to (v0y * t - 0.5 * PhysicsConstants.g * t * t),
            "vx" to v0x,
            "vy" to (v0y - PhysicsConstants.g * t)
        )
    }
    
    fun freeFallHeight(h0: Double, t: Double) = h0 - 0.5 * PhysicsConstants.g * t * t
    fun gravForce(m1: Double, m2: Double, r: Double) = PhysicsConstants.G * m1 * m2 / (r * r)
    fun pressure(F: Double, A: Double) = F / A
    fun idealGas_n_from_PVT(P: Double, V: Double, T: Double) = (P * V) / (PhysicsConstants.R * T)
}

object BiologicalFormulas {
    fun michaelisMenten(vmax: Double, km: Double, substrate: Double) = (vmax * substrate) / (km + substrate)
    fun henderson(pKa: Double, acid: Double, base: Double) = pKa + log10(base / acid)
    fun bodyMassIndex(weightKg: Double, heightCm: Double) = weightKg / (heightCm / 100.0).pow(2.0)
    fun populationGrowth(n0: Double, r: Double, t: Double) = n0 * exp(r * t)
}

object ChemicalFormulas {
    fun idealGas_n(P: Double, V: Double, T: Double) = (P * V) / (PhysicsConstants.R * T)
    fun reactionHeatQ(m: Double, c: Double, dT: Double) = m * c * dT
}

// --------------------------- ViewModels ---------------------------
class PhysicsMLViewModel : ViewModel() {
    val sections = mapOf(
        "Kinematics" to listOf("uniformMotion", "acceleratedMotion", "projectile", "freeFallHeight"),
        "Dynamics" to listOf("gravForce"),
        "Fluids/Thermo" to listOf("pressure", "idealGas_n_from_PVT")
    )
    
    val selectedSection = SimpleStringProperty(sections.keys.first())
    val selectedMethod = SimpleStringProperty(sections.values.first().first())
    val parameterValues = observableListOf<SimpleStringProperty>()
    val result = SimpleStringProperty()
    
    init {
        updateParameters()
        selectedSection.onChange { updateMethods() }
        selectedMethod.onChange { updateParameters() }
    }
    
    fun updateMethods() {
        val methods = sections[selectedSection.value] ?: emptyList()
        if (methods.isNotEmpty() && !methods.contains(selectedMethod.value)) {
            selectedMethod.value = methods.first()
        }
    }
    
    fun updateParameters() {
        parameterValues.clear()
        getPlaceholders(selectedMethod.value).forEach { _ ->
            parameterValues.add(SimpleStringProperty(""))
        }
    }
    
    fun getPlaceholders(method: String) = when (method) {
        "uniformMotion" -> listOf("s0", "v", "t")
        "acceleratedMotion" -> listOf("s0", "v0", "a", "t")
        "projectile" -> listOf("v0", "angleDeg", "t")
        "freeFallHeight" -> listOf("h0", "t")
        "gravForce" -> listOf("m1", "m2", "r")
        "pressure" -> listOf("F", "A")
        "idealGas_n_from_PVT" -> listOf("P", "V", "T")
        else -> listOf("param1", "param2")
    }
    
    fun calculate() {
        val method = selectedMethod.value
        val params = parseParameters()
        
        if (params == null) {
            result.value = "Ошибка: заполните все параметры числами"
            return
        }
        
        try {
            val calculationResult = when (method) {
                "uniformMotion" -> "s(t) = %.6f".format(PhysicsFormulas.uniformMotion(params[0], params[1], params[2]))
                "acceleratedMotion" -> {
                    val m = PhysicsFormulas.acceleratedMotion(params[0], params[1], params[2], params[3])
                    m.entries.joinToString("\n") { "${it.key}: %.6f".format(it.value) }
                }
                "projectile" -> {
                    val m = PhysicsFormulas.projectile(params[0], params[1], params[2])
                    m.entries.joinToString("\n") { "${it.key}: %.6f".format(it.value) }
                }
                "freeFallHeight" -> "h(t) = %.6f".format(PhysicsFormulas.freeFallHeight(params[0], params[1]))
                "gravForce" -> "F = %.6e".format(PhysicsFormulas.gravForce(params[0], params[1], params[2]))
                "pressure" -> "P = %.6f".format(PhysicsFormulas.pressure(params[0], params[1]))
                "idealGas_n_from_PVT" -> "n = %.6f mol".format(PhysicsFormulas.idealGas_n_from_PVT(params[0], params[1], params[2]))
                else -> "Метод не реализован"
            }
            result.value = calculationResult
        } catch (e: Exception) {
            result.value = "Ошибка расчёта: ${e.message}"
        }
    }
    
    fun clear() {
        parameterValues.forEach { it.value = "" }
        result.value = ""
    }
    
    fun parseParameters(): List<Double>? {
        val values = parameterValues.map { it.value.trim() }
        if (values.any { it.isEmpty() }) return null
        
        return try {
            values.map { it.toDouble() }
        } catch (e: Exception) {
            null
        }
    }
}

// --------------------------- Views ---------------------------
class PhysicsMLView : View("Physics") {
    val viewModel = PhysicsMLViewModel()
    
    override val root = form {
        fieldset {
            field("Section") {
                combobox(viewModel.selectedSection, FXCollections.observableArrayList(viewModel.sections.keys.toList()))
            }
            
            field("Method") {
                combobox(viewModel.selectedMethod) {
                    itemsProperty().bind(
                        viewModel.selectedSection.objectBinding { section ->
                            FXCollections.observableArrayList(viewModel.sections[section] ?: emptyList())
                        }
                    )
                }
            }
            
            field("Parameters") {
                vbox {
                    bindChildren(viewModel.parameterValues) { param: SimpleStringProperty ->
                        hbox(5.0) {
                            val placeholder = viewModel.getPlaceholders(viewModel.selectedMethod.value)
                            val index = viewModel.parameterValues.indexOf(param)
                            val promptText = if (index < placeholder.size) placeholder[index] else "Parameter"
                            
                            label(promptText) { minWidth = 120.0 }
                            textfield(param)
                        }
                    }
                }
            }
            
            hbox(10.0) {
                button("Calculate") {
                    action { viewModel.calculate() }
                }
                button("Clear") {
                    action { viewModel.clear() }
                }
            }
            
            field("Result") {
                textarea(viewModel.result) {
                    isEditable = false
                    prefRowCount = 4
                }
            }
        }
    }
}

// Biology View (используем существующий BiologyMLViewModel как View)
class BiologyMLView : View("Biology") {
    val methods = listOf("michaelisMenten", "henderson", "bodyMassIndex", "populationGrowth")
    val selectedMethod = SimpleStringProperty(methods.first())
    val parameterValues = observableListOf<SimpleStringProperty>()
    val result = SimpleStringProperty()
    
    init {
        updateParameters()
        selectedMethod.onChange { updateParameters() }
    }
    
    fun updateParameters() {
        parameterValues.clear()
        getPlaceholders(selectedMethod.value).forEach { _ ->
            parameterValues.add(SimpleStringProperty(""))
        }
    }
    
    fun getPlaceholders(method: String) = when (method) {
        "michaelisMenten" -> listOf("vmax", "km", "substrate")
        "henderson" -> listOf("pKa", "acid", "base") 
        "bodyMassIndex" -> listOf("weightKg", "heightCm")
        "populationGrowth" -> listOf("n0", "r", "t")
        else -> listOf("param1", "param2")
    }
    
    fun calculate() {
        val method = selectedMethod.value
        val params = parseParameters()
        
        if (params == null) {
            result.value = "Ошибка: заполните все параметры числами"
            return
        }
        
        try {
            val calculationResult = when (method) {
                "michaelisMenten" -> "v = %.6f".format(BiologicalFormulas.michaelisMenten(params[0], params[1], params[2]))
                "henderson" -> "pH = %.6f".format(BiologicalFormulas.henderson(params[0], params[1], params[2]))
                "bodyMassIndex" -> "BMI = %.6f".format(BiologicalFormulas.bodyMassIndex(params[0], params[1]))
                "populationGrowth" -> "N(t) = %.6f".format(BiologicalFormulas.populationGrowth(params[0], params[1], params[2]))
                else -> "Метод не реализован"
            }
            result.value = calculationResult
        } catch (e: Exception) {
            result.value = "Ошибка расчёта: ${e.message}"
        }
    }
    
    fun clear() {
        parameterValues.forEach { it.value = "" }
        result.value = ""
    }
    
    fun parseParameters(): List<Double>? {
        val values = parameterValues.map { it.value.trim() }
        if (values.any { it.isEmpty() }) return null
        
        return try {
            values.map { it.toDouble() }
        } catch (e: Exception) {
            null
        }
    }
    
    override val root = form {
        fieldset {
            field("Method") {
                combobox(selectedMethod, FXCollections.observableArrayList(methods))
            }
            
            field("Parameters") {
                vbox {
                    bindChildren(parameterValues) { param: SimpleStringProperty ->
                        hbox(5.0) {
                            val placeholder = getPlaceholders(selectedMethod.value)
                            val index = parameterValues.indexOf(param)
                            val promptText = if (index < placeholder.size) placeholder[index] else "Parameter"
                            
                            label(promptText) { minWidth = 120.0 }
                            textfield(param)
                        }
                    }
                }
            }
            
            hbox(10.0) {
                button("Calculate") {
                    action { calculate() }
                }
                button("Clear") {
                    action { clear() }
                }
            }
            
            field("Result") {
                textarea(result) {
                    isEditable = false
                    prefRowCount = 4
                }
            }
        }
    }
}

// Chemistry View (используем существующий ChemistryMLViewModel как View)
class ChemistryMLView : View("Chemistry") {
    val methods = listOf("idealGas_n", "reactionHeatQ")
    val selectedMethod = SimpleStringProperty(methods.first())
    val parameterValues = observableListOf<SimpleStringProperty>()
    val result = SimpleStringProperty()
    
    init {
        updateParameters()
        selectedMethod.onChange { updateParameters() }
    }
    
    fun updateParameters() {
        parameterValues.clear()
        getPlaceholders(selectedMethod.value).forEach { _ ->
            parameterValues.add(SimpleStringProperty(""))
        }
    }
    
    fun getPlaceholders(method: String) = when (method) {
        "idealGas_n" -> listOf("P", "V", "T")
        "reactionHeatQ" -> listOf("m", "c", "dT")
        else -> listOf("param1", "param2")
    }
    
    fun calculate() {
        val method = selectedMethod.value
        val params = parseParameters()
        
        if (params == null) {
            result.value = "Ошибка: заполните все параметры числами"
            return
        }
        
        try {
            val calculationResult = when (method) {
                "idealGas_n" -> "n = %.6f mol".format(ChemicalFormulas.idealGas_n(params[0], params[1], params[2]))
                "reactionHeatQ" -> "Q = %.6f J".format(ChemicalFormulas.reactionHeatQ(params[0], params[1], params[2]))
                else -> "Метод не реализован"
            }
            result.value = calculationResult
        } catch (e: Exception) {
            result.value = "Ошибка расчёта: ${e.message}"
        }
    }
    
    fun clear() {
        parameterValues.forEach { it.value = "" }
        result.value = ""
    }
    
    fun parseParameters(): List<Double>? {
        val values = parameterValues.map { it.value.trim() }
        if (values.any { it.isEmpty() }) return null
        
        return try {
            values.map { it.toDouble() }
        } catch (e: Exception) {
            null
        }
    }
    
    override val root = form {
        fieldset {
            field("Method") {
                combobox(selectedMethod, FXCollections.observableArrayList(methods))
            }
            
            field("Parameters") {
                vbox {
                    bindChildren(parameterValues) { param: SimpleStringProperty ->
                        hbox(5.0) {
                            val placeholder = getPlaceholders(selectedMethod.value)
                            val index = parameterValues.indexOf(param)
                            val promptText = if (index < placeholder.size) placeholder[index] else "Parameter"
                            
                            label(promptText) { minWidth = 120.0 }
                            textfield(param)
                        }
                    }
                }
            }
            
            hbox(10.0) {
                button("Calculate") {
                    action { calculate() }
                }
                button("Clear") {
                    action { clear() }
                }
            }
            
            field("Result") {
                textarea(result) {
                    isEditable = false
                    prefRowCount = 4
                }
            }
        }
    }
}

// --------------------------- Main Application ---------------------------
class ScienceTabView : View("Science Calculator") {
    override val root = tabpane {
        tab("Physics") {
            add(PhysicsMLView::class)
        }
        tab("Biology") {
            add(BiologyMLView::class)
        }
        tab("Chemistry") {
            add(ChemistryMLView::class)
        }
    }
}

// --------------------------- Dependency Injection ---------------------------
fun main() {
    launch<UniversalApp>()
}
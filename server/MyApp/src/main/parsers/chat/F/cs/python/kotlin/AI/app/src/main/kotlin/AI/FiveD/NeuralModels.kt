package AI.FiveD

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlinx.serialization.*
import kotlin.math.*

@Serializable
data class Neural5D(
    val id: String,
    val name: String,
    val modelType: String,
    val position: List<Double>,
    val children: List<Neural5D> = emptyList(),
    val parameters: Map<String, Double> = emptyMap(),
    val activation: String = "sigmoid",
    val color: String = "#4CAF50",
    val description: String = "",
    val layerIndex: Int = 0,
    val neuronIndex: Int = 0,
    val networkArchitecture: List<Int> = emptyList(),
    val currentActivation: Double = 0.0,
    val isInput: Boolean = false,
    val isOutput: Boolean = false
) {
    fun getNeuronType(): String = when {
        layerIndex == 0 -> "input"
        layerIndex == networkArchitecture.size - 1 -> "output" 
        else -> "hidden_${layerIndex}"
    }
    
    fun getTotalNeurons(): Int = networkArchitecture.sum()
    fun getLayerSize(): Int = networkArchitecture.getOrElse(layerIndex) { 0 }
}

@Serializable
data class NeuralLayer(
    val neurons: Int,
    val activation: String = "sigmoid",
    val weights: List<List<Double>> = emptyList(),
    val biases: List<Double> = emptyList()
)
package AI.FiveD.Services

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlin.random.Random
import kotlin.math.*

open class NeuralNetworkService {
    
    fun createSampleNetwork(): List<Neural5D> {
        val architecture = listOf(3, 4, 4, 2)
        return buildNetworkRecursive(architecture)
    }

    fun buildNetworkRecursive(
        architecture: List<Int>,
        layerIndex: Int = 0,
        parent: Neural5D? = null
    ): List<Neural5D> {
        val nodes = mutableListOf<Neural5D>()
        val layerSize = architecture[layerIndex]
        
        for (i in 0 until layerSize) {
            val isInput = layerIndex == 0
            val isOutput = layerIndex == architecture.size - 1
            
            val node = Neural5D(
                id = "layer_${layerIndex}_neuron_$i",
                name = if (isInput) "Input $i" else if (isOutput) "Output $i" else "Hidden $layerIndex-$i",
                modelType = if (isInput) "Input" else if (isOutput) "Output" else "Hidden",
                position = FiveDimensionalSystem.calculateNodePosition(layerIndex, i, architecture.size, layerSize),
                children = if (!isOutput) buildNetworkRecursive(architecture, layerIndex + 1) else emptyList(),
                parameters = mapOf(
                    "connections" to (if (isOutput) 0.0 else architecture[layerIndex + 1].toDouble()),
                    "importance" to Random.nextDouble(0.5, 1.0)
                ),
                activation = when {
                    isInput -> "linear"
                    isOutput -> "sigmoid" 
                    else -> listOf("relu", "sigmoid", "tanh").random()
                },
                color = when {
                    isInput -> "#FF6B6B"
                    isOutput -> "#4ECDC4"
                    else -> "#45B7D1"
                },
                description = if (isInput) "Input neuron $i" else if (isOutput) "Output neuron $i" else "Hidden neuron",
                layerIndex = layerIndex,
                neuronIndex = i,
                networkArchitecture = architecture,
                isInputNode = isInput,
                isOutputNode = isOutput
            )
            nodes.add(node)
        }
        return nodes
    }
}

class DynamicNeuralNetwork {
    val layers = mutableListOf<NeuralLayer>()
    
    fun createRandomNetwork(vararg layerSizes: Int): DynamicNeuralNetwork {
        val network = DynamicNeuralNetwork()
        for (i in 0 until layerSizes.size - 1) {
            val inputSize = layerSizes[i]
            val outputSize = layerSizes[i + 1]
            val weights = List(outputSize) { List(inputSize) { Random.nextDouble(-1.0, 1.0) } }
            val biases = List(outputSize) { Random.nextDouble(-0.5, 0.5) }
            network.addLayer(NeuralLayer(outputSize, "sigmoid", weights, biases))
        }
        return network
    }
    
    fun addLayer(layer: NeuralLayer) { layers.add(layer) }
    
    fun forwardPass(input: List<Double>): List<Double> {
        var currentOutput = input
        for (layer in layers) {
            currentOutput = processLayer(currentOutput, layer)
        }
        return currentOutput
    }
    
    fun processLayer(input: List<Double>, layer: NeuralLayer): List<Double> {
        return layer.weights.mapIndexed { i, neuronWeights ->
            val sum = neuronWeights.zip(input).sumOf { (w, x) -> w * x } + layer.biases[i]
            applyActivation(sum, layer.activation)
        }
    }
    
    fun applyActivation(x: Double, activation: String): Double = when (activation) {
        "sigmoid" -> 1.0 / (1.0 + exp(-x))
        "relu" -> max(0.0, x)
        "tanh" -> tanh(x)
        "leaky_relu" -> if (x > 0) x else 0.01 * x
        else -> x
    }
}
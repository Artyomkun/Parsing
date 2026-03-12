package AI.FiveD.Visualization

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import kotlin.math.*

open class FiveDimensionalSystem {
    
    fun projectTo5D(position: List<Double>, time: Double, probability: Double): DoubleArray {
        require(position.size == 5) { "Position must have exactly 5 dimensions" }
        
        val (x, y, z, t, p) = position
        
        return doubleArrayOf(
            x + t * time * 0.1, 
            y + p * probability * 0.1,
            z + (t * probability + p * time) * 0.05,
            t * (1.0 + sin(time * 0.5) * 0.2),
            p * (1.0 + cos(probability * PI) * 0.1)
        )
    }

    fun calculate5DDistance(pos1: List<Double>, pos2: List<Double>): Double {
        require(pos1.size == 5 && pos2.size == 5) { "Both positions must have 5 dimensions" }
        
        return sqrt(
            (pos1[0] - pos2[0]).pow(2) +  
            (pos1[1] - pos2[1]).pow(2) +
            (pos1[2] - pos2[2]).pow(2) +
            (pos1[3] - pos2[3]).pow(2) +
            (pos1[4] - pos2[4]).pow(2)
        )
    }

    fun create5DGridPosition(
        layer: Int, 
        neuron: Int, 
        totalLayers: Int, 
        layerSize: Int,
        timePhase: Double = 0.0,
        probabilityPhase: Double = 1.0
    ): List<Double> {
        val x = (layer.toDouble() / (totalLayers - 1)) * 4.0 - 2.0 
        val y = (neuron.toDouble() / (layerSize - 1)) * 2.0 - 1.0 
        val z = sin(layer * 0.5) * 0.5
        val t = timePhase 
        val p = probabilityPhase
        
        return listOf(x, y, z, t, p)
    }
    fun calculateConnectionWidth(parent: Neural5D, child: Neural5D): Double {
        val parentImportance = parent.parameters["importance"] ?: 1.0
        val childImportance = child.parameters["importance"] ?: 1.0
        
        val distance = calculate5DDistance(parent.position, child.position)
        val distanceFactor = exp(-distance * 0.5)
        
        return 0.3 + (parentImportance + childImportance) * 0.35 * distanceFactor
    }

    fun calculate5DDirection(from: List<Double>, to: List<Double>): List<Double> {
        require(from.size == 5 && to.size == 5) { "Both points must have 5 dimensions" }
        
        return List(5) { i -> to[i] - from[i] }
    }

    fun normalize5D(vector: List<Double>): List<Double> {
        val magnitude = sqrt(vector.map { it * it }.sum())
        return if (magnitude > 0) vector.map { it / magnitude } else vector
    }
}
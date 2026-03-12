package AI.FiveD.Visualization

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import javafx.animation.*
import javafx.beans.property.SimpleDoubleProperty
import javafx.scene.Group
import javafx.scene.paint.Color
import javafx.scene.paint.PhongMaterial
import javafx.scene.shape.*
import javafx.scene.transform.Rotate
import javafx.util.Duration
import kotlin.math.*
import javafx.scene.PointLight

open class Neuron5D(
    val node: Neural5D,
    val onNeuronClick: (Neural5D) -> Unit,
    val timeProperty: SimpleDoubleProperty,
    val probabilityProperty: SimpleDoubleProperty
) : Group() {

    val hyperSoma: Group = createHyperSoma()
    val hyperDendrites: Group = createHyperDendrites()
    val hyperAxon: Group = createHyperAxon()
    val dimensionIndicators: Group = createDimensionIndicators()
    val activationGlow: PointLight = createActivationGlow()

    init {
        update5DPosition()
        setupInteractions()
        start5DAnimations()
        children.addAll(hyperSoma, hyperDendrites, hyperAxon, dimensionIndicators, activationGlow)
    }

    fun createHyperSoma(): Group {
        val group = Group()
        val baseSoma = Sphere(calculate5DNeuronSize()).apply {
            material = MaterialCache.get(node.color)
        }
        
        val quantumFluctuations = createQuantumFluctuations()
        group.children.addAll(quantumFluctuations, baseSoma)
        return group
    }

    fun createQuantumFluctuations(): Group {
        val group = Group()
        repeat(8) { i ->
            val angle = 2.0 * PI * i / 8
            val fluctuation = Sphere(1.5).apply {
                material = MaterialCache.get("#00BCD4")
                translateX = cos(angle) * 8.0
                translateZ = sin(angle) * 8.0
                translateY = sin(angle * 2) * 3.0
            }
            group.children.add(fluctuation)
        }
        return group
    }

    fun createHyperDendrites(): Group {
        val group = Group()
        repeat(6) { i -> group.children.add(create5DDendrite(i, 6)) }
        return group
    }

    fun create5DDendrite(index: Int, total: Int): Group {
        val baseAngle = 2.0 * PI * index / total
        return Group().apply {
            children.addAll(
                createMultiDimensionalDendrite(baseAngle, 12.0, Color.web("#4CAF50")),
                createFourthDimensionBranch(baseAngle + PI/4, 8.0),
                createFifthDimensionBranch(baseAngle - PI/4, 6.0)
            )
        }
    }

    fun createMultiDimensionalDendrite(angle: Double, length: Double, color: Color): Cylinder {
        return Cylinder(0.8, length).apply {
            material = MaterialCache.get(color.toString())
            rotationAxis = Rotate.Z_AXIS
            rotate = Math.toDegrees(angle)
            translateY = -length / 2
        }
    }

    fun createFourthDimensionBranch(angle: Double, length: Double): Group {
        val branch = Cylinder(0.4, length).apply {
            material = MaterialCache.get("#FF9800")
            rotationAxis = Rotate.X_AXIS
            rotate = Math.toDegrees(angle)
            translateY = -length / 2
            translateZ = 4.0
        }
        return Group(branch)
    }

    fun createFifthDimensionBranch(angle: Double, length: Double): Group {
        val branch = Cylinder(0.3, length).apply {
            material = MaterialCache.get("#9C27B0")
            rotationAxis = Rotate.Y_AXIS
            rotate = Math.toDegrees(angle)
            translateY = -length / 2
            translateX = 3.0
        }
        return Group(branch)
    }

    fun createHyperAxon(): Group {
        return Group().apply {
            children.addAll(
                createMainAxon(),
                createFourthDimensionAxons(),
                createFifthDimensionAxons(),
                createHyperSynapses()
            )
        }
    }

    fun createMainAxon(): Cylinder {
        return Cylinder(1.0, 18.0).apply {
            material = MaterialCache.get("#2196F3")
            translateY = calculate5DNeuronSize() + 9.0
        }
    }

    fun createFourthDimensionAxons(): Group {
        val group = Group()
        repeat(4) { i ->
            val angle = 2.0 * PI * i / 4
            val axon = Cylinder(0.5, 8.0).apply {
                material = MaterialCache.get("#FF9800")
                rotationAxis = Rotate.X_AXIS
                rotate = Math.toDegrees(angle)
                translateY = calculate5DNeuronSize() + 4.0
                translateZ = 6.0
            }
            group.children.add(axon)
        }
        return group
    }

    fun createFifthDimensionAxons(): Group {
        val group = Group()
        repeat(4) { i ->
            val angle = 2.0 * PI * i / 4 + PI/4
            val axon = Cylinder(0.4, 6.0).apply {
                material = MaterialCache.get("#9C27B0")
                rotationAxis = Rotate.Y_AXIS
                rotate = Math.toDegrees(angle)
                translateY = calculate5DNeuronSize() + 3.0
                translateX = 5.0
            }
            group.children.add(axon)
        }
        return group
    }

    fun createHyperSynapses(): Group {
        val group = Group()
        repeat(8) { i -> group.children.add(create5DSynapse(i, 8)) }
        return group
    }

    fun create5DSynapse(index: Int, total: Int): Sphere {
        val baseAngle = 2.0 * PI * index / total
        return Sphere(1.2).apply {
            material = MaterialCache.get("#E91E63")
            translateY = calculate5DNeuronSize() + 20.0
            translateX = cos(baseAngle) * 8.0
            translateZ = sin(baseAngle) * 8.0
        }
    }

    fun createDimensionIndicators(): Group {
        return Group().apply {
            children.addAll(
                createDimensionIndicator(Color.ORANGE, "4D"),
                createDimensionIndicator(Color.PURPLE, "5D")
            )
        }
    }

    fun createDimensionIndicator(color: Color, label: String): Group {
        val indicator = Cylinder(0.3, 3.0).apply {
            material = MaterialCache.get(color.toString())
            translateY = -15.0
        }
        return Group(indicator)
    }

    fun createActivationGlow(): PointLight {
        return PointLight(get5DNeuronColor()).apply {
            color = get5DNeuronColor().deriveColor(0.0, 1.0, 2.0, 0.3)
        }
    }

    fun get5DNeuronColor(): Color = when {
        node.isInputNode -> Color.web("#FF5252")
        node.isOutputNode -> Color.web("#4FC3F7")
        else -> Color.web(node.color)
    }

    fun calculate5DNeuronSize(): Double {
        val connections = node.parameters["connections"] ?: 1.0
        val importance = node.parameters["importance"] ?: 1.0
        val activation = node.currentActivation
        return 6.0 + ln(connections * importance + 1.0) * 2.0 + activation * 3.0
    }

    fun setupInteractions() {
        setOnMouseClicked { 
            if (it.clickCount == 2) onNeuronClick(node)
            it.consume() 
        }
    }

    fun start5DAnimations() {
        Timeline(
            KeyFrame(Duration.seconds(20.0), KeyValue(hyperSoma.rotateProperty(), 360.0))
        ).apply { cycleCount = Timeline.INDEFINITE }.play()
    }

    fun update5DPosition() {
        val projectedPos = FiveDimensionalSystem.projectTo3D(
            node.position, timeProperty.value, probabilityProperty.value
        )
        
        translateX = projectedPos[0] * 200
        translateY = projectedPos[1] * 200
        translateZ = projectedPos[2] * 200
    }
}
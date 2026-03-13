package AI.5D

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import javafx.animation.Timeline
import javafx.animation.KeyFrame
import javafx.animation.KeyValue
import javafx.beans.property.SimpleDoubleProperty
import javafx.scene.Group
import javafx.scene.paint.Color
import javafx.scene.paint.PhongMaterial
import javafx.scene.shape.Sphere
import javafx.scene.shape.Cylinder
import javafx.scene.shape.DrawMode
import javafx.scene.transform.Rotate
import javafx.scene.text.Text
import javafx.scene.text.Font
import javafx.scene.PointLight
import javafx.util.Duration
import kotlin.math.*
import kotlin.random.Random
import javafx.scene.input.MouseEvent
import javafx.scene.Cursor 
import AI.FiveD.Visualization.RenderUtils

open class FiveDimensionalNeuron(
    val node: Neural5D,
    val onNeuronClick: (Neural5D) -> Unit,
    val timeProperty: SimpleDoubleProperty,
    val probabilityProperty: SimpleDoubleProperty
) : Group() {

    val hyperSoma: Group 
    val hyperDendrites: Group
    val hyperAxon: Group
    val dimensionIndicators: Group
    val activationGlow: PointLight

    // Список динамических timelines, чтобы обновлять их rate при изменении свойств
    val dynamicTimelines = mutableListOf<DynamicTimeline>()
    data class DynamicTimeline(val timeline: Timeline, val baseRate: Double, val usesTime: Boolean = false, val usesProbability: Boolean = false)

    init {
        hyperSoma = createHyperSoma()
        hyperDendrites = createHyperDendrites()
        hyperAxon = createHyperAxon()
        dimensionIndicators = createDimensionIndicators()
        activationGlow = createActivationGlow()

        update5DPosition()

        setupInteractions()
        start5DAnimations()

        children.addAll(hyperSoma, hyperDendrites, hyperAxon, dimensionIndicators, activationGlow)
    }

    fun createHyperSoma(): Group {
        val group = Group()
        val baseSoma = Sphere(calculate5DNeuronSize(node.parameters)).apply {
            // use shared material cache to avoid creating many PhongMaterial instances
            material = MaterialCache.get(node.color)
        }
        val hyperLayer4D = createHyperLayer(12.0, Color.web("#FF9800", 0.3))
        val hyperLayer5D = createHyperLayer(16.0, Color.web("#9C27B0", 0.2))
        val quantumFluctuations = createQuantumFluctuations()

        group.children.addAll(quantumFluctuations, hyperLayer5D, hyperLayer4D, baseSoma)
        return group
    }

    fun createHyperLayer(radius: Double, color: Color): Sphere {
        return Sphere(radius).apply {
            material = PhongMaterial().apply {
                diffuseColor = color
                specularColor = Color.WHITE
                specularPower = 64.0
            }
        }
    }

    fun createQuantumFluctuations(): Group {
        val group = Group()
        val fluctuationCount = 8

        repeat(fluctuationCount) { i ->
            val angle = 2.0 * PI * i / fluctuationCount
            val fluctuation = Sphere(1.5).apply {
                material = PhongMaterial().apply {
                    diffuseColor = Color.web("#00BCD4", 0.6)
                    specularColor = Color.CYAN
                }
                translateX = cos(angle) * 8.0
                translateZ = sin(angle) * 8.0
                translateY = sin(angle * 2) * 3.0
            }
            // register a lightweight per-frame updater instead of a Timeline
            val baseOffset = sin(angle * 2)
            val speed = 0.5 + Random.nextDouble(0.5)
            val updater = {
                val t = System.currentTimeMillis() / 1000.0
                fluctuation.translateY = baseOffset * 3.0 + sin(t * speed) * 3.0
            }
            AnimationController.register(updater)

            group.children.add(fluctuation)
        }

        return group
    }

    fun createHyperDendrites(): Group {
        val group = Group()
        val dendriteCount = 6

        repeat(dendriteCount) { i ->
            val dendrite = create5DDendrite(i, dendriteCount)
            group.children.add(dendrite)
        }

        return group
    }

    fun create5DDendrite(index: Int, total: Int): Group {
        val group = Group()
        val baseAngle = 2.0 * PI * index / total
        val mainDendrite = createMultiDimensionalDendrite(baseAngle, 12.0, Color.web("#4CAF50"))
        val fourthDimBranch = createFourthDimensionBranch(baseAngle + PI/4, 8.0)
        val fifthDimBranch = createFifthDimensionBranch(baseAngle - PI/4, 6.0)

        group.children.addAll(mainDendrite, fourthDimBranch, fifthDimBranch)
        return group
    }

    fun createMultiDimensionalDendrite(angle: Double, length: Double, color: Color): Cylinder {
        return Cylinder(0.8, length).apply {
            material = PhongMaterial().apply {
                diffuseColor = color
                specularColor = Color.LIGHTGREEN
            }
            rotationAxis = Rotate.Z_AXIS
            rotate = Math.toDegrees(angle)
            translateY = -length / 2
            val pulseAnim = Timeline(
                KeyFrame(Duration.seconds(0.0),
                    KeyValue(scaleXProperty(), 1.0)
                ),
                KeyFrame(Duration.seconds(1.0),
                    KeyValue(scaleXProperty(), 1.2)
                )
            ).apply {
                cycleCount = Timeline.INDEFINITE
                autoReverse = true
                rate = 0.3 + node.currentActivation * 0.7
            }
            pulseAnim.play()
        }
    }

    fun createFourthDimensionBranch(angle: Double, length: Double): Group {
        val group = Group()
        
        val branch = Cylinder(0.4, length).apply {
            material = PhongMaterial().apply {
                diffuseColor = Color.web("#FF9800", 0.7)
                specularColor = Color.YELLOW
            }
            rotationAxis = Rotate.X_AXIS
            rotate = Math.toDegrees(angle)
            translateY = -length / 2
            translateZ = 4.0
        }
        val timeOscillation = Timeline(
            KeyFrame(Duration.seconds(0.0),
                KeyValue(branch.translateZProperty(), 4.0)
            ),
            KeyFrame(Duration.seconds(2.0),
                KeyValue(branch.translateZProperty(), -4.0)
            )
        ).apply {
            cycleCount = Timeline.INDEFINITE
            autoReverse = true
        }
        timeOscillation.play()

        group.children.add(branch)
        return group
    }

    fun createFifthDimensionBranch(angle: Double, length: Double): Group {
        val group = Group()
        
        val branch = Cylinder(0.3, length).apply {
            material = PhongMaterial().apply {
                diffuseColor = Color.web("#9C27B0", 0.6)
                specularColor = Color.MAGENTA
            }
            rotationAxis = Rotate.Y_AXIS
            rotate = Math.toDegrees(angle)
            translateY = -length / 2
            translateX = 3.0
        }
        val baseRate = 0.5
        val probOscillation = Timeline(
            KeyFrame(Duration.seconds(0.0),
                KeyValue(branch.translateXProperty(), 3.0)
            ),
            KeyFrame(Duration.seconds(1.5),
                KeyValue(branch.translateXProperty(), -3.0)
            )
        ).apply {
            cycleCount = Timeline.INDEFINITE
            autoReverse = true
            rate = baseRate + probabilityProperty.value * 0.5
        }
        probOscillation.play()
        dynamicTimelines.add(DynamicTimeline(probOscillation, baseRate, usesProbability = true))

        group.children.add(branch)
        return group
    }

    fun createHyperAxon(): Group {
        val group = Group()
        val mainAxon = Cylinder(1.0, 18.0).apply {
            material = MaterialCache.get("#2196F3")
            translateY = calculate5DNeuronSize(node.parameters) + 9.0
        }
        val fourthDimAxons = createFourthDimensionAxons()
        val fifthDimAxons = createFifthDimensionAxons()
        val hyperSynapses = createHyperSynapses()

        group.children.addAll(mainAxon, fourthDimAxons, fifthDimAxons, hyperSynapses)
        return group
    }

    fun createFourthDimensionAxons(): Group {
        val group = Group()
        val axonCount = 4

        repeat(axonCount) { i ->
            val angle = 2.0 * PI * i / axonCount
            val axon = Cylinder(0.5, 8.0).apply {
                material = PhongMaterial().apply {
                    diffuseColor = Color.web("#FF9800", 0.8)
                }
                rotationAxis = Rotate.X_AXIS
                rotate = Math.toDegrees(angle)
                translateY = calculate5DNeuronSize(node.parameters) + 4.0
                translateZ = 6.0
            }
            val timeModulation = Timeline(
                KeyFrame(Duration.seconds(0.0),
                    KeyValue(axon.opacityProperty(), 0.6)
                ),
                KeyFrame(Duration.seconds(1.0),
                    KeyValue(axon.opacityProperty(), 1.0)
                )
            ).apply {
                cycleCount = Timeline.INDEFINITE
                autoReverse = true
            }
            timeModulation.play()

            group.children.add(axon)
        }

        return group
    }

    fun createFifthDimensionAxons(): Group {
        val group = Group()
        val axonCount = 4

        repeat(axonCount) { i ->
            val angle = 2.0 * PI * i / axonCount + PI/4
            val axon = Cylinder(0.4, 6.0).apply {
                material = PhongMaterial().apply {
                    diffuseColor = Color.web("#9C27B0", 0.7)
                }
                rotationAxis = Rotate.Y_AXIS
                rotate = Math.toDegrees(angle)
                translateY = calculate5DNeuronSize(node.parameters) + 3.0
                translateX = 5.0
            }
            val baseRate = max(0.2, probabilityProperty.value * 2.0)
            val probModulation = Timeline(
                KeyFrame(Duration.seconds(0.0),
                    KeyValue(axon.scaleYProperty(), 1.0)
                ),
                KeyFrame(Duration.seconds(0.8),
                    KeyValue(axon.scaleYProperty(), 1.3)
                )
            ).apply {
                cycleCount = Timeline.INDEFINITE
                autoReverse = true
                rate = baseRate
            }
            probModulation.play()
            dynamicTimelines.add(DynamicTimeline(probModulation, baseRate, usesProbability = true))

            group.children.add(axon)
        }

        return group
    }

    fun createHyperSynapses(): Group {
        val group = Group()
        val synapseCount = 8

        repeat(synapseCount) { i ->
            val synapse = create5DSynapse(i, synapseCount)
            group.children.add(synapse)
        }

        return group
    }

    fun create5DSynapse(index: Int, total: Int): Group {
        val group = Group()
        val baseAngle = 2.0 * PI * index / total
        
        val synapse = Sphere(1.2).apply {
            material = MaterialCache.get("#E91E63")
            translateY = calculate5DNeuronSize(node.parameters) + 20.0
            translateX = cos(baseAngle) * 8.0
            translateZ = sin(baseAngle) * 8.0
        }
        val baseRate = 0.4
        val quantumTimeOscillation = Timeline(
            KeyFrame(Duration.seconds(0.0),
                KeyValue(synapse.translateYProperty(), calculate5DNeuronSize(node.parameters) + 20.0)
            ),
            KeyFrame(Duration.seconds(1.5),
                KeyValue(synapse.translateYProperty(), calculate5DNeuronSize(node.parameters) + 22.0)
            )
        ).apply {
            cycleCount = Timeline.INDEFINITE
            autoReverse = true
            rate = baseRate + timeProperty.value * 0.1
        }
        quantumTimeOscillation.play()
        dynamicTimelines.add(DynamicTimeline(quantumTimeOscillation, baseRate, usesTime = true))

        group.children.add(synapse)
        return group
    }

    fun createDimensionIndicators(): Group {
        val group = Group()
        val timeIndicator = createDimensionIndicator(Color.ORANGE, "4D")
        val probIndicator = createDimensionIndicator(Color.PURPLE, "5D")

        group.children.addAll(timeIndicator, probIndicator)
        return group
    }

    fun createDimensionIndicator(color: Color, label: String): Group {
        val group = Group()
        
        val indicator = Cylinder(0.3, 3.0).apply {
            material = PhongMaterial().apply {
                diffuseColor = color.deriveColor(0.0, 1.0, 1.0, 0.8)
            }
            translateY = -15.0
        }

        val labelText = Text(label).apply {
            fill = color
            font = Font.font(8.0)
            translateY = -18.0
            isVisible = false
        }

        indicator.setOnMouseEntered {
            labelText.isVisible = true
        }
        indicator.setOnMouseExited {
            labelText.isVisible = false
        }

        group.children.addAll(indicator, labelText)
        return group
    }

    fun createActivationGlow(): PointLight {
        return PointLight(get5DNeuronColor()).apply {
            color = get5DNeuronColor().deriveColor(0.0, 1.0, 2.0, 0.3)
        }
    }

    fun get5DNeuronColor(): Color {
        return when {
            node.isInputNode -> Color.web("#FF5252")
            node.isOutputNode -> Color.web("#4FC3F7")
            else -> Color.web(node.color)
        }
    }

    fun calculate5DNeuronSize(parameters: Map<String, Double>): Double {
        val connections = parameters["connections"] ?: 1.0
        val importance = parameters["importance"] ?: 1.0
        val activation = node.currentActivation
        return 6.0 + ln(connections * importance + 1.0) * 2.0 + activation * 3.0
    }

    fun setupInteractions() {
        setOnMouseClicked {
            if (it.clickCount == 2) {
                onNeuronClick(node)
            }
            it.consume()
        }

        setOnMouseEntered {
            activationGlow.color = activationGlow.color.brighter()
        }

        setOnMouseExited {
            activationGlow.color = get5DNeuronColor().deriveColor(0.0, 1.0, 2.0, 0.3)
        }
    }

    fun start5DAnimations() {
        val hyperRotation = Timeline(
            KeyFrame(Duration.seconds(0.0),
                KeyValue(hyperSoma.rotateProperty(), 0.0)
            ),
            KeyFrame(Duration.seconds(20.0),
                KeyValue(hyperSoma.rotateProperty(), 360.0)
            )
        ).apply {
            cycleCount = Timeline.INDEFINITE
        }
        hyperRotation.play()
        val activationPulse = Timeline(
            KeyFrame(Duration.seconds(0.0),
                KeyValue(activationGlow.colorProperty(), activationGlow.color)
            ),
            KeyFrame(Duration.seconds(1.0),
                KeyValue(activationGlow.colorProperty(), activationGlow.color.brighter())
            )
        ).apply {
            cycleCount = Timeline.INDEFINITE
            autoReverse = true
            rate = 0.5 + node.currentActivation
        }
        activationPulse.play()
    }

    fun update5DPosition() {
        val projectedPos = FiveDimensionalSystem.projectTo5D(
            node.position, 
            timeProperty.value, 
            probabilityProperty.value
        )
        
        translateX = projectedPos[0] * 200
        translateY = projectedPos[1] * 200
        translateZ = projectedPos[2] * 200
        val (_, _, _, t, p) = node.position
        rotationAxis = Rotate.Y_AXIS
        rotate = t * 180 + timeProperty.value * 36
        scaleX = 0.8 + p * 0.4
        scaleY = 0.8 + p * 0.4
        scaleZ = 0.8 + p * 0.4
    }

    // После создания всех timelines — слушаем изменения свойств и корректируем rate
    init {
        // Добавляем слушатели только один раз
        timeProperty.addListener { _, _, new ->
            val t = new.toDouble()
            dynamicTimelines.forEach { dt ->
                val timeFactor = if (dt.usesTime) 1.0 + t * 0.1 else 1.0
                val probFactor = if (dt.usesProbability) 1.0 + probabilityProperty.value else 1.0
                dt.timeline.rate = dt.baseRate * timeFactor * probFactor
            }
        }
        probabilityProperty.addListener { _, _, new ->
            val p = new.toDouble()
            dynamicTimelines.forEach { dt ->
                val timeFactor = if (dt.usesTime) 1.0 + timeProperty.value * 0.1 else 1.0
                val probFactor = if (dt.usesProbability) 1.0 + p else 1.0
                dt.timeline.rate = dt.baseRate * timeFactor * probFactor
            }
        }
    }
}
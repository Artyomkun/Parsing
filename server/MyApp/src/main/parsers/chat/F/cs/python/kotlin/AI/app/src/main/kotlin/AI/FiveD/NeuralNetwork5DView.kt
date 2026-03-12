package AI.FiveD

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import javafx.beans.property.SimpleBooleanProperty
import javafx.beans.property.SimpleStringProperty
import javafx.collections.FXCollections
import javafx.geometry.Insets
import javafx.scene.control.*
import javafx.scene.text.Font
import javafx.scene.text.FontWeight
import javafx.application.Platform
import tornadofx.*
import kotlinx.coroutines.runAsync
import kotlinx.serialization.Serializable
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.concurrent.thread
import kotlin.random.Random

open class NeuralNetwork5DView : View("5D Neural Network Visualization") {
    val animationTimer = javafx.animation.Timeline()
    val neurons = FXCollections.observableArrayList<Neuron5D>()
    val connections = FXCollections.observableArrayList<Connection5D>()

    

    override val root = borderpane {
        top {
            hbox(spacing = 15.0, padding = Insets(10.0)) {
                label("5D Neural Network Visualization") {
                    style {
                        fontSize = 20.px
                        textFill = Color.DARKBLUE
                        fontWeight = FontWeight.BOLD
                    }
                }
                spacer()
                button("Start 5D Animation") {
                    action { start5DAnimation() }
                    style { backgroundColor += Color.LIGHTGREEN }
                }
                button("Stop Animation") {
                    action { stop5DAnimation() }
                    style { backgroundColor += Color.LIGHTCORAL }
                }
                button("Add Neuron") {
                    action { addRandomNeuron() }
                    style { backgroundColor += Color.LIGHTBLUE }
                }
            }
        }

        center {
            group {
                // Создаем 5D пространство с перспективой
                for (i in 0..4) {
                    val layerZ = i * 100.0
                    val neuronsInLayer = 5 + i

                    // Создаем нейроны для каждого слоя 5D пространства
                    for (j in 0 until neuronsInLayer) {
                        val neuron = FiveDimensionalNeuron(
                            x = (j - neuronsInLayer/2) * 80.0,
                            y = (i - 2) * 60.0,
                            z = layerZ,
                            layer = i,
                            dimension = "D${i+1}"
                        )
                        neurons.add(neuron)

                        // Добавляем визуальное представление нейрона
                        circle {
                            centerX = neuron.x
                            centerY = neuron.y
                            radius = 15.0 + neuron.layer * 2
                            fill = when (neuron.layer) {
                                0 -> Color.CYAN
                                1 -> Color.LIGHTGREEN
                                2 -> Color.YELLOW
                                3 -> Color.ORANGE
                                4 -> Color.MAGENTA
                                else -> Color.GRAY
                            }.deriveColor(0.0, 1.0, 1.0, 0.8)

                            stroke = Color.BLACK
                            strokeWidth = 2.0

                            // Добавляем анимацию активации
                            setOnMouseEntered {
                                fill = fill.deriveColor(0.0, 1.0, 2.0, 1.0)
                            }
                            setOnMouseExited {
                                fill = fill.deriveColor(0.0, 1.0, 1.0, 0.8)
                            }
                        }

                        // Добавляем текстовую метку
                        text {
                            x = neuron.x - 20
                            y = neuron.y - 25
                            text = neuron.dimension
                            fill = Color.WHITE
                            font = javafx.scene.text.Font.font("Arial", 10.0)
                        }
                    }
                }

                // Создаем связи между слоями
                create5DConnections()
            }
        }

        bottom {
            hbox(spacing = 20.0, padding = Insets(10.0)) {
                label("Active Neurons:") {
                    style { fontWeight = FontWeight.BOLD }
                }
                label(neurons.size.toString())

                label("Connections:") {
                    style { fontWeight = FontWeight.BOLD }
                }
                label(connections.size.toString())

                label("5D Layers:") {
                    style { fontWeight = FontWeight.BOLD }
                }
                label("5")

                spacer()

                progressbar {
                    progress = -1.0 // Бесконечный прогресс для индикации активности
                    prefWidth = 200.0
                }
            }
        }
    }

    fun create5DConnections() {
        // Создаем связи между нейронами разных измерений
        for (i in 0 until neurons.size - 1) {
            val currentNeuron = neurons[i]
            val nextNeuron = neurons[i + 1]

            val connection = FiveDimensionalConnection(
                fromNeuron = currentNeuron,
                toNeuron = nextNeuron,
                strength = kotlin.random.Random.nextDouble(0.3, 1.0)
            )
            connections.add(connection)

            // Добавляем визуальное представление связи
            line {
                startX = currentNeuron.x
                startY = currentNeuron.y
                startZ = currentNeuron.z
                endX = nextNeuron.x
                endY = nextNeuron.y
                endZ = nextNeuron.z
                stroke = Color.GRAY.deriveColor(0.0, 1.0, 1.0, connection.strength)
                strokeWidth = connection.strength * 3
            }
        }
    }

    fun start5DAnimation() {
        animationTimer.keyFrames.clear()
        animationTimer.keyframe(javafx.util.Duration.seconds(0.0)) {
            keyvalue(neurons[0].xProperty, neurons[0].x)
            keyvalue(neurons[0].yProperty, neurons[0].y)
            keyvalue(neurons[0].zProperty, neurons[0].z)
        }

        // Добавляем анимацию для каждого нейрона
        neurons.forEach { neuron ->
            animationTimer.keyframe(javafx.util.Duration.seconds(2.0)) {
                keyvalue(neuron.xProperty, neuron.x + kotlin.random.Random.nextDouble(-20.0, 20.0))
                keyvalue(neuron.yProperty, neuron.y + kotlin.random.Random.nextDouble(-15.0, 15.0))
                keyvalue(neuron.zProperty, neuron.z + kotlin.random.Random.nextDouble(-10.0, 10.0))
            }
        }

        animationTimer.cycleCount = javafx.animation.Animation.INDEFINITE
        animationTimer.play()
    }

    fun stop5DAnimation() {
        animationTimer.stop()
    }

    fun addRandomNeuron() {
        val newNeuron = FiveDimensionalNeuron(
            x = kotlin.random.Random.nextDouble(-200.0, 200.0),
            y = kotlin.random.Random.nextDouble(-150.0, 150.0),
            z = kotlin.random.Random.nextDouble(0.0, 400.0),
            layer = kotlin.random.Random.nextInt(0, 5),
            dimension = "D${kotlin.random.Random.nextInt(1, 6)}"
        )
        neurons.add(newNeuron)

        // Отправляем данные на высокопроизводительный сервер
        sendNeuronToHighPerformanceServer(newNeuron)
    }

        private fun sendNeuronToHighPerformanceServer(neuron: FiveDimensionalNeuron) {
        runAsync {
            try {
                val client = OkHttpClient.Builder()
                    .connectTimeout(5, TimeUnit.SECONDS)
                    .readTimeout(10, TimeUnit.SECONDS)
                    .writeTimeout(10, TimeUnit.SECONDS)
                    .build()

                val neuronData = mapOf(
                    "id" to "neuron_${System.currentTimeMillis()}",
                    "x" to neuron.x,
                    "y" to neuron.y,
                    "z" to neuron.z,
                    "layer" to neuron.layer,
                    "dimension" to neuron.dimension,
                    "activation" to kotlin.random.Random.nextDouble(0.0, 1.0),
                    "timestamp" to LocalDateTime.now().toString()
                )

                val requestBody = Json.encodeToString(neuronData)
                val request = okhttp3.Request.Builder()
                    .url("$neuralServerUrl/neural/add")
                    .post(okhttp3.RequestBody.create(
                        "application/json; charset=utf-8".toMediaType(),
                        requestBody
                    ))
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        println("Neuron sent to high-performance server")
                    } else {
                        println("Failed to send neuron to server: ${response.code}")
                    }
                }

            } catch (e: Exception) {
                println("Error sending neuron to server: ${e.message}")
            }
        }
    }
}
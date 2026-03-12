package AI.FiveD.Visualization

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import javafx.animation.AnimationTimer
import javafx.scene.paint.PhongMaterial
import javafx.scene.paint.Color
import java.util.concurrent.ConcurrentHashMap

object MaterialCache {
    val cache = ConcurrentHashMap<String, PhongMaterial>()

    fun get(colorHex: String): PhongMaterial = cache.computeIfAbsent(colorHex) {
        PhongMaterial(Color.web(colorHex))
    }
}

/**
 * Central animation controller to reduce number of Timelines/AnimationTimers.
 * Neuron instances can register an update lambda which will be called each frame.
 */
object AnimationController {
    val updaters = ConcurrentHashMap.newKeySet<() -> Unit>()
    var timer: AnimationTimer? = null

    fun start() {
        if (timer != null) return
        timer = object : AnimationTimer() {
            override fun handle(now: Long) {
                val snapshot = updaters.toList()
                for (u in snapshot) {
                    try {
                        u()
                    } catch (e: Exception) {
                        // guard against exceptions
                    }
                }
            }
        }
        timer?.start()
    }

    fun stop() {
        timer?.stop()
        timer = null
    }

    fun register(updater: () -> Unit) {
        updaters.add(updater)
        start()
    }

    fun unregister(updater: () -> Unit) {
        updaters.remove(updater)
        if (updaters.isEmpty()) stop()
    }
}

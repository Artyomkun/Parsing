package AI.FiveD.Visualization

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import javafx.animation.Timeline
import javafx.beans.property.SimpleDoubleProperty
import javafx.scene.Group
import javafx.scene.paint.Color
import javafx.scene.paint.PhongMaterial
import javafx.scene.shape.Cylinder
import javafx.scene.transform.Rotate
import javafx.util.Duration
import kotlin.math.*

open class NeuralConnection(
    val parent: Neural5D,
    val child: Neural5D,
    val timeProperty: SimpleDoubleProperty,
    val probabilityProperty: SimpleDoubleProperty
) : Group() {

    val cylinder = Cylinder().apply {
        material = PhongMaterial(Color.LIGHTBLUE.deriveColor(0.0, 1.0, 1.0, 0.6))
        drawMode = DrawMode.FILL
    }

    init {
        updateConnection()
        timeProperty.addListener { _, _, _ -> updateConnection() }
        probabilityProperty.addListener { _, _, _ -> updateConnection() }
        children.add(cylinder)
    }

    fun updateConnection() {
        val parentPos = FiveDimensionalSystem.projectTo3D(parent.position, timeProperty.value, probabilityProperty.value)
        val childPos = FiveDimensionalSystem.projectTo3D(child.position, timeProperty.value, probabilityProperty.value)

        val (sx, sy, sz) = parentPos.map { it * 200 }
        val (ex, ey, ez) = childPos.map { it * 200 }

        val dx = ex - sx
        val dy = ey - sy
        val dz = ez - sz

        val length = sqrt(dx * dx + dy * dy + dz * dz)
        cylinder.height = length
        cylinder.radius = FiveDimensionalSystem.calculateConnectionWidth(parent, child)
        
        cylinder.translateX = sx + dx / 2
        cylinder.translateY = sy + dy / 2
        cylinder.translateZ = sz + dz / 2

        val angleX = Math.toDegrees(atan2(dy, sqrt(dx * dx + dz * dz)))
        val angleY = Math.toDegrees(atan2(dx, dz))

        cylinder.rotationAxis = Rotate.X_AXIS
        cylinder.rotate = angleX
        cylinder.transforms.setAll(Rotate(angleY, Rotate.Y_AXIS))
    }
}
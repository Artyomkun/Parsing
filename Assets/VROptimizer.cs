using UnityEngine;
using UnityEngine.XR;

#pragma warning disable CA1050 // Declare types in namespaces
public class VROptimizer : MonoBehaviour
#pragma warning restore CA1050 // Declare types in namespaces
{
    static void Start()
    {
        // Устанавливаем целевой FPS для VR
        Application.targetFrameRate = 90;
        XRSettings.eyeTextureResolutionScale = 1.2f; // Качество рендера

        // Отключаем VSync для задержки
        QualitySettings.vSyncCount = 0;
    }

    void Update()
    {
        // Динамическое изменение качества для поддержания FPS
        if (1.0f / Time.deltaTime < 80) // Если FPS падает ниже 80
        {
            // Упрощаем рендеринг
            XRSettings.eyeTextureResolutionScale = Mathf.Max(1.0f, XRSettings.eyeTextureResolutionScale - 0.1f);
        }
    }
}
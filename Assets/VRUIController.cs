using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit.UI;

#pragma warning disable CA1050 // Declare types in namespaces
public class VRUIController : MonoBehaviour
#pragma warning restore CA1050 // Declare types in namespaces
{
    public Canvas vrCanvas; // Canvas с World Space режимом
    public Transform playerHead; // XR Origin Camera
    public float uiDistance = 2f;

    void Update()
    {
        // Позиционируем UI перед пользователем
        if (vrCanvas != null && playerHead != null)
        {
            vrCanvas.transform.position = playerHead.position + playerHead.forward * uiDistance;
            vrCanvas.transform.rotation = Quaternion.LookRotation(vrCanvas.transform.position - playerHead.position);
        }
    }

    // Кнопка "Показать спутниковый слой"
    public void OnSatelliteButtonPressed()
    {
        // Логика смены текстуры на спутниковую
        Debug.Log("Switching to satellite view in VR");
    }

    // Кнопка "Показать данные температуры"
    public void OnTemperatureDataButtonPressed()
    {
        // Логика визуализации температурных данных
        Debug.Log("Showing temperature data in VR");
    }

    // Слайдер для управления временной шкалой (4D)
    public void OnTimeSliderChanged(float value)
    {
        // value от 0.0 (прошлое) до 1.0 (будущее)
        Debug.Log("Time changed to: " + value);
    }
}
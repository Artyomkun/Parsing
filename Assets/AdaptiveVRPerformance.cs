using UnityEngine;
using UnityEngine.AdaptivePerformance;

public class AdaptiveVRPerformance : MonoBehaviour
{
    private IAdaptivePerformance ap;

    void Start()
    {
        ap = Holder.Instance;
        if (ap != null && ap.Active)
        {
            // Подписываемся на событие изменения теплового состояния
            ap.ThermalStatus.ThermalEvent += OnThermalEvent;
        }
    }

    static void OnThermalEvent(ThermalMetrics metrics)
    {
        // Регулируем целевую частоту кадров в зависимости от уровня предупреждения
        switch (metrics.WarningLevel)
        {
            case WarningLevel.NoWarning:
                Application.targetFrameRate = 90; // Нормальный режим VR
                break;
            case WarningLevel.ThrottlingImminent:
                Application.targetFrameRate = 60; // Снижаем нагрузку
                break;
            case WarningLevel.Throttling:
                Application.targetFrameRate = 45; // Значительно снижаем нагрузку
                break;
        }
    }
}
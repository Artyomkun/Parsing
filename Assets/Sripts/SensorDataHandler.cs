using UnityEngine;
using System.Runtime.InteropServices; // Добавьте эту строку

public class SensorDataHandler : MonoBehaviour
{
    [Header("Sensor Settings")]
    public int sensorDataSize = 512;
    public float updateFrequency = 1.0f;

    private GCHandleExample gcHandler;
    private float lastUpdateTime;

    void Start()
    {
        gcHandler = gameObject.AddComponent<GCHandleExample>();
        gcHandler.bufferSize = sensorDataSize;
        gcHandler.handleType = GCHandleType.Pinned; // Теперь GCHandleType будет распознан
        gcHandler.logOperations = true;
        
        gcHandler.OnHandleAllocated += () => Debug.Log("Sensor data handler ready");
        gcHandler.OnHandleFreed += () => Debug.Log("Sensor data handler cleaned up");
    }

    void Update()
    {
        if (Time.time - lastUpdateTime >= 1.0f / updateFrequency)
        {
            UpdateSensorData();
            lastUpdateTime = Time.time;
        }
    }

    void UpdateSensorData()
    {
        if (gcHandler == null || !gcHandler.IsHandleAllocated) return;

        byte[] sensorData = new byte[sensorDataSize];
        for (int i = 0; i < sensorData.Length; i++)
        {
            sensorData[i] = (byte)(Mathf.Sin(Time.time + i * 0.1f) * 127 + 128);
        }

        gcHandler.UpdateData(sensorData);
    }

    void OnDestroy()
    {
        if (gcHandler != null)
        {
            Destroy(gcHandler);
        }
    }
}
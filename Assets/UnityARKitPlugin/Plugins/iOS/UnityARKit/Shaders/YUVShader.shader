using UnityEngine;
using UnityEngine.XR.ARFoundation;

public class ARCameraShaderController : MonoBehaviour
{
    public Material arCameraMaterial;
    private ARCameraManager cameraManager;
    
    void Start()
    {
        cameraManager = FindObjectOfType<ARCameraManager>();
        if (cameraManager != null)
        {
            cameraManager.frameReceived += OnCameraFrameReceived;
        }
    }
    
    void OnCameraFrameReceived(ARCameraFrameEventArgs eventArgs)
    {
        // Устанавливаем текстуры Y и CbCr
        if (eventArgs.yTexture != null && eventArgs.cbCrTexture != null)
        {
            arCameraMaterial.SetTexture("_textureY", eventArgs.yTexture);
            arCameraMaterial.SetTexture("_textureCbCr", eventArgs.cbCrTexture);
        }
        
        // Устанавливаем матрицу преобразования
        if (eventArgs.displayMatrix.HasValue)
        {
            Matrix4x4 matrix = eventArgs.displayMatrix.Value;
            arCameraMaterial.SetMatrix("_DisplayTransform", matrix);
        }
    }
    
    void OnDestroy()
    {
        if (cameraManager != null)
        {
            cameraManager.frameReceived -= OnCameraFrameReceived;
        }
    }
}
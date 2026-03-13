using System.Runtime.InteropServices;
using UnityEngine;
using System;

public class GCHandleExample : MonoBehaviour
{
    [Header("GCHandle Settings")]
    public int bufferSize = 1024;
    public GCHandleType handleType = GCHandleType.Pinned;
    public bool logOperations = true;

    private GCHandle gcHandle;
    private byte[] data;
    private bool isHandleInitialized = false;

    public event Action OnHandleAllocated;
    public event Action OnHandleFreed;
    public event Action<Exception> OnHandleError;

    void Start()
    {
        InitializeGCHandle();
    }

    void InitializeGCHandle()
    {
        try
        {
            data = new byte[bufferSize];
            
            for (int i = 0; i < data.Length; i++)
            {
                data[i] = (byte)(i % 256);
            }

            gcHandle = GCHandle.Alloc(data, handleType);
            isHandleInitialized = true;

            if (logOperations)
            {
                Debug.Log($"GCHandle allocated successfully. Type: {handleType}");
                
                if (handleType == GCHandleType.Pinned)
                {
                    Debug.Log($"Pinned address: 0x{gcHandle.AddrOfPinnedObject().ToString("X")}");
                }
            }

            OnHandleAllocated?.Invoke();
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to allocate GCHandle: {e.Message}");
            OnHandleError?.Invoke(e);
            isHandleInitialized = false;
        }
    }

    public IntPtr GetDataPointer()
    {
        if (!isHandleInitialized || !gcHandle.IsAllocated)
            throw new InvalidOperationException("GCHandle is not allocated");

        if (handleType != GCHandleType.Pinned)
            throw new InvalidOperationException("GCHandle is not pinned. Cannot get pointer.");

        return gcHandle.AddrOfPinnedObject();
    }

    public void UpdateData(byte[] newData, int offset = 0)
    {
        if (!isHandleInitialized || data == null)
        {
            Debug.LogError("GCHandle is not initialized");
            return;
        }

        try
        {
            int copyLength = Math.Min(newData.Length, data.Length - offset);
            Array.Copy(newData, 0, data, offset, copyLength);
            
            if (logOperations)
            {
                Debug.Log($"Updated data buffer. Copied {copyLength} bytes");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error updating data: {e.Message}");
            OnHandleError?.Invoke(e);
        }
    }

    void OnDisable()
    {
        FreeGCHandle();
    }

    void OnDestroy()
    {
        FreeGCHandle();
    }

    void FreeGCHandle()
    {
        if (isHandleInitialized && gcHandle.IsAllocated)
        {
            try
            {
                gcHandle.Free();
                isHandleInitialized = false;
                data = null;

                if (logOperations)
                    Debug.Log("GCHandle freed successfully");

                OnHandleFreed?.Invoke();
            }
            catch (Exception e)
            {
                Debug.LogError($"Error freeing GCHandle: {e.Message}");
                OnHandleError?.Invoke(e);
            }
        }
    }

    public bool IsHandleAllocated => isHandleInitialized && gcHandle.IsAllocated;
}
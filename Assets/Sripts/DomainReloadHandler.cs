using System;
using UnityEngine;
using System.Collections.Generic;
using System.Runtime.InteropServices;

#if UNITY_EDITOR
using UnityEditor;
#endif

public class DomainReloadHandler : MonoBehaviour
{
    [System.Serializable]
    public class HandleInfo
    {
        public string name;
        public GCHandle handle;
        public string allocationStack;
        public DateTime allocationTime;
    }

    [Header("Domain Reload Settings")]
    public bool enableAutoCleanup = true;
    public bool logCleanupOperations = true;
    
    private static List<HandleInfo> staticHandles = new List<HandleInfo>();
    private static DomainReloadHandler instance;
    private List<GCHandle> instanceHandles = new List<GCHandle>();

    public static DomainReloadHandler Instance
    {
        get
        {
            if (instance == null)
            {
                // ЗАМЕНА: FindObjectOfType на FindAnyObjectByType
                var existing = FindAnyObjectByType<DomainReloadHandler>();
                if (existing != null)
                {
                    instance = existing;
                }
                else
                {
                    var go = new GameObject("DomainReloadHandler");
                    instance = go.AddComponent<DomainReloadHandler>();
                    DontDestroyOnLoad(go);
                }
            }
            return instance;
        }
    }

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else if (instance != this)
        {
            Destroy(gameObject);
            return;
        }

        InitializeDomainReloadHandler();
    }

    void InitializeDomainReloadHandler()
    {
        #if UNITY_EDITOR
        if (logCleanupOperations)
        {
            Debug.Log("DomainReloadHandler initialized");
        }
        #endif
    }

    #if UNITY_EDITOR
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
    static void OnDomainReload()
    {
        CleanupStaticHandles();
        ResetStaticInstance();
    }

    [InitializeOnLoadMethod]
    static void OnEditorLoad()
    {
        AssemblyReloadEvents.beforeAssemblyReload += OnBeforeAssemblyReload;
        AssemblyReloadEvents.afterAssemblyReload += OnAfterAssemblyReload;
        EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
    }

    static void OnBeforeAssemblyReload()
    {
        if (Instance.enableAutoCleanup)
        {
            CleanupStaticHandles();
        }
    }

    static void OnAfterAssemblyReload()
    {
        if (Instance.logCleanupOperations)
        {
            Debug.Log("Assembly reload completed");
        }
    }

    static void OnPlayModeStateChanged(PlayModeStateChange state)
    {
        if (state == PlayModeStateChange.ExitingPlayMode)
        {
            CleanupStaticHandles();
        }
    }
    #endif

    static void CleanupStaticHandles()
    {
        int freedCount = 0;
        
        foreach (var handleInfo in staticHandles)
        {
            if (handleInfo.handle.IsAllocated)
            {
                try
                {
                    handleInfo.handle.Free();
                    freedCount++;
                    
                    #if UNITY_EDITOR
                    if (Instance.logCleanupOperations)
                    {
                        Debug.Log($"Freed static GCHandle: {handleInfo.name}");
                    }
                    #endif
                }
                catch (Exception e)
                {
                    Debug.LogError($"Error freeing static GCHandle '{handleInfo.name}': {e.Message}");
                }
            }
        }
        
        staticHandles.Clear();
        
        #if UNITY_EDITOR
        if (Instance.logCleanupOperations && freedCount > 0)
        {
            Debug.Log($"Domain reload: Freed {freedCount} static GCHandles");
        }
        #endif
    }

    static void ResetStaticInstance()
    {
        instance = null;
    }

    public static void RegisterStaticHandle(GCHandle handle, string handleName = "Unnamed")
    {
        var handleInfo = new HandleInfo
        {
            name = handleName,
            handle = handle,
            allocationTime = DateTime.Now
        };

        #if UNITY_EDITOR || DEBUG
        handleInfo.allocationStack = Environment.StackTrace;
        #endif

        staticHandles.Add(handleInfo);
        
        #if UNITY_EDITOR
        if (Instance.logCleanupOperations)
        {
            Debug.Log($"Registered static GCHandle: {handleName}");
        }
        #endif
    }

    public static void UnregisterStaticHandle(GCHandle handle)
    {
        int removed = staticHandles.RemoveAll(info => info.handle.Equals(handle));
        
        #if UNITY_EDITOR
        if (removed > 0 && Instance.logCleanupOperations)
        {
            Debug.Log("Unregistered static GCHandle");
        }
        #endif
    }

    public void RegisterInstanceHandle(GCHandle handle, string handleName = "Unnamed")
    {
        instanceHandles.Add(handle);
        
        #if UNITY_EDITOR
        if (logCleanupOperations)
        {
            Debug.Log($"Registered instance GCHandle: {handleName}");
        }
        #endif
    }

    public void UnregisterInstanceHandle(GCHandle handle)
    {
        instanceHandles.Remove(handle);
    }

    void CleanupInstanceHandles()
    {
        int freedCount = 0;
        
        foreach (var handle in instanceHandles)
        {
            if (handle.IsAllocated)
            {
                try
                {
                    handle.Free();
                    freedCount++;
                }
                catch (Exception e)
                {
                    Debug.LogError($"Error freeing instance GCHandle: {e.Message}");
                }
            }
        }
        
        instanceHandles.Clear();
        
        #if UNITY_EDITOR
        if (logCleanupOperations && freedCount > 0)
        {
            Debug.Log($"Freed {freedCount} instance GCHandles");
        }
        #endif
    }

    void OnDestroy()
    {
        CleanupInstanceHandles();
        
        #if UNITY_EDITOR
        AssemblyReloadEvents.beforeAssemblyReload -= OnBeforeAssemblyReload;
        AssemblyReloadEvents.afterAssemblyReload -= OnAfterAssemblyReload;
        EditorApplication.playModeStateChanged -= OnPlayModeStateChanged;
        #endif
    }

    void OnApplicationQuit()
    {
        CleanupInstanceHandles();
        
        if (enableAutoCleanup)
        {
            CleanupStaticHandles();
        }
    }

    #if UNITY_EDITOR
    [ContextMenu("Log Active Handles")]
    void LogActiveHandles()
    {
        Debug.Log($"=== Active GCHandles ===");
        Debug.Log($"Static handles: {staticHandles.Count}");
        Debug.Log($"Instance handles: {instanceHandles.Count}");
        
        foreach (var handleInfo in staticHandles)
        {
            Debug.Log($"Static: {handleInfo.name} - Allocated: {handleInfo.handle.IsAllocated} - Time: {handleInfo.allocationTime}");
        }
    }

    [ContextMenu("Force Cleanup")]
    void ForceCleanup()
    {
        CleanupStaticHandles();
        CleanupInstanceHandles();
        Debug.Log("Forced cleanup completed");
    }
    #endif
}

public static class GCHandleExtensions
{
    public static void RegisterWithDomainHandler(this GCHandle handle, string name = "Unnamed", bool isStatic = false)
    {
        if (isStatic)
        {
            DomainReloadHandler.RegisterStaticHandle(handle, name);
        }
        else
        {
            DomainReloadHandler.Instance.RegisterInstanceHandle(handle, name);
        }
    }

    public static void UnregisterFromDomainHandler(this GCHandle handle, bool isStatic = false)
    {
        if (isStatic)
        {
            DomainReloadHandler.UnregisterStaticHandle(handle);
        }
        else
        {
            DomainReloadHandler.Instance.UnregisterInstanceHandle(handle);
        }
    }
}
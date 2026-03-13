using System;
using UnityEngine;
using System.Runtime.InteropServices;

public class SafeGCHandle : IDisposable
{
    private GCHandle handle;
    private bool isDisposed = false;
    private string allocationStack;
    private GCHandleType handleType; // Сохраняем тип отдельно

    public SafeGCHandle(object target, GCHandleType handleType = GCHandleType.Normal)
    {
        if (target == null)
            throw new ArgumentNullException(nameof(target));
            
        this.handleType = handleType; // Сохраняем тип
        handle = GCHandle.Alloc(target, handleType);
        
        #if UNITY_EDITOR || DEBUG
        allocationStack = Environment.StackTrace;
        #endif
    }

    public IntPtr AddrOfPinnedObject()
    {
        if (isDisposed)
            throw new ObjectDisposedException("SafeGCHandle");
        
        // Вместо проверки handle.Type используем сохраненный handleType
        if (handleType != GCHandleType.Pinned)
            throw new InvalidOperationException("GCHandle is not pinned. Use GCHandleType.Pinned for pinning.");
            
        return handle.AddrOfPinnedObject();
    }

    public object Target
    {
        get
        {
            if (isDisposed)
                throw new ObjectDisposedException("SafeGCHandle");
                
            return handle.Target;
        }
    }

    public bool IsAllocated => !isDisposed && handle.IsAllocated;
    
    // Возвращаем сохраненный тип вместо handle.Type
    public GCHandleType HandleType => handleType;

    public static SafeGCHandle Alloc(object target, GCHandleType handleType = GCHandleType.Normal)
    {
        return new SafeGCHandle(target, handleType);
    }

    public static SafeGCHandle Pin(object target)
    {
        return new SafeGCHandle(target, GCHandleType.Pinned);
    }

    public void Free()
    {
        Dispose();
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!isDisposed)
        {
            if (handle.IsAllocated)
            {
                handle.Free();
            }
            isDisposed = true;
        }
    }

    ~SafeGCHandle()
    {
        Dispose(false);
        
        #if UNITY_EDITOR || DEBUG
        if (!isDisposed)
        {
            Debug.LogWarning($"SafeGCHandle was not disposed properly. Allocation stack:\n{allocationStack}");
        }
        #endif
    }

    public override string ToString()
    {
        if (isDisposed)
            return "SafeGCHandle [Disposed]";
            
        return $"SafeGCHandle [Type: {handleType}, Target: {handle.Target?.GetType().Name ?? "null"}]";
    }
}
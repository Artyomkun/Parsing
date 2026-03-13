using System;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.Rendering;

namespace UnityEngine.XR.iOS
{
    public class UnityRemoteVideo : MonoBehaviour
    {
        public ConnectToEditor connectToEditor;

        private UnityARSessionNativeInterface m_Session;
        private bool bTexturesInitialized;

        private int currentFrameIndex;
        private byte[] m_textureYBytes;
        private byte[] m_textureUVBytes;
        private byte[] m_textureYBytes2;
        private byte[] m_textureUVBytes2;
        private GCHandle m_pinnedYArray;
        private GCHandle m_pinnedUVArray;

        #if !UNITY_EDITOR
        public void Start()
        {
            m_Session = UnityARSessionNativeInterface.GetARSessionNativeInterface();
            UnityARSessionNativeInterface.ARFrameUpdatedEvent += UpdateCamera;
            currentFrameIndex = 0;
            bTexturesInitialized = false;
        }

        void UpdateCamera(UnityARCamera camera)
        {
            if (!bTexturesInitialized)
            {
                InitializeTextures(camera);
            }
            // Можно оставить или отключить, если не нужно
            // UnityARSessionNativeInterface.ARFrameUpdatedEvent -= UpdateCamera;
        }

        void InitializeTextures(UnityARCamera camera)
        {
            int width = camera.videoParams.yWidth;
            int height = camera.videoParams.yHeight;
            int numYBytes = width * height;
            int numUVBytes = width * height / 2; // quarter resolution, два байта на пиксель

            m_textureYBytes = new byte[numYBytes];
            m_textureUVBytes = new byte[numUVBytes];
            m_textureYBytes2 = new byte[numYBytes];
            m_textureUVBytes2 = new byte[numUVBytes];

            // Предварительное закрепление массивов
            m_pinnedYArray = GCHandle.Alloc(m_textureYBytes, GCHandleType.Pinned);
            m_pinnedUVArray = GCHandle.Alloc(m_textureUVBytes, GCHandleType.Pinned);

            bTexturesInitialized = true;
        }

        IntPtr PinByteArray(ref GCHandle handle, byte[] array)
        {
            if (handle.IsAllocated)
                handle.Free();

            handle = GCHandle.Alloc(array, GCHandleType.Pinned);
            return handle.AddrOfPinnedObject();
        }

        byte[] ByteArrayForFrame(int frame, byte[] array0, byte[] array1)
        {
            return frame == 1 ? array1 : array0;
        }

        byte[] YByteArrayForFrame(int frame)
        {
            return ByteArrayForFrame(frame, m_textureYBytes, m_textureYBytes2);
        }

        byte[] UVByteArrayForFrame(int frame)
        {
            return ByteArrayForFrame(frame, m_textureUVBytes, m_textureUVBytes2);
        }

        void OnDestroy()
        {
            if (m_Session != null)
            {
                m_Session.SetCapturePixelData(false, IntPtr.Zero, IntPtr.Zero);
            }
            if (m_pinnedYArray.IsAllocated)
                m_pinnedYArray.Free();
            if (m_pinnedUVArray.IsAllocated)
                m_pinnedUVArray.Free();
        }

        public void OnPreRender()
        {
            if (m_Session == null)
                return;

            ARTextureHandles handles = m_Session.GetARVideoTextureHandles();
            if (handles.textureY == IntPtr.Zero || handles.textureCbCr == IntPtr.Zero)
                return;

            if (!bTexturesInitialized)
                return;

            currentFrameIndex = (currentFrameIndex + 1) % 2;

            IntPtr yPtr = PinByteArray(ref m_pinnedYArray, YByteArrayForFrame(currentFrameIndex));
            IntPtr uvPtr = PinByteArray(ref m_pinnedUVArray, UVByteArrayForFrame(currentFrameIndex));

            m_Session.SetCapturePixelData(true, yPtr, uvPtr);

            // Отправляем в редактор
            connectToEditor.SendToEditor(ConnectionMessageIds.screenCaptureYMsgId, YByteArrayForFrame(1 - currentFrameIndex));
            connectToEditor.SendToEditor(ConnectionMessageIds.screenCaptureUVMsgId, UVByteArrayForFrame(1 - currentFrameIndex));
        }
        #endif
    }
}
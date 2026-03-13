using UnityEngine;
using UnityEngine.Networking.PlayerConnection;
using System;
using Utils;

#pragma warning disable IDE0130 // Namespace does not match folder structure

namespace UnityEngine.XR.iOS
#pragma warning restore IDE0130 // Namespace does not match folder structure

{
    public class ConnectToEditor : MonoBehaviour
    {
        PlayerConnection playerConnection;
        // Замените на актуальные API, если используете ARFoundation
        // Тут пример с UnityARSessionNativeInterface, если он есть
        // В противном случае используйте ARFoundation
        UnityARSessionNativeInterface m_session;
        int editorID;

        void Start()
        {
            Debug.Log("Starting ConnectToEditor");
            editorID = -1;

            playerConnection = PlayerConnection.instance;
            if (playerConnection != null)
            {
                playerConnection.RegisterConnection(EditorConnected);
                playerConnection.RegisterDisconnection(EditorDisconnected);
                playerConnection.Register(ConnectionMessageIds.FromEditorARKitSessionMsgId, HandleEditorMessage);
            }
            else
            {
                Debug.LogWarning("PlayerConnection instance is null");
            }

            m_session = null;
        }

        void OnDestroy()
        {
            // Отписка при уничтожении объекта
            if (playerConnection != null)
            {
                playerConnection.UnregisterConnection(EditorConnected);
                playerConnection.UnregisterDisconnection(EditorDisconnected);
                playerConnection.Unregister(ConnectionMessageIds.FromEditorARKitSessionMsgId, HandleEditorMessage);
            }

            // Отписка от AR событий, если используете ARFoundation или UnityARSession
            UnityARSessionNativeInterface.ARFrameUpdatedEvent -= ARFrameUpdated;
            UnityARSessionNativeInterface.ARAnchorAddedEvent -= ARAnchorAdded;
            UnityARSessionNativeInterface.ARAnchorUpdatedEvent -= ARAnchorUpdated;
            UnityARSessionNativeInterface.ARAnchorRemovedEvent -= ARAnchorRemoved;
        }

        void OnGUI()
        {
            if (m_session == null)
            {
                GUI.Box(new Rect((Screen.width / 2) - 200, Screen.height / 2, 400, 50), "Waiting for editor connection...");
            }
        }

        void HandleEditorMessage(MessageEventArgs mea)
        {
            try
            {
                var sfem = mea.data.Deserialize<serializableFromEditorMessage>();
                if (sfem != null && sfem.subMessageId == SubMessageIds.EditorInitARKit)
                {
                    InitializeARKit(sfem.arkitConfigMsg);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Error deserializing message: {ex}");
            }
        }

        void InitializeARKit(serializableARKitInit sai)
        {
            // В новых версиях Unity рекомендуется использовать ARFoundation
            // Но если у вас есть UnityARSessionNativeInterface, используйте его
            #if !UNITY_EDITOR
            Application.targetFrameRate = 60;
            m_session = UnityARSessionNativeInterface.GetARSessionNativeInterface();
            var config = sai.config;
            var runOptions = sai.runOption;
            m_session.RunWithConfigAndOptions(config, runOptions);

            // Подписки на события AR
            UnityARSessionNativeInterface.ARFrameUpdatedEvent += ARFrameUpdated;
            UnityARSessionNativeInterface.ARAnchorAddedEvent += ARAnchorAdded;
            UnityARSessionNativeInterface.ARAnchorUpdatedEvent += ARAnchorUpdated;
            UnityARSessionNativeInterface.ARAnchorRemovedEvent += ARAnchorRemoved;
            #endif
        }

        public static void ARFrameUpdated(UnityARCamera camera)
        {
            var serARCamera = camera; // сериализация при необходимости
            SendToEditor(ConnectionMessageIds.UpdateCameraFrameMsgId, serARCamera);
        }

        public static void ARAnchorAdded(ARPlaneAnchor planeAnchor)
        {
            var serPlaneAnchor = planeAnchor;
            SendToEditor(ConnectionMessageIds.AddPlaneAnchorMsgeId, serPlaneAnchor);
        }

        public static void ARAnchorUpdated(ARPlaneAnchor planeAnchor)
        {
            var serPlaneAnchor = planeAnchor;
            SendToEditor(ConnectionMessageIds.UpdatePlaneAnchorMsgeId, serPlaneAnchor);
        }

        public static void ARAnchorRemoved(ARPlaneAnchor planeAnchor)
        {
            var serPlaneAnchor = planeAnchor;
            SendToEditor(ConnectionMessageIds.RemovePlaneAnchorMsgeId, serPlaneAnchor);
        }

        void EditorConnected(int playerID)
        {
            Debug.Log("Editor connected");
            editorID = playerID;
        }

        void EditorDisconnected(int playerID)
        {
            if (editorID == playerID)
            {
                editorID = -1;
            }

            DisconnectFromEditor();

            #if !UNITY_EDITOR
            if (m_session != null)
            {
                m_session.Pause();
                m_session = null;
            }
            #endif
        }

        public static void SendToEditor(Guid msgId, object serializableObject)
        {
            try
            {
                byte[] arrayToSend = serializableObject.SerializeToByteArray();
                SendToEditor(msgId, arrayToSend);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Error serializing object: {ex}");
            }
        }

        public void SendToEditor(Guid msgId, byte[] data)
        {
            if (playerConnection != null && playerConnection.isConnected)
            {
                playerConnection.Send(msgId, data);
            }
        }

        public void DisconnectFromEditor()
        {
            playerConnection?.DisconnectAll();
        }
    }
}
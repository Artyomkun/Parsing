#if UNITY_EDITOR
using UnityEngine;
using UnityEngine.Networking.PlayerConnection;
using System.Text;
using Utils; 

namespace UnityEngine.XR.iOS
{
    public class ARKitRemoteConnection : MonoBehaviour
    {
        [Header("AR Config Options")]
        public UnityARAlignment startAlignment = UnityARAlignment.UnityARAlignmentGravity;
        public UnityARPlaneDetection planeDetection = UnityARPlaneDetection.Horizontal;
        public bool getPointCloud = true;
        public bool enableLightEstimation = true;

        [Header("Run Options")]
        public bool resetTracking = true;
        public bool removeExistingAnchors = true;

        private UnityEditor.Networking.PlayerConnection.EditorConnection editorConnection;
        private int currentPlayerID = -1;
        private string guimessage = "none";

        private Texture2D remoteScreenYTex;
        private Texture2D remoteScreenUVTex;

        private bool bTexturesInitialized;

        void Start()
        {
            bTexturesInitialized = false;

            editorConnection = UnityEditor.Networking.PlayerConnection.EditorConnection.instance;
            if (editorConnection != null)
            {
                editorConnection.Initialize();
                editorConnection.RegisterConnection(PlayerConnected);
                editorConnection.RegisterDisconnection(PlayerDisconnected);
                editorConnection.Register(ConnectionMessageIds.UpdateCameraFrameMsgId, UpdateCameraFrame);
                editorConnection.Register(ConnectionMessageIds.AddPlaneAnchorMsgeId, AddPlaneAnchor);
                editorConnection.Register(ConnectionMessageIds.UpdatePlaneAnchorMsgeId, UpdatePlaneAnchor);
                editorConnection.Register(ConnectionMessageIds.RemovePlaneAnchorMsgeId, RemovePlaneAnchor);
                editorConnection.Register(ConnectionMessageIds.screenCaptureYMsgId, ReceiveRemoteScreenYTex);
                editorConnection.Register(ConnectionMessageIds.screenCaptureUVMsgId, ReceiveRemoteScreenUVTex);
            }
            else
            {
                Debug.LogWarning("EditorConnection is null");
            }
        }

        void PlayerConnected(int playerID)
        {
            currentPlayerID = playerID;
            Debug.Log("Player connected: " + playerID);
        }

        void PlayerDisconnected(int playerID)
        {
            if (currentPlayerID == playerID)
            {
                currentPlayerID = -1;
                Debug.Log("Player disconnected: " + playerID);
            }
        }

        void OnGUI()
        {
            if (!bTexturesInitialized)
            {
                if (currentPlayerID != -1)
                {
                    guimessage = "Connected to ARKit Remote device : " + currentPlayerID.ToString();

                    if (GUI.Button(new Rect((Screen.width / 2) - 200, (Screen.height / 2) - 200, 400, 100), "Start Remote ARKit Session"))
                    {
                        SendInitToPlayer();
                    }
                }
                else
                {
                    guimessage = "Please connect to player in the console menu";
                }

                GUI.Box(new Rect((Screen.width / 2) - 200, (Screen.height / 2) + 100, 400, 50), guimessage);
            }
        }

        void OnDestroy()
        {
            #if UNITY_2017_1_OR_NEWER
            if (editorConnection != null)
            {
                editorConnection.DisconnectAll();
            }
            #endif
        }

        void InitializeTextures(UnityARCamera camera)
        {
            int yWidth = camera.videoParams.yWidth;
            int yHeight = camera.videoParams.yHeight;
            int uvWidth = yWidth / 2;
            int uvHeight = yHeight / 2;

            if (remoteScreenYTex == null || remoteScreenYTex.width != yWidth || remoteScreenYTex.height != yHeight)
            {
                if (remoteScreenYTex != null)
                {
                    Destroy(remoteScreenYTex);
                }
                remoteScreenYTex = new Texture2D(yWidth, yHeight, TextureFormat.R8, false, true);
            }

            if (remoteScreenUVTex == null || remoteScreenUVTex.width != uvWidth || remoteScreenUVTex.height != uvHeight)
            {
                if (remoteScreenUVTex != null)
                {
                    Destroy(remoteScreenUVTex);
                }
                remoteScreenUVTex = new Texture2D(uvWidth, uvHeight, TextureFormat.RG16, false, true);
            }

            bTexturesInitialized = true;
        }

        void UpdateCameraFrame(MessageEventArgs mea)
        {
            if (mea.data == null || mea.data.Length == 0)
                return;

            var serCamera = mea.data.Deserialize<SerializableUnityARCamera>();
            if (serCamera == null)
                return;

            UnityARCamera scamera = serCamera;

            InitializeTextures(scamera);

            // Проверка на null у UnityARSessionNativeInterface
            var sessionInterface = UnityARSessionNativeInterface.GetARSessionNativeInterface();
            if (sessionInterface != null)
            {
                UnityARSessionNativeInterface.SetStaticCamera(scamera);
                UnityARSessionNativeInterface.RunFrameUpdateCallbacks();

            }
        }

        void AddPlaneAnchor(MessageEventArgs mea)
        {
            if (mea.data == null || mea.data.Length == 0)
                return;

            var serPlaneAnchor = mea.data.Deserialize<SerializableUnityARPlaneAnchor>();
            if (serPlaneAnchor == null)
                return;

            ARPlaneAnchor arPlaneAnchor = serPlaneAnchor;

            var sessionInterface = UnityARSessionNativeInterface.GetARSessionNativeInterface();
            if (sessionInterface != null)
            {
                UnityARSessionNativeInterface.RunAddAnchorCallbacks(arPlaneAnchor);

            }
        }

        void UpdatePlaneAnchor(MessageEventArgs mea)
        {
            if (mea.data == null || mea.data.Length == 0)
                return;

            var serPlaneAnchor = mea.data.Deserialize<SerializableUnityARPlaneAnchor>();
            if (serPlaneAnchor == null)
                return;

            ARPlaneAnchor arPlaneAnchor = serPlaneAnchor;

            var sessionInterface = UnityARSessionNativeInterface.GetARSessionNativeInterface();
            if (sessionInterface != null)
            {
                UnityARSessionNativeInterface.RunUpdateAnchorCallbacks(arPlaneAnchor);

            }
        }

        void RemovePlaneAnchor(MessageEventArgs mea)
        {
            if (mea.data == null || mea.data.Length == 0)
                return;

            var serPlaneAnchor = mea.data.Deserialize<SerializableUnityARPlaneAnchor>();
            if (serPlaneAnchor == null)
                return;

            ARPlaneAnchor arPlaneAnchor = serPlaneAnchor;

            var sessionInterface = UnityARSessionNativeInterface.GetARSessionNativeInterface();
            if (sessionInterface != null)
            {
                UnityARSessionNativeInterface.RunRemoveAnchorCallbacks(arPlaneAnchor);
            }
        }

        void ReceiveRemoteScreenYTex(MessageEventArgs mea)
        {
            if (!bTexturesInitialized || mea.data == null || mea.data.Length == 0)
                return;

            remoteScreenYTex.LoadRawTextureData(mea.data);
            remoteScreenYTex.Apply();

            var arVideo = Camera.main?.GetComponent<UnityARVideo>();
            if (arVideo != null)
            {
                arVideo.SetYTexure(remoteScreenYTex);
            }
        }

        void ReceiveRemoteScreenUVTex(MessageEventArgs mea)
        {
            if (!bTexturesInitialized || mea.data == null || mea.data.Length == 0)
                return;

            remoteScreenUVTex.LoadRawTextureData(mea.data);
            remoteScreenUVTex.Apply();

            var arVideo = Camera.main?.GetComponent<UnityARVideo>();
            if (arVideo != null)
            {
                arVideo.SetUVTexure(remoteScreenUVTex);
            }
        }

        void SendInitToPlayer()
        {
            var sfem = new serializableFromEditorMessage
            {
                subMessageId = SubMessageIds.EditorInitARKit,
                arkitConfigMsg = new serializableARKitInit(
                    new SerializableARSessionConfiguration(startAlignment, planeDetection, getPointCloud, enableLightEstimation),
                    (resetTracking ? UnityARSessionRunOption.ARSessionRunOptionResetTracking : 0) |
                                              (removeExistingAnchors ? UnityARSessionRunOption.ARSessionRunOptionRemoveExistingAnchors : 0)
                )
            };
            SendToPlayer(ConnectionMessageIds.FromEditorARKitSessionMsgId, sfem);
        }

        void SendToPlayer(System.Guid msgId, byte[] data)
        {
            if (editorConnection != null)
            {
                editorConnection.Send(msgId, data);
            }
        }

        public void SendToPlayer(System.Guid msgId, object serializableObject)
        {
            if (serializableObject == null)
                return;

            byte[] arrayToSend = serializableObject.SerializeToByteArray();
            SendToPlayer(msgId, arrayToSend);
        }

        // Обновление - по необходимости
        private float timeSinceLastUpdate = 0f;
		public float updateInterval = 5f; // интервал в секундах

		void Update()
		{
			// Обновление таймера
			timeSinceLastUpdate += Time.deltaTime;

			// Периодическая отправка
			if (timeSinceLastUpdate >= updateInterval)
			{
				SendInitToPlayer(); // или другое действие
				timeSinceLastUpdate = 0f;
				Debug.Log("Периодическая отправка данных");
			}

			// Проверка состояния соединения
			if (editorConnection != null && currentPlayerID == -1)
			{
				Debug.Log("Нет подключенного игрока");
			}

			// Обработка пользовательских команд
			if (Input.GetKeyDown(KeyCode.R))
			{
				SendInitToPlayer();
				Debug.Log("Повторная отправка инициализации");
			}
		}
    }
}
#endif
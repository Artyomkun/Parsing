using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;
using System.Collections.Generic;

public class VR_Earth_Globe : MonoBehaviour
{
    [Header("Globe Settings")]
    public float globeRadius = 5f;
    public Texture2D worldTexture;
    public Material globeMaterial;
    public bool enableAtmosphere = true;
    public Color atmosphereColor = new Color(0.3f, 0.5f, 1f, 0.3f);
    
    [Header("VR Interaction Settings")]
    public float rotationSpeed = 2f;
    public float zoomSpeed = 0.1f;
    public float minScale = 2f;
    public float maxScale = 20f;

    [Header("Data Points")]
    [System.Obsolete]
    public List<GlobeDataPoint> dataPoints = new List<GlobeDataPoint>();
    public GameObject markerPrefab;

    [Header("VR References")]
    [System.Obsolete]
    public XRBaseController rightController;
    [System.Obsolete]
    public XRBaseController leftController;

    private GameObject globeSphere;
    private GameObject atmosphere;
    private UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable grabInteractable;
    private Vector3 lastRightPos;
    private Vector3 lastLeftPos;
    [System.Obsolete]
    private bool isZooming;
    private List<GameObject> activeMarkers = new List<GameObject>();
    private float originalGlobeRadius;
    private bool isGrabbed;
    [System.Obsolete]
    public global::System.Boolean IsZooming { get => isZooming; set => isZooming = value; }

    [System.Serializable]
    [System.Obsolete]
    public class GlobeDataPoint
    {
        public string name;
        public float latitude;
        public float longitude;
        public string description;
        public Color markerColor = Color.red;
        public float markerSize = 0.1f;
    }
    [System.Obsolete]
    void Start()
    {
        Debug.Log("Initializing VR Earth Globe...");
        
        try
        {
            originalGlobeRadius = globeRadius;
            
            // Порядок важен!
            CreateGlobe();
            
            if (globeSphere != null)
            {
                SetupVRInteractions();
                CreateDataMarkers();
                InitializeControllerPositions();
                Debug.Log("VR Earth Globe initialized successfully!");
            }
            else
            {
                Debug.LogError("Failed to create globe sphere!");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error during initialization: {e.Message}");
        }
    }
    [System.Obsolete]
    void Update()
    {
        if (isGrabbed)
        {
            HandleRotation();
            HandleZoom();
        }
    }
    [System.Obsolete]
    void CreateGlobe()
    {
        try
        {
            // Create main globe sphere
            globeSphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            if (globeSphere == null)
            {
                Debug.LogError("Failed to create sphere primitive!");
                return;
            }
            
            globeSphere.name = "VR_Earth_Globe";
            globeSphere.transform.SetParent(transform);
            globeSphere.transform.localPosition = Vector3.zero;
            globeSphere.transform.localScale = Vector3.one * globeRadius;

            // Setup material
            Renderer renderer = globeSphere.GetComponent<Renderer>();
            if (renderer == null)
            {
                Debug.LogError("No renderer found on globe sphere!");
                return;
            }

            if (globeMaterial == null)
            {
                globeMaterial = new Material(Shader.Find("Standard"));
                Debug.Log("Created default material");
            }
            
            if (worldTexture != null)
            {
                globeMaterial.mainTexture = worldTexture;
            }
            
            renderer.material = globeMaterial;

            // Add Rigidbody for physics
            Rigidbody rb = globeSphere.AddComponent<Rigidbody>();
            rb.isKinematic = false;
            rb.useGravity = false;
            rb.linearDamping = 2f;
            rb.angularDamping = 2f;

            // Add collider if missing
            if (globeSphere.GetComponent<Collider>() == null)
                globeSphere.AddComponent<SphereCollider>();

            // Add atmosphere
            if (enableAtmosphere)
            {
                CreateAtmosphere();
            }

            Debug.Log("Globe created successfully");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error creating globe: {e.Message}");
        }
    }
    [System.Obsolete]
    void CreateAtmosphere()
    {
        try
        {
            atmosphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            atmosphere.name = "Atmosphere";
            atmosphere.transform.SetParent(globeSphere.transform);
            atmosphere.transform.localScale = Vector3.one * 1.1f;
            atmosphere.transform.localPosition = Vector3.zero;

            Renderer atmRenderer = atmosphere.GetComponent<Renderer>();
            Material atmMaterial = new Material(Shader.Find("Standard"));
            atmMaterial.color = atmosphereColor;
            atmMaterial.renderQueue = 3000;
            atmRenderer.material = atmMaterial;
            
            // Remove collider from atmosphere
            Collider atmCollider = atmosphere.GetComponent<Collider>();
            if (atmCollider != null)
                DestroyImmediate(atmCollider);
                
            Debug.Log("Atmosphere created successfully");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error creating atmosphere: {e.Message}");
        }
    }
    [System.Obsolete]
    void SetupVRInteractions()
    {
        try
        {
            if (globeSphere == null)
            {
                Debug.LogError("Cannot setup VR interactions - globeSphere is null!");
                return;
            }

            // Add grab functionality
            grabInteractable = globeSphere.GetComponent<UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable>();
            if (grabInteractable == null)
            {
                grabInteractable = globeSphere.AddComponent<UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable>();
                Debug.Log("Added XRGrabInteractable component");
            }

            grabInteractable.movementType = UnityEngine.XR.Interaction.Toolkit.Interactables.XRBaseInteractable.MovementType.Instantaneous;
            grabInteractable.throwOnDetach = false;
            grabInteractable.trackRotation = false;
            
            // Add grab events with null checking
            grabInteractable.onSelectEntered.AddListener(OnGlobeGrabbed);
            grabInteractable.onSelectExited.AddListener(OnGlobeReleased);
            
            Debug.Log("VR interactions setup completed");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error setting up VR interactions: {e.Message}");
        }
    }
    [System.Obsolete]
    void OnGlobeGrabbed(UnityEngine.XR.Interaction.Toolkit.Interactors.XRBaseInteractor interactor)
    {
        Debug.Log("Globe grabbed");
        isGrabbed = true;
        
        InitializeControllerPositions();
        
        // Haptic feedback
        if (rightController != null)
            rightController.SendHapticImpulse(0.3f, 0.1f);
    }
    [System.Obsolete]
    void OnGlobeReleased(UnityEngine.XR.Interaction.Toolkit.Interactors.XRBaseInteractor interactor)
    {
        Debug.Log("Globe released");
        isGrabbed = false;
        isZooming = false;
    }
    [System.Obsolete]
    void InitializeControllerPositions()
    {
        if (rightController != null)
            lastRightPos = rightController.transform.position;
        if (leftController != null)
            lastLeftPos = leftController.transform.position;
    }
    [System.Obsolete]
    void HandleRotation()
    {
        if (rightController != null && IsControllerSelecting(rightController))
        {
            Vector3 currentPos = rightController.transform.position;
            Vector3 delta = currentPos - lastRightPos;

            float distance = Vector3.Distance(currentPos, globeSphere.transform.position);
            float sensitivity = Mathf.Clamp(distance / globeRadius, 0.5f, 2f);

            float rotationY = -delta.x * rotationSpeed * sensitivity;
            float rotationX = delta.y * rotationSpeed * sensitivity;
            
            globeSphere.transform.Rotate(Vector3.up, rotationY, Space.World);
            globeSphere.transform.Rotate(Vector3.right, rotationX, Space.World);

            lastRightPos = currentPos;
        }
    }
    [System.Obsolete]
    void HandleZoom()
    {
        if (rightController != null && leftController != null &&
            IsControllerSelecting(rightController) && IsControllerSelecting(leftController))
        {
            float currentDistance = Vector3.Distance(rightController.transform.position, leftController.transform.position);
            float previousDistance = Vector3.Distance(lastRightPos, lastLeftPos);
            
            if (previousDistance > 0)
            {
                float zoomFactor = (currentDistance - previousDistance) * zoomSpeed;
                globeRadius = Mathf.Clamp(globeRadius + zoomFactor, minScale, maxScale);
                
                globeSphere.transform.localScale = Vector3.one * globeRadius;
                isZooming = true;
                
                UpdateMarkersScale();
            }

            lastRightPos = rightController.transform.position;
            lastLeftPos = leftController.transform.position;
        }
        else
        {
            isZooming = false;
        }
    }
    [System.Obsolete]
    bool IsControllerSelecting(XRBaseController controller)
    {
        return controller != null && controller.enableInputActions;
    }
    [System.Obsolete]
    void CreateDataMarkers()
    {
        try
        {
            ClearAllMarkers();
            
            foreach (var dataPoint in dataPoints)
            {
                AddDataPoint(dataPoint.latitude, dataPoint.longitude, dataPoint.name, 
                            dataPoint.description, dataPoint.markerColor, dataPoint.markerSize);
            }
            Debug.Log($"Created {dataPoints.Count} data markers");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error creating data markers: {e.Message}");
        }
    }
    [System.Obsolete]
    public void AddDataPoint(float lat, float lon, string pointName, string info, Color color, float size = 0.1f)
    {
        try
        {
            if (globeSphere == null)
            {
                Debug.LogError("Cannot add data point - globeSphere is null!");
                return;
            }

            Vector3 worldPos = GeoToWorldPosition(lat, lon, globeRadius);

            GameObject marker;
            if (markerPrefab != null)
            {
                marker = Instantiate(markerPrefab, globeSphere.transform);
            }
            else
            {
                marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                marker.transform.localScale = Vector3.one * size;
                Renderer renderer = marker.GetComponent<Renderer>();
                if (renderer != null)
                {
                    renderer.material = new Material(Shader.Find("Standard"));
                    renderer.material.color = color;
                }
            }

            marker.name = pointName + "_Marker";
            marker.transform.position = globeSphere.transform.position + worldPos;
            marker.transform.SetParent(globeSphere.transform);
            marker.transform.LookAt(globeSphere.transform.position * 2 - marker.transform.position);

            // Add interactivity
            var interactable = marker.AddComponent<UnityEngine.XR.Interaction.Toolkit.Interactables.XRSimpleInteractable>();
            interactable.onHoverEntered.AddListener(OnMarkerHover);
            interactable.onHoverExited.AddListener(OnMarkerHoverExit);
            interactable.onSelectEntered.AddListener(OnMarkerSelect);

            activeMarkers.Add(marker);
            Debug.Log($"Added data point: {pointName}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error adding data point {pointName}: {e.Message}");
        }
    }
    [System.Obsolete]
    void OnMarkerHover(UnityEngine.XR.Interaction.Toolkit.Interactors.XRBaseInteractor interactor)
    {
        try
        {
            GameObject marker = interactor.transform.gameObject;
            string pointName = marker.name.Replace("_Marker", "");
            Debug.Log($"Hovering over: {pointName}");
            HighlightMarker(marker, true);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error in OnMarkerHover: {e.Message}");
        }
    }
    [System.Obsolete]
    void OnMarkerHoverExit(UnityEngine.XR.Interaction.Toolkit.Interactors.XRBaseInteractor interactor)
    {
        try
        {
            GameObject marker = interactor.transform.gameObject;
            HighlightMarker(marker, false);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error in OnMarkerHoverExit: {e.Message}");
        }
    }
    [System.Obsolete]
    void OnMarkerSelect(UnityEngine.XR.Interaction.Toolkit.Interactors.XRBaseInteractor interactor)
    {
        try
        {
            GameObject marker = interactor.transform.gameObject;
            string pointName = marker.name.Replace("_Marker", "");
            
            GlobeDataPoint dataPoint = GetDataPointByName(pointName);
            if (dataPoint != null)
            {
                Debug.Log($"Selected: {dataPoint.name} - {dataPoint.description}");
                ShowDataPanel(dataPoint.name, dataPoint.description);
                
                if (rightController != null)
                    rightController.SendHapticImpulse(0.5f, 0.1f);
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error in OnMarkerSelect: {e.Message}");
        }
    }
    [System.Obsolete]
    void HighlightMarker(GameObject marker, bool highlight)
    {
        try
        {
            Renderer renderer = marker.GetComponent<Renderer>();
            if (renderer != null)
            {
                if (highlight)
                {
                    renderer.material.color = Color.yellow;
                    marker.transform.localScale *= 1.2f;
                }
                else
                {
                    GlobeDataPoint dataPoint = GetDataPointByName(marker.name.Replace("_Marker", ""));
                    if (dataPoint != null)
                    {
                        renderer.material.color = dataPoint.markerColor;
                    }
                    marker.transform.localScale /= 1.2f;
                }
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error highlighting marker: {e.Message}");
        }
    }
    [System.Obsolete]
    void UpdateMarkersScale()
    {
        try
        {
            float baseScale = 0.1f * (originalGlobeRadius / globeRadius);
            
            foreach (var marker in activeMarkers)
            {
                if (marker != null)
                {
                    marker.transform.localScale = Vector3.one * baseScale;
                    
                    var dataPoint = GetDataPointByName(marker.name.Replace("_Marker", ""));
                    if (dataPoint != null)
                    {
                        Vector3 newPos = GeoToWorldPosition(dataPoint.latitude, dataPoint.longitude, globeRadius);
                        marker.transform.position = globeSphere.transform.position + newPos;
                    }
                }
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error updating markers scale: {e.Message}");
        }
    }
    [System.Obsolete]
    void ShowDataPanel(string pointName, string information)
    {
        Debug.Log($"=== {pointName} ===\n{information}");
        // Здесь можно добавить UI логику
    }

    Vector3 GeoToWorldPosition(float latitude, float longitude, float radius)
    {
        float latRad = Mathf.Deg2Rad * latitude;
        float lonRad = Mathf.Deg2Rad * -longitude;

        float x = radius * Mathf.Cos(latRad) * Mathf.Cos(lonRad);
        float z = radius * Mathf.Cos(latRad) * Mathf.Sin(lonRad);
        float y = radius * Mathf.Sin(latRad);

        return new Vector3(x, y, z);
    }
    [System.Obsolete]
    GlobeDataPoint GetDataPointByName(string name)
    {
        return dataPoints.Find(point => point.name == name);
    }

    // Public API methods
    [System.Obsolete]
    public void LoadDataPoints(List<GlobeDataPoint> newDataPoints)
    {
        dataPoints.Clear();
        dataPoints.AddRange(newDataPoints);
        CreateDataMarkers();
    }
    [System.Obsolete]
    public void ClearAllMarkers()
    {
        foreach (var marker in activeMarkers)
        {
            if (marker != null) Destroy(marker);
        }
        activeMarkers.Clear();
    }
    [System.Obsolete]
    public void ResetGlobe()
    {
        if (globeSphere != null)
        {
            globeSphere.transform.rotation = Quaternion.identity;
            globeRadius = originalGlobeRadius;
            globeSphere.transform.localScale = Vector3.one * globeRadius;
            UpdateMarkersScale();
        }
    }
    [System.Obsolete]
    public void SetGlobeVisibility(bool visible)
    {
        if (globeSphere != null)
            globeSphere.SetActive(visible);
        if (atmosphere != null)
            atmosphere.SetActive(visible);
    }
    [System.Obsolete]
    public void SetAutoRotation(bool enabled, float speed = 5f)
    {
        if (enabled && !isGrabbed && globeSphere != null)
        {
            globeSphere.transform.Rotate(0, speed * Time.deltaTime, 0);
        }
    }
    [System.Obsolete]
    void OnDestroy()
    {
        ClearAllMarkers();
        if (globeSphere != null) Destroy(globeSphere);
        if (atmosphere != null) Destroy(atmosphere);
    }
}
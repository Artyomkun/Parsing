using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.iOS;

public class FocusSquare : MonoBehaviour
{
    public enum FocusState
    {
        Initializing,
        Finding,
        Found
    }

    public GameObject findingSquare;
    public GameObject foundSquare;

    public float maxRayDistance = 30.0f;
    public LayerMask collisionLayerMask;
    public float findingSquareDist = 0.5f;

    private FocusState squareState;
    public FocusState SquareState
    {
        get { return squareState; }
        set
        {
            squareState = value;
            foundSquare.SetActive(squareState == FocusState.Found);
            findingSquare.SetActive(squareState != FocusState.Found);
        }
    }

    bool trackingInitialized = false; // Изначально false

    void Start()
    {
        SquareState = FocusState.Initializing;
        // Можно добавить проверку AR-сессии
        // Example: trackingInitialized = ARSession.IsTracking();
        // Для простоты установим сразу в true
        trackingInitialized = true;
    }

    bool HitTestWithResultType(ARPoint point, ARHitTestResultType resultTypes)
    {
        List<ARHitTestResult> hitResults = UnityARSessionNativeInterface.GetARSessionNativeInterface().HitTest(point, resultTypes);
        if (hitResults.Count > 0)
        {
            foreach (var hitResult in hitResults)
            {
                foundSquare.transform.position = UnityARMatrixOps.GetPosition(hitResult.worldTransform);
                foundSquare.transform.rotation = UnityARMatrixOps.GetRotation(hitResult.worldTransform);
                Debug.Log($"x:{foundSquare.transform.position.x:0.######} y:{foundSquare.transform.position.y:0.######} z:{foundSquare.transform.position.z:0.######}");
                return true;
            }
        }
        return false;
    }

    void Update()
    {
        if (!trackingInitialized)
        {
            // Можно добавить проверку AR-сессии
            return;
        }

        Vector3 center = new Vector3(Screen.width / 2, Screen.height / 2, findingSquareDist);

        #if UNITY_EDITOR
        Ray ray = Camera.main.ScreenPointToRay(center);
        RaycastHit hit;
        if (Physics.Raycast(ray, out hit, maxRayDistance, collisionLayerMask))
        {
            foundSquare.transform.position = hit.point;
            foundSquare.transform.rotation = hit.transform.rotation;
            Debug.Log($"x:{hit.point.x:0.######} y:{hit.point.y:0.######} z:{hit.point.z:0.######}");
            SquareState = FocusState.Found;
            return;
        }
        #else
        var screenPosition = Camera.main.ScreenToViewportPoint(center);
        ARPoint point = new ARPoint { x = screenPosition.x, y = screenPosition.y };
        ARHitTestResultType[] resultTypes = {
            ARHitTestResultType.ARHitTestResultTypeExistingPlaneUsingExtent
        };

        bool found = false;
        foreach (var resultType in resultTypes)
        {
            if (HitTestWithResultType(point, resultType))
            {
                SquareState = FocusState.Found;
                found = true;
                break;
            }
        }
        if (found) return;
        #endif

        // Если не нашли поверхность
        if (trackingInitialized)
        {
            SquareState = FocusState.Finding;

            // Проверка направления камеры
            if (Vector3.Dot(Camera.main.transform.forward, Vector3.down) > 0)
            {
                // Позиционирование квадрата
                Vector3 worldPos = Camera.main.ScreenToWorldPoint(center);
                findingSquare.transform.position = worldPos;

                Vector3 vecToCamera = worldPos - Camera.main.transform.position;
                Vector3 vecOrthogonal = Vector3.Cross(vecToCamera, Vector3.up);
                Vector3 vecForward = Vector3.Cross(vecOrthogonal, Vector3.up);

                findingSquare.transform.rotation = Quaternion.LookRotation(vecForward, Vector3.up);
                findingSquare.SetActive(true);
            }
            else
            {
                // Не показывать если камера не смотрит вниз
                findingSquare.SetActive(false);
            }
        }
    }
}
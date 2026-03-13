using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace UnityEngine.XR.iOS
{
    public class EditorHitTest : MonoBehaviour
    {
        public Transform m_HitTransform;
        public float maxRayDistance = 30.0f;
        public LayerMask collisionLayerMask;

        #if UNITY_EDITOR
        void Update()
        {
            if (Input.GetMouseButtonDown(0))
            {
                Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                RaycastHit hit;

                // Попытка попасть в коллайдеры на сцене
                if (Physics.Raycast(ray, out hit, maxRayDistance, collisionLayerMask))
                {
                    // Установка позиции по точке касания
                    m_HitTransform.position = hit.point;
                    Debug.Log($"x:{hit.point.x:0.######} y:{hit.point.y:0.######} z:{hit.point.z:0.######}");

                    // Установка ротации в соответствии с объектом коллайдера
                    m_HitTransform.rotation = hit.transform.rotation;
                }
            }
        }
        #endif
    }
}
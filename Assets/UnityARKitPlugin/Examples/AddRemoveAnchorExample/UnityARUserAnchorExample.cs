using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.iOS;

public class UnityARUserAnchorExample : MonoBehaviour
{
    public GameObject prefabObject;
    public int distanceFromCamera = 1;

    private HashSet<string> m_Clones = new HashSet<string>();
    private float m_TimeUntilRemove = 5.0f;

    void Awake()
    {
        UnityARSessionNativeInterface.ARUserAnchorAddedEvent += ExampleAddAnchor;
        UnityARSessionNativeInterface.ARUserAnchorRemovedEvent += AnchorRemoved;
    }

    public void ExampleAddAnchor(ARUserAnchor anchor)
    {
        if (!m_Clones.Contains(anchor.identifier))
        {
            Debug.Log("Anchor added with id: " + anchor.identifier);
            // Можно создать объект и связать его с якорем
            // Например, найти или создать объект, привязанный к anchor
            // или просто запомнить его
            m_Clones.Add(anchor.identifier);
        }
    }

    public void AnchorRemoved(ARUserAnchor anchor)
    {
        if (m_Clones.Contains(anchor.identifier))
        {
            m_Clones.Remove(anchor.identifier);
            Debug.Log("Anchor removed with id: " + anchor.identifier);
            // Можно найти и уничтожить объект, связанный с этим якорем
        }
    }

    void Update()
    {
        if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began)
        {
            Vector3 position = Camera.main.transform.position + (distanceFromCamera * Camera.main.transform.forward);
            GameObject clone = Instantiate(prefabObject, position, Quaternion.identity);

            // Предположим, что prefabObject содержит компонент UnityARUserAnchorComponent
            var anchorComponent = clone.GetComponent<UnityARUserAnchorComponent>();
            if (anchorComponent != null)
            {
                m_Clones.Add(anchorComponent.AnchorId);
            }
            else
            {
                Debug.LogWarning("PrefabObject не содержит UnityARUserAnchorComponent");
            }

            m_TimeUntilRemove = 4.0f;
        }

        // Удаление якорей после определенного времени
        m_TimeUntilRemove -= Time.deltaTime;
        if (m_TimeUntilRemove <= 0.0f)
        {
            if (m_Clones.Count > 0)
            {
                // Удаляем один из якорей
                string idToRemove = null;
                foreach (var id in m_Clones)
                {
                    idToRemove = id;
                    break;
                }

                if (idToRemove != null)
                {
                    Debug.Log("Removing anchor with id: " + idToRemove);
                    UnityARSessionNativeInterface.GetARSessionNativeInterface().RemoveUserAnchor(idToRemove);
                }
            }
            m_TimeUntilRemove = 4.0f;
        }
    }
}
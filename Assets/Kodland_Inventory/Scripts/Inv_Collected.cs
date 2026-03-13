using UnityEngine;

public class Inv_Collected : MonoBehaviour
{
    [SerializeField] private string itemName;
    [SerializeField] private Sprite image;
    private Inv_Inventory inventory;

    [System.Obsolete]
    private void Awake()
    {
        inventory = FindObjectOfType<Inv_Inventory>();
    }

    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player") && inventory != null)
        {
            inventory.AddItem(image, itemName, gameObject);
        }
    }
}
using UnityEngine;
using TMPro;

namespace RealLife5D.UI
{
    public class UIDimensionDisplay : MonoBehaviour
    {
        [SerializeField] TextMeshProUGUI label;
        
        public void UpdateUI(int dimension)
        {
            if (label != null)
            {
                label.text = $"Измерение: {dimension}D";
            }
        }
    }
}
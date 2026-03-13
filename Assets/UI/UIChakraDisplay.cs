using UnityEngine;
using TMPro;

namespace RealLife5D.UI
{
    public class UIChakraDisplay : MonoBehaviour
    {
        [SerializeField] TextMeshProUGUI label;
        
        public void UpdateUI(int chakraLevel, string _)
        {
            if (label != null)
            {
                label.text = $"Чакра: Уровень {chakraLevel}";
            }
        }
    }
}
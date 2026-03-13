using UnityEngine;
using TMPro;
using UnityEngine.UI;

namespace RealLife5D.UI
{
    public class UIWorldDisplay : MonoBehaviour
    {
        [Header("UI Elements")]
        public TextMeshProUGUI worldText;
        public Slider worldProgress;
        public Image worldIcon;

        public void UpdateUI(int currentWorldIndex)
        {
            // Проверяем и обновляем текст мира
            if (worldText != null)
            {
                worldText.text = $"Мир: {currentWorldIndex + 1}/54";
            }
            
            // Проверяем и обновляем прогресс-бар мира
            if (worldProgress != null)
            {
                worldProgress.value = (currentWorldIndex + 1) / 54f;
            }
                
            // Проверяем и обновляем иконку мира
            if (worldIcon != null)
            {
                // Здесь можно добавить смену иконки в зависимости от мира
                worldIcon.color = Color.Lerp(Color.red, Color.green, (currentWorldIndex + 1) / 54f);
            }
        }
    }
}
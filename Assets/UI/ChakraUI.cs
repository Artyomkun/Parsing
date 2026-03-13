using UnityEngine;
using System.Collections.Generic;
using RealLife5D.Systems;
using RealLife5D.Core;

namespace RealLife5D.UI
{
    /// <summary>
    /// UI система для отображения чакр и их состояния
    /// </summary>
    public class ChakraUI : MonoBehaviour
    {
        [Header("Chakra Display")]
        public Transform chakraContainer;
        public GameObject chakraPrefab;
        public List<ChakraDisplay> chakraDisplays = new();

        [Header("Chakra Colors")]
        public Color[] chakraColors = new Color[]
        {
            Color.red,                      // Муладхара
            new(1f, 0.5f, 0f),        // orange (Свадхистана)
            Color.yellow,                   // Манипура
            Color.green,                    // Анахата
            Color.blue,                     // Вишудха
            new(0.294f, 0f, 0.51f),   // indigo (Аджна)
            Color.magenta,                  // Сахасрара
            Color.cyan,                     // Антардхана
            Color.white,                    // Парадхана
            new(1f, 0.843f, 0f),      // gold (Махадхана)
            Color.clear,                    // Парамадхана
            Color.white                     // rainbow (замена; можно сделать градиент позже)
        };

        private ChakraSystem chakraSystem;
        private GameManager gameManager;
        
        void Start()
        {
            InitializeUI();
        }
        
        void Update()
        {
            UpdateChakraStates();
        }
        
        private void InitializeUI()
        {
            gameManager = GameManager.Instance;
            if (gameManager != null)
            {
                chakraSystem = gameManager.GetComponent<ChakraSystem>();
            }
            
            CreateChakraDisplays();
            UpdateUI(gameManager.currentChakraLevel);
        }
        
        private void CreateChakraDisplays()
        {
            if (chakraContainer == null || chakraPrefab == null) return;
            
            // Очищаем существующие
            foreach (Transform child in chakraContainer)
            {
                Destroy(child.gameObject);
            }
            chakraDisplays.Clear();
            
            // Создаем новые
            for (int i = 0; i < 12; i++)
            {
                GameObject chakraObj = Instantiate(chakraPrefab, chakraContainer);
                ChakraDisplay display = chakraObj.GetComponent<ChakraDisplay>();
                
                if (display != null)
                {
                    display.Initialize(i + 1, chakraColors[i]);
                    chakraDisplays.Add(display);
                }
            }
        }
        
        public void UpdateUI(int currentLevel)
        {
            if (chakraDisplays.Count == 0) return;
            
            for (int i = 0; i < chakraDisplays.Count; i++)
            {
                bool isUnlocked = i < currentLevel;
                bool isCurrent = i == currentLevel - 1;
                
                chakraDisplays[i].UpdateState(isUnlocked, isCurrent);
            }
        }
        
        private void UpdateChakraStates()
        {
            if (chakraSystem == null) return;
            
            for (int i = 0; i < chakraDisplays.Count; i++)
            {
                bool isUnlocked = chakraSystem.IsChakraUnlocked(i + 1);
                chakraDisplays[i].UpdateState(isUnlocked, false);
            }
        }
        
        public void OnChakraClicked(int chakraLevel)
        {
            if (chakraSystem != null && chakraSystem.IsChakraUnlocked(chakraLevel))
            {
                ChakraData chakraData = chakraSystem.GetChakraData(chakraLevel);
                ShowChakraInfo(chakraData);
            }
        }
        
        private void ShowChakraInfo(ChakraData chakraData)
        {
            if (chakraData == null) return;
            
            Debug.Log($"Чакра: {chakraData.name}");
            Debug.Log($"Описание: {chakraData.description}");
            Debug.Log($"Мантра: {chakraData.mantra}");
            Debug.Log($"Способности: {string.Join(", ", chakraData.abilities)}");
        }
    }
    
    /// <summary>
    /// Отдельный элемент UI для отображения чакры
    /// </summary>
    public class ChakraDisplay : MonoBehaviour
    {
        [Header("UI Elements")]
        public GameObject lockIcon;
        public GameObject currentIndicator;
        
        private int chakraLevel;
        private Color chakraColor;
        
        public void Initialize(int level, Color color)
        {
            chakraLevel = level;
            chakraColor = color;
        }
        
        public void UpdateState(bool isUnlocked, bool isCurrent)
        {
            if (lockIcon != null)
            {
                lockIcon.SetActive(!isUnlocked);
            }
            
            if (currentIndicator != null)
            {
                currentIndicator.SetActive(isCurrent);
            }
        }

        [System.Obsolete]

        private void OnMouseDown()
        {
            ChakraUI chakraUI = FindObjectOfType<ChakraUI>();
            if (chakraUI != null)
            {
                chakraUI.OnChakraClicked(chakraLevel);
            }
        }
        
        private string GetChakraName(int level)
        {
            string[] names = {
                "Муладхара", "Свадхистана", "Манипура", "Анахата",
                "Вишудха", "Аджна", "Сахасрара", "Антардхана",
                "Парадхана", "Махадхана", "Парамадхана", "Атмадхана"
            };
            
            return level > 0 && level <= names.Length ? names[level - 1] : "Неизвестно";
        }
    }
}
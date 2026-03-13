using UnityEngine;
using System.Collections.Generic;
using RealLife5D.Core;
using RealLife5D.Systems;
using UnityEngine.UIElements;
using static RealLife5D.UI.KriyaYogaUI;
using System.Net.Mime;

namespace RealLife5D.UI
{
    /// <summary>
    /// UI система для Крийя-йоги и управления духовными практиками
    /// </summary>
    public class KriyaYogaUI : MonoBehaviour
    {
        [Header("Kriya Display")]
        public Transform kriyaContainer;
        public GameObject kriyaTechniquePrefab;
        public List<KriyaTechniqueDisplay> kriyaDisplays = new();
        
        [Header("Energy Display")]
        public Slider kundaliniSlider;
        public Label kundaliniText;
        public VisualElement kundaliniFill;
        
        public Slider pranaSlider;
        public Label pranaText;
        public VisualElement pranaFill;
        
        [Header("Practice Controls")]
        public Button startPracticeButton;
        public Button stopPracticeButton;
        public Label practiceStatusText;
        public Slider practiceProgressSlider;
        
        [Header("Chakra Status")]
        public Transform chakraStatusContainer;
        public GameObject chakraStatusPrefab;
        public List<ChakraStatusDisplay> chakraStatusDisplays = new();
        
        private KriyaYogaSystem kriyaSystem;
        private GameManager gameManager;
        private bool isInitialized = false;

        [System.Obsolete]

        void Start()
        {
            InitializeUI();
        }
        
        void Update()
        {
            if (!isInitialized) return;
            
            UpdateEnergyDisplays();
            UpdatePracticeStatus();
            UpdateChakraStatus();
        }

        [System.Obsolete]

        private void InitializeUI()
        {
            gameManager = GameManager.Instance;
            if (gameManager == null)
            {
                Debug.LogError("GameManager instance not found!");
                return;
            }
            
            kriyaSystem = gameManager.GetComponent<KriyaYogaSystem>();
            if (kriyaSystem == null)
            {
                Debug.LogError("KriyaYogaSystem not found on GameManager!");
                return;
            }
            
            CreateKriyaTechniqueDisplays();
            CreateChakraStatusDisplays();
            SetupButtons();
            
            isInitialized = true;
        }

        [System.Obsolete]

        private void CreateKriyaTechniqueDisplays()
        {
            if (kriyaContainer == null || kriyaTechniquePrefab == null)
            {
                Debug.LogError("Kriya container or prefab not assigned!");
                return;
            }
            
            // Очищаем существующие
            foreach (Transform child in kriyaContainer)
            {
                Destroy(child.gameObject);
            }
            kriyaDisplays.Clear();
            
            // Создаем новые для всех 12 уровней
            for (int i = 0; i < 12; i++)
            {
                GameObject kriyaObj = Instantiate(kriyaTechniquePrefab, kriyaContainer);
                KriyaTechniqueDisplay display = kriyaObj.GetComponent<KriyaTechniqueDisplay>();
                
                if (display != null)
                {
                    display.Initialize(i + 1, kriyaSystem);
                    kriyaDisplays.Add(display);
                }
            }
        }
        
        private void CreateChakraStatusDisplays()
        {
            if (chakraStatusContainer == null || chakraStatusPrefab == null)
            {
                Debug.LogError("Chakra status container or prefab not assigned!");
                return;
            }

            // Очищаем существующие
            foreach (Transform child in chakraStatusContainer)
            {
                Destroy(child.gameObject);
            }
            chakraStatusDisplays.Clear();

            // Создаем статус для всех чакр
            for (int i = 0; i < 12; i++)
            {
                GameObject statusObj = Instantiate(chakraStatusPrefab, chakraStatusContainer);
                ChakraStatusDisplay display = statusObj.GetComponent<ChakraStatusDisplay>();

                if (display != null)
                {
                    display.Initialize(i + 1);
                    chakraStatusDisplays.Add(display);
                }
            }
        }

        [System.Obsolete]

        private void SetupButtons()
        {
            if (startPracticeButton != null)
                startPracticeButton.clicked += OnStartPracticeClicked;
            
            if (stopPracticeButton != null)
                stopPracticeButton.clicked += OnStopPracticeClicked;
        }
        
        private void UpdateEnergyDisplays()
        {
            if (kriyaSystem == null) return;
            
            // Обновляем Кундалини
            float kundaliniEnergy = kriyaSystem.GetKundaliniEnergy();
            float kundaliniPercent = Mathf.Clamp01(kundaliniEnergy / 1000f);
            
            if (kundaliniSlider != null)
                kundaliniSlider.value = kundaliniPercent;
            
            if (kundaliniText != null)
                kundaliniText.text = $"Кундалини: {kundaliniEnergy:F0}/1000";
            
            if (kundaliniFill != null)
                kundaliniFill.style.backgroundColor = new StyleColor(Color.Lerp(Color.red, Color.yellow, kundaliniPercent));
            
            // Обновляем Прану
            float pranaEnergy = kriyaSystem.GetPranaEnergy();
            float pranaPercent = Mathf.Clamp01(pranaEnergy / 1000f);
            
            if (pranaSlider != null)
                pranaSlider.value = pranaPercent;
            
            if (pranaText != null)
                pranaText.text = $"Прана: {pranaEnergy:F0}/1000";
            
            if (pranaFill != null)
                pranaFill.style.backgroundColor = new StyleColor(Color.Lerp(Color.blue, Color.cyan, pranaPercent));
        }
        
        private void UpdatePracticeStatus()
        {
            if (kriyaSystem == null) return;
            
            bool isActive = kriyaSystem.IsKriyaActive();
            
            if (startPracticeButton != null)
                startPracticeButton.SetEnabled(!isActive);
            
            if (stopPracticeButton != null)
                stopPracticeButton.SetEnabled(isActive);
            
            if (practiceStatusText != null)
            {
                if (isActive)
                {
                    string techniqueName = kriyaSystem.GetCurrentTechniqueName();
                    practiceStatusText.text = $"Крийя практика: {techniqueName}";
                }
                else
                {
                    practiceStatusText.text = "Крийя не активна";
                }
            }
            
            if (practiceProgressSlider != null)
                practiceProgressSlider.value = kriyaSystem.GetKriyaProgress();
        }
        
        private void UpdateChakraStatus()
        {
            if (kriyaSystem == null) return;
            
            for (int i = 0; i < chakraStatusDisplays.Count; i++)
            {
                bool isActivated = kriyaSystem.IsChakraActivated(i + 1);
                chakraStatusDisplays[i].UpdateStatus(isActivated);
            }
        }

        [System.Obsolete]

        private void OnStartPracticeClicked()
        {
            // Начинаем практику на текущем уровне чакр
            if (kriyaSystem != null && gameManager != null)
            {
                int currentLevel = gameManager.currentChakraLevel;
                kriyaSystem.StartKriyaPractice(currentLevel);
            }
        }

        [System.Obsolete]

        private void OnStopPracticeClicked()
        {
            kriyaSystem?.StopKriyaPractice();
        }

        [System.Obsolete]

        public void OnKriyaTechniqueClicked(int kriyaLevel)
        {
            kriyaSystem?.StartKriyaPractice(kriyaLevel);
        }
    }
    
    /// <summary>
    /// Отдельный элемент UI для отображения техники Крийя
    /// </summary>
    public class KriyaTechniqueDisplay : MonoBehaviour
    {
        [Header("UI Elements")]
        public Label levelText;
        public Label nameText;
        public Label descriptionText;
        public Button practiceButton;
        public GameObject lockIcon;
        public GameObject activeIndicator;
        
        private int kriyaLevel;
        private KriyaYogaSystem kriyaSystem;

        [System.Obsolete]
        public void Initialize(int level, KriyaYogaSystem system)
        {
            kriyaLevel = level;
            kriyaSystem = system;
            
            if (levelText != null)
                levelText.text = level.ToString();
            
            if (nameText != null)
                nameText.text = GetKriyaName(level);
            
            if (descriptionText != null)
                descriptionText.text = GetKriyaDescription(level);
            
            if (practiceButton != null)
                practiceButton.clicked += OnPracticeClicked;
            
            UpdateDisplay();
        }
        
        private void UpdateDisplay()
        {
            if (kriyaSystem == null) return;
            
            bool isUnlocked = kriyaSystem.IsKriyaUnlocked(kriyaLevel);
            bool isActive = kriyaSystem.IsKriyaActive() && 
                           kriyaSystem.GetCurrentTechniqueLevel() == kriyaLevel;
            
            if (lockIcon != null)
                lockIcon.SetActive(!isUnlocked);
            
            if (activeIndicator != null)
                activeIndicator.SetActive(isActive);
            
            if (practiceButton != null)
                practiceButton.SetEnabled(isUnlocked && !isActive);
        }

        [System.Obsolete]

        private void OnPracticeClicked()
        {
            KriyaYogaUI kriyaUI = FindObjectOfType<KriyaYogaUI>();
            kriyaUI?.OnKriyaTechniqueClicked(kriyaLevel);
        }
        
        private static string GetKriyaName(int level)
        {
            string[] names = {
                "Муладхара Крийя", "Свадхистана Крийя", "Манипура Крийя", "Анахата Крийя",
                "Вишудха Крийя", "Аджна Крийя", "Сахасрара Крийя", "Антардхана Крийя",
                "Парадхана Крийя", "Махадхана Крийя", "Парамадхана Крийя", "Атмадхана Крийя"
            };
            
            return level > 0 && level <= names.Length ? names[level - 1] : "Неизвестно";
        }
        
        private static string GetKriyaDescription(int level)
        {
            string[] descriptions = {
                "Пробуждение корневой чакры", "Активация сакральной энергии", "Пробуждение солнечного сплетения", "Открытие сердечной чакры",
                "Активация горловой чакры", "Пробуждение третьего глаза", "Открытие коронной чакры", "Межпространственные путешествия",
                "Создание реальности", "Понимание 5D", "Единство с космосом", "Статус Куратора"
            };
            
            return level > 0 && level <= descriptions.Length ? descriptions[level - 1] : "Описание недоступно";
        }
    }
    
    /// <summary>
    /// Отображение статуса чакры в системе Крийя
    /// </summary>
    public class ChakraStatusDisplay : MonoBehaviour
    {
        [Header("UI Elements")]
        public Label chakraLevelText;
        public VisualElement chakraIcon;
        public GameObject activatedIcon;
        public GameObject lockedIcon;
        
        private int chakraLevel;
        
        public void Initialize(int level)
        {
            chakraLevel = level;
            
            if (chakraLevelText != null)
                chakraLevelText.text = level.ToString();
            
            if (chakraIcon != null)
                chakraIcon.style.backgroundColor = new StyleColor(GetChakraColor(level));
        }
        
        public void UpdateStatus(bool isActivated)
        {
            if (activatedIcon != null)
                activatedIcon.SetActive(isActivated);
            
            if (lockedIcon != null)
                lockedIcon.SetActive(!isActivated);
        }

        private static Color GetChakraColor(int level)
        {
            Color[] colors = {
                Color.red,
                new(1f, 0.5f, 0f),
                Color.yellow,
                Color.green,
                Color.blue,
                new(0.294f, 0f, 0.51f),
                Color.magenta,
                Color.cyan,
                Color.white,
                new(1f, 0.843f, 0f),
                Color.clear,
                Color.white
            };
            return level > 0 && level <= colors.Length ? colors[level - 1] : Color.gray;
        }
    }
}
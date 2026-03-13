using UnityEngine;
using UnityEngine.SceneManagement;
using RealLife5D.Systems;
using RealLife5D.UI;
using System;

namespace RealLife5D.Core
{
    [RequireComponent(typeof(ChakraSystem))]
    [RequireComponent(typeof(DimensionSystem))]
    [RequireComponent(typeof(WorldSystem))]
    [RequireComponent(typeof(KarmaSystem))]
    [RequireComponent(typeof(ReincarnationSystem))]
    [RequireComponent(typeof(MoodSystem))]
    [RequireComponent(typeof(DiseaseSystem))]
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        
        [Header("Game State")]
        public int currentDimension = 3;
        public int currentChakraLevel = 1;
        public int currentWorldIndex = 0;
        public bool isDead = false;
        
        [Header("World Settings")]
        public int totalWorlds = 54;
        public int totalChakras = 12;
        
        [Header("UI References")]
        public GameObject dimensionUI;
        public GameObject chakraUI;
        public GameObject worldUI;
        
        // Компоненты UI
        private UIDimensionDisplay dimensionUIComponent;
        private UIChakraDisplay chakraUIComponent;
        private UIWorldDisplay worldUIComponent;
        
        // Системы
        private ChakraSystem chakraSystem;
        private DimensionSystem dimensionSystem;
        private WorldSystem worldSystem;
        private KarmaSystem karmaSystem;
        private ReincarnationSystem reincarnationSystem;
        private MoodSystem moodSystem;
        private DiseaseSystem diseaseSystem;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                
                // Убеждаемся, что объект корневой
                if (transform.parent != null)
                {
                    transform.SetParent(null);
                }
                
                DontDestroyOnLoad(gameObject);
                InitializeSystems();
            }
            else
            {
                Destroy(gameObject);
                return;
            }
        }
        
        void Start()
        {
            LoadGameState();
            CacheUIComponents();
            UpdateUI();
        }

        // Кэшируем компоненты UI при инициализации
        private void CacheUIComponents()
        {
            // Ищем UI компоненты по имени, если они не назначены в инспекторе
            if (dimensionUI == null)
                dimensionUI = GameObject.Find("DimensionUI");

            if (chakraUI == null)
                chakraUI = GameObject.Find("ChakraUI");

            if (worldUI == null)
                worldUI = GameObject.Find("WorldUI");

            // ЗАМЕНЯЕМ устаревший FindObjectOfType на современные аналоги
            if (dimensionUI == null)
            {
#if UNITY_2023_1_OR_NEWER
        var dimensionDisplay = FindFirstObjectByType<UIDimensionDisplay>();
#else
                var dimensionDisplay = FindObjectOfType<UIDimensionDisplay>();
#endif
                if (dimensionDisplay != null)
                    dimensionUI = dimensionDisplay.gameObject;
            }

            if (chakraUI == null)
            {
#if UNITY_2023_1_OR_NEWER
        var chakraDisplay = FindFirstObjectByType<UIChakraDisplay>();
#else
                var chakraDisplay = FindObjectOfType<UIChakraDisplay>();
#endif
                if (chakraDisplay != null)
                    chakraUI = chakraDisplay.gameObject;
            }

            if (worldUI == null)
            {
#if UNITY_2023_1_OR_NEWER
        var worldDisplay = FindFirstObjectByType<UIWorldDisplay>();
#else
                var worldDisplay = FindObjectOfType<UIWorldDisplay>();
#endif
                if (worldDisplay != null)
                    worldUI = worldDisplay.gameObject;
            }

            // Получаем компоненты
            if (dimensionUI != null)
                dimensionUIComponent = dimensionUI.GetComponent<UIDimensionDisplay>();

            if (chakraUI != null)
                chakraUIComponent = chakraUI.GetComponent<UIChakraDisplay>();

            if (worldUI != null)
                worldUIComponent = worldUI.GetComponent<UIWorldDisplay>();

            Debug.Log($"UI Components found - Dimension: {dimensionUIComponent != null}, " +
                     $"Chakra: {chakraUIComponent != null}, World: {worldUIComponent != null}");
        }

        
        private void InitializeSystems()
        {
            // Получаем компоненты - RequireComponent гарантирует их наличие
            chakraSystem = GetComponent<ChakraSystem>();
            dimensionSystem = GetComponent<DimensionSystem>();
            worldSystem = GetComponent<WorldSystem>();
            karmaSystem = GetComponent<KarmaSystem>();
            reincarnationSystem = GetComponent<ReincarnationSystem>();
            moodSystem = GetComponent<MoodSystem>();
            diseaseSystem = GetComponent<DiseaseSystem>();

            // УБИРАЕМ вызовы Initialize() - если методы не существуют в системах
            // Системы будут инициализироваться в своих собственных Awake/Start методах
        }
        
        public void AdvanceChakraLevel()
        {
            if (currentChakraLevel < totalChakras)
            {
                currentChakraLevel++;
                
                if (chakraSystem != null)
                    chakraSystem.OnChakraLevelUp(currentChakraLevel);
                
                // Проверяем, можно ли перейти в следующее измерение
                if (currentChakraLevel >= GetRequiredChakraForDimension(currentDimension + 1) && currentDimension < 5)
                {
                    AdvanceDimension();
                }
                
                // Проверяем доступ к Луне
                CheckMoonAccess();
                
                SaveGameState();
                UpdateUI();
            }
        }
        
        public void AdvanceDimension()
        {
            if (currentDimension < 5 && currentChakraLevel >= GetRequiredChakraForDimension(currentDimension + 1))
            {
                currentDimension++;
                
                if (dimensionSystem != null)
                    dimensionSystem.OnDimensionChange(currentDimension);
                    
                SaveGameState();
                UpdateUI();
            }
        }
        
        private int GetRequiredChakraForDimension(int dimension)
        {
            return dimension switch
            {
                1 => 1,
                2 => 2,
                3 => 3,
                4 => 7,
                5 => 10,
                _ => 12,
            };
        }
        
        public void OnPlayerDeath()
        {
            if (isDead) return; // Уже мертв
            
            isDead = true;
            
            // Реинкарнация с учетом кармы
            if (reincarnationSystem != null)
            {
                // Если включен режим перманентной смерти и игрок не Куратор — полный конец игры
                if (PlayerPrefs.GetInt("Permadeath", 0) == 1 && PlayerPrefs.GetInt("IsCurator", 0) == 0)
                {
                    Debug.Log("Перманентная смерть: конец игры, сохранения очищены.");
                    PlayerPrefs.DeleteAll();
                    SceneManager.LoadScene("GameOver");
                    return;
                }
                
                reincarnationSystem.Reincarnate();
                return;
            }
            
            // Fallback на линейный переход мира
            int newWorldIndex = (currentWorldIndex + 1) % totalWorlds;
            currentWorldIndex = newWorldIndex;
            
            if (worldSystem != null)
                worldSystem.TransitionToWorld(currentWorldIndex);
                
            SaveGameState();
            SceneManager.LoadScene("World_" + currentWorldIndex);
        }
        
        public void OnLevelStagnation()
        {
            // При долгом стоянии на одном уровне - понижение чакры
            if (currentChakraLevel > 1)
            {
                currentChakraLevel--;
                Debug.Log($"Игрок застрял на уровне. Чакра понижена до {currentChakraLevel}");
                SaveGameState();
                UpdateUI();
            }
        }
        
        public void CheckMoonAccess()
        {
            if (currentChakraLevel >= 12 && currentDimension >= 5)
            {
                // Игрок достиг Луны и может стать Куратором
                SceneManager.LoadScene("Moon");
            }
        }
        
        private void UpdateUI()
        {
            try
            {
                // Обновляем UI измерений
                if (dimensionUIComponent != null)
                {
                    dimensionUIComponent.UpdateUI(currentDimension);
                }
                else if (dimensionUI != null)
                {
                    dimensionUIComponent = dimensionUI.GetComponent<UIDimensionDisplay>();
                    if (dimensionUIComponent != null)
                        dimensionUIComponent.UpdateUI(currentDimension);
                }
                
                // Обновляем UI чакр - ИСПРАВЛЯЕМ вызов метода
                if (chakraUIComponent != null)
                {
                    // Если метод требует два параметра, передаем второй параметр (например, пустую строку или название чакры)
                    chakraUIComponent.UpdateUI(currentChakraLevel, GetChakraName(currentChakraLevel));
                }
                else if (chakraUI != null)
                {
                    chakraUIComponent = chakraUI.GetComponent<UIChakraDisplay>();
                    if (chakraUIComponent != null)
                        chakraUIComponent.UpdateUI(currentChakraLevel, GetChakraName(currentChakraLevel));
                }
                
                // Обновляем UI мира
                if (worldUIComponent != null)
                {
                    worldUIComponent.UpdateUI(currentWorldIndex);
                }
                else if (worldUI != null)
                {
                    worldUIComponent = worldUI.GetComponent<UIWorldDisplay>();
                    if (worldUIComponent != null)
                        worldUIComponent.UpdateUI(currentWorldIndex);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"Ошибка при обновлении UI: {e.Message}");
            }
        }
        
        // Вспомогательный метод для получения названия чакры
        private string GetChakraName(int chakraLevel)
        {
            return chakraLevel switch
            {
                1 => "Муладхара",
                2 => "Свадхистхана", 
                3 => "Манипура",
                4 => "Анахата",
                5 => "Вишудха",
                6 => "Аджна",
                7 => "Сахасрара",
                8 => "Звездная",
                9 => "Галактическая",
                10 => "Вселенская",
                11 => "Божественная",
                12 => "Абсолютная",
                _ => "Неизвестная"
            };
        }
        
        private void SaveGameState()
        {
            // Перманентная смерть: если IsCurator != 1, сохраняем состояние; иначе прогресс блокируется
            if (PlayerPrefs.GetInt("Permadeath", 0) == 1 && PlayerPrefs.GetInt("IsCurator", 0) == 0)
            {
                // режим перманентной смерти — не сохраняем прогресс, все стирается при смерти
                return;
            }
            
            PlayerPrefs.SetInt("CurrentDimension", currentDimension);
            PlayerPrefs.SetInt("CurrentChakraLevel", currentChakraLevel);
            PlayerPrefs.SetInt("CurrentWorldIndex", currentWorldIndex);
            PlayerPrefs.Save();
        }
        
        private void LoadGameState()
        {
            currentDimension = PlayerPrefs.GetInt("CurrentDimension", 3);
            currentChakraLevel = PlayerPrefs.GetInt("CurrentChakraLevel", 1);
            currentWorldIndex = PlayerPrefs.GetInt("CurrentWorldIndex", 0);
        }
        
        public void ResetGame()
        {
            PlayerPrefs.DeleteAll();
            currentDimension = 3;
            currentChakraLevel = 1;
            currentWorldIndex = 0;
            isDead = false;
            SaveGameState();
            UpdateUI();
            
            // Перезагружаем текущую сцену
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }
        
        // Вызывается при смене сцены для обновления ссылок на UI
        public void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            CacheUIComponents();
            UpdateUI();
        }
        
        void OnEnable()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
        }
        
        void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }
    }
}
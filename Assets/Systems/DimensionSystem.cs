using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using RealLife5D.Core; // Для UI (при необходимости)

namespace RealLife5D.Systems
{
    [System.Serializable]
    public class DimensionData
    {
        public int level;
        public string name;
        public string description;
        public Color dimensionColor;
        public float realityShift;
        public List<string> features;
        public bool isUnlocked;
        public int requiredChakraLevel;
    }

    public class DimensionSystem : MonoBehaviour
    {
        [Header("Dimension Data")]
        public List<DimensionData> dimensions = new List<DimensionData>();

        [Header("Current State")]
        public float realityStability = 100f;
        public float dimensionalShift = 0f;

        [Header("UI Elements (опционально)")]
        public Text dimensionNameText;
        public Text dimensionFeaturesText;
        public Slider stabilitySlider;

        private GameManager gameManager;
        private Camera mainCamera;
        private Coroutine currentTransition;

        void Start()
        {
            gameManager = GameManager.Instance;
            mainCamera = Camera.main;
            InitializeDimensions();
            UpdateUI(dimensions[0]);
        }

        private void InitializeDimensions()
        {
            dimensions.Clear();

            // Добавляем измерения
            dimensions.Add(new DimensionData
            {
                level = 1,
                name = "1D - Физический Мир",
                description = "Базовый физический мир, где существуют только материальные объекты",
                dimensionColor = Color.gray,
                realityShift = 0f,
                features = new List<string> { "Только материя", "Базовые физические законы", "Ограниченное восприятие" },
                isUnlocked = true,
                requiredChakraLevel = 1
            });

            dimensions.Add(new DimensionData
            {
                level = 2,
                name = "2D - Плоский Мир",
                description = "Двумерный мир с ограниченным движением и восприятием",
                dimensionColor = Color.blue,
                realityShift = 0.1f,
                features = new List<string> { "Двумерное движение", "Плоские объекты", "Ограниченная глубина" },
                isUnlocked = false,
                requiredChakraLevel = 2
            });

            dimensions.Add(new DimensionData
            {
                level = 3,
                name = "3D - Наш Мир",
                description = "Трехмерный мир, который мы знаем - с глубиной, высотой и шириной",
                dimensionColor = Color.white,
                realityShift = 0.2f,
                features = new List<string> { "Полное 3D восприятие", "Время как четвертое измерение", "Физические законы" },
                isUnlocked = true,
                requiredChakraLevel = 3
            });

            dimensions.Add(new DimensionData
            {
                level = 4,
                name = "4D - Временное Измерение",
                description = "Мир, где время становится управляемым измерением",
                dimensionColor = Color.cyan,
                realityShift = 0.5f,
                features = new List<string> { "Управление временем", "Видение прошлого и будущего", "Временные петли" },
                isUnlocked = false,
                requiredChakraLevel = 7
            });

            dimensions.Add(new DimensionData
            {
                level = 5,
                name = "5D - Духовное Измерение",
                description = "Высшее измерение, где душа и сознание преобладают над материей",
                dimensionColor = Color.magenta,
                realityShift = 1.0f,
                features = new List<string> { "Создание реальности", "Межпространственные путешествия", "Единство с космосом" },
                isUnlocked = false,
                requiredChakraLevel = 10
            });
        }

        // Переключение на новое измерение
        public void OnDimensionChange(int newDimensionLevel)
        {
            DimensionData dimension = GetDimensionData(newDimensionLevel);
            if (dimension == null || !dimension.isUnlocked)
            {
                Debug.LogWarning("Это измерение недоступно или не существует");
                return;
            }

            // Запускаем плавный переход
            if (currentTransition != null)
                StopCoroutine(currentTransition);
            currentTransition = StartCoroutine(TransitionToDimension(dimension));
        }

        private IEnumerator TransitionToDimension(DimensionData dimension)
        {
            // Обновляем UI
            UpdateUI(dimension);

            // Включаем эффект для камеры
            yield return StartCoroutine(TransitionCameraEffect(dimension.dimensionColor, 1f, 1f));

            // Применяем эффекты
            ApplyDimensionEffects(dimension);
        }

        private IEnumerator TransitionCameraEffect(Color targetColor, float intensity, float duration)
        {
            // Предположим, что используем Camera backgroundColor
            Color startColor = mainCamera.backgroundColor;
            float timeElapsed = 0f;

            while (timeElapsed < duration)
            {
                mainCamera.backgroundColor = Color.Lerp(startColor, targetColor, timeElapsed / duration);
                // Тут можно добавить более сложные постпроцессинг эффекты
                yield return null;
                timeElapsed += Time.deltaTime;
            }
            mainCamera.backgroundColor = targetColor;
        }

        private void ApplyDimensionEffects(DimensionData dimension)
        {
            // Меняем физику
            ApplyPhysicsChanges(dimension);

            // Меняем реальность
            dimensionalShift = dimension.realityShift;

            // Можно добавить дополнительные эффекты (звуки, постпроцессинг)
            Debug.Log($"Переход выполнен: {dimension.name}");
        }

        private void ApplyPhysicsChanges(DimensionData dimension)
        {
            // Здесь можно расширять физические эффекты
            switch (dimension.level)
            {
                case 1:
                case 2:
                case 3:
                    Physics.gravity = new Vector3(0, -9.81f, 0);
                    break;
                case 4:
                    // Временное измерение — например, уменьшенная гравитация
                    Physics.gravity = new Vector3(0, -4.9f, 0);
                    break;
                case 5:
                    // Духовное измерение — возможно, отключение гравитации
                    Physics.gravity = Vector3.zero;
                    break;
            }
        }

        private void UpdateUI(DimensionData dimension)
        {
            if (dimensionNameText != null)
                dimensionNameText.text = dimension.name;

            if (dimensionFeaturesText != null)
                dimensionFeaturesText.text = string.Join("\n", dimension.features);

            if (stabilitySlider != null)
                stabilitySlider.value = realityStability;
        }

        // Проверка, доступно ли измерение
        public bool IsDimensionUnlocked(int level)
        {
            var dimension = GetDimensionData(level);
            return dimension != null && dimension.isUnlocked;
        }

        public DimensionData GetDimensionData(int level)
        {
            return dimensions.Find(d => d.level == level);
        }

        // Получение текущего уровня стабильности
        public float GetRealityStability()
        {
            return realityStability;
        }

        public void ModifyRealityStability(float amount)
        {
            realityStability = Mathf.Clamp(realityStability + amount, 0f, 100f);
            if (stabilitySlider != null)
                stabilitySlider.value = realityStability;
        }

        // Получение текущего сдвига реальности
        public float GetDimensionalShift()
        {
            return dimensionalShift;
        }

        // Вызов события сдвига
        public void TriggerRealityShift()
        {
            dimensionalShift += 0.1f;
            ModifyRealityStability(-5f);
            Debug.Log("Происходит сдвиг реальности!");
        }

        // Стабилизация реальности
        public void StabilizeReality()
        {
            dimensionalShift = Mathf.Max(0, dimensionalShift - 0.05f);
            ModifyRealityStability(2f);
        }
    }
}
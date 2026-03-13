using UnityEngine;
using System.Collections.Generic;
using RealLife5D.Core;
using System;

namespace RealLife5D.Systems
{
    [System.Serializable]
    public class ChakraData
    {
        public int level;
        public string name;
        public string description;
        public Color chakraColor;
        public string mantra;
        public List<string> abilities;
        public float energyMultiplier;
        public bool isUnlocked;
    }

    public class ChakraSystem : MonoBehaviour
    {
        [Header("Chakra Data")]
        public List<ChakraData> chakras = new();

        [Header("Текущий статус")]
        public float currentEnergy = 100f;
        public float maxEnergy = 100f;
        public float energyRegenerationRate = 5f;

        private GameManager gameManager;

        // Цвета для чакр
        public Color[] chakraColors = new Color[]
        {
            Color.red,                      // Муладхара
            new(1f, 0.5f, 0f),        // Свадхистана
            Color.yellow,                   // Манипура
            Color.green,                    // Анахата
            Color.blue,                     // Вишудха
            new(0.294f, 0f, 0.51f),   // Аджна
            Color.magenta,                  // Сахасрара
            Color.cyan,                     // Антардхана
            Color.white,                    // Парадхана
            new(1f, 0.843f, 0f),      // Махадхана
            Color.clear,                    // Парамадхана
            Color.white                     // Дополнительная (можно заменить градиентом)
        };
        internal readonly bool isAbilityActive;



        void Start()
        {
            gameManager = GameManager.Instance;
            InitializeChakras();
        }

        void Update()
        {
            RegenerateEnergy();
        }

        private void InitializeChakras()
        {
            // Создаем 12 чакр с базовыми параметрами
            chakras.Clear();

            // Базовые 7 чакр
            chakras.Add(new ChakraData
            {
                level = 1,
                name = "Муладхара (Корневая)",
                description = "Основная физическая основа",
                chakraColor = Color.red,
                mantra = "LAM",
                abilities = new List<string> { "Базовая выносливость", "Физическая сила", "Чувство безопасности" },
                energyMultiplier = 1.0f,
                isUnlocked = true
            });

            chakras.Add(new ChakraData
            {
                level = 2,
                name = "Свадхистана (Сакральная)",
                description = "Центр эмоций и творчества",
                chakraColor = chakraColors[1],
                mantra = "VAM",
                abilities = new List<string> { "Эмоциональная стабильность", "Творческие способности", "Сексуальная энергия" },
                energyMultiplier = 1.2f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 3,
                name = "Манипура (Солнечное сплетение)",
                description = "Воля, сила и самодисциплина",
                chakraColor = Color.yellow,
                mantra = "RAM",
                abilities = new List<string> { "Сила воли", "Лидерские качества", "Метаболизм" },
                energyMultiplier = 1.5f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 4,
                name = "Анахата (Сердечная)",
                description = "Любовь и сострадание",
                chakraColor = Color.green,
                mantra = "YAM",
                abilities = new List<string> { "Безусловная любовь", "Эмпатия", "Исцеление" },
                energyMultiplier = 2.0f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 5,
                name = "Вишудха (Горловая)",
                description = "Коммуникация и самовыражение",
                chakraColor = Color.blue,
                mantra = "HAM",
                abilities = new List<string> { "Красноречие", "Творческое самовыражение", "Истина" },
                energyMultiplier = 2.5f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 6,
                name = "Аджна (Третий глаз)",
                description = "Интуиция и мудрость",
                chakraColor = chakraColors[5],
                mantra = "AUM",
                abilities = new List<string> { "Интуиция", "Ясновидение", "Мудрость" },
                energyMultiplier = 3.0f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 7,
                name = "Сахасрара (Коронная)",
                description = "Высшее сознание и духовность",
                chakraColor = Color.magenta,
                mantra = "Тишина",
                abilities = new List<string> { "Просветление", "Связь с божественным", "Единство", "Духовность" },
                energyMultiplier = 4.0f,
                isUnlocked = false
            });

            // Дополнительные высшие чакры
            chakras.Add(new ChakraData
            {
                level = 8,
                name = "Антардхана (Скрытая)",
                description = "Доступ к параллельным мирам",
                chakraColor = Color.cyan,
                mantra = "KRIM",
                abilities = new List<string> { "Межпространственные путешествия", "Телепортация", "Видение других измерений" },
                energyMultiplier = 5.0f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 9,
                name = "Парадхана (Высшая)",
                description = "Создание реальности",
                chakraColor = Color.white,
                mantra = "HRIM",
                abilities = new List<string> { "Манипуляция реальностью", "Создание объектов", "Изменение времени" },
                energyMultiplier = 7.0f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 10,
                name = "Махадхана (Великая)",
                description = "Понимание всех измерений",
                chakraColor = chakraColors[9],
                mantra = "SRIM",
                abilities = new List<string> { "Понимание 5D", "Доступ к Луне", "Предварительное кураторство" },
                energyMultiplier = 10.0f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 11,
                name = "Парамадхана (Абсолютная)",
                description = "Единство со всем существующим",
                chakraColor = Color.clear,
                mantra = "PRAM",
                abilities = new List<string> { "Единство с космосом", "Бессмертие", "Полное понимание" },
                energyMultiplier = 15.0f,
                isUnlocked = false
            });

            chakras.Add(new ChakraData
            {
                level = 12,
                name = "Атмадхана (Душевная)",
                description = "Готовность стать Куратором Земель",
                chakraColor = chakraColors[11],
                mantra = "ATMA",
                abilities = new List<string> { "Статус Куратора Земель", "Наблюдение и баланс 54 Земель", "Бесконечная мудрость" },
                energyMultiplier = 20.0f,
                isUnlocked = false
            });
        }

        /// <summary>
        /// Повышение уровня чакры
        /// </summary>
        /// <param name="newLevel"></param>
        public void OnChakraLevelUp(int newLevel)
        {
            if (newLevel <= chakras.Count && newLevel > 0)
            {
                // Проверка для уровней 4 и 7, чтобы понять предыдущие
                if ((newLevel == 4 && !HasMasteredPreviousChakras(3)) ||
                    (newLevel == 7 && !HasMasteredPreviousChakras(6)))
                {
                    Debug.LogWarning($"Для разблокировки этой чакры необходимо понять предыдущие уровни!");
                    return;
                }

                ChakraData chakra = chakras[newLevel - 1];
                chakra.isUnlocked = true;

                // Обновляем максимум энергии
                maxEnergy = 100f * chakra.energyMultiplier;
                currentEnergy = maxEnergy;

                // Активируем способности
                ActivateChakraAbilities(chakra);

                Debug.Log($"Чакра {chakra.name} разблокирована! Способности: {string.Join(", ", chakra.abilities)}");
            }
            else
            {
                Debug.LogWarning("Некорректный уровень чакры");
            }
        }

        private bool HasMasteredPreviousChakras(int upToLevel)
        {
            for (int i = 1; i <= upToLevel; i++)
            {
                if (!chakras[i - 1].isUnlocked || !IsChakraMastered(i))
                {
                    return false;
                }
            }
            return true;
        }

        private bool IsChakraMastered(int level)
        {
            // Тут можно вставить логику проверки, например, выполнение медитаций или задач
            return true; // Упрощенно
        }

        private void ActivateChakraAbilities(ChakraData chakra)
        {
            // В этом месте можно реализовать активацию способностей
            switch (chakra.level)
            {
                case 4:
                    // Анахата - исцеление
                    break;
                case 6:
                    // Аджна - интуиция
                    break;
                case 8:
                    // Антардхана - межпространственные путешествия
                    break;
                case 10:
                    // Махадхана - доступ к Луне
                    gameManager.CheckMoonAccess();
                    break;
            }
        }

        public bool IsChakraUnlocked(int level)
        {
            if (level > 0 && level <= chakras.Count)
                return chakras[level - 1].isUnlocked;
            return false;
        }

        public ChakraData GetChakraData(int level)
        {
            if (level > 0 && level <= chakras.Count)
                return chakras[level - 1];
            return null;
        }

        public void UseEnergy(float amount)
        {
            currentEnergy = Mathf.Max(0, currentEnergy - amount);
        }

        private void RegenerateEnergy()
        {
            if (currentEnergy < maxEnergy)
            {
                currentEnergy += energyRegenerationRate * Time.deltaTime;
                currentEnergy = Mathf.Min(currentEnergy, maxEnergy);
            }
        }

        public float GetEnergyPercentage()
        {
            return currentEnergy / maxEnergy;
        }

        public bool CanUseAbility(float energyCost)
        {
            return currentEnergy >= energyCost;
        }

        internal Dictionary<string, float> GetChakraStatus()
        {
            throw new NotImplementedException();
        }

        internal float GetChakraLevel()
        {
            throw new NotImplementedException();
        }
    }
}
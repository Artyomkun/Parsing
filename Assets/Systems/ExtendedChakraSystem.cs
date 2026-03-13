using UnityEngine;
using System.Collections.Generic;

namespace RealLife5D.Systems
{
    [System.Serializable]
    public class ExtendedChakra
    {
        public int index; // 0..153
        public string name;
        public string mantra;
        public List<string> abilities = new();
        public float energyMultiplier = 1f;
        public bool unlocked;
    }

    [RequireComponent(typeof(BirthProfileSystem))]
    [RequireComponent(typeof(CosmoenergySystem))]

    public class ExtendedChakraSystem : MonoBehaviour
    {
        [Header("154 Chakras")]
        public List<ExtendedChakra> chakras = new(154);
        public int currentChakraIndex = 0;

        private BirthProfileSystem birthProfile;
        private CosmoenergySystem cosmo;

        void Awake()
        {
            birthProfile = GetComponent<BirthProfileSystem>();
            cosmo = GetComponent<CosmoenergySystem>();
        }

        void Start()
        {
            Initialize154();
        }

        public void Initialize154()
        {
            chakras.Clear();

            // Можно определить особенности по индексам
            for (int i = 0; i < 154; i++)
            {
                var ch = new ExtendedChakra
                {
                    index = i,
                    name = $"Чакра {i + 1}",
                    mantra = "OM",
                    energyMultiplier = 1f + i * 0.02f,
                    unlocked = false
                };
                
                // Особые случаи для определенных чакр
                switch (i)
                {
                    case 3:
                        ch.abilities.Add("Любовь");
                        break;
                    case 5:
                        ch.mantra = "Тишина"; // по вашему примеру
                        break;
                    case 6:
                        ch.mantra = "AUM"; // 7-я чакра (Сахасрара)
                        ch.abilities.Add("Духовность");
                        break;
                    // Можно добавить дополнительные специфические чакры
                }

                chakras.Add(ch);
            }

            // Установка начальной чакры в соответствии с профилем рождения
            int bias = birthProfile != null ? birthProfile.initialChakraBiasIndex : 0;
            currentChakraIndex = Mathf.Clamp(bias, 0, 153);
            chakras[currentChakraIndex].unlocked = true;
        }
    }
}
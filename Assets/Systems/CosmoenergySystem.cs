using UnityEngine;
using System.Collections.Generic;
using RealLife5D.Core;

namespace RealLife5D.Systems
{
    [System.Serializable]
    public class CosmoChannel
    {
        public string id;
        public string name;
        public float resonance; // 0..1
        public List<int> chakraIndices = new List<int>(); // чакры, усиливаемые каналом
    }

    public class CosmoenergySystem : MonoBehaviour
    {
        [Header("Channels")] 
        public List<CosmoChannel> channels = new List<CosmoChannel>();
        public float globalResonance; // средняя резонансность с профилем

        private BirthProfileSystem birthProfile;
        private GameManager gm;

        void Start()
        {
            gm = GameManager.Instance;
            birthProfile = gm.GetComponent<BirthProfileSystem>();
            InitializeChannels();
            ComputeGlobalResonance();
        }

        /// <summary>
        /// Инициализация базовых каналов
        /// </summary>
        private void InitializeChannels()
        {
            channels.Clear();
            channels.Add(CreateChannel("SOL", "Солнечный канал", new int[] { 6, 10, 33, 72 }));
            channels.Add(CreateChannel("LUN", "Лунный канал", new int[] { 1, 4, 28, 90 }));
            channels.Add(CreateChannel("TER", "Земной канал", new int[] { 0, 2, 3, 15 }));
            channels.Add(CreateChannel("AKA", "Канал Акаши", new int[] { 100, 120, 140, 153 }));
        }


        /// <summary>
        /// Создает канал с указанными параметрами
        /// </summary>
        private CosmoChannel CreateChannel(string id, string name, int[] chakraIdx)
        {
            var ch = new CosmoChannel
            {
                id = id,
                name = name,
                resonance = 0f
            };
            ch.chakraIndices.AddRange(chakraIdx);
            return ch;
        }

        /// <summary>
        /// Обновляет глобальный резонанс на основе профиля
        /// </summary>
        public void ComputeGlobalResonance()
        {
            if (birthProfile == null)
            {
                globalResonance = 0.5f;
                return;
            }

            float aff = birthProfile.cosmoChannelAffinity;

            // Можно расширить расчет, учитывая активированные чакры, уровни, и т.п.
            foreach (var ch in channels)
            {
                // Чем выше предрасположенность, тем выше резонанс
                ch.resonance = 0.3f + aff * 0.7f;
            }

            // Среднее значение резонанса по каналам
            float totalResonance = 0f;
            foreach (var ch in channels)
            {
                totalResonance += ch.resonance;
            }
            globalResonance = totalResonance / channels.Count;
        }

        /// <summary>
        /// Получить уровень резонанса конкретного канала по его ID
        /// </summary>
        public float GetChannelResonance(string channelId)
        {
            var channel = channels.Find(c => c.id == channelId);
            if (channel != null)
                return channel.resonance;
            return 0f;
        }
    }
}
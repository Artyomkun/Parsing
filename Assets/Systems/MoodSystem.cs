using System;
using System.Collections.Generic;
using UnityEngine;

namespace RealLife5D.Systems
{
    [Serializable]
    public class MoodState
    {
        public enum EmotionType
        {
            Neutral = 0,
            Calm = 1,
            Love = 2,
            Happy = 3,
            Anxious = 4,
            Angry = 5,
            Sad = 6,
            Stressed = 7
        }

        public EmotionType CurrentEmotion { get; set; }
        public float Intensity { get; set; }

        public MoodState(EmotionType emotion = EmotionType.Neutral, float intensity = 0.5f)
        {
            CurrentEmotion = emotion;
            Intensity = intensity;
        }

        public static explicit operator int(MoodState moodState)
        {
            return (int)moodState.CurrentEmotion;
        }
    }

    public class MoodSystem : MonoBehaviour
    {
        [Header("Mood (0..1)")]
        public float calm;     // Спокойствие
        public float love;     // Любовь/сострадание
        public float joy;      // Радость
        public float fear;     // Страх
        public float anger;    // Злость
        public float sadness;  // Печаль
        public float stress;   // Стресс

        [Header("Decay per minute")]
        public float positiveDecay = 0.1f;
        public float negativeDecay = 0.05f;

        [Header("Psychological Profile (0..1)")]
        public float resilience = 0.5f;     // Психологическая устойчивость
        public float empathy = 0.5f;        // Эмпатия/сострадание
        public float discipline = 0.5f;     // Самодисциплина
        public float spirituality = 0.5f;   // Духовность/устремленность

        void Update()
        {
            float dt = Time.deltaTime / 60f; // за минуту
            // Естественная релаксация: положительные состояния медленно снижаются, негативные тоже
            calm = Mathf.Max(0f, calm - positiveDecay * dt);
            love = Mathf.Max(0f, love - positiveDecay * dt);
            joy = Mathf.Max(0f, joy - positiveDecay * dt);
            fear = Mathf.Max(0f, fear - negativeDecay * dt);
            anger = Mathf.Max(0f, anger - negativeDecay * dt);
            sadness = Mathf.Max(0f, sadness - negativeDecay * dt);
            stress = Mathf.Max(0f, stress - negativeDecay * dt);
        }

        public void AddCalm(float v)    { calm = Mathf.Clamp01(calm + v); }
        public void AddLove(float v)    { love = Mathf.Clamp01(love + v); }
        public void AddJoy(float v)     { joy = Mathf.Clamp01(joy + v); }
        public void AddFear(float v)    { fear = Mathf.Clamp01(fear + v); }
        public void AddAnger(float v)   { anger = Mathf.Clamp01(anger + v); }
        public void AddSadness(float v) { sadness = Mathf.Clamp01(sadness + v); }
        public void AddStress(float v)  { stress = Mathf.Clamp01(stress + v); }

        public float GetWellbeingIndex()
        {
            float positives = (calm + love + joy) / 3f;
            float negatives = (fear + anger + sadness + stress) / 4f;
            float raw = positives - negatives;
            raw += (resilience - 0.5f) * 0.3f; // устойчивость сглаживает негатив
            return Mathf.Clamp(raw, -1f, 1f);
        }

        public void ApplyMeditationBoost()
        {
            AddCalm(0.2f);
            AddLove(0.1f);
            AddJoy(0.05f);
            AddStress(-0.2f);
            AddFear(-0.1f);
        }

        public void ApplyHelpOthersBoost()
        {
            AddLove(0.15f);
            AddJoy(0.1f);
            AddStress(-0.05f);
            empathy = Mathf.Clamp01(empathy + 0.01f);
        }

        public void ApplyDamageShock(float damage)
        {
            float f = Mathf.Clamp01(damage / 100f);
            AddStress(0.2f * f);
            AddFear(0.15f * f);
            AddCalm(-0.1f * f);
        }

        public void ApplyStagnationPenalty()
        {
            AddJoy(-0.1f);
            AddLove(-0.1f);
            AddSadness(0.1f);
            AddStress(0.1f);
        }

        public MoodState GetCurrentMoodState()
        {
            // Определяем доминирующую эмоцию на основе текущих значений
            float[] emotions = { calm, love, joy, fear, anger, sadness, stress };
            int maxIndex = 0;
            float maxValue = emotions[0];
            
            for (int i = 1; i < emotions.Length; i++)
            {
                if (emotions[i] > maxValue)
                {
                    maxValue = emotions[i];
                    maxIndex = i;
                }
            }
            
            // Преобразуем индекс в соответствующий тип эмоции
            MoodState.EmotionType emotionType = (MoodState.EmotionType)(maxIndex + 1);
            
            // Если все эмоции близки к нулю, возвращаем нейтральное состояние
            if (maxValue < 0.1f)
            {
                emotionType = MoodState.EmotionType.Neutral;
                maxValue = 0f;
            }
            
            return new MoodState(emotionType, maxValue);
        }

        public bool HasActiveMoodEffects()
        {
            // Проверяем, есть ли активные эмоции выше порогового значения
            return calm > 0.2f || love > 0.2f || joy > 0.2f || 
                   fear > 0.2f || anger > 0.2f || sadness > 0.2f || stress > 0.2f;
        }

        internal IEnumerable<object> GetActiveMoodEffects()
        {
            // Возвращаем список активных эмоций
            List<object> activeEffects = new List<object>();
            
            if (calm > 0.2f) activeEffects.Add(new { Type = "Calm", Value = calm });
            if (love > 0.2f) activeEffects.Add(new { Type = "Love", Value = love });
            if (joy > 0.2f) activeEffects.Add(new { Type = "Joy", Value = joy });
            if (fear > 0.2f) activeEffects.Add(new { Type = "Fear", Value = fear });
            if (anger > 0.2f) activeEffects.Add(new { Type = "Anger", Value = anger });
            if (sadness > 0.2f) activeEffects.Add(new { Type = "Sadness", Value = sadness });
            if (stress > 0.2f) activeEffects.Add(new { Type = "Stress", Value = stress });
            
            return activeEffects;
        }
    }
}
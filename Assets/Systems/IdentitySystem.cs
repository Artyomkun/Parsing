using UnityEngine;
using System;
using System.Collections.Generic;

namespace RealLife5D.Systems
{
    public enum GenderIdentity
    {
        Male,
        Female,
        NonBinary,
        Agender,
        Bigender,
        Genderfluid,
        Other
    }

    public enum RelationshipType
    {
        Single,
        Monogamous,
        Polyamorous,
        Aromantic,
        Asexual,
        OpenRelationship,
        CivilUnion,
        Marriage
    }

    public enum Religion
    {
        Atheism,
        Agnosticism,
        Christianity,
        Islam,
        Judaism,
        Buddhism,
        Hinduism,
        Sikhism,
        Taoism,
        Shinto,
        Paganism,
        Other
    }

    [System.Serializable]
    public class Personality
    {
        public float openness = 0.5f;
        public float conscientiousness = 0.5f;
        public float extraversion = 0.5f;
        public float agreeableness = 0.5f;
        public float neuroticism = 0.5f;

        public List<string> biases = new List<string>(); // предубеждения
    }

    public class IdentitySystem : MonoBehaviour
    {
        [Header("Identity")]
        public string playerName = "Новый игрок";
        public GenderIdentity gender = GenderIdentity.Other;
        public RelationshipType relationship = RelationshipType.Single;
        public Religion religion = Religion.Other;
        public Personality personality = new();

        // Делегат для запроса подтверждения
        public delegate void ChangeRequest<T>(T newValue, Action<bool> onConfirm);

        // Запрос изменения с подтверждением (UI или логика)
        public void RequestChangeGender(GenderIdentity newGender, Action<bool> onConfirm)
        {
            // Здесь можно вызвать UI диалог
            ShowConfirmationDialog($"Вы действительно хотите изменить пол на {newGender}?", (confirmed) =>
            {
                if (confirmed)
                {
                    gender = newGender;
                }
                onConfirm?.Invoke(confirmed);
            });
        }

        public void RequestChangeReligion(Religion newReligion, Action<bool> onConfirm)
        {
            ShowConfirmationDialog($"Вы действительно хотите изменить религию на {newReligion}?", (confirmed) =>
            {
                if (confirmed)
                {
                    religion = newReligion;
                }
                onConfirm?.Invoke(confirmed);
            });
        }

        public void RequestChangeRelationship(RelationshipType newType, Action<bool> onConfirm)
        {
            ShowConfirmationDialog($"Вы действительно хотите изменить тип отношений на {newType}?", (confirmed) =>
            {
                if (confirmed)
                {
                    relationship = newType;
                }
                onConfirm?.Invoke(confirmed);
            });
        }

        // Временная заглушка для диалога подтверждения
        private void ShowConfirmationDialog(string message, Action<bool> callback)
        {
            // Здесь интеграция с UI, например, вызов окна подтверждения
            Debug.Log(message);
            // Для теста по умолчанию подтверждаем
            callback?.Invoke(true);
        }
    }
}
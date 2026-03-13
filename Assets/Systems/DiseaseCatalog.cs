using UnityEngine;
using System.Collections.Generic;

namespace RealLife5D.Systems
{
    [System.Serializable]
    public class DiseaseEntry
    {
        public string id;
        public string name;
        public string type; // Physical/Mental/Psychological/Spiritual/Astral
        public string description;
        public string[] symptoms;
    }

    [System.Serializable]
    public class DiseaseCatalogData
    {
        public DiseaseEntry[] diseases;
    }

    public class DiseaseCatalog : MonoBehaviour
    {
        public TextAsset catalogJson; // Назначьте через инспектор или загрузите из ресурсов
        public List<DiseaseEntry> entries = new List<DiseaseEntry>();

        void Awake()
        {
            Load();
        }

        public void Load()
        {
            entries.Clear();

            if (catalogJson == null)
            {
                Debug.LogWarning("DiseaseCatalog: catalogJson not assigned. Attempting to load from Resources...");
                // Попытка загрузки из Resources
                catalogJson = Resources.Load<TextAsset>("DiseaseCatalog");
                if (catalogJson == null)
                {
                    Debug.LogWarning("DiseaseCatalog: Не удалось загрузить JSON из ресурсов");
                    return;
                }
            }

            try
            {
                var data = JsonUtility.FromJson<DiseaseCatalogData>(catalogJson.text);
                if (data?.diseases != null)
                {
                    entries.AddRange(data.diseases);
                    Debug.Log($"Загружено {entries.Count} болезней");
                }
                else
                {
                    Debug.LogWarning("DiseaseCatalog: Не найдено данных болезней");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"DiseaseCatalog: Ошибка парсинга JSON: {e.Message}");
            }
        }

        public DiseaseEntry FindById(string id)
        {
            return entries.Find(e => e.id == id);
        }

        // Возможен метод поиска по типу или другим критериям
        public List<DiseaseEntry> FindByType(string type)
        {
            return entries.FindAll(e => e.type == type);
        }
    }
}
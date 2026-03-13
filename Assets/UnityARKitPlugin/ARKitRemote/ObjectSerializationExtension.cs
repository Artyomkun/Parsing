using UnityEngine;
using System;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

namespace Utils
{
    // Расширения для сериализации/десериализации объектов
    // Объекты, которые сериализуются, должны иметь атрибут [Serializable]
    public static class ObjectSerializationExtension
    {
        /// <summary>
        /// Сериализация объекта в байтовый массив.
        /// </summary>
        /// <param name="obj">Объект для сериализации</param>
        /// <returns>Массив байтов или null при ошибке</returns>
        public static byte[] SerializeToByteArray(this object obj)
        {
            if (obj == null)
            {
                Debug.LogWarning("SerializeToByteArray: Объект равен null");
                return null;
            }

            try
            {
                var formatter = new BinaryFormatter();
                using (var ms = new MemoryStream())
                {
                    formatter.Serialize(ms, obj);
                    return ms.ToArray();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Ошибка сериализации: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Десериализация байтового массива в объект типа T.
        /// </summary>
        /// <typeparam name="T">Тип объекта для десериализации</typeparam>
        /// <param name="byteArray">Массив байтов</param>
        /// <returns>Объект типа T или null при ошибке</returns>
        public static T Deserialize<T>(this byte[] byteArray) where T : class
        {
            if (byteArray == null || byteArray.Length == 0)
            {
                Debug.LogWarning("Deserialize: Байтовый массив пуст или null");
                return null;
            }

            try
            {
                using (var memStream = new MemoryStream())
                {
                    memStream.Write(byteArray, 0, byteArray.Length);
                    memStream.Seek(0, SeekOrigin.Begin);
                    var formatter = new BinaryFormatter();
                    var obj = formatter.Deserialize(memStream) as T;
                    if (obj == null)
                    {
                        Debug.LogWarning("Deserialize: Не удалось привести объект к типу " + typeof(T).Name);
                    }
                    return obj;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Ошибка десериализации: {e.Message}");
                return null;
            }
        }
    }
}
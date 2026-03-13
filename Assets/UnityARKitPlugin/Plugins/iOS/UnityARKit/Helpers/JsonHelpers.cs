using Newtonsoft.Json;
using UnityEngine;

namespace Unity.Services.Relay.Http
{
    internal static class JsonHelpers
    {
        public static string ToJson(object obj)
        {
            try
            {
                return JsonConvert.SerializeObject(obj);
            }
            catch (JsonException ex)
            {
                Debug.LogError($"JSON serialization failed: {ex.Message}");
                return null;
            }
        }

        public static T FromJson<T>(string json)
        {
            try
            {
                return JsonConvert.DeserializeObject<T>(json);
            }
            catch (JsonException ex)
            {
                Debug.LogError($"JSON deserialization failed: {ex.Message}");
                return default;
            }
        }
    }
}
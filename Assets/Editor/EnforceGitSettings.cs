#if UNITY_EDITOR
using UnityEditor;
#if UNITY_2022_1_OR_NEWER
using UnityEditor.VersionControl;
#endif

public static class EnforceGitSettings
{
    [MenuItem("Tools/Project/Enforce Git Settings")]
    public static void Apply()
    {
        // Сериализация ассетов в текст
        EditorSettings.serializationMode = SerializationMode.ForceText;

        // Видимые .meta через актуальный API
        #if UNITY_2022_1_OR_NEWER
        VersionControlSettings.mode = "Visible Meta Files";
        #else
        EditorSettings.externalVersionControl = "Visible Meta Files";
        #endif

        AssetDatabase.SaveAssets();
        EditorUtility.DisplayDialog("Done", "Force Text + Visible Meta Files включены", "OK");
    }
}
#endif
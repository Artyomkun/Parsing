#if UNITY_EDITOR
using UnityEditor;
using System;
using System.Reflection;

public static class InputHandlingSwitch
{
    [MenuItem("Tools/Project/Input Handling/Both")]
    public static void UseBoth() => SetBoth();

    static void SetBoth()
    {
        var psType = typeof(PlayerSettings);

        // Пытаемся установить новое свойство через reflection (если есть)
        var prop = psType.GetProperty("activeInputHandling", BindingFlags.Public | BindingFlags.Static);
        if (prop != null && prop.CanWrite && prop.PropertyType.IsEnum)
        {
            var both = Enum.Parse(prop.PropertyType, "Both");
            prop.SetValue(null, both, null);
        }
        else
        {
            // Легаси-метод через reflection (без obsolete warning)
            var setPropInt = psType.GetMethod("SetPropertyInt", BindingFlags.Public | BindingFlags.Static);
            if (setPropInt != null)
            {
                setPropInt.Invoke(null, new object[] { "activeInputHandler", 2, BuildTargetGroup.Standalone });
                setPropInt.Invoke(null, new object[] { "activeInputHandler", 2, BuildTargetGroup.Android });
                setPropInt.Invoke(null, new object[] { "activeInputHandler", 2, BuildTargetGroup.iOS });
            }
        }

        AssetDatabase.SaveAssets();
        EditorUtility.DisplayDialog("Input Handling", "Set to BOTH", "OK");
    }
}
#endif
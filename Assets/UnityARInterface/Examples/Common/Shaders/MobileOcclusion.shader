Shader "Custom/MobileOcclusion"
{
    SubShader 
    {
        Tags { 
            "Queue" = "Geometry-1"  // Рендерим перед всей геометрией
            "RenderType" = "Opaque"
            "ForceNoShadowCasting" = "True"
        }
        
        Pass 
        {
            Name "OCCLUSION"
            
            // Настройки глубины
            ZWrite On
            ZTest LEqual
            
            // Отключаем запись цвета для максимальной производительности
            ColorMask 0
            Cull Back
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 2.0  // Для лучшей мобильной совместимости
            
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID  // Для GPU Instancing
            };

            struct v2f
            {
                float4 position : SV_POSITION;
                UNITY_VERTEX_OUTPUT_STEREO  // Для VR/AR стерео рендеринга
            };

            v2f vert (appdata input)
            {
                v2f output;
                
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                
                output.position = UnityObjectToClipPos(input.vertex);
                return output;
            }

            fixed4 frag (v2f input) : SV_Target
            {
                // ColorMask 0 уже отключает запись цвета,
                // но возвращаем 0 для безопасности
                return fixed4(0, 0, 0, 0);
            }
            ENDCG
        }
    }
    
    // Fallback для случаев, когда шейдер не поддерживается
    Fallback Off
}
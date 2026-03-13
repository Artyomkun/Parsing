Shader "Custom/MobileARShadow"
{
    SubShader 
    {
        Tags { 
            "Queue" = "Transparent+1" 
            "RenderType" = "Transparent"
            "IgnoreProjector" = "True"
        }
        LOD 150
        
        Pass 
        {
            Tags { 
                "LightMode" = "ForwardBase"
            }
            
            Blend Zero SrcColor
            ZWrite Off  // Для теней обычно ZWrite Off
            ZTest LEqual
            Cull Back
            ColorMask RGB  // Улучшает производительность
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fwdbase nolightmap nodynlightmap novertexlight
            #pragma target 2.0  // Лучшая мобильная совместимость

            #include "UnityCG.cginc"
            #include "AutoLight.cginc"

            struct v2f
            {
                float4 pos : SV_POSITION;
                SHADOW_COORDS(0)  // Современный макрос для теней
            };

            v2f vert(appdata_base v) 
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                TRANSFER_SHADOW(o)  // Обновленный макрос передачи теней
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                fixed shadow = SHADOW_ATTENUATION(i);  // Современный макрос теней
                return fixed4(1,1,1,1) * shadow;
            }
            ENDCG
        }
        
        // Добавляем пасс для отбрасывания теней (опционально)
        Pass
        {
            Name "ShadowCaster"
            Tags{"LightMode" = "ShadowCaster"}
            
            ZWrite On
            ZTest LEqual
            ColorMask 0  // Только глубина, без цвета
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 2.0
            #pragma multi_compile_shadowcaster
            
            #include "UnityCG.cginc"

            struct v2f 
            {
                V2F_SHADOW_CASTER;
            };

            v2f vert(appdata_base v)
            {
                v2f o;
                TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
                return o;
            }

            float4 frag(v2f i) : SV_Target
            {
                SHADOW_CASTER_FRAGMENT(i)
            }
            ENDCG
        }
    }
    
    Fallback "Mobile/VertexLit"
}
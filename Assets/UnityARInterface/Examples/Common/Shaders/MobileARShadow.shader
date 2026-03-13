Shader "Custom/MobileARShadow"
{
    SubShader 
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent+1" }
        LOD 150
        
        // Убрано "ForceNoShadowCasting"="True" - это противоречит цели шейдера
        Pass 
        {
            Tags { 
                "LightMode" = "ForwardBase" 
            }
            
            Blend Zero SrcColor
            ZWrite Off  // Для теней обычно ZWrite Off
            Cull Back
            ColorMask RGB
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fwdbase nolightmap nodynlightmap novertexlight
            #pragma target 2.0

            #include "UnityCG.cginc"
            #include "AutoLight.cginc"

            struct v2f
            {
                float4 pos : SV_POSITION;
                SHADOW_COORDS(0)  // Более современный макрос
            };

            v2f vert(appdata_base v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                TRANSFER_SHADOW(o)  // Обновленный макрос
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                fixed shadow = SHADOW_ATTENUATION(i);
                return fixed4(1,1,1,1) * shadow;
            }
            ENDCG
        }
        
        // Добавляем pass для теней (опционально)
        Pass
        {
            Name "ShadowCaster"
            Tags{"LightMode" = "ShadowCaster"}
            
            ZWrite On
            ZTest LEqual
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 2.0
            #pragma multi_compile_shadowcaster
            
            #include "UnityCG.cginc"

            struct v2f {
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
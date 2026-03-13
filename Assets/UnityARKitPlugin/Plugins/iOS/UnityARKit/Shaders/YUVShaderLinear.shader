Shader "Unlit/ARCameraShader(Linear)"
{
    Properties
    {
        _textureY ("TextureY", 2D) = "white" {}
        _textureCbCr ("TextureCbCr", 2D) = "black" {}
        _GammaCorrection ("Gamma Correction", Float) = 2.2
    }
    
    SubShader
    {
        Tags { 
            "RenderType" = "Opaque" 
            "Queue" = "Background"
            "PreviewType" = "Plane"
        }
        LOD 100
        
        Cull Off
        ZWrite Off
        ZTest Always

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 3.0
            
            #include "UnityCG.cginc"
            #include "UnityCG.cginc"

            float4x4 _DisplayTransform;
            sampler2D _textureY;
            sampler2D _textureCbCr;
            float _GammaCorrection;

            struct VertexInput
            {
                float4 vertex : POSITION;
                float2 texcoord : TEXCOORD0;
            };

            struct VertexOutput
            {
                float4 position : SV_POSITION;
                float2 texcoord : TEXCOORD0;
            };

            VertexOutput vert (VertexInput input)
            {
                VertexOutput output;
                output.position = UnityObjectToClipPos(input.vertex);

                // Более читаемое преобразование UV
                float2 uv = input.texcoord;
                output.texcoord = mul((float3x3)_DisplayTransform, float3(uv, 1.0)).xy;
                
                return output;
            }

            // Правильная матрица преобразования YCbCr to RGB (BT.709 для HD)
            static const float3x3 ycbcrToRGBTransform = 
            {
                1.164384,  0.000000,  1.792741,  // R
                1.164384, -0.213249, -0.532909,  // G
                1.164384,  2.112402,  0.000000   // B
            };

            // Функция для правильного гамма-преобразования
            float3 ApplyGammaCorrection(float3 color, float gamma)
            {
                return pow(color, gamma);
            }

            // Функция преобразования YCbCr в линейный RGB
            float3 YCbCrToLinearRGB(float y, float2 cbcr)
            {
                // Нормализация значений YCbCr
                y = (y - 0.0625) * 1.164384;
                cbcr = cbcr - 0.5;
                
                // Преобразование в RGB
                float3 ycbcr = float3(y, cbcr);
                float3 linearRGB = mul(ycbcrToRGBTransform, ycbcr);
                
                return linearRGB;
            }

            fixed4 frag (VertexOutput input) : SV_Target
            {
                // Проверка на валидность UV координат
                if (any(input.texcoord < 0) || any(input.texcoord > 1))
                    return fixed4(0, 0, 0, 1);

                // Чтение текстур Y и CbCr
                float y = tex2D(_textureY, input.texcoord).r;
                float2 cbcr = tex2D(_textureCbCr, input.texcoord).rg;

                // Преобразование YCbCr в линейный RGB
                float3 linearRGB = YCbCrToLinearRGB(y, cbcr);

                // Применяем гамма-коррекцию для перехода в нелинейное пространство
                // (если нужно отображать в гамма-пространстве)
                #if !defined(UNITY_COLORSPACE_GAMMA)
                linearRGB = ApplyGammaCorrection(linearRGB, 1.0/_GammaCorrection);
                #endif

                return fixed4(linearRGB, 1.0);
            }
            ENDCG
        }
    }
    
    Fallback Off
}
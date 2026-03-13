using System;
using UnityEngine;
using UnityEngine.XR.iOS;
using System.Text;

namespace Utils
{
    [Serializable]
    public class SerializableVector4
    {
        public float x, y, z, w;

        public SerializableVector4(Vector4 vector4)
        {
        }


        public SerializableVector4(float rX, float rY, float rZ, float rW)
        {
            x = rX;
            y = rY;
            z = rZ;
            w = rW;
        }

        public override string ToString()
        {
            return $"[{x}, {y}, {z}, {w}]";
        }

        public static implicit operator Vector4(SerializableVector4 rValue)
        {
            return new Vector4(rValue.x, rValue.y, rValue.z, rValue.w);
        }

        public static implicit operator SerializableVector4(Vector4 rValue)
        {
            return new SerializableVector4(rValue.x, rValue.y, rValue.z, rValue.w);
        }
    }

    [Serializable]
    public class serializableUnityARMatrix4x4
    {
        public SerializableVector4 column0;
        public SerializableVector4 column1;
        public SerializableVector4 column2;
        public SerializableVector4 column3;

        public serializableUnityARMatrix4x4(SerializableVector4 v0, SerializableVector4 v1, SerializableVector4 v2, SerializableVector4 v3)
        {
            column0 = v0;
            column1 = v1;
            column2 = v2;
            column3 = v3;
        }

        public static implicit operator serializableUnityARMatrix4x4(UnityARMatrix4x4 rValue)
        {
            return new serializableUnityARMatrix4x4(rValue.column0, rValue.column1, rValue.column2, rValue.column3);
        }

        public static implicit operator UnityARMatrix4x4(serializableUnityARMatrix4x4 rValue)
        {
            return new UnityARMatrix4x4(rValue.column0, rValue.column1, rValue.column2, rValue.column3);
        }

        public static implicit operator serializableUnityARMatrix4x4(Matrix4x4 rValue)
        {
            return new serializableUnityARMatrix4x4(
                new SerializableVector4(rValue.GetColumn(0)),
                new SerializableVector4(rValue.GetColumn(1)),
                new SerializableVector4(rValue.GetColumn(2)),
                new SerializableVector4(rValue.GetColumn(3))
            );
        }

        public static implicit operator Matrix4x4(serializableUnityARMatrix4x4 rValue)
        {
            Matrix4x4 mRet = new();
            mRet.SetColumn(0, rValue.column0);
            mRet.SetColumn(1, rValue.column1);
            mRet.SetColumn(2, rValue.column2);
            mRet.SetColumn(3, rValue.column3);
            return mRet;
        }
    }

    [Serializable]
    public class SerializableSHC
    {
        public byte[] shcData;

        public SerializableSHC(byte[] inputSHCData)
        {
            shcData = inputSHCData;
        }

        public static implicit operator SerializableSHC(float[] floatsSHC)
        {
            if (floatsSHC == null) return new SerializableSHC(null);
            byte[] createBuf = new byte[floatsSHC.Length * sizeof(float)];
            for (int i = 0; i < floatsSHC.Length; i++)
            {
                Buffer.BlockCopy(BitConverter.GetBytes(floatsSHC[i]), 0, createBuf, i * sizeof(float), count: sizeof(float));
            }
            return new SerializableSHC(createBuf);
        }

        public static implicit operator float[](SerializableSHC spc)
        {
            if (spc.shcData == null) return null;
            int numFloats = spc.shcData.Length / sizeof(float);
            float[] shcFloats = new float[numFloats];
            for (int i = 0; i < numFloats; i++)
            {
                shcFloats[i] = BitConverter.ToSingle(spc.shcData, i * sizeof(float));
            }
            return shcFloats;
        }
    }

    [Serializable]
    public class serializableUnityARLightData
    {
        public LightDataType whichLight;
        public SerializableSHC lightSHC;
        public SerializableVector4 primaryLightDirAndIntensity;
        public float ambientIntensity;
        public float ambientColorTemperature;

        public serializableUnityARLightData(UnityARLightData lightData)
        {
            whichLight = lightData.arLightingType;
            if (whichLight == LightDataType.DirectionalLightEstimate)
            {
                lightSHC = lightData.arDirectonalLightEstimate.sphericalHarmonicsCoefficients;
                Vector3 lightDir = lightData.arDirectonalLightEstimate.primaryLightDirection;
                float lightIntensity = lightData.arDirectonalLightEstimate.primaryLightIntensity;
                primaryLightDirAndIntensity = new SerializableVector4(lightDir.x, lightDir.y, lightDir.z, lightIntensity);
            }
            else
            {
                ambientIntensity = lightData.arLightEstimate.ambientIntensity;
                ambientColorTemperature = lightData.arLightEstimate.ambientColorTemperature;
            }
        }

        public static implicit operator serializableUnityARLightData(UnityARLightData rValue)
        {
            return new serializableUnityARLightData(rValue);
        }

        public static implicit operator UnityARLightData(serializableUnityARLightData rValue)
        {
            UnityARDirectionalLightEstimate udle = null;
            UnityARLightEstimate ule = new(rValue.ambientIntensity, rValue.ambientColorTemperature);

            if (rValue.whichLight == LightDataType.DirectionalLightEstimate)
            {
                Vector3 lightDir = new(rValue.primaryLightDirAndIntensity.x, rValue.primaryLightDirAndIntensity.y, rValue.primaryLightDirAndIntensity.z);
                float intensity = rValue.primaryLightDirAndIntensity.w;
                udle = new UnityARDirectionalLightEstimate(rValue.lightSHC, lightDir, intensity);
            }

            return new UnityARLightData(rValue.whichLight, ule, udle);
        }
    }

    [Serializable]
    public class SerializableUnityARCamera
    {
        public serializableUnityARMatrix4x4 worldTransform;
        public serializableUnityARMatrix4x4 projectionMatrix;
        public ARTrackingState trackingState;
        public ARTrackingStateReason trackingReason;
        public UnityVideoParams videoParams;
        public serializableUnityARLightData lightData;
        public SerializablePointCloud pointCloud;
        public serializableUnityARMatrix4x4 displayTransform;

        public SerializableUnityARCamera(
            serializableUnityARMatrix4x4 wt,
            serializableUnityARMatrix4x4 pm,
            ARTrackingState ats,
            ARTrackingStateReason atsr,
            UnityVideoParams uvp,
            UnityARLightData lightDat,
            serializableUnityARMatrix4x4 dt,
            SerializablePointCloud spc)
        {
            worldTransform = wt;
            projectionMatrix = pm;
            trackingState = ats;
            trackingReason = atsr;
            videoParams = uvp;
            lightData = lightDat;
            displayTransform = dt;
            pointCloud = spc;
        }

        public static implicit operator SerializableUnityARCamera(UnityARCamera rValue)
        {
            return new SerializableUnityARCamera(
                rValue.worldTransform,
                rValue.projectionMatrix,
                rValue.trackingState,
                rValue.trackingReason,
                rValue.videoParams,
                rValue.lightData,
                rValue.displayTransform,
                rValue.pointCloudData
            );
        }

        public static implicit operator UnityARCamera(SerializableUnityARCamera rValue)
        {
            return new UnityARCamera(
                rValue.worldTransform,
                rValue.projectionMatrix,
                rValue.trackingState,
                rValue.trackingReason,
                rValue.videoParams,
                rValue.lightData,
                rValue.displayTransform,
                rValue.pointCloud
            );
        }
    }

    [Serializable]
    public class SerializableUnityARPlaneAnchor
    {
        public serializableUnityARMatrix4x4 worldTransform;
        public SerializableVector4 center;
        public SerializableVector4 extent;
        public ARPlaneAnchorAlignment planeAlignment;
        public byte[] identifierStr;

        public SerializableUnityARPlaneAnchor(
            serializableUnityARMatrix4x4 wt,
            SerializableVector4 ctr,
            SerializableVector4 ext,
            ARPlaneAnchorAlignment apaa,
            byte[] idstr)
        {
            worldTransform = wt;
            center = ctr;
            extent = ext;
            planeAlignment = apaa;
            identifierStr = idstr;
        }

        public static implicit operator SerializableUnityARPlaneAnchor(ARPlaneAnchor rValue)
        {
            var wt = rValue.transform;
            var ctr = new SerializableVector4(rValue.center.x, rValue.center.y, rValue.center.z, 1.0f);
            var ext = new SerializableVector4(rValue.extent.x, rValue.extent.y, rValue.extent.z, 1.0f);
            var idstr = Encoding.UTF8.GetBytes(rValue.identifier);
            return new SerializableUnityARPlaneAnchor(wt, ctr, ext, rValue.alignment, idstr);
        }

        public static implicit operator ARPlaneAnchor(SerializableUnityARPlaneAnchor rValue)
        {
            var retValue = new ARPlaneAnchor();
            retValue.transform = rValue.worldTransform;
            retValue.center = new Vector3(rValue.center.x, rValue.center.y, rValue.center.z);
            retValue.extent = new Vector3(rValue.extent.x, rValue.extent.y, rValue.extent.z);
            retValue.alignment = rValue.planeAlignment;
            retValue.identifier = Encoding.UTF8.GetString(rValue.identifierStr);
            return retValue;
        }
    }

    [Serializable]
    public class SerializablePointCloud
    {
        public byte[] pointCloudData;

        public SerializablePointCloud(byte[] inputPoints)
        {
            pointCloudData = inputPoints;
        }

        public static implicit operator SerializablePointCloud(Vector3[] vecPointCloud)
        {
            if (vecPointCloud == null) return new SerializablePointCloud(null);
            byte[] createBuf = new byte[vecPointCloud.Length * 3 * sizeof(float)];
            for (int i = 0; i < vecPointCloud.Length; i++)
            {
                int offset = i * 3 * sizeof(float);
                Buffer.BlockCopy(BitConverter.GetBytes(vecPointCloud[i].x), 0, createBuf, offset, sizeof(float));
                Buffer.BlockCopy(BitConverter.GetBytes(vecPointCloud[i].y), 0, createBuf, offset + sizeof(float), sizeof(float));
                Buffer.BlockCopy(BitConverter.GetBytes(vecPointCloud[i].z), 0, createBuf, offset + 2 * sizeof(float), sizeof(float));
            }
            return new SerializablePointCloud(createBuf);
        }

        public static implicit operator Vector3[](SerializablePointCloud spc)
        {
            if (spc.pointCloudData == null) return null;
            int numVectors = spc.pointCloudData.Length / (3 * sizeof(float));
            Vector3[] points = new Vector3[numVectors];
            for (int i = 0; i < numVectors; i++)
            {
                int offset = i * 3 * sizeof(float);
                points[i].x = BitConverter.ToSingle(spc.pointCloudData, offset);
                points[i].y = BitConverter.ToSingle(spc.pointCloudData, offset + sizeof(float));
                points[i].z = BitConverter.ToSingle(spc.pointCloudData, offset + 2 * sizeof(float));
            }
            return points;
        }
    }

    [Serializable]
    public class SerializableARSessionConfiguration
    {
        public UnityARAlignment alignment;
        public UnityARPlaneDetection planeDetection;
        public bool getPointCloudData;
        public bool enableLightEstimation;

        public SerializableARSessionConfiguration(UnityARAlignment align, UnityARPlaneDetection planeDet, bool getPtCloud, bool enableLightEst)
        {
            alignment = align;
            planeDetection = planeDet;
            getPointCloudData = getPtCloud;
            enableLightEstimation = enableLightEst;
        }

        public static implicit operator SerializableARSessionConfiguration(ARKitWorldTrackingSessionConfiguration awtsc)
        {
            return new SerializableARSessionConfiguration(awtsc.alignment, awtsc.planeDetection, awtsc.getPointCloudData, awtsc.enableLightEstimation);
        }

        public static implicit operator ARKitWorldTrackingSessionConfiguration(SerializableARSessionConfiguration sasc)
        {
            return new ARKitWorldTrackingSessionConfiguration(sasc.alignment, sasc.planeDetection, sasc.getPointCloudData, sasc.enableLightEstimation);
        }
    }

    [Serializable]
    public class serializableARKitInit
    {
        public SerializableARSessionConfiguration config;
        public UnityARSessionRunOption runOption;

        public serializableARKitInit(SerializableARSessionConfiguration cfg, UnityARSessionRunOption option)
        {
            config = cfg;
            runOption = option;
        }
    }

    [Serializable]
    public class serializableFromEditorMessage
    {
        public Guid subMessageId;
        public serializableARKitInit arkitConfigMsg;
    }
}
using UnityEngine;
using TMPro;
using RealLife5D.Systems;
using RealLife5D.Player;
using RealLife5D.Core;
using System;
using System.Collections.Generic;

namespace RealLife5D.UI
{
    public class MinimalHealthUI : MonoBehaviour
    {
        [Header("Health Display")]
        public GameObject healthBar;
        public TextMeshProUGUI healthText;
        
        [Header("Temperature Display")]
        public TextMeshProUGUI temperatureText;
        public GameObject temperatureIndicator;
        
        [Header("Status Effects")]
        public Transform statusEffectsContainer;
        public GameObject statusEffectPrefab;
        
        [Header("Colors")]
        public Color healthyColor = Color.green;
        public Color injuredColor = Color.yellow;
        public Color criticalColor = Color.red;
        public Color normalTempColor = Color.white;
        public Color feverTempColor = Color.red;
        public Color coldTempColor = Color.blue;
        
        private VRPlayerController player;
        private DiseaseSystem diseaseSystem;
        private MoodSystem moodSystem;
        private GameManager gameManager;

        // Store original scale for health bar
        private Vector3 originalHealthBarScale;

        [Obsolete]
        void Start()
        {
            FindPlayerAndSystems();
            
            // Store original health bar scale
            if (healthBar != null)
            {
                originalHealthBarScale = healthBar.transform.localScale;
            }
        }

        [Obsolete]

        void Update()
        {
            if (player == null)
            {
                FindPlayerAndSystems();
                return;
            }
            
            UpdateHealthDisplay();
            UpdateTemperatureDisplay();
            UpdateStatusEffects();
        }

        [Obsolete]
        private void FindPlayerAndSystems()
        {
            player = FindObjectOfType<VRPlayerController>();
            if (player != null)
            {
                gameManager = GameManager.Instance;
                if (gameManager != null)
                {
                    diseaseSystem = gameManager.GetComponent<DiseaseSystem>();
                    moodSystem = gameManager.GetComponent<MoodSystem>();
                }
            }
        }

        private void UpdateHealthDisplay()
        {
            if (player == null) return;
            
            float healthPercentage = player.GetHealthPercentage();
            
            // Update health bar scale
            if (healthBar != null)
            {
                Vector3 newScale = originalHealthBarScale;
                newScale.x = originalHealthBarScale.x * healthPercentage;
                healthBar.transform.localScale = newScale;
                
                // Change color based on health
                Renderer renderer = healthBar.GetComponent<Renderer>();
                if (renderer != null)
                {
                    if (healthPercentage > 0.7f)
                        renderer.material.color = healthyColor;
                    else if (healthPercentage > 0.3f)
                        renderer.material.color = injuredColor;
                    else
                        renderer.material.color = criticalColor;
                }
            }

            // Update health text
            if (healthText != null)
            {
                healthText.text = $"{Mathf.Round(healthPercentage * 100)}%";
            }
        }

        private void UpdateTemperatureDisplay()
        {
            if (temperatureText == null) return;
            
            // Get temperature from disease system if available
            float temperature = 36.6f; // Default value

            if (diseaseSystem != null)
            {
                // Replace with actual temperature method
                temperature = diseaseSystem.GetBodyTemperature();
            }

            temperatureText.text = $"{temperature:F1}°C";

            // Update temperature indicator color
            if (temperatureIndicator != null)
            {
                Renderer renderer = temperatureIndicator.GetComponent<Renderer>();
                if (renderer != null)
                {
                    if (temperature > 37.5f)
                    {
                        renderer.material.color = feverTempColor;
                    }
                    else if (temperature < 35.5f)
                    {
                        renderer.material.color = coldTempColor;
                    }
                    else
                    {
                        renderer.material.color = normalTempColor;
                    }
                }
            }
        }

        private void UpdateStatusEffects()
        {
            // Clear status effects container
            if (statusEffectsContainer != null)
            {
                foreach (Transform child in statusEffectsContainer)
                {
                    Destroy(child.gameObject);
                }
                
                // Add status effects if available
                if (diseaseSystem != null && diseaseSystem.HasActiveDiseases())
                {
                    // Assuming GetActiveDiseases returns a collection with Name and Severity properties
                    var activeDiseases = diseaseSystem.GetActiveDiseases();
                    foreach (var disease in activeDiseases)
                    {
                        GameObject statusEffect = Instantiate(statusEffectPrefab, statusEffectsContainer);
                        StatusEffectDisplay effectDisplay = statusEffect.GetComponent<StatusEffectDisplay>();
                        
                        // Use reflection or a known interface to get name and severity
                        string name = GetObjectProperty(disease, "Name") as string ?? "Unknown Disease";
                        float severity = Convert.ToSingle(GetObjectProperty(disease, "Severity") ?? 0.5f);
                        
                        effectDisplay?.Setup(name, severity);
                    }
                }
                
                // Add mood effects if available
                if (moodSystem != null && moodSystem.HasActiveMoodEffects())
                {
                    // Assuming GetActiveMoodEffects returns a collection with Name and Intensity properties
                    var activeMoodEffects = moodSystem.GetActiveMoodEffects();
                    foreach (var moodEffect in activeMoodEffects)
                    {
                        GameObject statusEffect = Instantiate(statusEffectPrefab, statusEffectsContainer);
                        StatusEffectDisplay effectDisplay = statusEffect.GetComponent<StatusEffectDisplay>();
                        
                        // Use reflection or a known interface to get name and intensity
                        string name = GetObjectProperty(moodEffect, "Name") as string ?? "Unknown Effect";
                        float intensity = Convert.ToSingle(GetObjectProperty(moodEffect, "Intensity") ?? 0.5f);
                        
                        effectDisplay?.Setup(name, intensity);
                    }
                }
            }
        }
        
        // Helper method to get property values via reflection
        private object GetObjectProperty(object obj, string propertyName)
        {
            if (obj == null) return null;
            
            var property = obj.GetType().GetProperty(propertyName);
            if (property != null && property.CanRead)
            {
                return property.GetValue(obj, null);
            }
            
            var field = obj.GetType().GetField(propertyName);
            if (field != null)
            {
                return field.GetValue(obj);
            }
            
            return null;
        }
        
        // Method for external temperature change events
        public void OnTemperatureChanged(float newTemperature)
        {
            if (temperatureText != null)
            {
                temperatureText.text = $"{newTemperature:F1}°C";
                
                // Update temperature indicator color
                if (temperatureIndicator != null)
                {
                    Renderer renderer = temperatureIndicator.GetComponent<Renderer>();
                    if (renderer != null)
                    {
                        if (newTemperature > 37.5f)
                        {
                            renderer.material.color = feverTempColor;
                        }
                        else if (newTemperature < 35.5f)
                        {
                            renderer.material.color = coldTempColor;
                        }
                        else
                        {
                            renderer.material.color = normalTempColor;
                        }
                    }
                }
            }
        }
        
        // Method for external health change events
        public void OnHealthChanged(float newHealthPercentage)
        {
            // Update health bar scale
            if (healthBar != null)
            {
                Vector3 newScale = originalHealthBarScale;
                newScale.x = originalHealthBarScale.x * newHealthPercentage;
                healthBar.transform.localScale = newScale;
                
                // Change color based on health
                Renderer renderer = healthBar.GetComponent<Renderer>();
                if (renderer != null)
                {
                    if (newHealthPercentage > 0.7f)
                        renderer.material.color = healthyColor;
                    else if (newHealthPercentage > 0.3f)
                        renderer.material.color = injuredColor;
                    else
                        renderer.material.color = criticalColor;
                }
            }

            // Update health text
            if (healthText != null)
            {
                healthText.text = $"{Mathf.Round(newHealthPercentage * 100)}%";
            }
        }
    }
    
    /// <summary>
    /// UI element for displaying status effects
    /// </summary>
    public class StatusEffectDisplay : MonoBehaviour
    {
        [Header("UI Elements")]
        public TextMeshProUGUI effectName;
        public GameObject effectSeverityBar;
        public GameObject effectIcon;
        
        // Store original scale for severity bar
        private Vector3 originalSeverityBarScale;
        
        void Start()
        {
            // Store original severity bar scale
            if (effectSeverityBar != null)
            {
                originalSeverityBarScale = effectSeverityBar.transform.localScale;
            }
        }
        
        public void Setup(string name, float severity)
        {
            if (effectName != null)
            {
                effectName.text = name;
            }
            
            // Update severity bar
            if (effectSeverityBar != null)
            {
                Vector3 newScale = originalSeverityBarScale;
                newScale.x = originalSeverityBarScale.x * severity;
                effectSeverityBar.transform.localScale = newScale;
                
                // Change color based on severity
                Renderer renderer = effectSeverityBar.GetComponent<Renderer>();
                if (renderer != null)
                {
                    if (severity > 0.7f)
                        renderer.material.color = Color.red;
                    else if (severity > 0.4f)
                        renderer.material.color = Color.yellow;
                    else
                        renderer.material.color = Color.blue;
                }
            }
        }
    }
}
using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using TMPro;
using System;
using RealLife5D.Systems; // Добавляем using директиву

#pragma warning disable CA1050 // Declare types in namespaces
public class VRUIManager : MonoBehaviour
#pragma warning restore CA1050 // Declare types in namespaces
{
    [Header("Health & Energy")]
    public Slider healthBar;
    public Slider energyBar;
    public GameObject energyContainer;
    
    [Header("Meditation")]
    public GameObject meditationPanel;
    public Slider meditationProgress;
    public TextMeshProUGUI meditationText;
    
    [Header("Chakra System")]
    public Transform chakraStatusContainer;
    public GameObject chakraIndicatorPrefab;
    
    [Header("Karma & Mood")]
    public Image karmaIndicator;
    public Image moodIndicator;
    public Sprite[] karmaSprites;
    public Sprite[] moodSprites;
    
    [Header("Abilities")]
    public Transform abilitiesContainer;
    public GameObject abilityIndicatorPrefab;
    
    [Header("Quests")]
    public TextMeshProUGUI questTitle;
    public Slider questProgress;
    
    private Dictionary<string, Image> chakraIndicators = new Dictionary<string, Image>();
    private Dictionary<string, GameObject> abilityIndicators = new Dictionary<string, GameObject>();

    public static VRUIManager Instance { get; set; }

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    public void UpdateHealthBar(float percentage)
    {
        if (healthBar != null)
            healthBar.value = percentage;
    }
    
    public void UpdateEnergyBar(float percentage)
    {
        if (energyBar != null)
            energyBar.value = percentage;
    }
    
    public void SetEnergyBarVisible(bool visible)
    {
        if (energyContainer != null)
            energyContainer.SetActive(visible);
    }
    
    public void ShowMeditationProgress(float progress)
    {
        if (meditationPanel != null)
            meditationPanel.SetActive(true);
            
        if (meditationProgress != null)
            meditationProgress.value = progress;
            
        if (meditationText != null)
            meditationText.text = $"Meditation: {progress * 100:F1}%";
    }
    
    public void HideMeditationProgress()
    {
        if (meditationPanel != null)
            meditationPanel.SetActive(false);
    }
    
    public void UpdateChakraStatus(Dictionary<string, float> status)
    {
        if (chakraStatusContainer == null || chakraIndicatorPrefab == null)
            return;
            
        // Создаем или обновляем индикаторы чакр
        foreach (var chakra in status)
        {
            if (!chakraIndicators.ContainsKey(chakra.Key))
            {
                GameObject newIndicator = Instantiate(chakraIndicatorPrefab, chakraStatusContainer);
                chakraIndicators[chakra.Key] = newIndicator.GetComponent<Image>();
                // Настройка цвета и т.д. для конкретной чакры
            }
            
            // Обновляем заполнение индикатора
            chakraIndicators[chakra.Key].fillAmount = chakra.Value;
        }
    }
    
    public void UpdateKarmaIndicator(float karmaLevel)
    {
        if (karmaIndicator != null && karmaSprites != null && karmaSprites.Length > 0)
        {
            int index = Mathf.Clamp((int)(karmaLevel * karmaSprites.Length), 0, karmaSprites.Length - 1);
            karmaIndicator.sprite = karmaSprites[index];
        }
    }
    
    public void UpdateMoodIndicator(MoodState mood)
    {
        if (moodIndicator != null && moodSprites != null && moodSprites.Length > 0)
        {
            int index = (int)mood.CurrentEmotion;
            if (index < moodSprites.Length) 
                moodIndicator.sprite = moodSprites[index];
        }
    }
    
    public void UpdateAbilitiesList(List<string> abilities)
    {
        if (abilitiesContainer == null || abilityIndicatorPrefab == null)
            return;
            
        // Удаляем старые способности которых нет в новом списке
        List<string> toRemove = new List<string>();
        foreach (var ability in abilityIndicators)
        {
            if (!abilities.Contains(ability.Key))
            {
                Destroy(ability.Value);
                toRemove.Add(ability.Key);
            }
        }
        
        foreach (string key in toRemove)
        {
            abilityIndicators.Remove(key);
        }
        
        // Добавляем новые способности
        foreach (string ability in abilities)
        {
            if (!abilityIndicators.ContainsKey(ability))
            {
                GameObject newAbility = Instantiate(abilityIndicatorPrefab, abilitiesContainer);
                abilityIndicators[ability] = newAbility;
                // Настройка внешнего вида в зависимости от способности
            }
        }
    }
    
    public void UpdateQuestInfo(string title, float progress)
    {
        if (questTitle != null)
            questTitle.text = title;
            
        if (questProgress != null)
            questProgress.value = progress;
    }
}
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;
using TMPro;
using System.Collections.Generic;
using RealLife5D.Core;
using System;
using System.Collections;
using RealLife5D.Player;

namespace RealLife5D.Systems
{
    public class MeditationSystemVR : MonoBehaviour
    {
        [Header("VR Input")]
        [Obsolete]

        public XRController leftController;
        [Obsolete]
        public XRController rightController;
        [Obsolete]
        public InputHelpers.Button startButton = InputHelpers.Button.PrimaryButton;
        [Obsolete]
        public InputHelpers.Button stopButton = InputHelpers.Button.SecondaryButton;
        public float activationThreshold = 0.1f;

        [Header("Meditation Settings")]
        public float baseMeditationSpeed = 0.05f;

        [Header("UI (World Space Canvas)")]
        public TextMeshProUGUI notificationText;
        public float notificationDuration = 2f;

        [Header("Visual Effects")]
        public ParticleSystem meditationParticles;

        [Header("References")]
        public VRPlayerController playerController;
        public ChakraSystem chakraSystem;
        public VRUIManager vrUIManager;

        private bool isMeditating = false;
        private int currentMeditationLevel = 0;
        private float meditationProgress = 0f;
        private float meditationTime = 0f;
        private Coroutine meditationCoroutine;
        private float notificationTimer = 0f;
        private float originalMoveSpeed;

        [Obsolete]
        void Awake()
        {
            // Автоматически находим ссылки если они не установлены в инспекторе
            if (playerController == null)
                playerController = FindObjectOfType<VRPlayerController>();
            
            if (chakraSystem == null)
                chakraSystem = FindObjectOfType<ChakraSystem>();
            
            if (vrUIManager == null)
                vrUIManager = FindObjectOfType<VRUIManager>();
        }

        [Obsolete]
        void Update()
        {
            // Проверяем start/stop через VR-контроллеры
            CheckForVRInput();

            // Таймер уведомлений
            if (notificationTimer > 0f)
            {
                notificationTimer -= Time.deltaTime;
                if (notificationTimer <= 0f && notificationText != null)
                    notificationText.text = "";
            }
        }

        [Obsolete]
        private void CheckForVRInput()
        {
            if (rightController == null) return;

            bool startPressed = false;
            bool stopPressed = false;

            // Проверяем нажатие кнопок
            rightController.inputDevice.IsPressed(startButton, out startPressed, activationThreshold);
            rightController.inputDevice.IsPressed(stopButton, out stopPressed, activationThreshold);

            if (startPressed && !isMeditating)
            {
                // Начинаем медитацию на текущем уровне чакры из GameManager
                int lvl = GameManager.Instance.currentChakraLevel;
                StartMeditation(lvl);
                ShowNotification($"Начата медитация на чакре {lvl}");
            }

            if (stopPressed && isMeditating)
            {
                StopMeditation();
                ShowNotification("Медитация остановлена");
            }
        }

        [Obsolete]
        public void StartMeditation(int lvl)
        {
            if (isMeditating) return;

            currentMeditationLevel = lvl;
            isMeditating = true;
            meditationProgress = 0f;
            meditationTime = 0f;

            // Сохраняем оригинальную скорость перед замедлением
            if (playerController != null && playerController.moveProvider != null)
            {
                originalMoveSpeed = playerController.moveProvider.moveSpeed;
            }

            // Применяем эффекты начала медитации
            ApplyMeditationEffects(true);

            // Запускаем корутину медитации
            meditationCoroutine = StartCoroutine(MeditationProcess());

            Debug.Log($"Начата медитация уровня {lvl}");
        }

        [Obsolete]
        public void StopMeditation()
        {
            if (!isMeditating) return;

            isMeditating = false;

            // Останавливаем корутину медитации
            if (meditationCoroutine != null)
            {
                StopCoroutine(meditationCoroutine);
                meditationCoroutine = null;
            }

            // Применяем эффекты завершения медитации
            ApplyMeditationEffects(false);

            // Награждаем игрока за медитацию
            ApplyMeditationRewards();

            Debug.Log($"Медитация завершена. Прогресс: {meditationProgress:P}");
        }

        [Obsolete]
        private IEnumerator MeditationProcess()
        {
            while (isMeditating)
            {
                float progressPerSecond = CalculateMeditationSpeed();

                meditationTime += Time.deltaTime;
                meditationProgress += progressPerSecond * Time.deltaTime;

                // Ограничиваем прогресс 100%
                meditationProgress = Mathf.Clamp01(meditationProgress);

                // Обновляем UI
                UpdateMeditationUI(meditationProgress);

                // Проверяем завершение медитации
                if (meditationProgress >= 1f)
                {
                    CompleteMeditation();
                    yield break;
                }

                yield return null;
            }
        }

        private float CalculateMeditationSpeed()
        {
            // Базовая скорость медитации
            float speed = baseMeditationSpeed;

            // Модификатор от уровня медитации
            speed *= 1f + currentMeditationLevel * 0.2f;

            // Модификатор от уровня чакр (если доступна система чакр)
            if (chakraSystem != null)
            {
                speed *= 1f + chakraSystem.GetChakraLevel() * 0.1f;
            }

            // Модификатор от окружения (можно добавить проверки)
            speed *= GetEnvironmentMeditationBonus();

            return speed;
        }

        private float GetEnvironmentMeditationBonus()
        {
            // Здесь можно добавить логику определения бонусов от окружения
            // Например, бонус за нахождение в специальных местах для медитации

            float bonus = 1.0f;

            // Проверяем, находится ли игрок в специальной зоне медитации
            if (IsInMeditationZone())
            {
                bonus *= 1.5f;
            }

            // Проверяем, день или ночь (например, ночью медитация эффективнее)
            if (IsNightTime())
            {
                bonus *= 1.2f;
            }

            return bonus;
        }

        [Obsolete]
        private void ApplyMeditationEffects(bool starting)
        {
            if (playerController == null) return;

            if (starting)
            {
                // Замедляем движение во время медитации
                if (playerController.moveProvider != null)
                {
                    playerController.moveProvider.moveSpeed *= 0.1f;
                }

                // Отключаем повороты
                if (playerController.turnProvider != null)
                {
                    playerController.turnProvider.enabled = false;
                }

                // Включаем визуальные эффекты медитации
                EnableMeditationVFX(true);

                // Воспроизводим звук медитации
                PlayMeditationSound(true);
            }
            else
            {
                // Восстанавливаем нормальную скорость
                if (playerController.moveProvider != null)
                {
                    playerController.moveProvider.moveSpeed = originalMoveSpeed;
                }

                // Включаем повороты
                if (playerController.turnProvider != null)
                {
                    playerController.turnProvider.enabled = true;
                }

                // Отключаем визуальные эффекты медитации
                EnableMeditationVFX(false);

                // Останавливаем звук медитации
                PlayMeditationSound(false);
            }
        }

        private void ApplyMeditationRewards()
        {
            if (meditationProgress < 0.3f) return; // Минимальный порог для награды

            // Базовые награды за медитацию
            float energyGain = meditationProgress * 50f * (1f + currentMeditationLevel * 0.2f);
            float healthGain = meditationProgress * 20f;

            // Применяем награды
            if (chakraSystem != null)
            {
                chakraSystem.currentEnergy = Mathf.Min(
                    chakraSystem.maxEnergy,
                    chakraSystem.currentEnergy + energyGain
                );
            }

            if (playerController != null)
            {
                playerController.currentHealth = Mathf.Min(
                    playerController.maxHealth,
                    playerController.currentHealth + healthGain
                );
            }

            // Дополнительные награды за полную медитацию
            if (meditationProgress >= 1f)
            {
                CompleteMeditationRewards();
            }
        }

        private void CompleteMeditationRewards()
        {
            Debug.Log("Медитация полностью завершена! Особые награды.");

            // Особые награды за полное завершение медитации
            if (chakraSystem != null)
            {
                chakraSystem.maxEnergy *= 1.01f; // Небольшое увеличение максимальной энергии
            }

            // Разблокировка новых способностей или улучшений
            UnlockMeditationAbility();
        }

        [Obsolete]
        private void CompleteMeditation()
        {
            Debug.Log($"Медитация уровня {currentMeditationLevel} полностью завершена!");

            // Специальные эффекты завершения
            PlayCompletionEffects();

            // Автоматически останавливаем медитацию
            StopMeditation();
        }

        private void UpdateMeditationUI(float progress)
        {
            // Обновляем UI медитации (если есть)
            if (vrUIManager != null)
            {
                vrUIManager.ShowMeditationProgress(progress);
            }
        }

        private void EnableMeditationVFX(bool enable)
        {
            // Включение/выключение визуальных эффектов медитации
            if (meditationParticles != null)
            {
                if (enable) meditationParticles.Play();
                else meditationParticles.Stop();
            }
        }

        private void PlayMeditationSound(bool play)
        {
            // Воспроизведение/остановка звука медитации
            // Реализуйте в зависимости от вашей аудиосистемы
        }

        private void PlayCompletionEffects()
        {
            // Специальные эффекты при завершении медитации
            // Например, вспышка света, особые частицы и т.д.
        }

        private void UnlockMeditationAbility()
        {
            // Разблокировка новых способностей на основе уровня медитации
            if (playerController != null)
            {
                switch (currentMeditationLevel)
                {
                    case 1:
                        playerController.UnlockAbility("BasicMeditation");
                        break;
                    case 3:
                        playerController.UnlockAbility("DeepMeditation");
                        break;
                    case 5:
                        playerController.UnlockAbility("AstralProjection");
                        break;
                    // Добавьте дополнительные уровни по необходимости
                }
            }
        }

        // Вспомогательные методы
        private bool IsInMeditationZone()
        {
            // Реализуйте проверку нахождения в зоне медитации
            return false;
        }

        private bool IsNightTime()
        {
            // Реализуйте проверку времени суток
            return false;
        }

        private void ShowNotification(string msg)
        {
            if (notificationText == null) return;
            notificationText.text = msg;
            notificationTimer = notificationDuration;
        }

        public bool IsMeditating()
        {
            return isMeditating;
        }

        public float GetMeditationProgress()
        {
            return meditationProgress;
        }

        public int GetCurrentMeditationLevel()
        {
            return currentMeditationLevel;
        }
    }
}
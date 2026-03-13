using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;
using UnityEngine.InputSystem;
using System.Collections.Generic;
using RealLife5D.Core;
using RealLife5D.Systems;
using UnityEngine.XR.Interaction.Toolkit.Interactors;
using UnityEngine.XR.Interaction.Toolkit.Locomotion;
using Unity.XR.CoreUtils;
using System;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace RealLife5D.Player
#pragma warning restore IDE0130 // Namespace does not match folder structure
{
    public class VRPlayerController : MonoBehaviour
    {
        // Updated locomotion providers
        [System.Obsolete]
        public ContinuousMoveProviderBase moveProvider;
        [System.Obsolete]
        public SnapTurnProviderBase turnProvider;
        public XRDirectInteractor leftHandInteractor;
        public XRDirectInteractor rightHandInteractor;
        
        [Header("XR References")]
        public XROrigin xrOrigin;
        public ParticleSystem meditationParticles;
        
        [Header("Movement Settings")]
        public float walkSpeed = 1.5f;
        public float runSpeed = 3f;
        
        [Header("Health & Energy")]
        public float maxHealth = 100f;
        public float currentHealth;
        public float healthRegeneration = 1f;
        
        [Header("Chakra Development")]
        public float meditationProgress = 0f;
        public float meditationRequired = 100f;
        public bool isMeditating = false;
        
        [Header("Abilities")]
        public List<string> unlockedAbilities = new();
        public float teleportRange = 10f;
        public float healingPower = 10f;
        
        [Header("Input Actions")]
        public InputActionReference meditateAction;
        public InputActionReference healAction;
        public InputActionReference teleportAction;
        public InputActionReference toggleRunAction;
        
        [Header("Keyboard Fallbacks")]
        public bool enableKeyboardFallbacks = true;
        public KeyCode meditateKey = KeyCode.M;
        public KeyCode healKey = KeyCode.H;
        public KeyCode teleportKey = KeyCode.T;
        public KeyCode toggleRunKey = KeyCode.R;
        
        // Systems references
        private GameManager gameManager;
        private ChakraSystem chakraSystem;
        private QuestSystem questSystem;
        private KarmaSystem karmaSystem;
        private MoodSystem moodSystem;
        private DiseaseSystem diseaseSystem;
        
        // UI reference
        private VRUIManager vrUIManager;
        
        // Private state variables
        private bool isRunning = false;
        private bool highMeditationState = false;
        private float originalMoveSpeed;
        public AudioSource deepMeditationSound;
        
        // Fallback input actions
        private InputAction keyboardMeditateAction;
        private InputAction keyboardHealAction;
        private InputAction keyboardTeleportAction;
        private InputAction keyboardToggleRunAction;
        private List<InputAction> keyboardFallbackActions = new List<InputAction>();
        private InputAction _cachedTeleportAction; // Исправлено: InputAction вместо InputActionProperty

        [System.Obsolete]
        void Awake()
        {
            // Ensure we have required components
            if (xrOrigin == null)
                xrOrigin = FindFirstObjectByType<XROrigin>(); // Исправлено: FindFirstObjectByType

            if (moveProvider == null)
                moveProvider = FindFirstObjectByType<ContinuousMoveProviderBase>(); // Исправлено

            if (turnProvider == null)
                turnProvider = FindFirstObjectByType<SnapTurnProviderBase>(); // Исправлено

            if (moveProvider != null)
                originalMoveSpeed = moveProvider.moveSpeed;

            if (teleportAction != null)
            {
                _cachedTeleportAction = teleportAction.action;
            }
        }

        [System.Obsolete]
        void Start()
        {
            InitializeSystems();
            CacheTeleportAction();
            SetupInputActions();
            InitializePlayer();
        }

        [System.Obsolete]
        void Update()
        {
            HandleMeditation();
            HandleKeyboardInput();
            UpdateUI();
        }

        private void InitializeSystems()
        {
            gameManager = GameManager.Instance;
            
            if (gameManager != null)
            {
                chakraSystem = gameManager.GetComponent<ChakraSystem>();
                questSystem = gameManager.GetComponent<QuestSystem>();
                karmaSystem = gameManager.GetComponent<KarmaSystem>();
                moodSystem = gameManager.GetComponent<MoodSystem>();
                diseaseSystem = gameManager.GetComponent<DiseaseSystem>();
            }
            
            // Get VR UI Manager
            vrUIManager = VRUIManager.Instance;
        }

        [System.Obsolete]
        private void SetupInputActions()
        {
            Debug.Log("Setting up input actions...");

            // Настройка действия медитации
            if (meditateAction != null && meditateAction.action != null)
            {
                meditateAction.action.performed += ctx => ToggleMeditation();
                meditateAction.action.Enable();
                Debug.Log("Meditate action setup successfully");
            }
            else
            {
                #if UNITY_EDITOR
                Debug.Log($"{"Meditate"} action not assigned. Using keyboard fallback.");
                #endif
                SetupKeyboardMeditateFallback();
            }

            // Настройка действия лечения
            if (healAction != null && healAction.action != null)
            {
                healAction.action.performed += ctx => UseHealing();
                healAction.action.Enable();
                #if UNITY_EDITOR
                Debug.Log("Heal action setup successfully");
                #endif
            }
            else
            {
                #if UNITY_EDITOR
                Debug.LogWarning("HealAction or its action is null. Setting up keyboard fallback.");
                #endif
                SetupKeyboardHealFallback();
            }

            // Настройка действия телепортации
            if (teleportAction != null && teleportAction.action != null)
            {
                teleportAction.action.performed += ctx => UseTeleport();
                teleportAction.action.Enable();
                Debug.Log("Teleport action setup successfully");
            }
            else
            {
                Debug.LogWarning("TeleportAction or its action is null. Setting up keyboard fallback.");
                SetupKeyboardTeleportFallback();
            }

            // Настройка действия переключения бега
            if (toggleRunAction != null && toggleRunAction.action != null)
            {
                toggleRunAction.action.performed += ctx => ToggleRun();
                toggleRunAction.action.Enable();
                Debug.Log("ToggleRun action setup successfully");
            }
            else
            {
                Debug.LogWarning("ToggleRunAction or its action is null. Setting up keyboard fallback.");
                SetupKeyboardToggleRunFallback();
            }
            
            Debug.Log("Input actions setup completed");
        }

        [System.Obsolete]
        private void SetupKeyboardMeditateFallback()
        {
            if (!enableKeyboardFallbacks) return;
            
            keyboardMeditateAction = new InputAction("KeyboardMeditate", InputActionType.Button);
            keyboardMeditateAction.AddBinding($"<Keyboard>/{meditateKey}");
            keyboardMeditateAction.performed += ctx => ToggleMeditation();
            keyboardMeditateAction.Enable();
            keyboardFallbackActions.Add(keyboardMeditateAction);
            
            Debug.Log($"Keyboard meditate fallback setup with key: {meditateKey}");
        }

        private void SetupKeyboardHealFallback()
        {
            if (!enableKeyboardFallbacks) return;
            
            keyboardHealAction = new InputAction("KeyboardHeal", InputActionType.Button);
            keyboardHealAction.AddBinding($"<Keyboard>/{healKey}");
            keyboardHealAction.performed += ctx => UseHealing();
            keyboardHealAction.Enable();
            keyboardFallbackActions.Add(keyboardHealAction);
            
            Debug.Log($"Keyboard heal fallback setup with key: {healKey}");
        }

        private void SetupKeyboardTeleportFallback()
        {
            if (!enableKeyboardFallbacks) return;
            
            keyboardTeleportAction = new InputAction("KeyboardTeleport", InputActionType.Button);
            keyboardTeleportAction.AddBinding($"<Keyboard>/{teleportKey}");
            keyboardTeleportAction.performed += ctx => UseTeleport();
            keyboardTeleportAction.Enable();
            keyboardFallbackActions.Add(keyboardTeleportAction);
            
            Debug.Log($"Keyboard teleport fallback setup with key: {teleportKey}");
        }

        [System.Obsolete]
        private void SetupKeyboardToggleRunFallback()
        {
            if (!enableKeyboardFallbacks) return;
            
            keyboardToggleRunAction = new InputAction("KeyboardToggleRun", InputActionType.Button);
            keyboardToggleRunAction.AddBinding($"<Keyboard>/{toggleRunKey}");
            keyboardToggleRunAction.performed += ctx => ToggleRun();
            keyboardToggleRunAction.Enable();
            keyboardFallbackActions.Add(keyboardToggleRunAction);
            
            Debug.Log($"Keyboard toggle run fallback setup with key: {toggleRunKey}");
        }

        [System.Obsolete]
        private void HandleKeyboardInput()
        {
            if (!enableKeyboardFallbacks) return;

            try
            {
                var keyboard = Keyboard.current;
                if (keyboard == null)
                {
                    #if UNITY_EDITOR
                    Debug.Log("Клавиатура не обнаружена в редакторе - проверьте настройки ввода");
                    #endif
                    return;
                }

                Key meditateKeyConverted = ConvertKeyCodeToKey(meditateKey);
                Key healKeyConverted = ConvertKeyCodeToKey(healKey);
                Key teleportKeyConverted = ConvertKeyCodeToKey(teleportKey);
                Key toggleRunKeyConverted = ConvertKeyCodeToKey(toggleRunKey);

                if (meditateKeyConverted != Key.None && keyboard[meditateKeyConverted].wasPressedThisFrame && !IsActionAssigned(meditateAction))
                {
                    Debug.Log("Клавиша M нажата - активация медитации");
                    ToggleMeditation();
                }

                if (healKeyConverted != Key.None && keyboard[healKeyConverted].wasPressedThisFrame && !IsActionAssigned(healAction))
                {
                    Debug.Log("Клавиша H нажата - активация лечения");
                    UseHealing();
                }

                if (teleportKeyConverted != Key.None && keyboard[teleportKeyConverted].wasPressedThisFrame && !IsActionAssigned(teleportAction))
                {
                    Debug.Log("Клавиша T нажата - активация телепортации");
                    UseTeleport();
                }

                if (toggleRunKeyConverted != Key.None && keyboard[toggleRunKeyConverted].wasPressedThisFrame && !IsActionAssigned(toggleRunAction))
                {
                    Debug.Log("Клавиша R нажата - переключение бега");
                    ToggleRun();
                }

                if (keyboard.leftCtrlKey.isPressed || keyboard.rightCtrlKey.isPressed)
                {
                    // Logic for Left Control
                }

                if ((keyboard.leftCtrlKey.isPressed || keyboard.rightCtrlKey.isPressed) && keyboard.xKey.wasPressedThisFrame)
                {
                    Debug.Log("Ctrl+X was pressed");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Ошибка обработки клавиатурного ввода: {e.Message}");
            }
        }

        private Key ConvertKeyCodeToKey(KeyCode keyCode)
        {
            return keyCode switch
            {
                KeyCode.M => Key.M,
                KeyCode.H => Key.H,
                KeyCode.T => Key.T,
                KeyCode.R => Key.R,
                KeyCode.Space => Key.Space,
                KeyCode.LeftShift => Key.LeftShift,
                KeyCode.RightShift => Key.RightShift,
                KeyCode.LeftControl => Key.LeftCtrl,
                KeyCode.RightControl => Key.RightCtrl,
                KeyCode.LeftAlt => Key.LeftAlt,
                KeyCode.RightAlt => Key.RightAlt,
                KeyCode.Escape => Key.Escape,
                KeyCode.Return => Key.Enter,
                KeyCode.Backspace => Key.Backspace,
                KeyCode.Tab => Key.Tab,
                _ => Key.None
            };
        }

        private bool IsActionAssigned(InputActionReference action)
        {
            return action != null && action.action != null;
        }

        private void InitializePlayer()
        {
            currentHealth = maxHealth;

            if (!unlockedAbilities.Contains("BasicMovement"))
                unlockedAbilities.Add("BasicMovement");

            if (!unlockedAbilities.Contains("BasicInteraction"))
                unlockedAbilities.Add("BasicInteraction");

            Debug.Log("Player initialized with basic abilities");
        }

        [System.Obsolete]
        private void ToggleRun()
        {
            isRunning = !isRunning;
            if (moveProvider != null)
            {
                moveProvider.moveSpeed = isRunning ? runSpeed : walkSpeed;
                Debug.Log($"Run mode: {(isRunning ? "ON" : "OFF")}, Speed: {moveProvider.moveSpeed}");
            }
        }

        [System.Obsolete]
        private void HandleMeditation()
        {
            if (!isMeditating) return;

            meditationProgress += Time.deltaTime * 10f;

            if (meditationProgress >= meditationRequired)
            {
                CompleteMeditation();
                return;
            }

            if (chakraSystem != null)
            {
                float energyToAdd = Time.deltaTime * 5f;
                if (chakraSystem.GetType().GetMethod("AddEnergy") != null)
                {
                    chakraSystem.GetType().GetMethod("AddEnergy").Invoke(chakraSystem, new object[] { energyToAdd });
                }
                else
                {
                    var energyField = chakraSystem.GetType().GetField("currentEnergy", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                    if (energyField != null)
                    {
                        float currentEnergy = (float)energyField.GetValue(chakraSystem);
                        float newEnergy = Mathf.Min(chakraSystem.maxEnergy, currentEnergy + energyToAdd);
                        energyField.SetValue(chakraSystem, newEnergy);
                    }
                }
            }

            currentHealth = Mathf.Min(maxHealth, currentHealth + Time.deltaTime * healthRegeneration);
            moodSystem?.GetType().GetMethod("ApplyMeditationBoost")?.Invoke(moodSystem, null);
        }

        [System.Obsolete]
        private void ToggleMeditation()
        {
            if (isMeditating)
            {
                StopMeditation();
            }
            else
            {
                StartMeditation();
            }
        }

        [System.Obsolete]
        private void StartMeditation()
        {
            if (isMeditating) return;
            
            isMeditating = true;
            meditationProgress = 0f;
            if (moveProvider != null)
                moveProvider.moveSpeed = walkSpeed * 0.3f;
                    
            if (turnProvider != null)
                turnProvider.enabled = false;

            rightHandInteractor?.SendHapticImpulse(0.7f, 1f);
            leftHandInteractor?.SendHapticImpulse(0.7f, 1f);

            Debug.Log("Meditation started...");
            
            if (karmaSystem != null)
            {
                System.Type karmaActionType = System.Type.GetType("RealLife5D.Systems.KarmaAction, Assembly-CSharp");
                if (karmaActionType != null)
                {
                    object meditationAction = Enum.Parse(karmaActionType, "Meditation");
                    karmaSystem.GetType().GetMethod("AddKarmaForAction").Invoke(karmaSystem, new object[] { meditationAction });
                }
            }
            
            if (moodSystem != null)
            {
                moodSystem.GetType().GetMethod("AddCalm")?.Invoke(moodSystem, new object[] { 0.1f });
                moodSystem.GetType().GetMethod("AddLove")?.Invoke(moodSystem, new object[] { 0.05f });
            }

            questSystem?.UpdateObjective("MEN_002", 0, 1);
        }

        [System.Obsolete]
        private void StopMeditation()
        {
            if (!isMeditating) return;
            
            isMeditating = false;
            
            if (moveProvider != null)
                moveProvider.moveSpeed = isRunning ? runSpeed : walkSpeed;

            if (turnProvider != null)
                turnProvider.enabled = true;
            
            Debug.Log("Meditation stopped");
        }

        [System.Obsolete]
        private void CompleteMeditation()
        {
            isMeditating = false;
            meditationProgress = 0f;
            
            if (moveProvider != null)
                moveProvider.moveSpeed = isRunning ? runSpeed : walkSpeed;
                
            if (turnProvider != null)
                turnProvider.enabled = true;

            if (chakraSystem != null)
            {
                var energyField = chakraSystem.GetType().GetField("currentEnergy", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                energyField?.SetValue(chakraSystem, chakraSystem.maxEnergy);
            }

            currentHealth = maxHealth;
            UnlockAbility("MeditationMastery");
            Debug.Log("Meditation completed! New abilities unlocked.");
            questSystem?.CompleteObjective("MEN_002", 0);
        }

        private void UseHealing()
        {
            if (chakraSystem == null || !chakraSystem.CanUseAbility(20f)) 
            {
                Debug.Log("Cannot use healing - not enough energy or chakra system missing");
                return;
            }
            
            chakraSystem.UseEnergy(20f);
            currentHealth = Mathf.Min(maxHealth, currentHealth + healingPower);
            
            if (karmaSystem != null)
            {
                System.Type karmaActionType = System.Type.GetType("RealLife5D.Systems.KarmaAction, Assembly-CSharp");
                if (karmaActionType != null)
                {
                    object healSelfAction = Enum.Parse(karmaActionType, "HealSelf");
                    karmaSystem.GetType().GetMethod("AddKarmaForAction").Invoke(karmaSystem, new object[] { healSelfAction });
                }
            }

            rightHandInteractor?.SendHapticImpulse(0.8f, 0.3f);
            Debug.Log("Healing ability used");
            questSystem?.UpdateObjective("EMO_001", 0, 1);
        }

        [System.Obsolete]
        public void EnableTeleportation()
        {
            try
            {
                Debug.Log("Attempting to enable teleportation...");

                if (teleportAction == null)
                {
                    Debug.LogWarning("TeleportAction reference is null. Cannot enable teleportation.");
                    return;
                }

                if (teleportAction.action == null && _cachedTeleportAction != null)
                {
                    Debug.Log("Restoring teleport action from cache");
                    // Исправлено: используем правильный метод создания InputActionReference
                    teleportAction = InputActionReference.Create(_cachedTeleportAction);
                }

                if (teleportAction.action == null)
                {
                    Debug.LogError("Teleport action is still null after restoration attempt");
                    SetupProgrammaticTeleportAction();
                    return;
                }

                if (!teleportAction.action.enabled)
                {
                    teleportAction.action.Enable();
                    Debug.Log("Teleport action enabled successfully");
                }

                EnableTeleportationComponents();

                // Исправлено: используем существующий метод или логируем
                if (vrUIManager != null)
                {
                    // Временная замена - используйте существующий метод или добавьте ShowNotification в VRUIManager
                    Debug.Log("Teleportation enabled");
                }

                Debug.Log("Teleportation enabled successfully");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Error enabling teleportation: {e.Message}");
                ActivateTeleportationFallback();
            }
        }

        private void SetupProgrammaticTeleportAction()
        {
            Debug.Log("Setting up programmatic teleport action...");

            InputAction newTeleportAction = new InputAction("ProgrammaticTeleport", InputActionType.Button);
            newTeleportAction.AddBinding("<XRController>{RightHand}/triggerPressed");
            newTeleportAction.AddBinding("<Keyboard>/t");
            newTeleportAction.performed += ctx => UseTeleport();
            newTeleportAction.Enable();

            // Исправлено: правильное создание InputActionReference
            teleportAction = InputActionReference.Create(newTeleportAction);
            _cachedTeleportAction = newTeleportAction;

            Debug.Log("Programmatic teleport action created successfully");
        }

        [System.Obsolete]
        private void EnableTeleportationComponents()
        {
            var teleportProvider = FindFirstObjectByType<UnityEngine.XR.Interaction.Toolkit.Locomotion.Teleportation.TeleportationProvider>(); // Исправлено
            if (teleportProvider != null)
            {
                teleportProvider.enabled = true;
                Debug.Log("Teleportation provider enabled");
            }

            var teleportInteractor = FindFirstObjectByType<XRRayInteractor>(); // Исправлено
            if (teleportInteractor != null)
            {
                teleportInteractor.enabled = true;
                Debug.Log("Teleport interactor enabled");
            }

            // Удалено: moveProvider.enableFreeXRMovement = true; - свойства не существует
        }

        private void ActivateTeleportationFallback()
        {
            Debug.Log("Activating teleportation fallback system...");

            if (keyboardTeleportAction == null || !keyboardTeleportAction.enabled)
            {
                SetupKeyboardTeleportFallback();
            }

            if (vrUIManager != null)
            {
                // Временная замена - используйте существующий метод или добавьте ShowWarning в VRUIManager
                Debug.LogWarning("Using keyboard teleportation (T key)");
            }

            Debug.Log("Teleportation fallback activated. Use T key for teleportation.");
        }

        private void CacheTeleportAction()
        {
            if (teleportAction != null && teleportAction.action != null)
            {
                _cachedTeleportAction = teleportAction.action;
                Debug.Log("Teleport action cached successfully");
            }
            else
            {
                Debug.LogWarning("Cannot cache teleport action - action or reference is null");
            }
        }

        public void DisableTeleportation()
        {
            try
            {
                if (teleportAction != null && teleportAction.action != null)
                {
                    teleportAction.action.Disable();
                    Debug.Log("Teleport action disabled");
                }

                var teleportProvider = FindFirstObjectByType<UnityEngine.XR.Interaction.Toolkit.Locomotion.Teleportation.TeleportationProvider>(); // Исправлено
                if (teleportProvider != null)
                {
                    teleportProvider.enabled = false;
                }

                if (vrUIManager != null)
                {
                    // Временная замена
                    Debug.Log("Teleportation disabled");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Error disabling teleportation: {e.Message}");
            }
        }

        private void UseTeleport()
        {
            if (chakraSystem == null || !chakraSystem.CanUseAbility(30f) || xrOrigin == null)
            {
                Debug.Log("Cannot use teleport - not enough energy or systems missing");
                return;
            }

            Vector3 teleportDirection = xrOrigin.Camera.transform.forward;
            teleportDirection.y = 0;
            teleportDirection.Normalize();
            
            Vector3 teleportPosition = transform.position + teleportDirection * teleportRange;

            if (Physics.Raycast(teleportPosition + Vector3.up * 10f, Vector3.down, out RaycastHit hit, 20f))
            {
                chakraSystem.UseEnergy(30f);
                transform.position = hit.point + Vector3.up * 0.1f;
                rightHandInteractor?.SendHapticImpulse(0.9f, 0.2f);
                Debug.Log("Teleportation ability used");
            }
            else
            {
                Debug.Log("Invalid teleport location");
            }
        }

        public void UnlockAbility(string abilityName)
        {
            // Добавьте проверку на null и пустую строку
            if (string.IsNullOrEmpty(abilityName))
            {
                Debug.LogWarning("Attempted to unlock ability with null or empty name");
                return;
            }

            if (unlockedAbilities.Contains(abilityName))
            {
                Debug.Log($"Ability {abilityName} is already unlocked");
                return;
            }

            unlockedAbilities.Add(abilityName);

            // Apply ability effects
            switch (abilityName)
            {
                case "MeditationMastery":
                    if (meditationRequired > 0) // Добавьте проверку
                        meditationRequired *= 0.8f;
                    healingPower *= 1.5f;
                    Debug.Log($"MeditationMastery unlocked! Benefits applied.");
                    break;

                case "ChakraVision":
                    Debug.Log($"ChakraVision unlocked!");
                    break;

                case "DimensionalShift":
                    if (teleportRange > 0) // Добавьте проверку
                        teleportRange *= 2f;
                    Debug.Log($"DimensionalShift unlocked!");
                    break;

                default:
                    Debug.Log($"New ability unlocked: {abilityName}");
                    break;
            }

            // Убедитесь, что vrUIManager существует
            if (vrUIManager != null)
            {
                // Используйте безопасный вызов метода
                var method = vrUIManager.GetType().GetMethod("ShowAbilityUnlockedNotification");
                if (method != null)
                {
                    method.Invoke(vrUIManager, new object[] { abilityName });
                }
            }
        }


        public void TakeDamage(float damage)
        {
            currentHealth -= damage;
            rightHandInteractor?.SendHapticImpulse(1f, 0.5f);
            leftHandInteractor?.SendHapticImpulse(1f, 0.5f);
            moodSystem?.GetType().GetMethod("ApplyDamageShock")?.Invoke(moodSystem, new object[] { damage });

            if (currentHealth <= 0)
            {
                Die();
            }
        }

        private void Die()
        {
            Debug.Log("Player died. Transitioning to another world...");
            gameManager?.OnPlayerDeath();
        }

        public void Heal(float amount)
        {
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            rightHandInteractor?.SendHapticImpulse(0.3f, 0.2f);
        }

        private void UpdateUI()
        {
            if (vrUIManager == null)
            {
                vrUIManager = VRUIManager.Instance;
                if (vrUIManager == null) return;
            }

            float healthPercentage = GetHealthPercentage();
            vrUIManager.UpdateHealthBar(healthPercentage);

            if (chakraSystem != null)
            {
                float currentEnergy = 0f;
                var energyField = chakraSystem.GetType().GetField("currentEnergy", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (energyField != null)
                {
                    currentEnergy = (float)energyField.GetValue(chakraSystem);
                }
                
                float energyPercentage = currentEnergy / chakraSystem.maxEnergy;
                vrUIManager.UpdateEnergyBar(energyPercentage);

                bool isAbilityActive = false;
                var abilityField = chakraSystem.GetType().GetField("isAbilityActive", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (abilityField != null)
                {
                    isAbilityActive = (bool)abilityField.GetValue(chakraSystem);
                }
                
                bool shouldShowEnergy = isMeditating || energyPercentage < 0.95f || isAbilityActive;
                vrUIManager.SetEnergyBarVisible(shouldShowEnergy);
            }

            if (isMeditating)
            {
                float meditationPercentage = GetMeditationProgress();
                vrUIManager.ShowMeditationProgress(meditationPercentage);
                UpdateMeditationVFX(meditationPercentage);
            }
            else
            {
                vrUIManager.HideMeditationProgress();
            }

            // Остальная логика UI...
            PositionVrUI();
        }

        private void UpdateMeditationVFX(float progress)
        {
            float intensity = Mathf.Clamp01(progress * 2f);
            
            if (meditationParticles != null)
            {
                var main = meditationParticles.main;
                main.startSpeed = intensity * 5f;
                var emission = meditationParticles.emission;
                emission.rateOverTime = intensity * 20f;
            }
            
            if (progress > 0.7f && !highMeditationState)
            {
                highMeditationState = true;
                OnHighMeditationStateEnter();
            }
            else if (progress <= 0.7f && highMeditationState)
            {
                highMeditationState = false;
                OnHighMeditationStateExit();
            }
        }

        private void PositionVrUI()
        {
            if (vrUIManager == null || xrOrigin == null) return;
            
            Vector3 uiPosition = xrOrigin.Camera.transform.position + 
                                xrOrigin.Camera.transform.forward * 2f;
            uiPosition.y -= 0.3f;
            vrUIManager.transform.position = uiPosition;
            vrUIManager.transform.rotation = Quaternion.LookRotation(
                vrUIManager.transform.position - xrOrigin.Camera.transform.position);
        }

        private void OnHighMeditationStateEnter()
        {
            deepMeditationSound?.Play();
            healthRegeneration *= 2f;
            
            if (chakraSystem != null) 
            {
                var regenField = chakraSystem.GetType().GetField("energyRegenerationRate", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (regenField != null)
                {
                    float currentRegen = (float)regenField.GetValue(chakraSystem);
                    regenField.SetValue(chakraSystem, currentRegen * 2f);
                }
            }
            
            if (karmaSystem != null)
            {
                System.Type karmaActionType = System.Type.GetType("RealLife5D.Systems.KarmaAction, Assembly-CSharp");
                if (karmaActionType != null)
                {
                    object deepMeditationAction = Enum.Parse(karmaActionType, "DeepMeditation");
                    karmaSystem.GetType().GetMethod("AddKarmaForAction").Invoke(karmaSystem, new object[] { deepMeditationAction });
                }
            }
            
            questSystem?.UpdateObjective("MEN_003", 0, 1);
        }

        private void OnHighMeditationStateExit()
        {
            healthRegeneration /= 2f;
            
            if (chakraSystem != null) 
            {
                var regenField = chakraSystem.GetType().GetField("energyRegenerationRate", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (regenField != null)
                {
                    float currentRegen = (float)regenField.GetValue(chakraSystem);
                    regenField.SetValue(chakraSystem, currentRegen / 2f);
                }
            }
            
            if (deepMeditationSound != null && deepMeditationSound.isPlaying)
            {
                deepMeditationSound.Stop();
            }
        }

        public float GetHealthPercentage()
        {
            return currentHealth / maxHealth;
        }

        public float GetMeditationProgress()
        {
            return meditationProgress / meditationRequired;
        }

        void OnDestroy()
        {
            if (meditateAction != null && meditateAction.action != null)
                meditateAction.action.Disable();
                
            if (healAction != null && healAction.action != null)
                healAction.action.Disable();
                
            if (teleportAction != null && teleportAction.action != null)
                teleportAction.action.Disable();
                
            if (toggleRunAction != null && toggleRunAction.action != null)
                toggleRunAction.action.Disable();
            
            foreach (var action in keyboardFallbackActions)
            {
                if (action != null)
                {
                    action.Disable();
                    action.Dispose();
                }
            }
            keyboardFallbackActions.Clear();
        }
    }

    public class QuestInfo
    {
        public string name;
        public float progress;
    }
}
using UnityEngine;
using UnityEngine.SceneManagement;
using RealLife5D.Core;

namespace RealLife5D.Systems
{
	public class ReincarnationSystem : MonoBehaviour
	{
		[Header("Reincarnation State")]
		public int reincarnationCount = 0;
		public string lastKarmaTier = "Neutral";
		
		private GameManager gameManager;
		private WorldSystem worldSystem;
		private KarmaSystem karmaSystem;
		
		void Start()
		{
			gameManager = GameManager.Instance;
			worldSystem = GetComponent<WorldSystem>();
			karmaSystem = GetComponent<KarmaSystem>();
		}

		public void Reincarnate()
		{
			if (gameManager == null)
			{
				Debug.LogWarning("ReincarnationSystem: gameManager не найден.");
				return;
			}

			// Фиксируем карму текущей жизни
			var karmaTier = karmaSystem != null ? karmaSystem.GetKarmaTier() : KarmaTier.Neutral;
			lastKarmaTier = karmaTier.ToString();
			reincarnationCount = PlayerPrefs.GetInt("ReincarnationCount", 0) + 1;
			PlayerPrefs.SetInt("ReincarnationCount", reincarnationCount);
			PlayerPrefs.SetString("LastKarmaTier", lastKarmaTier);

			Debug.Log($"Реинкарнация. Карма: {lastKarmaTier}, Количество: {reincarnationCount}");

			// Применяем эффекты кармы
			ApplyKarmaEffectsOnRebirth(karmaTier);

			// Переход в следующий мир
			gameManager.currentWorldIndex = (gameManager.currentWorldIndex + 1) % gameManager.totalWorlds;
			worldSystem.TransitionToWorld(gameManager.currentWorldIndex);

			// Загружаем сцену
			string sceneName = "World_" + gameManager.currentWorldIndex;
			Debug.Log($"Переход к сцене: {sceneName}");
			SceneManager.LoadScene(sceneName);

			PlayerPrefs.Save();
		}

		
		private void ApplyKarmaEffectsOnRebirth(KarmaTier tier)
		{
			// Отрицательная карма: понижение чакры на 1 (минимум 1)
			if (tier == KarmaTier.Dark || tier == KarmaTier.Shadow)
			{
				if (gameManager.currentChakraLevel > 1)
				{
					gameManager.currentChakraLevel = Mathf.Max(1, gameManager.currentChakraLevel - 1);
				}
			}
			// Положительная карма: восстановление энергии и устойчивости
			else if (tier == KarmaTier.Light || tier == KarmaTier.Radiant)
			{
				var chakraSystem = GetComponent<ChakraSystem>();
				if (chakraSystem != null)
				{
					chakraSystem.currentEnergy = chakraSystem.maxEnergy;
				}
				var dimensionSystem = GetComponent<DimensionSystem>();
				if (dimensionSystem != null)
				{
					dimensionSystem.realityStability = Mathf.Min(100f, dimensionSystem.realityStability + 10f);
				}
			}
		}
	}
}
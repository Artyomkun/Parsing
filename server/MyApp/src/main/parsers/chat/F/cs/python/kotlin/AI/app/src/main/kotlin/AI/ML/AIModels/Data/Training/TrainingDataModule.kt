package AI.ML.AIModels.Data.Training

import AI.Core.*
import AI.ML.*
import AI.FiveD.*
import AI.Utils.*

object TrainingDataModule {
    val config = ConfigUtils
    val loader = TrainingDataLoader()
    val generator = TrainingDataGenerator()
    val validator = TrainingDataValidator()
    val fixer = TrainingDataFixer()
    val collector = DataCollector()
    val analyzer = DataAnalyzer()
    val cleaner = DataCleaner()
    val visualizer = LearningVisualizer()
}

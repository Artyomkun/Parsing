package AI.ML.AIModels.Data

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import AI.ML.AIModels.Data.Training.*
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.temporal.ChronoUnit
import java.util.zip.ZipOutputStream
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.time.Instant
import kotlin.math.min
import java.io.File
import tornadofx.*

class DataCleaner(val dataDir: String = "data") {
    
    fun getDataFiles(): List<File> {
        val dataDirFile = File(dataDir)
        if (!dataDirFile.exists()) {
            dataDirFile.mkdirs()
            return emptyList()
        }
        
        return dataDirFile.listFiles { file ->
            file.isFile && file.name.endsWith(".json")
        }?.toList() ?: emptyList()
    }
    
    fun cleanDataset(removeDuplicates: Boolean = true, removeLowQuality: Boolean = true): Map<String, Int> {
        val results = mutableMapOf<String, Int>()
        var removedCount = 0
        var processedCount = 0
        
        val dataFiles = getDataFiles()
        
        dataFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())
                
                var shouldRemove = false
                
                // Проверка дубликатов
                if (removeDuplicates && isDuplicate(data, file)) {
                    shouldRemove = true
                    results["duplicates_removed"] = results.getOrDefault("duplicates_removed", 0) + 1
                }
                
                // Проверка качества
                if (removeLowQuality && isLowQuality(data)) {
                    shouldRemove = true
                    results["low_quality_removed"] = results.getOrDefault("low_quality_removed", 0) + 1
                }
                
                if (shouldRemove) {
                    file.delete()
                    removedCount++
                }
                processedCount++
            } catch (e: Exception) {
                results["error_files"] = results.getOrDefault("error_files", 0) + 1
            }
        }
        
        results["total_processed"] = processedCount
        results["total_removed"] = removedCount
        return results
    }
    
    private fun isDuplicate(data: Data, currentFile: File): Boolean {
        val dataFiles = getDataFiles()
        val currentHash = createContentHash(data)
        
        return dataFiles.any { otherFile ->
            otherFile != currentFile && try {
                val otherData = Json.decodeFromString<Data>(otherFile.readText())
                createContentHash(otherData) == currentHash
            } catch (e: Exception) {
                false
            }
        }
    }
    
    private fun isLowQuality(data: Data): Boolean {
        // Проверка на низкое качество
        val totalText = data.data.title + data.data.paragraphs.joinToString(" ")
        return totalText.length < 50 || 
               data.data.paragraphs.isEmpty() ||
               data.analysis.totalTextLength < 100
    }
    
    fun removeOldData(daysOld: Int): Int {
        val cutoffTime = System.currentTimeMillis() - (daysOld * 24 * 60 * 60 * 1000L)
        var removedCount = 0
        
        getDataFiles().forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())
                if (data.timestamp < cutoffTime) {
                    file.delete()
                    removedCount++
                }
            } catch (e: Exception) {
                // Пропускаем файлы с ошибками
            }
        }
        
        return removedCount
    }
    
    fun validateDataset(): Map<String, Any> {
        val dataFiles = getDataFiles()
        val validationResults = mutableMapOf<String, Any>()
        val contentTypes = mutableMapOf<String, Int>()
        var totalTextLength = 0L
        var validFiles = 0
        
        dataFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())
                
                // Собираем статистику по типам контента
                contentTypes[data.contentType] = contentTypes.getOrDefault(data.contentType, 0) + 1
                
                // Считаем общую длину текста
                totalTextLength += data.analysis.totalTextLength
                validFiles++
                
            } catch (e: Exception) {
                // Файл невалидный
            }
        }
        
        validationResults["total_files"] = dataFiles.size
        validationResults["valid_files"] = validFiles
        validationResults["invalid_files"] = dataFiles.size - validFiles
        validationResults["content_types"] = contentTypes
        validationResults["avg_text_length"] = if (validFiles > 0) totalTextLength / validFiles else 0
        validationResults["data_quality"] = if (dataFiles.isEmpty()) "no_data" 
                                           else if (validFiles.toDouble() / dataFiles.size > 0.8) "good"
                                           else "needs_improvement"
        
        return validationResults
    }
    
    fun createContentHash(data: Data): String {
        val content = data.data.title + data.data.paragraphs.joinToString("") + data.contentType
        return content.hashCode().toString()
    }
    
    // Перемещенные функции внутрь класса
    
    fun batchClean(operations: List<CleaningOperation>): BatchCleaningResult {
        val results = BatchCleaningResult()
        
        operations.forEach { operation ->
            when (operation) {
                is CleaningOperation.RemoveDuplicates -> {
                    val result = cleanDataset(removeDuplicates = true, removeLowQuality = false)
                    results.operations[operation.name] = result
                }
                is CleaningOperation.RemoveLowQuality -> {
                    val result = cleanDataset(removeDuplicates = false, removeLowQuality = true)
                    results.operations[operation.name] = result
                }
                is CleaningOperation.RemoveOld -> {
                    val removed = removeOldData(operation.daysOld)
                    results.operations[operation.name] = removed
                }
                is CleaningOperation.Validate -> {
                    val result = validateDataset()
                    results.operations[operation.name] = result
                }
            }
        }
        
        return results
    }
    
    fun analyzeDuplicates(): DuplicateAnalysis {
        val dataFiles = getDataFiles()
        val contentMap = mutableMapOf<String, MutableList<String>>()
        
        dataFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())
                val contentHash = createContentHash(data)
                
                if (!contentMap.containsKey(contentHash)) {
                    contentMap[contentHash] = mutableListOf()
                }
                contentMap[contentHash]?.add(file.name)
            } catch (e: Exception) {
                // Пропускаем файлы с ошибками
            }
        }
        
        val duplicates = contentMap.filter { it.value.size > 1 }
        
        return DuplicateAnalysis(
            totalFiles = dataFiles.size,
            uniqueFiles = contentMap.size,
            duplicateGroups = duplicates.size,
            duplicateFiles = duplicates.values.sumOf { it.size - 1 },
            duplicateGroupsDetail = duplicates
        )
    }
    
    fun fixCommonIssues(): FixResult {
        val dataFiles = getDataFiles()
        val result = FixResult()
        
        dataFiles.forEach { file ->
            try {
                val data = Json.decodeFromString<Data>(file.readText())
                var fixedData = data
                
                // Исправляем пустые content_type
                if (data.contentType.isEmpty() || data.contentType == "unknown") {
                    fixedData = fixedData.copy(contentType = "general")
                    result.fixedContentTypes++
                }
                
                // Исправляем слишком длинные заголовки
                if (data.data.title.length > 200) {
                    fixedData = fixedData.copy(
                        data = fixedData.data.copy(
                            title = data.data.title.take(197) + "..."
                        )
                    )
                    result.fixedTitles++
                }
                
                // Сохраняем исправленные данные
                if (fixedData != data) {
                    file.writeText(Json.encodeToString(fixedData))
                    result.fixedFiles++
                }
                
            } catch (e: Exception) {
                result.errors.add("Error fixing ${file.name}: ${e.message}")
            }
        }
        
        return result
    }
}

// Классы операций очистки остаются снаружи
sealed class CleaningOperation {
    abstract val name: String
    
    object RemoveDuplicates : CleaningOperation() {
        override val name: String = "remove_duplicates"
    }
    
    object RemoveLowQuality : CleaningOperation() {
        override val name: String = "remove_low_quality"
    }
    
    data class RemoveOld(val daysOld: Int) : CleaningOperation() {
        override val name: String = "remove_old"
    }
    
    object Validate : CleaningOperation() {
        override val name: String = "validate"
    }
}

fun main() {
    launch<UniversalApp>()
}
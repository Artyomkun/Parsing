package AI.Utils

import AI.ML.*
import AI.FiveD.*
import AI.Utils.*
import AI.FiveD.Services.*
import AI.FiveD.Visualization.*
import org.modelcontextprotocol.mcp.server.McpServerBuilder
import org.modelcontextprotocol.mcp.server.McpServer
import org.modelcontextprotocol.mcp.server.Resources
import org.modelcontextprotocol.mcp.server.Tools
import kotlinx.serialization.json.Json
import org.modelcontextprotocol.mcp.*
import tornadofx.*

class McpServer {
    private val AI = UniversalAIApp()
    
    fun createServer(): McpServer {
        return McpServerBuilder()
            .withName("my-ai-server")
            .withVersion("1.0.0")
            .withResources(createResources())
            .withTools(createTools())
            .build()
    }
    
    private fun createResources(): Resources {
        return Resources.builder()
            .addResource(
                "knowledge",
                ResourceTemplate.builder()
                    .withUri("knowledge://{topic}")
                    .withDescription("База знаний моего ИИ")
                    .build()
            )
            .build()
    }
    
    private fun createTools(): Tools {
        return Tools.builder()
            .addTool(
                "chat",
                Tool.builder()
                    .withDescription("Чат с моим ИИ")
                    .withInputSchema(
                        Json.parseToJsonElement("""
                        {
                            "type": "object",
                            "properties": {
                                "message": {
                                    "type": "string",
                                    "description": "Сообщение для ИИ"
                                }
                            },
                            "required": ["message"]
                        }
                        """.trimIndent())
                    )
                    .build()
            ) { parameters ->
                val message = parameters["message"]?.toString() ?: ""
                val response = AI.processMessage(message)
                mapOf("response" to response)
            }
            .addTool(
                "learn",
                Tool.builder()
                    .withDescription("Обучить мой ИИ новой информации")
                    .withInputSchema(
                        Json.parseToJsonElement("""
                        {
                            "type": "object", 
                            "properties": {
                                "topic": {
                                    "type": "string",
                                    "description": "Тема для обучения"
                                },
                                "information": {
                                    "type": "string", 
                                    "description": "Информация для запоминания"
                                }
                            },
                            "required": ["topic", "information"]
                        }
                        """.trimIndent())
                    )
                    .build()
            ) { parameters ->
                val topic = parameters["topic"]?.toString() ?: ""
                val information = parameters["information"]?.toString() ?: ""
                AI.learnNewInformation(topic, information)
                mapOf("status" to "learned", "topic" to topic)
            }
            .build()
    }
}

fun main() {
    launch<UniversalApp>()
}
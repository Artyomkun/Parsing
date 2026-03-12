import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.gradle.api.tasks.Exec
import org.gradle.api.tasks.JavaExec
import org.gradle.api.tasks.Copy
import org.gradle.api.tasks.testing.Test
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent
import org.gradle.api.artifacts.ResolutionStrategy
import org.gradle.api.artifacts.ComponentSelection
import org.gradle.api.artifacts.result.ResolvedComponentResult
import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.gradle.api.file.DuplicatesStrategy
import javax.inject.Inject
import org.gradle.process.ExecOperations
import org.gradle.api.DefaultTask
import org.gradle.api.tasks.bundling.Tar
import org.gradle.jvm.application.tasks.CreateStartScripts
import org.gradle.api.tasks.bundling.Zip

plugins {
    id("org.jetbrains.kotlin.jvm") version "2.0.0"
    id("org.jetbrains.kotlin.plugin.serialization") version "2.0.0"
    id("org.owasp.dependencycheck") version "9.0.9"
    id("com.gradleup.shadow") version "9.2.2"
    id("application")
    id("org.openjfx.javafxplugin") version "0.1.0"
}

group = "AI"
version = "1.0.0"

val javafxVersion = "21.0.8"
val kotlinCoroutinesVersion = "1.8.0"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

javafx {
    version = "21.0.8"
    modules = listOf("javafx.controls", "javafx.fxml", "javafx.web", "javafx.base", "javafx.graphics")
}

kotlin {
    jvmToolchain(21)
}

sourceSets {
    main {
        kotlin.srcDirs(
            "app/src/main/kotlin"
        )
        resources.srcDirs("app/src/main/resources")
    }
    test {
        kotlin.srcDirs("app/src/test/kotlin")
    }
}

// Кастомная задача для запуска приложения
abstract class RunAppTask @Inject constructor(
    private val execOperations: ExecOperations
) : DefaultTask() {

    @org.gradle.api.tasks.Input
    val mainClass = project.objects.property(String::class.java)

    @org.gradle.api.tasks.InputFiles
    val classpath = project.objects.fileCollection()

    @org.gradle.api.tasks.Input
    val jvmArgs = project.objects.listProperty(String::class.java)

    @org.gradle.api.tasks.TaskAction
    fun runApp() {
        execOperations.javaexec {
            mainClass.set(this@RunAppTask.mainClass)
            classpath = this@RunAppTask.classpath
            jvmArgs = this@RunAppTask.jvmArgs.get()
        }
    }
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation(kotlin("reflect"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$kotlinCoroutinesVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-javafx:$kotlinCoroutinesVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.5.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    // Web & Networking
    implementation("org.jsoup:jsoup:1.17.2")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.0")
    implementation("org.json:json:20231013")

    // UI
    implementation(files("libs/tornadofx-1.7.20.jar"))
    implementation("org.openjfx:javafx-controls:$javafxVersion")
    implementation("org.openjfx:javafx-fxml:$javafxVersion")
    implementation("org.openjfx:javafx-web:$javafxVersion")
    implementation("org.openjfx:javafx-base:$javafxVersion")
    implementation("org.openjfx:javafx-graphics:$javafxVersion")

    // Data Science & ML
    implementation("com.github.haifengl:smile-kotlin:3.0.1")
    implementation("org.apache.commons:commons-math3:3.6.1")
    implementation("org.apache.commons:commons-text:1.11.0")
    implementation("commons-io:commons-io:2.15.1")
    implementation("org.apache.commons:commons-compress:1.26.1")
    implementation("org.apache.opennlp:opennlp-tools:2.3.0")
    implementation("org.ejml:ejml-all:0.41") 
    implementation("io.insert-koin:koin-core:3.5.0")
    // Дополнительные ML зависимости
    implementation("org.tensorflow:tensorflow-core-api:0.5.0")
    implementation("org.nd4j:nd4j-native-platform:1.0.0-M2.1")
    implementation("org.datavec:datavec-api:1.0.0-M2.1")
    // Logging
    implementation("org.slf4j:slf4j-api:2.0.13")
    implementation("ch.qos.logback:logback-classic:1.5.6")
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")
    // Для векторных embedding
    implementation("ai.djl:api:0.20.0") // Deep Java Library
    implementation("org.tensorflow:tensorflow-core-api:0.4.0")
    // Для визуализации графиков
    implementation("org.jetbrains.lets-plot:lets-plot-common:4.0.0")
    implementation("org.jetbrains.lets-plot:lets-plot-kotlin-jvm:4.0.0")
    // Utilities
    implementation("com.github.ajalt.clikt:clikt:4.2.2")
    implementation("org.jetbrains.compose.desktop:desktop-jvm:1.6.11")
    implementation("androidx.annotation:annotation:1.7.0")
    implementation("androidx.collection:collection:1.4.0")
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")
    // Testing
    testImplementation(kotlin("test-junit5"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$kotlinCoroutinesVersion")
    testImplementation("io.mockk:mockk:1.13.10")
    
    implementation("org.modelcontextprotocol:mcp-server:1.0.0")
    implementation("org.modelcontextprotocol:mcp-types:1.0.0")
    implementation("io.ktor:ktor-server-core:2.3.5")
    implementation("io.ktor:ktor-server-cio:2.3.5")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
}

application {
    mainClass.set("AIKt")
}

// НАСТРОЙКА существующей задачи shadowJar
tasks.named<ShadowJar>("shadowJar") {
    group = "build"
    description = "Create a fat JAR with all dependencies"
    archiveBaseName.set("AI")
    archiveClassifier.set("")
    archiveVersion.set(project.version.toString())
    mergeServiceFiles()
    manifest {
        attributes(
            "Main-Class" to "AIKt",
            "Implementation-Title" to "AI",
            "Implementation-Version" to project.version,
            "Built-By" to System.getProperty("user.name"),
            "Build-Jdk" to System.getProperty("java.version")
        )
    }
    from(sourceSets.main.get().output)
    configurations = listOf(project.configurations.runtimeClasspath.get())

    // Исключаем ненужные зависимости
    exclude("META-INF/*.RSA", "META-INF/*.SF", "META-INF/*.DSA")
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

// Регистрируем nativeImageManual
tasks.register<Exec>("nativeImageManual") {
    group = "native"
    description = "Build native image manually using GraalVM"
    dependsOn("shadowJar")

    doFirst {
        val shadowJarTask = project.tasks.getByName("shadowJar") as ShadowJar
        val jarFile = shadowJarTask.archiveFile.get().asFile
        commandLine = listOf(
            "native-image",
            "-jar", jarFile.absolutePath,
            "-H:Name=ai-parser-native",
            "--no-fallback",
            "--enable-http",
            "--enable-https"
        )
        println("Building native image from: ${jarFile.absolutePath}")
    }

    isIgnoreExitValue = true
}

tasks.withType<Zip> {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

// положите рядом с tasks (в начале файла или прямо перед задачами)
val isWinHost = System.getProperty("os.name", "").lowercase().contains("win")

tasks.register<Copy>("copyScripts") {
    from("scripts") {
        includeEmptyDirs = false
        if (!isWinHost) {
            filePermissions {
                user { read = true; write = true; execute = true }
                group { read = true; execute = true }
                other { read = true; execute = true }
            }
        }
    }
    into(layout.buildDirectory.dir("bin"))
}

tasks.register<Zip>("packageApp") {
    dependsOn("shadowJar")

    from(layout.buildDirectory.dir("libs")) {
        include("*.jar")
    }

    into("bin") {
        from("scripts") {
            includeEmptyDirs = false
            if (!isWinHost) {
                filePermissions {
                    user { read = true; write = true; execute = true }
                    group { read = true; execute = true }
                    other { read = true; execute = true }
                }
            }
        }
    }

    archiveFileName.set("AI-${project.version}.zip")
    destinationDirectory.set(layout.buildDirectory.dir("dist"))
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

tasks {
    register<JavaExec>("RunApp") {
        group = "application"
        description = "Run the application simply"
        dependsOn("classes")
        
        mainClass.set(application.mainClass.get())
        classpath = sourceSets["main"].runtimeClasspath
        doFirst {
            val javafxJars = configurations.runtimeClasspath.get().filter { 
                it.name.contains("javafx") 
            }
            val modulePath = javafxJars.joinToString(File.pathSeparator) { it.absolutePath }
            
            jvmArgs = listOf(
                "-Dfile.encoding=UTF-8",
                "--module-path=$modulePath",
                "--add-modules=javafx.controls,javafx.fxml,javafx.web,javafx.base,javafx.graphics"
            )
        }
    }

    withType<JavaCompile> {
        options.encoding = "UTF-8"
        sourceCompatibility = "21"
        targetCompatibility = "21"
    }

    withType<Test> {
        useJUnitPlatform()
        testLogging {
            events("passed", "skipped", "failed")
            showStandardStreams = true
        }
    }

    withType<Copy> {
        duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    }

    named("build") {
        dependsOn("shadowJar")
    }

    named("distZip") {
        dependsOn("shadowJar")
    }
    
    named("distTar") {
        dependsOn("shadowJar")
    }

    named("startScripts") {
        dependsOn("shadowJar")
    }

    named("shadowDistZip") {
        dependsOn("shadowJar")
    }
    
    named("shadowDistTar") {
        dependsOn("shadowJar")
    }
    
    named("startShadowScripts") {
        dependsOn("jar")
    }
}

dependencyCheck {
    formats = listOf("HTML", "XML", "JSON", "CSV")
    failBuildOnCVSS = 8.0f
    suppressionFile = "dependency-check-suppressions.xml"
}

configurations.all {
    resolutionStrategy.cacheChangingModulesFor(0, "seconds")
}
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    alias(libs.plugins.hilt)
    alias(libs.plugins.kotlin.ksp)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.musika.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.musika.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 8
        versionName = "1.1.8"

        // Last.fm: add LASTFM_API_KEY and LASTFM_API_SECRET to gradle.properties (register at last.fm/api/account/create)
        val lastFmApiKey = project.findProperty("LASTFM_API_KEY") as? String ?: ""
        val lastFmApiSecret = project.findProperty("LASTFM_API_SECRET") as? String ?: ""
        buildConfigField("String", "LASTFM_API_KEY", "\"$lastFmApiKey\"")
        buildConfigField("String", "LASTFM_API_SECRET", "\"$lastFmApiSecret\"")

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
    }

flavorDimensions += "abi"
    productFlavors {
        create("arm64") {
            dimension = "abi"
            ndk { abiFilters += "arm64-v8a" }
            buildConfigField("String", "ARCHITECTURE", "\"arm64\"")
        }
        create("x86_64") {
            dimension = "abi"
            ndk { abiFilters += "x86_64" }
            buildConfigField("String", "ARCHITECTURE", "\"x86_64\"")
        }
    }

    signingConfigs {
        create("persistentDebug") {
            storeFile = file("persistent-debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
        create("release") {
            val keystorePath = System.getenv("KEYSTORE_PATH") ?: project.findProperty("KEYSTORE_PATH") as String?
            if (keystorePath != null) {
                storeFile = file(keystorePath)
            }
            storePassword = System.getenv("STORE_PASSWORD") ?: project.findProperty("STORE_PASSWORD") as String?
            keyAlias = System.getenv("KEY_ALIAS") ?: project.findProperty("KEY_ALIAS") as String?
            keyPassword = System.getenv("KEY_PASSWORD") ?: project.findProperty("KEY_PASSWORD") as String?
        }
        getByName("debug") {
            keyAlias = "androiddebugkey"
            keyPassword = "android"
            storePassword = "android"
            storeFile = file("${System.getProperty("user.home")}/.android/debug.keystore")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            isCrunchPngs = false
            isDebuggable = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    kotlin {
        jvmToolchain(21)
        compilerOptions {
            freeCompilerArgs.add("-Xannotation-default-target=param-property")
            jvmTarget.set(JvmTarget.JVM_21)
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }

    lint {
        lintConfig = file("lint.xml")
        warningsAsErrors = false
        abortOnError = false
        checkDependencies = false
    }

    androidResources {
        generateLocaleConfig = true
    }

    bundle {
        language {
            enableSplit = false
        }
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false
            keepDebugSymbols += listOf(
                "**/libandroidx.graphics.path.so",
                "**/libdatastore_shared_counter.so"
            )
        }
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "META-INF/NOTICE.md"
            excludes += "META-INF/CONTRIBUTORS.md"
            excludes += "META-INF/LICENSE.md"
        }
    }
}

ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        freeCompilerArgs.addAll(
            "-opt-in=kotlin.RequiresOptIn"
        )
        suppressWarnings.set(false)
    }
}

dependencies {
    implementation(libs.guava)
    implementation(libs.coroutines.guava)
    implementation(libs.concurrent.futures)

    implementation(libs.activity)
    implementation(libs.hilt.navigation)
    implementation(libs.hilt.lifecycle.viewmodel.compose)
    implementation(libs.datastore)
    implementation(libs.security.crypto)

    implementation(libs.compose.runtime)
    implementation(libs.compose.foundation)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.util)
    implementation(libs.compose.ui.tooling)
    implementation(libs.compose.animation)
    implementation(libs.compose.animation)
    implementation(libs.compose.reorderable)
    implementation(libs.compose.material.icons.extended)

    implementation(libs.viewmodel)
    implementation(libs.viewmodel.compose)

    implementation(libs.material3)
    implementation(libs.palette)
    implementation(libs.materialKolor)

    implementation(libs.appcompat)

    implementation(libs.coil)
    implementation(libs.coil.network.okhttp)

    implementation(libs.ucrop)

    implementation(libs.shimmer)

    implementation(libs.media3)
    implementation(libs.media3.session)
    implementation(libs.media3.okhttp)
    implementation(libs.media3.ui)
    implementation(libs.media3.cast)
    implementation(libs.mediarouter)
    implementation(libs.cast.framework)
    implementation(libs.squigglyslider)
    
    // DLNA/UPnP Support
    implementation(libs.nanohttpd)

    implementation(libs.room.runtime)
    implementation(libs.kuromoji.ipadic)
    ksp(libs.room.compiler)
    implementation(libs.room.ktx)

    implementation(libs.apache.lang3)

    implementation(libs.hilt)
    implementation(libs.jsoup)
    ksp(libs.hilt.compiler)

    implementation(project(":innertube"))
    implementation(project(":kugou"))
    implementation(project(":lrclib"))

    implementation(libs.ktor.client.core)
    implementation(libs.ktor.serialization.json)

    coreLibraryDesugaring(libs.desugaring)

    implementation(libs.timber)
    
    // QR Code generation
    implementation(libs.zxing.core)
    
    // Music Recognition
    implementation(libs.uuid.creator)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.gson)
    implementation(libs.okhttp.logging.interceptor)

    implementation(libs.mlkit.language.id)
}

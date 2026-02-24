package com.musika.app.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.musika.app.LocalPlayerAwareWindowInsets
import com.musika.app.R
import com.musika.app.constants.AiProviderKey
import com.musika.app.constants.AutoTranslateLyricsKey
import com.musika.app.constants.AutoTranslateLyricsMismatchKey
import com.musika.app.constants.LanguageCodeToName
import com.musika.app.constants.OpenRouterApiKey
import com.musika.app.constants.OpenRouterBaseUrlKey
import com.musika.app.constants.OpenRouterModelKey
import com.musika.app.constants.TranslateLanguageKey
import com.musika.app.ui.component.EditTextPreference
import com.musika.app.ui.component.ListPreference
import com.musika.app.ui.component.SwitchPreference
import com.musika.app.ui.component.InfoLabel
import com.musika.app.utils.rememberPreference
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withLink

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiSettings(
    navController: NavController,
    scrollBehavior: TopAppBarScrollBehavior,
) {
    var aiProvider by rememberPreference(AiProviderKey, "OpenRouter")
    var openRouterApiKey by rememberPreference(OpenRouterApiKey, "")
    var openRouterBaseUrl by rememberPreference(OpenRouterBaseUrlKey, "https://openrouter.ai/api/v1/chat/completions")
    var openRouterModel by rememberPreference(OpenRouterModelKey, "mistralai/mistral-small-3.1-24b-instruct:free")
    var autoTranslateLyrics by rememberPreference(AutoTranslateLyricsKey, false)
    var autoTranslateLyricsMismatch by rememberPreference(AutoTranslateLyricsMismatchKey, false)
    var translateLanguage by rememberPreference(TranslateLanguageKey, "en")

    val aiProviders = mapOf(
        "OpenRouter" to "https://openrouter.ai/api/v1/chat/completions",
        "ChatGPT" to "https://api.openai.com/v1/chat/completions",
        "Perplexity" to "https://api.perplexity.ai/chat/completions",
        "Claude" to "https://api.anthropic.com/v1/messages",
        "Gemini" to "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "Grok" to "https://api.x.ai/v1/chat/completions",
        "Custom" to ""
    )

    val models = listOf(
        "google/gemini-flash-1.5",
        "openai/gpt-3.5-turbo",
        "anthropic/claude-3-haiku",
        "meta-llama/llama-3-8b-instruct"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI Settings") },
                navigationIcon = {
                    androidx.compose.material3.IconButton(onClick = { navController.navigateUp() }) {
                        androidx.compose.material3.Icon(
                            painterResource(R.drawable.arrow_back),
                            contentDescription = null
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    scrolledContainerColor = Color.Transparent
                ),
                scrollBehavior = scrollBehavior
            )
        },
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection)
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .windowInsetsPadding(LocalPlayerAwareWindowInsets.current.only(WindowInsetsSides.Bottom))
        ) {
            androidx.compose.material3.Card(
                colors = androidx.compose.material3.CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Setup Guide", 
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    val uriHandler = androidx.compose.ui.platform.LocalUriHandler.current
                    val annotatedString = androidx.compose.ui.text.buildAnnotatedString {
                        append("1. Select your Provider (e.g., OpenRouter, ChatGPT) or 'Custom'.\n")
                        append("2. Enter your API Key.\n")
                        append("3. If 'Custom', enter the Base URL provided by your service.\n\n")

                        append("Need an API Key? Try ")
                        val link = LinkAnnotation.Clickable("https://openrouter.ai") {
                            uriHandler.openUri("https://openrouter.ai")
                        }
                        withStyle(
                            style = androidx.compose.ui.text.SpanStyle(
                                color = MaterialTheme.colorScheme.primary,
                                textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline
                            )
                        ) {
                            withLink(link) {
                                append("OpenRouter.ai")
                            }
                        }
                        append(" for access to many models.")
                    }

                    Text(
                        text = annotatedString,
                        style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onSurface)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            ListPreference(
                title = { Text("Provider") },
                selectedValue = aiProvider,
                values = aiProviders.keys.toList(),
                valueText = { it },
                onValueSelected = { 
                    aiProvider = it
                    if (it != "Custom") {
                        openRouterBaseUrl = aiProviders[it] ?: ""
                    } else {
                        openRouterBaseUrl = ""
                    }
                    if (it == "OpenRouter") {
                        openRouterModel = "mistralai/mistral-small-3.1-24b-instruct:free"
                    } else {
                        openRouterModel = ""
                    }
                },
                icon = { androidx.compose.material3.Icon(painterResource(R.drawable.explore_outlined), null) }
            )

            if (aiProvider == "Custom") {
                EditTextPreference(
                    title = { Text("Base URL") },
                    value = openRouterBaseUrl,
                    onValueChange = { openRouterBaseUrl = it },
                    icon = { androidx.compose.material3.Icon(painterResource(R.drawable.link), null) }
                )
            }

            EditTextPreference(
                title = { Text("API Key") },
                value = openRouterApiKey,
                onValueChange = { openRouterApiKey = it },
                icon = { androidx.compose.material3.Icon(painterResource(R.drawable.key), null) }
            )

            EditTextPreference(
                title = { Text("Model") },
                value = openRouterModel,
                onValueChange = { openRouterModel = it },
                icon = { androidx.compose.material3.Icon(painterResource(R.drawable.discover_tune), null) }
            )

            SwitchPreference(
                title = { Text("Auto translate all songs") },
                checked = autoTranslateLyrics,
                onCheckedChange = { autoTranslateLyrics = it },
                icon = { androidx.compose.material3.Icon(painterResource(R.drawable.translate), null) }
            )

            if (autoTranslateLyrics) {
                SwitchPreference(
                    modifier = Modifier.padding(start = 24.dp),
                    title = { Text("Translate only on language mismatch") },
                    description = "Skip translation if lyrics identify as your system language",
                    checked = autoTranslateLyricsMismatch,
                    onCheckedChange = { autoTranslateLyricsMismatch = it }
                )

                var translateMode by rememberPreference(com.musika.app.constants.TranslateModeKey, "Literal")
                ListPreference(
                    modifier = Modifier.padding(start = 24.dp),
                    title = { Text("Translation Mode") },
                    selectedValue = translateMode,
                    values = listOf("Literal", "Transcribed"),
                    valueText = { 
                        when(it) {
                            "Literal" -> "Original + Translation"
                            "Transcribed" -> "Original + Transcribed"
                            else -> it
                        }
                    },
                    onValueSelected = { translateMode = it }
                )

                if (!autoTranslateLyricsMismatch) {
                    ListPreference(
                        modifier = Modifier.padding(start = 24.dp),
                        title = { Text("Target Language") },
                        selectedValue = translateLanguage,
                        values = LanguageCodeToName.keys.sortedBy { LanguageCodeToName[it] },
                        valueText = { LanguageCodeToName[it] ?: it },
                        onValueSelected = { translateLanguage = it }
                    )
                }
            }


        }
    }
}

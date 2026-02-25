package com.musika.app.ui.screens.settings.integrations

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.TextFieldValue
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.musika.app.LocalPlayerAwareWindowInsets
import com.musika.app.R
import com.musika.app.api.LastFmApi
import com.musika.app.constants.EnableScrobblingKey
import com.musika.app.constants.LastFmNowPlayingKey
import com.musika.app.constants.LastFmSessionKey
import com.musika.app.ui.component.IconButton
import com.musika.app.ui.component.Material3SettingsGroup
import com.musika.app.ui.component.Material3SettingsItem
import com.musika.app.ui.component.SwitchPreference
import com.musika.app.ui.component.TextFieldDialog
import com.musika.app.ui.utils.backToMain
import com.musika.app.utils.rememberPreference
import com.musika.app.viewmodels.IntegrationViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IntegrationScreen(
    navController: NavController,
    scrollBehavior: TopAppBarScrollBehavior,
) {
    val context = LocalContext.current
    val viewModel: IntegrationViewModel = hiltViewModel()
    val loginState by viewModel.loginState.collectAsState()

    val (enableScrobbling, onEnableScrobblingChange) = rememberPreference(
        EnableScrobblingKey,
        defaultValue = false
    )
    val (lastFmNowPlaying, onLastFmNowPlayingChange) = rememberPreference(
        LastFmNowPlayingKey,
        defaultValue = true
    )
    val (sessionKey, _) = rememberPreference(LastFmSessionKey, "")
    val isLoggedIn = sessionKey.isNotEmpty()

    var showLoginDialog by remember { mutableStateOf(false) }

    LaunchedEffect(loginState) {
        when (val state = loginState) {
            is IntegrationViewModel.LoginState.Success -> {
                showLoginDialog = false
                Toast.makeText(context, "Logged in to Last.fm", Toast.LENGTH_SHORT).show()
                viewModel.clearLoginState()
            }
            is IntegrationViewModel.LoginState.Error -> {
                Toast.makeText(context, state.message, Toast.LENGTH_LONG).show()
                viewModel.clearLoginState()
            }
            else -> {}
        }
    }

    if (showLoginDialog) {
        LastFmLoginDialog(
            onLogin = { u, p -> viewModel.login(u, p) },
            onDismiss = {
                showLoginDialog = false
                viewModel.clearLoginState()
            },
        )
    }

    Column(
        Modifier
            .windowInsetsPadding(LocalPlayerAwareWindowInsets.current)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(
            Modifier.windowInsetsPadding(
                LocalPlayerAwareWindowInsets.current.only(WindowInsetsSides.Top)
            )
        )

        if (!LastFmApi.isConfigured) {
            Material3SettingsGroup(
                title = stringResource(R.string.lastfm_integration),
                items = listOf(
                    Material3SettingsItem(
                        title = { Text(stringResource(R.string.lastfm_api_key_required)) },
                    )
                )
            )
        } else {
            Material3SettingsGroup(
                title = stringResource(R.string.lastfm_integration),
                items = listOf(
                    Material3SettingsItem(
                        icon = painterResource(R.drawable.equalizer),
                        title = {
                            Text(
                                if (isLoggedIn) stringResource(R.string.lastfm_logged_in)
                                else stringResource(R.string.lastfm_login)
                            )
                        },
                        onClick = {
                            if (isLoggedIn) {
                                viewModel.logout()
                                Toast.makeText(context, "Logged out", Toast.LENGTH_SHORT).show()
                            } else {
                                showLoginDialog = true
                            }
                        },
                    )
                )
            )

            SwitchPreference(
                title = { Text(stringResource(R.string.enable_scrobbling)) },
                icon = { Icon(painterResource(R.drawable.equalizer), null) },
                checked = enableScrobbling,
                onCheckedChange = onEnableScrobblingChange,
                isEnabled = isLoggedIn,
            )

            SwitchPreference(
                title = { Text(stringResource(R.string.lastfm_now_playing)) },
                description = stringResource(R.string.lastfm_now_playing),
                icon = { Icon(painterResource(R.drawable.equalizer), null) },
                checked = lastFmNowPlaying,
                onCheckedChange = onLastFmNowPlayingChange,
                isEnabled = isLoggedIn && enableScrobbling,
            )
        }
    }

    TopAppBar(
        title = { Text(stringResource(R.string.integrations)) },
        navigationIcon = {
            IconButton(
                onClick = navController::navigateUp,
                onLongClick = navController::backToMain,
            ) {
                Icon(
                    painterResource(R.drawable.arrow_back),
                    contentDescription = null,
                )
            }
        }
    )
}

@Composable
private fun LastFmLoginDialog(
    onLogin: (username: String, password: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var usernameState by remember { mutableStateOf(TextFieldValue()) }
    var passwordState by remember { mutableStateOf(TextFieldValue()) }

    TextFieldDialog(
        title = { Text(stringResource(R.string.lastfm_login)) },
        textFields = listOf(
            stringResource(R.string.username) to usernameState,
            stringResource(R.string.password) to passwordState,
        ),
        onTextFieldsChange = { index, value ->
            when (index) {
                0 -> usernameState = value
                1 -> passwordState = value
            }
        },
        isInputValid = { it.isNotBlank() },
        onDoneMultiple = { values ->
            if (values.size >= 2) {
                onLogin(values[0], values[1])
            }
        },
        onDismiss = onDismiss,
    )
}

package com.musika.app.ui.screens.settings

import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.musika.app.LocalPlayerAwareWindowInsets
import com.musika.app.R
import com.musika.app.auth.MusikaAccountViewModel
import com.musika.app.ui.component.IconButton
import com.musika.app.ui.utils.backToMain
import androidx.compose.material3.Icon
import androidx.compose.ui.res.painterResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MusikaAccountScreen(
    navController: NavController,
    scrollBehavior: TopAppBarScrollBehavior,
    viewModel: MusikaAccountViewModel = hiltViewModel(),
) {
    val activity = LocalActivity.current
    var refreshTick by remember { mutableIntStateOf(0) }
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val err by viewModel.error.collectAsStateWithLifecycle()

    val configured = remember(refreshTick) { viewModel.configured() }
    val signedIn = remember(refreshTick) { viewModel.signedInSnapshot() }
    val label = remember(refreshTick) { viewModel.labelSnapshot() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .windowInsetsPadding(LocalPlayerAwareWindowInsets.current.only(WindowInsetsSides.Horizontal + WindowInsetsSides.Bottom)),
    ) {
        TopAppBar(
            title = { Text(stringResource(R.string.musika_account)) },
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
            },
            scrollBehavior = scrollBehavior,
        )
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
        ) {
            Spacer(
                Modifier.windowInsetsPadding(
                    LocalPlayerAwareWindowInsets.current.only(WindowInsetsSides.Top),
                ),
            )
            Text(
                text = stringResource(R.string.musika_account_summary),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))
            if (!configured) {
                Text(
                    text = stringResource(R.string.musika_auth_not_configured),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error,
                )
            } else {
                if (signedIn && label != null) {
                    Text(
                        text = stringResource(R.string.musika_signed_in_as, label),
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Spacer(Modifier.height(16.dp))
                }
                if (busy) {
                    CircularProgressIndicator()
                    Spacer(Modifier.height(16.dp))
                }
                err?.let { msg ->
                    Text(
                        text = msg,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                    Spacer(Modifier.height(8.dp))
                }
                if (activity != null && !signedIn) {
                    Button(
                        onClick = { viewModel.signIn(activity) { refreshTick++ } },
                        enabled = !busy && configured,
                    ) {
                        Text(stringResource(R.string.musika_sign_in_google))
                    }
                }
                if (signedIn) {
                    OutlinedButton(
                        onClick = { viewModel.signOut { refreshTick++ } },
                        enabled = !busy,
                    ) {
                        Text(stringResource(R.string.musika_sign_out))
                    }
                }
            }
        }
    }
}

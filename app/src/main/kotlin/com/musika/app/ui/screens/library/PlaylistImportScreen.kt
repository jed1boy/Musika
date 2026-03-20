package com.musika.app.ui.screens.library

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.musika.app.LocalPlayerAwareWindowInsets
import com.musika.app.R
import com.musika.app.constants.InnerTubeCookieKey
import com.musika.app.playlistimport.ImportPhase
import com.musika.app.playlistimport.openUrlInBrowser
import com.musika.app.utils.rememberPreference
import com.musika.app.viewmodels.PlaylistImportViewModel
import com.musika.innertube.utils.parseCookieString

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlaylistImportScreen(
    navController: NavController,
    scrollBehavior: TopAppBarScrollBehavior,
    viewModel: PlaylistImportViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val innerTubeCookie by rememberPreference(InnerTubeCookieKey, "")
    val isYtmLoggedIn = "SAPISID" in parseCookieString(innerTubeCookie)

    val busy by viewModel.busy.collectAsState(initial = false)
    val progress by viewModel.progress.collectAsState(initial = null)
    val result by viewModel.result.collectAsState(initial = null)
    val error by viewModel.error.collectAsState(initial = null)

    val pickFile = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri ->
        uri?.let { viewModel.loadFile(it) }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.playlist_import_title)) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            painter = painterResource(R.drawable.arrow_back),
                            contentDescription = null,
                        )
                    }
                },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.topAppBarColors(
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                ),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .windowInsetsPadding(LocalPlayerAwareWindowInsets.current)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = stringResource(R.string.playlist_import_file_help),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = stringResource(R.string.playlist_import_format_hint),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = stringResource(R.string.playlist_import_export_tools),
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Column {
                TextButton(
                    onClick = {
                        openUrlInBrowser(
                            context,
                            context.getString(R.string.url_playlist_export_exportify),
                        )
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = stringResource(R.string.playlist_import_link_exportify),
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
                TextButton(
                    onClick = {
                        openUrlInBrowser(
                            context,
                            context.getString(R.string.url_playlist_export_tune_my_music),
                        )
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = stringResource(R.string.playlist_import_link_tune_my_music),
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
                TextButton(
                    onClick = {
                        openUrlInBrowser(
                            context,
                            context.getString(R.string.url_playlist_export_soundiiz),
                        )
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = stringResource(R.string.playlist_import_link_soundiiz),
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            }
            OutlinedButton(
                onClick = {
                    pickFile.launch(arrayOf("text/*", "application/json"))
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.playlist_import_choose_file))
            }

            if (viewModel.tracksPreview.isNotEmpty()) {
                Text(
                    text = stringResource(R.string.preview) + ": ${viewModel.tracksPreview.size} " + stringResource(R.string.songs).lowercase(),
                    style = MaterialTheme.typography.titleSmall,
                )
                viewModel.tracksPreview.take(5).forEach { t ->
                    val artistLine = t.primaryArtist
                    Text(
                        text = if (artistLine.isEmpty()) t.title else "$artistLine — ${t.title}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (viewModel.tracksPreview.size > 5) {
                    Text("…", style = MaterialTheme.typography.bodySmall)
                }

                OutlinedTextField(
                    value = viewModel.playlistTitle,
                    onValueChange = viewModel::updatePlaylistTitle,
                    label = { Text(stringResource(R.string.playlist_import_playlist_name)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !busy,
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = viewModel.saveLocal,
                        onCheckedChange = viewModel::updateSaveLocal,
                        enabled = !busy,
                    )
                    Text(stringResource(R.string.playlist_import_save_local))
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = viewModel.saveYtm,
                        onCheckedChange = viewModel::updateSaveYtm,
                        enabled = !busy && isYtmLoggedIn,
                    )
                    Text(stringResource(R.string.playlist_import_save_ytm))
                }
                if (!isYtmLoggedIn) {
                    Text(
                        text = stringResource(R.string.playlist_import_not_signed_ytm),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                OutlinedTextField(
                    value = viewModel.existingYtmPlaylistField,
                    onValueChange = viewModel::updateExistingYtmField,
                    label = { Text(stringResource(R.string.playlist_import_ytm_existing_hint)) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !busy && viewModel.saveYtm,
                    minLines = 2,
                )

                progress?.let { p ->
                    val label = when (p.phase) {
                        ImportPhase.Matching -> stringResource(R.string.playlist_import_matching)
                        ImportPhase.WritingLocal -> stringResource(R.string.playlist_import_writing_local)
                        ImportPhase.WritingYtm -> stringResource(R.string.playlist_import_writing_ytm)
                    }
                    Text(label)
                    LinearProgressIndicator(
                        progress = { p.current.toFloat() / p.total.coerceAtLeast(1) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    p.lastTitle?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { viewModel.startImport() },
                        enabled = !busy,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(stringResource(R.string.playlist_import_start))
                    }
                    OutlinedButton(
                        onClick = { viewModel.cancelImport() },
                        enabled = busy,
                    ) {
                        Text(stringResource(R.string.playlist_import_cancel))
                    }
                }
            }

            error?.let { msg ->
                Text(msg, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(4.dp))
                OutlinedButton(onClick = { viewModel.clearError() }) {
                    Text(stringResource(R.string.dismiss))
                }
            }

            result?.let { r ->
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.playlist_import_done), style = MaterialTheme.typography.titleSmall)
                Text(stringResource(R.string.playlist_import_matched, r.matchedCount))
                if (r.failedTracks.isNotEmpty()) {
                    Text(stringResource(R.string.playlist_import_failed_count, r.failedTracks.size))
                }
                r.localPlaylistId?.let { id ->
                    Button(
                        onClick = {
                            navController.navigate("local_playlist/$id")
                        },
                    ) {
                        Text(stringResource(R.string.playlist_import_open_local))
                    }
                }
            }
        }
    }

}

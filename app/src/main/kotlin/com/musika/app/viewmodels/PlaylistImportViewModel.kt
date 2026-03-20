package com.musika.app.viewmodels

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.musika.app.constants.HideExplicitKey
import com.musika.app.db.MusicDatabase
import com.musika.app.playlistimport.ImportProgress
import com.musika.app.playlistimport.ImportTrack
import com.musika.app.playlistimport.PlaylistFileParser
import com.musika.app.playlistimport.PlaylistImportPipeline
import com.musika.app.playlistimport.PlaylistImportResult
import com.musika.app.playlistimport.YtmPlaylistIds
import com.musika.app.utils.dataStore
import com.musika.app.utils.get
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import javax.inject.Inject

@HiltViewModel
class PlaylistImportViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val database: MusicDatabase,
) : ViewModel() {

    var playlistTitle by mutableStateOf("")
        private set

    var existingYtmPlaylistField by mutableStateOf("")
        private set

    var saveLocal by mutableStateOf(true)
        private set

    var saveYtm by mutableStateOf(false)
        private set

    var tracksPreview by mutableStateOf<List<ImportTrack>>(emptyList())
        private set

    private val _progress = MutableStateFlow<ImportProgress?>(null)
    val progress: StateFlow<ImportProgress?> = _progress.asStateFlow()

    private val _result = MutableStateFlow<PlaylistImportResult?>(null)
    val result: StateFlow<PlaylistImportResult?> = _result.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private var importJob: Job? = null
    private var cancelled = false

    fun updatePlaylistTitle(value: String) {
        playlistTitle = value
    }

    fun updateExistingYtmField(value: String) {
        existingYtmPlaylistField = value
    }

    fun updateSaveLocal(value: Boolean) {
        saveLocal = value
    }

    fun updateSaveYtm(value: Boolean) {
        saveYtm = value
    }

    fun clearError() {
        _error.value = null
    }

    fun clearResult() {
        _result.value = null
    }

    fun loadFile(uri: Uri) {
        viewModelScope.launch {
            _busy.value = true
            _error.value = null
            try {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    val text = BufferedReader(InputStreamReader(stream)).readText()
                    val defaultTitle = uri.lastPathSegment?.removeSuffix(".csv")?.removeSuffix(".json")
                        ?: context.getString(com.musika.app.R.string.import_playlist)
                    val (title, tracks) = PlaylistFileParser.parseFileNameAndTracks(text, defaultTitle)
                    playlistTitle = title
                    tracksPreview = tracks
                    if (tracks.isEmpty()) {
                        _error.value = context.getString(com.musika.app.R.string.playlist_import_no_tracks)
                    }
                } ?: run {
                    _error.value = context.getString(com.musika.app.R.string.playlist_import_file_failed)
                }
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _busy.value = false
            }
        }
    }

    fun startImport() {
        if (tracksPreview.isEmpty()) {
            _error.value = context.getString(com.musika.app.R.string.playlist_import_no_tracks)
            return
        }
        if (!saveLocal && !saveYtm) {
            _error.value = context.getString(com.musika.app.R.string.playlist_import_pick_destination)
            return
        }
        val ytmId = existingYtmPlaylistField.trim().takeIf { it.isNotEmpty() }?.let { YtmPlaylistIds.fromUserInput(it) }
        if (saveYtm && ytmId == null && existingYtmPlaylistField.isNotBlank()) {
            _error.value = context.getString(com.musika.app.R.string.playlist_import_ytm_id_invalid)
            return
        }

        importJob?.cancel()
        cancelled = false
        _result.value = null
        _progress.value = null
        importJob = viewModelScope.launch {
            _busy.value = true
            val hideExplicit = context.dataStore.get(HideExplicitKey, false)
            val title = playlistTitle.trim().ifEmpty {
                context.getString(com.musika.app.R.string.import_playlist)
            }
            val res = PlaylistImportPipeline.run(
                database = database,
                tracks = tracksPreview,
                playlistTitle = title,
                saveLocal = saveLocal,
                saveYtm = saveYtm,
                existingYtmPlaylistId = ytmId,
                hideExplicit = hideExplicit,
                onProgress = { _progress.value = it },
                isCancelled = { cancelled },
            )
            _result.value = res
            _busy.value = false
        }
    }

    fun cancelImport() {
        cancelled = true
        importJob?.cancel()
    }
}

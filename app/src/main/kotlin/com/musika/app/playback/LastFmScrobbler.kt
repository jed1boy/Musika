package com.musika.app.playback

import android.content.Context
import com.musika.app.api.LastFmApi
import com.musika.app.constants.EnableScrobblingKey
import com.musika.app.constants.LastFmNowPlayingKey
import com.musika.app.constants.LastFmSessionKey
import com.musika.app.models.MediaMetadata
import com.musika.app.utils.dataStore
import com.musika.app.utils.getSensitivePreference
import com.musika.app.utils.reportException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber

/**
 * Handles Last.fm Now Playing and Scrobbling.
 * Scrobble rules: track > 30s, played for 50% or 4 minutes (whichever earlier).
 */
class LastFmScrobbler(
    private val context: Context,
    private val scope: CoroutineScope,
) {
    private var lastTrackId: String? = null
    private var lastTrackStartTime: Long = 0
    var lastPositionMs: Long = 0
        set(value) {
            if (lastTrackId != null) field = value
        }

    fun onTrackStarted(metadata: MediaMetadata?) {
        if (metadata == null) return
        scope.launch(Dispatchers.IO) {
            val sessionKey = context.getSensitivePreference(LastFmSessionKey, "")
            val enableScrobbling = context.dataStore.data.first()[EnableScrobblingKey] ?: false
            val sendNowPlaying = context.dataStore.data.first()[LastFmNowPlayingKey] ?: true
            if (sessionKey.isEmpty() || !enableScrobbling || !LastFmApi.isConfigured) return@launch

            lastTrackId = metadata.id
            lastTrackStartTime = System.currentTimeMillis()
            lastPositionMs = 0

            if (sendNowPlaying) {
                val artist = metadata.artists.firstOrNull()?.name ?: "Unknown Artist"
                val track = metadata.title
                val album = metadata.album?.title
                val duration = if (metadata.duration > 0) metadata.duration else null

                LastFmApi.updateNowPlaying(
                    sessionKey = sessionKey,
                    artist = artist,
                    track = track,
                    album = album,
                    durationSeconds = duration,
                ).onFailure {
                    Timber.e(it, "Last.fm Now Playing failed")
                    reportException(it)
                }
            }
        }
    }

    fun onTrackEnded(metadata: MediaMetadata?, positionMs: Long = lastPositionMs) {
        if (metadata == null) return
        scope.launch(Dispatchers.IO) {
            val sessionKey = context.getSensitivePreference(LastFmSessionKey, "")
            val enableScrobbling = context.dataStore.data.first()[EnableScrobblingKey] ?: false
            if (sessionKey.isEmpty() || !enableScrobbling || !LastFmApi.isConfigured) return@launch

            val durationSec = metadata.duration.coerceAtLeast(0)
            if (durationSec < 30) return@launch // Last.fm requires track > 30 seconds

            val positionSec = (positionMs / 1000).toInt()
            val scrobbleThreshold = minOf(
                durationSec / 2, // 50%
                240 // 4 minutes
            )
            if (positionSec < scrobbleThreshold) return@launch

            val timestamp = (lastTrackStartTime / 1000) - positionSec
            val artist = metadata.artists.firstOrNull()?.name ?: "Unknown Artist"
            val track = metadata.title
            val album = metadata.album?.title

            LastFmApi.scrobble(
                sessionKey = sessionKey,
                artist = artist,
                track = track,
                timestamp = timestamp,
                album = album,
                durationSeconds = durationSec,
            ).onFailure {
                Timber.e(it, "Last.fm Scrobble failed")
                reportException(it)
            }

            lastTrackId = null
        }
    }
}

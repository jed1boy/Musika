package com.musika.app.lyrics

import com.musika.app.lyrics.simpmusic.SimpMusicLyricsProvider

import android.content.Context
import android.util.LruCache
import com.musika.app.constants.PreferredLyricsProvider
import com.musika.app.constants.PreferredLyricsProviderKey
import com.musika.app.db.entities.LyricsEntity.Companion.LYRICS_NOT_FOUND
import com.musika.app.extensions.toEnum
import com.musika.app.models.MediaMetadata
import com.musika.app.utils.dataStore
import com.musika.app.utils.reportException
import com.musika.app.utils.NetworkConnectivityObserver
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject

class LyricsHelper
@Inject
constructor(
    @ApplicationContext private val context: Context,
    private val networkConnectivity: NetworkConnectivityObserver,
) {
    private var lyricsProviders =
        listOf(
            LrcLibLyricsProvider,
            SimpMusicLyricsProvider,
            KuGouLyricsProvider,
            YouTubeSubtitleLyricsProvider,
            YouTubeLyricsProvider
        )

    val preferred =
        context.dataStore.data
            .map {
                it[PreferredLyricsProviderKey].toEnum(PreferredLyricsProvider.LRCLIB)
            }.distinctUntilChanged()
            .map {
                lyricsProviders = when (it) {
                    PreferredLyricsProvider.LRCLIB -> listOf(
                        LrcLibLyricsProvider,
                        SimpMusicLyricsProvider,
                        KuGouLyricsProvider,
                        YouTubeSubtitleLyricsProvider,
                        YouTubeLyricsProvider
                    )
                    PreferredLyricsProvider.SIMPMUSIC -> listOf(
                        SimpMusicLyricsProvider,
                        LrcLibLyricsProvider,
                        KuGouLyricsProvider,
                        YouTubeSubtitleLyricsProvider,
                        YouTubeLyricsProvider
                    )
                    PreferredLyricsProvider.KUGOU -> listOf(
                        KuGouLyricsProvider,
                        LrcLibLyricsProvider,
                        SimpMusicLyricsProvider,
                        YouTubeSubtitleLyricsProvider,
                        YouTubeLyricsProvider
                    )
                    PreferredLyricsProvider.YOUTUBE_SUBTITLE -> listOf(
                        YouTubeSubtitleLyricsProvider,
                        LrcLibLyricsProvider,
                        SimpMusicLyricsProvider,
                        KuGouLyricsProvider,
                        YouTubeLyricsProvider
                    )
                    PreferredLyricsProvider.YOUTUBE_MUSIC -> listOf(
                        YouTubeLyricsProvider,
                        LrcLibLyricsProvider,
                        SimpMusicLyricsProvider,
                        KuGouLyricsProvider,
                        YouTubeSubtitleLyricsProvider
                    )
                }
            }

    private val cache = LruCache<String, List<LyricsResult>>(MAX_CACHE_SIZE)
    private val inFlightRequests = ConcurrentHashMap<String, Deferred<String>>()
    private var currentLyricsJob: Job? = null

    suspend fun getLyrics(mediaMetadata: MediaMetadata): String {
        val cached = cache.get(mediaMetadata.id)?.firstOrNull()
        if (cached != null) return cached.lyrics

        inFlightRequests[mediaMetadata.id]?.let { existing ->
            return try { existing.await() } catch (_: Exception) { LYRICS_NOT_FOUND }
        }

        val isNetworkAvailable = try {
            networkConnectivity.isCurrentlyConnected()
        } catch (_: Exception) { true }

        if (!isNetworkAvailable) return LYRICS_NOT_FOUND

        val deferred = CompletableDeferred<String>()
        inFlightRequests[mediaMetadata.id] = deferred

        try {
            val lyrics = raceProviders(mediaMetadata)
            if (lyrics != LYRICS_NOT_FOUND) {
                cache.put(mediaMetadata.id, listOf(LyricsResult("", lyrics)))
            }
            deferred.complete(lyrics)
            return lyrics
        } catch (e: Exception) {
            deferred.completeExceptionally(e)
            return LYRICS_NOT_FOUND
        } finally {
            inFlightRequests.remove(mediaMetadata.id)
        }
    }

    private suspend fun raceProviders(mediaMetadata: MediaMetadata): String {
        val enabledProviders = lyricsProviders.filter { it.isEnabled(context) }
        if (enabledProviders.isEmpty()) return LYRICS_NOT_FOUND

        val id = mediaMetadata.id
        val title = mediaMetadata.title
        val artist = mediaMetadata.artists.joinToString { it.name }
        val duration = mediaMetadata.duration

        return coroutineScope {
            val result = CompletableDeferred<String>()
            val jobs = mutableListOf<Job>()

            enabledProviders.forEachIndexed { index, provider ->
                val job = launch {
                    if (index > 0) delay(index * STAGGER_DELAY_MS)
                    if (result.isCompleted) return@launch
                    try {
                        withTimeout(PER_PROVIDER_TIMEOUT_MS) {
                            provider.getLyrics(id, title, artist, duration)
                                .onSuccess { lyrics ->
                                    result.complete(lyrics)
                                }
                                .onFailure { reportException(it) }
                        }
                    } catch (_: Exception) { }
                }
                jobs += job
            }

            val lyrics = try {
                withTimeout(TOTAL_TIMEOUT_MS) { result.await() }
            } catch (_: Exception) { LYRICS_NOT_FOUND }

            jobs.forEach { it.cancel() }
            lyrics
        }
    }

    suspend fun getAllLyrics(
        mediaId: String,
        songTitle: String,
        songArtists: String,
        duration: Int,
        callback: (LyricsResult) -> Unit,
    ) {
        currentLyricsJob?.cancel()

        val cacheKey = "$songArtists-$songTitle".replace(" ", "")
        cache.get(cacheKey)?.let { results ->
            results.forEach { callback(it) }
            return
        }

        val isNetworkAvailable = try {
            networkConnectivity.isCurrentlyConnected()
        } catch (_: Exception) { true }

        if (!isNetworkAvailable) return

        val allResult = mutableListOf<LyricsResult>()
        currentLyricsJob = CoroutineScope(SupervisorJob()).launch {
            lyricsProviders.forEach { provider ->
                if (provider.isEnabled(context)) {
                    try {
                        provider.getAllLyrics(mediaId, songTitle, songArtists, duration) { lyrics ->
                            val result = LyricsResult(provider.name, lyrics)
                            allResult += result
                            callback(result)
                        }
                    } catch (e: Exception) {
                        reportException(e)
                    }
                }
            }
            cache.put(cacheKey, allResult)
        }

        currentLyricsJob?.join()
    }

    fun cancelCurrentLyricsJob() {
        currentLyricsJob?.cancel()
        currentLyricsJob = null
    }

    companion object {
        private const val MAX_CACHE_SIZE = 50
        private const val PER_PROVIDER_TIMEOUT_MS = 8_000L
        private const val STAGGER_DELAY_MS = 2_000L
        private const val TOTAL_TIMEOUT_MS = 15_000L
    }
}

data class LyricsResult(
    val providerName: String,
    val lyrics: String,
)

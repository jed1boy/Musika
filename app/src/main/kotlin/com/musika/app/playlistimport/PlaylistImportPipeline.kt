package com.musika.app.playlistimport

import com.musika.app.db.MusicDatabase
import com.musika.app.db.entities.Playlist
import com.musika.app.db.entities.PlaylistEntity
import com.musika.app.models.toMediaMetadata
import com.musika.innertube.YouTube
import com.musika.innertube.models.SongItem
import kotlinx.coroutines.delay
import java.time.LocalDateTime

object PlaylistImportPipeline {

    private const val DEFAULT_STEP_DELAY_MS = 450L

    suspend fun run(
        database: MusicDatabase,
        tracks: List<ImportTrack>,
        playlistTitle: String,
        saveLocal: Boolean,
        saveYtm: Boolean,
        existingYtmPlaylistId: String?,
        hideExplicit: Boolean,
        stepDelayMs: Long = DEFAULT_STEP_DELAY_MS,
        onProgress: (ImportProgress) -> Unit,
        isCancelled: () -> Boolean,
    ): PlaylistImportResult {
        if (tracks.isEmpty()) {
            return PlaylistImportResult(0, emptyList(), null, null)
        }

        val matched = mutableListOf<Pair<ImportTrack, SongItem>>()
        val failed = mutableListOf<ImportTrack>()

        for ((index, track) in tracks.withIndex()) {
            if (isCancelled()) {
                failed.addAll(tracks.drop(index))
                break
            }
            onProgress(
                ImportProgress(
                    current = index + 1,
                    total = tracks.size,
                    phase = ImportPhase.Matching,
                    lastTitle = track.title,
                ),
            )
            val song = YtmTrackMatcher.match(track, hideExplicit)
            if (song != null) {
                matched.add(track to song)
            } else {
                failed.add(track)
            }
            delay(stepDelayMs)
        }

        var localId: String? = null
        var ytmId: String? = null

        if (saveLocal && matched.isNotEmpty()) {
            onProgress(ImportProgress(tracks.size, tracks.size, ImportPhase.WritingLocal, null))
            val entity = PlaylistEntity(name = playlistTitle, bookmarkedAt = LocalDateTime.now(), isEditable = true)
            localId = entity.id
            val playlistRow = Playlist(playlist = entity, songCount = 0, songThumbnails = emptyList())
            database.suspendTransaction {
                insert(entity)
                matched.forEach { (_, song) ->
                    insert(song.toMediaMetadata())
                }
                addSongToPlaylist(playlistRow, matched.map { it.second.id })
            }
        }

        if (saveYtm && matched.isNotEmpty()) {
            onProgress(ImportProgress(tracks.size, tracks.size, ImportPhase.WritingYtm, null))
            ytmId = existingYtmPlaylistId?.trim()?.removePrefix("VL")?.takeIf { it.isNotEmpty() }
                ?: try {
                    YouTube.createPlaylist(playlistTitle)
                } catch (_: Exception) {
                    null
                }
            if (ytmId != null) {
                val pid = ytmId.removePrefix("VL")
                for ((_, song) in matched) {
                    if (isCancelled()) break
                    YouTube.addToPlaylist(pid, song.id).onFailure { }
                    delay(stepDelayMs)
                }
            }
        }

        return PlaylistImportResult(
            matchedCount = matched.size,
            failedTracks = failed,
            localPlaylistId = localId,
            ytmPlaylistId = ytmId,
        )
    }
}

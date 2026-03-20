package com.musika.app.playlistimport

data class ImportTrack(
    val title: String,
    val artists: List<String> = emptyList(),
    val isrc: String? = null,
    val sourceId: String? = null,
) {
    val primaryArtist: String
        get() = artists.firstOrNull()?.trim().orEmpty()
}

enum class ImportPhase {
    Matching,
    WritingLocal,
    WritingYtm,
}

data class ImportProgress(
    val current: Int,
    val total: Int,
    val phase: ImportPhase,
    val lastTitle: String?,
)

data class PlaylistImportResult(
    val matchedCount: Int,
    val failedTracks: List<ImportTrack>,
    val localPlaylistId: String?,
    val ytmPlaylistId: String?,
)

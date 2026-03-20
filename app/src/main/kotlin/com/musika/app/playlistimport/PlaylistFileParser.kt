package com.musika.app.playlistimport

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken

/**
 * Parses Exportify-style CSV (quoted fields) and Musika JSON playlist exports.
 *
 * JSON: `{ "title": "Optional name", "tracks": [ { "title", "artist"|"artists", "isrc" } ] }`
 * or `[ { "title", "artist" } ]`.
 */
object PlaylistFileParser {

    private val gson = Gson()

    private data class MusikaPlaylistFile(
        val title: String? = null,
        val tracks: List<MusikaTrackJson>? = null,
    )

    private data class MusikaTrackJson(
        val title: String,
        val artist: String? = null,
        val artists: List<String>? = null,
        val isrc: String? = null,
        @SerializedName("spotify_uri") val spotifyUri: String? = null,
        @SerializedName("source_id") val sourceId: String? = null,
    )

    fun parseFileNameAndTracks(text: String, defaultTitle: String): Pair<String, List<ImportTrack>> {
        val trimmed = text.trim()
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            return parseJson(trimmed, defaultTitle)
        }
        return defaultTitle to parseExportifyCsv(trimmed)
    }

    fun parseJson(text: String, defaultTitle: String): Pair<String, List<ImportTrack>> {
        return try {
            when {
                text.trimStart().startsWith("[") -> {
                    val type = object : TypeToken<List<MusikaTrackJson>>() {}.type
                    val tracks: List<MusikaTrackJson> = gson.fromJson(text, type)
                    defaultTitle to tracks.map { it.toImportTrack() }
                }
                else -> {
                    val root = gson.fromJson(text, MusikaPlaylistFile::class.java)
                    val title = root.title?.takeIf { it.isNotBlank() } ?: defaultTitle
                    val tracks = root.tracks.orEmpty().map { it.toImportTrack() }
                    title to tracks
                }
            }
        } catch (_: Exception) {
            defaultTitle to emptyList()
        }
    }

    private fun MusikaTrackJson.toImportTrack(): ImportTrack {
        val artistList = when {
            !artists.isNullOrEmpty() -> artists
            !artist.isNullOrBlank() -> listOf(artist)
            else -> emptyList()
        }
        return ImportTrack(
            title = title.trim(),
            artists = artistList.map { it.trim() }.filter { it.isNotEmpty() },
            isrc = isrc?.takeIf { it.isNotBlank() },
            sourceId = spotifyUri ?: sourceId,
        )
    }

    fun parseExportifyCsv(csvText: String): List<ImportTrack> {
        val lines = csvText.lines().map { it.trimEnd() }.filter { it.isNotBlank() }
        if (lines.isEmpty()) return emptyList()
        val header = parseCsvLine(lines.first()).map { it.trim().lowercase() }
        val titleIdx = header.indexOfFirst { it == "track name" || it == "name" || it == "title" }
        val artistIdx = header.indexOfFirst {
            it == "artist name(s)" || it == "artist name" || it == "artist" || it == "artists"
        }
        val isrcIdx = header.indexOfFirst { it == "isrc" }
        val uriIdx = header.indexOfFirst { it == "track uri" || it == "uri" }
        if (titleIdx < 0) return emptyList()

        return lines.drop(1).mapNotNull { line ->
            val cols = parseCsvLine(line)
            val title = cols.getOrNull(titleIdx)?.trim().orEmpty()
            if (title.isEmpty()) return@mapNotNull null
            val artistCell = artistIdx.takeIf { it >= 0 }?.let { cols.getOrNull(it) }?.trim().orEmpty()
            val artists = artistCell.split(Regex("\\s*[,;]\\s*")).map { it.trim() }.filter { it.isNotEmpty() }
            val isrc = isrcIdx.takeIf { it >= 0 }?.let { cols.getOrNull(it)?.trim()?.takeIf { s -> s.isNotEmpty() } }
            val uri = uriIdx.takeIf { it >= 0 }?.let { cols.getOrNull(it)?.trim()?.takeIf { s -> s.isNotEmpty() } }
            ImportTrack(title = title, artists = artists, isrc = isrc, sourceId = uri)
        }
    }

    fun parseCsvLine(line: String): List<String> {
        val out = mutableListOf<String>()
        val current = StringBuilder()
        var inQuotes = false
        var i = 0
        while (i < line.length) {
            val c = line[i]
            when {
                c == '"' -> {
                    if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
                        current.append('"')
                        i += 2
                        continue
                    } else {
                        inQuotes = !inQuotes
                    }
                }
                c == ',' && !inQuotes -> {
                    out.add(current.toString())
                    current.clear()
                }
                else -> current.append(c)
            }
            i++
        }
        out.add(current.toString())
        return out
    }
}

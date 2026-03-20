package com.musika.app.playlistimport

import com.musika.innertube.YouTube
import com.musika.innertube.models.SongItem
import com.musika.innertube.models.filterExplicit

object YtmTrackMatcher {

    suspend fun match(
        track: ImportTrack,
        hideExplicit: Boolean,
    ): SongItem? {
        for (query in searchQueries(track)) {
            val result = YouTube.search(query, YouTube.SearchFilter.FILTER_SONG).getOrNull() ?: continue
            val songs = result.items.filterIsInstance<SongItem>().let { list ->
                if (hideExplicit) list.filterExplicit(enabled = true) else list
            }
            val first = songs.firstOrNull() ?: continue
            return first
        }
        return null
    }

    internal fun searchQueries(track: ImportTrack): List<String> {
        val title = normalizeTitle(track.title)
        val artist = track.primaryArtist
        val queries = mutableListOf<String>()
        if (artist.isNotEmpty()) {
            queries.add("$title $artist")
            queries.add("$artist - $title")
        }
        queries.add(title)
        val stripped = stripFeaturedArtists(title)
        if (stripped != title) {
            if (artist.isNotEmpty()) {
                queries.add("$stripped $artist")
                queries.add("$artist - $stripped")
            }
            queries.add(stripped)
        }
        return queries.distinct()
    }

    private fun normalizeTitle(raw: String): String =
        raw.replace(Regex("\\s+"), " ").trim()

    private fun stripFeaturedArtists(title: String): String {
        var t = title
        listOf(
            Regex("\\s*\\(feat\\.[^)]+\\)", RegexOption.IGNORE_CASE),
            Regex("\\s*\\(ft\\.[^)]+\\)", RegexOption.IGNORE_CASE),
            Regex("\\s*\\[feat\\.[^]]+]", RegexOption.IGNORE_CASE),
            Regex("\\s+feat\\.\\s+.+$", RegexOption.IGNORE_CASE),
            Regex("\\s+ft\\.\\s+.+$", RegexOption.IGNORE_CASE),
        ).forEach { t = it.replace(t, "") }
        return t.replace(Regex("\\s+"), " ").trim()
    }
}

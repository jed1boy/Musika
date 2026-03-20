package com.musika.app.playlistimport

object YtmPlaylistIds {
    /** Accepts a raw playlist id or music.youtube.com / youtube.com URL with list=. */
    fun fromUserInput(input: String): String? {
        val s = input.trim()
        Regex("[?&]list=([^&\\s]+)").find(s)?.groupValues?.getOrNull(1)?.let {
            return it.removePrefix("VL").takeIf { id -> id.isNotEmpty() }
        }
        val cleaned = s.removePrefix("VL").trim()
        if (cleaned.matches(Regex("[a-zA-Z0-9_-]{10,}"))) return cleaned
        return null
    }
}

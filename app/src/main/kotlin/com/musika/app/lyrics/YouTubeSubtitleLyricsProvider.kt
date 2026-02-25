package com.musika.app.lyrics

import android.content.Context
import com.musika.app.constants.EnableYouTubeSubtitleKey
import com.musika.app.utils.dataStore
import com.musika.app.utils.get
import com.musika.innertube.YouTube

object YouTubeSubtitleLyricsProvider : LyricsProvider {
    override val name = "YouTube Subtitle"

    override fun isEnabled(context: Context): Boolean = context.dataStore[EnableYouTubeSubtitleKey] ?: true

    override suspend fun getLyrics(
        id: String,
        title: String,
        artist: String,
        duration: Int,
    ): Result<String> = YouTube.transcript(id)
}

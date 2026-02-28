package com.musika.app.api

import com.musika.app.di.OkHttpClientProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Request
import org.json.JSONArray

object SponsorBlockService {
    private val client get() = OkHttpClientProvider.noProxy

    data class Segment(
        val category: String,
        val start: Float,
        val end: Float,
        val uuid: String
    )

    private const val BASE_URL = "https://sponsor.ajay.app/api/skipSegments"

    suspend fun getSkipSegments(videoId: String): List<Segment> = withContext(Dispatchers.IO) {
        val categories = "[\"sponsor\",\"intro\",\"outro\",\"interaction\",\"selfpromo\",\"music_offtopic\"]"
        val url = "$BASE_URL?videoID=$videoId&categories=$categories"

        val request = Request.Builder()
            .url(url)
            .get()
            .build()

        try {
            val response = client.newCall(request).execute()
            if (response.code == 404) return@withContext emptyList()
            if (!response.isSuccessful) return@withContext emptyList()

            val body = response.body?.string() ?: return@withContext emptyList()
            val jsonArray = JSONArray(body)
            val segments = mutableListOf<Segment>()

            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                segments.add(
                    Segment(
                        category = obj.getString("category"),
                        start = obj.getJSONArray("segment").getDouble(0).toFloat(),
                        end = obj.getJSONArray("segment").getDouble(1).toFloat(),
                        uuid = obj.getString("UUID")
                    )
                )
            }
            segments
        } catch (e: Exception) {
            emptyList()
        }
    }
}

package com.musika.app.api

import com.musika.app.BuildConfig
import com.musika.app.di.OkHttpClientProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.Request
import timber.log.Timber
import java.security.MessageDigest

/**
 * Last.fm API client for scrobbling.
 * Requires LASTFM_API_KEY and LASTFM_API_SECRET in gradle.properties.
 * Register at https://www.last.fm/api/account/create
 */
object LastFmApi {
    private const val BASE_URL = "https://ws.audioscrobbler.com/2.0/"
    private const val TAG = "LastFmApi"

    private val client get() = OkHttpClientProvider.noProxy

    val isConfigured: Boolean
        get() = BuildConfig.LASTFM_API_KEY.isNotEmpty() && BuildConfig.LASTFM_API_SECRET.isNotEmpty()

    private fun md5(input: String): String {
        val md = MessageDigest.getInstance("MD5")
        val digest = md.digest(input.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun buildSignature(params: Map<String, String>, secret: String): String {
        val sorted = params.toSortedMap()
        val concatenated = sorted.entries.joinToString("") { "${it.key}${it.value}" }
        return md5("$concatenated$secret")
    }

    /**
     * Authenticate with username and password. Returns session key on success.
     */
    suspend fun getMobileSession(username: String, password: String): Result<String> =
        withContext(Dispatchers.IO) {
            if (!isConfigured) {
                return@withContext Result.failure(IllegalStateException("Last.fm API not configured"))
            }
            val params = mapOf(
                "method" to "auth.getMobileSession",
                "username" to username,
                "password" to password,
                "api_key" to BuildConfig.LASTFM_API_KEY,
            )
            val apiSig = buildSignature(params, BuildConfig.LASTFM_API_SECRET)
            val formBody = FormBody.Builder(Charsets.UTF_8)
                .add("method", "auth.getMobileSession")
                .add("username", username)
                .add("password", password)
                .add("api_key", BuildConfig.LASTFM_API_KEY)
                .add("api_sig", apiSig)
                .build()

            val request = Request.Builder()
                .url(BASE_URL)
                .post(formBody)
                .build()

            runCatching {
                val response = client.newCall(request).execute()
                val body = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    Timber.tag(TAG).e("Auth failed: ${response.code} $body")
                    return@runCatching throw Exception("Authentication failed: ${response.code}")
                }
                val sessionKey = parseSessionKey(body)
                    ?: throw Exception("Invalid response from Last.fm")
                sessionKey
            }
        }

    private fun parseSessionKey(xml: String): String? {
        val regex = """<key>([^<]+)</key>""".toRegex()
        return regex.find(xml)?.groupValues?.get(1)
    }

    /**
     * Send Now Playing notification. Call when user starts listening.
     */
    suspend fun updateNowPlaying(
        sessionKey: String,
        artist: String,
        track: String,
        album: String? = null,
        durationSeconds: Int? = null,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.failure(IllegalStateException("Last.fm API not configured"))
        val params = mutableMapOf(
            "method" to "track.updateNowPlaying",
            "sk" to sessionKey,
            "artist" to artist,
            "track" to track,
            "api_key" to BuildConfig.LASTFM_API_KEY,
        )
        album?.let { params["album"] = it }
        durationSeconds?.let { params["duration"] = it.toString() }
        val apiSig = buildSignature(params, BuildConfig.LASTFM_API_SECRET)

        val formBuilder = FormBody.Builder(Charsets.UTF_8)
            .add("method", "track.updateNowPlaying")
            .add("sk", sessionKey)
            .add("artist", artist)
            .add("track", track)
            .add("api_key", BuildConfig.LASTFM_API_KEY)
            .add("api_sig", apiSig)
        album?.let { formBuilder.add("album", it) }
        durationSeconds?.let { formBuilder.add("duration", it.toString()) }

        val request = Request.Builder()
            .url(BASE_URL)
            .post(formBuilder.build())
            .build()

        runCatching {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: ""
            if (!response.isSuccessful) {
                Timber.tag(TAG).e("NowPlaying failed: ${response.code} $body")
            }
            val status = parseStatus(body)
            if (status == "failed") {
                val error = parseError(body)
                throw Exception(error ?: "Now Playing request failed")
            }
        }
    }

    /**
     * Scrobble a track. Call when track has been played for 50% or 4 minutes (whichever is earlier).
     * Track must be longer than 30 seconds.
     */
    suspend fun scrobble(
        sessionKey: String,
        artist: String,
        track: String,
        timestamp: Long,
        album: String? = null,
        durationSeconds: Int? = null,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.failure(IllegalStateException("Last.fm API not configured"))
        val params = mutableMapOf(
            "method" to "track.scrobble",
            "sk" to sessionKey,
            "artist" to artist,
            "track" to track,
            "timestamp" to timestamp.toString(),
            "api_key" to BuildConfig.LASTFM_API_KEY,
        )
        album?.let { params["album"] = it }
        durationSeconds?.let { params["duration"] = it.toString() }
        val apiSig = buildSignature(params, BuildConfig.LASTFM_API_SECRET)

        val formBuilder = FormBody.Builder(Charsets.UTF_8)
            .add("method", "track.scrobble")
            .add("sk", sessionKey)
            .add("artist", artist)
            .add("track", track)
            .add("timestamp", timestamp.toString())
            .add("api_key", BuildConfig.LASTFM_API_KEY)
            .add("api_sig", apiSig)
        album?.let { formBuilder.add("album", it) }
        durationSeconds?.let { formBuilder.add("duration", it.toString()) }

        val request = Request.Builder()
            .url(BASE_URL)
            .post(formBuilder.build())
            .build()

        runCatching {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: ""
            if (!response.isSuccessful) {
                Timber.tag(TAG).e("Scrobble failed: ${response.code} $body")
            }
            val status = parseStatus(body)
            if (status == "failed") {
                val error = parseError(body)
                val code = parseErrorCode(body)
                if (code == 9) throw Exception("Invalid session - please re-login")
                throw Exception(error ?: "Scrobble request failed")
            }
        }
    }

    private fun parseStatus(xml: String): String? {
        val regex = """<lfm status="([^"]+)">""".toRegex()
        return regex.find(xml)?.groupValues?.get(1)
    }

    private fun parseError(xml: String): String? {
        val regex = """<error code="[^"]+">([^<]+)</error>""".toRegex()
        return regex.find(xml)?.groupValues?.get(1)
    }

    private fun parseErrorCode(xml: String): Int? {
        val regex = """<error code="(\d+)">""".toRegex()
        return regex.find(xml)?.groupValues?.get(1)?.toIntOrNull()
    }
}

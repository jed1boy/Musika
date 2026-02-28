package com.musika.app.recognition

import com.github.f4b6a3.uuid.UuidCreator
import com.alexmercerind.audire.native.ShazamSignature
import com.github.f4b6a3.uuid.enums.UuidNamespace
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.Calendar
import timber.log.Timber
import javax.inject.Inject
import kotlin.random.Random

class ShazamRepository @Inject constructor() {
    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
            .build()
    }

    private val api: ShazamAPI by lazy {
        Retrofit.Builder()
            .client(client)
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ShazamAPI::class.java)
    }

    suspend fun identify(duration: Int, data: ByteArray): Track? {
        val timestamp = Calendar.getInstance().time.time.toInt()
        val name = Random(timestamp).nextInt(1 shl 48).toString()
        val signature = try {
            val sig = ShazamSignature().safeCreate(data.toShortArray())
            Timber.d("Signature generated successfully: %s...", sig.take(20))
            sig
        } catch (e: Throwable) {
            Timber.e(e, "Error creating signature: %s", e.message)
            e.printStackTrace()
            return null
        }

        val body = ShazamRequestBody(
            Geolocation(
                Random(timestamp).nextDouble() * 400 + 100,
                Random(timestamp).nextDouble() * 180 - 90,
                Random(timestamp).nextDouble() * 360 - 180
            ),
            Signature(
                duration * 1000,
                timestamp,
                signature
            ),
            timestamp,
            TIMEZONES.random()
        )
        try {
            val response = api.discovery(
                body,
                UuidCreator.getNameBasedSha1(UuidNamespace.NAMESPACE_DNS, name).toString(),
                UuidCreator.getNameBasedSha1(UuidNamespace.NAMESPACE_URL, name).toString(),
                USER_AGENTS.random(),
            )
            if (!response.isSuccessful) {
                 Timber.e("API call failed: %s %s", response.code(), response.message())
            }
            val track = response.body()?.track
            if (track != null) {
                Timber.d("Track found: %s by %s", track.title, track.subtitle)
            } else {
                Timber.w("API returned 200 but no track found (No Match)")
            }
            return track
        } catch (e: Exception) {
            Timber.e(e, "API network error: %s", e.message)
            e.printStackTrace()
            return null
        }
    }

    private fun ByteArray.toShortArray(): ShortArray {
        val shorts = ShortArray(size / 2)
        java.nio.ByteBuffer.wrap(this).order(java.nio.ByteOrder.LITTLE_ENDIAN).asShortBuffer().get(shorts)
        return shorts
    }

    companion object {
        private const val BASE_URL = "https://amp.shazam.com/"
        private val USER_AGENTS = arrayOf(
            "Dalvik/2.1.0 (Linux; U; Android 5.0.2; VS980 4G Build/LRX22G)",
            // ... (Add more if needed, just one is enough for functionality usually)
             "Dalvik/2.1.0 (Linux; U; Android 6.0.1; SM-G920F Build/MMB29K)"
        )
        private val TIMEZONES = arrayOf(
            "Europe/London",
            "America/New_York",
            "Asia/Tokyo"
        )
    }
}

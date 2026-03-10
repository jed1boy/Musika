package com.musika.app.api

import android.app.Application
import android.content.Context
import android.os.Build
import com.musika.app.BuildConfig
import com.musika.app.di.OkHttpClientProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.time.Instant

object CrashReportService {
    private const val MAX_STACK_TRACE_LENGTH = 12000
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun sendCrashReport(
        context: Context,
        stackTrace: String,
        threadName: String?,
        crashTimeMs: Long?,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val endpoint = BuildConfig.CRASH_REPORT_ENDPOINT.trim()
        if (endpoint.isEmpty()) {
            return@withContext Result.failure(
                IllegalStateException("Crash report endpoint is not configured.")
            )
        }

        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            packageInfo.longVersionCode.toString()
        } else {
            @Suppress("DEPRECATION")
            packageInfo.versionCode.toString()
        }

        val safeStackTrace = sanitizeStackTrace(stackTrace)
        val occurredAt = crashTimeMs?.let { Instant.ofEpochMilli(it).toString() } ?: Instant.now().toString()
        val processName = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Application.getProcessName()
        } else {
            context.packageName
        }

        val payload = JSONObject().apply {
            put("stackTrace", safeStackTrace)
            put("occurredAt", occurredAt)
            put("threadName", threadName?.trim().takeUnless { it.isNullOrEmpty() } ?: "unknown")
            put("processName", processName)
            put("packageName", context.packageName)
            put("appVersion", BuildConfig.VERSION_NAME)
            put("versionCode", versionCode)
            put("androidVersion", "Android ${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT})")
            put("manufacturer", Build.MANUFACTURER.orEmpty())
            put("model", Build.MODEL.orEmpty())
            put("architecture", BuildConfig.ARCHITECTURE)
        }

        val request = Request.Builder()
            .url(endpoint)
            .addHeader("Content-Type", "application/json")
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        return@withContext runCatching {
            val client = if (OkHttpClientProvider.isInitialized()) {
                OkHttpClientProvider.noProxy
            } else {
                OkHttpClient()
            }

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val responseBody = response.body?.string().orEmpty()
                    throw IllegalStateException(
                        "Crash report failed (${response.code}): ${response.message}. $responseBody"
                    )
                }
            }
        }
    }

    private fun sanitizeStackTrace(stackTrace: String): String {
        val cleaned = stackTrace.trim().ifEmpty { "No stack trace available." }
            .replace("\u0000", "")
        return if (cleaned.length > MAX_STACK_TRACE_LENGTH) {
            cleaned.take(MAX_STACK_TRACE_LENGTH) + "\n\n...[truncated]"
        } else {
            cleaned
        }
    }
}

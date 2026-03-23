package com.musika.app.auth

import android.app.Activity
import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.musika.app.BuildConfig
import com.musika.app.di.NoProxyOkHttpClient
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MusikaAuthRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    @NoProxyOkHttpClient private val httpClient: OkHttpClient,
) {
    private val prefs by lazy { createPrefs() }

    private fun baseUrl(): String = BuildConfig.MUSIKA_AUTH_BASE_URL.trimEnd('/')

    fun isConfigured(): Boolean =
        baseUrl().isNotEmpty() && BuildConfig.MUSIKA_GOOGLE_WEB_CLIENT_ID.isNotBlank()

    fun isSignedIn(): Boolean = !prefs.getString(KEY_TOKEN, null).isNullOrBlank()

    fun signedInLabel(): String? {
        val name = prefs.getString(KEY_NAME, null)?.takeIf { it.isNotBlank() }
        val email = prefs.getString(KEY_EMAIL, null)?.takeIf { it.isNotBlank() }
        return name ?: email
    }

    suspend fun obtainGoogleIdToken(activity: Activity): Result<String> = withContext(Dispatchers.Main.immediate) {
        if (!isConfigured()) {
            return@withContext Result.failure(IllegalStateException("not_configured"))
        }
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(BuildConfig.MUSIKA_GOOGLE_WEB_CLIENT_ID)
            .build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()
        val credentialManager = CredentialManager.create(activity.applicationContext)
        try {
            val response = credentialManager.getCredential(activity, request)
            val cred = response.credential
            if (cred is CustomCredential &&
                cred.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val tokenCred = GoogleIdTokenCredential.createFrom(cred.data)
                Result.success(tokenCred.idToken)
            } else {
                Result.failure(IllegalStateException("unexpected_credential"))
            }
        } catch (e: GetCredentialException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun exchangeGoogleIdToken(idToken: String): Result<Unit> = withContext(Dispatchers.IO) {
        val base = baseUrl()
        if (base.isEmpty()) {
            return@withContext Result.failure(IllegalStateException("not_configured"))
        }
        val body = JsonObject().apply {
            addProperty("provider", "google")
            add("idToken", JsonObject().apply { addProperty("token", idToken) })
            addProperty("disableRedirect", true)
        }
        val req = Request.Builder()
            .url("$base/api/auth/sign-in/social")
            .post(body.toString().toRequestBody(JSON_MEDIA))
            .build()
        httpClient.newCall(req).execute().use { resp ->
            val text = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) {
                return@withContext Result.failure(
                    IllegalStateException("auth_http_${resp.code}: $text"),
                )
            }
            val root = runCatching { JsonParser.parseString(text).asJsonObject }.getOrNull()
                ?: return@withContext Result.failure(IllegalStateException("invalid_json"))
            val token = root.get("token")?.asString
            if (token.isNullOrBlank()) {
                return@withContext Result.failure(IllegalStateException("missing_token"))
            }
            val user = root.getAsJsonObject("user")
            val email = user?.get("email")?.asString.orEmpty()
            val name = user?.get("name")?.asString.orEmpty()
            prefs.edit()
                .putString(KEY_TOKEN, token)
                .putString(KEY_EMAIL, email)
                .putString(KEY_NAME, name)
                .apply()
            Result.success(Unit)
        }
    }

    suspend fun signOut(): Result<Unit> = withContext(Dispatchers.IO) {
        val token = prefs.getString(KEY_TOKEN, null)
        val base = baseUrl()
        if (token != null && base.isNotEmpty()) {
            runCatching {
                val req = Request.Builder()
                    .url("$base/api/auth/sign-out")
                    .addHeader("Authorization", "Bearer $token")
                    .post(ByteArray(0).toRequestBody(null))
                    .build()
                httpClient.newCall(req).execute().close()
            }
        }
        clearLocalSession()
        Result.success(Unit)
    }

    fun clearLocalSession() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_EMAIL)
            .remove(KEY_NAME)
            .apply()
    }

    private fun createPrefs() = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    private companion object {
        val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()
        const val PREFS_NAME = "musika_auth"
        const val KEY_TOKEN = "bearer_token"
        const val KEY_EMAIL = "user_email"
        const val KEY_NAME = "user_name"
    }
}

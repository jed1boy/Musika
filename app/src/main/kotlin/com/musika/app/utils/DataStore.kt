@file:Suppress("DEPRECATION")

package com.musika.app.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.musika.app.extensions.toEnum
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlin.properties.ReadOnlyProperty

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

private const val SECURE_SETTINGS_FILE = "secure_settings"
private val sensitivePreferenceNames = setOf(
    "proxyUsername",
    "proxyPassword",
    "openRouterApiKey",
    "visitorData",
    "dataSyncId",
    "innerTubeCookie",
)

private fun isSensitivePreferenceKey(keyName: String): Boolean =
    keyName in sensitivePreferenceNames

private fun Context.securePrefs(): SharedPreferences {
    val masterKey = MasterKey.Builder(this)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    return EncryptedSharedPreferences.create(
        this,
        SECURE_SETTINGS_FILE,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )
}

fun Context.getSensitivePreference(
    key: Preferences.Key<String>,
    defaultValue: String = "",
): String =
    if (isSensitivePreferenceKey(key.name)) {
        securePrefs().getString(key.name, defaultValue) ?: defaultValue
    } else {
        dataStore[key] ?: defaultValue
    }

suspend fun Context.putSensitivePreference(
    key: Preferences.Key<String>,
    value: String,
) {
    if (isSensitivePreferenceKey(key.name)) {
        withContext(Dispatchers.IO) {
            securePrefs().edit().putString(key.name, value).apply()
        }
    } else {
        dataStore.edit {
            it[key] = value
        }
    }
}

suspend fun Context.removeSensitivePreference(key: Preferences.Key<String>) {
    if (isSensitivePreferenceKey(key.name)) {
        withContext(Dispatchers.IO) {
            securePrefs().edit().remove(key.name).apply()
        }
    } else {
        dataStore.edit {
            it.remove(key)
        }
    }
}

fun Context.observeSensitivePreference(
    key: Preferences.Key<String>,
    defaultValue: String = "",
): Flow<String> =
    if (isSensitivePreferenceKey(key.name)) {
        callbackFlow {
            val prefs = securePrefs()
            trySend(prefs.getString(key.name, defaultValue) ?: defaultValue)
            val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, changedKey ->
                if (changedKey == key.name) {
                    trySend(prefs.getString(key.name, defaultValue) ?: defaultValue)
                }
            }
            prefs.registerOnSharedPreferenceChangeListener(listener)
            awaitClose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
        }.distinctUntilChanged()
    } else {
        dataStore.data
            .map { it[key] ?: defaultValue }
            .distinctUntilChanged()
    }

operator fun <T> DataStore<Preferences>.get(key: Preferences.Key<T>): T? =
    runBlocking(Dispatchers.IO) {
        data.first()[key]
    }

fun <T> DataStore<Preferences>.get(
    key: Preferences.Key<T>,
    defaultValue: T,
): T =
    runBlocking(Dispatchers.IO) {
        data.first()[key] ?: defaultValue
    }

fun <T> preference(
    context: Context,
    key: Preferences.Key<T>,
    defaultValue: T,
) = ReadOnlyProperty<Any?, T> { _, _ -> context.dataStore[key] ?: defaultValue }

inline fun <reified T : Enum<T>> enumPreference(
    context: Context,
    key: Preferences.Key<String>,
    defaultValue: T,
) = ReadOnlyProperty<Any?, T> { _, _ -> context.dataStore[key].toEnum(defaultValue) }

@Composable
fun <T> rememberPreference(
    key: Preferences.Key<T>,
    defaultValue: T,
): MutableState<T> {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val initialValue =
        if (key.name in sensitivePreferenceNames && defaultValue is String) {
            @Suppress("UNCHECKED_CAST")
            context.getSensitivePreference(key as Preferences.Key<String>, defaultValue) as T
        } else {
            context.dataStore[key] ?: defaultValue
        }

    val state = remember {
        if (key.name in sensitivePreferenceNames && defaultValue is String) {
            @Suppress("UNCHECKED_CAST")
            context.observeSensitivePreference(key as Preferences.Key<String>, defaultValue) as Flow<T>
        } else {
            context.dataStore.data
                .map { it[key] ?: defaultValue }
                .distinctUntilChanged()
        }
    }.collectAsState(initialValue)

    return remember {
        object : MutableState<T> {
            override var value: T
                get() = state.value
                set(value) {
                    coroutineScope.launch {
                        if (key.name in sensitivePreferenceNames && value is String) {
                            @Suppress("UNCHECKED_CAST")
                            context.putSensitivePreference(key as Preferences.Key<String>, value)
                        } else {
                            context.dataStore.edit {
                                it[key] = value
                            }
                        }
                    }
                }

            override fun component1() = value

            override fun component2(): (T) -> Unit = { value = it }
        }
    }
}

@Composable
inline fun <reified T : Enum<T>> rememberEnumPreference(
    key: Preferences.Key<String>,
    defaultValue: T,
): MutableState<T> {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val initialValue = context.dataStore[key].toEnum(defaultValue = defaultValue)
    val state =
        remember {
            context.dataStore.data
                .map { it[key].toEnum(defaultValue = defaultValue) }
                .distinctUntilChanged()
        }.collectAsState(initialValue)

    return remember {
        object : MutableState<T> {
            override var value: T
                get() = state.value
                set(value) {
                    coroutineScope.launch {
                        context.dataStore.edit {
                            it[key] = value.name
                        }
                    }
                }

            override fun component1() = value

            override fun component2(): (T) -> Unit = { value = it }
        }
    }
}

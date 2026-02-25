package com.musika.app.viewmodels

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.musika.app.api.LastFmApi
import com.musika.app.constants.LastFmSessionKey
import com.musika.app.utils.putSensitivePreference
import com.musika.app.utils.removeSensitivePreference
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IntegrationViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
) : ViewModel() {

    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState = _loginState.asStateFlow()

    sealed class LoginState {
        data object Idle : LoginState()
        data object Loading : LoginState()
        data object Success : LoginState()
        data class Error(val message: String) : LoginState()
    }

    fun login(username: String, password: String) {
        if (!LastFmApi.isConfigured) {
            _loginState.value = LoginState.Error("Last.fm API not configured. Add LASTFM_API_KEY and LASTFM_API_SECRET to gradle.properties.")
            return
        }
        viewModelScope.launch {
            _loginState.value = LoginState.Loading
            LastFmApi.getMobileSession(username, password)
                .onSuccess { sessionKey ->
                    context.putSensitivePreference(LastFmSessionKey, sessionKey)
                    _loginState.value = LoginState.Success
                }
                .onFailure {
                    _loginState.value = LoginState.Error(it.message ?: "Login failed")
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            context.removeSensitivePreference(LastFmSessionKey)
        }
    }

    fun clearLoginState() {
        _loginState.value = LoginState.Idle
    }
}

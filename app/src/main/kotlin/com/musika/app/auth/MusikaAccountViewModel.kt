package com.musika.app.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MusikaAccountViewModel @Inject constructor(
    private val repository: MusikaAuthRepository,
) : ViewModel() {

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun configured(): Boolean = repository.isConfigured()

    fun signedInSnapshot(): Boolean = repository.isSignedIn()

    fun labelSnapshot(): String? = repository.signedInLabel()

    fun signIn(activity: Activity, onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            _error.value = null
            repository.obtainGoogleIdToken(activity)
                .onSuccess { idToken ->
                    repository.exchangeGoogleIdToken(idToken)
                        .onFailure { e -> _error.value = e.message ?: "sign_in_failed" }
                }
                .onFailure { e -> _error.value = e.message ?: "google_sign_in_failed" }
            _busy.value = false
            onDone()
        }
    }

    fun signOut(onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            _error.value = null
            repository.signOut()
            _busy.value = false
            onDone()
        }
    }
}

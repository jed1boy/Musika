package com.musika.app.viewmodels

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.musika.innertube.YouTube
import com.musika.innertube.pages.BrowseResult
import com.musika.app.constants.HideExplicitKey
import com.musika.app.utils.dataStore
import com.musika.app.utils.get
import com.musika.app.utils.reportException
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class YouTubeBrowseViewModel
@Inject
constructor(
    @ApplicationContext val context: Context,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val browseId = savedStateHandle.get<String>("browseId")!!
    private val params = savedStateHandle.get<String>("params")

    val result = MutableStateFlow<BrowseResult?>(null)

    init {
        viewModelScope.launch {
            YouTube
                .browse(browseId, params)
                .onSuccess {
                    result.value = it.filterExplicit(context.dataStore.get(HideExplicitKey, false))
                }.onFailure {
                    reportException(it)
                }
        }
    }
}

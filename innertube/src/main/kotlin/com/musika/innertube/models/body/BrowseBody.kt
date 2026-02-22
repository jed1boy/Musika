package com.musika.innertube.models.body

import com.musika.innertube.models.Context
import com.musika.innertube.models.Continuation
import kotlinx.serialization.Serializable

@Serializable
data class BrowseBody(
    val context: Context,
    val browseId: String?,
    val params: String?,
    val continuation: String?
)

package com.musika.app.models

import com.musika.innertube.models.YTItem
import com.musika.app.db.entities.LocalItem

data class SimilarRecommendation(
    val title: LocalItem,
    val items: List<YTItem>,
)

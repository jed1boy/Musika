package com.musika.app.ui.utils

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.grid.LazyGridState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow

@Composable
fun LazyListState.isScrollingUp(): Boolean {
    var isScrollingUp by remember(this) { mutableStateOf(true) }
    var previousIndex by remember(this) { mutableIntStateOf(firstVisibleItemIndex) }
    var previousScrollOffset by remember(this) { mutableIntStateOf(firstVisibleItemScrollOffset) }

    LaunchedEffect(this) {
        snapshotFlow { firstVisibleItemIndex to firstVisibleItemScrollOffset }
            .collect { (index, offset) ->
                isScrollingUp = if (previousIndex != index) {
                    previousIndex > index
                } else {
                    previousScrollOffset >= offset
                }
                previousIndex = index
                previousScrollOffset = offset
            }
    }
    return isScrollingUp
}

@Composable
fun LazyGridState.isScrollingUp(): Boolean {
    var isScrollingUp by remember(this) { mutableStateOf(true) }
    var previousIndex by remember(this) { mutableIntStateOf(firstVisibleItemIndex) }
    var previousScrollOffset by remember(this) { mutableIntStateOf(firstVisibleItemScrollOffset) }

    LaunchedEffect(this) {
        snapshotFlow { firstVisibleItemIndex to firstVisibleItemScrollOffset }
            .collect { (index, offset) ->
                isScrollingUp = if (previousIndex != index) {
                    previousIndex > index
                } else {
                    previousScrollOffset >= offset
                }
                previousIndex = index
                previousScrollOffset = offset
            }
    }
    return isScrollingUp
}

@Composable
fun ScrollState.isScrollingUp(): Boolean {
    var isScrollingUp by remember(this) { mutableStateOf(true) }
    var previousScrollOffset by remember(this) { mutableIntStateOf(value) }

    LaunchedEffect(this) {
        snapshotFlow { value }
            .collect { currentValue ->
                isScrollingUp = previousScrollOffset >= currentValue
                previousScrollOffset = currentValue
            }
    }
    return isScrollingUp
}

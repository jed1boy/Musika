package com.musika.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.musika.app.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

private const val MIN_DISPLAY_MS = 800L
private const val MAX_DISPLAY_MS = 2000L

@Composable
fun SplashScreen(
    onTimeout: () -> Unit,
    viewModel: com.musika.app.viewmodels.SplashViewModel = hiltViewModel(),
) {
    val scale = remember { Animatable(0.5f) }
    val alpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        launch {
            scale.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing)
            )
        }
        launch {
            alpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 400)
            )
        }
        delay(MIN_DISPLAY_MS)
        val remaining = (MAX_DISPLAY_MS - MIN_DISPLAY_MS).coerceAtLeast(0L)
        withTimeoutOrNull(remaining) {
            viewModel.isReady.first { it }
        }
        onTimeout()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(R.drawable.musika_logo),
            contentDescription = null,
            modifier = Modifier
                .size(160.dp)
                .scale(scale.value)
                .alpha(alpha.value)
        )
    }
}

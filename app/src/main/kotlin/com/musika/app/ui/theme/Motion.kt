package com.musika.app.ui.theme

import android.provider.Settings
import androidx.compose.animation.ContentTransform
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * Mirrors the system "Remove animations" / animator duration scale: 0 means reduce motion.
 * Used where [androidx.compose.ui.platform.LocalReduceMotion] is not on the project's Compose BOM.
 */
@Composable
fun musikaReduceMotionPreferred(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f,
            ) == 0f
        }.getOrDefault(false)
    }
}

object MusikaMotion {
    const val ExpressiveBackgroundCrossfadeMs = 650
    const val ExpressiveBackgroundReducedCrossfadeMs = 180

    const val AmbientModeFadeMs = 400
    const val AmbientModeFadeReducedMs = 80
}

fun gradientBackgroundContentTransform(reduceMotion: Boolean): ContentTransform {
    val duration =
        if (reduceMotion) {
            MusikaMotion.ExpressiveBackgroundReducedCrossfadeMs
        } else {
            MusikaMotion.ExpressiveBackgroundCrossfadeMs
        }
    return fadeIn(tween(duration, easing = FastOutSlowInEasing))
        .togetherWith(fadeOut(tween(duration, easing = FastOutLinearInEasing)))
}

fun ambientModeFadeInSpec(reduceMotion: Boolean): FiniteAnimationSpec<Float> =
    tween(
        durationMillis =
            if (reduceMotion) {
                MusikaMotion.AmbientModeFadeReducedMs
            } else {
                MusikaMotion.AmbientModeFadeMs
            },
        easing = FastOutSlowInEasing,
    )

fun ambientModeFadeOutSpec(reduceMotion: Boolean): FiniteAnimationSpec<Float> =
    tween(
        durationMillis =
            if (reduceMotion) {
                MusikaMotion.AmbientModeFadeReducedMs
            } else {
                MusikaMotion.AmbientModeFadeMs
            },
        easing = FastOutLinearInEasing,
    )

package com.musika.app.ui.screens

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AlertDialogDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.Lifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.musika.app.R
import com.musika.app.constants.DarkModeKey
import com.musika.app.constants.PureBlackKey
import com.musika.app.ui.component.BottomSheet
import com.musika.app.ui.component.BottomSheetMenu
import com.musika.app.ui.component.LocalMenuState
import com.musika.app.ui.component.rememberBottomSheetState
import com.musika.app.ui.player.AmbientModeScreen
import com.musika.app.ui.screens.BrowseScreen
import com.musika.app.ui.screens.artist.ArtistAlbumsScreen
import com.musika.app.ui.screens.artist.ArtistItemsScreen
import com.musika.app.ui.screens.artist.ArtistScreen
import com.musika.app.ui.screens.artist.ArtistSongsScreen
import com.musika.app.ui.screens.library.LibraryScreen
import com.musika.app.ui.player.VideoPlayerScreen
import com.musika.app.ui.screens.playlist.AutoPlaylistScreen
import com.musika.app.ui.screens.playlist.LocalPlaylistScreen
import com.musika.app.ui.screens.playlist.OnlinePlaylistScreen
import com.musika.app.ui.screens.playlist.TopPlaylistScreen
import com.musika.app.ui.screens.playlist.CachePlaylistScreen
import com.musika.app.ui.screens.search.OnlineSearchResult
import com.musika.app.ui.screens.WrappedScreen
import com.musika.app.ui.screens.settings.AboutScreen
import com.musika.app.ui.screens.settings.AccountSettings
import com.musika.app.ui.screens.settings.AppearanceSettings
import com.musika.app.ui.screens.settings.BackupAndRestore
import com.musika.app.ui.screens.settings.ContentSettings
import com.musika.app.ui.screens.settings.DarkMode
import com.musika.app.ui.screens.settings.PlayerSettings
import com.musika.app.ui.screens.settings.PrivacySettings
import com.musika.app.ui.screens.settings.RomanizationSettings
import com.musika.app.ui.screens.settings.SettingsScreen
import com.musika.app.ui.screens.settings.StorageSettings
import com.musika.app.ui.screens.settings.SupporterScreen
import com.musika.app.ui.screens.settings.SupporterScreen
import com.musika.app.ui.screens.settings.SupporterScreen
import com.musika.app.ui.screens.settings.UpdaterScreen
import com.musika.app.ui.screens.settings.AiSettings
import com.musika.app.ui.utils.ShowMediaInfo
import com.musika.app.ui.player.VideoPlayerScreen
import com.musika.app.utils.rememberEnumPreference
import com.musika.app.utils.rememberPreference


@OptIn(ExperimentalMaterial3Api::class)
fun NavGraphBuilder.navigationBuilder(
    navController: NavHostController,
    scrollBehavior: TopAppBarScrollBehavior,
    latestVersionName: String,
    onOpenPlayer: () -> Unit,
) {
    composable(Screens.Home.route) {
        HomeScreen(navController)
    }
    composable(Screens.Search.route) {
        SearchScreen(navController, onSearchBarClick = { /* Search bar opens automatically via active state */ })
    }
    composable(Screens.Find.route) {
        FindSongScreen(navController, onOpenPlayer = onOpenPlayer)
    }
    composable(
        Screens.Library.route,
    ) {
        LibraryScreen(navController)
    }
    composable("history") {
        HistoryScreen(navController)
    }
    composable("stats") {
        StatsScreen(navController)
    }
    composable("mood_and_genres") {
        MoodAndGenresScreen(navController, scrollBehavior)
    }
    composable("account") {
        AccountScreen(navController, scrollBehavior)
    }
    composable("new_release") {
        NewReleaseScreen(navController, scrollBehavior)
    }
    composable("charts_screen") {
       ChartsScreen(navController)
    }
    composable(
        route = "browse/{browseId}",
        arguments = listOf(
            navArgument("browseId") {
                type = NavType.StringType
            }
        )
    ) {
        BrowseScreen(
            navController,
            scrollBehavior,
            it.arguments?.getString("browseId")
        )
    }
    composable(
        route = "search/{query}?autoplay={autoplay}",
        arguments =
        listOf(
            navArgument("query") {
                type = NavType.StringType
            },
            navArgument("autoplay") {
                type = NavType.BoolType
                defaultValue = false
            },
        ),
        enterTransition = {
            fadeIn(tween(250))
        },
        exitTransition = {
            if (targetState.destination.route?.startsWith("search/") == true) {
                fadeOut(tween(200))
            } else {
                fadeOut(tween(200)) + slideOutHorizontally { -it / 2 }
            }
        },
        popEnterTransition = {
            if (initialState.destination.route?.startsWith("search/") == true) {
                fadeIn(tween(250))
            } else {
                fadeIn(tween(250)) + slideInHorizontally { -it / 2 }
            }
        },
        popExitTransition = {
            fadeOut(tween(200))
        },
    ) {
        OnlineSearchResult(navController)
    }
    composable(
        route = "album/{albumId}",
        arguments =
        listOf(
            navArgument("albumId") {
                type = NavType.StringType
            },
        ),
    ) {
        AlbumScreen(navController, scrollBehavior)
    }
    composable(
        route = "artist/{artistId}",
        arguments =
        listOf(
            navArgument("artistId") {
                type = NavType.StringType
            },
        ),
    ) {
        ArtistScreen(navController, scrollBehavior)
    }
    composable(
        route = "artist/{artistId}/songs",
        arguments =
        listOf(
            navArgument("artistId") {
                type = NavType.StringType
            },
        ),
    ) {
        ArtistSongsScreen(navController, scrollBehavior)
    }
    composable(
        route = "artist/{artistId}/albums",
        arguments = listOf(
            navArgument("artistId") {
                type = NavType.StringType
            }
        )
    ) {
        ArtistAlbumsScreen(navController, scrollBehavior)
    }
    composable(
        route = "artist/{artistId}/items?browseId={browseId}?params={params}",
        arguments =
        listOf(
            navArgument("artistId") {
                type = NavType.StringType
            },
            navArgument("browseId") {
                type = NavType.StringType
                nullable = true
            },
            navArgument("params") {
                type = NavType.StringType
                nullable = true
            },
        ),
    ) {
        ArtistItemsScreen(navController, scrollBehavior)
    }
    composable(
        route = "online_playlist/{playlistId}",
        arguments =
        listOf(
            navArgument("playlistId") {
                type = NavType.StringType
            },
        ),
    ) {
        OnlinePlaylistScreen(navController, scrollBehavior)
    }
    composable(
        route = "local_playlist/{playlistId}",
        arguments =
        listOf(
            navArgument("playlistId") {
                type = NavType.StringType
            },
        ),
    ) {
        LocalPlaylistScreen(navController, scrollBehavior)
    }
    composable(
        route = "auto_playlist/{playlist}",
        arguments =
        listOf(
            navArgument("playlist") {
                type = NavType.StringType
            },
        ),
    ) {
        AutoPlaylistScreen(navController, scrollBehavior)
    }
    composable(
        route = "cache_playlist/{playlist}",
        arguments =
            listOf(
                navArgument("playlist") {
                    type = NavType.StringType
            },
        ),
    ) {
        CachePlaylistScreen(navController, scrollBehavior)
    }
    composable(
        route = "top_playlist/{top}",
        arguments =
        listOf(
            navArgument("top") {
                type = NavType.StringType
            },
        ),
    ) {
        TopPlaylistScreen(navController, scrollBehavior)
    }
    composable(
        route = "youtube_browse/{browseId}?params={params}",
        arguments =
        listOf(
            navArgument("browseId") {
                type = NavType.StringType
                nullable = true
            },
            navArgument("params") {
                type = NavType.StringType
                nullable = true
            },
        ),
    ) {
        YouTubeBrowseScreen(navController)
    }
    composable("settings") {
        SettingsScreen(navController, scrollBehavior, latestVersionName)
    }
    composable("wrapped") {
        WrappedScreen(navController)
    }
    composable("settings/appearance") {
        AppearanceSettings(navController, scrollBehavior)
    }
    composable("settings/content") {
        ContentSettings(navController, scrollBehavior)
    }
    composable("settings/content/romanization") {
        RomanizationSettings(navController, scrollBehavior)
    }
    composable("settings/player") {
        PlayerSettings(navController, scrollBehavior)
    }
    composable("settings/storage") {
        StorageSettings(navController, scrollBehavior)
    }
    composable("settings/privacy") {
        PrivacySettings(navController, scrollBehavior)
    }
    composable("settings/backup_restore") {
        BackupAndRestore(navController, scrollBehavior)
    }
    composable("settings/updater") {
        UpdaterScreen(navController, scrollBehavior)
    }
    composable("settings/about") {
        AboutScreen(navController, scrollBehavior)
    }
    composable("settings/supporter") {
        SupporterScreen(navController, scrollBehavior)
    }
    composable("settings/ai") {
        AiSettings(navController, scrollBehavior)
    }
    composable("login") {
        LoginScreen(navController)
    }
    composable(
        route = "video/{videoId}",
        arguments = listOf(
            navArgument("videoId") {
                type = NavType.StringType
            }
        )
    ) {
        VideoPlayerScreen(
            videoId = it.arguments?.getString("videoId") ?: "",
            navController = navController
        )
    }
    composable("ambient_mode") {
        AmbientModeScreen(navController)
    }
}

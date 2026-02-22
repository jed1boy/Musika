package com.musika.innertube.pages

import com.musika.innertube.models.Album
import com.musika.innertube.models.AlbumItem
import com.musika.innertube.models.Artist
import com.musika.innertube.models.ArtistItem
import com.musika.innertube.models.MusicResponsiveListItemRenderer
import com.musika.innertube.models.MusicTwoRowItemRenderer
import com.musika.innertube.models.PlaylistItem
import com.musika.innertube.models.SongItem
import com.musika.innertube.models.YTItem
import com.musika.innertube.models.oddElements
import com.musika.innertube.utils.parseTime

data class LibraryAlbumsPage(
    val albums: List<AlbumItem>,
    val continuation: String?,
) {
    companion object {
        fun fromMusicTwoRowItemRenderer(renderer: MusicTwoRowItemRenderer): AlbumItem? {
            return AlbumItem(
                        browseId = renderer.navigationEndpoint.browseEndpoint?.browseId ?: return null,
                        playlistId = renderer.thumbnailOverlay?.musicItemThumbnailOverlayRenderer?.content
                            ?.musicPlayButtonRenderer?.playNavigationEndpoint
                            ?.watchPlaylistEndpoint?.playlistId ?: return null,
                        title = renderer.title.runs?.firstOrNull()?.text ?: return null,
                        artists = null,
                        year = renderer.subtitle?.runs?.lastOrNull()?.text?.toIntOrNull(),
                        thumbnail = renderer.thumbnailRenderer.musicThumbnailRenderer?.getThumbnailUrl() ?: return null,
                        explicit = renderer.subtitleBadges?.find {
                            it.musicInlineBadgeRenderer?.icon?.iconType == "MUSIC_EXPLICIT_BADGE"
                        } != null
                    )
        }
    }
}

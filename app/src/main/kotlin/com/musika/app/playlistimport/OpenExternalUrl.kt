package com.musika.app.playlistimport

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.musika.app.R

fun openUrlInBrowser(context: Context, url: String) {
    try {
        context.startActivity(
            Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addCategory(Intent.CATEGORY_BROWSABLE)
            },
        )
    } catch (_: Exception) {
        Toast.makeText(
            context,
            context.getString(R.string.playlist_import_open_link_failed),
            Toast.LENGTH_SHORT,
        ).show()
    }
}

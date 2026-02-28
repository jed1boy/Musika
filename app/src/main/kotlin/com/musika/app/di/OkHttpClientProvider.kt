package com.musika.app.di

import okhttp3.OkHttpClient

/**
 * Holder for shared OkHttpClient instances, set from App.onCreate.
 * Used by objects that cannot receive constructor injection (YTPlayerUtils, SponsorBlockService, etc).
 */
object OkHttpClientProvider {
    lateinit var default: OkHttpClient
    lateinit var noProxy: OkHttpClient

    fun isInitialized(): Boolean = ::default.isInitialized && ::noProxy.isInitialized
}

package com.alexmercerind.audire.native

import timber.log.Timber

// This class provides JNI binding to Shazam's signature algorithm.
//
// ShazamSignature.create takes audio samples as ShortArray.
// Format: PCM 16 Bit LE
// Sample Rate: 16000 Hz
//
// References:
// https://github.com/marin-m/SongRec
// https://github.com/alexmercerind/shazam-signature-jni
class ShazamSignature {
    private var isLoaded = false

    init {
        try {
            System.loadLibrary("shazam_signature_jni")
            isLoaded = true
        } catch (e: UnsatisfiedLinkError) {
            Timber.e(e, "Failed to load native library")
        } catch (e: SecurityException) {
            Timber.e(e, "Security exception loading native library")
        }
    }

    external fun create(input: ShortArray): String

    fun safeCreate(input: ShortArray): String {
        if (!isLoaded) {
            throw UnsatisfiedLinkError("Native library shazam_signature_jni not loaded")
        }
        return create(input)
    }
}

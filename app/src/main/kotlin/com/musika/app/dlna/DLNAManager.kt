package com.musika.app.dlna

import android.content.Context
import timber.log.Timber
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DLNAManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    
    private val ssdpDiscovery = SSDPDiscovery()
    private val mediaServer = DLNAMediaServer()
    
    private val _devices = MutableStateFlow<List<DLNADevice>>(emptyList())
    val devices: StateFlow<List<DLNADevice>> = _devices.asStateFlow()
    
    private val _selectedDevice = MutableStateFlow<DLNADevice?>(null)
    val selectedDevice: StateFlow<DLNADevice?> = _selectedDevice.asStateFlow()
    
    private val _isEnabled = MutableStateFlow(false)
    val isEnabled: StateFlow<Boolean> = _isEnabled.asStateFlow()
    
    private var currentPlayer: DLNAPlayer? = null
    
    fun start() {
        if (_isEnabled.value) return
        
        try {
            // Start media server
            mediaServer.start()
            Timber.d("DLNA media server started on port 8080")
            
            // Start device discovery
            startDiscovery()
            
            _isEnabled.value = true
            Timber.d("DLNA service started")
        } catch (e: Exception) {
            Timber.e(e, "Failed to start DLNA service")
        }
    }
    
    fun stop() {
        if (!_isEnabled.value) return
        
        try {
            ssdpDiscovery.stopDiscovery()
            mediaServer.stop()
            _devices.value = emptyList()
            _selectedDevice.value = null
            currentPlayer = null
            _isEnabled.value = false
            Timber.d("DLNA service stopped")
        } catch (e: Exception) {
            Timber.e(e, "Failed to stop DLNA service")
        }
    }
    
    fun startDiscovery() {
        ssdpDiscovery.startDiscovery(scope) { device ->
            val currentDevices = _devices.value.toMutableList()
            if (!currentDevices.any { it.id == device.id }) {
                currentDevices.add(device)
                _devices.value = currentDevices
                Timber.d("DLNA device found: ${device.name}")
            }
        }
    }
    
    fun stopDiscovery() {
        ssdpDiscovery.stopDiscovery()
    }
    
    fun selectDevice(device: DLNADevice?) {
        _selectedDevice.value = device
        currentPlayer = device?.let { DLNAPlayer(it) }
        Timber.d(if (device != null) "Device selected: ${device.name}" else "Device deselected")
    }
    
    fun playMedia(mediaUrl: String, title: String = "", artist: String = ""): Boolean {
        val player = currentPlayer ?: run {
            Timber.w("No DLNA device selected")
            return false
        }
        
        return try {
            // Get proxy URL for the media
            val proxyUrl = mediaServer.getProxyUrl(mediaUrl)
            
            scope.launch {
                try {
                    val setUriSuccess = player.setAVTransportURI(proxyUrl, title, artist)
                    if (setUriSuccess) {
                        val playSuccess = player.play()
                        if (playSuccess) {
                            Timber.d("Successfully started playback on DLNA device")
                        } else {
                            Timber.e("Failed to start playback on DLNA device")
                        }
                    } else {
                        Timber.e("Failed to set media URI on DLNA device")
                    }
                } catch (e: Exception) {
                    Timber.e(e, "Error playing media on DLNA device")
                }
            }
            true
        } catch (e: Exception) {
            Timber.e(e, "Error preparing media for DLNA playback")
            false
        }
    }
    
    fun pause() {
        val player = currentPlayer ?: return
        scope.launch {
            try {
                player.pause()
                Timber.d("DLNA playback paused")
            } catch (e: Exception) {
                Timber.e(e, "Error pausing DLNA playback")
            }
        }
    }
    
    fun resume() {
        val player = currentPlayer ?: return
        scope.launch {
            try {
                player.play()
                Timber.d("DLNA playback resumed")
            } catch (e: Exception) {
                Timber.e(e, "Error resuming DLNA playback")
            }
        }
    }
    
    fun stopPlayback() {
        val player = currentPlayer ?: return
        scope.launch {
            try {
                player.stop()
                Timber.d("DLNA playback stopped")
            } catch (e: Exception) {
                Timber.e(e, "Error stopping DLNA playback")
            }
        }
    }
    
    fun seek(positionMs: Long) {
        val player = currentPlayer ?: return
        
        // Convert milliseconds to HH:MM:SS format
        val hours = positionMs / 3600000
        val minutes = (positionMs % 3600000) / 60000
        val seconds = (positionMs % 60000) / 1000
        val target = String.format(Locale.ROOT, "%02d:%02d:%02d", hours, minutes, seconds)
        
        scope.launch {
            try {
                player.seek(target)
                Timber.d("DLNA seek to $target")
            } catch (e: Exception) {
                Timber.e(e, "Error seeking DLNA playback")
            }
        }
    }
    
    fun setVolume(volume: Int) {
        val player = currentPlayer ?: return
        scope.launch {
            try {
                // Convert 0-1 float to 0-100 int
                val volumePercent = (volume * 100).coerceIn(0, 100)
                player.setVolume(volumePercent)
                Timber.d("DLNA volume set to $volumePercent")
            } catch (e: Exception) {
                Timber.e(e, "Error setting DLNA volume")
            }
        }
    }
}

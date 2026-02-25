<div align="center">
  <h1>Musika</h1>

  <p><strong>A robust, open-source music streaming client offering an ad-free experience, offline capabilities, and advanced music discovery.</strong></p>

<br>

  <a href="https://github.com/jed1boy/Musika/releases/latest">
    <img src="assets/download.png" alt="Download" width="200"/>
  </a>
</div>

---

## Overview

Musika delivers a seamless, premium listening experience by leveraging YouTube Music's vast library — without the ads. It adds powerful extras including offline downloads, real-time synchronized lyrics, and environment-aware music recognition.

---

## Features

### Streaming & Playback
- **Ad-Free** — Stream without interruptions.
- **Seamless Playback** — Switch effortlessly between audio-only and video modes.
- **Background Playback** — Listen while using other apps or with the screen off.
- **Offline Mode** — Download tracks, albums, and playlists via a dedicated download manager.

### Discovery & Music Recognition
- **Audio Recognition** — Identify songs playing around you using advanced audio recognition.
- **Smart Recommendations** — Personalized suggestions based on your listening history.
- **Comprehensive Browsing** — Explore Charts, Podcasts, Moods, and Genres.

### Advanced Capabilities
- **Synchronized Lyrics** — Real-time synced lyrics with AI-powered multilingual translation.
- **Sleep Timer** — Set automatic playback stop after a chosen duration.
- **Cross-Device Support** — Cast to Chromecast devices or stream via DLNA/UPnP.
- **Data Import** — Import playlists and library data from other services.

---

## Installation

### Android
Download the latest APK from the [Releases Page](https://github.com/jed1boy/Musika/releases/latest).

### Desktop (Windows)
Desktop builds ship alongside Android releases. Download the installer from the
[Releases Page](https://github.com/jed1boy/Musika/releases/latest).

### Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/jed1boy/Musika.git
   cd Musika
   ```

2. **Configure Android SDK**
   ```bash
   echo "sdk.dir=/path/to/your/android/sdk" > local.properties
   ```

3. **Firebase configuration**
   Firebase is required for analytics and reliable imports. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for instructions on adding your `google-services.json`.

4. **Build**
   ```bash
   ./gradlew :app:assembleArm64Debug
   # or
   ./gradlew :app:assembleX86_64Debug
   ```

### Desktop (Windows) from Source
```bash
cd desktop
npm install
npm run dev
```

---

## Release process

- Push to `main` to trigger the Android release workflow.
- Push to `desktop-release` to trigger the desktop release workflow.
- Tags are created automatically as `android-vX.Y.Z` and `desktop-vX.Y.Z`.

---

## Acknowledgments

Musika is a fork of [Echo Music](https://github.com/iad1tya/Echo-Music), which was built on the shoulders of several excellent open-source projects:

| Project | Description |
|---------|-------------|
| [Metrolist](https://github.com/MetrolistGroup/Metrolist) | Foundational inspiration and architecture reference |
| [Better Lyrics](https://better-lyrics.boidu.dev/) | Lyrics enhancement and synchronization |
| [SimpMusic](https://github.com/maxrave-dev/SimpMusic) | Lyrics implementation reference |
| [Music Recognizer](https://github.com/aleksey-saenko/MusicRecognizer) | Audio recognition |

---

<div align="center">
  Licensed under <a href="LICENSE">GPL-3.0</a>
</div>

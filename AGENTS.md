# Agents

## Cursor Cloud specific instructions

### Project Overview

Musika is a native Android music streaming client (Kotlin + Jetpack Compose). There is no backend server — it is a fully client-side Android app. See `README.md` and `SETUP.md` for general documentation.

### Prerequisites (pre-installed by environment snapshot)

- **JDK 21** — required by `jvmToolchain(21)` in `app/build.gradle.kts`
- **Android SDK** at `/opt/android-sdk` (platform 36, build-tools 36.0.0, platform-tools)
- **ANDROID_HOME** exported in `~/.bashrc`
- **Debug keystore** at `~/.android/debug.keystore`

### Quick Start

```bash
# Generate config files (idempotent, will not overwrite)
[ -f local.properties ] || echo "sdk.dir=/opt/android-sdk" > local.properties
[ -f app/google-services.json ] || cp app/google-services.json.example app/google-services.json

# Build debug APK (x86_64 for cloud VMs)
./gradlew :app:assembleX86_64Debug

# Lint
./gradlew :app:lintX86_64Debug

# Unit tests
./gradlew test
```

### Gotchas

- **`local.properties`** and **`app/google-services.json`** are gitignored. They must be created before any Gradle task. The update script handles this.
- **Debug keystore** must exist at `~/.android/debug.keystore` or the debug build will fail with `Keystore file not found`. The environment snapshot includes one; if missing, regenerate with: `keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"`
- **Firebase is optional** — the example `google-services.json` has placeholder values, which is fine for debug builds. Use `assembleFossDebug` if Firebase causes issues.
- The project has **two ABI flavors**: `arm64` and `x86_64`. On cloud VMs (x86_64), always use the `x86_64` variant (e.g., `assembleX86_64Debug`, `lintX86_64Debug`).
- **No unit test sources** currently exist, so `./gradlew test` completes with `NO-SOURCE`. This is expected.
- Gradle 9.1.0 with configuration cache is used. First builds download dependencies and may take ~5 minutes; subsequent builds are cached.

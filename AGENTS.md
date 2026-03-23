## Learned User Preferences

- When a plan file is attached, execute it exactly as written and do not edit the plan file; keep plan todos updated from the first item in_progress through completion; do not stop early on planned implementation work. If asked to pull latest commits before a fix, sync safely first (preserve local changes).
- Keep responses concise and action-oriented; prefer copy-paste command sequences over conceptual explanations for setup questions. Provide WSL bash commands for Unix CLI tasks and PowerShell syntax for Windows-side operations.
- Avoid proposing production setups that require paid infrastructure for no-domain/public alternatives.
- Keep crash-reporting and observability implementations practical and low-friction.
- Do not include "Made-with: Cursor" or similar tool-attribution trailers in git commits.
- For commit messages and releases: prefer short release-note-style commit messages (title + concise bullets); omit version prefixes unless requested; always add a markdown changelog for new app versions with versions formatted as `vX.Y.Z`; when CI or GitHub Actions publishes the release APK, bump version and changelog and push without running a local release build unless explicitly asked. When the user asks to commit only part of the repo (for example the `website/` tree), stage and commit only those paths and leave other local changes unstaged.
- For web UI: avoid generic bento-grid layouts; prefer editorial/asymmetric designs with strong mobile-first presentation; keep new surfaces consistent with the existing Musika website and Android app; avoid heavy experimental marketing-homepage effects unless explicitly requested; wire font stacks via real Next/font variables, not self-referential CSS custom properties. On the public marketing site, keep copy concise and non-technical unless the user asks for more technical detail.
- Prefer OAuth or redirect-based Google sign-in over manual credential paste for non-technical users; for Musika-level auth on a backend, prefer Better Auth and use Context7 for current library docs while implementing; for web playback or search surfaces, keep traffic first-party with neutral API path names and verify behavior with a mainstream ad blocker when changing those flows.
- For cross-platform playlist import on Android, prefer CSV/JSON from third-party export tools (e.g. Exportify, Tune My Music, Soundiiz) over in-app OAuth to streaming platforms when developer API access is impractical or unwanted.

## Learned Workspace Facts

- Windows environment using WSL for Unix-native CLIs (Turso, bash tools); Windows PowerShell lacks winget/turso/Unix utilities.
- Primary product work targets the Android app; the website is secondary.
- The Android app does not require users to sign in to listen to music.
- The Android UI utilizes Google Sans and Google Sans Flex fonts, heavily leveraging Material 3 Expressive design principles.
- The user is the sole contributor; deprecated or unmaintained directories (e.g., Desktop app components) can be safely removed.
- The Next.js site is marketing-only; the former `/listen` web player was removed and legacy `/listen` paths redirect to `/`. The site also serves `/what-is-musika` (human overview) and `/llms.txt` (short machine-readable summary for assistants and tools).
- Android playlist import accepts exported CSV/JSON, matches tracks to YouTube Music via innertube, can write to local playlists and/or the signed-in YouTube Music library, and opens common export-tool sites in the external browser with `ACTION_VIEW` (no in-app Spotify Web API).

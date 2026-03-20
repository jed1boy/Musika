## Learned User Preferences

- When a plan file is attached, execute it exactly as written and do not edit the plan file; keep plan todos updated from the first item in_progress through completion; do not stop early on planned implementation work. If asked to pull latest commits before a fix, sync safely first (preserve local changes).
- Keep responses concise and action-oriented; prefer copy-paste command sequences over conceptual explanations for setup questions. Provide WSL bash commands for Unix CLI tasks and PowerShell syntax for Windows-side operations.
- Avoid proposing production setups that require paid infrastructure for no-domain/public alternatives.
- Keep crash-reporting and observability implementations practical and low-friction.
- Do not include "Made-with: Cursor" or similar tool-attribution trailers in git commits.
- For commit messages and releases: prefer short release-note-style commit messages (title + concise bullets); omit version prefixes unless requested; always add a markdown changelog for new app versions with versions formatted as `vX.Y.Z`.
- For web UI: avoid generic bento-grid layouts; prefer editorial/asymmetric designs with strong mobile-first presentation; keep new surfaces consistent with the existing Musika website and Android app; avoid heavy experimental marketing-homepage effects unless explicitly requested; wire font stacks via real Next/font variables, not self-referential CSS custom properties.
- Prefer OAuth or redirect-based Google sign-in over manual credential paste for non-technical users; for web playback and search, keep traffic first-party with neutral API path names and verify behavior with a mainstream ad blocker when changing those flows.
- For cross-platform playlist import on Android, prefer CSV/JSON from third-party export tools (e.g. Exportify, Tune My Music, Soundiiz) over in-app OAuth to streaming platforms when developer API access is impractical or unwanted.

## Learned Workspace Facts

- Windows environment using WSL for Unix-native CLIs (Turso, bash tools); Windows PowerShell lacks winget/turso/Unix utilities.
- The Android app does not require users to sign in to listen to music.
- The Android UI utilizes Google Sans and Google Sans Flex fonts, heavily leveraging Material 3 Expressive design principles.
- The user is the sole contributor; deprecated or unmaintained directories (e.g., Desktop app components) can be safely removed.
- The Next.js web app serves marketing at `/` (legacy `/listen` URLs redirect home).
- Android playlist import accepts exported CSV/JSON, matches tracks to YouTube Music via innertube, can write to local playlists and/or the signed-in YouTube Music library, and opens common export-tool sites in the external browser with `ACTION_VIEW` (no in-app Spotify Web API).

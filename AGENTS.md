## Learned User Preferences

- When a plan file is attached, execute the plan exactly as written and do not edit the plan file.
- Always update existing plan todos during execution, starting with the first todo as in_progress, then progressing to completion.
- For planned implementation tasks, do not stop early; continue until all listed todos are completed.
- If asked to pull latest commits before a fix, sync safely first (preserve local changes) before making code changes.
- Keep responses concise and action-oriented; prefer copy-paste command sequences over conceptual explanations for setup questions.
- Provide WSL bash commands for Unix CLI tasks and PowerShell syntax for Windows-side operations.
- Avoid proposing production setups that require paid infrastructure for no-domain/public alternatives.
- Keep crash-reporting and observability implementations practical and low-friction.
- Do not include "Made-with: Cursor" or similar tool-attribution trailers in git commits.
- For commit messages, prefer short release-note style (title + concise bullet points); omit version prefixes unless requested.
- Always generate a markdown changelog/release notes for new app versions and format version releases exactly as `vX.Y.Z`.
- For web UI work, avoid generic bento-grid layouts; prefer editorial/asymmetric designs with strong mobile-first presentation.
- Prefer OAuth over manual credential paste for non-technical users.

## Learned Workspace Facts

- Windows environment using WSL for Unix-native CLIs (Turso, bash tools); Windows PowerShell lacks winget/turso/Unix utilities.
- The Android app does not require users to sign in to listen to music.
- The Android UI utilizes Google Sans and Google Sans Flex fonts, heavily leveraging Material 3 Expressive design principles.
- The user is the sole contributor; deprecated or unmaintained directories (e.g., Desktop app components) can be safely removed.
# Musika Desktop (Tauri)

This is the desktop app shell for Musika, built with Tauri for a lightweight,
fast startup experience on Windows.

## Prerequisites
- Node.js 18+
- Rust (stable toolchain)
- Windows WebView2 Runtime (installed by default on Windows 10/11)

## Development
```bash
cd desktop
npm install
npm run dev
```

## Build (Windows)
```bash
cd desktop
npm run build
```

The installer output will be placed under
`desktop/src-tauri/target/release/bundle/`.

## Notes
- Frontend assets live in `desktop/frontend` and are served directly.
- Rust commands are defined in `desktop/src-tauri/src/main.rs`.

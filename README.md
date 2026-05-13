# Wedding Planner — Electron Preview

Run a local Electron preview of the `wedding_planner.jsx` UI.

Setup

1. Open a terminal in this folder (`/Users/iliasmac/Desktop/Planner/app.v1`).
2. Install dev dependency `electron`:

```bash
npm install
```

Start preview

```bash
npm start
```

This opens a macOS Electron window with the app UI. The UI is powered by React via CDN and Babel inline for quick preview.

Notes
- To package a native macOS .app, use `electron-builder` or `electron-forge` and adjust the build scripts.
- This preview keeps the original functionality and visuals from `wedding_planner.jsx`.

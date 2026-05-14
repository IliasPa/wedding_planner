# Wedding Planner — Electron Preview

Run a local Electron preview of the `wedding_planner.jsx` UI.

Setup

1. Open a terminal in this folder (`/Users/iliasmac/Desktop/Planner/app.v1`).
2. Install dev dependency `electron`:

```bash
npm install
```

Instead of committing the `node_modules/` folder, install Node with `nvm` and run `npm install` locally. Example (do this manually):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
# restart your shell or run:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm install
```

Sun only the server:
```bash
npm run server
```

Start preview

```bash
npm start
```

This opens a macOS Electron window with the app UI. The UI is powered by React via CDN and Babel inline for quick preview.

Notes

- To package a native macOS .app, use `electron-builder` or `electron-forge` and adjust the build scripts.
- This preview keeps the original functionality and visuals from `wedding_planner.jsx`.

Data and persistence

- Sample data has been moved to the `data/` folder as JSON files (venues, photographers, budget, guests, tables, checklist, vendors, nav, meta).
- A small `dataStore.js` helper loads the bundled JSON and persists edits to `localStorage` so changes (add/update/remove) made in the UI are kept across reloads.
- When running the preview via Electron (`npm start`), edits are written back to the corresponding `data/*.json` files on disk. This uses a secure preload IPC bridge so the renderer can request file writes.
- If you open `index.html` directly in a browser (not Electron), changes will be kept in `localStorage` only and will not modify files on disk.

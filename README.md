# Wedding Planner

A personal wedding planning desktop app built with Electron + React. Manage your budget, guests, venues, photographers, seating, checklist, and vendors — all from one local app with data persisted to disk.

---

## Version History

### v1.0 — Electron Preview

The initial version was a minimal Electron shell wrapping a single `wedding_planner.jsx` file. React and Babel were loaded via CDN so the UI could be previewed without a build step.

**What it included:**
- Electron window rendering `index.html` + `wedding_planner.jsx`
- React UI powered by CDN React + in-browser Babel transpilation
- No data persistence — all state was in-memory and lost on reload
- Basic setup: `npm install` + `npm start`

**What it lacked:**
- No way to save changes
- All sample data was hardcoded inside the JSX file

---

### v1.1 — Data Layer + localStorage Persistence

v1.1 introduced a proper data layer so changes survive reloads.

**What changed:**
- Sample data extracted from the JSX into separate `data/*.json` files:
  `venues`, `photographers`, `budget`, `guests`, `tables`, `checklist`, `vendors`, `nav`, `meta`
- `dataStore.js` helper loads JSON files at startup and writes edits back via `localStorage`
- When running via Electron, edits are written back to the `data/*.json` files on disk through a secure IPC bridge (`preload.js` + `ipcMain.handle("write-data-file", ...)`)
- Added `nvm` setup instructions to the README
- If `index.html` is opened directly in a browser (not Electron), changes are saved to `localStorage` only and do not modify files on disk

**Architecture:**
```
Renderer (React) → window.electronAPI.writeDataFile() → preload IPC → main.js → data/*.json
```

---

### v1.2 — REST API Backend

v1.2 replaces the IPC-based write mechanism with a full local REST API server (`server.js`) running on `http://localhost:3001`. The UI now communicates with the backend for all data operations.

**What changed:**
- Added `server.js`: an Express REST API with full CRUD support for all collections
- Added `Start.command`: a double-clickable launcher that starts the API server and opens the Electron window together
- UI now uses `apiPost()` / `apiPatch()` helpers to call the REST API instead of writing through IPC
- Added `body-parser` and `express` as runtime dependencies
- Atomic file writes on the server (write to `.tmp` then rename) to prevent data corruption
- Timestamp-based ID generation (`YYYYMMDDHHMMSS`) with collision avoidance

**API endpoints (`http://localhost:3001/api`):**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/:collection` | Fetch all items in a collection |
| `POST` | `/api/:collection` | Add a new item (auto-generates ID if missing) |
| `PUT` | `/api/:collection/:id` | Update a single item by ID |
| `PUT` | `/api/:collection` | Replace the entire collection |
| `DELETE` | `/api/:collection/:id` | Delete an item by ID |

**Collections:** `venues`, `photographers`, `budget`, `guests`, `tables`, `checklist`, `vendors`, `nav`, `meta`

**Architecture:**
```
Renderer (React) → fetch() → Express server (localhost:3001) → data/*.json
```

---

## Features

| Section | Description |
|---------|-------------|
| **Overview** | Dashboard with days-to-wedding countdown, budget progress, guest RSVP summary, task completion, and selected venue/photographer |
| **Budget** | Set a total budget, add spending categories, track spent vs. budgeted per category with visual progress bars |
| **Venues** | Add venues with capacity, price, rating, and notes; mark one as selected |
| **Photographers** | Add photographers with style, price, rating; mark one as selected |
| **Guests** | Add guests with RSVP status (confirmed / pending / declined), search and filter, dietary notes |
| **Tables** | Drag-and-drop seating planner — assign guests to named tables |
| **Checklist** | Task list grouped by category with done/undone toggle and progress tracking |
| **Vendors** | Track vendors (florist, catering, etc.) with contact info and status |

All sections support soft-delete (trash) with restore — deleted items are hidden but recoverable.

---

## Setup

Install Node with `nvm` if you don't have it:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
# restart your shell or run:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
```

Install dependencies:

```bash
npm install
```

---

## Running the App (v1.2)

v1.2 requires both the API server and the Electron window to be running.

**Option A — double-click launcher (macOS):**

Double-click `Start.command` in Finder. This starts the API server and opens the Electron window automatically.

**Option B — two terminals:**

Terminal 1 — start the API server:
```bash
npm run server
```

Terminal 2 — start the Electron window:
```bash
npm start
```

---

## Data & Persistence

- All data lives in `data/*.json` files.
- The API server reads from and writes to these files on every request.
- Writes are atomic: data is written to a `.tmp` file first, then renamed, so a crash mid-write never corrupts your data.
- Do **not** commit `node_modules/` — run `npm install` locally instead.

---

## Customising Your Wedding Details

Edit `data/meta.json` to set your names and wedding date:

```json
{
  "wedding_date": "2026-07-18",
  "partner1_name": "Emma",
  "partner2_name": "James"
}
```

The countdown and date displayed in the app update automatically.

---

## Packaging a Native .app (optional)

```bash
npm run dist
```

This uses `electron-builder` to produce a `.dmg` and `.zip` in the `dist/` folder. Requires macOS.

---

## Tech Stack

- **Electron** — desktop shell
- **React** (via CDN) + **Babel** (in-browser) — UI, no build step required
- **Express** — local REST API server
- **JSON files** — flat-file database

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Basic CORS for local dev (file:// or served pages)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const COLLECTIONS = {
  venues: "data/venues.json",
  photographers: "data/photographers.json",
  budget: "data/budget.json",
  guests: "data/guests.json",
  tables: "data/tables.json",
  checklist: "data/checklist.json",
  vendors: "data/vendors.json",
  nav: "data/nav.json",
  meta: "data/meta.json",
};

function pad(n, width = 2) {
  return String(n).padStart(width, "0");
}

function formatTimestampId(date) {
  return (
    "" +
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function safePath(collection) {
  if (!COLLECTIONS[collection]) return null;
  return path.join(__dirname, COLLECTIONS[collection]);
}

function readJson(filePath) {
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

function writeJsonAtomic(filePath, obj) {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

app.get("/api/:collection", (req, res) => {
  const filePath = safePath(req.params.collection);
  if (!filePath) return res.status(404).json({ error: "Unknown collection" });
  const data = readJson(filePath);
  if (data === null)
    return res.status(500).json({ error: "Failed to read file" });
  res.json(data);
});

app.post("/api/:collection", (req, res) => {
  const col = req.params.collection;
  const filePath = safePath(col);
  if (!filePath) return res.status(404).json({ error: "Unknown collection" });
  const existing = readJson(filePath);
  if (existing === null)
    return res.status(500).json({ error: "Failed to read file" });

  if (Array.isArray(existing)) {
    const item = { ...(req.body || {}) };
    if (!item.id) {
      // generate unique YYYYMMDDHHMMSS id, bumping seconds if collision
      let i = 0;
      while (true) {
        const candidate = formatTimestampId(new Date(Date.now() + i * 1000));
        const found = existing.find((x) => String(x.id) === String(candidate));
        if (!found) {
          item.id = candidate;
          break;
        }
        i += 1;
      }
    }
    existing.push(item);
    try {
      writeJsonAtomic(filePath, existing);
      return res.json(item);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // object merge
  const merged = { ...existing, ...(req.body || {}) };
  try {
    writeJsonAtomic(filePath, merged);
    return res.json(merged);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.put("/api/:collection/:id?", (req, res) => {
  const col = req.params.collection;
  const id = req.params.id;
  const filePath = safePath(col);
  if (!filePath) return res.status(404).json({ error: "Unknown collection" });
  const existing = readJson(filePath);
  if (existing === null)
    return res.status(500).json({ error: "Failed to read file" });

  // If id provided and collection is array => update single item
  if (Array.isArray(existing) && id) {
    const idx = existing.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Item not found" });
    existing[idx] = { ...existing[idx], ...(req.body || {}) };
    try {
      writeJsonAtomic(filePath, existing);
      return res.json(existing[idx]);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // If no id provided: interpret body as full collection/object replacement
  try {
    const newData = req.body;
    if (newData === undefined)
      return res
        .status(400)
        .json({ error: "Missing body for collection replacement" });
    writeJsonAtomic(filePath, newData);
    return res.json(newData);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.delete("/api/:collection/:id", (req, res) => {
  const col = req.params.collection;
  const id = req.params.id;
  const filePath = safePath(col);
  if (!filePath) return res.status(404).json({ error: "Unknown collection" });
  const existing = readJson(filePath);
  if (existing === null)
    return res.status(500).json({ error: "Failed to read file" });
  if (!Array.isArray(existing))
    return res.status(400).json({ error: "Collection is not an array" });
  const next = existing.filter((x) => String(x.id) !== String(id));
  try {
    writeJsonAtomic(filePath, next);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});

(function (window) {
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

  const store = {};
  let API_BASE = "/api";
  try {
    if (typeof window !== "undefined" && window.__API_BASE__)
      API_BASE = window.__API_BASE__;
    else if (
      typeof location !== "undefined" &&
      location.protocol &&
      !location.protocol.startsWith("http")
    )
      API_BASE = "http://localhost:3001/api";
  } catch (e) {}

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch " + path);
    return res.json();
  }

  async function apiFetch(path, opts = {}) {
    const res = await fetch(
      path,
      Object.assign({ headers: { "Content-Type": "application/json" } }, opts),
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error("API error " + res.status + " " + text);
    }
    // some endpoints return empty body (e.g., delete) => handle
    const txt = await res.text();
    try {
      return txt ? JSON.parse(txt) : null;
    } catch (e) {
      return txt;
    }
  }

  async function loadCollection(key) {
    if (!COLLECTIONS[key]) return null;
    try {
      const data = await apiFetch(`${API_BASE}/${key}`);
      store[key] = data;
      return data;
    } catch (e) {
      console.warn("API load failed for", key, e);
      // fallback to bundled JSON for read-only display
      try {
        const data = await fetchJson(COLLECTIONS[key]);
        store[key] = data;
        return data;
      } catch (err) {
        console.warn("Failed to load bundled JSON for", key, err);
        store[key] = Array.isArray(store[key]) ? store[key] : null;
        return store[key];
      }
    }
  }

  async function loadAll() {
    const keys = Object.keys(COLLECTIONS);
    const results = {};
    for (const k of keys) {
      results[k] = await loadCollection(k);
    }
    return results;
  }

  // saveCollection is preserved but will PUT the entire collection to the server
  // saveCollection(key, payload?) - if payload provided, replace local copy and send payload to server.
  async function saveCollection(key, payload) {
    if (!COLLECTIONS[key]) return;
    const bodyObj = payload === undefined ? store[key] : payload;
    if (bodyObj === undefined) return;
    // update local cached copy when payload provided
    if (payload !== undefined) store[key] = payload;
    try {
      await apiFetch(`${API_BASE}/${key}`, {
        method: "PUT",
        body: JSON.stringify(bodyObj),
      });
    } catch (e) {
      console.warn("Failed to save collection via API for", key, e);
      throw e;
    }
  }

  async function saveAll() {
    for (const k of Object.keys(store)) await saveCollection(k);
  }

  function get(key) {
    return store[key];
  }

  async function addItem(key, item) {
    if (!COLLECTIONS[key]) throw new Error("Unknown collection " + key);
    try {
      const created = await apiFetch(`${API_BASE}/${key}`, {
        method: "POST",
        body: JSON.stringify(item),
      });
      // update local store
      if (!store[key]) store[key] = Array.isArray(created) ? created : [];
      if (Array.isArray(store[key])) store[key].push(created);
      else store[key] = created;
      return created;
    } catch (e) {
      console.warn("Failed to add item via API", key, e);
      throw e;
    }
  }

  async function updateItem(key, id, changes) {
    if (!COLLECTIONS[key]) throw new Error("Unknown collection " + key);
    try {
      const updated = await apiFetch(`${API_BASE}/${key}/${id}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      if (Array.isArray(store[key])) {
        const i = store[key].findIndex((x) => String(x.id) === String(id));
        if (i !== -1) store[key][i] = updated;
      } else {
        store[key] = updated;
      }
      return updated;
    } catch (e) {
      console.warn("Failed to update item via API", key, id, e);
      throw e;
    }
  }

  async function removeItem(key, id) {
    if (!COLLECTIONS[key]) throw new Error("Unknown collection " + key);
    try {
      await apiFetch(`${API_BASE}/${key}/${id}`, { method: "DELETE" });
      if (Array.isArray(store[key])) {
        store[key] = store[key].filter((x) => String(x.id) !== String(id));
      }
      return { ok: true };
    } catch (e) {
      console.warn("Failed to remove item via API", key, id, e);
      throw e;
    }
  }

  function getMetaDate() {
    const meta = store.meta || null;
    if (!meta || !meta.wedding_date) return null;
    return new Date(meta.wedding_date);
  }

  window.DataStore = {
    loadAll,
    loadCollection,
    get,
    addItem,
    updateItem,
    removeItem,
    saveAll,
    saveCollection,
    getMetaDate,
  };
})(window);

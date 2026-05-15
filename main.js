const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const iconPath = path.join(__dirname, "icon.png");
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
  // Uncomment to open devtools by default
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  const iconPath = path.join(__dirname, "icon.png");
  try {
    if (app.dock && typeof app.dock.setIcon === "function")
      app.dock.setIcon(iconPath);
  } catch (e) {}
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("write-data-file", async (event, filename, json) => {
  try {
    // Only allow writes to the data/ folder
    const safe = path.join(__dirname, "data", path.basename(filename));
    await fs.promises.writeFile(safe, JSON.stringify(json, null, 2), "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

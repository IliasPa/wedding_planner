const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  writeDataFile: (filename, json) =>
    ipcRenderer.invoke("write-data-file", filename, json),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('namoDesktop', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch) => ipcRenderer.invoke('config:set', patch),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  notify: (payload) => ipcRenderer.invoke('notify', payload),
});

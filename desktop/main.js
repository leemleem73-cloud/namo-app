const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULT_SERVER_URL = 'https://qmes.namochemical.com';

let mainWindow;
let tray;
let quitting = false;
const configPath = path.join(app.getPath('userData'), 'config.json');

function normalizeConfig(value = {}) {
  const savedUrl = String(value.serverUrl || '').trim().replace(/\/$/, '');
  const isLocalAddress = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(savedUrl);
  return {
    ...value,
    serverUrl: !savedUrl || isLocalAddress ? DEFAULT_SERVER_URL : savedUrl,
    autoStart: value.autoStart !== false,
  };
}

function readConfig() {
  try {
    const current = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const normalized = normalizeConfig(current);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) {
      fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf8');
    }
    return normalized;
  } catch (_) {
    return { serverUrl: DEFAULT_SERVER_URL, autoStart: true };
  }
}

function writeConfig(next) {
  const normalized = normalizeConfig(next);
  fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    show: false,
    title: 'NAMO Talk',
    backgroundColor: '#0f2740',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (event) => {
    if (!quitting) { event.preventDefault(); mainWindow.hide(); }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('NAMO Talk');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'NAMO Talk 열기', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: '종료', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

app.whenReady().then(() => {
  const config = readConfig();
  app.setLoginItemSettings({ openAtLogin: config.autoStart !== false });
  createWindow();
  createTray();
  app.on('activate', () => mainWindow ? mainWindow.show() : createWindow());
});
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', (event) => event.preventDefault());

ipcMain.handle('config:get', () => readConfig());
ipcMain.handle('config:set', (_event, patch) => {
  const next = writeConfig({ ...readConfig(), ...(patch || {}) });
  app.setLoginItemSettings({ openAtLogin: next.autoStart !== false });
  return next;
});
ipcMain.handle('window:hide', () => mainWindow && mainWindow.hide());
ipcMain.handle('notify', (_event, payload) => {
  if (Notification.isSupported()) new Notification({ title: payload?.title || 'NAMO Talk', body: payload?.body || '' }).show();
});

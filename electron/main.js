const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
const PORT = process.env.PORT || 4500;
const SERVER_URL = `http://localhost:${PORT}`;

// Check if backend daemon is already active
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/api/system/info`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start backend server child process if not already running
async function startServerIfNeeded() {
  const isRunning = await checkServerRunning();
  if (isRunning) {
    console.log('[Electron] Serveur local déjà en cours d\'exécution sur le port', PORT);
    return;
  }

  console.log('[Electron] Lancement du démon local Dock (1)...');
  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Erreur serveur :', err);
  });

  // Wait for server to become responsive
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const ready = await checkServerRunning();
    if (ready) {
      console.log('[Electron] Serveur prêt !');
      break;
    }
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090a0c',
    title: 'Dock (1) — Docker Manager',
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Open external links (e.g. GitHub releases, Discord docs) in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startServerIfNeeded();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('[Electron] Arrêt du démon local...');
    serverProcess.kill();
    serverProcess = null;
  }
});

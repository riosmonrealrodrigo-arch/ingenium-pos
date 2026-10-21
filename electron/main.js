const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess = null;
const PORT = process.env.PORT || 3000;
const START_URL = `http://localhost:${PORT}/pos`;

function checkAndStartServer(callback) {
  const req = http.get(`http://localhost:${PORT}`, (res) => {
    callback();
  });

  req.on('error', () => {
    // Si el servidor local no está corriendo, iniciamos el server standalone de Next.js
    const serverPath = path.join(__dirname, '../.next/standalone/server.js');
    try {
      serverProcess = spawn('node', [serverPath], {
        env: { ...process.env, PORT: `${PORT}`, NODE_ENV: 'production' },
        stdio: 'ignore',
        detached: false,
      });

      serverProcess.on('error', (err) => {
        console.error('Error al iniciar el servidor integrado:', err);
      });
    } catch (e) {
      console.error('Fallo al ejecutar spawn de servidor:', e);
    }

    // Reintentar hasta que el servidor responda
    const checkReady = () => {
      http.get(`http://localhost:${PORT}`, (res) => {
        callback();
      }).on('error', () => {
        setTimeout(checkReady, 400);
      });
    };

    setTimeout(checkReady, 800);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'INGENIUM POS - Punto de Venta y Gestión',
    autoHideMenuBar: true,
    backgroundColor: '#1e3a5f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.maximize();

  // Mostrar mensaje de carga inicial en lugar de pantalla blanca
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Iniciando INGENIUM POS</title>
        <style>
          body {
            margin: 0;
            background: #1e3a5f;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            user-select: none;
          }
          .logo {
            width: 70px;
            height: 70px;
            background: #f59e0b;
            color: #1e3a5f;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 900;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            margin-bottom: 20px;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255,255,255,0.2);
            border-top-color: #f59e0b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-top: 15px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          h2 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
          p { margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="logo">I</div>
        <h2>INGENIUM POS</h2>
        <p>Iniciando sistema de punto de venta...</p>
        <div class="spinner"></div>
      </body>
    </html>
  `)}`);

  checkAndStartServer(() => {
    mainWindow.loadURL(START_URL);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('print-ticket', (event, options) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.print({
      silent: options?.silent ?? true,
      printBackground: true,
      deviceName: options?.printerName || '',
    });
  }
});

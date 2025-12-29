const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true
    }
  });

  // Cargar tu app AngularJS
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) backendProcess.kill();
  });
}

app.whenReady().then(() => {
  // 🔥 Arrancar backend Node.js
  backendProcess = spawn('node', [
    path.join(__dirname, '../backend/src/server.js')
  ]);

  backendProcess.stdout.on('data', data => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', data => {
    console.error(`Backend error: ${data}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

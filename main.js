// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Désactiver l'accélération matérielle pour résoudre les erreurs OpenGL
app.disableHardwareAcceleration();

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Supprime la barre de titre par défaut
    transparent: false,
    resizable: true,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // Permet l'utilisation de Node.js dans le renderer
      contextIsolation: false,
    },
    darkTheme: true
  });

  mainWindow.loadFile('index.html');

  // Ne pas ouvrir les DevTools automatiquement
  // mainWindow.webContents.openDevTools(); // Commenté pour désactiver l'ouverture automatique
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Sur macOS, recréer une fenêtre quand l'icône de l'app est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Gestionnaire pour ouvrir la boîte de dialogue de sélection de fichiers
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'csv', 'json'] }
    ]
  });

  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// Gestionnaires IPC pour les contrôles de fenêtre personnalisés
ipcMain.on('window:minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow.close();
});

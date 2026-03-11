const { app, BrowserWindow } = require('electron');
const path = require('path');

let win; // 1. Объявляем тут

function createWindow() {
  win = new BrowserWindow({ // 2. Присваиваем тут
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  // ВЫБЕРИ ОДИН ИЗ ДВУХ ВАРИАНТОВ:
  
  // А) Если запустил npm run dev во фронтенде:
  win.loadURL('http://localhost'); 
  
  // Б) Если сделал npm run build во фронтенде:
  // win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
}

app.whenReady().then(createWindow);
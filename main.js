const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

let store;
let lastSavedFilePath;

async function initializeStore() {
  const Store = (await import('electron-store')).default;
  store = new Store({
    defaults: {
      windowBounds: { width: 1200, height: 800 },
      theme: 'light',
      fontSize: 14,
      autosaveInterval: 30000, // 30 segundos
      lastOpenedFile: null
    }
  });
  lastSavedFilePath = store.get('lastOpenedFile');
}

async function createWindow() {
  await initializeStore();
  const { width, height } = store.get('windowBounds');
  const win = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Guardar tamaño de la ventana al redimensionar
  win.on('resize', () => {
    const { width, height } = win.getBounds();
    store.set('windowBounds', { width, height });
  });

  win.loadFile('index.html')

  // Enviar configuración inicial al renderer
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('settings-updated', {
      theme: store.get('theme'),
      fontSize: store.get('fontSize'),
      autosaveInterval: store.get('autosaveInterval')
    });
  });

  // Manejar cambios en la configuración
  ipcMain.handle('update-settings', async (event, settings) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value);
    }
    win.webContents.send('settings-updated', settings);
    return { success: true };
  });

  // Manejar archivo soltado en la ventana
  ipcMain.handle('file-dropped', async (event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      lastSavedFilePath = filePath
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Manejar auto-guardado
  ipcMain.handle('auto-save', async (event, content) => {
    if (!lastSavedFilePath) {
      return { success: false, error: 'No hay ruta de archivo disponible' }
    }

    try {
      await fs.promises.writeFile(lastSavedFilePath, content, 'utf8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Actualizar plantilla del menú con la configuración
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => win.webContents.send('menu-open')
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => win.webContents.send('menu-save')
        },
        { type: 'separator' },
        {
          label: 'Export as HTML',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => win.webContents.send('menu-export-html')
        },
        {
          label: 'Export as PDF',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => win.webContents.send('menu-export-pdf')
        },
        { type: 'separator' },
        {
          label: 'Settings',
          click: () => win.webContents.send('show-settings')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => win.webContents.send('menu-format', 'bold')
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => win.webContents.send('menu-format', 'italic')
        },
        {
          label: 'Insert Link',
          accelerator: 'CmdOrCtrl+K',
          click: () => win.webContents.send('menu-format', 'link')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(createWindow)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
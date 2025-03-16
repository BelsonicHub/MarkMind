const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
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

  // Manejar guardado de archivo
  ipcMain.handle('save-file', async (event, { content, filePath }) => {
    try {
      if (!filePath) {
        const { filePath: newPath, canceled } = await dialog.showSaveDialog({
          defaultPath: 'documento.md',
          filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }]
        });
        
        if (canceled || !newPath) {
          return { success: false, error: 'No se seleccionó una ruta de archivo' };
        }
        
        filePath = newPath;
      }
      
      await fs.promises.writeFile(filePath, content, 'utf8');
      lastSavedFilePath = filePath;
      store.set('lastOpenedFile', filePath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Manejar apertura de archivo
  ipcMain.handle('open-file', async () => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }]
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'No se seleccionó ningún archivo' };
      }

      const filePath = filePaths[0];
      const content = await fs.promises.readFile(filePath, 'utf8');
      lastSavedFilePath = filePath;
      store.set('lastOpenedFile', filePath);
      return { success: true, content, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Funciones de exportación
  ipcMain.handle('export-html', async (event, content) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: 'documento.html',
        filters: [{ name: 'Archivos HTML', extensions: ['html'] }]
      });

      if (filePath) {
        await fs.promises.writeFile(filePath, content, 'utf8');
        return { success: true };
      }
      return { success: false, error: 'No se seleccionó una ruta de archivo' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('export-pdf', async (event) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: 'documento.pdf',
        filters: [{ name: 'Archivos PDF', extensions: ['pdf'] }]
      });

      if (!filePath) {
        return { success: false, error: 'No se seleccionó una ruta de archivo' };
      }

      const win = BrowserWindow.fromWebContents(event.sender);
      const success = await new Promise((resolve) => {
        win.webContents.print(
          {
            silent: false,
            printBackground: true,
            deviceName: '',
            margins: {
              marginType: 'custom',
              top: 0.4,
              bottom: 0.4,
              left: 0.4,
              right: 0.4
            },
            landscape: false
          },
          (success, reason) => {
            resolve(success);
          }
        );
      });

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Error al generar el PDF' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Crear menú de la aplicación
  const menuTemplate = [
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
        },
        { type: 'separator' },
        { role: 'quit' }
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
        {
          label: 'Preview Mode',
          submenu: [
            {
              label: 'Basic View',
              type: 'radio',
              checked: true,
              click: () => win.webContents.send('menu-preview-mode', 'disabled')
            },
            {
              label: 'Split View',
              type: 'radio',
              click: () => win.webContents.send('menu-preview-mode', 'split')
            }
          ]
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
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
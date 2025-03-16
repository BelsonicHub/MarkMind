// Detectar Electron inmediatamente
if (window.electron) {
    document.documentElement.classList.add('electron-app');
}

document.addEventListener("DOMContentLoaded", async function() {
    // Inicializar EasyMDE
    var easyMDE = new EasyMDE({ 
        element: document.getElementById("editor"),
        autosave: {
            enabled: true,
            delay: 1000,
            uniqueId: "notepadmd-autosave"
        },
        tabSize: 4,
        renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true
        },
        toolbar: [
            "bold", "italic", "heading",
            "|", "quote", "code", "unordered-list",
            "|", "link", "image", "table",
            "|", "preview",
            {
                name: "generate-toc",
                action: function() {
                    if (pluginSystem.plugins.toc) {
                        pluginSystem.plugins.toc.generateTOC(easyMDE);
                    }
                },
                className: "fa fa-list-ol",
                title: "Generar Tabla de Contenidos",
            }
        ]
    });

    // Preview mode functionality
    const editorContainer = document.getElementById('editorContainer');
    const previewPanel = document.getElementById('preview');
    const previewModeSelect = document.getElementById('previewMode');

    function updatePreview() {
        const content = easyMDE.value();
        previewPanel.innerHTML = converter.makeHtml(content);
    }

    // Add event listeners for preview mode
    previewModeSelect.addEventListener('change', function() {
        const mode = this.value;
        editorContainer.classList.remove('preview-disabled', 'preview-split', 'preview-inline');
        editorContainer.classList.add(`preview-${mode}`);

        if (mode !== 'disabled') {
            updatePreview();
        }
    });

    // Update preview when content changes
    easyMDE.codemirror.on('change', () => {
        if (previewModeSelect.value !== 'disabled') {
            updatePreview();
        }
    });

    // Initialize in disabled mode
    editorContainer.classList.add('preview-disabled');

    // Configurar showdown para soportar tablas
    const converter = new showdown.Converter({
        tables: true,
        tasklists: true,
        strikethrough: true
    });

    // Funciones de edición
    document.getElementById('boldButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        codemirror.replaceSelection(`**${selectedText}**`);
    });

    document.getElementById('italicButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        codemirror.replaceSelection(`*${selectedText}*`);
    });

    document.getElementById('headingButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        codemirror.replaceSelection(`\n# ${selectedText}`);
    });

    document.getElementById('linkButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        codemirror.replaceSelection(`[${selectedText}](url)`);
    });

    document.getElementById('imageButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        codemirror.replaceSelection(`![${selectedText}](image-url)`);
    });

    document.getElementById('listButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        const listItems = selectedText.split('\n').map(item => `- ${item}`).join('\n');
        codemirror.replaceSelection(`\n${listItems}\n`);
    });

    document.getElementById('codeButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const selectedText = codemirror.getSelection();
        codemirror.replaceSelection(`\`${selectedText}\``);
    });

    document.getElementById('tableButton').addEventListener('click', () => {
        const codemirror = easyMDE.codemirror;
        const tableTemplate = `
| Encabezado 1 | Encabezado 2 | Encabezado 3 |
|--------------|--------------|--------------|
| Celda 1      | Celda 2      | Celda 3      |
| Celda 4      | Celda 5      | Celda 6      |`;
        
        const cursor = codemirror.getCursor();
        const selection = codemirror.getSelection();
        
        if (selection) {
            // Si hay texto seleccionado, convertirlo en tabla
            const rows = selection.split('\n');
            const numCols = rows[0].split(/\s+/).length;
            
            // Crear encabezados
            let table = '| ' + rows[0].split(/\s+/).join(' | ') + ' |\n';
            // Añadir separador
            table += '|' + ' --- |'.repeat(numCols) + '\n';
            // Añadir resto de filas
            for (let i = 1; i < rows.length; i++) {
                if (rows[i].trim()) {
                    table += '| ' + rows[i].split(/\s+/).join(' | ') + ' |\n';
                }
            }
            codemirror.replaceSelection(table);
        } else {
            // Si no hay selección, insertar plantilla
            codemirror.replaceRange('\n' + tableTemplate + '\n', cursor);
        }
    });

    // Sistema de plugins mejorado
    const pluginSystem = {
        plugins: {},
        hooks: {},
        register: function(name, plugin) {
            this.plugins[name] = plugin;
            if (plugin.hooks) {
                Object.entries(plugin.hooks).forEach(([hook, callback]) => {
                    if (!this.hooks[hook]) {
                        this.hooks[hook] = [];
                    }
                    this.hooks[hook].push(callback);
                });
            }
        },
        init: function(editor) {
            Object.values(this.plugins).forEach(plugin => {
                if (plugin.init) plugin.init(editor);
            });
        },
        trigger: function(hookName, ...args) {
            if (this.hooks[hookName]) {
                return this.hooks[hookName].map(callback => callback(...args));
            }
            return [];
        },
        getPlugins: function() {
            return Object.keys(this.plugins);
        },
        togglePlugin: function(name, enabled) {
            if (this.plugins[name] && this.plugins[name].toggle) {
                this.plugins[name].toggle(enabled);
            }
        }
    };

    // Plugin de Tabla de Contenidos mejorado
    const tocPlugin = {
        init: function(editor) {
            this.editor = editor;
        },
        hooks: {
            'beforeSave': (content) => content,
            'afterRender': () => {}
        },
        generateTOC: function(editor) {
            const text = editor.value();
            const headings = text.match(/^#{1,6}.+$/gm) || [];
            let toc = "# Tabla de Contenidos\n\n";
            
            headings.forEach(heading => {
                const level = heading.match(/^#+/)[0].length - 1;
                const title = heading.replace(/^#+\s*/, '');
                const link = title.toLowerCase()
                    .replace(/[^\w\sáéíóúüñ]/g, '')
                    .replace(/\s+/g, '-');
                toc += `${' '.repeat(level * 2)}- [${title}](#${link})\n`;
            });

            editor.value(toc + '\n' + text);
        }
    };

    // Registrar plugins
    pluginSystem.register('toc', tocPlugin);
    pluginSystem.init(easyMDE);

    // Estado de auto-guardado y configuración
    let isAutoSaveEnabled = true;
    let autoSaveTimer;
    let idleTimer;
    let currentSettings = {};
    const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutos
    const IDLE_DELAY = 2000; // 2 segundos

    // Botón de alternar auto-guardado
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    autoSaveToggle.addEventListener('click', () => {
        isAutoSaveEnabled = !isAutoSaveEnabled;
        autoSaveToggle.textContent = `Auto-guardado: ${isAutoSaveEnabled ? 'ON' : 'OFF'}`;
        
        if (isAutoSaveEnabled) {
            setupAutoSave();
        } else {
            clearInterval(autoSaveTimer);
            clearTimeout(idleTimer);
        }
    });

    // Función para configurar el auto-guardado
    function setupAutoSave() {
        if (!isAutoSaveEnabled) return;

        // Limpiar temporizadores existentes
        clearInterval(autoSaveTimer);
        clearTimeout(idleTimer);

        // Auto-guardado en intervalo regular
        autoSaveTimer = setInterval(async () => {
            await saveContent();
        }, AUTO_SAVE_INTERVAL);

        // Guardar en inactividad
        easyMDE.codemirror.on('change', () => {
            if (!isAutoSaveEnabled) return;
            clearTimeout(idleTimer);
            idleTimer = setTimeout(async () => {
                await saveContent();
            }, IDLE_DELAY);
        });
    }

    async function saveContent() {
        if (window.electron) {
            const currentTab = tabSystem.getCurrentTab();
            if (!currentTab || !currentTab.filePath) return;

            try {
                const result = await window.electron.ipcRenderer.invoke('auto-save', {
                    content: currentTab.editor.value(),
                    filePath: currentTab.filePath
                });
                if (!result.success) {
                    console.warn('Auto-save failed:', result.error);
                }
            } catch (error) {
                console.error('Error during auto-save:', error);
            }
        } else {
            // Versión web - usar localStorage
            localStorage.setItem('notepadmd-autosave', currentTab.editor.value());
        }
    }

    // Start auto-save when a file is opened
    document.getElementById("openFileButton").addEventListener("click", async function() {
        if (!window.showOpenFilePicker) {
            alert("El API File System Access no está soportado en este navegador.");
            return;
        }
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: "Markdown Files",
                    accept: { "text/markdown": [".md", ".markdown"] }
                }]
            });
            const file = await fileHandle.getFile();
            const text = await file.text();
            easyMDE.value(text);
            currentFileHandle = fileHandle;
            if (isAutoSaveEnabled) {
                setupAutoSave(); // Only start auto-save if enabled
            }
        } catch (err) {
            console.error("Error al abrir el archivo:", err);
        }
    });

    // Handle dropped files with auto-save
    const dropZone = document.body;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '#e1e1e1';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '#ccc';
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '#ccc';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endswith('.md') || file.name.toLowerCase().endswith('.markdown')) {
                try {
                    const result = await window.electron.ipcRenderer.invoke('file-dropped', file.path);
                    if (result.success) {
                        easyMDE.value(result.content);
                        currentFileHandle = null;
                        if (isAutoSaveEnabled) {
                            setupAutoSave(); // Only start auto-save if enabled
                        }
                    } else {
                        alert('Error reading file: ' + result.error);
                    }
                } catch (error) {
                    alert('Error processing file: ' + error.message);
                }
            } else {
                alert('Please drop a Markdown file (.md or .markdown)');
            }
        }
    });

    // Clean up auto-save timers when the window is closed
    window.addEventListener('beforeunload', () => {
        clearInterval(autoSaveTimer);
        clearTimeout(idleTimer);
    });

    // Función para exportar como HTML
    document.getElementById("exportHTMLButton").addEventListener("click", async function() {
        const converter = new showdown.Converter({
            tables: true,
            tasklists: true,
            strikethrough: true,
            parseImgDimensions: true,
            simplifiedAutoLink: true,
            ghCompatibleHeaderId: true,
            extensions: ['tables']
        });
        converter.setFlavor('github');
        const markdownText = easyMDE.value();
        const htmlContent = converter.makeHtml(markdownText);
        
        const fullHtml = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Exported Document</title>
            <style>
                body { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, system-ui, sans-serif; }
                img { max-width: 100%; }
                code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
                table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                tr:nth-child(even) { background-color: #f8f8f8; }
                @media print {
                    table { page-break-inside: avoid; }
                    tr { page-break-inside: avoid; }
                    td { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>`;

        if (window.electron) {
            // Versión Electron
            try {
                const result = await window.electron.ipcRenderer.invoke('export-html', fullHtml);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error al exportar HTML:', error);
                alert('Error al exportar HTML: ' + error.message);
            }
        } else {
            // Versión web
            const blob = new Blob([fullHtml], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "document.html";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    // Función para exportar como PDF
    document.getElementById("exportPDFButton").addEventListener("click", async function() {
        const markdownText = easyMDE.value();
        const converter = new showdown.Converter({
            tables: true,
            tasklists: true,
            strikethrough: true,
            parseImgDimensions: true,
            simplifiedAutoLink: true,
            ghCompatibleHeaderId: true,
            extensions: ['tables']
        });
        converter.setFlavor('github');
        const htmlContent = converter.makeHtml(markdownText);

        // Contenido HTML para impresión
        const printContent = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        body {
                            margin: 0;
                            padding: 2cm;
                            font-family: -apple-system, system-ui, sans-serif;
                            font-size: 12pt;
                        }
                        
                        @page {
                            size: A4;
                            margin: 0;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            break-inside: auto;
                            margin: 1em 0;
                        }
                        
                        thead {
                            display: table-header-group;
                        }
                        
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        
                        td, th {
                            border: 1px solid #000;
                            padding: 8px;
                            text-align: left;
                            font-size: 11pt;
                            page-break-inside: avoid;
                        }
                        
                        th {
                            background-color: #f0f0f0 !important;
                            -webkit-print-color-adjust: exact;
                        }

                        tr:nth-child(even) {
                            background-color: #f9f9f9 !important;
                            -webkit-print-color-adjust: exact;
                        }

                        img { max-width: 100%; }
                        pre, code {
                            background-color: #f5f5f5 !important;
                            -webkit-print-color-adjust: exact;
                            padding: 2px 5px;
                            border-radius: 3px;
                            font-family: monospace;
                        }
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>`;

        if (window.electron) {
            // Versión Electron
            try {
                const result = await window.electron.ipcRenderer.invoke('export-pdf');
                if (!result.success) {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error al exportar PDF:', error);
                alert('Error al exportar PDF: ' + error.message);
            }
        } else {
            // Versión web - Usar el diálogo de impresión del navegador
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            iframe.contentDocument.write(printContent);
            iframe.contentDocument.close();

            // Esperar a que las imágenes se carguen
            const loadPromises = Array.from(iframe.contentDocument.images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });

            Promise.all(loadPromises).then(() => {
                setTimeout(() => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } catch (error) {
                        console.error('Error al imprimir:', error);
                        alert('Error al imprimir: ' + error.message);
                    } finally {
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                        }, 500);
                    }
                }, 500);
            });
        }
    });

    let currentFileHandle = null; // almacena el file handle del archivo abierto
    let currentFilePath = null; // Para mantener la ruta del archivo actual

    // Modifica el botón de descarga/guardado
    document.getElementById("downloadButton").addEventListener("click", async function() {
        const markdownText = easyMDE.value();
        if (window.electron) {
            try {
                const currentTab = tabSystem.getCurrentTab();
                if (!currentTab) return;

                const result = await window.electron.ipcRenderer.invoke('save-file', {
                    content: currentTab.editor.value(),
                    filePath: currentTab.filePath
                });
                
                if (result.success) {
                    currentTab.filePath = result.filePath;
                    currentTab.title = result.filePath.split(/[\\/]/).pop();
                    
                    // Actualizar el título de la pestaña
                    const tabElement = document.querySelector(`.tab[data-tab-id="${currentTab.id}"] .tab-title`);
                    if (tabElement) {
                        tabElement.textContent = currentTab.title;
                    }
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                console.error("Error al guardar el archivo:", err);
                alert("Error al guardar el archivo: " + err.message);
            }
        } else {
            // Fallback para la versión web
            const blob = new Blob([markdownText], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "download.md";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    // Actualiza el botón de abrir archivo
    document.getElementById("openFileButton").addEventListener("click", async function() {
        if (window.electron) {
            try {
                const result = await window.electron.ipcRenderer.invoke('open-file');
                if (result.success) {
                    const currentTab = tabSystem.getCurrentTab();
                    if (currentTab) {
                        currentTab.content = result.content;
                        currentTab.filePath = result.filePath;
                        currentTab.title = result.filePath.split(/[\\/]/).pop();
                        currentTab.editor.value(result.content);
                        
                        // Actualizar el título de la pestaña
                        const tabElement = document.querySelector(`.tab[data-tab-id="${currentTab.id}"] .tab-title`);
                        if (tabElement) {
                            tabElement.textContent = currentTab.title;
                        }
                    }
                    if (isAutoSaveEnabled) {
                        setupAutoSave();
                    }
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                console.error("Error al abrir el archivo:", err);
                alert("Error al abrir el archivo: " + err.message);
            }
        } else {
            // Código existente para la versión web...
        }
    });

    // Keyboard shortcut handlers
    window.electron.ipcRenderer.on('menu-open', () => {
        document.getElementById('openFileButton').click();
    });

    window.electron.ipcRenderer.on('menu-save', () => {
        document.getElementById('downloadButton').click();
    });

    window.electron.ipcRenderer.on('menu-export-html', () => {
        const currentTab = tabSystem.getCurrentTab();
        if (currentTab) {
            const converter = new showdown.Converter({
                tables: true,
                tasklists: true,
                strikethrough: true,
                parseImgDimensions: true,
                simplifiedAutoLink: true,
                ghCompatibleHeaderId: true,
                extensions: ['tables']
            });
            const htmlContent = converter.makeHtml(currentTab.editor.value());
            // ... resto del código de exportación HTML
        }
    });

    window.electron.ipcRenderer.on('menu-export-pdf', () => {
        const currentTab = tabSystem.getCurrentTab();
        if (currentTab) {
            // ... código de exportación PDF usando currentTab.editor.value()
        }
    });

    window.electron.ipcRenderer.on('menu-format', (type) => {
        switch (type) {
            case 'bold':
                document.getElementById('boldButton').click();
                break;
            case 'italic':
                document.getElementById('italicButton').click();
                break;
            case 'link':
                document.getElementById('linkButton').click();
                break;
        }
    });

    // Añadir manejador para el modo de vista previa desde el menú
    window.electron.ipcRenderer.on('menu-preview-mode', (mode) => {
        const previewSelect = document.getElementById('previewMode');
        previewSelect.value = mode;
        previewSelect.dispatchEvent(new Event('change'));
    });

    window.electron.ipcRenderer.on('settings-updated', (settings) => {
        currentSettings = { ...currentSettings, ...settings };
        applySettings(currentSettings);
    });

    window.electron.ipcRenderer.on('show-settings', () => {
        showSettingsDialog();
    });

    // Función para aplicar configuraciones
    function applySettings(settings) {
        if (settings.theme) {
            document.body.className = settings.theme;
        }
        if (settings.fontSize) {
            document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
        }
        if (settings.autosaveInterval) {
            AUTO_SAVE_INTERVAL = settings.autosaveInterval;
            if (isAutoSaveEnabled) {
                setupAutoSave(); // Reiniciar auto-guardado con nuevo intervalo
            }
        }
    }

    // Función para mostrar el diálogo de configuración
    function showSettingsDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'settings-dialog';
        dialog.innerHTML = `
            <div class="settings-content">
                <h2>Settings</h2>
                <div class="setting-item">
                    <label>Theme:</label>
                    <select id="themeSelect">
                        <option value="light" ${currentSettings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${currentSettings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Font Size:</label>
                    <input type="number" id="fontSizeInput" value="${currentSettings.fontSize || 14}" min="8" max="32">
                </div>
                <div class="setting-item">
                    <label>Autosave Interval (ms):</label>
                    <input type="number" id="autosaveInput" value="${currentSettings.autosaveInterval || 30000}" min="5000" step="1000">
                </div>
                <div class="setting-actions">
                    <button id="saveSettings">Save</button>
                    <button id="cancelSettings">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById('saveSettings').onclick = async () => {
            const newSettings = {
                theme: document.getElementById('themeSelect').value,
                fontSize: parseInt(document.getElementById('fontSizeInput').value),
                autosaveInterval: parseInt(document.getElementById('autosaveInput').value)
            };

            await window.electron.ipcRenderer.invoke('update-settings', newSettings);
            document.body.removeChild(dialog);
        };

        document.getElementById('cancelSettings').onclick = () => {
            document.body.removeChild(dialog);
        };
    }
});
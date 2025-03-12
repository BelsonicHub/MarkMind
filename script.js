document.addEventListener("DOMContentLoaded", async function() {
    // Inicializar EasyMDE en el textarea #editor
    var easyMDE = new EasyMDE({ element: document.getElementById("editor") });

    // Función para exportar como HTML
    document.getElementById("exportHTMLButton").addEventListener("click", function() {
        const converter = new showdown.Converter();
        const markdownText = easyMDE.value();
        const htmlContent = converter.makeHtml(markdownText);
        
        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Exported Document</title>
            <style>
                body { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, system-ui, sans-serif; }
                img { max-width: 100%; }
                code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>`;

        const blob = new Blob([fullHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Función para exportar como PDF
    document.getElementById("exportPDFButton").addEventListener("click", async function() {
        const markdownText = easyMDE.value();
        const converter = new showdown.Converter();
        const htmlContent = converter.makeHtml(markdownText);

        // Crear un iframe oculto para imprimir
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.contentDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, system-ui, sans-serif; }
                    img { max-width: 100%; }
                    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
                    @media print {
                        body { max-width: none; margin: 0; }
                        @page { margin: 2cm; }
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `);

        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Eliminar el iframe después de un breve delay
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
    });

    let currentFileHandle = null; // almacena el file handle del archivo abierto

    // Modifica el botón de descarga para sobrescribir el archivo si se ha abierto uno
    document.getElementById("downloadButton").addEventListener("click", async function() {
        const markdownText = easyMDE.value();
        if (currentFileHandle) {
            try {
                const writable = await currentFileHandle.createWritable();
                await writable.write(markdownText);
                await writable.close();
                alert("El archivo ha sido sobrescrito.");
            } catch (err) {
                console.error("Error al sobrescribir el archivo:", err);
            }
        } else {
            // Fallback: descarga como nuevo archivo
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

    // Actualiza el botón de abrir archivo usando el File System Access API
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
        } catch (err) {
            console.error("Error al abrir el archivo:", err);
        }
    });
});
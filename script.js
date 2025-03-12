document.addEventListener("DOMContentLoaded", async function() {
    // Initialize EasyMDE editor using the textarea element
    var easyMDE = new EasyMDE({ element: document.getElementById("editor") });
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
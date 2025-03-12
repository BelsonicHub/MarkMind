console.log("script.js loaded");

document.addEventListener("DOMContentLoaded", function() {
    console.debug("DOM fully loaded");

    const editorElement = document.getElementById("editor");
    let easyMDE = null;
    if (editorElement) {
        easyMDE = new EasyMDE({ element: editorElement });
        console.log("EasyMDE initialized");
    } else {
        console.error("Elemento 'editor' no encontrado");
    }

    const openFileButton = document.getElementById("openFileButton");
    if (openFileButton) {
        openFileButton.addEventListener("click", async function() {
            try {
                console.debug("Invocando el selector de archivos");
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: "Markdown Files",
                        accept: { "text/markdown": [".md", ".markdown"] }
                    }],
                    excludeAcceptAllOption: true,
                    multiple: false
                });
                const file = await fileHandle.getFile();
                const content = await file.text();
                console.debug("Archivo leído con éxito");
                if (easyMDE) {
                    easyMDE.value(content);
                } else {
                    editorElement.value = content;
                }
            } catch (error) {
                console.error("Error al abrir el archivo:", error);
            }
        });
    } else {
        console.error("Elemento 'openFileButton' no encontrado");
    }

});
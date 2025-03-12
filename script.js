let fileHandle;
// Asumimos que EasyMDE se inicializa de forma similar a:
var easyMDE = new EasyMDE({ element: document.getElementById('editor') });

// Agregar manejador para abrir archivos Markdown
document.getElementById('openFile').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(event) {
            easyMDE.value(event.target.result);
        };
        reader.readAsText(file);
    }
});

document.getElementById('downloadButton').addEventListener('click', function() {
    // Retrieve Markdown content from the editor
    var content = document.getElementById('editor').value;
    // Create a Blob with the content
    var blob = new Blob([content], { type: 'text/markdown' });
    // Generate a URL for the Blob
    var url = URL.createObjectURL(blob);
    // Create a temporary anchor element and set the download filename
    var a = document.createElement('a');
    a.href = url;
    a.download = 'download.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Función para abrir el archivo usando la File System Access API
async function openFile() {
    try {
        // Muestra el selector nativo y obtiene el handle del archivo
        const [handle] = await window.showOpenFilePicker({
            types: [{
                description: 'Archivos Markdown',
                accept: { 'text/markdown': ['.md'] }
            }]
        });
        fileHandle = handle;
        const file = await handle.getFile();
        const text = await file.text();
        document.getElementById('editor').value = text;
        // Si implementas previsualización, la actualizas acá
        // updatePreview();
    } catch (err) {
        console.error(err);
    }
}

// Función para guardar (actualizar) el archivo seleccionado
async function saveFile() {
    try {
        if (fileHandle) {
            const writable = await fileHandle.createWritable();
            await writable.write(document.getElementById('editor').value);
            await writable.close();
            alert("Archivo actualizado exitosamente.");
        } else {
            alert("Primero debes abrir un archivo.");
        }
    } catch (err) {
        console.error(err);
    }
}

// Asignar la acción de abrir archivo a un botón (o elemento)
document.getElementById('openFile').addEventListener('click', (e) => {
    e.preventDefault();
    openFile();
});

// Asignar la acción de guardar archivo al botón de descarga (ahora se actualiza el archivo)
document.getElementById('downloadButton').addEventListener('click', (e) => {
    e.preventDefault();
    saveFile();
});
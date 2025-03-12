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

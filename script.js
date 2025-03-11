document.addEventListener('DOMContentLoaded', () => {
  const easyMDE = new EasyMDE({ 
      element: document.getElementById("editor"),
      initialValue: "# Hola Mundo\n\nEscribe **Markdown** y verás la previsualización en tiempo real.",
      autoDownloadFontAwesome: false,
      spellChecker: false
  });
  
  // Funcionalidad para descargar el contenido Markdown
  const downloadButton = document.getElementById("downloadButton");
  downloadButton.addEventListener('click', () => {
    const markdownText = easyMDE.value();
    const blob = new Blob([markdownText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contenido.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // Funcionalidad para modo oscuro
  const toggleDarkMode = document.getElementById("toggleDarkMode");
  toggleDarkMode.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
});

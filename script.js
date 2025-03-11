document.addEventListener('DOMContentLoaded', () => {
  var easyMDE = new EasyMDE({ element: document.getElementById("editor") });

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

  // Listener para alternar la visualización de la barra de herramientas (símbolos Markdown)
  document.getElementById("toggleMarkdownSymbols").addEventListener("click", function(){
    const toolbar = document.querySelector(".editor-toolbar");
    if(toolbar) {
      toolbar.style.display = (toolbar.style.display === "none") ? "" : "none";
    }
  });
});

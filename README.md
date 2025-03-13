# NotepadMD
Here are some of the key-features:
## File System API
The File System API (or more specifically the File System Access API) is designed to allow direct reading, writing and management of files on the user's system, but its support varies by browser. In Chromium-based browsers (such as the latest versions of Chrome, Edge and Opera) it is fully implemented.

In contrast, in browsers such as Firefox and Safari (both desktop and mobile versions) the functionality is very limited or absent, meaning that operations such as overwriting existing files or accessing the file system natively are not available or are simulated by downloads. In addition, some mobile browsers (e.g. Chrome for Android or Samsung Internet) do not offer full support either.

This difference in implementation is the reason why, in web applications, progressive enhancement techniques or libraries such as browser-fs-access are often used to provide a functional experience, adapting to the capabilities of the user's browser.
# Electron version
The electron version has additional features to the web version:
- Auto-Save
- Offline-Mode

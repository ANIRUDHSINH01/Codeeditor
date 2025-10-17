document.addEventListener("DOMContentLoaded", function() {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        const editor = monaco.editor.create(document.getElementById('editor'), {
            theme: 'vs-dark',
            automaticLayout: true
        });

        const openFolderBtn = document.getElementById('open-folder-btn');
        let directoryHandle = null;

        const fileTreeContainer = document.getElementById('file-tree');
        const fileHandles = new Map();
        let fileIdCounter = 0;

        async function buildFileTree(dirHandle, parentList) {
            for await (const entry of dirHandle.values()) {
                const listItem = document.createElement('li');
                listItem.textContent = entry.name;
                if (entry.kind === 'directory') {
                    listItem.classList.add('folder');
                    const nestedList = document.createElement('ul');
                    nestedList.style.display = 'none'; // Initially collapsed
                    listItem.appendChild(nestedList);
                    listItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        nestedList.style.display = nestedList.style.display === 'none' ? 'block' : 'none';
                    });
                    await buildFileTree(entry, nestedList);
                } else {
                    const fileId = `file-${fileIdCounter++}`;
                    listItem.classList.add('file');
                    listItem.dataset.fileId = fileId;
                    fileHandles.set(fileId, entry);
                }
                parentList.appendChild(listItem);
            }
        }

        openFolderBtn.addEventListener('click', async () => {
            try {
                directoryHandle = await window.showDirectoryPicker();
                if (directoryHandle) {
                    fileTreeContainer.innerHTML = '';
                    fileHandles.clear();
                    const rootList = document.createElement('ul');
                    fileTreeContainer.appendChild(rootList);
                    await buildFileTree(directoryHandle, rootList);
                }
            } catch (err) {
                console.error('Error opening directory:', err);
            }
        });

        fileTreeContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('file')) {
                const fileId = e.target.dataset.fileId;
                const fileHandle = fileHandles.get(fileId);
                if (fileHandle) {
                    const file = await fileHandle.getFile();
                    const content = await file.text();
                    const language = getLanguageFromExtension(file.name);
                    editor.setValue(content);
                    monaco.editor.setModelLanguage(editor.getModel(), language);
                }
            }
        });

        function getLanguageFromExtension(fileName) {
            const extension = fileName.split('.').pop();
            switch (extension) {
                case 'js':
                    return 'javascript';
                case 'py':
                    return 'python';
                case 'html':
                    return 'html';
                case 'css':
                    return 'css';
                case 'md':
                    return 'markdown';
                default:
                    return 'plaintext';
            }
        }
    });
});
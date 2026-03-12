const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    saveResult: (data, format) => ipcRenderer.invoke('save-result', { data, format }),
    onMenuEvent: (callback) => {
        ipcRenderer.on('import-csv', () => callback('import-csv'));
        ipcRenderer.on('parse-web', () => callback('parse-web'));
        ipcRenderer.on('parse-file', () => callback('parse-file'));
        ipcRenderer.on('export-data', () => callback('export-data'));
        ipcRenderer.on('show-message', (_, message) => callback('show-message', message));
    },
    sendMessage: (message) => ipcRenderer.send('show-message', message),
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
    writeFile: (path, data) => ipcRenderer.invoke('write-file', { path, data }),
    // Основные методы парсинга
    parseHTML: (url, selector) => ipcRenderer.invoke('parse-html', { url, selector }),
    parseDynamicHTML: (url, selector) => ipcRenderer.invoke('parse-dynamic-html', { url, selector }),
    parseAPI: (url, options) => ipcRenderer.invoke('parse-api', { url, options }),
    parseJSON: (url) => ipcRenderer.invoke('parse-json', url),
    parseXML: (url) => ipcRenderer.invoke('parse-xml', url),
    parseCSV: (url) => ipcRenderer.invoke('parse-csv', url),
    parseExcel: (url) => ipcRenderer.invoke('parse-excel', url),
    parseMarkdown: (url) => ipcRenderer.invoke('parse-markdown', url),
    parseText: (url) => ipcRenderer.invoke('parse-text', url),
    parsePDF: (url) => ipcRenderer.invoke('parse-pdf', url),
    parseImage: (url) => ipcRenderer.invoke('parse-image', url),
    parseAudio: (url) => ipcRenderer.invoke('parse-audio', url),
    parseVideo: (url) => ipcRenderer.invoke('parse-video', url),
    parseArchive: (url) => ipcRenderer.invoke('parse-archive', url),
    // Методы для работы с контентом
    parseHTMLContent: (url, selector) => ipcRenderer.invoke('parse-html-content', { url, selector }),
    parseDynamicHTMLContent: (url, selector) => ipcRenderer.invoke('parse-dynamic-html-content', { url, selector }),
    parseAPIContent: (url, options) => ipcRenderer.invoke('parse-api-content', { url, options }),
    parseJSONContent: (url) => ipcRenderer.invoke('parse-json-content', url),
    parseXMLContent: (url) => ipcRenderer.invoke('parse-xml-content', url),
    parseCSVContent: (url) => ipcRenderer.invoke('parse-csv-content', url),
    parseExcelContent: (url) => ipcRenderer.invoke('parse-excel-content', url),
    parseMarkdownContent: (url) => ipcRenderer.invoke('parse-markdown-content', url),
    parseTextContent: (url) => ipcRenderer.invoke('parse-text-content', url),
    parsePDFContent: (url) => ipcRenderer.invoke('parse-pdf-content', url),
    parseImageContent: (url) => ipcRenderer.invoke('parse-image-content', url),
    parseAudioContent: (url) => ipcRenderer.invoke('parse-audio-content', url),
    parseVideoContent: (url) => ipcRenderer.invoke('parse-video-content', url),
    parseArchiveContent: (url) => ipcRenderer.invoke('parse-archive-content', url),
    // Методы для парсинга из файлов
    parseHTMLFromFile: (filePath, selector) => ipcRenderer.invoke('parse-html-from-file', { filePath, selector }),
    parseDynamicHTMLFromFile: (filePath, selector) => ipcRenderer.invoke('parse-dynamic-html-from-file', { filePath, selector }),
    parseAPIFromFile: (filePath, options) => ipcRenderer.invoke('parse-api-from-file', { filePath, options }),
    parseJSONFromFile: (filePath) => ipcRenderer.invoke('parse-json-from-file', filePath),
    parseXMLFromFile: (filePath) => ipcRenderer.invoke('parse-xml-from-file', filePath),
    parseCSVFromFile: (filePath) => ipcRenderer.invoke('parse-csv-from-file', filePath),
    parseExcelFromFile: (filePath) => ipcRenderer.invoke('parse-excel-from-file', filePath),
    parseMarkdownFromFile: (filePath) => ipcRenderer.invoke('parse-markdown-from-file', filePath),
    parseTextFromFile: (filePath) => ipcRenderer.invoke('parse-text-from-file', filePath),
    parsePDFFromFile: (filePath) => ipcRenderer.invoke('parse-pdf-from-file', filePath),
    parseImageFromFile: (filePath) => ipcRenderer.invoke('parse-image-from-file', filePath),
    parseAudioFromFile: (filePath) => ipcRenderer.invoke('parse-audio-from-file', filePath),
    parseVideoFromFile: (filePath) => ipcRenderer.invoke('parse-video-from-file', filePath),
    parseArchiveFromFile: (filePath) => ipcRenderer.invoke('parse-archive-from-file', filePath)
});
export {};

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path: any) => ipcRenderer.invoke('read-file', path),
  saveResult: (data: any, format: any) => ipcRenderer.invoke('save-result', {data, format}),
  
  onMenuEvent: (callback: (event: string, message?: any) => void) => {
    ipcRenderer.on('import-csv', () => callback('import-csv'));
    ipcRenderer.on('parse-web', () => callback('parse-web'));
    ipcRenderer.on('parse-file', () => callback('parse-file'));
    ipcRenderer.on('export-data', () => callback('export-data'));
    ipcRenderer.on('show-message', (_: any, message: any) => callback('show-message', message));
  },
  
  sendMessage: (message: any) => ipcRenderer.send('show-message', message),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (data: any) => ipcRenderer.invoke('dialog:saveFile', data),
  writeFile: (path: any, data: any) => ipcRenderer.invoke('write-file', { path, data }),
  
  // Основные методы парсинга
  parseHTML: (url: any, selector: any) => ipcRenderer.invoke('parse-html', { url, selector }),
  parseDynamicHTML: (url: any, selector: any) => ipcRenderer.invoke('parse-dynamic-html', { url, selector }),
  parseAPI: (url: any, options: any) => ipcRenderer.invoke('parse-api', { url, options }),
  parseJSON: (url: any) => ipcRenderer.invoke('parse-json', url),
  parseXML: (url: any) => ipcRenderer.invoke('parse-xml', url),
  parseCSV: (url: any) => ipcRenderer.invoke('parse-csv', url),
  parseExcel: (url: any) => ipcRenderer.invoke('parse-excel', url),
  parseMarkdown: (url: any) => ipcRenderer.invoke('parse-markdown', url),
  parseText: (url: any) => ipcRenderer.invoke('parse-text', url),
  parsePDF: (url: any) => ipcRenderer.invoke('parse-pdf', url),
  parseImage: (url: any) => ipcRenderer.invoke('parse-image', url),
  parseAudio: (url: any) => ipcRenderer.invoke('parse-audio', url),
  parseVideo: (url: any) => ipcRenderer.invoke('parse-video', url),
  parseArchive: (url: any) => ipcRenderer.invoke('parse-archive', url),
  
  // Методы для работы с контентом
  parseHTMLContent: (url: any, selector: any) => ipcRenderer.invoke('parse-html-content', { url, selector }),
  parseDynamicHTMLContent: (url: any, selector: any) => ipcRenderer.invoke('parse-dynamic-html-content', { url, selector }),
  parseAPIContent: (url: any, options: any) => ipcRenderer.invoke('parse-api-content', { url, options }),
  parseJSONContent: (url: any) => ipcRenderer.invoke('parse-json-content', url),
  parseXMLContent: (url: any) => ipcRenderer.invoke('parse-xml-content', url),
  parseCSVContent: (url: any) => ipcRenderer.invoke('parse-csv-content', url),
  parseExcelContent: (url: any) => ipcRenderer.invoke('parse-excel-content', url),
  parseMarkdownContent: (url: any) => ipcRenderer.invoke('parse-markdown-content', url),
  parseTextContent: (url: any) => ipcRenderer.invoke('parse-text-content', url),
  parsePDFContent: (url: any) => ipcRenderer.invoke('parse-pdf-content', url),
  parseImageContent: (url: any) => ipcRenderer.invoke('parse-image-content', url),
  parseAudioContent: (url: any) => ipcRenderer.invoke('parse-audio-content', url),
  parseVideoContent: (url: any) => ipcRenderer.invoke('parse-video-content', url),
  parseArchiveContent: (url: any) => ipcRenderer.invoke('parse-archive-content', url),
  
  // Методы для парсинга из файлов
  parseHTMLFromFile: (filePath: any, selector: any) => ipcRenderer.invoke('parse-html-from-file', { filePath, selector }),
  parseDynamicHTMLFromFile: (filePath: any, selector: any) => ipcRenderer.invoke('parse-dynamic-html-from-file', { filePath, selector }),
  parseAPIFromFile: (filePath: any, options: any) => ipcRenderer.invoke('parse-api-from-file', { filePath, options }),
  parseJSONFromFile: (filePath: any) => ipcRenderer.invoke('parse-json-from-file', filePath),
  parseXMLFromFile: (filePath: any) => ipcRenderer.invoke('parse-xml-from-file', filePath),
  parseCSVFromFile: (filePath: any) => ipcRenderer.invoke('parse-csv-from-file', filePath),
  parseExcelFromFile: (filePath: any) => ipcRenderer.invoke('parse-excel-from-file', filePath),
  parseMarkdownFromFile: (filePath: any) => ipcRenderer.invoke('parse-markdown-from-file', filePath),
  parseTextFromFile: (filePath: any) => ipcRenderer.invoke('parse-text-from-file', filePath),
  parsePDFFromFile: (filePath: any) => ipcRenderer.invoke('parse-pdf-from-file', filePath),
  parseImageFromFile: (filePath: any) => ipcRenderer.invoke('parse-image-from-file', filePath),
  parseAudioFromFile: (filePath: any) => ipcRenderer.invoke('parse-audio-from-file', filePath),
  parseVideoFromFile: (filePath: any) => ipcRenderer.invoke('parse-video-from-file', filePath),
  parseArchiveFromFile: (filePath: any) => ipcRenderer.invoke('parse-archive-from-file', filePath)
});
const express = require('express');
const path = require('path');
const { fileURLToPath } = require('url');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { contextBridge, ipcRenderer } = require('electron');
const app = express();
const PORT = 33369;
const server = express();
// Настройка сервера Express
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Раздача статических файлов из папки Parsing
app.use(express.static(path.join(__dirname, 'Parsing')));
// Раздача статических файлов из папки Parsing/src/renderer
app.use('/renderer', express.static(path.join(__dirname, 'Parsing/src/renderer')));
// Раздача статических файлов из папки Parsing/src/main
app.use('/main', express.static(path.join(__dirname, 'Parsing/src/main')));
// Раздача статических файлов из папки Parsing/src/main/preload
app.use('/preload', express.static(path.join(__dirname, 'Parsing/src/main/preload')));
// Раздача статических файлов из папки Parsing/src/main/preload/index.js
app.use('/preload/index.js', express.static(path.join(__dirname, 'Parsing/src/main/preload/index.js')));
// Раздача статических файлов из папки Parsing/src/renderer/MyApp
app.use('/MyApp', express.static(path.join(__dirname, 'Parsing/src/renderer/MyApp')));
// Раздача статических файлов из папки Parsing/src/renderer/icons.tsx
app.use('/icons', express.static(path.join(__dirname, 'Parsing/src/renderer/icons.tsx')));
// Раздача статических файлов из папки Parsing/src/index.css
app.use('/index.css', express.static(path.join(__dirname, 'Parsing/src/index.css')));
// Раздача статических файлов из папки Parsing/src/main.tsx
app.use('/main.tsx', express.static(path.join(__dirname, 'Parsing/src/main.tsx')));
// Раздача статических файлов из папки Parsing/src/renderer/electron.d.ts
app.use('/electron.d.ts', express.static(path.join(__dirname, 'Parsing/src/renderer/electron.d.ts')));
// Раздача статических файлов из папки Parsing/src/renderer/MyApp/MyApp.tsx
app.use('/MyApp/MyApp.tsx', express.static(path.join(__dirname, 'Parsing/src/renderer/MyApp/MyApp.tsx')));
// Раздача статических файлов из папки Parsing/src/renderer/icons.tsx
app.use('/icons.tsx', express.static(path.join(__dirname, 'Parsing/src/renderer/icons.tsx')));

app.listen(33369, () => {
  console.log('Сервер запущен на порту 33369');
});
contextBridge.exposeInMainWorld('myAPI', {
  loadPreferences: () => ipcRenderer.invoke('load-prefs')
});
contextBridge.exposeInMainWorld('electronAPI', {
  showMessage: (message) => ipcRenderer.send('show-message', message),
  platform: process.platform,
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  readFile: (filePath) => ipcRenderer.invoke('dialog:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('dialog:writeFile', filePath, data),
  parseHTML: (url, selector) => ipcRenderer.invoke('parseHTML', url, selector),
  parseDynamicHTML: (url, selector) => ipcRenderer.invoke('parseDynamicHTML', url, selector),
  parseAPI: (url, options) => ipcRenderer.invoke('parseAPI', url, options),
  parseJSON: (url) => ipcRenderer.invoke('parseJSON', url),
  parseXML: (url) => ipcRenderer.invoke('parseXML', url),
  parseCSV: (url) => ipcRenderer.invoke('parseCSV', url),
  parseExcel: (url) => ipcRenderer.invoke('parseExcel', url),
  parseMarkdown: (url) => ipcRenderer.invoke('parseMarkdown', url),
  parseText: (url) => ipcRenderer.invoke('parseText', url),
  parsePDF: (url) => ipcRenderer.invoke('parsePDF', url),
  parseImage: (url) => ipcRenderer.invoke('parseImage', url),
  parseAudio: (url) => ipcRenderer.invoke('parseAudio', url),
  parseVideo: (url) => ipcRenderer.invoke('parseVideo', url),
  parseArchive: (url) => ipcRenderer.invoke('parseArchive', url),
  parseHTMLContent: (url, selector) => ipcRenderer.invoke('parseHTMLContent', url, selector),
  parseDynamicHTMLContent: (url, selector) => ipcRenderer.invoke('parseDynamicHTMLContent', url, selector),
  parseAPIContent: (url, options) => ipcRenderer.invoke('parseAPIContent', url, options),
  parseJSONContent: (url) => ipcRenderer.invoke('parseJSONContent', url),
  parseXMLContent: (url) => ipcRenderer.invoke('parseXMLContent', url),
  parseCSVContent: (url) => ipcRenderer.invoke('parseCSVContent', url),
  parseExcelContent: (url) => ipcRenderer.invoke('parseExcelContent', url),
  parseMarkdownContent: (url) => ipcRenderer.invoke('parseMarkdownContent', url),
  parseTextContent: (url) => ipcRenderer.invoke('parseTextContent', url),
  parsePDFContent: (url) => ipcRenderer.invoke('parsePDFContent', url),
  parseImageContent: (url) => ipcRenderer.invoke('parseImageContent', url),
  parseAudioContent: (url) => ipcRenderer.invoke('parseAudioContent', url),
  parseVideoContent: (url) => ipcRenderer.invoke('parseVideoContent', url),
  parseArchiveContent: (url) => ipcRenderer.invoke('parseArchiveContent', url),
  parseHTMLFromFile: (filePath, selector) => ipcRenderer.invoke('parseHTMLFromFile', filePath, selector),
  parseDynamicHTMLFromFile: (filePath, selector) => ipcRenderer.invoke('parseDynamicHTMLFromFile', filePath, selector),
  parseAPIFromFile: (filePath, options) => ipcRenderer.invoke('parseAPIFromFile', filePath, options),
  parseJSONFromFile: (filePath) => ipcRenderer.invoke('parseJSONFromFile', filePath),
  parseXMLFromFile: (filePath) => ipcRenderer.invoke('parseXMLFromFile', filePath),
  parseCSVFromFile: (filePath) => ipcRenderer.invoke('parseCSVFromFile', filePath),
  parseExcelFromFile: (filePath) => ipcRenderer.invoke('parseExcelFromFile', filePath),
  parseMarkdownFromFile: (filePath) => ipcRenderer.invoke('parseMarkdownFromFile', filePath),
  parseTextFromFile: (filePath) => ipcRenderer.invoke('parseTextFromFile', filePath),
  parsePDFFromFile: (filePath) => ipcRenderer.invoke('parsePDFFromFile', filePath),
  parseImageFromFile: (filePath) => ipcRenderer.invoke('parseImageFromFile', filePath),
  parseAudioFromFile: (filePath) => ipcRenderer.invoke('parseAudioFromFile', filePath),
  parseVideoFromFile: (filePath) => ipcRenderer.invoke('parseVideoFromFile', filePath),
  parseArchiveFromFile: (filePath) => ipcRenderer.invoke('parseArchiveFromFile', filePath),
  parseHTMLContentFromFile: (filePath, selector) => ipcRenderer.invoke('parseHTMLContentFromFile', filePath, selector),
  parseDynamicHTMLContentFromFile: (filePath, selector) => ipcRenderer.invoke('parseDynamicHTMLContentFromFile', filePath, selector),
  parseAPIContentFromFile: (filePath, options) => ipcRenderer.invoke('parseAPIContentFromFile', filePath, options),
  parseJSONContentFromFile: (filePath) => ipcRenderer.invoke('parseJSONContentFromFile', filePath),
  parseXMLContentFromFile: (filePath) => ipcRenderer.invoke('parseXMLContentFromFile', filePath),
  parseCSVContentFromFile: (filePath) => ipcRenderer.invoke('parseCSVContentFromFile', filePath),
  parseExcelContentFromFile: (filePath) => ipcRenderer.invoke('parseExcelContentFromFile', filePath),
  parseMarkdownContentFromFile: (filePath) => ipcRenderer.invoke('parseMarkdownContentFromFile', filePath),
  parseTextContentFromFile: (filePath) => ipcRenderer.invoke('parseTextContentFromFile', filePath)
});
"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Существующие методы для парсинга HTML
  parseHTML: (url, selector) => new Promise((resolve, reject) => {
    electron.ipcRenderer.once("parse:html:response", (_, result) => {
      result.success ? resolve(result.data) : reject(result.error);
    });
    electron.ipcRenderer.send("parse:html", url, selector);
  }),
  parseDynamic: (url, selector) => new Promise((resolve, reject) => {
    electron.ipcRenderer.once("parse:dynamic:response", (_, result) => {
      result.success ? resolve(result.data) : reject(result.error);
    });
    electron.ipcRenderer.send("parse:dynamic", url, selector);
  }),
  // Новый метод для парсинга данных
  parseData: (config) => new Promise((resolve, reject) => {
    electron.ipcRenderer.once("parse:data:response", (_, response) => {
      if (response.success && response.result) {
        resolve(response.result);
      } else {
        reject(response.error || "Unknown error");
      }
    });
    electron.ipcRenderer.send("parse:data", config);
  })
});

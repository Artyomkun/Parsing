"use strict";
const electron = require("electron");
const path = require("path");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:39143");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.ipcMain.handle("parse:data", async (_, config) => {
  try {
    const result = await handleParse(config);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
electron.ipcMain.on("parse:html", async (event, url, selector) => {
  try {
    const result = await parseHtmlContent(url, selector);
    event.sender.send("parse:html:response", { success: true, data: result });
  } catch (error) {
    event.sender.send("parse:html:response", {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse HTML"
    });
  }
});
electron.ipcMain.on("parse:dynamic", async (event, url, selector) => {
  try {
    const result = await parseDynamicContent(url, selector);
    event.sender.send("parse:dynamic:response", { success: true, data: result });
  } catch (error) {
    event.sender.send("parse:dynamic:response", {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse dynamic content"
    });
  }
});
function handleParse(config) {
  throw new Error("Function not implemented.");
}
function parseHtmlContent(url, selector) {
  throw new Error("Function not implemented.");
}
function parseDynamicContent(url, selector) {
  throw new Error("Function not implemented.");
}

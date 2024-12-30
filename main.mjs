import Store from "electron-store";
import path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import fs from "fs"; // Correct way to import fs in ES modules
const store = new Store();

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadURL("http://localhost:3000"); // React app URL
  win.on("closed", () => (win = null));
  //   //For Production
  //   console.log("process.env.NODE_ENV", process.env.NODE_ENV);
  //   if (process.env.NODE_ENV === "development") {
  //     win.loadURL("http://localhost:3000"); // URL of React app
  //   } else {
  //     // Load React build for production
  //     win.loadFile(path.join(__dirname, "build", "index.html"));
  //     win.webContents.openDevTools();
  //   }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle("save-data", async (_, fileName, data, fileDate) => {
  try {
    const currData = store.get("userData", { files: [] });
    if (!Array.isArray(currData.files)) {
      currData.files = [];
    }
    const existingFileIndex = currData.files.findIndex(
      (file) => file.fileName === fileName
    );
    if (existingFileIndex !== -1) {
      currData.files[existingFileIndex].data = data;
      currData.files[existingFileIndex].fileDate = fileDate;
    } else {
      currData.files.push({ fileName, data, fileDate });
    }
    store.set("userData", currData);

    // Emit an event to notify about the data update
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("refresh-data", currData);
    });

    return { success: true, message: "Data saved successfully" };
  } catch (error) {
    console.error("Error in save-data handler:", error);
    return { success: false, message: "Failed to save data" };
  }
});

// Handle retrieving data
ipcMain.handle("get-data", async () => {
  const savedData = store.get("userData", { files: [] });
  console.log("Data retrieved:", savedData);
  return savedData;
});

ipcMain.handle("delete-data", async (_, fileName) => {
  try {
    const currData = store.get("userData", { files: [] });
    if (!Array.isArray(currData.files)) {
      currData.files = [];
    }
    const fileIndex = currData.files.findIndex(
      (file) => file.fileName === fileName
    );
    if (fileIndex !== -1) {
      // Remove the file from the array
      currData.files.splice(fileIndex, 1);
    }
    setImmediate(() => {
      store.set("userData", currData);
    });
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete file" };
  }
});

ipcMain.handle("clear-data", async () => {
  try {
    store.clear(); // Clears all data stored in electron-store
    console.log("Data cleared");
  } catch (error) {
    console.error("Error clearing data:", error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

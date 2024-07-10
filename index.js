import { app, BrowserWindow } from "electron";
import server from "./src/server.js";

// Start the server
server.start();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    name: "Umbra MP3 Player",
    icon: './public/assets/imgs/main.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL("http://localhost:8080");
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  // Handle window resize
  mainWindow.on("resize", function () {
    let [x, y] = mainWindow.getSize();
    mainWindow.setSize(x, y);
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

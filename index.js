import { app, BrowserWindow } from "electron";
import server from "./src/server.js";
import DiscordRPC from 'discord-rpc';

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

const clientId = '1260399266510405745';

// Only needed if you want to use spectate, join, or ask to join
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity() {
  if (!rpc || !mainWindow) {
    return;
  }

  // You'll need to have snek_large and snek_small assets uploaded to
  // https://discord.com/developers/applications/<application_id>/rich-presence/assets
  rpc.setActivity({
    details: `Vibing to Music`,
    state: 'Listening to Music',
    startTimestamp,
    largeImageKey: 'index',
    largeImageText: 'Umbra',
    smallImageText: 'Umbra',
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity();

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login({ clientId }).catch(console.error);
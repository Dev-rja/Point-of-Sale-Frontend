// electron.js
const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    // 💻 DEV: run `npm run dev` and `npm run start:desktop`
    win.loadURL("http://localhost:3000");
    // win.webContents.openDevTools();
  } else {
    // 📦 PROD: serve the built React app from /build
    const appPath = app.getAppPath();              // base path in packaged app
    const staticPath = path.join(appPath, "build");

    const expressApp = express();

    // static files (JS, CSS, images)
    expressApp.use(express.static(staticPath));

    // SPA fallback – any route -> index.html
    expressApp.use((_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });

    const server = expressApp.listen(0, () => {
      const port = server.address().port;
      win.loadURL(`http://localhost:${port}`);
         win.webContents.openDevTools(); // enable if you need to debug prod
    });

    win.on("closed", () => {
      server.close();
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

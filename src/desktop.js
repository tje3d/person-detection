const { app, BrowserWindow } = require('electron')

function createWindow() {
  const width = 1600
  const win = new BrowserWindow({
    width: width,
    height: (width / 16) * 9,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.loadURL('http://127.0.0.1:8080')
}

function onReady() {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

app.whenReady().then(onReady)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

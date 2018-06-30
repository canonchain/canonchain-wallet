import { app, BrowserWindow, Menu, dialog } from 'electron'
// import { app, BrowserWindow, Tray, Menu, Notification, clipboard, ipcMain, globalShortcut, dialog } from 'electron'
// const ClientBinaryManager = require('../../modules/clientBinaryManager');

let menu;
// const path          = require('path');
// const url           = require('url');


/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow;// Preserve the global reference of a window object

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const winWidth = process.env.NODE_ENV === 'development' ? (815 + 580) : 815;

app.on('ready', createWindow);// Called when Electron finishes, initializes and prepares to create a browser window. Some APIs can only be used after this event occurs.
app.on('window-all-closed', windowAllClose);// Exit when all windows are closed.
app.on('activate', activateFn);//On OS X, when you click the Dock icon and no other window is open, a window is usually recreated in the application.
app.on('will-quit', quitFn);//当应用程序正在退出时触发。

function createWindow() {
  // Create browser window
  mainWindow = new BrowserWindow({
    width: winWidth,
    height: 600,
    icon: "./static/icons/logo.png",
    title: "CanonChain Wallet",
    resizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    useContentSize: true
  });

  mainWindow.loadURL(winURL);

  // Fired when the window closes
  mainWindow.on('closed', function () {
    /* 
    Unreferences the window object. If your application supports multiple windows, you will usually store the window in an array. Click Close to remove the corresponding element.
    */
    mainWindow = null
    // try {
    //   var currentPid = sessionStorage.getItem("CanonChainPid")
    //   process.kill(currentPid);
    // } catch (err) {

    // }

  })

  createMenu()
}

function windowAllClose() {
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
  // try {
  //   var currentPid = sessionStorage.getItem("CanonChainPid");
  //   process.kill(currentPid);
  // } catch (err) {

  // }
  app.quit()
}
function activateFn() {
  if (mainWindow === null) {
    createWindow()
  }
}

function quitFn(){
  // var wind= new BrowserWindow({
  //   width: 300,
  //   height: 200,
  //   title:"==="+global.czr_pid+"==="
  // });
  // dialog.showMessageBox(wind)
  // try {
  //   var currentPid = sessionStorage.getItem("CanonChainPid")
  //   process.kill(currentPid);
  // } catch (err) {

  // }
}

//Solve the production environment can not use copy and paste
const createMenu = () => {
  if (process.env.NODE_ENV !== 'development') {
    const template = [{
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit()
          }
        }
      ]
    }]
    menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

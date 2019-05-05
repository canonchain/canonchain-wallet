import {app, BrowserWindow, Menu, dialog, ipcMain} from 'electron'
// import { app, BrowserWindow, Tray, Menu, Notification, clipboard, ipcMain, globalShortcut, dialog } from 'electron'
// const ClientBinaryManager = require('../../modules/clientBinaryManager');


let logConfig = require('../log4/log_config.js');
let mainLogs = logConfig.getLogger('main_process');
mainLogs.info("********** 主进程开始 ********** ");


let menu;
// const path          = require('path');
// const url           = require('url');

// czr账号
const Czr = require("czr");
const czr = new Czr();
ipcMain.on('sync', (event, arg) => {
    if (typeof arg === 'string') {
        czr.accounts.create(arg).then(data => {
            event.returnValue = data
        })
    } else {
        event.returnValue = 'Need string type'
    }
})
ipcMain.on('remove_account', (event, file, pwd) => {
    czr.accounts.validate_account(file, pwd).then(data => {
        event.returnValue = data
    }).catch(error => {
        event.returnValue = error.message
    })
})
// czr账号

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow = null;// Preserve the global reference of a window object
const gotTheLock = app.requestSingleInstanceLock()

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

// const winWidth = process.env.NODE_ENV === 'development' ? (815 + 580) : 815;

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }
            mainWindow.focus()
        }
    })

    // Create myWindow, load the rest of the app, etc...
    app.on('ready', createWindow);// Called when Electron finishes, initializes and prepares to create a browser window. Some APIs can only be used after this event occurs.
    app.on('window-all-closed', windowAllClose);// Exit when all windows are closed.
    app.on('activate', activateFn);//On OS X, when you click the Dock icon and no other window is open, a window is usually recreated in the application.
}


function createWindow() {
    // Create browser window
    mainWindow = new BrowserWindow({
        width: 815,
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
    })

    createMenu()
}

// 只开一个实例
// 只开一个实例

function windowAllClose() {
    app.quit()
}

function activateFn() {
    if (mainWindow === null) {
        createWindow()
    }
}

//Solve the production environment can not use copy and paste
const createMenu = () => {
    if (process.env.NODE_ENV !== 'development') {
        const template = [{
            label: 'Edit',
            submenu: [
                {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
                {label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:'},
                {type: 'separator'},
                {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
                {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
                {label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'},
                {label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'},
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


import {autoUpdater} from 'electron-updater'

autoUpdater.on('error', (error) => {
    mainLogs.error('Error: ', error == null ? "unknown" : (error.stack || error).toString());
    // dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('checking-for-update', () => {
    mainLogs.info("开始检测新的钱包程序");
})

autoUpdater.on('update-available', info => {
    mainLogs.info(`有新的钱包程序可用 info:${JSON.stringify(info)}`);
})

autoUpdater.on('update-not-available', info => {
    mainLogs.info(`没有新的钱包程序 info:${JSON.stringify(info)}`);
})

autoUpdater.on('download-progress', ({delta, bytesPerSecond, percent, total, transferred}) => {
    mainLogs.info(`更新下载中...delta: ${delta}，bytesPerSecond: ${bytesPerSecond}，percent: ${percent}，total: ${total}，transferred: ${transferred}`)
})

autoUpdater.on('update-downloaded', info => {
    mainLogs.info(`开始更新钱包程序 info:${JSON.stringify(info)}`);
    setImmediate(() => autoUpdater.quitAndInstall())
})

// autoUpdater.on('update-available', () => {
//     dialog.showMessageBox({
//         type: 'info',
//         title: 'Found Updates',
//         message: 'Found updates, do you want update now?',
//         buttons: ['Sure', 'No']
//     }, (buttonIndex) => {
//         if (buttonIndex === 0) {
//             autoUpdater.downloadUpdate()
//         }
//         else {
//             updater.enabled = true
//             updater = null
//         }
//     })
// })

// autoUpdater.on('update-downloaded', () => {
//     dialog.showMessageBox({
//         title: 'Install Updates',
//         message: 'Updates downloaded, application will be quit for update...'
//     }, () => {
//         setImmediate(() => autoUpdater.quitAndInstall())
//     })
// })

app.on('ready', () => {
    if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})


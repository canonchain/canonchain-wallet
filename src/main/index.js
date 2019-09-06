import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

import { autoUpdater } from "electron-updater";

require("../sentry/index");
// import { app, BrowserWindow, Tray, Menu, Notification, clipboard, ipcMain, globalShortcut, dialog } from 'electron'
// const ClientBinaryManager = require('../../modules/clientBinaryManager');
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const log = require("electron-log");

const Registry = require("winreg");

const logConfig = require("../log4/log_config.js");

const mainLogs = logConfig.getLogger("main_process");
mainLogs.info("********** 主进程开始 ********** ");

// path check
const BACKUP_PATH = path.join(app.getPath("userData"), "/AccountBackup");
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH);
}

ipcMain.on("check-vc2015", e => {
  if (process.platform === "win32") {
    // check vc2015

    if (process.arch !== "x64") {
      dialog.showMessageBox({
        type: "info",
        message: "请使用64位系统运行钱包程序，32位系统可能出现异常"
      });
      return;
    }

    // const Registry = require("winreg");
    const keys = [
      // x64
      {
        hive: Registry.HKCR,
        key: "\\Installer\\Dependencies\\VC,redist.x64,amd64,14.21,bundle"
      },
      {
        hive: Registry.HKLM,
        key:
          "\\SOFTWARE\\Classes\\Installer\\Dependencies\\VC,redist.x64,amd64,14.21,bundle" // vc2015-19
      },
      {
        hive: Registry.HKLM,
        key:
          "\\SOFTWARE\\Classes\\Installer\\Dependencies\\VC,redist.x64,amd64,14.16,bundle" // vc2017
      },
      {
        hive: Registry.HKLM,
        key:
          "\\SOFTWARE\\Classes\\Installer\\Dependencies\\{d992c12e-cab2-426f-bde3-fb8c53950b0d}" // vc2015-update3 Version: 14.0.24215.1
      },
      {
        hive: Registry.HKLM,
        key:
          "\\SOFTWARE\\Classes\\Installer\\Dependencies\\{a9528995-e130-4501-ae19-bbfaddb779cc}" // vc2015 Version: 14.0.25420.1
      },
      {
        hive: Registry.HKLM,
        key:
          "\\SOFTWARE\\Classes\\Installer\\Dependencies\\{e46eca4f-393b-40df-9f49-076faf788d83}" // vc2015 Version: 14.0.23026.0
      }
    ];

    /**
     * implement of Promise.any
     * */
    const promiseAny = function(ps) {
      return new Promise((resolve, reject) => {
        const errs = [];
        ps.forEach(p => {
          p.then(resolve)
            .catch(err => {
              errs.push(err);
            })
            .finally(() => {
              if (errs.length === ps.length) {
                reject(errs);
              }
            });
        });
      });
    };

    /**
     * get Registry value
     * */
    const getRegKey = function(hive, key, name) {
      return new Promise((resolve, reject) => {
        const regKey = new Registry({
          hive,
          key
        });
        regKey.get(name, (err, registryItem) => {
          if (err) {
            reject(err);
          }
          resolve(registryItem);
        });
      });
    };

    promiseAny(keys.map(({ hive, key }) => getRegKey(hive, key, "Version")))
      .then(registryItem => {
        mainLogs.info(
          `系统已安装Visual C++ Redistributable for Visual Studio 2015, ${JSON.stringify(
            registryItem
          )}`
        );
        // ipcMain.send('vc2015-exists')
        e.sender.send("vc2015-exists");
      })
      .catch(() => {
        const msvcp140Path = path.join(
          process.env.SystemRoot,
          "System32",
          "msvcp140.dll"
        );
        const vcruntime140Path = path.join(
          process.env.SystemRoot,
          "System32",
          "vcruntime140.dll"
        );
        // if (fs.existsSync(path.join(process.env.SystemRoot, 'SysWOW64', 'msvcp140.dll'))) {
        if (fs.existsSync(msvcp140Path) && fs.existsSync(vcruntime140Path)) {
          mainLogs.info(`系统已存在msvcp140.dll和vcruntime140.dll`);
          // ipcMain.send('vc2015-exists')
          e.sender.send("vc2015-exists");
          return;
        }
        mainLogs.info(
          `系统未检测到Visual C++ Redistributable for Visual Studio 2015`
        );
        dialog.showMessageBox(
          {
            type: "info",
            message:
              "Visual C++ Redistributable for Visual Studio 2015可能未安装，请先安装，否则节点可能无法启动"
            // buttons: ['立即安装', '取消'],
          },
          function() {
            // console.log('dialog.showMessageBox response', response)
            // if (response === 1) { // 点击了取消
            //     return
            // }
            const p = path.join(
              app.getPath("exe"),
              "..",
              "assets",
              "vc_redist.x64.exe"
            );
            execFile(p, (err, stdout, stderr) => {
              if (err) {
                mainLogs.error(`执行vc2015安装出错，${err.message}`);
                dialog.showMessageBox(
                  {
                    type: "error",
                    message: `执行vc2015安装出错, ${err.message}`
                  },
                  function() {
                    app.quit();
                  }
                );
                return;
              }
              if (stderr) {
                mainLogs.info(`执行vc2015安装程序stderr，${stderr}`);
                dialog.showMessageBox(
                  {
                    type: "error",
                    message: `执行vc2015安装出错, ${stderr}`
                  },
                  function() {
                    app.quit();
                  }
                );
                return;
              }
              mainLogs.info(`执行vc2015安装程序stdout，${stdout}`);
              app.relaunch();
              app.quit();
            });
          }
        );
      });
  }
});

ipcMain.on("update", function(e) {
  mainLogs.info("收到检测update信号");
  if (process.env.NODE_ENV === "production") {
    autoUpdater.checkForUpdates();
    autoUpdater.on("checking-for-update", () => {
      mainLogs.info("开始检测新的钱包程序");
    });

    autoUpdater.on("update-available", info => {
      mainLogs.info(`有新的钱包程序可用 info:${JSON.stringify(info)}`);
    });

    autoUpdater.on(
      "download-progress",
      ({ delta, bytesPerSecond, percent, total, transferred }) => {
        mainLogs.info(
          `更新下载中...delta: ${delta}，bytesPerSecond: ${bytesPerSecond}，percent: ${percent}，total: ${total}，transferred: ${transferred}`
        );
      }
    );

    autoUpdater.on("update-downloaded", info => {
      mainLogs.info(`开始更新钱包程序 info:${JSON.stringify(info)}`);
      dialog.showMessageBox(
        {
          title: "有新的版本",
          message: "更新已下载完成，点击确定后开始更新"
        },
        () => {
          setImmediate(() => autoUpdater.quitAndInstall());
        }
      );
    });

    autoUpdater.on("update-not-available", info => {
      e.sender.send("check-update-end", "pong");
      mainLogs.info(`没有新的钱包程序 info:${JSON.stringify(info)}`);
    });

    autoUpdater.on("error", error => {
      mainLogs.error(
        "更新失败: ",
        error == null ? "unknown" : (error.stack || error).toString()
      );
      dialog.showMessageBox(
        {
          type: "info",
          message: "更新失败，请检查网络连接"
        },
        () => {
          app.quit();
        }
      );
    });
  }
});

let menu;
// const path          = require('path');
// const url           = require('url');

// czr账户
const czr = require("../czr");

ipcMain.on("sync", (e, arg) => {
  if (typeof arg === "string") {
    czr.accounts.create(arg).then(data => {
      e.returnValue = data;
    });
  } else {
    e.returnValue = "Need string type";
  }
});
ipcMain.on("remove_account", (e, file, pwd) => {
  czr.accounts
    .validate_account(file, pwd)
    .then(data => {
      e.returnValue = data;
    })
    .catch(error => {
      e.returnValue = error.message;
    });
});
// czr账户

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  // eslint-disable-next-line no-underscore-dangle
  global.__static = path.join(__dirname, "/static").replace(/\\/g, "\\\\");
}

let mainWindow = null; // Preserve the global reference of a window object
const gotTheLock = app.requestSingleInstanceLock();

const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`;

// const winWidth = process.env.NODE_ENV === 'development' ? (815 + 580) : 815;

// Solve the production environment can not use copy and paste
function createMenu() {
  if (process.env.NODE_ENV !== "development") {
    const template = [
      {
        label: "Edit",
        submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          {
            label: "Redo",
            accelerator: "Shift+CmdOrCtrl+Z",
            selector: "redo:"
          },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          {
            label: "Select All",
            accelerator: "CmdOrCtrl+A",
            selector: "selectAll:"
          },
          {
            label: "Quit",
            accelerator: "CmdOrCtrl+Q",
            click() {
              app.quit();
            }
          }
        ]
      }
    ];
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

function createWindow() {
  // Create browser window
  // console.log("sentry path ", path.join(__dirname, "..", "sentry", "index.js"));
  mainWindow = new BrowserWindow({
    width: 815,
    height: 600,
    icon: "./static/icons/logo.png",
    title: `Canonchain Wallet - ${app.getVersion()}`,
    resizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    useContentSize: true
    // webPreferences: {
    //     preload: path.join(__dirname, '..', 'sentry', 'index.js')
    // }
  });

  mainWindow.loadURL(winURL);

  // Fired when the window closes
  mainWindow.on("closed", function() {
    /*
        Unreferences the window object. If your application supports multiple windows, you will usually store the window in an array. Click Close to remove the corresponding element.
        */
    mainWindow = null;
  });

  createMenu();
}

// 只开一个实例
// 只开一个实例

function windowAllClose() {
  app.quit();
}

function activateFn() {
  if (mainWindow === null) {
    createWindow();
  }
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.on("ready", createWindow); // Called when Electron finishes, initializes and prepares to create a browser window. Some APIs can only be used after this event occurs.
  app.on("window-all-closed", windowAllClose); // Exit when all windows are closed.
  app.on("activate", activateFn); // On OS X, when you click the Dock icon and no other window is open, a window is usually recreated in the application.
}

log.transports.file.level = "debug";
autoUpdater.logger = log;
// autoUpdater.checkForUpdatesAndNotify()

// app.on('ready', () => {
//     if (process.env.NODE_ENV === 'production') {
//         // ipcMain.send('check-update-start')
//         autoUpdater.checkForUpdates()
//     }
// })

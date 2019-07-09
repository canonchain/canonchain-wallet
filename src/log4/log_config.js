let log4js = require('log4js');
let path = require('path');
let fs = require('fs');
let utility = require('../setting/settings').default;
const basePath = path.join(utility.userDataPath, 'wallet_logs')

/* 
1.启动时检测日志 start_check
2.节点状态日志 node_status
3.操作钱包记录
4.主进程日志
*/
let defaultPath     = path.join(basePath, '/default/');
let startCheck      = path.join(basePath, '/start_check/');
let nodeStatus      = path.join(basePath, '/node_status/');
let walletOperate   = path.join(basePath, '/wallet_operate/');
let mainProcess     = path.join(basePath, '/main_process/');

let confirmPath = function (pathStr) {
    if (!fs.existsSync(pathStr)) {
        fs.mkdirSync(pathStr);
    }
};
//创建log的根目录'logs'
if (basePath) {
    confirmPath(utility.userDataPath);
    confirmPath(basePath);
    //根据不同的logType创建不同的文件目录
    confirmPath(defaultPath);
    confirmPath(startCheck);
    confirmPath(nodeStatus);
    confirmPath(walletOperate);
    confirmPath(mainProcess);
}

log4js.configure({
    appenders: {
        out: {type: 'console'},
        default: {
            type: 'dateFile',
            filename: defaultPath,
            "pattern": "yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        start_check: {
            type: 'dateFile',
            filename: startCheck,
            "pattern": "yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        node_status: {
            type: 'dateFile',
            filename: nodeStatus,
            "pattern": "yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        wallet_operate: {
            type: 'dateFile',
            filename: walletOperate,
            "pattern": "yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        main_process: {
            type: 'dateFile',
            filename: mainProcess,
            "pattern": "yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: {
            appenders: ['default'],
            level: 'info'
        },
        start_check: {
            appenders: ['start_check'],
            level: 'info'
        },
        node_status: {
            appenders: ['node_status'],
            level: 'info'
        },
        wallet_operate: {
            appenders: ['wallet_operate'],
            level: 'info'
        },
        main_process: {
            appenders: ['main_process'],
            level: 'info'
        }
    },
    replaceConsole: true              //是否替换console.log
});

module.exports = log4js;
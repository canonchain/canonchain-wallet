import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-chalk/index.css';
import './assets/css/element-ui.css';

import czr from '../czr'

//Introducing db database
import db from '../datastore/index'
import nedb from '../datastore/index2';

//Introducing languages that need support
import VueI18n from 'vue-i18n'
import languges from '../../i18n/languges_conf'

//log4js
let logConfig = require('../log4/log_config.js');
let startLogs = logConfig.getLogger('start_check');        //此处使用category的值
let nodeLogs = logConfig.getLogger('node_status');        //此处使用category的值
let walletLogs = logConfig.getLogger('wallet_operate');      //此处使用category的值
Vue.prototype.$startLogs = startLogs
Vue.prototype.$nodeLogs = nodeLogs
Vue.prototype.$walletLogs = walletLogs
startLogs.info("********** 启动日志 记录开始 ********** ");
nodeLogs.info("********** 节点日志 记录开始 ********** ");
walletLogs.info("********** 钱包日志 记录开始 ********** ");

Vue.use(VueI18n);
Vue.use(ElementUI);
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.prototype.$czr = czr;

// Vue.prototype.$db = db
Vue.prototype.$nedb = nedb
Vue.prototype.$isOnline = true;


// Loading i18 language
const messages = {};
for (const languge in languges) {
    messages[languge] = require("@/i18n/" + languge + ".json");
}
//Determine the user's language
// let locale = db.get('czr_setting.lang').value();
let oldFile = {
    czr_accounts: [],
    accounts_keystore: [],
    canonchain_data_path: ""
}

let utility = {
    init() {
        utility.getOldFile();
    },
    async getActive() {
        let val = await nedb.setting_language_active.findOne({ "name": "active" })
        startLogs.info("getActive", val);
        const i18n = new VueI18n({
            locale: val ? val.value : "zh-CN",// set locale
            messages,       // set locale messages 
        });
        startLogs.info("准备渲染VUE页面");

        /* eslint-disable no-new */
        Vue.config.productionTip = false
        new Vue({
            el: '#app',
            router,
            store,
            i18n,
            render: h => h(App)
        })
    },
    async getOldFile() {
        //1.backup_file is_backup
        let dbBackupFile = await nedb.backup_file.findOne({ "name": "backup" })
        startLogs.info("dbBackupFile", dbBackupFile);

        //2-1 true stop
        if (dbBackupFile && dbBackupFile.is_backup) {
            utility.getActive();
            return;
        }
        //2-1 false => go
        //3 get file
        startLogs.info("需要设置is_backup");

        try {
            oldFile.czr_accounts = db.get("czr_accounts").value();
            oldFile.accounts_keystore = db.get("accounts_keystore").value();
            oldFile.canonchain_data_path = db.get("czr_setting.canonchain_data_path").value();
        } catch (error) {
            //4-1 false stop(modi is_backup)
            startLogs.info("old db error");
            utility.getActive();
            utility.writeBackup();
            return;
        }
        //4-2 true go
        startLogs.info("oldFile");
        startLogs.info(oldFile);
        // set path
        let insertPathNum;
        try {
            insertPathNum = await nedb.setting_node_path.update({ "name": "node_path" }, { $set: { path: oldFile.canonchain_data_path } })
        } catch (error) {

        }
        utility.backupFile();

    },
    async backupFile() {

        //5 filter key data
        let tempKeyStore = [];
        let tempOldKeyItem;
        for (let keyIndex = 0, len = oldFile.accounts_keystore.length; keyIndex < len;) {
            tempOldKeyItem = oldFile.accounts_keystore[keyIndex];
            tempKeyStore.push({
                account: tempOldKeyItem.account,
                kdf_salt: tempOldKeyItem.kdf_salt,
                iv: tempOldKeyItem.iv,
                ciphertext: tempOldKeyItem.ciphertext
            })
            keyIndex++;
        }
        //filter acc data
        let tempAccStore = [];
        let tempOldAccItem;
        for (let accIndex = 0, len = oldFile.czr_accounts.length; accIndex < len;) {
            tempOldAccItem = oldFile.czr_accounts[accIndex];
            tempAccStore.push({
                address: tempOldAccItem.address,
                tag: tempOldAccItem.tag,
                balance: tempOldAccItem.balance
            })
            accIndex++;
        }

        //6 write file
        if (tempKeyStore.length) {
            const insertKeyNum = await nedb.accounts_keystore.insert(tempKeyStore);
            nedb.accounts_keystore.compactDatafile();
            let resultKey = await nedb.accounts_keystore.done();
        }
        if (tempAccStore.length) {
            const insertAccNum = await nedb.account.insert(tempAccStore);
            nedb.account.compactDatafile();
            let resultAcc = await nedb.account.done();
        }
        utility.getActive();
        utility.writeBackup();
        //7 modi is_backup

    },
    async writeBackup() {
        try {
            let updateLeng = await nedb.backup_file.update({ "name": "backup" }, { $set: { is_backup: true } })
            startLogs.info("设置is_backup为true", updateLeng);
            startLogs.info(`compactDatafile Start`);
            nedb.backup_file.compactDatafile();
            let resultBackup = await nedb.backup_file.done();
            startLogs.info(`compactDatafile End`);
        } catch (error) {
            startLogs.info("设置is_backup失败了");
        }
    }
}
utility.init();
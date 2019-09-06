import "../sentry";
import Vue from "vue";
// Introducing languages that need support
import VueI18n from "vue-i18n";
import ElementUI from "element-ui";
// import languges from "../../i18n/languges_conf";
import App from "./App";
import router from "./router";
import store from "./store";
// import 'element-ui/lib/theme-chalk/index.css';
import "./assets/css/element-ui.css";

import czr from "../czr";

// Introducing db database
import db from "../datastore/index";
import nedb from "../datastore/index2";

const VueElectron = require("vue-electron");

// log4js
const logConfig = require("../log4/log_config.js");

const startLogs = logConfig.getLogger("start_check"); // 此处使用category的值
const nodeLogs = logConfig.getLogger("node_status"); // 此处使用category的值
const walletLogs = logConfig.getLogger("wallet_operate"); // 此处使用category的值
Vue.prototype.$startLogs = startLogs;
Vue.prototype.$nodeLogs = nodeLogs;
Vue.prototype.$walletLogs = walletLogs;
startLogs.info("********** 启动日志 记录开始 ********** ");
nodeLogs.info("********** 节点日志 记录开始 ********** ");
walletLogs.info("********** 钱包日志 记录开始 ********** ");

Vue.config.keyCodes = { enter: 13 };
Vue.use(VueI18n);
Vue.use(ElementUI);

if (!process.env.IS_WEB) Vue.use(VueElectron);

Vue.prototype.$czr = czr;

// Vue.prototype.$db = db
Vue.prototype.$nedb = nedb;
Vue.prototype.$isOnline = true;

// Loading i18 language
const messages = {};
messages.en = require("./i18n/en.json");
messages.ja = require("./i18n/ja.json");
messages.ko = require("./i18n/ko.json");
messages["zh-CN"] = require("./i18n/zh-CN.json");
messages["zh-TW"] = require("./i18n/zh-TW.json");
// for (const languge in languges) {
//     const path = `@/i18n/${languge}.json`;
//     messages[languge] = require(path);
// }

// Determine the user's language
// let locale = db.get('czr_setting.lang').value();
const oldFile = {
  czr_accounts: [],
  accounts_keystore: [],
  canonchain_data_path: ""
};

const utility = {
  init() {
    utility.getOldFile();
  },
  async getActive() {
    const val = await nedb.setting_language_active.findOne({ name: "active" });
    // startLogs.info("getActive", val);
    const i18n = new VueI18n({
      locale: val ? val.value : "zh-CN", // set locale
      messages // set locale messages
    });
    startLogs.info("准备渲染VUE页面");

    /* eslint-disable no-new */
    Vue.config.productionTip = false;
    new Vue({
      el: "#app",
      router,
      store,
      i18n,
      render: h => h(App)
    });
  },
  async getOldFile() {
    // 1.backup_file is_backup
    const dbBackupFile = await nedb.backup_file.findOne({ name: "backup" });
    startLogs.info("dbBackupFile");

    // 2-1 true stop
    if (dbBackupFile && dbBackupFile.is_backup) {
      utility.getActive();
      return;
    }
    // 2-1 false => go
    // 3 get file
    startLogs.info("需要设置is_backup");

    try {
      oldFile.czr_accounts = db.get("czr_accounts").value();
      oldFile.accounts_keystore = db.get("accounts_keystore").value();
      oldFile.canonchain_data_path = db
        .get("czr_setting.canonchain_data_path")
        .value();
    } catch (error) {
      // 4-1 false stop(modi is_backup)
      startLogs.info("old db error");
      utility.getActive();
      utility.writeBackup();
      return;
    }
    // 4-2 true go
    startLogs.info("oldFile");
    // set path
    // let insertPathNum;
    try {
      // insertPathNum = await nedb.setting_node_path.update(
      await nedb.setting_node_path.update(
        { name: "node_path" },
        { $set: { path: oldFile.canonchain_data_path } }
      );
    } catch (error) {
      startLogs.error("update node_path error", error.stack);
    }
    utility.backupFile();
  },
  async backupFile() {
    // 5 filter key data
    const tempKeyStore = [];
    const tempKeyStoreFlag = []; // 辅助判断是否存在
    let tempOldKeyItem;
    for (
      let keyIndex = 0, len = oldFile.accounts_keystore.length;
      keyIndex < len;

    ) {
      tempOldKeyItem = oldFile.accounts_keystore[keyIndex];
      tempKeyStore.push({
        account: tempOldKeyItem.account,
        kdf_salt: tempOldKeyItem.kdf_salt,
        iv: tempOldKeyItem.iv,
        ciphertext: tempOldKeyItem.ciphertext
      });
      tempKeyStoreFlag.push(tempOldKeyItem.account);
      keyIndex += 1;
    }
    // filter acc data
    const tempAccStore = [];
    const tempAccStoreFlag = []; // 辅助判断是否存在
    let tempOldAccItem;
    for (
      let accIndex = 0, len = oldFile.czr_accounts.length;
      accIndex < len;

    ) {
      tempOldAccItem = oldFile.czr_accounts[accIndex];
      tempAccStore.push({
        address: tempOldAccItem.address,
        tag: tempOldAccItem.tag,
        balance: tempOldAccItem.balance
      });
      tempAccStoreFlag.push(tempOldAccItem.address);
      accIndex += 1;
    }

    // 6 write file
    startLogs.info("write file");
    startLogs.info("tempKeyStore.length start", tempKeyStore.length);
    if (tempKeyStore.length) {
      // 先查找是否存在，然后再写入
      const hasKeyAcc = await nedb.accounts_keystore.find({
        account: { $in: tempKeyStoreFlag }
      });
      startLogs.info("hasKeyAcc", hasKeyAcc.length);
      if (hasKeyAcc.length) {
        let keyInDbIndex;
        hasKeyAcc.forEach(element => {
          keyInDbIndex = tempKeyStoreFlag.indexOf(element.account);
          startLogs.info("keyInDbIndex", keyInDbIndex, element.account);
          if (keyInDbIndex !== -1) {
            // 存在，需要删除
            tempKeyStore.forEach((item, index) => {
              if (item.account === element.account) {
                startLogs.info("删除了", element.account);
                tempKeyStore.splice(index, 1);
              }
            });
          }
        });
      }
      startLogs.info("tempKeyStore.length end", tempKeyStore.length);
      if (tempKeyStore.length) {
        try {
          // const insertKeyNum = await nedb.accounts_keystore.insert(tempKeyStore);
          await nedb.accounts_keystore.insert(tempKeyStore);
          nedb.accounts_keystore.compactDatafile();
          // const resultKey = await nedb.accounts_keystore.done();
          await nedb.accounts_keystore.done();
        } catch (e) {
          startLogs.error("db operation failed", e.stack);
        }
      }
    }

    startLogs.info("tempAccStore.length start", tempAccStore.length);
    if (tempAccStore.length) {
      // 先查找是否存在，然后再写入
      // const hasAcc = await nedb.account.find();
      const hasAcc = await nedb.account.find({
        address: { $in: tempAccStoreFlag }
      });
      startLogs.info("hasAcc", hasAcc.length);
      if (hasAcc.length) {
        let accInDbIndex;
        hasAcc.forEach(element => {
          accInDbIndex = tempAccStoreFlag.indexOf(element.address);
          startLogs.info("accInDbIndex", accInDbIndex, element.address);
          if (accInDbIndex !== -1) {
            // 存在，需要删除
            tempAccStore.forEach((item, index) => {
              if (item.address === element.address) {
                startLogs.info("删除了", element.address);
                tempAccStore.splice(index, 1);
              }
            });
          }
        });
      }
      startLogs.info("tempAccStore.length start", tempAccStore.length);
      if (tempAccStore.length) {
        try {
          // const insertAccNum = await nedb.account.insert(tempAccStore);
          await nedb.account.insert(tempAccStore);
          nedb.account.compactDatafile();
          // const resultAcc = await nedb.account.done();
          await nedb.account.done();
        } catch (e) {
          startLogs.error("db account operation failed", e.stack);
        }
      }
    }
    utility.getActive();
    utility.writeBackup();
    // 7 modi is_backup
  },
  async writeBackup() {
    try {
      const updateLeng = await nedb.backup_file.update(
        { name: "backup" },
        { $set: { is_backup: true } }
      );
      startLogs.info("设置is_backup为true", updateLeng);
      startLogs.info(`backup compactDatafile Start`);
      nedb.backup_file.compactDatafile();
      // const resultBackup = await nedb.backup_file.done();
      await nedb.backup_file.done();
      startLogs.info(`backup compactDatafile End`);
    } catch (error) {
      startLogs.info("设置is_backup失败了");
    }
  }
};
utility.init();

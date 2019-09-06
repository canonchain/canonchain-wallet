// (async () => {})();
const logConfig = require("../log4/log_config.js");

const startLogs = logConfig.getLogger("start_check"); // 此处使用category的值
const account = require("./nedb")("account");
// eslint-disable-next-line camelcase
const accounts_keystore = require("./nedb")("accounts_keystore");
// eslint-disable-next-line camelcase
const account_tx = require("./nedb")("account_trans");
// eslint-disable-next-line camelcase
const contact = require("./nedb")("contact");
// eslint-disable-next-line camelcase
const setting_language = require("./nedb")("setting_language");
// eslint-disable-next-line camelcase
const setting_language_active = require("./nedb")("setting_language_active");
// eslint-disable-next-line camelcase
const setting_node_path = require("./nedb")("setting_node_path");
// eslint-disable-next-line camelcase
const backup_file = require("./nedb")("backup_file");

const utility = {
  async initBackupFile() {
    // 初始化
    let backupRes;
    try {
      backupRes = await backup_file.findOne({ name: "backup" });
    } catch (error) {
      startLogs.error("initBackupFile 捕获到错误", error.stack);
      // console.error("initBackupFile 捕获到错误");
      // console.error(error);
    }
    if (!backupRes) {
      try {
        await backup_file.insert({
          name: "backup",
          is_backup: false
        });
      } catch (error) {
        startLogs.error("insertBackupFile 捕获到错误", error.stack);
        // console.error("insertBackupFile 捕获到错误");
        // console.error(error);
      }
    }
  },
  async initNodePath() {
    // 初始化
    let nodePathRes;
    try {
      nodePathRes = await setting_node_path.findOne({ name: "node_path" });
    } catch (error) {
      startLogs.error("initNodePath 捕获到错误", error.stack);
      // console.error("initNodePath 捕获到错误");
      // console.error(error);
    }
    if (!nodePathRes) {
      try {
        await setting_node_path.insert({ name: "node_path", path: "" });
      } catch (error) {
        startLogs.error("insertNodePath 捕获到错误", error.stack);
        // console.error("insertNodePath 捕获错误");
        // console.error(error);
      }
    }
  },
  async initLanguageActive() {
    // 初始化
    let activeRes;
    try {
      activeRes = await setting_language_active.findOne({ name: "active" });
    } catch (error) {
      startLogs.error("initLanguageActive 捕获到错误", error.stack);
      // console.error("initLanguageActive 捕获到错误");
      // console.error(error);
    }
    if (!activeRes) {
      try {
        await setting_language_active.insert({
          name: "active",
          value: "zh-CN"
        });
      } catch (error) {
        startLogs.error("initLanguageActive 捕获到错误", error.stack);
        // console.error("initLanguageActive 捕获错误");
        // console.error(error);
      }
    }
  },
  async initLanguage() {
    let resLang;
    try {
      resLang = await setting_language.findOne({ name: "zh-CN" });
    } catch (error) {
      startLogs.error("initLanguage 捕获到错误", error.stack);
      // console.error("initLanguage 捕获到错误");
      // console.error(error);
    }
    if (!resLang) {
      try {
        const langConf = [
          {
            name: "zh-CN",
            alias: "中文(简体)"
          },
          {
            name: "zh-TW",
            alias: "中文(繁體)"
          },
          {
            name: "en",
            alias: "English"
          },
          {
            name: "ja",
            alias: "日本語"
          },
          {
            name: "ko",
            alias: "한국어"
          }
        ];
        await setting_language.insert(langConf);
      } catch (error) {
        startLogs.error("initLanguage 捕获到错误", error.stack);
        // console.error("initLanguage 捕获错误");
        // console.error(error);
      }
    }
  }
};
// 初始化
utility.initNodePath();
utility.initLanguage();
utility.initLanguageActive();
utility.initBackupFile();

/**
- account                   账户表
- accounts_keystore         账户文件表
- account_tx                交易表

- contact                   联系人表

- setting_language          语言表
- setting_node_path         节点路径
 */

module.exports = {
  account,
  accounts_keystore,
  account_tx,
  contact,
  setting_language,
  setting_language_active,
  setting_node_path,
  backup_file
};

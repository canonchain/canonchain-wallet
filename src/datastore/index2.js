(async () => {

})()
const account = require('./nedb')('account');
const accounts_keystore = require('./nedb')('accounts_keystore');
const account_tx = require('./nedb')('account_trans');
const contact = require('./nedb')('contact');
const setting_language = require('./nedb')('setting_language');
const setting_language_active = require('./nedb')('setting_language_active');
const setting_node_path = require('./nedb')('setting_node_path');
const backup_file = require('./nedb')('backup_file');

let utility = {
    async initBackupFile() {
        // 初始化
        let backupRes
        try {
            backupRes = await backup_file.findOne({ name: "backup" });
        } catch (error) {
            console.error("initBackupFile 捕获到错误")
            console.error(error)
        }
        if (!backupRes) {
            try {
                let insertLen = await backup_file.insert({ name: "backup", is_backup: false });
            } catch (error) {
                console.error("initBackupFile 捕获错误")
                console.error(error)
            }
        }
    },
    async initNodePath() {
        // 初始化
        let nodePathRes
        try {
            nodePathRes = await setting_node_path.findOne({ "name": "node_path" });
        } catch (error) {
            console.error("initNodePath 捕获到错误")
            console.error(error)
        }
        if (!nodePathRes) {
            try {
                await setting_node_path.insert({ "name": "node_path", "path": "" });
            } catch (error) {
                console.error("initNodePath 捕获错误")
                console.error(error)
            }
        }
    },
    async initLanguageActive() {
        // 初始化
        let activeRes
        try {
            activeRes = await setting_language_active.findOne({ "name": "active" });
        } catch (error) {
            console.error("initLanguageActive 捕获到错误")
            console.error(error)
        }
        if (!activeRes) {
            try {
                await setting_language_active.insert({ "name": "active", "value": "zh-CN" });
            } catch (error) {
                console.error("initLanguageActive 捕获错误")
                console.error(error)
            }
        }
    },
    async initLanguage() {
        let resLang;
        try {
            resLang = await setting_language.findOne({ "name": "zh-CN" });
        } catch (error) {
            console.error("initLanguage 捕获到错误")
            console.error(error)
        }
        if (!resLang) {
            try {
                let langConf = [
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
                ]
                await setting_language.insert(langConf);
            } catch (error) {
                console.error("initLanguage 捕获错误")
                console.error(error)
            }
        }

    }
}
//初始化
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
    account: account,
    accounts_keystore: accounts_keystore,
    account_tx: account_tx,
    contact: contact,
    setting_language: setting_language,
    setting_language_active: setting_language_active,
    setting_node_path: setting_node_path,
    backup_file: backup_file
}
<template>
    <div class="page-czr-home">
        <div class="home-banner">
            <i class="iconfont icon-logo">&#xe650;</i>
            <div>
                <el-button size="small" plain @click="dialogSwitch.import = true">{{ $t('page_home.import_account') }}
                </el-button>
            </div>
        </div>

        <div class="home-content" v-loading.fullscreen.lock="fullscreenLoading">
            <div class="account-wrap b-flex">
                <template v-for="account in database">
                    <router-link :to="'/account/' + account.address" tag="div" class="accounrt-item ">
                        <div class="account-avatar">
                            <i class="iconfont ico-avatar">&#xe602;</i>
                        </div>
                        <i class="iconfont delete-acc" @click.stop="showRemoveDia(account.address)">&#xe613;</i>
                        <div class="account-cont">
                            <p class="account-remark">{{account.tag}}</p>
                            <h1 class="account-assets">{{account.balance | toCzrVal}}</h1>
                            <p class="account-unit">{{ $t('unit.czr') }}</p>
                            <p class="account-address">{{account.address}}</p>
                        </div>
                    </router-link>
                </template>
                <!--  ADD  -->
                <div class="accounrt-item add-account" @click="dialogSwitch.create = true">
                    <div class="account-cont">
                        <i class="iconfont icon-add-acc">&#xe63b;</i>
                        <p class="add-acc-des">{{ $t('page_home.add_account') }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- account create -->
        <el-dialog
                :close-on-click-modal="false"
                :show-close="createInfo.step === 0"
                :title="createInfo.step === 0 ? $t('page_home.create_dia.create_tit') : $t('page_home.create_dia.backup_tit') "
                :visible.sync="dialogSwitch.create" @open="initCreateInfo" width="60%">
            <template v-if="createInfo.step === 0">
                <el-alert v-if="createInfo.error" :title="createInfo.error" :closable="false" type="error" show-icon>
                </el-alert>
                <el-input v-model="createInfo.tag" :placeholder="$t('page_home.create_dia.placeholder_tag')">
                    <template slot="prepend">
                        <i class="el-icon-tickets"></i> {{$t('page_home.create_dia.create_tag')}}
                    </template>
                </el-input>
                <el-input v-model="createInfo.pwd" :placeholder="$t('page_home.create_dia.placeholder_pwd')"
                          type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home.create_dia.create_pwd')}}
                    </template>
                </el-input>
                <el-input v-model="createInfo.repwd" :placeholder="$t('page_home.create_dia.placeholder_repwd')"
                          type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home.create_dia.create_repwd')}}
                    </template>
                </el-input>
                <div slot="footer">
                    <el-button @click="dialogSwitch.create = false">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="createAccount">{{ $t('confirm') }}</el-button>
                </div>
            </template>
            <template v-if="createInfo.step === 1">
                <el-alert :title="$t('page_home.create_dia.create_success')"
                          :description="$t('page_home.create_dia.create_success_des')" :closable="false" type="success"
                          show-icon>
                </el-alert>
                <el-alert :title="$t('page_home.create_dia.download_tit')"
                          :description="$t('page_home.create_dia.download_des')" :closable="false" type="warning"
                          show-icon>
                </el-alert>
                <el-input type="textarea" :rows="2" v-model="createInfo.address" disabled>
                </el-input>
                <div slot="footer">
                    <el-button type="danger" @click="downloadKeystore(createInfo.address)">
                        {{$t('page_home.create_dia.account_download_keystore')}}
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- account import -->
        <el-dialog :title="$t('page_home.import_dia.tit')" :visible.sync="dialogSwitch.import" @open="initImportInfo"
                   width="50%">
            <template>
                <el-alert v-if="importInfo.alert" :title="importInfo.alert.content" :closable="false"
                          :type="importInfo.alert.type" show-icon>
                </el-alert>
                <template>
                    <div v-if="!importInfo.keystore" class="holder" @dragover.prevent.stop
                         @drop.prevent.stop="importKeystore">
                        {{$t('page_home.import_dia.placeholder_keystore')}}
                        &nbsp;
                        <el-button size="mini" @click="selectImport" :disabled="selectImporting">选择文件</el-button>
                    </div>
                    <el-input v-model="importInfo.tag" :placeholder="$t('page_home.import_dia.placeholder_tag')">
                        <template slot="prepend">
                            <i class="el-icon-document"></i> {{$t('page_home.import_dia.create_tag')}}
                        </template>
                    </el-input>

                </template>
                <div slot="footer">
                    <el-button @click="dialogSwitch.import = false">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="importAccount">{{ $t('confirm') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- account remove -->
        <el-dialog :title="$t('page_home.remove_dia.tit')" :visible.sync="dialogSwitch.remove" width="50%">
            <span>
                <el-alert v-if="removeInfo.alert" :title="removeInfo.alert.content" :closable="false"
                          :type="removeInfo.alert.type" show-icon>
                </el-alert>
                {{ $t('page_home.remove_dia.backup') }}

                <p class="remove-acc">
                    {{this.removeInfo.address}}
                </p>
                <el-input v-model="removeInfo.pwd" :placeholder="$t('page_home.create_dia.placeholder_repwd')"
                          type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home.create_dia.create_repwd')}}</template>
                </el-input>
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogSwitch.remove = false">{{ $t('cancel') }}</el-button>
                <el-button type="danger"
                           @click="removeAccountFn()">{{ $t('page_home.remove_dia.remove_confrim') }}</el-button>
            </span>
        </el-dialog>

    </div>

</template>

<script>
    const fs = require("fs");
    // import {setInterval, clearInterval, clearTimeout, setTimeout} from "timers";
    import {sep} from 'path';

    const {spawn, spawnSync} = require("child_process");
    const {ipcRenderer} = require('electron')
    import BigNumber from 'bignumber.js/bignumber.mjs'

    const path = require('path')

    let self = null;
    let getBalancesTimer = null;
    let aryForBalans = [];
    let accountErrorTimer = null;
    let updataBlockTimer = {
        start: null,
        error: null
    };
    let updataBlockData = {
        sourcesObj: null,//源文件
        targetAry: []    //筛选后，需要更新的Blocks
    }

    const {app, dialog} = require("electron").remote;

    // app.on('before-quit', () => {
    //     self.$nodeLogs.info("before-quit start");
    // })

    app.on("will-quit", () => {
        //应用程序的窗口已经关闭，应用即将退出
        self.$nodeLogs.info("will-quit start");
        self.$czr.request.stop().then(data => {
            self.$nodeLogs.info("Stop成功 !");
            self.$nodeLogs.info(data);
        }).catch(error => {
            self.$nodeLogs.error("出错啦，建议重启钱包后再次操作");
            self.$nodeLogs.error(error);
        });
    });

    app.on("quit", () => {
        //应用程序正在退出
        self.$nodeLogs.info("quit start and stop", sessionStorage.getItem("CanonchainPid"));
        if (!sessionStorage.getItem("CanonchainPid")) {
            self.$nodeLogs.info("不需要kill Canonchain");
            return
        }
        let currentPid = Number(sessionStorage.getItem("CanonchainPid"));
        let result = process.kill(currentPid, "SIGINT");
        self.$nodeLogs.info("app quit kill canonchain:", currentPid, result);
        self.$czr.request.stop().then(data => {
            self.$nodeLogs.info("Stop成功");
            self.$nodeLogs.info(data);
        }).catch(error => {
            self.$nodeLogs.error("出错啦，建议重启钱包后再次操作");
            self.$nodeLogs.error(error);
        });
    });

    export default {
        name: "Bodyer",
        data() {
            return {
                selectImporting: false,
                dialogSwitch: {
                    create: false,
                    import: false,
                    remove: false
                },
                fullscreenLoading: false,
                database: [],
                createInfo: {
                    address: '',
                },
                importInfo: {},
                removeInfo: {},
                timerSwitch: {
                    initAccount: null,
                    updateSendBlock: null
                },
                intervalId: null
            };
        },
        watch: {},
        created() {
            self = this;
            self.initDatabase();
            self.timerSwitch.initAccount = setInterval(() => {
                self.initDatabase();
            }, 5000);

        },
        mounted() {
            self.$walletLogs.info("HOME:页面渲染成功");
            if (!getBalancesTimer) {
                self.runBalancesTimer();
                self.$walletLogs.info("HOME:需要新建 Account 定时器");
            } else {
                self.$walletLogs.info("HOME:Account定时器已经存在，无需新建");
            }
            //更新Block
            if (!updataBlockTimer.start) {
                self.$walletLogs.info("HOME:需要新建updataBlock定时器");
                self.runUpdateBlocksTimer();
            } else {
                self.$walletLogs.info("HOME:updataBlock已经存在，无需建立");
            }
        },
        computed: {},
        beforeDestroy() {
            clearInterval(self.timerSwitch.initAccount);
            self.timerSwitch.initAccount = null;
        },
        methods: {
            selectImport() {
                // console.log('selectImport')
                this.selectImporting = true
                const filePaths = dialog.showOpenDialog({
                    title: '请选择keytore文件',
                    properties: ['openFile'],
                    filters: [
                        {name: 'Account File', extensions: ['json']}
                    ],
                }, (filePaths) => {
                    if (filePaths) {
                        // hack importKeystore
                        let fakeE = {
                            dataTransfer: {
                                files: [
                                    {
                                        path: filePaths[0]
                                    }
                                ]
                            }
                        }
                        this.importKeystore(fakeE)
                    }
                    this.selectImporting = false
                })
            },
            async initDatabase() {
                // anbang 查找所有账户
                // self.database = self.$db.get("czr_accounts").value();
                self.database = await this.$nedb.account.sort({createdAt: 1}).find();
            },
            //Init Start
            initCreateInfo() {
                this.createInfo = {
                    tag: this.$t("page_home.acc") + (this.database.length + 1),
                    pwd: "",
                    repwd: "",

                    step: 0,
                    error: "",

                    address: "",
                    keystore: ""
                };
            },
            initImportInfo() {
                this.importInfo = {
                    tag: this.$t("page_home.acc") + (this.database.length + 1),
                    repwd: "",

                    step: 0,
                    alert: null,

                    keystore: null
                };
            },
            //Init End

            async initAccount(params) {
                //anbang 查找当前账户
                // let account = this.$db
                //     .get("czr_accounts")
                //     .find({address: params.address})
                //     .value();
                let account = await this.$nedb.account.findOne({address: params.address});
                // console.log("account",account)
                if (account) {
                    this.$message.error(
                        this.$t("page_home.import_dia.exist") +
                        '"' +
                        account.tag +
                        '"'
                    );
                    return;
                }

                //anbang 写入账户
                // this.$db
                //     .get("czr_accounts")
                //     .push(params)
                //     .write();
                let insertRes = await this.$nedb.account.insert(params);
                // console.log("insertRes",insertRes)
                //写入send_list的对应key
                // anbang 写结构的，不需要再有了
                // if (
                //     !self.$db
                //         .read()
                //         .has("send_list." + params.address)
                //         .value()
                // ) {
                //     self.$db
                //         .read()
                //         .set("send_list." + params.address, [])
                //         .write();
                // }

                this.initDatabase();
            },
            async pushKeystore(keystore) {
                self.$walletLogs.info(`开始保存keystore文件`);
                //anbang 写入账户
                // const ret = self.$db
                //     .get("accounts_keystore")
                //     .push(keystore)
                //     .write();
                const ret = await this.$nedb.accounts_keystore.insert(keystore);
                self.$walletLogs.info(`完成保存keystore文件吗`);
            },

            // Create Account Start
            async createAccount() {
                if (self.database.length >= 50) {
                    self.$message.error(self.$t("page_home.create_dia.account_quantity_error"));
                    return;
                }
                if (!this.createInfo.tag) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_tag"
                    );
                    return;
                }
                if (this.createInfo.tag.length > 8) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_tag_length"
                    );
                    return;
                } else {
                    this.createInfo.error = '';
                }
                if (!this.createInfo.pwd) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_password"
                    );
                    return;
                }
                if (!this.createInfo.repwd) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_re_password"
                    );
                    return;
                }
                if (this.createInfo.pwd !== this.createInfo.repwd) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_password_length"
                    );
                    return;
                }
                if (
                    this.createInfo.pwd.length < 8 ||
                    this.createInfo.repwd.length < 8
                ) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_strong_password"
                    );
                    return;
                }

                if (this.createInfo.pwd.length > 100) {
                    this.createInfo.error = this.$t(
                        "page_home.create_dia.validate_long_password"
                    );
                    return;
                }
                let reg = /^[0-9a-zA-Z!@#$%^&*]{8,100}$/g;
                if (!reg.test(this.createInfo.pwd)) {
                    this.createInfo.error = this.$t('page_home.create_dia.validate_type_password');
                    return;
                }

                //正则验证仅仅支持 数字 大小写英文字母 和!@#$%^&*半角字符

                // const accountResult = ipcRenderer.sendSync('sync', self.createInfo.pwd);
                const accountResult = await self.$czr.accounts.create(self.createInfo.pwd)
                if (accountResult.account) {
                    /* 创建成功, 备份keystore */
                    this.backupAccount(accountResult)

                    self.createInfo.keystore = JSON.stringify(accountResult);
                    self.createInfo.address = accountResult.account;
                    let params = {
                        address: accountResult.account,
                        tag:
                            self.createInfo.tag ||
                            self.$t("page_home.acc") +
                            (self.database.length + 1),
                        balance: "0",
                        send_list: []
                    };
                    // loading
                    const loading = this.$loading({
                        lock: true,
                        text: '账户文件生成中',
                        spinner: 'el-icon-loading',
                        background: 'rgba(0, 0, 0, 0.6)'
                    });
                    self.initAccount(params);
                    self.pushKeystore(accountResult);
                    //后续操作
                    self.$walletLogs.info(`compactDatafile Start`);
                    this.$nedb.account.compactDatafile();
                    this.$nedb.accounts_keystore.compactDatafile();
                    let resultAcc1 = await this.$nedb.account.done();
                    let resultKey = await this.$nedb.accounts_keystore.done();
                    let resultAcc2 = await this.$nedb.account.done();
                    self.$walletLogs.info(`compactDatafile End`);
                    self.createInfo.pwd = "";//初始化密码
                    self.createInfo.repwd = "";//初始化密码
                    loading.close();
                    self.createInfo.step = 1;
                } else {
                    self.$walletLogs.error("Account Create Error");
                    self.$message.error("Account Create Error");
                }
            },
            backupAccount(accountObj) {
                // fs.writeFileSync(path.join(app.getPath('userData'), 'AccountBackup', `${accountObj.account}.json`), JSON.stringify(accountObj))
                /**
                 * @wgy:修改了强制刷入数据
                 */
                let accountPath = path.join(app.getPath('userData'), 'AccountBackup', `${accountObj.account}.json`);
                const fd = fs.openSync(accountPath, 'w');
                fs.writeFileSync(accountPath, JSON.stringify(accountObj))
                fs.fdatasyncSync(fd)
                fs.closeSync(fd)
            },
            downloadKeystore(accVal) {
                let link = document.createElement("a");
                link.download = accVal + '.json';
                link.style.display = "none";

                let blob = new Blob([self.createInfo.keystore]);
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                self.dialogSwitch.create = false;
            },
            // Create Account End

            //Import Start
            importKeystore(event) {
                let fileLength = event.dataTransfer.files.length;
                if (fileLength != 1) {
                    self.$message.error(
                        self.$t(
                            "page_home.import_dia.keystore_length_error"
                        )
                    );
                    return;
                }
                let targetFile = event.dataTransfer.files[0];

                fs.readFile(targetFile.path, "utf8", async (err, data) => {
                    if (err) {
                        this.$message.error(
                            this.$t("page_home.import_dia.keystore_error") +
                            ":" +
                            err
                        );
                    }
                    let targetJson;
                    try {
                        targetJson = JSON.parse(data);
                    } catch (e) {
                        targetJson = '';
                    }

                    if (!targetJson) {
                        self.$message.error(
                            self.$t(
                                "page_home.import_dia.keystore_format_error"
                            )
                        );
                        return;
                    }

                    if (!targetJson.account || targetJson.account.length !== 54) {
                        self.$message.error(
                            self.$t(
                                "page_home.import_dia.keystore_format_error"
                            )
                        );
                        return;
                    }
                    //anbang 找文件
                    // let importObjec = this.$db.read().get("czr_accounts").find({address: targetJson.account}).value() // this.importInfo.keystore = JSON.parse(data);
                    let importObjec = await this.$nedb.account.findOne({address: targetJson.account});

                    if (importObjec) {
                        self.$message.error(
                            self.$t(
                                "page_home.import_dia.keystore_is_has"
                            ) + ' : ' + targetJson.account
                        );
                        return;
                    }

                    this.importInfo.keystore = data;
                    // console.log('importData ', data)
                    this.backupAccount(JSON.parse(data))
                    this.importInfo.alert = {
                        content: this.$t("page_home.import_dia.imported_success"),
                        type: "success"
                    };
                });
            },
            importAccount() {
                if (!this.importInfo.tag) {
                    this.importInfo.alert = {
                        content: this.$t("page_home.import_dia.validate_tag"),
                        type: "error"
                    };
                    return;
                }
                if (this.importInfo.tag.length > 8) {
                    this.importInfo.alert = {
                        content: this.$t(
                            "page_home.import_dia.validate_tag_length"
                        ),
                        type: "error"
                    };
                    return;
                }
                let account = null;
                let importObj = JSON.parse(self.importInfo.keystore);
                if (!this.importInfo.keystore) {
                    this.importInfo.alert = {
                        content: this.$t(
                            "page_home.import_dia.validate_enter_keystore"
                        ),
                        type: "error"
                    };
                    return;
                }
                //验证账户文件

                let params = {
                    address: importObj.account,
                    tag:
                        self.importInfo.tag ||
                        self.$t("page_home.acc") +
                        (self.database.length + 1),
                    balance: 0,
                    send_list: []
                };
                self.initAccount(params);
                self.pushKeystore(JSON.parse(self.importInfo.keystore));
                self.dialogSwitch.import = false;
                self.$message.success(
                    self.$t(
                        "page_home.import_dia.imported_account_success"
                    )
                );
                self.initDatabase();
            },
            //Import End

            // Remove Start
            showRemoveDia(currentAcc) {
                this.removeInfo = {
                    address: currentAcc,
                    pwd: "",
                    alert: ""
                };
                this.dialogSwitch.remove = true;
            },
            async removeAccountFn() {
                //判断keystore是否在本地，如果在本地，删除本地账户系统；否则请求节点删除
                //anbang
                // let isKeystoreAccount = this.$db
                //     .get("accounts_keystore")
                //     .find({account: self.removeInfo.address})
                //     .value();
                let isKeystoreAccount = await this.$nedb.accounts_keystore.findOne({account: self.removeInfo.address});
                if (isKeystoreAccount) {
                    //删除本地账户
                    // const accountResult = ipcRenderer.sendSync('remove_account', isKeystoreAccount, self.removeInfo.pwd);
                    const accountResult = await self.$czr.accounts.validate_account(isKeystoreAccount, self.removeInfo.pwd)
                    self.removeInfo.pwd = "";//初始化密码
                    if (accountResult) {
                        self.removeSuccess();
                    } else {
                        self.$message.error(self.$t("page_home.remove_dia.validate_password"));
                    }
                } else {
                    self.$message.error("不存在账户：" + self.removeInfo.address);
                }
            },
            async removeSuccess() {
                //anbang 删除account 和keystore
                // self.$db
                //     .get("czr_accounts")
                //     .remove({address: self.removeInfo.address})
                //     .write();
                // self.$db
                //     .get("accounts_keystore")
                //     .remove({account: self.removeInfo.address})
                //     .write();
                let aloneRemoverAcc = await this.$nedb.account.remove({address: self.removeInfo.address});
                let aloneRemoverKey = await this.$nedb.accounts_keystore.remove({account: self.removeInfo.address});

                self.$message.success(self.$t("page_home.remove_dia.remove_success"));
                self.initDatabase();
                self.dialogSwitch.remove = false;
            },
            // Remove End

            //get Balcances start
            runBalancesTimer() {
                aryForBalans = [];
                getBalancesTimer = setTimeout(() => {
                    self.database.forEach(item => {
                        aryForBalans.push(item.address)
                    })
                    // console.log('getAccountsBalances aryForBalans', aryForBalans)
                    if (aryForBalans.length) {
                        self.getAccountsBalances(aryForBalans);
                    } else {
                        self.runBalancesTimer();
                    }
                }, 1000 * 5);
            },
            async getAccountsBalances(aryForBalans) {
                self.$czr.request
                    .accountsBalances(aryForBalans)
                    .then(async res => {
                        // console.log('accountsBalances res ', res)
                        // console.log('aryForBalans ', aryForBalans)
                        if (res.code !== 0) {
                            return self.$walletLogs.info(
                                `Accounts Balances Error ${res.msg}`
                            );
                        }
                        let localAcc;
                        let balance;

                        for (let localIndex = 0, len = res.balances.length; localIndex < len;) {
                            balance = res.balances[localIndex];
                            localAcc = await this.$nedb.account.findOne({address: aryForBalans[localIndex]});
                            // console.log("localAcc", localAcc.balance,balance)
                            if (localAcc && (localAcc.balance !== balance)) {
                                // console.log("xiugai",aryForBalans[localIndex])
                                let aloneUpdateRes = await this.$nedb.account.update({address: aryForBalans[localIndex]}, {$set: {balance: balance}});
                            }
                            localIndex++;
                        }
                        // res.balances.forEach(async (balance, i) => {
                        //     //anbang 如果余额变了，再修改
                        //     // self.$db
                        //     //     .read()
                        //     //     .get("czr_accounts")
                        //     //     .find({address: aryForBalans[i]})
                        //     //     .assign({balance: new BigNumber(balance).toString()})
                        //     //     .write()
                        //     localAcc = await this.$nedb.account.findOne({address: aryForBalans[i]});
                        //     console.log("localAcc", localAcc.balance.toString(),balance.toString())
                        //     if(localAcc && (localAcc.balance.toString() !== balance.toString())){
                        //         console.log("xiugai",aryForBalans[i])
                        //         let aloneUpdateRes = await this.$nedb.account.update({address: aryForBalans[i]},{ $set: { balance: Number(balance) } });
                        //     }
                        // })
                    })
                    .catch(error => {
                        self.$walletLogs.info(
                            `Accounts Balances Error ${error.message}`
                        );
                    })
                    .finally(() => {
                        self.runBalancesTimer();
                    })
            },
            //get Balcances end

            // Update send block start
            runUpdateBlocksTimer() {
                //定时器控制时间
                updataBlockTimer.start = setTimeout(() => {
                    self.chooseUpdateBlocksData();
                }, 5000);
            },
            async chooseUpdateBlocksData() {
                //读取所有数据,并筛选不稳定的Hash合集
                //anbang
                // updataBlockData.sourcesObj = self.$db.get("send_list").value();
                updataBlockData.sourcesObj = await self.$nedb.account_tx.find({"is_stable": "0"});

                let curentAry = [];
                updataBlockData.targetAry = [];
                for (let key in updataBlockData.sourcesObj) {
                    curentAry = curentAry.concat(updataBlockData.sourcesObj[key]);
                }
                if (curentAry.length < 1) {
                    self.runUpdateBlocksTimer();
                    return;
                }
                curentAry.forEach(ele => {
                    if (ele.is_stable === "0") {
                        updataBlockData.targetAry.push(ele.hash);
                    }
                })
                self.startUpdateBlocks();
            },
            async startUpdateBlocks() {
                //拿到最新数据，写入数据库，并准备下次
                self.$czr.request
                    .getBlocks(updataBlockData.targetAry) // TODO data change
                    .then(data => {
                        let obtainData = data.blocks || [];
                        let updateInfo;
                        obtainData.forEach(async ele => {
                            if (ele.is_stable === "1") {
                                //更新
                                // self.$db.get("send_list." + ele.from).find({hash: ele.hash})
                                // .assign(ele).write()
                                updateInfo = {
                                    is_stable: ele.is_stable,
                                    status: ele.status,
                                    stable_timestamp: ele.stable_timestamp,
                                    mc_timestamp: ele.mc_timestamp,
                                    gas_used: ele.gas_used,
                                };
                                let aloneUpdateBlock = await this.$nedb.account_tx.update({hash: ele.hash}, {$set: updateInfo});
                            }
                        })
                        self.runUpdateBlocksTimer();
                    })
                    .catch(error => {
                        self.$walletLogs.error("Update Blocks Error", error.message);
                        self.runUpdateBlocksTimer();
                    })

            }
            // Update send block end

        },
        filters: {
            toCzrVal(val) {
                if (!val) {
                    return 0;
                }
                let tempVal = self.$czr.utils.fromKing(val, "czr");
                return new BigNumber(tempVal).toFixed(4)
                // let reg = /(\d+(?:\.)?)(\d{0,4})/;
                // let regAry = reg.exec(tempVal);
                // let integer = regAry[1];
                // let decimal = regAry[2];
                // if (decimal) {
                //     while (decimal.length < 4) {
                //         decimal += "0";
                //     }
                // }
                // return integer + decimal;
            }
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .page-czr-home {
    }

    .home-banner {
        width: 100%;
        text-align: center;
        height: 175px;
        background-image: linear-gradient(
                45deg,
                #2d2b5d 0%,
                #4d4d8f 50%,
                #5a59a0 100%
        );
    }

    .home-banner .icon-logo {
        color: #fff;
        font-size: 80px;
    }

    .holder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 150px;
        border: 1px dashed #6ab0df;
        background: #e7f2fa;
        margin-bottom: 10px;
        border-radius: 4px;
    }

    /* account */
    .account-wrap {
        /* padding-top: 64px; */
        margin-top: 40px;
        /* width: 100%; */
        /* background: #1E8FAA; */
        padding: 0 20px;
        margin-left: -20px;
        flex-wrap: wrap;
    }

    .accounrt-item {
        width: 218px;
        text-align: center;
        border: 1px transparent;
        padding: 44px 10px 10px 10px;
        position: relative;
        margin: 40px 0 20px 20px;
        background-color: #f2f2f2;
        cursor: pointer;
        -webkit-user-select: none;
        border-radius: 5px;
    }

    .accounrt-item.add-account {
        border: 1px dashed #dddddd;
        padding-top: 24px;
        padding-left: 9px;
        padding-right: 9px;
        padding-bottom: 30px;
        /* background: linear-gradient(white,white) padding-box,
        repeating-linear-gradient(-45deg,#ccc 0, #ccc 2px ,white 0,white 8px); */
    }

    .accounrt-item .account-assets {
        font-size: 24px;
        color: #2d2b5d;
    }

    /* .accounrt-item .account-avatar{
      position: absolute;
      top: -32px;
      left: 88px;
      width: 64px;
      height: 64px;
      border-radius:50%;
      text-align: center;
      background-color: #1E8FAA ;
    } */
    .accounrt-item .account-avatar {
        position: absolute;
        top: -16px;
        left: 86px;
        width: 64px;
        height: 40px;
        background: #4d4d8f;
    }

    .accounrt-item .account-avatar:before {
        content: "";
        position: absolute;
        top: -16px;
        left: 0;
        width: 0;
        height: 0;
        border-left: 32px solid transparent;
        border-right: 32px solid transparent;
        border-bottom: 16px solid #4d4d8f;
    }

    .accounrt-item .account-avatar:after {
        content: "";
        position: absolute;
        bottom: -16px;
        left: 0;
        width: 0;
        height: 0;
        border-left: 32px solid transparent;
        border-right: 32px solid transparent;
        border-top: 16px solid #4d4d8f;
    }

    .accounrt-item .account-avatar .ico-avatar {
        color: #fff;
        font-size: 34px;
        margin-top: -5px;
    }

    .accounrt-item .delete-acc {
        position: absolute;
        right: 10px;
        top: 10px;
        padding: 10px;
        cursor: pointer;
        text-align: center;
        color: rgb(204, 204, 204);
    }

    .accounrt-item .delete-acc:hover {
        color: #2d2b5d;
    }

    .accounrt-item .account-address {
        max-width: 220px;
        margin-top: 12px;
        color: #9a9c9d;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }

    .accounrt-item .account-cont {
        margin-top: 10px;
    }

    .accounrt-item .icon-add-acc {
        font-size: 48px;
        color: #9a9c9d;
    }

    .accounrt-item .add-acc-des {
        color: #9a9c9d;
    }

    .demo-hist {
        margin-top: 200px;
    }

    .remove-acc {
        padding: 10px 0;
        width: 100%;
        color: #9a9c9d;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
        color: #f56c6c;
    }

    .el-dialog h2 {
        font-weight: 400;
    }

    .el-dialog .text,
    .el-dialog .el-textarea,
    .el-dialog .el-alert,
    .el-dialog .el-input,
    .el-dialog .text {
        margin-bottom: 10px;
    }

    .el-dialog .el-input .el-input-group__prepend {
        width: 200px;
    }

    .import-type-wrap {
        text-align: center;
    }

    .account-remark {
        width: 150px;
        margin: 0 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

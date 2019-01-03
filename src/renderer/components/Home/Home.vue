<template>
    <div class="page-czr-home">
        <div class="home-banner">
            <i class="iconfont icon-logo">&#xe650;</i>
            <div>
                <el-button size="small" plain @click="dialogSwitch.import = true">{{ $t('page_home.import_account') }}</el-button>
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
        <el-dialog :title="createInfo.step === 0 ? $t('page_home.create_dia.create_tit') : $t('page_home.create_dia.backup_tit') " :visible.sync="dialogSwitch.create" @open="initCreateInfo" width="60%">
            <template v-if="createInfo.step === 0">
                <el-alert v-if="createInfo.error" :title="createInfo.error" :closable="false" type="error" show-icon>
                </el-alert>
                <el-input v-model="createInfo.tag" :placeholder="$t('page_home.create_dia.placeholder_tag')">
                    <template slot="prepend">
                        <i class="el-icon-tickets"></i> {{$t('page_home.create_dia.create_tag')}}</template>
                </el-input>
                <el-input v-model="createInfo.pwd" :placeholder="$t('page_home.create_dia.placeholder_pwd')" type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home.create_dia.create_pwd')}}</template>
                </el-input>
                <el-input v-model="createInfo.repwd" :placeholder="$t('page_home.create_dia.placeholder_repwd')" type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home.create_dia.create_repwd')}}</template>
                </el-input>
                <div slot="footer">
                    <el-button @click="dialogSwitch.create = false">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="createAccount">{{ $t('confirm') }}</el-button>
                </div>
            </template>
            <template v-else-if="createInfo.step === 1">
                <el-alert :title="$t('page_home.create_dia.create_success')" :description="$t('page_home.create_dia.create_success_des')" :closable="false" type="success" show-icon>
                </el-alert>
                <el-input type="textarea" :rows="2" :value="createInfo.address">
                </el-input>
                <div slot="footer">
                    <el-button type="primary" @click="downloadKeystore(createInfo.address)">{{$t('page_home.create_dia.account_download_keystore')}}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- account import -->
        <el-dialog :title="$t('page_home.import_dia.tit')" :visible.sync="dialogSwitch.import" @open="initImportInfo" width="50%">
            <template>
                <el-alert v-if="importInfo.alert" :title="importInfo.alert.content" :closable="false" :type="importInfo.alert.type" show-icon>
                </el-alert>
                <template>
                    <div v-if="!importInfo.keystore" class="holder" @dragover.prevent.stop @drop.prevent.stop="importKeystore" > {{$t('page_home.import_dia.placeholder_keystore')}} </div>
                    <el-input v-model="importInfo.tag" :placeholder="$t('page_home.import_dia.placeholder_tag')">
                        <template slot="prepend">
                            <i class="el-icon-document"></i> {{$t('page_home.import_dia.create_tag')}}</template>
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
                <el-alert v-if="removeInfo.alert" :title="removeInfo.alert.content" :closable="false" :type="removeInfo.alert.type" show-icon>
                </el-alert>
                {{ $t('page_home.remove_dia.backup') }}

                <p class="remove-acc">
                    {{this.removeInfo.address}}
                </p>
                <el-input v-model="removeInfo.pwd" :placeholder="$t('page_home.remove_dia.placeholder_pwd')" type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home.remove_dia.input_pwd')}}</template>
                </el-input>
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogSwitch.remove = false">{{ $t('cancel') }}</el-button>
                <el-button type="danger" @click="removeAccountFn(removeInfo.address,removeInfo.pwd)">{{ $t('page_home.remove_dia.remove_confrim') }}</el-button>
            </span>
        </el-dialog>

    </div>

</template>

<script>
const fs = require("fs");
import { setInterval, clearInterval, clearTimeout, setTimeout } from "timers";
const { spawn, spawnSync } = require("child_process");
let self = null;
let getAccountTimer = null;
let accountErrorTimer = null;
let interVal = 500;
let updataBlockTimer={
    start:null,
    error:null
};
let updataBlockData={
    sourcesObj:null,//源文件
    targetAry:[]    //筛选后，需要更新的Blocks
}

const app = require("electron").remote.app;

app.on("will-quit", () => {
    //应用程序的窗口已经关闭，应用即将退出
    self.$nodeLogs.info("will-quit start");
    self.$czr.request.stop().then(data => {
        self.$nodeLogs.info("Stop成功");
        self.$nodeLogs.info(data);
    }).catch(error => {
        self.$nodeLogs.error("出错啦，建议重启钱包后再次操作");
        self.$nodeLogs.error(error);
    });
});

app.on("quit", () => {
    //应用程序正在退出
    self.$nodeLogs.info("quit start and stop");
    let currentPid = Number(sessionStorage.getItem("CanonChainPid"));
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
            dialogSwitch: {
                create: false,
                import: false,
                remove: false
            },
            fullscreenLoading:false,
            database: [],
            createInfo: {},
            importInfo: {},
            removeInfo: {},
            timerSwitch:{
                initAccount:null,
                updateSendBlock:null
            },
            intervalId: null
        };
    },
    created() {
        self = this;
        self.initDatabase();
        self.timerSwitch.initAccount = setInterval(() => {
            self.initDatabase();
        }, 1500);
    },
    mounted() {
        self.$walletLogs.info("HOME:页面渲染成功");
        if (!getAccountTimer) {
            self.runAccountsTimer();
            self.$walletLogs.info("HOME:需要新建 Account 定时器");
        } else {
            self.$walletLogs.info("HOME:Account定时器已经存在，无需新建");
        }
        //更新Block
        if(!updataBlockTimer.start){
            self.$walletLogs.info("HOME:需要新建updataBlock定时器");
            self.runUpdateBlocksTimer();
        }else{
            self.$walletLogs.info("HOME:updataBlock已经存在，无需建立");
        }
    },
    computed: {},
    beforeDestroy() {
        clearInterval(self.timerSwitch.initAccount);
        self.timerSwitch.initAccount = null;
    },
    methods: {
        initDatabase() {
            self.database = self.$db.get("czr_accounts").value();
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
                keystore: null
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

        initAccount(params) {
            let account = this.$db
                .get("czr_accounts")
                .find({ address: params.address })
                .value();
            if (account) {
                this.$message.error(
                    this.$t("page_home.import_dia.exist") +
                        '"' +
                        account.tag +
                        '"'
                );
                return;
            }
            this.$db
                .get("czr_accounts")
                .push(params)
                .write();
            //写入send_list的对应key
            if (
                !self.$db
                    .read()
                    .has("send_list."+params.address)
                    .value()
            ) {
                self.$db
                    .read()
                    .set("send_list."+params.address, [])
                    .write();
            }

            this.initDatabase();
        },

        // Create Account Start
        createAccount() {
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
            }else{
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

            if ( this.createInfo.pwd.length > 100) {
                this.createInfo.error = this.$t(
                    "page_home.create_dia.validate_long_password"
                );
                return;
            }

            // console.log(self.createInfo.pwd);
            // console.log(self.$czr.accounts)
            // self.$czr.accounts.create(self.createInfo.pwd).then(data => {
            //     console.log(data);
            // })
            self.$czr.request
                .accountCreate(self.createInfo.pwd)
                .then(data => {
                    if(data.error){
                        self.$message.error("出错啦 : 可能是非法的密码格式");
                        return;
                    }
                    self.createInfo.address = data.account;
                    let params = {
                        address: data.account,
                        tag:
                            self.createInfo.tag ||
                            self.$t("page_home.acc") +
                                (self.database.length + 1),
                        balance: 0,
                        send_list: []
                    };

                    self.initAccount(params);
                    self.createInfo.step = 1;
                })
                .catch(error => {
                    self.$walletLogs.error(
                        "Account Create Error",
                        error.message
                    );
                    self.$message.error("出错啦，建议重启钱包后再次操作");
                });
        },
        downloadKeystore(accVal) {
            self.$czr.request
                .accountExport(accVal)
                .then(data => {
                    // return data.json;
                    let link = document.createElement("a");
                    link.download = accVal+'.json';
                    link.style.display = "none";

                    let blob = new Blob([data.json]);
                    link.href = URL.createObjectURL(blob);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    self.dialogSwitch.create = false;
                })
                .catch(error => {
                    self.$walletLogs.error(
                        "Account Export Error",
                        error.message
                    );
                    self.$message.error("出错啦，建议重启钱包后再次操作");
                });
        },
        // getNowTime() {
        //     let date = new Date();
        //     let addZero = this.addZero;
        //     let LocalTime =
        //         date.getFullYear() +
        //         "-" +
        //         addZero(date.getMonth() + 1) +
        //         "-" +
        //         addZero(date.getDate()) +
        //         "-" +
        //         addZero(date.getHours()) +
        //         addZero(date.getMinutes()) +
        //         addZero(date.getSeconds());
        //     return LocalTime;
        // },
        addZero(val) {
            return val < 10 ? "0" + val : val;
        },
        // Create Account End

        //Import Start
        importKeystore(event) {
            let fileLength = event.dataTransfer.files.length;
            if(fileLength!=1){
                self.$message.error(
                    self.$t(
                        "page_home.import_dia.keystore_length_error"
                    )
                );
                return;
            }
            let targetFile = event.dataTransfer.files[0];

            fs.readFile(targetFile.path, "utf8", (err, data) => {
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
                } catch(e) {
                    targetJson = '';
                }
                console.log(targetJson);
                if(!targetJson){
                    self.$message.error(
                        self.$t(
                            "page_home.import_dia.keystore_format_error"
                        )
                    );
                    return;
                }

                if(!targetJson.account || targetJson.account.length!==54){
                    self.$message.error(
                        self.$t(
                            "page_home.import_dia.keystore_format_error"
                        )
                    );
                    return;
                }
                let importObjec = this.$db .read() .get("czr_accounts") .find({ address:targetJson.account }).value() // this.importInfo.keystore = JSON.parse(data);
                
                if(importObjec){
                    self.$message.error(
                        self.$t(
                            "page_home.import_dia.keystore_is_has"
                        )+' : '+targetJson.account
                    );
                    return;
                }
                
                this.importInfo.keystore = data;
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
            if (!this.importInfo.keystore) {
                this.importInfo.alert = {
                    content: this.$t(
                        "page_home.import_dia.validate_enter_keystore"
                    ),
                    type: "error"
                };
                return;
            }

            self.$czr.request
                .accountImport(self.importInfo.keystore)
                .then(data => {
                    if (data.success == "1") {
                        self.$message.success(
                            self.$t(
                                "page_home.import_dia.imported_account_success"
                            )
                        );
                        self.initDatabase();
                        self.importInfo.address = data.account;
                        self.dialogSwitch.import = false;
                    } else if (data.success == "0") {
                        self.$message.error(
                            self.$t(
                                "page_home.import_dia.validate_error_keystore"
                            )
                        );
                    }
                })
                .catch(error => {
                    self.$walletLogs.error(
                        "Account Import Error",
                        error.message
                    );
                    self.$message.error("出错啦，可能是不正确的钱包文件，请检查后再次操作");
                });
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
        removeAccountFn() {
            if (!this.removeInfo.pwd) {
                this.removeInfo.alert = {
                    content: this.$t("page_home.remove_dia.validate_password"),
                    type: "error"
                };
                return;
            }
            self.$czr.request
                .accountRemove(self.removeInfo.address, self.removeInfo.pwd)
                .then(data => {
                    // return data;
                    if (data.success == "1") {
                        self.$db
                            .get("czr_accounts")
                            .remove({ address: self.removeInfo.address })
                            .write();
                        self.$message.success(
                            self.$t("page_home.remove_dia.remove_success")
                        );
                        self.initDatabase();
                        self.dialogSwitch.remove = false;
                    } else {
                        self.$message.error(self.$t(data.error));
                    }
                })
                .catch(error => {
                    self.$walletLogs.error(
                        "Account Remove Error",
                        error.message
                    );
                    self.$message.error("出错啦，建议重启钱包后再次操作");
                });
        },
        // Remove End

        //get Account start
        runAccountsTimer() {
            getAccountTimer = setTimeout(() => {
                self.getAccounts();
            }, interVal || 5000);
        },
        getAccountsBalances(accountAry) {
            self.$czr.request
                .accountsBalances(accountAry)
                .then(data => {
                    return data.balances;
                })
                .catch(error => {
                    self.$walletLogs.info(
                        `Accounts Balances Error ${error.message}`
                    );
                })
                .then(data => {
                    for (let acc in data) {
                        self.$db
                            .read()
                            .get("czr_accounts")
                            .find({ address: acc })
                            .assign({ balance: parseInt(data[acc]["balance"]) })
                            .write();
                    }
                    self.runAccountsTimer();
                });
        },
        getAccounts() {
            self.$czr.request
                .accountList()
                .then(data => {
                    self.$walletLogs.info("收到accountList结果了");
                    return data.accounts;
                })
                .catch(error => {
                    self.$walletLogs.error("Account List Error", error.message);
                    accountErrorTimer = setTimeout(()=>{
                        self.runAccountsTimer();
                    },10)
                })
                .then(data => {
                    if(data ==undefined){
                        self.fullscreenLoading = true;
                        return;
                    }else{
                        // loading 结束
                        if (interVal) {
                            interVal = 0;
                        }
                        self.fullscreenLoading = false;
                    }
                    if (data=='') {
                        data = [];
                        self.$db
                            .read()
                            .set("czr_accounts", [])
                            .write();
                        self.runAccountsTimer();
                        return
                    }
                    //先把本地数据库存在，但是 data 里不存在的账户 删除
                    let database = self.$db.get("czr_accounts").value();
                    let databaseAry = [];
                    let localAcc;
                    for (let i = 0; i < database.length; i++) {
                        localAcc = database[i];
                        if (data.indexOf(localAcc.address) < 0) {
                            //不存在
                            self.$db
                                .get("czr_accounts")
                                .remove({ address: localAcc.address })
                                .write();
                            i--;
                        } else {
                            databaseAry.push(localAcc.address);
                        }
                    }

                    self.getAccountsBalances(data);
                    //获取余额
                    let flagLeng = databaseAry.length;
                    data.forEach((reqAry, index) => {
                        if (databaseAry.indexOf(reqAry) < 0) {
                            //数据库不存 在
                            let params = {
                                address: reqAry,
                                tag: "账号-" + ++flagLeng,
                                balance: 0,
                                send_list: []
                            };
                            self.$db
                                .get("czr_accounts")
                                .push(params)
                                .write();
                            //轮询节点下的账户，并写入send_list的对应key
                            if (
                                !self.$db
                                    .read()
                                    .has("send_list."+reqAry)
                                    .value()
                            ) {
                                self.$db
                                    .read()
                                    .set("send_list."+reqAry, [])
                                    .write();
                            }
                        }
                    });
                });
        },
        //get Account End

        // Update send block start
        runUpdateBlocksTimer(){
            //定时器控制时间
            updataBlockTimer.start = setTimeout(() => {
                self.chooseUpdateBlocksData();
            }, 5000);
        },
        chooseUpdateBlocksData(){
            //读取所有数据,并筛选不稳定的Hash合集
            updataBlockData.sourcesObj = self.$db.get("send_list").value();
            let curentAry=[];
            updataBlockData.targetAry=[];
            for(let key in updataBlockData.sourcesObj){
                curentAry = curentAry.concat(updataBlockData.sourcesObj[key]);
            }
            curentAry.forEach(ele=>{
                if(ele.is_stable==="0"){
                    updataBlockData.targetAry.push(ele.hash);
                }
            })
            self.startUpdateBlocks();
        },
        startUpdateBlocks(){
            //拿到最新数据，写入数据库，并准备下次
            self.$czr.request
                .getBlocks(updataBlockData.targetAry)
                .then(data => {
                    let obtainData = data.blocks || [];
                    obtainData.forEach(ele=>{
                        if(ele.is_stable==="1"){
                            self.$db.get("send_list."+ele.from).find({ hash: ele.hash })
                            .assign(ele).write()
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
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            let reg = /(\d+(?:\.)?)(\d{0,4})/;
            let regAry = reg.exec(tempVal);
            let integer = regAry[1];
            let decimal = regAry[2];
            if (decimal) {
                while (decimal.length < 4) {
                    decimal += "0";
                }
            }
            return integer + decimal;
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

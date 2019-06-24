<template>
    <div class="page-config" :style="{backgroundImage:backgroundImage}">
        <div class="icon-config">
            <i class="el-icon-loading"></i>
            <p class="config-test">{{ $t('page_config.config_detection') }} …</p>
            <p class="message">{{conMsg}}</p>
        </div>
        <el-dialog :title="$t('page_config.version_dialog.version_tit')" :visible.sync="versionDialogSwitch" width="60%"
                   :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" :modal="false">
            <span>{{ $t('page_config.version_dialog.wallet_disabled') }}</span>
            <span slot="footer" class="dialog-footer">
                <!-- <el-button @click="dropOut">退出钱包 </el-button> -->
                <el-button type="primary"
                           @click="downloadWallet">{{ $t('page_config.version_dialog.download_wallet') }}</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    const fs = require("fs");
    const path = require("path");
    const {remote, app, shell} = require("electron");
    const axios = require("axios");
    const download = require("download");
    const {spawn, spawnSync} = require("child_process");
    const packageJson = require("../../../../package.json");
    // const childPath = require("./child");
    let radom = "?radom=" + Math.random();
    // 检测是否在线
    import {setTimeout} from "timers";

    const dialog = remote.dialog


    let continued = 500;

    let self = null;
    export default {
        name: "Config",
        data() {
            return {
                versionDialogSwitch: false,
                latest_config: {},
                local_config: {},
                node_info: {},
                userDataPath: "",
                walletVer: packageJson.version,
                conMsg: "",
                backgroundImage: "url(" + require("@/assets/img/banner.png") + ")",
                binariesIsDownloaded: false
            };
        },
        created() {
            self = this;
            const APP = process.type === "renderer" ? remote.app : app;
            this.userDataPath = APP.getPath("userData");
            this.initConfig();
            this.validity();
        },
        computed: {},
        methods: {
            validity() {
                self.checkForNewConfig();
                /*
                let targeyUrl =
                    "http://www.canonchain.com/resource/file/canonchain/latest/czrVersion.json" + radom;
                axios.get(targeyUrl).then(response => {
                    let dataInfo = response.data;
                    let remoteVer = dataInfo.version;
                    //如果钱包版本和远程一致,就继续执行
                    if (self.walletVer == remoteVer) {
                        self.checkForNewConfig();
                    } else {
                        self.versionDialogSwitch = true;
                    }
                });
                */
            },
            dropOut() {
            },
            downloadWallet() {
                shell.openExternal("http://www.canonchain.com/");
            },
            initConfig() {
                self.latest_config = {
                    content: "",
                    BINARY_URL:
                    "http://www.canonchain.com/resource/file/canonchain/latest/clientBinaries.json" + radom
                };
                self.node_info = {
                    NODE_TYPE: "CanonChain",
                    binaryVersion: ""
                };
                self.conMsg = self.$t("page_config.content_msg.ready_test");
                self.$startLogs.info("准备检测配置文件");
            },

            checkForNewConfig() {
                self.conMsg = self.$t("page_config.content_msg.network_latest");
                self.$startLogs.info("检测是否有新的 CanonChain 节点文件 ");

                axios
                    .get(self.latest_config.BINARY_URL)
                    .then(response => {
                        self.latest_config.content = response.data;
                        self.conMsg = self.$t("page_config.content_msg.get_latest");
                        self.$startLogs.info(
                            "已获取到最新的节点配置信息",
                            response.data
                        );
                        self.checkLocalConfig();
                    })
                    .catch(error => {
                        self.conMsg = error; // 取本地的，本地取不到，取安装包的配置
                    });
            },
            checkLocalConfig() {
                self.conMsg = self.$t("page_config.content_msg.is_local");
                self.$startLogs.info("检测本地是否有节点文件");
                //读取本地二进制配置文件
                try {
                    // 现在加载本地json
                    self.local_config = JSON.parse(
                        fs
                            .readFileSync(
                                path.join(self.userDataPath, "clientBinaries.json")
                            )
                            .toString()
                    );
                    self.conMsg = self.$t("page_config.content_msg.already_local");
                    self.$startLogs.info("当前设备存在节点文件的配置信息");
                } catch (err) {
                    self.conMsg = self.$t("page_config.content_msg.not_local");
                    self.$startLogs.info(
                        "没有检测到节点文件的配置信息，可能是第一次运行"
                    );
                    if (self.latest_config.content) {
                        self.local_config = self.latest_config.content;
                        self.writeLocalConfig(self.latest_config.content);
                    }
                }
                self.isUpdate();
            },
            writeLocalConfig(json) {
                self.conMsg = self.$t("page_config.content_msg.config_write_local");
                self.$startLogs.info("将获取的节点信息文件，写入本地磁盘");

                fs.writeFileSync(
                    path.join(self.userDataPath, "clientBinaries.json"),
                    JSON.stringify(json, null, 2)
                );
            },
            isUpdate() {
                // 如果新的配置版本可用，然后询问用户是否希望更新
                let latestVer = this.latest_config.content.clients[
                    this.node_info.NODE_TYPE
                    ].version;
                let localVer = this.local_config.clients[this.node_info.NODE_TYPE]
                    .version;
                self.conMsg = self.$t("page_config.content_msg.whether_update_node");
                self.$startLogs.info(
                    `检测是否需要更新,本地${localVer},最新${latestVer}`
                );
                if (latestVer == localVer) {
                    self.conMsg = self.$t("page_config.content_msg.no_need");
                    self.$startLogs.info("本地 CanonChain 节点文件是最新的");
                    this.isDownload();
                } else {
                    self.conMsg = self.$t("page_config.content_msg.need");
                    self.$startLogs.info("本地 CanonChain 节点文件是老版本");
                    this.isDownload(true);
                }
            },
            isDownload(flag) {
                let self = this;
                // 准备节点信息
                const platform = process.platform
                    .replace("darwin", "mac")
                    .replace("win32", "win")
                    .replace("freebsd", "linux")
                    .replace("sunos", "linux");

                this.node_info.binaryVersion = this.latest_config.content.clients[
                    this.node_info.NODE_TYPE
                    ].platforms[platform][process.arch].download;

                let options = {
                    directory: path.join(this.userDataPath, "download"),
                    headers: {
                        'Connection': 'keep-alive'
                    },
                    extract: true,
                    timeout: 1000 * 60
                };

                if (flag) {
                    self.conMsg = self.$t("page_config.content_msg.no");
                    self.$startLogs.info(
                        "正在下载节点程序,请耐心等待",
                        this.node_info.binaryVersion.url + radom,
                        options.directory
                    );

                    download(
                        this.node_info.binaryVersion.url + radom,
                        options.directory,
                        options
                    ).then(() => {
                        this.writeLocalConfig(this.latest_config.content);
                        self.conMsg = self.$t("page_config.content_msg.already_downloaded");
                        self.$startLogs.info("节点程序已经下载好");
                        self.runCanonChain();
                    }).catch(error => {
                        self.$startLogs.info("Error");
                        self.$startLogs.info(error);
                    })
                } else {
                    //判断是否有 CanonChain
                    self.conMsg = self.$t("page_config.content_msg.is_local_node");
                    self.$startLogs.info("检测当前设备是否有 CanonChain 节点文件");
                    try {
                        // console.log(options.directory)
                        self.$startLogs.info(
                            "本地的节点文件",
                            path.join(
                                options.directory,
                                this.node_info.binaryVersion.bin
                            )
                        );
                        let stats = fs.statSync(
                            path.join(
                                options.directory,
                                this.node_info.binaryVersion.bin
                            )
                        );
                        self.conMsg = self.$t("page_config.content_msg.have");
                        self.$startLogs.info("当前设备已存在 CanonChain 节点文件");
                        self.runCanonChain();
                    } catch (err) {
                        self.conMsg = self.$t("page_config.content_msg.no");
                        self.$startLogs.info(
                            "正在下载节点程序,请耐心等待",
                            this.node_info.binaryVersion.url + radom,
                            options.directory
                        );

                        download(
                            this.node_info.binaryVersion.url + radom,
                            options.directory,
                            options
                        ).then(() => {
                            self.conMsg = self.$t("page_config.content_msg.already_downloaded");
                            self.$startLogs.info("节点程序已经下载好");
                            self.runCanonChain();
                        }).catch(error => {
                            self.$startLogs.info("Error");
                            self.$startLogs.info(error);
                        })
                    }
                }

            },
            specifyNodeDir() {
                this.conMsg = this.$t("page_config.content_msg.specifyDataDir");
                // dialog.showOpenDialog @return {String[] | undefined}
                const res = dialog.showOpenDialog({
                    title: self.$t("page_config.content_msg.specifyDataDir"),
                    // defaultPath: '',
                    properties: ['openDirectory'],
                })
                this.conMsg = this.$t("page_config.content_msg.ready_start");
                if (!res) return
                return res[0]
            },
            runCanonChain() {
                let nodePath = path.join(
                    this.userDataPath,
                    "download",
                    this.node_info.binaryVersion.bin
                );
                self.$startLogs.info("准备启动 CanonChain :", nodePath);
                self.conMsg = self.$t("page_config.content_msg.ready_start");

                //如果节点启动了，就不再启用了
                self.$czr.request
                    .status()
                    .then(data => {
                        // console.log("已经有节点，不需要启动");
                        self.$startLogs.info("已经有节点，不需要启动;");
                        self.onlineTimer()
                    })
                    .catch(error => {
                        // console.log("本地没有节点，需要启动");
                        self.$startLogs.info("本地没有节点，需要启动");
                        let dir
                        // 读取设置中的节点数据存储路径
                        const dirSet = self.$db.get('czr_setting.canonchain_data_path').value()
                        if (dirSet) {
                            dir = dirSet
                        } else {
                            dir = self.specifyNodeDir()
                        }
                        if (!dir) {
                            dir = path.join(remote.app.getPath('appData'), "Canonchain")
                        }
                        let ls = spawn(nodePath, [
                            "--daemon",
                            "--rpc",
                            "--rpc_control",
                            "--data_path",
                            dir
                        ], {
                            stdio: 'ignore'
                        });
                        self.$db.set('czr_setting.canonchain_data_path', dir).write()

                        self.conMsg = self.$t("page_config.content_msg.enter_wallet");
                        self.$startLogs.info("CanonChainPid", ls.pid);
                        sessionStorage.setItem("CanonChainPid", ls.pid);
                        //进程守护
                        self.guardNode(ls, nodePath);
                        self.onlineTimer();
                        // self.$router.push({ path: "home" });
                    });
            },
            onlineTimer() {
                self.timer = setTimeout(() => {
                    self.$czr.request
                        .status()
                        .then(res => {
                            //清除定时器，
                            clearTimeout(self.timer);
                            self.timer = null;
                            self.$startLogs.error("Page Config : Online Success");
                            self.$router.push({path: "home"});
                        })
                        .catch(error => {
                            self.onlineTimer();
                            self.online = false;
                            self.$startLogs.error(
                                "Page Config : Online Error",
                                error.message
                            );
                            self.$startLogs.error(error);
                        });
                }, continued);
            },
            guardNode(ls, nodePath) {
                self.$nodeLogs.info("守护进程开启", ls.pid);
                ls.on("exit", () => {
                    const dir = self.$db.get('czr_setting.canonchain_data_path').value()
                    ls = spawn(path.join(nodePath), [
                        "--daemon",
                        "--rpc",
                        "--rpc_control",
                        "--data_path",
                        dir
                    ], {
                        stdio: 'ignore'
                    });
                    sessionStorage.setItem("CanonChainPid", ls.pid);
                    self.$nodeLogs.info("守护进程生效，新的CanonChainPid", ls.pid);
                    self.guardNode(ls, nodePath);
                });
                // ls.stdout.on('data', (data) => {
                //   self.$walletLogs.info(`stdout: ${data}`);
                // });

                // ls.stderr.on('data', (data) => {
                //   self.$walletLogs.info(`stderr: ${data}`);
                // });
            }
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .page-config {
        height: 100%;
        position: fixed;
        top: 0;
        left: 0;
        color: #fff;
        /* background-image: radial-gradient(50% 50%, #57509E 29%, #353469 93%, #333366 100%); */
        /* background-color: #333366; */
        /* background: url("../img/banner.png") no-repeat center center; */
        background: no-repeat center center;
        color: #000;
        width: 100%;
        -webkit-user-select: none;
    }
    .icon-config {
        width: 100%;
        text-align: center;
        margin-top: 100px;
    }
    .icon-config .el-icon-loading {
        font-size: 42px;
        margin-bottom: 10px;
        color: #fff;
    }
    .config-test {
        color: #fff;
        font-size: 16px;
    }
    .icon-config .message {
        margin-top: 50px;
        color: #fff;
    }
</style>

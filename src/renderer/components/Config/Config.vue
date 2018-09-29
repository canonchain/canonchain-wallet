<template>
    <div class="page-config" :style="{backgroundImage:backgroundImage}">
        <div class="icon-config">
            <i class="el-icon-loading"></i>
            <p class="config-test">配置检测中…</p>
            <p class="message">{{conMsg}}</p>
        </div>
        <el-dialog title="版本更新提示" :visible.sync="versionDialogSwitch" width="60%" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" :modal="false">
            <span>CanonChain Wallet 已经有新版本，当前版本已停用，请至官网下载最新版钱包。</span>
            <span slot="footer" class="dialog-footer">
                <!-- <el-button @click="dropOut">退出钱包 </el-button> -->
                <el-button type="primary" @click="downloadWallet">去官网下载最新版钱包</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
const fs = require("fs");
const path = require("path");
const { remote, app, shell } = require("electron");
const axios = require("axios");
const download = require("download");
const { spawn, spawnSync, exec, execFile, fork } = require("child_process");
const packageJson = require("../../../../package.json");
// const childPath = require("./child");

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
            let radom = Math.random();
            let targeyUrl =
                "http://www.canonchain.com/resource/file/canonchain/latest/czrVersion.json" +
                "?radom=" +
                radom;
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
        },
        dropOut() {},
        downloadWallet() {
            shell.openExternal("http://www.canonchain.com/");
        },
        initConfig() {
            let radom = Math.random();
            self.latest_config = {
                content: "",
                BINARY_URL:
                    "http://www.canonchain.com/resource/file/canonchain/latest/clientBinaries.json" +
                    "?radom=" +
                    radom
            };
            self.node_info = {
                NODE_TYPE: "CanonChain",
                binaryVersion: ""
            };
            self.conMsg = "准备检测配置文件";
            self.$startLogs.info("准备检测配置文件");
        },

        checkForNewConfig() {
            self.conMsg = "检测是否有新的 CanonChain 节点文件";
            self.$startLogs.info("检测是否有新的 CanonChain 节点文件 ");

            axios
                .get(self.latest_config.BINARY_URL)
                .then(response => {
                    self.latest_config.content = response.data;
                    self.conMsg = "已获取到最新的节点配置信息";
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
            self.conMsg = "检测本地是否有节点文件";
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
                self.conMsg = "当前设备存在节点文件的配置信息";
                self.$startLogs.info("当前设备存在节点文件的配置信息");
            } catch (err) {
                self.conMsg = "没有检测到节点文件的配置信息，可能是第一次运行";
                self.$startLogs.info(
                    "没有检测到节点文件的配置信息，可能是第一次运行"
                );
                if (self.latest_config.content) {
                    self.local_config = self.latest_config.content;
                    self.writeLocalConfig(self.latest_config.content);
                } else {
                    self.conMsg = "无法加载本地或远程配置 无法继续!"; // 加载安装包的配置
                    self.$startLogs.info("无法加载本地或远程配置 无法继续!");
                }
            }
            self.isUpdate();
        },
        writeLocalConfig(json) {
            self.conMsg = "将获取的节点信息文件，写入本地磁盘";
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
            this.conMsg = "检测是否需要更新";
            self.$startLogs.info(
                `检测是否需要更新,本地${localVer},最新${latestVer}`
            );
            if (latestVer == localVer) {
                this.conMsg = "本地 CanonChain 节点文件是最新的";
                self.$startLogs.info("本地 CanonChain 节点文件是最新的");
                this.isDownload();
            } else {
                this.conMsg = "本地 CanonChain 节点文件是老版本";
                self.$startLogs.info("本地 CanonChain 节点文件是老版本");
                this.writeLocalConfig(this.latest_config.content);
                this.isDownload();
            }
        },
        isDownload() {
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
                dirname: "filename",
                extract: true,
                timeout: 1000 * 60
            };

            //判断是否有 CanonChain
            this.conMsg = "检测当前设备是否有 CanonChain 节点文件";
            self.$startLogs.info("检测当前设备是否有 CanonChain 节点文件");
            try {
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
                this.conMsg = "当前设备已存在 CanonChain 节点文件";
                self.$startLogs.info("当前设备已存在 CanonChain 节点文件");
                self.runCanonChain();
            } catch (err) {
                this.conMsg = "正在下载节点程序,请耐心等待";
                self.$startLogs.info(
                    "正在下载节点程序,请耐心等待",
                    this.node_info.binaryVersion.url,
                    options.directory
                );

                download(
                    this.node_info.binaryVersion.url,
                    options.directory,
                    options
                ).then(() => {
                    this.conMsg = "节点程序已经下载好，准备启动";
                    self.$startLogs.info("节点程序已经下载好");
                    self.runCanonChain();
                });
            }
        },
        runCanonChain() {
            let nodePath = path.join(
                this.userDataPath,
                "download",
                this.node_info.binaryVersion.bin
            );
            self.$startLogs.info("准备启动 CanonChain :", nodePath);
            this.conMsg = "准备启动节点";

            //如果节点启动了，就不再启用了 TODO 改RPC接口名
            self.$czr.request
                .accountList()
                .then(data => {
                    console.log("已经有节点，不需要启动");
                    self.$startLogs.info("已经有节点，不需要启动;");
                    self.$router.push({ path: "home" });
                })
                .catch(error => {
                    console.log("本地没有节点，需要启动");
                    self.$startLogs.info("本地没有节点，需要启动");
                    let ls = spawn(nodePath, [
                        "--daemon",
                        "--rpc_enable",
                        "--rpc_enable_control"
                    ]);
                    // let ls = exec(nodePath+' --daemon --rpc_enable --rpc_enable_control');

                    // let ls = fork("./child");

                    self.conMsg = "节点启动成功，准备进入钱包.";
                    self.$startLogs.info("CanonChainPid", ls.pid);
                    sessionStorage.setItem("CanonChainPid", ls.pid);
                    //进程守护
                    self.guardNode(ls, nodePath);
                    self.$router.push({ path: "home" });
                });
        },
        guardNode(ls, nodePath) {
            self.$nodeLogs.info("守护进程开启", ls.pid);
            ls.on("exit", () => {
                ls = spawn(path.join(nodePath), [
                    "--daemon",
                    "--rpc_enable",
                    "--rpc_enable_control"
                ]);
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

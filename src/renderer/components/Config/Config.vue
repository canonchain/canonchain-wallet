<template>
  <div class="page-config" :style="{ backgroundImage: backgroundImage }">
    <div class="icon-config">
      <i class="el-icon-loading"></i>
      <p class="config-test">{{ $t("page_config.config_detection") }} …</p>
      <p class="message">{{ conMsg }}</p>
    </div>
    <el-dialog
      :title="$t('page_config.version_dialog.version_tit')"
      :visible.sync="versionDialogSwitch"
      width="60%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      :modal="false"
    >
      <span>{{ $t("page_config.version_dialog.wallet_disabled") }}</span>
      <span slot="footer" class="dialog-footer">
        <!-- <el-button @click="dropOut">退出钱包 </el-button> -->
        <el-button type="primary" @click="downloadWallet">{{
          $t("page_config.version_dialog.download_wallet")
        }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 检测是否在线
import { setTimeout } from "timers";

const fs = require("fs");
const path = require("path");
const { remote, shell, ipcRenderer } = require("electron");
const axios = require("axios");
const download = require("download");
const { spawn, spawnSync } = require("child_process");
const packageJson = require("../../../../package.json");
const banner = require("@/assets/img/banner.png");
// const childPath = require("./child");
const radom = `?radom=${Math.random()}`;

const { app } = remote;
const { dialog } = remote;

const continued = 1000;

let self = null;
export default {
  name: "Config",
  data() {
    return {
      nedb_language: this.$nedb.setting_language,
      checkUpdateEnd: process.env.NODE_ENV !== "production",
      versionDialogSwitch: false,
      latest_config: {},
      local_config: {},
      node_info: {},
      userDataPath: "",
      walletVer: packageJson.version,
      conMsg: "",
      backgroundImage: `url(${banner})`,
      binariesIsDownloaded: false,
      canonchainProcess: null,
      countTry: 0
    };
  },
  beforeCreate() {
    // ipcRenderer.send('check-vc2015')
    // 触发更新的检测
    ipcRenderer.send("update", "ping-update");
  },
  created() {
    self = this;
    const APP = process.type === "renderer" ? remote.app : app;
    this.userDataPath = APP.getPath("userData");
    this.initConfig();
    this.validity();
    ipcRenderer.on("check-update-end", () => {
      self.$startLogs.info("接收到主进程的 check-update-end 触发");
      this.checkUpdateEnd = true;
    });
    // check vc2015 success
    ipcRenderer.on("vc2015-exists", () => {
      self.$startLogs.info("接收到主进程的 vc2015-exists 触发");
      this.vcChecked = true;
      // this.$czr.request.status()
      //     .then(() => {
      //         this.canonchainProcess.removeAllListeners('error')
      //         this.canonchainProcess.removeAllListeners('close')
      //         this.guardNode(this.canonchainProcess, path.join(
      //             this.userDataPath,
      //             "download",
      //             this.node_info.binaryVersion.bin
      //         ))
      //     })
      //     .catch(err => {
      //
      //     })
      // 继续尝试启动节点
      // this.tryConnentNode()
    });
    // self.demo();
  },
  computed: {},
  methods: {
    async demo() {
      try {
        // find
        // const langRes = await self.nedb_language.sort({ createdAt: -1 }).find();
        await self.nedb_language.sort({ createdAt: -1 }).find();
        // console.log("langRes", langRes);
        // count
        // const countRes = await self.nedb_language.count();
        await self.nedb_language.count();
        // console.log("countRes", countRes);

        // insert
        // const insertRes = await this.$nedb.account_tx.insert([
        //   { name: "11", age: 14 },
        //   { name: "12", age: 14 },
        //   { name: "13", age: 14 },
        //   { name: "14", age: 14 },
        //   { name: "15", age: 14 },
        //   { name: "16", age: 14 }
        // ]);
        await this.$nedb.account_tx.insert([
          { name: "11", age: 14 },
          { name: "12", age: 14 },
          { name: "13", age: 14 },
          { name: "14", age: 14 },
          { name: "15", age: 14 },
          { name: "16", age: 14 }
        ]);
        // console.log("insertRes", insertRes);

        // remove
        // const aloneRemoverRes = await this.$nedb.account_tx.remove({
        //   name: "15"
        // });
        await this.$nedb.account_tx.remove({
          name: "15"
        });
        // console.log("aloneRemoverRes", aloneRemoverRes);

        // multi remover
        // const removerRes = await this.$nedb.account_tx.remove(
        //   { name: { $in: ["13", "14"] } },
        //   { multi: true }
        // );
        await this.$nedb.account_tx.remove(
          { name: { $in: ["13", "14"] } },
          { multi: true }
        );
        // console.log("removerRes", removerRes);

        // update
        // const aloneUpdateRes = await this.$nedb.account_tx.update(
        //   { name: "16" },
        //   { $set: { age: 199 } }
        // );
        await this.$nedb.account_tx.update(
          { name: "16" },
          { $set: { age: 199 } }
        );
        // console.log("aloneUpdateRes", aloneUpdateRes);

        // findone
        // const findoneRes = await this.$nedb.account_tx.findOne({ name: "11" });
        await this.$nedb.account_tx.findOne({ name: "11" });
        // console.log("findoneRes", findoneRes);

        // find
        // const findRes = await this.$nedb.account_tx.find();
        await this.$nedb.account_tx.find();
        // console.log("findRes", findRes);
      } catch (error) {
        this.$walletLogs.error("捕获错误", error.stack);
        // console.error("捕获错误");
        // console.error(error);
      }
    },
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
    dropOut() {},
    downloadWallet() {
      shell.openExternal("http://www.canonchain.com/");
    },
    initConfig() {
      self.latest_config = {
        content: "",
        BINARY_URL: `https://canonchain-public.oss-cn-hangzhou.aliyuncs.com/wallet/latest/clientBinaries.json${radom}`
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
      self.$startLogs.info(
        `检测是否有新的 Canonchain 节点文件，从${self.latest_config.BINARY_URL}获取`
      );
      axios
        .get(self.latest_config.BINARY_URL)
        .then(response => {
          self.latest_config.content = response.data;
          self.conMsg = self.$t("page_config.content_msg.get_latest");
          self.$startLogs.info("已获取到最新的节点配置信息", response.data);
          self.checkLocalConfig();
        })
        .catch(error => {
          self.$startLogs.error(`获取最新的节点配置信息失败, ${error.message}`);
          self.conMsg = "网络连接失败，请检查网络连接"; // 取本地的，本地取不到，取安装包的配置
          dialog.showMessageBox(
            {
              type: "info",
              message: "网络连接失败，请检查网络连接"
            },
            () => {
              app.quit();
            }
          );
        });
    },
    checkLocalConfig() {
      self.conMsg = self.$t("page_config.content_msg.is_local");
      self.$startLogs.info("检测本地是否有节点文件");
      // 读取本地二进制配置文件
      try {
        // 现在加载本地json
        self.local_config = JSON.parse(
          fs
            .readFileSync(path.join(self.userDataPath, "clientBinaries.json"))
            .toString()
        );
        self.conMsg = self.$t("page_config.content_msg.already_local");
        self.$startLogs.info("当前设备存在节点文件的配置信息");
      } catch (err) {
        self.conMsg = self.$t("page_config.content_msg.not_local");
        self.$startLogs.info("没有检测到节点文件的配置信息，可能是第一次运行");
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
      // console.log('this.node_info.NODE_TYPE', this.node_info.NODE_TYPE)
      // console.log('this.latest_config.content.clients', this.latest_config.content.clients)
      const latestVer = this.latest_config.content.clients[
        this.node_info.NODE_TYPE
      ].version;
      const localVer =
        this.local_config &&
        this.local_config.clients &&
        this.local_config.clients[this.node_info.NODE_TYPE] &&
        this.local_config.clients[this.node_info.NODE_TYPE].version; // 破坏性更新，version of undefined
      self.conMsg = self.$t("page_config.content_msg.whether_update_node");
      self.$startLogs.info(`检测是否需要更新,本地${localVer},最新${latestVer}`);
      if (latestVer === localVer) {
        self.conMsg = self.$t("page_config.content_msg.no_need");
        self.$startLogs.info("本地 Canonchain 节点文件是最新的");
        // this.isDownload();
        this.writeChmod();
      } else {
        self.conMsg = self.$t("page_config.content_msg.need");
        self.$startLogs.info("本地 Canonchain 节点文件是老版本");
        // this.isDownload(true);
        this.writeChmod(true);
      }
    },
    // 解决MAC平台，升级节点时的文件权限问题
    writeChmod(flag) {
      // 如果是MAC系统，文件可能没有写入权限，先设置权限再处理
      if (process.platform === "darwin") {
        fs.open(
          path.join(this.userDataPath, "download/canonchain"),
          "r",
          function fsOpenCb(err, fd) {
            if (err) {
              // 文件不存在，直接去下载
              self.$startLogs.info("检测节点文件不存在，直接去下载");
              self.isDownload(flag);
              return;
            }
            // 文件存在
            fs.fstat(fd, function fstatCb(e, stat) {
              if (e) {
                // 读取错误
                self.$startLogs.info("检测节点原权限，直接去下载");
                self.isDownload(flag);
                return;
              }
              self.$startLogs.info("原权限", stat.mode);
              // 改权限
              if (stat.mode !== 33261) {
                self.$startLogs.info("文件权限必须修改，否则起不来");
                fs.fchmod(fd, "755", function fchmodCb(error) {
                  if (error) {
                    self.$startLogs.info("修改失败，需要删除");
                    self.isDownload(flag);
                    return;
                  }
                  self.$startLogs.info("文件权限已经修改成功了");
                  self.isDownload(flag);
                });
              } else {
                self.$startLogs.info("文件权限不需要修改");
                self.isDownload(flag);
              }
            });
          }
        );
      } else {
        this.isDownload(flag);
      }
    },
    isDownload(flag) {
      // const self = this;
      // 准备节点信息
      const platform = process.platform
        .replace("darwin", "mac")
        .replace("win32", "win")
        .replace("freebsd", "linux")
        .replace("sunos", "linux");

      this.node_info.binaryVersion = this.latest_config.content.clients[
        this.node_info.NODE_TYPE
      ].platforms[platform][process.arch].download;

      const options = {
        directory: path.join(this.userDataPath, "download"),
        headers: {
          Connection: "keep-alive"
        },
        extract: true,
        strip: 1,
        mode: "755",
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
          // `http://canonchain-public.oss-cn-hangzhou.aliyuncs.com/node/win/canonchain.zip?t=${Date.now()}`,
          options.directory,
          options
        )
          .then(() => {
            this.writeLocalConfig(this.latest_config.content);
            self.conMsg = self.$t("page_config.content_msg.already_downloaded");
            self.$startLogs.info("节点程序已经下载好");
            self.runCanonchain();
          })
          .catch(error => {
            self.$startLogs.info("Error");
            self.$startLogs.info(error);
          });
      } else {
        // 判断是否有 CanonChain
        self.conMsg = self.$t("page_config.content_msg.is_local_node");
        self.$startLogs.info("检测当前设备是否有 Canonchain 节点文件");
        try {
          // console.log(options.directory)
          self.$startLogs.info(
            "本地的节点文件",
            path.join(options.directory, this.node_info.binaryVersion.bin)
          );
          fs.statSync(
            path.join(options.directory, this.node_info.binaryVersion.bin)
          );
          self.conMsg = self.$t("page_config.content_msg.have");
          self.$startLogs.info("当前设备已存在 Canonchain 节点文件");
          self.runCanonchain();
        } catch (err) {
          self.conMsg = self.$t("page_config.content_msg.no");
          self.$startLogs.info(
            "正在下载节点程序,请耐心等待",
            this.node_info.binaryVersion.url + radom,
            options.directory
          );

          download(
            this.node_info.binaryVersion.url + radom,
            // `http://canonchain-public.oss-cn-hangzhou.aliyuncs.com/node/win/canonchain.zip?t=${Date.now()}`,
            options.directory,
            options
          )
            .then(() => {
              self.conMsg = self.$t(
                "page_config.content_msg.already_downloaded"
              );
              self.$startLogs.info("节点程序已经下载好");
              self.runCanonchain();
            })
            .catch(error => {
              self.$startLogs.info("Error");
              self.$startLogs.info(error);
            });
        }
      }
    },
    specifyNodeDir() {
      this.conMsg = this.$t("page_config.content_msg.specifyDataDir");
      // dialog.showOpenDialog @return {String[] | undefined}
      const res = dialog.showOpenDialog({
        title: self.$t("page_config.content_msg.specifyDataDir"),
        // defaultPath: '',
        properties: ["openDirectory"]
      });
      this.conMsg = this.$t("page_config.content_msg.ready_start");
      if (!res) return null;
      return res[0];
    },
    runCanonchain() {
      const nodePath = path.join(
        this.userDataPath,
        "download",
        this.node_info.binaryVersion.bin
      );
      self.$startLogs.info("准备启动 Canonchain :", nodePath);
      self.conMsg = self.$t("page_config.content_msg.ready_start");

      // 如果节点启动了，就不再启用了
      self.$czr.request
        .status()
        .then(() => {
          // console.log("已经有节点，不需要启动");
          self.$startLogs.info("已经有节点，不需要启动;");
          self.onlineTimer();
        })
        .catch(async error => {
          // console.log("本地没有节点，需要启动");
          self.$startLogs.info("本地没有节点，需要启动", error.stack);
          this.conMsg = this.$t("page_config.content_msg.specifyDataDir");
          let dir;
          // 读取设置中的节点数据存储路径
          // const dirSet = self.$db.get('czr_setting.canonchain_data_path').value()
          let dirSet = await self.$nedb.setting_node_path.findOne({
            name: "node_path"
          });
          dirSet = dirSet.path;
          if (dirSet) {
            dir = dirSet;
          } else {
            dir = self.specifyNodeDir();
          }
          if (!dir) {
            dir = path.join(remote.app.getPath("appData"), "Canonchain");
          }
          this.canonchainProcess = spawn(
            nodePath,
            [
              "--daemon",
              "--rpc",
              "--rpc_port=8765",
              "--rpc_control",
              "--data_path",
              dir
            ],
            {
              stdio: ["ignore", "ignore", "pipe"]
            }
          );
          this.canonchainProcess.on("error", err => {
            this.$walletLogs.error("canonchain子进程error事件", err.stack);
          });
          this.canonchainProcess.on("close", (code, sig) => {
            this.$walletLogs.error(
              `canonchain子进程close, 收到信号 ${sig} 而终止, code:${code}`
            );
            if (process.platform === "win32") {
              this.vcChecking = true;
              ipcRenderer.send("check-vc2015");
            }
          });
          this.canonchainProcess.on("exit", (code, sig) => {
            this.$walletLogs.error(
              `canonchain子进程exit, 收到信号 ${sig} 而终止, code:${code}`
            );
          });
          setTimeout(() => {
            this.canonchainProcess.removeAllListeners("error");
            this.canonchainProcess.removeAllListeners("close");
            this.canonchainProcess.removeAllListeners("exit");
            this.guardNode(this.canonchainProcess, nodePath);
            // vc错误在节点开启时会立刻出现，如果两秒内都没有出现，认为vc已安装
            if (process.platform === "win32" && !this.vcChecking)
              this.vcChecked = true;
          }, 2000);
          // ls.stderr.on('data', (data) => {
          //     ls.removeAllListeners('exit')
          //     self.$alert(`Error: ${data}`, self.$t('page_config.start_node_err'), {
          //         confirmButtonText: self.$t('page_config.confirm'),
          //         callback: () => {
          //             remote.app.quit()
          //         }
          //     });
          // });
          this.canonchainProcess.stderr.on("data", data => {
            self.$startLogs.error(`canonchain stderr: ${data}`);
          });
          // self.$db.set('czr_setting.canonchain_data_path', dir).write()
          /**
           * @wgy:写入节点存储路径
           */
          await self.$nedb.setting_node_path.update(
            { name: "node_path" },
            { $set: { path: dir } }
          );
          self.conMsg = self.$t("page_config.content_msg.enter_wallet");
          self.$startLogs.info("CanonchainPid", this.canonchainProcess.pid);
          sessionStorage.setItem("CanonchainPid", this.canonchainProcess.pid);
          // 进程守护
          // self.guardNode(ls, nodePath);
          self.onlineTimer();
        });
    },
    onlineTimer() {
      if (self.timer) {
        clearInterval(self.timer);
      }
      self.$startLogs.info("setInterval 00");
      self.timer = setInterval(() => {
        self.$startLogs.info("setInterval 11", this.checkUpdateEnd);
        self.$czr.request
          .status()
          .then(() => {
            if (process.platform === "win32" && !this.vcChecked) {
              self.$startLogs.info("Page Config : Waiting VC++ checking");
              return;
            }

            if (!this.checkUpdateEnd) {
              self.$startLogs.info("Page Config : Waiting update checking");
              return;
            }

            // 清除定时器，
            clearInterval(self.timer);
            self.timer = null;
            self.$startLogs.info("Page Config : Online Success");
            self.$router.push({ path: "home" });
          })
          .catch(error => {
            // console.log('status 失败',this.countTry)
            this.countTry += 1;
            if (this.countTry > 60) {
              clearInterval(self.timer);
              self.$startLogs.error("节点未能启动，请联系客服获取支持");
              dialog.showMessageBox(
                {
                  type: "info",
                  message: "连接节点失败"
                },
                function showMessageBoxCb() {
                  remote.app.quit();
                }
              );
              return;
            }
            self.onlineTimer();
            self.online = false;
            self.$startLogs.error("Page Config : Online Error", error.message);
            self.$startLogs.error(error);
          });
      }, continued);
    },
    guardNode(ls, nodePath) {
      self.$nodeLogs.info("守护进程开启", ls.pid);
      sessionStorage.setItem("CanonchainPid", ls.pid);
      ls.on("exit", async () => {
        // const dir = self.$db.get('czr_setting.canonchain_data_path').value()
        let dir = await self.$nedb.setting_node_path.findOne({
          name: "node_path"
        });
        dir = dir.path;
        // console.log(dir);
        const subProcess = spawn(
          path.join(nodePath),
          [
            "--daemon",
            "--rpc",
            "--rpc_port=8765",
            "--rpc_control",
            "--data_path",
            dir
          ],
          {
            stdio: ["ignore", "ignore", "pipe"]
          }
        );
        subProcess.stderr.on("data", data => {
          this.$startLogs.error(`canonchain stderr: ${data}`);
          //     ls.removeAllListeners('exit')
          //     self.$alert(`Error: ${data}`, self.$t('page_config.start_node_err'), {
          //         confirmButtonText: self.$t('page_config.confirm'),
          //         callback: () => {
          //             remote.app.quit()
          //         }
          //     });
        });
        sessionStorage.setItem("CanonchainPid", subProcess.pid);
        self.$nodeLogs.info("守护进程生效，新的CanonchainPid", subProcess.pid);
        self.guardNode(subProcess, nodePath);
      });
      // ls.stdout.on('data', (data) => {
      //   self.$walletLogs.info(`stdout: ${data}`);
      // });

      // ls.stderr.on('data', (data) => {
      //   self.$walletLogs.info(`stderr: ${data}`);
      // });
    }
  },
  mounted() {
    // MyUndefinedFn();
  },
  beforeDestroy() {
    clearInterval(this.timer);
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

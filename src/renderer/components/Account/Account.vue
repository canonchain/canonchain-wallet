<template>
    <div class="page-account-detail">
        <div class="account-banner">
            <div class="active-icon">
                <router-link :to="'/transfer?account=' + address" tag="div" class="acc-interactive">
                    <i class="iconfont">&#xe605;</i>
                    <p class="icon-des">{{ $t('page_account.active_icon.go_transfer') }}</p>
                </router-link>
                <div class="acc-interactive" @click="exportKeystore">
                    <i class="iconfont">&#xe638;</i>
                    <p class="icon-des">{{ $t('page_account.active_icon.import_keystore') }}</p>
                </div>

                <div class="acc-interactive" @click="showQrCode">
                    <i class="iconfont">&#xe628;</i>
                    <p class="icon-des">{{ $t('page_account.active_icon.qrcode') }}</p>
                </div>
            </div>

            <div class="account-center">
                <div class="account-alias-wrap">
                    <span class="text-sub-color account-remark">{{ accountInfo.tag }}</span>
                    <i class="iconfont icon-edit-alias" @click="dialogSwitch.editName = true"> &#xe604; </i>
                </div>
                <div class="account-has-assets">
                    <h1 class="account-assets">{{ accountInfo.balance | toCZRVal }}</h1>
                    <span>{{ $t('unit.czr') }}</span>
                </div>
                <div class="account-address-wrap">
                    <span class="text-sub-color">{{ address}}</span>
                    <i class="iconfont icon-address-copy" @click="copyAddress"> &#xe645; </i>
                </div>
            </div>

        </div>

        <div class="account-content">
            <!-- <h2 class="transfer-tit">{{ $t('page_account.transfer_log') }}</h2> -->
            <template>
                <el-tabs v-model="activeName">
                    <el-tab-pane label="发送的交易" name="first">
                        <!--  No transaction record  -->
                        <div v-if="sendTransCurrent.tempAry.length==0" class="no-transfer-log">
                            <i class="iconfont">&#xe6e7;</i>
                            <p>{{ $t('page_account.transfer_log_null') }}</p>
                        </div>
                        <div class="transfer-log" v-if="sendTransCurrent.tempAry.length!==0">
                                <template v-for="item in sendTransCurrent.tempAry">
                                    <div class="transfer-item b-flex b-flex-justify tx-item" @click="showTxInfo(item)">
                                        <div class="transfer-info">
                                            <p class="by-address">{{item.to}}</p>
                                            <p class="transfer-time">{{item.exec_timestamp |toDate }}</p>
                                        </div>
                                        <div class="transfer-assets">
                                            <strong class="assets">- {{item.amount | toCZRVal }}</strong>
                                        </div>
                                    </div>
                                </template>
                                <div class="pagin-wrap b-flex b-flex-justify" v-if="sendTransCurrent.sourcesAry.length>=sendTransCurrent.limit">
                                    <el-button @click="currentBefore" :disabled="sendTransCurrent.beforeDisabled" class="before-btn">上一页</el-button>
                                    <el-button @click="currentNext" :disabled="sendTransCurrent.nextDisabled" class="next-btn">下一页</el-button>
                                </div>
                            </div>
                    </el-tab-pane>
                    <el-tab-pane label="全部交易" name="second">
                        <el-alert v-if="alertSwitch.isShowMsg" center title="当前账户有新的交易信息" close-text="立即查看" type="warning">
                        </el-alert>
                        <div class="all-transaction">
                            <div class="transfer-log" v-if="accountInfo.tx_list.length!==0" v-loading="loadingSwitch">
                                <template v-for="item in accountInfo.currentTxList">
                                    <div v-if="item.to == address">
                                        <div class="transfer-item b-flex b-flex-justify tx-item plus-assets" @click="showTxInfo(item)">
                                            <div class="icon-wrap">
                                                <i class="iconfont icon-transfer">&#xe639;</i>
                                            </div>
                                            <div class="transfer-info">
                                                <p class="by-address">{{item.from}}</p>
                                                <p class="transfer-time">{{item.exec_timestamp |toDate }}</p>
                                            </div>
                                            <div class="transfer-assets">
                                                <div class="assets">+ {{item.amount | toCZRVal }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="item.from == address">
                                        <div class="transfer-item b-flex b-flex-justify tx-item less-assets" @click="showTxInfo(item)">
                                            <div class="icon-wrap">
                                                <i class="iconfont icon-transfer">&#xe638;</i>
                                            </div>
                                            <div class="transfer-info">
                                                <p class="by-address">{{item.to}}</p>
                                                <p class="transfer-time">{{item.exec_timestamp |toDate }}</p>
                                            </div>
                                            <div class="transfer-assets">
                                                <div class="assets">- {{item.amount | toCZRVal }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div class="pagin-wrap b-flex b-flex-justify" v-if="accountInfo.tx_list.length>=pagingSwitch.limit">
                                    <el-button :disabled="pagingSwitch.beforeDisabled" @click="beforeList" class="before-btn">上一页</el-button>
                                    <el-button :disabled="pagingSwitch.nextDisabled" @click="nextList" class="next-btn">下一页</el-button>
                                </div>
                            </div>
                            <!--  No transaction record  -->
                            <div v-if="accountInfo.tx_list.length==0" class="no-transfer-log">
                                <i class="iconfont">&#xe6e7;</i>
                                <p>{{ $t('page_account.transfer_log_null') }}</p>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </template>

        </div>

        <el-dialog :title="$t('dialog_tit')" :visible.sync="dialogSwitch.qrCode" width="40%" center>
            <span>
                <img :src="qrImgUrl" alt="code" class="qrcode-img">
                <p class="dia-address">{{address}}</p>
            </span>
        </el-dialog>

        <el-dialog :title="$t('page_account.edit_dia.tit')" :visible.sync="dialogSwitch.editName" width="35%" center>
            <span>
                <p class="edit-name-subtit">{{$t('page_account.edit_dia.subtit')}}</p>
                <el-input v-model="editTag"></el-input>
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogSwitch.editName = false">{{$t('cancel')}}</el-button>
                <el-button type="primary" @click="setEditTag">{{$t('confirm')}}</el-button>
            </span>
        </el-dialog>

        <el-dialog :title="$t('page_account.keystore.copy')" :visible.sync="dialogSwitch.keystore">
            <el-input v-if="accountInfo" :value="accountInfo.keystore" type="textarea" :autosize="{minRows: 2}">
            </el-input>
            <div slot="footer">
                <el-button @click="copyKeystore">{{$t('page_account.keystore.copy')}}</el-button>
                <el-button type="primary" @click="downloadKeystore">{{$t('page_account.keystore.download')}}</el-button>
            </div>
        </el-dialog>

        <!-- tx info -->
        <el-dialog :title="$t('page_account.dia_tx.tit')" :visible.sync="dialogSwitch.txInfo" width="70%">
            <ul class="dialog-tx-wap">
                <li class="b-flex b-flex-justify tx-item tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.block_hash')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.hash}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.status')}}</strong>
                    <span class="tx-item-info">
                        <template v-if='transactionInfo.is_stable == "0"'>
                            <span class="txt-warning"> 不稳定 </span>
                        </template>
                        <template v-else-if='transactionInfo.is_stable == "1"'>
                            <template v-if='transactionInfo.is_fork == "1" || transactionInfo.is_invalid == "1"'>
                                <span class="txt-info"> 作废 </span>
                            </template>
                            <template v-else>
                                <template v-if='transactionInfo.is_fail == "1"'>
                                    <span class="txt-danger"> 失败 </span>
                                </template>
                                <template v-else>
                                    <span class="txt-success"> 成功 </span>
                                </template>
                            </template>
                        </template>
                    </span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.from')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.from}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.to')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.to}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.amount')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.amount| toCZRFull}} {{ $t('unit.czr') }}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.data')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.data || '-'}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.send_time')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.exec_timestamp|toDate}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.mac_time')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.mc_timestamp|toDate}}</span>
                </li>
            </ul>
        </el-dialog>

    </div>
</template>

<script>
const { clipboard } = require("electron");
import QRCode from "qrcode";
import { setInterval, clearInterval,setTimeout, clearTimeout } from "timers";

let self = null;
let CONTINUATION = 2000;//定时器间隔时间
let BeforeTime  = 1;
export default {
    name: "Account",
    data() {
        return {
            dialogSwitch: {
                qrCode: false,
                editName: false,
                keystore: false,
                txInfo: false
            },
            timerSwitch:{
                initData:null,
                updateBlocksTimer:null,
                getLstestTrans:null//获取当前账户下，最新的trans
            },
            pagingSwitch: {
                limit: 10,
                beforeDisabled: true,
                nextDisabled: false
            },
            alertSwitch:{
                isShowMsg:false
            },
            loadingSwitch: true,
            address: this.$route.params.id,
            accountInfo: null,
            transactionInfo: null,
            pollingAry: null,
            qrImgUrl: "",
            txStatus: "-",
            lastBlockHash: "",
            editTag: "",
            activeName: "first",
            sendTransCurrent:{
                beforeDisabled:true,
                nextDisabled: false,
                page:1,
                limit:10,
                sourcesAry : [],
                tempAry:[],
                totalPage:0,
                unstableAry:[]
            }
        };
    },
    created() {
        self = this;
        QRCode.toDataURL(this.address, { width: 800 }, function(err, url) {
            if (err) {
                self.$walletLogs.info(err);
                return;
            }
            self.qrImgUrl = url;
        });
        self.initDatabase();
        self.getTxList(true,true);
        self.initTag();
        self.initTransItem();

        self.initSendTrans(true);
        self.blocksStatus();

        this.timerSwitch.initData = setInterval(() => {
            self.initDatabase();
        }, 3000);
    },
    computed: {},
    beforeDestroy() {
        clearInterval(this.timerSwitch.initData);
        clearTimeout(this.timerSwitch.updateBlocksTimer);
    },
    methods: {
        //获取所有交易 Start
        runGetTransTimer(){
            self.timerSwitch.updateBlocksTimer = setTimeout(function(){
                self.getTxList();
            },CONTINUATION);
        },
        getTxList(isGetData,runTimer) {
            // console.log("开始请求 lastBlockHash > ", self.lastBlockHash);
            const tempLastBlock = isGetData ? self.lastBlockHash : '';//如果是获取数据的时候，才开始使用最后的blockHash
            self.$czr.request
                .blockList(
                    self.accountInfo.address,
                    self.pagingSwitch.limit,
                    tempLastBlock
                )
                .then(function(data) {
                    if (data.error) {
                        self.$message({
                            message: data.error,
                            type: "error"
                        });
                        self.loadingSwitch = false;
                        return;
                    }

                    if(isGetData){
                        console.log("1.获取数据的")
                        if(runTimer){
                            self.runGetTransTimer();
                        }
                        self.setListInfo(data);
                    }else{
                        //对比是否有变化
                        console.log("2.对比是否有变化")
                        let tempList = data.list;
                        let newHash = tempList[tempList.length-1].hash;
                        let isEqual = true;
                        if (tempList.length > 0 && tempList.length<self.pagingSwitch.limit ) {
                            isEqual = self.blockDiff(newHash,self.accountInfo.tx_list[tx_list.length-1].hash );
                        }else if(tempList.length = self.pagingSwitch.limit){
                            isEqual = self.blockDiff(newHash,self.accountInfo.tx_list[self.pagingSwitch.limit-1].hash );
                        }

                        console.log("isEqual ",isEqual)
                        if(isEqual){
                            //如果是相同的，继续下次循环
                            self.runGetTransTimer();
                        }else{
                            //如果不同，显示msg，并停止获取；
                            self.alertSwitch.isShowMsg = true;
                            //TODO 点击msg的时候，处理方法

                        }
                    }
                });
        },
        setListInfo(data){
            //第一次初始化的
            data = !!data ? data : { list: [] };
            self.loadingSwitch = false;
            if (data.list.length > 0) {
                self.accountInfo.currentTxList = data.list;
                data.list.forEach(element => {
                    self.accountInfo.tx_list.push(element);
                });
            }

            //是否有下页
            if (data.list.length < self.pagingSwitch.limit) {
                self.pagingSwitch.nextDisabled = true;
            } else {
                self.pagingSwitch.nextDisabled = false;
                self.lastBlockHash =
                    data.list[data.list.length - 1].hash; //需要拿新的HASH，准备下次请求
            }
        },
        blockDiff(newHash,oldHash){
            console.log(newHash , oldHash)
            return oldHash ? newHash === oldHash : true;
        },
        getNextList() {
            /* 
                currentTxList最后一个hash是否 等于 tx_list 最后一个hash；
                - 等于   需要获取
                - 不等   从tx_list中获取
            */
            var _currentTxList = self.accountInfo.currentTxList;
            var currentTxListHashBlock =
                _currentTxList[_currentTxList.length - 1].hash;
            var _txList = self.accountInfo.tx_list;
            var lastTxListHashBlock = _txList[_txList.length - 1].hash;
            // console.log("currentTxListHashBlock == lastTxListHashBlock",currentTxListHashBlock == lastTxListHashBlock)
            if (currentTxListHashBlock == lastTxListHashBlock) {
                //获取
                // console.log("获取")
                self.lastBlockHash = lastTxListHashBlock;
                self.getTxList(true);
            } else {
                //不获取
                // console.log("不获取")
                //先把当前的哈希，替换为下一个hash
                var startHash = currentTxListHashBlock;
                var tempAry = [];
                var ele;
                for (var j = 0; j < _txList.length; j++) {
                    ele = _txList[j];
                    var _isSet = ele.hash == startHash;
                    var _isGoOn = tempAry.length < self.pagingSwitch.limit;
                    // console.log("_isSet _isGoOn",_isSet,_isGoOn)
                    if (_isSet && _isGoOn) {
                        //如果是最后一个item，就不要循环了
                        if (
                            _txList[j].hash == _txList[_txList.length - 1].hash
                        ) {
                            // console.log("不能循环拉");
                            self.pagingSwitch.nextDisabled = true; //释放 后翻
                            break;
                        }
                        startHash = _txList[j + 1].hash;
                        tempAry.push(_txList[j + 1]);
                    }
                }
                // _txList.forEach((ele, index) => {
                //     var _isSet = ele.hash == startHash;
                //     var _isGoOn = tempAry.length < self.pagingSwitch.limit;
                //     // console.log("_isSet _isGoOn",_isSet,_isGoOn)
                //     if (_isSet && _isGoOn) {
                //         startHash = _txList[index + 1].hash;
                //         tempAry.push(_txList[index + 1]);
                //     }
                // });
                // console.log("tempAry",tempAry)
                self.loadingSwitch = false;
                self.accountInfo.currentTxList = tempAry;
                self.lastBlockHash = tempAry[tempAry.length - 1].hash;
            }
        },
        getBeforeList() {
            //TODO 从 tx_list 中取一些值给currentTxLList
            /* 
            1.当前有 lastBlockHash 开始循环找
            2.可以取值，并且可以继续，则取值
                - 取值同时，设置l astBlockHash 为前一个Hash,如果是第一个item了，则astBlockHash 为""

            = 开始 > 结束   返回
            = 开始 > 中间   返回
            */
            var localList = self.accountInfo.tx_list;
            var targetAry = [];
            // console.log("tx_list", self.accountInfo.tx_list);
            // console.log("lastBlockHash", self.lastBlockHash);
            if (self.lastBlockHash) {
                //当前list最后数据的hashBlock 就是当前hash；这时候需要换,换成上一页最后一个hash；
                var _currentTxList = self.accountInfo.currentTxList;
                var currentTxListHashBlock =
                    _currentTxList[_currentTxList.length - 1].hash;
                if (self.lastBlockHash == currentTxListHashBlock) {
                    //当前 lastBlockHash 在 tx_list 中的索引
                    var currentIndexInTxLixt = 0;
                    localList.forEach((ele, index) => {
                        if (ele.hash == self.lastBlockHash) {
                            currentIndexInTxLixt = index;
                        }
                    });

                    var currentTxLeng = self.accountInfo.currentTxList.length;
                    var lessNum =
                        self.pagingSwitch.limit > currentTxLeng
                            ? currentTxLeng
                            : self.pagingSwitch.limit;
                    var targetIndex = currentIndexInTxLixt - lessNum;
                    if (targetIndex < 0) {
                        self.pagingSwitch.beforeDisabled = true;
                        self.loadingSwitch = false;
                        return;
                    }

                    // var targetIndex = currentIndexInTxLixt - self.pagingSwitch.limit;
                    // console.log("换blockHash", targetIndex,currentIndexInTxLixt , lessNum ,self.pagingSwitch.limit , currentTxLeng);
                    self.lastBlockHash = localList[targetIndex].hash;
                }

                //如果有lastBlockHash
                for (var i = localList.length - 1; i >= 0; i--) {
                    //如果当前Hash 等于 循环的哈希,开始取值
                    var isSet = localList[i].hash == self.lastBlockHash; //是否取值
                    var isGoOn = targetAry.length < self.pagingSwitch.limit; //是否继续取值
                    if (isSet && isGoOn) {
                        targetAry.unshift(localList[i]);
                        self.lastBlockHash = i > 0 ? localList[i - 1].hash : "";
                        if (i == 0) {
                            self.pagingSwitch.beforeDisabled = true;
                        }
                    }
                    //如果数据读取完毕，不需要循环
                    if (!isGoOn) {
                        break;
                    }
                }
            }
            if (targetAry.length > 0) {
                self.accountInfo.currentTxList = targetAry;
            } else {
                //不能上翻
                self.pagingSwitch.beforeDisabled = true;
            }
            self.loadingSwitch = false;
        },
        nextList() {
            self.loadingSwitch = true;
            self.getNextList();
            self.pagingSwitch.beforeDisabled = false; //释放 前翻
        },
        beforeList() {
            self.loadingSwitch = true;
            self.getBeforeList();
            self.pagingSwitch.nextDisabled = false; //释放 后翻
        },
        //获取所有交易 End

        //当前账户发送的交易 Start
        initSendTrans(isFirstInit){
            console.log("初始化数据了",isFirstInit)
            let _current      = this.sendTransCurrent;
            _current.sourcesAry = this.$db.get('czr_accounts')
                .find({address: this.address})
                .get('send_list')
                .value()
            // 按照时间排序
            _current.sourcesAry.sort(function(a,b){
                return b.exec_timestamp-a.exec_timestamp;
            });
            if(isFirstInit){
                self.filterUnstable();
            }

        },
        filterUnstable(){
            let _current      = this.sendTransCurrent;
            // 找出不稳定的block is_stable
            // _current.unstableAry = []
            _current.sourcesAry.forEach((ele)=>{
                if(ele.is_stable!=="1"){
                    _current.unstableAry.push(ele.hash);
                }
            });
            self.$walletLogs.info("需要轮询的 unstableAry",_current.unstableAry);
            _current.tempAry = _current.sourcesAry.slice(0,10);
            _current.page = 1;
            _current.totalPage = Math.ceil(_current.sourcesAry.length/_current.limit);
        },
        currentBefore(){
            let _current      = this.sendTransCurrent;
            const curPage       = _current.page;
            const curSliceStart = _current.limit*(curPage-2);
            const curSliceEnd   = curSliceStart+_current.limit;
            _current.nextDisabled=false;
            if(curPage>1){
                _current.tempAry = _current.sourcesAry.slice(curSliceStart,curSliceEnd);
                _current.page--;
                if(_current.page===1){
                    _current.beforeDisabled=true;
                }
            }
            
        },
        currentNext(){
            let _current      = this.sendTransCurrent;
            const curPage       = _current.page;
            const curSliceStart = _current.limit*curPage;
            const curSliceEnd   = curSliceStart+_current.limit;
            _current.beforeDisabled=false;
            if(curPage<_current.totalPage){
                _current.tempAry = _current.sourcesAry.slice(curSliceStart,curSliceEnd);
                _current.page++;
                if(_current.page===_current.totalPage){
                    _current.nextDisabled=true;
                }
            }
        },
        blocksStatus(){
            self.timerSwitch.updateBlocksTimer = setTimeout(function() {
                //更新已发送的未稳定Block  => this.sendTransCurrent.unstableAry
                // console.log("开始更新发送为稳定的Block")
                self.updateBlocks()
            }, CONTINUATION);
        },
        updateBlocks(){
            //TODO 改接口名
            self.$czr.request
                .blockList(
                    self.accountInfo.address,
                    self.pagingSwitch.limit)
                .then(function(data) {
                    return data;
                })
                .then(function(data) {
                    let isModiTrans = false;
                    for(let i =0,length = data.list.length;i<length;){
                        const tempItem = data.list[i];
                        if(tempItem.is_stable ==="1"){
                            let tempVal = self.$db
                                .read()
                                .get("czr_accounts")
                                .find({ address: self.address })
                                .get("send_list")
                                .find({ hash: tempItem.hash })
                                .assign(tempItem)
                                .write();
                            // 如果成功了，从 unstableAry 删除，并把最新数据写入数据库
                            self.sendTransCurrent.unstableAry.forEach((ele,index)=>{
                                if (ele.hash == tempItem.hash) {
                                    self.sendTransCurrent.unstableAry.splice(index,1)
                                }
                            })
                            isModiTrans = true;
                        }
                        i++;
                    }
                    self.blocksStatus();
                    if(isModiTrans){
                        self.initSendTrans();
                    }
                });
        },
        //当前账户发送的交易 End

        //Init Start
        initTag: function() {
            this.editTag = this.accountInfo.tag;
        },
        initTransItem() {
            this.transactionInfo = {
                hash: "", //哈希值
                from: "",
                to: "",
                amount: "",
                previous: "",
                parents: "",
                witness_list: "",
                witness_list_block: "",
                last_summary: "",
                last_summary_block: "",
                data: "",
                exec_timestamp: "",
                signature: ""
            };
        },
        initDatabase() {
            var keystoreFile,
                txListAry = [],
                currentList = [];
            if (this.accountInfo) {
                keystoreFile = this.accountInfo.keystore;
                txListAry = this.accountInfo.tx_list;
                currentList = self.accountInfo.currentTxList;
            }
            this.accountInfo = this.$db
                .read()
                .get("czr_accounts")
                .filter({ address: this.address })
                .value()[0];
            this.accountInfo.keystore = keystoreFile;
            self.accountInfo.currentTxList = currentList;
            //更新list
            txListAry.forEach((ele, index) => {
                if (ele.is_stable == "0") {
                    self.getBlock(ele.hash);
                }
            });
            this.accountInfo.tx_list = txListAry;
        },
        //Init End

        getBlock(hash) {
            self.$czr.request
                .getBlock(hash)
                .then(function(data) {
                    return data;
                })
                .then(function(data) {
                    if (data.is_stable == "1") {
                        self.accountInfo.tx_list.forEach((ele, index) => {
                            if (data.hash == ele.hash) {
                                //写回去
                                self.accountInfo.tx_list[index] = data;
                                //如果当前是 transactionInfo 则也些过去
                                if ((data.hash = self.transactionInfo.hash)) {
                                    self.transactionInfo = data;
                                }
                            }
                        });
                        //current也需要更改
                        self.accountInfo.currentTxList.forEach((ele, index) => {
                            if (data.hash == ele.hash) {
                                //写回去
                                self.accountInfo.currentTxList[index] = data;
                            }
                        });
                    }
                });
        },

        //Copy Address
        copyAddress: function() {
            clipboard.writeText(this.address);
            this.$message({
                message: this.$t("page_account.msg_info.ads_copy_success"),
                type: "success"
            });
        },

        //SHOW tx info
        showTxInfo(item) {
            this.transactionInfo = item;
            this.dialogSwitch.txInfo = true;
        },
        //Show Qrcode
        showQrCode: function() {
            this.dialogSwitch.qrCode = true;
        },
        //Edit Tag
        setEditTag: function() {
            if (!this.editTag) {
                this.$message.error(this.$t("page_account.edit_dia.no_tag"));
                return;
            }

            //判断长度
            if (this.editTag.length > 8) {
                this.$message.error(
                    this.$t("page_account.edit_dia.validate_tag_length")
                );
                return;
            }
            this.$db
                .read()
                .get("czr_accounts")
                .find({ address: this.address })
                .assign({ tag: this.editTag })
                .write();
            this.accountInfo.tag = this.editTag;
            this.dialogSwitch.editName = false;
        },

        //export Keystore
        exportKeystore() {
            var self = this;
            self.$czr.request
                .accountExport(self.accountInfo.address)
                .then(function(data) {
                    return data.json;
                })
                .then(function(accJson) {
                    self.accountInfo.keystore = accJson;
                    self.dialogSwitch.keystore = true;
                });
        },

        //copy
        copyKeystore() {
            // clipboard.writeText(JSON.stringify(this.accountInfo.keystore));
            clipboard.writeText(this.accountInfo.keystore);
            this.$message.success(
                this.$t("page_account.msg_info.key_copy_success")
            );
            this.dialogSwitch.keystore = false;
        },
        //download
        downloadKeystore() {
            let link = document.createElement("a");
            link.download = this.getNowTime() + "--" + this.address;
            link.style.display = "none";
            // let blob = new Blob([JSON.stringify(this.accountInfo.keystore)]);
            let blob = new Blob([this.accountInfo.keystore]);
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.dialogSwitch.keystore = false;
        },
        getNowTime: function() {
            let date = new Date();
            let addZero = this.addZero;
            let LocalTime =
                date.getFullYear() +
                "-" +
                addZero(date.getMonth() + 1) +
                "-" +
                addZero(date.getDate()) +
                "-" +
                addZero(date.getHours()) +
                addZero(date.getMinutes()) +
                addZero(date.getSeconds());
            return LocalTime;
        },
        addZero: function(val) {
            return val < 10 ? "0" + val : val;
        }
    },
    filters: {
        toCZRVal: function(val) {
            if (!val) {
                return 0;
            }
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            var reg = /(\d+(?:\.)?)(\d{0,4})/;
            var regAry = reg.exec(tempVal);
            var integer = regAry[1];
            var decimal = regAry[2];
            if (decimal) {
                while (decimal.length < 4) {
                    decimal += "0";
                }
            }
            return integer + decimal; //TODO Keep 4 decimal places
        },
        toCZRFull: function(val) {
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            return tempVal;
        },
        toDate: function(val) {
            if (val == "0" || !val) {
                return "-";
            }
            let newDate = new Date();
            newDate.setTime(val * 1000);
            let addZero = function(val) {
                return val < 10 ? "0" + val : val;
            };
            return (
                newDate.getFullYear() +
                "-" +
                addZero(newDate.getMonth() + 1) +
                "-" +
                addZero(newDate.getDate()) +
                " " +
                addZero(newDate.getHours()) +
                ":" +
                addZero(newDate.getMinutes()) +
                ":" +
                addZero(newDate.getSeconds())
            );
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.account-banner {
    height: 175px;
    text-align: center;
    background-color: #5a59a0;
    color: #fff;
    width: 100%;
    /* -webkit-user-select: none; */
    position: relative;
}

.account-banner .active-icon {
    padding: 10px 10px;
    min-width: 200px;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 99;
}
.account-banner .acc-interactive {
    margin: 10px;
    display: inline-block;
}
.account-banner .acc-interactive:hover {
    cursor: pointer;
}
.account-banner .acc-interactive:hover .icon-des {
    color: #e7e7ff;
}
.account-banner .acc-interactive:hover .iconfont {
    color: #e7e7ff;
}
.account-banner .acc-interactive .iconfont {
    font-size: 18px;
    color: #bfbef8;
}
.account-banner .icon-des {
    font-size: 12px;
    min-width: 40px;
    color: #bfbef8;
}

.account-banner .account-center {
    z-index: 20;
    width: 520px;
    margin: 0 auto;
    /* text-align: left; */
}
.account-banner .account-center .iconfont {
    color: #c4c3f7;
    cursor: pointer;
    width: 24px;
    height: 24px;
}
.account-banner .account-center .iconfont:hover {
    color: #e7e7ff;
}
.account-center {
    padding-top: 38px;
}
.account-has-assets {
    margin: 10px 0 15px;
}
.account-has-assets .account-assets {
    font-size: 24px;
    display: inline-block;
}

.account-content {
    text-align: left;
    padding: 0 20px;
    margin-top: 40px;
}
.account-content .transfer-tit {
    font-size: 18px;
    font-weight: 400;
}

/* Transaction Record */
.account-content .no-transfer-log {
    text-align: center;
    color: #9b9b9b;
}
.account-content .no-transfer-log .iconfont {
    font-size: 128px;
}
.account-content .transfer-log {
    padding: 22px 0;
}

.transfer-log .transfer-item {
    background-color: #fff;
    padding: 10px 15px;
    margin-bottom: 2px;
    border-bottom: 1px solid #f6f6f6;
    cursor: pointer;
    -webkit-user-select: none;
}
.transfer-log .transfer-item:hover{
    background-color: #f5f7fa;
}
.account-content .transfer-log .transfer-info {
    width: 485px;
    text-align: left;
}
.transfer-log .icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 50%;
}
.transfer-log .icon-wrap .icon-transfer {
    color: #fff;
    position: relative;
    left: 11px;
    top: 4px;
    font-size: 20px;
}
.transfer-log .plus-assets .icon-wrap {
    background-color: rgba(0, 128, 0, 0.555);
}
.transfer-log .less-assets .icon-wrap {
    background-color: rgba(255, 153, 0, 0.555);
}
.transfer-log .by-address {
    width: 100%;
    color: #9a9c9d;
    width: 64ch;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
    color: rgb(54, 54, 54);
}
.transfer-log .transfer-time {
    color: rgb(161, 161, 161);
}
.transfer-log .transfer-assets .assets {
    font-size: 18px;
    height: 42px;
    line-height: 42px;
    width: 170px;
    text-align: right;
}
.plus-assets .assets {
    color: green;
}
.less-assets .assets {
    color: rgb(255, 51, 0);
}
.qrcode-img {
    width: 100%;
    height: auto;
    display: block;
}
.dia-address {
    text-align: center;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.edit-name-subtit {
    margin-bottom: 30px;
    text-align: center;
}

.dialog-tx-wap .tx-item {
    padding: 10px 0 10px;
    border-bottom: 1px dashed #f3f3f3;
}
.tx-item-des {
    width: 160px;
}
.tx-item-info {
    width: 80%;
    padding-left: 10px;
    text-align: right;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.pagin-wrap {
    padding: 15px 0;
}
.txt-warning {
    color: #e6a23c;
}
.txt-info {
    color: #909399;
}
.txt-success {
    color: #67c23a;
}
.txt-danger {
    color: #f56c6c;
}
.account-alias-wrap {
    position: relative;
}
.icon-edit-alias {
    display: inline-block;
    height: 24px;
    line-height: 24px;
    position: relative;
    top: -6px;
    right: 0;
}
.account-remark {
    display: inline-block;
    height: 24px;
    line-height: 24px;
    max-width: 150px;
    margin: 0 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

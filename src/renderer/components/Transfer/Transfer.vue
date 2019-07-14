<template>
    <div class="page-transfer" v-loading="loading">
        <div class="transfer-cont">
            <el-form ref="form" label-width="100px" v-if="database.length">
                <el-form-item :label="$t('page_transfer.from_address')">
                    <el-select v-model="fromInfo.account" :placeholder="$t('page_transfer.select')" style="width:100%;">
                        <el-option v-for="item in database" :key="item.address" :label="item.address"
                                   :value="item.address">
                            <span style="float: left">{{ item.tag }}</span>
                            <span style="float: right; color: #8492a6; font-size: 13px">{{ item.address }}</span>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('page_transfer.to_address')">
                    <div class="trigger-contacts" @click="dialogSwitch.contacts = true">
                        <i class="el-icon-tickets"></i>
                    </div>
                    <el-input v-model="toAccount"></el-input>
                </el-form-item>

                <el-form-item :label="$t('page_transfer.amount')">
                    <el-input v-model="amount" :min="0" :max="accountInfo.balance" class="width-180 amount"></el-input>
                    <span class="inline-block">{{$t('unit.czr')}}</span>
                    <el-checkbox v-model="checkedAll" @change='sendAllAmount' class="send-all-assets">
                        {{$t('page_transfer.send_all')}}&nbsp;
                        <span class="czr-txt-muted">
                            (&nbsp;{{accountInfo.balance | toCzrVal}} {{$t('unit.czr')}}&nbsp;)
                        </span>
                    </el-checkbox>
                </el-form-item>

                <el-form-item :label="$t('page_transfer.gas')">
                    <el-input v-model="gas" :min="0" :max="accountInfo.balance / (gasPrice * 1000000000)"
                              class="width-180"></el-input>
                </el-form-item>

                <el-form-item :label="$t('page_transfer.gasPrice')">
                    <el-slider v-model="gasPrice" :min="+gasPriceRange.low"
                               :max="+gasPriceRange.high" show-input
                               input-size="mini" :step="1"
                               @change="changeSlider"
                               class="gas-slider"
                    ></el-slider>
                    <span class="wei-unit">
                        x 10<sup>-9</sup>CZR
                    </span>
                </el-form-item>

                <el-form-item :label="$t('page_transfer.txFee')">
                    <p>{{txFee}} <span>CZR</span></p>
                </el-form-item>

                <el-form-item>
                    <el-input type="textarea" :rows="4" :placeholder="$t('page_transfer.data_placeholder')"
                              v-model="extraData"></el-input>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="validateForm">{{$t('confirm')}}</el-button>

                </el-form-item>
            </el-form>
            <div v-else v-show="!loading">
                <i class="el-icon-circle-close-outline no-account-icon"></i>
                <p class="no-account-des">{{$t('page_transfer.no_account_info')}}</p>
            </div>
        </div>

        <!-- Dialog select contacts -->
        <el-dialog :title="$t('page_transfer.contacts_dig.title')" :visible.sync="dialogSwitch.contacts" width="70%">
            <span>
                <el-select v-model="selectedContact" :placeholder="$t('page_transfer.contacts_dig.select_placeholder')"
                           style="width:100%;">
                    <el-option v-for="item in contacts" :key="item.address" :label="item.tag" :value="item.address">
                        <span style="float: left">{{ item.tag }}</span>
                        <span style="float: right; color: #8492a6; font-size: 13px">{{ item.address }}</span>
                    </el-option>
                </el-select>
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogSwitch.contacts = false">{{$t('cancel')}}</el-button>
                <el-button type="primary" @click="confrimContacts">{{$t('confirm')}}</el-button>
            </span>
        </el-dialog>

        <!-- confirm tran -->
        <el-dialog :title="$t('page_transfer.confirm_dia.title')"
                   width="85%" :visible.sync="dialogSwitch.confrim"
        >
            <el-form ref="form" label-width="120px">
                <el-form-item :label="$t('page_transfer.from_address')">
                    <p>{{fromInfo.account}}</p>
                </el-form-item>
                <el-form-item :label="$t('page_transfer.to_address')">
                    <p>{{toAccount || "-"}}</p>
                </el-form-item>
                <el-form-item :label="$t('page_transfer.amount')">
                    <p>{{amount}} {{$t('unit.czr')}}</p>
                </el-form-item>
                <el-form-item :label="$t('page_transfer.txFee')">
                    <p>{{txFee}} <span>CZR</span></p>
                </el-form-item>
                <el-form-item :label="$t('page_transfer.data')">
                    <p>{{extraData || '-'}}</p>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogSwitch.confrim = false">{{$t('cancel')}}</el-button>
                <el-button type="primary" @click="dialogSwitch.password = true">{{$t('confirm')}}</el-button>
            </div>

            <el-dialog width="60%" :title="$t('page_transfer.confirm_dia.enter_passworld_tit')"
                       :visible.sync="dialogSwitch.password" @open='openPwd' append-to-body>
                <el-form ref="form" label-width="100px">
                    <el-input v-model="fromInfo.password"
                              :placeholder="$t('page_transfer.confirm_dia.enter_passworld_place')"
                              type="password"></el-input>
                </el-form>

                <div slot="footer" class="dialog-footer">
                    <el-button @click="dialogSwitch.password = false">{{$t('cancel')}}</el-button>
                    <el-button type="primary" :loading="sending" @click.prevent="sendTransaction">{{$t('confirm')}}
                    </el-button>
                </div>
            </el-dialog>

        </el-dialog>

    </div>
</template>

<script>
    import {setInterval, clearInterval} from "timers"
    import BigNumber from 'bignumber.js/bignumber.mjs'
    import axios from 'axios'

    let self = null;
    export default {
        name: "Transfer",
        data() {
            return {
                countGetGasPrice: 0,
                loading: true,
                sending: false,
                dialogSwitch: {
                    contacts: false,
                    confrim: false,
                    password: false
                },

                database: [],
                contacts: [],

                checkedAll: false,
                selectedContact: "",

                fromInfo: {
                    account: "",
                    password: ""
                },
                submitInfo: {},
                isSubmit: false,

                toAccount: "",
                amount: 0,
                gas: '',
                gasPrice: '',
                gasPriceRange: {
                    low: '',
                    medium: '',
                    high: '',
                },
                extraData: ""
            };
        },
        watch: {
            gasPrice(newVal, oldVal) {
                if (isNaN(newVal)) {
                    this.gasPrice = oldVal
                }
            },
        },
        async created() {
            self = this;
            // this.contacts = this.$db.get("czr_contacts.contact_ary").value();
            /**
             * @wgy:获取联系人列表
             */
            this.contacts = await this.$nedb.contact.find()

            await self.initDatabase();
            if (!this.database.length) {
                this.loading = false
                return
            }
            this.fromInfo = {
                account: this.$route.query.account || this.database[0].address || "",
                password: ""
            };
            self.intervalId = setInterval(() => {
                self.initDatabase();
            }, 2000);

            let ret1
            try {
                ret1 = await this.getEstimateGas()
            } catch (e) {
                return
            }

            let ret
            for (let i = 0; i < 3; i++) {
                try {
                    console.log('getGasPrice count ', i)
                    ret = await this.getGasPrice()
                    console.log('getGasPrice ret ', ret)
                } catch (e) {
                    this.countGetGasPrice += 1
                    if (this.countGetGasPrice === 3) {
                        this.$walletLogs.info(`获取gas_price失败, ${e.message}`)
                        this.$alert('网络请求失败，请检查网络连接', '获取Gas Price失败')
                            .finally(() => {
                                this.$router.go(-1)
                            })
                    }
                }
                if (ret) {
                    this.loading = false
                    this.gasPrice = +this.gasPriceRange.medium
                    break;
                }
            }
        },
        beforeDestroy() {
            clearInterval(self.intervalId);
        },
        computed: {
            //Init
            accountInfo() {
                if (this.fromInfo.account) {
                    return this.database.find(
                        item => item.address === this.fromInfo.account
                    );
                } else {
                    return {};
                }
            },
            txFee() {
                return new BigNumber(this.gas).times(new BigNumber(this.gasPrice)).div(new BigNumber('1e9')).toString()
            },
        },
        methods: {
            getEstimateGas() {
                return new Promise((resolve, reject) => {
                    this.$czr.request.estimateGas({
                        to: this.$route.query.account || this.database[0].address
                    }).then(res => {
                        if (res.code !== 0) {
                            switch (res.code) {
                                case 1:
                                    this.$message.error(this.$t('rpcErrors.invalidFromAccount'))
                                    break
                                case 2:
                                    this.$message.error(this.$t('rpcErrors.invalidToAccount'))
                                    break
                                case 3:
                                    this.$message.error(this.$t('rpcErrors.invalidAmountFormat'))
                                    break
                                case 4:
                                    this.$message.error(this.$t('rpcErrors.invalidGasFormat'))
                                    break
                                case 5:
                                    this.$message.error(this.$t('rpcErrors.invalidDataFormat'))
                                    break
                                case 6:
                                    this.$message.error(this.$t('rpcErrors.dataSizeTooLarge'))
                                    break
                                case 7:
                                    this.$message.error(this.$t('rpcErrors.invalidGasPriceFormat'))
                                    break
                                case 8:
                                    this.$message.error(this.$t('rpcErrors.invalidMciFormat'))
                                    break
                                case 9:
                                    this.$message.error(this.$t('rpcErrors.notEnoughFail'))
                                    break
                                default:
                                    this.$message.error(res.msg)
                                    break
                            }
                            this.$walletLogs.info(`estimateGas失败, ${res.msg}`)
                            this.$alert('节点连接异常，稍后重试', '获取estimate Gas失败')
                                .finally(() => {
                                    this.$router.go(-1)
                                })
                            reject(new Error(res.msg))
                        }
                        this.gas = res.gas
                        resolve(true)
                    }).catch(err => {
                        reject(err)
                    })
                })
            },
            getGasPrice() {
                return new Promise((resolve, reject) => {
                    axios.get(`http://apis.canonchain.com/apis?apikey=BYBA6sS782wXtc4xnEUp34hBpCvztqRm69h4NFADu7gN&module=other&action=gas_price&t=${Date.now()}`)
                        .then(res => {
                            // console.log('axios.get',res)
                            if (res.status !== 200) {
                                console.log('获取gas Price失败')
                                // this.countGetGasPrice += 1
                                // this.$message.error(new Error(res.statusText))
                                reject(new Error('res.statusText'))
                                return
                            }
                            if (res.data.code !== 100) {
                                console.log('获取gas Price失败')
                                // this.countGetGasPrice += 1
                                // this.$message.error(new Error(res.data.msg))
                                reject(new Error('res.data.msg'))
                                return
                            }
                            const {
                                cheapest_gas_price,
                                median_gas_price,
                                highest_gas_price
                            } = res.data.result
                            this.gasPriceRange.low = new BigNumber(cheapest_gas_price).div('1e9').toString()
                            this.gasPriceRange.medium = new BigNumber(median_gas_price).div('1e9').toString()
                            this.gasPriceRange.high = new BigNumber(highest_gas_price).div('1e9').toString()
                            resolve(true)
                        })
                        .catch(err => {
                            this.$walletLogs.info(`获取gas_price失败, ${err.message}`)
                            reject(err)
                            // this.$message.error(new Error(err.message))
                            // this.$router.go(-1)
                        })
                    // .finally(() => {
                    //     this.loading = false
                    //     this.gasPrice = +this.gasPriceRange.medium
                    // })
                })
            },
            changeSlider(val) {
                if (this.checkedAll) {
                    let weiVal = this.accountInfo.balance;
                    let targetVal = self.$czr.utils.fromKing(new BigNumber(weiVal).minus(new BigNumber(this.gas).times(new BigNumber(val)).times('1e9')).toString(), "czr");
                    this.amount = Number(targetVal) >= 0 ? targetVal : 0;
                }
            },
            formatTooltip(val) {
                return new BigNumber(val).div('1e18').toString() + ' CZR'
            },
            //Init data
            async initDatabase() {
                // this.database = this.$db.get("czr_accounts").value();
                /**
                 * @wgy:获取当前账户列表
                 */
                this.database = await this.$nedb.account.find();
            },
            //选择联系人
            confrimContacts() {
                this.toAccount = this.selectedContact;
                this.dialogSwitch.contacts = false;
            },

            //发送全部金额
            sendAllAmount() {
                if (this.checkedAll) {
                    let weiVal = this.accountInfo.balance;
                    let targetVal = self.$czr.utils.fromKing(new BigNumber(weiVal).minus(new BigNumber(this.gas).times(new BigNumber(this.gasPrice)).times('1e9')).toString(), "czr");
                    this.amount = Number(targetVal) >= 0 ? targetVal : 0;
                } else {
                    this.amount = 0;
                }
            },

            //确认验证
            async validateForm() {
                let self = this;
                let reg = /^\d+(\.\d{1,18})?$/;
                let regObj = reg.exec(self.amount);
                let czrAmount = parseFloat(
                    self.$czr.utils.toKing(self.amount, "czr")
                );

                if (!self.toAccount) {
                    self.$message.error(
                        self.$t("page_transfer.msg_info.address_null")
                    );
                    return;
                }

                //发送金额 非数字，不可发送
                if (!regObj) {
                    self.$message.error(
                        self.$t("page_transfer.msg_info.amount_error")
                    );
                    return;
                }

                if (!reg.test(this.gas)) {
                    self.$message.error(
                        self.$t("page_transfer.msg_info.gas_error")
                    );
                    return;
                }

                if (!/^\d+(\.\d{1,9})?$/.test(this.gasPrice)) {
                    self.$message.error(
                        self.$t("page_transfer.msg_info.gasPrice_error")
                    );
                    return;
                }

                let gasValue = new BigNumber(this.gas).times(new BigNumber(this.gasPrice).times('1e9'));
                if (gasValue.lt(new BigNumber('1e7'))) {
                    self.$message.error(
                        self.$t("page_transfer.msg_info.txFeeTooLow")
                    )
                    return
                }

                // estimate gas
                if (true) { // TODO for first tx
                    try {
                        const req = {
                            from: this.fromInfo.account,
                            to: this.toAccount,
                            amount: this.$czr.utils.toKing(this.amount, "czr"),
                            gas: this.gas,
                            gas_price: new BigNumber(this.gasPrice).times('1e9').toString(),
                            data: this.extraData,
                            mci: 'latest',
                        }
                        // console.log('estimateGas req', req)
                        const res = await this.$czr.request.estimateGas(req)
                        if (res.code !== 0) {
                            switch (res.code) {
                                case 1:
                                    this.$message.error(this.$t('rpcErrors.invalidFromAccount'))
                                    break
                                case 2:
                                    this.$message.error(this.$t('rpcErrors.invalidToAccount'))
                                    break
                                case 3:
                                    this.$message.error(this.$t('rpcErrors.invalidAmountFormat'))
                                    break
                                case 4:
                                    this.$message.error(this.$t('rpcErrors.invalidGasFormat'))
                                    break
                                case 5:
                                    this.$message.error(this.$t('rpcErrors.invalidDataFormat'))
                                    break
                                case 6:
                                    this.$message.error(this.$t('rpcErrors.dataSizeTooLarge'))
                                    break
                                case 7:
                                    this.$message.error(this.$t('rpcErrors.invalidGasPriceFormat'))
                                    break
                                case 8:
                                    this.$message.error(this.$t('rpcErrors.invalidMciFormat'))
                                    break
                                case 9:
                                    this.$message.error(this.$t('rpcErrors.notEnoughFail'))
                                    break
                                default:
                                    this.$message.error(res.msg)
                                    break
                            }
                            console.error(res.msg)
                            return
                        }
                        if (this.gas < res.gas) {
                            this.$message.error('gas too low')
                            console.error('gas too low')
                            return
                        }
                    } catch (e) {
                        console.error(e)
                        return
                    }
                }

                // 账户余额为0不可以发
                // if (!parseFloat(self.accountInfo.balance)) {
                //     self.$message.error(
                //         self.$t("page_transfer.msg_info.balance_zero")
                //     );
                //     return;
                // }

                // 金额 + gas*price <= balance  !!  self.accountInfo.balance
                // TODO gas_price待确定
                let amountValue = self.$czr.utils.toKing(this.amount, "czr");
                if (new BigNumber(amountValue).plus(new BigNumber(gasValue)).gt(this.accountInfo.balance)) {
                    self.$message.error(
                        self.$t("page_transfer.msg_info.amount_exceeded")
                    );
                    return;
                }

                self.$czr.request
                    .accountValidate(self.toAccount)
                    .then(data => {
                        // console.log("accountValidate then", data);
                        return data.valid;
                    })
                    .catch(error => {
                        this.$message.error('Failed to validate account')
                        // console.log("accountValidate catch", error);
                    })
                    .then(data => {
                        // console.log("then", data);
                        if (data == "1") {
                            self.dialogSwitch.confrim = true;
                        } else if (data == "0") {
                            self.$message.error(
                                self.$t("page_transfer.msg_info.address_err")
                            );
                        }
                    });
            },
            openPwd() {
                self.fromInfo.password = "";
            },
            async sendTransaction() {
                this.sending = true
                let self = this;
                if (!self.isSubmit) {
                    self.isSubmit = true;
                } else {
                    this.sending = false
                    return;
                }
                let amountValue = self.$czr.utils.toKing(this.amount, "czr");
                let gasValue = this.gas
                let gasPrice = new BigNumber(this.gasPrice).times('1e9').toString()

                // const keystore = self.$db.get("accounts_keystore")
                //     .filter(keystore => keystore.account === self.fromInfo.account)
                //     .value()
                /**
                 * @wgy:获取当前account的keystore
                 */
                const keystore = await self.$nedb.accounts_keystore.findOne({"account": self.fromInfo.account})
                if (!keystore.account) {
                    self.$message.error(self.$t('page_transfer.no_keystore_file'));
                    self.isSubmit = false;
                    this.sending = false
                    return
                }
                let privateKey;

                try {
                    if (await self.$czr.accounts.validate_account(keystore, self.fromInfo.password)) {
                        privateKey = await self.$czr.accounts.decrypt(keystore, self.fromInfo.password)
                    } else {
                        this.sending = false
                        self.isSubmit = false
                        throw new Error(this.$t("page_home.remove_dia.validate_password"))
                    }
                    // console.log('privateKey',privateKey)
                } catch (e) {
                    self.$message.error(self.$t('page_transfer.msg_info.decrypt_err'))
                    self.isSubmit = false;
                    this.sending = false
                    return
                }

                let sendObj = {
                    from: self.fromInfo.account,
                    to: self.toAccount,
                    amount: amountValue,
                    gas: gasValue,
                    gas_price: gasPrice,
                    password: self.fromInfo.password,
                    data: self.extraData,
                }, transaction, signature, res;

                try {
                    res = await self.$czr.request.generateOfflineBlock(sendObj)
                    if (res.code !== 0) {
                        this.sending = false
                        self.isSubmit = false
                        throw new Error(res.msg)
                    }
                    transaction = res
                } catch (e) {
                    self.$message.error(self.$t('page_transfer.msg_info.generate_offline_block_err'))
                    self.isSubmit = false;
                    this.sending = false
                    // console.log(e)
                    return
                }

                try {
                    res = await self.$czr.accounts.sign(transaction.hash, privateKey)
                    transaction.signature = res
                } catch (e) {
                    self.$message.error(self.$t('page_transfer.msg_info.sign_err'))
                    self.isSubmit = false;
                    this.sending = false
                    // console.log(e)
                    return
                }

                try {
                    res = await self.$czr.request.sendOfflineBlock(transaction)
                    if (res.code !== 0) {
                        self.isSubmit = false
                        this.sending = false
                        throw new Error(res.msg)
                    }
                } catch (e) {
                    self.$message.error(self.$t('page_transfer.msg_info.send_offline_block_err'))
                    self.isSubmit = false;
                    this.sending = false
                    // console.log(e)
                    return
                }

                if (res.code === 0) {
                    // console.log('sendOfflineBlock res', res);
                    self.$message.success(
                        self.$t("page_transfer.msg_info.send_success")
                    );
                    //Clear data
                    self.dialogSwitch.confrim = false;
                    self.dialogSwitch.password = false;
                    //data = {block: "9696FCB3B3BD232B26470AF06839139474DA28C644408CE9BBD9CEC8D8440833"}
                    let sendBlockInfo = {
                        hash: res.hash,
                        from: self.fromInfo.account,
                        previous: transaction.previous,
                        to: self.toAccount,
                        amount: amountValue,
                        gas: transaction.gas,
                        gas_price: transaction.gas_price,
                        data: transaction.data,
                        is_stable: "0",
                        send_timestamp: Math.floor(new Date().getTime() / 1000),
                    };
                    // console.log('writeTransToSql', sendBlockInfo)
                    self.writeTransToSql(sendBlockInfo);
                    if (this.$store.state.NodeStatus.status.syncing) {
                        // console.log('节点正在同步中，交易确认时间可能较长，请耐心等待')
                        this.$alert(
                            this.$t('page_transfer.msg_info.syncingWait'),
                            this.$t('page_transfer.msg_info.syncingWaitTitle'),
                        )
                    }
                } else {
                    self.isSubmit = false;
                    this.sending = false
                    self.$message.error(res.error);
                }
            },
            async writeTransToSql(blockInfo) {
                //写入sendlist
                // self.$db
                //     .get("send_list." + blockInfo.from)
                //     .push(blockInfo)
                //     .write();

                /**
                 * @wgy:写入sendlist
                 */
                await self.$nedb.account_tx.insert(blockInfo)
                self.$router.push("/account/" + self.fromInfo.account);
            },

        },
        filters: {
            toCzrVal(val) {
                let tempVal = self.$czr.utils.fromKing(val, "czr");
                return tempVal;
            }
        }
    };
</script>
<style scoped>
    .page-transfer {
        text-align: left;
        background: #fff;
        border-top: 1px solid rgba(0, 0, 0, 0.25);
        padding: 40px 0 35px;
    }

    .transfer-cont {
        padding: 0 90px;
        min-height: 450px;
    }

    .page-transfer .bui-form-selector {
        width: 420px;
        font-size: 14px;
    }

    .page-transfer .bui-form-item {
        padding-left: 220px;
    }

    .tran_input {
        width: 300px;
    }

    .select-none {
        -webkit-user-select: none;
    }

    .expected-assets {
        margin-top: 14px;
    }

    .trigger-contacts {
        width: 50px;
        height: 38px;
        background: #fff;
        position: absolute;
        right: 1px;
        top: 1px;
        z-index: 2;
        border-radius: 4px;
        cursor: pointer;
    }

    .trigger-contacts .el-icon-tickets {
        font-size: 24px;
        padding-left: 13px;
        padding-top: 7px;
        color: #a7aaaf;
    }

    .trigger-contacts:hover {
        background: #dbdbff;
    }

    .trigger-contacts:hover .el-icon-tickets {
        color: #5a59a0;
    }

    .send-all-assets {
        /*margin-left: 20px;*/
        font-size: 16px;
    }

    .speculate-wrap {
        color: rgb(168, 168, 168);
    }

    .no-account-icon {
        font-size: 100px;
        display: block;
        text-align: center;
        margin-top: 50px;
    }

    .no-account-des {
        text-align: center;
        margin-top: 40px;
    }

    .amount {
        width: 90%;
    }

    .inline-block {
        display: inline-block;
        width: 9%;
        text-align: center;
    }

    .gas-slider {
        display: inline-block;
        width: 85%;
    }

    .wei-unit {
        display: inline-block;
        line-height: 38px;
        vertical-align: top;
        width: 14%;
        text-align: center;
    }
</style>

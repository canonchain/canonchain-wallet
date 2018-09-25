<template>
    <div class="page-transfer">
        <div class="transfer-cont">
            <el-form ref="form" label-width="100px" v-if="this.database.length>0">
                <el-form-item :label="$t('page_transfer.from_address')">
                    <el-select v-model="fromInfo.account" :placeholder="$t('page_transfer.select')" style="width:100%;">
                        <el-option v-for="item in database" :key="item.address" :label="item.address" :value="item.address">
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
                    <el-input v-model="amount" :min="0" :max="accountInfo.balance" class="width-180"></el-input>
                    <span>{{$t('unit.czr')}}</span>
                    <el-checkbox v-model="checkedAll" @change='sendAllAmount' class="send-all-assets">
                        {{$t('page_transfer.send_all')}}&nbsp;
                        <span class="czr-txt-muted">
                            (&nbsp;{{accountInfo.balance | toCzrVal}} {{$t('unit.czr')}}&nbsp;)
                        </span>

                    </el-checkbox>
                </el-form-item>
                <el-form-item>
                    <el-input type="textarea" :rows="4" :placeholder="$t('page_transfer.data_placeholder')" v-model="extraData"></el-input>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="validateForm">{{$t('confirm')}}</el-button>

                </el-form-item>
            </el-form>
            <div v-else>
                <i class="el-icon-circle-close-outline no-account-icon"></i>
                <p class="no-account-des">{{$t('page_transfer.no_account_info')}}</p>
            </div>
        </div>

        <!-- Dialog select contacts -->
        <el-dialog :title="$t('page_transfer.contacts_dig.title')" :visible.sync="dialogSwitch.contacts" width="70%">
            <span>
                <el-select v-model="selectedContact" :placeholder="$t('page_transfer.contacts_dig.select_placeholder')" style="width:100%;">
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
        <template>
            <el-dialog :title="$t('page_transfer.confirm_dia.title')" width="85%" :visible.sync="dialogSwitch.confrim">

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
                    <el-form-item :label="$t('page_transfer.data')">
                        <p>{{extraData || '-'}}</p>
                    </el-form-item>
                </el-form>
                <div slot="footer" class="dialog-footer">
                    <el-button @click="dialogSwitch.confrim = false">{{$t('cancel')}}</el-button>
                    <el-button type="primary" @click="dialogSwitch.password = true">{{$t('confirm')}}</el-button>
                </div>

                <el-dialog width="60%" :title="$t('page_transfer.confirm_dia.enter_passworld_tit')" :visible.sync="dialogSwitch.password" @open='openPwd' append-to-body>
                    <el-form ref="form" label-width="100px">
                        <el-input v-model="fromInfo.password" :placeholder="$t('page_transfer.confirm_dia.enter_passworld_place')" type="password"></el-input>
                    </el-form>

                    <div slot="footer" class="dialog-footer">
                        <el-button @click="dialogSwitch.password = false">{{$t('cancel')}}</el-button>
                        <el-button type="primary" @click.prevent="sendTransaction">{{$t('confirm')}}</el-button>
                    </div>
                </el-dialog>

            </el-dialog>
        </template>

    </div>
</template>

<script>
import { setInterval, clearInterval } from "timers";
let self = null;
export default {
    name: "Transfer",
    data() {
        return {
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
            gasPrice: "",
            feePercent: 100,
            gasLimit: 200000, //参考  myetherwallet
            extraData: ""
        };
    },

    created() {
        self = this;
        this.contacts = this.$db.get("czr_contacts.contact_ary").value();

        self.initDatabase();
        if (this.database.length) {
            this.fromInfo = {
                account:
                    this.$route.query.account || this.database[0].address || "",
                password: ""
            };
            self.intervalId = setInterval(() => {
                self.initDatabase();
            }, 2000);
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
        }
    },
    methods: {
        //Init data
        initDatabase() {
            this.database = this.$db.get("czr_accounts").value();
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
                let targetVal = self.$czr.utils.fromWei(weiVal, "czr");
                this.amount = Number(targetVal) >= 0 ? targetVal : 0;
            } else {
                this.amount = 0;
            }
        },

        //确认验证
        validateForm() {
            let self = this;
            let reg = /^\d+(\.\d{1,18})?$/;
            let regObj = reg.exec(self.amount);
            let czrAmount = parseFloat(
                self.$czr.utils.toWei(self.amount, "czr")
            );

            console.log("validateForm");

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

            //发送金额 为0 或负，不可发送
            // if (czrAmount <= 0) {
            //     self.$message.error(
            //         self.$t("page_transfer.msg_info.amount_zero")
            //     );
            //     return;
            // }

            // 账户余额为0不可以发
            // if (!parseFloat(self.accountInfo.balance)) {
            //     self.$message.error(
            //         self.$t("page_transfer.msg_info.balance_zero")
            //     );
            //     return;
            // }

            console.log(self.$czr.request.accountValidate);
            self.$czr.request
                .accountValidate(self.toAccount)
                .then(data => {
                    console.log("accountValidate then", data);
                    return data.valid;
                })
                .catch(error => {
                    console.log("accountValidate catch", error);
                })
                .then(data => {
                    console.log("then", data);
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
        sendTransaction() {
            let self = this;
            if (!self.isSubmit) {
                self.isSubmit = true;
            } else {
                return;
            }
            let amountValue = self.$czr.utils.toWei(this.amount, "czr");
            let id = Math.random();

            let sendObj = {
                from: self.fromInfo.account,
                to: self.toAccount,
                amount: amountValue,
                password: self.fromInfo.password,
                data: self.extraData,
                id: id
            };

            self.$czr.request
                .send(sendObj)
                .then(data => {
                    return data;
                })
                .then(data => {
                    if (!data.error) {
                        self.$message.success(
                            self.$t("page_transfer.msg_info.send_success")
                        );
                        //Clear data
                        self.dialogSwitch.confrim = false;
                        self.dialogSwitch.password = false;
                        //TODO 写当前的HASH
                        //data = {block: "9696FCB3B3BD232B26470AF06839139474DA28C644408CE9BBD9CEC8D8440833"}
                        let sendBlockInfo = {
                            hash: data.block,
                            from: self.fromInfo.account,
                            to: self.toAccount,
                            amount: amountValue,
                            exec_timestamp: Math.ceil(
                                new Date().getTime() / 1000
                            )
                        };
                        self.writeTransToSql(sendBlockInfo);
                        console.log(data);
                        // self.$router.push("/account/" + self.fromInfo.account);
                    } else {
                        self.isSubmit = false;
                        self.$message.error(data.error);
                    }
                });
        },
        writeTransToSql(blockInfo) {
            self.$db
                .get("czr_accounts")
                .find({ address: blockInfo.from })
                .get("send_list")
                .push(blockInfo)
                .write();
            self.$router.push("/account/" + self.fromInfo.account);
        }
    },
    filters: {
        toCzrVal(val) {
            let tempVal = self.$czr.utils.fromWei(val, "czr");
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
    margin-left: 20px;
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
</style>

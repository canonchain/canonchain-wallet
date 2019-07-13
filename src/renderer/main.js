import Vue from 'vue'
import '../sentry'
import App from './App'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-chalk/index.css';
import './assets/css/element-ui.css';

import czr from '../czr'

//Introducing db database
import db from '../datastore/index'
import nedb from '../datastore/index2';

//Introducing languages that need support
import VueI18n from 'vue-i18n'
import languges from '../../i18n/languges_conf'

//log4js
let logConfig = require('../log4/log_config.js');
let startLogs = logConfig.getLogger('start_check');        //此处使用category的值
let nodeLogs = logConfig.getLogger('node_status');        //此处使用category的值
let walletLogs = logConfig.getLogger('wallet_operate');      //此处使用category的值
Vue.prototype.$startLogs = startLogs
Vue.prototype.$nodeLogs = nodeLogs
Vue.prototype.$walletLogs = walletLogs
startLogs.info("********** 启动日志 记录开始 ********** ");
nodeLogs.info("********** 节点日志 记录开始 ********** ");
walletLogs.info("********** 钱包日志 记录开始 ********** ");

Vue.use(VueI18n);
Vue.use(ElementUI);
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.prototype.$czr = czr;

Vue.prototype.$db = db
Vue.prototype.$nedb = nedb
Vue.prototype.$isOnline = true;


// Loading i18 language
const messages = {};
for (const languge in languges) {
    messages[languge] = require("@/i18n/" + languge + ".json");
}
//Determine the user's language
let locale = db.get('czr_setting.lang').value();
const i18n = new VueI18n({
    locale: locale,// set locale
    messages,       // set locale messages 
});


/* eslint-disable no-new */
Vue.config.productionTip = false
new Vue({
    el: '#app',
    router,
    store,
    i18n,
    render: h => h(App)
})
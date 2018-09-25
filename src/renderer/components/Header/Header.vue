<template>
    <header class="header b-flex">
        <ul class="header-nav">
            <li>
                <router-link to="/home" class="active">{{ $t('model_header.home') }}</router-link>
            </li>
            <li>
                <router-link to="/transfer">{{ $t('model_header.transfer') }}</router-link>
            </li>
            <li>
                <router-link to="/contacts">{{ $t('model_header.contacts') }}</router-link>
            </li>
            <li>
                <router-link to="/setting">{{ $t('model_header.setting') }}</router-link>
            </li>
        </ul>
        <div class="has-assets-czr">
            <span class="testnet">{{ $t('model_header.testnet') }} -
                <span v-if="this.online" class="online">在线</span>
                <span v-else class="unonline">离线</span>
            </span>
        </div>
    </header>
</template>

<script>
import { setTimeout } from "timers";
let self;
let continued = 2000;
export default {
    name: "Header",
    data() {
        return {
            online: "-",
            timer: null,
            database: []
        };
    },
    created() {
        self = this;
        this.onlineTimer();
    },
    computed: {},
    methods: {
        onlineTimer() {
            self.timer = setTimeout(() => {
                self.getStatus();
            }, continued);
        },
        getStatus() {
            self.$czr.request
                .accountList()
                .then(res => {
                    if ((continued = 15000)) {
                        continued = 2000;
                    }
                    self.onlineTimer();
                    self.online = true;
                })
                .catch(error => {
                    self.onlineTimer();
                    self.online = false;
                    if ((continued = 2000)) {
                        continued = 15000;
                    }

                    self.$walletLogs.error(
                        "Header : Online Error",
                        error.message
                    );
                });
        }
    }
};
</script>

<style scoped>
.header {
    padding: 12px 20px;
    -webkit-user-select: none;
    /* background-color: #f4f4f4; */
}
.header-nav {
    width: 80%;
    text-align: left;
}
.has-assets-czr {
    width: 20%;
    text-align: right;
    font-size: 16px;
}
.has-assets-czr .testnet {
    color: #909399;
}
.header-nav > li {
    display: inline-block;
    font-size: 16px;
    margin-right: 30px;
    color: #34495e;
}
.header-nav a {
    color: #34495e;
    text-decoration: none;
    display: inline-block;
}
.header-nav a:hover {
    color: #2d2b5d;
}
.header-nav a.router-link-exact-active {
    border-bottom: 3px solid #2d2b5d;
}

.online {
    color: #67c23a;
}
.unonline {
    color: #f56c6c;
}
</style>


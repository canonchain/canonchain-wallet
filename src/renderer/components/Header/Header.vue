<template>
  <header class="header b-flex">
    <ul class="header-nav">
      <li>
        <router-link to="/home" class="active">{{
          $t("model_header.home")
        }}</router-link>
      </li>
      <li>
        <router-link to="/transfer">{{
          $t("model_header.transfer")
        }}</router-link>
      </li>
      <li>
        <router-link to="/contacts">{{
          $t("model_header.contacts")
        }}</router-link>
      </li>
      <li>
        <router-link to="/setting">{{
          $t("model_header.setting")
        }}</router-link>
      </li>
    </ul>
    <div class="has-assets-czr">
      <span class="testnet">
        <!-- {{ $t('model_header.testnet') }} - -->
        <span v-if="this.status.syncing" class="unonline">{{
          $t("model_header.syncing")
        }}</span>
        <template v-else>
          <span v-if="this.status.code === 0" class="online">{{
            $t("model_header.online")
          }}</span>
          <span v-else class="unonline">{{ $t("model_header.offline") }}</span>
        </template>
      </span>
    </div>
  </header>
</template>

<script>
// import {setTimeout} from "timers";

// let self;
// let continued = 1000;
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
    // self = this;
    // this.onlineTimer();
  },
  computed: {
    status() {
      return this.$store.state.NodeStatus.status;
    }
    // status(){
    //     return {
    //         code: 0,
    //         msg: 'OK',
    //         syncing: 1,
    //         last_stable_mci: 0,
    //         last_mci: 0,
    //         last_stable_block_index: 0,
    //     }
    // },
  },
  mounted() {
    // console.log('header vm', this)
  },
  methods: {
    // onlineTimer() {
    //     self.timer = setTimeout(() => {
    //         self.getStatus();
    //     }, continued);
    // },
    // getStatus() {
    //     self.$czr.request.status()
    //         .then(res => {
    //             // console.log('request.status', res)
    //             if (continued == 1000) {
    //                 continued = 5000;
    //             }
    //             self.onlineTimer();
    //             if (res.syncing === 0) {
    //                 self.online = true
    //             } else {
    //                 this.online = 'syncing'
    //             }
    //         })
    //         .catch(error => {
    //             self.onlineTimer();
    //             self.online = false;
    //             self.$walletLogs.error(
    //                 "Header : Online Error",
    //                 error.message
    //             );
    //         });
    // }
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

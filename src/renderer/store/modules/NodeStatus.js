/**
 * @author fangke
 * 2019/6/21
 */
// 此处使用category的值
import czr from "../../../czr";

const logConfig = require("../../../log4/log_config.js");

const startLogs = logConfig.getLogger("start_check");

const errStatus = {
  code: -1,
  syncing: 0,
  msg: "request status err"
};

const state = {
  status: {
    code: 0,
    msg: "OK",
    syncing: 0,
    last_stable_mci: 0,
    last_mci: 0,
    last_stable_block_index: 0
  }
};

// const getters = {};

const mutations = {
  UPDATE_STATUS(ctx, status) {
    ctx.status = status;
  }
};

const actions = {
  fetchStatus({ commit }) {
    czr.request
      .status()
      .then(status => {
        commit("UPDATE_STATUS", status);
      })
      .catch(err => {
        commit("UPDATE_STATUS", errStatus);
        startLogs.info("czr.request.status() error in NodeStatus", err.stack);
      });
  }
};

export default {
  state,
  mutations,
  actions
};

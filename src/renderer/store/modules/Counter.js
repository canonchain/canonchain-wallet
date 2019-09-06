const state = {
  main: 0,
  lang: ""
};

const mutations = {
  DECREMENT_MAIN_COUNTER(ctx) {
    ctx.main -= 1;
  },
  INCREMENT_MAIN_COUNTER(ctx) {
    ctx.main += 1;
  }
};

const actions = {
  someAsyncTask({ commit }) {
    // do something async
    commit("INCREMENT_MAIN_COUNTER");
  }
};

export default {
  state,
  mutations,
  actions
};

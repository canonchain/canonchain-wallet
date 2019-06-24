/**
 * @author fangke
 * 2019/6/21
 */

import czr from '../../../czr'

const errStatus = {
    code: -1,
    syncing: 0,
    msg: 'request status err',
}

const state = {
    status: {
        code: 0,
        msg: 'OK',
        syncing: 0,
        last_stable_mci: 0,
        last_mci: 0,
        last_stable_block_index: 0,
    },
}

const getters = {

}

const mutations = {
    UPDATE_STATUS(state, status) {
        state.status = status
    },
}

const actions = {
    fetchStatus({commit}) {
        czr.request.status()
            .then(status => {
                commit('UPDATE_STATUS', status)
            })
            .catch(err => {
                commit('UPDATE_STATUS', errStatus)
                console.error(err)
            })
    },
}

export default {
    state,
    mutations,
    actions
}
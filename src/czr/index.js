/**
 * @author fangke
 * 2019/6/21
 */

import Czr from 'czr'

export default new Czr({
    dev: process.env.NODE_ENV !== 'production'
})
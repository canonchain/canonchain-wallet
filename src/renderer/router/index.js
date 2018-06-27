import Vue      from 'vue'
import Router   from 'vue-router'
import Home     from '@/components/Home/Home'
import Home2     from '@/components/Home2/Home'
import Config     from '@/components/Config/Config'
import Test     from '@/components/test'
import Account  from '@/components/Account/Account'
import Contacts from '@/components/Contacts/Contacts'
import Setting  from '@/components/Setting/Setting'
import Transfer from '@/components/Transfer/Transfer'

Vue.use(Router)
export default new Router({
  routes: [
    {
      path: '/',
      name: 'Config',
      component: Config
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/account/:id',
      name: 'Account',
      component: Account
    },
    {
      path: '/contacts',
      name: 'Contacts',
      component: Contacts
    },
    {
      path: '/transfer',
      name: 'Transfer',
      component: Transfer
    },
    {
      path: '/setting',
      name: 'Setting',
      component: Setting
    }
  ]
})

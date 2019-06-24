<template>
    <div id="app">
        <Header></Header>
        <div id="bodyer">
            <router-view/>
        </div>
    </div>
</template>

<script>
    import Header from '@/components/Header/Header'
    import {mapActions} from 'vuex'
    import './assets/css/reset.css'

    export default {
        name: 'App',
        components: {Header},
        data() {
            return {
                timer: 0,
            }
        },
        methods: {
            // ...mapActions(['fetchStatus']),
            fetchStatus: mapActions(['fetchStatus']).fetchStatus,
        },
        mounted() {
            this.timer = setInterval(() => {
                this.fetchStatus()
            }, 5000)
        },
        beforeDestroy() {
            clearInterval(this.timer)
        },
    }
</script>

<style scoped>
    #app {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        width: 100%;
        /* margin-top: 60px; */
    }
    #bodyer {width: 100%;;margin: 0 auto;}

</style>

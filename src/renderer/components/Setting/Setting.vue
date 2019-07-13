<template>
    <div class="page-setting">
        <div class="setting-banner">
            <div class="setting-center">
                <h1 class="setting-tit">{{ $t('page_setting.tit') }} </h1>
            </div>
        </div>
        <div class="setting-content">
            <!-- <div class="selected-wrap">
        <span>{{ $t('page_setting.lang') }} </span>
        <el-select v-model="value" @change="selectVal">
          <el-option v-for="item in langOptions" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
        </el-select>
      </div> -->
            <el-form label-position="right" label-width="340px">
                <el-form-item :label="$t('page_setting.lang')">
                    <el-select v-model="value" @change="selectVal">
                        <el-option v-for="item in langOptions" :key="item.value" :label="item.label" :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('page_setting.data_path')">
                    <p>{{data_path}}</p>
                    <el-button @click="changeDataPath">{{$t('page_setting.change')}}</el-button>
                </el-form-item>
                <el-form-item :label="$t('page_setting.version_number')">
                    <p>{{walletVer}}</p>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script>
const packageJson = require("../../../../package.json");
import {remote} from 'electron'
const dialog = remote.dialog

export default {
    name: "Setting",
    data() {
        return {
            walletVer: packageJson.version,
            // value: this.$db.get("czr_setting.lang").value(),                             //@jiandogn  原来的
            // data_path:this.$db.get('czr_setting.canonchain_data_path').value()           //@jiandogn  原来的
            
            //@jiandong 先赋空值，再用其他异步方法赋值
            value:"",
            data_path:"",
            langOptions:[]
        };
    },
    created() {
        this.init(); 
    },
    // computed: {
    //     langOptions() {
    //         let langs = this.$db.get("czr_setting.lang_conf").value();
    //         let tempOption = [];
    //         for (const lang in langs) {
    //             tempOption.push({
    //                 value: lang,
    //                 label: langs[lang]
    //             });
    //         }
    //         return tempOption;
    //     }
    // },
    methods: {


        //@jiandong   异步初始化value，data_path，langOptions
        async init(){
            let val = await this.$nedb.setting_language_active.findOne({"name":"active"})
            let pat =  await this.$nedb.setting_node_path.findOne({"name":"node_path"})
            this.value = val.value
            this.data_path = pat.path

            let langsArray = await this.$nedb.setting_language.find()
            // console.log(langsArray);
            let langs = {}
            langsArray.forEach(element => {
                langs[element['name']] = element['alias']
            });
            let tempOption = []
            for (const lang in langs) {
                tempOption.push({
                    value: lang,
                    label: langs[lang]
                });
            }
            this.langOptions = tempOption;
        },

        changeDataPath(){
            this.$alert(this.$t('page_setting.changeDirNote'),this.$t('page_setting.note'))
                .then(async ()=>{
                    const res = dialog.showOpenDialog({
                        title: this.$t("page_config.content_msg.specifyDataDir"),
                        defaultPath: this.data_path,
                        properties: ['openDirectory'],
                    })
                    if(!res) return
                    const dir = res[0]
                    // this.$db.set('czr_setting.canonchain_data_path', dir).write()                 //@jiandogn  原来的

                    //@jiandong  异步更新节点保存路径
                    await this.$nedb.setting_node_path.update({name:"node_path"},{ $set: { path: dir } })
                    remote.app.relaunch()
                    remote.app.quit()
                })
        },
        async selectVal(val) {
            //Write to the database
            // this.$db                             //@jiandogn  原来的
            //     .read()
            //     .set("czr_setting.lang", val)
            //     .write();
            //Update current language
            

            //@jiandong  异步改变语言
            await this.$nedb.setting_language_active.update({name:"active"},{ $set: { value: val } })
            this.$i18n.locale = val;
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.setting-banner {
    height: 175px;
    background-color: #5a59a0;
    color: #fff;
    width: 100%;
    -webkit-user-select: none;
    position: relative;
}
.setting-banner .setting-tit {
    height: 175px;
    text-align: center;
    line-height: 175px;
    font-weight: 400;
    font-size: 30px;
}
.setting-content {
    text-align: left;
    margin-top: 38px;
}
.selected-wrap {
    text-align: center;
}
/* .lang-label{padding-top: 6px;} */
</style>

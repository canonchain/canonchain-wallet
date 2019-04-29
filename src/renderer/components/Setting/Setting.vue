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
            value: this.$db.get("czr_setting.lang").value(),
            data_path:this.$db.get('czr_setting.canonchain_data_path').value()
        };
    },
    computed: {
        langOptions() {
            let langs = this.$db.get("czr_setting.lang_conf").value();
            let tempOption = [];
            for (const lang in langs) {
                tempOption.push({
                    value: lang,
                    label: langs[lang]
                });
            }
            return tempOption;
        }
    },
    methods: {
        changeDataPath(){
            this.$alert(this.$t('page_setting.changeDirNote'),this.$t('page_setting.note'))
                .then(()=>{
                    const res = dialog.showOpenDialog({
                        title: this.$t("page_config.content_msg.specifyDataDir"),
                        defaultPath: this.data_path,
                        properties: ['openDirectory'],
                    })
                    if(!res) return
                    const dir = res[0]
                    this.$db.set('czr_setting.canonchain_data_path', dir).write()
                    remote.app.relaunch()
                    remote.app.quit()
                })
        },
        selectVal(val) {
            //Write to the database
            this.$db
                .read()
                .set("czr_setting.lang", val)
                .write();
            //Update current language
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

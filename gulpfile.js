/**
 *  Translate Chinese json files into other language json files
 *  language : https://cloud.google.com/translate/docs/languages
 */
const gulp = require('gulp'),
    i18n = require('./i18n/config'),
    // languges = require('./i18n/languges'),
    languges = require('./i18n/languges_conf'),
    rename = require('gulp-rename');
// The task of translating files
gulp.task('default', function () {
    for (const languge in languges) {
        // console.log(languge,languges[languge])
        gulp.src('./i18n/tap-i18n.json')
            .pipe(
                // The specific logic of translation
                i18n('', languge)
            )
            .pipe(rename({
                dirname: "i18n",
                basename: languge,
                extname: ".json"
            }))
            //  Post-translation file output file path
            .pipe(gulp.dest('./src/renderer/'));
    }
});

gulp.task('watch', function () {
    gulp.watch('i18n/tap-i18n.json', ['default']);
})

const createHash = require('crypto').createHash
const fs = require('fs');
const path = require('path')
const createReadStream = fs.createReadStream
const safeDump = require('js-yaml').safeDump
const outputFile = require("fs-extra-p").outputFile

function hashFile(file, algorithm, encoding, options) {
    if (algorithm === void 0) {
        algorithm = "sha512";
    }
    if (encoding === void 0) {
        encoding = "base64";
    }
    return new Promise(function (resolve, reject) {
        var hash = createHash(algorithm);
        hash.on("error", reject)
            .setEncoding(encoding);
        createReadStream(file, Object.assign({}, options, {highWaterMark: 1024 * 1024}))
            .on("error", reject)
            .on("end", function () {
                hash.end();
                resolve(hash.read());
            })
            .pipe(hash, {end: false});
    });
}

function serializeToYaml(object, skipInvalid, noRefs) {
    if (skipInvalid === void 0) {
        skipInvalid = false;
    }
    if (noRefs === void 0) {
        noRefs = false;
    }
    return safeDump(object, {
        lineWidth: 8000,
        skipInvalid: skipInvalid,
        noRefs: noRefs,
    });
}


gulp.task('win-build', function () {
    /**
     * use build_config/canonchain-new.nsi to
     * 1.删除d3dcompiler_47.dll
     * 2.use MakeNSISW to create .exe file
     */

    /**
     * 计算exe的sha512，替换latest.yml中的sha512、size字段
     */
    const filepath = './build/CanonChain-Wallet-Setup.exe'
    const version = require("./package.json").version;
    hashFile(filepath).then(hash => {
        const pulishConfig = {
            version,
            files: [{
                url: 'CanonChain-Wallet-Setup.exe',
                sha512: hash,
                size: fs.statSync(filepath).size
            }],
            path: 'CanonChain-Wallet-Setup.exe',
            sha512: hash,
            releaseDate: new Date()
        }
        outputFile(path.join(__dirname, "build", "latest.yml"),serializeToYaml(pulishConfig))
    })
})

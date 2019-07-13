const accountDb = require('./index2').account;
console.log(accountDb);


//用法:async  await
//具体用法参照下面两个
//1.封装: src/datastore/nedb.js
//2.文档：https://github.com/louischatriot/nedb
(async function () {
    // // 插入
    // try {
    //     await accountDb.insert([{ number: 11, age: 14 }, { number: 12, age: 14 }, { number: 13, age: 14 }]);
    // } catch (error) {
    //     console.error("捕获错误")
    //     console.error(error)
    // }

    // // 查询
    // try {
    //     let res = await accountDb.sort({ number: -1 }).limit(0, 2).find();
    //     console.log(res);
    // } catch (error) {
    //     console.error("捕获到错误")
    //     console.error(error)
    // }

    // 查询一条
    try {
        let res = await accountDb.findOne({ number: 11 });
        console.log(res);
    } catch (error) {
        console.error("捕获到错误")
        console.error(error)
    }
})();
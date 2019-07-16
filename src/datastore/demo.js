const accountDb = require('./index2').account;
const account_tx = require('./index2').account_tx;
const setting_language = require('./index2').setting_language;

console.log(accountDb);


//用法:async  await
//具体用法参照下面两个
//1.封装: src/datastore/nedb.js
//2.文档：https://github.com/louischatriot/nedb
(async function () {
    //     // find
    //     let langRes = await setting_language.sort({ createdAt: -1 }).find();
    //     console.log("langRes",langRes)
    //     //count
    //     let countRes = await setting_language.count();
    //     console.log("countRes",countRes)

    //     // insert
    //     let insertRes = await account_tx.insert([{ name: "11", age: 14 }, { name: "12", age: 14 }, { name: "13", age: 14 },{ name: "14", age: 14 },{ name: "15", age: 14 },{ name: "16", age: 14 }]);
    //     console.log("insertRes",insertRes)

    //     //remove
    //     let aloneRemoverRes = await account_tx.remove({name:"15"});
    //     console.log("aloneRemoverRes",aloneRemoverRes)

    //     //multi remover
    //     let removerRes = await account_tx.remove({name:{$in:["13","14"]}},{ multi: true });
    //     console.log("removerRes",removerRes)

    //     //update
    //     let aloneUpdateRes = await account_tx.update({name:"16"},{ $set: { age: 199 } });
    //     console.log("aloneUpdateRes",aloneUpdateRes)

    //     //findone
    //     let findoneRes = await account_tx.findOne({ name: "11" });
    //     console.log("findoneRes",findoneRes)

    //     // find
    //     let findRes = await account_tx.find();
    //     console.log("findRes",findRes)

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

    // 查询多条
    let res = await accountDb.find();
    console.log(res);

    // 查询一条
    // try {
    //     let res = await accountDb.findOne({ number: 11 });
    //     console.log(res);
    // } catch (error) {
    //     console.error("捕获到错误")
    //     console.error(error)
    // }
})();
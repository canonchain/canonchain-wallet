const { remote, app } = require('electron')
const path = require('path')
const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData');
const Datastore = require('nedb');

function NEDB(database_name) {
    let options = {
        filename: path.join(STORE_PATH, `czr_${database_name}.db`),
        // filename: path.join("./build/data", `czr_${database_name}.db`),
        autoload: true,
        timestampData: true
    };
    this.nedb = new Datastore(options);
    this.nedb.persistence.setAutocompactionInterval(5000)
}

NEDB.prototype.limit = function (offset, limit) {
    this.offset = offset || 0;
    this.limit = limit || 15;
    return this;
}

NEDB.prototype.sort = function (orderby) {
    this.orderby = orderby;
    return this;
}
/**
 * query: Object类型  查询条件 支持使用比较运算符($lt, $lte, $gt, $gte, $in, $nin, $ne), 逻辑运算符
 * offset: 偏移量 忽略多少条  用于分页
 * limit: 返回条数  用于分页
 * 返回: docs 数组  返回查询到的数据
 * * */
NEDB.prototype.find = function (query, select) {
    return new Promise((resolve, reject) => {
        let stmt = this.nedb.find(query || {});
        if (this.orderby !== undefined) {
            stmt.sort(this.orderby);
        }
        if (this.offset !== undefined) {
            stmt.skip(this.offset).limit(this.limit);
        }
        if (select != undefined) {
            stmt.projection(select || {});
        }
        stmt.exec((err, docs) => {
            if (err) {
                return reject(err);
            }
            resolve(docs);
        })
    })
};
/**
 * query: object  查询条件
 * 查找一条
 * 返回: 查到数据
 * * */
NEDB.prototype.findOne = function (query, select) {
    return new Promise((resolve, reject) => {
        let stmt = this.nedb.findOne(query || {});
        if (this.sort !== undefined) {
            stmt.sort(this.sort);
        }
        if (select != undefined) {
            stmt.projection(select || {});
        }
        stmt.exec((err, doc) => {
            if (err) {
                return reject(err);
            }
            resolve(doc);
        })
    })
}

/**
 * 插入数据
 * value: 插入的数据  
 * 使用array，实现批量插入。一旦其中一个操作失败，所有改变将会回滚。
 * * */
NEDB.prototype.insert = function (values) {
    return new Promise((resolve, reject) => {
        this.nedb.insert(values, (err, newDoc) => {
            if (err) {
                return reject(err);
            }
            resolve(newDoc);
        })
    })
}

/**
 * 更新数据
 * query: object  查询的数据
 * values: 更新的数据
 * options : object  muti(默认false)，是否允许修改多条文档；upsert(默认为false)
 * * */
NEDB.prototype.update = function (query, values, options) {
    return new Promise((resolve, reject) => {
        this.nedb.update(query || {}, values || {}, options || {}, (err, numAffected) => {
            if (err) {
                return reject(err);
            }
            resolve(numAffected);
        })
    });
}

/**
 * 根据options配置删除所有query匹配到的文档集。
 * query: 与find和findOne中query参数的用法一致
 * options: 只有一个可用。muti(默认false)，允许删除多个文档
 * * */
NEDB.prototype.remove = function (query, options) {
    return new Promise((resolve, reject) => {
        this.nedb.remove(query || {}, options || {}, (err, numAffected) => {
            if (err) {
                return reject(err);
            }
            resolve(numAffected);
        })
    });
}
/**
 * 数量
 * 
 */
NEDB.prototype.count = function (query) {
    return new Promise((resolve, reject) => {
        this.nedb.count(query || {}, (err, numAffected) => {
            if (err) {
                return reject(err);
            }
            resolve(numAffected);
        })
    });
}

/**
 * compaction.done
 * 
 */
NEDB.prototype.done = function (query) {
    return new Promise((resolve, reject) => {
        this.nedb.on("compaction.done", () => {
            // if (err) {
            //     return reject(err);
            // }
            let treuVal = true;
            resolve(treuVal);
        })
    });
}

/**
 * compactDatafile
 * 
 */
NEDB.prototype.compactDatafile = function (query) {
    this.nedb.persistence.compactDatafile();
}

module.exports = (database_name) => {
    return new NEDB(database_name);
}
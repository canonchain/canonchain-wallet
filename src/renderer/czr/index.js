"use strict";
// let version     = require('../package.json').version;
let version = "0.0.001";
let Accounts    = require('./accounts');
let HttpRequest = require('./httprequest');
let utils       = require('./utils');

let Czr = function (request) {
    // if (request) {
    //     this._request = request;
    // }
    if(request){
        this.dev = request.dev ? request.dev : false;
    }else{
        this.dev = false;
    }
    this.request = new HttpRequest(this);
    this.accounts = new Accounts(this.dev);
};
Czr.prototype={
    constructor:Czr,
    version:version,
    utils:utils
};

module.exports = Czr;


/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-28
 * Time: 上午11:52
 * To change this template use File | Settings | File Templates.
 */
var mailManager = require('./mail/mailManager');
var gameClient = require('../tools/mysql/gameClient');
var Q = require('q');


var updateTime = null;

var Handler = module.exports;

Handler.InitServer = function () {

    ///////////////////////////////////////
    updateTime = new Date();
    mailManager.Init();
    //setInterval(UpdateServer, 10000);
    setInterval(UpdateServer, 120000);

    return Q.resolve();
};

function UpdateServer() {
    var nowTime = new Date();
    var nowDay = nowTime.getDate();
    var oldDay = updateTime.getDate();
    if (nowDay != oldDay) {
        updateTime = nowTime;
    }
};

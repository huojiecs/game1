/**
 * Created by xykong on 2014/7/24.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var serverManager = require('./../../../ls/serverManager');
var config = require('./../../../tools/config');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;


handler.Register = function (id, msg, callback) {
    logger.info('Register new server info: %j', msg);

//    var info = {
//        "serverUid": +msg.serverUid,
//        "curUsers": +msg.curUsers,
//        "maxUsers": +msg.maxUsers,
//        "host": '' + msg.host,
//        "port": +msg.port,
//        "displayName": '' + msg.displayName,
//        "isNew": !!msg.isNew
//    };

    var result = serverManager.Register(msg);

    return callback(null, {result: result, serverList: config.gameServerList.list});
};

handler.UnRegister = function (id, msg, callback) {
    var uid = '' + msg.displayName + '|' + msg.id;

    var result = serverManager.UnRegister(uid);

    return callback(null, {result: result});
};

handler.NotifyLogin = function (id, msg, callback) {
    var accountID = '' + msg.accountID;
    var serverUid = +msg.serverUid;
    var checkID = '' + msg.checkID;

    serverManager.NotifyLogin(accountID, serverUid, checkID);

    return callback(null, {result: 0});
};

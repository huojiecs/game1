/**
 * Created by xykong on 2014/6/28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.ping = function (id, callback) {
    return utils.invokeCallback(callback);
};

handler.SetApp = function (sid, setting, val, callback) {
    pomelo.app.set(setting, val);
    return callback();
};

handler.Kick = function (sid, checkID, callback) {
    var sessionService = pomelo.app.get('sessionService');
    var sessions = sessionService.getByUid(checkID);

    if (!sessions || sessions.length === 0) {
        logger.info('Kick no sessions get by uid: %s', checkID);
        return callback();
    }

    logger.info('Received handler.Kick: %s, %j', checkID, require('util').inspect(sessions));

    sessionService.kick(checkID, 'handler.Kick', function () {
        logger.info('SetUserOut psRemote.UserLeave by checkID: %s', checkID);
        return callback();
    });
};

handler.SetAccountLoginTime = function (sid, frontendId, accountID, loginTime, uid, callback) {

//    logger.fatal("handler.SetAccountLoginTime: %j", arguments);

    var accountLoginTimeMap = pomelo.app.get('accountLoginTimeMap');

    if (!accountLoginTimeMap) {
        accountLoginTimeMap = {};
    }

    accountLoginTimeMap[accountID] = {frontendId: frontendId, accountID: accountID, loginTime: loginTime, uid: uid};

    pomelo.app.set('accountLoginTimeMap', accountLoginTimeMap);

    return callback();
};

/***
 * 通知服务器状态rpc调用方法：
 *      1.服务器通知服务器状态机制，
 *      2.主要用于通知前端服所有服务器都启动完成开启对外接口
 * @params {string} serverId 其他服务器id
 * @paras {boolean} status 服务器状态（true:正常运行，false：关闭或宕机）
 * */
handler.notifyServerStatus = function (sid, serverId, status, callback) {

    logger.fatal("{%s} notify status:{%s} to connector sid: %s", serverId, status, sid);

    var serverStatus = pomelo.app.get('serverStatus');
    if (!serverStatus) {
        serverStatus = {};
        //var allServers = pomelo.app.getServersFromConfig();
        //_.each(allServers, function (v, k) {
        //    serverStatus[k] = false;
        //});
    }
    serverStatus[serverId] = status;
    pomelo.app.set('serverStatus', serverStatus);
    return callback();
};


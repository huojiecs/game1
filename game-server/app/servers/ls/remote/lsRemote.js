/**
 * Created by xykong on 2014/8/4.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var idipUtils = require('../../../tools/idipUtils');
var serverManager = require('./../../../ls/serverManager');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

/**
 * 接收 重从其他服务器 同步过来的 服务器列表信息
 *-----------------------------------------
 *
 * @param {String} serverID 服务器id
 * @param {Object} msg 同步过来的消息
 * @param {Function} callback
 * */
handler.broadcastStats = function(serverID, msg, callback) {

    logger.info('ls broadcastStats msg: %j', msg);

    serverManager.broadcastStatsFromOther(msg.servers, msg.serverCache);
    return callback();
};
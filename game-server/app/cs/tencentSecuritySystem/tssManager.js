/**
 * Created by xykong on 2014/8/26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('./../player/playerManager');
var errorCodes = require('../../tools/errorCodes');
var tssClient = require('../../tools/openSdks/tencent/tssClient');

var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;


Handler.Init = function () {
    logger.info('tssManager Init set callback! %j', Handler);

    tssClient.setCallback('TransAntiData', Handler.onTransAntiData);
};

Handler.recvTssAntiData = function (roleID, antiData, antiDataLen) {

    logger.info('recvTssAntiData receive: %s, %s, %s', roleID, antiData, antiDataLen);

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return Q.reject(errorCodes.NoRole);
    }

    return tssClient.sendTransAntiData(player.GetOpenID(), +roleID, {
        anti_data_len: +antiDataLen,
        anti_data: antiData
    });
};

Handler.onTransAntiData = function (pkg) {
    logger.info('onTransAntiData receive pkg. send pkg to client. %j', pkg);

    if (!pkg) {
        logger.error('onTransAntiData receive invalid pkg.');
        return;
    }

    var roleID = pkg.head.roleid;
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }

    var route = 'TransAntiData';
    var msg = {
        antiDataLen: pkg.anti_data_len || 0,
        antiData: pkg.anti_data
    };
    player.SendMessage(route, msg);
};

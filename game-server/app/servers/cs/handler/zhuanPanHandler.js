/**
 * Created by eder on 2015/1/23.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var gameConst = require('../../../tools/constValue');
var playerManager = require('../../../cs/player/playerManager');


module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.ZhuanPanLuckNum = function (msg, session, next) {

    var roleID = session.get("roleID");
    if (!roleID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    var zhuanPanManager = player.GetZhuanPanManager();
    if (!zhuanPanManager) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    zhuanPanManager.GetLuckNum(msg, function (err, resultData) {
        if (err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }
        return next(null, resultData)
    });
};


handler.ZhuanPanRewardList = function (msg, session, next) {
    var roleID = session.get("roleID");
    if (!roleID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    var zhuanPanManager = player.GetZhuanPanManager();
    if (!zhuanPanManager) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    zhuanPanManager.PostGetLuckNum(function (err, data) {
        if (err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, data);
    });
};
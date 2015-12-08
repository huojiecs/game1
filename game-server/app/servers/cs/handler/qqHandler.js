/**
 * Created by Administrator on 14-6-16.
 */

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

handler.getBalance = function (msg, session, next) {
    var roleID = session.get("roleID");
    if (!roleID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    var qqManager = player.GetQqManager();
    if (!qqManager) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    qqManager.checkBalance(roleID, msg, function (err, data) {
        if (err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, data);
    });

};

/**
 * 服务器米大师月卡支付校验入口
 * subscribeProduct
 */
handler.subscribeProduct = function (msg, session, next) {
    var roleID = session.get("roleID");
    if (!roleID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }
    var qqManager = player.GetQqManager();
    if (!qqManager) {
        return next(null, {result: errorCodes.ParameterNull});
    }
    qqManager.checkSubscribeProduct( function (err, data) {
        if (err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, data);
    });
};
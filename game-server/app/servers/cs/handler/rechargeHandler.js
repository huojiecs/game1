/**
 * Created by Administrator on 15-1-13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../cs/player/playerManager');
module.exports = function () {
    return new Handler();
};


var Handler = function () {
};

var handler = Handler.prototype;

/**
 * 获取月卡信息
 */
handler.GetRecharges = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    player.GetRechargeManager().GetRechargeInfoList( function (err, result) {
        return next(null, result);
    });

};

/**
 * 月卡领取接口
 */
handler.ReceiveMonthCardInterface = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    player.GetRechargeManager().ReceiveMonthCard( function (result) {
        return next(null, result);
    });
};

/**
 * 月卡是否可领取状态同步
 */
handler.MonthCardState = function (msg, session, next) {
    var roleID = session.get('roleID');
    var res = {
        result: 1,
        receiveDate: 0
    };
    if (null == roleID) {
        return next(null, res);
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, res);
    }
    var result = player.GetRechargeManager().SendRechargeManager();
    return next(null, result)
};
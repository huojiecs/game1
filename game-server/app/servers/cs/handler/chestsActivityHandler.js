/**
 * Created with JetBrains WebStorm.
 * User: wangwenping
 * Date: 15-6-03
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var playerManager = require('../../../cs/player/playerManager');
var globalFunction = require('../../../tools/globalFunction');
var defaultValues = require('../../../tools/defaultValues');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var eMisType = gameConst.eMisType;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

/** 点击主城宝箱活动按钮 */
handler.ClickChestsActivity = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var tempMs = player.GetChestsManager().SendChestsList();

    return next(null, tempMs);
};

/**查看宝箱详情*/
handler.ViewDetail = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chestID = msg.chestID;

    if (null == roleID || null == chestID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var showMsg = player.GetChestsManager().ViewDetail(chestID);

    return next(null, showMsg);
};

/**开启宝箱*/
handler.OpenChests = function (msg, session, next) {
    var roleID = session.get('roleID');
    var attID = msg.chestID;//宝箱ID
    var openType = msg.openType;//1:one time; -1 more time

    if (null == roleID || null == attID || null == openType) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var msg = player.GetChestsManager().OpenChest(attID, openType);

    if (typeof msg == 'number') {
        return next(null, {
            'result': msg
        });
    }
    else {
        return next(null, msg);
    }
};






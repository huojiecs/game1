/**
 * @Author        wangwenping
 * @Date          2014/12/23
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var gameConst = require('../../../tools/constValue');
var playerManager = require('../../../cs/player/playerManager');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;
/**
 *
 * @param msg 宠物当前下标
 * @param session
 * @param next
 * @returns {*}
 */
handler.sendItemsGridInfo = function (msg, session, next) {

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
    var result = player.GetMagicOutputManager().GetMagicOutputInfo();
    return next(null, result);
};
/**
 * 点击求魔，产出新物品
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
handler.setItemGridChangeState = function (msg, session, next) {
    var roleID = session.get('roleID');
    var curIndex = msg.curIndex;
    if (null == roleID || null == curIndex) {
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
    if (-1 == curIndex) {
        curIndex = 1;
    }
    var result = player.GetMagicOutputManager().OutputItemInfo( curIndex);
    if ('number' == typeof(result)) {
        result = {
            'result': result
        }
    }
    return next(null, result);
};
/**
 * 一键拾取所有的物品
 * @param msg
 * @param session
 * @param next
 */
handler.oneKeyPick = function (msg, session, next) {
    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);

    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetMagicOutputManager().PickOutputItems();

    if ('number' == typeof(result)) {
        result = {
            'result': result
        }
    }
    return next(null, result);
}

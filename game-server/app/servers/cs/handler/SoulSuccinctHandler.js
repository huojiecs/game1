/**
 * @Author        wangwenping
 * @Date          2015/01/06
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
 * 开启一个洗练关卡
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.OpenNewCrystal = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulID = msg.soulID;
    var succinctID = msg.succinctID;
    if (null == roleID || null == soulID || null == succinctID) {
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
    var result = player.GetSoulSuccinctManager().OpenSuccinct( soulID, succinctID);

    player.GetSoulSuccinctManager().SendSuccinctNum();
    player.GetSoulSuccinctManager().SendSuccinctMsg();
    return next(null, {
        'result': result
    });
};
/**
 * 激活
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.ActivateAtt = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulID = msg.soulID;
    var succinctID = msg.succinctID;
    var gridID = msg.gridID;
    if (null == roleID || null == succinctID || null == gridID) {
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
    var result = player.GetSoulSuccinctManager().ActivateAtt(soulID, succinctID, gridID);
    return next(null, {
        'result': result
    });
};
/**
 * 开锁
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.OpenAtt = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulID = msg.soulID;
    var succinctID = msg.succinctID;
    var gridID = msg.gridID;
    if (null == roleID || null == succinctID || null == gridID) {
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
    var result = player.GetSoulSuccinctManager().OpenAtt(soulID, succinctID, gridID);

    return next(null, {
        'result': result
    });
};
/**
 * 锁定
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.LockAtt = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulID = msg.soulID;
    var succinctID = msg.succinctID;
    var gridID = msg.gridID;
    if (null == roleID || null == succinctID || null == gridID) {
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
    var result = player.GetSoulSuccinctManager().LockAtt(soulID, succinctID, gridID);

    return next(null, {
        'result': result
    });
};
/**
 * 洗练
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.SuccinctAtt = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulID = msg.soulID;
    var succinctID = msg.succinctID;
    if (null == roleID || null == succinctID) {
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
    var result = player.GetSoulSuccinctManager().SuccinctAtt(soulID, succinctID);
    return next(null, {
        'result': result
    });
};
/**
 * 替换
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.ReplaceAtt = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulID = msg.soulID;
    var succinctID = msg.succinctID;
    if (null == roleID || null == succinctID) {
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
    var result = player.GetSoulSuccinctManager().ReplaceAtt(soulID, succinctID);
    return next(null, {
        'result': result
    });
};


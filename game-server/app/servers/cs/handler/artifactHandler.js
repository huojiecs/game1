/**
 * Created by LiJianhua on 2015/9/15.
 * @email   ljhdhr@gmail.com
 * 神装系统交互报文
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../cs/player/playerManager');

module.exports = function () {
    return new Handler();
};

var Handler = function () {};

var handler = Handler.prototype;

/**
 * 获取神装信息
 */
handler.getArtifactInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var msg = player.GetArtifactManager().getAllArtifactInfo();
    return next(null, msg);
};

/**
 * 客户端主动请求,该报文用于神激活,突破，升级，升星.
 */
handler.action = function (msg, session, next) {
    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var actionType = msg.actionType;
    var type = msg.type;
    if (null == actionType || null == type) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var msg = player.GetArtifactManager().getActivationMsg(actionType, type);
    return next(null, msg);
};

/**
 * 使用神装技能
 */
handler.useArtifactSkill = function (msg, session, next) {
    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var skillAttID = msg.skillAttID;
    if (null == skillAttID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var msg = player.GetArtifactManager().activationSkill(skillAttID, true);
    return next(null, msg);
};
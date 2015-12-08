/**
 * Created by LiJianhua on 2015/7/27.
 * @email ljhdhr@gmail.com
 * 斗兽场消息处理
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
 * 解锁和升级指定NPC
 */
handler.collectNpcLevelUp = function (msg, session, next) {
    var roleID = session.get('roleID');
    var npcID = msg.baseNpcID;
    if (null == npcID) {
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
    var msg = player.GetColiseumManager().GetCollectNpcLevelUpMsg(+npcID);
    return next(null, msg);
};

/**
 * 领取解锁NPC奖励
 */
handler.collectNpcReward = function (msg, session, next) {
    var roleID = session.get('roleID');
    var attID = msg.attID;
    if (null == attID) {
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
    //领取解锁NPC奖励
    var msg = player.GetColiseumManager().getCollectNpcRewardMsg(+attID);
    return next(null, msg);
};

/**
 * 领取解锁NPC队伍奖励
 */
handler.collectTeamReward = function (msg, session, next) {
    var roleID = session.get('roleID');
    var attID = msg.attID;
    if (null == attID) {
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
    var msg = player.GetColiseumManager().getCollectTeamRewardMsg(+attID);
    return next(null, msg);
};

/**
 * 刷新怪物
 */
handler.refreshNpc = function (msg, session, next) {
    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var msg = player.GetColiseumManager().getRefreshNpcMsg();
    return next(null, msg);
};

/**
 * 击败指定NPC队伍
 */
handler.killNpcTeam = function (msg, session, next) {
    var roleID = session.get('roleID');
    var teamID = msg.teamID;
    if (null == teamID) {
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
    player.GetColiseumManager().killNpcTeam(teamID);

    return next(null, {
        'result': errorCodes.OK
    });
};
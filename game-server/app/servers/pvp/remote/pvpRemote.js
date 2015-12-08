/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午3:53
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var asyncPvPManager = require('../../../pvp/asyncPvPManager');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../pvp/player/playerManager');

var utils = require('../../../tools/utils');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.FindRivals = function (count, roleID, excepts, callback) {
    asyncPvPManager.FindRivals(count, roleID, excepts, function (err, rivals) {
        if (typeof callback === 'function') {
            return callback(null, rivals);
        }
    });
};

handler.RemovePlayerScore = function (roleID, callback) {
    asyncPvPManager.RemovePlayerScore(roleID, function () {
    });
    if (typeof callback === 'function') {
        return callback(null);
    }
};

handler.RemovePlayerPvpInfo = function (roleID, callback) {
    asyncPvPManager.RemovePlayerPvpInfo(roleID, function () {
    });
    if (typeof callback === 'function') {
        return callback(null);
    }
};

handler.AddPlayerScore = function (roleID, info, callback) {
    asyncPvPManager.AddPlayerScore(roleID, info, function (err) {
        if (!!err) {
            return callback(err);
        }
        if (typeof callback === 'function') {
            return callback(null);
        }
    });
};

handler.AddPlayerPvpInfo = function (roleID, info, callback) {
    asyncPvPManager.AddPlayerPvpInfo(roleID, info, function (err) {
        if (!!err) {
            return callback(err);
        }
        if (typeof callback === 'function') {
            return callback(null);
        }
    });
};

handler.UpdatePlayerScore = function (roleID, info, callback) {
    asyncPvPManager.UpdatePlayerScore(roleID, info, function () {
    });
    if (typeof callback === 'function') {
        return callback(null);
    }
};

handler.GetPlayerPvpInfo = function (roleID, callback) {
    asyncPvPManager.GetPlayerPvpInfo(roleID, function (err, obj) {
        if (err) {
            logger.error('pvpRemote GetPlayerPvpInfo error, %d, %s', roleID, utils.getErrorMessage(err));
            return callback(err);
        }
        return callback(null, obj);
    });
};

/**
 * 玩家上线， 添加 pvp player session
 *
 * @param {Object} playerInfo 玩家信息
 * @param {String} csID 玩家csID
 * @param {String} uid 玩家session id
 * @param {String} sid 前端id
 * @param {Function} callback
 *
 * @api public
 * */
handler.AddPlayer = function (playerInfo, csID, uid, sid, callback) {
    playerManager.AddPlayer(playerInfo, csID, uid, sid, function (err) {
        if (!!err) {
            return callback(err);
        }
        return callback();
    });
};

/**
 * 玩家下线， 删除 pvp player session
 *
 * @param {Number} roleID 玩家roleID
 * @param {Function} callback
 *
 * @api public
 * */
handler.DeletePlayer = function (roleID, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null != player) {
        /*        var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
         var teamID = player.GetTeamInfo(ePlayerTeamInfo.TeamID);*/
        playerManager.DeletePlayer(roleID, callback);
    } else {
        return callback();
    }
};

/**
 * 玩家信息变更， 更新 pvp player session info
 *
 * @param {Number} roleID 玩家roleID
 * @param {Number} index 玩家信息下标id
 * @param {Object} value 变更值
 * @param {Function} callback
 *
 * @api public
 * */
handler.UpdatePlayerValue = function (roleID, index, value, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (null != player) {
        player.SetPlayerInfo(index, value);
    }

    return callback();
};

/**
 * 玩家csID 改变
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} csID 玩家csID
 * @param {Function} callback
 * */
handler.SetPlayerCsID = function (roleID, csID, callback) {
    playerManager.SetPlayerCs(roleID, csID);
    return callback();
};

/**
 * Brief: 兑换物品扣除勋章
 * ----------------------
 * @api public
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} deductValue 扣除勋章数
 * @param {Function} callback
 * */
handler.deductMedal = function (roleID, deductValue, callback) {
    return playerManager.deductMedal(roleID, deductValue, callback);
};

/**
 * Brief: gm 添加勋章
 * ----------------------
 * @api public
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} addValue 扣除勋章数
 * @param {Function} callback
 * */
handler.gmAddMedal = function (roleID, addValue, callback) {
    return playerManager.addMedal(roleID, addValue, callback);
};

handler.addPlayerDamage = function(roleID,addValue,callback) {
    return playerManager.addDamage(roleID,addValue,callback);
};
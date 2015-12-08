/**
 * The file jsRemote.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/13 16:34:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var playerManager = require('../../../js/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');

var ePlayerInfo = gameConst.ePlayerInfo;


module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;
handler.AddPlayer = function (playerInfo, csID, uid, sid, callback) {

    playerManager.AddPlayer(playerInfo, csID, uid, sid, function (err) {
        if (!!err) {
            return callback(err);
        }
        return callback();
    });
};

handler.DeletePlayer = function (roleID, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (null != player) {
        playerManager.DeletePlayer(roleID, callback);
    } else {
        return callback();
    }
};

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
 * @Brief: 战斗结果
 *
 * @param {Number} winID 获胜者id
 * @param {Function} callBack
 * */
handler.BattleResult = function (winID, callBack) {
    var player = playerManager.GetPlayer(winID);
    if (null != player) {
        player.GetRoleJJCManager().BattleOver();
    }
    return callBack();
};

/**
 * @Brief: 获取玩家竞技场信息
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback
 * */
handler.GetJJCInfo = function (roleID, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {result: errorCodes.NoRole, jjcInfo: {}});
    }
    return callback(null, {result: errorCodes.OK, jjcInfo: player.GetRoleJJCManager().GetData().GetJJCData()});
};
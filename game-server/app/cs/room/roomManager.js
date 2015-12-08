/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-19
 * Time: 上午10:48
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Room = require('./room');
var playerManager = require('../player/playerManager');
var cityManager = require('../majorCity/cityManager');
var gameConst = require('../../tools/constValue');
var roomFactory = require('./roomFactory');
var globalFunction = require('../../tools/globalFunction');
var ePlayerInfo = gameConst.ePlayerInfo;
var eTeamInfo = gameConst.eTeamInfo;
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var util = require('util');
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var errorCodes = require('../../tools/errorCodes');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var guid = require('../../tools/guid');
var eItemInfo = gameConst.eItemInfo;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Handler = module.exports;
Handler.Init = function () {
    this.roomList = {};
    //记录玩家炼狱关卡击杀怪物信息
    this.customMonsters = {};
};

Handler.DeleteRoom = function (customID, roomID) {
    var temp = this.roomList[customID];
    if (null != temp) {
        delete temp[roomID];
    }
};

Handler.GetRoom = function (customID, roomID) {
    var temp = this.roomList[customID];
    if (null != temp) {
        return temp[roomID];
    }
    return null;
};

Handler.CreateRoom = function (teamInfo, callback) {
    var customID = teamInfo.teamData[eTeamInfo.CustomID];
    var teamID = teamInfo.teamData[eTeamInfo.TeamID];
    var levelTarget = teamInfo.teamData[eTeamInfo.LevelTarget];

    if (!this.roomList[customID]) {
        this.roomList[customID] = {};
    }
    try {

        var roles = {};
        var newRoom = roomFactory.CreateRoom(levelTarget, teamInfo.teamData, customID);
        this.roomList[customID][teamID] = newRoom;
        for (var index in teamInfo.playerList) {
            var roleID = teamInfo.playerList[index].roleID;
            var player = playerManager.GetPlayer(roleID);
            if (!!player) {
                cityManager.DelPlayer(player);
                newRoom.AddPlayer(roleID, player);
                player.SetWorldState(eWorldState.PosState, ePosState.Custom);
                player.SetWorldState(eWorldState.CustomID, customID);
                player.SetWorldState(eWorldState.TeamID, teamID);

                /** jjc 特殊处理*/
                if (levelTarget == gameConst.eLevelTarget.JJC) {
                    roles[roleID] = player.getPlayerShowInfo();
                }
                player.GetCustomManager().SetItemFlag(false);       //设置关卡物品已领取
                logger.info("set player team room status customID[%s] teamID[%s] role [%s]", customID, teamID, roleID);
            }
        }
    } catch (err) {
        logger.error(util.inspect(err));
    }
    callback(null, {result: 0, roles: roles});
};

Handler.LeaveRoom = function () {

};

Handler.UpdateRoomList = function (nowTime) {
    var nowSec = nowTime.getTime();
    for (var customID in this.roomList) {
        var customList = this.roomList[customID];
        for (var teamID in customList) {
            var tempRoom = customList[teamID];
            tempRoom.SetRoomZhu(nowSec);
        }
    }
};

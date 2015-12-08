/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-3
 * Time: 上午9:58
 * To change this template use File | Settings | File Templates.
 */
var playerManager = require('../player/playerManager');
var gameConst = require('../../tools/constValue');
var eTeamInfo = gameConst.eTeamInfo;
var ePlayerTeamInfo = gameConst.ePlayerTeamInfo;
var ePlayerTeamState = gameConst.ePlayerTeamState;
var defaultValues = require('../../tools/defaultValues');
var ePlayerInfo = gameConst.ePlayerInfo;
var eTeamState = gameConst.eTeamState;
var errorCodes = require('../../tools/errorCodes');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
module.exports = function (teamInfo) {
    return new Handler(teamInfo);
};

var Handler = function (teamInfo) {
    this.teamData = teamInfo;
    this.password = '';
    this.playerList = {};
    this.teamState = eTeamState.Room;
    this.randomKey = Math.floor(Math.random() * 100);
};

var handler = Handler.prototype;
handler.GetTeamInfo = function (index) {
    return this.teamData[index];
};

handler.SetTeamInfo = function (index, value) {
    this.teamData[index] = value;
};

handler.GetTeamState = function () {
    return this.teamState;
};

handler.SetTeamState = function (value) {
    this.teamState = value;
};

handler.GetPassword = function () {
    return this.password;
};

handler.SetPassword = function (value) {
    this.password = value;
    if (this.password.length > 0) {
        this.teamData[eTeamInfo.IsPSW] = 1;
    }
    else {
        this.teamData[eTeamInfo.IsPSW] = 0;
    }
};

handler.AddPlayer = function (roleID, jobType) {
    this.playerList[roleID] = {
        jobType: jobType
    }
};

handler.DeletePlayer = function (roleID) {
    delete this.playerList[roleID];
};

handler.IsHavePlayer = function (roleID) {
    if (this.playerList[roleID]) {
        return true;
    }
    return false;
};

handler.GetPlayerNum = function () {
    var playerNum = 0;
    for (var index in this.playerList) {
        playerNum += 1;
    }
    return playerNum;
};

handler.GetPlayerList = function () {
    if (this.playerList != null) {
        return this.playerList;
    }
    return null;
};

handler.IsFull = function () {
    if (this.GetPlayerNum() >= defaultValues.roomPlayerMax) {
        return true;
    }
    return false;
};

handler.IsJoin = function (password) {
    if (this.teamState != eTeamState.Room) {
        return errorCodes.Rs_TeamState;
    }
    if (this.password != password) {
        return errorCodes.Rs_Password;
    }
    if (this.GetPlayerNum() >= defaultValues.roomPlayerMax) {
        return errorCodes.Rs_TeamFull;
    }
    return 0;
};

handler.GetClientInfo = function () {
    var result = {
        teamData: {},
        playerList: []
    }
    for (var i = 0; i < eTeamInfo.Max; ++i) {
        result.teamData[i] = this.teamData[i];
    }
    for (var index in this.playerList) {
        var temp = {
            roleID: index,
            jobType: this.playerList[index].jobType
        }
        result.playerList.push(temp);
    }
    return result;
};

handler.SetNewOwner = function () {
    var roleID = 0;
    for (var index in this.playerList) {
        roleID = index;
        break;
    }
    this.teamData[eTeamInfo.OwnerID] = roleID;
};

handler.StarGame = function (roleID) {
    if (this.teamData[eTeamInfo.OwnerID] != roleID) {
        return errorCodes.NoPower;
    }
    if (this.teamState != eTeamState.Room) {
        return errorCodes.Rs_TeamState;
    }
    for (var index in this.playerList) {
        var tempPlayer = playerManager.GetPlayer(index);
        if (tempPlayer && tempPlayer.GetTeamInfo(ePlayerTeamInfo.TeamState) != ePlayerTeamState.TeamReady) {
            return errorCodes.Rs_TeamNoReady;
        }
    }
    this.teamState = eTeamState.Custom;
    return 0;
};

// 发送给所有玩家
handler.SendTeamList = function () {
    var route = 'ServerUpdateTeamList';
    var msg = {
        teamID: this.teamData[eTeamInfo.TeamID],
        owner: this.teamData[eTeamInfo.OwnerID],
        teamName: this.teamData[eTeamInfo.TeamName],
        isPsw: this.password,
        randomKey: this.randomKey,
        playerList: []
    };
    for (var index in this.playerList) {
        var player = playerManager.GetPlayer(index);
        if (player) {
            var temp = {}
            for (var i = 0; i < ePlayerInfo.MAX; ++i) {
                temp[i] = player.playerInfo[i];
            }
            msg.playerList.push(temp);
        }
    }
    this.SendTeamMsg(route, msg);
};


handler.SendTeamLeave = function (leaveType, makeID, leaveID) {
    var route = 'ServerTeamLeave';
    var msg = {
        leaveType: leaveType,
        makeID: makeID,
        leaveID: leaveID
    };
    this.SendTeamMsg(route, msg);
};

handler.SendStartGame = function (dropList, customID, levelParam, levelTarget) {
    var route = 'ServerStartGame';
    //logger.fatal("同步消息："+JSON.stringify(dropList));
    var msg = {'itemDropList': dropList,
        'customID': customID,
        'levelParam': levelParam,
        'levelTarget': levelTarget,
        'result': 0};
    this.SendTeamMsg(route, msg);
};

handler.SendTeamMsg = function (route, msg) {
    for (var index in this.playerList) {
        var player = playerManager.GetPlayer(index);
        if (player) {
            player.SendMessage(route, msg);
        }
    }
};

handler.SendStartGameForJJC = function (dropList, customID, levelParam, levelTarget, roles) {

    for (var index in this.playerList) {
        for (var id in roles) {

            var player = playerManager.GetPlayer(index);
            if (id == index || !player) {
                continue;
            }

            var route = 'ServerStartGame';
            var msg = {
                'itemDropList': dropList,
                'customID': customID,
                'levelParam': levelParam,
                'levelTarget': levelTarget,
                'rivalData': {playerList: [roles[id]]},
                'result': 0
            };

            player.SendMessage(route, msg);
        }
    }
};

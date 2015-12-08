/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-3
 * Time: 上午9:58
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var eTeamInfo = gameConst.eTeamInfo;
var eTeamState = gameConst.eTeamState;
var ePlayerInfo = gameConst.ePlayerInfo;
var ePlayerTeamInfo = gameConst.ePlayerTeamInfo;
var ePlayerTeamState = gameConst.ePlayerTeamState;
var eLeaveTeam = gameConst.eLeaveTeam;
var errorCodes = require('../../tools/errorCodes');
var Team = require('./team');
var _ = require('underscore');


var Handler = module.exports;
Handler.Init = function () {
    this.teamList = {};
};


// 创建队伍
Handler.CreateTeam = function (teamName, vipLevel, player, customID, levelTarget, levelParam, password, jobType) {
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var teamInfo = new Array(eTeamInfo.Max);
    teamInfo[eTeamInfo.TeamID] = 0;
    teamInfo[eTeamInfo.TeamName] = teamName;
    teamInfo[eTeamInfo.VipLevel] = vipLevel;
    teamInfo[eTeamInfo.IsPSW] = 0;
    teamInfo[eTeamInfo.OwnerID] = roleID;
    teamInfo[eTeamInfo.CustomID] = customID;
    teamInfo[eTeamInfo.LevelTarget] = levelTarget;
    teamInfo[eTeamInfo.LevelParam] = levelParam;
    teamInfo[eTeamInfo.UnionID] = player.GetPlayerInfo(ePlayerInfo.UnionID);
    teamInfo[eTeamInfo.animalOrder] = 0;
    if (null == this.teamList[customID]) {
        this.teamList[customID] = [];
    }
    var teamID = this.teamList[customID].length + 1;
    for (var i = 1; i < teamID; ++i) {
        if (null == this.teamList[customID] [i]) {
            teamID = i;
            break;
        }
    }
    teamInfo[eTeamInfo.TeamID] = teamID;
    var newTeam = new Team(teamInfo);
    newTeam.SetPassword(password);
    newTeam.AddPlayer(roleID, jobType);
    this.teamList[customID][teamID] = newTeam;
    player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamIn);
    player.SetTeamInfo(ePlayerTeamInfo.CustomID, customID);
    player.SetTeamInfo(ePlayerTeamInfo.TeamID, teamID);
    player.SetTeamInfo(ePlayerTeamInfo.AtkValue, 0);
    player.SetTeamInfo(ePlayerTeamInfo.fightDamage, 0);
    newTeam.SendTeamList();
    logger.info("Create team customID[%s] teamID[%s] by role [%s->%s]", customID, teamID, roleID,
                player.GetPlayerInfo(ePlayerInfo.NAME));
    pomelo.app.rpc.chat.chatRemote.RoomAddPlayer(null, customID, teamID, roleID, utils.done);
};

Handler.JoinTeam = function (tempTeam, customID, teamID, player, jobType) {
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    tempTeam.AddPlayer(roleID, jobType);
    player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamIn);
    player.SetTeamInfo(ePlayerTeamInfo.CustomID, customID);
    player.SetTeamInfo(ePlayerTeamInfo.TeamID, teamID);
    player.SetTeamInfo(ePlayerTeamInfo.AtkValue, 0);
    player.SetTeamInfo(ePlayerTeamInfo.fightDamage, 0);
    tempTeam.SendTeamList();
    logger.info("Join team customID[%s] teamID[%s] role [%s->%s]", customID, teamID, roleID,
                player.GetPlayerInfo(ePlayerInfo.NAME));
    pomelo.app.rpc.chat.chatRemote.RoomAddPlayer(null, customID, teamID, roleID, utils.done);
};

Handler.LeaveTeam = function (makePlayer, leavePlayer, tempTeam, customID, teamID) {
    var roleID = makePlayer.GetPlayerInfo(ePlayerInfo.ROLEID);
    var leaveID = leavePlayer.GetPlayerInfo(ePlayerInfo.ROLEID);

    var ownerID = tempTeam.GetTeamInfo(eTeamInfo.OwnerID);
    if (roleID == leaveID) {   //自己申请离开
        leavePlayer.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamNull);
        leavePlayer.SetTeamInfo(ePlayerTeamInfo.TeamID, 0);
        leavePlayer.SetTeamInfo(ePlayerTeamInfo.CustomID, 0);
        tempTeam.SendTeamLeave(eLeaveTeam.SELF, roleID, leaveID);
        tempTeam.DeletePlayer(leaveID);
        if (tempTeam.GetPlayerNum() == 0) {   //房间里面没有人了
            this.DeleteTeam(customID, teamID);
            pomelo.app.rpc.chat.chatRemote.DeleteRoom(null, customID, teamID, utils.done);
        }
        else {
            if (ownerID == leaveID) {   //房主自己离开了
                tempTeam.SetNewOwner();
            }
            tempTeam.SendTeamList();
            pomelo.app.rpc.chat.chatRemote.RoomDeletePlayer(null, customID, teamID, roleID, utils.done);
        }
        logger.info("Leave team by self customID[%s] teamID[%s] role [%s->%s]", customID, teamID, roleID,
                    leavePlayer.GetPlayerInfo(ePlayerInfo.NAME));
    }
    else {  //让他人离开
        if (roleID != ownerID) {    //不是房主
            return errorCodes.NoPower;
        }
        else {
            leavePlayer.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamNull);
            leavePlayer.SetTeamInfo(ePlayerTeamInfo.TeamID, 0);
            leavePlayer.SetTeamInfo(ePlayerTeamInfo.CustomID, 0);
            tempTeam.SendTeamLeave(eLeaveTeam.KICK, roleID, leaveID);
            tempTeam.DeletePlayer(leaveID);
            tempTeam.SendTeamList();
            logger.info("Leave team by other[%s] customID[%s] teamID[%s] role [%s->%s]", roleID, customID, teamID,
                        leaveID, leavePlayer.GetPlayerInfo(ePlayerInfo.NAME));
            pomelo.app.rpc.chat.chatRemote.RoomDeletePlayer(null, customID, teamID, leaveID, utils.done);
        }
    }
    return 0;
};

Handler.DeleteTeam = function (customID, teamID) {
    var tempCustomList = this.teamList[customID];
    if (null == tempCustomList) {
        return;
    }
    tempCustomList[teamID] = null;
};

Handler.GetTeamList = function (customID, levelTarget, unionID) {
    var teamList = [];
    var customList = this.teamList[customID];
    for (var i = defaultValues.maxVipLevel; i >= 0; --i) {
        for (var index in customList) {
            var tempTeam = customList[index];
            if(tempTeam != null){
                if(unionID != null && isUnionTarget(levelTarget)){
                    if(unionID != tempTeam.GetTeamInfo(eTeamInfo.UnionID)){
                        continue;
                    }
                }
                if(tempTeam.GetTeamState() == eTeamState.Room
                    && tempTeam.GetTeamInfo(eTeamInfo.VipLevel) == i){
                    teamList.push(tempTeam.GetClientInfo());
                }
            }
            if (teamList.length >= defaultValues.teamNum) {
                break;
            }
        }
        if (teamList.length >= defaultValues.teamNum) {
            break;
        }
    }
    return teamList;
};

function isUnionTarget(levelTarget){
    if(levelTarget == null){
        return false;
    }

    if(levelTarget == gameConst.eLevelTarget.Train ||
        levelTarget == gameConst.eLevelTarget.unionFight ){
        return true;
    }

    return false;
}

Handler.GetTeam = function (customID, teamID) {
    var customList = this.teamList[customID];
    if (null == customList) {
        return null;
    }
    return customList[teamID];
};

Handler.GetJoinTeam = function (customID, unionID, spouseID) {
    var customList = this.teamList[customID];
    if (null == customList) {
        return null;
    }
    var rTeam = null;
    for (var index in customList) {
        var tempTeam = customList[index];
        if (null != tempTeam && tempTeam.IsJoin('') == 0) {
            if(unionID != null) {
                if(tempTeam.GetTeamInfo(eTeamInfo.UnionID) != unionID){
                    continue;
                }
            }
            if(spouseID){   //婚姻副本 快速加入 只能加入结婚对象的队伍
                if(tempTeam.GetTeamInfo(eTeamInfo.OwnerID) != spouseID){
                    continue;
                }
            }
            rTeam = tempTeam;
            break;
        }
    }
    return rTeam;
};

Handler.GetTeamPlayerList = function(customID, teamID) {
    var customList = this.teamList[customID];
    if(null == customList) {
        return null;
    }
    var team = customList[teamID];
    if(null == team) {
        return null;
    }
    return team.GetPlayerList();
};

/**
 * 获取房间总数
 * @api public
 * @return {Number}
 * */
Handler.getTeamNumber = function() {
    var sumNum = 0;
    var teamList = this.teamList;
    for (var index in teamList) {
        sumNum += (_.compact(teamList[index])).length;
    }
    return sumNum;
};
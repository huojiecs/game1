/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-6
 * Time: 下午4:58
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var teamManager = require('../../../rs/team/teamManager');
var OccupantManager = require('../../../rs/occupant/occupantManager');
var playerManager = require('../../../rs/player/playerManager');
var weddingManager = require('../../../rs/marry/weddingManager');
var gameConst = require('../../../tools/constValue');
var ePlayerTeamInfo = gameConst.ePlayerTeamInfo;
var eTeamState = gameConst.eTeamState;
var ePlayerInfo = gameConst.ePlayerInfo;
var eMarryInfo = gameConst.eMarryInfo;
var eXuanYan = gameConst.eXuanYan;
var errorCodes = require('../../../tools/errorCodes');
var idipUtils = require('../../../tools/idipUtils');
var rsSql = require('../../../tools/mysql/rsSql');
var utils = require('../../../tools/utils');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;
handler.AddPlayer = function (playerInfo, csID, uid, sid, callback) {
    playerManager.AddPlayer(playerInfo, csID, uid, sid);
    OccupantManager.SendOccupant(uid, sid);
    return callback();
};


handler.DeletePlayer = function (roleID, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null != player) {
        var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
        var teamID = player.GetTeamInfo(ePlayerTeamInfo.TeamID);
        var tempTeam = teamManager.GetTeam(customID, teamID);
        if (null != tempTeam) {
            teamManager.LeaveTeam(player, player, tempTeam, customID, teamID);
        }
        playerManager.DeletePlayer(roleID);
    }
    return callback();
};

handler.UpdatePlayerValue = function (roleID, index, value, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null != player) {
        player.SetPlayerInfo(index, value);
    }
    return callback();
};

handler.SetTeamState = function (customID, teamID, callback) {
    var tempTeam = teamManager.GetTeam(customID, teamID);
    if (null != tempTeam) {
        tempTeam.SetTeamState(eTeamState.Room);
    }
    return callback();
};

handler.SetOccupantSco = function (roleID, roleName, roleSco, customID, unionID, unionName, roleLevel, callback) {
    OccupantManager.PlayerSco(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
    return callback();
};

handler.SendOccupantList = function (uid, sid, callback) {
    OccupantManager.SendOccupant(uid, sid);
    return callback();
};

handler.DeleteOccupantRole = function (roleID, callback) {
    OccupantManager.DeleteCustom(roleID);

    //删号时如果玩家结婚了 需要做离婚操作
    if(!!weddingManager.marryInfo[roleID]){
        var marrtID = weddingManager.marryInfo[roleID][eMarryInfo.roleID];
        var toMarryID = weddingManager.marryInfo[roleID][eMarryInfo.toMarryID];

        if(roleID == marrtID){
            marrtID = toMarryID;
        }
        var player = playerManager.GetPlayer(marrtID);
        if (!!player) {
            //删号时如果玩家结婚了 需要做离婚操作
            pomelo.app.rpc.cs.csRemote.RemoveMarry(null, player["csID"], marrtID, utils.done);
        }else{
            //直接修改数据库 离婚操作
            rsSql.SaveDivorceMarry(roleID, marrtID, function(err, res){
                if (!!err) {
                    logger.error('error when SaveDivorceMarry file: rsRemote , %s', player.id,
                        utils.getErrorMessage(err));
                }
            });
        }
    }
    rsSql.DeleteRoleForMarry(roleID, function(err, res){
        if (!!err) {
            logger.error('error when DeleteRoleForMarry  file: rsRemote , %s', player.id,
                utils.getErrorMessage(err));
        }
    });


    return callback();
};

handler.GetOccupantID = function (roleID, callback) {
    var customID = OccupantManager.GetOccupantCustomID(roleID);
    return callback(null, customID);
};

handler.GetOccupantRoleID = function (customID, callback) {
    var roleID = OccupantManager.GetOccupantRoleID(customID);
    return callback(roleID);
};


handler.GetCustomId = function (roleID, npcID, att, result, expLevel, msgExpLevel, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(null, null, npcID, att, result, expLevel, msgExpLevel);
    }
    var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
    return callback(null, customID, npcID, att, result, expLevel, msgExpLevel);
};

handler.GetTeamPlayerList = function (customID, teamID, callback) {
    var playerList = teamManager.GetTeamPlayerList(customID, teamID);
    return callback(playerList);
};

handler.idipCommands = function (data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);

    var rsCommands = require('../../../adminCommands/rsCommands');

    idipUtils.dispatchIdipCommands(rsCommands, data_packet, callback);
};

// 清理公会占领信息
handler.ChangePlayerUnionID = function (roleID, unionID, unionName, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (player != null) {
        player.SetPlayerInfo(ePlayerInfo.UnionID, unionID);
        player.SetPlayerInfo(ePlayerInfo.UnionName, unionName != null ? unionName : '');
    }

    OccupantManager.ChangeRoleUnionID(roleID, unionID, unionName != null ? unionName : '');
    return callback(null);
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

handler.SetDukeUnionID = function (dukeID, callback) {
    playerManager.SetDukeUnionID(dukeID);
    return callback(null);
};

//同步marryInfo 结婚信息
handler.UpdateMarryInfo = function(marryInfo, callback){
    var roleID = marryInfo[eMarryInfo.roleID];
    var toMarryID = marryInfo[eMarryInfo.toMarryID];
    var marryInfoTo = _.clone(marryInfo);
    weddingManager.marryInfo[roleID] = marryInfoTo;
    weddingManager.marryInfo[roleID]['chart'] = 1;
    weddingManager.marryInfo[toMarryID] = marryInfo;
    weddingManager.marryInfo[toMarryID]['chart'] = 0;
    if(2 == marryInfo[eMarryInfo.state]){
        //删除离婚协议
        weddingManager.DelMarryLog(roleID, toMarryID);
        //清空爱的礼物记录
//        delete weddingManager.marryGift[roleID];
//        delete weddingManager.marryGift[toMarryID];
        var marryGift = {
            0: roleID,          //角色ID
            1: toMarryID,          //配偶ID
            2: 0,         //花束
            3: 0,            //吻
            4: 0,           //礼物
            5: 0,       //当天已送出香吻次数  每天免费一次
            6: 0,       //当天已送出花束次数  每天免费一次  付费3次
            7: 0,       //当天花钱购买礼物次数  每天限制所有礼物一共6次
            8:0      //个人姻缘总值
        };
        weddingManager.marryGift[roleID] = marryGift;
        var marryGiftTo = {
            0: toMarryID,          //角色ID
            1: roleID,          //配偶ID
            2: 0,         //花束
            3: 0,            //吻
            4: 0,           //礼物
            5: 0,       //当天已送出香吻次数  每天免费一次
            6: 0,       //当天已送出花束次数  每天免费一次  付费3次
            7: 0,       //当天花钱购买礼物次数  每天限制所有礼物一共6次
            8:0      //个人姻缘总值
        };
        weddingManager.marryGift[toMarryID] = marryGiftTo;
    }
    if(1 == marryInfo[eMarryInfo.state]){
        weddingManager.SendYinYuan(roleID);
        weddingManager.SendYinYuan(toMarryID);
    }

    return callback(null, 0);
}

//玩家登陆时 查看是否有当前举行的婚礼 有就发送消息
handler.SendNowWedding = function(roleID, callback){
    weddingManager.SendNowWedding(roleID, callback);
}


//同步 宣言信息
handler.UpdateXuanYan = function(xuanyanInfo, callback){
    var roleID = xuanyanInfo[eXuanYan.roleID];
    var toMarryID = xuanyanInfo[eXuanYan.xuanYan];
    weddingManager.xuanYanList[roleID] = xuanyanInfo;

    return callback(null, 0);
}

//拒绝离婚协议 清楚老的离婚协议
handler.RefuseDivorce = function(roleID, toDivorceID, type, callback){
    //删除离婚协议
    weddingManager.DelMarryLog(roleID, toDivorceID, 3);
    //添加夫妻日志信息
    weddingManager.AddMarryLog(roleID, toDivorceID, 3, type);
    return callback(null, 0);
}

//添加离婚信到 夫妻日志
handler.AddDivorceLog = function(roleID, toDivorceID, type, callback){
    //添加夫妻日志信息
    weddingManager.AddMarryLog(roleID, toDivorceID, 3, type);
    return callback(null, 0);
}

//查看婚礼列表
handler.FindNameToMarry = function (roleID, name, callback) {
    weddingManager.FindNameToMarry(roleID, name, callback);
};

//查看婚礼列表
handler.GetWedding = function (roleID, callback) {
    weddingManager.GetWedding(roleID, callback);
};

//预约婚礼
handler.YuYueWedding = function (roleID, wedID, marryLevel, bless, callback) {
    weddingManager.YuYueWedding(roleID, wedID, marryLevel, bless, callback);
};

//发送当前婚礼消息
handler.SendWedding = function (callback) {
    weddingManager.SendWedding();
    return callback();
};

//获取爱的礼物信息
handler.GetMarryGiftInfo = function (roleID, callback) {
    weddingManager.GetMarryGiftInfo(roleID, callback);
};

//赠送爱的礼物
handler.GiveMarryGift = function (roleID, giftID, giveType, callback) {
    weddingManager.GiveMarryGift(roleID, giftID, giveType, callback);
};

//进入婚礼 返回当前时段 所有婚礼
handler.BeginWedding = function (roleID, callback) {
    weddingManager.BeginWedding(roleID, callback);
};

//进入某一婚礼
handler.ComingWedding = function (roleID, marryID, callback) {
    weddingManager.ComingWedding(roleID, marryID, callback);
};

//祝福某一婚礼
handler.BlessWedding = function (roleID, marryID, callback) {
    weddingManager.BlessWedding(roleID, marryID, callback);
};


//结婚之后基础信息界面
handler.GetMarryInfo = function (roleID, callback) {
    weddingManager.GetMarryInfo(roleID, callback);
};

//领取红包
handler.GetHongBao = function (roleID, marryID, callback) {
    weddingManager.GetHongBao(roleID, marryID, callback);
};

//购买婚礼特效
handler.BuyEffectWedding = function (roleID, texiaoID, callback) {
    weddingManager.BuyEffectWedding(roleID, texiaoID, callback);
};

//查看其他玩家結婚信息
handler.OtherMarryInfo = function (otherID, callback) {
    weddingManager.OtherMarryInfo(otherID, callback);
};

//获取夫妻日志
handler.GetMarryLog = function (roleID, callback) {
    weddingManager.GetMarryLog(roleID, callback);
};

//排行榜操作 获取夫妻赠送礼物的信息
handler.GetChartMarryGift = function (roleID, callback) {
    weddingManager.GetChartMarryGift(roleID, callback);

};

handler.dukeFightEnd = function (dukeID, callback) {
    playerManager.SetDukeUnionID(dukeID);
    playerManager.deleteDamageRate();
    return callback(null);
};

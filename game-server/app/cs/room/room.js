/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-19
 * Time: 上午10:48
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var _ = require('underscore');
var gameConst = require('../../tools/constValue');
var cityManager = require('../majorCity/cityManager');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var playerManager = require('../player/playerManager');
var aoiManager = require('pomelo-aoi');
var aoiEventManager = require('../aoi/aoiEventManager');
var messageService = require('../../tools/messageService');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var defaultValues = require('../../tools/defaultValues');
var config = require('../../tools/config');
if (!config) {
    return;
}

var ePlayerInfo = gameConst.ePlayerInfo;
var eEntityType = gameConst.eEntityType;
var eLifeState = gameConst.eLifeState;
var eTeamInfo = gameConst.eTeamInfo;
var eMisType = gameConst.eMisType;
var eCreateType = gameConst.eCreateType;
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var eCustomInfo = gameConst.eCustomInfo;
var eCustomType = gameConst.eCustomType;
var eLevelTarget = gameConst.eLevelTarget;
var eGiftType = gameConst.eGiftType;
var tCustom = templateConst.tCustom;
var tCustomList = templateConst.tCustomList;
var tVipTemp = templateConst.tVipTemp;
var eAttInfo = gameConst.eAttInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eSoulType = gameConst.eSoulType;
var eRoomMemberTlogInfo = gameConst.eRoomMemberTlogInfo;
var eItemType = gameConst.eItemType;
var eWeaponType = gameConst.eWeaponType;
var eArmorType = gameConst.eArmorType;
var eJewelryType = gameConst.eJewelryType;
var tItem = templateConst.tItem;
var tAssets = templateConst.tAssets;
var eSkillInfo = gameConst.eSkillInfo;
var tSkill = templateConst.tSkill;
var eCustomSmallType = gameConst.eCustomSmallType;
var eLoginType = gameConst.eLoginType;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var guid = require('../../tools/guid');
var insLogSql = require('../../tools/mysql/insLogSql');
var eTableTypeInfo = gameConst.eTableTypeInfo;
var eMoneyChangeType = gameConst.eMoneyChangeType;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 关卡内购买血蓝瓶*/
var BUY_HP_AND_MP = 180;

/*module.exports = function (teamInfo, customID) {
 return new Handler(teamInfo, customID);
 };*/

var Handler = function (teamInfo, customID) {
    var config = {
        width: 100000,
        height: 100000,
        towerWidth: 100000,
        towerHeight: 100000
    };
    this.playerList = {};
    this.roomZhu = {
        zhuID: 0,
        isBegin: false,
        beginTime: 0
    };
    //翻牌
    this.roomFlop = {
        isWin_Flop: false,
        isNotWin_Flop: false,
        customID_Flop: 0,
        levelTarget: 0
    };
    this.tlogInfo = {
        createTime: utils.dateString(),
        member: {}
    };
    this.teamInfo = teamInfo;
    this.CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    this.aoi = aoiManager.getService(config);
    aoiEventManager.addEvent(this, this.aoi.aoi);
};

module.exports = Handler;

var handler = Handler.prototype;

handler.AddPlayer = function (roleID) {
    var player = playerManager.GetPlayer(roleID);
    var myVipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == myVipLevel || myVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', myVipLevel + 1);
    }
    var vipAddNum = 0;
    if (null != vipTemplate) {
        vipAddNum = vipTemplate[templateConst.tVipTemp.copyDiedReliveNum];
    }
    var lifeNum = this.CustomTemplate[tCustom.lifeNum];
    this.playerList[roleID] = {
        lifeType: eLifeState.Revive,
        reliveNum: 0,
        lifeNum: lifeNum + vipAddNum,
        inCustom: 0
    };
    this.tlogInfo.member[roleID] = {
        cheating: 0,
        customID: 0,
        moneyGet: 0,
        zuanshiGet: 0,
        expGet: 0,
        zuanshiCost: 0,
        reliveNum: 0,
        reliveCost: 0,
        buyHpCount: 0,
        buyMpCount: 0
    };
};

handler.GetTeamInfo = function (index) {
    return this.teamInfo[index];
};

handler.SetPlayerInCustom = function (roleID, player, tlogInfo) {
    var self = this;
    var tempPlayer = this.playerList[roleID];
    if (null != tempPlayer) {
        tempPlayer.inCustom = 1;
    }

    if (this.roomZhu.zhuID == 0) {
        var nowTime = new Date();
        this.roomZhu.isBegin = true;
        this.SetRoomZhu(nowTime.getTime());
    }

    var playerNum = 0;
    var inNum = 0;
    for (var index in this.playerList) {
        ++playerNum;
        if (this.playerList[index].inCustom == 1) {
            ++inNum;
        }
    }

    logger.info('玩家数量是%j,进入的玩家数量是%j', playerNum, inNum);

    // 处理玩家载入场景超时,没有正常进入游戏情况.
    if (!self.timeoutAction) {
        self.timeoutAction = setTimeout(function () {
            for (var index in self.playerList) {
                if (self.playerList[index].inCustom != 1) {     //超时提出状态错误玩家

                    var rPlayer = playerManager.GetPlayer(index);
                    if (!!rPlayer) {
                        self.CheatGameOver(rPlayer);

                        var accountID = rPlayer.GetPlayerInfo(ePlayerInfo.ACCOUNTID);
                        pomelo.app.rpc.ps.psRemote.UserLeave(null, pomelo.app.getServerId(), rPlayer.GetUid(),
                                                             accountID, 0, utils.done);
                    }
                }
            }
            self.SendGameBegin(player);
        }, 20000);
    }

    if (inNum == playerNum) {
        logger.info('SendGameBegin %d', roleID);
        this.SendGameBegin(player);
        if (!!self.timeoutAction) {
            clearTimeout(self.timeoutAction);
            delete self.timeoutAction;
        }
    }

    if (null != tlogInfo) {
        this.TlogRoundStartFlow(roleID, player, tlogInfo);
    }
};

handler.SetRoomZhu = function (nowSec) {
    if (this.roomZhu.isBegin == true) {
        if (nowSec - this.roomZhu.beginTime > defaultValues.roomChangeZhu) {
            var zhuID = this.roomZhu.zhuID;
            for (var index in this.playerList) {
                if (index != zhuID) {
                    this.roomZhu.zhuID = index;
                    this.roomZhu.beginTime = nowSec;
                    this.SendRoomZhu(this.roomZhu.zhuID);
                }
            }
        }
    }
};

handler.DeletePlayer = function (roleID) {
    delete this.playerList[roleID];
    //delete this.tlogInfo.member[roleID];
};

/**
 * @return {boolean}
 */
handler.IsPlayerInTeam = function (roleID) {
    return !!this.playerList[roleID];
};

handler.AddAoi = function (player, pos) {
    this.aoi.addWatcher(player, pos, 2);
    this.aoi.addObject(player, pos);
};

handler.RemoveAoi = function (player, pos) {
    this.aoi.removeObject(player, pos);
    this.aoi.removeWatcher(player, pos, 2);
};

handler.UpdateAoi = function (player, oldPos, newPos) {
    this.aoi.updateObject(player, oldPos, newPos);
    this.aoi.updateWatcher(player, oldPos, newPos, 2, 2);
};

handler.GetWatcherUids = function (pos, types) {
    var watchers = this.aoi.getWatchers(pos, types);
    var result = [];
    if (!!watchers && !!watchers[eEntityType.PLAYER]) {
        var pWatchers = watchers[eEntityType.PLAYER];
        for (var entityId in pWatchers) {
            var player = playerManager.GetPlayer(entityId);
            if (!!player && !!player.userId) {
                result.push({uid: player.userId, sid: player.serverId});
            }
        }
    }
    return result;
};

handler.Relive = function (player) {
    if (null == player) {
        return errorCodes.NoRole;
    }
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var roomPlayer = this.playerList[roleID];
    if (null == roomPlayer) {
        return errorCodes.NoRole;
    }
    var lifeNum = roomPlayer.lifeNum;
    if (lifeNum <= 0) {
        return errorCodes.Cs_RoomLifeNum;
    }
    var playerLife = player.GetPlayerInfo(ePlayerInfo.LifeNum);
    var reliveNum = roomPlayer.reliveNum;
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_moneyChangeFlag = false;        //复活是否引起金钱变化的标志位
    var log_moneyType = globalFunction.GetReliveMoney(reliveNum).moneyID;
    var log_beforeChange = player.GetAssetsManager().GetAssetsValue(log_moneyType);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    if (playerLife <= 0) {  //TODO VIP 副本死亡复活次数
        var myVipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        var vipTemplate = null;
        if (null == myVipLevel || myVipLevel == 0) {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
        } else {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', myVipLevel + 1);
        }
        if (null == vipTemplate) {
            return errorCodes.NoTemplate;
        }
        var vipAddNum = vipTemplate[tVipTemp.copyDiedReliveNum];

        if (roomPlayer.reliveNum >= this.CustomTemplate[tCustom.lifeNum] + vipAddNum) {
            return errorCodes.Cs_RoomLifeNum;
        }

        log_moneyChangeFlag = true;
        var needMoney = globalFunction.GetReliveMoney(reliveNum);
        if (player.GetAssetsManager().CanConsumeAssets(needMoney.moneyID, needMoney.moneyNum) == false) {
            return errorCodes.NoYuanBao;
        }
        //player.GetAssetsManager().SetAssetsValue(needMoney.moneyID, -needMoney.moneyNum);
        player.GetAssetsManager().AlterAssetsValue(needMoney.moneyID, -needMoney.moneyNum, eAssetsReduce.CustomRelive);
        roomPlayer.reliveNum = reliveNum + 1;
        //for tlog ////////
        this.UpdatePlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.zuanshiCost, needMoney.moneyNum);
        this.UpdatePlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.reliveCost, needMoney.moneyNum);
        ///////////////////
    }
    else {
        player.SetPlayerInfo(ePlayerInfo.LifeNum, playerLife - 1);
        player.GetVipInfoManager().setNumByType(roleID, gameConst.eVipInfo.FreeReliveNum, 1);
    }
    roomPlayer.lifeNum -= 1;
    player.SetWorldState(eWorldState.LifeState, eLifeState.Revive);
    this.SendPlayerAtt(player, 0, 0, eLifeState.Revive);
    // for tlog
    this.UpdatePlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.reliveNum, 1);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ReliveGuid = guid.GetUuid();       //logID
    var log_ReliveArgs = [log_ReliveGuid, roleID, player.GetWorldState(gameConst.eWorldState.CustomID), lifeNum,
                          playerLife, utilSql.DateToString(new Date())];
    insLogSql.InsertSql(eTableTypeInfo.Relive, log_ReliveArgs);
    //logger.info( '玩家复活 数据入库成功' );

    if (true == log_moneyChangeFlag) {
        var log_afterChange = player.GetAssetsManager().GetAssetsValue(log_moneyType);
        var log_MoneyArgs = [guid.GetUuid(), roleID, eMoneyChangeType.RELIVE, log_ReliveGuid, log_moneyType,
                             log_beforeChange, log_afterChange, utilSql.DateToString(new Date())];
        insLogSql.InsertSql(eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( '玩家复活金钱变化 数据入库成功' );
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return 0;
};

handler.GameOver =
function (player,  areaWin, customSco, starNum, ipAddress, tlogInfo, params, callback) {
    var res = {
        result: 0
    };

    var customID = this.teamInfo[eTeamInfo.CustomID];
    var teamID = this.teamInfo[eTeamInfo.TeamID];
    var levelTarget = this.teamInfo[eTeamInfo.LevelTarget];
    var roleID = player.id;
    var itemMsg = [];

    player.GetCustomManager().AddSpecialCustom(customID, levelTarget);

    var oldCustom = player.GetCustomManager().GetCustom(customID, levelTarget);
    if (null == oldCustom) {
        res.result = errorCodes.Cs_NoCustom;
        callback(null, res);
        return;
    }
    var CustomTemplate = oldCustom.GetTemplate();
    var customType = CustomTemplate[tCustom.type];
    //翻牌需要数据
    this.roomFlop.isNotWin_Flop = false;
    if (oldCustom.GetCustomInfo(eCustomInfo.WIN) != 1) {
        this.roomFlop.isNotWin_Flop = true;
    }
    this.roomFlop.customID_Flop = customID;
    this.roomFlop.isWin_Flop = false;
    this.roomFlop.levelTarget = this.teamInfo[eTeamInfo.LevelTarget];
    if (areaWin == 1) {
        this.roomFlop.isWin_Flop = true;
    }
    player.flopManager.UpdateCustomInfo(this.roomFlop);

    oldCustom.SetCustomInfo(eCustomInfo.WIN, areaWin);
    var starSum = 0;

    if (areaWin == 1) {
        if(levelTarget != gameConst.eLevelTarget.StoryDrak){
            oldCustom.SetCustomInfo(eCustomInfo.SCO, customSco);
        }

        if (customType == eCustomType.Single) {
            var bigID = CustomTemplate[tCustom.bigCustomID];
            if (bigID > 0) {
                var CustomListTemplate = templateManager.GetTemplateByID('CustomListTemplate', bigID);
                if (null != CustomListTemplate) {
                    var customNum = CustomListTemplate[tCustomList.customNum];
                    for (var i = 0; i < customNum; ++i) {
                        var tempID = CustomListTemplate['custom_' + i];
                        var tempCustom = player.GetCustomManager().GetCustom(tempID, levelTarget);
                        if (null != tempCustom) {
                            starSum += tempCustom.GetCustomInfo(eCustomInfo.StarNum);
                        }
                    }
                    var oldStarNum = oldCustom.GetCustomInfo(eCustomInfo.StarNum);
                    if (starNum > oldStarNum) {
                        starSum += (starNum - oldStarNum);
                        oldCustom.SetCustomInfo(eCustomInfo.StarNum, starNum);
                        var giftNum = CustomListTemplate[tCustomList.giftNum];
                        for (var i = 0; i < giftNum; ++i) {
                            var tempID = CustomListTemplate['giftID_' + i];
                            player.GetGiftManager().AddGift(tempID, eGiftType.CustomLevel, starSum);
                        }
                    }
                }
            }
        }
        else if (customType == eCustomType.Hell) {
            var roleName = player.GetPlayerInfo(ePlayerInfo.NAME);
            var uid = player.GetUid();
            var sid = player.GetSid();
            var unionID = player.GetPlayerInfo(ePlayerInfo.UnionID);
            var unionName = player.GetPlayerInfo(ePlayerInfo.UnionName);
            var roleLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            pomelo.app.rpc.rs.rsRemote.SetOccupantSco(null, roleID,
                                                      roleName, customSco, customID, unionID, unionName, roleLevel,
                                                      utils.done);

            pomelo.app.rpc.rs.rsRemote.SendOccupantList(null, uid, sid, utils.done);

        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemFlag = false;       //标示通关是否获取物品
    var log_ItemGuid = guid.GetUuid();                                 //logID
    var log_RoleID = player.id;                                         //角色ID
    var log_ChangeType = gameConst.eItemChangeType.GAMEOVER;       //物品变化原因
    var log_EmandationType = gameConst.eEmandationType.ADD;         //增、删
    var log_AddTime = utilSql.DateToString(new Date());     //添加时间
    for (var index in itemMsg) {
        log_ItemFlag = true;
        var log_ItemArgs = [log_ItemGuid];
        var tempItem = itemMsg[index];
        for (var i = 0; i < gameConst.eItemInfo.Max; ++i) {      //将物品的详细信息插入到sql语句中
            log_ItemArgs.push(tempItem.GetItemInfo(i));
        }
        log_ItemArgs.push(log_ChangeType);
        log_ItemArgs.push(log_EmandationType);
        log_ItemArgs.push(log_AddTime);
        insLogSql.InsertSql(eTableTypeInfo.ItemChange, log_ItemArgs);     //将物品变化插入数据库
        //logger.info('通关结算物品 入库成功 ');
    }
    var log_GameOverGuid = guid.GetUuid();                 //通关结算的logID
    var log_MoneyType = globalFunction.GetMoneyTemp();     //金钱类型
    var log_BeforeMoney = player.GetAssetsManager().GetAssetsValue(log_MoneyType);  //变化前金钱值
    var log_MoneyArgs = [guid.GetUuid(), log_RoleID, eMoneyChangeType.GAMEOVER, log_GameOverGuid, log_MoneyType,
                         log_BeforeMoney];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //player.GetItemManager().SendItemMsg(player, itemMsg, eCreateType.New, gameConst.eItemOperType.GetItem);
    //player.AddExp(winExp);
    // 关卡结束，如果是活动关卡，给活动加上5分钟CD
    if (levelTarget == eLevelTarget.Activity) {
        var activities = templateManager.GetAllTemplate('ActivityTemplate');
        if (null != activities) {
            for (var index in  activities) {
                var temp = activities[index];
                if (temp["timeCd"] == 0) {
                    for (var i = 0; i < temp["activityNum"]; ++i) {
                        if (temp["activity_" + i] > 0 && temp["activity_" + i] == customID) {
                            var activityID = +index;
                            var nowDate = new Date();
                            player.GetActivityManager().activityList[activityID].SetActivityCD(new Date(nowDate.getTime()
                                                                                                            + 5 * 60
                                                                                                            * 1000));
                        }
                    }
                }
            }
        }
    }

    if (null == this.tlogInfo.member[roleID]) {
        this.tlogInfo.member[roleID] = {
            cheating: 0,
            customID: 0,
            moneyGet: 0,
            zuanshiGet: 0,
            expGet: 0,
            zuanshiCost: 0,
            reliveNum: 0,
            reliveCost: 0,
            buyHpCount: 0,
            buyMpCount: 0
        };
    }
    this.tlogInfo.member[roleID].customID = player.GetWorldState(eWorldState.CustomID); // for tlog
    this.tlogInfo.member[roleID].reliveNum =
    this.tlogInfo.member[roleID] ? this.tlogInfo.member[roleID].reliveNum : 0; // for tlog

    player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.TakePvp, customID, 1);     //判断悬赏任务是否完成

    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if(customTemplate == null){
        return callback(null, res);
    }

    var msg = {
        roleID: player.id,
        customWin: areaWin,
        customSco: customSco,
        params : params
    };


    switch (levelTarget) {
        case eLevelTarget.Normal:
            if (areaWin == 1) {
                player.GetMissionManager().IsMissionOver(eMisType.SpecifyCus, customID, 1);
                player.GetMissionManager().IsMissionOver(eMisType.AnyCustom, customID, 1);
                player.GetMissionManager().IsMissionOver(gameConst.eMisType.StarNum, bigID, starSum);     //任务完成
                player.GetMissionManager().IsMissionOver(gameConst.eMisType.StarNum, bigID, starSum);     //发送两次已保证新建任务的进度更新
//                player.GetAchieveManager().AchieveOver(player, gameConst.eAchiType.Custom, customID, 1);
//                pomelo.app.rpc.rs.rsRemote.SetTeamState(null, customID, teamID, utils.done);
                player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.SpecifyCus, customID, 1);     //判断悬赏任务是否完成
            }
            callback(null, res);
            break;
        case eLevelTarget.Activity:
            var activityID = this.teamInfo[eTeamInfo.LevelParam];
            if (player.activityManager != null && activityID != 0 && areaWin) {
                player.activityManager.Accomplish(activityID, customID);
                player.GetMissionManager().IsMissionOver(eMisType.SpecifyCus, customID, 1);
                player.GetMissionManager().IsMissionOver(eMisType.AnyCustom, customID, 1);
            }
            callback(null, res);
            break;
        case eLevelTarget.ZhanHun:
            player.asyncPvPManager.Accomplish(customID, areaWin, function (err, data) {
                if (err) {
                    logger.info('pvp 出现问题%j', err);
                    res["result"] = errorCodes.SystemWrong;
                }
                else {
                    //player.GetMissionManager().IsMissionOver(player, eMisType.TakePvp, 0, 1);
                    if (areaWin) {
                        player.GetMissionManager().IsMissionOver(eMisType.WinPvp, 0, 1);
                    }
                    res["players"] = data;
                }
                callback(null, res);
            });
            break;
        case  eLevelTarget.FaBao:
            player.soulManager.Accomplish(customID, areaWin, function (err, res) {
                if (err) {
                    logger.info('FaBao出现问题err=%j,result=', err, res);
                    res["result"] = errorCodes.SystemWrong;
                }
                else if (res.result > 0) {
                    logger.info('FaBao出现问题err=%j,result=', err, res);
                    res["result"] = res.result;
                }
                else {
                    res["result"] = 0;
                }
                callback(null, res);
            });
            break;
        case  eLevelTarget.Climb:
            player.climbManager.Accomplish(customID, areaWin, function (err, res) {
                if (err || res.result > 0) {
                    logger.info('爬塔关卡战斗出现问题err=%j,result=', err, res);
                    res["result"] = res.result;
                }
                else {
                    res["result"] = 0;
                }
                callback(null, res);
            });
            break;
        case  eLevelTarget.Ares:
            /** 战神榜副本， 暂时 没有特殊处理， 处理 在pvp 进行*/
            callback(null, res);
            break;
        case eLevelTarget.SoulEvolve:
            player.soulManager.AccomplishEvolve(customID, areaWin, function (err, res) {
                if (err) {
                    logger.info('SoulEvolve出现问题err=%j,result=', err, res);
                    res["result"] = errorCodes.SystemWrong;
                }
                else if (res.result > 0) {
                    logger.info('SoulEvolve出现问题err=%j,result=', err, res);
                    res["result"] = res.result;
                }
                else {
                    res["result"] = 0;
                }
                callback(null, res);
            });
            break;
        case eLevelTarget.StoryDrak:
            if(areaWin <= 0){
                callback(null, res);
                break;
            }

            player.GetStoryDrak().addAtkTimes();
            if(params == null){
                return  callback(null, res);
            }

            var newAchieve = 0;
            var score = defaultValues.storyBaseScore - (params.useTime - customTemplate['param_Time']) * defaultValues.storyFixA;
            if(score < defaultValues.storyMinScore){
                score = defaultValues.storyMinScore;
            }
            if(params.isTrans){
                score += customTemplate['isTransScore'];
                newAchieve |= 1 << 2;
            }
            if(params.useHp){
                score += customTemplate['useHpScore'];
                newAchieve |= 1 << 1;
            }
            if(params.beAttacked){
                score += customTemplate['beAtrackedScore'];
                newAchieve |= 1 << 0;
            }

            if(score > oldCustom.GetCustomInfo(eCustomInfo.SCO)){
                oldCustom.SetCustomInfo(eCustomInfo.SCO, score);
                var totalScore = player.GetStoryDrak().calStoryScore();
                oldCustom.SetCustomInfo(eCustomInfo.Achieve, newAchieve);

                var roleInfo = {
                    roleID:roleID,
                    score:totalScore
                };
                pomelo.app.rpc.chart.chartRemote.UpdateStoryScore(null,roleInfo, utils.done);

                var scoreGift = templateManager.GetTemplateByID('GiftTemplate', customTemplate['giftID']);
                if(scoreGift != null){
                    player.GetGiftManager().AddGift(+customTemplate['giftID'], eGiftType.StoryDrak, score);
                }

            }

            /*

            var oldAchieve = oldCustom.GetCustomInfo(eCustomInfo.Achieve);
            newAchieve |= oldAchieve;
            if(newAchieve != oldAchieve){
                oldCustom.SetCustomInfo(eCustomInfo.Achieve, newAchieve);
            }
            */

            logger.warn('player %j has finish the story custom %j.and param is %j', roleID, customID,  params);

            msg.customSco = score;

            player.GetStoryDrak().SendStoryMsg();

            callback(null, res);

            break;

        case eLevelTarget.TeamDrak:

            player.GetStoryDrak().addTeamTimes();
            player.GetStoryDrak().SendStoryMsg();

            logger.warn('player %j has finish the team custom %j.and param is %j', roleID, customID,  params);

            callback(null, res);

        default:
            callback(null, res);
    }

    if (levelTarget != eLevelTarget.Activity) {
        player.GetCustomManager().SendCustomMsg(levelTarget, customID);
    }

    var cityInfo = cityManager.AddPlayer(player);
    player.SetWorldState(eWorldState.PosState, ePosState.Hull);
    player.SetWorldState(eWorldState.CustomID, cityInfo.cityID);
    var pos = player.GetPosition();
    this.SendGameOver(player, msg);
    this.RemoveAoi(player, pos);
    this.DeletePlayer(roleID);
    if (_.size(this.playerList) == 0) {
        this.roomZhu.isBegin = false;
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(log_MoneyType));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    insLogSql.InsertSql(eTableTypeInfo.MoneyChange, log_MoneyArgs);     //将金钱变化插入数据库
    //logger.info('通关结算金钱 入库成功 ' + log_GameOverGuid );

    var log_ItemListGuid = 0;                //物品在物品数据表中的guid
    if (true == log_ItemFlag) {
        log_ItemListGuid = log_ItemGuid;
    }
    var log_GameOverArgs = [log_GameOverGuid, player.id, customID, log_ItemListGuid, areaWin, customSco,
                            0, 0, utilSql.DateToString(new Date())];
    insLogSql.InsertSql(eTableTypeInfo.GameOver, log_GameOverArgs);     //将结算事件插入数据库

    logger.info('GameOver: %j', log_GameOverArgs);
    //logger.info('通关结算事件 入库成功');
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // for tlog 第一期  ////////////////////////////////////////////////////////////////
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    if (levelTarget != eLevelTarget.Climb) {
        if (levelTarget == eLevelTarget.ZhanHun) {
            var battleType = 1;
        } else if (levelTarget == eLevelTarget.Team) {
            var battleType = 2;
        } else {
            var battleType = 0;
        }
        tlogger.log('RoundFlow', accountType, openID, battleType, customType, customSco, 0, areaWin, 0, 0);
    }
    // for tlog 第二期 ////////////////////////////////////////////////
    var now = utils.dateString();
    var battleID = Math.floor(new Date(now).getTime() / 1000);
    var customID = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.customID);
    var smallType = customTemplate['smallType'];
    var allTemplate = templateManager.GetTemplateByID('AllTemplate', BUY_HP_AND_MP);
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var career = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    var Zhanli = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
    var reliveCost = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.reliveCost);
    var buyHpCount = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.buyHpCount);
    var buyMpCount = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.buyMpCount);
    var buyHpCost = buyHpCount * allTemplate['attnum'];//defaultValues.HpNeedYuanBao;
    var buyMpCost = buyMpCount * allTemplate['attnum'];//defaultValues.HpNeedYuanBao;

    if (smallType == eCustomSmallType.Climb) {
        var climbTemp = templateManager.GetAllTemplate('ClimbTemplate');
        var floor = 0;
        for (var index in climbTemp) {
            var climb = climbTemp[index];
            if (climb['customID'] == customID) {
                floor = climb['index'];
            }
        }
        tlogger.log('TowerFlow', accountType, openID, 1, expLevel, vipLevel, areaWin, floor,
                    reliveCost + buyHpCost + buyMpCost);
    }
    if (smallType == eCustomSmallType.Hell) {
        tlogger.log('HellCustomFlow', accountType, openID, customID, expLevel, vipLevel, areaWin, career, Zhanli,
                    reliveCost, buyHpCost, buyMpCost);
    }


    tlogger.log({'replace': {2: now}}, 'CustomFlow', accountType, openID, battleID, customID, smallType, expLevel,
                vipLevel, career,
                Zhanli, areaWin, starNum, reliveCost, buyHpCost, buyMpCost, buyHpCount,
                buyMpCount);
    /////////////////////////////////////////////////////////////////////////////////////
    //安全tlog
    if (null != tlogInfo) {
        this.TlogRoundEndFlow(player, areaWin, customSco, 0, 0, starNum, ipAddress, tlogInfo);
    }

    player.attManager.clearLevelAtt(gameConst.eAttLevel.ATTLEVEL_UNION_FIGHT, 6);
    player.attManager.clearLevelAtt(gameConst.eAttLevel.ATTLEVEL_ARES, 6);

    player.attManager.UpdateAtt();
    player.unionMagicManager.UpdateAttr();
};
handler.SendGameBegin = function (player) {
    var route = 'ServerBeginGame';
    var msg = {};
    var pos = player.GetPosition();
    this.SendAoiMsg(pos, route, msg);
};

handler.SendGameOver = function (player, msg) {
    var route = 'ServerGameOver';
    var pos = player.GetPosition();
    this.SendAoiMsg(pos, route, msg);
};

handler.SendPlayerMove = function (player, pos, moveX, moveY, moveZ, petPosX, petPosY, petPosZ) {
    if (null == player) {
        return;
    }
    var route = 'ServerPosAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        posX: pos.x,
        posY: pos.z,
        posZ: pos.y,
        moveX: moveX,
        moveY: moveY,
        moveZ: moveZ,
        petPosX: petPosX,
        petPosY: petPosY,
        petPosZ: petPosZ
    };
    this.SendAoiMsg(pos, route, msg);
};

handler.SendPlayerSkill = function (player, skillID, skillType, animName, posX, posY, posZ, isPet) {
    if (null == player) {
        return;
    }
    var route = 'ServerSkillAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        skillID: skillID,
        skillType: skillType,
        animName: animName,
        posX: posX,
        posY: posY,
        posZ: posZ,
        isPet: isPet
    };
    this.UseSkillSendAoiMsgBySkill(pos, route, msg, player);
};

handler.SendNpcDropHp = function (player, npcID, HpNum, npcState, attType, playerIndex) {
    if (null == player) {
        return;
    }
    var route = 'ServerNpcState';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        npcID: npcID,
        HpNum: HpNum,
        attType: attType,
        playerIndex: playerIndex,
        npcState: npcState
    };
    this.SendAoiMsg(pos, route, msg);
};

handler.SendRoomRelay = function (player, msg) {
    if (null == player) {
        return;
    }
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    if (roleID == this.roomZhu.zhuID) {
        var nowTime = new Date();
        this.roomZhu.beginTime = nowTime.getTime();
    }
    var route = 'ServerRoomRelay';
    var pos = player.GetPosition();
    this.SendAoiMsg(pos, route, msg);
};

handler.SendRoomZhu = function (roleID) {
    var route = 'ServerRoomZhu';
    var msg = {
        zhuID: roleID
    };
    this.SendRoomMsg(route, msg);
};

handler.SendBoxName = function (player, boxName) {
    if (null == player) {
        return;
    }
    var route = 'ServerUpdateBox';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        boxName: boxName
    };
    this.SendAoiMsg(pos, route, msg);
};

handler.SendBianShen = function (player, soulLu, soulType, soulID, soulIndex) {
    if (null == player) {
        return;
    }
    var route = 'ServerBianShen';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        soulLu: soulLu,
        soulType: soulType,
        soulID: soulID,
        soulIndex: soulIndex
    };
    this.UseSkillSendAoiMsg(pos, route, msg, player);
};

handler.SendPlayerAtt = function (player, attType, attNum, playerState, otherID) {
    if (null == player) {
        return;
    }
    var route = 'ServerPlayerAtt';
    var pos = player.GetPosition();
    var msg = {
        roleID: otherID || player.id,
        attType: attType,
        playerState: playerState,
        attNum: attNum
    };
    this.UseSkillSendAoiMsg(pos, route, msg, player);
};

handler.SendAoiMsg = function (pos, route, msg, player) {
    var uids = this.GetWatcherUids(pos, [eEntityType.PLAYER]);
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, route, msg);
    }
};

handler.UseSkillSendAoiMsg = function (pos, route, msg, player) {
    var uids = this.GetWatcherUidsByUserSkill(pos, [eEntityType.PLAYER]);
    var tempUids = [];
    if (uids.length > 1) {
        for (var index in uids) {
            if (player.userId != uids[index].uid) {
                tempUids.push(uids[index]);
            }
        }
        uids = tempUids;
    }
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, route, msg);
    }
};

handler.UseSkillSendAoiMsgBySkill = function (pos, route, msg, player) {
    var uids = this.GetWatcherUidsByUserSkill(pos, [eEntityType.PLAYER]);
    var tempUids = [];
    if (uids.length > 1) {
        for (var index in uids) {
            if (player.userId != uids[index].uid) {
                tempUids.push(uids[index]);
            }
        }
        uids = tempUids;
    }
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, route, msg);
    }
};

handler.GetWatcherUidsByUserSkill = function (pos, types) {
    var watchers = this.aoi.getWatchers(pos, types);
    var result = [];
    if (!!watchers && !!watchers[eEntityType.PLAYER]) {
        var pWatchers = watchers[eEntityType.PLAYER];
        for (var entityId in pWatchers) {
            var player = playerManager.GetPlayer(entityId);
            if (!!player && !!player.userId) {
                result.push({uid: player.userId, sid: player.serverId});
            }
        }
    }
    return result;
};

handler.SendRoomMsg = function (route, msg) {
    for (var index in this.playerList) {
        var tempPlayer = playerManager.GetPlayer(index);
        if (tempPlayer) {
            tempPlayer.SendMessage(route, msg);
        }
    }
};

handler.TlogRoundStartFlow = function (roleID, player, tlogInfo) {
    var now = this.tlogInfo.createTime;
    var battleID = Math.floor(new Date(now).getTime() / 1000);
    var openID = player.GetOpenID();
    var accountType = player.GetPlayerInfo(ePlayerInfo.AccountType);
    var areaID = config.vendors.tencent.areaId;
    var zoneID = config.list.serverUid;

    var ClientStartTime = tlogInfo.ClientStartTime;
    ClientStartTime = utils.dateString(ClientStartTime);
    var userName = player.GetPlayerInfo(ePlayerInfo.NAME);
    var money = player.GetAssetsManager().GetAssetsValue(globalFunction.GetMoneyTemp());
    var zuanshi = player.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp());
    var userVip = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    var climbTemplate = templateManager.GetAllTemplate('ClimbTemplate');
    var needZhanli = customTemplate['zhanLi'];
    var smalltype = customTemplate['smallType'];
    var roundType = GetRoundType(smalltype);
    if (smalltype == eCustomSmallType.Single) {
        var needLevel = customTemplate['needLevel'];
    } else {
        var needLevel = customTemplate['expLevel'];
    }
    var actModType = customTemplate['ActModeType'];
    var towerFloor = 0;
    for (var index in climbTemplate) {
        if (climbTemplate[index]['customID'] == customID) {
            towerFloor = climbTemplate[index]['index'];
        }
    }
    var duringTime = customTemplate['duringTime'];
    var careerID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var playerZhanli = player.GetPlayerInfo(ePlayerInfo.ZHANLI);

    var skillIDList = [];
    var skillLvList = [];
    var skillList = player.GetSkillManager().GetAllSkill();
    for (var index in skillList) {
        var skill = skillList[index];
        var skillID = skill.GetSkillInfo(eSkillInfo.TempID);
        skillIDList.push(skillID);
        var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
        skillLvList.push(skillTemplate[tSkill.skillLevel]);
    }
    var playerAttack = player.GetAttManager().GetAttValue(eAttInfo.ATTACK);
    var playerHp = tlogInfo.UserInitHP;
    var playerMp = tlogInfo.UserInitMP;
    var playerCrit = player.GetAttManager().GetAttValue(eAttInfo.CRIT);
    var playerAntiCrit = player.GetAttManager().GetAttValue(eAttInfo.ANTICRIT);
    var playerCritDamage = player.GetAttManager().GetAttValue(eAttInfo.CRITDAMAGE);
    var playerCritDamageReduce = player.GetAttManager().GetAttValue(eAttInfo.CRITDAMAGEREDUCE);

    var playerInfoDetails = [];
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.HUNMIRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.HOUYANGRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.JITUIRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.FUKONGRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIHUNMI));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIHOUYANG));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIJITUI));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIFUKONG));

    var soulList = player.GetSoulManager().GetSoulList();
    var soulIDList = [];
    var soulLvList = [];
    var soulSkillList = [];
    var soulAttackList = [];
    var soulDefenceList = [];
    var soulHpList = [];
    var soulZhanliList = [];
    var soulStillTMList = [];
    for (var index in soulList) {
        var soul = soulList[index];
        if (soul) {
            soulIDList.push(+index);
            soulLvList.push(soul.GetSoulInfo(eSoulInfo.LEVEL));
            soulSkillList.push(player.GetSoulManager().GetSoulSkill(soul));
            soulAttackList.push(soul.GetSoulInfo(eSoulInfo.ATTNUM_0));
            soulDefenceList.push(soul.GetSoulInfo(eSoulInfo.ATTNUM_1));
            soulHpList.push(soul.GetSoulInfo(eSoulInfo.ATTNUM_2));
            soulZhanliList.push(soul.GetSoulInfo(eSoulInfo.Zhanli));
            soulStillTMList.push(player.GetSoulManager().GetSoulStillTime(soul));
        }
    }
    if (soulIDList.length != eSoulType.SOULTYPE_MAX) {
        var length = soulIDList.length;
        for (var i = 0; i < eSoulType.SOULTYPE_MAX - length; i++) {
            soulIDList.push(0);
            soulLvList.push(0);
            soulSkillList.push(0);
            soulAttackList.push(0);
            soulDefenceList.push(0);
            soulHpList.push(0);
            soulZhanliList.push(0);
            soulStillTMList.push(0);
        }
    }

    var playerAtt = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
    var soulMaxAng = playerAtt['maxAnger'];
    var hpSupplies = player.GetAssetsManager().GetAssetsValue(globalFunction.GetHpTemp());
    var mpSupplies = player.GetAssetsManager().GetAssetsValue(globalFunction.GetMpTemp());

    var bossID = customTemplate['bossID'];
    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', bossID);
    if (!npcAttTemplate) {
        var bossAttack = 0;
        var bossMaxSkillDamage = 0;
        var bossHpMax = 0;
        var bossHpMin = 0;
    } else {
        var bossAttack = npcAttTemplate['att_0'];
        var bossMaxSkillDamage = npcAttTemplate['att_0'] * 4;
        var bossHpMax = npcAttTemplate['att_4'];
        var bossHpMin = npcAttTemplate['att_4'];
    }

    var monsterMaxAttack = 0;
    var monsterMaxSkillDamage = 0;
    var monsterHpMax = 0;
    var monsterHpMin = 0;
    var npcListID = customTemplate['npcListID'];
    var levelNpcListTemplate = templateManager.GetTemplateByID('LevelNpcListTemplate', npcListID);
    if (levelNpcListTemplate != null) {
        for (var i = 0; i < 20; i++) {
            var npcTrunk = levelNpcListTemplate['npcTrunk_' + i];
            if (npcTrunk == 0) {
                continue;
            }
            var levelNpcTemplate = templateManager.GetTemplateByID('LevelNpcTemplate', npcTrunk);
            if (levelNpcTemplate != null) {
                for (var j = 0; j < 20; j++) {
                    var npcID = levelNpcTemplate['npcID_' + j];
                    if (npcID == 0 || npcID == bossID) {
                        continue;
                    }
                    var npcAttTemp = templateManager.GetTemplateByID('NpcAttTemplate', npcID);
                    if (npcAttTemp != null) {
                        if (monsterMaxAttack == 0 || npcAttTemp['att_0'] > monsterMaxAttack) {
                            monsterMaxAttack = npcAttTemp['att_0'];
                            monsterMaxSkillDamage = npcAttTemp['att_0'] * 4;
                        }
                        if (monsterHpMin == 0 || npcAttTemp['att_4'] < monsterHpMin) {
                            monsterHpMin = npcAttTemp['att_4'];
                        }
                        if (monsterHpMax == 0 || npcAttTemp['att_4'] > monsterHpMax) {
                            monsterHpMax = npcAttTemp['att_4'];
                        }
                    }
                }
            }
        }
    }


    pomelo.app.rpc.rs.rsRemote.GetOccupantRoleID(null, customID, function (occupantRoleID) {
        var mapLord = 0;
        if (occupantRoleID == null) {
            mapLord = 0;
        } else if (occupantRoleID == roleID) {
            mapLord = 2;
        } else {
            mapLord = 1;
        }
        var monsterNum = customTemplate['monsterNum'];
        if (customTemplate['smallType'] == eCustomSmallType.Hell) {
            if (occupantRoleID == null) {
                monsterNum -= 1;
            }
        }
        pomelo.app.rpc.rs.rsRemote.GetTeamPlayerList(null, customID, teamID, function (teamPlayerList) {
            var teamRoleID = [];
            var teamRoleJobType = [];
            var teamRoleZhanli = [];
            for (var index in teamPlayerList) {
                if (index != roleID) {
                    var tempPlayer = playerManager.GetPlayer(+index);
                    if(tempPlayer == null){
                        continue;
                    }
                    var tempOpenID = tempPlayer.GetOpenID();
                    var jobType = tempPlayer.GetPlayerInfo(ePlayerInfo.TEMPID);
                    var tempZhanli = tempPlayer.GetPlayerInfo(ePlayerInfo.ZHANLI);
                    teamRoleID.push(tempOpenID);
                    teamRoleJobType.push(jobType);
                    teamRoleZhanli.push(tempZhanli);
                }
            }
            if (teamRoleID.length < 3) {
                var length = teamRoleID.length;
                for (var i = 0; i < 3 - length; i++) {
                    teamRoleID.push(0);
                    teamRoleJobType.push(0);
                    teamRoleZhanli.push(0);
                }
            }
            tlogger.log({6: areaID, 'replace': {2: now}}, 'SecRoundStartFlow', accountType, openID, battleID,
                        ClientStartTime,
                        userName, money, zuanshi, userVip, customID, needZhanli,
                        roundType, 0, actModType, needLevel,
                        towerFloor, duringTime, mapLord, careerID, expLevel,
                        playerZhanli, skillIDList, skillLvList,
                        playerAttack, playerHp, playerMp, playerCrit, playerAntiCrit,
                        playerCritDamage,
                        playerCritDamageReduce, playerInfoDetails, soulIDList,
                        soulLvList, soulSkillList, 0, 0, 0, 0, 0,
                        0, 0, soulAttackList, soulDefenceList, soulHpList,
                        soulZhanliList, soulStillTMList, soulMaxAng,
                        hpSupplies, mpSupplies, teamRoleID[0], teamRoleJobType[0],
                        teamRoleZhanli[0], teamRoleID[1],
                        teamRoleJobType[1], teamRoleZhanli[1], teamRoleID[2],
                        teamRoleJobType[2], teamRoleZhanli[2],
                        monsterNum, 0, bossID, monsterMaxAttack,
                        monsterMaxSkillDamage, monsterHpMax, monsterHpMin,
                        bossAttack, bossMaxSkillDamage, bossHpMax, bossHpMin, zoneID,
                        roleID);
        });
    });
};

handler.TlogRoundEndFlow = function (player, areaWin, customSco, winExp, winMoney, starNum, ipAddress, tlogInfo) {
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var tm = this.tlogInfo.createTime;
    var battleID = Math.floor(new Date(tm).getTime() / 1000);
    var openID = player.GetOpenID();
    var accountType = player.GetPlayerInfo(ePlayerInfo.AccountType);
    var areaID = config.vendors.tencent.areaId;
    var zoneID = config.list.serverUid;

    var isCheating = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.cheating);
    var customID = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.customID);
    var isWin = areaWin ? 0 : 1;
    var during = new Date().getTime() - new Date(tm).getTime();
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);

    var climbHistoryScore = 0;

    if (customTemplate['smallType'] == eCustomSmallType.Climb) {
        var climbTemplate = templateManager.GetAllTemplate('ClimbTemplate');
        for (var index in climbTemplate) {
            if (customID == climbTemplate[index]['customID']) {
                var climbHistoryList = player.GetClimbManager().GetHistoryDataList();
                for (var i in climbHistoryList) {
                    if (climbHistoryList[i] == index) {
                        climbHistoryScore = climbHistoryList[i]['score'];
                    }
                }
            }
        }
    }

    var expGet = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.expGet);

    var expAddition = 0;
    var activityItemDrop = player.GetItemManager().GetActivityItemDrops(0); //获得经验翻倍活动信息
    if (activityItemDrop['flag']) {
        expAddition = expAddition + activityItemDrop['flag'] * 100; // 总比例,  倍数×100
    }
    if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 1) { // QQ会员经验加成  2015-03-30新需求普通会员加 5%
        var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
        expAddition = expAddition + AllTemplate['88']['attnum'];  // 加成百分比
    }
    if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 2) { // QQ会员经验加成  2015-03-30新需求超级会员加 10%
        var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
        expAddition = expAddition + AllTemplate['183']['attnum'];  // 加成百分比
    }

    var moneyGet = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.moneyGet);
    var hun = [0, 0, 0, 0, 0];
    var itemType = [];
    var assetsType = [];
    var itemInfos = player.GetItemManager().getItemInfos();
    var npcTopList = itemInfos.npcTop.npcDropList;
    var npcItem = itemInfos.items.itemInfo;
    for (var npc in npcTopList) {
        var npc_length = JSON.stringify(npcTopList[npc]).length;
        if (npc_length <= 2) {
            var this_npc = npcItem[npc];
            for (var item in this_npc) {
                var this_item = this_npc[item];
                for (var key in this_item) {
                    var int_key = parseInt(key);
                    var value = this_item[key];
                    for (var i = 0; i < 5; i++) {
                        if (1004 + i == int_key) {
                            hun[i] = hun[i] + value;
                        }
                    }
                    var ItemTemplate = templateManager.GetTemplateByID('ItemTemplate', int_key);
                    if (ItemTemplate[tItem.itemType] != eItemType.Special) {
                        itemType.push(int_key);
                    } else {
                        if (!_.contains([1000, 1001, 1004, 1005, 1006, 1007, 1008], int_key)) {
                            assetsType.push(int_key);
                        }
                    }

                    /*  if (ItemTemplate[tItem.itemType] == eItemType.Weapon) {
                     switch (ItemTemplate[tItem.subType]) {
                     case eWeaponType.WEAPONTYPE_0:
                     itemType.push(0);
                     break;
                     case eWeaponType.WEAPONTYPE_1:
                     itemType.push(1);
                     break;
                     }
                     } else if (ItemTemplate[tItem.itemType] == eItemType.Armor) {
                     switch (ItemTemplate[tItem.subType]) {
                     case eArmorType.ARMORTYPE_HEAD:
                     itemType.push(2);
                     break;
                     case eArmorType.ARMORTYPE_HAND:
                     itemType.push(3);
                     break;
                     case eArmorType.ARMORTYPE_CUIRASS:
                     itemType.push(4);
                     break;
                     case eArmorType.ARMORTYPE_FOOT:
                     itemType.push(5);
                     break;
                     }
                     } else if (ItemTemplate[tItem.itemType] == eItemType.Jewelry) {
                     switch (ItemTemplate[tItem.subType]) {
                     case eJewelryType.Ring:
                     itemType.push(6);
                     break;
                     case eJewelryType.Torque:
                     itemType.push(7);
                     break;
                     }
                     } else if (ItemTemplate[tItem.itemType] == eItemType.Special) {
                     if (int_key != 1001 && int_key != 1002) {
                     var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', int_key);
                     assetsType.push(AssetsTemplate[tAssets.type]);
                     }
                     }*/
                }
            }
        }
    }

    if (_.isEmpty(itemType)) {
        itemType = 0;
    }

    if (_.isEmpty(assetsType)) {
        assetsType = 0;
    }

    var allTemplate = templateManager.GetTemplateByID('AllTemplate', BUY_HP_AND_MP);
    var reliveCost = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.reliveCost);
    var buyHpCount = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.buyHpCount);
    var buyMpCount = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.buyMpCount);
    var buyHpCost = buyHpCount * allTemplate['attnum'];//defaultValues.HpNeedYuanBao;
    var buyMpCost = buyMpCount * allTemplate['attnum'];//defaultValues.HpNeedYuanBao;
    var zuanshiCost = reliveCost + buyHpCost + buyMpCost;
    var reliveNum = this.GetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.reliveNum);
    var deathNum = reliveNum;
    if (!areaWin) {
        deathNum = reliveNum + 1;
    }
    var careerID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);

    var skillIDList = [];
    var skillLvList = [];
    var skillList = player.GetSkillManager().GetAllSkill();
    for (var index in skillList) {
        var skill = skillList[index];
        var skillID = skill.GetSkillInfo(eSkillInfo.TempID);
        var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
        if (skillTemplate['isSkill'] != 1) {
            skillIDList.push(skillID);
            skillLvList.push(skillTemplate[tSkill.skillLevel]);
        }
    }

    var playerAttack = player.GetAttManager().GetAttValue(eAttInfo.ATTACK);
    var playerHp = tlogInfo.UserInitHP;
    var playerMp = tlogInfo.UserInitMP;
    var playerCrit = player.GetAttManager().GetAttValue(eAttInfo.CRIT);
    var playerAntiCrit = player.GetAttManager().GetAttValue(eAttInfo.ANTICRIT);
    var playerCritDamage = player.GetAttManager().GetAttValue(eAttInfo.CRITDAMAGE);
    var playerCritDamageReduce = player.GetAttManager().GetAttValue(eAttInfo.CRITDAMAGEREDUCE);

    var playerInfoDetails = [];
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.HUNMIRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.HOUYANGRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.JITUIRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.FUKONGRATE));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIHUNMI));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIHOUYANG));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIJITUI));
    playerInfoDetails.push(player.GetAttManager().GetAttValue(eAttInfo.ANTIFUKONG));

    var soulList = player.GetSoulManager().GetSoulList();
    var Demontype = tlogInfo.Demontype;
    var DemonLevel = 0;
    var DemonAtk = 0;
    var DemonDef = 0;
    var Demonhp = 0;
    if (Demontype in soulList) {
        var soul = soulList[Demontype];
        if (soul) {
            DemonLevel = soul.GetSoulInfo(eSoulInfo.LEVEL);
            DemonAtk = soul.GetSoulInfo(eSoulInfo.ATTNUM_0);
            DemonDef = soul.GetSoulInfo(eSoulInfo.ATTNUM_1);
            Demonhp = soul.GetSoulInfo(eSoulInfo.ATTNUM_2);
        }
    }
    // tlog for client
    var ClientEndTime = tlogInfo.ClientEndTime;
    ClientEndTime = utils.dateString(ClientEndTime);
    var ClientVersion = tlogInfo.ClientVersion;
    var MaxComboInit = tlogInfo.MaxComboInit;
    var MaxCombo = tlogInfo.MaxCombo;
    var ComboTotal = tlogInfo.ComboTotal;
    var MoveTotal = tlogInfo.MoveTotal;
    var ButtonClickCount0 = tlogInfo.ButtonClickCount0;
    var ButtonClickCount1 = tlogInfo.ButtonClickCount1;
    var ButtonClickCount2 = tlogInfo.ButtonClickCount2;
    var ButtonClickCount3 = tlogInfo.ButtonClickCount3;
    var ButtonClickCount4 = tlogInfo.ButtonClickCount4;
    var ButtonMPClickCount = tlogInfo.ButtonMPClickCount;
    var ButtonHPClickCount = tlogInfo.ButtonHPClickCount;
    var PlayerAtkTotal = tlogInfo.PlayerAtkTotal;
    var PlayerCritCount = tlogInfo.PlayerCritCount;
    var PlayerATKMax = tlogInfo.PlayerATKMax;
    var PlayerATKMin = tlogInfo.PlayerATKMin;
    var PlayerCritATKMax = tlogInfo.PlayerCritATKMax;
    var PlayerCritATKMin = tlogInfo.PlayerCritATKMin;
    var PlayerSkillMax = tlogInfo.PlayerSkillMax;
    var PlayerSkillMin = tlogInfo.PlayerSkillMin;
    var PlayerSkillCritMax = tlogInfo.PlayerSkillCritMax;
    var PlayerSkillCritMin = tlogInfo.PlayerSkillCritMin;
    var PlayerDpsTotal = tlogInfo.PlayerDpsTotal;
    var PlayerkillUse = tlogInfo.PlayerkillUse;
    var DemonAtkTotal = tlogInfo.DemonAtkTotal;
    var DemonCritCount = tlogInfo.DemonCritCount;
    var DemonATKMax = tlogInfo.DemonATKMax;
    var DemonATKMin = tlogInfo.DemonATKMin;
    var DemonCritATKMax = tlogInfo.DemonCritATKMax;
    var DemonCritATKMin = tlogInfo.DemonCritATKMin;
    var DemonSkillMax = tlogInfo.DemonSkillMax;
    var DemonSkillMin = tlogInfo.DemonSkillMin;
    var DemonSkillCritMax = tlogInfo.DemonSkillCritMax;
    var DemonSkillCritMin = tlogInfo.DemonSkillCritMin;
    var DemonSkillinfo = tlogInfo.DemonSkillinfo;
    var DemonSkilllevel = tlogInfo.DemonSkilllevel;
    var DemonSkillUse = tlogInfo.DemonSkillUse;
    var DemonDpsTotal = tlogInfo.DemonDpsTotal;
    var DemonTimeCount = tlogInfo.DemonTimeCount;
    var DemonTimeMax = tlogInfo.DemonTimeMax;
    var DemonTimeMin = tlogInfo.DemonTimeMin;
    var DemonTimeTotal = tlogInfo.DemonTimeTotal;
    var DemonAngCount = tlogInfo.DemonAngCount;
    var DemonAngMax = tlogInfo.DemonAngMax;
    var DemonAngMin = tlogInfo.DemonAngMin;
    var DemonAngTotal = tlogInfo.DemonAngTotal;
    var DemonAngUseCount = tlogInfo.DemonAngUseCount;
    var DemondownCount1 = tlogInfo.DemondownCount1;
    var DemondownCount2 = tlogInfo.DemondownCount2;
    var UserInitHP = tlogInfo.UserInitHP;
    var UserHealHPCount = tlogInfo.UserHealHPCount;
    var UserHealHPMax = tlogInfo.UserHealHPMax;
    var UserHealHPMin = tlogInfo.UserHealHPMin;
    var UserHealHPTotal = tlogInfo.UserHealHPTotal;
    var UserDamageHPCount = tlogInfo.UserDamageHPCount;
    var UserDamageHPMax = tlogInfo.UserDamageHPMax;
    var UserDamageHPMin = tlogInfo.UserDamageHPMin;
    var UserDamageHPTotal = tlogInfo.UserDamageHPTotal;
    var UserDamageCount = tlogInfo.UserDamageCount;
    var UserDamageCount1 = tlogInfo.UserDamageCount1;
    var HpItemCount = tlogInfo.HpItemCount;
    var UserEndHP = tlogInfo.UserEndHP;
    var UserDemonHealHP = tlogInfo.UserDemonHealHP;
    var DemonInitHP = tlogInfo.DemonInitHP;
    var DemonHealHPCount = tlogInfo.DemonHealHPCount;
    var DemonHealHPMax = tlogInfo.DemonHealHPMax;
    var DemonHealHPMin = tlogInfo.DemonHealHPMin;
    var DemonHealHPTotal = tlogInfo.DemonHealHPTotal;
    var DemonDamageHPCount = tlogInfo.DemonDamageHPCount;
    var DemonDamageHPMax = tlogInfo.DemonDamageHPMax;
    var DemonDamageHPMin = tlogInfo.DemonDamageHPMin;
    var DemonDamageHPTotal = tlogInfo.DemonDamageHPTotal;
    var DemonDamageCount = tlogInfo.DemonDamageCount;
    var DemonHpItemCount = tlogInfo.DemonHpItemCount;
    var HpItemGetCount = tlogInfo.HpItemGetCount;
    var UserInitMP = tlogInfo.UserInitMP;
    var UserHealMPCount = tlogInfo.UserHealMPCount;
    var UserHealMPMax = tlogInfo.UserHealMPMax;
    var UserHealMPMin = tlogInfo.UserHealMPMin;
    var UserHealMPTotal = tlogInfo.UserHealMPTotal;
    var UserDamageMPCount = tlogInfo.UserDamageMPCount;
    var UserDamageMPMax = tlogInfo.UserDamageMPMax;
    var UserDamageMPMin = tlogInfo.UserDamageMPMin;
    var UserDamageMPTotal = tlogInfo.UserDamageMPTotal;
    var UserEndMP = tlogInfo.UserEndMP;
    var UserMpItemCount = tlogInfo.UserMpItemCount;
    var MonsterCount = tlogInfo.MonsterCount;
    var MonsterSkillCount1 = tlogInfo.MonsterSkillCount1;
    var MonsterSkillCount2 = tlogInfo.MonsterSkillCount2;
    var MonsterSkillCount3 = tlogInfo.MonsterSkillCount3;
    var BossCount = tlogInfo.BossCount;
    var BossSkillCount = tlogInfo.BossSkillCount;
    var BossInitHPMax = tlogInfo.BossInitHPMax;
    var BossInitHPMin = tlogInfo.BossInitHPMin;
    var BossDamageMax = tlogInfo.BossDamageMax;
    var BossDamageMin = tlogInfo.BossDamageMin;
    var BossDamageTotal = tlogInfo.BossDamageTotal;
    var BossInitHPTotal = tlogInfo.BossInitHPTotal;
    var MonsterInitHPMax = tlogInfo.MonsterInitHPMax;
    var MonsterInitHPMin = tlogInfo.MonsterInitHPMin;
    var MonsterDamageMax = tlogInfo.MonsterDamageMax;
    var MonsterDamageMin = tlogInfo.MonsterDamageMin;
    var MonsterDamageTotal = tlogInfo.MonsterDamageTotal;
    var MonsterInitHPTotal = tlogInfo.MonsterInitHPTotal;
    var BossUseSkillCount = tlogInfo.BossUseSkillCount;
    var BossTimeTotal = tlogInfo.BossTimeTotal;
    var BossMoveTotal = tlogInfo.BossMoveTotal;
    var BossAttackMax = tlogInfo.BossAttackMax;
    var BossAttackMin = tlogInfo.BossAttackMin;
    var BossAttackTotal = tlogInfo.BossAttackTotal;
    var MonsterSkillCount = tlogInfo.MonsterSkillCount;
    var MonsterTimeTotal = tlogInfo.MonsterTimeTotal;
    var MonsterMoveTotal = tlogInfo.MonsterMoveTotal;
    var MonsterAttackMax = tlogInfo.MonsterAttackMax;
    var MonsterAttackMin = tlogInfo.MonsterAttackMin;
    var MonsterAttackTotal = tlogInfo.MonsterAttackTotal;

    pomelo.app.rpc.rs.rsRemote.GetOccupantRoleID(null, customID, function (occupantRoleID) {
        var isOccupant = 0;
        if (customTemplate['smallType'] == eCustomSmallType.Hell) {
            if (occupantRoleID == roleID) {
                isOccupant = 1;
            }
        }
        tlogger.log({6: areaID}, 'SecRoundEndFlow', accountType, openID, battleID, ClientEndTime, ClientVersion,
                    ipAddress,
                    isCheating, customID, isWin, isOccupant, during, MaxComboInit, MaxCombo, ComboTotal,
                    starNum,
                    customSco, climbHistoryScore, expGet, expAddition, moneyGet, hun[0], hun[1], hun[2],
                    hun[3], hun[4], itemType, 0, assetsType, 0, zuanshiCost, deathNum, reliveNum, careerID,
                    expLevel,
                    skillIDList, skillLvList, playerAttack, playerHp, playerMp, playerCrit, playerAntiCrit,
                    playerCritDamage, playerCritDamageReduce, playerInfoDetails, Demontype, DemonLevel,
                    DemonAtk,
                    DemonDef, Demonhp, MoveTotal, ButtonClickCount0, ButtonClickCount1, ButtonClickCount2,
                    ButtonClickCount3, ButtonClickCount4, ButtonMPClickCount, ButtonHPClickCount,
                    PlayerAtkTotal,
                    PlayerCritCount, PlayerATKMax, PlayerATKMin, PlayerCritATKMax, PlayerCritATKMin,
                    PlayerSkillMax,
                    PlayerSkillMin, PlayerSkillCritMax, PlayerSkillCritMin, PlayerDpsTotal, PlayerkillUse,
                    DemonAtkTotal, DemonCritCount, DemonATKMax, DemonATKMin, DemonCritATKMax,
                    DemonCritATKMin,
                    DemonSkillMax, DemonSkillMin, DemonSkillCritMax, DemonSkillCritMin, DemonSkillinfo,
                    DemonSkilllevel, DemonSkillUse, DemonDpsTotal, DemonTimeCount, DemonTimeMax,
                    DemonTimeMin,
                    DemonTimeTotal, DemonAngCount, DemonAngMax, DemonAngMin, DemonAngTotal,
                    DemonAngUseCount,
                    DemondownCount1, DemondownCount2, UserInitHP, UserHealHPCount, UserHealHPMax,
                    UserHealHPMin,
                    UserHealHPTotal, UserDamageHPCount, UserDamageHPMax, UserDamageHPMin,
                    UserDamageHPTotal,
                    UserDamageCount, UserDamageCount1, 0, HpItemCount, UserEndHP, UserDemonHealHP,
                    DemonInitHP,
                    DemonHealHPCount, DemonHealHPMax, DemonHealHPMin, DemonHealHPTotal, DemonDamageHPCount,
                    DemonDamageHPMax, DemonDamageHPMin, DemonDamageHPTotal, DemonDamageCount, 0,
                    DemonHpItemCount,
                    HpItemGetCount, UserInitMP, UserHealMPCount, UserHealMPMax, UserHealMPMin,
                    UserHealMPTotal,
                    UserDamageMPCount, UserDamageMPMax, UserDamageMPMin, UserDamageMPTotal, UserEndMP,
                    UserMpItemCount,
                    MonsterCount, MonsterSkillCount1, MonsterSkillCount2, MonsterSkillCount3, BossCount,
                    BossSkillCount, BossInitHPMax, BossInitHPMin, BossDamageMax, BossDamageMin,
                    BossDamageTotal,
                    BossInitHPTotal, MonsterInitHPMax, MonsterInitHPMin, MonsterDamageMax,
                    MonsterDamageMin,
                    MonsterDamageTotal, MonsterInitHPTotal, 0, BossUseSkillCount, BossTimeTotal,
                    BossMoveTotal,
                    BossAttackMax, BossAttackMin, BossAttackTotal, 0, MonsterSkillCount, MonsterTimeTotal,
                    MonsterMoveTotal, MonsterAttackMax, MonsterAttackMin, MonsterAttackTotal, zoneID,
                    roleID);

    });

};

handler.SetPlayerTlogInfoValue = function (roleID, key, value) {
    if (roleID in this.tlogInfo.member) {
        this.tlogInfo.member[roleID][key] = value;
    }
};

handler.UpdatePlayerTlogInfoValue = function (roleID, key, value) {
    if (roleID in this.tlogInfo.member) {
        this.tlogInfo.member[roleID][key] = this.tlogInfo.member[roleID][key] + value;
    }
};

handler.GetPlayerTlogInfoValue = function (roleID, key) {
    if (roleID in this.tlogInfo.member) {
        return this.tlogInfo.member[roleID][key];
    }
    return 0;
};

var GetRoundType = function (smalltype) {
    var roundType = 0;
    switch (smalltype) {
        case eCustomSmallType.Single:
            roundType = 0;
            break;
        case eCustomSmallType.Hell:
            roundType = 1;
            break;
        case eCustomSmallType.Team:
            roundType = 2;
            break;
        case eCustomSmallType.Activity:
            roundType = 3;
            break;
        case eCustomSmallType.Climb:
            roundType = 4;
            break;
        case eCustomSmallType.ZhanHun:
            roundType = 6;
            break;
        case eCustomSmallType.Train:
            roundType = 7;
            break;

    }
    return roundType;
};

handler.CheatGameOver = function (player) { //玩家作弊时离开关卡处理
    var customID = this.teamInfo[eTeamInfo.CustomID];
    var teamID = this.teamInfo[eTeamInfo.TeamID];
    var levelTarget = this.teamInfo[eTeamInfo.LevelTarget];
    var roleID = player.id;
    var itemMsg = [];
    var areaWin = 0;
    player.GetCustomManager().AddSpecialCustom(customID, levelTarget);
    var oldCustom = player.GetCustomManager().GetCustom(customID, levelTarget);
    if (null == oldCustom) {
        return;
    }
    var CustomTemplate = oldCustom.GetTemplate();
    var customType = CustomTemplate[tCustom.type];
    //翻牌需要数据
    this.roomFlop.isNotWin_Flop = false;
    if (oldCustom.GetCustomInfo(eCustomInfo.WIN) != 1) {
        this.roomFlop.isNotWin_Flop = true;
    }
    this.roomFlop.customID_Flop = customID;
    this.roomFlop.isWin_Flop = false;
    this.roomFlop.levelTarget = this.teamInfo[eTeamInfo.LevelTarget];
    if (areaWin == 1) {
        this.roomFlop.isWin_Flop = true;
    }
    player.flopManager.UpdateCustomInfo(this.roomFlop);

    oldCustom.SetCustomInfo(eCustomInfo.WIN, areaWin);
    var starSum = 0;

    var msg = {
        roleID: player.id,
        winExp: 0,
        winMoney: 0,
        customWin: areaWin,
        customSco: 0
        //item: itemList
    };

    // 关卡结束，如果是活动关卡，给活动加上5分钟CD
    if (levelTarget == eLevelTarget.Activity) {
        var activities = templateManager.GetAllTemplate('ActivityTemplate');
        if (null != activities) {
            for (var index in  activities) {
                var temp = activities[index];
                if (temp["timeCd"] == 0) {
                    for (var i = 0; i < temp["activityNum"]; ++i) {
                        if (temp["activity_" + i] > 0 && temp["activity_" + i] == customID) {
                            var activityID = +index;
                            var nowDate = new Date();
                            player.GetActivityManager().activityList[activityID].SetActivityCD(new Date(nowDate.getTime()
                                                                                                            + 5 * 60
                                                                                                            * 1000));
                        }
                    }
                }
            }
        }
    }
    if (levelTarget != eLevelTarget.Activity) {
        player.GetCustomManager().SendCustomMsg(levelTarget, customID);
    }
    var cityInfo = cityManager.AddPlayer(player);
    player.SetWorldState(eWorldState.PosState, ePosState.Hull);
    player.SetWorldState(eWorldState.CustomID, cityInfo.cityID);
    var pos = player.GetPosition();
    this.SendGameOver(player, msg);
    this.RemoveAoi(player, pos);
    this.DeletePlayer(roleID);
    if (_.size(this.playerList) == 0) {
        this.roomZhu.isBegin = false;
    }
};
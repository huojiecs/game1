/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-27
 * Time: 下午12:02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../cs/player/playerManager');
var buffManager = require('../../../cs/buff/buffManager');
var roomManager = require('../../../cs/room/roomManager');
var cityManager = require('../../../cs/majorCity/cityManager');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var globalFunction = require('../../../tools/globalFunction');
var tssClient = require('../../../tools/openSdks/tencent/tssClient');
var defaultValues = require('../../../tools/defaultValues');
var errorCodes = require('../../../tools/errorCodes');
var redisManager = require('../../../cs/chartRedis/redisManager');
var offlinePlayer = require('../../../ps/player/offlinePlayer');
var _ = require('underscore');

var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var ePlayerInfo = gameConst.ePlayerInfo;
var eSaveType = gameConst.eSaveType;
var eBagPos = gameConst.eBagPos;
var eItemChangeType = gameConst.eItemChangeType;
var tCustom = templateConst.tCustom;
var tAtt = templateConst.tAtt;
var eSoulInfo = gameConst.eSoulInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAttInfo = gameConst.eAttInfo;
var eGiftInfo = gameConst.eGiftInfo;
var eToMarryInfo = gameConst.eToMarryInfo;
var eMarryInfo = gameConst.eMarryInfo;
var tMarryGift = templateConst.tMarryGift;
var eMarryMsg = gameConst.eMarryMsg;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.ping = function (id, callback) {
    return utils.invokeCallback(callback);
};

handler.InitGame = function (csID, uid, sid, roleID, accountID, customID, teamID, accountType, isBind, openID
    , token, paymentInfo, serverUid, callback) {
    playerManager.LoadDataByDB(uid, sid, +roleID, accountID, customID, teamID, accountType, isBind, openID, token,
                               paymentInfo, serverUid,
                               function (err, res) {
                                   if (err || res.result > 0) {
                                       logger.error('加载玩家数据出错 res: %j, err: %s', res, utils.getErrorMessage(err));
                                   }
                                   logger.debug('%d cs handler.InitGame: return %j', roleID, res);

                                   return callback(null, res);
                               });

    if (!openID) {
        openID = 'default-openid';
    }

    tssClient.sendLoginChannel(openID, +roleID, {
        auth_signature: 0,
        client_version: 0
    });
};

// 发送animal数据
handler.SendFightAnimalInfo = function(player, animalMsg){
    if(player == null || animalMsg == null){
        return;
    }
    var route = 'SendFightAnimalInfo';
    player.SendMessage(route, animalMsg);
};

handler.getItemDropList = function (csID, customID, roleID, teamInfo, attrAdd, callback) {//掉落列表
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {result: errorCodes.NoRole});
    }

    var self = this;

    var setPlayerInfo = function(animalMsg){
        var ret = {};
        ret.result = errorCodes.OK;

        var itmeList = player.GetItemManager().getDropList(customID);
        var itemDrops = player.GetItemManager().GetItemDrops();
        var playerList = teamInfo.playerList;
        var atkList = {};
        for (var i in playerList) {
            var this_roleID = +playerList[i].roleID;
            var this_player = playerManager.GetPlayer(this_roleID);
            if (roleID != this_roleID) {
                this_player.GetItemManager().SetItemDrops(JSON.stringify(itemDrops));
            }

            if(animalMsg != null){
                self.SendFightAnimalInfo(this_player, animalMsg);
            }

            if(attrAdd.attLevel != null){
                var attManager = this_player.GetAttManager();
                attManager.SetLevelAttPer(attrAdd.attLevel, eAttInfo.ATTACK, attrAdd.atkAddPer);
                attManager.SetLevelAttPer(attrAdd.attLevel, eAttInfo.DEFENCE, attrAdd.defAddPer);
                attManager.SetLevelAttPer(attrAdd.attLevel, eAttInfo.MAXHP, attrAdd.hpAddPer);
                attManager.UpdateAtt();
                attManager.SendAttMsg(null);
                atkList[this_roleID] = attManager.GetAttValue(eAttInfo.ATTACK);
            }
        }

        ret.itemDropList = itmeList;
        ret.atkList = atkList;
        ret.animalOrder = 0;
        if(animalMsg != null && animalMsg.animalOrder != null){
            ret.animalOrder = animalMsg.animalOrder;
        }

        callback(null, ret);
    };

    if(attrAdd.attLevel == gameConst.eAttLevel.ATTLEVEL_UNION_FIGHT){
        var playerList = teamInfo.playerList;
        var teamRoleList = [];
        for (var i in playerList) {
            teamRoleList.push(+playerList[i].roleID);
        }
        var unionID = teamInfo.teamData[gameConst.eTeamInfo.UnionID];
        pomelo.app.rpc.us.usRemote.getFightAnimal(null, unionID, teamRoleList, function (err, result) {
            if(err != null){
                return callback(null, {result: errorCodes.SystemWrong});
            }

            if(result.result != errorCodes.OK){
                for (var playerID in teamInfo.playerList) {
                    var teamPlayer = playerManager.GetPlayer(playerID);
                    self.SendFightAnimalInfo(teamPlayer, result);
                }
                return callback(null, {result: result.result});
            }

            setPlayerInfo(result);
        });

        return;
    }

    setPlayerInfo(null);
};

handler.ConveyPlayer = function (csID, conveyCsID, roleID, customID, teamID, callback) {
    var tempPlayer = playerManager.GetPlayer(roleID);
    if (null == tempPlayer) {
        return callback(null, {result: errorCodes.NoRole, roleID: roleID});
    }

    // 标记玩家正在离开， 相关异步操作应该停止继续工作。例如充值扣费。
    tempPlayer.isLeaveing = true;

    playerManager.SaveDataToDB(tempPlayer, eSaveType.LeaveGame)
        .then(function (res) {
                  var player = playerManager.GetPlayer(roleID);
                  if (null == player) {
                      return callback(null, {result: errorCodes.NoRole, roleID: roleID});
                  }
                  var uid = player.GetUid();
                  var sid = player.GetSid();
                  var accountType = player.GetPlayerInfo(ePlayerInfo.AccountType);
                  var isBind = player.GetPlayerInfo(ePlayerInfo.IsBind);
                  var accountID = player.GetPlayerInfo(ePlayerInfo.ACCOUNTID);
                  var serverUid = player.GetPlayerInfo(ePlayerInfo.serverUid);
                  var openID = player.GetOpenID();
                  var token = player.GetToken();
                  var paymentInfo = player.GetPaymentInfo();
                  pomelo.app.rpc.connector.conRemote.SetPlayerCsID(null, sid, uid, conveyCsID, function (err, res) {
                      pomelo.app.rpc.ps.psRemote.SetPlayerCsID(null, roleID, conveyCsID, utils.done);
                      /** 修改pvp 上session 的csID*/
                      pomelo.app.rpc.pvp.pvpRemote.SetPlayerCsID(null, roleID, conveyCsID, utils.done);
                      /** 修改 us 上 playe session 的csID*/
                      pomelo.app.rpc.us.usRemote.SetPlayerCsID(null, roleID, conveyCsID, utils.done);
                      /** 修改 rs 上 playe session 的csID*/
                      pomelo.app.rpc.rs.rsRemote.SetPlayerCsID(null, roleID, conveyCsID, utils.done);
                      /** 修改 js 上 playe session 的csID*/
                      pomelo.app.rpc.js.jsRemote.SetPlayerCsID(null, roleID, conveyCsID, utils.done);
                      if (err || res.result > 0) {
                          logger.error('绑定玩家csID出错 res: %j, err: %s', res, utils.getErrorMessage(err));
                          return callback(err, res);
                      }
                      playerManager.DeletePlayer(roleID);
                      pomelo.app.rpc.cs.csRemote.InitGame(null, conveyCsID, uid, sid, roleID, accountID, customID,
                                                          teamID, accountType, isBind, openID, token, paymentInfo,
                                                          serverUid, function (err, res) {
                                                              if (err || res.result > 0) {
                                                                  logger.error('传送加载玩家数据出错 res: %j, err: %s', res,
                                                                               utils.getErrorMessage(err));
                                                                  return callback(err, res);
                                                              }
                                                              res.roleID = roleID;
                                                              return callback(null, res);
                                                          });

                  });
              })
        .fail(function (err) {
                  logger.info('传送cs存档出现问题 err: %s', utils.getErrorMessage(err));
                  return callback(err);
              })
        .done();
};

handler.UserLeave = function (csID, roleID, callback) {
    logger.debug('%d csRemote.UserLeave: csID:%s', roleID, csID);

    var expLevel = 0;

    var tempPlayer = playerManager.GetPlayer(roleID);
    if (!tempPlayer) {
        return callback(null, expLevel);
    }

    tssClient.sendLogoutChannel(tempPlayer.GetOpenID(), roleID, {
        flag: 0
    });

    // 标记玩家正在离开， 相关异步操作应该停止继续工作。例如充值扣费。
    tempPlayer.isLeaveing = true;

    playerManager.SaveDataToDB(tempPlayer, eSaveType.LeaveGame)
        .catch(function (err) {
                   logger.error('roleID: %d 玩家离开，保存玩家数据出现问题 %s', roleID, utils.getErrorMessage(err));
               })
        .finally(function () {
                     var player = playerManager.GetPlayer(roleID);
                     if (!player) {
                         return callback(null, expLevel);
                     }

                     expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
                     var posState = player.GetWorldState(eWorldState.PosState);
                     var customID = player.GetWorldState(eWorldState.CustomID);
                     var teamID = player.GetWorldState(eWorldState.TeamID);
                     if (posState == ePosState.Hull) {
                         cityManager.DelPlayer(player);
                     }
                     else {
                         var tempRoom = roomManager.GetRoom(customID, teamID);
                         if (tempRoom) {
                             var pos = player.GetPosition();
                             tempRoom.RemoveAoi(player, pos);
                             tempRoom.DeletePlayer(roleID);
                         }
                     }
                     buffManager.RemoveAllBuff(roleID);
                     playerManager.DeletePlayer(roleID);
                 })
        .finally(function () {
                     return callback(null, expLevel);
                 })
        .done();
};

handler.GetMailItem = function (csServerID, roleID, mailID, itemList, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(new Error('没有这个玩家阿,无法获取物品，roleID=' + roleID));
    }
    if (player.GetItemManager().IsFullEx(gameConst.eBagPos.EquipOff) == true) {
        return callback(null, {
            'result': errorCodes.Cs_ItemFull
        });
    }
    for (var i = 0; i < defaultValues.mailItemNum; ++i) {
        var itemID = itemList[i][0];
        var itemNum = itemList[i][1];
        if (itemID > 0 && itemNum > 0) {
            player.AddItem(itemID, itemNum, eAssetsAdd.Mail, null);
        }
    }
    return callback(null, {'result': errorCodes.OK});
};

/**
 * @Brief: 是否可以进行邪神pvp
 * -------------------------
 *
 * @param {Object} csID cs线id
 * @param {Object} roleID  玩家id
 * */

handler.IsSoulPvp = function (csID, roleID, callback) {
    logger.debug('IsSoulPvp: %j', arguments);

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {result: errorCodes.NoRole});
    }
    if (player.GetItemManager().IsFull(eBagPos.EquipOff) == true) {
        return callback(null, {result: errorCodes.Cs_ItemFull});
    }
    return callback(null, {result: errorCodes.OK});
};

handler.IsJoinTeam = function (csID, roleID, customID, levelTarget, unionID, callback) {
    logger.debug('IsJoinTeam: %j', arguments);

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {result: errorCodes.NoRole});
    }
    if (player.GetItemManager().IsFull(eBagPos.EquipOff) == true && levelTarget !== gameConst.eLevelTarget.Ares) {
        return callback(null, {result: errorCodes.Cs_ItemFull});
    }
    var fullResult = player.GetCustomManager().IsFull(customID, levelTarget);
    if (fullResult > 0) {
        return callback(null, {result: errorCodes.Cs_CustomNum});
    }
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return callback(null, {result: errorCodes.SystemWrong});
    }
    /* var forbidPlayInfo = playerManager.GetForbidPlayInfo(roleID);
     if (null != forbidPlayInfo) {
     var canPlayTime = forbidPlayInfo.forbidTime;
     var forbidList = forbidPlayInfo.TypeList;
     if (new Date() < canPlayTime && (-1 != forbidList.indexOf(smallType) || -1 != forbidList.indexOf(99))) {
     return callback(null, {result: errorCodes.IDIP_FORBID_PLAY});
     }
     }*/

    var smallType = CustomTemplate[tCustom.smallType];
    var forbidPlayList = playerManager.GetForbidPlayInfo(roleID);
    if (_.isEmpty(forbidPlayList) == false) {
        if (forbidPlayList[smallType]
            && new Date() < new Date(forbidPlayList[smallType][0])) {
            return callback(null, {result: errorCodes.IDIP_FORBID_PLAY});
        } else if (forbidPlayList[99] && new Date() < new Date(forbidPlayList[99][0])) {
            return callback(null, {result: errorCodes.IDIP_FORBID_PLAY});
        }
    }

    if (player.GetPlayerInfo(ePlayerInfo.ExpLevel) < CustomTemplate[tCustom.expLevel]) {
        return callback(null, {result: errorCodes.ExpLevel});
    }
    if (player.GetPlayerInfo(ePlayerInfo.ExpLevel) > CustomTemplate[tCustom.maxLevel]) {
        return callback(null, {result: errorCodes.MaxLevel});
    }
    var soulMin = CustomTemplate[tCustom.soulMin];  //关卡准入的的邪神星级
    var soulMax = CustomTemplate[tCustom.soulMax];
    if (CustomTemplate[tCustom.soulLevel] > 0 && customID != defaultValues.newRoleCustomID) {
        var tempSoul = player.GetSoulManager().GetSoul(CustomTemplate[tCustom.soulLevel]);
        if (tempSoul.GetSoulInfo(eSoulInfo.LEVEL) < soulMin || tempSoul.GetSoulInfo(eSoulInfo.LEVEL) > soulMax) {
            return callback(null, {result: errorCodes.LessSoulLevel});
        }
    }
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var jobType = player.GetJobType();
    if (vipLevel < CustomTemplate[tCustom.vipLevel]) {
        return callback(null, {result: errorCodes.VipLevel});
    }

    switch (levelTarget){
        case gameConst.eLevelTarget.Climb:
            var climbAttID = defaultValues.climbMinCustomID + customID % 520000;
            var climbTemplate = templateManager.GetTemplateByID('ClimbTemplate', climbAttID);
            if (null == climbTemplate) {
                return callback(null, {result: errorCodes.SystemWrong});
            }
            var needZhanli = climbTemplate['zhanLi'];
            var myZhanli = player.GetPlayerInfo(ePlayerInfo.ZHANLI); //玩家现有战力
            if (myZhanli < needZhanli) {
                return callback(null, {result: errorCodes.LessZhanli});
            }

            break;

        case gameConst.eLevelTarget.Activity:
            var activities = templateManager.GetAllTemplate('ActivityTemplate');
            if (null != activities) {
                for (var index in  activities) {
                    var temp = activities[index];
                    for (var i = 0; i < temp["activityNum"]; ++i) {
                        if (temp["activity_" + i] > 0 && temp["activity_" + i] == customID) {
                            var activityID = +index;
                        }
                    }
                }
                var nowDate = new Date();
                var cdDate = player.GetActivityManager().activityList[activityID].GetActivityCD();
                if (nowDate.getTime() - cdDate.getTime() < 0) {
                    return callback(null, {result: errorCodes.ActivityOnCD});
                }
            }

            break;

        case gameConst.eLevelTarget.Train:
            if(player.GetPlayerInfo(ePlayerInfo.UnionID) == null || player.GetPlayerInfo(ePlayerInfo.UnionID) == 0){
                return callback(null, {result: errorCodes.NoUnion});
            }

            if(unionID > 0 && player.GetPlayerInfo(ePlayerInfo.UnionID) != unionID){
                return callback(null, {result: errorCodes.UnionMemberNotFix});
            }

            var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', 1000 + player.unionLevel);
            if(UnionLevelTemplate == null){
                logger.error('player s union level is %j', player.unionLevel);
                return callback(null, {result: errorCodes.NoTemplate});
            }

            // 醉了。。。
            do {
                var unionTrainTemplate = templateManager.GetTemplateByID('UnionTrainTemplate', UnionLevelTemplate['trainID1']);
                if(unionTrainTemplate != null){
                    if(customID == unionTrainTemplate['hardMapID1'] || customID == unionTrainTemplate['hardMapID2']){
                        if(player.unionLevel < unionTrainTemplate['level']){
                            return callback(null, {result: errorCodes.UnionLevelPer});
                        }
                        break;
                    }
                }

                unionTrainTemplate = templateManager.GetTemplateByID('UnionTrainTemplate', UnionLevelTemplate['trainID2']);
                if(unionTrainTemplate != null){
                    if(customID == unionTrainTemplate['hardMapID1'] || customID == unionTrainTemplate['hardMapID2']){
                        if(player.unionLevel < unionTrainTemplate['level']){
                            return callback(null, {result: errorCodes.UnionLevelPer});
                        }
                        break;
                    }
                }

                unionTrainTemplate = templateManager.GetTemplateByID('UnionTrainTemplate', UnionLevelTemplate['trainID3']);
                if(unionTrainTemplate != null){
                    if(customID == unionTrainTemplate['hardMapID1'] || customID == unionTrainTemplate['hardMapID2']){
                        if(player.unionLevel < unionTrainTemplate['level']){
                            return callback(null, {result: errorCodes.UnionLevelPer});
                        }
                        break;
                    }
                }

            }while(0);

            break;

        case gameConst.eLevelTarget.unionFight:
            if(player.GetPlayerInfo(ePlayerInfo.UnionID) == null || player.GetPlayerInfo(ePlayerInfo.UnionID) == 0){
                return callback(null, {result: errorCodes.NoUnion});
            }

            if(unionID > 0 && player.GetPlayerInfo(ePlayerInfo.UnionID) != unionID){
                return callback(null, {result: errorCodes.UnionMemberNotFix});
            }

            break;

        case gameConst.eLevelTarget.StoryDrak:
            var allTemplate = templateManager.GetTemplateByID('AllTemplate', 232);
            if(player.GetStoryDrak().getAtkTimes() >= allTemplate['attnum']){
                return callback(null, {result: errorCodes.Cs_CustomNum})
            }

            break;
        case gameConst.eLevelTarget.TeamDrak:
            var allTemplate = templateManager.GetTemplateByID('AllTemplate', 245);
            if(player.GetStoryDrak().getTeamTimes() >= allTemplate['attnum']){
                return callback(null, {result: errorCodes.Cs_CustomNum})
            }

            break;
        default :
            break;

    }

    var needLevel = CustomTemplate[tCustom.needLevel];    //剧情关卡准入等级
    var nowLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel); //玩家现有等级
    if (nowLevel < needLevel) {
        return callback(null, {result: errorCodes.ExpLevel});
    }

    //玩家进入炼狱关卡前检测它的前一关和剧情对应关卡是否通过(防外挂用), 0: 满足条件， 1: 不满足
    var res = checkPreCustomeState(player, roleID, customID, levelTarget, CustomTemplate);
    if (res < 0) {
        logger.warn("player can not join hell custom, roleID: %j, customID: %j, levelTarget: %j", roleID, customID, levelTarget);
        return callback(null, {result: errorCodes.ExpLevel});
    }

    var subPhysiacal = CustomTemplate[tCustom.physical];    //进入关卡消耗的体力
    var uID = player.GetPlayerInfo(ePlayerInfo.UnionID);
    if (0 != uID) {
        this.SetPlayerUnionWeiWang(roleID, subPhysiacal);//消耗体力增加个人威望
    }
    var physicalID = globalFunction.GetPhysical();
    if (false == player.GetAssetsManager().CanConsumeAssets(physicalID, subPhysiacal)) {
        return callback(null, {result: errorCodes.Physical});
    }

    // 公会夺城战还要去us上去验证一波。。。
    if(levelTarget === gameConst.eLevelTarget.unionFight){
        pomelo.app.rpc.us.usRemote.CheckUnionFight(null, player.GetPlayerInfo(ePlayerInfo.UnionID), roleID, function(err, result){
            if(err != null){
                return;
            }

            if(result.result != errorCodes.OK){
                return callback(null, {result: result.result});
            }
// fix bug 2712 玩家体力恢复期间，创建多人副本房间，体力剩余恢复时间重置, ljh 2015-2-25 17-22
/*            var physicalNum = player.GetAssetsManager().GetAssetsValue(physicalID) - subPhysiacal;    //获取玩家的最新体力
            var playerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate',
                player.GetPlayerInfo(ePlayerInfo.ExpLevel));
            if (null != playerAttTemplate) {
                var maxPhysical = playerAttTemplate[tAtt.maxPhysical];      //玩家能恢复的最大体力值
                if (physicalNum < maxPhysical) {                        //当玩家的体力在进入关卡后小于最大体力值时开始回复
                    player.GetPhysicalManager().SetLeftTime();
                    player.GetPhysicalManager().SendPhysicalMsg();
                }
            }*/
            player.GetAssetsManager().SetAssetsValue(physicalID, -subPhysiacal);    //扣除玩家体力
            player.GetAttManager().SendAttMsg(null);        //进关卡之前同步玩家基础属性

            return callback(null, {result: 0, vipLevel: vipLevel, jobType: jobType});

        });
        return;
    }
    
// fix bug 2712 玩家体力恢复期间，创建多人副本房间，体力剩余恢复时间重置, ljh 2015-2-25 17-22
/*    var physicalNum = player.GetAssetsManager().GetAssetsValue(physicalID) - subPhysiacal;    //获取玩家的最新体力
    var playerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate',
                                                            player.GetPlayerInfo(ePlayerInfo.ExpLevel));
    if (null != playerAttTemplate) {
        var maxPhysical = playerAttTemplate[tAtt.maxPhysical];      //玩家能恢复的最大体力值
        if (physicalNum < maxPhysical) {                        //当玩家的体力在进入关卡后小于最大体力值时开始回复
            player.GetPhysicalManager().SetLeftTime();
            player.GetPhysicalManager().SendPhysicalMsg();
        }
    }*/
    player.GetAssetsManager().SetAssetsValue(physicalID, -subPhysiacal);    //扣除玩家体力
    player.GetAttManager().SendAttMsg(null);        //进关卡之前同步玩家基础属性

    return callback(null, {result: 0, vipLevel: vipLevel, jobType: jobType});
};

var checkPreCustomeState = function(player, roleID, customID, levelTarget, CustomTemplate){
    var cusType = CustomTemplate[templateConst.tCustom.smallType];     //关卡类型
    var cusStr = '';
    if (cusType == gameConst.eCustomSmallType.Hell){
        cusStr = 'hell';
    }else if(cusType == gameConst.eCustomSmallType.StoryDrak ){
        cusStr = 'dark';
    }else if(cusType == gameConst.eCustomSmallType.TeamDrak){
        var isWin = player.GetCustomManager().IsWin(11010, gameConst.eLevelTarget.Normal);
        return !isWin;
    }else{
        return 0;
    }
    var bigCusID = CustomTemplate[templateConst.tCustom.bigCustomID];     //所属大关卡ID
    var bigCustomTemp = templateManager.GetTemplateByID('CustomListTemplate', bigCusID);
    if (null == bigCustomTemp) {
        return 0;
    }
    var customNum = bigCustomTemp[templateConst.tCustomList.customNum]; //某一大关包含的关卡数量
    var singleCusID = -1;    //炼狱关卡对应的剧情关卡ID
    var preHellCusID = -1;   //炼狱关卡对应的前一个炼狱关卡ID
    var index = -1;     //炼狱关卡在在章节中的关卡下标
    for (var i = 0; i < customNum; ++i) {
        if (customID == bigCustomTemp[cusStr+'Custom_' + i]) {
            singleCusID = bigCustomTemp['custom_' + i];
            index = i;
            break;
        }
    }
    if (index > 0) {    //炼狱前一关为本章内关卡
        preHellCusID = bigCustomTemp[cusStr+'Custom_' + (index - 1)];
    }
    if (0 == index) {   //当为炼狱中第一关时，前一关取上一章的最后一关(特殊处理第一章第一关)
        var prebigCusTemp = templateManager.GetTemplateByID('CustomListTemplate', (bigCusID - 1));    //前一章的大关卡模版
        if (null != prebigCusTemp) {
            var preCustomNum = prebigCusTemp[templateConst.tCustomList.customNum];  //前一章所包含的关卡数量
            preHellCusID = prebigCusTemp[cusStr+'Custom_' + (preCustomNum - 1)];     //前一章的最后一个炼狱关卡ID
        }
    }
    if (singleCusID > 0) {     //检测剧情关是否胜利
        var isWin = player.GetCustomManager().IsWin(singleCusID, gameConst.eLevelTarget.Normal);
        if (isWin == 1) {   //未胜利
            return -1;
        }
    }
    if (preHellCusID > 0) {     //检测前一个炼狱关是否胜利
        var isWin = player.GetCustomManager().IsWin(preHellCusID, levelTarget);
        if (isWin == 1) {   //未胜利
            return -1;
        }
    }
    return 0;
};

handler.CreateRoom = function (csID, teamInfo, callback) {
    logger.debug('CreateRoom: %j', arguments);
    roomManager.CreateRoom(teamInfo, function (err, res) {
        return callback(err, res);
    });
};

handler.JoinRoom = function (tempCs, roleID, customID, teamID, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, errorCodes.NoRole);
    }
    var tempRoom = roomManager.GetRoom(customID, teamID);
    if (null == tempRoom) {
        return callback(null, errorCodes.Cs_NoRoom);
    }
    tempRoom.AddPlayer(roleID, player);
    return callback(null, 0);
};

handler.DeletePlayer = function (csID, roleID, callback) {
    logger.debug('%d csRemote DeletePlayer. %s', roleID, csID);
    buffManager.RemoveAllBuff(roleID);
    playerManager.DeletePlayer(roleID);
    return callback();
};



handler.GetDetails = function (csID, roleID, callback) {
    logger.info("handler.GetDetails " + csID + " " + roleID);
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(new Error('no such player!' + roleID), null);
    }
    else {
        return callback(null, player.GetDetails());
    }
};
handler.GetPlayerDetails = function (csID, roleID, callback) {
    logger.info("handler.GetDetails " + csID + " " + roleID);
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(new Error('no such player!' + roleID), null);
    }
    else {
        player.GetPlayerDetails(null, function (err, details) {
            return callback(null, details);
        });
    }
};

handler.GetPlayerInfoForIdip = function (csID, roleID, tempID, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(errorCodes.NoRole, null);
    }
    var info = {
        yuanbao: player.GetAssetsManager().GetAssetsValue(tempID),
        tempID: player.GetPlayerInfo(ePlayerInfo.TEMPID),
        name: player.GetPlayerInfo(ePlayerInfo.NAME)
    }
    return callback(null, info);
};

handler.AttConstructMessage = function (csID, roleID, callback) {
    logger.info("handler.AttConstructMessage " + csID + " " + roleID);
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(new Error('no such player!' + roleID), null);
    }
    else {
        return callback(null, player.attManager.ConstructMessage());
    }
};

handler.OccupantMisOver = function (csID, roleID, misType, npcID, misNum, callback) {   //炼狱关卡占领任务完成
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(new Error('no such player!'), null);
    }
    player.GetMissionManager().IsMissionOver( misType, npcID, misNum);
    return callback(null, 0);
};

handler.SetAccountLoginTime = function (sid, frontendId, accountID, loginTime, uid, callback) {

    logger.fatal("handler.SetAccountLoginTime: %j", arguments);

    var accountLoginTimeMap = pomelo.app.get('accountLoginTimeMap');

    if (!accountLoginTimeMap) {
        accountLoginTimeMap = {};
    }

    accountLoginTimeMap[accountID] = {frontendId: frontendId, accountID: accountID, loginTime: loginTime, uid: uid};

    pomelo.app.set('accountLoginTimeMap', accountLoginTimeMap);

    return callback();
};

handler.countOfHonorReward = function (csID, callback) {
    //logger.fatal(roleID);
    if (playerManager == null) {
        return;
    }
    for (var index in playerManager.playerList) {
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.GetHonorManager().Update12HonorInfo();
    }
    callback(0);
};

handler.UpdateChartRewardOnline = function (csID, callback) {
    if (playerManager == null) {
        return;
    }
    for (var index in playerManager.playerList) {
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.GetRoleChartManager().UpdateRewardRankInfo();
    }
    callback(0);
};

handler.AddBlackList = function (csID, roleID, callback) {
    redisManager.AddBlackList(roleID);
    return callback();
};

//  设置公会信息  注意如果是离开公会，就清除掉公会相关的财产信息
handler.SetPlayerUnionInfo = function (csID, roleID, unionID, unionName, unionLevel, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (!!player) {
        player.SetPlayerInfo(ePlayerInfo.UnionID, unionID || 0);
        player.SetPlayerInfo(ePlayerInfo.UnionName, unionName || '');
        var uID = player.GetPlayerInfo(ePlayerInfo.UnionID);
        if (uID == null || uID == 0) {
            var devoteValue = player.assetsManager.GetAssetsValue(globalFunction.GetDevoteID());
            var animateValue = player.assetsManager.GetAssetsValue(globalFunction.GetAnimation());
            var animalValue = player.assetsManager.GetAssetsValue(globalFunction.GetAnimalCoin());
            if(devoteValue > 0){
                player.assetsManager.AlterAssetsValue(globalFunction.GetDevoteID(), -devoteValue, 0);
            }
            if (animateValue > 0) {
                player.assetsManager.AlterAssetsValue(globalFunction.GetAnimation(), -animateValue, 0);
            }
            if(animalValue > 0){
                player.assetsManager.AlterAssetsValue(globalFunction.GetAnimalCoin(), -animalValue, 0);
            }

            player.jionUnionTime = 0;
            player.GetMissionManager().ClearUnionMissions();
        }
        player.roleChartManager.sendCanAcceptRewardOnLogin();
        if (player.GetWorldState(eWorldState.PosState) == ePosState.Hull) {
            player.unionMagicManager.UpdateAttr(true);
        }
        player.unionLevel = unionLevel;
        player.UpdateChartRoleInfo();
        return callback(null);
    } else {
        return callback(null);
    }

};
handler.SetPlayerUnionWeiWang = function (roleID, subPhysiacal) {
    if (null == roleID || null == subPhysiacal) {
        return;
    }
    pomelo.app.rpc.us.usRemote.SetPlayerUnionWeiWang(null, roleID, subPhysiacal, utils.done);
};
handler.VerifyProperty = function (csID, roleID, callback) {
    if (null == roleID) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);

    /** 添加空值判断*/
    if (null == player) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var unionLevelTemp = templateManager.GetTemplateByID('UnionLevelTemplate', 1001);

    if (player.assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(),
                                              unionLevelTemp[templateConst.tUnionLeve.upNeedNum]) == false) {
        return callback({'result': errorCodes.NoYuanBao});
    }
    return callback({'result': errorCodes.OK});
};


handler.SetAssetsValue = function (csID, roleID, callback) {
    if (null == roleID) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var unionLevelTemp = templateManager.GetTemplateByID('UnionLevelTemplate', 1001);

    if (player.assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(),
                                              unionLevelTemp[templateConst.tUnionLeve.upNeedNum]) == false) {
        return callback({'result': errorCodes.NoYuanBao});
    }
    player.assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(),
                                        -unionLevelTemp[templateConst.tUnionLeve.upNeedNum]);//扣除元宝
    return callback({'result': errorCodes.OK});
};

handler.SetForbidChartInfo = function (csID, roleID, type, dateStr, callback) {
    playerManager.SetForbidChartInfo(roleID, type, dateStr);
    return callback();
};

handler.AddItem = function (csSeverID, roleID, itemID, itemNum, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback({'result': errorCodes.ParameterNull});
    }
    player.AddItem(itemID, itemNum, eAssetsAdd.UnionExchange, 0);
    return callback({'result': errorCodes.OK});
};

// 接口 消耗财产
handler.ConsumeAssets = function (csSeverID, roleID, assets, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    for (var asset in assets) {
        if (assets[asset]['tempID'] == null || assets[asset]['tempID'] == 0) {
            continue;
        }
        if (player.assetsManager.CanConsumeAssets(assets[asset]['tempID'], assets[asset]['value']) == false) {
            return callback(null, {'result': errorCodes.NoAssets, 'assetsID': assets[asset]['tempID']});
        }
    }

    for (var asset in assets) {
        if (assets[asset]['tempID'] == null || assets[asset]['tempID'] == 0) {
            continue;
        }

        player.assetsManager.AlterAssetsValue(assets[asset]['tempID'], -assets[asset]['value'], reason);
    }

    callback(null, {'result': errorCodes.OK});
};

// 接口 增加财产
handler.AddAssets = function (csSeverID, roleID, tempID, value, reason, callback) {
    if (roleID == null || tempID == null || value == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    player.assetsManager.AlterAssetsValue(tempID, value, reason);

    callback(null, {'result': errorCodes.OK});
};

// 同步角色的公会等级
handler.SyncUnionData = function (csSeverID, roleID, unionData, callback) {
    if (roleID == null || unionData == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    player.unionLevel = unionData.level;
    player.jionUnionTime = unionData.jionUnionTime;
    if(unionData.level > 0){
        player.GetMissionManager().AddUnionMissions();
    }else{
        player.GetMissionManager().ClearUnionMissions();
    }

    return callback(null,{'result': errorCodes.OK});
};

// idip：增加vip点数， 限ios
handler.AddExtraVipPoint = function(csServerID, roleID, value, callback) {
    if(roleID == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if(null == player) {
        return callback(null, {'result': errorCodes.NoRole});
    }

    player.GetAssetsManager().AlterAssetsValue(globalFunction.GetExtraVipPoint(), value, eAssetsAdd.ExtraVipPoint);
    return callback(null, {'result': errorCodes.OK});
};

// 升级角色的公会技能等级
handler.UpPlayerMagicLevel = function (csSeverID, roleID, magicID, unionMagicLevel, callback) {
    if (roleID == null || magicID == null || unionMagicLevel == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var ret = player.GetUnionMagicInfo().UpdateMagicLevel( magicID, unionMagicLevel);

    return callback(null, ret);
}

// 敬供女神
handler.LadyOfferCheck = function (csSeverID, roleID, ladyOrder, itemID, itemNum, yuanbaoNum, callback) {
    if (roleID == null || ladyOrder == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    // 没有次数了
    var isFree = false;
    if (player.GetRoleTemple().CanOffer(ladyOrder).ret) {
        isFree = true;
    }
    else {
        if (player.GetRoleTemple().CanConsume(ladyOrder).ret == false) {
            return callback(null, {'result': errorCodes.UnionLadyConsumeTimes});
        }

        var needYuanbao = yuanbaoNum;
        if (globalFunction.GetYuanBaoTemp() == itemID) {
            needYuanbao += itemNum;
        }

        if (player.assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), needYuanbao) == false) {
            return callback(null, {'result': errorCodes.NoYuanBao});
        }
    }

    if (player.assetsManager.CanConsumeAssets(itemID, itemNum) == false) {
        return callback(null, {'result': errorCodes.NoAssets});
    }

    if (isFree) {
        player.GetRoleTemple().OnOffer(ladyOrder);
    } else {
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -yuanbaoNum, 0);
        player.GetRoleTemple().OnAddConsume(ladyOrder);
    }

    player.GetAssetsManager().AlterAssetsValue(itemID, -itemNum, 0);
    player.GetRoleTemple().SendTempleMsg();

    return callback(null, {'result': errorCodes.OK});
};

// 培养公会神兽
handler.CultureAnimalCheck = function (csSeverID, roleID, consumeAssetsID, consumeAssetsNum, retAssets, opType, times, callback){
    if(roleID == null){
        return callback(null,{'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null,{'result': errorCodes.ParameterNull});
    }

    if(opType == 3 && times > 0 && player.GetRoleTemple().GetCultureTimes() >= times){
        return callback(null,{'result': errorCodes.UnionAnimalCultureMAX});
    }

    if (player.assetsManager.CanConsumeAssets(consumeAssetsID, consumeAssetsNum) == false) {
        return callback(null,{'result': errorCodes.NoAssets});
    }

    // 不是钻石领取的，扣除所有财产
    var perNum = consumeAssetsNum;
    var cultureTimes = 1;
    if(opType < 3){
        var assetsTimes = Math.floor(player.assetsManager.GetAssetsValue(consumeAssetsID) / perNum);
        cultureTimes = Math.min(assetsTimes, times);
    }

    player.GetAssetsManager().AlterAssetsValue(consumeAssetsID, -consumeAssetsNum * cultureTimes, 0);

    var coinAssets = 0;
    for(var retAssetsID in retAssets){
        if(retAssets[retAssetsID] > 0){
            var retNum = retAssets[retAssetsID] * cultureTimes;
            player.GetAssetsManager().AlterAssetsValue(retAssetsID, retNum, 0);
            if(retAssetsID == globalFunction.GetAnimalCoin()){
                coinAssets += retNum;
            }
        }
    }

    if(opType == 3){
        player.GetRoleTemple().AddCultureTimes();
        player.GetRoleTemple().SendTempleMsg();
    }

    return callback(null, {'result': errorCodes.OK, 'cultureTimes' : cultureTimes, 'coinAssets' : coinAssets});
};

// 领取每日收益
handler.DukeDailyAwardCheck = function(csSeverID, roleID, isBoss, callback){
    if(roleID == null){
        return callback(null,{'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null,{'result': errorCodes.ParameterNull});
    }

    if(player.GetRoleTemple().GetAnimalPrizeTimes() > 0){
        return callback(null,{'result': errorCodes.UnionAwardGained});
    }

    var UnionAwardTemplate = templateManager.GetTemplateByID('UnionAwardTemplate', 1002);
    if(UnionAwardTemplate == null){
        return callback(null,{'result': errorCodes.NoTemplate});
    }

    player.GetRoleTemple().AddAnimalPrizeTimes();

    var ret = {
        'result': errorCodes.OK
    };
    var items = [];

    for(var i = 1; i < 5; ++i){
        var itemID = UnionAwardTemplate['itemID' + i];
        var itemNum = UnionAwardTemplate['itemNum' + i];
        if(itemID <= 0 || itemNum <= 0){
            break;
        }
        player.assetsManager.AlterAssetsValue(itemID, itemNum, gameConst.eAssetsChangeReason.Add.UnionDailyAward);
        var item = {
            'itemID' : itemID,
            'itemNum' : itemNum
        };
        items.push(item);
    }

    if(isBoss){
        for(var i = 1; i < 3; ++i){
            var itemID = UnionAwardTemplate['leaderItemID' + i];
            var itemNum = UnionAwardTemplate['leaderItemNum' + i];
            if(itemID <= 0 || itemNum <= 0){
                break;
            }
            player.assetsManager.AlterAssetsValue(itemID, itemNum, gameConst.eAssetsChangeReason.Add.UnionDailyAward);
            items.push([itemID, itemNum]);
        }
    }

    ret.items = items;

    return callback(null, ret);
};

handler.rebuildRoleDetail = function (csID, roleID, callback) {
    var op = new offlinePlayer();

    op.LoadDetailToRedisDataByDB(roleID, function (err, zippedInfo) {
        if (!!err) {
            logger.error("rebuildRoleDetail get player detail by LoadDetailToRedisDataByDB: %d, %s",
                         roleID, utils.getErrorMessage(err));
        }
    });

    return callback();
};

// 刷新在线玩家的祭拜次数
handler.UpdatePlayerTemple = function (csID, callback) {
    if (playerManager == null) {
        return;
    }
    for (var index in playerManager.playerList) {
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.roleTemple.Update12Info();
    }

    callback(null, 0);
};

// 角色作弊
handler.playerCheat = function(csID, roleID, type, callback){
    var route = 'ServerNotifyUsePlugin';
    var msg = {
        type: type          //0 使用外挂  1属性不一致
    };

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null);
    }
    player.SendMessage(route, msg);

    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState != ePosState.Custom) {
        return callback(null);
    }
    var tempRoom = roomManager.GetRoom(customID, teamID);
    if (null == tempRoom) {
        return callback(null);
    }
    tempRoom.CheatGameOver(player);
    player.GetAsyncPvPManager().SetCheatPlayerRunning();    //设置pvp战斗结束
    return callback(null);
};
/**
 * 发送公会红包
 * */
handler.SendUnionGift = function (csSeverID, roleID, assets, reason, giftID, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    //消费钻石
    if (assets['tempID'] == null || assets['tempID'] == 0) {
        return callback(null, {'result': errorCodes.ParameterWrong});
    }
    if (assets['value'] == null || assets['value'] == 0) {
        return callback(null, {'result': errorCodes.ParameterWrong});
    }
    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        return callback(null, {'result': errorCodes.NoAssets});
    }
    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], reason);

    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);

    //奖励发放者礼包
    player.giftManager.AddGift(giftID, GiftTemplate["type"], 1);
    //设置礼包状态为可领取
    player.giftManager.dataList[giftID][eGiftInfo.GiftType] = 1; //可领取
    //直接领取发放者礼包
    var gift = player.giftManager.GetGiftItem(giftID);

    if(gift!=0){
        return callback(null, {'result': gift});
    }else{
        player.UpdateChartRoleInfo();
        callback(null, {'result': errorCodes.OK});
    }

};


/**
 * 领取公会红包  就是获取随机出来的宝箱中的一个奖品
 * */
handler.GetUnionGift = function (csSeverID, roleID, assets, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    //获得红包中  随机出的宝箱奖品
    if (assets['itemID'] == null || assets['itemID'] == 0) {
        return callback(null, {'result': errorCodes.ParameterWrong});
    }
    if (assets['itemNum'] == null || assets['itemNum'] == 0) {
        return callback(null, {'result': errorCodes.ParameterWrong});
    }

    player.assetsManager.AlterAssetsValue(assets['itemID'], assets['itemNum'], reason);


    callback(null, {'result': errorCodes.OK});


};

// 发送玩家的公会数据
handler.SendRoleUnionData = function (csSeverID, roleID, callback){
    if (roleID == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    player.GetRoleTemple().SendTempleMsg();

    return callback(null, {'result': errorCodes.OK});
};

// 跨服得到角色攻击力
handler.GetPlayerATTACK = function(csID,roleID,callback) {
    if (null == roleID) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var ackValue = player.GetAttManager().GetAttValue(eAttInfo.ATTACK);
    return callback(null,ackValue);
};


//不同cs玩家发起求婚
handler.ToMarry = function (csID, roleID, roleTempId, toMarryID, xinWuID, nowDate, callback) {
    logger.fatal(' ######　%d csRemote ToMarry. %s', toMarryID, csID);
    var player = playerManager.GetPlayer(toMarryID);
    if (null == player) {
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    else {
        player.toMarryManager.ToMarryInfo(player, roleID, roleTempId, xinWuID, nowDate, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
            }else{
                return callback(null, res);

            }
        });
    }
};

//玩家删号  如果结婚做离婚操作
handler.RemoveMarry  = function (csID, roleID, callback) {
    logger.fatal(' ######　%d csRemote RemoveMarry. %s', roleID, csID);
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    if(1 == player.toMarryManager.playerMarryState){    //结婚状态  做离婚处理
        var marryInfo = player.toMarryManager.marryInfo[0];
        //var divorceID = roleID==marryInfo[eMarryInfo.roleID] ? marryInfo[eMarryInfo.toMarryID]:marryInfo[eMarryInfo.roleID];
        player.toMarryManager.Divorce(roleID, 4, utils.done);
    }
    return callback(null, errorCodes.OK);
};



//不同cs玩家发起离婚
handler.ToDivorce = function (csID, roleID, toDivorceID, divorceType, callback) {
    logger.fatal(' ######　%d csRemote ToDivorce. %s', roleID, csID);
    var nowDate = new Date();
    var player = playerManager.GetPlayer(toDivorceID);
    if (null == player) {
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    if(1 == divorceType){ //强制离婚
        //离婚对象在线
        player.toMarryManager.marryInfo[0][eMarryInfo.state] = 2;
        player.toMarryManager.playerMarryState = 2;
        //强制离婚清空消息数
        player.toMarryManager.lookNum[0] = {
            0: toDivorceID,
            1: 0
        };
        player.toMarryManager.divorceTime = nowDate;
        player.toMarryManager.SendMarryState(toDivorceID);
        player.toMarryManager.marry.SendToMarryMsg(toDivorceID, player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum]);
    }else{//协议离婚
        //给被求婚者消息提示
        if(!player.toMarryManager.lookNum[0]){
            player.toMarryManager.lookNum[0] = {
                0: toDivorceID,
                1: 1
            };
        }else{
            ++player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum];
        }
        //主动发送给客户端  被求婚者消息数量
        player.toMarryManager.marry.SendToMarryMsg(toDivorceID, player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum]);
        //添加被离婚记录
        player.toMarryManager.FromMarry(roleID, toDivorceID, 3, nowDate, 0);
    }

    return callback(null, errorCodes.OK);
};

//不同cs玩家发起求婚
handler.ToAgreeDivorce = function (csID, roleID, fromDivorceID, callback) {
    var self = this;
    logger.fatal(' ######　%d csRemote ToAgreeDivorce. %s', roleID, csID);
    var player = playerManager.GetPlayer(fromDivorceID);
    if (null == player) {    //发起离婚对象在线
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    player.toMarryManager.marryInfo[0][eMarryInfo.state] = 2;
    player.toMarryManager.playerMarryState = 2;
    player.toMarryManager.divorceTime = new Date();
    player.toMarryManager.SendMarryState(fromDivorceID);
    //清空消息数
    player.toMarryManager.lookNum[0] = {
        0: fromDivorceID,
        1: 0
    };
    player.toMarryManager.SendMarryMsgNum(fromDivorceID); //清空消息数
    return callback(null, errorCodes.OK);

};


//不同cs玩家 同意求婚
handler.Agree = function (csID, roleID, toMarryID, xinWuID, nowDate, marryID, callback) {
    logger.fatal(' ######　%d csRemote Agree. %s', toMarryID, csID);
    var player = playerManager.GetPlayer(toMarryID);
    if (null == player) {
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    else {
        player.toMarryManager.FromAgree(roleID, player, xinWuID, nowDate,marryID, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
                return(err);
            }else{
                if(0 == res){
                    player.toMarryManager.SendMarryState(toMarryID); //同步结婚状态
                }
                return callback(null, res);

            }
        });
    }
};

//不同cs玩家 拒绝求婚
handler.Refuse = function (csID, roleID, fromMarryID, marryID, callback) {
    logger.fatal(' ######　%d csRemote Refuse. %s', fromMarryID, csID);
    var player = playerManager.GetPlayer(fromMarryID);
    if (null == player) {
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    else {
        for(var index in player.toMarryManager.toMarryList) {
            var fromToMarrry = player.toMarryManager.toMarryList[index];
            if(!!fromToMarrry){
                if (fromMarryID == fromToMarrry[eToMarryInfo.roleID] && roleID == fromToMarrry[eToMarryInfo.toMarryID] && marryID==fromToMarrry[eToMarryInfo.marryID]) {
                    fromToMarrry[eToMarryInfo.state] = 2;
                }
            }
        }
        if(!player.toMarryManager.lookNum[0]){
            player.toMarryManager.lookNum[0] = {
                0: player.id,
                1: 1
            };
        }else{
            ++player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum];
        }
        //主动发送给客户端  求婚者消息数量
        player.toMarryManager.marry.SendToMarryMsg(player.id, player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum]);
        return callback(null, errorCodes.OK);
    }
};


//婚礼开始之后 同步 marryLevel 婚礼等级 到玩家的婚姻信息中  marryInfo
handler.UpdateMarryLevel = function (csID, roleID, marryLevel, callback) {
    logger.fatal(' ######　%d csRemote UpdateMarryLevel. %s', roleID, csID);
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, errorCodes.MARRY_OFFLINE);
    }
    else {
        //只有比婚礼等级高的 庆典等级 才记录  1,2,3,   4,5,6
        if(0 == player.toMarryManager.marryInfo[0][eMarryInfo.marryLevel]){
            player.toMarryManager.marryInfo[0][eMarryInfo.marryLevel] = marryLevel;
        }else{
            if(+marryLevel == 64006){
                player.toMarryManager.marryInfo[0][eMarryInfo.marryLevel] = marryLevel;
            }else{
                if(64001 == player.toMarryManager.marryInfo[0][eMarryInfo.marryLevel]){
                    player.toMarryManager.marryInfo[0][eMarryInfo.marryLevel] = marryLevel;
                }
            }
        }

        return callback(null, errorCodes.OK);
    }
};


/**
 * 预定婚礼消耗财产
 * */
handler.YuDingWedding = function (csSeverID, roleID, assets, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        return callback(null, {'result': errorCodes.NoAssets});
    }
    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], reason);
    return callback(null, 0);
};

/**
 * 购买婚礼特效消耗财产
 * */
handler.BuyEffectWedding = function (csSeverID, roleID, assets, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        return callback(null, {'result': errorCodes.NoAssets});
    }
    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], reason);
    return callback(null, 0);
};


/**
 * 领取红包
 * */
handler.GetMarryHongBao = function (csSeverID, roleID, assets, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    player.assetsManager.AlterAssetsValue(assets['tempID'], assets['value'], reason);

    return callback(null, 0);
};


/**
 * //获取玩家爱的礼物的碎片数
 * */
handler.GetLoveGiftSuiPianNum = function(csSeverID, roleID, giftList, callback){
    var player = playerManager.GetPlayer(roleID);
    for(var g in giftList){
        var suiPianNum = giftList[g][tMarryGift.suiPianNum];
        if(0 < suiPianNum){
            var giftID = giftList[g][tMarryGift.giftID];
            var assetNum = player.assetsManager.GetAssetsValue(giftID);
            giftList[g]['hasSuiPian'] = assetNum;
        }
    }
    return callback(null, giftList);
}

/**
 * 赠送爱的礼物（鲜花）消耗财产
 * */
handler.SendLoveFlower = function (csSeverID, roleID, assets, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        return callback(null, {'result': errorCodes.NoAssets});
    }else {
        player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.LoveGift);
    }

    return callback(null, 0);


};

/**
 * 赠送爱的礼物 消耗碎片 或者钻石
 * */
handler.SendLoveGift = function (csSeverID, roleID, assets, giftAssetsID, suiPianMoney, giveType, reason, callback) {
    if (roleID == null || assets == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        if(giveType == 1){ //giveType==1 用碎片
            return callback(null, {'result': errorCodes.WEDDING_GIFT_NOASSETS});
        }//else if(giveType == 2){ //giveType == 2 不足用钻石
        var assetNum = player.assetsManager.GetAssetsValue(assets['tempID']);
        var buZuNum = assets['value'] - assetNum;
        buZuNum = buZuNum * suiPianMoney;
        //判断钻石数
        var assets2 = {
            tempID : giftAssetsID,
            value : buZuNum
        };
        //判断玩家有的碎片数  和  需要补的钻石数
        if (player.assetsManager.CanConsumeAssets(assets2['tempID'], assets2['value']) == false) {
            return callback(null, {'result': errorCodes.NoAssets});
        }
        assets['value'] = assetNum; //扣除玩家有的碎片
        player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.LoveGift);
        //扣除需要补的钻石数
        player.assetsManager.AlterAssetsValue(assets2['tempID'], -assets2['value'], gameConst.eAssetsChangeReason.Reduce.LoveGift);
    }else {
        player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.LoveGift);
    }
    return callback(null, 0);
};

/**
 * 结婚之后 亲密互动 添加消息提示
 * */
handler.AddMsg = function (csSeverID, roleID, callback) {
    if (roleID == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    ++player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum];
    player.toMarryManager.SendMarryMsgNum(roleID, 1);
    return callback(null, 0);

};



/**
 * 结婚之后 亲密互动 添加消息提示
 * */
handler.ClearMsg = function (csSeverID, roleID, callback) {
    if (roleID == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    player.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum] = 0;
    player.toMarryManager.SendMarryMsgNum(roleID);
    return callback(null, 0);

};

/**
 * 姻缘关卡双倍标记
 * */
handler.MarryDouble = function (csSeverID, roleID, callback) {
    if (roleID == null) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }
    player.toMarryManager.marryDouble = 1;
    return callback(null, 0);
};

// 计算角色的真实伤害
handler.calRoleRealDamage = function(csID, roleID, roleDamage, npcInfo, callback) {
     if(roleID == null || roleDamage == null || npcInfo == null){
         return callback(null, {result : errorCodes.ParameterNull});
     }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', npcInfo.tempID);
    if(npcAttTemplate == null){
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var npcTemplate = templateManager.GetTemplateByID('NpcTemplate', npcInfo.tempID);
    if(npcTemplate == null){
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var careerID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    --careerID;
    var checkTemplate = templateManager.GetTemplateByID('CheckDamageTemplate', 1000 + careerID);
    if(checkTemplate == null){
        return callback(null, {'result': errorCodes.ParameterNull});
    }

    var defValue = npcInfo.defValue + npcAttTemplate['att_' + gameConst.eAttInfo.DEFENCE];

    var defDecPer = defValue/(140/100*defValue + 220*npcTemplate['expLevel'] + 400);  // 免伤率
    var ackValue = player.GetAttManager().GetAttValue(eAttInfo.ATTACK);       // 攻击力
    var damageInc = player.GetAttManager().GetAttValue(eAttInfo.DAMAGEUP);    // 伤害加成
    var damageDec = npcAttTemplate['att_' + gameConst.eAttInfo.DAMAGEREDUCE]; // 伤害减免
    var dockDamage = player.GetAttManager().GetAttValue(eAttInfo.CRITDAMAGE); // 暴击伤害

    var trueDamage = ackValue*(1-defDecPer)*(1+(damageInc/10000-damageDec/10000)/(damageInc/10000*0.55+damageDec/10000+0.5))*(dockDamage/10000 + 1.5)*(checkTemplate['skillPoint']/100);

    if(roleDamage >= trueDamage){
        logger.fatal('trueDamage is %j and roleDamage is %j', trueDamage, roleDamage);
        return callback(null, {result : errorCodes.ParameterNull});
    }

    return callback(null, {result : errorCodes.OK});
};


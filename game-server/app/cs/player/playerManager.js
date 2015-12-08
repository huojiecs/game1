/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午12:03
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var csUtil = require('../csUtil');
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateManager = require('../../tools/templateManager');
var utils = require('../../tools/utils');
var Player = require('../csObject/player');
var cityManager = require('../majorCity/cityManager');
var roomManager = require('../room/roomManager');
var playerManager = require('../../ps/player/playerManager');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');
var csSql = require('../../tools/mysql/csSql');
var buffManager = require('../buff/buffManager');
var gmSql = require('../../tools/mysql/gmSql');
var tssClient = require('../../tools/openSdks/tencent/tssClient');
var config = require('../../tools/config');
var stringValue = require('../../tools/stringValue');
var tbLogClient = require('../../tools/mysql/tbLogClient');
var itemLogic = require('../item/itemLogic');
var _ = require('underscore');
var Q = require('q');

var eMisType = gameConst.eMisType;
var eMissionState = gameConst.eMisState;

var ePlayerDB = gameConst.ePlayerDB;
var ePlayerInfo = gameConst.ePlayerInfo;
var eEntityType = gameConst.eEntityType;
var eAttInfo = gameConst.eAttInfo;
var eAttLevel = gameConst.eAttLevel;
var eSaveType = gameConst.eSaveType;
var eCreateType = gameConst.eCreateType;
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var eGiftInfo = gameConst.eGiftInfo;

var eItemInfo = gameConst.eItemInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eFashionSuitInfo = gameConst.eFashionSuitInfo;

var Handler = module.exports;

Handler.Init = function () {
    this.playerList = {};
    this.pendingSavingCount = 0;
    this.pendingLoadingCount = 0;
    this.pendingToSaveCount = 0;
    this.pendingToLoadCount = 0;
    this.savingQueue = {};
    this.loadingQueue = {};
    this.dropQueue = {};
    this.profitList = {};   //零收益列表
    this.forbidPlayList = {};   //禁止玩法列表
    this.forbidChartList = {};   //禁止参与排行榜列表
    this.gmZhanliValue = gameConst.eZhanLiStart.StartValue; //战力公告当前最大值

    var self = this;
    var jobs = [Q.ninvoke(gmSql, 'GetForbidChartTime')];
    Q.all(jobs)
        .spread(function (forbidList) {
                    var nowDate = new Date();
                    _.each(forbidList, function (info) {
                        var forbidChart = JSON.parse(info.forbidChart);
                        _.each(forbidChart, function (value, key) {
                            if (nowDate < new Date(value)) {
                                if (self.forbidChartList[info.roleID] == null) {
                                    self.forbidChartList[info.roleID] = {};
                                }
                                self.forbidChartList[info.roleID][key] = new Date(value);
                            }
                        });
                    });
                });

    setInterval(this.PrintStateInfo.bind(this), defaultValues.PrintStateInfoDelaySeconds * 1000);
};

Handler.GetPlayer = function (roleID) {
    return this.playerList[roleID];
};

Handler.GetAllPlayer = function () {
    return this.playerList;
};

Handler.GetNumPlayer = function (num, exRoleID) {
    var playerList = [];
    for (var index in this.playerList) {
        var tempPlayer = this.playerList[index];
        if (exRoleID != tempPlayer.GetPlayerInfo(ePlayerInfo.ROLEID)) {
            playerList.push(this.playerList[index]);
            if (playerList.length >= num) {
                break;
            }
        }
    }
    return playerList;
};

Handler.AddPlayer = function (roleID, player) {
    this.playerList[roleID] = player;
};

Handler.DeletePlayer = function (roleID) {
    var before = _.size(this.playerList);
    var player = this.playerList[roleID];
    if(player) {
        player.removeAllOperateListner();
    }
    delete this.playerList[roleID];
    if (roleID in this.loadingQueue) {
        logger.debug('%d PlayerManager DeletePlayer Add to Drop queue: %d.', roleID, _.size(this.dropQueue));
        this.dropQueue[roleID] = true;
    }
    logger.debug('%d PlayerManager DeletePlayer Count: %d/%d.', roleID, before, _.size(this.playerList));
};

Handler.PrintStateInfo = function () {
    logger.fatal('PlayerManger PlayerList Count: %d, Save: %d/%d, Load: %d/%d, %s', _.size(this.playerList),
                 this.pendingSavingCount, this.pendingToSaveCount, this.pendingLoadingCount, this.pendingToLoadCount,
                 _.first(_.keys(this.playerList), 10));
};

Handler.UpdatePlayer = function (nowTime) {
    var self = this;
    var nowSec = nowTime.getTime();
    for (var Index in self.playerList) {
        var tempPlayer = self.playerList[Index];
        //tempPlayer.GetoperateManager().updateOperate();
        //tempPlayer.GetPhysicalManager().ReplyPhysical(tempPlayer);
        //tempPlayer.Update(nowTime);
        if (tempPlayer.IsSaveDB(nowSec) == true) {

            var profiler = utils.profiler();
            self.SaveDataToDB(tempPlayer, eSaveType.Time)
                .then(function (res) {
                          profiler.check(0.05, logger, 'UpdatePlayer SaveDataToDB: roleID: %s', Index);
                          if (res.result > 0) {
                              logger.error('定时存档有问题 res: %j', res);
                          }
                      })
                .fail(function (err) {
                          logger.error('定时存档有问题 err: %s,', utils.getErrorMessage(err));
                      })
                .done();
        }

        /**定时保存到redis*/
        if (tempPlayer.isSaveRedis(nowSec) == true) {
            tempPlayer.refreshDetailToRedis();
        }

        tempPlayer.UpdateSoul(nowTime);

        var ping = tempPlayer.heartBeat;
        if (ping.pingSec && nowSec - ping.pingSec > defaultValues.PingDelay) {
            var pingSec = ping.pingSec;
            delete ping.pingSec;
            var csID = pomelo.app.getServerId();
            var roleID = tempPlayer.playerInfo[ePlayerInfo.ROLEID];
            var accountID = tempPlayer.playerInfo[ePlayerInfo.ACCOUNTID];
            logger.warn('player kicked by ping delay: roleID %d, accountID %d, csID %s, lastPingTime [%s]', roleID,
                        accountID, csID, new Date(pingSec));
            pomelo.app.rpc.connector.conRemote.SetUserOut(null, ping.frontendId, ping.checkID, function () {
                logger.warn('Ping Delay UserLeave. roleID %d, accountID %s, csid %s, lastPingTime [%s]', roleID,
                            accountID, csID, new Date(pingSec));
            });
        }
    }
};

Handler.SaveAllPlayer = function (callback) {
    var playerNum = 0;
    var saveNum = 0;
    for (var index in this.playerList) {
        ++playerNum;
        var tempPlayer = this.playerList[index];
        this.SaveDataToDB(tempPlayer, eSaveType.LeaveGame)
            .then(function (res) {
                      if (res.result > 0) {
                          logger.info('全部存档有问题 res = %j', res);
                      }
                      ++saveNum;
                      if (playerNum == saveNum) {
                          return callback(null, {result: 0});
                      }
                  })
            .fail(function (err) {
                      if (err) {
                          logger.info('全部存档有问题 err=%j', err);
                      }
                  })
            .done();
    }
};

Handler.LoadDataByDB = function (uid, serverId, roleID, accountID, customID, teamID, accountType,
                                     isBind, openID, token, paymentInfo, serverUid, callback) {
    var self = this;
//    logger.error('LoadDataByDB: %j', arguments);

    logger.debug('%d LoadDataByDB: before load. pendingLoadingCount %d', roleID, self.pendingLoadingCount);

    if ((roleID in self.savingQueue && defaultValues.UseSaveQueue === 1) || (roleID in self.loadingQueue
                                                                             && defaultValues.UseLoadQueue === 1)) {
        return callback(null, {result: errorCodes.SystemBusy});
    }

    if (defaultValues.UseLoadQueue === 1 && self.pendingToLoadCount >= defaultValues.PendingToLoadQueueMax) {
        return callback(null, {result: errorCodes.SystemBusy});
    }

    self.loadingQueue[roleID] = true;
    ++self.pendingToLoadCount;

    var load = function () {
        if (defaultValues.UseLoadQueue === 1 && self.pendingLoadingCount > defaultValues.PendingLoadingQueueMax) {
            logger.debug('%d LoadDataByDB: waiting for retry. pendingLoadingCount %d', roleID,
                         self.pendingLoadingCount);
            return setTimeout(load, Math.random() * defaultValues.PendingLoadQueueDelay);
        }
        ++self.pendingLoadingCount;
        logger.debug('%d LoadDataByDB: start load.', roleID);

        csUtil.LoadPlayerInfo(roleID, accountID, paymentInfo, serverUid, function (err, DBData) {
            --self.pendingLoadingCount;
            --self.pendingToLoadCount;
            delete self.loadingQueue[roleID];

            logger.warn('LoadPlayerInfo, roleID: %j, date: %j', roleID, JSON.stringify(DBData));

            logger.debug('%d LoadDataByDB: result:. %d', roleID, _.size(DBData));

            if (defaultValues.UseLoadQueue === 1 && roleID in self.dropQueue) {
                logger.error('roleID: %d Droped by request dropQueue: %d.pendingLoadingCount: %d, pendingToLoadCount: %d',
                             roleID, _.size(self.dropQueue), self.pendingLoadingCount, self.pendingToLoadCount);
                delete self.dropQueue[roleID];
                return callback(null, {result: errorCodes.SystemDrop});
            }

            if (!!err) {
                logger.error('roleID: %d 进入游戏，读取玩家数据出现问题 %j %s', roleID, DBData, utils.getErrorMessage(err));
                return callback(null, {result: errorCodes.SystemWrong});
            }

            var opts = {
                name: DBData[ePlayerDB.PLAYERDB_PLAYERINFO][ePlayerInfo.NAME],
                id: DBData[ePlayerDB.PLAYERDB_PLAYERINFO][ePlayerInfo.ROLEID],
                type: eEntityType.PLAYER,
                y: 0,
                x: 0,
                z: 0,
                openID: openID,
                token: token,
                accountType: paymentInfo.accountType
            };
            var newPlayer = new Player(opts);
            self.AddPlayer(roleID, newPlayer);
            newPlayer.userId = uid;
            newPlayer.serverId = serverId;
            var initZhan = playerManager.GetInitZhan(1);
            newPlayer.SetPlayerAllInfo(DBData[ePlayerDB.PLAYERDB_PLAYERINFO], accountType, isBind, initZhan,
                                       serverUid);
            var expLevel = newPlayer.playerInfo[ePlayerInfo.ExpLevel];

            //newPlayer.SetPlayerInfo(ePlayerInfo.ZHANLI, 1424);

            var PlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
            if (PlayerAttTemplate) {
                var attInfo = new Array(eAttInfo.MAX);
                for (var i = 0; i < eAttInfo.MAX; ++i) {
                    var temp = [0, 0];
                    attInfo[i] = temp;
                }
                for (var i = 0; i < eAttInfo.MAX; ++i) {
                    attInfo[i][0] = PlayerAttTemplate['att_' + i];
                }
                newPlayer.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, attInfo, true, true);
            }
            var newZhan = playerManager.GetInitZhan(expLevel);
            newPlayer.UpdateZhanli(newZhan - initZhan, true, false);

            newPlayer.itemManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_ITEM][0],
                                               DBData[ePlayerDB.PLAYERDB_ITEM][1]);
            newPlayer.cutsomManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_AREA]);
            newPlayer.assetsManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_ASSETS]);
            var skillZhan = newPlayer.skillManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_SKILL]);
            newPlayer.soulManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_SOUL], false);
            newPlayer.activityManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_ACTIVITY]);
            newPlayer.niuDanManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_NIUDAN]);
            newPlayer.asyncPvPManager.LoadRival(DBData[ePlayerDB.AsyncPvPRival]);
            newPlayer.shopManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_SHOP]);
            newPlayer.SetAllNewHelp(DBData[ePlayerDB.NewHelp]);
            newPlayer.achieveManager.LoadDataByDB(DBData[ePlayerDB.Achieve]);
            newPlayer.asyncPvPManager.LoadInfo(DBData[ePlayerDB.AsyncPvPInfo], false);
            newPlayer.giftManager.LoadDataByDB(DBData[ePlayerDB.GetGift], DBData[ePlayerDB.LoginGift]);
            newPlayer.magicSoulManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_MAGICSOUL]);
            newPlayer.missionManager.LoadDataByDB(DBData[ePlayerDB.Mission]);
            newPlayer.alchemyManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_ALCHEMY]);
            newPlayer.physicalManager.LoadDataByDB(DBData[ePlayerDB.Physical]);
            newPlayer.physicalManager.LoadPhyListByDB(roleID);
            newPlayer.climbManager.LoadDataByDB(DBData[ePlayerDB.ClimbData]);
            newPlayer.missionManager.LoadMisGroupDataByDB(DBData[ePlayerDB.MisGroup], DBData[ePlayerDB.MisFinish]);

            newPlayer.vipInfoManager.LoadDataByDB(DBData[ePlayerDB.VipInfoManager]);
            newPlayer.mineManager.LoadDataByDB(DBData[ePlayerDB.MineManager]);//魔域数据
            newPlayer.itemManager.LoadSuitDataByDB(DBData[ePlayerDB.SuitInfo]);
            newPlayer.honorManager.LoadDataByDB(DBData[ePlayerDB.HonorRewardTop]);
            newPlayer.asyncPvPManager.LoadShopLingliInfo(DBData[ePlayerDB.ShopLingli]);

            newPlayer.rewardMisManager.LoadDataByDB(DBData[ePlayerDB.RewardMis]);
            newPlayer.GetRoleFashionManager().LoadDataByDB(DBData[ePlayerDB.FashionSuit]);
            newPlayer.activityManager.LoadActivityCdByDB(DBData[ePlayerDB.PLAYERDB_ACTIVITYCD]);
            newPlayer.operateManager.LoadDataByDB(DBData[ePlayerDB.OperateInfo]);
            newPlayer.GetRoleTitleManager().LoadDataByDB(DBData[ePlayerDB.Title]);
            newPlayer.GetRoleChartManager().loadDataByDB(DBData[ePlayerDB.ChartReward]);
            newPlayer.GetRoleChartManager().loadAcceptTimeByDB(DBData[ePlayerDB.ChartAcceptReward]);
            /** 玩家兑换*/
            newPlayer.GetRoleExchangeManager().LoadDataByDB(DBData[ePlayerDB.Exchange]);
            /** 领取月卡数据*/
            newPlayer.GetRechargeManager().LoadDataByDB(DBData[ePlayerDB.MonthCard]);
            /** 求魔产出数据*/
            newPlayer.magicOutputManager.LoadDataByDB(DBData[ePlayerDB.AskMagic]);//求魔产出数据
            newPlayer.magicOutputManager.LoadMagicOutputDataByDB(DBData[ePlayerDB.MagicOutput]);//求魔产出数据
            /***洗练产出的数据***/
            newPlayer.soulSuccinctManager.LoadDataByDB(DBData[ePlayerDB.SoulSuccinct]);//洗练产出数据
            newPlayer.soulSuccinctManager.LoadSuccinctNumByDB(DBData[ePlayerDB.SuccinctNum]);//洗练产出数据
            newPlayer.noticeManager.LoadDataByDB(DBData[ePlayerDB.NoticeInfo]); //公告历史数据
            newPlayer.unionMagicManager.LoadDataByDB(DBData[ePlayerDB.UnionMagic]);
            /**注册财产改变相应的脚本*/
            newPlayer.assetsManager.onRegisterChange(newPlayer.GetExchangeManager().OnAssetsChange);
            newPlayer.roleTemple.LoadDataByDB(DBData[ePlayerDB.UnionTemple]);
            newPlayer.vipInfoManager.LoadExtraVipPoint(DBData[ePlayerDB.ExtraVipPoint]);
            newPlayer.storyDrak.LoadDataByDB(DBData[ePlayerDB.StoryDrak]);
            /**QQ会员礼包加载*/
            newPlayer.giftManager.LoadDataByDBAccountID(DBData[ePlayerDB.QQMemberGift], serverUid);

            if(defaultValues.IsPetOpening) {
                newPlayer.petManager.LoadDataByDB(DBData[ePlayerDB.Pets]);
            }
            newPlayer.advanceManager.LoadDataByDB(DBData[ePlayerDB.Advance]);
            newPlayer.coliseumManager.LoadDataByDB(DBData[ePlayerDB.Coliseum]);
            newPlayer.artifactManager.LoadDataByDB(DBData[ePlayerDB.Artifact]);
            newPlayer.SetPaymentInfo(paymentInfo);
            var runeZhan = newPlayer.runeManager.LoadDataByDB(DBData[ePlayerDB.PLAYERDB_RUNE]);

            /** 加载玩家求婚信息 **/
            newPlayer.toMarryManager.LoadDataByDB(DBData[ePlayerDB.ToMarry]);    //


            var oldLogin = new Date(newPlayer.playerInfo[ePlayerInfo.LoginTime]);
            var refreshTime = new Date(newPlayer.playerInfo[ePlayerInfo.RefreshTime]);
            var nowLogin = new Date();

            /**玩家上线初始化完成后添加数据模板*/
            self.addDirtyTemplate(newPlayer, roleID);

            //登陸清除過期時裝碎片
            //newPlayer.GetRoleFashionManager().delSuiPian();

            //需要在初始化之后 获取完对比sql之后再插入 否则不保存
            newPlayer.missionManager.MagicMiss();   //兼容断档的魔翼任务
            newPlayer.missionManager.hasSoulMiss(); //兼容断档的邪神任务

            logger.info('player login game roleID: %j, oldLogin: %j, nowLogin: %j', roleID, oldLogin, nowLogin);

            if (utils.getDayOfDiff(refreshTime, nowLogin) != 0) {
                setTimeout(function () {
                    newPlayer.UpdatePlayer12Info();
                    newPlayer.roleTemple.Update12Info();
                }, 5000);
            }
            var oldMidnightDate = getSameDayMidnightDate(oldLogin);
            var secondMondayMorningDate = new Date(oldMidnightDate.getTime() + (7 - oldLogin.getDay()) * 86400
                                                                               * 1000);
            if (nowLogin >= secondMondayMorningDate) {
                newPlayer.UpdatePlayerWeekInfo();
            }
            /*if (utils.getWeekOfDiff(oldLogin, nowLogin) != 0) {
             newPlayer.UpdatePlayerWeekInfo();
             }*/

            var nowTimeStr = utilSql.DateToString(nowLogin);
            newPlayer.playerInfo[ePlayerInfo.LoginTime] = nowTimeStr;
            newPlayer.UpdateZhanli(skillZhan, true, false);
            newPlayer.UpdateZhanli(runeZhan, true, false);
            newPlayer.missionManager.IsMissionOver(gameConst.eMisType.ZhanLi, 0,
                                                   newPlayer.playerInfo[ePlayerInfo.ZHANLI]);
            for (var soulID in newPlayer.soulManager.GetSoulList()) {
                newPlayer.missionManager.IsMissionOver(gameConst.eMisType.SoulUpLev, soulID,
                                                       newPlayer.soulManager.GetSoul(soulID).GetSoulInfo(gameConst.eSoulInfo.LEVEL));
            }

            if (customID == 0) {
                var cityInfo = cityManager.AddPlayer(newPlayer);
                var isItemFix = newPlayer.GetItemManager().isNeedTrans();
                var isSkillFix = newPlayer.GetSkillManager().isNeedTrans();

                newPlayer.SetWorldState(eWorldState.PosState, ePosState.Hull);
                newPlayer.SetWorldState(eWorldState.CustomID, cityInfo.cityID);
                newPlayer.SendInfoMsg(null);
                newPlayer.SendNewHelp();
                newPlayer.SendVoiceName();
                newPlayer.assetsManager.SendAssetsMsg(null);
                newPlayer.cutsomManager.SendCustomMsg(null, null);
                if (isSkillFix == false) {
                    newPlayer.skillManager.SendSkillMsg(null);
                }
                newPlayer.GetUnionMagicInfo().SendUnionMagicMsg(null);
                newPlayer.missionManager.SendMissionMsg(null, null);
                newPlayer.achieveManager.SendAchieveMsg(null, null);
                // 修复道具数据的时候不发送消息
                if (isItemFix == false) {
                    var itemList = newPlayer.itemManager.GetAllItem();
                    newPlayer.itemManager.SendItemMsg(itemList, eCreateType.Old,
                                                      gameConst.eItemOperType.OtherType);
                }

                if (isSkillFix == false) {
                    newPlayer.soulManager.SendSoulMsg(null);
                }
                newPlayer.attManager.SendAttMsg(null);
                newPlayer.giftManager.SendGiftInfo();
                newPlayer.giftManager.SendLoginRewardList(null);
                newPlayer.giftManager.SendLoginGiftList();
                newPlayer.magicSoulManager.SendMagicSoulMsg();
                newPlayer.niuDanManager.SendNiuDanList();
                newPlayer.climbManager.sendInitClimbData(null);
                newPlayer.alchemyManager.SendAlchemyMsg();
                newPlayer.mineManager.SendMineManager();
                newPlayer.honorManager.SendHonorManager();
                newPlayer.roleChartManager.sendCanAcceptRewardOnLogin();
                newPlayer.itemManager.SendSuitAcitveState();
                newPlayer.itemManager.SendInlayAcitveState();
                if (isSkillFix == false) {
                    newPlayer.runeManager.SendRuneMsg(null);
                }
                newPlayer.asyncPvPManager.SendPvPAssetsMsgOnLogin();
                newPlayer.rewardMisManager.SendMissionMsg();
                newPlayer.roleTemple.SendTempleMsg();
                newPlayer.storyDrak.SendStoryMsg();
                if(defaultValues.IsPetOpening) {
                    newPlayer.petManager.SendPetMsg();
                }
                self.SendForbidProfitTime(roleID);
                self.SendForbidChartTime(roleID);
                self.SendForbidPlayTime(roleID);
                newPlayer.SendExtraInfoMsg(openID, token);
                newPlayer.advanceManager.SendAdvanceMsg(null);
                newPlayer.chestsManager.SendChestsList();
                newPlayer.coliseumManager.SendColiseumInfo();
            }
            else {
                var tempRoom = roomManager.GetRoom(customID, teamID);
                if (null == tempRoom) {
                    var cityInfo = cityManager.AddPlayer(newPlayer);
                    newPlayer.SetWorldState(eWorldState.PosState, ePosState.Hull);
                    newPlayer.SetWorldState(eWorldState.CustomID, cityInfo.cityID);
                }
                else {
                    tempRoom.AddPlayer(roleID, newPlayer);
                    newPlayer.SetWorldState(eWorldState.PosState, ePosState.Custom);
                    newPlayer.SetWorldState(eWorldState.CustomID, customID);
                    newPlayer.SetWorldState(eWorldState.TeamID, teamID);
                }
            }

            newPlayer.GetMissionManager().AddMissionByExpLevel();

            newPlayer.missionManager.IsMissionOver(gameConst.eMisType.UpLevel, 0,
                newPlayer.playerInfo[ePlayerInfo.ExpLevel]);

            //战力任务断档恢复  自动完成
            newPlayer.missionManager.IsMissionOver( gameConst.eMisType.ZhanLi, 0, newPlayer.playerInfo[ePlayerInfo.ZHANLI]);
            newPlayer.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.ZhanLi, 0, newPlayer.playerInfo[ePlayerInfo.ZHANLI]);


            // 全部读取完之后先修正玩家的异常数据
            self.FixUnusualData(newPlayer);

            newPlayer.refreshDetailToRedis();
            /**设置玩家公会信息**/
            self.SetUnionInfo(roleID);

            setTimeout(function () {
                self.SetForbidInfo(roleID);
            }, 3000);

            /** 本地化 wx好友头像picture 信息*/
            self.localizeWXPicture(newPlayer);

            newPlayer.GetoperateManager().StartAllOperate();

            newPlayer.GetMissionManager().validateDailyMis();

            newPlayer.zhuanPanManager.SyncInitData();
            if (newPlayer.missionManager.GetMissionStateByType(eMisType.Recharge)
                === eMissionState.Over) {
                newPlayer.zhuanPanManager.SetRechargeStatus(gameConst.eZhuanPanStatus.zhuanPanStatusOpen);
            }
            else {
                newPlayer.zhuanPanManager.SetRechargeStatus(gameConst.eZhuanPanStatus.zhuanPanStatusClose);
            }

            newPlayer.physicalManager.offlinePhysical(oldLogin);

            logger.debug('%d cs.LoadDataByDB return:', roleID);

            if (accountType == gameConst.eLoginType.LT_QQ
                || accountType == gameConst.eLoginType.LT_WX
                || accountType == gameConst.eLoginType.LT_TENCENT_GUEST) {
                newPlayer.GetQqManager().checkBalance(roleID, paymentInfo);
            }

            if (accountType == gameConst.eLoginType.LT_CMGE_NATIVE) {
                newPlayer.GetCmgeManager().verifyPayment(paymentInfo);
            }

            setTimeout(function () {
                // 处理活动信息
                newPlayer.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_VIPLevel, newPlayer.GetPlayerInfo(ePlayerInfo.VipLevel), 1);
                newPlayer.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PlayerLevel, newPlayer.GetPlayerInfo(ePlayerInfo.ExpLevel), 1);
                newPlayer.GetRoleChartManager().UpdateChartAdvance();
                newPlayer.GetAdvanceManager().ProcessLoginAdvance();
            }, 5000);

            // payment info.
            var result = newPlayer.GetPfInfo();
            result.result = 0;

            return callback(null, result);
        });
    };

    load();
};

/**
 * 添加玩家上线数据模板 新加模块要在这里添加， 不然上线第一次对比都会通过修改的
 * @param {object} player 刚上线玩家
 * @param {number} roleID 玩家id
 * */
Handler.addDirtyTemplate = function (player, roleID) {
//    player.addDirtyTemplate(ePlayerDB.PLAYERDB_PLAYERINFO, player.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_ITEM, player.itemManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_ASSETS, player.assetsManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_AREA, player.cutsomManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_SKILL, player.skillManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_SOUL, player.soulManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_ACTIVITY, player.activityManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.AsyncPvPRival, player.asyncPvPManager.GetSqlStrRival(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_NIUDAN, player.niuDanManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_SHOP, player.shopManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_ATT, player.attManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.Mission, player.missionManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.NewHelp, player.GetNewHelpSql());
    // player.addDirtyTemplate(ePlayerDB.AsyncPvPInfo, player.asyncPvPManager.GetSqlStrInfo(roleID));
    player.addDirtyTemplate(ePlayerDB.GetGift, player.giftManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.Achieve, player.achieveManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_MAGICSOUL, player.magicSoulManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.Physical, player.physicalManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.MisGroup, player.missionManager.GetMisGroupSqlStr(roleID)[0]);
    player.addDirtyTemplate(ePlayerDB.MisFinish, player.missionManager.GetMisGroupSqlStr(roleID)[1]);
    player.addDirtyTemplate(ePlayerDB.ClimbData, player.climbManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_ALCHEMY, player.alchemyManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.VipInfoManager, player.vipInfoManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.LoginGift, player.giftManager.GetLoginGiftSqlStr());
    player.addDirtyTemplate(ePlayerDB.mineManager, player.mineManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.SuitInfo, player.itemManager.GetSqlStrForSuit(roleID));
    //player.addDirtyTemplate(ePlayerDB.HonorRewardTop, player.honorManager.GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_RUNE, player.runeManager.GetSqlStr());
//    player.addDirtyTemplate(ePlayerDB.ShopLingli, player.asyncPvPManager.GetShopLingliSqlStr());
    player.addDirtyTemplate(ePlayerDB.RewardMis, player.rewardMisManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.PLAYERDB_ACTIVITYCD, player.activityManager.GetCdSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.OperateInfo, player.operateManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.Exchange, player.GetRoleExchangeManager().GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.MonthCard, player.GetRechargeManager().GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.AskMagic, player.GetMagicOutputManager().GetMagicSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.MagicOutput, player.GetMagicOutputManager().GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.NoticeInfo, player.GetNoticeManager().GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.UnionTemple, player.GetRoleTemple().GetSqlStr(roleID));
    player.addDirtyTemplate(ePlayerDB.QQMemberGift, player.giftManager.GetSqlStrByAccountID());
    if(defaultValues.IsPetOpening) {
        player.addDirtyTemplate(ePlayerDB.Pets, player.petManager.GetSqlStr(roleID));
        player.addDirtyTemplate(ePlayerDB.PetsAtt, player.petManager.GetAttSqlStr(roleID));
    }
    player.addDirtyTemplate(ePlayerDB.Advance, player.advanceManager.GetSqlStr());

    player.addDirtyTemplate(ePlayerDB.ToMarry, player.toMarryManager.GetToMarrySqlStr());
    player.addDirtyTemplate(ePlayerDB.MarryInfo, player.toMarryManager.GetMarryInfoSqlStr());

    player.addDirtyTemplate(ePlayerDB.Coliseum, player.coliseumManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.Artifact, player.artifactManager.GetSqlStr());
    player.addDirtyTemplate(ePlayerDB.StoryDrak, player.storyDrak.GetSqlStr());
};

Handler.SaveDataToDB = function (player, saveType) {
    var self = this;
    var deferred = Q.defer();

    self.SaveTblogInfo(player);     //更新tblog信息
    self.UpdateTencentScore(player);     // 更新tencent score信息

    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var accountID = player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID);
    if (saveType === eSaveType.LeaveGame) { //玩家离线前删除所有buff
        var buffIDList = player.skillManager.GetBuffIDList();
        player.skillManager.DelBuff(buffIDList);
        // 清除临时属性
        player.attManager.clearLevelAtt(gameConst.eAttLevel.ATTLEVEL_UNION_FIGHT, 6);
        player.attManager.clearLevelAtt(gameConst.eAttLevel.ATTLEVEL_ARES, 6);
        player.attManager.UpdateAtt();
    }
    logger.debug('%d SaveDataToDB: before save. pendingSavingCount %d', roleID, self.pendingSavingCount);

    if (roleID in self.savingQueue && defaultValues.UseSaveQueue === 1) {
        logger.error('离线存档错误，玩家信息已经在存储队列');
        return Q.reject(errorCodes.SystemBusy);
    }

    if (defaultValues.UseSaveQueue === 1 && self.pendingToSaveCount >= defaultValues.PendingToSaveQueueMax) {
        logger.error('离线存档错误，存储队列已满');
        return Q.reject(errorCodes.SystemBusy);
    }

    ++self.pendingToSaveCount;
    self.savingQueue[roleID] = true;

    var save = function (deleteAfterSave) {
        if (defaultValues.UseSaveQueue === 1 && self.pendingSavingCount > defaultValues.PendingSavingQueueMax) {
//            logger.debug('%d SaveDataToDB: waiting for retry. pendingSavingCount %d, pendingToSaveCount %d', roleID, self.pendingSavingCount, defaultValues.pendingToSaveCount);
            setTimeout(save, Math.random() * defaultValues.PendingSaveQueueDelay);
        }
        else {
            ++self.pendingSavingCount;
            var playerInfo = player.GetSqlStr();
            var itemInfo = player.itemManager.GetSqlStr();
            var assetsInfo = player.assetsManager.GetSqlStr(roleID);
            var areaInfo = player.cutsomManager.GetSqlStr(roleID);
            var skillInfo = player.skillManager.GetSqlStr(roleID);
            var soulInfo = player.soulManager.GetSqlStr(roleID);
            var activityInfo = player.activityManager.GetSqlStr(roleID);
            var asyncPvPRival = player.asyncPvPManager.GetSqlStrRival(roleID);
            var niuDanInfo = player.niuDanManager.GetSqlStr(roleID);
            var shopInfo = player.shopManager.GetSqlStr(roleID);
            var attInfo = player.attManager.GetSqlStr(roleID);
            var misInfo = player.missionManager.GetSqlStr(roleID);
            var newHelp = player.GetNewHelpSql();
            var asyncPvPInfo = player.asyncPvPManager.GetSqlStrInfo(roleID);
            var giftInfo = player.giftManager.GetSqlStr(roleID);
            var achieveInfo = player.achieveManager.GetSqlStr(roleID);
            var magicSoulInfo = player.magicSoulManager.GetSqlStr();
            var physicalInfo = player.physicalManager.GetSqlStr();
            var misGroupInfo = player.missionManager.GetMisGroupSqlStr(roleID);
            var climbDataInfo = player.climbManager.GetSqlStr();
            var alchemyInfo = player.alchemyManager.GetSqlStr();
            var vipNumInfo = player.vipInfoManager.GetSqlStr(roleID);
            var loginGiftInfo = player.giftManager.GetLoginGiftSqlStr();
            var mineNumInfo = player.mineManager.GetSqlStr(roleID);
            var suitInfo = player.itemManager.GetSqlStrForSuit(roleID);
            var honorInfo = player.honorManager.GetSqlStr(roleID);
            var runeInfo = player.runeManager.GetSqlStr();
            var shopLingli = player.asyncPvPManager.GetShopLingliSqlStr();
            var rewardMisInfo = player.rewardMisManager.GetSqlStr();
            var fasionInfo = player.GetRoleFashionManager().GetSqlStr();
            var activityCdInfo = player.activityManager.GetCdSqlStr(roleID);
            var operateInfo = player.operateManager.GetSqlStr();
            var titleInfo = player.GetRoleTitleManager().GetSqlStr();
            //var chartInfo = player.GetRoleChartManager().getSqlStr();
            var chartAcceptInfo = player.GetRoleChartManager().GetAcceptSqlStr();
            var exchangeInfo = player.GetRoleExchangeManager().GetSqlStr();
            var rechargeInfo = player.GetRechargeManager().GetSqlStr(roleID);
            var magicIndex = player.magicOutputManager.GetMagicSqlStr(roleID);
            var magicOutputInfo = player.magicOutputManager.GetSqlStr(roleID);
            var succinctInfo = player.GetSoulSuccinctManager().GetSqlStr();
            var succinctNum = player.GetSoulSuccinctManager().GetSuccinctSqlStr(roleID);
            var noticeInfo = player.GetNoticeManager().GetSqlStr(roleID);
            var templeInfo = player.GetRoleTemple().GetSqlStr(roleID);
            var storyDrak = player.GetStoryDrak().GetSqlStr(roleID);
            var qqmemberGift = player.giftManager.GetSqlStrByAccountID(roleID);
            if(defaultValues.IsPetOpening) {
                var petsInfo = player.petManager.GetSqlStr(roleID);
                var petsAttInfo = player.petManager.GetAttSqlStr(roleID);
            }
            var advanceInfo = player.advanceManager.GetSqlStr();

            var toMarry = player.toMarryManager.GetToMarrySqlStr();
            var marryInfo = player.toMarryManager.GetMarryInfoSqlStr();
            var marryXuanYan = player.toMarryManager.GetMarryXuanyanSqlStr();
            var marryMsg = player.toMarryManager.GetMarryMsgSqlStr();

            var coliseumInfo = player.coliseumManager.GetSqlStr();
            var artifactInfo = player.artifactManager.GetSqlStr();
            //这里做了修改数据对比， 只有修改过的数据才存储数据库
            var strInfo = {};
            //玩家信息，不做对比， 每次都改loginTime 并且playerInfo 是对象
            strInfo[ePlayerDB.PLAYERDB_PLAYERINFO] = playerInfo;
            strInfo[ePlayerDB.PLAYERDB_ITEM] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_ITEM, itemInfo);
            strInfo[ePlayerDB.PLAYERDB_ASSETS] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_ASSETS, assetsInfo);
            strInfo[ePlayerDB.PLAYERDB_AREA] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_AREA, areaInfo);
            strInfo[ePlayerDB.PLAYERDB_SKILL] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_SKILL, skillInfo);
            strInfo[ePlayerDB.PLAYERDB_SOUL] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_SOUL, soulInfo);
            strInfo[ePlayerDB.PLAYERDB_ACTIVITY] =
                player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_ACTIVITY, activityInfo);
            strInfo[ePlayerDB.PLAYERDB_NIUDAN] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_NIUDAN, niuDanInfo);
            strInfo[ePlayerDB.AsyncPvPRival] = player.CheckDirtyAndReplace(ePlayerDB.AsyncPvPRival, asyncPvPRival);
            strInfo[ePlayerDB.PLAYERDB_SHOP] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_SHOP, shopInfo);
            strInfo[ePlayerDB.PLAYERDB_ATT] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_ATT, attInfo);
            strInfo[ePlayerDB.Mission] = player.CheckDirtyAndReplace(ePlayerDB.Mission, misInfo);
            strInfo[ePlayerDB.NewHelp] = player.CheckDirtyAndReplace(ePlayerDB.NewHelp, newHelp);
            strInfo[ePlayerDB.AsyncPvPInfo] = player.CheckDirtyAndReplace(ePlayerDB.AsyncPvPInfo, asyncPvPInfo);
            strInfo[ePlayerDB.GetGift] = player.CheckDirtyAndReplace(ePlayerDB.GetGift, giftInfo);
            strInfo[ePlayerDB.Achieve] = player.CheckDirtyAndReplace(ePlayerDB.Achieve, achieveInfo);
            strInfo[ePlayerDB.PLAYERDB_MAGICSOUL] =
                player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_MAGICSOUL, magicSoulInfo);
            strInfo[ePlayerDB.Physical] = player.CheckDirtyAndReplace(ePlayerDB.Physical, physicalInfo);
            strInfo[ePlayerDB.MisGroup] = player.CheckDirtyAndReplace(ePlayerDB.MisGroup, misGroupInfo[0]);  //任务组ID
            strInfo[ePlayerDB.ClimbData] = player.CheckDirtyAndReplace(ePlayerDB.ClimbData, climbDataInfo);
            strInfo[ePlayerDB.PLAYERDB_ALCHEMY] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_ALCHEMY, alchemyInfo);
            strInfo[ePlayerDB.MisFinish] = player.CheckDirtyAndReplace(ePlayerDB.MisFinish, misGroupInfo[1]);  //已完成任务列表
            strInfo[ePlayerDB.VipInfoManager] = player.CheckDirtyAndReplace(ePlayerDB.VipInfoManager, vipNumInfo);
            strInfo[ePlayerDB.LoginGift] = player.CheckDirtyAndReplace(ePlayerDB.LoginGift, loginGiftInfo);       //帐号登陆礼包
            strInfo[ePlayerDB.MineManager] = player.CheckDirtyAndReplace(ePlayerDB.MineManager, mineNumInfo);
            strInfo[ePlayerDB.SuitInfo] = player.CheckDirtyAndReplace(ePlayerDB.SuitInfo, suitInfo);
            strInfo[ePlayerDB.HonorRewardTop] = player.CheckDirtyAndReplace(ePlayerDB.HonorRewardTop, honorInfo);
            strInfo[ePlayerDB.PLAYERDB_RUNE] = player.CheckDirtyAndReplace(ePlayerDB.PLAYERDB_RUNE, runeInfo);
//            strInfo[ePlayerDB.ShopLingli] = player.CheckDirtyAndReplace(ePlayerDB.ShopLingli, shopLingli);
            strInfo[ePlayerDB.ShopLingli] = shopLingli; //没有做对比
            strInfo[ePlayerDB.RewardMis] = player.CheckDirtyAndReplace(ePlayerDB.RewardMis, rewardMisInfo);
            /**时装 数据对比 */
            strInfo[ePlayerDB.FashionSuit] = player.CheckDirtyAndReplace(ePlayerDB.FashionSuit, fasionInfo);
            strInfo[ePlayerDB.PLAYERDB_ACTIVITYCD] = activityCdInfo;
            strInfo[ePlayerDB.OperateInfo] = player.CheckDirtyAndReplace(ePlayerDB.OperateInfo, operateInfo);
            /**号称 数据对比*/
            strInfo[ePlayerDB.Title] = player.CheckDirtyAndReplace(ePlayerDB.Title, titleInfo);
            /** 玩家排行榜奖励*/
                //strInfo[ePlayerDB.ChartReward] = player.CheckDirtyAndReplace(ePlayerDB.ChartReward, chartInfo);
            strInfo[ePlayerDB.ChartAcceptReward] =
                player.CheckDirtyAndReplace(ePlayerDB.ChartAcceptReward, chartAcceptInfo);
            /**兑换 数据对比*/
            strInfo[ePlayerDB.Exchange] = player.CheckDirtyAndReplace(ePlayerDB.Exchange, exchangeInfo);
            strInfo[ePlayerDB.MonthCard] = player.CheckDirtyAndReplace(ePlayerDB.MonthCard, rechargeInfo);
            /**求魔产出物品*/
            strInfo[ePlayerDB.AskMagic] = player.CheckDirtyAndReplace(ePlayerDB.AskMagic, magicIndex);
            strInfo[ePlayerDB.MagicOutput] = player.CheckDirtyAndReplace(ePlayerDB.MagicOutput, magicOutputInfo);
            strInfo[ePlayerDB.SoulSuccinct] = player.CheckDirtyAndReplace(ePlayerDB.SoulSuccinct, succinctInfo);
            strInfo[ePlayerDB.SuccinctNum] = player.CheckDirtyAndReplace(ePlayerDB.SuccinctNum, succinctNum);
            strInfo[ePlayerDB.NoticeInfo] = player.CheckDirtyAndReplace(ePlayerDB.NoticeInfo, noticeInfo);
            //strInfo[ePlayerDB.UnionMagic] = player.CheckDirtyAndReplace(ePlayerDB.UnionMagic, "");
            strInfo[ePlayerDB.UnionTemple] = player.CheckDirtyAndReplace(ePlayerDB.UnionTemple, templeInfo);
            /**QQ会员礼包数据*/
            strInfo[ePlayerDB.QQMemberGift] = player.CheckDirtyAndReplace(ePlayerDB.QQMemberGift, qqmemberGift);
            if(defaultValues.IsPetOpening) {
                strInfo[ePlayerDB.Pets] = player.CheckDirtyAndReplace(ePlayerDB.Pets, petsInfo);
                strInfo[ePlayerDB.PetsAtt] = player.CheckDirtyAndReplace(ePlayerDB.PetsAtt, petsAttInfo);
            }
            strInfo[ePlayerDB.Advance] = player.CheckDirtyAndReplace(ePlayerDB.Advance, advanceInfo);
            /**求婚数据*/
            strInfo[ePlayerDB.ToMarry] = player.CheckDirtyAndReplace(ePlayerDB.ToMarry, toMarry);
            /**结婚数据*/
            strInfo[ePlayerDB.MarryInfo] = player.CheckDirtyAndReplace(ePlayerDB.MarryInfo, marryInfo);
            /**宣言数据*/
            strInfo[ePlayerDB.XuanYan] = player.CheckDirtyAndReplace(ePlayerDB.XuanYan, marryXuanYan);
            /**结婚消息数*/
            strInfo[ePlayerDB.MarryMsg] = player.CheckDirtyAndReplace(ePlayerDB.MarryMsg, marryMsg);

            strInfo[ePlayerDB.Coliseum] = player.CheckDirtyAndReplace(ePlayerDB.Coliseum, coliseumInfo);
            strInfo[ePlayerDB.Artifact] = player.CheckDirtyAndReplace(ePlayerDB.Artifact, artifactInfo);
			strInfo[ePlayerDB.StoryDrak] = player.CheckDirtyAndReplace(ePlayerDB.StoryDrak, storyDrak);

            logger.warn('%d SaveDataToDB %j', roleID, strInfo);

            logger.debug('%d SavePlayerInfo: start save.', roleID);
            csUtil.SavePlayerInfo(roleID, accountID, strInfo, function (err, res) {
                --self.pendingSavingCount;
                --self.pendingToSaveCount;
                delete self.savingQueue[roleID];

                if (!!deleteAfterSave) {
                    self.DeletePlayer(roleID);
                }

                if (saveType === eSaveType.LeaveGame) { //离开游戏立即存档
                    /** 玩家离线*/
                    player.destroy();
                }
                if (!!err) {
                    logger.error('%d Handler.SaveDataToDB failed res: %s, strInfo[res]: %s, error: %s', roleID, res,
                                 strInfo[res], utils.getErrorMessage(err));
                    /****************************************************************************
                     * 添加 玩家保存数据出错后重试保存, 如果还保存不成功 则踢玩家下线
                     *  这里写的比较乱， 有时间 用utils.after 替换了
                     */
                    var saveDataErrorConfig = pomelo.app.get('saveDataErrorConfig');
                    if (!saveDataErrorConfig || !saveDataErrorConfig.isKick) {
                        return deferred.reject({result: errorCodes.SystemWrong});
                    }
                    if (!!saveDataErrorConfig && saveDataErrorConfig.isKick && !_.isFunction(afterKick)) {
                        afterKick = utils.after(saveDataErrorConfig.times + 1,
                                                function () {
                                                    self.KickUserClearUp(pomelo.app.getServerId(), roleID, accountID)
                                                },
                                                function () {
                                                    save()
                                                });
                    }

                    if (afterKick()) {
                        return deferred.reject({result: errorCodes.SystemWrong});
                    }
                    /****************************************************************************/
                }

                return deferred.resolve({result: 0});
            });
        }
    };

    var afterKick;
    if (saveType === eSaveType.LeaveGame) { //离开游戏立即存档
        /** 存玩家detail to redis*/
        player.GetSoulManager().UnBianShen();
        player.refreshDetailToRedis();

        //下线时判断时效时装是否过期
        logger.fatal("^^^^^LeaveGame  ^^^^^^^^^roleId:%j^^^^^^^", roleID);
        if(!!player.roleFashionManager.suits){
            _.map(player.roleFashionManager.suits, function (suit,suitId) {
                var temp = templateManager.GetTemplateByID('FashionTemplate', suitId);
                if(temp == null || temp.fashionLeftTime <= 0){
                    return;
                }
                //说明是限时时装 计算当前时间看是否过期  没有过期则开始倒计时
                var openDate = new Date(suit[eFashionSuitInfo.OPENTIME]);
                var nowDate = new Date();
                var openTime = openDate.getTime();
                var nowTime = nowDate.getTime();
                var hours = temp.fashionLeftTime;
                var leftTime = hours * 3600 * 1000;
                //logger.fatal("^^^^^ loadFashionTime roleID: %j , openTime: %j, nowTime :%j , leftTime:%j ,useTime: %j" ,roleID, openTime, nowTime, leftTime, nowTime - openTime);
                //首先判断碎片个数
                var suiPianNum = player.assetsManager.GetAssetsValue(temp.suiPianID);
                if(suiPianNum>0 && temp.isTimeFashion==1 && (openTime+leftTime) < nowTime){

                    if(suiPianNum < temp.suiPianNum*2){
                        suit[eFashionSuitInfo.OPENTIME] = utilSql.DateToString(new Date("1970-01-01 00:00:00"));
                        player.roleFashionManager.UnActivate(suitId);//取消时装激活状态
                        if(suiPianNum>= temp.suiPianNum) {
                            //清楚碎片
                            player.assetsManager.AlterAssetsValue(temp.suiPianID, -temp.suiPianNum, eAssetsAdd.fashion);
                        }
                        player.roleFashionManager.SetFashionSuitValue(suitId, 0);
                        //更新戰力
                        player.roleFashionManager.delFashionZhanli(true);
                        //同步客户端
                        player.roleFashionManager.SendFashionTime(suitId);
                    }else{
                        suit[eFashionSuitInfo.OPENTIME] = utilSql.DateToString(new Date());
                        //清楚碎片
                        player.assetsManager.AlterAssetsValue(temp.suiPianID, -temp.suiPianNum, eAssetsAdd.fashion);
                    }
                }
            });
        }

        save();
    }
    else {  //定时存档判断player是否为僵尸
        var csID = pomelo.app.getServerId();    //当前csID
        pomelo.app.rpc.ps.psRemote.GetPlayerCsID(null, roleID, function (err, res) {
            if (!!err) {
                logger.error('csID: %j, GetPlayerCsID error, roleID: %j', csID, roleID);
                save();
            }
            else {
                var psCsID = res.csID;
                if (csID === psCsID) {  //当前player不是僵尸存档
                    save();
                }
                else {      //当前player为僵尸，删除，不存档
                    logger.warn('timing save data error,has die player, roleID: %j, csID: %j, psCsID: %j',
                                roleID, csID, psCsID);
                    save(true);
                }
            }
        });
    }

    return deferred.promise;
};

/**
 * 玩家被踢下线 清除玩家数据
 *
 *  @param {int} csID 玩家csID
 *  @param {int} roleID 玩家ID
 *  @param {int} accountID 玩家账号
 *  @param {function} cb
 *  时序 cs -> {fs, ms, rs, chat, ps->(connector)}
 */
Handler.KickUserClearUp = function (csID, roleID, accountID) {
    var self = this;
    logger.warn('playerManager.KickUserClearUp: roleID: %s, accountID: %s csID %s', roleID, accountID, csID);
    self.UserClear(csID, roleID);
    var jobs = [
        Q.ninvoke(pomelo.app.rpc.fs.fsRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.ms.msRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.rs.rsRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.js.jsRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.chat.chatRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.pvp.pvpRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.ps.psRemote, 'KickUserBySaveErr', null, csID, roleID, accountID)
    ];

    Q.all(jobs)
        .then(function () {
                  logger.warn('playerManager.KickUserClearUp. success: roleID: %s, accountID: %s', roleID, accountID);
              })
        .catch(function (err) {
                   logger.warn('playerManager.KickUserClearUp. failed: %s', utils.getErrorMessage(err));
               });
};


/**
 * 玩家清理
 *  1. 玩家数据异常 踢玩家下线
 *  2. 这里与UserLeave不做数据保存
 *  @param {string} csID 玩家csID
 *  @param {int} roleID角色id
 * */
Handler.UserClear = function (csID, roleID) {
    logger.debug('%d csRemote.UserClear: csID:%s', roleID, csID);

//    var expLevel = 0;

    var tempPlayer = this.GetPlayer(roleID);
    if (!tempPlayer) {
        return;
    }

    tssClient.sendLogoutChannel(tempPlayer.GetOpenID(), roleID, {
        flag: 0
    });


    var player = this.GetPlayer(roleID);
    if (!player) {
        return;
    }

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
    this.DeletePlayer(roleID);
};

Handler.SetUnionInfo = function (roleID) {
    var self = this;
    var player = self.GetPlayer(roleID);
    if (!!player) {
//        var uID = player.GetPlayerInfo(ePlayerInfo.UnionID);
//        if (0 == uID) {
        pomelo.app.rpc.us.usRemote.FindRoleUnionInfo(null, roleID, function (err, union) {
            if (!!err) {
                logger.error("error when playerManager SetUnionInfo %s", utils.getErrorMessage(err));
                return false;
            }
            if (!!union) {
                player.SetPlayerInfo(ePlayerInfo.UnionID, union.unionID || 0);
                player.SetPlayerInfo(ePlayerInfo.UnionName, union.unionName || '');
            } else {
                player.SetPlayerInfo(ePlayerInfo.UnionID, 0);
                player.SetPlayerInfo(ePlayerInfo.UnionName, '');
            }
            player.UpdateChartRoleInfo();
        });
//        }
    }
};
// 获取当天午夜12点钟的日期，即第二天凌晨0点的日期
function getSameDayMidnightDate(oldDate) {
    var midnightSec = Math.ceil(oldDate.getTime() / (86400 * 1000)) * (86400 * 1000) - 3600 * 1000 * 8;
    var midnightDate = new Date(midnightSec);
    return midnightDate;
};

Handler.SaveTblogInfo = function (player) {       //保存玩家的tblog表信息
    var platId = config.vendors.tencent.platId;
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var expLev = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var moneyNum = player.GetAssetsManager().GetAssetsValue(globalFunction.GetMoneyTemp());
    var diamondNum = player.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp());
    pomelo.app.rpc.fs.fsRemote.GetFriendNum(null, roleID, gameConst.eFriendType.All, function (err, res) {
        var friendNum = 0;
        if (!err) {
            friendNum = res.number;
        }
        var tblogsqlStr = 'CALL sp_saveRoleInfo(?,?,?,?,?,?,?)';
        var tblogArgs;
        if (0 == platId) {      //IOS
            tblogArgs = [expLev, friendNum, moneyNum, 0, diamondNum, 0, roleID];
        }
        else {                  //Android
            tblogArgs = [expLev, friendNum, 0, moneyNum, 0, diamondNum, roleID];
        }
        tbLogClient.query(roleID, tblogsqlStr, tblogArgs, utils.done);
    });
};


Handler.UpdateTencentScore = function (player) {
    var zhanli = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
    var accountType = player.GetPlayerInfo(ePlayerInfo.AccountType);
    var openId = player.GetOpenID();
    var token = player.GetToken();

    if (accountType == gameConst.eLoginType.LT_QQ) {
        var msdkOauth = require('../../tools/openSdks/tencent/msdkOauth');

        msdkOauth.qqscore(openId, token, zhanli, 3, 1)
            .then(function (result) {
                      if (!!result.ret) {
                          logger.error('UpdateTencentScore failed result: %j', result);
                      }
                  })
            .fail(function (err) {
                      logger.error('UpdateTencentScore failed: %s', utils.getErrorMessage(err));
                  });

    } else if (accountType == gameConst.eLoginType.LT_WX) {
        var wxOauth = require('../../tools/openSdks/tencent/wxOauth');

        wxOauth.wxscore(openId, token, zhanli)
            .then(function (result) {
                      if (!!result.ret) {
                          logger.error('UpdateTencentScore failed result: %j', result);
                      }
                  })
            .fail(function (err) {
                      logger.error('UpdateTencentScore failed: %s', utils.getErrorMessage(err));
                  });
    }
};

Handler.SetForbidInfo = function (roleID) {     //设置idip触发信息
    var self = this;
    gmSql.GetPlayerForbidInfo(roleID, function (err, info) {
        if (!!err) {
            logger.error('query player forbid info error: %s', utils.getErrorMessage(err));
            return;
        }
        var result = info['_result'];
        var forbidProfit = info['_forbidProfit'];            //禁止收益结束时间
        var forbidChat = info['_forbidChat'];                //禁止聊天结束时间
        var forbidChartList = info['_forbidChart'];              //禁止参与排行榜结束时间
        var forbidPlay = info['_forbidPlay'];                //禁止玩法结束时间
        var forbidPlayList = info['_forbidPlayList'];        //禁止玩法类型
        var nowDate = new Date();

        if (result != 0) {
            return;
        }

        forbidChat = JSON.parse(forbidChat);
        if (nowDate < new Date(forbidChat.time)) {   //禁止聊天
            pomelo.app.rpc.chat.chatRemote.SetSendChatTime(null, roleID, forbidChat, function () {
                self.SendForbidChatTime(roleID, forbidChat);
            });
        }

        if (nowDate < new Date(forbidProfit)) {   //零收益
            self.SetForbidProfitTime(roleID, forbidProfit);
        }

        forbidPlayList = JSON.parse(forbidPlayList);
        self.SetForbidPlayInfo(roleID, forbidPlayList); //禁止玩法

        forbidChartList = JSON.parse(forbidChartList);
        for (var i in forbidChartList) {
            if (nowDate < new Date(forbidChartList[i])) {
                self.SetForbidChartInfo(roleID, +i, forbidChartList[i]);  //禁止排行
            }
        }
    });
};

Handler.GetForbidProfitTime = function (roleID) {     //获取零收益结束时间
    if (null != this.profitList[roleID]) {
        return this.profitList[roleID];
    }
    return 0;
};

Handler.SetForbidProfitTime = function (roleID, dateStr) {     //设置零收益结束时间
    this.profitList[roleID] = new Date(dateStr).getTime();
    this.SendForbidProfitTime(roleID);
};

Handler.SetForbidPlayInfo = function (roleID, typeList) {     //设置禁止玩法信息
    this.forbidPlayList[roleID] = typeList;
    this.SendForbidPlayTime(roleID);
};

Handler.GetForbidPlayInfo = function (roleID) {     //获取禁止玩法信息
    if (null != this.forbidPlayList[roleID]) {
        return this.forbidPlayList[roleID];
    }
    return null;
};

Handler.SetForbidChartInfo = function (roleID, type, dateStr) {     //设置禁止参与排行榜信息
    if (this.forbidChartList[roleID] == null) {
        this.forbidChartList[roleID] = {};
    }
    this.forbidChartList[roleID][type] = dateStr;
    this.SendForbidChartTime(roleID);
};

Handler.GetForbidChartInfo = function (roleID) {     //获取禁止排行榜信息
    if (null != this.forbidChartList[roleID]) {
        return this.forbidChartList[roleID];
    }
    return null;
};

Handler.RemoveForbid = function (roleID, removeProfit, removeChat, removeChart, removePlay) {     //解除禁止
    if (1 == removeProfit) {    //解禁收益
        delete this.profitList[roleID];
    }

    if (1 == removeChat) {  //解禁聊天
        var data = {'time': utilSql.DateToString(new Date()), 'reason': ''};
        this.SendForbidChatTime(roleID, data);

        pomelo.app.rpc.chat.chatRemote.SetSendChatTime(null, roleID, data, utils.done);    }


    if (1 == removeChart) {  //解禁排行榜
        delete this.forbidChartList[roleID];
        this.SendForbidChartTime(roleID);

        //pomelo.app.rpc.chart.chartRemote.SetForbidTime(null, roleID, 99, utilSql.DateToString(new Date(new Date()-86400000)), utils.done);
    }

    if (1 == removePlay) {  //解禁玩法
        delete this.forbidPlayList[roleID];
        this.SendForbidPlayTime(roleID);
    }
};

Handler.GetGmZhanli = function () {
    return this.gmZhanliValue;
};

Handler.SetGmZhanli = function (value) {
    this.gmZhanliValue = value;
};

//同步0收益剩余时间消息
Handler.SendForbidProfitTime = function (roleID) {
    var self = this;
    var route = "ServerForbidProfitTime";
    var msg = {profitTime: 0};
    if (self.GetForbidProfitTime(roleID) >= new Date().getTime()) {
        msg.profitTime = Math.floor((self.GetForbidProfitTime(roleID) - (new Date().getTime())) / 1000)
    }
    if (self.GetPlayer(roleID)) {
        self.GetPlayer(roleID).SendMessage(route, msg);
    }
};

//同步禁止排行剩余时间消息
Handler.SendForbidChartTime = function (roleID) {
    var self = this;
    var route = "ServerForbidChartTime";
    /*var msg = {chartTime: 0};
     if (new Date(self.GetForbidChartInfo(roleID)).getTime() >= new Date().getTime()) {
     msg.chartTime =
     Math.floor((new Date(self.GetForbidChartInfo(roleID)).getTime() - (new Date().getTime())) / 1000);
     }
     if (self.GetPlayer(roleID)) {
     self.GetPlayer(roleID).SendMessage(route, msg);
     }*/

    var msg = {};
    var forbidChartList = self.GetForbidChartInfo(roleID);
    for (var index in forbidChartList) {
        if (new Date(forbidChartList[index]).getTime() >= new Date().getTime()) {
            msg[index] = Math.floor((new Date(forbidChartList[index]).getTime() - (new Date().getTime())) / 1000);
        }
    }
    if (self.GetPlayer(roleID)) {
        self.GetPlayer(roleID).SendMessage(route, msg);
    }
};

//同步禁止深度玩法剩余时间消息
Handler.SendForbidPlayTime = function (roleID) {
    var self = this;
    var route = "ServerForbidPlayTime";
    var forbidList = {};
    var forbidPlayList = self.GetForbidPlayInfo(roleID);
    if (_.isEmpty(forbidPlayList) == false) {
        for (var index in forbidPlayList) {
            if (new Date() < new Date(forbidPlayList[index][0])) {
                forbidList[index] =
                {
                    'time': Math.floor((new Date(forbidPlayList[index][0]).getTime() - (new Date().getTime())) / 1000),
                    'reason': forbidPlayList[index][1]
                };
            }
        }
    }
    if (self.GetPlayer(roleID)) {
        self.GetPlayer(roleID).SendMessage(route, forbidList);
    }

};

Handler.SendForbidChatTime = function (roleID, forbidChat) {
    var self = this;
    var route = "ServerForbidChatTime";
    var msg = {'reason': forbidChat.reason};
    if (new Date(forbidChat.time).getTime() <= (new Date().getTime())) {
        msg['time'] = 0;
    } else {
        msg['time'] = Math.floor((new Date(forbidChat.time).getTime() - (new Date().getTime())) / 1000);
    }

    if (self.GetPlayer(roleID)) {
        self.GetPlayer(roleID).SendMessage(route, msg);
    }
};

Handler.CheckForbidTimeIsOver = function (nowtime) {
    var self = this;
    for (var Index in self.playerList) {
        var tempPlayer = self.playerList[Index];
        var roleID = tempPlayer.playerInfo[ePlayerInfo.ROLEID];
        if (self.GetForbidProfitTime(roleID) && self.GetForbidProfitTime(roleID) < nowtime) {
            self.SendForbidProfitTime(roleID);
            delete self.profitList[roleID];

        }
        /*  if (self.GetForbidChartInfo(roleID) && new Date(self.GetForbidChartInfo(roleID)).getTime() < nowtime) {
         self.SendForbidChartTime(roleID);
         delete self.forbidChartList[roleID];
         }*/
        var chartIsOver = false;
        if (self.forbidChartList[roleID] && _.isEmpty(self.forbidChartList[roleID]) == false) {
            for (var index in self.forbidChartList[roleID]) {
                if (new Date(self.forbidChartList[roleID][index]).getTime() < nowtime) {
                    delete self.forbidChartList[roleID][index];
                    chartIsOver = true;
                }
            }
            if (chartIsOver) {
                self.SendForbidChartTime(roleID);
            }
            if (_.isEmpty(self.forbidChartList[roleID]) == true) {
                delete self.forbidChartList[roleID];
            }
        }

        var playIsOver = false;
        if (self.forbidPlayList[roleID] && _.isEmpty(self.forbidPlayList[roleID]) == false) {
            for (var index in self.forbidPlayList[roleID]) {
                if (new Date(self.forbidPlayList[roleID][index][0]).getTime() < nowtime) {
                    delete self.forbidPlayList[roleID][index];
                }
            }
            if (playIsOver) {
                self.SendForbidPlayTime(roleID);
            }
            if (_.isEmpty(self.forbidPlayList[roleID] == true)) {
                delete self.forbidChartList[roleID];
            }
        }

        /*if (self.GetForbidPlayInfo(roleID) && self.GetForbidPlayInfo(roleID).forbidTime.getTime() < nowtime) {
         self.SendForbidPlayTime(roleID);
         delete self.forbidPlayList[roleID];
         }*/
    }
};

Handler.CheckForbidTime = function (roleID, type, subType, callback) {
    var self = this;
    var result = 0;
    if (type === 0 && self.GetForbidProfitTime(roleID) >= new Date().getTime()) {
        result = Math.floor((self.GetForbidProfitTime(roleID) - (new Date().getTime())) / 1000);
    }

    if (type === 1) {
        var forbidChartList = self.GetForbidChartInfo(roleID);
        if (forbidChartList && forbidChartList[subType]
            && new Date(forbidChartList[subType]).getTime() >= new Date().getTime()) {
            result = Math.floor((new Date(forbidChartList[subType]).getTime() - (new Date().getTime())) / 1000);
        }
    }

    if (type === 2) {
        var forbidPlayerList = self.GetForbidPlayInfo(roleID);
        if (forbidPlayerList && forbidPlayerList[subType]
            && new Date(forbidPlayerList[subType][0]).getTime() >= new Date().getTime()) {
            result = Math.floor((new Date(forbidPlayerList[subType][0]).getTime() - (new Date().getTime())) / 1000);
        }
    }

    if (type === 3) {
        pomelo.app.rpc.chat.chatRemote.GetForbidChatInfo(null, roleID, function (res) {
            if (res && new Date(res.time).getTime() >= new Date().getTime()) {
                result = Math.floor((new Date(res.time).getTime() - (new Date().getTime())) / 1000);
            }
            return callback({'result': result, 'subType': subType});
        });
    } else {
        return callback({'result': result, 'subType': subType});
    }
};

/**
 * 刷新微信玩家头像本地化 单区榜需要显示
 * @param {Object} player 玩家对象
 * */
Handler.localizeWXPicture = function (player) {

    var accountType = player.GetPlayerInfo(ePlayerInfo.AccountType);
    var openId = player.GetOpenID();
    var token = player.GetToken();

    if (accountType == gameConst.eLoginType.LT_WX) {
        var wxOauth = require('../../tools/openSdks/tencent/wxOauth');

        wxOauth.wxuserinfo(openId, token)
            .then(function (wxInfo) {
                      if (!!wxInfo) {
                          var wxPicture = !!wxInfo.picture ? wxInfo.picture :
                                          'http://1251044271.cdn.myqcloud.com/1251044271/icon/WX.png?';
                          var nickName = !!wxInfo.nickname ? wxInfo.nickname : '';
                          player.SetPlayerInfo(ePlayerInfo.Picture, wxPicture);
                          player.SetPlayerInfo(ePlayerInfo.NickName, nickName);
                          player.SetPlayerInfo(ePlayerInfo.openID, openId);
                          player.UpdateChartRoleInfo();
                      }
                  })
            .fail(function (err) {
                      logger.error('localizeWXPicture wxuserinfo  failed: %s', utils.getErrorMessage(err));
                  });
    } else if (accountType == gameConst.eLoginType.LT_QQ) {
        var msdkOauth = require('../../tools/openSdks/tencent/msdkOauth');

        msdkOauth.qqprofile(openId, token)
            .then(function (qqInfo) {
                      var nickName = !!qqInfo.nickName ? qqInfo.nickName : '';

                      player.SetPlayerInfo(ePlayerInfo.Picture, "");
                      player.SetPlayerInfo(ePlayerInfo.NickName, nickName);
                      /** 重启服务器的时候 roleinfo redis openID 需要*/
                      player.SetPlayerInfo(ePlayerInfo.openID, openId);
                      player.UpdateChartRoleInfo();
                  })
            .fail(function (err) {
                      logger.error('localizeQQMesage  failed: %s', utils.getErrorMessage(err));
                  });

    }
};


// 修复角色身上的异常数据
Handler.FixUnusualData = function (player) {
    if (player == null) {
        return;
    }
    player.GetItemManager().RemoveExtraLingshi();
    player.roleFashionManager.returnRedundantFrag();
    player.GetRoleChartManager().ObtainDailyMail();
    this.FixLingshiData(player);
    this.FixCareerDataData(player);
    this.ReturnLingshiData(player);
    this.FixNewServerLingshi(player);
    //player.GetMissionManager().MissionSysOver();
};


// 修复转职失败后的职业信息
Handler.FixCareerDataData = function (player) {
    if (player == null) {
        return;
    }

    var isItemFix = player.GetItemManager().isNeedTrans();
    var isSkillFix = player.GetSkillManager().isNeedTrans();
    if (isItemFix == false && isSkillFix == false) {
        return;
    }

    if (isItemFix) {
        player.GetItemManager().TransferEquip();
        var itemList = player.GetItemManager().GetAllItem();
        player.GetItemManager().SendItemMsg(itemList, eCreateType.Old,
                                            gameConst.eItemOperType.OtherType);
    }

    if (isSkillFix) {
        player.GetRuneManager().ResetAllRune4Transfer();
        player.GetSkillManager().TransferSkill();
        player.GetRuneManager().SendRuneMsg(null);
        player.GetSkillManager().SendSkillMsg(null);
        player.GetSoulManager().SendSoulMsg(null);
    }
    /*
     setTimeout(function(){
     var accountID = player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID);
     pomelo.app.rpc.ps.psRemote.KickUserOut(null, accountID, utils.done);
     }, 20 * 1000);
     */
}

// 修复异常灵石数量
Handler.FixLingshiData = function (player) {
    // 该区没有需要修复的，则返回
    if (config.fixData.fixLingshiData == null || config.fixData.fixLingshiData[config.list.serverUid.toString()]
                                                 == null) {
        return;
    }
    if (player == null) {
        return;
    }

    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var fixData = config.fixData.fixLingshiData[config.list.serverUid.toString()][roleID.toString()];

    // 只有异常的数据玩家才做处理
    if (fixData == null) {
        return;
    }

    var giftData = player.giftManager.GetGiftData(globalFunction.GetFixLingshiGiftID());

    // 已经处理过，就不处理了
    if (giftData != null) {
        return;
    }

    var INT_MAX = 2100000000;                    // 防止溢出，这是财产的最大值
    var init_ID = fixData.LingshiID;             // 把角色的灵石还原到哪个等级
    var dec_Num = fixData.LingshiNum;            // 删除灵石的数量

    var itemList = player.GetItemManager().GetAllItem();
    for (var itemID in itemList) {
        var item = itemList[itemID];
        if (item == null) {
            continue;
        }

        var itemTemplate = item.GetItemTemplate();
        if (null == itemTemplate) {
            continue;
        }

        for (var i = 0; i < 3; ++i) {
            var starID = item.GetItemInfo(eItemInfo['STAR' + i]);
            if (starID > 0 && starID >= init_ID) {
                itemLogic.RemoveStar(player, item.GetItemInfo(eItemInfo.GUID), i);
            }
        }
    }

    var lingshiList = {};
    for (var id1 = 2010; id1 > init_ID; --id1) {
        var num1 = player.assetsManager.GetAssetsValue(id1);
        if (num1 > 0) {
            lingshiList[id1] = num1;
        }
    }

    for (var id2 in lingshiList) {
        var num2 = lingshiList[id2];
        if (dec_Num > INT_MAX) {
            logger.error("player's Lingshi has been max so we clear him all Lingshi %j, %j", roleID, dec_Num);
        }
        else {
            var doubleNum = Math.pow(5, id2 - init_ID) * num2;
            player.assetsManager.AlterAssetsValue(init_ID, doubleNum, eAssetsAdd.LingshiUnload);
        }
        player.assetsManager.AlterAssetsValue(id2, -num2, eAssetsReduce.SysUnusual);
    }

    player.assetsManager.AlterAssetsValue(init_ID, -dec_Num, eAssetsReduce.SysUnusual);
    player.giftManager.AddSysGift(globalFunction.GetFixLingshiGiftID());

    var mailDetail = {
        recvID: roleID,
        subject: stringValue.sMsString.sendName,
        mailType: gameConst.eMailType.System,
        content: stringValue.sAdminCommandsString.fixLingshi,
        items: []
    };
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }
    });

};

// 补偿玩家6.13日期内活动损失的灵石
Handler.ReturnLingshiData = function (player) {
    // 该区没有需要修复的，则返回
    if (config.fixData.returnLingshiData == null || config.fixData.returnLingshiData[config.list.serverUid.toString()]
        == null) {
        return;
    }
    if (player == null) {
        return;
    }

    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var fixData = config.fixData.returnLingshiData[config.list.serverUid.toString()][roleID.toString()];

    // 只有异常的数据玩家才做处理
    if (fixData == null) {
        return;
    }

    var giftData = player.giftManager.GetGiftData(globalFunction.GetRerurnLingshiID());

    // 已经处理过，就不处理了
    if (giftData != null) {
        return;
    }

    var mailDetail = {
        recvID: roleID,
        subject: stringValue.sMsString.sendName,
        mailType: gameConst.eMailType.System,
        content: stringValue.sAdminCommandsString.returnLingshi,
        items: []
    };
    mailDetail.items.push([2003, fixData]);
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }
        player.giftManager.AddSysGift(globalFunction.GetRerurnLingshiID());
    });
};


// 修复异常灵石数量
Handler.FixNewServerLingshi = function (player) {
    // 该区没有需要修复的，则返回
    if (config.fixData.DelServerLingshi == null || config.fixData.DelServerLingshi[config.list.serverUid.toString()]
        == null) {
        return;
    }
    if (player == null) {
        return;
    }

    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    var fixData = config.fixData.DelServerLingshi[config.list.serverUid.toString()][roleID.toString()];

    // 只有异常的数据玩家才做处理
    if (fixData == null || --fixData <= 0) {
        return;
    }

    var giftData = player.giftManager.GetGiftData(globalFunction.GetFixLingshiGiftID());

    // 已经处理过，就不处理了
    if (giftData != null) {
        return;
    }

    var INT_MAX = 2100000000;                    // 防止溢出，这是财产的最大值
    var init_ID = 2005;                          // 把角色的灵石还原到哪个等级
    var dec_Num = fixData * 2;                   // 删除灵石的数量

    var itemList = player.GetItemManager().GetAllItem();
    for (var itemID in itemList) {
        var item = itemList[itemID];
        if (item == null) {
            continue;
        }

        var itemTemplate = item.GetItemTemplate();
        if (null == itemTemplate) {
            continue;
        }

        for (var i = 0; i < 3; ++i) {
            var starID = item.GetItemInfo(eItemInfo['STAR' + i]);
            if (starID > 0 && starID >= init_ID) {
                itemLogic.RemoveStar(player, item.GetItemInfo(eItemInfo.GUID), i);
            }
        }
    }

    var lingshiList = {};
    for (var id1 = 2010; id1 > init_ID; --id1) {
        var num1 = player.assetsManager.GetAssetsValue(id1);
        if (num1 > 0) {
            lingshiList[id1] = num1;
        }
    }

    for (var id2 in lingshiList) {
        var num2 = lingshiList[id2];
        if (dec_Num > INT_MAX) {
            logger.error("player's Lingshi has been max so we clear him all Lingshi %j, %j", roleID, dec_Num);
        }
        else {
            var doubleNum = Math.pow(5, id2 - init_ID) * num2;
            player.assetsManager.AlterAssetsValue(init_ID, doubleNum, eAssetsAdd.LingshiUnload);
        }
        player.assetsManager.AlterAssetsValue(id2, -num2, eAssetsReduce.SysUnusual);
    }

    player.assetsManager.AlterAssetsValue(init_ID, -dec_Num, eAssetsReduce.SysUnusual);
    player.assetsManager.AlterAssetsValue(7002, -fixData * 50, eAssetsReduce.SysUnusual);
    player.assetsManager.AlterAssetsValue(804104, -fixData, eAssetsReduce.SysUnusual);
    player.giftManager.AddSysGift(globalFunction.GetFixLingshiGiftID());

    var mailDetail = {
        recvID: roleID,
        subject: stringValue.sMsString.sendName,
        mailType: gameConst.eMailType.System,
        content: stringValue.sAdminCommandsString.fixLingshi,
        items: []
    };
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }
    });

};
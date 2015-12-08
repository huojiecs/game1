/**
 * Created by CUILIN on 14-10-27.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../tools/constValue');
var util = require('util');
var playerManager = require('../ps/player/playerManager');
var errorCodes = require('../tools/errorCodes');
var utils = require('../tools/utils');
var Q = require('q');
var _ = require('underscore');
var psSql = require('../tools/mysql/psSql');
var gameClient = require('../tools/mysql/gameClient');
var tbLogClient = require('../tools/mysql/tbLogClient');
var utilSql = require('../tools/mysql/utilSql');
var defaultValues = require('../tools/defaultValues');
var globalFunction = require('../tools/globalFunction');
var templateManager = require('../tools/templateManager');
var config = require('../tools/config');
var guidManager = require('../tools/guid');
var templateConst = require('../../template/templateConst');
var accountClient = require('../tools/mysql/accountClient');


var tCustomList = templateConst.tCustomList;
var eLoginState = gameConst.eLoginState;
var ePlayerInfo = gameConst.ePlayerInfo;
var eItemInfo = gameConst.eItemInfo;
var eEquipBag = gameConst.eEquipBag;
var eMailState = gameConst.eMailState;
var eMailType = gameConst.eMailType;
var eBagPos = gameConst.eBagPos;
var eSkillInfo = gameConst.eSkillInfo;
var eSoulInfo = gameConst.eSoulInfo;
var tItem = templateConst.tItem;
var tSoul = templateConst.tSoul;
var tSoulInfo = templateConst.tSoulInfo;
var tMagicSoul = templateConst.tMagicSoul;
var eMagicSoulInfo = gameConst.eMagicSoulInfo;
var eAlchemyInfo = gameConst.eAlchemyInfo;
var tMissions = templateConst.tMissions;
var eMineSweepInfo = gameConst.eMineSweepInfo;

var Handler = module.exports;

Handler.DeleteRole = function (accountID, roleID, roleName, callback) {
    if (null == accountID || null == roleID) {
        return callback(null, {
            result: errorCodes.ParameterNull
        });
    }
    // remove player from async server.
    pomelo.app.rpc.rs.rsRemote.DeleteOccupantRole(null, roleID, utils.done);
    pomelo.app.rpc.pvp.pvpRemote.RemovePlayerPvpInfo(null, roleID, utils.done);
    pomelo.app.rpc.chart.chartRemote.RemovePlayerScore(null, roleID, utils.done);
    pomelo.app.rpc.us.usRemote.RemoveUnionScore(null, roleID, utils.done);

    logger.warn('delete role, accountID: %j, roleID: %j, roleName: %j', accountID, roleID, roleName);

    psSql.DeleteRoleAresInfo(roleID, utils.done);
    psSql.DeleteRole(roleID, function (err, result) {
        if (!!err) {
            logger.error('accountID:' + accountID + '删除玩家出现错误' + err.stack);
            return callback(null, {
                result: errorCodes.SystemWrong
            });
        }
        if ('' !== roleName) {
            psSql.DeleteRoleName(roleName, function() {
                return callback(null, {
                    result: result
                });
            });
        } else {
            return callback(null, {
                result: result
            });
        }
    });
};

Handler.CreateRole = function (tempID, roleName, yuanbao, accountID, callback) {
    var self = this;
    if (null == accountID || null == tempID || null == roleName) {
        return callback(null, {
            result: errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidRoleName(roleName) == false) {
        return callback(null, {
            result: errorCodes.Ls_NameNum
        });
    }
    var initTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == initTemplate) {
        return callback(null, {
            result: errorCodes.SystemWrong
        });
    }
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', '1');
    var defaultReliveNum = defaultValues.lifeNum;
    if (null != vipTemplate) {
        defaultReliveNum = vipTemplate[templateConst.tVipTemp.freeWarReliveNum];
    }
    var itemList = [];
    var skillList = [];
    var soulList = [];
    var giftList = [];
    var climbInitInfo = [];
    var magicSoulInfo = new Array(eMagicSoulInfo.Max);
    var alchemyInfo = new Array(eAlchemyInfo.Max);

    var expLevel = defaultValues.initExpLevel;
    var playerInfo = new Array(ePlayerInfo.MAX);
    playerInfo[ePlayerInfo.ROLEID] = 0;
    playerInfo[ePlayerInfo.ACCOUNTID] = accountID;
    playerInfo[ePlayerInfo.NAME] = roleName;
    playerInfo[ePlayerInfo.TEMPID] = tempID;
    playerInfo[ePlayerInfo.ExpLevel] = expLevel;
    playerInfo[ePlayerInfo.EXP] = 0;
    playerInfo[ePlayerInfo.ZHANLI] = playerManager.GetInitZhan(expLevel);
    playerInfo[ePlayerInfo.LifeNum] = defaultReliveNum;
    playerInfo[ePlayerInfo.LoginTime] = '';
    playerInfo[ePlayerInfo.VipPoint] = 0;
    playerInfo[ePlayerInfo.LoginPrize] = '';
    playerInfo[ePlayerInfo.VipLevel] = 0;
    playerInfo[ePlayerInfo.UnionID] = 0;
    playerInfo[ePlayerInfo.UnionName] = 0;
    playerInfo[ePlayerInfo.Story] = 0;
    playerInfo[ePlayerInfo.AccountType] = 0;
    playerInfo[ePlayerInfo.IsBind] = 0;

    var serverUid = config.list.serverUid;

    var mineSweepInfo = new Array(eMineSweepInfo.MAX);
    mineSweepInfo[eMineSweepInfo.mineSweepID] = 0;
    mineSweepInfo[eMineSweepInfo.mineSweepLevelID] = 0;
    mineSweepInfo[eMineSweepInfo.maxHp] = 0;
    mineSweepInfo[eMineSweepInfo.currentHp] = 0;
    mineSweepInfo[eMineSweepInfo.leftTimes] = 0;
    mineSweepInfo[eMineSweepInfo.leftReviveTimes] = 0;
    mineSweepInfo[eMineSweepInfo.cdTime] = 0;
    mineSweepInfo[eMineSweepInfo.passCdTime] = utilSql.DateToString(new Date());
    mineSweepInfo[eMineSweepInfo.baoXiang_ClearLevel] = 0;
    mineSweepInfo[eMineSweepInfo.baoXiang_KillAll] = 0;
    mineSweepInfo[eMineSweepInfo.items] = JSON.stringify(GetMineSweepItemData());
    Q.nfcall(psSql.CheckRoleName, roleName, accountID)
        .then(function (res) {      //检测用户名是否重复
                  var result = res['_result'];
                  var roleID = res['_resultID'];
                  if (result != 0) {
                      var result = errorCodes.Ls_Name;
                      return Q.reject(result);
                  }
                  playerInfo[ePlayerInfo.ROLEID] = roleID;
                  mineSweepInfo[eMineSweepInfo.roleID] = roleID;//魔域添加ID
                  for (var i = 0; i < eEquipBag.MAX; ++i) {
                      var equipID = initTemplate['equip_' + i];
                      if (equipID > 0) {
                          var newItem = CreateItem(equipID, eBagPos.EquipOn, roleID);
                          if (newItem.length > 0) {
                              itemList.push(newItem);
                          }
                      }
                  }
                  for (var i = 0; i < 10; ++i) {
                      var itemID = initTemplate['item_' + i];
                      var itemNum = initTemplate['itemNum_' + i];
                      if (itemID > 0 && itemNum > 0) {
                          for (var j = 0; j < itemNum; ++j) {
                              var newItem = CreateItem(itemID, eBagPos.EquipOff, roleID);
                              if (newItem.length > 0) {
                                  itemList.push(newItem);
                              }
                          }
                      }
                  }
                  for (var i = 0; i < 10; ++i) {
                      var skillID = initTemplate['skill_' + i];
                      if (skillID > 0) {
                          var newSkill = CreateSkill(skillID, roleID);
                          if (newSkill.length > 0) {
                              skillList.push(newSkill);
                          }
                      }
                  }
                  for (var i = 0; i < 10; ++i) {
                      var soulID = initTemplate['soul_' + i];
                      if (soulID > 0) {
                          var newSoul = CreateSoul(soulID, roleID);
                          if (newSoul.length > 0) {
                              soulList.push(newSoul);
                          }
                      }
                  }
                  for (var i = 0; i < 10; ++i) {
                      var giftID = initTemplate['giftID_' + i];
                      if (giftID > 0) {
                          giftList.push(giftID);
                      }
                  }
                  var magicSoulID = initTemplate['magicSoulID'];
                  if (magicSoulID > 0) {
                      magicSoulInfo = CreateMagicSoul(magicSoulID, roleID);
                  }
                  alchemyInfo = CreateAlchemy(roleID);

                  var itemInfo = GetItemSqlStr(itemList);
                  var skillInfo = GetSkillSqlStr(skillList);
                  var soulInfo = GetSoulSqlStr(soulList);
                  var giftSqlStr = GetGiftSqlStr(giftList, roleID);
                  var magicSoulInfoSqlStr = GetMagicSoulSqlStr(magicSoulInfo);
                  var climbSqlStr = GetClimbInitSqlStr(climbInitInfo, roleID);
                  var alchemyInfoSqlStr = GetAlchemyInfoSqlStr(alchemyInfo);
                  var mineSweepInfoSqlStr = GetMineSweepInfoSqlStr(mineSweepInfo);

                  var misInfo = '';
                  var IDGroup = [];   //存放任务的组ID(数组中的项不能重复，无须排列)

                  var addNewPlayerMissions = function(missionList){
                        if(missionList == null){
                            return;
                        }
                        for (var index = 0; index < missionList.length; ++index) {
                            //任务信息
                            var template = templateManager.GetTemplateByID('MissionTemplate', missionList[index]);
                            if (!template) {
                                continue;
                            }

                            if (template[tMissions.lowLevel] <= 1) {    //新建角色即添加的任务
                                misInfo +=
                                    '(' + template[tMissions.attID] + ',' + roleID + ', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1),';
                            }
                            //创建帐号是检测每日刷新的任务有没有符合等级要求的，如果有将对应的组ID添加到数组中入库
                            if (template[tMissions.isUpdate] > 0 && template[tMissions.lowLevel] <= 1 && -1
                                == IDGroup.indexOf(template[tMissions.isUpdate])) {
                                IDGroup.push(template[tMissions.isUpdate]); //将组ID存入数组
                            }
                        }
                  };

                  var missionLevelList = templateManager.GetMissListByType(gameConst.eMisStartCon.Level);
                  var missionLevelFirList = templateManager.GetMissListByType(gameConst.eMisStartCon.LevFir);

                  addNewPlayerMissions(missionLevelList);
                  addNewPlayerMissions(missionLevelFirList);

                  misInfo = misInfo.substring(0, misInfo.length - 1);
                  var IDGroupInfo = '(' + roleID + ',\'' + JSON.stringify(IDGroup) + '\')';   //角色任务组ID信息

                  var misFinishInfo = '(' + roleID + ',\'[]\')';  //已完成特定类型的任务ID

                  var assetsInfo = '';
                  var yuanbaoIsHave = false;
                  for (var i = 0; i < 10; ++i) {
                      var assetsID = initTemplate['assetsID_' + i];
                      var assetsNum = initTemplate['assetsNum_' + i];
                      if (assetsID > 0 && assetsNum > 0) {
                          if(assetsID == globalFunction.GetYuanBaoTemp()) {
                              assetsInfo += '(' + roleID + ',' + assetsID + ',' + yuanbao + '),'
                              yuanbaoIsHave = true;
                          } else {
                              assetsInfo += '(' + roleID + ',' + assetsID + ',' + assetsNum + '),'
                          }
                      }
                  }
                  if(yuanbaoIsHave == false) {
                      assetsInfo += '(' + roleID + ',' + globalFunction.GetYuanBaoTemp() + ',' + yuanbao + '),'
                  }
                  assetsInfo = assetsInfo.substring(0, assetsInfo.length - 1);
                  var mailInfo = '';
                  if (initTemplate['mailItem_0'] > 0) {
                      mailInfo = '(' + roleID + ',' + 0 + ',' + '\'系统管理员\'' + ',' + '\'欢迎新同学\'' + ','
                                     + '\'对于新同学表示热烈的欢迎，并赠送小礼物，希望您笑纳。\'' + ',' + eMailState.UnRead + ','
                                     + eMailType.System
                                     + ','
                                     + '\'' + utilSql.DateToString(new Date()) + '\'' + ',' + initTemplate['mailItem_0']
                                     + ','
                                     + initTemplate['mailItemNum_0'] + ',' + initTemplate['mailItem_1'] + ','
                                     + initTemplate['mailItemNum_1'] + ','
                                     + initTemplate['mailItem_2'] + ',' + initTemplate['mailItemNum_2'] + ','
                                     + initTemplate['mailItem_3'] + ','
                                     + initTemplate['mailItemNum_3'] + ',' + initTemplate['mailItem_4'] + ','
                                     + initTemplate['mailItemNum_4'] + ')';
                  }

                  var vipTemplate = templateManager.GetTemplateByID('VipTemplate', '1');
                  var purchaseNum = vipTemplate['buyPhysicalNum'];
                  var getPhysicalNum = vipTemplate['receivePhysicalNum'];
                  var givePhysicalNum = vipTemplate['givePhysicalNum'];
                  var phySendTime = utilSql.DateToString(new Date());
                  var loginGiftInfo = '(' + roleID + ', 2, 0, 0, 0, 0, 0, 0)';    //登录礼包信息

                  var physicalInfo = '(' + roleID + ',' + purchaseNum + ',' + getPhysicalNum + ',' + givePhysicalNum
                                         + ',' + '\'' + phySendTime + '\'' + ',\'{}\')';
                  var rewardmisInfo = '(' + roleID + ',\'' + JSON.stringify(
                      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) + '\')';

                  //playerManager.SetLoginState(accountID, eLoginState.UnUsual);
                  psSql.CreateRole(accountID, roleID, roleName, tempID, expLevel, playerInfo[ePlayerInfo.ZHANLI],
                                   playerInfo[ePlayerInfo.LifeNum], itemInfo, skillInfo, soulInfo, misInfo, IDGroupInfo,
                                   misFinishInfo, assetsInfo, mailInfo, physicalInfo, giftSqlStr, magicSoulInfoSqlStr,
                                   climbSqlStr, alchemyInfoSqlStr, mineSweepInfoSqlStr, loginGiftInfo, rewardmisInfo,
                                   function (err, _result) {
                                       if (!!err || _result > 0) {
                                           if (_result != errorCodes.Ls_Name) {
                                               logger.error('handler.CreateRole failed: accountID: %d, result: %j, err: %s',
                                                            accountID, _result, utils.getErrorMessage(err));
                                           }
                                           //创建角色失败时删除角色名
                                           psSql.DeleteRoleName(roleName, utils.done);
                                           return callback(null, {
                                               result: _result
                                           });
                                       }
                                       // no need to wait the call back.
                                       if (expLevel >= defaultValues.aPvPRequireLevel) {
                                           var attackNum = utils.packWithDay(defaultValues.aPvPAttackNumMax);
                                           var attackedNum = utils.packWithDay(0);
                                           var pvpLingli = initTemplate['pvpLingli'];
                                           var pvpHonor = initTemplate['pvpHonor'];
                                           var pvpInfo = {
                                               roleID: roleID,
                                               attackNum: attackNum,
                                               attackedNum: attackedNum,
                                               lostTimes: 0,
                                               loseLingli: 0,
                                               lingli: pvpLingli,
                                               honor: pvpHonor
                                           };
                                           pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, roleID, pvpInfo,
                                                                                       utils.done);
                                       }
//                                       if (1 === defaultValues.UseTestEnv) {        //判断是否启用测试环境
//                                           self.UseTestEnv(roleID);
//                                       }
                                       //insert into tbLog role Info

                                       var sqlAccount = 'CALL sp_getMyOpenID(?)';
                                       var argsAccount = [accountID];
                                       accountClient.query(accountID, sqlAccount, argsAccount, function (err, res) {
                                           if (!!err) {
                                               return callback(err, []);
                                           }
                                           var openid = 0;
                                           for (var index in res[0]) {
                                               openid = res[0][index].openID;
                                           }
                                           var gameappid = config.vendors.msdkOauth.appid;
                                           var regtime = utilSql.DateToString(new Date());
                                           var level = defaultValues.initExpLevel;
                                           var gsid = config.list.serverUid;
                                           var iFriends = 0;
                                           var moneyios = 0;
                                           var moneyandroid = 0;
                                           var diamondios = 0;
                                           var platId = config.vendors.tencent.platId;
                                           if (platId === 0) {     //IOS
                                               moneyios = defaultValues.InitMoneyNum;
                                           }
                                           if (platId === 1) {     //Android
                                               moneyandroid = defaultValues.InitMoneyNum;
                                           }
                                           var diamondandroid = 0;
                                           var tblogSql = 'CALL sp_updateRoleInfo(?,?,?,?,?,?,?,?,?,?,?)';
                                           var tblogArgs = [gameappid, openid, regtime, level, iFriends, moneyios,
                                                            moneyandroid, diamondios, diamondandroid, roleID, gsid];
                                           tbLogClient.query(roleID, tblogSql, tblogArgs, utils.done);

                                           psSql.SetRoleIDandSvrUid(roleID, serverUid, roleName, function () {
                                               return callback(null, {result: _result});
                                           });
                                       })
                                   });
              })
        .catch(function (err) {
                   if (!!err) {
                       if (err != errorCodes.Ls_Name) {
                           logger.error('check role name faild, %s', utils.getErrorMessage(err));
                       }
                   }

                   var result = {
                       'result': _.isNumber(err) ? err : errorCodes.SystemWrong
                   };
                   if (result.result != errorCodes.Ls_Name) {  //非名称冲突时删除角色名
                       psSql.DeleteRoleName(roleName, utils.done);
                   }
                   return callback(null, result);
               }).done();
};

Handler.UseTestEnv = function (roleID) {        //启用测试环境
    var setRoleInfoSql = 'call sp_setRoleInfo(?,?,?)';  //设置vip expLevel
    var setRoleInfoArgs = [roleID, 70, 15];
    gameClient.query(roleID, setRoleInfoSql, setRoleInfoArgs, utils.done);

    var setRoleAssetsSql = 'call sp_saveList(?,?,?)';       //设置玩家财产
    var assetsStr = '(' + roleID + ', 1001, 100000000),(' + roleID + ', 1002, 3000000),(' + roleID + ', 1003, 1),('
                        + roleID + ', 1004, 500),(' + roleID + ', 4001, 2),(' + roleID + ', 6001, 100000),(' + roleID
                        + ', 2001, 100000),(' + roleID + ', 5003, 50000),(' + roleID + ', 9021, 7000),(' + roleID
                        + ', 9102, 300),(' + roleID + ', 15001, 999)';
    var setRoleAssetsArgs = ['assets', roleID, assetsStr];
    gameClient.query(roleID, setRoleAssetsSql, setRoleAssetsArgs, utils.done);

    var setNewPlayerSql = 'call sp_saveList(?,?,?)';       //跳过新手引导
    var newPlayerStr = '';
    for (var i = 1; i <= 37; ++i) {
        newPlayerStr += '(' + roleID + ',' + i + '),';
    }
    newPlayerStr = newPlayerStr.substring(0, newPlayerStr.length - 1);
    var setNewPlayerArgs = ['newplayer', roleID, newPlayerStr];
    gameClient.query(roleID, setNewPlayerSql, setNewPlayerArgs, utils.done);

    //设置玩家关卡全开(剧情，炼狱)
    var customeRows = [];
    var customTemplateList = templateManager.GetAllTemplate('CustomListTemplate');
    for (var index in  customTemplateList) {
        var temp = customTemplateList[index];
        var customNum = temp[tCustomList.customNum];
        for (var i = 0; i < customNum; ++i) {
            var row = [roleID, temp['custom_' + i], 0, 1, 1, 0, gameConst.eLevelTarget.Normal, 0];
            customeRows.push(row);
            row = [roleID, temp['hellCustom_' + i], 0, 1, 1, 0, gameConst.eLevelTarget.Normal, 0];
            customeRows.push(row);
        }
    }
    var setCustomSql = 'call sp_saveList(?,?,?)';
    var customStr = utilSql.BuildSqlValues(customeRows);
    var setCustomArgs = ['areasco', roleID, customStr];
    gameClient.query(roleID, setCustomSql, setCustomArgs, utils.done);

    //设置玩家魔灵信息
    var setMagicSoulSql = 'call sp_saveList(?,?,?)';
    var magicSoulStr = '(1001,' + roleID + ',224,1001001,0,1001,0,0,0,0,0,0,0)';
    var setMagicSoulArgs = ['magicsoul', roleID, magicSoulStr];
    gameClient.query(roleID, setMagicSoulSql, setMagicSoulArgs, utils.done);
};

function GetMineSweepItemData() { //初始化魔域格子信息
    var grid = [];
    for (var g = 0; g < defaultValues.GridNum; g++) {
        var gridInfo = [];
        for (var i = 0; i < defaultValues.GridInfoNum; i++) {
            gridInfo.push(0);
        }
        grid.push(gridInfo)
    }
    return grid;
};

function CreateItem(tempID, bagType, roleID) {
    var itemTemp = templateManager.GetTemplateByID('ItemTemplate', tempID);
    if (null == itemTemp) {
        logger.error('没有这个物品' + tempID);
        return [];
    }
    //var newGuid = guidManager.GetItemID();
    var newItem = new Array(eItemInfo.Max);
    for (var i = 0; i < eItemInfo.Max; ++i) {
        newItem[i] = 0;
    }
    newItem[eItemInfo.GUID] = guidManager.GetUuid();
    newItem[eItemInfo.TEMPID] = tempID;
    newItem[eItemInfo.ROLEID] = roleID;
    newItem[eItemInfo.NUM] = 1;
    newItem[eItemInfo.BAGTYPE] = bagType;
    //newItem[ eItemInfo.Itemuuid ] = guidManager.GetUuid();

    var starValue = 0;
    var randomtotal = 0;
    for (var i = 0; i < 4; ++i) {
        var baseValue = itemTemp['baseValue_' + i];
        var randomValue = itemTemp['randomValue_' + i];
        var value = baseValue + Math.floor(Math.random() * randomValue);
        var attIndex = itemTemp['baseAtt_' + i];
        if (value > 0) {
            newItem[eItemInfo.ATTACK + attIndex] = value;
        }
        if (randomValue <= 0) {
            continue;
        }
        value -= baseValue;
        switch (attIndex + eItemInfo.ATTACK) {
            case eItemInfo.ATTACK:
            { //攻击
                starValue += value * gameConst.eAttFactor.GONGJI;
                randomtotal += randomValue * gameConst.eAttFactor.GONGJI;
            }
                break;
            case eItemInfo.DEFENCE:
            { //防御
                starValue += value * gameConst.eAttFactor.FANGYU;
                randomtotal += randomValue * gameConst.eAttFactor.FANGYU;
            }
                break;
            case eItemInfo.ITEMINFO_MAXHP:
            { //最大血量
                starValue += value * gameConst.eAttFactor.MAXHP;
                randomtotal += randomValue * gameConst.eAttFactor.MAXHP;
            }
                break;
            case eItemInfo.ITEMINFO_MAXMP:
            { //最大魔法量
                starValue += value * gameConst.eAttFactor.MAXMP;
                randomtotal += randomValue * gameConst.eAttFactor.MAXMP;
            }
                break;
            case eItemInfo.ITEMINFO_CRIT:
            { //暴击值
                starValue += value * gameConst.eAttFactor.BAOJILV;
                randomtotal += randomValue * gameConst.eAttFactor.BAOJILV;
            }
                break;
            case eItemInfo.ITEMINFO_ANTICRIT:
            { //暴击抵抗
                starValue += value * gameConst.eAttFactor.BAOJIDIKANG;
                randomtotal += randomValue * gameConst.eAttFactor.BAOJIDIKANG;
            }
                break;
        }
    }

    //计算星级
    var star = starValue / randomtotal;
    star = Math.round(star * 10) / 10;  //对计算结果小数点后第二位做四舍五入处理
    if (star < 0.2) {
        newItem[eItemInfo.ItemStar] = 1;
    }
    else if (star < 0.4) {
        newItem[eItemInfo.ItemStar] = 2;
    }
    else if (star < 0.6) {
        newItem[eItemInfo.ItemStar] = 3;
    }
    else if (star < 0.8) {
        newItem[eItemInfo.ItemStar] = 4;
    }
    else {
        newItem[eItemInfo.ItemStar] = 5;
    }

    for (var i = 0; i < 4; ++i) {
        var baseValue = itemTemp['baseAdd_' + i];
        var randomValue = itemTemp['randomAdd_' + i];
        var value = baseValue + Math.floor(Math.random() * randomValue);
        var attIndex = itemTemp['addAtt_' + i];
        if (value > 0) {
            newItem[eItemInfo.ATTACK + attIndex] = value;
        }
    }
    newItem[eItemInfo.ZHANLI] = GetItemZhanli(itemTemp[tItem.baseZhanli], 0, 0);
    return newItem;
};

function CreateSkill(skillID, roleID) {
    var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
    if (null == skillTemplate) {
        return [];
    }
    var newSkill = new Array(eSkillInfo.Max);
    newSkill[eSkillInfo.RoleID] = roleID;
    newSkill[eSkillInfo.TempID] = skillID;
    newSkill[eSkillInfo.CdTime] = 0;
    newSkill[eSkillInfo.RuneBranch] = 0;
    return newSkill;
};

function CreateSoul(soulID, roleID) {
    var SoulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == SoulTemplate) {
        return [];
    }
    var infoID = SoulTemplate[tSoul.att_0];
    var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', infoID);
    if (null == SoulInfoTemplate) {
        return [];
    }
    var newSoul = new Array(eSoulInfo.Max);
    newSoul[eSoulInfo.TEMPID] = soulID;
    newSoul[eSoulInfo.RoleID] = roleID;
    newSoul[eSoulInfo.LEVEL] = SoulTemplate[tSoul.initLevel];
    newSoul[eSoulInfo.ATTID_0] = SoulInfoTemplate[tSoulInfo.att_0];
    newSoul[eSoulInfo.ATTNUM_0] = 1;
    newSoul[eSoulInfo.ATTID_1] = SoulInfoTemplate[tSoulInfo.att_1];
    newSoul[eSoulInfo.ATTNUM_1] = 1;
    newSoul[eSoulInfo.ATTID_2] = SoulInfoTemplate[tSoulInfo.att_2];
    newSoul[eSoulInfo.ATTNUM_2] = 1;
    newSoul[eSoulInfo.PROBABILITY] = SoulInfoTemplate[tSoulInfo.probability];
    newSoul[eSoulInfo.SkillNum] = 0;
    //计算各个变身的初始战力
    var soulInfoID = SoulTemplate['att_' + ( SoulTemplate[tSoul.initLevel] - 1)];
    var initSoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    if (null == initSoulInfoTemplate) {
        newSoul[eSoulInfo.Zhanli] = 0;
    }
    else {
        newSoul[eSoulInfo.Zhanli] = initSoulInfoTemplate[tSoulInfo.upAdd_Zhan];
    }
    //newSoul[ eSoulInfo.Zhanli ] = 0;
    return newSoul;
};

function CreateMagicSoul(magicSoulID, roleID) {
    var magicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', magicSoulID);
    if (null == magicSoulTemplate) {
        return {};
    }
    var magicSoulInfo = new Array(eMagicSoulInfo.Max);
    magicSoulInfo[eMagicSoulInfo.TEMPID] = magicSoulID;
    magicSoulInfo[eMagicSoulInfo.RoleID] = roleID;
    magicSoulInfo[eMagicSoulInfo.Zhanli] = 0;
    magicSoulInfo[eMagicSoulInfo.InfoID] = magicSoulTemplate[tMagicSoul.att_0];
    magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_0] = magicSoulTemplate[tMagicSoul.openSkillID];
    magicSoulInfo[eMagicSoulInfo.SkillID_1] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_2] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_3] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_4] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_5] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_6] = 0;
    magicSoulInfo[eMagicSoulInfo.SkillID_7] = 0;
    return magicSoulInfo;
};

function CreateAlchemy(roleID) {
    var alchemyInfo = new Array(eAlchemyInfo.Max);
    alchemyInfo[eAlchemyInfo.RoleID] = roleID;
    alchemyInfo[eAlchemyInfo.time] = 0;
    alchemyInfo[eAlchemyInfo.isBaoJi] = 0;
    return alchemyInfo;
};

function GetItemSqlStr(itemList) {
    var itemInfo = '';
    for (var index in itemList) {
        var item = itemList[index];
        itemInfo += '(';
        for (var i = 0; i < eItemInfo.Max; ++i) {
            var value = item[i];
            if (typeof  value == 'string') {
                itemInfo += '\'' + value + '\'';
                itemInfo += ',';
            }
            else {
                itemInfo += value;
                itemInfo += ',';
            }
        }
        itemInfo = itemInfo.substring(0, itemInfo.length - 1);
        itemInfo += '),';
    }
    itemInfo = itemInfo.substring(0, itemInfo.length - 1);

    var sqlString = utilSql.BuildSqlValues(itemList);

    if (sqlString !== itemInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, itemInfo);
    }

    return sqlString;
};

function GetSkillSqlStr(skillList) {
    var skillInfo = '';
    for (var index in skillList) {
        var temp = skillList[index];
        skillInfo += '(';
        for (var i = 0; i < eSkillInfo.Max; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                skillInfo += '\'' + value + '\'' + ',';
            }
            else {
                skillInfo += value + ',';
            }
        }
        skillInfo = skillInfo.substring(0, skillInfo.length - 1);
        skillInfo += '),';
    }
    skillInfo = skillInfo.substring(0, skillInfo.length - 1);

    var sqlString = utilSql.BuildSqlValues(skillList);

    if (sqlString !== skillInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, skillInfo);
    }

    return sqlString;
};

function GetSoulSqlStr(soulList) {
    var soulInfo = '';
    for (var index in soulList) {
        var temp = soulList[index];
        soulInfo += '(';
        for (var i = 0; i < eSoulInfo.Max; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                soulInfo += '\'' + value + '\'' + ',';
            }
            else {
                soulInfo += value + ',';
            }
        }
        soulInfo = soulInfo.substring(0, soulInfo.length - 1);
        soulInfo += '),';
    }
    soulInfo = soulInfo.substring(0, soulInfo.length - 1);

    var sqlString = utilSql.BuildSqlValues(soulList);

    if (sqlString !== soulInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, soulInfo);
    }

    return sqlString;
};

function GetGiftSqlStr(dataList, roleID) {
    var rows = [];

    var strInfo = '';
    for (var index in dataList) {
        var ID = dataList[index];
        strInfo += '(' + ID + ',' + roleID + ',' + 0 + '),';

        rows.push([ID, roleID, 0]);
    }
    strInfo = strInfo.substring(0, strInfo.length - 1);

    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;
};

function GetMagicSoulSqlStr(magicSoulInfo) {
    var magicSoulInfoSqlStr = '';

    var temp = magicSoulInfo;
    magicSoulInfoSqlStr += '(';
    for (var i = 0; i < eMagicSoulInfo.Max; ++i) {
        var value = temp[i];
        if (typeof  value == 'string') {
            magicSoulInfoSqlStr += '\'' + value + '\'' + ',';
        }
        else {
            magicSoulInfoSqlStr += value + ',';
        }
    }
    magicSoulInfoSqlStr = magicSoulInfoSqlStr.substring(0, magicSoulInfoSqlStr.length - 1);
    magicSoulInfoSqlStr += '),';
    magicSoulInfoSqlStr = magicSoulInfoSqlStr.substring(0, magicSoulInfoSqlStr.length - 1);

    var sqlString = utilSql.BuildSqlValues([magicSoulInfo]);

    if (sqlString !== magicSoulInfoSqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, magicSoulInfoSqlStr);
    }

    return sqlString;
};

function GetClimbInitSqlStr(climbInitInfo, roleID) {
    var strInfo = '';
    strInfo += '(' + roleID + ',';
    strInfo += '\'[]\'' + ',';//历史数据
    strInfo += '\'[]\'' + ',';//当天数据
    strInfo += 0 + ',';
    strInfo += '\'[]\'' + ',';//永久保留数据
    strInfo += 0 + ',';//周积分
    strInfo += 1 + ')';//直通车免费次数
//    return strInfo;

    var sqlString = utilSql.BuildSqlValues([
                                               [roleID, '[]', '[]', 0, '[]', 0, 1]
                                           ]);

    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;
}

function GetAlchemyInfoSqlStr(alchemyInfo) {
    var alchemyInfoSqlStr = '';

    var temp = alchemyInfo;
    alchemyInfoSqlStr += '(';
    for (var i = 0; i < eAlchemyInfo.Max; ++i) {
        var value = temp[i];
        if (typeof  value == 'string') {
            alchemyInfoSqlStr += '\'' + value + '\'' + ',';
        }
        else {
            alchemyInfoSqlStr += value + ',';
        }
    }
    alchemyInfoSqlStr = alchemyInfoSqlStr.substring(0, alchemyInfoSqlStr.length - 1);
    alchemyInfoSqlStr += '),';
    alchemyInfoSqlStr = alchemyInfoSqlStr.substring(0, alchemyInfoSqlStr.length - 1);

    var sqlString = utilSql.BuildSqlValues([alchemyInfo]);

    if (sqlString !== alchemyInfoSqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, alchemyInfoSqlStr);
    }

    return sqlString;
};

function GetMineSweepInfoSqlStr(MineSweepInfo) { //初始化魔域关卡信息
//    logger.fatal("魔域关卡信息:"+MineSweepInfo);
    var strInfo = '(';
    for (var t in MineSweepInfo) {
        if (t < MineSweepInfo.length - 1) {
            if (typeof (MineSweepInfo[t]) == 'string') {
                strInfo += "'" + MineSweepInfo[t] + "',";
            } else {
                strInfo += MineSweepInfo[t] + ',';
            }
        } else {
            strInfo += '\'' + MineSweepInfo[t] + '\')';
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(MineSweepInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;

};

function GetItemZhanli(base, qiang, ling) {

    return base + qiang + ling;
};
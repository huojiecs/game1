/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-23
 * Time: 下午6:05
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var psSql = require('../../../tools/mysql/psSql');
var csSql = require('../../../tools/mysql/csSql');
var utils = require('../../../tools/utils');
var gameConst = require('../../../tools/constValue');
var globalFunction = require('../../../tools/globalFunction');
var guidManager = require('../../../tools/guid');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var playerManager = require('../../../ps/player/playerManager');
var offlinePlayerManager = require('../../../ps/player/offlinePlayerManager');
var defaultValues = require('../../../tools/defaultValues');
var errorCodes = require('../../../tools/errorCodes');
var gameClient = require('../../../tools/mysql/gameClient');
var accountClient = require('../../../tools/mysql/accountClient');
var account_globalClient = require('../../../tools/mysql/account_globalClient');
var config = require('./../../../tools/config');
var loginClient = require('../../../ps/login/loginClient');
var tbLogClient = require('./../../../tools/mysql/tbLogClient');
var utilSql = require('../../../tools/mysql/utilSql');
var psRedisManager = require('../../../ps/psRedisManager');
var _ = require('underscore');
var Q = require('q');
var tCustomList = templateConst.tCustomList;

var eLoginState = gameConst.eLoginState;
var ePlayerInfo = gameConst.ePlayerInfo;
var eLoginType = gameConst.eLoginType;
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
var eAssetsChangeReason = gameConst.eAssetsChangeReason;

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.Register = function (msg, session, next) {
    var accountID = session.get('accountID');
    var checkID = session.uid;
    var password = '' + msg.password;
    var account = '' + msg.account;
    var registerType = +msg.registerType;

    if (!checkID || !account || !accountID || !password) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidAccount(account) == false) {
        return next(null, {
            'result': errorCodes.Ls_AccountLen
        });
    }
    if (globalFunction.IsValidPassword(password) == false) {
        return next(null, {
            'result': errorCodes.Ls_InvalidPassword
        });
    }
    if (registerType < gameConst.eLoginType.LT_CheckID || registerType > registerType) {
        return next(null, {
            'result': errorCodes.Ls_InvalidLoginType
        });
    }

    psSql.Register(account, password, checkID, registerType, function (err, result) {
        if (!!err) {
            logger.error('accountID:' + accountID + '玩家第一次登陆注册有问题' + err.stack);
            return next(null, {
                'result': errorCodes.SystemWrong
            });
        }
        if (result == 0) {
            playerManager.SetAccountType(accountID, eLoginType.LT_Account);
        }
        return next(null, {
            'result': result
        });
    });
};

handler.CheckAccount = function (msg, session, next) {
    var account = msg.account;
    if (null == account) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidAccount(account) == false) {
        return next(null, {
            'result': errorCodes.Ls_AccountLen
        });
    }
    psSql.CheckAccount(account, function (err, _result) {
        if (!!err) {
            logger.error('account:' + account + '检测玩家账户出现问题' + err.stack);
        }
        return next(null, {
            'result': _result
        });
    });
};

handler.BindEmail = function (msg, session, next) {
    var accountID = session.get('accountID');
    var emailStr = '' + msg.emailStr;
    if (!accountID) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }
    if (!globalFunction.IsValidEmail(emailStr)) {
        return next(null, {
            'result': errorCodes.Ls_InvalidEmail
        });
    }
    var isBind = playerManager.GetIsBind(accountID);
    if (isBind !== 0) {
        return next(null, {
            'result': errorCodes.Ls_BindAlready
        });
    }

    psSql.BindEmail(accountID, emailStr, function (err, result) {
        if (!!err) {
            logger.error('accountID:' + accountID + '绑定邮箱出现问题' + err.stack);
            return next(null, {
                'result': errorCodes.SystemWrong
            });
        }
        playerManager.SetIsBind(accountID, 1);
        return next(null, {
            'result': result
        });
    });
};

handler.ChangePassword = function (msg, session, next) {
    var accountID = session.get('accountID');
    var oldPassword = msg.oldPassword;
    var newPassword = msg.newPassword;
    if (accountID == null || null == newPassword || null == oldPassword) { //玩家未登陆，不能修改密码
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidPassword(oldPassword) == false || globalFunction.IsValidPassword(newPassword) == false) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }
    if (newPassword.length < 6 || newPassword.length > 16) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }
    psSql.ChangePassword(accountID, oldPassword, newPassword, function (err, result) {
        if (!!err) {
            logger.error('accountID:' + accountID + ' newPassword:' + newPassword + '更换密码出现问题' + err.stack);
            return next(null, {
                'result': errorCodes.SystemWrong
            });
        }
        return next(null, {
            'result': result
        });
    });
};

handler.InitAccount = function (msg, session, next) {
    var checkID = '' + session.uid;
    var accountID = +msg.accountID;
    var key = '' + msg.key;
    var serverUid = msg.serverUid || loginClient.serverUid;

    if (checkID.length === 0 || accountID.length === 0 || key.length === 0) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

//    logger.warn('handler.InitAccount: %s, %s, %j', accountID, checkID, playerManager.accountList);

    Q.resolve()
        .then(function () {
                  var deferred = Q.defer();

                  if (playerManager.AccountIsHave(accountID)) {
                      var preCheckID = playerManager.GetAccountCheckID(accountID);
                      logger.warn('Call conRemote.SetUserOut: %s, %s', session.frontendId, preCheckID);
                      Q.ninvoke(pomelo.app.rpc.connector.conRemote, 'SetUserOut', null, session.frontendId, preCheckID)
                          .then(function () {
                                    playerManager.DeleteAccountID(accountID);

                                    deferred.resolve();
                                })
                          .catch(function (err) {
                                     logger.error('Call conRemote.SetUserOut failed: %s, %s, %j', session.frontendId,
                                                  preCheckID, err.stack);
                                     deferred.reject(err);
                                 })
                          .done();
//                pomelo.app.rpc.connector.conRemote.SetUserOut(null, session.frontendId, preCheckID, function () {
//                    logger.warn('Back conRemote.SetUserOut: %s', preCheckID);
//                    deferred.resolve();
//                });
                  }
                  else {
                      deferred.resolve();
                  }

                  return deferred.promise;
              })
        .then(function () {
                  return Q.nfcall(psSql.CheckLogin, accountID, checkID, key, serverUid);
              })
        .spread(function (result, accountType, isBind, openID, retServerUid, retCheckID, openToken) {
                    if (result != 0) {
                        return Q.reject(result);
                    }

                    if (_.isString(retServerUid) && retServerUid.length > 0 && retServerUid != serverUid) {
                        pomelo.app.cluster.ls.lsCluster.NotifyLogin(null, retServerUid, retCheckID, utils.done);
                    }

                    // openID = '87FE6F42489F43C6BB1B336B707C236C';
                    // openToken = 'D324EE2F76A93EBEBEB0E5B47BD3CD50';

                    playerManager.AddAccount(accountID, accountType, isBind, openID, openToken, checkID,
                                             session.frontendId, new Date());

                    //logger.warn('************************添加账户');
                    session.set('accountID', accountID);
                    session.set('loginTime', Date.now());

                    return Q.ninvoke(session, 'pushAll');
                })
        .then(function () {
                  playerManager.SetLoginState(accountID, eLoginState.LOGIN);
                  return next(null, {
                      'result': errorCodes.OK
                  });
              })
        .catch(function (err) {
                   if (!!err) {
                       if (utils.indexOfErrorMessage(err, 'session does not exist') !== -1) {
                           logger.warn('InitAccount failed: %j, %j, %j, %s', accountID, checkID, key,
                                       utils.getErrorMessage(err));
                       }
                       else if (err == errorCodes.Ls_KeyWrong) {
                           logger.warn('InitAccount failed: %j, %j, %j, %s', accountID, checkID, key,
                                       utils.getErrorMessage(err));
                       }
                       else {
                           logger.error('InitAccount failed: %j, %j, %j, %s', accountID, checkID, key,
                                        utils.getErrorMessage(err));
                       }
                   }

                   var result = {
                       'result': _.isNumber(err) ? err : errorCodes.SystemWrong
                   };

                   playerManager.DeleteAccountID(accountID);

                   return next(null, result);
               })
        .done();
};

handler.GetRoleList = function (msg, session, next) {
    var accountID = session.get('accountID');
    if (null == accountID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    var state = playerManager.GetLoginState(accountID);
    if (state != eLoginState.LOGIN) {
        return next(null, {
            result: errorCodes.Ls_State
        });
    }
    var serverUid = msg.serverUid || config.list.serverUid;     //serverUid优先使用客户端传递的，若为空则获取本地的
    session.set('serverUid', serverUid);    //将servrUid添加到session，仅供合服后获取用
    session.pushAll();

    var roleIDList = [];
    var openID = playerManager.GetAccountOpenID(accountID);

    var checkID = playerManager.GetAccountCheckID(accountID);
    var sqlStr = 'CALL sp_checkAccountType(?,?,?)';
    var sqlArgs = [openID, checkID, serverUid];
    Q.nfcall(account_globalClient.query, 0, sqlStr, sqlArgs)
        .then(function (res) {
                  var resID = res[0][0]['_result'];
                  if (resID == errorCodes.BlackUser) {    //黑名单用户
                      return Q.reject(errorCodes.BlackUser);
                  }
                  else if (resID == errorCodes.WhiteUser) {   //白名单用户
                      return Q.promise;
                  }
                  else if (config.mysql.global.isWhiteOnly && resID == 0) {   //只允许白名单用户登录
                      return Q.reject(errorCodes.SeverMaintain);
                  }
                  else {  //除黑名单用户均可登录
                      return Q.promise;
                  }
              }).then(function () {
                          return Q.nfcall(psSql.GetRoleIDListbyAccountID, accountID, serverUid)
                              .catch(function (err) {
                                         logger.error();
                                         var result = errorCodes.SystemWrong;
                                         return Q.reject(result);
                                     })
                      })
        .then(function (res) {
                  roleIDList = res;
                  var csServers = pomelo.app.getServersByType('cs');
                  var jobs = _.map(roleIDList, function (roleID) {
                      return _.map(csServers, function (csInfo) {
                          return Q.ninvoke(pomelo.app.rpc.cs.csRemote, 'UserLeave', null,
                                           csInfo.id, roleID)
                      })
                  });
                  return Q.all(jobs);
              }).then(function () {
                          var sqlCalls = _.map(roleIDList, function (item) {
                              return Q.nfcall(csSql.GetRoleInfoByID, item);
                          });
                          return Q.all(sqlCalls);
                      })
        .then(function (dataList) {
                  var playerList = [];
                  var itemList = [];
                  for (var i in dataList) {
                      playerList.push(dataList[i][0]);
                      for (var j in dataList[i][1]) {
                          itemList.push(dataList[i][1][j]);
                      }
                  }
                  playerManager.AddAllRole(accountID, playerList);
                  return next(null, {
                      result: 0,
                      playerList: playerList,
                      itemList: itemList
                  });
              })
        .catch(function (err) {
                   if (!!err && err != errorCodes.SeverMaintain) {
                       logger.error('get role list faild,  %s', utils.getErrorMessage(err));
                   }
                   var result = {
                       'result': _.isNumber(err) ? err : errorCodes.SystemWrong
                   };
                   return next(null, result);
               }).done();


};

handler.DeleteRole = function (msg, session, next) {
    var accountID = session.get('accountID');
    var roleID = msg.roleID;
    if (null == accountID || null == roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    var loginState = playerManager.GetLoginState(accountID);
    if (loginState != eLoginState.LOGIN) {
        return next(null, {
            result: errorCodes.Ls_State
        });
    }
    var playerNum = playerManager.GetPlayerNum(accountID);
    if (playerNum <= 0) {
        return next(null, {
            result: errorCodes.Ls_PlayerNum
        });
    }
    if (playerManager.RoleIsHave(accountID, roleID) == false) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var roleName = playerManager.GetRoleName(accountID, roleID);
    playerManager.SetLoginState(accountID, eLoginState.UnUsual);

    // remove player from async server.
    pomelo.app.rpc.rs.rsRemote.DeleteOccupantRole(null, roleID, utils.done);
    pomelo.app.rpc.pvp.pvpRemote.RemovePlayerPvpInfo(null, roleID, utils.done);
    pomelo.app.rpc.chart.chartRemote.RemovePlayerScore(null, roleID, utils.done);
    pomelo.app.rpc.us.usRemote.RemoveUnionScore(null, roleID, utils.done);


    offlinePlayerManager.DeletePlayer(roleID);
    logger.warn('delete role, accountID: %j, roleID: %j, roleName: %j', accountID, roleID, roleName);
    /**  添加 玩家删除清除 ares 数据*/
    psSql.DeleteRoleAresInfo(roleID, utils.done);
    psSql.DeleteRole(roleID, function (err, result) {
        if (!!err) {
            playerManager.SetLoginState(accountID, loginState);
            logger.error('accountID:' + accountID + '删除玩家出现错误' + err.stack);
            return next(null, {
                result: errorCodes.SystemWrong
            });
        }
        playerManager.SetLoginState(accountID, loginState);
        playerManager.DeleteRole(accountID, roleID);
        if ('' !== roleName) {
            psSql.DeleteRoleName(roleName, utils.done);
        }
        return next(null, {
            result: result
        });
    });


    /*var sqlStr = 'CALL sp_getDeleteTime(?);';
     var sqlArgs = [accountID];
     Q.nfcall(accountClient.query, accountID, sqlStr, sqlArgs)
     .then(function (res) {
     var preDelTIime = new Date(res[0][0]['_delTime']);
     var nowDate = new Date();
     var oldYear = preDelTIime.getFullYear() + 1;
     var oldDay = preDelTIime.getDate();
     var oldMonth = preDelTIime.getMonth();
     var nowYear = nowDate.getFullYear();
     var nowDay = nowDate.getDate();
     var nowMonth = nowDate.getMonth();
     if (oldDay != nowDay || oldMonth != nowMonth || oldYear != nowYear) {

     }
     else {
     return Q.reject(errorCodes.DelOneRolePerDay);
     }

     }).catch(function (error) {
     return next(null, {'result': _.isNumber(error) ? error : errorCodes.SystemWrong});
     }).done();
     */
};

handler.CreateRole = function (msg, session, next) {

    if (!config.mysql.global.isCreateRole) {
        return next(null, {
            result: errorCodes.ForbidCreateRole
        });
    }

    var self = this;
    var accountID = session.get('accountID');
    var tempID = msg.tempID;
    var roleName = msg.roleName;
    if (null == accountID || null == tempID || null == roleName) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    var loginState = playerManager.GetLoginState(accountID);
    if (loginState != eLoginState.LOGIN) {
        return next(null, {
            result: errorCodes.Ls_State
        });
    }
    if (globalFunction.IsValidRoleName(roleName) == false) {
        return next(null, {
            result: errorCodes.Ls_NameNum
        });
    }
    var playerNum = playerManager.GetPlayerNum(accountID);
    if (playerNum >= defaultValues.roleNum) {
        return next(null, {
            result: errorCodes.Ls_PlayerNum
        });
    }
    var initTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == initTemplate) {
        return next(null, {
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
    playerInfo[ePlayerInfo.serverUid] = session.get('serverUid');

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
    mineSweepInfo[eMineSweepInfo.times] = 0;
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
                  for (var i = 0; i < 10; ++i) {
                      var assetsID = initTemplate['assetsID_' + i];
                      var assetsNum = initTemplate['assetsNum_' + i];
                      if (assetsID > 0 && assetsNum > 0) {
                          assetsInfo += '(' + roleID + ',' + assetsID + ',' + assetsNum + '),'
                      }
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

                  var purchaseNum = vipTemplate['buyPhysicalNum'];
                  var getPhysicalNum = vipTemplate['receivePhysicalNum'];
                  var givePhysicalNum = vipTemplate['givePhysicalNum'];
                  var phySendTime = utilSql.DateToString(new Date());
                  var loginGiftInfo = '(' + roleID + ', 2, 0, 0, 0, 0, 0, 0)';    //登录礼包信息
                  var physicalInfo = '(' + roleID + ',' + purchaseNum + ',' + getPhysicalNum + ',' + givePhysicalNum
                                     + ',' + '\'' + phySendTime + '\'' + ',\'{}\')';
                  var rewardmisInfo = '(' + roleID + ',\'' + JSON.stringify(
                          [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) + '\')';

                  playerManager.SetLoginState(accountID, eLoginState.UnUsual);
                  psSql.CreateRole(accountID, roleID, roleName, tempID, expLevel, playerInfo[ePlayerInfo.ZHANLI],
                                   playerInfo[ePlayerInfo.LifeNum], playerInfo[ePlayerInfo.serverUid], itemInfo,
                                   skillInfo, soulInfo, misInfo, IDGroupInfo,
                                   misFinishInfo, assetsInfo, mailInfo, physicalInfo, giftSqlStr, magicSoulInfoSqlStr,
                                   climbSqlStr, alchemyInfoSqlStr, mineSweepInfoSqlStr, loginGiftInfo, rewardmisInfo,
                                   function (err, _result) {
                                       if (!!err || _result > 0) {
                                           playerManager.SetLoginState(accountID, loginState);
                                           if (_result != errorCodes.Ls_Name) {
                                               logger.error('handler.CreateRole failed: accountID: %d, result: %j, err: %s',
                                                            accountID, _result, utils.getErrorMessage(err));
                                           }
                                           //创建角色失败时删除角色名
                                           psSql.DeleteRoleName(roleName, utils.done);
                                           return next(null, {
                                               result: _result
                                           });
                                       }
                                       playerManager.SetLoginState(accountID, eLoginState.LOGIN);
                                       playerManager.AddRole(accountID, roleID, playerInfo);
                                       //set roleID and serverUid for new role

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

                                       // 添加到redis里 ////////////////////////
                                       var roleInfo = {
                                           roleID: playerInfo[ePlayerInfo.ROLEID],
                                           name: playerInfo[ePlayerInfo.NAME],
                                           expLevel: playerInfo[ePlayerInfo.ExpLevel],
                                           zhanli: playerInfo[ePlayerInfo.ZHANLI],
                                           vipLevel: playerInfo[ePlayerInfo.VipLevel],
                                           isNobility: playerInfo[ePlayerInfo.IsNobility] || 0,
                                           isQQMember: playerInfo[ePlayerInfo.IsQQMember] || 0,
                                           wxPicture: !!playerInfo[ePlayerInfo.Picture] ?
                                                      playerInfo[ePlayerInfo.Picture] : '',
                                           nickName: playerInfo[ePlayerInfo.NickName] || '',
                                           openID: playerManager.GetAccountOpenID(accountID) || ''
                                       };

                                       var redisRoleInfo =
                                               config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':'
                                               + pomelo.app.getMaster().port;
                                       psRedisManager.hSet(redisRoleInfo, roleInfo.roleID, roleInfo, function (err) {
                                           if (err) {
                                               logger.error('add in redis error when createrole, roleid = %d',
                                                            roleInfo.roleID);
                                           }
                                       });
                                       //////////////////////////////////////////

                                       if (1 === defaultValues.UseTestEnv) {        //判断是否启用测试环境
                                           self.UseTestEnv(roleID);
                                       }
                                       //insert into tbLog role Info
                                       var gameappid = config.vendors.msdkOauth.appid;
                                       var openid = playerManager.GetAccountOpenID(accountID) || '';
                                       var accountType = playerManager.GetAccountType(accountID);
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

                                       psSql.SetRoleIDandSvrUid(roleID, playerInfo[ePlayerInfo.serverUid], roleName,
                                                                function () {
                                                                    return next(null, {result: _result});
                                                                });
                                       // tlog for createrole
                                       for (var i = 0; i < 10; ++i) {
                                           var assetsID = initTemplate['assetsID_' + i];
                                           var assetsNum = initTemplate['assetsNum_' + i];
                                           if (assetsID == globalFunction.GetMoneyTemp()) {
                                               tlogger.log({15: 0}, 'CurrencyFlow', accountType, openid, 1, 0, 0,
                                                                    assetsNum, assetsNum,
                                                                    eAssetsChangeReason.Add.CreateRole,
                                                                    eAssetsChangeReason.Reduce.DefaultReduce,
                                                                    eAssetsChangeReason.Add.DefaultAdd,
                                                                    eAssetsChangeReason.Reduce.DefaultReduce,
                                                                    roleID);
                                               tlogger.log({3: 0}, 'MoneyFlow', accountType, openid, 1, assetsNum,
                                                                   assetsNum,
                                                                   eAssetsChangeReason.Add.CreateRole, 0, 0, 0, roleID);
                                           }
                                           if (assetsID == globalFunction.GetYuanBaoTemp()) {
                                               tlogger.log({15: 0}, 'CurrencyFlow', accountType, openid, 1, 1, 0,
                                                                    assetsNum, assetsNum,
                                                                    eAssetsChangeReason.Add.DefaultAdd,
                                                                    eAssetsChangeReason.Reduce.DefaultReduce,
                                                                    eAssetsChangeReason.Add.CreateRole,
                                                                    eAssetsChangeReason.Reduce.DefaultReduce,
                                                                    roleID);
                                               tlogger.log({3: 0}, 'MoneyFlow', accountType, openid, 1, assetsNum,
                                                                   assetsNum,
                                                                   eAssetsChangeReason.Add.CreateRole, 0, 0, 1, roleID);

                                           }
                                       }
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
                   return next(null, result);
               }).done();
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

function GetItemZhanli(base, qiang, ling) {

    return base + qiang + ling;
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
    newSoul[eSoulInfo.Accomplish] = 0;
    newSoul[eSoulInfo.EvolveNum] = 0;
    newSoul[eSoulInfo.WakeLevel] = 0;
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
function GetMineSweepInfoSqlStr(MineSweepInfo) { //初始化魔域关卡信息
    var strInfo = '(';
    for (var t in MineSweepInfo) {
        if (typeof (MineSweepInfo[t]) == 'string' || MineSweepInfo[t] instanceof Array) {
            strInfo += "'" + MineSweepInfo[t] + "',";
        } else {
            strInfo += MineSweepInfo[t] + ',';
        }
    }
    strInfo = strInfo.substring(0, strInfo.length - 1) + ')';
    var sqlString = utilSql.BuildSqlValues(new Array(MineSweepInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;

};
/*
 gm addallmoney 1001 100000000
 gm addallmoney 1002 3000000
 gm addallmoney 6001 100000
 gm addallmoney 2001 100000
 gm addallmoney 5003 50000
 gm addallmoney 9021 7000
 gm addallmoney 9102 300
 gm addallmoney 15001 999
 "(457,1004,500),(457,4001,2),(457,2001,6),(457,15001,30),(457,1001,10000),(457,1003,1)"
 * */
handler.UseTestEnv = function (roleID) {        //启用测试环境
    var setRoleInfoSql = 'call sp_setRoleInfo(?,?,?)';  //设置vip expLevel
    var setRoleInfoArgs = [roleID, 80, 0];
    gameClient.query(roleID, setRoleInfoSql, setRoleInfoArgs, utils.done);

    var setRoleAssetsSql = 'call sp_saveList(?,?,?)';       //设置玩家财产
    var assetsStr = '(' + roleID + ', 1004, 500),(' + roleID + ', 4001, 2),(' + roleID + ', 2001, 6),('
                    + roleID + ', 15001, 999),(' + roleID + ', 1001, 100000000),(' + roleID + ', 1003, 1),('
                    + roleID
                    + ', 1002, 10000000), (' + roleID + ', 5005, 300000), (' + roleID + ', 9021, 3000),(' + roleID
                    + ', 9102, 3000),(' + roleID + ', 6001, 10000)';
    var setRoleAssetsArgs = ['assets', roleID, assetsStr];
    gameClient.query(roleID, setRoleAssetsSql, setRoleAssetsArgs, utils.done);

    var setNewPlayerSql = 'call sp_saveList(?,?,?)';       //跳过新手引导
    var newPlayerStr = '';
    for (var i = 1; i <= 41; ++i) {
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

    /*//设置玩家魔灵信息
     var setMagicSoulSql = 'call sp_saveList(?,?,?)';
     var magicSoulStr = '(1001,' + roleID + ',224,1001001,0,1001,0,0,0,0,0,0,0)';
     var setMagicSoulArgs = ['magicsoul', roleID, magicSoulStr];
     gameClient.query(roleID, setMagicSoulSql, setMagicSoulArgs, utils.done);*/
};
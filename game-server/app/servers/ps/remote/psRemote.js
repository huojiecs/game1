/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-1
 * Time: 上午10:00
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../../tools/constValue');
var queryUtils = require('../../../tools/queryUtils');
var util = require('util');
var playerManager = require('../../../ps/player/playerManager');
var errorCodes = require('../../../tools/errorCodes');
var utils = require('../../../tools/utils');
var offlinePlayerManager = require('../../../ps/player/offlinePlayerManager');
var limitedGoodsManager = require('../../../ps/limitedGoods/limitedGoodsManager');
var psUtil = require('../../../ps/psUtil');
var idipUtils = require('../../../tools/idipUtils');
var async = require('async');
var psSql = require('../../../tools/mysql/psSql');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('./../../../../template/templateConst');
var eWedding = gameConst.eWedding;
var tWeddingLevel = templateConst.tWeddingLevel;
var Q = require('q');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.ping = function (id, callback) {
    return utils.invokeCallback(callback);
};

handler.UserLeave = function (csID, uid, accountID, inRoleID, callback) {
    logger.info('ps psRemote.UserLeave.accountID: %s, csID:%s, uid:%s', accountID, csID, uid);

    if (playerManager.AccountIsHave(accountID) === false) {
        logger.warn('psRemote.UserLeave.accountID is not in playerManager.: %s, csID:%s, uid:%s', accountID, csID,
                    uid);
//        return callback(null, {'result': 0});
    }
    if (playerManager.GetLoginRole(accountID) != inRoleID) {
        logger.warn('login roleID is not equal inRoleID, loginID: %j, inRoleID: %j',
                    playerManager.GetLoginRole(accountID), inRoleID);
    }
    var roleID = playerManager.GetLoginRole(accountID) || inRoleID;
    csID = csID || playerManager.GetPlayerCs(roleID);

    if (0 == roleID) {
        logger.warn('psRemote.UserLeave. can not GetLoginRole.: %s, csID:%s, uid:%s', accountID, csID, uid);
        playerManager.DeleteAccountID(accountID);
        return callback(null, {'result': 0});
    }

    var jobs = [
        Q.ninvoke(pomelo.app.rpc.fs.fsRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.ms.msRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.rs.rsRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.js.jsRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.chat.chatRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.pvp.pvpRemote, 'DeletePlayer', null, roleID),
        Q.ninvoke(pomelo.app.rpc.us.usRemote, 'DeletePlayer', null, roleID)
    ];

    if (null == csID || csID.length == 0) {
        logger.info('psRemote.UserLeave. can not Get LoginRole csID, accountID: %j, roleID: %j, uid: %j', accountID,
                    roleID, uid);
        var csServers = pomelo.app.getServersByType('cs');
        for (var index in csServers) {
            jobs.push(Q.ninvoke(pomelo.app.rpc.cs.csRemote, 'UserLeave', null, csServers[index].id, roleID));
        }
    }
    else {
        jobs.push(Q.ninvoke(pomelo.app.rpc.cs.csRemote, 'UserLeave', null, csID, roleID));
    }

    logger.info('%d psRemote csRemote.UserLeave:%s, csID:%s, uid:%s', roleID, accountID, csID, uid);


    var nowTime = Date.now();
    var initTime = new Date(playerManager.GetAccountInitTime(accountID)).getTime();
    var duration = Math.floor((nowTime - initTime) / 1000);

    logger.warn('%d PlayerLogout, loginTime: %j, LeaveTime: %j, OnlineTime: %d, accountID: %j', roleID,
                new Date(playerManager.GetAccountInitTime(accountID)), new Date(), duration, accountID);

    queryUtils.Push('logout', util.format('%s, %s, %s, %s', Date.now(), roleID, accountID, duration));

    Q.all(jobs)
        .then(function (results) {
                  var fsNumber = results[0];
                  var last = jobs.length - 1;
                  var expLevel = results[last];
                  var openID = playerManager.GetAccountOpenID(accountID);
                  var accountType = playerManager.GetAccountType(accountID);

                  if(openID != '') {
                      tlogger.log('PlayerLogout', accountType, openID, duration, expLevel, fsNumber, 'NULL', 'NULL', 'NULL',
                                  'NULL', 'NULL', 0, 0, 0, 0, 'NULL', 0, 'NULL', 'NULL', 'NULL');
                  }

                  psUtil.SetCsNum(csID, false);
                  playerManager.DeleteAccountID(accountID);
                  logger.info('psRemote.UserLeave result: %s, csID: %s, uid: %s', accountID, csID, uid);
                  return callback(null, {result: results ? 0 : errorCodes.SystemWrong});
              })
        .catch(function (err) {
                   logger.error('psRemote.UserLeave. failed: %s', utils.getErrorMessage(err));

                   return callback(null, {result: errorCodes.toClientCode(err)});
               });

//    pomelo.app.rpc.fs.fsRemote.DeletePlayer(null, roleID, utils.done);
//    pomelo.app.rpc.ms.msRemote.DeletePlayer(null, roleID, utils.done);
//    pomelo.app.rpc.rs.rsRemote.DeletePlayer(null, roleID, utils.done);
//    pomelo.app.rpc.chat.chatRemote.DeletePlayer(null, roleID, utils.done);
//
//    logger.debug('%d psRemote csRemote.UserLeave:%s, csID:%s, uid:%s', roleID, accountID, csID, uid);
//    pomelo.app.rpc.cs.csRemote.UserLeave(null, csID, roleID, function (err, res) {
//        psUtil.SetCsNum(csID, false);
//        playerManager.DeleteAccountID(accountID);
//        logger.debug('psRemote.UserLeave. result: %s, csID:%s, uid:%s, %j', accountID, csID, uid, err);
//        return callback(err, {'result': res ? 0 : errorCodes.SystemWrong});
//    });
};

handler.SetPlayerCsID = function (roleID, csID, callback) {
    playerManager.SetPlayerCs(roleID, csID);
    return callback();
};

handler.GetDetails = function (roleID, callback) {

//    logger.info('ps玩家 GetDetails:' + roleID);

    offlinePlayerManager.GetDetails(roleID, function (err, details) {
        return callback(err, details);
    });
};
handler.GetPlayerDetails = function (roleID, callback) {
    offlinePlayerManager.GetPlayerDetails(roleID, function (err, details, csID) {
        return callback(err, details, csID);
    });
};
handler.GetPvpDetails = function (roleID, callback) {
    offlinePlayerManager.GetPlayerDetailsEX(roleID, function (err, details) {
        return callback(err, details);
    });
};

handler.AttConstructMessage = function (roleID, callback) {

//    logger.info('ps玩家 AttConstructMessage:' + roleID);

    offlinePlayerManager.AttConstructMessage(roleID, function (err, attList) {
        return callback(err, attList);
    });

};

handler.PvpAttConstructMessage = function (roleID, callback) {
    offlinePlayerManager.PvpAttConstructMessage(roleID, function (err, attList) {
        return callback(err, attList);
    });
};

handler.gmCommands = function (gmStr, paramObj, callback) {
    var list = pomelo.app.getServersByType('cs');
    if (!list || !list.length) {
        logger.error('can not find cs server 1.');
        return callback();
    }
    for (var index in list) {
        var csSeverID = list[index].id;
        pomelo.app.rpc.cs.gmRemote.gmCommands(null, csSeverID, gmStr, paramObj, utils.done);
    }
    return callback();
};

/**
 * 玩家保存数据出错时， 踢玩家下线：
 * 1， cs玩家保存数据出错， 并重试失败后， 向ps 发送踢玩家下线
 * 2， ps 到前端服请求关闭玩家session
 * 3， 到端会rpc ps玩家下线， 走一个来回
 *      时序 cs->ps-connector-ps -> {cs(只清除玩家数据不保存), fs, ms, chat, rs}
 * @param {number} csID 玩家csID
 * @param {number} roleID 玩家ID
 * @param {number} accountID 玩家账号ID
 * @param {function} callback  回调函数
 * */
handler.KickUserBySaveErr = function (csID, roleID, accountID, callback) {
    logger.info('player kick by save data err accountID %s:' + accountID);
    if (playerManager.AccountIsHave(accountID) === false) {
        logger.debug('psRemote.KickUserBySaveErr.accountID is not in playerManager.: %s, csID:%s', accountID,
                     csID);
        logger.info('没有这个账户登陆，不必清除');
        return callback();
    }
    var roleID = playerManager.GetLoginRole(accountID) || roleID;
    csID = csID || playerManager.GetPlayerCs(roleID);
    if (roleID == 0 || null == csID || csID.length == 0) {
        logger.debug('psRemote.KickUserBySaveErr. can not GetLoginRole.: %s, csID:%s', accountID, csID);
        playerManager.DeleteAccountID(accountID);
        return callback();
    }

    var nowTime = Date.now();
    var initTime = new Date(playerManager.GetAccountInitTime(accountID)).getTime();
    var duration = Math.floor((nowTime - initTime) / 1000);
    logger.warn('%d PlayerLogout, loginTime: %j, LeaveTime: %j, OnlineTime: %d', roleID,
                new Date(playerManager.GetAccountInitTime(accountID)), new Date(), duration);
    //TODO GAO
//    var openID = playerManager.GetAccountOpenID(accountID);
//    tlogger.log('PlayerLogout', openID, duration, 0, 0, 'NULL', 'NULL', 'NULL', 'NULL',
//                'NULL', 0, 0, 0, 0, 'NULL', 0, 'NULL', 'NULL', 'NULL');

    var checkID = playerManager.GetAccountCheckID(accountID);
    var frontendID = playerManager.GetAccountFrontendID(accountID);
    if (checkID.length > 0) {
        pomelo.app.rpc.connector.conRemote.KickUserBySaveErr(null, frontendID, checkID, utils.done);
        psUtil.SetCsNum(csID, false);
        playerManager.DeleteAccountID(accountID);
        logger.info('psRemote.UserClear result: %s, csID: %s', accountID, csID);
    }
    return callback();
};

handler.GetPlayerCsID = function (roleID, callback) {
    var csID = playerManager.GetPlayerCs(roleID);
    return callback(null, {csID: csID});
};


handler.AddBlackList = function (roleID, callback) {
    var list = pomelo.app.getServersByType('cs');
    if (!list || !list.length) {
        logger.error('can not find cs server 1.');
        return callback();
    }
    for (var index in list) {
        var csSeverID = list[index].id;
        pomelo.app.rpc.cs.csRemote.AddBlackList(null, csSeverID, roleID, utils.done)
    }
    return callback();
};

handler.AddForbidChartInfo = function (roleID, type, dateStr, callback) {
    var list = pomelo.app.getServersByType('cs');
    if (!list || !list.length) {
        logger.error('can not find cs server 1.');
        return callback();
    }
    for (var index in list) {
        var csSeverID = list[index].id;
        pomelo.app.rpc.cs.csRemote.SetForbidChartInfo(null, csSeverID, roleID, type, dateStr, utils.done)
    }
    return callback();
};

handler.GetLimitGoods = function (callback) {
    var limitGoods = limitedGoodsManager.GetLimitGoodsInfo();
    return callback(limitGoods);
};
handler.SetLimitGoods = function (goodsID, goodsNum, callback) {
    var limitGoods = limitedGoodsManager.SetLimitGoodInfo(goodsID, goodsNum);
    return callback(limitGoods);
};

handler.GetServiceTime = function (callback) {
    var startTime = playerManager.GetStartTime();
    return callback(null, startTime);
};

handler.KickUserOut = function (accountID, callback) {
    var checkID = playerManager.GetAccountCheckID(accountID);
    var frontendID = playerManager.GetAccountFrontendID(accountID);
    if (checkID.length > 0) {
        pomelo.app.rpc.connector.conRemote.SetUserOut(null, frontendID, checkID, callback);
    }
};

/**获取离线玩家信息*/
handler.GetOffPlayerInfo = function (roleID, callback) {
    offlinePlayerManager.LoadPlayer(roleID, function (err, op) {
        if (op) {
            return callback(err, op.attManager.ConstructMessage());
        }
        else {
            return callback(err, null);
        }
    });
};

/**获取离线玩家角色信息 playerIndfo*/
handler.GetOffPlayerInfoNew = function (roleID, callback) {
    offlinePlayerManager.LoadPlayer(roleID, function (err, op) {
        if (op) {
            return callback(err, op.playerInfo);
        }
        else {
            return callback(err, null);
        }
    });
};

/** 发起求婚 同其他cs玩家 */
handler.ToMarry = function (roleID, roleTempId, toMarryID, xinWuID, nowDate,  callback) {
    var self = this;

    self.GetPlayerCsID( toMarryID, function (err, res) {
        if (!!err) {
            logger.error('psRemote ToMarry error, roleID: %j',  roleID);
        }
        else {
            var psCsID = res.csID;
            if (!!psCsID) {  //玩家在其他cs中
                pomelo.app.rpc.cs.csRemote.ToMarry(null, psCsID, roleID, roleTempId, toMarryID, xinWuID, nowDate, callback);
            }else{
                return callback(null, errorCodes.MARRY_OFFLINE);
            }

        }
    });
};

/** 发起求婚 同其他cs玩家 */
handler.ToDivorce = function (roleID, toDivocreID, divocreType, callback) {
    var self = this;

    self.GetPlayerCsID( toDivocreID, function (err, res) {
        if (!!err) {
            logger.error('psRemote ToMarry error, roleID: %j',  roleID);
            return callback(err);
        }
        else {
            var psCsID = res.csID;
            if (!!psCsID) {  //玩家在其他cs中
                pomelo.app.rpc.cs.csRemote.ToDivorce(null, psCsID, roleID, toDivocreID, divocreType, callback);
            }else{
                return callback(null, errorCodes.MARRY_OFFLINE);
            }

        }
    });
};

/** 发起求婚 同其他cs玩家 */
handler.ToAgreeDivorce = function (roleID, toDivocreID, callback) {
    var self = this;

    self.GetPlayerCsID( toDivocreID, function (err, res) {
        if (!!err) {
            logger.error('psRemote ToMarry error, roleID: %j',  roleID);
            return callback(err);
        }
        else {
            var psCsID = res.csID;
            if (!!psCsID) {  //玩家在其他cs中
                pomelo.app.rpc.cs.csRemote.ToAgreeDivorce(null, psCsID, roleID, toDivocreID, callback);
            }else{
                return callback(null, errorCodes.MARRY_OFFLINE);
            }

        }
    });
};



/** 发起求婚 同其他cs玩家 */
handler.Agree = function (roleID, toMarryID, xinWuID, nowDate, marryID, callback) {
    var self = this;

    self.GetPlayerCsID( toMarryID, function (err, res) {
        if (!!err) {
            logger.error('psRemote Agree error, roleID: %j',  roleID);
        }
        else {
            var psCsID = res.csID;
            if (!!psCsID) {  //玩家在其他cs中
                pomelo.app.rpc.cs.csRemote.Agree(null, psCsID, roleID, toMarryID, xinWuID, nowDate, marryID, callback);
            }else{
                return callback(null, errorCodes.MARRY_OFFLINE);
            }

        }
    });
};

/** 拒绝求婚 同其他cs玩家 */
handler.Refuse = function (roleID, fromMarryID, marryID, callback) {
    var self = this;

    self.GetPlayerCsID( fromMarryID, function (err, res) {
        if (!!err) {
            logger.error('psRemote Agree error, roleID: %j',  roleID);
        }
        else {
            var psCsID = res.csID;
            if (!!psCsID) {  //玩家在其他cs中
                pomelo.app.rpc.cs.csRemote.Refuse(null, psCsID, roleID, fromMarryID, marryID, callback);
            }else{
                return callback(null, errorCodes.MARRY_OFFLINE);
            }

        }
    });
};

/** 获取婚礼 玩家信息 */
handler.GetWeddingPlayerInfo = function (weddingList, callback) {
    var self = this;
    var weddingMsgList = [];
    async.each(weddingList, function (wedding, eachCallback) {
            var roleID = wedding[eWedding.roleID];
            var toMarryID = wedding[eWedding.toMarryID];
            var level = wedding[eWedding.marryLevel];
            var bless = wedding[eWedding.bless];

            //同步结婚玩家的 婚礼等级 marryLevel
            self.GetPlayerCsID( roleID, function (err, res) {
                if (!!err) {
                    logger.error('psRemote GetWeddingPlayerInfo error, roleID: %j',  roleID);
                    return eachCallback();
                }
                var psCsID = res.csID;
                if (!!psCsID) {
                    pomelo.app.rpc.cs.csRemote.UpdateMarryLevel(null, psCsID, roleID, level, utils.done);
                }else{
                    //不在线直接修改数据库
                    psSql.UpdateMarryLevel(roleID, level, function (err, res) {
                        if (!!err) {
                            logger.error('同步结婚玩家的 婚礼等级 marryLevel存档出现错误%j', err.stack);
                            return eachCallback();
                        }
                    });
                }

            });
            self.GetPlayerCsID( toMarryID, function (err, res) {
                if (!!err) {
                    logger.error('psRemote GetWeddingPlayerInfo error, roleID: %j',  toMarryID);
                    return eachCallback();
                }

                var psCsID = res.csID;
                if (!!psCsID) {
                    pomelo.app.rpc.cs.csRemote.UpdateMarryLevel(null, psCsID, toMarryID, level, utils.done);
                }else{
                    //不在线直接修改数据库
                    psSql.UpdateMarryLevel(toMarryID, level, function (err, res) {
                        if (!!err) {
                            logger.error('同步结婚玩家的 婚礼等级 marryLevel存档出现错误%j', err.stack);
                            return eachCallback();
                        }
                    });
                }
            });

            //获取结婚人信息
        offlinePlayerManager.GetPlayerDetails(roleID, function (err, details, csID) {

                if (!!err) {
                    logger.error('error when wedding GetWeddingPlayerInfo  file, %s', details.roleID,
                        utils.getErrorMessage(err));
                    return eachCallback();
                }
                if (!details) {
                    logger.warn('warn when wedding GetWeddingPlayerInfo for details is null ,roleID=%j,details=%j', self.owner.id,
                        details);
                    return eachCallback();
                }
                offlinePlayerManager.GetPlayerDetails(toMarryID, function (err, toMarryDetails, csID) {
                    var wed = {};
                    if (!!err) {
                        logger.error('error when wedding GetPlayerInfo  file, %s', toMarryDetails.roleID,
                            utils.getErrorMessage(err));
                        return eachCallback();
                    }
                    if (!toMarryDetails) {
                        logger.warn('warn when wedding for toMarryDetails is null ,roleID=%j,details=%j', self.owner.id,
                            details);
                        return eachCallback();
                    }
                    wed['roleID'] = roleID;
                    wed['roleName'] = details.name ? details.name : '';
                    wed['toMarryID'] = toMarryID;
                    wed['toMarryName'] = toMarryDetails.name ? toMarryDetails.name : '';
                    wed['roleOpenID'] = details.openID;
                    wed['toMarryOpenID'] = toMarryDetails.openID;
                    wed['rolePicture'] = details.picture;
                    wed['toMarryPicture'] = toMarryDetails.picture;
                    wed['marryLevel'] = level;
                    wed['bless'] = bless;
                    wed['guestsNum'] = 0;
                    wed['teXiao'] = '';  //用于婚礼过程中 结婚人 购买特效

                    var wedLevelTemp = templateManager.GetTemplateByID('weddingLevelTemplate', level);
                    wed['hongBaoNum']  = wedLevelTemp[tWeddingLevel.giftNum];

                    weddingMsgList.push(wed);


                    return eachCallback();
                });

            });
        },
        function (err) {
            if (!!err) {
                logger.error('error when GetMarryMassage for union file, %s',
                    utils.getErrorMessage(err));
            }
            return callback(null, weddingMsgList);
        });
};
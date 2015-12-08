/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-6
 * Time: 上午9:58
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var queryUtils = require('../../../tools/queryUtils');
var util = require('util');
var playerManager = require('../../../ps/player/playerManager');
var offlinePlayerManager = require('../../../ps/player/offlinePlayerManager');
var psUtil = require('../../../ps/psUtil');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var messageService = require('./../../../tools/messageService');
var _ = require('underscore');
var Q = require('q');

var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.InitGame = function (msg, session, next) {
    var self = this;

    var roleID = msg.roleID;
    var accountID = session.get('accountID');

    // for tlog
    var ClientVersion = msg.ClientVersion || 'NULL';
    var SystemHardware = msg.SystemHardware || 'NULL';
    var TelecomOper = msg.TelecomOper || 'NULL';
    var Network = msg.Network || 'NULL';
    var LoginChannel = msg.loginChannel || 'NULL';

    /** 添加两种主城分配方式 开关*/
    if (defaultValues.USE_CONNECTOR_TO_CS) {
        var csID = psUtil.GetCsID2(session.frontendId);
    } else {
        var csID = psUtil.GetCsID();
    }

    /*var checkHash = session.get('checkHash');   //客户端完整性校验
     var clientHash = '' + msg.clientHash;
     var checkID = playerManager.GetAccountCheckID(accountID);
     var frontendID = playerManager.GetAccountFrontendID(accountID);
     if (clientHash != checkHash) {
     pomelo.app.rpc.connector.conRemote.KickUserBySaveErr(null, frontendID, checkID, utils.done);
     }*/

    if (!csID) {
        return next(null, {
            result: errorCodes.ServerFull
        });
    }

    if (null == accountID || null == roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (false == playerManager.RoleIsHave(accountID, roleID)) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var loginRole = playerManager.GetLoginRole(accountID);

    Q.resolve()
        .then(function () {
                  logger.debug('%d InitGame 1: loginRole: %s.', roleID, loginRole);
                  if (loginRole !== 0) {
                      return Q.ninvoke(pomelo.app.rpc.ps.psRemote, 'UserLeave', null, playerManager.GetPlayerCs(roleID),
                                       session.uid, accountID, 0);
                  }
                  return Q.resolve();
              })
        .fail(function () {
                  logger.debug('%d InitGame 2.', roleID);
                  return Q.ninvoke(pomelo.app.rpc.ps.psRemote, 'UserLeave', null, playerManager.GetPlayerCs(roleID),
                                   session.uid, accountID, 0);
              })
        .then(function () {
                  logger.debug('%d InitGame 3. %s', roleID, self);
                  return Q.nfcall(SetPlayerInGame, msg, session, csID);
              })
        .fail(function (err) {
                  logger.debug('%d InitGame 4. %s', roleID, err.stack);
                  return Q.ninvoke(pomelo.app.rpc.ps.psRemote, 'UserLeave', null, playerManager.GetPlayerCs(roleID),
                                   session.uid, accountID, roleID);
              })
        .then(function (result) {
                  logger.debug('%d InitGame 5.', roleID);
                  ///////////////////////////////////////////////////////////////////////////////
                  var playerInfo = playerManager.GetPlayerInfo(accountID, roleID);
                  var openID = playerManager.GetAccountOpenID(accountID);
                  var accountType = playerManager.GetAccountType(accountID);
                  var checkID = playerManager.GetAccountCheckID(accountID);
                  var roleName = playerManager.GetRoleName(accountID, roleID);

                  logger.warn('InitGame enterGame %s, %s, %s, %s, %s, %s, %s', Date.now(), roleID, accountID, openID,
                              checkID, session.get('remoteAddress').ip, roleName);

                  queryUtils.Push('enterGame',
                                  util.format('%s, %s, %s, %s, %s, %s, %s', Date.now(), roleID, accountID, openID,
                                              checkID,
                                              session.get('remoteAddress').ip, roleName));

                  if (!!playerInfo) {
                      tlogger.log('PlayerLogin', accountType, openID, playerInfo[ePlayerInfo.ExpLevel], 0,
                                  ClientVersion, 'NULL', SystemHardware, TelecomOper, Network, 0, 0, 0, LoginChannel,
                                  'NULL', 0, 'NULL', 'NULL', 'NULL', playerInfo[ePlayerInfo.VipLevel]);
                  }
                  //////////////////////////////////////////////////////////////////////////////

                  return next(null, result);
              })
        .fail(function (err) {
                  logger.debug('%d InitGame 6.', roleID);
                  logger.error('InitGame failed: %s', utils.getErrorMessage(err));
                  return next(null, {
                      result: errorCodes.SystemWrong
                  });
              })
        .done();
};

var SetPlayerInGame = function (msg, session, csID, callback) {
    var accountID = session.get('accountID');
    var roleID = msg.roleID;

    logger.debug('%d SetPlayerInGame.', roleID);

    playerManager.SetLoginRole(accountID, roleID);
    playerManager.SetPlayerCs(roleID, csID);

    var accountType = playerManager.GetAccountType(accountID);
    var isBind = playerManager.GetIsBind(accountID);
    var playerInfo = playerManager.GetPlayerInfo(accountID, roleID);
    var openID = playerManager.GetAccountOpenID(accountID);
    var token = playerManager.GetAccountKey(accountID);
    var serverUid = session.get('serverUid');

    var paymentInfo = {
        roleId: roleID,
        accountType: accountType,
        openId: openID,
        openKey: token,
        pf: msg.pf,
        payToken: msg.payToken,
        pfKey: msg.pfKey,
        loginChannel: msg.loginChannel,
        idfa: msg.idfa,
        gps_adid: msg.gps_adid,
        android_id: msg.android_id
    };

    if (null == playerInfo) {
        return callback({result: errorCodes.SystemWrong});
    }

    pomelo.app.rpc.cs.csRemote.InitGame(session, csID, session.uid, session.frontendId, roleID, accountID, 0, 0,
                                        accountType, isBind, openID, token, paymentInfo, serverUid,
                                        function (err, result) {
    /** 添加js 玩家对象*/
    pomelo.app.rpc.js.jsRemote.AddPlayer(null, playerInfo, csID, session.uid, session.frontendId,
                                                     utils.done);

                                            logger.debug('%d csRemote.InitGame result: csID: %s.', roleID, csID);
                                            if (!!err) {
                                                playerManager.SetLoginState(accountID, 0);
                                                logger.error('%d csRemote.InitGame failed: %s', roleID, err.stack);
                                                pomelo.app.rpc.cs.csRemote.DeletePlayer(null, csID, roleID, utils.done);
                                                return callback({
                                                    'result': errorCodes.SystemWrong
                                                });
                                            }

                                            session.set('roleID', roleID);
                                            session.set('csServerID', csID);
                                            logger.debug('%d session.pushAll begin: csID: %s.', roleID, csID);

                                            session.pushAll(function (err) {
                                                logger.debug('%d session.pushAll result: csID: %s. %j', roleID, csID,
                                                             err);
                                                if (err) {
                                                    playerManager.SetLoginState(accountID, 0);
                                                    logger.debug('%d SetPlayerInGame DeletePlayer: csID: %s.', roleID,
                                                                 csID);
                                                    pomelo.app.rpc.cs.csRemote.DeletePlayer(null, csID, roleID,
                                                                                            utils.done);
                                                    logger.warn('session.pushAll failed roleID: %s, csID: %s, error: %s',
                                                                roleID, csID, utils.getErrorMessage(err));
                                                    return callback({
                                                        'result': errorCodes.SystemWrong
                                                    });
                                                }
                                                psUtil.SetCsNum(csID, true);

                                                messageService.broadcastRpc('psIdip', {
                                                        roleID: roleID,
                                                        accountID: accountID,
                                                        csServerID: csID,
                                                        frontendID: playerManager.GetAccountFrontendID(accountID),
                                                        checkID: playerManager.GetAccountCheckID(accountID)
                                                    },
                                                    {service: 'psIdipRemote', method: 'notifyUserStatus'});

                                                pomelo.app.rpc.chat.chatRemote.AddPlayer(null, session.uid,
                                                                                         session.frontendId, roleID,
                                                                                         playerInfo[ePlayerInfo.NAME],
                                                                                         openID, accountType,
                                                                                         utils.done);
                                                pomelo.app.rpc.rs.rsRemote.AddPlayer(null, playerInfo, csID,
                                                                                     session.uid, session.frontendId,
                                                                                     utils.done);
                                                /** 初始化pvp player info */
                                                pomelo.app.rpc.pvp.pvpRemote.AddPlayer(null, playerInfo, csID,
                                                                                       session.uid, session.frontendId,
                                                                                       utils.done);

                                                pomelo.app.rpc.us.usRemote.AddPlayer(null, playerInfo, csID,
                                                                                     session.uid, session.frontendId,
                                                                                     utils.done);

                                                //var openID = '87FE6F42489F43C6BB1B336B707C236C';
                                                //var token = 'D324EE2F76A93EBEBEB0E5B47BD3CD50';

                                                var details = {
                                                    "name": playerInfo[ePlayerInfo.NAME],
                                                    "openid": playerManager.GetAccountOpenID(accountID),
                                                    "token": playerManager.GetAccountKey(accountID),
                                                    "accountType": playerInfo[ePlayerInfo.AccountType]
//                    "openid": openID,
//                    "token": token
                                                };
                                                pomelo.app.rpc.fs.fsRemote.LoadFriendList(null, roleID, csID,
                                                                                          session.uid,
                                                                                          session.frontendId,
                                                                                          details, utils.done);

                                                pomelo.app.rpc.ms.msRemote.GetMailList(null, roleID,
                                                                                       playerInfo[ePlayerInfo.NAME],
                                                                                       session.uid,
                                                                                       session.frontendId, openID,
                                                                                       accountType, utils.done);

                                                result.result = 0;

                                                return callback(null, result);
                                            });
                                        });
};

handler.GmControl = function (msg, session, next) {
    if (defaultValues.isGM != 1) {
        return next(null, {
            'result': errorCodes.NoPower
        });
    }

    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var csID = playerManager.GetPlayerCs(roleID);
    if (!csID) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    pomelo.app.rpc.cs.gmRemote.GMorder(null, csID, roleID, msg.cmd, msg.params, function (err, res) {
        if (!!err) {
            return next(null, {'result': errorCodes.SystemWrong});
        }

        if (res.result > 0) {
            return next(null, {
                'result': res.result
            });
        }

        return next(null, res);
    });
};

handler.QueryResult = function (msg, session, next) {
    var key = '' + msg.key;
    var count = +msg.count;

    queryUtils.Pops(key, count, function (error, results) {
        return next(null, {
            result: errorCodes.toClientCode(error),
            list: results
        });
    });
};
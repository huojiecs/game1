/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-9
 * Time: 下午6:08
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var globalFunction = require('../../../tools/globalFunction');
var loginSql = require('../../../tools/mysql/lsSql');
var gameConst = require('../../../tools/constValue');
var serverManager = require('./../../../ls/serverManager');
var errorCodes = require('../../../tools/errorCodes');
var queryUtils = require('../../../tools/queryUtils');
var util = require('util');
var guid = require('../../../tools/guid');
var utils = require('../../../tools/utils');
var defaultValue = require('../../../tools/defaultValues');
var msdkOauth = require('../../../tools/openSdks/tencent/msdkOauth');
var wxOauth = require('../../../tools/openSdks/tencent/wxOauth');
var iTools = require('../../../tools/openSdks/iTools/slootiAPI');
var cmgeApi = require('../../../tools/openSdks/cmge/cmge');
var templateManager = require('../../../tools/templateManager');
var async = require('async');
var Q = require('q');
var _ = require('underscore');

var eLoginType = gameConst.eLoginType;

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.GetBackPassword = function (msg, session, next) {
    var account = msg.account;
    if (null == account) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if (globalFunction.IsValidAccount(account) == false) {
        return next(null, {
            'result': errorCodes.Ls_AccOrPws
        });
    }

    loginSql.GetAccountMail(account, function (err, result) {
        if (!!err) {
            logger.error('account:' + account + '找回密码错误' + err.stack);
            return next(null, {
                'result': errorCodes.SystemWrong
            });
        }

        if (result.length == 0) {
            return next(null, {
                'result': errorCodes.Ls_NoMail
            });
        }

        return next(null, {
            'result': 0
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
            'result': errorCodes.Ls_AccOrPws
        });
    }

    loginSql.CheckAccount(account, function (err, _result) {
        if (err) {
            logger.error('account:' + account + '检测玩家账户出现问题' + err.stack);
            return next(null, {
                'result': errorCodes.SystemWrong
            });
        }

        return next(null, {
            'result': _result
        });
    });
};

handler.Register = function (msg, session, next) {
    var checkID = session.uid;
    var account = '' + msg.account;
    var password = '' + msg.password;
    var registerType = +msg.registerType;

    if (!checkID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidAccount(account) == false) {
        return next(null, {
            'result': errorCodes.Ls_InvalidAccount
        });
    }
    if (globalFunction.IsValidPassword(password) == false) {
        return next(null, {
            'result': errorCodes.Ls_InvalidPassword
        });
    }
    if (registerType < gameConst.eLoginType.LT_CheckID || registerType > gameConst.eLoginType.LT_Max) {
        return next(null, {
            'result': errorCodes.Ls_InvalidLoginType
        });
    }

    loginSql.Register(account, password, checkID, registerType, function (err, result) {
        if (!!err) {
            logger.error('account:' + account + '玩家注册有问题' + err.stack);
            return next(null, {
                'result': errorCodes.toClientCode(err)
            });
        }

        return next(null, {
            'result': result
        });
    });
};

handler.Login = function (msg, session, next) {
    var self = this;
    var accountType = +msg.accountType;
    var checkID = msg.checkID ? '' + msg.checkID : session.uid;
    var account = '' + msg.account;
    var password = '' + msg.password;
    var openID = '' + msg.openID;
    var token = '' + msg.token;
    var refreshToken = '' + msg.refreshToken;
    var banReason = ''; //用于封号提示
    // for tlog
    var TelecomOper = msg.TelecomOper || 'NULL';
    var RegChannel = msg.RegChannel || 'NULL';
    /*var frontendID = '' + session.frontendId;
     var clientHash = '' + msg.clientHash;
     var checkHash = session.get('checkHash');       //客户端完整性校验
     if (clientHash != checkHash) {
     pomelo.app.rpc.connector.conRemote.KickUserBySaveErr(null, frontendID, checkID, utils.done);
     }*/

    var loginType = defaultValue.loginTypeArr;

    if (loginType.length === 0) {
        logger.info("Can LoginType Is Null: %j", loginType);
        return next(null, {
            'result': errorCodes.SystemWrong
        });
    }

    if ((accountType === eLoginType.LT_Account || accountType == eLoginType.LT_CheckID) && (!checkID)) {
        logger.info("Login ParameterNull: %j", msg);
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (accountType < gameConst.eLoginType.LT_CheckID || accountType > gameConst.eLoginType.LT_Max) {
        return next(null, {
            'result': errorCodes.Ls_InvalidLoginType
        });
    }
    if (accountType === eLoginType.LT_Account && globalFunction.IsValidAccount(account) == false) {
        return next(null, {
            'result': errorCodes.Ls_AccOrPws
        });
    }
    if (accountType === eLoginType.LT_Account && globalFunction.IsValidPassword(password) == false) {
        return next(null, {
            'result': errorCodes.toClientCode(errorCodes.Ls_AccOrPws)
        });
    }

    if (-1 === loginType.indexOf(accountType)) {
        return next(null, {
            'result': errorCodes.toClientCode(errorCodes.LoginTypeWrong)
        });
    }

    Q.resolve()
        .then(function () {
                  var deferred;
                  if (accountType === eLoginType.LT_QQ) {
                      deferred = Q.defer();
                      msdkOauth.verify_login(openID, token)
                          .then(function (data) {
                                    if (data.ret != 0) {
                                        logger.error('verify_login failed:openID:%s, token:%s, ret %d, err: %s', openID,
                                                     token, data.ret, err);
                                        return deferred.reject(errorCodes.Ls_loginFailedQQ);
                                    }
                                    return deferred.resolve();
                                })
                          .catch(function (error) {
                                     return deferred.reject(errorCodes.Ls_loginFailedQQ);
                                 })
                          .done();
                      return deferred.promise;
                  }

                  if (accountType === eLoginType.LT_WX) {
                      deferred = Q.defer();
                      wxOauth.check_token(openID, token)
                          .then(function (data) {
                                    if (data.ret != 0) {
                                        logger.error('check_token failed:openID:%s, token:%s, ret %d, err: %s', openID,
                                                     token, data.ret, err);
                                        return deferred.reject(errorCodes.Ls_loginFailedWX);
                                    }
                                    return deferred.resolve();
                                })
                          .catch(function (error) {
                                     return deferred.reject(errorCodes.Ls_loginFailedWX);
                                 })
                          .done();
                      return deferred.promise;
                  }

                  if (accountType === eLoginType.LT_TENCENT_GUEST) {
                      deferred = Q.defer();
                      msdkOauth.guest_check_token(openID, token)
                          .then(function (data) {
                                    if (data.ret != 0) {
                                        logger.error('check_token failed:openID:%s, token:%s, ret %d, err: %s', openID,
                                                     token, data.ret, err);
                                        return deferred.reject(errorCodes.Ls_loginFailedTencentGuest);
                                    }
                                    return deferred.resolve();
                                })
                          .catch(function (error) {
                                     return deferred.reject(errorCodes.Ls_loginFailedTencentGuest);
                                 })
                          .done();
                      return deferred.promise;
                  }

                  // login by iTools
                  if (accountType === eLoginType.LT_iTools) {
                      deferred = Q.defer();
                      var params = {
                          sessionid: token
                      };
                      iTools.verify(params)
                          .then(function (data) {
                                    if (!data || data.status !== 'success') {
                                        logger.error('verify_login failed, openID: %s, token: %s, ret: %j, err: %s',
                                                     openID, token, data, err);
                                        return deferred.reject(errorCodes.Ls_loginFailediTools);
                                    }
                                    return deferred.resolve();
                                })
                          .catch(function (error) {
                                     return deferred.reject(errorCodes.Ls_loginFailediTools);
                                 })
                          .done();
                      return deferred.promise;
                  }

                  // login by LT_CMGE_NATIVE
                  if (accountType === eLoginType.LT_CMGE_NATIVE) {
                      var ret = cmgeApi.verify(msg.params);
                      if (!!ret) {
                          openID = msg.params.userId;
                          return Q.resolve();
                      }
                      else {
                          return Q.reject(ret);
                      }
                  }

                  return Q.resolve();
              })
        .then(function () {
                  var loginKey = guid.GetUuid();
                  return Q.nfcall(loginSql.PrepareForLogin, accountType, checkID, openID, token, account, password,
                                  loginKey);
              })
        .then(function (data) {
                  var result;
                  if (_.isArray(data)) {
                      result = data[0];
                      var accountID = data[1];
                      var loginKey = data[2];
                      var isRegister = data[3];
                  }
                  else {
                      result = data.result;
                      banReason = data.message;
                  }

                  /////////////////////////////////////////////////////////
                  if (0 != isRegister) {
                      tlogger.log('PlayerRegister', accountType, openID, 'NULL', 'NULL', 'NULL', TelecomOper, 'NULL', 0,
                                  0,
                                  0, RegChannel, 'NULL',
                                  0, 'NULL', 'NULL', 'NULL');
                  }
                  /////////////////////////////////////////////////////////
                  if (result != 0) {
                      logger.error('Account PrepareForLogin failed: %s, %s', accountID, result);
                      return Q.reject(result);
                  }

                  var jobs = [
                      Q.nfcall(loginSql.listGetAllRoles, accountID),
                      Q.nfcall(loginSql.listGetLastLoginServer, accountID),
                      data
                  ];

                  return Q.all(jobs);
              })
        .spread(function (listRoles, listLast, loginData) {
                    var accountID = loginData[1];

                    queryUtils.Push('login',
                                    util.format('%s, %s, %s, %s, %s, %s', Date.now(), accountID, accountType, openID,
                                                checkID,
                                                session.get('remoteAddress') ? session.get('remoteAddress').ip : ''));

                    logger.warn('login %s, %s, %s, %s, %s, %s', Date.now(), accountID, accountType, openID,
                                checkID, session.get('remoteAddress') ? session.get('remoteAddress').ip : '');

                    return next(null, {
                        'result': 0,
                        'key': loginData[2],
                        accountID: accountID,
                        serverList: serverManager.GenerateServerList(listRoles, listLast),
                        apkList: templateManager.GetAllTemplate('ApkList')
                    });
                })
        .catch(function (error) {
                   if (error == errorCodes.Ls_loginFailedWX) {
                       logger.warn('Login error: msg: %j, %s', msg, utils.getErrorMessage(error));
                   }
                   else {
                       logger.error('Login error: msg: %j, %s', msg, utils.getErrorMessage(error));
                   }

                   if (error == errorCodes.CanNotLogin) {
                       return next(null, {'result': error, 'message': banReason});
                   }
                   return next(null, {'result': _.isNumber(error) ? error : errorCodes.SystemWrong});
               })
        .finally(function () {

                     if (!!defaultValue.disconnectPostLoginSeconds && defaultValue.disconnectPostLoginSeconds > 0) {
                         setTimeout(function () {
                             var backendSessionService = self.app.get('backendSessionService');
                             backendSessionService.kickBySid(session.frontendId, session.id);
                         }, 1000 * defaultValue.disconnectPostLoginSeconds);
                     }
                 })
        .done();
};

handler.ChangePassword = function (msg, session, next) {
    var _AccountID = session.get('accountID');
    var account = msg.account;
    var oldPassword = msg.oldPassword;
    var newPassword = msg.newPassword;

    if (_AccountID == null || null == account || null == oldPassword || null == newPassword) { //玩家未登陆，不能修改密码
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidPassword(oldPassword) == false) {
        return next(null, {
            'result': errorCodes.Ls_AccOrPws
        });
    }
    if (globalFunction.IsValidPassword(newPassword) == false) {
        return next(null, {
            'result': errorCodes.Ls_AccOrPws
        });
    }
    loginSql.ChangePassword(_AccountID, oldPassword, newPassword, function (err, _result) {
        if (!!err) {
            logger.error('accountID:' + _AccountID + '玩家修改密码有问题' + err.stack);
        }

        return next(null, {
            result: _result
        });
    });
};

handler.GetApkListInfo = function (msg, session, next) {
    return next(null, {
        result: 0,
        apkList: templateManager.GetAllTemplate('ApkList')
    });
};

handler.GetDeviceInfo = function (msg, session, next) {     //获取设备信息
    var checkID = msg.checkID || '';
    var ipAddress = session.get('remoteAddress').ip;
    var deviceModel = msg.deviceModel || '';
    var deviceName = msg.deviceName || '';
    var deviceType = msg.deviceType || 0;
    var deviceUniqueIdentifier = msg.deviceUniqueIdentifier || '';
    var graphicsDeviceID = msg.graphicsDeviceID || 0;
    var graphicsDeviceName = msg.graphicsDeviceName || '';
    var graphicsDeviceVendor = msg.graphicsDeviceVendor || '';
    var graphicsDeviceVendorID = msg.graphicsDeviceVendorID || 0;
    var graphicsDeviceVersion = msg.graphicsDeviceVersion || '';
    var graphicsMemorySize = msg.graphicsMemorySize || 0;
    var graphicsPixelFillrate = msg.graphicsPixelFillrate || 0;
    var graphicsShaderLevel = msg.graphicsShaderLevel || 0;
    var npotSupport = msg.npotSupport || 0;
    var operatingSystem = msg.operatingSystem || '';
    var processorCount = msg.processorCount || 0;
    var processorType = msg.processorType || 0;
    var supportedRenderTargetCount = msg.supportedRenderTargetCount || 0;
    var supports3DTextures = +msg.supports3DTextures || 0;
    var supportsAccelerometer = +msg.supportsAccelerometer || 0;
    var supportsComputeShaders = +msg.supportsComputeShaders || 0;
    var supportsGyroscope = +msg.supportsGyroscope || 0;
    var supportsImageEffects = +msg.supportsImageEffects || 0;
    var supportsInstancing = +msg.supportsInstancing || 0;
    var supportsLocationService = +msg.supportsLocationService || 0;
    var supportsRenderTextures = +msg.supportsRenderTextures || 0;
    var supportsRenderToCubemap = +msg.supportsRenderToCubemap || 0;
    var supportsShadows = +msg.supportsShadows || 0;
    var supportsStencil = msg.supportsStencil || 0;
    var supportsVibration = +msg.supportsVibration || 0;
    var systemMemorySize = msg.systemMemorySize || 0;

    var args = [checkID, ipAddress, deviceModel, deviceName, deviceType, deviceUniqueIdentifier, graphicsDeviceID,
                graphicsDeviceName, graphicsDeviceVendor, graphicsDeviceVendorID, graphicsDeviceVersion,
                graphicsMemorySize, graphicsPixelFillrate, graphicsShaderLevel, npotSupport, operatingSystem,
                processorCount, processorType, supportedRenderTargetCount, supports3DTextures, supportsAccelerometer,
                supportsComputeShaders, supportsGyroscope, supportsImageEffects, supportsInstancing,
                supportsLocationService, supportsRenderTextures, supportsRenderToCubemap, supportsShadows,
                supportsStencil, supportsVibration, systemMemorySize];
    loginSql.saveDeviceInfo(args, function (err, res) {
        if (!!err || res > 0) {
            logger.error('save device info error');
        }
        return next(null, {result: 0})
    });
};

handler.GetStatisticalInfo = function (msg, session, next) {     //统计信息
    var accountID = msg.accountID;
    var token = msg.token;
    var checkID = msg.checkID;
    if (null == accountID || null == token || null == checkID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    loginSql.saveStatisticalInfo(accountID, token, checkID, function (err, res) {
        if (!!err || res > 0) {
            logger.error('save device info error');
        }
        return next(null, {result: 0})
    });
};
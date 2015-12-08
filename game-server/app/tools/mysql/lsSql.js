/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-23
 * Time: 下午6:08
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../constValue');
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var config = require('../config');
var eLoginType = gameConst.eLoginType;
var errorCodes = require('../errorCodes');
var Q = require('q');
var _ = require('underscore');
var stringValue = require('../stringValue');

var LoginSql = module.exports;

LoginSql.CheckAccount = function (account, callback) {
    var sql = 'CALL sp_checkAccount(?)';
    var args = [account];
    accountClient.query(0, sql, args, function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

LoginSql.GetAccountMail = function (account, callback) {
    var sql = 'CALL sp_getAccountMail(?)';
    var args = [account];
    accountClient.query(0, sql, args, function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        var result = res[0][0]['emailStr'];
        return callback(null, result);
    });
};

LoginSql.Register = function (account, password, checkID, registerType, callback) {     //现在该函数的功能为检测用户名是否重复，用户注册存储过程改为sp_loginByAccount
    var sql = 'CALL sp_registerAccount(?,?,?,?)';
    var args = [account, password, checkID, registerType];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

LoginSql.PrepareForLogin = function (accountType, checkID, openID, token, account, password, loginKey, callback) {
    var accountID = 0;
    Q.resolve()
        .then(function () {
                  var sqlStr = 'CALL sp_getAccountID(?);';
                  var sqlArgs = [checkID];
                  if (accountType === eLoginType.LT_QQ
                      || accountType === eLoginType.LT_WX
                      || accountType === eLoginType.LT_TENCENT_GUEST
                      || accountType === eLoginType.LT_iTools
                      || accountType === eLoginType.LT_CMGE_NATIVE) {
                      sqlArgs = [openID];
                  }
                  else if (accountType === eLoginType.LT_Account) {
                      sqlArgs = [account];
                  }
                  return Q.nfcall(account_globalClient.query, 0, sqlStr, sqlArgs);
              })
        .then(function (res) {
                  accountID = res[0][0]['_accountID'];
                  var sql = 'CALL sp_getAccountCanLoginTime(?)';
                  var args = [accountID];
                  return Q.nfcall(accountClient.query, accountID, sql, args);
              })
        .then(function (res) {
                  var canLoginDate;
                  if (null == res[0][0]) {
                      return Q.resolve();
                  }
                  else {
                      canLoginDate = res[0][0]['canLoginTime'];
                      // 做兼容
                      var reg = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
                      if (reg.test(canLoginDate) && RegExp.$2 <= 12 && RegExp.$3 <= 31 && RegExp.$4 <= 24
                          && RegExp.$5 <= 59 && RegExp.$6 <= 59) {
                          if (canLoginDate == '0000-00-00 00:00:00') {
                              return Q.resolve();
                          } else {
                              canLoginDate = JSON.stringify({'time': canLoginDate, 'reason': stringValue.sBanRoleString.banStr});
                          }
                      }
                  }
                  var nowDateSec = Date.now();
                  canLoginDate = JSON.parse(canLoginDate);
                  var canLoginTime = new Date(canLoginDate['time']);
                  var canLoginSec = canLoginTime.getTime();
                  if (nowDateSec >= canLoginSec || isNaN(canLoginSec)) {
                      return Q.resolve();
                  }
                  else {
                      var month = canLoginTime.getMonth() + 1;
                      var day = canLoginTime.getDate();
                      var year = canLoginTime.getFullYear();
                      var hours = canLoginTime.getHours();
                      var minutes = canLoginTime.getMinutes();

                      var hourStr = hours < 10 ? '0' + hours : '' + hours;
                      var minuteStr = minutes < 10 ? '0' + minutes : '' + minutes;

                      var loginTimeStr = '' + month + '/' + day + '/' + year +
                                         ' ' + stringValue.sBanRoleString.content_1 + ' ' +
                                         hourStr + ':' + minuteStr;

                      return callback(null, {
                          result: errorCodes.CanNotLogin,
                          message: canLoginDate['reason'] + '\n' + stringValue.sBanRoleString.unbanNotice +
                                   ':\n' + loginTimeStr
                      });
                  }
              })
        .then(function () {
                  var sql = '';
                  var args = [];
                  var sign = 1;
                  if (accountType === eLoginType.LT_CheckID) {
                      sql = 'CALL sp_loginByCheckID(?,?,?,?,?)';
                      args = [accountID, accountType, checkID, loginKey, sign];
                  }
                  else if (accountType === eLoginType.LT_Account) {
                      sql = 'CALL sp_loginByAccount(?,?,?,?,?,?)';
                      args = [accountID, account, password, checkID, loginKey, sign];
                  }
                  else if (accountType === eLoginType.LT_QQ
                           || accountType === eLoginType.LT_WX
                           || accountType === eLoginType.LT_TENCENT_GUEST
                           || accountType === eLoginType.LT_iTools
                           || accountType === eLoginType.LT_CMGE_NATIVE) {
                      sql = 'CALL sp_loginByOpenID(?,?,?,?,?,?,?)';
                      args = [accountID, accountType, openID, token, checkID, loginKey, sign];
                  }
                  else {
                      return Q.reject(errorCodes.Ls_InvalidLoginType);
                  }
                  accountClient.query(accountID, sql, args, function (err, res) {
                      if (!!err) {
                          logger.error('LoginSql.PrepareForLogin failed: %s, %j, %s', sql, args, err.stack);
                          return callback(err, errorCodes.SystemWrong);
                      }
                      var result = res[0][0]['_result'];
                      var loginKey = res[0][0]['_loginKey'];
                      var isRegister = res[0][0]['_isRegister'];
                      return callback(null, result, accountID, loginKey, isRegister);
                  });
              }).catch(function (error) {
                           return callback(null, {'result': _.isNumber(error) ? error : errorCodes.SystemWrong});
                       }).done();
};

LoginSql.ChangePassword = function (accountID, oldPassword, newPassword, callback) {
    var sql = 'CALL sp_changePassword(?,?,?,?)';
    var args = [accountID, oldPassword, newPassword];
    accountClient.query(accountID, sql, args, function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

LoginSql.listGetAllRoles = function (accountID, callback) {
    var sql = 'CALL sp_listGetRoleList(?)';
    var args = [accountID];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        return callback(null, res[0]);
    });
};

LoginSql.listGetLastLoginServer = function (accountID, callback) {
    var sql = 'CALL sp_listGetLastLoginServer(?)';
    var args = [accountID];

    accountClient.query(accountID, sql, args, function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        return callback(null, res[0]);
    });
};

LoginSql.saveDeviceInfo = function (dataInfo, callback) {
    var sql = 'CALL sp_deviceAddInfo(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    account_globalClient.query(0, sql, dataInfo, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, 0);
    });
};

LoginSql.saveStatisticalInfo = function (accountID, token, checkID, callback) {
    var sql = 'CALL sp_statisticalAddInfo(?,?,?)';
    var args = [accountID, token, checkID];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, 0);
    });
};
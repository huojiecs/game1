/**
 * Created by xykong on 2014/12/10.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var globalFunction = require('../../tools/globalFunction');
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var queryUtils = require('../../tools/queryUtils');
var defaultValues = require('../../tools/defaultValues');
var util = require('util');
var errorCodes = require('../../tools/errorCodes');
var msdkPayment = require('../../tools/openSdks/tencent/msdkPayment');
var config = require('../../tools/config');
var Q = require('q');
var _ = require('underscore');

var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var ePlayerInfo = gameConst.ePlayerInfo;


var Handler = module.exports;


Handler.getBalance = function (paymentInfo, roleServerUid, callback) {
    var self = this;

    logger.warn('getBalance received msg: %j', paymentInfo);
    if (!roleServerUid) {
        logger.error('getBalance invalid roleServerUid');
    }

    var zoneId = '1';
    if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SHARE) {
        zoneId = '' + paymentInfo.accountType;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
        zoneId = paymentInfo.accountType + '_' + paymentInfo.roleId;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
        zoneId = '' + roleServerUid;
    }

    var params = {
        openid: paymentInfo.openId,
        openkey: paymentInfo.openKey,
        pay_token: paymentInfo.payToken,
        pf: paymentInfo.pf,
        pfkey: paymentInfo.pfKey,
        zoneid: zoneId,
        appip: '127.0.0.1'
    };

    var totalBalance = 0;
    var jobsDone = false;

    var job = null;

    job = msdkPayment.get_balance_m(params, paymentInfo.accountType);

    if (!job) {
        return utils.invokeCallback(callback, null, {
            result: errorCodes.PAY_INVALID,
            balance: 0
        });
    }

    Q(job)
        .then(function (result) {
                  if (result.ret !== 0) {
                      return Q.reject(result);
                  }

                  totalBalance = result.balance;
                  jobsDone = true;

                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK,
                      balance: totalBalance,
                      save_amt: result.save_amt
                  });
              })
        .catch(function (error) {

                   logger.error('getBalance failed roleID: %j, accountType: %j, error: %s', paymentInfo.roleId,
                                paymentInfo.accountType,
                                utils.getErrorMessage(error));

                   return msdkPayment.get_balance_m(params, paymentInfo.accountType);
               })
        .then(function (result) {
                  if (jobsDone == true) {
                      return;
                  }

                  if (result.ret !== 0) {
                      return Q.reject(result);
                  }

                  totalBalance = result.balance;
                  jobsDone = true;

                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK,
                      balance: totalBalance,
                      save_amt: result.save_amt
                  });
              })
        .catch(function (error) {

                   logger.error('getBalance failed paymentInfo: %j, error: %s', paymentInfo,
                                utils.getErrorMessage(error));

                   return utils.invokeCallback(callback, null, {
                       result: errorCodes.PAY_INVALID,
                       balance: 0,
                       save_amt: 0
                   });
               });
};


Handler.payBalance = function (paymentInfo, amt, roleServerUid, callback) {
    var self = this;

    logger.warn('payBalance received paymentInfo: %j', paymentInfo);
    if (!roleServerUid) {
        logger.error('payBalance invalid roleServerUid');
    }

    var zoneId = '1';
    if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SHARE) {
        zoneId = '' + paymentInfo.accountType;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
        zoneId = paymentInfo.accountType + '_' + paymentInfo.roleId;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
        zoneId = '' + roleServerUid;
    }

    var params = {
        openid: paymentInfo.openId,
        openkey: paymentInfo.openKey,
        pay_token: paymentInfo.payToken,
        pf: paymentInfo.pf,
        pfkey: paymentInfo.pfKey,
        zoneid: zoneId,
        amt: amt,
        accounttype: 'common',
        userip: '127.0.0.1'
    };

    msdkPayment.pay_m(params, paymentInfo.accountType)
        .then(function (result) {
                  if (result.ret !== 0) {
                      return Q.reject(result);
                  }

                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK
                  });

              })
        .catch(function (error) {

                   logger.error('payBalance failed paymentInfo: %j, error: %s', paymentInfo,
                                utils.getErrorMessage(error));

                   var result = {
                       result: errorCodes.OpenApiWrong
                   };

                   if (!!error.ret) {
                       result.result = error.ret + 20000000;
                   }
                   return utils.invokeCallback(callback, null, result);
               });
};


Handler.presentBalance = function (paymentInfo, amt, roleServerUid, callback) {
    var self = this;

    logger.warn('presentBalance received paymentInfo: %j', paymentInfo);
    if (!roleServerUid) {
        logger.error('presentBalance invalid roleServerUid');
    }

    var zoneId = '1';
    if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SHARE) {
        zoneId = '' + paymentInfo.accountType;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
        zoneId = paymentInfo.accountType + '_' + paymentInfo.roleId;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
        zoneId = '' + roleServerUid;
    }

    var params = {
        openid: paymentInfo.openId,
        openkey: paymentInfo.openKey,
        pay_token: paymentInfo.payToken,
        pf: paymentInfo.pf,
        pfkey: paymentInfo.pfKey,
        zoneid: zoneId,
        presenttimes: amt,
        userip: '127.0.0.1'
    };

    msdkPayment.present_m(params, paymentInfo.accountType)
        .then(function (result) {
                  if (result.ret !== 0) {
                      return Q.reject(result);
                  }

                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK
                  });

              })
        .catch(function (error) {

                   logger.error('presentBalance failed paymentInfo: %j, error: %s', paymentInfo,
                                utils.getErrorMessage(error));

                   var result = {
                       result: errorCodes.OpenApiWrong
                   };

                   if (!!error.ret) {
                       result.result = error.ret + 20000000;
                   }
                   return utils.invokeCallback(callback, null, result);
               });
};

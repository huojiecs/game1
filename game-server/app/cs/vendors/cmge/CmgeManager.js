/**
 * Created by xykong on 2015/3/20.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var globalFunction = require('../../../tools/globalFunction');
var gameConst = require('../../../tools/constValue');
var playerManager = require('../../player/playerManager');
var utils = require('../../../tools/utils');
var queryUtils = require('../../../tools/queryUtils');
var defaultValues = require('../../../tools/defaultValues');
var util = require('util');
var errorCodes = require('../../../tools/errorCodes');
var cmgePayment = require('../../../tools/openSdks/cmge/cmgePayment');
var config = require('../../../tools/config');
var Q = require('q');
var _ = require('underscore');

var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var ePlayerInfo = gameConst.ePlayerInfo;


module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
};

var handler = Handler.prototype;

handler.payRealMoney = function (player, payValue, payResult) {
    var self = this;

    var totalBalance = +payResult.balance;

    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var openID = player.GetOpenID();
    var accountType = player.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);

//    if (totalBalance == 0) {
//        return errorCodes.PAY_NO_BALANCE;
//    }

    var vipPoint = player.GetPlayerInfo(gameConst.ePlayerInfo.VipPoint);

    var realVipPoint = +payResult.save_amt;
    if (!!payResult['tss_list'] && !!payResult['tss_list'][0] && !!payResult['tss_list'][0]['inner_productid']
        && defaultValues.RECH_MONTH_CARD_OK == payResult['tss_list'][0]['inner_productid']) {

        realVipPoint += 300;
    }

    if (vipPoint >= realVipPoint) {
        return errorCodes.PAY_NO_BALANCE;
    }

    queryUtils.Push('pay', util.format('%s, %s, %s, %s, %s', Date.now(), roleID, openID, totalBalance, payValue));

    logger.warn('checkBalance add assets roleID: %j, accountType: %j, payValue: %j, openID: %j', roleID, accountType,
                payValue, openID);

// deal with the situation:
// 1. recharge.
// 2. offline without send checkBalance. SYSTEM: can't add vip point.
// 3. login in.  SYSTEM: usr asset of 1002 is midashi balance. but vip point is not added. so here will add more 1002 to usr.
//
    if (defaultValues.paymentModifyAssets == gameConst.ePaymentModifyAssets.PMA_ADD_PAY_VALUE) {
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), payValue,
                                                   eAssetsAdd.Recharge);
    }
    else {
        var oldValue = player.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp());
        var offsetValue = totalBalance - oldValue;
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), offsetValue,
                                                   eAssetsAdd.Recharge);
        logger.warn('checkBalance modify assets roleID: %j, accountType: %j, payValue: %j, totalBalance: %j, oldValue: %j, offsetValue: %j',
                    roleID, accountType, payValue, totalBalance, oldValue, offsetValue);
    }

    player.notifyCheckBalance(payValue);

    if (vipPoint <= 0) {
        player.giftManager.SetFirstRechargeGift(player);
    }

    player.AddVipPoint(realVipPoint - vipPoint);

    // for tlog
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    tlogger.log('RechargeFlow', accountType, openID, expLevel, vipLevel, payValue);

    return errorCodes.OK;
};

handler.isOwnerValid = function () {
    var self = this;

    if (!self.owner) {
        return false;
    }

    var roleID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);

    var player = playerManager.GetPlayer(roleID);

    return !!player;
};

handler.verifyPayment = function (msg, callback) {
    var self = this;

    if (!self.isOwnerValid()) {
        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
    }

    //var accountType = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);
    //var roleID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);

    //if (accountType != gameConst.eLoginType.LT_CMGE_NATIVE) {
    //    return utils.invokeCallback(callback, null, {result: errorCodes.ParameterWrong});
    //}

    if (defaultValues.paymentType == gameConst.ePaymentType.PT_LOCAL) {
        self.checkBalanceWithPay(msg, callback);
    }
    else if (defaultValues.paymentType == gameConst.ePaymentType.PT_TENCENT) {
        self.checkBalanceWithoutPay(msg, callback);
    }
    else {
        return utils.invokeCallback(callback, null, {result: errorCodes.ParameterWrong});
    }
};


handler.checkBalanceWithPay = function (msg, callback) {
    var self = this;

    if (!self.isOwnerValid()) {
        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
    }

    var roleID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var accountType = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);
    var paymentInfo = self.owner.GetPaymentInfo();
    var roleServerUid = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.serverUid);
    if (!roleServerUid) {
        logger.error('checkBalanceWithPay invalid roleServerUid');
    }

    logger.warn('checkBalance cmge received roleID: %j, accountType: %j, msg: %j, csPlayer: %j', roleID, accountType,
                msg, !!self.owner);

    var zoneId = '1';
    if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SHARE) {
        zoneId = '' + accountType;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
        zoneId = accountType + '_' + roleID;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
        zoneId = '' + roleServerUid;
    }

    var pfInfo = self.owner.GetPfInfo();

    //var params = {
    //    serverId: msg.serverId,
    //    roleId: msg.roleId,
    //    sign: msg.sign
    //};
    var params = {
        serverId: '' + roleServerUid,
        roleId: '' + roleID,
        sign: msg.sign || "undefined sign"
    };

    var totalBalance = 0;
    var saveAmt = 0;
    var payBalance = {};
    var vipPoint = 0;

    var job = null;

    job = cmgePayment.query_balance(params);

    if (!job) {
        return utils.invokeCallback(callback, null, {
            result: errorCodes.PAY_INVALID
        });
    }

    Q(job)
        .then(function (result) {
                  if (result.Result !== 0) {
                      return Q.reject(result);
                  }

                  totalBalance = +result.balance;
                  saveAmt = +result.amount;
                  payBalance = result;

//                  if (!!callback) {
//                      totalBalance = 0;
//                  }

                  var player = playerManager.GetPlayer(roleID);

                  if (!player || !!player.isLeaveing) {
                      result.Result = errorCodes.NoRole;
                      return Q.reject(result);
                  }

                  vipPoint = player.GetPlayerInfo(gameConst.ePlayerInfo.VipPoint);

                  vipPoint = vipPoint || 0;

                  if (vipPoint <= 0 && saveAmt > 0) {
                      player.giftManager.SetFirstRechargeGift(player);
                  }

                  var realValue = 0;
                  if (!!defaultValues.paymentFixVipPoint) {
                      realValue = saveAmt - vipPoint || 0;
                      player.AddVipPoint(realValue);

                      // for tlog
                      if(realValue != 0) {
                          var openID = player.GetOpenID();
                          var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
                          var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);

                          tlogger.log('RechargeFlow', accountType, openID, expLevel, vipLevel, realValue);
                      }
                      /////////////////////////////////////////////////////////////////////////////////////////////////
                  }

                  if (totalBalance == 0) {
                      result.Result = errorCodes.PAY_NO_BALANCE;
                      return Q.reject(result);
                  }

                  /////////////////////////////////////////////////////////////////////////////////////////////////

                  var payValue = totalBalance;

                  //queryUtils.Push('pay', util.format('%s, %s, %s, %s, %s', Date.now(), roleID, msg.openId, totalBalance,
                  //                                   payValue));

                  logger.warn('checkBalance add assets roleID: %j, accountType: %j, payValue: %j, openID: %j', roleID,
                              accountType, payValue, msg.openId);

                  //var reasonForTlog = 2;
                  //player.GetAssetsManager().SetAssetsValue(globalFunction.GetYuanBaoTemp(), payValue, null, reasonForTlog);
                  player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), payValue,
                                                             eAssetsAdd.Recharge);

                  player.GetMissionManager().IsMissionOver(gameConst.eMisType.Recharge, 0, 1);  // 充值日常任务

                  if (payValue > 0) {
                      /**验证是否可以开通月卡*/
                      player.GetRechargeManager().startMonthCard(payValue);
                      player.notifyCheckBalance(payValue);
                  }

                  if (!defaultValues.paymentFixVipPoint) {
                      player.AddVipPoint(payValue);
                  }

                  var payParams = {
                      serverId: '' + roleServerUid,
                      roleId: '' + roleID,
                      sign: '' + msg.sign || "undefined sign",
                      amount: totalBalance
                  };
                  //var payParams = {
                  //    serverId: msg.serverId,
                  //    roleId: msg.roleId,
                  //    sign: msg.sign,
                  //    amount: totalBalance
                  //};

                  return cmgePayment.pay_balance(payParams)
              })
        .then(function (payResult) {
                  if (payResult.Result !== 0) {
                      return Q.reject(payResult);
                  }

                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK
                  });
              })
        .catch(function (error) {
                   if (error.Result != errorCodes.PAY_NO_BALANCE) {
                       if (!!error.Result) {
                           logger.warn('checkBalanceWithPay checkBalance failed roleID: %j, accountType: %j, paymentInfo: %j, error: %s',
                                       roleID, accountType, paymentInfo, utils.getErrorMessage(error));
                       }
                       else {
                           logger.error('checkBalanceWithPay checkBalance failed roleID: %j, accountType: %j, paymentInfo: %j, error: %s',
                                        roleID, accountType, paymentInfo, utils.getErrorMessage(error));
                       }
                   }

                   var result = {
                       result: errorCodes.OpenApiWrong
                   };
                   if (!!error.Result) {
                       result.result = error.Result + 20000000;
                   }
                   return utils.invokeCallback(callback, null, result);
               })
        .finally(function () {

                     if (!!callback) {
                         var tryDelayPayment = function () {
                             self.verifyPayment(msg);
                         };

                         setTimeout(tryDelayPayment, 3000);
                         setTimeout(tryDelayPayment, 10000);
                         setTimeout(tryDelayPayment, 30000);
                         setTimeout(tryDelayPayment, 60000);
                     }

                 });
};

/**
 *验证月卡信息
 */
handler.checkSubscribeProduct = function (player, callback) {
    var self = this;
    var platId = config.vendors.tencent.platId;
    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    if (!player || null == roleID) {
        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
    }
    if (gameConst.ePlatform.ANDROID != platId) {
        return utils.invokeCallback(callback, null, {result: errorCodes.RECH_SERVER_TYPE_NOT_MATCH});
    }

    var accountType = player.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);
    var paymentInfo = player.GetPaymentInfo();
    var roleServerUid = player.GetPlayerInfo(gameConst.ePlayerInfo.serverUid);
    if (!roleServerUid) {
        logger.error('checkSubscribeProduct invalid roleServerUid');
    }

    if (accountType != gameConst.eLoginType.LT_QQ
        && accountType != gameConst.eLoginType.LT_WX
        && accountType != gameConst.eLoginType.LT_TENCENT_GUEST) {

        return utils.invokeCallback(callback, null, {result: errorCodes.ParameterWrong});
    }

    logger.warn('payBalance received paymentInfo: %j', paymentInfo);

    var zoneId = '1';
    if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SHARE) {
        zoneId = '' + accountType;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
        zoneId = accountType + '_' + roleID;
    }
    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
        zoneId = '' + roleServerUid;
    }

    var pfInfo = player.GetPfInfo();

    var params = {
        openid: paymentInfo.openId,
        openkey: paymentInfo.openKey,
        pay_token: paymentInfo.payToken,
        pf: paymentInfo.pf + pfInfo.pfExtend,
        pfkey: paymentInfo.pfKey,
        zoneid: zoneId,
        appip: '127.0.0.1'
    };
//    var testInfo = true;
//    if (testInfo) {
//        params = {
//            openid: '98E93117501B1FAA399E63BE22CDE34A',
//            openkey: '74366FD5D155D72D64B1F32E6ED8D414',
//            pay_token: '8E2C4C65338030C869C5C09DC58F7076',
//            pf: "desktop_m_qq-2002-android-73213123-qq-1000001036-98E93117501B1FAA399E63BE22CDE34A",
//            pfkey: "5f7f783c5a0c5701c0b084f6b0f99b78",
//            zoneid: '1',
//            appip: '127.0.0.1'
//        }
//    }
//    var totalBalance = 0;
    var job = null;
    job = msdkPayment.get_balance_m(params, accountType);
    if (!job) {
        return utils.invokeCallback(callback, null, {
            result: errorCodes.PAY_INVALID
        });
    }
    Q(job)
        .then(function (result) {
                  if (result.Result !== 0) {
                      result.Result = errorCodes.RECH_CHECK_FAILED_MONTH_CARD;
                      return Q.reject(result);
                  }

                  if (!result['tss_list'] || defaultValues.RECH_MONTH_CARD_OK
                                             != result['tss_list'][0]['inner_productid']) {
                      result.Result = errorCodes.RECH_NOT_MONTH_CARD;
                      return Q.reject(result);
                  }

                  return Q.resolve();
              })
        .then(function () {
                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK
                  });
              })
        .catch(function (error) {

                   if (error.Result != errorCodes.PAY_NO_BALANCE) {
                       if (!!error.Result) {
                           logger.warn('checkSubscribeProduct checkBalance failed roleID: %j, accountType: %j, paymentInfo: %j, error: %s',
                                       roleID, accountType, paymentInfo, utils.getErrorMessage(error));
                       }
                       else {
                           logger.error('checkSubscribeProduct checkBalance failed roleID: %j, accountType: %j, paymentInfo: %j, error: %s',
                                        roleID, accountType, paymentInfo, utils.getErrorMessage(error));
                       }
                   }

                   var result = {
                       result: errorCodes.OpenApiWrong
                   };
                   if (!!error.Result) {
                       result.result = error.Result;
                   }
                   return utils.invokeCallback(callback, null, result);
               });
};
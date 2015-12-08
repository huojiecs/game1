/**
 * Created by Administrator on 14-6-16.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var globalFunction = require('../../tools/globalFunction');
var gameConst = require('../../tools/constValue');
var playerManager = require('../player/playerManager');
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


module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
};

var handler = Handler.prototype;

handler.payRealMoney = function (payValue, payResult) {
    var self = this;
    var player = self.owner;
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
    var recharged = 0;
    if (defaultValues.paymentModifyAssets == gameConst.ePaymentModifyAssets.PMA_ADD_PAY_VALUE) {
        recharged = payValue;
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), payValue,
                                                   eAssetsAdd.Recharge);
    }
    else {
        var oldValue = player.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp());
        var offsetValue = totalBalance - oldValue;
        recharged = offsetValue;
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), offsetValue,
                                                   eAssetsAdd.Recharge);
        logger.warn('checkBalance modify assets roleID: %j, accountType: %j, payValue: %j, totalBalance: %j, oldValue: %j, offsetValue: %j',
                    roleID, accountType, payValue, totalBalance, oldValue, offsetValue);
    }
    player.notifyCheckBalance(payValue);

    // 充值后，处理两次活动条件
    if(recharged > 0){
        player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_AllPay, recharged, 0);
        player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_OncePay, recharged, 1);

        //新累计充值活动
        //player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PayDay, recharged, 0);
        player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayOneMoney, recharged, 0);
        player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayMoreMoney, recharged, 0);
    }

    if (vipPoint <= 0) {
        player.giftManager.SetFirstRechargeGift();
    }

    player.AddVipPoint(realVipPoint - vipPoint);

    // for tlog
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    tlogger.log('RechargeFlow', accountType, openID, expLevel, vipLevel, payValue);

    return errorCodes.OK;
};


handler.checkBalance = function (roleID, msg, callback) {
    var self = this;

    var player = playerManager.GetPlayer(roleID);

    if (!player) {
        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
    }

    var accountType = player.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);

    if (accountType != gameConst.eLoginType.LT_QQ
        && accountType != gameConst.eLoginType.LT_WX
        && accountType != gameConst.eLoginType.LT_TENCENT_GUEST) {

        return utils.invokeCallback(callback, null, {result: errorCodes.ParameterWrong});
    }

    if (defaultValues.paymentType == gameConst.ePaymentType.PT_LOCAL) {
        self.checkBalanceWithPay(roleID, msg, callback);
    }
    else if (defaultValues.paymentType == gameConst.ePaymentType.PT_TENCENT) {
        self.checkBalanceWithoutPay(roleID, msg, callback);
    }
    else {
        return utils.invokeCallback(callback, null, {result: errorCodes.ParameterWrong});
    }

};


///Handler.balance = function (openID, token, payToken, pf, pfkey, zoneid, callback) {
handler.checkBalanceWithPay = function (roleID, msg, callback) {
    var self = this;
    var player = playerManager.GetPlayer(roleID);

    if (!player) {
        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
    }

//    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var accountType = player.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);
    var paymentInfo = player.GetPaymentInfo();
    var roleServerUid = player.GetPlayerInfo(gameConst.ePlayerInfo.serverUid);
    if (!roleServerUid) {
        logger.error('checkBalanceWithPay invalid roleServerUid');
    }

    logger.warn('checkBalance received roleID: %j, accountType: %j, msg: %j, csPlayer: %j', roleID, accountType, msg,
                !!player);

//    var csID = pomelo.app.getServerId();    //当前csID
//    pomelo.app.rpc.ps.psRemote.GetPlayerCsID(null, roleID, function (err, res) {
//        if (!!err) {
//            logger.error('checkBalance csID: %j, GetPlayerCsID error, roleID: %j', csID, roleID);
//        }
//        else {
//            logger.warn('checkBalance received roleID: %j, accountType: %j, msg: %j, csPlayer: %j, csID: %j, res: %j',
//                        roleID, accountType, msg, !!csPlayer, csID, res);
//        }
//    });

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
        openid: msg.openId,
        openkey: msg.openKey,
        pay_token: msg.payToken,
        pf: msg.pf + pfInfo.pfExtend,
        pfkey: msg.pfKey,
        zoneid: zoneId,
        appip: '127.0.0.1'
    };

    var totalBalance = 0;
    var saveAmt = 0;
    var payBalance = {};
    var vipPoint = 0;

    var job = null;

    job = msdkPayment.get_balance_m(params, accountType);

    if (!job) {
        return utils.invokeCallback(callback, null, {
            result: errorCodes.PAY_INVALID
        });
    }

    Q(job)
        .then(function (result) {
                  if (result.ret !== 0) {
                      return Q.reject(result);
                  }

                  totalBalance = +result.balance;
                  saveAmt = +result.save_amt;
                  payBalance = result;

//                  if (!!callback) {
//                      totalBalance = 0;
//                  }


                  player = playerManager.GetPlayer(roleID);

                  if (!player || !!player.isLeaveing) {
                      result.ret = errorCodes.NoRole;
                      return Q.reject(result);
                  }

                  ////////////////////////////////
                  // idip调整的vip点数偏移量
                  var point = 0;
                  if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
                      point = player.GetAssetsManager().GetAssetsValue(globalFunction.GetExtraVipPoint());
                  } else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
                      point = player.GetVipInfoManager().GetExtraVipPoint();
                  }
                  logger.warn('checkBalanceWithPay saveAmt: %d, addPoint: %d, total: %d, roleID: %d, openID: %j',
                              saveAmt, point, saveAmt + point, roleID, msg.openId);
                  saveAmt = saveAmt + point < 0 ? 0 : saveAmt + point;
                  ////////////////////////////////

                  vipPoint = player.GetPlayerInfo(gameConst.ePlayerInfo.VipPoint);

                  if (vipPoint <= 0 && saveAmt > 0) {
                      player.giftManager.SetFirstRechargeGift();
                  }

                  if (!!defaultValues.paymentFixVipPoint) {

                      var realVipPoint = saveAmt;
                      if (!!payBalance['tss_list'] && !!payBalance['tss_list'][0]
                          && !!payBalance['tss_list'][0]['inner_productid']
                          && defaultValues.RECH_MONTH_CARD_OK == payBalance['tss_list'][0]['inner_productid']) {

                          realVipPoint += 300;
                      }
                      var vipValue = realVipPoint - vipPoint;

                      player.AddVipPoint(vipValue);
                  }

                  if (totalBalance == 0) {
                      result.ret = errorCodes.PAY_NO_BALANCE;
                      return Q.reject(result);
                  }

                  /////////////////////////////////////////////////////////////////////////////////////////////////

                  var payValue = totalBalance;

                  queryUtils.Push('pay', util.format('%s, %s, %s, %s, %s', Date.now(), roleID, msg.openId, totalBalance,
                                                     payValue));

                  logger.warn('checkBalance add assets roleID: %j, accountType: %j, payValue: %j, openID: %j', roleID,
                              accountType, payValue, msg.openId);

                  //var reasonForTlog = 2;
                  //player.GetAssetsManager().SetAssetsValue(globalFunction.GetYuanBaoTemp(), payValue, null, reasonForTlog);
                  player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), payValue,
                                                             eAssetsAdd.Recharge);

                  player.GetMissionManager().IsMissionOver(gameConst.eMisType.Recharge, 0, 1);//充值日常任务

                  if (payValue > 0) {
                      /**验证是否可以开通月卡*/
                      player.GetRechargeManager().startMonthCard(payValue);
                      player.notifyCheckBalance(payValue);


                      // 充值后，处理两次活动条件
                      if(payValue > 0){
                          player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_AllPay, payValue, 0);
                          player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_OncePay, payValue, 1);

                          //新累计充值活动
                          //player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PayDay, payValue, 0);
                          player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayOneMoney, payValue, 0);
                          player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayMoreMoney, payValue, 0);
                      }
                  }

                  if (!defaultValues.paymentFixVipPoint) {
                      player.AddVipPoint(payValue);
                  }

                  // for tlog
                  var openID = player.GetOpenID();
//                  var accountType = player.GetAccountType();
                  var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
                  var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);

                  tlogger.log('RechargeFlow', accountType, openID, expLevel, vipLevel, payValue);
                  /////////////////////////////////////////////////////////////////////////////////////////////////

                  var payParams = {
                      openid: msg.openId,
                      openkey: msg.openKey,
                      pay_token: msg.payToken,
                      pf: msg.pf + pfInfo.pfExtend,
                      pfkey: msg.pfKey,
                      zoneid: zoneId,
                      userip: '127.0.0.1',
                      amt: totalBalance,
                      accounttype: 'common'
                  };

                  return msdkPayment.pay_m(payParams, accountType)
              })
        .then(function (payResult) {
                  if (payResult.ret !== 0) {
                      return Q.reject(payResult);
                  }

                  ////////////////////
                  return Q.resolve();
              })
        .then(function () {
                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK
                  });
              })
        .catch(function (error) {
                   if (error.ret != errorCodes.PAY_NO_BALANCE) {
                       if (!!error.ret) {
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
                   if (!!error.ret) {
                       result.result = error.ret + 20000000;
                   }
                   return utils.invokeCallback(callback, null, result);
               })
        .finally(function () {

                     if (!!callback) {
                         var tryDelayPayment = function () {
                             self.checkBalance(roleID, msg);
                         };

                         setTimeout(tryDelayPayment, 3000);
                         setTimeout(tryDelayPayment, 10000);
                         setTimeout(tryDelayPayment, 30000);
                         setTimeout(tryDelayPayment, 60000);
                     }

                 });
};

handler.checkBalanceWithoutPay = function (msg, callback) {
    var player = this.owner;
    var self = this;
    if (!player) {
        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
    }

    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var accountType = player.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);
    var paymentInfo = player.GetPaymentInfo();
    var roleServerUid = player.GetPlayerInfo(gameConst.ePlayerInfo.serverUid);
    if (!roleServerUid) {
        logger.error('checkBalanceWithoutPay invalid roleServerUid');
    }

    logger.warn('checkBalance received roleID: %j, accountType: %j, msg: %j', roleID, accountType, msg);

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
        openid: msg.openId,
        openkey: msg.openKey,
        pay_token: msg.payToken,
        pf: msg.pf + pfInfo.pfExtend,
        pfkey: msg.pfKey,
        zoneid: zoneId,
        appip: '127.0.0.1'
    };

    var totalBalance = 0;
    var job = null;

    job = msdkPayment.get_balance_m(params, accountType);

    if (!job) {
        return utils.invokeCallback(callback, null, {
            result: errorCodes.PAY_INVALID
        });
    }

    Q(job)
        .then(function (result) {
                  if (result.ret !== 0) {
                      return Q.reject(result);
                  }

                  totalBalance = +result.balance;

//                  if (!!callback) {
//                      totalBalance = 0;
//                  }


                  if (totalBalance == 0) {
                      result.ret = errorCodes.PAY_NO_BALANCE;
                      return Q.reject(result);
                  }


                  var vipPoint = player.GetPlayerInfo(gameConst.ePlayerInfo.VipPoint);

                  if (vipPoint >= result.save_amt) {
                      result.ret = errorCodes.PAY_NO_BALANCE;
                      return Q.reject(result);
                  }

                  var payValue = result.save_amt - vipPoint;

                  queryUtils.Push('pay', util.format('%s, %s, %s, %s, %s', Date.now(), roleID, msg.openID, totalBalance,
                                                     payValue));

                  logger.warn('checkBalance add assets roleID: %j, accountType: %j, payValue: %j, openID: %j', roleID,
                              accountType, payValue, msg.openId);

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


            // 充值后，处理两次活动条件
                if(payValue > 0){
                    player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_AllPay, payValue, 0);
                    player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_OncePay, payValue, 1);

                    //新累计充值活动
                    //player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayDay, payValue, 0);
                    player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayOneMoney, payValue, 0);
                    player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceType.Advance_PayMoreMoney, payValue, 0);
                }

                  if (vipPoint <= 0) {
                      player.giftManager.SetFirstRechargeGift();
                  }

                  player.AddVipPoint(payValue);

                  // for tlog
                  var openID = player.GetOpenID();
//                  var accountType = player.GetAccountType();
                  var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
                  var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
                  tlogger.log('RechargeFlow', accountType, openID, expLevel, vipLevel, payValue);
                  ////////////////////
                  return Q.resolve();
              })
        .then(function () {
                  return utils.invokeCallback(callback, null, {
                      result: errorCodes.OK
                  });
              })
        .catch(function (error) {

                   if (error.ret != errorCodes.PAY_NO_BALANCE) {
                       if (!!error.ret) {
                           logger.warn('checkBalanceWithoutPay checkBalance failed roleID: %j, accountType: %j, paymentInfo: %j, error: %s',
                                       roleID, accountType, paymentInfo, utils.getErrorMessage(error));
                       }
                       else {
                           logger.error('checkBalanceWithoutPay checkBalance failed roleID: %j, accountType: %j, paymentInfo: %j, error: %s',
                                        roleID, accountType, paymentInfo, utils.getErrorMessage(error));
                       }
                   }

                   var result = {
                       result: errorCodes.OpenApiWrong
                   };
                   if (!!error.ret) {
                       result.result = error.ret + 20000000;
                   }
                   return utils.invokeCallback(callback, null, result);
               })
        .finally(function () {

                     if (!!callback) {
                         var tryDelayPayment = function () {
                             self.checkBalance(roleID, msg);
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
handler.checkSubscribeProduct = function (callback) {
    var self = this;
    var player = self.owner;
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
                  if (result.ret !== 0) {
                      result.ret = errorCodes.RECH_CHECK_FAILED_MONTH_CARD;
                      return Q.reject(result);
                  }

                  if (!result['tss_list'] || defaultValues.RECH_MONTH_CARD_OK
                                             != result['tss_list'][0]['inner_productid']) {
                      result.ret = errorCodes.RECH_NOT_MONTH_CARD;
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

                   if (error.ret != errorCodes.PAY_NO_BALANCE) {
                       if (!!error.ret) {
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
                   if (!!error.ret) {
                       result.result = error.ret;
                   }
                   return utils.invokeCallback(callback, null, result);
               });
};
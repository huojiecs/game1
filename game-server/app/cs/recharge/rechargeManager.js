/**
 * Created by Administrator on 15-1-12.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var _ = require('underscore');
var Q = require('q');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var sCsString = stringValue.sCsString;
var sPublicString = stringValue.sPublicString;
var defaultValues = require('../../tools/defaultValues');
var msdkPayment = require('../../tools/openSdks/tencent/msdkPayment');
var config = require('../../tools/config');


module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.receiveState = {};//月卡领取状态
};
var handler = Handler.prototype;

/**
 * 加载领取月卡状态
 */
handler.LoadDataByDB = function (receiveState) {
    var self = this;
    var player = this.owner;
    if (receiveState.length > 0) {
        var roleID = receiveState[0][0];
        var receiveDate = receiveState[0][1];
        var beginDate = receiveState[0][2];
        var mailDate = receiveState[0][3];
        self.receiveState[roleID] = [receiveDate, beginDate, mailDate];
    } else {
        var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
        var receiveDate = utilSql.DateToString(new Date(0));
        var beginDate = utilSql.DateToString(new Date(0));
        var mailDate = utilSql.DateToString(new Date(0));
        self.receiveState[roleID] = [receiveDate, beginDate, mailDate];
    }
};

handler.GetDateNYR = function(dateTime){
    return utils.GetDateNYR(dateTime, true);
};

/**
 * 领取月卡
 */
handler.ReceiveMonthCard = function ( callback) {
    var self = this;
    var player = self.owner;
    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var monthCardInfo = self.receiveState[roleID];
    if (null == monthCardInfo) {
        return callback({result: errorCodes.RECH_NOT_MONTH_CARD});
    }
    var beginTime = monthCardInfo[1];
    var initDate = new Date(this.GetDateNYR(new Date(0)));
    var beginDate = new Date(this.GetDateNYR(new Date(beginTime), true));
    if (beginDate - initDate == 0) {
        return callback({result: errorCodes.RECH_NOT_MONTH_CARD});
    }

    if (!!self.receiveState[roleID] && !!self.receiveState[roleID][0]) {
        var today = new Date(this.GetDateNYR(new Date()));
        var receiveDate = new Date(this.GetDateNYR(self.receiveState[roleID][0]));
        if (today - receiveDate <= 0) {
            return callback({result: errorCodes.RECH_RECEIVE_MONTH_CARD});
        }
    }
    var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
    if (null == AllTemplate) {
        return  callback({result: errorCodes.ParameterNull});
    }
    var monthCardday = AllTemplate[defaultValues.RECH_MONTH_CARD_DAY]['attnum'];
    var day = 1000 * 60 * 60 * 24;
    var dayNum = ( new Date(this.GetDateNYR(new Date())) - beginDate ) / day;
    var residueDay = monthCardday - parseInt(dayNum);
    if (residueDay < 0) {
        return callback({result: errorCodes.RECH_OVERDUE_MONTH_CARD});
    }
    var value = AllTemplate[defaultValues.RECH_MONTH_CARD_GIVE_ZHUANSHI]['attnum'];
    var yuanBaoID = globalFunction.GetYuanBaoTemp();
    player.AddItem(yuanBaoID, value, gameConst.eAssetsChangeReason.Add.MonthCard, 0);//添加物品方法
    self.receiveState[roleID][0] = this.GetDateNYR(new Date());
//    if (self.receiveState[roleID][1] != balanceInfo['tss_list'][0]['begintime']) {
//        self.receiveState[roleID][1] = balanceInfo['tss_list'][0]['begintime'];
////            player.AddItem(yuanBaoID, 300, gameConst.eAssetsChangeReason.Add.Recharge, 0); //添加物品方法
//        player.GetQqManager().payRealMoney(player, 300, balanceInfo);
//    }
    return callback({result: errorCodes.OK});
};

/**
 *获取月卡信息
 */
handler.GetRechargeInfoList = function ( callback) {
    var self = this;
    var player = self.owner;
    if (null == player) {
        return callback({result: errorCodes.NoRole});
    }
    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    if (null == roleID) {
        return callback({result: errorCodes.NoRole});
    }
    var res = {
        result: errorCodes.OK,
        paymentInput: errorCodes.paymentInput,
        yueKaInfoList: {}
    };
    var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
    var monthCard = {
        money: 0,
        zuanShi: 0,
        zuanShi_1: 0,
        day: 0,
        residueDay: 0
    };
    if (null == AllTemplate) {
        return callback({result: errorCodes.ParameterNull});
    }
    monthCard.money = AllTemplate[defaultValues.RECH_MONTH_CARD_MONEY]['attnum'];
    monthCard.zuanShi = AllTemplate[defaultValues.RECH_MONTH_CARD_ZHUANSHI]['attnum'];
    monthCard.zuanShi_1 = AllTemplate[defaultValues.RECH_MONTH_CARD_GIVE_ZHUANSHI]['attnum'];
    monthCard.day = AllTemplate[defaultValues.RECH_MONTH_CARD_DAY]['attnum'];
    var monthCardInfo = self.receiveState[roleID];
    if (null == monthCardInfo) {
        return callback({result: errorCodes.ParameterNull});
    }
    var beginTime = monthCardInfo[1];
    var receiveTime = monthCardInfo[0];
    res['yueKaInfoList'] = monthCard;
    var initDate = new Date(this.GetDateNYR(new Date(0)));
    var beginDate = new Date(this.GetDateNYR(new Date(beginTime)));
    if (beginDate - initDate == 0) {
        return callback(null, res);
    }
    var day = 1000 * 60 * 60 * 24;
    var dayNum = ( new Date(this.GetDateNYR(new Date())) - beginDate ) / day;
    var monthCardDate = monthCard.day - parseInt(dayNum);
    if (monthCardDate > 0) {
        var today = new Date(this.GetDateNYR(new Date()));
        var receiveDate = new Date(this.GetDateNYR(receiveTime));
        if (today - receiveDate > 0) {
            monthCard.residueDay = monthCardDate;
        } else {
            monthCard.residueDay = monthCardDate - 1;
        }
    }
    return callback(null, res);

};

/**
 * 获取腾讯月卡数据接口
 * 这个接口目前没有用到
 */
//启用需要考虑合服
//handler.GetBalanceMInfo = function (player, callback) {
//    var self = this;
//    var platId = config.vendors.tencent.platId;
//    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
//    if (!player || null == roleID) {
//        return utils.invokeCallback(callback, null, {result: errorCodes.NoRole});
//    }
//    if (gameConst.ePlatform.ANDROID != platId) {
//        return utils.invokeCallback(callback, null, {result: errorCodes.RECH_SERVER_TYPE_NOT_MATCH});
//    }
//    var accountType = player.GetPlayerInfo(gameConst.ePlayerInfo.AccountType);
//    var paymentInfo = player.GetPaymentInfo();
//    if (accountType != gameConst.eLoginType.LT_QQ
//            && accountType != gameConst.eLoginType.LT_WX
//        && accountType != gameConst.eLoginType.LT_TENCENT_GUEST) {
//
//        return utils.invokeCallback(callback, null, {result: errorCodes.ParameterWrong});
//    }
//
//    logger.warn('payBalance received paymentInfo: %j', paymentInfo);
//    var zoneId = '1';
//    if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SHARE) {
//        zoneId = '' + accountType;
//    }
//    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) {
//        zoneId = accountType + '_' + roleID;
//    }
//    else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) {
//        zoneId = '' + config.list.serverUid;
//    }
//
//    var params = {
//        openid: paymentInfo.openId,
//        openkey: paymentInfo.openKey,
//        pay_token: paymentInfo.payToken,
//        pf: paymentInfo.pf,
//        pfkey: paymentInfo.pfKey,
//        zoneid: zoneId,
//        appip: '127.0.0.1'
//    };
//    var job = null;
//    job = msdkPayment.get_balance_m(params, accountType);
//    if (!job) {
//        return utils.invokeCallback(callback, null, {
//            result: errorCodes.PAY_INVALID
//        });
//    }
//    Q(job)
//        .then(function (result) {
//                  if (result.ret !== 0) {
//                      result.ret = errorCodes.RECH_CHECK_FAILED_MONTH_CARD;
//                      return Q.reject(result);
//                  }
//                  if (!result['tss_list'][0]) {
//                      result.ret = errorCodes.RECH_CHECK_FAILED_MONTH_CARD;
//                      return Q.reject(result);
//                  }
//                  if (defaultValues.RECH_MONTH_CARD_OK
//                      != result['tss_list'][0]['inner_productid']) {
//                      result.ret = errorCodes.RECH_CHECK_FAILED_MONTH_CARD;
//                      return Q.reject(result);
//                  }
//                  return Q.resolve(result);
//              })
//        .then(function (balanceMInfo) {
//                  return utils.invokeCallback(callback, null, {
//                      result: errorCodes.OK,
//                      balanceMInfo: balanceMInfo
//                  });
//              })
//        .catch(function (error) {
//                   if (error.ret != errorCodes.RECH_CHECK_FAILED_MONTH_CARD) {
//                       logger.error('checkBalance failed roleID: %j, accountType: %j, error: %s',
//                                    roleID, accountType,
//                                    utils.getErrorMessage(error));
//                   }
//
//                   var result = {
//                       result: errorCodes.OpenApiWrong
//                   };
//                   if (!!error.ret) {
//                       result.result = error.ret;
//                   }
//                   return utils.invokeCallback(callback, null, result);
//               })
//        .done();
//};

/**保存领取状态 */
handler.GetSqlStr = function (roleID) {  //数据库保存
    var receiveStateArray = [];
    var self = this;
    if (!self.receiveState[roleID]) {
        self.receiveState[roleID] = {};
    }
    if (!self.receiveState[roleID] || !self.receiveState[roleID][0]) {
        self.receiveState[roleID][0] = utilSql.DateToString(new Date(0));
    }
    if (!self.receiveState[roleID] || !self.receiveState[roleID][1]) {
        self.receiveState[roleID][1] = utilSql.DateToString(new Date(0));
    }
    if (!self.receiveState[roleID] || !self.receiveState[roleID][2]) {
        self.receiveState[roleID][2] = utilSql.DateToString(new Date(0));
    }
    for (var key in self.receiveState) {
        receiveStateArray.push(+key);
        receiveStateArray.push(utilSql.DateToString(new Date(self.receiveState[key][0])));
        receiveStateArray.push(utilSql.DateToString(new Date(self.receiveState[key][1])));
        receiveStateArray.push(utilSql.DateToString(new Date(self.receiveState[key][2])));
    }
    var sqlString = null;
    if (receiveStateArray.length > 0) {
        var strInfo = '(';
        for (var t in receiveStateArray) {
            if (t < receiveStateArray.length - 1) {
                if (typeof (receiveStateArray[t]) == 'string') {
                    strInfo += "'" + receiveStateArray[t] + "',";
                } else {
                    strInfo += receiveStateArray[t] + ',';
                }
            } else {
                strInfo += '\'' + receiveStateArray[t] + '\')';
            }
        }
        sqlString = utilSql.BuildSqlValues(new Array(receiveStateArray));
        if (sqlString !== strInfo) {
            logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
        }
    }
    return sqlString;
};

/**
 * 开通月卡接口
 ***/
handler.startMonthCard = function (value) {
    var self = this;
    var player = self.owner;
    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    if (null == roleID) {
        return false;
    }
    var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
    if (null == AllTemplate) {
        return false;
    }
    var tZuanShi = AllTemplate[defaultValues.RECH_MONTH_CARD_ZHUANSHI]['attnum'];
    if (value < tZuanShi) {
        return false;
    }
    var monthCardInfo = self.receiveState[roleID];
    if (null == monthCardInfo) {
        return false;
    }
    var beginTime = monthCardInfo[1];
    var receiveTime = monthCardInfo[0];
    var initDate = new Date(this.GetDateNYR(new Date(0)));
    var beginDate = new Date(this.GetDateNYR(new Date(beginTime)));
    var today = new Date(this.GetDateNYR(new Date()));
    var receiveDate = new Date(this.GetDateNYR(receiveTime));
    if (beginDate - initDate == 0) {
        monthCardInfo[1] = today;
        return true;
    }
    var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
    if (!!AllTemplate) {
        var monthCardday = AllTemplate[defaultValues.RECH_MONTH_CARD_DAY]['attnum'];
        var day = 1000 * 60 * 60 * 24;
        var dayNum = ( new Date(this.GetDateNYR(new Date())) - beginDate ) / day;
        var startTop = false;
        var addDay = 3;
        if (today - receiveDate > 0) {
            if (monthCardday - parseInt(dayNum) <= 3) {
                startTop = true;
            }
        } else {
            if (monthCardday - (parseInt(dayNum) + 1) <= 3) {
                startTop = true;
                addDay = 4;
            }
        }
        if (!!startTop) {
            var now = new Date();
            var time = now.getTime();
            time += 1000 * 60 * 60 * 24 * addDay;//加上3天
            now.setTime(time);
            var newDate = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
            monthCardInfo[1] = utilSql.DateToString(new Date(newDate));
            return true;
        }

    }
    return false;
};
/**
 * 客户端验证月卡状态是否可领取
 */
handler.SendRechargeManager = function () {
    var self = this;
    var player = self.owner;
    var res = {
        result: 1,
        receiveDate: 0
    }; //默认不开启月卡领取
    if (null == player) {
        return res;
    }
    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var receiveState = self.receiveState[roleID];
    if (!!receiveState) {
        var receiveTime = receiveState[0];
        var beginTime = receiveState[1];
        var mailTime = receiveState[2];
        if (new Date(this.GetDateNYR(new Date(0))) - new Date(this.GetDateNYR(beginTime)) != 0) {
            var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
            if (!!AllTemplate) {
                var monthCardday = AllTemplate[defaultValues.RECH_MONTH_CARD_DAY]['attnum'];
                var beginDate = new Date(this.GetDateNYR(new Date(beginTime)));
                var day = 1000 * 60 * 60 * 24;
                var dayNum = ( new Date(this.GetDateNYR(new Date())) - beginDate ) / day;
                var today = new Date(this.GetDateNYR(new Date()));
                var receiveDate = new Date(this.GetDateNYR(receiveTime));
                var initDate = new Date(this.GetDateNYR(new Date(0)));
                var mDate = new Date(this.GetDateNYR(new Date(mailTime)));
                var emailTop = false;
                var dayNumEmail = monthCardday - parseInt(dayNum);
                if (dayNumEmail > 0) {
                    if (today - receiveDate > 0) {
                        if (dayNumEmail <= 3) {
                            emailTop = true;
                        }
                    }
//                    else {
//                        if (monthCardday - (parseInt(dayNum) + 1) <= 3) {
//                            emailTop = true;
//                            --dayNumEmail;
//                        }
//                    }
                    if (!!emailTop) {
                        if (today - mDate > 0) {
                            var mailDetail = {
                                recvID: roleID,
                                subject: sPublicString.mailTitle_1,
                                mailType: gameConst.eMailType.System,
                                content: util.format(sCsString.content_5, dayNumEmail),//'您的充值福利还有' + dayNumEmail + '天将到期，请续费，祝您游戏愉快',
                                items: []
                            };
                            self.receiveState[roleID][2] = this.GetDateNYR(new Date())
                            self.SendRechargeMail(mailDetail, utils.done);
                        }
                    }
                    if (today - receiveDate > 0) {
                        res = {
                            result: 0,
                            receiveDate: monthCardday - parseInt(dayNum)
                        };
                    } else {
                        res = {
                            result: 1,
                            receiveDate: monthCardday - (parseInt(dayNum) + 1)
                        };
                    }
                } else {
//                    if (mDate - beginDate != 0) {
                    var mailDetail = {
                        recvID: roleID,
                        subject: sPublicString.mailTitle_1,
                        mailType: gameConst.eMailType.System,
                        content: sCsString.content_6,//'"您的充值福利已过期，续费可再次获得福利，祝您游戏愉快！"',
                        items: []
                    };
                    self.receiveState[roleID][0] = new Date(0);
                    self.receiveState[roleID][1] = new Date(0);
                    self.receiveState[roleID][2] = new Date(0);
                    self.SendRechargeMail(mailDetail, utils.done);
//                    }
                }

            }

        }
    }
    return res;
};

/**
 * 发送月卡剩余天数邮件
 */
handler.SendRechargeMail = function (mailDetail, callback) {
    if (!mailDetail) {
        return callback({'result': errorCodes.ParameterWrong});
    }
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }
        return callback(null, {'result': errorCodes.OK});
    });
};

/**
 * GM  开通月卡命令
 */
handler.GMOpenMonthCard = function (value) {
    var OpenCartValue = value > 300 ? value : 300;
    this.startMonthCard(OpenCartValue);
};
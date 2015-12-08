/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-20
 * Time: 下午2:06
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var accountClient = require('../../tools/mysql/accountClient');
var tbLogClient = require('../../tools/mysql/tbLogClient');
var templateConst = require('../../../template/templateConst');
var playerManager = require('../player/playerManager');
var paymentManager = require('../qq/paymentManager');
var config = require('../../tools/config');
var defaultValues = require('../../tools/defaultValues');
var eventValue = require('../../tools/eventValue');
var tNotice = templateConst.tNotice;
var eAssetsInfo = gameConst.eAssetsInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var ePlayerEventType = gameConst.ePlayerEventType;
var eAssetsType = gameConst.eAssetsType;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var _ = require('underscore');
var Q = require('q');

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.assetsList = {};
    this.generalCallbackList = []; //财产改变时， 需要调用活动
};

var handler = Handler.prototype;

handler.onRegisterChange = function (callback) {   //注册财产改变cb
    this.generalCallbackList.push(callback);
};

handler.onCancleChange = function (callback) {   //注销财产改变cb
    var self = this;
    this.generalCallbackList = _.without(self.generalCallbackList, callback);
};

/**
 * @return {number}
 */
handler.GetAssetsValue = function (tempID) {
    if (this.assetsList[tempID] == null) {
        return 0;
    }
    return this.assetsList[tempID].value;
};

/**
 * 以后统一用此接口，在此加上了财产变化产生的原因
 * param: factor 变化因素
 */
handler.AlterAssetsValue = function (tempID, value, factor, isNpc) {
    var result = this.SetAssetsValue(tempID, value, isNpc, factor);
    if (result != -1) {
        if (factor == null) {
            if (value >= 0) {
                factor = eAssetsAdd.DefaultAdd;
            } else {
                factor = eAssetsReduce.DefaultReduce;
            }
        }
        var openID = this.owner.GetOpenID();
        var accountType = this.owner.GetAccountType();
        var RoleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
        var lv = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
        if (tempID == globalFunction.GetMoneyTemp() || tempID == globalFunction.GetYuanBaoTemp()) { //货币变化
            var factor1 = eAssetsAdd.DefaultAdd;
            var factor2 = eAssetsReduce.DefaultReduce;
            var factor3 = eAssetsAdd.DefaultAdd;
            var factor4 = eAssetsReduce.DefaultReduce;
            if (tempID == globalFunction.GetMoneyTemp() && value >= 0) {
                var moneyType = 0;
                var addOrReduce = 0;
                factor1 = factor;
            } else if (tempID == globalFunction.GetMoneyTemp() && value < 0) {
                var moneyType = 0;
                var addOrReduce = 1;
                factor2 = factor;
            } else if (tempID == globalFunction.GetYuanBaoTemp() && value >= 0) {
                var moneyType = 1;
                var addOrReduce = 0;
                factor3 = factor;
            } else if (tempID == globalFunction.GetYuanBaoTemp() && value < 0) {
                var moneyType = 1;
                var addOrReduce = 1;
                factor4 = factor;
            }

            var afterValue = this.GetAssetsValue(tempID);
            tlogger.log({15: 0}, 'CurrencyFlow', accountType, openID, lv, moneyType, addOrReduce, afterValue,
                                 Math.abs(value), factor1, factor2, factor3, factor4, RoleID);
        } else {    // 其他资产变化
            if (value >= 0) {
                var addOrReduce = 0;
            } else {
                var addOrReduce = 1;
            }
            if (_.contains([2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
                            1004, 1005, 1006, 1007, 1008, 7001, 7002, 9021], +tempID)) { //灵石，魔魂，魔晶，神果，橙装碎片
                var afterValue = this.GetAssetsValue(tempID);
                tlogger.log('AssetsFlow', accountType, openID, lv, tempID, addOrReduce, afterValue, Math.abs(value),
                            factor);
            }
        }
    }
};

handler.AssetsTlog = function () {

};


// 通过角色添加公会财产，只能添加，不能减少
handler.AddUnionAssets = function (tempID, Value) {
    if (tempID == null || tempID <= 0 || Value == null) {
        return true;
    }

    // 以下特殊财产特殊处理
    if (tempID == globalFunction.GetUnionPoint()) {
        if (Value <= 0) {
            return true;
        }
        if (this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) == null || this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) <= 0) {
            return true;
        }

        //添加类型  此处为1 炼狱添加公会积分 需要判断炼狱次数， 其他传 0  不做判断
        var lianyuType = 1;
        pomelo.app.rpc.us.usRemote.AddUnionScore(null, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID),
                                                 this.owner.serverId, Value, lianyuType, function (err) {

            });

        return true;

    }
    else if (tempID == globalFunction.GetUnionTempleExp()) {
        if (Value <= 0) {
            return true;
        }
        if (this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) == null || this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) <= 0) {
            return true;
        }

        pomelo.app.rpc.us.usRemote.AddTempleExp(null, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), this.owner.serverId,
                                                Value, function (err) {

            });

        return true;
    }
    else if (tempID == globalFunction.GetUnionLadyPop()) {
        if (Value <= 0) {
            return true;
        }
        if (this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) == null || this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) <= 0) {
            return true;
        }

        pomelo.app.rpc.us.usRemote.AddLadyPop(null, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), this.owner.serverId,
                                              Value, function (err) {

            });

        return true;
    }

    return false;
}

/**
 * @return {number}
 *      noNotice: 如果字段不为空， 则不发送公告. (修正摘除10级灵石导致公告问题)
 */
handler.SetAssetsValue = function (tempID, Value, isNpc, reason, noNotice) {  //设置变化值
    logger.debug('SetAssetsValue: %j', arguments);

    // 是公会财产，直接添加给公会后返回
    if (this.AddUnionAssets(tempID, Value)) {
        return 0;
    }

    var self = this;
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var roleServerUid = this.owner.GetPlayerInfo(ePlayerInfo.serverUid);
    var nowDate = new Date().getTime();
    var canGetProfitTime = playerManager.GetForbidProfitTime(roleID);
    if (nowDate < canGetProfitTime && Value > 0 && tempID != globalFunction.GetPhysical() && reason
                                                                                             != eAssetsAdd.Recharge) {
        logger.warn('Can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, tempID: %j, value: %j',
                    roleID, utilSql.DateToString(new Date(nowDate)), utilSql.DateToString(new Date(canGetProfitTime)),
                    tempID, Value);
        return -1;
    }

    var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', tempID);
    if (!AssetsTemplate) {
        logger.error('SetAssetsValue with not defined tempID: %s', tempID);
        return -1;
    }

    if (!_.isNumber(Value)) {
        logger.error('SetAssetsValue set with invalid value: %s', Value);
        return -1;
    }

    if (!this.assetsList.hasOwnProperty(tempID)) {
        this.assetsList[tempID] = {value: 0, maxValue: eAssetsInfo.ASSETS_MAXVALUE};
    }

    var oldValue = this.assetsList[tempID].value;
    var tempValue = this.assetsList[tempID].value;
    tempValue += Value;
    if (tempValue < 0) {
        if (tempID != globalFunction.GetExtraVipPoint()) {
            tempValue = 0;
            logger.error("扣除玩家属性的操作没有判断是否够减判断" + tempID)
        }
    }
    else if (tempValue > this.assetsList[tempID].maxValue && isNpc &&
             this.assetsList[tempID].value > this.assetsList[tempID].maxValue) {
        logger.error('超过了最大值value =%j, maxValue =%j,tempID=%j, ', this.assetsList[tempID].value,
                     this.assetsList[tempID].maxValue, tempID);
        //tempValue = this.assetsList[ tempID ].value;
        return -1;
    }

    if (tempValue > eAssetsInfo.ASSETS_MAXVALUE) {
        tempValue = eAssetsInfo.ASSETS_MAXVALUE;
    }

    //体力值的上限
    if (tempID == globalFunction.GetPhysical() && tempValue > eAssetsInfo.maxPhysical) {
        tempValue = eAssetsInfo.maxPhysical;
    }
    if (Value < 0) {
        if (tempID == globalFunction.GetYuanBaoTemp()) {
            self.notifyOperateConsumeYuanBaoEvent(-Value);
        }
        if(tempID == globalFunction.GetPhysical()) {
            self.notifyOperateConsumePhysicalEvent(-Value);
        }
    }

    _.each(self.generalCallbackList, function (callback) {
        callback(null, self.owner, tempID, Value);
    });

    this.assetsList[tempID].value = tempValue;
    this.SendAssetsMsg(tempID);

    if (tempID === 6011 || tempID === 6012 || tempID === 6013 || tempID === 6014) {
        self.owner.GetNiuDanManager().SendNiuDanList(Value, tempID);
    }

    if (tempID == globalFunction.GetYuanBaoTemp() && Value != 0 && reason != eAssetsAdd.Recharge) {
        // notify midasi
        var accountType = this.owner.GetPlayerInfo(ePlayerInfo.AccountType);
        var paymentInfo = this.owner.GetPaymentInfo();


        if (defaultValues.paymentType == gameConst.ePaymentType.PT_TENCENT
            && !!paymentInfo && (accountType == gameConst.eLoginType.LT_QQ
                                 || accountType == gameConst.eLoginType.LT_WX
                                 || accountType == gameConst.eLoginType.LT_TENCENT_GUEST)) {

            logger.warn('SetAssetsValue paymentInfo: %j, Value: %j', paymentInfo, Value);

            if (Value < 0) {
                paymentManager.payBalance(paymentInfo, -Value, roleServerUid);
            }
            else {
                paymentManager.presentBalance(paymentInfo, Value, roleServerUid);
            }
        }
    }

    //tblog update player assets
    /*var platId = config.vendors.tencent.platId;
     var tblogsqlStr = '';
     var tblogArgs;
     if (platId === 0 && (tempID == globalFunction.GetMoneyTemp() || tempID == globalFunction.GetYuanBaoTemp())) {     //IOS
     if (tempID == globalFunction.GetMoneyTemp()) {  //金币变化
     tblogsqlStr = 'CALL sp_updateRoleMoney(?,?,?)';
     tblogArgs = [this.assetsList[globalFunction.GetMoneyTemp()].value, 0, roleID];
     }
     else {   //钻石变化
     tblogsqlStr = 'CALL sp_updateRoleDiamond(?,?,?)';
     tblogArgs = [this.assetsList[globalFunction.GetYuanBaoTemp()].value, 0, roleID];
     }
     tbLogClient.query(roleID, tblogsqlStr, tblogArgs, utils.done);
     }
     if (platId === 1 && (tempID == globalFunction.GetMoneyTemp() || tempID == globalFunction.GetYuanBaoTemp())) {     //Android
     if (tempID == globalFunction.GetMoneyTemp()) {  //金币变化
     tblogsqlStr = 'CALL sp_updateRoleMoney(?,?,?)';
     tblogArgs = [0, this.assetsList[globalFunction.GetMoneyTemp()].value, roleID];
     }
     else {   //钻石变化
     tblogsqlStr = 'CALL sp_updateRoleDiamond(?,?,?)';
     tblogArgs = [0, this.assetsList[globalFunction.GetYuanBaoTemp()].value, roleID];
     }
     tbLogClient.query(roleID, tblogsqlStr, tblogArgs, utils.done);
     }*/
    /** 时装 */
    if (AssetsTemplate.type == eAssetsType.Fashion) {
        self.owner.emit(ePlayerEventType.CollectFashionSuit, {owner: this.owner});
    }

    /** 号称 */
    if (AssetsTemplate.type == eAssetsType.Title) {
        self.owner.emit(ePlayerEventType.CollectTitle, {owner: this.owner});
    }

    /////////////////////////////////////////////////////////////////////
    var openID = self.owner.GetOpenID();
    var accountType = self.owner.GetAccountType();
    var lv = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var assetsManager = this.owner.GetAssetsManager();
    var afterValue = assetsManager.GetAssetsValue(tempID);

    if (reason) {
        var flowReason = reason;
    } else {
        if (Value < 0) {
            var flowReason = eAssetsReduce.DefaultReduce;
        } else {
            var flowReason = eAssetsAdd.DefaultAdd;
        }
    }

    if (tempID == globalFunction.GetMoneyTemp() && Value != 0) {
        if (Value < 0) {
            tlogger.log({3: 0}, 'MoneyFlow', accountType, openID, lv, afterValue, -Value, flowReason, 0, 1, 0, roleID);
        } else {
            tlogger.log({3: 0}, 'MoneyFlow', accountType, openID, lv, afterValue, Value, flowReason, 0, 0, 0, roleID);
        }
    } else if (tempID == globalFunction.GetYuanBaoTemp() && Value != 0) {
        if (Value < 0) {
            tlogger.log({3: 0}, 'MoneyFlow', accountType, openID, lv, afterValue, -Value, flowReason, 0, 1, 1, roleID);
        } else {
            tlogger.log({3: 0}, 'MoneyFlow', accountType, openID, lv, afterValue, Value, flowReason, 0, 0, 1, roleID);
        }
    } else {
        if (Value < 0) {
            tlogger.log({3: 0}, 'ItemFlow', accountType, openID, 3, tempID, afterValue, -Value, flowReason, 0, 1, lv);
        } else {
            tlogger.log({3: 0}, 'ItemFlow', accountType, openID, 3, tempID, afterValue, Value, flowReason, 0, 0, lv);
        }
    }
    /////////////////////////////////////////////////////////////////////
    //获取财产公告
    if (!noNotice && Value > 0) {
        var noticeManager = this.owner.GetNoticeManager();
        var noticeID = noticeManager.GetAssetNoticeID(tempID);
        noticeManager.SendRepeatableGM(gameConst.eGmType.GetAsset, noticeID)
    }
    return oldValue;
};

handler.SetAssetsMaxValue = function (tempID, maxValue) {
    if (null == this.assetsList[tempID]) {
        this.assetsList[tempID] = {value: 0, maxValue: maxValue};
    }
    else {
        this.assetsList[tempID].maxValue = maxValue;
    }
};

/**
 * @return {boolean}
 */
handler.CanConsumeAssets = function (tempID, value) {

    if (!value) {
        return true;
    }

    if (!this.assetsList || !this.assetsList[tempID]) {
        return false;
    }

    return value <= this.assetsList[tempID].value;
};

/**
 * @return {number}
 */
handler.ModifyAssets = function (tempID, value, minValue, maxValue) {

    var self = this;

    if (value > 0) {
        return self.SetAssetsValue(tempID, value, false);
    }
    else if (value < 0) {
        if (self.CanConsumeAssets(tempID, -value)) {
            return self.SetAssetsValue(tempID, value, false);
        }
    }

    return self.GetAssetsValue(tempID);
};

handler.LoadDataByDB = function (assetsInfo) {
    var self = this;
    for (var index in assetsInfo) {
        if (null == this.assetsList[index]) {
            this.assetsList[index] = {value: assetsInfo[index], maxValue: eAssetsInfo.ASSETS_MAXVALUE};
        }
        else {
            if (assetsInfo[index] > this.assetsList[index].maxValue) {
                assetsInfo[index] = this.assetsList[index].maxValue;
            }
            this.assetsList[index].value = assetsInfo[index];
        }
    }
};

/**
 * @return {string}
 */
handler.GetSqlStr = function (roleID) {
    var rows = [];
    var assetsInfo = '';
    for (var index in this.assetsList) {
        var value = this.assetsList[index].value;
        if (value > 0 && index > 0 || index == globalFunction.GetExtraVipPoint()) {
            assetsInfo += '(' + roleID + ',' + index + ',' + value + '),';

            rows.push([roleID, +index, value]);
        }
    }
    assetsInfo = assetsInfo.substring(0, assetsInfo.length - 1);
//    return assetsInfo;

    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== assetsInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, assetsInfo);
    }
    return sqlString;
};

handler.SendAssetsMsg = function (tempID) {
    var self = this;

    if (null == self.owner) {
        logger.error('SendAssetsMsg玩家是空的');
        return;
    }

    // update asset for chart.
    if (!temp || temp === globalFunction.HonorID) {
        var roleInfo = {
            roleID: self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID],
            honor: self.GetAssetsValue(globalFunction.HonorID)
        };
        //pomelo.app.rpc.chart.chartRemote.UpdateHonor(null, roleInfo, utils.done);
    }

    if (self.owner.type === gameConst.eEntityType.OFFLINEPLAYER) {
        return;
    }

    var route = 'ServerUpdatePlayerAssets';
    var assetsMsg = {
        assetsList: []
    };
    if (null == tempID) {
        for (var index in this.assetsList) {
            var temp = {};
            temp[index] = this.assetsList[index].value;
            assetsMsg.assetsList.push(temp);
        }
    }
    else {
        if (null == this.assetsList[tempID]) {
            return;
        }
        else {
            var temp = {};
            temp[tempID] = this.assetsList[tempID].value;
            assetsMsg.assetsList.push(temp);
        }
    }
    self.owner.SendMessage(route, assetsMsg);
};

handler.ClearAssets = function () { //清空财产
    for (var index in this.assetsList) {
        this.SetAssetsValue(index, 0 - this.assetsList[index].value);
    }
    this.SendAssetsMsg(null);
};

// 跨天清掉数据
handler.Update12Info = function () {
    // 这里清掉活跃度
    if (null == this.assetsList[globalFunction.GetAnimation()]) {
        return;
    }

    var clearValue = this.assetsList[globalFunction.GetAnimation()].value;

    this.AlterAssetsValue(globalFunction.GetAnimation(), -clearValue, 0);
};

/**
 * 运营活动函数通知
 * @Value       消耗数值，原始值是复值，传入的值为正
 */
handler.notifyOperateConsumeYuanBaoEvent = function (value) {
    var self = this;
    self.owner.emit(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_YUAN_BAO, self.owner, value);
};

handler.notifyOperateConsumePhysicalEvent = function (value) {
    var self = this;
    self.owner.emit(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_PHYSICAL, self.owner, value);
};
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');

var eAlchemyInfo = gameConst.eAlchemyInfo;
var tAlchemy = templateConst.tAlchemy;
var tVipTemp = templateConst.tVipTemp;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsChangeReason = gameConst.eAssetsChangeReason;


module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.alchemyInfo = new Array(eAlchemyInfo.Max);
    for (var i = 0; i < eAlchemyInfo.Max; ++i) {
        this.alchemyInfo[i] = 0;
    }
};

var handler = Handler.prototype;

handler.LoadDataByDB = function ( alchemyInfo) {
    if (alchemyInfo.length == 0) {
        alchemyInfo[eAlchemyInfo.RoleID] = this.owner.id;
        alchemyInfo[eAlchemyInfo.time] = 0;
        alchemyInfo[eAlchemyInfo.isBaoJi] = 0;
    }
    this.alchemyInfo = alchemyInfo;

};

handler.GetSqlStr = function () {
    var alchemyInfoSqlStr = '';

    var temp = this.alchemyInfo;
    alchemyInfoSqlStr += '(';
    for (var i = 0; i < eAlchemyInfo.Max; ++i) {
        var value = temp[i];
        alchemyInfoSqlStr += value + ',';
    }
    alchemyInfoSqlStr = alchemyInfoSqlStr.substring(0, alchemyInfoSqlStr.length - 1);
    alchemyInfoSqlStr += ')';
//    return alchemyInfoSqlStr;


    var sqlString = utilSql.BuildSqlValues([this.alchemyInfo]);

    if (sqlString !== alchemyInfoSqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, alchemyInfoSqlStr);
    }

    return sqlString;
};

handler.SendAlchemyMsg = function () {
    var player = this.owner;
    if (null == player) {
        logger.error('SendAlchemyMsg玩家是空的');
        return;
    }
    var route = 'ServerAlchemyUpdate';
    var alchemyMsg = {
        result: 0,
        alchemyInfo: {}
    };
    var tempMsg = {
        goldNum: 0,
        time: 0,
        zuanshi: 0
    };
    var vipTemplate = null;
    var alchemyTemplate = null;
    var level = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLV = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    if (vipLV == null || vipLV == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    }
    else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLV + 1);
    }

    if (level > 0) {
        alchemyTemplate = templateManager.GetTemplateByID('AlchemyTemplate', level);
    }
    if (vipTemplate == null || alchemyTemplate == null) {
        return;
    }
    //新表结构判定读什么数值
    var tempAlchemyTemplateL = 0;
    for (var i = 0; i <= 10; i++) {
        if( this.alchemyInfo[eAlchemyInfo.time] < alchemyTemplate['MaxNum_' + i]){
            tempAlchemyTemplateL = i;
            break;
        }
    }

    var tAlchemy = templateConst.tAlchemy;
    tempMsg.goldNum = alchemyTemplate['goldNum_' + tempAlchemyTemplateL];
    var shengyuNum = vipTemplate[tVipTemp.alchemyNum] - this.alchemyInfo[eAlchemyInfo.time];
    if (shengyuNum > 0) {
        tempMsg.time = shengyuNum;
    }
    else {
        tempMsg.time = 0;
    }
    tempMsg.zuanshi =
    alchemyTemplate['zuanShi_' + tempAlchemyTemplateL];
    alchemyMsg.alchemyInfo = tempMsg;
    player.SendMessage(route, alchemyMsg);
};

handler.UseAlchemy = function () {
    var player = this.owner;
    var msg = {
        result: 0,
        goldNum: 0,
        isBaoJi: 0
    };
    var vipTemplate = null;
    var alchemyTemplate = null;
    var level = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLV = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    if (null == vipLV || vipLV == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    }
    else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLV + 1);
    }

    if (level > 0) {
        alchemyTemplate = templateManager.GetTemplateByID('AlchemyTemplate', level);
    }
    if (null == vipTemplate || null == alchemyTemplate) {
        return errorCodes.SystemWrong;
    }
    var shengyuNum = vipTemplate[tVipTemp.alchemyNum] - this.alchemyInfo[eAlchemyInfo.time];
    if (shengyuNum <= 0) {  //炼金次数不足
        return errorCodes.NoAlchemyNum;
    }

    //新表结构判定读什么数值
    var tempAlchemyTemplateL = 0;
    for (var i = 0; i <= 10; i++) {
        if( this.alchemyInfo[eAlchemyInfo.time] < alchemyTemplate['MaxNum_' + i]){
            tempAlchemyTemplateL = i;
            break;
        }
    }

    var zuanshi = alchemyTemplate['zuanShi_' + tempAlchemyTemplateL];
    var assetsManager = player.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    if (assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), zuanshi) == false) {
        return errorCodes.NoYuanBao;
    }
    //assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -zuanshi);
    assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -zuanshi, eAssetsChangeReason.Reduce.Alchemy);
    var gold = 0;
    if (this.alchemyInfo[eAlchemyInfo.isBaoJi] == 0) {    //判断是否需要直接暴击
        if (this.alchemyInfo[eAlchemyInfo.time] >= 50) {
            this.alchemyInfo[eAlchemyInfo.time]++;
            this.alchemyInfo[eAlchemyInfo.isBaoJi] = 1;
            gold = Math.floor(alchemyTemplate['goldNum_' + tempAlchemyTemplateL] * ((vipTemplate[tVipTemp.alchemyBaoLv] / 100) + 1));
            //assetsManager.SetAssetsValue(globalFunction.GetMoneyTemp(), gold);
            assetsManager.AlterAssetsValue(globalFunction.GetMoneyTemp(), gold, eAssetsChangeReason.Add.Alchemy);
            msg.isBaoJi = 1;
            msg.goldNum = gold;
            return msg;
        }
    }
    var resultRandom = Math.floor(Math.random() * 100);
    if (resultRandom <= vipTemplate[tVipTemp.alchemyBaoJi]) {//加暴击
        this.alchemyInfo[eAlchemyInfo.time]++;
        this.alchemyInfo[eAlchemyInfo.isBaoJi] = 1;
        gold = Math.floor(alchemyTemplate['goldNum_' + tempAlchemyTemplateL] * ((vipTemplate[tVipTemp.alchemyBaoLv] / 100) + 1));
        msg.isBaoJi = 1;
    }
    else {
        this.alchemyInfo[eAlchemyInfo.time]++;
        gold = alchemyTemplate['goldNum_' + tempAlchemyTemplateL];
        msg.isBaoJi = 0;
    }
    //assetsManager.SetAssetsValue(globalFunction.GetMoneyTemp(), gold);
    assetsManager.AlterAssetsValue(globalFunction.GetMoneyTemp(), gold, eAssetsChangeReason.Add.Alchemy);
    msg.goldNum = gold;
    this.SendAlchemyMsg();
    // for tlog
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
    tlogger.log('LianjinFlow', accountType, openID, expLevel, zuanshi, gold, vipLevel);
    ///////////////////////
    return msg;

};

handler.Update12Info = function () {
    this.alchemyInfo[eAlchemyInfo.time] = 0;
    this.alchemyInfo[eAlchemyInfo.isBaoJi] = 0;
    this.SendAlchemyMsg();
};

handler.SetVipInfoNum = function (newVipLevel) {
    var self = this;
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', newVipLevel + 1);
    if (vipTemplate == null) {
        return;
    }
    this.alchemyInfo[eAlchemyInfo.time] = vipTemplate[tVipTemp.alchemyNum] - this.alchemyInfo[eAlchemyInfo.time];
    self.SendAlchemyMsg();
}
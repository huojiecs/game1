/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-1-16
 * Time: 上午10:02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../tools/templateManager');
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var utils = require('../../tools/utils');
var csSql = require('../../tools/mysql/csSql');
var guid = require('../../tools/guid');
var giftCode = require('./giftCode');
var _ = require('underscore');
var Q = require('q');
var util = require('util');
var crypto = require('crypto');
var defaultValues = require('../../tools/defaultValues');

var eGiftInfo = gameConst.eGiftInfo;
var eGiftState = gameConst.eGiftState;
var eGiftType = gameConst.eGiftType;
var ePlayerInfo = gameConst.ePlayerInfo;
var eItemChangeType = gameConst.eItemChangeType;
var eLoginGiftInfo = gameConst.eLoginGiftInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eQQMemberGift = gameConst.eQQMemberGift;


module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.dataList = {};
    this.loginGiftInfo = [];

    /** QQ会员礼包*/
    this.qqMemberGift = [];
};

var handler = Handler.prototype;
handler.LoadDataByDB = function (dataList, loginList) {
    var self = this;
    for (var index in dataList) {
        var giftID = dataList[index][eGiftInfo.GiftID];
        var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
        if (GiftTemplate != null || globalFunction.IsSysGiftID(giftID)) {
            this.dataList[giftID] = dataList[index];
        }
    }

    if (loginList.length == 0) {
        loginList[eLoginGiftInfo.roleID] = self.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
        loginList[eLoginGiftInfo.One] = 2;
        loginList[eLoginGiftInfo.Two] = 0;
        loginList[eLoginGiftInfo.Three] = 0;
        loginList[eLoginGiftInfo.Four] = 0;
        loginList[eLoginGiftInfo.Five] = 0;
        loginList[eLoginGiftInfo.Six] = 0;
        loginList[eLoginGiftInfo.Seven] = 0;
    }
    self.loginGiftInfo = loginList;
    self.SendLoginGiftList();
};

handler.GetSqlStr = function () {
    var sqlStr = '';
    for (var index in this.dataList) {
        var temp = this.dataList[index];
        sqlStr += '(';
        for (var i = 0; i < eGiftInfo.Max; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                sqlStr += '\'' + value + '\'' + ',';
            }
            else {
                sqlStr += value + ',';
            }
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr += '),';
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
//    return sqlStr;

    var sqlString = utilSql.BuildSqlValues(this.dataList);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlStr;
};

handler.AddGift = function ( giftID, giftType, value) {
    var tempGift = this.dataList[giftID];
    if (null != tempGift) {
        this.SetGiftState( giftType, value, giftID);
        return tempGift;
    }
    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (null == GiftTemplate) {
        return null;
    }
    tempGift = new Array(eGiftInfo.Max);
    tempGift[eGiftInfo.GiftID] = giftID;
    tempGift[eGiftInfo.RoleID] = this.owner.id;
    tempGift[eGiftInfo.GiftType] = eGiftState.NoOver;
    if (value >= GiftTemplate['level']) {
        tempGift[eGiftInfo.GiftType] = eGiftState.GetGift;
    }
    if (giftID == 8001 && value == 0) { //手游贵族礼包单独处理
        tempGift[eGiftInfo.GiftType] = eGiftState.NoOver;
    }

    this.dataList[giftID] = tempGift;
    this.SendGiftInfo();

    return tempGift;
};

// 添加系统礼包，用于记录一些数据用
handler.AddSysGift = function( giftID){
    var player = this.owner;
    var tempGift = this.dataList[giftID];
    if (null != tempGift) {
        return tempGift;
    }
    tempGift = new Array(eGiftInfo.Max);
    tempGift[eGiftInfo.GiftID] = giftID;
    tempGift[eGiftInfo.RoleID] = player.id;
    tempGift[eGiftInfo.GiftType] = eGiftState.IsEnd;
    this.dataList[giftID] = tempGift;

    return tempGift;
}

// 获取礼包信息
handler.GetGiftData = function(giftID){
    return this.dataList[giftID];
}

handler.SetGiftState = function (giftType, value, giftID) {
    var bSend = false;
    if (null == giftID) {
        for (var index in this.dataList) {
            var tempGift = this.dataList[index];
            if (tempGift[eGiftInfo.GiftType] != eGiftState.NoOver) {
                continue;
            }
            var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', index);
            if (null == GiftTemplate) {
                continue;
            }
            if (giftType == GiftTemplate['type'] && value >= GiftTemplate['level']) {
                tempGift[eGiftInfo.GiftType] = eGiftState.GetGift;
                bSend = true;
            }
        }
    }
    else {
        var tempGift = this.dataList[giftID];
        if (null == tempGift) {
            return;
        }
        if (tempGift[eGiftInfo.GiftType] != eGiftState.NoOver) {
            return;
        }
        var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
        if (null == GiftTemplate) {
            return;
        }
        if (value >= GiftTemplate['level']) {
            tempGift[eGiftInfo.GiftType] = eGiftState.GetGift;
            bSend = true;
        }
        if (giftID == 8001 && value == 0) { //手游贵族礼包单独处理
            tempGift[eGiftInfo.GiftType] = eGiftState.NoOver;
            bSend = true;
        }
    }
    if (bSend) {
        this.SendGiftInfo();
    }
};

//首充成功调用接口
handler.SetFirstRechargeGift = function () {
    if (this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) != this.owner.GetPlayerInfo(ePlayerInfo.ROLEID)) {
        return;
    }
    var tempID = this.owner.GetPlayerInfo(ePlayerInfo.TEMPID);
    var initTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == initTemplate) {
        return;
    }
    var giftID = initTemplate['giftID_0'];
    var tempGift = this.dataList[giftID];
    if (null == tempGift) {
        return;
    }
    if (tempGift[eGiftInfo.GiftType] != eGiftState.NoOver) {
        return;
    }
    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (null == GiftTemplate) {
        return;
    }
    var level = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel)
    if (level >= GiftTemplate['level']) {
        tempGift[eGiftInfo.GiftType] = eGiftState.GetGift;
        this.SendGiftInfo();
    }
};

// 领取奖励
handler.GetGiftItem = function (giftID) {
    var player = this.owner;
    if (null == player) {
        return errorCodes.NoRole;
    }
    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (null == GiftTemplate) {
        return errorCodes.SystemWrong;
    }

    var giftType = GiftTemplate['type'];
    var needLevel = GiftTemplate['level'];
    var tempGift = this.dataList[giftID];

    // 这都要规则一下
    if(giftType == eGiftType.Animate){
        var unionID = player.GetPlayerInfo(ePlayerInfo.UnionID);
        if(unionID == null || unionID <= 0){
            return errorCodes.NoUnion;
        }
        var addValue = player.assetsManager.GetAssetsValue(globalFunction.GetAnimation());

        if(tempGift == null){
            var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
            if (null == GiftTemplate) {
                return errorCodes.SystemWrong;
            }
            if (addValue < GiftTemplate['level']) {
                return errorCodes.Cs_NoGift;
            }

            tempGift = this.AddGift( giftID, giftType, addValue);
        }
        else{
            this.SetGiftState(giftType, addValue,giftID);
        }
    }
    if (null == tempGift) {
        return errorCodes.Cs_NoGift;
    }

    if (tempGift[eGiftInfo.GiftType] != eGiftState.GetGift) {
        return errorCodes.Cs_GiftOver;
    }

    var nowLevel = 0;
    var factor = eAssetsAdd.OtherGift; // for tlog
    switch (giftType) {
        case  eGiftType.ExpLevel:
            nowLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            if (nowLevel < needLevel) {
                return errorCodes.ExpLevel;
            }
            factor = eAssetsAdd.ExpLvGift;
            break;
        case  eGiftType.VipLevel:
            nowLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
            if (nowLevel < needLevel) {
                return errorCodes.VipLevel;
            }
            factor = eAssetsAdd.VipGift;
            break;
        case eGiftType.FirstMoney:
            factor = eAssetsAdd.FirstRecharge;
            break;
        case eGiftType.CustomLevel:
            factor = eAssetsAdd.StarBox;
            break;
        case eGiftType.Animate:
            factor = eAssetsAdd.AnimateGift;
            break;
        case eGiftType.NpcCollect:
            factor = eAssetsAdd.NpcCollectReward;
            break;
    }
    var isNobility = player.GetPlayerInfo(gameConst.ePlayerInfo.IsNobility);
    if (isNobility == 0 && giftID == 8001) {    //手游贵族礼包单独判断
        return errorCodes.IsNotNobility;
    }

    //QQ礼包添加
    var accountID = player.playerInfo[ePlayerInfo.ACCOUNTID];
    if(giftID==defaultValues.QQMemberGiftID){// 新手礼包
        /** 存入缓存*/
        var giftInfo =  {
            0: accountID,
            1: defaultValues.QQMemberGiftID,
            2: player.playerInfo[ePlayerInfo.serverUid],
            3: eGiftState.IsEnd
        };
        this.qqMemberGift.push(giftInfo);
    }if(giftID==defaultValues.QQMemberOpenSuperGiftID){
        /** 存入缓存*/
        var giftInfo =  {
            0: accountID,
            1: defaultValues.QQMemberOpenSuperGiftID,
            2: player.playerInfo[ePlayerInfo.serverUid],
            3: eGiftState.IsEnd
        };
        this.qqMemberGift.push(giftInfo);
    }if(giftID==defaultValues.QQMemberOpenGiftID){
        /** 存入缓存*/
        var giftInfo =  {
            0: accountID,
            1: defaultValues.QQMemberOpenGiftID,
            2: player.playerInfo[ePlayerInfo.serverUid],
            3: eGiftState.IsEnd
        };
        this.qqMemberGift.push(giftInfo);
    }

    var allNum = GiftTemplate['itemNum'];
    var nextID = GiftTemplate['nextID'];
    for (var i = 0; i < allNum; ++i) {
        var itemID = GiftTemplate['itemID_' + i];
        var itemNum = GiftTemplate['itemNum_' + i];
        player.AddItem(itemID, itemNum, factor, null);
    }
    tempGift[eGiftInfo.GiftType] = eGiftState.IsEnd;
    player.GetMissionManager().IsMissionOver( gameConst.eMisType.RecvGift, giftID, 1);     //任务完成
    if (nextID > 0) {
        var NextGiftTemplate = templateManager.GetTemplateByID('GiftTemplate', nextID);
        if (null != NextGiftTemplate) {
            this.dataList[nextID] = tempGift;
            delete this.dataList[giftID];
            tempGift[eGiftInfo.GiftID] = nextID;
            tempGift[eGiftInfo.RoleID] = player.id;
            var nextNeedLevel = NextGiftTemplate['level'];
            if (nowLevel >= nextNeedLevel) {
                tempGift[eGiftInfo.GiftType] = eGiftState.GetGift;
            }
            else {
                tempGift[eGiftInfo.GiftType] = eGiftState.NoOver;
            }
        }
    }
    this.SendGiftInfo();
    return 0;
};

handler.SendGiftInfo = function () {
    if (null == this.owner) {
        return;
    }
    var route = 'ServerGiftInfo';
    var msg = {
        giftList: []
    };
    for (var index in this.dataList) {
        if(globalFunction.IsSysGiftID(index)){
            continue;
        }
        var temp = {};
        for (var eIndex in eGiftInfo) {
            temp[eIndex] = this.dataList[index][eGiftInfo[eIndex]];
        }
        msg.giftList.push(temp);
    }
    this.owner.SendMessage(route, msg);
};
/**
 *
 * @param list 发送前几天领取奖励的状态
 * @constructor
 */
handler.SendLoginRewardList = function ( list) {
    var self = this;
    var player = self.owner;
    if (null == player) {
        return;
    }
    var route = 'ServerLoginRewardInfo';
    var rewardList = null;

    if (null != list) {
        rewardList = list;
    } else {
        rewardList = self.getList( false);
    }

    var msg = {
        rewardList: []
    };
    var tempMsg = {};
    for (var index in rewardList) {
        tempMsg[index] = rewardList[index];
    }
    msg.rewardList.push(tempMsg);
    player.SendMessage(route, msg);

}

/**
 *   领取登陆奖励
 * @param player
 * @returns {number}
 *  //返回状态：0:不可领 1：已过期 2:可领取 3：已领取
 */

handler.getReward = function () {
    var self = this;
    var player = self.owner;
    var rewardList = self.getList( true);
    var id = 0;
    if (null == rewardList) {
        return 0;
    }
    for (var index in rewardList) {
        id += 1;
        if (rewardList[index] == 2) {
            break;
        }
    }
    var giftID = 10000 + id;
    var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (null == giftTemplate) {
        return errorCodes.NoTemplate;
    }
    var num = giftTemplate['itemNum'];
    for (var i = 0; i < num; i++) {
        var itemID = giftTemplate['itemID_' + i];
        var itemNum = giftTemplate['itemNum_' + i];
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 1) { //判是否为QQ会员，是则金币有加成 2015-03-30新需求普通会员加20%
            if (itemID == globalFunction.GetMoneyTemp()) {
                var allTemplate = templateManager.GetTemplateByID('AllTemplate', 90);
                itemNum = itemNum + Math.ceil(itemNum * allTemplate['attnum'] / 100);
            }
        }
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 2) { //判是否为QQ会员，是则金币有加成 2015-03-30新需求超级会员加25%
            if (itemID == globalFunction.GetMoneyTemp()) {
                var allTemplate = templateManager.GetTemplateByID('AllTemplate', 185);
                itemNum = itemNum + Math.ceil(itemNum * allTemplate['attnum'] / 100);
            }
        }
        player.AddItem(itemID, itemNum, eAssetsAdd.DailyGift, 0);
    }

    var takeReward = {
        firstTakeReward: '',//每一轮的第一次领取登陆奖励日期
        takeRewardDate: '',//领奖日期
        takeRewardList: []
    }
    var loginReward = player.GetPlayerInfo(ePlayerInfo.LoginPrize);
    var backupRewardList = rewardList;
    for (var index in rewardList) {
        if (rewardList[index] == 2) {
            rewardList[index] = 3;
            player.GetMissionManager().IsMissionOver( gameConst.eMisType.RecvGift, giftID, 1);     //任务完成
            player.GetMissionManager().IsMissionOver( gameConst.eMisType.SignNum, 0, 1);     //任务完成
            break;
        }
    }
    if ("" == loginReward) {
        takeReward.firstTakeReward = utilSql.DateToString(new Date());
        takeReward.takeRewardDate = utilSql.DateToString(new Date());
        takeReward.takeRewardList = rewardList;
    } else {
        var rewardObj = JSON.parse(loginReward);
        takeReward.firstTakeReward = rewardObj.firstTakeReward;
        takeReward.takeRewardDate = utilSql.DateToString(new Date());
        takeReward.takeRewardList = rewardList;
    }
    this.owner.SetPlayerInfo(ePlayerInfo.LoginPrize, JSON.stringify(takeReward));
    this.SendLoginRewardList( backupRewardList);
    return 0;
};


handler.getList = function ( isCheck) {
    var takeReward = {
        firstTakeReward: '',//每一轮的第一次领取登陆奖励日期
        takeRewardDate: '',
        takeRewardList: []
    }
    var self = this;
    var loginReward = self.owner.GetPlayerInfo(ePlayerInfo.LoginPrize);
    var rewardObj = null;
    var rewardDate = '';
    var isFirst = false;
    var rewardList = null;
    var days = 0;
    if ("" != loginReward && loginReward.length > 10) {
        rewardObj = JSON.parse(loginReward);
        rewardDate = rewardObj.takeRewardDate.split(" ")[0];
        rewardList = rewardObj.takeRewardList;
        // var firstTakeDate = rewardObj.firstTakeReward.split(" ")[0];
        if (isCheck && new Date().getDate() == new Date(rewardDate.replace(/-/g, "/")).getDate()) {
            return null;
        }
        days = parseInt((Date.now() - new Date(rewardDate.replace(/-/g, "/"))) / (24 * 60 * 60 * 1000));
        if (days == 0) {
            for (var index in rewardList) {
                if (rewardList[index] == 2) {
                    rewardList[index] = 3;
                }
            }
        }
        else {//隔几天登陆   0:不可领 1：已过期 2:可领取 3：已领取
            var i = 0;
            for (var index in rewardList) {
                if (rewardList[index] == 0) {
                    i += 1;
                }
            }
            if (days >= 1 && days > i) {
                rewardList = self.initRewardList();
                rewardList.one = 2;
            } else {
                var i = 0;
                for (var index in rewardList) {
                    if (rewardList[index] == 0) {
                        i += 1;
                        if (i == days) {
                            rewardList[index] = 2;
                            break;
                        }
                    }
                    if (rewardList[index] == 0 && i < days) {
                        rewardList[index] = 1;//已过期状态
                    }
                }
            }
        }
    } else {
        var rewardList = self.initRewardList();
        rewardList.one = 2;
    }
    return rewardList;
};

handler.initRewardList = function () {
    var rewardList = {
        one: 0,
        two: 0,
        three: 0,
        four: 0,
        five: 0,
        six: 0,
        seven: 0
    }
    return rewardList;
};

handler.GetLoginGiftSqlStr = function () {
    var sqlStr = '';

    var temp = this.loginGiftInfo;
    sqlStr += '(';
    for (var i = 0; i < eLoginGiftInfo.Max; ++i) {
        var value = temp[i];
        sqlStr += value + ',';
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
    sqlStr += ')';
//    return magicSoulInfoSqlStr;

    var sqlString = utilSql.BuildSqlValues([this.loginGiftInfo]);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }
    return sqlString;
};

handler.SendLoginGiftList = function () {
    if (null == this.owner) {
        return;
    }
    var route = 'ServerLoginGiftInfo';
    var loginGiftMsg = {
        loginGiftInfo: {}
    };
    if (0 >= this.loginGiftInfo.length) {
        return;
    }
    else {
        var tempLoginGiftInfo = this.loginGiftInfo;

        for (var i = 0; i < eLoginGiftInfo.Max; ++i) {
            loginGiftMsg.loginGiftInfo[i] = tempLoginGiftInfo[i];
        }
    }
    this.owner.SendMessage(route, loginGiftMsg);

};

handler.getLoginGift = function () {
    var self = this;
    var temp = self.loginGiftInfo;
    var id = 0;
    if (0 >= self.loginGiftInfo.length) {
        return errorCodes.SystemWrong;
    }
    for (var i = 1; i < eLoginGiftInfo.Max; ++i) {
        if (self.loginGiftInfo[i] == 2) {
            id = i;
            break;
        }
    }
    if (id <= 0) {
        return errorCodes.Cs_GiftOver;
    }
    var giftID = 20000 + id;
    var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (null == giftTemplate) {
        return errorCodes.SystemWrong;
    }
    var num = giftTemplate['itemNum'];
    for (var i = 0; i < num; i++) {
        var itemID = giftTemplate['itemID_' + i];
        var itemNum = giftTemplate['itemNum_' + i];
        self.owner.AddItem(itemID, itemNum, eAssetsAdd.LoginGift, 0);
    }
    self.loginGiftInfo[id] = 3;
    self.SendLoginGiftList();
    return  {
        'result': 0,
        'giftID':giftID
    };
};

handler.Update12Info = function () {
    var isNeedUpdate = true;
    var tempID = 0;
    for (var i = 1; i < eLoginGiftInfo.Max; ++i) {
        if (2 == this.loginGiftInfo[i]) {
            isNeedUpdate = false;
        } else if (3 == this.loginGiftInfo[i]) {
            tempID = i;
        }
    }
    if (isNeedUpdate && tempID > 0) { //需要刷新
        if (tempID <= 6) {
            this.loginGiftInfo[tempID + 1] = 2;
        }
        //else {
        //   for (var i = 1; i < eLoginGiftInfo.Max; ++i) {
        //        this.loginGiftInfo[i] = 0;
        //    }
        //    this.loginGiftInfo[1] = 2;
        //}
    }

    // 跨天就清掉所有活跃度礼包领取状态
    var deleteList = {};
    for(var tempID in this.dataList){
        var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', tempID);
        if (null == giftTemplate) {
            continue;
        }

        if(giftTemplate['type'] == eGiftType.Animate){
            deleteList[tempID] = 1;
        }
    }
    for(var tempID in deleteList){
        delete this.dataList[tempID];
    }
    this.SendLoginGiftList();
    this.SendGiftInfo();
};

handler.addGiftCode = function (baoXiangID, codeNum, endDay, frequency) {
    var self = this;
    var deferred = Q.defer();
    if (codeNum > 200000) {
        codeNum = 200000;
    }
    if (codeNum < 1) {
        codeNum = 1;
    }
    try {
        return self.GiftBalanceToDB(baoXiangID, codeNum, endDay, frequency);
        return deferred.promise;
    }
    catch (err) {
        logger.error(util.inspect(err));
    }
};
handler.getGiftCodeInfo = function (roleID, giftCodeID,  callback) {
    var player = this.owner;
    csSql.getGiftCodeInfo(roleID, '"' + giftCodeID + '"', function (err, req) {
        var codeResult = {};
        if (!!err || req.protocol41) {
            codeResult = {result: errorCodes.GiftCodeInvalid};
            return callback(codeResult);
        } else {
            var giftCodeObj = new giftCode();
            var req = req[0][0];
            var giftID = req['giftID'];
            giftCodeObj.verifyGiftCodeNum(roleID, giftID, giftCodeID, function (res, repeat) {
                if (errorCodes.OK == res) {
                    var createDate = new Date(req['createDate']);
                    var endDate = new Date(req['endDate']);
                    var frequency = req['frequency'];
                    if (new Date() - createDate > endDate - createDate) {
                        codeResult = {result: errorCodes.GiftCodeExpired};
                    } else if (frequency < 0) {
                        codeResult = {result: errorCodes.GiftCodeUse};
                    } else {
                        var gift = giftCodeObj.GetGiftCodeInfo(giftID);
                        if (errorCodes.OK == gift.result) {
                            for (var i in gift.giftIDList) {
                                var itemID = gift.giftIDList[i];
                                var itemNum = gift.giftNumList[i];
                                player.AddItem(itemID, itemNum, eAssetsAdd.GiftCode, 0);//添加物品方法
                            }
                        }
                        codeResult = gift;
                    }
                    return callback(codeResult);
                } else {
                    codeResult = {'result': res, 'repeat': repeat};
                    return callback(codeResult);
                }
            });
        }
    });
};

/**
 *生成12位随机兑奖码（不保证兑奖码重复）
 * */
handler.GetGiftCodeID = function () {
    var cdkey = '';
    while (true) {
        cdkey = crypto.randomBytes(6).toString('hex');
        if (cdkey.search(/[150isol]/) != -1) {
            continue;
        }
        return cdkey;
    }
//    return crypto.randomBytes(6).toString('hex');
};

/**
 *每次存储100 个
 * */
handler.GiftBalanceToDB = function (baoXiangID, codeNum, endDay, frequency) {
    var self = this;
    var deferred = Q.defer();
    var Num = 100;
    if(codeNum<100){
        Num = codeNum;
    }
    /** 每次存100个，返回来后 再进行第二次存储 减少数据库连接压力*/
    return Q.until(function () {
        var jobs = [];
        codeNum = codeNum - 100;
        for (var i = 0; i < Num; i++) {
            var codeID = self.GetGiftCodeID();
            var giftCodeInfo = {
                giftCodeID: codeID,
                giftID: baoXiangID,
                createDate: utilSql.DateToString(new Date()),
                endDate: utilSql.DateToString(utils.DateAddDays(new Date(), endDay)),
                frequency: frequency
            };
            var giftCodeSql = new giftCode().GetCodeSqlStr(_.values(giftCodeInfo));
            var giftCodeID = '"' + giftCodeInfo.giftCodeID + '"';
            jobs.push(
                Q.ninvoke(csSql, 'SaveGiftCode', giftCodeID, giftCodeSql)
            );
        }
        return Q.all(jobs)
            .then(function () {
                      var flag = codeNum <= 0;
                      if (flag) {
                          deferred.resolve();
                      }
                      return flag;
                  })
            .catch(function (err) {
                       logger.error("GiftBalanceToDB failed: %s",
                                    utils.getErrorMessage(err));
                       return false;
                   });
    });

    return deferred.promise;
};



/**QQ会员礼包加载到缓存中*/
handler.LoadDataByDBAccountID = function (dataList, serverUid) {
    if((!!dataList)&&dataList.length>0){
        for (var index in dataList) {
            //兼容老用户 serverUid 新加字段默认值为 0
            if(dataList[index][eQQMemberGift.serverUid] == serverUid || dataList[index][eQQMemberGift.serverUid] == 0){
                var giftID = dataList[index][eQQMemberGift.giftID];
                var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
                if (GiftTemplate != null || globalFunction.IsSysGiftID(giftID)) {
                    this.qqMemberGift[giftID] = dataList[index];
                }
                //本服务器列表的QQ会员领取记录 同时添加到已经获取的礼包列表中
                var tempGift = new Array(eGiftInfo.Max);
                tempGift[eGiftInfo.GiftID] = giftID;
                tempGift[eGiftInfo.RoleID] = this.owner.id;
                if(dataList[index][eQQMemberGift.status] ==eGiftState.IsEnd ){
                    tempGift[eGiftInfo.GiftType] = eGiftState.IsEnd;
                }else{
                    tempGift[eGiftInfo.GiftType] = eGiftState.NoOver;
                }

                this.dataList[giftID] = tempGift;
            }

        }
        this.SendGiftInfo();
    }
};

/** 拼接QQ会员礼包存储sql*/
handler.GetSqlStrByAccountID = function () {
    var sqlStr = '';
    for (var index in this.qqMemberGift) {
        var temp = this.qqMemberGift[index];
        sqlStr += '(';
        for (var i in temp) {
            var value = temp[i];
            if (typeof  value == 'string') {
                sqlStr += '\'' + value + '\'' + ',';
            }
            else {
                sqlStr += value + ',';
            }
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr += '),';
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
//    return sqlStr;

    var sqlString = utilSql.BuildSqlValues(this.qqMemberGift);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlStr;
};


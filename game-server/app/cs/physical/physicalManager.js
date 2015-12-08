var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var csSql = require('../../tools/mysql/csSql');
var messageService = require('../../tools/messageService');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var constValue = require('../../tools/constValue');
var utilSql = require('../../tools/mysql/utilSql');

var ePhysicalInfo = constValue.ePhysicalInfo;
var tItem = templateConst.tItem;
var tVipTemp = templateConst.tVipTemp;
var tNotice = templateConst.tNotice;
var eAssetsInfo = gameConst.eAssetsInfo;
var tPhysical = templateConst.tPhysical;
var tPhysicalGift = templateConst.tPhysicalGift;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.oldDate = new Date();
    this.leftTime = 0;
    this.leftFlag = true;
    this.physicalList = {};
    this.friendPhyList = [];    //好友赠送体力列表
    //this.sendPhyTime = 0;   //上次发送体力倒计时的时间
    //this.update12Flag = false;
    this.times = 0;
};

var handler = Handler.prototype;

var replyTime = 240;


handler.LoadDataByDB = function (physicalInfo) {        //加载各种限制次数
    this.physicalList[ePhysicalInfo.roleID] = physicalInfo[0];
    this.physicalList[ePhysicalInfo.buyPhysicalNum] = physicalInfo[1];
    this.physicalList[ePhysicalInfo.receivePhysicalNum] = physicalInfo[2];
    this.physicalList[ePhysicalInfo.givePhysicalNum] = physicalInfo[3];
    this.physicalList[ePhysicalInfo.sendPhyTime] = physicalInfo[4];
    //在加载时设置体力回复时间
    var vipLevel = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    if (null == physicalInfo[0]) {
        var vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1 + vipLevel);
        if (null == vipTemplate) {
            return errorCodes.SystemWrong;
        }
        this.physicalList[ePhysicalInfo.roleID] = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
        this.physicalList[ePhysicalInfo.buyPhysicalNum] = vipTemplate[tVipTemp.buyPhysicalNum];
        this.physicalList[ePhysicalInfo.receivePhysicalNum] = vipTemplate[tVipTemp.receivePhysicalNum];
        this.physicalList[ePhysicalInfo.givePhysicalNum] = vipTemplate[tVipTemp.givePhysicalNum];
        this.physicalList[ePhysicalInfo.sendPhyTime] = utilSql.DateToString(new Date());
    }
    if (!physicalInfo[5]) {
        this.physicalList[ePhysicalInfo.phyGiftRecord] = {};
    } else {
        this.physicalList[ePhysicalInfo.phyGiftRecord] = JSON.parse(physicalInfo[5]);
    }
    var phyTemplate = templateManager.GetTemplateByID('PhysicalTemplate', 1 + vipLevel);
    if (null == phyTemplate) {
        return errorCodes.SystemWrong;
    }
    replyTime = phyTemplate[tPhysical.time];     //设置回复时间
};

handler.LoadPhyListByDB = function (roleID) {       //加载好友赠送领取列表
    var self = this;
    csSql.LoadPhyList(roleID, function (err, dataList) {
        if (err) {
            logger.error('加载玩家体力赠领列表出错: %s', err.stack);
            return;
        }
        else {
            for (var i in dataList) {
                self.friendPhyList.push(dataList[i]);
            }
        }
        self.DelTimeOutPhy();
        self.SendPhyListMsg(null);
    });
};

handler.DelTimeOutPhy = function () {     //删除超时的好友体力赠送
    var nowDate = new Date();
    for (var index in this.friendPhyList) {
        var tempPhy = this.friendPhyList[index];
        var giveDate = new Date(tempPhy['4']);    //赠送体力的时间
        if (tempPhy['2'] == 1 && (defaultValues.physicalDay - (parseInt((nowDate - giveDate) / 1000 / 60 / 60 / 24)))
            <= 0) {
            delete this.friendPhyList[index]; //删除赠送时间超过30天的列表
        }
    }
};

handler.SendPhyListMsg = function (friendID) {
    var msg = {
        phyList: []
    };
    var route = 'ServerPhyListInfo';
    if (null == friendID) {     //发送全部
        for (var index in this.friendPhyList) {
            msg.phyList.push(this.friendPhyList[index]);
        }
    }
    else {   //发送单个
        for (var index in this.friendPhyList) {
            var temp = this.friendPhyList[index];
            if (friendID == temp['1']) {
                msg.phyList.push(temp);
                break;
            }
        }
    }
    this.owner.SendMessage(route, msg);
};

handler.FriendPhysical = function (friendID, type) {  //好友间友情点的赠送和领取
    var self = this;
    if (null == friendID) {
        return errorCodes.ParameterNull;
    }
    if (type < 0) {
        return errorCodes.ParameterWrong;
    }
    var roleID = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    if (type == 1) {    //体力领取
        var receiveNum = this.physicalList[ePhysicalInfo.receivePhysicalNum];   //剩余领取次数
        if (receiveNum <= 0) {
            return errorCodes.RecvNumZero;
        }
        //var vipLevel = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
        //var phyTemplate = templateManager.GetTemplateByID('PhysicalTemplate', 1 + vipLevel);
        //var recvPhyNum = phyTemplate[tPhysical.receiveNum];     //领取的体力数量

        var temp;
        for (var index in this.friendPhyList) {
            if (friendID == this.friendPhyList[index]['1']) {
                temp = this.friendPhyList[index];
                break;
            }
        }
        if (null == temp) {
            return errorCodes.NoPhyRecv;
        }
        if (1 == temp['2']) {   //有体力可以领取
            temp['2'] = 2;      //设置好友列表的领取为已领取
            var phyInfo = '(' + roleID + ',' + friendID + ',' + 2 + ',' + temp['3'] + ',' + '\''
                              + utilSql.DateToString(new Date(temp['4'])) + '\'' + ')';
            csSql.SaveFriPhyInfo(roleID, friendID, phyInfo, function (err, res) {       //将数据更新到数据库
                if (err) {
                    logger.error('领取体力出现错误%j', err.stack);
                    return errorCodes.SystemWrong;
                }
                else {
                    self.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetFriend(), 10);     //增加友情点
                    self.physicalList[ePhysicalInfo.receivePhysicalNum] = receiveNum - 1;       //可领取次数减一
                }
            });
        }
        else {
            return errorCodes.NoPhyRecv;
        }
        self.SendPhyListMsg(friendID);
        ///////////////////////////////////////////////////////////
        var openID = this.owner.GetOpenID();
        var accountType = this.owner.GetAccountType();
        tlogger.log('SnsFlow', accountType, openID, 1, 10, 3, 0);
        ///////////////////////////////////////////////////////////
        return errorCodes.OK;
    }
    else if (type == 0) {   //体力赠送
        var giveNum = this.physicalList[ePhysicalInfo.givePhysicalNum];   //剩余赠送次数
        if (giveNum <= 0) {
            return errorCodes.GiveNumZero;
        }
        var temp;
        for (var index in this.friendPhyList) {
            if (friendID == this.friendPhyList[index]['1']) {
                temp = this.friendPhyList[index];
                break;
            }
        }
        var phyInfo;
        if (null == temp) { //当列表中没有该好友的信息时
            temp = {};
            temp['0'] = roleID;
            temp['1'] = friendID;
            temp['2'] = 0;          //领取标志
            temp['3'] = 1;          //赠送标志
            temp['4'] = utilSql.DateToString(new Date());          //好友赠送个给我的最新时间
            this.friendPhyList.push(temp);      //将最新数据插入到列表
            phyInfo =
            '(' + roleID + ',' + friendID + ',' + 0 + ',' + 1 + ',' + '\'' + utilSql.DateToString(new Date(temp['4']))
                + '\'' + ')';
        }
        else {  //当列表中存在该好友信息时
            if (temp['3'] == 1) {    //当今天已经赠送了
                return errorCodes.RepeadGive;
            }
            temp['3'] = 1;          //赠送标志
            phyInfo = '(' + roleID + ',' + friendID + ',' + temp['2'] + ',' + 1 + ',' + '\''
                          + utilSql.DateToString(new Date(temp['4'])) + '\'' + ')';
        }
        csSql.SaveFriPhyInfo(roleID, friendID, phyInfo, function (err, res) {       //将数据更新到数据库
            if (err) {
                logger.error('赠送体力出现错误%j', err.stack);
                return errorCodes.SystemWrong;
            }
            else {
                self.physicalList[ePhysicalInfo.givePhysicalNum] = giveNum - 1;       //可赠送次数减一
            }
        });
        //var vipLevel = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
        // phyTemplate = templateManager.GetTemplateByID('PhysicalTemplate', 1 + vipLevel);
        //var addFriNum = phyTemplate[tPhysical.friendShip];     //增加的友情点数量
        //self.owner.GetAssetsManager().SetAssetsValue(6001, addFriNum);     //增加友情点
        //将赠送体力消息同步到好友列表  //有跨服的玩家
        pomelo.app.rpc.fs.fsRemote.checkAcrossFriendPhysical(null, roleID, friendID, function (err, res) {
            if (!!err || !res.isAcross) {
                pomelo.app.rpc.ps.phyRemote.GiveFriPhysical(null, roleID, friendID, utils.done);
            }
        });
        this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.GiveFri, 0, 1);
        self.SendPhyListMsg(friendID);
        ///////////////////////////////////////////////////////////
        var openID = this.owner.GetOpenID();
        var accountType = this.owner.GetAccountType();
        tlogger.log('SnsFlow', accountType, openID, 1, 10, 2, 0);
        ///////////////////////////////////////////////////////////
        return errorCodes.OK;
    }
};

handler.GiveFriPhysical = function (friendID, callback) {     //别人送我的友情点信息
    var self = this;
    if (null == friendID) {
        return;
    }
    var roleID = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var temp;
    for (var index in this.friendPhyList) {
        if (friendID == this.friendPhyList[index]['1']) {
            temp = this.friendPhyList[index];
            break;
        }
    }
    var phyInfo;
    if (null == temp) {     //当前列表没有该好友的信息
        temp = {};
        temp['0'] = roleID;
        temp['1'] = friendID;
        temp['2'] = 1;          //领取标志
        temp['3'] = 0;          //赠送标志
        temp['4'] = utilSql.DateToString(new Date());          //好友赠送个给我的最新时间
        this.friendPhyList.push(temp);      //将最新数据插入到列表
        phyInfo =
        '(' + roleID + ',' + friendID + ',' + 1 + ',' + 0 + ',' + '\'' + utilSql.DateToString(new Date(temp['4']))
            + '\'' + ')';
    }
    else {
        temp['2'] = 1;          //领取标志
        temp['4'] = utilSql.DateToString(new Date());          //好友赠送个给我的最新时间
        phyInfo = '(' + roleID + ',' + friendID + ',' + 1 + ',' + temp['3'] + ',' + '\''
                      + utilSql.DateToString(new Date(temp['4'])) + '\'' + ')';
    }
    csSql.SaveFriPhyInfo(roleID, friendID, phyInfo, function (err, res) {       //将数据更新到数据库
        if (err) {
            logger.error('赠送体力好友接收出现错误%j', err.stack);
            return;
        }
    });
    this.SendPhyListMsg(friendID);
};

handler.GetSqlStr = function () {
    var rows = [];
    var row = [];
    var physicalInfo = '(';
    for (var i in ePhysicalInfo) {
        var value = this.physicalList[i];
        if (i == ePhysicalInfo.phyGiftRecord) {
            value = JSON.stringify(value);
        }
        row.push(value);
        if (typeof  value == 'string') {
            physicalInfo += '\'' + value + '\'' + ',';
        }
        else {
            physicalInfo += value + ',';
        }
    }
    physicalInfo = physicalInfo.substring(0, physicalInfo.length - 1);
    physicalInfo += ')';

    rows.push(row);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== physicalInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, physicalInfo);
    }

    return sqlString;
};

handler.SetVipPhysicalInfo = function (oldLevel, level) {
//    var tempVipTemplate=templateManager.GetTemplateByID('VipTemplate',level);
//    var buyTimes=tempVipTemplate[tVipTemp.buyPhysicalNum]-this.leftTime;//购买的次数
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', level + 1);
    var oldvipTemplate = templateManager.GetTemplateByID('VipTemplate', oldLevel + 1);
    if (null != vipTemplate && null != oldvipTemplate) {
        var physicalTime = this.owner.GetVipInfoManager().getNumByType(gameConst.eVipInfo.PhysicalNum);
        this.physicalList[ePhysicalInfo.buyPhysicalNum] = vipTemplate[tVipTemp.buyPhysicalNum] - physicalTime;
        this.physicalList[ePhysicalInfo.receivePhysicalNum] =
        vipTemplate[tVipTemp.receivePhysicalNum] - (oldvipTemplate[tVipTemp.receivePhysicalNum]
            - this.physicalList['receivePhysicalNum']);
        this.physicalList[ePhysicalInfo.givePhysicalNum] = vipTemplate[tVipTemp.givePhysicalNum];
        this.SendPhysicalMsg();
    }

    var phyTemplate = templateManager.GetTemplateByID('PhysicalTemplate', 1 + level);
    if (null == phyTemplate) {
        return errorCodes.SystemWrong;
    }
    replyTime = phyTemplate[tPhysical.time];     //设置回复时间
};

handler.Update12Info = function () {
    //console.log('Update12Info');
    this.times = 0;
    var vipLevel = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    if (null != vipTemplate) {
        this.physicalList[ePhysicalInfo.buyPhysicalNum] = vipTemplate[tVipTemp.buyPhysicalNum];
        this.physicalList[ePhysicalInfo.receivePhysicalNum] = vipTemplate[tVipTemp.receivePhysicalNum];
        this.physicalList[ePhysicalInfo.givePhysicalNum] = vipTemplate[tVipTemp.givePhysicalNum];
    }

    //将好友的已赠送列表设置为未赠送
    csSql.refreshPhyList(this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), function (err) {
        if (err) {
            logger.error('每日更新好友赠送体力列表失败%j', err.stack);
        }
    });

    for (var index in this.friendPhyList) {
        this.friendPhyList[index]['2'] = 0; //领取标志位置0
        this.friendPhyList[index]['3'] = 0; //赠送标志位置0
    }
    if (null != this.friendPhyList) {
        this.SendPhyListMsg(null);
    }
    logger.warn("physicalManager on update12info, roleID ==%d, this.physicalList: %j",
                this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                this.physicalList);
    this.SendPhysicalMsg( true);
};

handler.BuyPhysical = function () {
    var vipLevel = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    if (null == vipTemplate) {
        return errorCodes.ParameterNull;
    }
    var totalNum = vipTemplate[tVipTemp.buyPhysicalNum];    //总计可以购买的次数
    var leftNum = this.physicalList[ePhysicalInfo.buyPhysicalNum];      //剩余购买的次数
    if (leftNum <= 0) {
        return errorCodes.BuyNumZero;
    }
    var buyTimes = totalNum - leftNum;  //这是第几次购买
    var phyTemplate = templateManager.GetTemplateByID('PhysicalTemplate', 1 + vipLevel);
    if (null == phyTemplate) {
        return errorCodes.SystemWrong;
    }
    var buyPhyNum = phyTemplate[tPhysical.num];     //购买的体力值
    if (buyTimes > 9) {
        buyTimes = 9;
    }
    var buyPrice = phyTemplate['buyNum_' + buyTimes]; //购买体力所需钻石数量
    if (this.owner.GetAssetsManager().CanConsumeAssets(globalFunction.GetYuanBaoTemp(), buyPrice) == false) {
        return errorCodes.NoYuanBao;
    }
    //this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetYuanBaoTemp(), -buyPrice);  //扣除钻石
    this.owner.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -buyPrice,
                                                   eAssetsReduce.BuyPhysical);      //扣除钻石
    this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetPhysical(), buyPhyNum);     //增加体力
    this.physicalList[ePhysicalInfo.buyPhysicalNum] = leftNum - 1;      //剩余次数减一
    this.times += 1;
    this.owner.GetVipInfoManager().setNumByType(this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                                                gameConst.eVipInfo.PhysicalNum, 1);

    logger.warn('BuyPhysical, roleID: %j, vipLevel: %j, totalNum: %j, leftNum: %j, buyTimes: %j, buyPhyNum: %j, buyPrice: %j',
        this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), vipLevel, totalNum, leftNum, buyTimes, buyPhyNum, buyPrice);

    //this.SendPhysicalMsg(this.owner);     //如果发送会导致时间的归零，此处需要客户端自己处理
    // for tlog
    var openID = this.owner.GetOpenID();
    var accountType = this.owner.GetAccountType();
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
    tlogger.log('BuyPhysicalFlow', accountType, openID, expLevel, buyPrice, vipLevel);
    /////////////////////////
    return 0;
};

handler.SetPhysicalValue = function (tempID, Value) {   //回复体力逻辑控制
    var level = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    var physicalTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', level);
    var maxPhysical = physicalTemplate[templateConst.tAtt.maxPhysical]; //当前等级可以回复到的最大体力值
    var tempValue = this.owner.GetAssetsManager().GetAssetsValue(tempID) + Value;
    if (maxPhysical <= this.owner.GetAssetsManager().GetAssetsValue(tempID)) {   //当钱体力已经比最大值大时不回复
        return;
    }
    if (maxPhysical <= tempValue) {
        this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetPhysical(), maxPhysical
            - this.owner.GetAssetsManager().GetAssetsValue(tempID));     //增加体力
        return;
    }
    if (maxPhysical > this.owner.GetAssetsManager().GetAssetsValue(tempID)) {
        this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetPhysical(), Value);     //增加体力
    }
};

handler.ReplyPhysical = function () {  //回复体力
    //console.log('回复体力');
    var oldSec = this.oldDate.getTime();
    var nowDate = new Date();
    var nowSec = nowDate.getTime();
    if (((nowSec - oldSec) / 1000) >= this.leftTime && false == this.leftFlag) {
        this.oldDate = nowDate;
        this.SetPhysicalValue(globalFunction.GetPhysical(), 1);
        this.leftTime = replyTime;
        this.SendPhysicalMsg();
        //console.log('时间到 ' + this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID));
    }

    if (((nowSec - oldSec) / 1000) >= this.leftTime && true == this.leftFlag) {
        this.leftFlag = false;
        this.oldDate = nowDate;
        this.SetPhysicalValue(globalFunction.GetPhysical(), 1);
        this.leftTime = replyTime;
        this.SendPhysicalMsg();
        //console.log('剩余时间到 ' + this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID));
    }
};

handler.offlinePhysical = function ( loginTime) {
    if (null == loginTime) {
        return;
    }
    var lastSendTime = new Date(this.physicalList[ePhysicalInfo.sendPhyTime]);      //最后一次发送体力倒计时的时间
    var loginSec = lastSendTime.getTime();
    if (isNaN(loginSec)) {
        //console.log('*************isNaN(loginSec)*************');
        this.leftTime = 0;
        this.leftFlag = false;
        this.ReplyPhysical();
        logger.warn("physicalManager on offlinePhysical, roleID == %d",
                    this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID));
        return;
    }
    var nowTime = new Date();
    var nowSec = nowTime.getTime();
    var getPhysical = Math.floor((nowSec - loginSec) / (replyTime * 1000));
    this.SetPhysicalValue(globalFunction.GetPhysical(), getPhysical);
    var remainTime = replyTime - (Math.floor((nowSec - loginSec) / 1000)) % replyTime;
    this.leftTime = remainTime;
    logger.warn("physicalManager on offlinePhysical, roleID ==%d,init getPhysical==%d",
                this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), getPhysical);
    this.SendPhysicalMsg();
};

handler.SendPhysicalMsg = function ( sendPhyTop) {
    var route = 'ServerUpdatePhysicalTime';
    var msg = {
        timeList: [],
        phyList: []
    };
    var tempMsg = {};
    tempMsg['0'] = this.leftTime;
    msg.timeList.push(tempMsg);
    msg.phyList.push(this.physicalList);
    this.owner.SendMessage(route, msg);
    if (!sendPhyTop) {
        this.physicalList[ePhysicalInfo.sendPhyTime] = utilSql.DateToString(new Date());
    }
    //console.log('发送剩余时间 leftSec = ' + tempMsg['0']);
    //console.log('发送体力购买等次数信息 = %j, %j, %j',msg.phyList[0]['buyPhysicalNum'],msg.phyList[0]['receivePhysicalNum'],msg.phyList[0]['givePhysicalNum']);
};

// fix bug 2712 玩家体力恢复期间，创建多人副本房间，体力剩余恢复时间重置. ljh 2015-5-25 17-22
/*handler.SetLeftTime = function () {
    this.leftTime = replyTime;
};*/

handler.CanGetPhysicalGift = function () {
    var nowDate = new Date();
    var phyGiftTemplate = templateManager.GetTemplateByID('PhysicalGift', 1);
    var countPerDay = phyGiftTemplate[tPhysicalGift.phy_Num];
    for (var i = 0; i < countPerDay; i++) {
        var startHour = phyGiftTemplate[tPhysicalGift['phy_StartTime_' + i]];
        var endHour = phyGiftTemplate[tPhysicalGift['phy_EndTime_' + i]];
        if (endHour <= startHour) {
            return { 'result': errorCodes.SystemWrong, 'nextTime': -1 };
        }
        var startDate = new Date();
        startDate.setHours(startHour);
        startDate.setMinutes(0);
        startDate.setSeconds(0);

        var endDate = new Date();
        endDate.setHours(endHour);
        endDate.setMinutes(0);
        endDate.setSeconds(0);

        if (nowDate < startDate) {
            return { 'result': errorCodes.PhyGiftNotTime, 'nextTime': i };
        }
        else if (nowDate <= endDate) {
            var phyGiftRecordDate = this.physicalList[ePhysicalInfo.phyGiftRecord][i];
            if (phyGiftRecordDate !== undefined && nowDate.toDateString() === phyGiftRecordDate) {
                return { 'result': errorCodes.PhyGiftNotTime, 'nextTime': (i + 1) % countPerDay };
            }
            return { 'result': errorCodes.OK, 'nextTime': i };
        }
    }
    return { 'result': errorCodes.PhyGiftNotTime, 'nextTime': 0 };
};

handler.GetPhysicalGift = function () {
    var nowDate = new Date();
    var phyGiftTemplate = templateManager.GetTemplateByID('PhysicalGift', 1);
    var countPerDay = phyGiftTemplate[tPhysicalGift.phy_Num];
    for (var i = 0; i < countPerDay; i++) {
        var startHour = phyGiftTemplate[tPhysicalGift['phy_StartTime_' + i]];
        var endHour = phyGiftTemplate[tPhysicalGift['phy_EndTime_' + i]];
        var phyNum = phyGiftTemplate[tPhysicalGift['phy_Num_' + i]]
        if (endHour <= startHour) {
            return errorCodes.SystemWrong;
        }
        var startDate = new Date();
        startDate.setHours(startHour);
        startDate.setMinutes(0);
        startDate.setSeconds(0);

        var endDate = new Date();
        endDate.setHours(endHour);
        endDate.setMinutes(0);
        endDate.setSeconds(0);

        if (startDate <= nowDate && nowDate <= endDate) {
            var phyGiftRecordDate = this.physicalList[ePhysicalInfo.phyGiftRecord][i];
            if (phyGiftRecordDate !== undefined && nowDate.toDateString() === phyGiftRecordDate) {
                return errorCodes.PhyGiftHasGet;
            }
            this.physicalList[ePhysicalInfo.phyGiftRecord][i] = nowDate.toDateString();
            this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetPhysical(), phyNum);
            return errorCodes.OK;
        }
    }
    return errorCodes.PhyGiftNotTime;
};
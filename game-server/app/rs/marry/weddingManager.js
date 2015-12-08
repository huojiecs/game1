/**
 * Created with JetBrains WebStorm.
 * User: chenTest
 * Date: 15-7-1
 * Time: 上午10:15
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var defaultValues = require('../../tools/defaultValues');
var redisManager = require('../../cs/chartRedis/redisManager');
var playerManager = require('../../rs/player/playerManager');
var config = require('../../tools/config');
var errorCodes = require('../../tools/errorCodes');
var rsSql = require('../../tools/mysql/rsSql');
var Q = require('q');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');
var stringValue = require('../../tools/stringValue');
var _ = require('underscore');
var eWedding = gameConst.eWedding;
var tWeddingTime = templateConst.tWeddingTime;
var tWeddingLevel = templateConst.tWeddingLevel;
var eMarryInfo = gameConst.eMarryInfo;
var eMarryGift = gameConst.eMarryGift;
var ePlayerInfo = gameConst.ePlayerInfo;
var eXuanYan = gameConst.eXuanYan;
var eMarryLog = gameConst.eMarryLog;
var tMarryGift = templateConst.tMarryGift;
var tAssets = templateConst.tAssets;
var tLocalize = templateConst.tLocalize;
var tNotice = templateConst.tNotice;

var Handler = module.exports;

Handler.wedding = []; //roleid , wedid, marrylevel, bless
Handler.marryInfo = [];
Handler.marryGift = [];
Handler.xuanYanList = [];
Handler.marryLog = [];

//当前举行婚礼id
Handler.nowWedding = 0;
//当前举行的婚礼
Handler.weddingList = [];
//婚礼中宾客列表
Handler.marryGusts = [];
//宾客红包领取列表
Handler.getHongBao = [];

//婚礼开始时间
Handler.beginTime = 0;

//防止重复点击创建预约锁
Handler.yuYueList = [];


Handler.Init = function () {
    this.InitWeddingList();
};

Handler.InitWeddingList = function () {
    var self = this;
    if (_.isArray(config.mysql.game)) {
        for (var i = 0; i < config.mysql.global.loopCount; ++i) {
            self.loadWedding(i);
        }
    } else {
        self.loadWedding(0);
    }
    Q.resolve();
};

// 加载
Handler.loadWedding = function (i) {
    var self = this;
    rsSql.loadWedding(i, function (err, resList) {
        if (!!err) {
            logger.error("Error while loadUnionsDamage: %s", utils.getErrorMessage(err));
        }
        var weds = resList['wedding'];
        var marryInfo  = resList['marryInfo'];
        var marryGift = resList['marryGift'];
        var xuanYan = resList['xuanYan'];
        var marryLog = resList['marryLog'];
        for (var w in weds) {
            self.wedding.push(weds[w]);
        }
        for (var m in marryInfo) {
            if(1 == marryInfo[m][eMarryInfo.state]){
                var roleID = marryInfo[m][eMarryInfo.roleID];
                var toMarryID = marryInfo[m][eMarryInfo.toMarryID];
                var cloMarryInfo = _.clone(marryInfo[m]);
                marryInfo[m][eMarryInfo.marryTime] = new Date(marryInfo[m][eMarryInfo.marryTime]);
                self.marryInfo[roleID] =  cloMarryInfo;
                self.marryInfo[roleID]['chart'] =  1;
                self.marryInfo[toMarryID] =  marryInfo[m];
                self.marryInfo[toMarryID]['chart'] =  0;
            }

        }
        for (var g in marryGift) {
            var roleID = marryGift[g][eMarryGift.roleID];
            self.marryGift[roleID] =  marryGift[g];
        }
        for (var x in xuanYan) {
            var roleID = xuanYan[x][eXuanYan.roleID];
            self.xuanYanList[roleID] = xuanYan[x];
        }
        for (var l in marryLog) {
            var roleID = marryLog[l][eMarryLog.roleID];
            marryLog[l][eMarryLog.giveTime] = utilSql.DateToString(new Date(marryLog[l][eMarryLog.giveTime]));
            if(!self.marryLog[roleID]){
                self.marryLog[roleID] = [];
            }
            self.marryLog[roleID].push(marryLog[l]);

        }
    });
};


/**  直接搜索求婚对象 */
Handler.FindNameToMarry = function(roleID, name, callback){
    var self = this;
    var findPlayer = {};
    var player = playerManager.GetPlayer(roleID);
    var playerList = playerManager.GetAllPlayer();
    for(var index in playerList){
        var playerInfo = playerList[index];
        if(roleID == playerInfo.GetPlayerInfo(ePlayerInfo.ROLEID)){
            continue;
        }
        if(name==playerInfo.GetPlayerInfo(ePlayerInfo.NAME) || name==playerInfo.GetPlayerInfo(ePlayerInfo.NickName)){
            //判断职业和等级
            var jobMarry = self.jobMarryCheck(player.GetPlayerInfo(ePlayerInfo.TEMPID), playerInfo.GetPlayerInfo(ePlayerInfo.TEMPID));
            if(!jobMarry){
                return callback(null, {'result': errorCodes.MARRY_ITEMWRONGJOB});
            }
            if(defaultValues.marryExpLevel > playerInfo.GetPlayerInfo(ePlayerInfo.ExpLevel)){
                return callback(null, {'result': errorCodes.MARRY_LEVEL_TO});
            }

            findPlayer['roleID'] = playerInfo.GetPlayerInfo(ePlayerInfo.ROLEID);
            findPlayer['openID'] = playerInfo.GetPlayerInfo(ePlayerInfo.openID);
            findPlayer['roleName'] = playerInfo.GetPlayerInfo(ePlayerInfo.NAME);
            findPlayer['playerLevel'] = playerInfo.GetPlayerInfo(ePlayerInfo.ExpLevel);
            findPlayer['picture'] = playerInfo.GetPlayerInfo(ePlayerInfo.Picture);
            if(!!self.xuanYanList[playerInfo.GetPlayerInfo(ePlayerInfo.ROLEID)]){
                findPlayer['xuanYan'] = self.xuanYanList[playerInfo.GetPlayerInfo(ePlayerInfo.ROLEID)][eXuanYan.xuanYan]
            }else{
                findPlayer['xuanYan'] = '';
            }
        }
    }
    if(!!findPlayer['roleID']){
        var retArray = {
            result: errorCodes.OK
        };
        retArray['marryMsg'] = findPlayer;
        return callback(null, retArray);
    }else{
        return callback(null, {'result': errorCodes.MARRY_NOT_FIND_PLAYER});
    }
}

/** 结婚之后 基础信息界面 */
Handler.GetMarryInfo = function (roleID, callback){
    var self = this;
    if(!self.marryInfo[roleID]){
        return callback(null, errorCodes.NOT_MARRY);
    }
    var player = playerManager.GetPlayer(roleID);
    var spouseID = roleID==self.marryInfo[roleID][eMarryInfo.roleID] ? self.marryInfo[roleID][eMarryInfo.toMarryID] : self.marryInfo[roleID][eMarryInfo.roleID];
    var resMarry = {
        roleID :roleID,
        roleName: player.GetPlayerInfo(ePlayerInfo.NAME),
        roleOpenID: player.GetPlayerInfo(ePlayerInfo.openID),
        rolePicture: player.GetPlayerInfo(ePlayerInfo.Picture),
        spouseID: +spouseID,
        divorceTime: 0
    }

    for(var l in self.marryLog[roleID]){    //3为离婚信 4为已经被拒绝的离婚信
        if((3==self.marryLog[roleID][l][eMarryLog.logType]||4 ==self.marryLog[roleID][l][eMarryLog.logType]) && 1==self.marryLog[roleID][l][eMarryLog.giftID]){//如果有离婚协议 获取离婚协议时间

            var selfLogTime = self.marryLog[roleID][l][eMarryLog.giveTime];
            selfLogTime =  new Date(selfLogTime);
            var nowDate = new Date();
            if((nowDate-selfLogTime)/3600000 < 24){
                resMarry['divorceTime'] = Math.round((24*3600)-((nowDate-selfLogTime)/1000));
            }
        }
    }
    var notRead = 0;
    for(var log in self.marryLog[spouseID]){
        if(0 == self.marryLog[spouseID][log][eMarryLog.state]){
            ++notRead;
        }
    }

    var marryLevel = self.marryInfo[roleID][eMarryInfo.marryLevel];
    pomelo.app.rpc.ps.psRemote.GetOffPlayerInfoNew(null, spouseID, function(err, res) {
        if (!!err) {
            logger.error("Error when GetMarryInfo: %s", utils.getErrorMessage(err));
        }
        if(!!res){
            var spouseName = res[ePlayerInfo.NAME];
            var spouseOpenID = res[ePlayerInfo.openID];
            var spousePicture = res[ePlayerInfo.Picture];
            var spouseTempID = res[ePlayerInfo.TEMPID];
            var yinYuan = self.YinYuanCount(roleID);
            resMarry['spouseName'] = spouseName;
            resMarry['spouseOpenID'] = spouseOpenID;
            resMarry['spousePicture'] = spousePicture;
            resMarry['spouseTempID'] = spouseTempID;
            resMarry['yinYuan'] = yinYuan;
            resMarry['yinYuanCount'] = defaultValues.marry_yinyuan;
            resMarry['marryLevel'] = marryLevel;
            resMarry['divorceYuanbao'] = defaultValues.divorce_yuanbao;
            resMarry['notRead'] = notRead;
            var res = {
                result: errorCodes.OK,
                marryInfo : resMarry
            }
            return callback(null, res);
        }else{
            return callback(null, errorCodes.NoRole);
        }
    });


}

/** 附近玩家 查看其他玩家的结婚信息  */
Handler.OtherMarryInfo = function(roleID, callback){
    var self = this;
    var resMarry = {
        roleID :roleID
    };
    if(!self.marryInfo[roleID]){
        resMarry['state'] = 0;
        var res = {
            result: errorCodes.OK,
            marryInfo : resMarry
        }
        return callback(null, res);
    }else{
        resMarry['state'] = self.marryInfo[roleID][eMarryInfo.state];
        var spouseID = roleID==self.marryInfo[roleID][eMarryInfo.roleID] ? self.marryInfo[roleID][eMarryInfo.toMarryID] : self.marryInfo[roleID][eMarryInfo.roleID];
        resMarry['spouseID'] = +spouseID;
    }
    //var player = playerManager.GetPlayer(roleID);
    pomelo.app.rpc.ps.psRemote.GetOffPlayerInfoNew(null, spouseID, function(err, res) {
        if (!!err) {
            logger.error("Error when OtherMarryInfo: %s", utils.getErrorMessage(err));
        }
        if(!!res){
            var spouseName = res[ePlayerInfo.NAME];
            var tempID = res[ePlayerInfo.TEMPID];
            resMarry['spouseName'] = spouseName;
            resMarry['tempID'] = +tempID;
            var res = {
                result: errorCodes.OK,
                marryInfo : resMarry
            }
            return callback(null, res);
        }else{
            return callback(null, {'result':errorCodes.NoRole});
        }
    });
}

/** 亲密互动 获取 爱的礼物 列表 和 曾经获取的信息  */
Handler.GetMarryGiftInfo = function(roleID, callback){
    var self = this;
    //如果第一次 则初始化
    if(!self.marryGift[roleID]){
        var toMarryID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];

        var marryGift = {
            0: roleID,          //角色ID
            1: toMarryID,          //配偶ID
            2: 0,         //花束
            3: 0,            //吻
            4: 0,           //礼物
            5: 0,       //当天已送出香吻次数  每天免费一次
            6: 0,       //当天已送出花束次数  每天免费一次  付费3次
            7: 0,       //当天花钱购买礼物次数  每天限制所有礼物一共6次
            8:0      //个人姻缘总值
        }
        self.marryGift[roleID] = marryGift;
        var resMarryGift = {
            roleID: self.marryGift[roleID][eMarryGift.roleID],          //角色ID
            spouseID: self.marryGift[roleID][eMarryGift.spouseID],          //配偶ID
            flowers: self.marryGift[roleID][eMarryGift.flowers],         //花束
            kiss: self.marryGift[roleID][eMarryGift.kiss],            //吻
            gifts: self.marryGift[roleID][eMarryGift.gifts],           //礼物
            giveKissNum: self.marryGift[roleID][eMarryGift.giveKissNum],     //当天已送出香吻次数  每天免费一次
            giveFlowerNum: self.marryGift[roleID][eMarryGift.giveFlowerNum],   //当天已送出花束次数  每天免费一次  付费3次
            giveGiftNum: self.marryGift[roleID][eMarryGift.giveGiftNum],   //当天花钱购买礼物次数  每天限制所有礼物一共6次
            yinYuanCount:self.marryGift[roleID][eMarryGift.yinYuanCount]      //个人姻缘总值
        }
        var res = {
            result: errorCodes.OK,
            marryGift : resMarryGift
        }
        self.getLoveGiftList(roleID, res, callback);


    }else{
        var resMarryGift = {
            roleID: self.marryGift[roleID][eMarryGift.roleID],          //角色ID
            spouseID: self.marryGift[roleID][eMarryGift.spouseID],          //配偶ID
            flowers: self.marryGift[roleID][eMarryGift.flowers],         //花束
            kiss: self.marryGift[roleID][eMarryGift.kiss],            //吻
            gifts: self.marryGift[roleID][eMarryGift.gifts],           //礼物
            giveKissNum: self.marryGift[roleID][eMarryGift.giveKissNum],     //当天已送出香吻次数  每天免费一次
            giveFlowerNum: self.marryGift[roleID][eMarryGift.giveFlowerNum],   //当天已送出花束次数  每天免费一次  付费3次
            giveGiftNum: self.marryGift[roleID][eMarryGift.giveGiftNum],   //当天花钱购买礼物次数  每天限制所有礼物一共6次
            yinYuanCount:self.marryGift[roleID][eMarryGift.yinYuanCount]      //个人姻缘总值
        }
        var res = {
            result: errorCodes.OK,
            marryGift : resMarryGift
        }
        self.getLoveGiftList(roleID, res, callback);
    }
}
/** 获取 亲密互动 礼物列表 要有当前碎片数量  */
Handler.getLoveGiftList = function(roleID, resMsg, callback){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    var loveGift = templateManager.GetAllTemplate('marryGiftTemplate');
    var giftList = [];
    for(var g in loveGift){
        var giftID = loveGift[g][tMarryGift.giftID];
        var giftNameID = loveGift[g][tMarryGift.giftNameID];
        var giftDescID = loveGift[g][tMarryGift.giftDescID];
        var locaGiftTemp = templateManager.GetTemplateByID('LocalizeTemplate', giftNameID);
        var locaGiftDescTemp = templateManager.GetTemplateByID('LocalizeTemplate', giftDescID);
        var assetsGiftTemp = templateManager.GetTemplateByID('AssetsTemplate', giftID);
        var giftInfo = {
            giftID: giftID,
            giftName: locaGiftTemp[tLocalize.description],
            giftDesc: locaGiftDescTemp[tLocalize.description],
            assesID: loveGift[g][tMarryGift.assesID],
            moneyNum: loveGift[g][tMarryGift.moneyNum],
            freeNum:  loveGift[g][tMarryGift.freeNum],
            giveCount: loveGift[g][tMarryGift.giveCount],
            yinYuan:  loveGift[g][tMarryGift.yinYuan],
            suiPianNum:  loveGift[g][tMarryGift.suiPianNum],
            icon: assetsGiftTemp[tAssets.icon],
            hasSuiPian: 0
        }
        giftList.push(giftInfo)
    }
    pomelo.app.rpc.cs.csRemote.GetLoveGiftSuiPianNum(null, player["csID"], roleID, giftList, function(err, res){
        if (!!err) {
            logger.error("Error while GetLoveGiftSuiPianNum: %s", utils.getErrorMessage(err));
        }
        resMsg['giftList'] = res;
        return callback(null, resMsg);
    });
}


/** 亲密互动 赠送爱的礼物  */
Handler.GiveMarryGift = function(roleID, giftID, giveType, callback){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if(!self.marryInfo[roleID]){
        return callback(null, {result: errorCodes.NOT_MARRY});
    }
    var toGiveID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];

    var giftTemp = templateManager.GetTemplateByID('marryGiftTemplate', giftID);
    if(!giftTemp){
        return callback(null, {result: errorCodes.WEDDING_GIFT_NOT});
    }
    var giftType = 0; //物品类型
    var yinYuan = 0; //此次增加的yinYuan值
    yinYuan = giftTemp[tMarryGift.yinYuan];

    //获取免费次数
    var freeNum = giftTemp[tMarryGift.freeNum];
    //购买次数
    var giveCount = giftTemp[tMarryGift.giveCount];
    //所需碎片数
    var suiPianNum = giftTemp[tMarryGift.suiPianNum];
    //所需花费类型
    var assesID = giftTemp[tMarryGift.assesID];
    //每个碎片花费
    var moneyNum = giftTemp[tMarryGift.moneyNum];

    //吻
    if(7205 == giftTemp[tMarryGift.giftID]){
        giftType = eMarryGift.kiss;
    }else if(7206 == giftTemp[tMarryGift.giftID]){
        giftType = eMarryGift.flowers;
    }else{
        giftType = eMarryGift.gifts
    }
    // 修改 自己的赠送记录
    if(eMarryGift.kiss == giftType){    //送的吻
        if(freeNum > self.marryGift[roleID][eMarryGift.giveKissNum]){
            ++self.marryGift[roleID][eMarryGift.giveKissNum];
            self.InsertLog(roleID, toGiveID, giftType, giftID, yinYuan);
            return callback(null, {result:errorCodes.OK});
        }else{
            return callback(null, {result: errorCodes.WEDDING_KISS_NOT_GIVE});
        }
    }else if(eMarryGift.flowers == giftType){   //送的花
        if(freeNum > self.marryGift[roleID][eMarryGift.giveFlowerNum]){
            ++self.marryGift[roleID][eMarryGift.giveFlowerNum];
            self.InsertLog(roleID, toGiveID, giftType, giftID, yinYuan);

            return callback(null, {result: errorCodes.OK});
        }else if(freeNum <= self.marryGift[roleID][eMarryGift.giveFlowerNum] && self.marryGift[roleID][eMarryGift.giveFlowerNum] < giveCount+freeNum){
            //可以购买，判断财产
            var assets = {
                tempID : giftTemp['assesID'],
                value : giftTemp['moneyNum']
            };
            pomelo.app.rpc.cs.csRemote.SendLoveFlower(null, player["csID"], roleID, assets, gameConst.eAssetsChangeReason.Reduce.LoveGift, function(err, res){
                if (!!err) {
                    logger.error("Error while GiveMarryGift: %s", utils.getErrorMessage(err));
                }
                if(0 == res){
                    ++self.marryGift[roleID][eMarryGift.giveFlowerNum];
                    self.InsertLog(roleID, toGiveID, giftType, giftID, yinYuan);
                    return callback(null, {result: res});
                }else{
                    return callback(null, res);
                }
            });
        }else{
            return callback(null, {result: errorCodes.WEDDING_FLOWER_NOT_GIVE});
        }
    }else{      //送的是爱的礼物，使用碎片兑换 不够可用钻石
        var assets = {
            tempID : giftID,
            value : suiPianNum
        };
        if(2 == giveType && self.marryGift[roleID][eMarryGift.giveGiftNum] >= giveCount){
            return callback(null, {result:errorCodes.WEDDING_GIFT_NOT_GIVE});
        }
        pomelo.app.rpc.cs.csRemote.SendLoveGift(null, player["csID"], roleID, assets, assesID, moneyNum, giveType, gameConst.eAssetsChangeReason.Reduce.LoveGift, function(err, res){
            if (!!err) {
                logger.error("Error while GiveMarryGift: %s", utils.getErrorMessage(err));
                return callback(null, {result: errorCodes.SystemWrong});
            }
            if(0 == res){
                if(2 == giveType){
                    ++self.marryGift[roleID][eMarryGift.giveGiftNum];
                }
                self.InsertLog(roleID, toGiveID, giftType, giftID, yinYuan);
                return callback(null, {result: errorCodes.OK});
            }else{
                return callback(null, res);
            }
        });
    }
}

/** 获取 夫妻日志列表  */
Handler.GetMarryLog = function(roleID, callback){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if(!self.marryInfo[roleID]){
        return callback(null, {result: errorCodes.NOT_MARRY});
    }
    //获取对象ID
    var toMarryID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];
    var marryLog = [];
    var assetsGiftTemp = templateManager.GetAllTemplate('AssetsTemplate');
    for(var m in self.marryLog[toMarryID]){
        var giftID = self.marryLog[toMarryID][m][eMarryLog.giftID];          //爱的礼物id
        var log = {
            roleID: self.marryLog[toMarryID][m][eMarryLog.roleID],       //角色ID
            tempID: player.GetPlayerInfo(ePlayerInfo.TEMPID),
            toMarryID: self.marryLog[toMarryID][m][eMarryLog.toMarryID],       //对象ID
            logType: self.marryLog[toMarryID][m][eMarryLog.logType],         //log类型
            giftID: giftID,          //爱的礼物id   ， 如果是系统的话 1 是结婚 2是庆典
            giveTime: self.marryLog[toMarryID][m][eMarryLog.giveTime],        //送出时间
            state: self.marryLog[toMarryID][m][eMarryLog.state],             //是否已读
            logID: self.marryLog[toMarryID][m][eMarryLog.logID]              //每人的logID
        }
        if(0 != giftID && 1 != giftID && 2 != giftID){
            log['icon'] = assetsGiftTemp[giftID][tAssets.icon];                   //礼物图片
        }
        if(4 != log['logType']){
            marryLog.push(log);
        }
    }
    //清空消息数
    //self.ClearMarryMsg(roleID);

    //判断夫妻日志信息
    var res = {
        result: errorCodes.OK,
        marryLog: marryLog
    }
    return callback(null, res);

}

//赠送爱的礼物时  插入互动夫妻日志
Handler.InsertLog = function(roleID, toGiveID, giftType, giftID, yinYuan){
    var self = this;
    // 增加 被赠送者信息
    if(!self.marryGift[toGiveID] || roleID!=self.marryGift[toGiveID][eMarryGift.spouseID]){
        var marryGift = {
            0: toGiveID,          //角色ID
            1: roleID,          //配偶ID
            2: 0,         //花束
            3: 0,            //吻
            4: 0,           //礼物
            5: 0,     //当天已送出香吻次数  每天免费一次
            6: 0,   //当天已送出花束次数  每天免费一次  付费3次
            7: 0,   //当天购买礼物次数  每天总共购买6次
            8: yinYuan      //个人姻缘总值
        }
        //增加计数
        ++marryGift[giftType];
        self.marryGift[toGiveID] = marryGift;
    }else{
        //增加计数
        ++self.marryGift[toGiveID][giftType];
        self.marryGift[toGiveID][eMarryGift.yinYuanCount] = self.marryGift[toGiveID][eMarryGift.yinYuanCount] + yinYuan;
    }
    //添加夫妻日志信息
    self.AddMarryLog(roleID, toGiveID, 2, giftID);
    //给客户端同步姻缘值
    self.SendYinYuan(roleID);
    self.SendYinYuan(toGiveID);
    //更新姻缘排行榜
    self.AddMarryScore(roleID);
}

//更新姻缘排行榜
Handler.AddMarryScore = function (roleID) {
    var self = this;
    //判断排行榜名字顺序
    var name = roleID;
    var toMarryID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];
    if(self.marryInfo[roleID]['chart']){
        name = roleID+"+"+toMarryID;
    }else{
        name = toMarryID+"+"+roleID;
    }
    var yinYuanCount = self.YinYuanCount(roleID);
    var roleInfo = {
        roleID:name,
        score:yinYuanCount
    };
    pomelo.app.rpc.chart.chartRemote.UpdateMarry(null, roleInfo, utils.done);

};

//添加夫妻日志
Handler.AddMarryLog = function(roleID, toGiveID, logType, giftID){
    var self = this;
    var nowTime = new Date();
    //添加夫妻日志信息
    var marryLog = {
        0: roleID,
        1: toGiveID,
        2: logType, //日志类型 1 系统  2 互动 3离婚
        3: giftID,  //系统中 1,2区分结婚或者庆典   离婚中 1,2区分
        4: utilSql.DateToString(nowTime),
        5: 0       //是否已读  0未读 1已读
    }
    if(!self.marryLog[roleID]){
        self.marryLog[roleID] = [];
    }
    var logID = 0;  //用于标记已读
    for(var log in self.marryLog[roleID]){
        if(logID < self.marryLog[roleID][log][eMarryLog.logID]){
            logID = self.marryLog[roleID][log][eMarryLog.logID];
        }
    }
    marryLog[eMarryLog.logID] = ++logID;
    self.marryLog[roleID].push(marryLog);
    if(self.marryLog[roleID].length > defaultValues.marry_log_length){
        self.marryLog[roleID].splice(0,1);   //超过30条删除第一条
    }
    //添加消息
    self.AddMarryMsg(toGiveID);
}

//读取夫妻日志
Handler.ReadMarryLog = function(roleID, logID, callback){
    var self = this;
    //获取对象ID
    var toMarryID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];
    for(var log in self.marryLog[toMarryID]){
        if(logID == self.marryLog[toMarryID][log][eMarryLog.logID]){
            self.marryLog[toMarryID][log][eMarryLog.state] = 1;  //标记已读
        }
    }
    return callback(null,  {'result': errorCodes.OK});

}



//添加夫妻日志时候查看玩家是否在线 添加消息提示
Handler.AddMarryMsg = function(roleID){
    //判断玩家是否在线~在线直接rpc调用到cs添加即可
    var player = playerManager.GetPlayer(roleID);
    if(!!player) {
        pomelo.app.rpc.cs.csRemote.AddMsg(null, player["csID"], roleID, utils.done);
    }else{
        //直接操作数据库
        rsSql.UpdateMarryMsg(roleID, utils.done);
    }
}

//查看夫妻日志时候清空消息数量
Handler.ClearMarryMsg = function(roleID){
    //判断玩家是否在线~在线直接rpc调用到cs添加即可
    var player = playerManager.GetPlayer(roleID);
    if(!!player) {
        pomelo.app.rpc.cs.csRemote.ClearMsg(null, player["csID"], roleID, utils.done);
    }
}

//清理夫妻日志中  拒绝时 离婚信协议
Handler.DelMarryLog = function(roleID, toDivorceID, logType){
    var self = this;
    if(!logType){   //离婚  直接清空俩人 互动数据
        self.marryLog[toDivorceID] = null;
        self.marryLog[roleID] = null;
    }else{         //拒绝离婚   清空离婚信
        for(var l in self.marryLog[toDivorceID]){
            if(toDivorceID==self.marryLog[toDivorceID][l][eMarryLog.roleID] && logType==self.marryLog[toDivorceID][l][eMarryLog.logType] && 2!=self.marryLog[toDivorceID][l][eMarryLog.giftID]){
                self.marryLog[toDivorceID][l][eMarryLog.logType] = 4; //被拒绝了的离婚信
                break;
            }
        }
    }
}


//亲密度（姻缘值）计算
Handler.YinYuanCount = function(roleID){
    var self = this;
    var yinYuanCount = 0 ;
    var marryDate = self.marryInfo[roleID][eMarryInfo.marryTime];
    var spouseID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];
    if(!!self.marryGift[roleID]){
        //var spouseID = self.marryGift[roleID][eMarryGift.spouseID];//历史数据有影响
        if(!!self.marryGift[spouseID]){
            if(self.marryGift[roleID][eMarryGift.spouseID] == spouseID){//防垃圾数据
                yinYuanCount = yinYuanCount + self.marryGift[roleID][eMarryGift.yinYuanCount];
            }
            if(self.marryGift[spouseID][eMarryGift.spouseID] == roleID){//防垃圾数据
                yinYuanCount = yinYuanCount + self.marryGift[spouseID][eMarryGift.yinYuanCount];
            }
        }else{
            if(self.marryGift[roleID][eMarryGift.spouseID] == spouseID){//防垃圾数据
                yinYuanCount = self.marryGift[roleID][eMarryGift.yinYuanCount];
            }
        }
    }
    var marryDay = new Date(marryDate);
    var nowDay =  new Date();
    var dayCount = Math.floor((nowDay-marryDay)/(3600*24*1000));
    //亲密度每天减少2   再加上总亲密度 就是当前亲密度  默认满值为260
    //var yinYuan = (defaultValues.marry_yinyuan + yinYuanCount - dayCount*2) > 260 ? 260 : (defaultValues.marry_yinyuan + yinYuanCount - dayCount*2);
    var yinYuan = defaultValues.marry_yinyuan + yinYuanCount - dayCount*defaultValues.marry_yinyuan_reduce;
    return yinYuan;
}

/** 预约婚礼 返回婚礼档次列表  和 当前预约情况 */
Handler.GetWedding = function(roleID, callback){
    var self = this;
    var wedding = self.wedding;
    var wedList = {};
    var webLevel = [];
    var player = playerManager.GetPlayer(roleID);
    if(!player){
        return callback(null, {result: errorCodes.NoRole});
    }
    if(!self.marryInfo[roleID]){
        return callback(null, {result: errorCodes.NOT_MARRY});
    }

    var wedTemp = templateManager.GetAllTemplate('weddingTimeTemplate');
    var wedLevelTemp = templateManager.GetAllTemplate('weddingLevelTemplate');

    if(!wedTemp || !wedLevelTemp){
        logger.error(" weddingTimeTemplate or weddingLevelTemplate not find ");
        return callback(null, {result: errorCodes.NoTemplate});
    }

    for(var l in wedLevelTemp){
        if(0 == self.marryInfo[roleID][eMarryInfo.marryLevel]) { //说明没举办过婚礼 , 获取婚礼列表
            if(1 == wedLevelTemp[l][tWeddingLevel.marryType]){
                var webLevelMsg = {
                    'marryID': wedLevelTemp[l][tWeddingLevel.marryID],
                    'marryType': wedLevelTemp[l][tWeddingLevel.marryType],
                    'marryLevel': wedLevelTemp[l][tWeddingLevel.marryLevel],
                    'giftNum': wedLevelTemp[l][tWeddingLevel.giftNum],
                    'assesID': wedLevelTemp[l][tWeddingLevel.assesID],
                    'reward': wedLevelTemp[l][tWeddingLevel.reward],
                    'marryMoneyType': wedLevelTemp[l][tWeddingLevel.marryMoneyType],
                    'marryMoney': wedLevelTemp[l][tWeddingLevel.marryMoney]
                }
                webLevel.push(webLevelMsg);
            }
        }else{
            if(2 == wedLevelTemp[l][tWeddingLevel.marryType]){
                var webLevelMsg = {
                    'marryID': wedLevelTemp[l][tWeddingLevel.marryID],
                    'marryType': wedLevelTemp[l][tWeddingLevel.marryType],
                    'marryLevel': wedLevelTemp[l][tWeddingLevel.marryLevel],
                    'giftNum': wedLevelTemp[l][tWeddingLevel.giftNum],
                    'assesID': wedLevelTemp[l][tWeddingLevel.assesID],
                    'reward': wedLevelTemp[l][tWeddingLevel.reward],
                    'marryMoneyType': wedLevelTemp[l][tWeddingLevel.marryMoneyType],
                    'marryMoney': wedLevelTemp[l][tWeddingLevel.marryMoney]
                }
                webLevel.push(webLevelMsg);
            }
        }
    }

    for (var w in wedTemp) {
        var wedID = wedTemp[w][tWeddingTime.weddingID];
        var time = wedTemp[w][tWeddingTime.beginTime];
        //时长
        var longTime = wedTemp[w][tWeddingTime.longTime];
        var wedEndDate = new Date()
        wedEndDate.setHours(time);
        wedEndDate.setMinutes(0);
        wedEndDate.setMilliseconds(0);
        //utilSql.DateToString(new Date(yueDate)

        var wedNum = wedTemp[w][tWeddingTime.weddingNum];
        var wed = {
            'time':time,
            'longTime':longTime,
            'wedNum':wedNum,
            'wedCount':wedNum,
            'state':0       //0可预约， 1 已经预约， 2 预约已满 ，3 婚礼已结束
        }
        var NowDate = new Date();
        wedList[wedID] = wed;
        if(NowDate>wedEndDate){ //超出婚礼结婚时间
            wedList[wedID]['state'] = 3;
        }
    }

    var bless = ''
    var marryLevel = 0;
    for(var i in wedding){
        var wedID = wedding[i][eWedding.wedID];
        var oldRoleID = wedding[i][eWedding.roleID];
        --wedList[wedID]['wedNum'];
        if(wedList[wedID]['wedNum'] == 0){
            wedList[wedID]['state'] = 2;
        }
        if(oldRoleID==self.marryInfo[roleID][eMarryInfo.roleID] || oldRoleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ){
            wedList[wedID]['state'] = 1;
            bless = wedding[i][eWedding.bless];
            marryLevel = wedding[i][eWedding.marryLevel]
        }
    }

    var retArray = {
        result: errorCodes.OK
    };
    retArray['weddingMsg'] = wedList;
    retArray['webLevelMsg'] = webLevel;
    retArray['bless'] = bless;
    retArray['marryLevel'] = marryLevel;
    return callback(null, retArray);

}

Handler.ReplaceStr = function (str) {       //新人寄语屏蔽字
    str = str.toLowerCase();
    if(defaultValues.chatCheck) {   //只有腾讯版本去掉聊天中的空格
        str = str.replace(/\s+/g, "");
    }
    var strList = templateManager.GetAllTemplate('NoTalk');
    for (var index in strList) {
        str = str.replace(strList[index], '*');
    }
    return str;
};

/**预约婚礼*/
Handler.YuYueWedding = function(roleID, wedID, marryLevel, bless, callback){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    var wedding = self.wedding;
    var count = 0;
    if(globalFunction.IsValidAnyName(bless, 99) ==  false){
        return callback(null, {result: errorCodes.MARRY_BLESS_DONTUSE});
    }
    if(!player){
        return callback(null, {result: errorCodes.NoRole});
    }
    if(!self.marryInfo[roleID]){
        return callback(null, {result: errorCodes.NOT_MARRY});
    }
    var toMarryID = roleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ? self.marryInfo[roleID][eMarryInfo.roleID] : self.marryInfo[roleID][eMarryInfo.toMarryID];
    for(var i in wedding){
        var oldWedID = wedding[i][eWedding.wedID];
        var oldRoleID = wedding[i][eWedding.roleID];
        //检查两人是否已经预约过婚礼
        if(oldRoleID==self.marryInfo[roleID][eMarryInfo.roleID] || oldRoleID==self.marryInfo[roleID][eMarryInfo.toMarryID] ){
            return callback(null, {result: errorCodes.WEDDING_ALREADY_YUYUE});
        }
        if(wedID == oldWedID){
            ++count;
        }
    }

    var wedTimeTemp = templateManager.GetTemplateByID('weddingTimeTemplate', wedID);
    if(!wedTimeTemp){
        return callback(null, {result: errorCodes.WEDDING_WID_NOT});
    }
    var time = wedTimeTemp[tWeddingTime.beginTime];
    //时长
    var longTime = wedTimeTemp[tWeddingTime.longTime];
    var wedEndDate = new Date();
    wedEndDate.setHours(time);
    wedEndDate.setMinutes(0);
    wedEndDate.setMilliseconds(0);
    wedEndDate.setSeconds(0); //转成婚礼开始时间返回给客户端显示
    var NowDate = new Date();
    if(NowDate>wedEndDate){ //超出婚礼开始结婚时间
        return callback(null, {result: errorCodes.WEDDING_BEYOND_TIME});
    }

    if(count>=10){
        return callback(null, {result: errorCodes.WEDDING_NOT_MORE});
    }else{
        //判断需要花费的钻石
        var wedLevelTemp = templateManager.GetTemplateByID('weddingLevelTemplate', marryLevel);
        if(!wedLevelTemp){
            return callback(null, {result: errorCodes.WEDDING_NOT_LEVEL});
        }
        var assets = {
            tempID : wedLevelTemp[tWeddingLevel.marryMoneyType],
            value : wedLevelTemp[tWeddingLevel.marryMoney]
        };

        //判断预约锁 防止重复点击
        if(!!self.yuYueList){
            for(var yuYueRole in self.yuYueList){
                if(!!self.yuYueList[yuYueRole]){
                    if(self.yuYueList[yuYueRole]['role'] == roleID && self.yuYueList[yuYueRole]['lock'] == true){
                        return callback(null, {result: errorCodes.WEDDING_ALREADY_YUYUE});
                    }
                }
            }
        }
        var yuYueRole = {
            role : roleID,
            lock : true
        };
        self.yuYueList.push(yuYueRole);

        //判断财产
        pomelo.app.rpc.cs.csRemote.YuDingWedding(null, player["csID"], roleID, assets, gameConst.eAssetsChangeReason.Reduce.Divorce, function(err, res){
            if (!!err) {
                logger.error("Error while loadUnionsDamage: %s", utils.getErrorMessage(err));
            }
            if(0 == res){
                var wed = [roleID, toMarryID, wedID, marryLevel, bless];
                wedding.push(wed);
                var year = wedEndDate.getFullYear();
                var mouth = wedEndDate.getMonth() + 1;
                var day = wedEndDate.getDate();
                var hour = wedEndDate.getHours();
                var res = {
                    result: errorCodes.OK,
                    yuYueYear: year,
                    yuYueMonth: mouth,
                    yuYueDay: day,
                    yuYueHour: hour
                }
                //添加夫妻日志信息
                self.AddMarryLog(roleID, toMarryID, 1, wedLevelTemp[tWeddingLevel.marryType]);  //giftID 传入marryType 区分 1婚礼还是2庆典
                self.AddMarryLog(toMarryID, roleID, 1, wedLevelTemp[tWeddingLevel.marryType]);  //只有系统类型 的 是 夫妻双方都需要查看的
                for(var yuYueRole in self.yuYueList){
                    if(!!self.yuYueList[yuYueRole]){
                        if(self.yuYueList[yuYueRole]['role'] == roleID && self.yuYueList[yuYueRole]['lock'] == true){
                            delete self.yuYueList[yuYueRole];
                        }
                    }
                }
                return callback(null, res);
            }else{
                for(var yuYueRole in self.yuYueList){
                    if(!!self.yuYueList[yuYueRole]){
                        if(self.yuYueList[yuYueRole]['role'] == roleID && self.yuYueList[yuYueRole]['lock'] == true){
                            delete self.yuYueList[yuYueRole];
                        }
                    }
                }
                return callback(null, res);
            }

        });
    }
}


/** 给所有在线用户发送 婚礼信息 根据场次定时发送 */
Handler.SendWedding = function() {
    var self = this;
    var route = 'SendWedding';
    //查询婚礼时间场次
    var wedTemp = templateManager.GetAllTemplate('weddingTimeTemplate');
    if(!wedTemp){
        logger.error("When  SendWedding  weddingTimeTemplate not find ");
        return;
    }
    var nowDate = new Date();
    self.beginTime = nowDate;
    var nowWeding = 0;
    var wedDate = new Date();
    var longTime = 0;
    //遍历策划配置的婚礼场次 目前只有4场 此处循环4次无压力
    for (var w in wedTemp) {
        var wedID = wedTemp[w][tWeddingTime.weddingID];
        var time = wedTemp[w][tWeddingTime.beginTime];
        longTime = wedTemp[w][tWeddingTime.longTime];
        wedDate.setHours(time);
        wedDate.setMinutes(0);
        wedDate.setSeconds(0);
        wedDate.setMilliseconds(0);

        if(nowDate>wedDate && (nowDate-wedDate)<=defaultValues.SendWeddingTime){  //判断是否是举行婚礼的时间范围
            nowWeding = wedID;
            break;
        }
    }
    //如果此时间有举行婚礼的场次  拼装婚礼信息  每个时间段默认是10场婚礼
    if(0 != nowWeding){
        self.nowWedding = nowWeding;
        //根据婚礼执行时长停止婚礼
        setTimeout(function () {
            self.StopWedding(self.nowWedding);
        }, longTime*60000);

        var weddingList = [];
        for(var w in self.wedding){
            var wedding = self.wedding[w];
            if(self.nowWedding == wedding[eWedding.wedID]){
                var roleID = wedding[eWedding.roleID];
                var toMarryID = wedding[eWedding.toMarryID];
                var marryLevel = wedding[eWedding.marryLevel];
                if(!!self.marryInfo[roleID]){
                    self.marryInfo[roleID][eMarryInfo.marryLevel] = marryLevel;
                    self.marryInfo[toMarryID][eMarryInfo.marryLevel] = marryLevel;
                    weddingList.push(wedding);
                }
            }
        }
        pomelo.app.rpc.ps.psRemote.GetWeddingPlayerInfo(null, weddingList, function(err, res){
            //当前结婚列表信息
            self.weddingList = res;
            var Msg = {
                result: errorCodes.OK
            };
            //Msg['weddingMsg'] = res;
            logger.fatal('###### SendWedding weddingMsg: %j ', self.weddingList);
            var Allplayer = playerManager.GetAllPlayer();
            for (var p in Allplayer) {
                var player = Allplayer[p];
                if (!!player) {
                    player.SendMessage(route, Msg)
                }

            }
        });
    }
}


/** 打开婚礼界面  返回所有10对婚礼信息  */
Handler.BeginWedding = function(roleID, callback) {
    var self = this;
    if(0 != self.nowWedding) {
        //计算婚礼倒计时
        var wedTemp = templateManager.GetTemplateByID('weddingTimeTemplate', self.nowWedding);
        if (!wedTemp) {
            logger.error("When  BeginWedding  weddingTimeTemplate not find ");
        }
        //var beginTime = wedTemp[tWeddingTime.beginTime]; 由于开始时会有 秒级误差
        var beginTime = self.beginTime;
        var longTime = wedTemp[tWeddingTime.longTime];
        var wedEndDate = new Date();
        wedEndDate.setHours(beginTime.getHours());
        wedEndDate.setMinutes(longTime);
        wedEndDate.setSeconds(beginTime.getSeconds());
        wedEndDate.setMilliseconds(beginTime.getMilliseconds());
        var nowDate = new Date();
    }
    var res = {
        result: errorCodes.OK,
        time: Math.round((wedEndDate-nowDate)/1000)
    }
    res['weddingList'] = self.weddingList;

    return callback(null,res);
}

/** 玩家进入婚礼时  查询当前宾客列表返回 */
Handler.ComingWedding = function(roleID, marryID, callback){
    var self = this;
    //此人是否已经祝福过
    var getBless = 0;
    if(!self.marryGusts[marryID]){
        self.marryGusts[marryID] = [];
    }else{
        for(var g in self.marryGusts[marryID]){
            if(roleID == self.marryGusts[marryID][g]['roleID']){
                getBless = 1;
                break;
            }
        }
    }
    //此人是否已经领取过红包
    var getHongBao = 0;
    if(!!self.getHongBao[roleID]){
        for(var h in self.getHongBao[roleID]){
            if(marryID == self.getHongBao[roleID][h]){
                getHongBao = 1;
                break;
            }
        }
    }

    var gustsNum = 0;
    if(0 != self.nowWedding) {
        //计算婚礼倒计时
        var wedTemp = templateManager.GetTemplateByID('weddingTimeTemplate', self.nowWedding);
        if (!wedTemp) {
            logger.error("When  BeginWedding  weddingTimeTemplate not find ");
        }
        //var beginTime = wedTemp[tWeddingTime.beginTime];
        var beginTime = self.beginTime;  //由于开始时会有 秒级误差  所以使用真正开始时间
        var longTime = wedTemp[tWeddingTime.longTime];
        var wedEndDate = new Date();
        wedEndDate.setHours(beginTime.getHours());
        wedEndDate.setMinutes(longTime);
        wedEndDate.setSeconds(beginTime.getSeconds());
        wedEndDate.setMilliseconds(beginTime.getMilliseconds());
        var nowDate = new Date();
    }
    var res = {
        result: errorCodes.OK,
        gustsList: self.marryGusts[marryID],
        gustsNum: gustsNum,
        getHongBao: getHongBao,
        getBless: getBless,
        isSelfWedding: 0, //0不是自己的婚礼  1是自己的婚礼
        time: Math.round((wedEndDate-nowDate)/1000)
    }
    for(var m in self.weddingList){
        if((roleID == self.weddingList[m]['roleID'] || roleID == self.weddingList[m]['toMarryID']) && (marryID == self.weddingList[m]['roleID'] || marryID == self.weddingList[m]['toMarryID'])){
            res['isSelfWedding'] = 1;
        }
        if(marryID == self.weddingList[m]['roleID']){
            if(1 == getBless || 1 == res['isSelfWedding']){
                //获取婚礼特效信息
                res['teXiao'] = self.weddingList[m]['teXiao'];
                res['teXiaoID'] = self.weddingList[m]['teXiaoID'];
            }
            res['gustsNum'] = self.weddingList[m]['guestsNum'];
            break;
        }
    }
    if(1 == res['isSelfWedding']){
        var wedLevelTemp = templateManager.GetTemplateByID('weddingLevelTemplate',64001);  //所有档次婚礼的 特效都是一样的 所以随便取一个
        if(!wedLevelTemp){
            logger.error("When  ComingWedding  weddingLevelTemplate not find ");
            return;
        }
        //获取特效所需花费  目前是1-3 玫瑰花  烟火  桃心
        res['effectPrice1'] = wedLevelTemp[tWeddingLevel.open1Price];
        res['effectType1'] = wedLevelTemp[tWeddingLevel.open1Type];

        res['effectPrice2'] = wedLevelTemp[tWeddingLevel.open2Price];
        res['effectType2'] = wedLevelTemp[tWeddingLevel.open2Type];

        res['effectPrice3'] = wedLevelTemp[tWeddingLevel.open3Price];
        res['effectType3'] = wedLevelTemp[tWeddingLevel.open3Type];


    }

    return callback(null, res);
}

/***宾客参加婚礼  前台点击 祝福新人 才添加列表*/
Handler.BlessWedding = function(roleID, marryID, callback){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    var name = player.GetPlayerInfo(ePlayerInfo.NAME);
    for(var m in self.weddingList){
        if(marryID == self.weddingList[m]['roleID']){
            if(!self.weddingList[m]['guestsNum']){
                self.weddingList[m]['guestsNum'] = 0;
            }
            ++self.weddingList[m]['guestsNum'];
            break;
        }
    }
    if(!self.marryGusts[marryID]){
        self.marryGusts[marryID] = [];
    }
    if(!self.marryGusts[marryID][roleID]){
        self.marryGusts[marryID].push({
            roleID: roleID,
            gustsName: name,
            tempID: '0',
            value: 0
        });
        return callback(null, {result: errorCodes.OK});
    }else{
        return callback(null, {result: errorCodes.WEDDING_ALREADY_BLESS});
    }

}

/** 夫妻购买婚礼特效 */
Handler.BuyEffectWedding = function(roleID, effactID, callback){    //effactID 1 ,2, 3  为3种特效
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    var gusts = null;
    var wedLevelTemp = templateManager.GetTemplateByID('weddingLevelTemplate',64001);  //所有档次婚礼的 特效都是一样的 所以随便取一个
    if(!wedLevelTemp){
        logger.error("When  BuyEffectWedding  weddingLevelTemplate not find ");
        return;
    }
    //获取特效所需花费  目前是1-3 玫瑰花  烟火  桃心
    var effectPath;
    var effectPrice;
    var effectType;
    if(effactID>=1 && effactID<=3){
        if(1 == effactID){
            effectPath = wedLevelTemp[tWeddingLevel.open1Path];
            effectPrice = wedLevelTemp[tWeddingLevel.open1Price];
            effectType = wedLevelTemp[tWeddingLevel.open1Type];
        }
        if(2 == effactID){
            effectPath = wedLevelTemp[tWeddingLevel.open2Path];
            effectPrice = wedLevelTemp[tWeddingLevel.open2Price];
            effectType = wedLevelTemp[tWeddingLevel.open2Type];
        }
        if(3 == effactID){
            effectPath = wedLevelTemp[tWeddingLevel.open3Path];
            effectPrice = wedLevelTemp[tWeddingLevel.open3Price];
            effectType = wedLevelTemp[tWeddingLevel.open3Type];
        }
    }
    //两人同时操作限制不扣钱
    var oldteXiaoID = 0;
    for(var m in self.weddingList) {
        if (roleID == self.weddingList[m]['roleID'] || roleID == self.weddingList[m]['toMarryID']) {
            oldteXiaoID = self.weddingList[m]['teXiaoID'];
        }
    }
    if(oldteXiaoID == effactID){
        res = {
            result: errorCodes.OK,
            effectPath: effectPath
        }
        return callback(null, res);
    }

    //判断财产
    var assets = {
        tempID : effectType,
        value : effectPrice
    };
    pomelo.app.rpc.cs.csRemote.BuyEffectWedding(null, player["csID"], roleID, assets, gameConst.eAssetsChangeReason.Reduce.BuyEffectWedding, function(err, res) {
        if (!!err) {
            logger.error("Error while BuyEffectWedding: %s", utils.getErrorMessage(err));
        }
        if (0 == res) {
            var wedroleID = roleID;
            //修改婚礼现场特效
            for(var m in self.weddingList) {
                if (roleID == self.weddingList[m]['roleID'] || roleID == self.weddingList[m]['toMarryID']) {
                    self.weddingList[m]['teXiaoID'] = effactID;
                    self.weddingList[m]['teXiao'] = effectPath;
                    wedroleID = self.weddingList[m]['roleID'];
                }
            }
            var spouseID = roleID==self.marryInfo[roleID][eMarryInfo.roleID] ? self.marryInfo[roleID][eMarryInfo.toMarryID] : self.marryInfo[roleID][eMarryInfo.roleID];
            if(!!self.marryGusts[roleID]){
                gusts = self.marryGusts[roleID];
            }else{
                gusts = self.marryGusts[spouseID];
            }
            //主动发送给所有宾客 和 夫妻双方
            self.SendEffectWedding(gusts, spouseID, effactID, effectPath, wedroleID);
            res = {
                result: errorCodes.OK,
                effectPath: effectPath
            }
            return callback(null, res);
        }
        return callback(null, res);
    });


}

/** 领取红包 */
Handler.GetHongBao = function(roleID, marryID, callback){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    var gustsName = player.GetPlayerInfo(ePlayerInfo.NAME);
    var marryLevel = 0;
    var wedding;
    var marryName = '';
    var marryToName = '';

    if(!!self.getHongBao[roleID]){
        if(self.getHongBao[roleID].length>=defaultValues.wedding_hongbao_num){
            return callback(null, {result: errorCodes.WEDDING_NOT_GET_HONGBAO});
        }
        for(var h in self.getHongBao[roleID]){
            if(marryID == self.getHongBao[roleID][h]){
                return callback(null, {result: errorCodes.WEDDING_ALREADY_GET_HONGBAO});
            }
        }
    }else{
        self.getHongBao[roleID] = [];
    }

    if(!self.marryGusts[marryID]){
        return callback(null, {result: errorCodes.WEDDING_NOT_BLESS});
    }else{
        var gusts = null;
        for(var g in self.marryGusts[marryID]){
            if(gustsName == self.marryGusts[marryID][g]['gustsName']){
                gusts = self.marryGusts[marryID][g];
            }
        }
        if(null == gusts){
            return callback(null, {result: errorCodes.WEDDING_NOT_BLESS});
        }
    }

    for(var m in self.weddingList){
        if(marryID == self.weddingList[m]['roleID']){
            wedding = self.weddingList[m];
            marryLevel = wedding['marryLevel'];
            marryName = wedding['roleName'];
            marryToName = wedding['toMarryName'];
            break;
        }
    }
    if(0 >= wedding['hongBaoNum']){
        return callback(null, {result: errorCodes.WEDDING_NOT_MORE_HONGBAO});
    }
    if(marryLevel == 0) {
        return callback(null, {result: errorCodes.WEDDING_WID_NOT});
    }

    var wedLevelTemp = templateManager.GetTemplateByID('weddingLevelTemplate', marryLevel);
    var minNum = wedLevelTemp[tWeddingLevel.giftMin];
    var maxNum = wedLevelTemp[tWeddingLevel.giftMax];
    var giftThreshold = wedLevelTemp[tWeddingLevel.giftThreshold];
    var assesID = wedLevelTemp[tWeddingLevel.assesID];
    var assesIcon = wedLevelTemp[tWeddingLevel.assesIcon];
    var money = GetRandomNum(minNum, maxNum);
    if(money >= giftThreshold){
        var gongGaoID = 'tgm_infor_5';
        //需要发送公告
        self.SendReGM(gameConst.eGmType.Wedding, 0, gongGaoID, [gustsName, marryName, marryToName, money], function (err, res) { //
        });

    }
    //添加财产
    var assets = {
        tempID : assesID,
        value : money
    };
    pomelo.app.rpc.cs.csRemote.GetMarryHongBao(null, player["csID"], roleID, assets, gameConst.eAssetsChangeReason.Add.WeddingHongBaoReward, function(err, res){
        if (!!err) {
            logger.error("Error while GetHongBao: %s", utils.getErrorMessage(err));
        }
        if(0 == res){
            self.getHongBao[roleID].push(marryID);
            for(var g in self.marryGusts[marryID]){
                if(gustsName == self.marryGusts[marryID][g]['gustsName']){
                    self.marryGusts[marryID][g]['tempID'] = assesIcon;
                    self.marryGusts[marryID][g]['value'] = money;
                }
            }
            //领取完之后减掉红包数量
            --wedding['hongBaoNum'];
            assets['result'] = errorCodes.OK;
            return callback(null, assets);
        }else{
            return callback(null, {result:res});
        }
    });
}


/** 排行榜操作 获取夫妻赠送礼物的信息  */
Handler.GetChartMarryGift = function(roleID, callback){
    var self = this;
    if(!self.marryInfo[roleID]){
        return callback(null, {result:errorCodes.MARRY_NOT_FIND});
    }
    var spouseID = roleID==self.marryInfo[roleID][eMarryInfo.roleID] ? self.marryInfo[roleID][eMarryInfo.toMarryID] : self.marryInfo[roleID][eMarryInfo.roleID];
    var marryLevel = self.marryInfo[roleID][eMarryInfo.marryLevel];
    //roleID 收到的礼物数量    这里要获取赠送的 所以roleID 反写成spouseID
    var resRoleGift = {};
    if(!self.marryGift[roleID]){
        resRoleGift = {
            roleID: spouseID,          //角色ID
            flowers: 0,         //花束
            kiss: 0,            //吻
            gifts: 0           //礼物
        }
    }else{
        resRoleGift = {
            roleID: spouseID,          //角色ID
            flowers: self.marryGift[roleID][eMarryGift.flowers],         //花束
            kiss: self.marryGift[roleID][eMarryGift.kiss],            //吻
            gifts: self.marryGift[roleID][eMarryGift.gifts]           //礼物
        }
    }
    //spouseID 收到的礼物数量
    var resToMarryGift = {};
    if(!self.marryGift[spouseID]){
        resToMarryGift = {
            roleID: roleID,          //角色ID
            flowers: 0,         //花束
            kiss: 0,            //吻
            gifts: 0           //礼物
        }
    }else{
        resToMarryGift = {
            roleID: roleID,          //角色ID
            flowers: self.marryGift[spouseID][eMarryGift.flowers],         //花束
            kiss: self.marryGift[spouseID][eMarryGift.kiss],            //吻
            gifts: self.marryGift[spouseID][eMarryGift.gifts]           //礼物
        }
    }
    var res = {
        result: errorCodes.OK,
        marryLevel:marryLevel,
        roleGift : resToMarryGift,
        toMarryGift:resRoleGift

    }
    return callback(null, res);

}


//给所有参加宾客发送特效
Handler.SendEffectWedding = function(gusts, spouseID, effactID, effectPath, wedroleID){
    var self = this;
    var route = 'SendEffectWedding';

    var Msg = {
        result: errorCodes.OK,
        effactID: effactID,
        effectPath: effectPath,
        roleID: wedroleID
    };
    for(var g in gusts){
        var roleID = gusts[g]['roleID'];
        var player = playerManager.GetPlayer(roleID);
        if(!!player){
            player.SendMessage(route, Msg);
        }

    }
    var player = playerManager.GetPlayer(spouseID);
    if(!!player) {
        player.SendMessage(route, Msg);
    }

}

//婚礼执行完毕  停止婚礼 清除缓存数据
Handler.StopWedding = function(nowWedding){
    var self = this;
    var route = 'StopWedding';
    var Allplayer = playerManager.GetAllPlayer();
    var Msg = {
        result: errorCodes.OK
    };
    //通知客户端停止婚礼
    for (var p in Allplayer) {
        var player = Allplayer[p];
        if (!!player) {
            player.SendMessage(route, Msg)
        }
    }

    //清理缓存
    //清理预约中已经举办完的婚礼
    for(var w in self.wedding) {
        if (nowWedding == self.wedding[w][eWedding.wedID]) {
            delete self.wedding[w];
        }
    }
    //当前举行婚礼ID
    self.nowWedding = 0;
    //当前举行的婚礼
    self.weddingList = [];
    //婚礼中宾客列表
    self.marryGusts = [];
    //宾客红包领取列表
    self.getHongBao = [];

}

//登陆玩家 查看当前是否有举办的婚礼
Handler.SendNowWedding = function(roleID, callback){
    var self = this;
    var route = 'SendWedding';

    var player = playerManager.GetPlayer(roleID);
    if(0 != self.nowWedding){
        var Msg = {
            result: errorCodes.OK
        };
        player.SendMessage(route, Msg);
    }

    self.SendYinYuan(roleID);
    //登陆时判断玩家的 姻缘值 是否到达0 如果已经为0直接离婚
    var notRead = 0;
    if(!!self.marryInfo[roleID]){
        var spouseID = roleID==self.marryInfo[roleID][eMarryInfo.roleID] ? self.marryInfo[roleID][eMarryInfo.toMarryID] : self.marryInfo[roleID][eMarryInfo.roleID];
        var yinYuan = self.YinYuanCount(roleID);
        if(yinYuan <= 0){
            self.marryInfo[roleID] = null;
            self.marryInfo[spouseID] = null;

            //删除离婚协议
            self.DelMarryLog(roleID, spouseID, 3);
            //清空爱的礼物记录
            var marryGift = {
                0: roleID,          //角色ID
                1: spouseID,          //配偶ID
                2: 0,         //花束
                3: 0,            //吻
                4: 0,           //礼物
                5: 0,       //当天已送出香吻次数  每天免费一次
                6: 0,       //当天已送出花束次数  每天免费一次  付费3次
                7: 0,       //当天花钱购买礼物次数  每天限制所有礼物一共6次
                8:0      //个人姻缘总值
            };
            self.marryGift[roleID] = marryGift;
            var marryGiftTo = {
                0: spouseID,          //角色ID
                1: roleID,          //配偶ID
                2: 0,         //花束
                3: 0,            //吻
                4: 0,           //礼物
                5: 0,       //当天已送出香吻次数  每天免费一次
                6: 0,       //当天已送出花束次数  每天免费一次  付费3次
                7: 0,       //当天花钱购买礼物次数  每天限制所有礼物一共6次
                8:0      //个人姻缘总值
            };
            self.marryGift[spouseID] = marryGiftTo;
            return callback(null, {result:1});
        }

        //结婚后互动的消息数
        for(var log in self.marryLog[spouseID]){
            if(0 == self.marryLog[spouseID][log][eMarryLog.state]){
                ++notRead;
            }
        }
    }
    return callback(null,{result:errorCodes.OK, notRead:notRead});
}


Handler.SendYinYuan = function(roleID){
    var self = this;
    var yinYuanRoute = 'SendYinYuan';
    var yinYuanMsg = {
        result: errorCodes.OK,
        yinYuanCount: 0
    };
    var player = playerManager.GetPlayer(roleID);
    if(!!self.marryInfo[roleID] && 1==self.marryInfo[roleID][eMarryInfo.state]) {
        var yinYuan = self.YinYuanCount(roleID);
        yinYuanMsg.yinYuanCount = yinYuan;
        if(!!player){
            player.SendMessage(yinYuanRoute, yinYuanMsg); //登陆同步姻缘
        }
    }

}

/**发送公告的一般 内容替换接口
 * @param gmType    公告类型
 * @param compareValue  首次类型公告的比较值
 * @param noticeID  公告ID
 * @param {Array}  params 替换参数
 * @param callback
 */
Handler.SendReGM = function(gmType, compareValue, noticeID, params, callback){
    var self = this;

    if(!noticeID) return;
    var noticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', noticeID);
    if (null != noticeTemplate) {
        //如果是合法的公告条目， 并且公告冷却时间已过
        if (null != noticeTemplate) {
            //公告内容
            var content = noticeTemplate[tNotice.noticeEndStr];
            for(var idx in params) {
                var re = '' + params[idx];
                var reg = '$' + idx;
                content = content.replace(reg, re);
            }
            //rpc请求发送公告
            pomelo.app.rpc.chat.chatRemote.SendChat(null, gmType, compareValue, content, callback);
        }
    }

};

/** 校验职业是否符合结婚  1战士 男 2刺客 女 3法师 女 4枪手 男 5召唤 女  */
Handler.jobMarryCheck = function(roleTemp, toMarryTemp){

    if(1==roleTemp || 4==roleTemp){ //男性
        if(1==toMarryTemp || 4==toMarryTemp){
            return false;
        }else{
            return true;
        }
    }else{ //女性
        if(1==toMarryTemp || 4==toMarryTemp){
            return true;
        }else{
            return false;
        }
    }
}

//随机红包金额
function GetRandomNum(Min, Max)
{
    var Range = Max - Min;
    var Rand = Math.random();
    return(Min + Math.round(Rand * Range));
}

//每天12点定时清除  爱的礼物赠送记录 主要是（花 和 吻 的限制）
Handler.Update12Info = function(){
    var self = this;
    for(var g in self.marryGift){
        self.marryGift[g][eMarryGift.giveFlowerNum] = 0;
        self.marryGift[g][eMarryGift.giveKissNum] = 0;
        self.marryGift[g][eMarryGift.giveGiftNum] = 0;
    }
    //清理夫妻日志 大于7天的将删除
    var nowDate = new Date();
    for(var g in self.marryLog){
        for(var l in self.marryLog[g]){
            var giveTime = new Date(self.marryLog[g][l][eMarryLog.giveTime]);
            if((nowDate-giveTime)/3600000 > 24){    //大于24小时则清除log
                delete self.marryLog[g][l];
            }
        }
    }

    //给所有姻缘值低于20%的玩家 发送预警警告
    for(var y in self.marryInfo){
        var yinYuan = self.YinYuanCount(y);
        //姻缘值低于20%时
        if(yinYuan <= defaultValues.marry_yinyuan*defaultValues.marry_yinyuan_error/100){
            self.sendMail(y, utils.done);
        }
        //小于0时候离婚更新排行榜
        if(yinYuan <= 0){
            //删除排行榜中数据
            var roleID = y;
            if(!!self.marryInfo[y]){
                var toMarryID = y == self.marryInfo[y][eMarryInfo.roleID] ? self.marryInfo[y][eMarryInfo.toMarryID] : self.marryInfo[y][eMarryInfo.roleID];
                pomelo.app.rpc.chart.chartRemote.deleteMarryChart(null, roleID+"+"+toMarryID, utils.done);
            }

        }

    }
}

//储存婚礼预约列表
Handler.UpdateWedding = function () {
    var self = this;
    var Info = '';
    for (var index in self.wedding) {
        var temp = self.wedding[index];
        Info += '(';
        for (var i = 0; i < eWedding.Max; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                Info += '\'' + value + '\'' + ',';
            }
            else {
                Info += value + ',';
            }
        }
        Info = Info.substring(0, Info.length - 1);
        Info += '),';
    }
    Info = Info.substring(0, Info.length - 1);
    var sqlString = utilSql.BuildSqlValues(self.wedding);

    if (sqlString !== Info) {
        logger.error(' wedding sqlString not equal:\n%j\n%j', sqlString, Info);
    }
    rsSql.UpdateWedding(Info, function (err) {
        if (!!err) {
            logger.error('存储婚礼预约列表失败啦: %s', utils.getErrorMessage(err));
        }
    });
};

//储存爱的礼物列表
Handler.UpdateMarryGift = function () {
    var self = this;
    var Info = '';
    for (var index in self.marryGift) {
        var temp = self.marryGift[index];
        if(!temp){
            continue;
        }
        Info += '(';
        for (var i = 0; i < eMarryGift.Max; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                Info += '\'' + value + '\'' + ',';
            }
            else {
                Info += value + ',';
            }
        }
        Info = Info.substring(0, Info.length - 1);
        Info += '),';
    }
    Info = Info.substring(0, Info.length - 1);
    var sqlString = utilSql.BuildSqlValues(self.marryGift);

    if (sqlString !== Info) {
        logger.error(' marryGift sqlString not equal:\n%j\n%j', sqlString, Info);
    }
    rsSql.UpdateMarryGift(Info, function (err) {
        if (!!err) {
            logger.error('存储爱的礼物列表失败啦: %s', utils.getErrorMessage(err));
        }
    });
};

//储存夫妻日志列表
Handler.UpdateMarryLog = function () {
    var self = this;
    var Info = '';
    for (var index in self.marryLog) {
        var marryRoleLog = self.marryLog[index];
        if(!marryRoleLog){
            continue;
        }
        for (var r in marryRoleLog) {
            var temp = marryRoleLog[r];
            if(!temp){
                continue;
            }
            Info += '(';
            for (var i = 0; i < eMarryLog.Max; ++i) {
                var value = temp[i];
                if (typeof  value == 'string') {
                    Info += '\'' + value + '\'' + ',';
                }
                else {
                    Info += value + ',';
                }
            }
            Info = Info.substring(0, Info.length - 1);
            Info += '),';
        }
    }
    Info = Info.substring(0, Info.length - 1);

    rsSql.UpdateMarryLog(Info, function (err) {
        if (!!err) {
            logger.error('存储夫妻日志列表失败啦: %s', utils.getErrorMessage(err));
        }
    });
};

//发送通知邮件  type 1 姻缘值预警提醒
Handler.sendMail = function(playerID, callback){
    //邮件通知
    var mailDetail = {
        recvID: +playerID,
        subject: stringValue.sMsString.sendName,
        mailType: gameConst.eMailType.System, //gameConst.eMailType.User
        content: stringValue.sMarryString.content_7,
        items:[]
    };
    //发送邮件
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, callback);
};
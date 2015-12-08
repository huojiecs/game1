/**
 * Created by bj on 2015/4/28.
 * 公会夺城战
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var Q = require('q');
var async = require('async');
var _ = require('underscore');
var config = require('../../tools/config');
var usSql = require('../../tools/mysql/usSql');
var errorCodes = require('../../tools/errorCodes');
var constValue = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateManager = require('../../tools/templateManager');
var templateConst = require('./../../../template/templateConst');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var redis = require("redis");
var playerManager = require('../../us/player/playerManager');
var utilSql = require('../../tools/mysql/utilSql');
var unionAnimal = require('./unionAnimal');
var unionManager = require('./unionManager');

var ePlayerInfo = gameConst.ePlayerInfo;
var eUnionInfo = constValue.eUnionInfo;
var eUnionMemberInfo = constValue.eUnionMemberInfo;
var eUnionLogInfo = constValue.eUnionLogInfo;
var eUnionRoleShopInfo = constValue.eUnionRoleShopInfo;
var eUnionMagicInfo = constValue.eUnionMagicInfo;

var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eUnionTempleInfo = gameConst.eUnionTempleInfo;
var ePlayerOfferInfo = gameConst.ePlayerOfferInfo;
var eUnionAnimal = gameConst.eUnionAnimal;
var eLeaveUnionCD = gameConst.eLeaveUnionCD;
var eCulture = gameConst.eCulture;

var Handler = module.exports;

Handler.Init = function () {
    this.InitUnionList();
};

/**
 * @param {function} cb 回调函数， 用于控制pomelo stop  cb 链
 * */
Handler.UpdateUnion = function (cb) {
    var self = this;
    self.SaveUnionList();
    self.SaveUnionMemberList();
    self.SaveUnionApplyList();
    self.SaveUnionLog();
    self.SaveRoleUnionShopInfo();
    self.SaveUnionMagicInfo();
    self.SaveUnionTempleInfo();
    self.SavePlayerOffer();
    self.SaveUnionGift();
    self.SaveUnionData();
    self.SaveUnionAnimalInfo();
    self.SavePlayerSignOut();
    self.SaveCultureLog();
    /** 上变都是同步加入队列*/
    cb();
};

// 加载所有公会数据信息
Handler.loadAll = function(dbIndex){
    var self = this;
    self.loadUnionList(dbIndex);
    self.loadUnionMemberList(dbIndex);
    self.loadUnionApplyList(dbIndex);
    self.loadUnionLogList(dbIndex);
    self.loadUnionRoleShopInfo(dbIndex);
    self.loadUnionMagicInfo(dbIndex);
    self.loadUnionTemple(dbIndex);
    self.LoadPlayerOffer(dbIndex);
    self.LoadUnionGift(dbIndex);
    self.LoadUnionReceiveGift(dbIndex);
    self.LoadUnionData(dbIndex);
    self.loadUnionAnimal(dbIndex);
    self.loadMemFightDamageList(dbIndex);
    self.loadUnionsDamage(dbIndex);
    self.LoadPlayerSignOut(dbIndex);
    self.LoadUnionCultureLog(dbIndex);
};

Handler.InitUnionList = function () {
    var self = this;
    if (_.isArray(config.mysql.game)) {
        for (var i = 0; i < config.mysql.global.loopCount; ++i) {
            self.loadAll(i);
        }
    } else {
        self.loadAll(0);
    }
    Q.resolve();
};

// s l
Handler.SaveUnionList = function () {
    var self = this;
    _.each(unionManager.GetAllUnion(), function (union, unionID) {
        if (!union || !unionID) {
            return;
        }
        var unionArray = self.GetUnionInfoArray(union);
        if (!unionArray) {
            return;
        }
        //mysql格式化
        if(!!unionArray[eUnionInfo.announcement]){
            unionArray[eUnionInfo.announcement] = utilSql.MysqlEncodeString(unionArray[eUnionInfo.announcement]);
        }
        var unionInfoSqlStr = self.GetUnionInfoSqlStr(unionArray);
        unionManager.enterQueue('SaveUnion', unionID, unionInfoSqlStr, utils.done);
    });
};

Handler.SaveUnionMemberList = function () {
    var self = this;
    _.each(unionManager.unionMemberList, function (member, roleID) {
        if (!member || !roleID) {
            return;
        }
        var unionID = member.unionID;
        var unionArray = self.GetMemInfoArray(member, eUnionMemberInfo);
        if (!unionArray) {
            return;
        }
        var unionMemberInfoSqlStr = self.GetUnionMemberInfoSqlStr(unionArray);
        unionManager.enterQueue('SaveUnionMember', unionID, [roleID, unionMemberInfoSqlStr], utils.done);
    });
};

// 存成员伤害信息
Handler.SaveUnionMemFightDamage = function () {
    var self = this;
    _.each(unionManager.unionMemFightDamage, function (member, roleID) {
        if (!member || !roleID) {
            return;
        }
        var unionID = member.unionID;
        var unionArray = unionManager.union.convertJsonToArray(member, gameConst.eUnionMemFightDamage);
        if (!unionArray) {
            return;
        }
        var unionMemberInfoSqlStr = utilSql.BuildSqlValues(new Array(unionArray));
        unionManager.enterQueue('SaveMemFightDamage', unionID, [roleID, unionMemberInfoSqlStr], utils.done);
    });
};

//
Handler.SaveUnionApplyList = function () {
    var self = this;
    _.each(unionManager.unionApplyList, function (unionApply, unionID) {
        if (!unionApply || !unionID) {
            return;
        }
        var unionApplyArray = self.GetUnionApplyInfoArray(unionApply);
        if (!unionApplyArray) {
            return;
        }
        var unionMemberInfoSqlStr = self.GetUnionApplyInfoSqlStr(unionApplyArray);
        unionManager.enterQueue('SaveUnionApply', unionID, unionMemberInfoSqlStr, utils.done);
    });
};


Handler.SaveUnionLog = function () {
    var self = this;
    _.each(unionManager.unionLogList, function (unionLog, unionID) {
        if (!unionLog || !unionID) {
            return;
        }
        var unionLogArray = self.GetUnionLogArray(unionLog, eUnionLogInfo);
        if (!unionLogArray) {
            return;
        }
        var unionLogSqlStr = self.GetUnionLogSqlStr(unionLogArray);
        unionManager.enterQueue('SaveUnionLogList', unionID, unionLogSqlStr, utils.done);
    });
};


Handler.SaveCultureLog = function () {
    var self = this;
    _.each(unionManager.cultureLogs, function (unionLog, unionID) {
        if (!unionLog || !unionID) {
            return;
        }
        var unionLogArray = self.GetUnionLogArray(unionLog, eCulture);
        if (!unionLogArray) {
            return;
        }
        var unionLogSqlStr = self.GetUnionLogSqlStr(unionLogArray);
        unionManager.enterQueue('SaveCultureLogList', unionID, unionLogSqlStr, utils.done);
    });
};

/***
 * 保存玩家商店购买信息
 */
Handler.SaveRoleUnionShopInfo = function () {
    var self = this;
    _.each(unionManager.unionRoleShopInfo, function (roleShopInfo, roleID) {
        if (!roleShopInfo || !roleID) {
            return;
        }
        var roleUnionShopArray = self.GetRoleUnionShopArray(roleID, roleShopInfo);
        if (!roleUnionShopArray) {
            return;
        }
        var unionRoleShopSqlStr = self.GetRoleUnionShopSqlStr(roleUnionShopArray);
        unionManager.enterQueue('SaveRoleUnionShopInfo', roleID, unionRoleShopSqlStr, utils.done);
    });
};

/***
 * 保存公会技能信息
 */
Handler.SaveUnionMagicInfo = function () {
    var self = this;
    _.each(unionManager.unionMagicInfo, function (magicInfo, unionID) {
        if (!magicInfo || !unionID) {
            return;
        }
        var unionArray = self.GetUnionMagicArray(unionID, magicInfo);
        if (!unionArray) {
            return;
        }
        var unionStr = self.GetUnionMagicSqlStr(unionArray);
        unionManager.enterQueue('SaveUnionMagicInfo', unionID, unionStr, utils.done);
    });
};

/***
 * 保存公会神殿信息
 */
Handler.SaveUnionTempleInfo = function () {
    var self = this;
    _.each(unionManager.unionTempleInfo, function (union, unionID) {
        if (!union || !unionID) {
            logger.error('temple info cant save by info is null .unionID is %j, unionInfo is %j', unionID, union);
            return;
        }
        var unionArray = self.GetInfo(union, eUnionTempleInfo);
        if (!unionArray) {
            logger.error('temple info cant save unionArray is null ', unionArray);
            return;
        }
        var unionInfoSqlStr = self.GetUnionInfoSqlStr(unionArray);
        unionManager.enterQueue('SaveUnionTemple', unionID, unionInfoSqlStr, utils.done);
    });
};

/***
 * 保存角色祭拜信息
 */
Handler.SavePlayerOffer = function () {
    var self = this;
    _.each(unionManager.playerOfferInfo, function (union, unionID) {
        if (!union || !unionID) {
            return;
        }
        var unionArray = self.GetInfo(union, ePlayerOfferInfo);
        if (!unionArray) {
            return;
        }
        var unionInfoSqlStr = self.GetUnionInfoSqlStr(unionArray);
        unionManager.enterQueue('SavePlayerOffer', unionID, unionInfoSqlStr, utils.done);
    });
};


/***
 * 保存角色祭拜信息
 */
Handler.SavePlayerSignOut = function () {
    var self = this;
    _.each(unionManager.playerSignOutTime, function (union, unionID) {
        if (!union || !unionID) {
            return;
        }
        var unionArray = self.GetInfo(union, eLeaveUnionCD);
        if (!unionArray) {
            return;
        }
        var unionInfoSqlStr = utilSql.BuildSqlValues(new Array(unionArray));
        unionManager.enterQueue('SavePlayerSignOut', unionID, unionInfoSqlStr, utils.done);
    });
};

/***
 * 保存公会神兽信息
 */
Handler.SaveUnionAnimalInfo = function () {
    var self = this;
    _.each(unionManager.unionAnimalList, function (union, unionID) {
        if (!union || !unionID) {
            logger.error('Animal info cant save by info is null .unionID is %j, unionInfo is %j', unionID, union);
            return;
        }

        var animal = unionManager.union.convertArrayToJson(union.animalInfo, eUnionAnimal);
        var unionArray = self.GetInfo(animal, eUnionAnimal);
        if (!unionArray) {
            logger.error('Animal info cant save unionArray is null ', unionArray);
            return;
        }
        var unionInfoSqlStr = self.GetUnionInfoSqlStr(unionArray);
        unionManager.enterQueue('SaveUnionAnimal', unionID, unionInfoSqlStr, utils.done);
    });
};

/***
 * 保存公会伤害信息
 */
Handler.SaveUnionsDamage = function () {
    var self = this;
    _.each(unionManager.unionDamageInfo, function (union, unionID) {
        if (!union || !unionID) {
            logger.error('damage info cant save by info is null .unionID is %j, unionInfo is %j', unionID, union);
            return;
        }
        var unionArray = self.GetInfo(union, gameConst.eUnionDamageInfo);
        if (!unionArray) {
            logger.error('damage info cant save unionArray is null ', unionArray);
            return;
        }
        var unionInfoSqlStr = self.GetUnionInfoSqlStr(unionArray);
        unionManager.enterQueue('SaveUnionsDamage', unionID, unionInfoSqlStr, utils.done);
    });
};

// 加载
Handler.loadUnionTemple = function (i) {
    var self = this;
    usSql.LoadUnionTemple(i, function (err, unions) {
        if (!!err) {
            logger.error("Error while loadUnionTemple: %s", utils.getErrorMessage(err));
        }
        for (var u in unions) {
            var unionID = unions[u].unionID;
            unionManager.unionTempleInfo[unionID] = unions[u];
        }
        unionManager.isTempleLoad = true;
    });
};

// 加载
Handler.loadUnionAnimal= function (i) {
    var self = this;
    usSql.LoadUnionAnimal(i, function (err, unions) {
        if (!!err) {
            logger.error("Error while loadUnionAnimal: %s", utils.getErrorMessage(err));
        }
        for (var u in unions) {
            var unionID = unions[u].unionID;

            var animal = new unionAnimal();
            animal.animalInfo = unionManager.union.convertJsonToArray(unions[u], eUnionAnimal);
            unionManager.unionAnimalList[unionID] = animal;
        }
    });
};

// 加载
Handler.loadUnionsDamage = function (i) {
    var self = this;
    usSql.loadUnionsDamage(i, function (err, unions) {
        if (!!err) {
            logger.error("Error while loadUnionsDamage: %s", utils.getErrorMessage(err));
        }
        for (var u in unions) {
            var unionID = unions[u].unionID;
            unionManager.unionDamageInfo[unionID] = unions[u];
        }
        unionManager.makeSortUnionsDamage();
    });
};

// 加载
Handler.LoadPlayerOffer = function (i) {
    var self = this;
    usSql.LoadPlayerOffer(i, function (err, unions) {
        if (!!err) {
            logger.error("Error while LoadPlayerOffer: %s", utils.getErrorMessage(err));
        }
        for (var u in unions) {
            var roleID = unions[u].roleID;
            unionManager.playerOfferInfo[roleID] = unions[u];
        }
        unionManager.isOfferLoad = true;
    });
};

// 加载
Handler.LoadPlayerSignOut = function (i) {
    var self = this;
    usSql.loadUnionDataSql(i, 'playersignout', function (err, unions) {
        if (!!err) {
            logger.error("Error while LoadPlayerSignOut: %s", utils.getErrorMessage(err));
        }
        for (var u in unions) {
            var roleID = unions[u].roleID;
            unionManager.playerSignOutTime[roleID] = unions[u];
            unionManager.playerSignOutTime[roleID].leaveTime = utilSql.DateToString(new Date(unionManager.playerSignOutTime[roleID].leaveTime));
        }
    });
};


// 加载
Handler.loadUnionList = function (i) {
    var self = this;
    usSql.LoadUnions(i, function (err, unions) {
        if (!!err) {
            logger.error("Error while loadUnionList: %s", utils.getErrorMessage(err));
        }

        for (var u in unions) {
            var unionID = unions[u].unionID;
            unionManager.AddUnion(unionID, unions[u]);
            if(unions[u].isDuke > 0){
                unionManager.dukeUnion = unions[u];
            }
            if(!!unions[u].announcement){
                //mysql格式化
                unions[u].announcement = utilSql.MysqlDecodeString(unions[u].announcement);
            }
        }
        unionManager.isUnionLoad = true;
    });
};


Handler.loadUnionLogList = function (i) {
    var self = this;
    usSql.UnionLoad(i, 'unionlog', function (err, unionLog) {
        if (!!err) {
            logger.error("Error while loadUnionList: %s", utils.getErrorMessage(err));
        }
        for (var u in unionLog) {
            var unionID = unionLog[u].unionID;
            if (!unionManager.unionLogList[unionID]) {
                var logs = [];
                unionLog[u].createTime = utilSql.DateToString(new Date(unionLog[u].createTime));
                logs.unshift(unionLog[u]);
                unionManager.unionLogList[unionID] = logs;
            } else {
                unionLog[u].createTime = utilSql.DateToString(new Date(unionLog[u].createTime));
                unionManager.unionLogList[unionID].unshift(unionLog[u]);
            }
        }
        unionManager.isLogLoad = true;
    });
};

//
Handler.LoadUnionCultureLog = function (i) {
    var self = this;
    usSql.UnionLoad(i, 'unionculture', function (err, unionLog) {
        if (!!err) {
            logger.error("Error while LoadUnionCultureLog: %s", utils.getErrorMessage(err));
        }
        for (var u in unionLog) {
            var unionID = unionLog[u].unionID;
            if (!unionManager.cultureLogs[unionID]) {
                var logs = [];
                unionLog[u].createTime = utilSql.DateToString(new Date(unionLog[u].createTime));
                logs.unshift(unionLog[u]);
                unionManager.cultureLogs[unionID] = logs;
            } else {
                unionLog[u].createTime = utilSql.DateToString(new Date(unionLog[u].createTime));
                unionManager.cultureLogs[unionID].unshift(unionLog[u]);
            }
        }
    });
};

Handler.loadUnionMemberList = function (i) {
    var self = this;
    usSql.loadUnionMembers(i, function (err, unionMembers) {
        if (!!err) {
            logger.error("Error while loadUnionMemberList: %s", utils.getErrorMessage(err));
        }
        for (var um in unionMembers) {
            var roleID = unionMembers[um].roleID;
            var playerWeiWang = unionMembers[um].playerWeiWang;
            var playerDevote = unionMembers[um].playerDevote;
            var devoteInit = unionMembers[um].devoteInit;
            if (playerDevote <= 0 && devoteInit == 0) {
                unionMembers[um].playerDevote = playerWeiWang;
                unionMembers[um].devoteInit = 1;
            }
            unionMembers[um].createTime = utilSql.DateToString(new Date(unionMembers[um].createTime));
            unionMembers[um].logTime = utilSql.DateToString(new Date(unionMembers[um].logTime));
            unionManager.AddMember(roleID, unionMembers[um]);
        }
        unionManager.isMemberLoad = true;
    });
};

Handler.loadMemFightDamageList = function (i) {
    var self = this;
    usSql.loadMemFightDamage(i, function (err, unionMembers) {
        if (!!err) {
            logger.error("Error while loadMemFightDamageList: %s", utils.getErrorMessage(err));
        }
        for (var um in unionMembers) {
            var roleID = unionMembers[um].roleID;
            unionManager.unionMemFightDamage[roleID] = unionMembers[um];
        }

        unionManager.makeSortMemDamage();
    });
};

/**
 * 加载玩家购买次数
 ***/
Handler.loadUnionRoleShopInfo = function (i) {
    var self = this;
    usSql.loadUnionRoleShopInfo(i, function (err, unionShops) {
        if (!!err) {
            logger.error("Error while loadUnionRoleShopInfo: %s", utils.getErrorMessage(err));
        }
        for (var us in unionShops) {
            var roleShopInfo = unionShops[us];
            var roleID = roleShopInfo['roleID'];
            var unionGoodsID = roleShopInfo['unionGoodsID'];
            var buyNum = roleShopInfo['buyNum'];
            if(buyNum <= 0){
                continue;
            }
            if (!unionManager.unionRoleShopInfo[roleID]) {
                var GoodsInfo = {};
                GoodsInfo[unionGoodsID] = buyNum;
                unionManager.unionRoleShopInfo[roleID] = GoodsInfo;
            } else {
                var GoodsInfo = unionManager.unionRoleShopInfo[roleID];
                GoodsInfo[unionGoodsID] = buyNum;
                unionManager.unionRoleShopInfo[roleID] = GoodsInfo;
            }
        }
        unionManager.isShopLoad = true;
    });
};

/**
 * 加载公会技能信息
 ***/
Handler.loadUnionMagicInfo = function (i) {
    var self = this;
    usSql.loadUnionMagicInfo(i, function (err, unionMagic) {
        if (!!err) {
            logger.error("Error while loadUnionMagicInfo: %s", utils.getErrorMessage(err));
        }

        for (var us in unionMagic) {
            var magicInfo = unionMagic[us];
            var unionID = magicInfo['unionID'];
            var magicID = magicInfo['magicID'];
            var magicLevel = magicInfo['magicLevel'];
            if (unionManager.unionMagicInfo[unionID] != null ) {
                unionManager.unionMagicInfo[unionID][magicID]= magicLevel;
            } else {
                var magic = {};
                magic[magicID] = magicLevel;
                unionManager.unionMagicInfo[unionID] = magic;
            }
        }

        unionManager.isMagicLoad = true;
    });
};


// 公会申请信息
Handler.loadUnionApplyList = function (i) {
    usSql.loadUnionApplySql(i, function (err, unionApply) {
        if (!!err) {
            logger.error("Error while loadUnionApplyList: %s", utils.getErrorMessage(err));
        }
        for (var ua in unionApply) {
            var unionID = unionApply[ua].unionID;
            unionManager.AddUnionApply(unionID, unionApply[ua]);
        }

        unionManager.isUnionApplyLoad = true;
    });
};


/** 加载公会红包  */
Handler.LoadUnionGift = function (i) {
    var self = this;
    var tabName = 'uniongiftsend';
    usSql.loadUnionGiftSql(i, tabName, function (err, unionGiftSend) {
        if (!!err) {
            logger.error("Error while LoadUnionGift: %s", utils.getErrorMessage(err));
        }
        for (var s in unionGiftSend) {
            unionGiftSend[s].createTime = utilSql.DateToString(new Date(unionGiftSend[s].createTime));
            var unionID = unionGiftSend[s].unionID;
            var roleID = unionGiftSend[s].roleID;
            if(!unionManager.unionGiftSend[unionID]){
                unionManager.unionGiftSend[unionID] = {};
            }
            unionManager.unionGiftSend[unionID][roleID] =  unionGiftSend[s];

        }
        logger.fatal("****LoadUnionGift unionGiftSend: %j  ",self.unionGiftSend );
    });
};

/**
 * 加载已领取红包
 * */
Handler.LoadUnionReceiveGift = function (i) {
    var self = this;
    var tabName = 'uniongiftreceive';
    usSql.loadUnionGiftSql(i, tabName, function (err, unionGiftReceive ) {
        if (!!err) {
            logger.error("Error while LoadUnionGift: %s", utils.getErrorMessage(err));
        }
        for (var r in unionGiftReceive) {
            unionGiftReceive[r].createTime = utilSql.DateToString(new Date(unionGiftReceive[r].createTime));
            var roleID = unionGiftReceive[r].roleID;
            var fromID = unionGiftReceive[r].fromID;
            if(!unionManager.unionGiftReceive[roleID]){
                unionManager.unionGiftReceive[roleID] = {}
            }
            unionManager.unionGiftReceive[roleID][fromID] = unionGiftReceive[r];
        }
        logger.fatal("****LoadUnionGift  unionGiftReceive: %j ", unionManager.unionGiftReceive );
    });
};


/**
 * 加载公会炼狱次数
 * */
Handler.LoadUnionData = function (i) {
    var self = this;
    var tabName = 'uniondata';
    usSql.loadUnionDataSql(i, tabName, function (err, unionData ) {
        if (!!err) {
            logger.error("Error while LoadUnionGift: %s", utils.getErrorMessage(err));
        }
        for (var r in unionData) {
            var unionID = unionData[r].unionID;

            unionManager.unionData[unionID] = unionData[r];
        }
        logger.fatal("****LoadUnionData_lianYuCount  LoadUnionData_lianYuCount : %j ", unionManager.unionData );
    });
};

/**
 * 存储公会数据（公会炼狱次数）
 * */
Handler.SaveUnionData = function () {
    var self = this;
    _.each(unionManager.unionData, function (data, unionID) {
        if (!data || !unionID) {
            return;
        }

        logger.fatal("****SaveUnionData  uniondata:   %j ,  ", unionManager.unionData);
        var dataInfo = {}
        dataInfo[unionID] = data;
        var unionDataSql = self.GetUnioDataSqlStr(dataInfo);
        unionManager.enterQueue('SaveUnionData',unionID, ["uniondata",unionID, unionDataSql], utils.done);
    });

}

/**
 * 存储公会红包
 * */
Handler.SaveUnionGift = function () {
    var self = this;
    //送出红包
    _.each(unionManager.unionGiftSend, function (gift, unionID) {
        if (!gift || !unionID) {
            return;
        }
        logger.fatal("****SaveUnionGiftSend  unionGiftSend:  gift: %j , unionID: %j ", gift, unionID );
        var unionGiftSql = self.GetUnionGiftInfoSqlStr(gift);
        unionManager.enterQueue('SaveUnionGiftSend', unionID, ["uniongiftsend", unionID, unionGiftSql], utils.done);
    });
    //领取的红包
    _.each(unionManager.unionGiftReceive, function (gift, roleId) {
        if (!gift || !roleId) {
            return;
        }
        logger.fatal("****SaveUnionGiftReceive  unionGiftReceive: gift: %j , roleId: %j ", gift, roleId );
        var unionGiftSql = self.GetUnionGiftInfoSqlStr(gift);
        unionManager.enterQueue('SaveUnionGiftReceive', roleId, ["uniongiftreceive", roleId, unionGiftSql], utils.done);
    });
};


/**
 * sql 语句部分
 */
Handler.GetUnionInfoArray = function (union) {
    if (!union) {
        return false;
    }
    var unionInfo = new Array(eUnionInfo.MAX);
    for (var u in union) {
        unionInfo[eUnionInfo[u]] = union[u];
    }
    return unionInfo;
};

// 得到公会成员类型的数组
Handler.GetMemInfoArray = function (member, info) {
    if (!member) {
        return false;
    }
    var memberArray = new Array(info.MAX);
    for (var m in member) {
        memberArray[eUnionMemberInfo[m]] = member[m];
    }
    return memberArray;
};


Handler.GetUnionApplyInfoArray = function (unionApply) {
    if (!unionApply) {
        return false;
    }
    var unionApplyArray = [];
    unionApplyArray[0] = unionApply.unionID;
    unionApplyArray[1] = unionApply.applyList;
    return unionApplyArray;
};
Handler.GetUnionLogArray = function (unionLog, elogInfo) {
    if (!unionLog || !elogInfo) {
        return false;
    }
    var unionLogArray = [];
    for (var u in unionLog) {
        var logArray = new Array(elogInfo.MAX);
        for (var l in unionLog[u]) {
            logArray[elogInfo[l]] = unionLog[u][l];
        }
        unionLogArray.unshift(logArray);
    }
    return unionLogArray;
};
/**
 * 获取商城信息数组
 */
Handler.GetRoleUnionShopArray = function (roleID, roleUnionShopInfo) {
    if (!roleUnionShopInfo || !roleID) {
        return false;
    }
    var roleUnionShopArray = [];
    for (var u in roleUnionShopInfo) {
        var goodsArray = new Array(eUnionRoleShopInfo.MAX);
        goodsArray[eUnionRoleShopInfo.roleID] = +roleID;
        goodsArray[eUnionRoleShopInfo.unionGoodsID] = +u;
        goodsArray[eUnionRoleShopInfo.buyNum] = roleUnionShopInfo[u];
        roleUnionShopArray.unshift(goodsArray);
    }
    return roleUnionShopArray;
};

/**
 * 获取技能信息数组
 */
Handler.GetUnionMagicArray = function (unionID, magicInfo) {
    if (!magicInfo || !unionID) {
        return false;
    }
    var tempArray = [];
    for (var u in magicInfo) {
        var tMagic = new Array(eUnionMagicInfo.MAX);
        tMagic[eUnionMagicInfo.unionID] = +unionID;
        tMagic[eUnionMagicInfo.magicID] = +u;
        tMagic[eUnionMagicInfo.magicLevel] = magicInfo[u];
        tempArray.unshift(tMagic);
    }
    return tempArray;
};


Handler.GetInfo = function(infoData, eInfo){
    if (!infoData|| !eInfo) {
        return false;
    }
    var tempArray = new Array(eInfo.MAX);
    for (var u in infoData) {
        tempArray[eInfo[u]] = infoData[u];
    }

    return tempArray;
}


Handler.GetUnionInfoSqlStr = function (unionInfo) {
    var strInfo = '(';
    for (var t in unionInfo) {
        if (t < unionInfo.length - 1) {
            if (typeof (unionInfo[t]) == 'string') {
                strInfo += "'" + unionInfo[t] + "',";
            } else {
                strInfo += unionInfo[t] + ',';
            }
        } else {
            if (t != "undefined") {
                strInfo += unionInfo[t] + ')';
            }
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(unionInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;

};
Handler.GetUnionMemberInfoSqlStr = function (unionMemberInfo) {
    var strInfo = '(';
    for (var t in unionMemberInfo) {
        if (t < unionMemberInfo.length - 1) {
            if (typeof (unionMemberInfo[t]) == 'string') {
                strInfo += "'" + unionMemberInfo[t] + "',";
            } else {
                strInfo += unionMemberInfo[t] + ',';
            }
        } else {
            if (t != "undefined") {
                strInfo += '\'' + unionMemberInfo[t] + '\')';
            }
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(unionMemberInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;

};

Handler.GetUnionApplyInfoSqlStr = function (unionApplyInfo) {

    var strInfo = '(';
    for (var t in unionApplyInfo) {
        if (t < unionApplyInfo.length - 1) {
            if (typeof (unionApplyInfo[t]) == 'string') {
                strInfo += "'" + unionApplyInfo[t] + "',";
            } else {
                strInfo += unionApplyInfo[t] + ',';
            }
        } else {
            if (t != "undefined") {
                strInfo += '\'' + unionApplyInfo[t] + '\')';
            }
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(unionApplyInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;

};

Handler.GetUnionLogSqlStr = function (unionLogArray) {
    var str = '';
    for (var u in unionLogArray) {
        if (u < unionLogArray.length - 1) {
            var strInfo = '(';
            for (var t in unionLogArray[u]) {
                if (t < unionLogArray[u].length - 1) {
                    if (typeof (unionLogArray[u][t]) == 'string') {
                        strInfo += "'" + unionLogArray[u][t] + "',";
                    } else {
                        strInfo += unionLogArray[u][t] + ',';
                    }
                } else {
                    if (t != "undefined") {
                        strInfo += '\'' + unionLogArray[u][t] + '\')';
                    }
                }
            }
            str += strInfo + ',';
        } else {
            var strInfo = '(';
            for (var t in unionLogArray[u]) {
                if (t < unionLogArray[u].length - 1) {
                    if (typeof (unionLogArray[u][t]) == 'string') {
                        strInfo += "'" + unionLogArray[u][t] + "',";
                    } else {
                        strInfo += unionLogArray[u][t] + ',';
                    }
                } else {
                    if (t != "undefined") {
                        strInfo += '\'' + unionLogArray[u][t] + '\')';
                    }
                }
            }
            str += strInfo;
        }

    }
    var sqlString = utilSql.BuildSqlValues(unionLogArray);
    if (sqlString !== str) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, str);
    }

    return sqlString;
};

Handler.GetRoleUnionShopSqlStr = function (roleUnionShopArray) {
    var str = '';
    for (var u in roleUnionShopArray) {
        if (u < roleUnionShopArray.length - 1) {
            var strInfo = '(';
            for (var t in roleUnionShopArray[u]) {
                if (t < roleUnionShopArray[u].length - 1) {
                    if (typeof (roleUnionShopArray[u][t]) == 'string') {
                        strInfo += "'" + roleUnionShopArray[u][t] + "',";
                    } else {
                        strInfo += roleUnionShopArray[u][t] + ',';
                    }
                } else {
                    if (t != "undefined") {
                        strInfo += roleUnionShopArray[u][t] + ')';
                    }
                }
            }
            str += strInfo + ',';
        } else {
            var strInfo = '(';
            for (var t in roleUnionShopArray[u]) {
                if (t < roleUnionShopArray[u].length - 1) {
                    if (typeof (roleUnionShopArray[u][t]) == 'string') {
                        strInfo += "'" + roleUnionShopArray[u][t] + "',";
                    } else {
                        strInfo += roleUnionShopArray[u][t] + ',';
                    }
                } else {
                    if (t != "undefined") {
                        strInfo += roleUnionShopArray[u][t] + ')';
                    }
                }
            }
            str += strInfo;
        }

    }
    var sqlString = utilSql.BuildSqlValues(roleUnionShopArray);
    if (sqlString !== str) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, str);
    }

    return sqlString;
};

Handler.GetUnionMagicSqlStr = function (roleUnionShopArray) {
    var str = '';
    for (var u in roleUnionShopArray) {
        if (u < roleUnionShopArray.length - 1) {
            var strInfo = '(';
            for (var t in roleUnionShopArray[u]) {
                if (t < roleUnionShopArray[u].length - 1) {
                    if (typeof (roleUnionShopArray[u][t]) == 'string') {
                        strInfo += "'" + roleUnionShopArray[u][t] + "',";
                    } else {
                        strInfo += roleUnionShopArray[u][t] + ',';
                    }
                } else {
                    if (t != "undefined") {
                        strInfo += roleUnionShopArray[u][t] + ')';
                    }
                }
            }
            str += strInfo + ',';
        } else {
            var strInfo = '(';
            for (var t in roleUnionShopArray[u]) {
                if (t < roleUnionShopArray[u].length - 1) {
                    if (typeof (roleUnionShopArray[u][t]) == 'string') {
                        strInfo += "'" + roleUnionShopArray[u][t] + "',";
                    } else {
                        strInfo += roleUnionShopArray[u][t] + ',';
                    }
                } else {
                    if (t != "undefined") {
                        strInfo += roleUnionShopArray[u][t] + ')';
                    }
                }
            }
            str += strInfo;
        }

    }
    var sqlString = utilSql.BuildSqlValues(roleUnionShopArray);
    if (sqlString !== str) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, str);
    }

    return sqlString;
};

Handler.GetUnionGiftInfoSqlStr = function (giftInfo) {
    logger.fatal("****GetUnionGiftInfoSqlStr: %j", giftInfo);
    var sqlStr = '';
    for (var index in giftInfo) {
        var temp = giftInfo[index];
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
    var sqlString = utilSql.BuildSqlValues(giftInfo);

    if (sqlString !== sqlStr) {
        logger.error('GetUnionGiftInfoSqlStr sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;

};

Handler.GetUnioDataSqlStr = function (dataInfo) {
    logger.fatal("****GetUnioDataSqlStr: %j", dataInfo);
    var sqlStr = '';
    for (var index in dataInfo) {
        var temp = dataInfo[index];
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
    var sqlString = utilSql.BuildSqlValues(dataInfo);

    if (sqlString !== sqlStr) {
        logger.error('GetUnioDataSqlStr sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;
};

/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午12:03
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var util = require('util');
var _ = require('underscore');
var Character = require('./Character');
var AssetsManager = require('./../assets/assetsManager');
var AttManager = require('./../attribute/attManager');
var itemManager = require('../item/itemManager');
var EquipManager = require('./../equip/equipManager');
var cutsomManager = require('./../custom/customManager');
var skillManager = require('./../skill/skillManager');
var runeManager = require('./../skill/runeManager');
var soulManager = require('./../soul/soulManager');
var missionManager = require('./../mission/missionManager');
var achieveManager = require('./../achieve/achieveManager');
var activityManager = require('./../activity/activityManager');
var asyncPvPManager = require('./../pvp/asyncPvPManager');
var niuDanManager = require('./../niuDan/niuDanManager');
var playerManager = require('../../ps/player/playerManager');
var shopManager = require('./../shop/shopManager');
var giftManager = require('./../gift/giftManager');
var gameConst = require('../../tools/constValue');
var config = require('../../tools/config');
var utils = require('../../tools/utils');
var tbLogClient = require('../../tools/mysql/tbLogClient');
var globalFunction = require('../../tools/globalFunction');
var magicSoulManager = require('./../magicSoul/magicSoulManager');
var flopManager = require('./../flop/flopManager');
var treasureBoxManager = require('./../treasureBox/treasureBoxManager');
var alchemyManager = require('./../alchemy/alchemyManager');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var PhysicalManager = require('./../physical/physicalManager');
var climbManager = require('./../climb/climbManager');
var qqManager = require('./../qq/qqManager');
var CmgeManager = require('./../vendors/cmge/CmgeManager');
var mineManager = require('./../mine/mineManager');
var magicOutputManager = require('./../magicOutPut/magicOutputManager');
var honorManager = require('./../honorReward/honorManager');
var defaultValues = require('../../tools/defaultValues');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var vipInfoManager = require('./../vipInfo/vipInfoManager');
var rewardMisManager = require('./../rewardMission/rewardMisManager');
var RoleFashionManager = require('./../rolefashion/roleFashionManager');
var RoleTitleManager = require('./../roletitle/roleTitleManager');
var RoleChartManager = require('./../rolechart/roleChartManager');
var RoleExchangeManager = require('./../roleexchange/roleExchangeManager');
var operateManager = require('./../operateActivity/operateManager');
var redisUtils = require('../../tools/redis/redisUtils');
var redisManager = require('../chartRedis/redisManager');
var detailUtils = require('../../tools/redis/detailUtils');
var csplayerManager = require('../player/playerManager');
var rechargeManager = require('./../recharge/rechargeManager');
var petManager = require('../pet/petManager');
var msdkOauth = require("../../tools/openSdks/tencent/msdkOauth");
var zhuanPanManager = require("../zhuanPan/zhuanPanManager");
var soulSuccinctManager = require('./../soulSuccinct/soulSuccinctManager');
var noticeManager = require('./../notice/noticeManager');
var unionMagicManager = require('./../unionMagic/unionMagicManager');
var exchangeManager = require('./../exchange/exchangeManager');
var roleTemple = require('./../unionTemple/roleTemple');
var advanceManager = require('./../advance/advanceManager');
var chestsManager = require('./../chestsActivity/chestsActivityManager');

var toMarryManager = require('./../marry/toMarryManager');
var coliseumManager = require('./../coliseum/coliseumManager');
var artifactManager = require('./../artifact/artifactManager');
var storyDrak = require('./../custom/storyDrak');

var Q = require('q');
var eventValue = require('../../tools/eventValue');


var ePlayerInfo = gameConst.ePlayerInfo;
var eWorldState = gameConst.eWorldState;
var eEquipBag = gameConst.eEquipBag;
var eItemInfo = gameConst.eItemInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eMagicSoulInfo = gameConst.eMagicSoulInfo;
var eSpecial = gameConst.eSpecial;
var eGiftType = gameConst.eGiftType;
var eItemType = gameConst.eItemType;
var eCreateType = gameConst.eCreateType;
var eAssetsInfo = gameConst.eAssetsInfo;
var tAtt = templateConst.tAtt;
var tRoleInit = templateConst.tRoleInit;
var tItem = templateConst.tItem;
var tNotice = templateConst.tNotice;
var eZhanLiStart = gameConst.eZhanLiStart;
var ePlayerDB = gameConst.ePlayerDB;
var eRedisClientType = gameConst.eRedisClientType;
var eLoginType = gameConst.eLoginType;
var eForbidChartType = gameConst.eForbidChartType;
var eAttInfo = gameConst.eAttInfo;
var eQQMemberGift = gameConst.eQQMemberGift;
var eGiftInfo = gameConst.eGiftInfo;
var eGiftState = gameConst.eGiftState;
var eMarryInfo = gameConst.eMarryInfo;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = function (opts) {
    Character.call(this, opts);

    var dateManager = new Date();
    this.userId = null;
    this.serverId = null;
    this.openID = opts && opts.openID;
    this.token = opts && opts.token || 'default-token';
    this.accountType = opts && opts.accountType;
    this.isLeaveing = false;
    this.unionLevel = 0;       // US变化时会被同步。
    this.jionUnionTime = 0;     // 加入公会的时间，这里为了方便存临时变量
    //脏数据对比模板， 每次存库前与此模板对比，有改变存库并替换模板
    this.dirtyTemplateCache = {};

    this.worldState = new Array(eWorldState.Max);
    for (var i = 0; i < eWorldState.Max; ++i) {
        this.worldState[i] = 0;
    }
    this.newHelp = {};
    this.heartBeat = {};
    this.playerInfo = new Array(ePlayerInfo.MAX);
    this.equipManager = new EquipManager();
    this.assetsManager = new AssetsManager(this);
    //this.attManager = new AttManager(this);   //使用基类中的此属性
    this.itemManager = new itemManager(this);
    this.cutsomManager = new cutsomManager(this);
    this.skillManager = new skillManager(this);
    this.runeManager = new runeManager(this);
    this.missionManager = new missionManager(this);
    this.achieveManager = new achieveManager(this);
    this.soulManager = new soulManager(this);
    this.activityManager = new activityManager(this);
    this.asyncPvPManager = new asyncPvPManager(this);
    this.niuDanManager = new niuDanManager(this);
    this.shopManager = new shopManager(this);
    this.giftManager = new giftManager(this);
    this.magicSoulManager = new magicSoulManager(this);
    this.flopManager = new flopManager(this);
    this.treasureBoxManager = new treasureBoxManager(this);
    this.alchemyManager = new alchemyManager(this);
    this.physicalManager = new PhysicalManager(this);
    this.climbManager = new climbManager(this);
    this.QqManager = new qqManager(this);
    this.cmgeManager = new CmgeManager(this);
    this.mineManager = new mineManager(this);
    this.honorManager = new honorManager(this);
    this.vipInfoManager = new vipInfoManager(this);
    this.loginTime = dateManager.getTime();
    this.refreshRedisTime = dateManager.getTime();
    this.findName = '';
    this.rewardMisManager = new rewardMisManager(this);
    this.roleFashionManager = new RoleFashionManager(this);
    this.roleTitleManager = new RoleTitleManager(this);
    this.operateManager = new operateManager(this);
    this.roleChartManager = new RoleChartManager(this);
    /**  玩家兑换管理器 */
    this.roleExchangeManager = new RoleExchangeManager(this);
    /** 充值商店管理器*/
    this.rechargeManager = new rechargeManager(this);
    /**求魔管理器*/
    this.magicOutputManager = new magicOutputManager(this);
    /**幸运转盘管理器*/
    this.zhuanPanManager = new zhuanPanManager(this);

    this.soulSuccinctManager = new soulSuccinctManager(this);
    /**公告管理器*/
    this.noticeManager = new noticeManager(this);
    /**公会技能*/
    this.unionMagicManager = new unionMagicManager(this);
    /**兑换管理器*/
    this.exchangeManager = new exchangeManager(this);
    /**公会神殿*/
    this.roleTemple = new roleTemple(this);

    // 剧情炼狱
    this.storyDrak = new storyDrak(this);

    if (defaultValues.IsPetOpening) {
        this.petManager = new petManager(this);
    }

    this.advanceManager = new advanceManager(this);
    this.chestsManager = new chestsManager(this);

    /**求婚信息 */
    this.toMarryManager = new toMarryManager(this);

    this.coliseumManager = new coliseumManager(this);
    this.artifactManager = new artifactManager(this);
};

util.inherits(Handler, Character);
module.exports = Handler;
var handler = Handler.prototype;

handler.SetFindName = function (value) {
    this.findName = value;
};

handler.GetFindName = function () {
    return this.findName;
};

handler.SetPaymentInfo = function (value) {
    this.paymentInfo = value;
};

handler.GetPaymentInfo = function () {
    return this.paymentInfo;
};

// 获取个人公会神殿信息
handler.GetRoleTemple = function () {
    return this.roleTemple;
};

// 获取个人活动信息
handler.GetAdvanceManager = function () {
    return this.advanceManager;
};
//获取宝箱活动
handler.GetChestsManager = function () {
    return this.chestsManager;
};

//获取斗兽场信息
handler.GetColiseumManager = function () {
    return this.coliseumManager;
};
//神装系统
handler.GetArtifactManager = function () {
    return this.artifactManager;
};

handler.GetStoryDrak = function(){
    return this.storyDrak;
};

handler.GetPfInfo = function () {
    var self = this;
    var accountType = self.playerInfo[ePlayerInfo.AccountType];
    var roleID = self.playerInfo[ePlayerInfo.ROLEID];
    var expLevel = self.playerInfo[ePlayerInfo.ExpLevel];
    var roleServerUid = self.playerInfo[ePlayerInfo.serverUid];
    if (!roleServerUid) {
        logger.error('GetPfInfo invalid roleServerUid, %s', new Error().stack);
    }

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

    var platId = config.vendors.tencent.platId;
    var gameAppID = config.vendors.msdkPayment[platId].appid;
    var openID = self.GetOpenID();
    var channel = !!self.paymentInfo && !!self.paymentInfo.loginChannel ? self.paymentInfo.loginChannel : 0;
    var grayId = 0;

    var pfExtend = '';
    if (!!defaultValues.paymentUsePfExtend) {
        pfExtend =
            '-' + gameAppID + '*' + platId + '*' + openID + '*' + expLevel + '*' + channel + '*' + zoneId + '*'
            + grayId;
    }

    return {
        payRelease: +config.vendors.msdkPayment.payRelease,
        zoneId: zoneId,
        pfExtend: pfExtend
    };
};

handler.GetUid = function () {
    return this.userId;
};

handler.GetSid = function () {
    return this.serverId;
};

handler.GetAssetsManager = function () {
    return this.assetsManager;
};

handler.GetEquipManager = function () {
    return this.equipManager;
};

handler.GetAttManager = function () {
    return this.attManager;
};

handler.GetShopManager = function () {
    return this.shopManager;
};

handler.GetItemManager = function () {
    return this.itemManager;
};

handler.GetSkillManager = function () {
    return this.skillManager;
};

handler.GetRuneManager = function () {
    return this.runeManager;
};

handler.GetCustomManager = function () {
    return this.cutsomManager;
};

handler.GetGiftManager = function () {
    return this.giftManager;
};

handler.GetSoulManager = function () {
    return this.soulManager;
};

handler.GetActivityManager = function () {
    return this.activityManager;
};

handler.GetAsyncPvPManager = function () {
    return this.asyncPvPManager;
};

handler.GetNiuDanManager = function () {
    return this.niuDanManager;
};

handler.GetMissionManager = function () {
    return this.missionManager;
};

handler.GetAchieveManager = function () {
    return this.achieveManager;
};

handler.GetMagicSoulManager = function () {
    return this.magicSoulManager;
};

handler.GetPhysicalManager = function () {
    return this.physicalManager;
};

handler.GetClimbManager = function () {
    return this.climbManager;
};

handler.GetQqManager = function () {
    return this.QqManager;
};


handler.GetCmgeManager = function () {
    return this.cmgeManager;
};

handler.GetAlchemyManager = function () {
    return this.alchemyManager;
};

handler.GetFlopManager = function () {
    return this.flopManager;
};

handler.GetTreasureBoxManager = function () {
    return this.treasureBoxManager;
};

handler.GetVipInfoManager = function () {
    return this.vipInfoManager;
};
handler.GetMineManager = function () {
    return this.mineManager;
};
handler.GetHonorManager = function () {
    return this.honorManager;
};
handler.GetrewardMisManager = function () {
    return this.rewardMisManager;
};
handler.GetoperateManager = function () {
    return this.operateManager;
};

/** 获取充值商店管理器*/
handler.GetRechargeManager = function () {
    return this.rechargeManager;
};

handler.GetPetManager = function () {
    if (defaultValues.IsPetOpening) {
        return this.petManager;
    }
    return null;
};

/**
 * 获取时装管理器
 * @api public
 * @return {object} roleFashionManager 时装管理器
 * */
handler.GetRoleFashionManager = function () {
    return this.roleFashionManager;
};

/**
 * 获取号称管理器
 * @api public
 * @return {object} roleTitleManager 时号称理器
 * */
handler.GetRoleTitleManager = function () {
    return this.roleTitleManager;
};

/**
 * 获取排行榜奖励管理器
 * @api public
 * @return {object} roleChartManager 时号称理器
 * */
handler.GetRoleChartManager = function () {
    return this.roleChartManager;
};

/**
 * Brief: 获取兑换管理器
 * --------------------
 * @api public
 *
 * @return {object} roleExchangeManager 兑换管理器
 * */
handler.GetRoleExchangeManager = function () {
    return this.roleExchangeManager;
};

/** 获取求魔产出管理器*/
handler.GetMagicOutputManager = function () {
    return this.magicOutputManager;
};
/** 获取邪神洗练管理器*/
handler.GetSoulSuccinctManager = function () {
    return this.soulSuccinctManager;
};

/**获取幸运转盘管理器*/
handler.GetZhuanPanManager = function () {
    return this.zhuanPanManager;
};

/**获取公告管理器*/
handler.GetNoticeManager = function () {
    return this.noticeManager;
}


/**获取公会技能信息*/
handler.GetUnionMagicInfo = function () {
    return this.unionMagicManager;
};


/**获取公会技能信息*/
handler.GetExchangeManager = function () {
    return this.exchangeManager;
};

/**获取公会奖励信息*/
handler.GetUnionAwardInfo = function () {
    //return this.unionAwardManager;
};

/**
 * 玩家登陆时添加数据对比模板，用于数据的对比
 * @param {number} tableIndex 表下标索引
 * @param {string} template 玩家刚上线时数据库的数据模板
 * */
handler.addDirtyTemplate = function (tableIndex, template) {
    if (null == template || tableIndex < ePlayerDB.PLAYERDB_PLAYERINFO) {
        return;
    }
    this.dirtyTemplateCache[tableIndex] = template;
};

/**
 * 定时保存数据，脏数据对比
 * 1, 当数据传saveStr 为空值，不存储，
 * 2, 模板第一次都为空，都替换？
 * 3, 如果保存字符串相对模板字符串有改变， 返回字符串，并替换
 * 4, tableIndex [28] SHOP LINGQI, 传进来是一个 [] 为引用类型， 是否需要转换？？ TODO GAO
 * @param {number} tableIndex 表下标索引
 * @param {string} saveStr 数据保存字符串
 * @return {string} 对比有脏数据放回saveStr， 没有脏数据返回'noChange'
 * */
handler.CheckDirtyAndReplace = function (tableIndex, saveStr) {
    if (null == saveStr || tableIndex < ePlayerDB.PLAYERDB_PLAYERINFO) {
        return gameConst.eDirtyNoChange;
    }
    if (this.dirtyTemplateCache[tableIndex] == saveStr) {
        return gameConst.eDirtyNoChange;
    }
    this.dirtyTemplateCache[tableIndex] = saveStr;
    return saveStr;
};

/**
 * @return {number}
 */
handler.GetJobType = function () {
    var tempID = this.playerInfo[ePlayerInfo.TEMPID];
    var InitTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == InitTemplate) {
        return 0;
    }
    return InitTemplate[tRoleInit.profession];
};

handler.GetWorldState = function (index) {
    return this.worldState[index];
};

handler.SetWorldState = function (index, value) {
    this.worldState[index] = value;
};

handler.SetPlayerAllInfo = function (dataList, accountType, isBind, initZhan, serverUid) {
    this.playerInfo = dataList;
    this.playerInfo[ePlayerInfo.AccountType] = accountType;
    this.playerInfo[ePlayerInfo.IsBind] = isBind;
    this.playerInfo[ePlayerInfo.ZHANLI] = initZhan;
    if (!dataList[ePlayerInfo.serverUid]) {     //如果之前serverUid不存在则设置serverUid
        this.playerInfo[ePlayerInfo.serverUid] = serverUid;
    }
};

handler.SetPlayerInfo = function (infoIndex, value) {
    //参数检查
    if (!IsTrueIndex(infoIndex)) {
        return;
    }

    //信息改变
    var oldValue = this.playerInfo[infoIndex];
    this.playerInfo[infoIndex] = value;
    this.SendInfoMsg(infoIndex);

};

handler.SetAllNewHelp = function (dataList) {
    for (var index in dataList) {
        var newID = dataList[index][1];
        this.newHelp[newID] = {};
    }
};

handler.SetNewHelp = function (value) {

    ///////////////////////////////////////////////////////////////////////
    var openID = this.GetOpenID();
    var accountType = this.GetAccountType();

    tlogger.log('PlayerNewHelp', accountType, openID, value);
    ///////////////////////////////////////////////////////////////////////

    this.newHelp[value] = {};
};

handler.SendNewHelp = function () {
    var route = 'ServerNewPlayer';
    var msg = {
        newList: []
    };
    for (var index in this.newHelp) {
        msg.newList.push(index);
    }
    this.SendMessage(route, msg);
};

handler.SendVoiceName = function () {
    var route = 'ServerVoiceName';

    var voiceNameId = templateManager.GetTemplateByID('VoiceNameList', config.list.serverUid);

    if (!voiceNameId) {
        voiceNameId = 28075992;
    }

    var msg = {
        VoiceName: voiceNameId
    };
    this.SendMessage(route, msg);
};

/**
 * @return {string}
 */
handler.GetNewHelpSql = function () {
    var dateStr = '';
    var roleID = this.playerInfo[ePlayerInfo.ROLEID];
    for (var index in this.newHelp) {
        dateStr += '(' + roleID + ',' + index + '),';
    }
    dateStr = dateStr.substring(0, dateStr.length - 1);
    return dateStr;
};

/**
 * @return {null}
 */
handler.GetPlayerInfo = function (infoIndex) {
    if (IsTrueIndex(infoIndex)) {
        return this.playerInfo[infoIndex];
    }
    return null;
};

/**
 * @return {null}
 */
handler.ModifyPlayerInfo = function (infoIndex, value, minValue, maxValue) {
    if (IsTrueIndex(infoIndex)) {
        var old = this.playerInfo[infoIndex];
        var newValue = old + value;
        if (minValue != null && newValue < minValue) {
            newValue = minValue;
        }
        if (maxValue != null && newValue > maxValue) {
            newValue = maxValue;
        }
        this.playerInfo[infoIndex] = newValue;

        if (old != newValue) {
            this.SendInfoMsg(infoIndex);
        }

        return old;
    }
    return null;
};

handler.CreatePlayer = function (userId, serverId, playerInfo) {
    this.userId = userId;
    this.serverId = serverId;
    this.playerInfo = playerInfo;
};

/**
 * @return {boolean}
 */
handler.IsSaveDB = function (nowSec) {
    if (nowSec - this.loginTime >= defaultValues.DBTime) {
        this.loginTime = nowSec;
        return true;
    }
    return false;
};

handler.UpdatePlayer12Info = function () {
    logger.warn('UpdatePlayer12Info roleID: %s', this.playerInfo[ePlayerInfo.ROLEID]);


    this.cutsomManager.UpdateCustom12Info();
    this.missionManager.UpdateMission12Info(/*, false*/);
    //this.niuDanManager.UpdateNiuDan12Info(this);
    this.asyncPvPManager.Update12Info();
    this.physicalManager.Update12Info();
    this.climbManager.UpdateTodayData12Info();
    this.alchemyManager.Update12Info();
    this.shopManager.UpdateShop12Info();
    this.vipInfoManager.UpdateVip12Info();
    this.vipInfoManager.SendFreeSweepNum();
    this.giftManager.Update12Info(); //临时放在角色刷新中，之后要放到账号刷新
    this.mineManager.Update12Info();
    this.rewardMisManager.Update12Info();
    this.activityManager.Update12Info();
    this.zhuanPanManager.UpdateZhuanPanRechargeStatus12Info();
    this.soulSuccinctManager.Update12Info();
    this.assetsManager.Update12Info();
    this.exchangeManager.Update12Info();
    this.advanceManager.Update12Info();
    this.storyDrak.Update12Info();

    this.GetMissionManager().AddUnionMissions();
    // 更新公会信息
    pomelo.app.rpc.us.usRemote.Update12Info(null, this.playerInfo[ePlayerInfo.ROLEID], this.serverId, function (err) {

    });


    var myVipLevel = this.playerInfo[ePlayerInfo.VipLevel];
    var vipTemplate = null;
    if (null == myVipLevel || myVipLevel == 0) { //VIP 特权 TODO 更新战斗免费复活次数
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', myVipLevel + 1);
    }
    if (null != vipTemplate) {
        this.playerInfo[ePlayerInfo.LifeNum] = vipTemplate[templateConst.tVipTemp.freeWarReliveNum];
    } else {
        this.playerInfo[ePlayerInfo.LifeNum] = defaultValues.lifeNum;
    }
    var isNobility = this.playerInfo[ePlayerInfo.IsNobility];       //手游贵族 1 是  0 不是
    if (1 == isNobility) {
        var temp = templateManager.GetTemplateByID('VipTemplate', 99);  //手游贵族默认99作为attID
        if (null != temp) {
            this.playerInfo[ePlayerInfo.LifeNum] += temp[templateConst.tVipTemp.freeWarReliveNum];  //手游贵族复活次数叠加
        }
    }
    this.SendInfoMsg(ePlayerInfo.LifeNum);
    this.playerInfo[ePlayerInfo.RefreshTime] = new Date();
};

handler.UpdatePlayerWeekInfo = function () {
    logger.info('UpdatePlayerWeekInfo roleID: %s', this.playerInfo[ePlayerInfo.ROLEID]);

    //this.climbManager.UpdateCengDataWeekInfo();
};

handler.Update = function (/*nowTime*/) {
    var self = this;
    var oldLogin = new Date(self.playerInfo[ePlayerInfo.RefreshTime]);

    logger.warn('Update player info roleID: %j, oldLogin: %j', self.playerInfo[ePlayerInfo.ROLEID], oldLogin);

    var execUpdate12Info = function () {
        var nowTime = new Date();
        var nowDay = nowTime.getDate();
        var oldDay = oldLogin.getDate();
        if (nowDay != oldDay) {
            var nowSec = nowTime.getTime();
            var roleID = (self.playerInfo[ePlayerInfo.ROLEID] + Math.floor(nowSec / 1000));
            if (roleID % defaultValues.updatePlayerNum == 0) {
                self.UpdatePlayer12Info();
                oldLogin = nowTime;
            }
            else {
                setTimeout(execUpdate12Info, 1000);
            }
        }
    };
    execUpdate12Info();
};

handler.SendExtraInfoMsg = function (openID, token) {
    var self = this;
    /* var isNobility = self.playerInfo[ePlayerInfo.IsNobility];
     if (isNobility == 0) { // callback
     // 从接口获得
     //...
     {
     self.playerInfo[ePlayerInfo.IsNobility] = 1; // 临时死数据
     self.giftManager.AddGift(self, defaultValues.NobilityGiftID, defaultValues.NobilityGiftType,
     self.playerInfo[ePlayerInfo.IsNobility]);
     self.SendInfoMsg(ePlayerInfo.IsNobility);

     var isNobilityTemp = templateManager.GetTemplateByID('VipTemplate', 99);
     if (null != isNobilityTemp) {
     self.playerInfo[ePlayerInfo.LifeNum] += isNobilityTemp[templateConst.tVipTemp.freeWarReliveNum];
     }
     self.SendInfoMsg(ePlayerInfo.LifeNum);
     }
     } else {
     self.giftManager.AddGift(self, defaultValues.NobilityGiftID, defaultValues.NobilityGiftType,
     self.playerInfo[ePlayerInfo.IsNobility]);
     }*/

    //exeType 添加续费 开通 QQ会员礼包功能
    var exeType = 4; //登陆
    //以下是qq会员判断逻辑
    self.GetQQMember(openID, token, exeType);
};

handler.UpdateAtt = function (attLevel, attInfo, isAdd, isSend) {
    this.attManager.Update(attLevel, attInfo, isAdd);
    if (isSend) {
        this.attManager.SendAttMsg(null);
    }
};

handler.SendInfoMsg = function (Index) {
    var self = this;
    var route = 'ServerUpdatePlayerInfo';
    var playerInfoMsg = {
        infoList: []
    };
    var value;
    if (Index) {
        if (false == IsTrueIndex(Index)) {
            return;
        }
        var temp = {};
        value = this.playerInfo[Index];
        temp[Index] = _.isNumber(value) ? Math.floor(value) : value;
        playerInfoMsg.infoList.push(temp);
    }
    else {
        for (var i in this.playerInfo) {
            var temp = {};
            value = this.playerInfo[i];
            temp[i] = _.isNumber(value) ? Math.floor(value) : value;
            playerInfoMsg.infoList.push(temp);
        }
    }
    this.SendMessage(route, playerInfoMsg);
};

handler.GetPlayerAoiInfo = function () {
    var self = this;
    var aoiInfo = {
        playerInfo: self.playerInfo,
        itemList: [],
        soulList: [],
        magicSoulList: [],
        attList: self.attManager.GetAllAtt(self.playerInfo[ePlayerInfo.ROLEID])
    }
    var equipList = this.equipManager.GetAllEquip();
    for (var index in equipList) {
        var tempItem = self.itemManager.GetItem(equipList[index]);
        if (null != tempItem) {
            aoiInfo.itemList.push(tempItem.GetAllInfo());
        }
    }
    var soulList = this.soulManager.GetSoulList();
    for (var index in soulList) {
        var tempSoul = soulList[index];
        aoiInfo.soulList.push(tempSoul.GetSoulAllInfo());
    }
    var magicSoulList = this.magicSoulManager.GetMagicSoulAllInfo();
    for (var index in magicSoulList) {
        var tempSoul = magicSoulList[index];
        aoiInfo.magicSoulList.push(tempSoul);
    }

    return aoiInfo;
};

handler.GetAoiEquip = function () {
    var itemList = [0, 0, 0];
    var weaponGuid = this.equipManager.GetEquip(eEquipBag.WEAPON);
    var headGuid = this.equipManager.GetEquip(eEquipBag.HEAD);
    var cuirassGuid = this.equipManager.GetEquip(eEquipBag.CUIRASS);
    var weaponItem = this.itemManager.GetItem(weaponGuid);
    var headItem = this.itemManager.GetItem(headGuid);
    var cuirassItem = this.itemManager.GetItem(cuirassGuid);
    if (weaponItem) {
        itemList[0] = weaponItem.GetItemInfo(eItemInfo.TEMPID);
    }
    if (headItem) {
        itemList[1] = headItem.GetItemInfo(eItemInfo.TEMPID);
    }
    if (cuirassItem) {
        itemList[2] = cuirassItem.GetItemInfo(eItemInfo.TEMPID);
    }
    return itemList;
};

handler.GetAoiMagicSoul = function () {
    var magicSoulInfo = {};
    //var maxSoul = this.soulManager.GetMaxSoul();
    //if (maxSoul) {
    if (this.magicSoulManager) {
        magicSoulInfo[eMagicSoulInfo.TEMPID] = this.magicSoulManager.GetMagicSoulInfo(eMagicSoulInfo.TEMPID);    // maxSoul.GetSoulInfo(eSoulInfo.LEVEL);
        //soulInfo[ eSoulInfo.TEMPID ] = maxSoul.GetSoulInfo(eSoulInfo.TEMPID);
    }

    // }
    return magicSoulInfo;
};

handler.GetAoiPet = function () {
    if (defaultValues.IsPetOpening) {
        var self = this;
        if (self.petManager) {
            return self.petManager.GetFightPetInfo();
        }
        return [];
    } else {
        return [];
    }
};

handler.GetAoiMarry = function () {

    if (this.toMarryManager) {
        var marryInfo = {
            state: this.toMarryManager.playerMarryState, //0 单身 1 已经结婚  2 离婚
            xinWuID: this.toMarryManager.marryInfo[0] ? this.toMarryManager.marryInfo[0][eMarryInfo.xinWuID] : ''
        }
        return marryInfo;
    }
    return [];

};

handler.GetAoiInfo = function () {
    var playerInfo = {};
    var value;
    for (var index in this.playerInfo) {
        value = this.playerInfo[index];
        playerInfo[index] = _.isNumber(value) ? Math.floor(value) : value;
    }
    return playerInfo;
};

handler.AddVipPoint = function (vipPoint) {
    var self = this;
    if (vipPoint > eAssetsInfo.ASSETS_MAXVALUE) {
        vipPoint = eAssetsInfo.ASSETS_MAXVALUE;
    }
    var oldPoint = this.playerInfo[ePlayerInfo.VipPoint];
    oldPoint += vipPoint;
    if (oldPoint > eAssetsInfo.ASSETS_MAXVALUE) {
        oldPoint = eAssetsInfo.ASSETS_MAXVALUE;
    }
    var oldLevel = this.playerInfo[ePlayerInfo.VipLevel];
    var newLevel = GetVipLevel(oldPoint);
    this.playerInfo[ePlayerInfo.VipPoint] = oldPoint;
    this.SendInfoMsg(ePlayerInfo.VipPoint);
    if (oldLevel != newLevel) {
        var vipTemplate = templateManager.GetTemplateByID('VipTemplate', newLevel + 1); //VIP 特权 TODO 更新战斗免费复活次数
        this.playerInfo[ePlayerInfo.VipLevel] = newLevel;
        var addNum = parseInt(vipTemplate[templateConst.tVipTemp.freeWarReliveNum]);
        var freeReliveNum = this.vipInfoManager.getNumByType(gameConst.eVipInfo.FreeReliveNum);
        if (null != vipTemplate) {
            this.playerInfo[ePlayerInfo.LifeNum] = addNum - freeReliveNum;
            //this.playerInfo[ePlayerInfo.lifeNum] =  vipTemplate[templateConst.tVipTemp.freeWarReliveNum] ;
        }
        var isNobilityTemp = templateManager.GetTemplateByID('VipTemplate', 99);
        if (null != isNobilityTemp) {
            this.playerInfo[ePlayerInfo.LifeNum] += isNobilityTemp[templateConst.tVipTemp.freeWarReliveNum];
        }
        this.giftManager.SetGiftState(eGiftType.VipLevel, newLevel);
        this.SendInfoMsg(ePlayerInfo.lifeNum);
        this.SendInfoMsg(ePlayerInfo.VipLevel);
        this.alchemyManager.SendAlchemyMsg();
        this.missionManager.IsMissionOver(gameConst.eMisType.VipLevel, 0, this.playerInfo[ePlayerInfo.VipLevel]);
        //设置不同vip等级的体力购买次数
        this.physicalManager.SetVipPhysicalInfo(oldLevel, newLevel);
        // this.asyncPvPManager.SetVipInfoNum(newLevel);
        this.vipInfoManager.SetVipInfoNum(newLevel);
        this.mineManager.SetMineInfoNum(newLevel);
        this.shopManager.SetVipBuyNum(newLevel);

        /* this.playerInfo[ePlayerInfo.IsNobility] = 1;    //设置手游贵族
         this.SendInfoMsg(ePlayerInfo.IsNobility);*/

        this.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_VIPLevel, newLevel, 1);

        //公告
        var noticeID = "vipLevel_" + newLevel;
        this.noticeManager.SendRepeatableGM(gameConst.eGmType.VipLevel, noticeID);

        //将最新的vip等级同步到us 公会发红包使用
        pomelo.app.rpc.us.usRemote.UpdateRoleVIP(null, self.playerInfo[ePlayerInfo.ROLEID], newLevel, utils.done);
    }
};

handler.UpdateZhanli = function (value, isAdd, isSend) {
    if (!_.isNumber(value) || _.isNaN(value)) {
        var roleID = this.playerInfo[ePlayerInfo.ROLEID];
        var err = new Error();
        logger.error('UpdateZhanli invalid value, roleID:%d, stack:%s', roleID, err.stack);
        return;
    }

    var self = this;
    var oldZhanli = this.GetPlayerInfo(ePlayerInfo.ZHANLI);
    if (isAdd) {
        this.playerInfo[ePlayerInfo.ZHANLI] += value;
    }
    else {
        this.playerInfo[ePlayerInfo.ZHANLI] -= value;
    }
    this.playerInfo[ePlayerInfo.ZHANLI] = Math.floor(this.playerInfo[ePlayerInfo.ZHANLI]);
    var newZhanli = this.GetPlayerInfo(ePlayerInfo.ZHANLI);

    if (oldZhanli < newZhanli) {
        // 发出战力提升的事件，更新运营活动数据
        self.notifyOperateIncreaseZhanLiEvent(oldZhanli, newZhanli);
    }

    this.missionManager.IsMissionOver(gameConst.eMisType.ZhanLi, 0, this.playerInfo[ePlayerInfo.ZHANLI]);

    this.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.ZhanLi, 0, this.playerInfo[ePlayerInfo.ZHANLI]);
    if (isSend) {
        pomelo.app.rpc.rs.rsRemote.UpdatePlayerValue(null, this.playerInfo[ePlayerInfo.ROLEID], ePlayerInfo.ZHANLI,
                                                     this.playerInfo[ePlayerInfo.ZHANLI], utils.done);
        /** 属性变更通知 pvp*/
        /*pomelo.app.rpc.pvp.pvpRemote.UpdatePlayerValue(null, this.playerInfo[ePlayerInfo.ROLEID], ePlayerInfo.ZHANLI,
         this.playerInfo[ePlayerInfo.ZHANLI], utils.done);*/
        /** 同步js player 属性*/
        pomelo.app.rpc.js.jsRemote.UpdatePlayerValue(null, this.playerInfo[ePlayerInfo.ROLEID], ePlayerInfo.ZHANLI,
                                                     this.playerInfo[ePlayerInfo.ZHANLI], utils.done);
        this.SendInfoMsg(ePlayerInfo.ZHANLI);

        var gmZhanli = csplayerManager.GetGmZhanli();
        if (this.playerInfo[ePlayerInfo.ZHANLI] >= gmZhanli) {
            for (var index = gmZhanli; index <= this.playerInfo[ePlayerInfo.ZHANLI];
                 index += gameConst.eZhanLiStart.Interval) {
                csplayerManager.SetGmZhanli(index + gameConst.eZhanLiStart.Interval);
                var zhanLiID = 'zhanLi_' + index;
                var zhanLiTemplate = templateManager.GetTemplateByID('NoticeTempalte', zhanLiID);
                if (null != zhanLiTemplate) {
                    var roleName = this.playerInfo[gameConst.ePlayerInfo.NAME];
                    var beginStr = zhanLiTemplate[tNotice.noticeBeginStr];
                    var endStr = zhanLiTemplate[tNotice.noticeEndStr];
                    var content = beginStr + ' ' + roleName + ' ' + endStr;
                    pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.ZhanLi, index, content, utils.done);
                }
            }
        }

        //战力达到指定值即发公告
        var noticeID = this.noticeManager.GetZhanliValueNoticeID(oldZhanli, newZhanli);
        this.noticeManager.SendRepeatableGM(gameConst.eGmType.ZhanliValue, noticeID);
    }

    // notify chart zhanli changed
    var roleInfo = {
        roleID: this.playerInfo[ePlayerInfo.ROLEID],
        name: this.playerInfo[ePlayerInfo.NAME],
        openID: this.GetOpenID(),
        expLevel: this.playerInfo[ePlayerInfo.ExpLevel],
        zhanli: this.playerInfo[ePlayerInfo.ZHANLI],
        vipLevel: this.playerInfo[ePlayerInfo.VipLevel],
        isNobility: this.playerInfo[ePlayerInfo.IsNobility],
        isQQMember: this.playerInfo[ePlayerInfo.IsQQMember],
        wxPicture: !!this.playerInfo[ePlayerInfo.Picture] ? this.playerInfo[ePlayerInfo.Picture] : '',
        nickName: this.playerInfo[ePlayerInfo.NickName],
        unionName: this.playerInfo[ePlayerInfo.UnionName],
        tempID: this.playerInfo[ePlayerInfo.TEMPID],
        updateTime: Date.now()
    };

    var param = {forbidChart: [eForbidChartType.ZHANLI, eForbidChartType.ALL]};
    redisUtils.UpdatePlayerZhanliScore(roleInfo, param, utils.done);

    /** 战力大于 10万  添加跨服榜 及相关查询信息*/
    if (this.playerInfo[ePlayerInfo.ZHANLI] > defaultValues.ACROSS_ZHANLI_LIMIT) {
        var roleAcrossInfo = {
            roleID: this.playerInfo[ePlayerInfo.ROLEID],
            name: this.playerInfo[ePlayerInfo.NAME],
            expLevel: this.playerInfo[ePlayerInfo.ExpLevel],
            zhanli: this.playerInfo[ePlayerInfo.ZHANLI],
            vipLevel: this.playerInfo[ePlayerInfo.VipLevel],
            isNobility: this.playerInfo[ePlayerInfo.IsNobility],
            isQQMember: this.playerInfo[ePlayerInfo.IsQQMember],
            unionName: this.playerInfo[ePlayerInfo.UnionName],
            serverUID: this.playerInfo[ePlayerInfo.serverUid]
        };

        redisUtils.UpdatePlayerAcrossZhanliScore(roleAcrossInfo, param, utils.done);
    }
};

handler.UpdateChartRoleInfo = function () {
    var roleInfo = {
        roleID: this.playerInfo[ePlayerInfo.ROLEID],
        name: this.playerInfo[ePlayerInfo.NAME],
        openID: this.GetOpenID(),
        expLevel: this.playerInfo[ePlayerInfo.ExpLevel],
        zhanli: this.playerInfo[ePlayerInfo.ZHANLI],
        vipLevel: this.playerInfo[ePlayerInfo.VipLevel],
        isNobility: this.playerInfo[ePlayerInfo.IsNobility],
        isQQMember: this.playerInfo[ePlayerInfo.IsQQMember],
        wxPicture: !!this.playerInfo[ePlayerInfo.Picture] ? this.playerInfo[ePlayerInfo.Picture] : '',
        nickName: this.playerInfo[ePlayerInfo.NickName],
        unionName: this.playerInfo[ePlayerInfo.UnionName],
        tempID: this.playerInfo[ePlayerInfo.TEMPID],
        updateTime: Date.now()
    };

    var param = {forbidChart: [eForbidChartType.ZHANLI, eForbidChartType.ALL]};
    redisUtils.UpdatePlayerZhanliScore(roleInfo, param, utils.done);


    /** 战力大于 10万  添加跨服榜 及相关查询信息*/
    if (this.playerInfo[ePlayerInfo.ZHANLI] > defaultValues.ACROSS_ZHANLI_LIMIT) {
        var roleAcrossInfo = {
            roleID: this.playerInfo[ePlayerInfo.ROLEID],
            name: this.playerInfo[ePlayerInfo.NAME],
            expLevel: this.playerInfo[ePlayerInfo.ExpLevel],
            zhanli: this.playerInfo[ePlayerInfo.ZHANLI],
            vipLevel: this.playerInfo[ePlayerInfo.VipLevel],
            isNobility: this.playerInfo[ePlayerInfo.IsNobility],
            isQQMember: this.playerInfo[ePlayerInfo.IsQQMember],
            unionName: this.playerInfo[ePlayerInfo.UnionName],
            serverUID: this.playerInfo[ePlayerInfo.serverUid]
        };

        redisUtils.UpdatePlayerAcrossZhanliScore(roleAcrossInfo, param, utils.done);
    }
};

handler.CalcExpRequired = function (curExp, curExpLevel, addExpLevel) {
    var expAllTemplate = templateManager.GetAllTemplate('PlayerAttTemplate');
    var maxExpLevel = 0;
    for (var i in expAllTemplate) {
        maxExpLevel = expAllTemplate[i].attID;
    }
    addExpLevel = +addExpLevel;

    if (!addExpLevel || addExpLevel > eAssetsInfo.ASSETS_MAXVALUE) {
        return [errorCodes.ParameterWrong, curExp, curExpLevel];
    }

    var retExpLevel = curExpLevel + addExpLevel;

    if (retExpLevel > maxExpLevel) {
        retExpLevel = maxExpLevel;
    }

    var retExp = 0;
    for (var i = curExpLevel; i < retExpLevel; ++i) {
        var expTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', i);
        retExp += expTemplate[tAtt.exp];
    }

    return [errorCodes.OK, retExp - curExp, retExpLevel];
};

handler.CalcExpResult = function (curExp, curExpLevel, addExp) {
    var expAllTemplate = templateManager.GetAllTemplate('PlayerAttTemplate');
    var maxExpLevel = 0;
    for (var i in expAllTemplate) {
        maxExpLevel = expAllTemplate[i].attID;
    }
    addExp = +addExp;

    if (!addExp) {
        return [errorCodes.ParameterWrong, curExp, curExpLevel];
    }

    if (addExp > eAssetsInfo.ASSETS_MAXVALUE) {
        return [errorCodes.ParameterWrong, curExp, curExpLevel];
    }

    curExp += addExp;
    if (curExp > eAssetsInfo.ASSETS_MAXVALUE) {
        curExp = eAssetsInfo.ASSETS_MAXVALUE;
    }

    for (var i = curExpLevel; i < maxExpLevel; ++i) {
        var expTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', i);
        var upExp = expTemplate[tAtt.exp];
        if (curExp <= 0) {
            break;
        }
        if (curExp >= upExp) {
            curExp -= upExp;
            curExpLevel++;
        }

        if (curExpLevel >= maxExpLevel) {
            break;
        }
    }
    if (curExpLevel >= maxExpLevel) {
        curExp = 0;
    }
    return [errorCodes.OK, curExp, curExpLevel];
};

handler.AddExp = function (expNum, expFactor) {
    var self = this;
    var roleID = this.playerInfo[ePlayerInfo.ROLEID];
    var nowDate = new Date().getTime();
    var canGetProfitTime = csplayerManager.GetForbidProfitTime(roleID);
    if (nowDate < canGetProfitTime) {
        logger.warn('Can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, expNum: %j',
                    roleID, utilSql.DateToString(new Date(nowDate)), utilSql.DateToString(new Date(canGetProfitTime)),
                    expNum);
        return errorCodes.IDIP_FORBID_PROFIT;
    }

    expNum = +expNum;
    if (expNum > eAssetsInfo.ASSETS_MAXVALUE) {
        expNum = eAssetsInfo.ASSETS_MAXVALUE;
    }

    var curExp = this.playerInfo[ePlayerInfo.EXP];
    var curExpLevel = this.playerInfo[ePlayerInfo.ExpLevel];
    var expResult = this.CalcExpResult(curExp, curExpLevel, expNum);

    if (expResult[0] != errorCodes.OK) {
        return expResult[0];
    }

    this.SetPlayerInfo(ePlayerInfo.EXP, expResult[1]);
    this.SendInfoMsg(ePlayerInfo.EXP);

    if (expResult[2] > curExpLevel) {
        this.SetPlayerInfo(ePlayerInfo.ExpLevel, expResult[2]);

        //发出升级事件，更新玩家运营活动数据，发放奖励
        self.notifyOperateLevelUpEvent(curExpLevel, expResult[2]);

        pomelo.app.rpc.rs.rsRemote.UpdatePlayerValue(null, this.playerInfo[ePlayerInfo.ROLEID], ePlayerInfo.ExpLevel,
                                                     this.playerInfo[ePlayerInfo.ExpLevel], utils.done);

        /** 属性变更通知 pvp*/
        pomelo.app.rpc.pvp.pvpRemote.UpdatePlayerValue(null, this.playerInfo[ePlayerInfo.ROLEID], ePlayerInfo.ExpLevel,
                                                       this.playerInfo[ePlayerInfo.ExpLevel], utils.done);

        this.giftManager.SetGiftState(eGiftType.ExpLevel, expResult[2]);
        this.missionManager.AddMissionByExpLevel();
        /** 同步js player 属性 */
        pomelo.app.rpc.js.jsRemote.UpdatePlayerValue(null, this.playerInfo[ePlayerInfo.ROLEID], ePlayerInfo.ExpLevel,
                                                     this.playerInfo[ePlayerInfo.ExpLevel], utils.done);
        //this.missionManager.UpdateMission12Info(this, true);
        this.missionManager.IsMissionOver(gameConst.eMisType.UpLevel, 0,
                                          this.GetPlayerInfo(ePlayerInfo.ExpLevel));
        this.alchemyManager.SendAlchemyMsg();
        this.SendInfoMsg(ePlayerInfo.ExpLevel);
        //玩家升级后更改玩家的属性
        var PlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expResult[2]);
        var oldPlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', curExpLevel);
        if (PlayerAttTemplate && oldPlayerAttTemplate) {
            var attInfo = new Array(gameConst.eAttInfo.MAX);
            for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
                var temp = [0, 0];
                attInfo[i] = temp;
            }
            for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
                attInfo[i][0] = PlayerAttTemplate['att_' + i] - oldPlayerAttTemplate['att_' + i];
            }
            this.UpdateAtt(gameConst.eAttLevel.ATTLEVEL_JICHU, attInfo, true, true);
        }

        // 每级增加一个技能符文点，现在不要了，改成花钱买
        /*var skillPointAddtion = expResult[2] - curExpLevel;
         this.assetsManager.SetAssetsValue(globalFunction.GetSkillPoint(), skillPointAddtion);*/

        // 达到一定等级开启新的活动关卡时，如果有CD则给CD清除
        var activities = templateManager.GetAllTemplate('ActivityTemplate');
        if (null != activities) {
            for (var index in  activities) {
                var temp = activities[index];
                for (var i = 0; i < temp["activityNum"]; ++i) {
                    if (temp["activity_" + i] > 0) {
                        var customID = +temp["activity_" + i];
                        var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
                        if (expResult[2] >= customTemplate["expLevel"] && expResult[2] <= customTemplate["maxLevel"]) {
                            if (expResult[2] == customTemplate["expLevel"]) {
                                this.GetActivityManager().activityList[index].SetActivityCD(new Date());
                            }
                        }
                    }
                }
            }
        }

        ///////////////////////////////////////////////////////////////////////
        var openID = this.GetOpenID();
        var accountType = this.GetAccountType();
        var lv = this.playerInfo[ePlayerInfo.ExpLevel];
        var expTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', lv);
        var upExp = expTemplate[tAtt.exp];
        if (!expFactor) {
            expFactor = gameConst.eExpChangeReason.Default;
        }
        tlogger.log('PlayerExpFlow', accountType, openID, upExp, curExpLevel, expResult[2], 0, expFactor, 0);
        // 这里处理掉新版活动
        this.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PlayerLevel, lv, 1);
        ///////////////////////////////////////////////////////////////////////
    }

    logger.info('Player add exp: roleID: %s, expNum: %s, exp: %s, expLevel: %s, newExp: %s, newExpLevel: %s',
                this.playerInfo[ePlayerInfo.ROLEID], expNum, curExp, curExpLevel, expResult[1], expResult[2]);

    var oldZhanli = playerManager.GetInitZhan(curExpLevel);
    var newZhanli = playerManager.GetInitZhan(expResult[2]);
    if (newZhanli > oldZhanli) {
        this.UpdateZhanli((newZhanli - oldZhanli), true, true); //升级之后改变玩家的基础战力
    }

    //玩家升级提高体力值
    for (var i = curExpLevel; i < expResult[2]; ++i) {
        var physicalTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', i);
        var addphysical = physicalTemplate[tAtt.addPhysical];
        this.assetsManager.SetAssetsValue(globalFunction.GetPhysical(), addphysical);
    }

    //update tbLog player expLevel

    /*var expLev = this.GetPlayerInfo(ePlayerInfo.ExpLevel);
     var tblogStr = 'CALL sp_updateRoleExpLevel(?,?)';
     var tblogArgs = [expLev, roleID];
     tbLogClient.query(roleID, tblogStr, tblogArgs, utils.done);*/
//    // async pvp logic.
//    if (expResult[2] >= defaultValues.aPvPRequireLevel) {
//        var zhanli = this.GetPlayerInfo(gameConst.ePlayerInfo.ZHANLI);
//        if (curExpLevel < defaultValues.aPvPRequireLevel) {
//            pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, this.playerInfo[ ePlayerInfo.ROLEID ], zhanli, null);
//        }
//        else {
//            pomelo.app.rpc.pvp.pvpRemote.UpdatePlayerScore(null, this.playerInfo[ ePlayerInfo.ROLEID ], zhanli, null);
//        }
//    }
};

/*
 * 参数说明：
 * changeTypy: 现用做财产变化原因
 * changeGuid: 现用作经验升级变化原因
 * */
handler.AddSPecial = function (subType, itemID, itemNum, changeTypy, changeGuid) {
    switch (subType) {
        case  eSpecial.Assets :  //财产
        {
            var log_MoneyArgs = [log_getGuid.GetUuid(), this.GetPlayerInfo(ePlayerInfo.ROLEID), changeTypy, changeGuid,
                                 itemID, this.assetsManager.GetAssetsValue(itemID)];

            //this.assetsManager.SetAssetsValue(itemID, itemNum);
            this.assetsManager.AlterAssetsValue(itemID, itemNum, changeTypy);
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
            log_MoneyArgs.push(this.assetsManager.GetAssetsValue(itemID));
            log_MoneyArgs.push(utilSql.DateToString(new Date()));
            log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
            //logger.info( 'AddSPecial金钱变化 数据入库成功' );
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        }
            break;
        case  eSpecial.Exp:   //经验
        {
            this.AddExp(itemNum, changeGuid);
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            var log_ExpArgs = [log_getGuid.GetUuid(), this.GetPlayerInfo(ePlayerInfo.ROLEID), changeTypy, changeGuid,
                               itemNum, utilSql.DateToString(new Date())];
            log_insLogSql.InsertSql(gameConst.eTableTypeInfo.Exp, log_ExpArgs);
            //logger.info( 'AddSPecial经验变化 数据入库成功' );
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        }
            break;
        case  eSpecial.Gift:  //礼包

            break;
        case eSpecial.Item:    //物品
            var itemList = [];
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
            var log_Guid = log_getGuid.GetUuid();
            var log_roleID = this.GetPlayerInfo(ePlayerInfo.ROLEID);
            var log_addTime = utilSql.DateToString(new Date());
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
            for (var i = 0; i < itemNum; ++i) {
                var newItem = this.itemManager.CreateItem(itemID);
                if (null == newItem) {
                    break;
                }
                itemList.push(newItem);
                ///////////////////////////////////////////////////////////////////////////////////////////////////////
                var log_ItemArgs = [log_Guid];
                for (var j = 0; j < eItemInfo.Max; ++j) {      //将物品的详细信息插入到sql语句中
                    log_ItemArgs.push(newItem.GetItemInfo(j));
                }
                log_ItemArgs.push(changeTypy);
                log_ItemArgs.push(gameConst.eEmandationType.ADD);
                log_ItemArgs.push(log_addTime);
                log_insLogSql.InsertSql(gameConst.eTableTypeInfo.ItemChange, log_ItemArgs);
                //logger.info( 'AddSPecial物品变化 数据入库成功' );
                ///////////////////////////////////////////////////////////////////////////////////////////////////////
            }
            this.itemManager.SendItemMsg(itemList, eCreateType.Old, gameConst.eItemOperType.GetItem);
            break;
        case  eSpecial.TreasureBox:  //宝箱
            this.GetTreasureBoxManager().UseTreasureBox(itemID, changeTypy);
            break;
        case eSpecial.Honor:   //荣誉
            var self = this;
            var ownerID = self.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
            pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
                if (!!err) {
                    logger.error('error when AddSPecial for honor get, %d', ownerID);
                    return;
                }
                if (_.isEmpty(obj)) {
                    logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
                    return;
                }
                var honor = obj[gameConst.eAsyncPvPInfo_EX.honor];
                if (itemNum < 0 && honor + itemNum < 0) {
                    obj[gameConst.eAsyncPvPInfo_EX.honor] = 0
                } else {
                    obj[gameConst.eAsyncPvPInfo_EX.honor] = honor + itemNum;
                }
                var honorChange = obj[gameConst.eAsyncPvPInfo_EX.honor] - honor;
                pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, ownerID, obj, function (err) {
                    if (!!err) {
                        return;
                    }
                    self.asyncPvPManager.SendPvPAssetsMsg(obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                                          obj[gameConst.eAsyncPvPInfo_EX.honor]);
                    ///////////////////////////////////////////////
                    var openID = self.GetOpenID();
                    var accountType = self.GetAccountType();
                    var lv = self.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
                    var AddOrReduce = itemNum >= 0 ? 0 : 1;
                    tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 1,
                                        obj[gameConst.eAsyncPvPInfo_EX.honor],
                                        Math.abs(honorChange), 0, 0, AddOrReduce);
                    ///////////////////////////////////////////////
                });
            });
            break;
        case eSpecial.Lingli:    //灵力
            var self = this;
            var ownerID = self.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
            pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
                if (!!err) {
                    logger.error('error when AddSPecial for lingli get, %d', ownerID);
                    return;
                }
                if (_.isEmpty(obj)) {
                    logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
                    return;
                }
                var lingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
                if (itemNum < 0 && lingli + itemNum < 0) {
                    obj[gameConst.eAsyncPvPInfo_EX.lingli] = 0
                } else {
                    obj[gameConst.eAsyncPvPInfo_EX.lingli] = lingli + itemNum;
                }
                var lingliChange = obj[gameConst.eAsyncPvPInfo_EX.lingli] - lingli;
                pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, ownerID, obj, function (err) {
                    if (!!err) {
                        return;
                    }
                    self.asyncPvPManager.SendPvPAssetsMsg(obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                                          obj[gameConst.eAsyncPvPInfo_EX.honor]);
                    ///////////////////////////////////////////////
                    var openID = self.GetOpenID();
                    var accountType = self.GetAccountType();
                    var lv = self.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
                    var AddOrReduce = itemNum >= 0 ? 0 : 1;
                    tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 0,
                                        obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                        Math.abs(lingliChange), 0, 0, AddOrReduce);
                    ///////////////////////////////////////////////
                });
            });
            break;
    }
};

handler.AddItem = function (itemID, itemNum, assetsChangeFactor, expChangeFactor) {
    if (itemID <= 0 || itemNum == 0) {
        return;
    }
    var ItemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
    if (null != ItemTemplate) {
        if (ItemTemplate[tItem.itemType] == eItemType.Special) {
            if (ItemTemplate[tItem.subType] != eSpecial.TreasureBox) {
                itemID = ItemTemplate[tItem.otherID];
            }
            if (ItemTemplate[tItem.otherNum] > 0) {
                itemNum *= ItemTemplate[tItem.otherNum];
            }
            this.AddSPecial(ItemTemplate[tItem.subType], itemID, itemNum, assetsChangeFactor, expChangeFactor);
            return null;
        }
        else {
            var itemList = [];
            for (var i = 0; i < itemNum; ++i) {
                var newItem = this.itemManager.CreateItem(itemID);
                if (null == newItem) {
                    break;
                }
                itemList.push(newItem);
            }
            this.itemManager.SendItemMsg(itemList, eCreateType.Old, gameConst.eItemOperType.GetItem);
            return itemList;
        }
    }
};

function IsTrueIndex(Index) {
    if (Index >= 0 && Index < ePlayerInfo.MAX) {
        return true;
    }
    return false;
};

function GetVipLevel(point) {
    //改为根据模板读取所需点数 因为北美和腾讯所需点数不同
    var vipTemplate = templateManager.GetAllTemplate("VipTemplate");
    var vipList = [];
    if (!vipTemplate) {
        logger.error("****GetVipLevel can not find VipTemplate: %j ", vipTemplate);
        return 0;
    } else {
        for (var i = 0; i < 15; ++i) {
            vipList[i] = vipTemplate[i + 2].needVipPoint;
            if (point < vipList[i]) {
                return i;
            }
        }
        return 15;
    }
//    for (var i = 0; i < 15; ++i) {
//        if (point < vipList[i]) {
//            return i;
//        }
//    }
//    return 15;
};

handler.GetTemplateByVip = function () {
    var ownerVipLevel = this.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);//self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel); // TODO VIP PVP被祝福次数+1
    var vipTemplate = null;
    if (null == ownerVipLevel || ownerVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
    }
    var vipAddBlessNum = 0;
    if (null != vipTemplate) {
        vipAddBlessNum = vipTemplate[templateConst.tVipTemp.PVPBlessedNum]
    }
};

handler.GetSqlStr = function () {
    this.playerInfo[gameConst.ePlayerInfo.LoginTime] = utilSql.DateToString(new Date());
    var tempPlayerInfo = _.clone(this.playerInfo);
    tempPlayerInfo[gameConst.ePlayerInfo.NickName] =
        utilSql.MysqlEncodeString(tempPlayerInfo[gameConst.ePlayerInfo.NickName]);
    return tempPlayerInfo;
};

handler.UpdatePing = function (pingData) {
    this.heartBeat = pingData;
};

/**
 * Brief: 玩家销毁事件
 * ------------------
 * @api private
 *
 * */
handler.destroy = function () {
    /** 时装销毁事件*/
    this.roleFashionManager.destroy();
    /** 号称销毁事件*/
    this.roleTitleManager.destroy();
};

/**
 * 刷新玩家详细数据到redis interval 5 分钟
 * */
handler.refreshDetailToRedis = function () {

    if (this.soulManager.isBianShen) {
        return;
    }

    var self = this;
    var roleID = this.playerInfo[ePlayerInfo.ROLEID];

    /**获取存储列表*/
    var playerList = {
        playerInfo: this.playerInfo,
        itemList: this.itemManager.GetEquipInfo(),
        soulList: this.soulManager.GetAllSoulInfo(),
        attList: this.attManager.GetAllAtt(),
        magicSoulList: this.magicSoulManager.GetMagicSoulAllInfo(),
        skillList: this.skillManager.GetAllSkillInfo(),
        runeList: this.runeManager.getAllRuneInfo(),
        bianShenAttList: this.soulManager.GetBianShenAttr(),
        petList: defaultValues.IsPetOpening ? this.petManager.GetCarryPetInfo() : [],
        marryXuanYan: this.toMarryManager.GetXuanYan()
    };


    /**数据添加到redis */
    /**先查下redis，用于更新宠物排行榜*/
    var client = redisManager.getClient(eRedisClientType.Chart);

    var hGet = Q.nbind(client.client.hget, client.client);
    var zRem = Q.nbind(client.client.zrem, client.client);
    var zAdd = Q.nbind(client.client.zadd, client.client);

    var jobs = [hGet(redisManager.getRoleDetailSetName(), roleID), hGet(redisManager.getJJCInfoSetName(), roleID)];

    Q.all(jobs)
        .then(function (data) {
                  if (data[1] != null) {
                      var jjcInfo = JSON.parse(data[1]);

                      playerList['jjcInfo'] = {
                          'roleID': jjcInfo['roleID'] || 0,
                          'ranking': 0,
                          'roleName': '',
                          'friendName': '',
                          'zhanli': 0,
                          'openID': '',
                          'picture': '',
                          'expLevel': 0,
                          'serverName': '',
                          'credits': jjcInfo['credits'] || 0,
                          'jjcCoin': 0,
                          'winNum': jjcInfo['winNum'] || 0,
                          'winRate': Math.floor((jjcInfo['winNum'] / jjcInfo['totalNum']) * 100) || 0,
                          'streaking': 0,
                          'maxStreaking': 0,
                          'phase': ( '' + jjcInfo['phase'] || '')
                      }
                  } else {
                      playerList['jjcInfo'] = {
                          'roleID': 0,
                          'ranking': 0,
                          'roleName': '',
                          'friendName': '',
                          'zhanli': 0,
                          'openID': '',
                          'picture': '',
                          'expLevel': 0,
                          'serverName': '',
                          'credits': 0,
                          'jjcCoin': 0,
                          'winNum': 0,
                          'winRate': 0,
                          'streaking': 0,
                          'maxStreaking': 0,
                          'phase': ''
                      }
                  }
                  /**更新detail*/
                  client.hSet(redisManager.getRoleDetailSetName(), roleID, detailUtils.zip(playerList),
                              function (err, data) {
                                  if (!!err) {
                                      logger.error('refreshDetailToRedis error: %s', utils.getErrorMessage(err));
                                  }
                              });

                  if (data[0] != null) {
                      var rData = detailUtils.unzip(data[0]);
                      var oldPetList = rData.petList;
                      var zremJobs = [];
                      for (var i in oldPetList) {
                          var key = roleID + '+' + oldPetList[i].petID;
                          zremJobs.push(zRem(redisManager.getPetZsetName(), key));
                      }
                      if (_.isEmpty(zremJobs)) {
                          return Q.resolve([]);
                      }
                      return Q.all(zremJobs);
                  } else {
                      return Q.resolve([]);
                  }
              })
        .then(function () {
                  var zaddJobs = [];
                  for (var i in playerList.petList) {
                      var key = roleID + '+' + playerList.petList[i].petID;
                      var zhanli = playerList.petList[i].zhanli;
                      zaddJobs.push(zAdd(redisManager.getPetZsetName(), zhanli, key));
                  }
              })
        .catch(function (err) {
                   if (!!err) {
                       logger.error('refreshDetailToRedis error: %s', utils.getErrorMessage(err));
                   }
               })
        .done();


    /* client.hSet(redisManager.getRoleDetailSetName(), roleID, detailUtils.zip(playerList), function (err, data) {
     if (!!err) {
     logger.error('refreshDetailToRedis error: %s', utils.getErrorMessage(err));
     }
     });*/
};

/**
 * @Brief: 获取玩家的查询信息
 *
 *
 *-------------------------
 *
 * @return {Object}
 * */
handler.getPlayerShowInfo = function () {

    /**获取存储列表*/
    var playerList = {
        playerInfo: this.playerInfo,
        itemList: this.itemManager.GetEquipInfo(),
        soulList: this.soulManager.GetAllSoulInfo(),
        attList: this.attManager.GetAllAtt(this.playerInfo[ePlayerInfo.ROLEID]),
        magicSoulList: this.magicSoulManager.GetMagicSoulAllInfo(),
        skillList: this.skillManager.GetAllSkillInfo(),
        runeList: this.runeManager.getAllRuneInfo(),
        bianShenAttList: this.soulManager.GetBianShenAttr(),
        fightPet: defaultValues.IsPetOpening ? this.petManager.GetFightPetInfo() : [],
        marryInfo: {
            state: this.toMarryManager.playerMarryState, //0 单身 1 已经结婚  2 离婚
            xinWuID: this.toMarryManager.marryInfo[0] ? this.toMarryManager.marryInfo[0][eMarryInfo.xinWuID] : ''
        }

    };

    return playerList;
};

/**
 * @Brief: build redis soul pvp data
 * ---------------------------------
 * @api public
 *
 * 主要是 做， 竞技场需要的信息 邪神属性， 邪神洗练属性，策划 配数据
 *
 * */
handler.buildSoulPvpToRedis = function () {

    var soulList = this.soulManager.GetAllSoulInfo();
    var souls = {};
    var atts = {};
    var zhanlis = {};

    for (var id in soulList) {

        var sumZhanli = 0;

        var soul = soulList[id];
        sumZhanli += soul[eSoulInfo.Zhanli];

        souls[soul[eSoulInfo.TEMPID]] = soul;
        var attList = new Array(eAttInfo.MAX);

        for (var i = 0; i < eAttInfo.MAX; ++i) {
            attList[i] = 0;
        }

        /** 添加邪神属性*/
        for (var i = 0; i <= 2; i++) {
            attList[soul[eSoulInfo['ATTID_' + i]]] += soul[eSoulInfo['ATTNUM_' + i]];
        }

        /** 添加邪神洗练属性*/
        var result = this.soulSuccinctManager.GetSuccinctInfo(soul[eSoulInfo.TEMPID]);
        sumZhanli += this.soulSuccinctManager.GetSoulZhanliByID(soul[eSoulInfo.TEMPID]);

        for (var index in result) {
            attList[index] += result[index];
        }

        /**策划数据 属性*/
        var tempID = soul[eSoulInfo.TEMPID] * 100 + soul[eSoulInfo.LEVEL];

        var temp = templateManager.GetTemplateByID('XieShenAttTemplate', tempID);
        if (!!temp) {
            for (var i = 0; i <= 9; i++) {
                attList[temp['att_' + i]] += temp['att_Num' + i];
            }
            sumZhanli += temp['att_10'];
        }

        /**觉醒属性*/
        var wakeAtt = [];
        for (var i = 0; i < eAttInfo.MAX; ++i) {
            wakeAtt[i] = [0, 0];
        }
        var oldSoul = this.soulManager.soulList[soul[eSoulInfo.TEMPID]];
        var hasWakeAtt = this.soulManager.BuildBianShenAttList(oldSoul, wakeAtt);
        if (hasWakeAtt) {
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                attList[i] += wakeAtt[i][0];
                attList[i] *= (100 + wakeAtt[i][1]) / 100;
                attList[i] = Math.floor(attList[i]);
            }
        }

        atts[soul[eSoulInfo.TEMPID]] = {
            soulID: soul[eSoulInfo.TEMPID],
            skillNum: soul[eSoulInfo.SkillNum],
            atts: attList
        };

        zhanlis[soul[eSoulInfo.TEMPID]] = sumZhanli;
    }

    var info = {
        souls: souls,
        atts: atts,
        zhanlis: zhanlis
    };

    var roleID = this.playerInfo[gameConst.ePlayerInfo.ROLEID];
    var client = redisManager.getClient(eRedisClientType.Chart);
    client.hSet(redisManager.getSoulDetailSetName(), roleID, JSON.stringify(info), function (err, data) {
        if (!!err) {
            logger.error('add soul detail message to redis: %s', utils.getErrorMessage(err));
        }
    });
};


/**
 * 是否保存详细信息到
 * @return {boolean}
 */
handler.isSaveRedis = function (nowSec) {
    if (nowSec - this.refreshRedisTime >= defaultValues.RedisTime) {
        this.refreshRedisTime = nowSec;
        return true;
    }
    return false;
};

/**添加exeType 0开通qq会员 1续费 2开通超级 3续费 4登陆验证会员  */
handler.GetQQMember = function (openID, token, exeType) {
    var self = this;

    var platId = config.vendors.tencent.platId;
    if (!defaultValues.QQMemberEnableInIOS && platId == 0) { // IOS服, 如果是IOS服 屏蔽QQ会员、心悦会员功能，审核用（临时）
        logger.warn('Disabled QQMember in iOS, openID: %s, token: %s, roleID: %j', openID, token,
                    self.playerInfo[ePlayerInfo.ROLEID]);
        self.playerInfo[ePlayerInfo.IsQQMember] = 0;
        self.SendInfoMsg(ePlayerInfo.IsQQMember);
        self.UpdateChartRoleInfo();
        return;
    }

    var accountType = self.playerInfo[ePlayerInfo.AccountType];
    if (accountType == eLoginType.LT_QQ) {
        var isSuperMember = false;
        var isNormalMember = false;
        var isXinYueMember = false;
        msdkOauth.query_vip(openID, token)
            .then(function (result) {
                      if (result.ret == 0) {
                          for (var index in result.lists) {
                              if (result.lists[index].flag == 16) { //超级会员标识
                                  if (result.lists[index].isvip > 0) { //是超级会员
                                      isSuperMember = true;
                                  }
                              } else if (result.lists[index].flag == 1) { //普通会员标识
                                  if (result.lists[index].isvip > 0) { //是普通会员
                                      isNormalMember = true;
                                  }
                              }
                              if (result.lists[index].flag == 64) { //心悦会员
                                  if (result.lists[index].isvip > 0) { //是心悦会员
                                      isXinYueMember = true;
                                  }
                              }
                          }

                          /** 提出QQ会员发放礼包逻辑*/
                          var type = 3;
                          if (self.playerInfo[ePlayerInfo.IsQQMember] == 0) {
                              type = 0;
                          }
                          if (isSuperMember) {
                              type = 2;
                          } else if (isNormalMember) {
                              type = 1;
                          }
                          self.MemberGiftType(type, exeType);

                          if (isXinYueMember) {
                              self.SendXinYueInfo(1);
                          }
                      } else {
                          logger.error('msdkOauth.load_vip results error, ret == %d, openID == %s, token == %s',
                                       result.ret, openID, token);
                      }
                  })
            .fail(function (error) {
                      logger.error('msdkOauth.load_vip error, openID == %s, token == %s', openID, token);
                  });
    }
};

handler.SendXinYueInfo = function (flag) {
    var route = 'ServerXinYueMember';
    var XinYueFlag = {
        'isXinYue': flag
    };
    this.SendMessage(route, XinYueFlag);
};

handler.UpdateSoul = function (nowTime) {
    this.soulManager.Update(nowTime);
};

/** 根据qqmemberTypeQQ会员类型 发放礼包逻辑 0不是会员  1 普通会员 2 超级会员
 *  添加exeType 0开通qq会员 1续费会员 2开通超级 3续费超级 4登陆验证会员   */
handler.MemberGiftType = function (qqmemberType, exeType) {
    var self = this;
    var accountID = self.playerInfo[ePlayerInfo.ACCOUNTID];
    /** 获取缓存中QQ会员礼包信息*/
    var giftList = self.giftManager.qqMemberGift;


    var sendNew = 0;
    /** 0  发送新手礼包数 */
    var sendOpen = 0;
    /** 0  发送开通礼包数 */
    var sendOpenSuper = 0;
    /** 0  发送开通超级礼包数 */

    for (var index in giftList) {
        //兼容老玩家将新字段  serveruid 默认值 0  换位当前第一次登陆的serveruid
        if (0 == giftList[index][eQQMemberGift.serverUid]) {
            giftList[index][eQQMemberGift.serverUid] = self.playerInfo[ePlayerInfo.serverUid];
        }
        if (defaultValues.QQMemberGiftID === giftList[index][eQQMemberGift.giftID]) {
            /** 领取过新手礼包 不管是不是会员都插入新手礼包数据*/
            sendNew++;
        }
        if (defaultValues.QQMemberOpenGiftID === giftList[index][eQQMemberGift.giftID]) {
            /** 领取过会员礼包 */
            sendOpen++;
        }
        if (defaultValues.QQMemberOpenSuperGiftID === giftList[index][eQQMemberGift.giftID]) {
            /** 领取过超级会员礼包 */
            sendOpenSuper++;
        }
    }
    logger.fatal("****qqMember  sendGiftBegin*** roleid = " + self.id + " qqmemberType:" + qqmemberType + "exeType:"
                 + exeType + "giftNum:,sendNew:" + sendNew + ", sendOpen:" + sendOpen + ", sendOpenSuper:"
                 + sendOpenSuper);
    if (2 == qqmemberType) {
        self.playerInfo[ePlayerInfo.IsQQMember] = 2;
        self.SendInfoMsg(ePlayerInfo.IsQQMember);
        if (4 == exeType && sendNew == 0 && sendOpen == 0 && sendOpenSuper == 0) { //登陆验证会员
            /** 发送新手礼包 */
            self.giftManager.AddGift(defaultValues.QQMemberGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.SendInfoMsg(ePlayerInfo.IsQQMember);
            self.UpdateChartRoleInfo();


            logger.fatal("****qqSuperMember  sendNewGift: roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberGiftID + "exeType:" + exeType);

        } else if (2 == exeType && sendOpenSuper == 0) { //开通超级会员
            self.giftManager.AddGift(defaultValues.QQMemberOpenSuperGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.SendInfoMsg(ePlayerInfo.IsQQMember);
            self.UpdateChartRoleInfo();

            logger.fatal("****qqSuperMember  sendSuperGift: roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberOpenSuperGiftID + "exeType:" + exeType);

        } else if (3 == exeType && sendOpenSuper == 0) {//续费超级会员
            self.giftManager.AddGift(defaultValues.QQMemberOpenSuperGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.SendInfoMsg(ePlayerInfo.IsQQMember);
            self.UpdateChartRoleInfo();

            logger.fatal("****qqSuperMember  sendSuperGift: roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberOpenSuperGiftID + "exeType:" + exeType);
        } else if (1 == exeType && sendOpen == 0) {//续费普通会员
            self.giftManager.AddGift(defaultValues.QQMemberOpenGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.SendInfoMsg(ePlayerInfo.IsQQMember);
            self.UpdateChartRoleInfo();

            logger.fatal("****qqSuperMember  sendOpenGift: roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberOpenGiftID + "exeType:" + exeType);
        }


    } else if (1 == qqmemberType) {
        self.playerInfo[ePlayerInfo.IsQQMember] = 1;
        self.SendInfoMsg(ePlayerInfo.IsQQMember);
        if (4 == exeType && sendNew == 0 && sendOpen == 0 && sendOpenSuper == 0) { //登陆验证会员
            /** 发送新手礼包 */
            self.giftManager.AddGift(defaultValues.QQMemberGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.UpdateChartRoleInfo();

            logger.fatal("****qqNormalMember  sendNewGift: roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberGiftID + "exeType:" + exeType);

        } else if (0 == exeType && sendOpen == 0 && sendOpenSuper == 0) { //开通普通会员
            self.giftManager.AddGift(defaultValues.QQMemberOpenGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.UpdateChartRoleInfo();

            logger.fatal("****qqNormalMember  sendNormalGift:roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberOpenGiftID + "exeType:" + exeType);

        } else if (1 == exeType && sendOpen == 0) { //续费普通会员
            self.giftManager.AddGift(defaultValues.QQMemberOpenGiftID,
                                     defaultValues.QQMemberGiftType, 1);
            self.UpdateChartRoleInfo();

            logger.fatal("****qqNormalMember  sendNormalGift:roleid = " + self.id + ",giftID:"
                         + defaultValues.QQMemberOpenGiftID + "exeType:" + exeType);
        }
    }
    /** 如果不是QQ会员 也插入记录 */
    else if (0 == qqmemberType) {
        self.playerInfo[ePlayerInfo.IsQQMember] = 0;
        self.SendInfoMsg(ePlayerInfo.IsQQMember);
        //只有第一次登陆时候才加载非QQ会员插入未完成礼包记录
        if (4 == exeType && sendNew == 0 && sendOpen == 0 && sendOpenSuper == 0) {
            /** 存入缓存*/
            var giftInfoNew = {
                0: accountID,
                1: defaultValues.QQMemberGiftID,
                2: self.playerInfo[ePlayerInfo.serverUid],
                3: eGiftState.NoOver
            };

            self.giftManager.qqMemberGift.push(giftInfoNew);
            //同步给客户端的礼包信息
            var tempGift = new Array(eGiftInfo.Max);
            tempGift[eGiftInfo.GiftID] = defaultValues.QQMemberGiftID;
            tempGift[eGiftInfo.RoleID] = self.id;
            tempGift[eGiftInfo.GiftType] = eGiftState.NoOver;
            self.giftManager.dataList[defaultValues.QQMemberGiftID] = tempGift;
        }
        logger.fatal("****this player not qqMember  ::roleid : %j ,exeType: %j ,sendNew: %j , sendOpen: %j , sendOpenSuper: %j ",
                     self.id, exeType, sendNew, sendOpen, sendOpenSuper);
    }
    self.giftManager.SendGiftInfo();

};

/**
 * 运营活动函数通知
 * @increaseType        数据索引，战力或者等级
 * @Value               消耗数值，原始值是复值，传入的值为正
 */
handler.notifyOperateLevelUpEvent = function (oldValue, newValue) {
    var self = this;
    self.emit(eventValue.OPERATE_EVENT_REWARD_BY_LEVEL_UP, self, oldValue, newValue);
};

handler.notifyOperateIncreaseZhanLiEvent = function (oldValue, newValue) {
    var self = this;
    self.emit(eventValue.OPERATE_EVENT_REWARD_BY_ZHAN_LI, self, oldValue, newValue);
};

/**
 * 运营活动函数通知
 * @param player
 * @param payValue
 */
handler.notifyCheckBalance = function (payValue) {
    var self = this;
    var vipPoint = self.GetPlayerInfo(gameConst.ePlayerInfo.VipPoint);
    //发送充值事件，更新活动
    self.emit(eventValue.OPERATE_EVENT_REWARD_BY_RECHARGE, self, vipPoint, payValue);
};

handler.removeAllOperateListner = function () {
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_YUAN_BAO);
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_PHYSICAL);
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_LEVEL_UP);
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_ZHAN_LI);
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_RECHARGE);
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_CHART_YUAN_BAO);
    this.removeAllListeners(eventValue.OPERATE_EVENT_REWARD_BY_CHEST_POINT);
};
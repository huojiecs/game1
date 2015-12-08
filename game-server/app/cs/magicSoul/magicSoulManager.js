/**
 * Created with JetBrains WebStorm.
 * User: engame
 * Date: 14-2-27
 * Time: 上午10:45
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');

var eMagicSoulInfo = gameConst.eMagicSoulInfo;
var eAttFactor = gameConst.eAttFactor;
var eAttInfo = gameConst.eAttInfo;
var tMagicSoulInfo = templateConst.tMagicSoulInfo;
var tMagicSoul = templateConst.tMagicSoul;
var tMagicSoulSkill = templateConst.tMagicSoulSkill;
var eAttLevel = gameConst.eAttLevel;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var globalFunction = require('../../tools/globalFunction');
var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.MagicSoulTemplate = {};
    this.MagicSoulInfoTemplate = {};
    this.magicSoulInfo = new Array(eMagicSoulInfo.Max);
    for (var i = 0; i < eMagicSoulInfo.Max; ++i) {
        this.magicSoulInfo[i] = 0;
    }
};

var handler = Handler.prototype;
handler.GetTemplate = function () {
    return this.MagicSoulInfoTemplate;
};

handler.GetMagicSoulInfo = function (Index) {
    if (IsTrueIndex(Index)) {
        return this.magicSoulInfo[Index];
    }
    return null;
};

handler.SetMagicSoulInfo = function (Index, value) {
    if (IsTrueIndex(Index)) {
        this.magicSoulInfo[Index] = value;
    }
};

handler.SetMagicSoulAllInfo = function (magicSoulInfo) {
    this.magicSoulInfo = magicSoulInfo;

};

handler.GetMagicSoulAllInfo = function () {
    return this.magicSoulInfo;
};

function IsTrueIndex(Index) {
    if (Index >= 0 && Index < eMagicSoulInfo.Max) {
        return true;
    }
    return false;
};

handler.LoadDataByDB = function ( magicSoulInfo) {
    var player = this.owner;
    var initTemplate = templateManager.GetTemplateByID('InitTemplate', player.GetPlayerInfo(gameConst.ePlayerInfo.TEMPID));
    if (magicSoulInfo.length == 0) {
        var magicSoulID = initTemplate['magicSoulID'];
        var magicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', magicSoulID);
        magicSoulInfo[eMagicSoulInfo.TEMPID] = magicSoulID;
        magicSoulInfo[eMagicSoulInfo.RoleID] = player.id;
        magicSoulInfo[eMagicSoulInfo.Zhanli] = 0;
        magicSoulInfo[eMagicSoulInfo.InfoID] = magicSoulTemplate[tMagicSoul.att_0];
        magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_0] = magicSoulTemplate[tMagicSoul.openSkillID];
        magicSoulInfo[eMagicSoulInfo.SkillID_1] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_2] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_3] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_4] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_5] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_6] = 0;
        magicSoulInfo[eMagicSoulInfo.SkillID_7] = 0;
    }
    if (player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel) >= 25 && magicSoulInfo[eMagicSoulInfo.TEMPID] == initTemplate['magicSoulID']) {
        var magicSoulTemplate_1 = templateManager.GetTemplateByID('MagicSoulTemplate', magicSoulInfo[eMagicSoulInfo.TEMPID]);
        var magicSoulTemplate_2 = templateManager.GetTemplateByID('MagicSoulTemplate', magicSoulTemplate_1[tMagicSoul.nextOpenID]);
        magicSoulInfo[eMagicSoulInfo.TEMPID] = magicSoulTemplate_1[tMagicSoul.nextOpenID];
        magicSoulInfo[eMagicSoulInfo.Zhanli] = 0;
        magicSoulInfo[eMagicSoulInfo.InfoID] = magicSoulTemplate_2[tMagicSoul.att_0];
        magicSoulInfo[eMagicSoulInfo.SkillID_0] = magicSoulTemplate_2[tMagicSoul.openSkillID];
    }
    this.magicSoulInfo = magicSoulInfo;

    //判断是否是零阶
    if (magicSoulInfo[eMagicSoulInfo.TEMPID] == player.GetMagicSoulInitID()) {
        return;
    }

    var tempID = magicSoulInfo[eMagicSoulInfo.TEMPID];
    var infoID = magicSoulInfo[eMagicSoulInfo.InfoID];
    var ExNum = magicSoulInfo[eMagicSoulInfo.ExNum];
    var Zhanli = magicSoulInfo[eMagicSoulInfo.Zhanli];//总战力
    //var skillList = new Array(8);
    //for( var i = 0; i < 8; ++i ){
    //    skillList[i] = magicSoulInfo[eMagicSoulInfo.SkillID_0 +i];
    //}
    var MagicSoulTemplate = null;
    var MagicSoulInfoTemplate = null;
    if (tempID > 0) {
        MagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', tempID);
    }
    if (infoID > 0) {
        MagicSoulInfoTemplate = templateManager.GetTemplateByID('MagicSoulInfoTemplate', infoID);
    }
    var jiaZhanLi = 0;
    var attZhanLi = 0;
    var skillZhanLi = 0;
    if (MagicSoulInfoTemplate != null && MagicSoulTemplate != null) {
        jiaZhanLi = this.SetZhanli(MagicSoulTemplate[tMagicSoul.upAdd_Zhan], true, false);
        attZhanLi = this.SetMagicSoulAtt(MagicSoulInfoTemplate, true, false);
    }
    for (var i = 0; i < 8; ++i) {
        skillZhanLi += this.SetMagicSoulSkill(magicSoulInfo[eMagicSoulInfo.SkillID_0 + i], true, false);
    }
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] = jiaZhanLi + attZhanLi + skillZhanLi;
};

handler.SetZhanli = function (magicSoulZhanli, isAdd, isSend) {

    if (magicSoulZhanli != null && 0 < magicSoulZhanli) {
        this.owner.UpdateZhanli(magicSoulZhanli, isAdd, isSend);
        return magicSoulZhanli;

    }
    return 0;
};

handler.SetMagicSoulSkill = function (skillID, isAdd, isSend) { //加减技能属性和战力
    if (skillID == 0) {
        return 0;
    }
    var magicSoulSkillTemplate = templateManager.GetTemplateByID('MagicSoulSkillTemplate', skillID);
    if (magicSoulSkillTemplate == null) {
        return 0;
    }
    var attList = new Array(eAttInfo.MAX);
    var magicSoulZhanli = 0;
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attList[i] = temp;
    }
    var tempMaxNum = magicSoulSkillTemplate[tMagicSoulSkill['maxNum']];
    for (var i = 0; i < tempMaxNum; ++i) {
        var attID = magicSoulSkillTemplate[tMagicSoulSkill['att_' + i]];
        var attNum = magicSoulSkillTemplate[tMagicSoulSkill['AttNum_' + i]];
        switch (attID) {
            case eAttInfo.ATTACK:        //攻击力
                magicSoulZhanli += attNum * eAttFactor.GONGJI;
                break;
            case eAttInfo.DEFENCE:         //防御力
                magicSoulZhanli += attNum * eAttFactor.FANGYU;
                break;
            case eAttInfo.MAXHP:         //最大血量
                magicSoulZhanli += attNum * eAttFactor.MAXHP;
                break;
            case eAttInfo.MAXMP:         //最大魔法量
                magicSoulZhanli += attNum * eAttFactor.MAXMP;
                break;
            case eAttInfo.CRIT:           //暴击值
                magicSoulZhanli += attNum * eAttFactor.BAOJILV;
                break;
            case eAttInfo.CRITDAMAGE:           //暴击伤害
                magicSoulZhanli += attNum * eAttFactor.BAOJISHANGHAI;
                break;
            case eAttInfo.DAMAGEUP:           //伤害提升
                magicSoulZhanli += attNum * eAttFactor.SHANGHAITISHENG;
                break;
            case eAttInfo.ANTICRIT:           //暴击抵抗
                magicSoulZhanli += attNum * eAttFactor.BAOJIDIKANG;
                break;
            case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
                magicSoulZhanli += attNum * eAttFactor.BJSHHJM;
                break;
            case eAttInfo.DAMAGEREDUCE:           //伤害减免
                magicSoulZhanli += attNum * eAttFactor.SHANGHAIJIANMIAN;
                break;
            case eAttInfo.ANTIHUNMI:           //昏迷抵抗
                magicSoulZhanli += attNum * eAttFactor.HUNMIDIKANG;
                break;
            case eAttInfo.ANTIHOUYANG:           //后仰抵抗
                magicSoulZhanli += attNum * eAttFactor.HOUYANGDIKANG;
                break;
            case eAttInfo.ANTIFUKONG:           //浮空抵抗
                magicSoulZhanli += attNum * eAttFactor.FUKONGDIKANG;
                break;
            case eAttInfo.ANTIJITUI:           //击退抵抗
                magicSoulZhanli += attNum * eAttFactor.JITUIDIKANG;
                break;
            case eAttInfo.HUNMIRATE:           //昏迷几率
                magicSoulZhanli += attNum * eAttFactor.HUNMIJILV;
                break;
            case eAttInfo.HOUYANGRATE:           //后仰几率
                magicSoulZhanli += attNum * eAttFactor.HOUYANGJILV;
                break;
            case eAttInfo.FUKONGRATE:           //浮空几率
                magicSoulZhanli += attNum * eAttFactor.FUKONGJILV;
                break;
            case eAttInfo.JITUIRATE:           //击退几率
                magicSoulZhanli += attNum * eAttFactor.JITUIJILV;
                break;

            case eAttInfo.FREEZERATE:           //昏迷几率
                magicSoulZhanli += attNum * eAttFactor.FREEZERATE;
                break;
            case eAttInfo.STONERATE:           //石化几率
                magicSoulZhanli += attNum * eAttFactor.STONERATE;
                break;
            case eAttInfo.ANTIFREEZE:           //冰冻抵抗
                magicSoulZhanli += attNum * eAttFactor.ANTIFREEZE;
                break;
            case eAttInfo.ANTISTONE:           //击退几率
                magicSoulZhanli += attNum * eAttFactor.ANTISTONE;
                break;
        }
        attList[attID][0] += attNum;
    }
    magicSoulZhanli = Math.floor(magicSoulZhanli * 1);
    this.owner.UpdateZhanli(magicSoulZhanli, isAdd, isSend);
    this.owner.UpdateAtt(eAttLevel.ATTLEVEL_EQUIP, attList, isAdd, isSend);
    return magicSoulZhanli;
};

handler.SetMagicSoulAtt = function (magicSoulInfoTemp, isAdd, isSend) { //加减八种属性和战力
    var attList = new Array(eAttInfo.MAX);
    var magicSoulZhanli = 0;
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attList[i] = temp;
    }
    for (var i = 0; i < 8; ++i) {
        var attID = magicSoulInfoTemp[tMagicSoulInfo['att_' + i]];
        var attNum = magicSoulInfoTemp[tMagicSoulInfo['AttNum_' + i]];
        switch (attID) {
            case eAttInfo.ATTACK:        //攻击力
                magicSoulZhanli += attNum * eAttFactor.GONGJI;
                break;
            case eAttInfo.DEFENCE:         //防御力
                magicSoulZhanli += attNum * eAttFactor.FANGYU;
                break;
            case eAttInfo.MAXHP:         //最大血量
                magicSoulZhanli += attNum * eAttFactor.MAXHP;
                break;
            case eAttInfo.MAXMP:         //最大魔法量
                magicSoulZhanli += attNum * eAttFactor.MAXMP;
                break;
            case eAttInfo.CRIT:           //暴击值
                magicSoulZhanli += attNum * eAttFactor.BAOJILV;
                break;
            case eAttInfo.CRITDAMAGE:           //暴击伤害
                magicSoulZhanli += attNum * eAttFactor.BAOJISHANGHAI;
                break;
            case eAttInfo.ANTICRIT:           //暴击抵抗
                magicSoulZhanli += attNum * eAttFactor.BAOJIDIKANG;
                break;
            case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
                magicSoulZhanli += attNum * eAttFactor.BJSHHJM;
                break;
        }
        attList[attID][0] += attNum;
    }
    magicSoulZhanli = Math.floor(magicSoulZhanli * 1);
    this.owner.UpdateZhanli(magicSoulZhanli, isAdd, isSend);
    this.owner.UpdateAtt(eAttLevel.ATTLEVEL_EQUIP, attList, isAdd, isSend);
    return magicSoulZhanli;
};

handler.SendMagicSoulMsg = function () {
    if (null == this.owner) {
        logger.error('SendSoulMsg玩家是空的');
        return;
    }
    var route = 'ServerMagicSoulUpdate';
    var magicSoulMsg = {
        magicSoulInfo: {}
    };
    if (null == this.magicSoulInfo) {
        return;
    }
    else {
        var tempMagicSoul = this.magicSoulInfo;

        for (var i = 0; i < eMagicSoulInfo.Max; ++i) {
            magicSoulMsg.magicSoulInfo[i] = tempMagicSoul[i];
        }
    }
    this.owner.SendMessage(route, magicSoulMsg);
};

handler.GetSqlStr = function () {
    var magicSoulInfoSqlStr = '';

    var temp = this.magicSoulInfo;
    magicSoulInfoSqlStr += '(';
    for (var i = 0; i < eMagicSoulInfo.Max; ++i) {
        var value = temp[i];
        magicSoulInfoSqlStr += value + ',';
    }
    magicSoulInfoSqlStr = magicSoulInfoSqlStr.substring(0, magicSoulInfoSqlStr.length - 1);
    magicSoulInfoSqlStr += ')';
//    return magicSoulInfoSqlStr;

    var sqlString = utilSql.BuildSqlValues([this.magicSoulInfo]);

    if (sqlString !== magicSoulInfoSqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, magicSoulInfoSqlStr);
    }

    return sqlString;
};

handler.SacrificeMagicSoul = function (tempID, SacrificeType) {
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldMagicSoulInfo = this.magicSoulInfo;
    if (null == oldMagicSoulInfo) {
        return errorCodes.NoMagicSoul;
    }
    var oldMagicSoulExNum = oldMagicSoulInfo[eMagicSoulInfo.ExNum];
    var oldTempID = oldMagicSoulInfo[eMagicSoulInfo.TEMPID];
    var oldInfoID = oldMagicSoulInfo[eMagicSoulInfo.InfoID];
    var oldMagicSoulTemplate = null;
    var oldMagicSoulInfoTemplate = null;
    if (oldTempID > 0) {
        oldMagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', oldTempID);
    }
    if (oldInfoID > 0) {
        oldMagicSoulInfoTemplate = templateManager.GetTemplateByID('MagicSoulInfoTemplate', oldInfoID);
    }
    if (null == oldMagicSoulTemplate || null == oldMagicSoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }
    if (10 <= oldMagicSoulInfoTemplate[tMagicSoulInfo.level]) {
        return errorCodes.MagicSoul_MaxLevel;
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //var log_magicSoulGuid = log_getGuid.GetUuid( );
    //var log_addTime = utilSql.DateToString( new Date() );
    //var log_magicSoulType = gameConst.eMagicSoulType.NormalSacrifice;
    //var log_magicSoulArgs = [ log_magicSoulGuid,oldMagicSoulInfo[eMagicSoulInfo.RoleID], gameConst.eMagicSoulType.NormalSacrifice, oldSoul.GetSoulInfo(eSoulInfo.LEVEL),
    //    oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0), oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1), oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2) ];

    //var log_MoneyArgs1 = [ log_getGuid.GetUuid( ), oldSoul.GetSoulInfo(eSoulInfo.RoleID), gameConst.eMoneyChangeType.SmeltSoul,
    //    log_soulGuid, soulID, assetsManager.GetAssetsValue( soulID ) ];
    //
    //if (smeltType == 1) {           //判断是否为强力炼魂引起的金钱变化
    //    var log_MoneyArgs = [ log_getGuid.GetUuid( ), oldSoul.GetSoulInfo(eSoulInfo.RoleID), gameConst.eMoneyChangeType.SmeltSoul,
    //        log_soulGuid, SoulInfoTemplate[tSoulInfo.comMoneyID], assetsManager.GetAssetsValue( SoulInfoTemplate[tSoulInfo.comMoneyID] ) ];
    //}
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var oldMaxExperienceNum = oldMagicSoulInfoTemplate[tMagicSoulInfo.maxExperienceNum];
    var cost = 0;
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    var tempAssetsID = 0;
    if (SacrificeType == 0) {
        cost = oldMagicSoulInfoTemplate[tMagicSoulInfo.comGoldNum];
        tempAssetsID = globalFunction.GetMoneyTemp();
    }
    else if (SacrificeType == 1) {
        cost = oldMagicSoulInfoTemplate[tMagicSoulInfo.comMoneyNum];
        tempAssetsID = globalFunction.GetYuanBaoTemp();
    }
    else {
        return errorCodes.ParameterWrong;
    }
    if (assetsManager.CanConsumeAssets(tempAssetsID, cost) == false) {
        return errorCodes.NoAssets;
    }
    //assetsManager.SetAssetsValue(tempAssetsID, -cost);
    assetsManager.AlterAssetsValue(tempAssetsID, -cost, eAssetsReduce.SacrificeMagicSoul);
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.MagicSoulJi, 0, 1);     //任务完成
    if (oldMagicSoulExNum < (oldMaxExperienceNum - 1)) {//单纯加经验
        this.magicSoulInfo[eMagicSoulInfo.ExNum]++;
        this.SendMagicSoulMsg();
        ////////////////////////////////////////////////////////////////
        return 0;
    } else {//升星加属性该表oldMagicSoulExNum清零
        //this.magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
    }
    //**下边是升星逻辑**//
    //var jiaZhanLi = 0;
    var reduceAttZhanLi = 0;
    if (oldMagicSoulInfoTemplate != null) {
        //jiaZhanLi = this.SetZhanli(oldMagicSoulTemplate[tMagicSoul.upAdd_Zhan], false, false);
        reduceAttZhanLi = this.SetMagicSoulAtt(oldMagicSoulInfoTemplate, false, false);
    }
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] -= reduceAttZhanLi;

    var newInfoID = oldMagicSoulInfoTemplate[tMagicSoulInfo.nextOpenID];
    if (newInfoID == 0) {
        return errorCodes.MagicSoul_IsMaxLevel;
    }
    this.magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
    this.magicSoulInfo[eMagicSoulInfo.InfoID] = newInfoID;
    var newMagicSoulInfoTemplate = null;
    if (newInfoID > 0) {
        newMagicSoulInfoTemplate = templateManager.GetTemplateByID('MagicSoulInfoTemplate', newInfoID);
    }
    if (null == newMagicSoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }
    if (10 <= newMagicSoulInfoTemplate[tMagicSoulInfo.level]) {//满级
        this.magicSoulInfo[eMagicSoulInfo.ExNum] = newMagicSoulInfoTemplate[tMagicSoulInfo.maxExperienceNum];
    } else {
        this.magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
    }
    var addAttZhanLi = 0;
    if (newMagicSoulInfoTemplate != null) {
        //jiaZhanLi = this.SetZhanli(oldMagicSoulTemplate[tMagicSoul.upAdd_Zhan], false, false);
        addAttZhanLi = this.SetMagicSoulAtt(newMagicSoulInfoTemplate, true, true);
    }
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] += addAttZhanLi;
    this.SendMagicSoulMsg();
    return 0;
};

handler.SurmountMagicSoul = function (tempID, SurmountType) {

    var msg = {
        result: 0,
        assetsNum: 0
    }
    if (null == this.owner) {
        msg.result = errorCodes.NoRole;
        return msg;
    }
    var oldMagicSoulInfo = this.magicSoulInfo;
    if (null == oldMagicSoulInfo) {
        msg.result = errorCodes.NoMagicSoul;
        return msg;
    }

    //表数据
    var oldTempID = oldMagicSoulInfo[eMagicSoulInfo.TEMPID];
    var oldInfoID = oldMagicSoulInfo[eMagicSoulInfo.InfoID];
    var oldMagicSoulTemplate = null;
    var oldMagicSoulInfoTemplate = null;
    if (oldTempID > 0) {
        oldMagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', oldTempID);
    }
    if (oldInfoID > 0) {
        oldMagicSoulInfoTemplate = templateManager.GetTemplateByID('MagicSoulInfoTemplate', oldInfoID);
    }
    if (null == oldMagicSoulTemplate || null == oldMagicSoulInfoTemplate) {
        msg.result = errorCodes.NoTemplate;
        return msg;
    }

    //验证升品条件
    if (10 != oldMagicSoulInfoTemplate[tMagicSoulInfo.level]) {
        msg.result = errorCodes.MagicSoul_NotMaxLevel;
        return msg;
    }
    var ExpLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    if (ExpLevel < oldMagicSoulTemplate[tMagicSoul.level]) {
        msg.result = errorCodes.ExpLevel;
        return msg;
    }
    if (0 == oldMagicSoulTemplate[tMagicSoul.nextOpenID]) {
        msg.result = errorCodes.MagicSoul_IsMaxLevel;
        return msg;
    }
    var cost = 0;
    cost = oldMagicSoulTemplate[tMagicSoul.magicCrysta];
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        msg.result = errorCodes.SystemWrong;
        return msg;
    }


    if (SurmountType == 1) { //补满
        var AssetsNum = 0;
        var addCost = 0;
        if (assetsManager.CanConsumeAssets(globalFunction.GetMoJingTemp(), cost) == true) {
            msg.result = errorCodes.MagicSoul_MoJingIsAchieve;
            return msg;
        }
        AssetsNum = assetsManager.GetAssetsValue(globalFunction.GetMoJingTemp());
        if (AssetsNum >= 0) {
            addCost = cost - AssetsNum;
        }
        if (addCost > 0) {
            var AllTemplate = templateManager.GetTemplateByID('AllTemplate', 40);
            var temp = addCost * AllTemplate['attnum'];
            if (assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), temp) == false) {
                msg.result = errorCodes.NoAssets;
                return msg;
            }
            assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -temp);
            assetsManager.SetAssetsValue(globalFunction.GetMoJingTemp(), addCost);

            //this.SendMagicSoulMsg();
            msg.result = 0;
            msg.assetsNum = assetsManager.GetAssetsValue(globalFunction.GetMoJingTemp());
            return msg;
        }
        msg.result = errorCodes.NoTemplate;
        return msg;
    }

    //**下边是突破逻辑
    if (SurmountType != 0) {
        msg.result = errorCodes.ParameterWrong;
        return msg;
    }

    //财产
    if (assetsManager.CanConsumeAssets(globalFunction.GetMoJingTemp(), cost) == false) {
        msg.result = errorCodes.NoAssets;
        return msg;
    }
    assetsManager.SetAssetsValue(globalFunction.GetMoJingTemp(), -cost);

    //战力
    var reduceJiaZhanLi = 0;
    var reduceAttZhanLi = 0;
    if (oldMagicSoulInfoTemplate != null && oldMagicSoulTemplate != null) {
        reduceJiaZhanLi = this.SetZhanli(oldMagicSoulTemplate[tMagicSoul.upAdd_Zhan], false, false);
        reduceAttZhanLi = this.SetMagicSoulAtt(oldMagicSoulInfoTemplate, false, false);
    }
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] =
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] - reduceJiaZhanLi - reduceAttZhanLi;

    //新模板
    var newMagicSoulTemplate = null;
    var newMagicSoulInfoTemplate = null;
    var newMagicSoulSkillTemplate = null;
    if (oldMagicSoulTemplate[tMagicSoul.nextOpenID] > 0) {
        newMagicSoulTemplate =
        templateManager.GetTemplateByID('MagicSoulTemplate', oldMagicSoulTemplate[tMagicSoul.nextOpenID]);
    }
    if (null == newMagicSoulTemplate) {
        msg.result = errorCodes.NoTemplate;
        return msg;
    }
    this.magicSoulInfo[eMagicSoulInfo.TEMPID] = oldMagicSoulTemplate[tMagicSoul.nextOpenID];
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.MagicSoul,
                                                 this.magicSoulInfo[eMagicSoulInfo.TEMPID], 1);   //任务完成
    if (newMagicSoulTemplate[tMagicSoul.att_0] > 0) {
        newMagicSoulInfoTemplate =
        templateManager.GetTemplateByID('MagicSoulInfoTemplate', newMagicSoulTemplate[tMagicSoul.att_0]);
    }
    if (null == newMagicSoulInfoTemplate) {
        msg.result = errorCodes.NoTemplate;
        return msg;
    }
    this.magicSoulInfo[eMagicSoulInfo.InfoID] = newMagicSoulTemplate[tMagicSoul.att_0];
    var jiaZhanLi = 0;
    var attZhanLi = 0;
    var skillZhanLi = 0;
    if (newMagicSoulTemplate[tMagicSoul.openSkillID] > 0) { // 开启新技能
        newMagicSoulSkillTemplate =
        templateManager.GetTemplateByID('MagicSoulSkillTemplate', newMagicSoulTemplate[tMagicSoul.openSkillID]);
        if (null == newMagicSoulSkillTemplate) {
            msg.result = errorCodes.NoTemplate;
            return msg;
        }
        var arrayID = newMagicSoulSkillTemplate[tMagicSoulSkill.arrayID] + 4;
        if (this.magicSoulInfo[arrayID] == 0) {
            this.magicSoulInfo[arrayID] = newMagicSoulTemplate[tMagicSoul.openSkillID];
            skillZhanLi = this.SetMagicSoulSkill(this.magicSoulInfo[arrayID], true, false);
        }
    }
    jiaZhanLi = this.SetZhanli(newMagicSoulTemplate[tMagicSoul.upAdd_Zhan], true, false);
    attZhanLi = this.SetMagicSoulAtt(newMagicSoulInfoTemplate, true, true);
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] =
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] + jiaZhanLi + attZhanLi + skillZhanLi;
    this.magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
    this.SendMagicSoulMsg();
    msg.result = 0;
    msg.assetsNum = assetsManager.GetAssetsValue(globalFunction.GetMoJingTemp());


    //公告
    var jieLevel = Math.floor(newMagicSoulTemplate.jieLevel /10000);
    var noticeID = "magicSoulJie_" + jieLevel;
    this.owner.GetNoticeManager().SendRepeatableGM(gameConst.eGmType.MagicSoul, noticeID);

    return msg;
};

handler.OpenMagicSoul = function () {
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    if (0 != this.magicSoulInfo[eMagicSoulInfo.InfoID]) {
        return errorCodes.MagicSoul_IsOpen;
    }
    var magicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate',
                                                            this.magicSoulInfo[eMagicSoulInfo.TEMPID]);
    if (null == magicSoulTemplate) {
        return errorCodes.NoTemplate;
    }
    if (magicSoulTemplate[tMagicSoul.nextOpenID] > 0) {
        this.magicSoulInfo[eMagicSoulInfo.TEMPID] = magicSoulTemplate[tMagicSoul.nextOpenID];
    }
    var newMagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate',
                                                               this.magicSoulInfo[eMagicSoulInfo.TEMPID]);
    if (null == newMagicSoulTemplate) {
        return errorCodes.NoTemplate;
    }

    this.magicSoulInfo[eMagicSoulInfo.Zhanli] = 0;
    this.magicSoulInfo[eMagicSoulInfo.InfoID] = newMagicSoulTemplate[tMagicSoul.att_0];
    this.magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_0] = newMagicSoulTemplate[tMagicSoul.openSkillID];
    this.magicSoulInfo[eMagicSoulInfo.SkillID_1] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_2] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_3] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_4] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_5] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_6] = 0;
    this.magicSoulInfo[eMagicSoulInfo.SkillID_7] = 0;


    var tempID = this.magicSoulInfo[eMagicSoulInfo.TEMPID];
    var infoID = this.magicSoulInfo[eMagicSoulInfo.InfoID];
    var ExNum = this.magicSoulInfo[eMagicSoulInfo.ExNum];
    var Zhanli = this.magicSoulInfo[eMagicSoulInfo.Zhanli];//总战力
    //var skillList = new Array(8);
    //for( var i = 0; i < 8; ++i ){
    //    skillList[i] = magicSoulInfo[eMagicSoulInfo.SkillID_0 +i];
    //}
    var MagicSoulTemplate = null;
    var MagicSoulInfoTemplate = null;
    if (tempID > 0) {
        MagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', tempID);
    }
    if (infoID > 0) {
        MagicSoulInfoTemplate = templateManager.GetTemplateByID('MagicSoulInfoTemplate', infoID);
    }
    var jiaZhanLi = 0;
    var attZhanLi = 0;
    var skillZhanLi = 0;
    if (MagicSoulInfoTemplate != null && MagicSoulTemplate != null) {
        jiaZhanLi = this.SetZhanli(MagicSoulTemplate[tMagicSoul.upAdd_Zhan], true, false);
        attZhanLi = this.SetMagicSoulAtt(MagicSoulInfoTemplate, true, false);
    }
    for (var i = 0; i < 8; ++i) {
        skillZhanLi += this.SetMagicSoulSkill(this.magicSoulInfo[eMagicSoulInfo.SkillID_0 + i], true, true);
    }
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] = jiaZhanLi + attZhanLi + skillZhanLi;
    this.SendMagicSoulMsg();
    return 0;
};

handler.UpSkillMagicSoul = function (tempID, UpSkillType) {//tempID:0~7 UpSkillType:0~1
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldMagicSoulInfo = this.magicSoulInfo;
    if (null == oldMagicSoulInfo) {
        return errorCodes.NoMagicSoul;
    }
    var oldTempID = oldMagicSoulInfo[eMagicSoulInfo.TEMPID];
    var oldMagicSoulTemplate = null;
    if (oldTempID > 0) {
        oldMagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', oldTempID);
    }
    if (null == oldMagicSoulTemplate) {
        return errorCodes.NoTemplate;
    }
    var maxSkillLevel = oldMagicSoulTemplate[tMagicSoul.maxSkillLevel];//允许最大技能等级

    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    var skillID = 0;
    if (tempID <= 7) {
        skillID = oldMagicSoulInfo[5 + tempID];
    }
    var oldMagicSoulSkillTemplate = null;
    if (skillID > 0) { //技能存在
        oldMagicSoulSkillTemplate = templateManager.GetTemplateByID('MagicSoulSkillTemplate', skillID);
    }
    if (null == oldMagicSoulSkillTemplate) {
        return errorCodes.NoTemplate;
    }
    if (oldMagicSoulSkillTemplate[tMagicSoulSkill.nextattID] == 0) {//最高等级
        return errorCodes.MagicSoul_SkillIsMaxLevel;
    }
    if (oldMagicSoulSkillTemplate[tMagicSoulSkill.level] >= maxSkillLevel) {
        return errorCodes.MagicSoul_NotMoLingLevel;
    }
    var magicFruitNum = oldMagicSoulSkillTemplate[tMagicSoulSkill.magicFruitNum];//升级需要神果数量
    if (UpSkillType == 1) { //补满
        var AssetsNum = 0;
        var addCost = 0;
        if (assetsManager.CanConsumeAssets(globalFunction.GetShenGuoTemp(), magicFruitNum) == true) {
            return errorCodes.MagicSoul_ShenGuoIsAchieve;
        }
        AssetsNum = assetsManager.GetAssetsValue(globalFunction.GetShenGuoTemp());
        if (AssetsNum >= 0) {
            addCost = magicFruitNum - AssetsNum;
        }
        if (addCost > 0) {
            var AllTemplate = templateManager.GetTemplateByID('AllTemplate', 41);
            var temp = addCost * AllTemplate['attnum'];
            if (assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), temp) == false) {
                return errorCodes.NoAssets;
            }
            assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -temp);
            assetsManager.SetAssetsValue(globalFunction.GetShenGuoTemp(), addCost);
            this.SendMagicSoulMsg();
            return 0;
        }
        return errorCodes.NoTemplate;
    }

    //**下边是升级逻辑
    if (UpSkillType != 0) {
        return errorCodes.ParameterWrong;
    }
    if (assetsManager.CanConsumeAssets(globalFunction.GetShenGuoTemp(), magicFruitNum) == false) {
        return errorCodes.NoAssets;
    }
    assetsManager.SetAssetsValue(globalFunction.GetShenGuoTemp(), -magicFruitNum);
    var reduceSkillZhanLi = 0;
    if (oldMagicSoulSkillTemplate != null) {
        reduceSkillZhanLi = this.SetMagicSoulSkill(skillID, false, false);
    }
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] = this.magicSoulInfo[eMagicSoulInfo.Zhanli] - reduceSkillZhanLi;
    var newSkillID = 0;
    newSkillID = oldMagicSoulSkillTemplate[tMagicSoulSkill.nextattID];

    var newMagicSoulSkillTemplate = null;
    if (newSkillID > 0) { //技能存在
        newMagicSoulSkillTemplate = templateManager.GetTemplateByID('MagicSoulSkillTemplate', newSkillID);
    }
    if (null == newMagicSoulSkillTemplate) {
        return errorCodes.NoTemplate;
    }
    this.magicSoulInfo[5 + tempID] = newSkillID;
    var newSkillZhanLi = 0;
    newSkillZhanLi = this.SetMagicSoulSkill(newSkillID, true, true);
    this.magicSoulInfo[eMagicSoulInfo.Zhanli] = this.magicSoulInfo[eMagicSoulInfo.Zhanli] + newSkillZhanLi;

    this.SendMagicSoulMsg();
    return 0;
};

handler.Reward = function(attID){
    if (null === this.owner) {
        return errorCodes.NoRole;
    }
    var oldMagicSoulInfo = this.magicSoulInfo;
    if (null === oldMagicSoulInfo) {
        return errorCodes.NoMagicSoul;
    }
    var oldMagicSoulExNum = oldMagicSoulInfo[eMagicSoulInfo.ExNum];
    var nowTempID = oldMagicSoulInfo[eMagicSoulInfo.TEMPID];

    if(attID > nowTempID){
        for(var id = nowTempID;id <= attID; id ++){
            if(null != templateManager.GetTemplateByID('MagicSoulTemplate', id)){
                var oldTempID = oldMagicSoulInfo[eMagicSoulInfo.TEMPID];
                var oldInfoID = oldMagicSoulInfo[eMagicSoulInfo.InfoID];

                var oldMagicSoulTemplate = null;
                var oldMagicSoulInfoTemplate = null;
                if (oldTempID > 0) {
                    oldMagicSoulTemplate = templateManager.GetTemplateByID('MagicSoulTemplate', oldTempID);
                }
                if (oldInfoID > 0) {
                    oldMagicSoulInfoTemplate = templateManager.GetTemplateByID('MagicSoulInfoTemplate', oldInfoID);
                }
                if (null == oldMagicSoulTemplate || null == oldMagicSoulInfoTemplate) {
                    return;
                }
                if (0 == oldMagicSoulTemplate[tMagicSoul.nextOpenID]) {
                    return;
                }
                //**下边是突破逻辑
                var reduceJiaZhanLi = 0;
                var reduceAttZhanLi = 0;
                if (oldMagicSoulInfoTemplate != null && oldMagicSoulTemplate != null) {
                    reduceJiaZhanLi = this.SetZhanli(oldMagicSoulTemplate[tMagicSoul.upAdd_Zhan], false, false);
                    reduceAttZhanLi = this.SetMagicSoulAtt(oldMagicSoulInfoTemplate, false, false);
                }
                this.magicSoulInfo[eMagicSoulInfo.Zhanli] =
                this.magicSoulInfo[eMagicSoulInfo.Zhanli] - reduceJiaZhanLi - reduceAttZhanLi;

                var newMagicSoulTemplate = null;
                var newMagicSoulInfoTemplate = null;
                var newMagicSoulSkillTemplate = null;
                if (oldMagicSoulTemplate[tMagicSoul.nextOpenID] > 0) {
                    newMagicSoulTemplate =
                    templateManager.GetTemplateByID('MagicSoulTemplate', oldMagicSoulTemplate[tMagicSoul.nextOpenID]);
                }
                if (null === newMagicSoulTemplate) {
                    return ;
                }
                this.magicSoulInfo[eMagicSoulInfo.TEMPID] = oldMagicSoulTemplate[tMagicSoul.nextOpenID];
                this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.MagicSoul,
                                                             this.magicSoulInfo[eMagicSoulInfo.TEMPID], 1);   //任务完成
                if (newMagicSoulTemplate[tMagicSoul.att_0] > 0) {
                    newMagicSoulInfoTemplate =
                    templateManager.GetTemplateByID('MagicSoulInfoTemplate', newMagicSoulTemplate[tMagicSoul.att_0]);
                }
                if (null === newMagicSoulInfoTemplate) {
                    return ;
                }
                this.magicSoulInfo[eMagicSoulInfo.InfoID] = newMagicSoulTemplate[tMagicSoul.att_0];
                var jiaZhanLi = 0;
                var attZhanLi = 0;
                var skillZhanLi = 0;
                if (newMagicSoulTemplate[tMagicSoul.openSkillID] > 0) { // 开启新技能
                    newMagicSoulSkillTemplate =
                    templateManager.GetTemplateByID('MagicSoulSkillTemplate', newMagicSoulTemplate[tMagicSoul.openSkillID]);
                    if (null == newMagicSoulSkillTemplate) {
                        return ;
                    }
                    var arrayID = newMagicSoulSkillTemplate[tMagicSoulSkill.arrayID] + 4;
                    if (this.magicSoulInfo[arrayID] == 0) {
                        this.magicSoulInfo[arrayID] = newMagicSoulTemplate[tMagicSoul.openSkillID];
                        skillZhanLi = this.SetMagicSoulSkill(this.magicSoulInfo[arrayID], true, false);
                    }
                }
                jiaZhanLi = this.SetZhanli(newMagicSoulTemplate[tMagicSoul.upAdd_Zhan], true, false);
                attZhanLi = this.SetMagicSoulAtt(newMagicSoulInfoTemplate, true, true);
                this.magicSoulInfo[eMagicSoulInfo.Zhanli] =
                this.magicSoulInfo[eMagicSoulInfo.Zhanli] + jiaZhanLi + attZhanLi + skillZhanLi;
                this.magicSoulInfo[eMagicSoulInfo.ExNum] = 0;
                this.SendMagicSoulMsg();
            }
        }
    }

};
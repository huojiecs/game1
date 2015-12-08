/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 上午10:15
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var eItemInfo = gameConst.eItemInfo;
var defaultValues = require('../../tools/defaultValues');
var eAttInfo = gameConst.eAttInfo;
var tItem = templateConst.tItem;
var tAssets = templateConst.tAssets;
var tIntensify = templateConst.tIntensify;
module.exports = function (itemInfo, itemTemplate) {
    return new Handler(itemInfo, itemTemplate);
};

var Handler = function (itemInfo, itemTemplate) {
    this.itemData = itemInfo;
    this.itemTemplate = itemTemplate;
    this.SetItemZhanli();
};

var handler = Handler.prototype;

handler.IsTrueIndex = function (infoIndex) {
    if (infoIndex >= 0 && infoIndex < eItemInfo.Max) {
        return true;
    }
    return false;
};

handler.SetDataInfo = function (infoIndex, value) {
    if (this.IsTrueIndex(infoIndex)) {
        this.itemData[infoIndex] = value;
    }
};

handler.GetItemInfo = function (infoIndex) {
    if (this.IsTrueIndex(infoIndex)) {
        return this.itemData[infoIndex];
    }
    return null;
};

handler.GetItemTemplate = function () {
    return this.itemTemplate;
};

handler.GetAllInfo = function () {
    return this.itemData;
};

handler.SetItemZhanli = function () {
    //基础战力
    var tZhanli = this.itemTemplate[tItem.baseZhanli];
    //装备基础属性战力
    var baseZhanli = this.itemData[eItemInfo.ITEMINFO_MAXMP] * gameConst.eAttFactor.MAXMP       //最大魔量
                     + this.itemData[eItemInfo.ITEMINFO_MAXHP] * gameConst.eAttFactor.MAXHP    //最大血量
                     + this.itemData[eItemInfo.ATTACK] * gameConst.eAttFactor.GONGJI            //攻击力
                     + this.itemData[eItemInfo.DEFENCE] * gameConst.eAttFactor.FANGYU          //防御力
                     + this.itemData[eItemInfo.ITEMINFO_CRIT] * gameConst.eAttFactor.BAOJILV      //暴击值
                     + this.itemData[eItemInfo.ITEMINFO_ANTICRIT] * gameConst.eAttFactor.BAOJIDIKANG;       //暴击抵抗
    //附加属性战力
    var addZhanli =
            this.itemData[eItemInfo.ITEMINFO_CRITDAMAGE] * gameConst.eAttFactor.BAOJISHANGHAI  //暴击伤害
            + this.itemData[eItemInfo.ITEMINFO_CRITDAMAGEREDUCE] * gameConst.eAttFactor.BJSHHJM //暴击伤害减免
            + this.itemData[eItemInfo.ITEMINFO_DAMAGEUP] * gameConst.eAttFactor.SHANGHAITISHENG//伤害提升
            + this.itemData[eItemInfo.ITEMINFO_DAMAGEREDUCE] * gameConst.eAttFactor.SHANGHAIJIANMIAN//伤害减免
            + this.itemData[eItemInfo.ITEMINFO_HP] * gameConst.eAttFactor.HP //血量
            + this.itemData[eItemInfo.ITEMINFO_MP] * gameConst.eAttFactor.MP //魔法量
            + this.itemData[eItemInfo.ITEMINFO_HUNMIREDUCE] * gameConst.eAttFactor.HUNMI //昏迷
            + this.itemData[eItemInfo.ITEMINFO_HOUYANGREDUCE] * gameConst.eAttFactor.HOUYANG //后仰
            + this.itemData[eItemInfo.ITEMINFO_HPRATE] * gameConst.eAttFactor.HPHUIFU //Hp回复速率
            + this.itemData[eItemInfo.ITEMINFO_MPRATE] * gameConst.eAttFactor.MPHUIFU //Mp回复速率
            + this.itemData[eItemInfo.ITEMINFO_ANTIHUNMI] * gameConst.eAttFactor.HUNMIDIKANG //昏迷抵抗
            + this.itemData[eItemInfo.ITEMINFO_ANTIHOUYANG] * gameConst.eAttFactor.HOUYANGDIKANG //后仰抵抗
            + this.itemData[eItemInfo.ANTIFUKONG] * gameConst.eAttFactor.FUKONGDIKANG //浮空抵抗
            + this.itemData[eItemInfo.ANTIJITUI] * gameConst.eAttFactor.JITUIDIKANG //击退抵抗
            + this.itemData[eItemInfo.HUNMIRATE] * gameConst.eAttFactor.HUNMIJILV //昏迷几率
            + this.itemData[eItemInfo.HOUYANGRATE] * gameConst.eAttFactor.HOUYANGJILV  //后仰几率
            + this.itemData[eItemInfo.FUKONGRATE] * gameConst.eAttFactor.FUKONGJILV  //浮空几率
            + this.itemData[eItemInfo.JITUIRATE] * gameConst.eAttFactor.JITUIJILV  //击退几率

            + this.itemData[eItemInfo.FREEZERATE] * gameConst.eAttFactor.FREEZERATE  //冰冻几率
            + this.itemData[eItemInfo.STONERATE] * gameConst.eAttFactor.STONERATE  //石化几率
            + this.itemData[eItemInfo.ANTIFREEZE] * gameConst.eAttFactor.ANTIFREEZE  //冰冻抵抗
            + this.itemData[eItemInfo.ANTISTONE] * gameConst.eAttFactor.ANTISTONE;  //石化抵抗
    var starPercent = 0;
    var starNum = this.itemTemplate[tItem.starNum];
    for (var i = 0; i < defaultValues.inlayNum && i < starNum; ++i) {
        var starID = this.itemData[eItemInfo['STAR' + i]];
        if (starID > 0) {
            var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', starID);
            if (null != AssetsTemplate) {
                var starLevel = AssetsTemplate[tAssets.starLevel];
                starPercent += globalFunction.GetStarPercent(starLevel);
            }
        }
    }
    var intensifyZhanli = 0;
    var intensifyLevel = this.itemData[eItemInfo.Intensify];
    var levelAtt = this.itemTemplate[tItem.levelID];
    if (intensifyLevel > 0) {
        var IntensifyTemplate = templateManager.GetTemplateByID('IntensifyTemplate', levelAtt);
        if (null != IntensifyTemplate) {
            var maxLevel = IntensifyTemplate[tIntensify.addNum];
            for (var i = 0; i < maxLevel; ++i) {
                var attID = IntensifyTemplate['attID_' + i];
                var attNum = IntensifyTemplate['attNum_' + i];
                attNum *= intensifyLevel;
                switch (attID) {
                    case eAttInfo.ATTACK:        //攻击力
                        intensifyZhanli += attNum * gameConst.eAttFactor.GONGJI;
                        break;
                    case eAttInfo.DEFENCE:         //防御力
                        intensifyZhanli += attNum * gameConst.eAttFactor.FANGYU;
                        break;
                    case eAttInfo.MAXHP:           //最大血量
                        intensifyZhanli += attNum * gameConst.eAttFactor.MAXHP;
                        break;
                    case eAttInfo.MAXMP:           //最大魔量
                        intensifyZhanli += attNum * gameConst.eAttFactor.MAXMP;
                        break;
                    case eAttInfo.CRIT:       //暴击值
                        intensifyZhanli += attNum * gameConst.eAttFactor.BAOJILV;
                        break;
                    case eAttInfo.ANTICRIT:     //暴击抵抗
                        intensifyZhanli += attNum * gameConst.eAttFactor.BAOJIDIKANG;
                        break;
                    case eAttInfo.CRITDAMAGE:    //暴击伤害
                        intensifyZhanli += attNum * gameConst.eAttFactor.BAOJISHANGHAI;
                        break;
                    case eAttInfo.CRITDAMAGEREDUCE:      //暴击伤害减免
                        intensifyZhanli += attNum * gameConst.eAttFactor.BJSHHJM;
                        break;
                    case eAttInfo.DAMAGEUP:           //总体伤害提升
                        intensifyZhanli += attNum * gameConst.eAttFactor.SHANGHAITISHENG;
                        break;
                    case eAttInfo.DAMAGEREDUCE:     //总体伤害减免
                        intensifyZhanli += attNum * gameConst.eAttFactor.SHANGHAIJIANMIAN;
                        break;
                }
            }
        }
    }
    //intensifyZhanli *= 0.1;
    this.itemData[eItemInfo.BaseZhanli] = Math.floor(tZhanli + Math.round(baseZhanli) + Math.round(addZhanli));
    baseZhanli *= 1 + starPercent / 100;
    this.itemData[eItemInfo.ZHANLI] =
    Math.floor(tZhanli + Math.round(baseZhanli) + Math.round(addZhanli) + intensifyZhanli);
};
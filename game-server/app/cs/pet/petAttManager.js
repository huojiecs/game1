/**
 * Created by CUILIN on 15-1-28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var _ = require('underscore');

var eAttInfo = gameConst.eAttInfo;
var ePetAttLevel = gameConst.ePetAttLevel;
var ePetZhanliLevel = gameConst.ePetZhanliLevel;

module.exports = function(attTempID) {
    return new Handler(attTempID);
};

/**
 * 属性数据结构，三维数组结构
 * 1. 最外维：属性层，数组元素为某一项属性的数据结构。目前共28项属性，与人物属性相同。
 * 2. 中间维：某一项属性的具体数据分布，目前是三层分布，每层分布中记录该层数据的基数和加成比例。
 *    第一层为基础属性数值。第二层为被动技能附加数值。最终层、即第三层，为前几层数据的和，是最终的数值
 * 3. 最底维：某一项属性的某一个数据层的具体值。为拥有俩元素的数组，第一个元素为基数，第二个元素为加成百分比
 * 示例：
 *  [
 *      [[基数，加成比例], [基数, 加成比例], [总属性和, 总属性加成比例]],
 *      [[], [], []],
 *      ... 共28项
 *  ]
 * 说明：
 *  总属性和 = 基数*(100+加成比例)/100 + 基数*(100+加成比例)/100 + ...
 *  总属性加成比例, 需要有总加成的时候，直接在这个字段累加加成比例。注：总属性加成比例不等于各层级加成比例总和，它是单独去记的
 *  最终面板值 = 总属性和*(100+总属性加成比例)/100
 * */
var Handler = function(attTempID) {
    var petAttTemplate = templateManager.GetTemplateByID('PetAttTemplate', attTempID);
    this.attList = new Array(eAttInfo.MAX);
    for(var i = 0; i < eAttInfo.MAX; ++i) {
        var tempInfo = new Array(ePetAttLevel.ATTLEVEL_MAX);
        for (var j = 0; j < ePetAttLevel.ATTLEVEL_MAX; ++j) {
            if(j == ePetAttLevel.ATTLEVEL_JICHU) {
                tempInfo[j] = [petAttTemplate['att_' + i], 0];   //固定值，加成百分比
            } else {
                tempInfo[j] = [0, 0];   //固定值，加成百分比
            }
        }
        this.attList[i] = tempInfo;
    }
    this.zhanliList = new Array(ePetZhanliLevel.ZHANLILEVEL_MAX);
    for(var i = 0; i < ePetZhanliLevel.ZHANLILEVEL_MAX; ++i) {
        this.zhanliList[i] = 0;
    }
};

var handler = Handler.prototype;

/**
 * 宠物属性、战力重置
 * 宠物属性每一级都有一个模板，所以宠物的属性和策划表是强关联的
 * 而且宠物的各种技能、品级、升级等等都对属性、战力有加成效果
 * 所以索性将宠物的属性刷新机制做成初始化刷新，就是先初始化，再重新计算
 * */
handler.Reset = function() {
    /**
    * 重置属性，基础项的加成字段置0 基数字段不用重置，
    * 因为这个字段是读表出来的，过程中不会有修改，
    * 其他项都重置为[0, 0]
    * */
    for(var i = 0; i < eAttInfo.MAX; ++i) {
        for(var j = 0; j < ePetAttLevel.ATTLEVEL_MAX; ++j) {
            if(j == ePetAttLevel.ATTLEVEL_JICHU) {
                this.attList[i][j][1] = 0;
            } else {
                this.attList[i][j] = [0, 0];
            }
        }
    }
    /**
     * 战力重置，因为战力是纯计算得出来的，所以都置0
     * */
    for(var i = 0; i < ePetZhanliLevel.ZHANLILEVEL_MAX; ++i) {
        this.zhanliList[i] = 0;
    }
};

handler.GetAllAtt = function () {
    var attInfo = new Array(eAttInfo.MAX);
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var attValue = this.attList[i][ePetAttLevel.ATTLEVEL_END][0];
        var coefficient = this.attList[i][ePetAttLevel.ATTLEVEL_END][1];
        attInfo[i] = Math.floor(attValue * (100 + coefficient) / 100);
    }
    return attInfo;
};

handler.GetAttValue = function (attIndex) {
    if (this.IsTrueAtt(attIndex)) {
        return this.attList[attIndex][ePetAttLevel.ATTLEVEL_END][0];
    }
    return 0;
};

handler.GetAttFinalValue = function (attIndex) {
    var attValue = this.attList[attIndex][ePetAttLevel.ATTLEVEL_END][0];
    var coefficient = this.attList[attIndex][ePetAttLevel.ATTLEVEL_END][1];
    return Math.floor(attValue * (100 + coefficient) / 100);
};

handler.IsTrueAtt = function (attIndex) {
    if (attIndex >= eAttInfo.ATTACK && attIndex < eAttInfo.MAX) {
        return true;
    }
    return false;
};

handler.IsTrueLevel = function (levelIndex) {
    if (levelIndex >= 0 && levelIndex < ePetZhanliLevel.ZHANLILEVEL_END) {
        return true;
    }
    return false;
};

handler.UpdateSigleAtt = function(attIndex, levelIndex, value, isAdd) {
    if(this.IsTrueAtt(attIndex) && this.IsTrueLevel(levelIndex)) {
        if(isAdd) {
            this.attList[attIndex][levelIndex][0] += value;
        } else {
            this.attList[attIndex][levelIndex][0] -= value;
        }
    }
};

handler.UpdateEndAtt = function () {
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var attValue = 0;
        for (var j = 0; j < ePetAttLevel.ATTLEVEL_END; ++j) {
            attValue += this.attList[i][j][0];
            attValue *= (100 + this.attList[i][j][1]) / 100;
        }
        this.attList[i][ePetAttLevel.ATTLEVEL_END][0] = Math.floor(attValue);
    }
};

handler.UpdateSingleCoefficient = function(attIndex, levelIndex, value, isAdd) {
    if(this.IsTrueAtt(attIndex) && this.IsTrueLevel(levelIndex)) {
        if(isAdd) {
            this.attList[attIndex][levelIndex][1] += value;
        } else {
            this.attList[attIndex][levelIndex][1] -= value;
        }
    }
};

handler.UpdateEndCoefficient = function(attIndex, value, isAdd) {
    if(this.IsTrueAtt(attIndex)) {
        if(isAdd) {
            this.attList[attIndex][ePetAttLevel.ATTLEVEL_END][1] += value;
        } else {
            this.attList[attIndex][ePetAttLevel.ATTLEVEL_END][1] -= value;
        }
    }
};

handler.CalcJiChuZhanli = function (max) {
    max = max || eAttInfo.MAX;
    var zhanli = 0;
    for (var i = 0; i < max; ++i) {
        var attValue = Math.floor(this.attList[i][ePetAttLevel.ATTLEVEL_END][0] *
                                  ((100 + this.attList[i][ePetAttLevel.ATTLEVEL_END][1]) / 100));
        switch (i) {
            case eAttInfo.ATTACK:        //攻击力
                zhanli += attValue * gameConst.eAttFactor.GONGJI;
                break;
            case eAttInfo.DEFENCE:         //防御力
                zhanli += attValue * gameConst.eAttFactor.FANGYU;
                break;
            case eAttInfo.HP:         //HP
                zhanli += attValue * gameConst.eAttFactor.HP;
                break;
            case eAttInfo.MP:         //MP
                zhanli += attValue * gameConst.eAttFactor.MP;
                break;
            case eAttInfo.MAXHP:           //最大血量
                zhanli += attValue * gameConst.eAttFactor.MAXHP;
                break;
            case eAttInfo.MAXMP:           //最大魔法量
                zhanli += attValue * gameConst.eAttFactor.MAXMP;
                break;


            case eAttInfo.CRIT:           //暴击值
                zhanli += attValue * gameConst.eAttFactor.BAOJILV;
                break;
            case eAttInfo.CRITDAMAGE:           //暴击伤害
                zhanli += attValue * gameConst.eAttFactor.BAOJISHANGHAI;
                break;
            case eAttInfo.DAMAGEUP:           //伤害提升
                zhanli += attValue * gameConst.eAttFactor.SHANGHAITISHENG;
                break;
            case eAttInfo.HUNMIREDUCE:           //昏迷
                zhanli += attValue * gameConst.eAttFactor.HUNMI;
                break;
            case eAttInfo.HOUYANGREDUCE:           //后仰
                zhanli += attValue * gameConst.eAttFactor.HOUYANG;
                break;
            case eAttInfo.HPRATE:           //Hp回复速率
                zhanli += attValue * gameConst.eAttFactor.HPHUIFU;
                break;
            case eAttInfo.MPRATE:           //Mp回复速率
                zhanli += attValue * gameConst.eAttFactor.MPHUIFU;
                break;


            case eAttInfo.ANTICRIT:           //暴击抵抗
                zhanli += attValue * gameConst.eAttFactor.BAOJIDIKANG;
                break;
            case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
                zhanli += attValue * gameConst.eAttFactor.BJSHHJM;
                break;
            case eAttInfo.DAMAGEREDUCE:           //伤害减免
                zhanli += attValue * gameConst.eAttFactor.SHANGHAIJIANMIAN;
                break;
            case eAttInfo.ANTIHUNMI:           //昏迷抵抗
                zhanli += attValue * gameConst.eAttFactor.HUNMIDIKANG;
                break;
            case eAttInfo.ANTIHOUYANG:           //后仰抵抗
                zhanli += attValue * gameConst.eAttFactor.HOUYANGDIKANG;
                break;


            case eAttInfo.ANTIFUKONG:           //浮空抵抗
                zhanli += attValue * gameConst.eAttFactor.FUKONGDIKANG;
                break;
            case eAttInfo.ANTIJITUI:           //击退抵抗
                zhanli += attValue * gameConst.eAttFactor.JITUIDIKANG;
                break;
            case eAttInfo.HUNMIRATE:           //昏迷几率
                zhanli += (attValue - 10000) * gameConst.eAttFactor.HUNMIJILV;
                break;
            case eAttInfo.HOUYANGRATE:           //后仰几率
                zhanli += (attValue - 10000) * gameConst.eAttFactor.HOUYANGJILV;
                break;
            case eAttInfo.FUKONGRATE:           //后仰几率
                zhanli += (attValue - 10000) * gameConst.eAttFactor.FUKONGJILV;
                break;
            case eAttInfo.JITUIRATE:           //击退几率
                zhanli += (attValue - 10000) * gameConst.eAttFactor.JITUIJILV;
                break;

            case eAttInfo.FREEZERATE:          //冰冻几率
                zhanli += (attValue - 10000) * gameConst.eAttFactor.FREEZERATE;
                break;
            case eAttInfo.STONERATE:          //石化几率
                zhanli += (attValue - 10000) * gameConst.eAttFactor.STONERATE;
                break;
            case eAttInfo.ANTIFREEZE:            //冰冻抵抗
                zhanli += attValue * gameConst.eAttFactor.ANTIFREEZE;
                break;
            case eAttInfo.ANTISTONE:           //石化抵抗
                zhanli += attValue * gameConst.eAttFactor.ANTISTONE;
                break;
        }
    }
    this.zhanliList[ePetZhanliLevel.ZHANLILEVEL_JICHU] = Math.floor(zhanli);
};

handler.SetExtraZhanli = function(attLevel, value, isAdd) {
    if (!this.IsTrueLevel(attLevel)) {
        return 0;
    }
    if(isAdd) {
        this.zhanliList[attLevel] += value;
    } else {
        this.zhanliList[attLevel] -= value;
    }
    return value;
};

handler.UpdateZhanli = function() {
    this.zhanliList[ePetZhanliLevel.ZHANLILEVEL_END] = 0;
    for(var i = 0; i < ePetZhanliLevel.ZHANLILEVEL_END; i++) {
        this.zhanliList[ePetZhanliLevel.ZHANLILEVEL_END] += this.zhanliList[i];
    }
    return this.zhanliList[ePetZhanliLevel.ZHANLILEVEL_END];
};

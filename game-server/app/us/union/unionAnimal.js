/**
 * Created by bj on 2015/3/25.
 * 公会神兽
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var Q = require('q');
var _ = require('underscore');
var async = require('async');
var constValue = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var config = require('../../tools/config');
var utilSql = require('../../tools/mysql/utilSql');
var gameConst = require('../../tools/constValue');
var redisManager = require('../../us/chartRedis/redisManager');
var playerManager = require('../../us/player/playerManager');
var templateManager = require('../../tools/templateManager');
var eUnionAnimal = gameConst.eUnionAnimal;
var eAttInfo = gameConst.eAttInfo;

var INT_MAX = 2100000000;       // INT型最高值
var ATT_MAX = 21000000;         // 神兽属性通常的最高值

module.exports = function () {
    return new Handler();
};

// 构造
var Handler = function () {
    this.animalInfo = new Array(eUnionAnimal.MAX);
    for(var info in eUnionAnimal){
        if(eUnionAnimal[info] != eUnionAnimal.MAX){
            this.animalInfo[eUnionAnimal[info]] = 0;
        }
    }

    this.SetAnimalInfo(eUnionAnimal.unionName, '');
};

var handler = Handler.prototype;


handler.GetAnimalInfo = function (Index) {
    if(Index >= 0 && Index < eUnionAnimal.MAX ){
        return this.animalInfo[Index];
    }
    logger.error('GetAnimalInfo index not match %j', Index);

    return null;
};


handler.SetAnimalInfo = function (Index, Value) {
    if(Index >= 0 && Index < eUnionAnimal.MAX ){
        this.animalInfo[Index] = Value;
    }
    else{
        logger.error('SetAnimalInfo index not match %j', Index);
    }
};

handler.IsAlive = function(){
    return this.animalInfo[eUnionAnimal.currHPValue] > 0;
};

handler.HPPercent = function(){
    var UnionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', this.GetAnimalInfo(eUnionAnimal.fixTempID));
    if(UnionFixTemplate == null){
        return attrPower;
    }

    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', UnionFixTemplate['monsterID']);
    if(npcAttTemplate == null){
        return 0;
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return 0;
    }

    var yuanbaoTimes = this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes);

    var hpValue = (this.GetAnimalInfo(eUnionAnimal.hpTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoHPDouble']) * UnionFixTemplate['hpAdd'];


    var maxHP = 0;
    for (var index = 0; index < gameConst.eAttInfo.MAX; ++index) {
        var proValue = npcAttTemplate['att_' + index];
        if (index == gameConst.eAttInfo.MAXHP ){
            proValue += hpValue;
            maxHP = proValue;
        }
    }

    if(maxHP > INT_MAX){
        maxHP = INT_MAX;
    }

    return Math.floor(this.animalInfo[eUnionAnimal.currHPValue] / maxHP * 100);
};

// 封装成发给客户端的消息格式
handler.toMessage = function () {
    var info = {
        unionID : this.GetAnimalInfo(eUnionAnimal.unionID),
        unionName : this.GetAnimalInfo(eUnionAnimal.unionName),
        fixTempID : this.GetAnimalInfo(eUnionAnimal.fixTempID),
        currHPValue : this.GetAnimalInfo(eUnionAnimal.currHPValue),
        attkTimes : this.GetAnimalInfo(eUnionAnimal.attkTimes),
        defTimes : this.GetAnimalInfo(eUnionAnimal.defTimes),
        hpTimes : this.GetAnimalInfo(eUnionAnimal.hpTimes),
        yuanbaoTimes : this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes),
        skillNum : this.GetAnimalInfo(eUnionAnimal.skillNum),
        isDefender : this.GetAnimalInfo(eUnionAnimal.isDefender),
        powerful : this.GetAnimalInfo(eUnionAnimal.powerful)
    };

    return info;
};

// 获取技能所加的假战力
handler.RefreshAnimalSkillPower = function (){
    var skillPower = 0;
    var skillLevel = this.GetAnimalInfo(eUnionAnimal.skillNum);
    if(skillLevel <= 0){
        return skillPower;
    }

    var skillTemplate = templateManager.GetTemplateByID('UnionBossSkillTemplate', 1001);
    if(skillTemplate == null){
        return skillPower;
    }

    if(this.GetAnimalInfo(eUnionAnimal.skillNum) >= skillTemplate['maxLevel']){
        this.SetAnimalInfo(eUnionAnimal.skillNum, skillTemplate['maxLevel']);
    }

    for(var i = 1; i <= skillLevel; ++i){
        var animalSkillID = 1001 + i;
        var animalSkillTemplate = templateManager.GetTemplateByID('UnionBossSkillTemplate', animalSkillID);
        if(animalSkillTemplate == null){
            continue;
        }

        skillPower += animalSkillTemplate['zhanli'];
    }

    return skillPower;
};

handler.Calculation = function( attValue, attType ){
    var zhanli = 0;
    switch (attType) {
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
            zhanli += attValue * gameConst.eAttFactor.HUNMIJILV;
            break;
        case eAttInfo.HOUYANGRATE:           //后仰几率
            zhanli += attValue * gameConst.eAttFactor.HOUYANGJILV;
            break;
        case eAttInfo.FUKONGRATE:           //后仰几率
            zhanli += attValue * gameConst.eAttFactor.FUKONGJILV;
            break;
        case eAttInfo.JITUIRATE:           //击退几率
            zhanli += attValue * gameConst.eAttFactor.JITUIJILV;
            break;

        case eAttInfo.FREEZERATE:          //冰冻几率
            zhanli += attValue * gameConst.eAttFactor.FREEZERATE;
            break;
        case eAttInfo.STONERATE:          //石化几率
            zhanli += attValue * gameConst.eAttFactor.STONERATE;
            break;
        case eAttInfo.ANTIFREEZE:            //冰冻抵抗
            zhanli += attValue * gameConst.eAttFactor.ANTIFREEZE;
            break;
        case eAttInfo.ANTISTONE:           //石化抵抗
            zhanli += attValue * gameConst.eAttFactor.ANTISTONE;
            break;
    }
    return zhanli;
};

// 得到神兽属性
handler.getAnimalAtt = function(){
    var animalAtt = {
        tempID : 0,
        atkValue : 0,
        defValue : 0,
        hpValue : 0
    };

    var UnionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', this.GetAnimalInfo(eUnionAnimal.fixTempID));
    if(UnionFixTemplate == null){
        return animalAtt;
    }

    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', UnionFixTemplate['monsterID']);
    if(npcAttTemplate == null){
        return animalAtt;
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return animalAtt;
    }

    var yuanbaoTimes = this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes);

    var attkValue = (this.GetAnimalInfo(eUnionAnimal.attkTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoAttkDouble']) * UnionFixTemplate['attkAdd'];
    var defValue = (this.GetAnimalInfo(eUnionAnimal.defTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoDefDouble']) * UnionFixTemplate['defAdd'];
    var hpValue = (this.GetAnimalInfo(eUnionAnimal.hpTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoHPDouble']) * UnionFixTemplate['hpAdd'];

    animalAtt.tempID = UnionFixTemplate['monsterID'];
    animalAtt.atkValue = attkValue;
    animalAtt.defValue = defValue;
    animalAtt.hpValue = hpValue;

    return animalAtt
};


// 计算
handler.RefreshAnimalAttrPower = function(){
    var attrPower = 0;
    var UnionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', this.GetAnimalInfo(eUnionAnimal.fixTempID));
    if(UnionFixTemplate == null){
        return attrPower;
    }

    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', UnionFixTemplate['monsterID']);
    if(npcAttTemplate == null){
        return attrPower;
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return attrPower;
    }

    var yuanbaoTimes = this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes);

    var attkValue = (this.GetAnimalInfo(eUnionAnimal.attkTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoAttkDouble']) * UnionFixTemplate['attkAdd'];
    var defValue = (this.GetAnimalInfo(eUnionAnimal.defTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoDefDouble']) * UnionFixTemplate['defAdd'];
    var hpValue = (this.GetAnimalInfo(eUnionAnimal.hpTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoHPDouble']) * UnionFixTemplate['hpAdd'];


    var maxHP = hpValue + npcAttTemplate['att_' + gameConst.eAttInfo.MAXHP];
    attrPower += this.Calculation(attkValue, eAttInfo.ATTACK);
    attrPower += this.Calculation(defValue, eAttInfo.DEFENCE);
    attrPower += this.Calculation(hpValue, eAttInfo.MAXHP);

    if(maxHP > INT_MAX){
        maxHP = INT_MAX;
    }

    this.SetAnimalInfo(eUnionAnimal.currHPValue, maxHP);

    return attrPower;
};

// 得到神兽真实属性
handler.GetAnimalTrueAtt = function(attInfo){
    if(attInfo == null){
        return;
    }

    var attValue = 0;
    var UnionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', this.GetAnimalInfo(eUnionAnimal.fixTempID));
    if(UnionFixTemplate == null){
        return attValue;
    }

    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', UnionFixTemplate['monsterID']);
    if(npcAttTemplate == null){
        return attValue;
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return attValue;
    }

    var yuanbaoTimes = this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes);

    var attkValue = (this.GetAnimalInfo(eUnionAnimal.attkTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoAttkDouble']) * UnionFixTemplate['attkAdd'];
    var defValue = (this.GetAnimalInfo(eUnionAnimal.defTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoDefDouble']) * UnionFixTemplate['defAdd'];
    var hpValue = (this.GetAnimalInfo(eUnionAnimal.hpTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoHPDouble']) * UnionFixTemplate['hpAdd'];

    if (attInfo == gameConst.eAttInfo.MAXHP){
        attValue += hpValue;
    }
    else if(attInfo == gameConst.eAttInfo.ATTACK){
        attValue += attkValue;
    }
    else if(attInfo == gameConst.eAttInfo.DEFENCE){
        attValue += defValue;
    }

    attValue += npcAttTemplate['att_' + attInfo];

    return attValue;

};

// 刷新属性战力
handler.RefreshAnimalAllAttrPower = function(){
    var attrPower = 0;
    var UnionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', this.GetAnimalInfo(eUnionAnimal.fixTempID));
    if(UnionFixTemplate == null){
        return attrPower;
    }

    var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', UnionFixTemplate['monsterID']);
    if(npcAttTemplate == null){
        return attrPower;
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return attrPower;
    }

    var yuanbaoTimes = this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes);

    var attkValue = (this.GetAnimalInfo(eUnionAnimal.attkTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoAttkDouble']) * UnionFixTemplate['attkAdd'];
    var defValue = (this.GetAnimalInfo(eUnionAnimal.defTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoDefDouble']) * UnionFixTemplate['defAdd'];
    var hpValue = (this.GetAnimalInfo(eUnionAnimal.hpTimes) + yuanbaoTimes * UnionDataTemplate['yuanbaoHPDouble']) * UnionFixTemplate['hpAdd'];


    var maxHP = 0;
    for (var index = 0; index < gameConst.eAttInfo.MAX; ++index) {
        var proValue = npcAttTemplate['att_' + index];
        if (index == gameConst.eAttInfo.MAXHP ){
            proValue += hpValue;
            maxHP = proValue;
        }
        else if(index == gameConst.eAttInfo.ATTACK ){
            proValue += attkValue;
        }
        else if(index == gameConst.eAttInfo.DEFENCE){
            proValue += defValue;
        }

        attrPower += this.Calculation(proValue, index);
    }

    if(maxHP > INT_MAX){
        maxHP = INT_MAX;
    }

    this.SetAnimalInfo(eUnionAnimal.currHPValue, maxHP);

    return attrPower;
};

// 刷新战斗力
handler.refreshPowerful = function (){
    var oldPower = this.GetAnimalInfo(eUnionAnimal.powerful);
    var newPower = 0;

    newPower += this.RefreshAnimalAttrPower();
    newPower += this.RefreshAnimalSkillPower();
    newPower = Math.floor(newPower);

    if(newPower >= INT_MAX){
        newPower = INT_MAX;
    }

    this.SetAnimalInfo(eUnionAnimal.powerful, newPower);

    return newPower - oldPower;

};

// 培养
handler.onCulture = function (opType, times){
    if(opType == null || times == null){
        return;
    }
    var oldValue = 0;
    switch (opType){
        case 0:
            oldValue = this.GetAnimalInfo(eUnionAnimal.attkTimes);
            this.SetAnimalInfo(eUnionAnimal.attkTimes, oldValue + times);

            break;
        case 1:
            oldValue = this.GetAnimalInfo(eUnionAnimal.defTimes);
            this.SetAnimalInfo(eUnionAnimal.defTimes, oldValue + times);

            break;
        case 2:
            oldValue = this.GetAnimalInfo(eUnionAnimal.hpTimes);
            this.SetAnimalInfo(eUnionAnimal.hpTimes, oldValue + times);

            break;
        case 3:
            oldValue = this.GetAnimalInfo(eUnionAnimal.yuanbaoTimes);
            this.SetAnimalInfo(eUnionAnimal.yuanbaoTimes, oldValue + times);

            break;
        case 4:
            oldValue = this.GetAnimalInfo(eUnionAnimal.skillNum);
            this.SetAnimalInfo(eUnionAnimal.skillNum, oldValue + times);

            break;
        default :
            return 0;
    }

    this.refreshPowerful();
};

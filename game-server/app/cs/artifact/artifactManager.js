/**
 * Created by Lijianhua on 2015/9/15.
 * @email ljhdhr@gmail.com
 * 神装系统
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var errorCodes = require('../../tools/errorCodes');
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var utilSql = require('../../tools/mysql/utilSql');
var csSql = require('../../tools/mysql/csSql');
var ePlayerInfo = gameConst.ePlayerInfo;
var _ = require('underscore');
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAttInfo = gameConst.eAttInfo;
var eAttLevel = gameConst.eAttLevel;

var ACTION_TYPE_ACTIVATION = 0;
var ACTION_TYPE_BREAK = 1;
var ACTION_TYPE_LEVEL_UP = 2;
var ACTION_TYPE_RAISE_STAR = 3;

var ACTION_TOTAL_TYPE_COUNT = 7;

var ALLTEMPLATE_ADD_RATE = 222;
var START_SKILL_ID_1 = 237;
var START_SKILL_ID_2 = 238;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.activationInfo = [];
    this.skillAtt_1 = 0;
    this.skillAtt_2 = 0;
    this.artifactPower = 0;
};

var handler = Handler.prototype;

/**
 * @param dbInfo activate 数据库表数据
 * @constructor
 */
handler.LoadDataByDB = function (dbInfo) {
    var self = this;
    if (dbInfo) {
        if (dbInfo['activation'] && dbInfo['activation'] != '') {
            self.activationInfo = JSON.parse(dbInfo['activation']);
        }
        if (dbInfo['skillAtt_1'] && dbInfo['skillAtt_1'] != '') {
            self.skillAtt_1 = dbInfo['skillAtt_1'];
        }
        if (dbInfo['skillAtt_2'] && dbInfo['skillAtt_2'] != '') {
            self.skillAtt_2 = dbInfo['skillAtt_2'];
        }
    }

    for (var index in self.activationInfo) {
        var obj = self.activationInfo[index];
        obj.zhanLi = self.CalcActivationZhanli(false, obj.type, obj.star, obj.level, obj.tempId);
    }
    self.owner.attManager.SendAttMsg(null);
};

handler.GetSqlStr = function () {
    var self = this;
    var rows = [];
    var row = [];
    row.push(self.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
    row.push(JSON.stringify(self.activationInfo));
    row.push(self.skillAtt_1);
    row.push(self.skillAtt_2);
    row.push(self.artifactPower);
    rows.push(row);
    var sqlString = utilSql.BuildSqlValues(rows);
    return sqlString;
};

/**
 * 获取神装信息
 * 神装对象数据结构：
 *       var obj = {};
 *       obj.type = 1;
 *       obj.tempID = 21000;
 *       obj.level = 1;
 *       obj.rate = 10;
 *       obj.star = 0;
 *       obj.zhanLi = 100;
 */
handler.getAllArtifactInfo = function () {
    var self = this;
    var msg = {};
    msg.result = errorCodes.OK;
    msg.artifact = self.activationInfo;
    return msg;
};

/**
 * 获得神装操作更新信息
 * @param actionType 0 激活 2 突破 3 升级 4 升星
 * @param type 神装类型 0 ~ 6
 * @returns 消息
 */
handler.getActivationMsg = function (actionType, type) {
    var self = this;
    var msg = {};
    switch (actionType) {
        case ACTION_TYPE_ACTIVATION:
        case ACTION_TYPE_BREAK:
            msg = self.actionActivation(type);
            break;
        case ACTION_TYPE_LEVEL_UP:
            msg = self.actionLevelUp(type);
            break;
        case ACTION_TYPE_RAISE_STAR:
            msg = self.actionRaiseStarNum(type);
            break;
    }
    return msg;
};

/**
 *
 * 神装激活或者突破
 *
 * @param type 0 ~ 6 代表不同类型的神装部位
 *              ALltemplate 配置的神装起始ID
 *              223 未激活神器ID--武器    0
 *              224 未激活神器ID--头      1
 *              225 未激活神器ID--手      2
 *              226 未激活神器ID--胸      3
 *              227 未激活神器ID--脚      4
 *              228 未激活神器ID--戒指    5
 *              229 未激活神器ID--项链    6
 * @returns
 *              artifactObj.type = type;    神装类型
 *              artifactObj.tempId = tempID; ArtifactActivationTemplate模板ID
 *              artifactObj.level = 1;      神装等级
 *              artifactObj.star = 0;       星级
 *              artifactObj.rate = 0;       增加的升级成功率
 */
handler.actionActivation = function (type) {
    var self = this;
    var msg = {};

    if (type < 0 || type > 6) {
        msg.result = errorCodes.TYPE_ERROR;
        return msg;
    }
    // 激活的默认值
    var allTemplateId = 223 + type;
    var allTemplate = templateManager.GetTemplateByID('AllTemplate', allTemplateId);
    var currentActivationTempID = allTemplate['attnum'];
    var hasActivation = false;
    var level = 0;
    for (var index in self.activationInfo) {
        var obj = self.activationInfo[index];
        if (obj.type == type) {
            hasActivation = true;
            // 已有数据,突破上限
            currentActivationTempID = obj.tempId;
            level = obj.level;
            break;
        }
    }

    var currentArtifactTemplate = templateManager.GetTemplateByID('ArtifactActivationTemplate', currentActivationTempID);
    // 获取突破模板ID
    var nextActivationTempID = currentArtifactTemplate['nextAttID'];
    if (nextActivationTempID == 0) {
        msg.result = errorCodes.ALREADY_MAX_ACTIVATION_LEVEL;
        return msg;
    }

    if (level != currentArtifactTemplate['maxLevel']) {
        msg.result = errorCodes.ACTIVATION_LEVEL_NOT_ENOUGH;
        return msg;
    }

    // 激活,或者达到突破等级,可以突破,判断材料
    var itemID_1 = currentArtifactTemplate['itemID_1'];
    var itemNum_1 = currentArtifactTemplate['itemNum_1'];
    if (itemNum_1 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_1, itemNum_1) == false) {
            return errorCodes.NoAssets;
        }
    }
    var itemID_2 = currentArtifactTemplate['itemID_2'];
    var itemNum_2 = currentArtifactTemplate['itemNum_2'];
    if (itemNum_2 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_2, itemNum_2) == false) {
            return errorCodes.NoAssets;
        }
    }
    var itemID_3 = currentArtifactTemplate['itemID_3'];
    var itemNum_3 = currentArtifactTemplate['itemNum_3'];
    if (itemNum_3 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_3, itemNum_3) == false) {
            return errorCodes.NoAssets;
        }
    }
    // 消耗道具
    if (itemNum_1 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_1, -itemNum_1, eAssetsReduce.Activation);
    }
    if (itemNum_2 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_2, -itemNum_2, eAssetsReduce.Activation);
    }
    if (itemNum_3 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_3, -itemNum_3, eAssetsReduce.Activation);
    }
    var artifactObj = {};
    if (hasActivation) {
        // 突破,初始化成功率，更新模板ID
        for (var index in self.activationInfo) {
            var obj = self.activationInfo[index];
            if (obj.type == type) {
                hasActivation = true;
                obj.rate = 0;
                obj.tempId = nextActivationTempID;
                artifactObj = obj;
                break;
            }
        }
    } else {
        // 激活，升一级，加属性，更新战力
        artifactObj.type = type;
        artifactObj.tempId = nextActivationTempID;
        artifactObj.level = 1;
        artifactObj.star = 0;
        artifactObj.rate = 0;
        //计算战力变化,
        artifactObj.zhanLi = self.CalcActivationZhanli(true, type, artifactObj.star, artifactObj.level, currentActivationTempID);
        // 激活神装
        self.activationInfo.push(artifactObj);
    }
    // 更新神器技能
    self.updateSkill_1();
    msg.result = errorCodes.OK;
    msg.info = artifactObj;
    // 返回消息
    return msg;
};

/**
 * 神装升级
 * @param type 神装类型
 * @returns {*} 返回更新的单个神装对象
 */
handler.actionLevelUp = function (type) {
    var self = this;
    var msg = {};
    if (type < 0 || type >= ACTION_TOTAL_TYPE_COUNT) {
        msg.result = errorCodes.TYPE_ERROR;
        return msg;
    }

    var hasActivation = false;
    var activationTempID = 0;
    var addRate = 0;
    var level = 0;
    for (var index in self.activationInfo) {
        var obj = self.activationInfo[index];
        if (obj.type == type) {
            hasActivation = true;
            activationTempID = obj.tempId;
            addRate = obj.rate;
            level = obj.level;
            break;
        }
    }

    if (!hasActivation) {
        msg.result = errorCodes.NOT_ACTIVATION;
        return msg;
    }

    var expLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    var activationTemp = templateManager.GetTemplateByID('ArtifactActivationTemplate', activationTempID);
    var maxLevel = activationTemp['maxLevel'];
    if (level >= maxLevel) {
        msg.result = errorCodes.ALREADY_MAX_STAR_LEVEL;
        return msg;
    }

    if (level >= expLevel) {
        msg.result = errorCodes.MORE_THAN_EXP_LEVEL;
        return msg;
    }
    var levelUpTempId = Math.floor(activationTempID / 1000) * 1000 + level;
    // 可以升级
    var levelUpTemplate = templateManager.GetTemplateByID('ArtifactLevelUpTemplate', levelUpTempId);
    var baseRate = levelUpTemplate['rate'];
    var itemID_1 = levelUpTemplate['itemID_1'];
    var itemNum_1 = levelUpTemplate['itemNum_1'];
    if (itemNum_1 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_1, itemNum_1) == false) {
            return errorCodes.NoAssets;
        }
    }
    var itemID_2 = levelUpTemplate['itemID_2'];
    var itemNum_2 = levelUpTemplate['itemNum_2'];
    if (itemNum_2 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_2, itemNum_2) == false) {
            return errorCodes.NoAssets;
        }
    }
    var itemID_3 = levelUpTemplate['itemID_3'];
    var itemNum_3 = levelUpTemplate['itemNum_3'];
    if (itemID_3 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_3, itemNum_3) == false) {
            return errorCodes.NoAssets;
        }
    }

    // 消耗道具
    if (itemNum_1 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_1, -itemNum_1, eAssetsReduce.ArtifactLevelUp);
    }
    if (itemNum_2 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_2, -itemNum_2, eAssetsReduce.ArtifactLevelUp);
    }
    if (itemNum_3 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_3, -itemNum_3, eAssetsReduce.ArtifactLevelUp);
    }

    var success = Math.floor(Math.random() * 100) < (baseRate + addRate);
    var artifactObj = {};
    if (success) {
        // 成功
        msg.state = 1;
        // 升级，加属性，更新战力
        var levelTemplate = templateManager.GetTemplateByID('ArtifactLevelUpTemplate', levelUpTempId);
        var attributeID_1 = levelTemplate['attributeID_1'];
        var attributeNum_1 = levelTemplate['attributeNum_1'];
        var attributeID_2 = levelTemplate['attributeID_2'];
        var attributeNum_2 = levelTemplate['attributeNum_2'];
        //计算战力变化,返回战力差值
        for (var index in self.activationInfo) {
            var obj = self.activationInfo[index];
            if (obj.type == type) {
                obj.level += 1;
                obj.rate = 0;
                obj.zhanLi = self.CalcActivationZhanli(true, type, obj.star, obj.level, activationTempID);
                artifactObj = obj;
                break;
            }
        }
        // 更新神器技能
        self.updateSkill_1();
    } else {
        // 失败,增加成功率
        msg.state = 0;
        for (var index in self.activationInfo) {
            var obj = self.activationInfo[index];
            if (obj.type == type) {
                var allTemplate = templateManager.GetTemplateByID('AllTemplate', ALLTEMPLATE_ADD_RATE);
                var addRate = allTemplate['attnum'];
                obj.rate += addRate;
                artifactObj = obj;
                break;
            }
        }
    }
    msg.result = errorCodes.OK;
    msg.info = artifactObj;
    return msg;
};

/**
 * 神装升星
 * @param type 神装类型
 * @returns {*} 返回更新的单个神装对象
 */
handler.actionRaiseStarNum = function (type) {
    var self = this;
    var msg = {};
    if (type < 0 || type > 6) {
        return msg.result = errorCodes.TYPE_ERROR;
    }

    var hasActivation = false;
    var activationTempID = 0;
    var star = -1;
    for (var index in self.activationInfo) {
        var obj = self.activationInfo[index];
        if (obj.type == type) {
            hasActivation = true;
            star = obj.star;
            activationTempID = obj.tempId;
            break;
        }
    }
    if (!hasActivation) {
        return msg.result = errorCodes.NOT_ACTIVATION;
    }

    var starTempId = Math.floor(activationTempID / 1000) * 1000 + star;
    // 可以升级
    var raiseStarTemplate = templateManager.GetTemplateByID('ArtifactStarTemplate', starTempId);
    var nextAttID = raiseStarTemplate['nextAttID'];
    if (nextAttID == 0) {
        return msg.result = errorCodes.ALREADY_MAX_STAR;
    }

    var itemID_1 = raiseStarTemplate['itemID_1'];
    var itemNum_1 = raiseStarTemplate['itemNum_1'];
    if (itemNum_1 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_1, itemNum_1) == false) {
            return errorCodes.NoAssets;
        }
    }
    var itemID_2 = raiseStarTemplate['itemID_2'];
    var itemNum_2 = raiseStarTemplate['itemNum_2'];
    if (itemNum_2 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_2, itemNum_2) == false) {
            return errorCodes.NoAssets;
        }
    }
    var itemID_3 = raiseStarTemplate['itemID_3'];
    var itemNum_3 = raiseStarTemplate['itemNum_3'];
    if (itemNum_3 > 0) {
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID_3, itemNum_3) == false) {
            return errorCodes.NoAssets;
        }
    }
    // 消耗道具
    if (itemNum_1 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_1, -itemNum_1, eAssetsReduce.ArtifactRaiseStar);
    }

    if (itemNum_2 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_2, -itemNum_2, eAssetsReduce.ArtifactRaiseStar);
    }

    if (itemNum_3 > 0) {
        self.owner.GetAssetsManager().AlterAssetsValue(itemID_3, -itemNum_3, eAssetsReduce.ArtifactRaiseStar);
    }
    var artifactObj = {};
    // 升星，加属性百分比，更新战力
    for (var index in self.activationInfo) {
        var obj = self.activationInfo[index];
        if (obj.type == type) {
            obj.star += 1;
            obj.zhanLi = self.CalcActivationZhanli(true, type, obj.star, obj.level, activationTempID);
            artifactObj = obj;
            break;
        }
    }

    // 更新神器技能
    self.updateSkill_2();
    msg.result = errorCodes.OK;
    msg.info = artifactObj;
    return msg;
};

/**
 * 计算神装提升的战力
 * @param type 神装类型 0 ~ 6，对应神装战力的索引偏移量（eAttLevel.ATTLEVEL_ARTIFACT_TYPE_0 + type）
 * @param isSend 是否发送，传入true
 * @param star 神装星级
 * @param level 神装等级
 * @param levelUpTemplateId ArtifactActivationTemplate tempID
 * @returns {number} 战力变化值
 * @constructor
 */
handler.CalcActivationZhanli = function (isSend, type, star, level, activationTempID) {
    var self = this;
    var levelUpTemplateId = Math.floor(activationTempID / 1000) * 1000 + level;
    var levelTemplate = templateManager.GetTemplateByID('ArtifactLevelUpTemplate', levelUpTemplateId);
    var attributeID_1 = levelTemplate['attributeID_1'];
    var attributeNum_1 = levelTemplate['attributeNum_1'];
    var attributeID_2 = levelTemplate['attributeID_2'];
    var attributeNum_2 = levelTemplate['attributeNum_2'];
    /** 属性管理器*/
    var attManager = self.owner.attManager;
    /** 获取原来战力 */
    var zhanLiIndex = eAttLevel.ATTLEVEL_ARTIFACT_TYPE_0 + type;
    var oldZhanli = attManager.getZhanli(zhanLiIndex);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    /**清除原来套装属性加成*/
    attManager.clearLevelAtt(zhanLiIndex, eAttInfo.MAX);
    attManager.clearZhanli(zhanLiIndex);

    /** 星级加成 */
    var starTemplateId = Math.floor(activationTempID / 1000) * 1000 + star;
    var percent = 0;
    if (star > 0) {
        var raiseStarTemplate = templateManager.GetTemplateByID('ArtifactStarTemplate', starTemplateId);
        percent = raiseStarTemplate['percent'];

        attributeNum_1 = Math.floor(attributeNum_1 * (percent + 100) / 100);
        attributeNum_2 = Math.floor(attributeNum_2 * (percent + 100) / 100);
    }

    /**神装属性加成*/
    if (attributeNum_1 > 0) {
        attManager.AddLevelAttValue(zhanLiIndex, attributeID_1, attributeNum_1);
    }
    if (attributeNum_2 > 0) {
        attManager.AddLevelAttValue(zhanLiIndex, attributeID_2, attributeNum_2);
    }
    /** 重算玩家所有属性*/
    attManager.UpdateAtt();
    /** 重算玩家号称战力*/
    attManager.computeZhanli(zhanLiIndex, eAttInfo.MAX);
    /** 重新获取战力*/
    var newZhanli = attManager.getZhanli(zhanLiIndex);
    /**发布战力更新*/
    self.owner.UpdateZhanli(Math.abs(Math.floor(newZhanli - oldZhanli)), (newZhanli - oldZhanli) > 0 ? true : false, isSend);
    /**通知客户属性变更*/
    if (isSend) {
        attManager.SendAttMsg(null);
    }
    var addZhanLi = 0;
    addZhanLi += self.getSingleArtifactZhanLi(attributeID_1, attributeNum_1);
    addZhanLi += self.getSingleArtifactZhanLi(attributeID_2, attributeNum_2);
    return addZhanLi;
};

handler.getSingleArtifactZhanLi = function (id, num) {
    var zhanLi = 0;
    switch (id) {
        case eAttInfo.ATTACK:        //攻击力
            zhanLi += num * gameConst.eAttFactor.GONGJI;
            break;
        case eAttInfo.DEFENCE:         //防御力
            zhanLi += num * gameConst.eAttFactor.FANGYU;
            break;
        case eAttInfo.HP:         //HP
            zhanLi += num * gameConst.eAttFactor.HP;
            break;
        case eAttInfo.MP:         //MP
            zhanLi += num * gameConst.eAttFactor.MP;
            break;
        case eAttInfo.MAXHP:           //最大血量
            zhanLi += num * gameConst.eAttFactor.MAXHP;
            break;
        case eAttInfo.MAXMP:           //最大魔法量
            zhanLi += num * gameConst.eAttFactor.MAXMP;
            break;
        case eAttInfo.CRIT:           //暴击值
            zhanLi += num * gameConst.eAttFactor.BAOJILV;
            break;
        case eAttInfo.CRITDAMAGE:           //暴击伤害
            zhanLi += num * gameConst.eAttFactor.BAOJISHANGHAI;
            break;
        case eAttInfo.DAMAGEUP:           //伤害提升
            zhanLi += num * gameConst.eAttFactor.SHANGHAITISHENG;
            break;
        case eAttInfo.HUNMIREDUCE:           //昏迷
            zhanLi += num * gameConst.eAttFactor.HUNMI;
            break;
        case eAttInfo.HOUYANGREDUCE:           //后仰
            zhanLi += num * gameConst.eAttFactor.HOUYANG;
            break;
        case eAttInfo.HPRATE:           //Hp回复速率
            zhanLi += num * gameConst.eAttFactor.HPHUIFU;
            break;
        case eAttInfo.MPRATE:           //Mp回复速率
            zhanLi += num * gameConst.eAttFactor.MPHUIFU;
            break;
        case eAttInfo.ANTICRIT:           //暴击抵抗
            zhanLi += num * gameConst.eAttFactor.BAOJIDIKANG;
            break;
        case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
            zhanLi += num * gameConst.eAttFactor.BJSHHJM;
            break;
        case eAttInfo.DAMAGEREDUCE:           //伤害减免
            zhanLi += num * gameConst.eAttFactor.SHANGHAIJIANMIAN;
            break;
        case eAttInfo.ANTIHUNMI:           //昏迷抵抗
            zhanLi += num * gameConst.eAttFactor.HUNMIDIKANG;
            break;
        case eAttInfo.ANTIHOUYANG:           //后仰抵抗
            zhanLi += num * gameConst.eAttFactor.HOUYANGDIKANG;
            break;
        case eAttInfo.ANTIFUKONG:           //浮空抵抗
            zhanLi += num * gameConst.eAttFactor.FUKONGDIKANG;
            break;
        case eAttInfo.ANTIJITUI:           //击退抵抗
            zhanLi += num * gameConst.eAttFactor.JITUIDIKANG;
            break;
        case eAttInfo.HUNMIRATE:           //昏迷几率
            zhanLi += num * gameConst.eAttFactor.HUNMIJILV;
            break;
        case eAttInfo.HOUYANGRATE:           //后仰几率
            zhanLi += num * gameConst.eAttFactor.HOUYANGJILV;
            break;
        case eAttInfo.FUKONGRATE:           //后仰几率
            zhanLi += num * gameConst.eAttFactor.FUKONGJILV;
            break;
        case eAttInfo.JITUIRATE:           //击退几率
            zhanLi += num * gameConst.eAttFactor.JITUIJILV;
            break;
        case eAttInfo.FREEZERATE:          //冰冻几率
            zhanLi += num * gameConst.eAttFactor.FREEZERATE;
            break;
        case eAttInfo.STONERATE:          //石化几率
            zhanLi += num * gameConst.eAttFactor.STONERATE;
            break;
        case eAttInfo.ANTIFREEZE:            //冰冻抵抗
            zhanLi += num * gameConst.eAttFactor.ANTIFREEZE;
            break;
        case eAttInfo.ANTISTONE:           //石化抵抗
            zhanLi += num * gameConst.eAttFactor.ANTISTONE;
            break;
    }
    return zhanLi;
};

/**
 * 更新神器技能1，对应神器等级
 */
handler.updateSkill_1 = function () {
    var self = this;
    if (self.activationInfo.length < ACTION_TOTAL_TYPE_COUNT) {
        return;
    }

    if (self.skillAtt_1 == 0) {
        var allTemplate = templateManager.GetTemplateByID('AllTemplate', START_SKILL_ID_1);
        self.skillAtt_1 = allTemplate['attnum'];
    }

    var skillTemplate = templateManager.GetTemplateByID('ArtifactSkillTemplate', self.skillAtt_1);
    var nextAttID = skillTemplate['nextAttID'];
    if (nextAttID > 0) {
        var nextTemplate = templateManager.GetTemplateByID('ArtifactSkillTemplate', nextAttID);
        var nextNum = nextTemplate['num'];
        var success = true;
        for (var index in self.activationInfo) {
            var obj = self.activationInfo[index];
            var activationTemplate = templateManager.GetTemplateByID('ArtifactActivationTemplate', obj.tempId);
            var quality = activationTemplate['quality'];
            var iconNum = activationTemplate['iconNum'];
            if ((quality + 1) * 100 + iconNum < nextNum) {
                success = false;
                break;
            }
        }
        if (success) {
            // 激活下一级技能
            self.skillAtt_1 = nextAttID;
            self.activationSkill(self.skillAtt_1, false);
        }
    }
};
/**
 * 更新神器技能1，对应神器星级
 */
handler.updateSkill_2 = function () {
    var self = this;
    if (self.activationInfo.length < ACTION_TOTAL_TYPE_COUNT) {
        return;
    }

    if (self.skillAtt_2 == 0) {
        var allTemplate = templateManager.GetTemplateByID('AllTemplate', START_SKILL_ID_2);
        self.skillAtt_2 = allTemplate['attnum'];
    }

    var skillTemplate = templateManager.GetTemplateByID('ArtifactSkillTemplate', self.skillAtt_2);
    var nextAttID = skillTemplate['nextAttID'];
    if (nextAttID > 0) {
        var nextTemplate = templateManager.GetTemplateByID('ArtifactSkillTemplate', nextAttID);
        var nextNum = nextTemplate['num'];
        var success = true;
        for (var index in self.activationInfo) {
            var obj = self.activationInfo[index];
            if (obj.star < nextNum) {
                success = false;
                break;
            }
        }
        if (success) {
            // 激活下一级技能
            self.skillAtt_2 = nextAttID;
            self.activationSkill(self.skillAtt_2, false);
        }
    }
};

/**
 * 使用神装技能
 * @param skillAttID 神装技能模板ID
 * @param isAutoUpdate 是否自动激活
 * @returns {{}}
 */
handler.activationSkill = function (skillAttID, isAutoUpdate) {
    var self = this;
    var msg = {};
    var activateSkillID = self.owner.GetPlayerInfo(ePlayerInfo.artifactSkill);
    var activateType = self.getSkillTypeBySkillID(activateSkillID);
    if (activateType == -1) {
        msg.result = errorCodes.SKILL_TYPE_NOT_FOUND;
        return msg;
    }
    if (self.skillAtt_1 > 0 && self.skillAtt_1 == skillAttID) {
        var skillTemplate = templateManager.GetTemplateByID('ArtifactSkillTemplate', skillAttID);
        var skillID = skillTemplate['skillID'];
        if (isAutoUpdate || activateType == 0) {
            self.owner.SetPlayerInfo(ePlayerInfo.artifactSkill, skillID);
        }
        msg.result = errorCodes.OK;
        return msg;
    }
    if (self.skillAtt_2 > 0 && self.skillAtt_2 == skillAttID) {
        var skillTemplate = templateManager.GetTemplateByID('ArtifactSkillTemplate', skillAttID);
        var skillID = skillTemplate['skillID'];
        if (isAutoUpdate || activateType == 1) {
            self.owner.SetPlayerInfo(ePlayerInfo.artifactSkill, skillID);
        }
        msg.result = errorCodes.OK;
        return msg;
    }
    msg.result = errorCodes.SKILL_NOT_ACTIVATION;
    return msg;
};

handler.getSkillTypeBySkillID = function (skillID) {
    var skillTemplate = templateManager.GetAllTemplate('ArtifactSkillTemplate');
    for (var index in skillTemplate) {
        var temp = skillTemplate[index];
        var sID = temp['skillID'];
        if (skillID == sID) {
            return temp['type'];
        }
    }
    return -1;
};
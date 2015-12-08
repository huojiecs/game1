/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-5
 * Time: 上午9:51
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var skill = require('./skill');
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var templateManager = require('../../tools/templateManager');
var defaultValues = require('../../tools/defaultValues');
var templateConst = require('../../../template/templateConst');
var buffManager = require('../buff/buffManager');
var csSql = require('../../tools/mysql/csSql');
var errorCodes = require('../../tools/errorCodes');
var tSkill = templateConst.tSkill;
var tSkillLearn = templateConst.tSkillLearn;
var eSkillInfo = gameConst.eSkillInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var _ = require('underscore');



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var tCustom = templateConst.tCustom;
var log_utilSql = require('../../tools/mysql/utilSql');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.skillList = {};
    this.soulBuffInAction = [];
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (skillList) {
    var skillZhan = 0;
    for (var index in skillList) {
        var skillID = skillList[index][eSkillInfo.TempID];
        var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
        if (skillTemplate != null) {
            var skillSeries = skillTemplate[tSkill.skillSeries];
            var temp = new skill(skillTemplate);
            temp.SetSkillAllInfo(skillList[index]);
            this.skillList[skillSeries] = temp;
            var skillLevel = skillTemplate[tSkill.skillLevel];
            var beginID = skillID - skillLevel + 1;
            for (var i = beginID; i <= skillID; ++i) {
                var skillTemp = templateManager.GetTemplateByID('SkillTemplate', i);
                if (null != skillTemp) {
                    var learnLevel = skillTemp[tSkill.learnLevel];
                    skillZhan += learnLevel * 5;
                }
            }
        }
    }
    return skillZhan;
};

handler.GetSqlStr = function () {
    //return utilSql.BuildSqlStringFromObjects(this.skillList, 'GetSkillInfo', eSkillInfo);
    return "";
};

handler.SaveSkillInfo = function () {
    var sqlStr = utilSql.BuildSqlStringFromObjects(this.skillList, 'GetSkillInfo', eSkillInfo);
    csSql.SaveSkillInfo(this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), sqlStr, function (err) {
        if (!!err) {
            logger.error("save skill info error=%s", err.stack);
        }
    });
};


handler.AddSkill = function ( skillID, nType) {
    var self = this;
    var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
    if (null == skillTemplate) {
        return 1;
    }
    var seriesID = skillTemplate[tSkill.skillSeries];
    var newSkill = new skill(skillTemplate);
    var tempInfo = new Array(eSkillInfo.Max);
    tempInfo[eSkillInfo.RoleID] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    tempInfo[eSkillInfo.TempID] = skillID;
    tempInfo[eSkillInfo.CdTime] = 0;
    tempInfo[eSkillInfo.RuneBranch] = 0;
    newSkill.SetSkillAllInfo(tempInfo);
    this.skillList[seriesID] = newSkill;
    self.SaveSkillInfo();
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_skillArgs = [log_getGuid.GetUuid(), this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), nType,
        skillID, log_utilSql.DateToString(new Date())];
    log_insLogSql.InsertSql(eTableTypeInfo.Skill, log_skillArgs);
    //logger.info( '添加技能  入库成功' + nType );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return 0;
};

handler.CreateSkill = function ( seriesID, learnType) {      //learnType： 0 金币学习 1 钻石学习
    var self = this;
    var oldSkill = this.skillList[seriesID];
    var newSkillID = 0;
    var oldLevel = 0;       //技能的原始等级
    var newLevel = 0;       //学习后的技能等级
    if (null == oldSkill) {
        var learnTemplate = templateManager.GetTemplateByID('SkillLearnTemplate', seriesID);
        if (null == learnTemplate) {
            return errorCodes.NoTemplate;
        }
        newSkillID = learnTemplate[tSkillLearn.beginSKill];
        var runeBranch = 0;
    }
    else {
        var skillID = oldSkill.GetSkillInfo(eSkillInfo.TempID);
        var runeBranch = oldSkill.GetSkillInfo(eSkillInfo.RuneBranch);
        var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
        if (null == skillTemplate) {
            return errorCodes.NoTemplate;
        }
        newSkillID = skillTemplate[tSkill.behindSkill];
        oldLevel = skillTemplate[tSkill.skillLevel];      //当前技能等级
    }
    if (newSkillID == 0) {
        return errorCodes.SkillFull;
    }
    var newSkillTemplate = templateManager.GetTemplateByID('SkillTemplate', newSkillID);
    if (null == newSkillTemplate) {
        return errorCodes.NoTemplate;
    }
    var needSeries = newSkillTemplate[tSkill.needSeries];
    if (needSeries > 0) {
        var needSkill = this.skillList[needSeries];
        if (needSkill == null) {   //不满足前置系列
            return errorCodes.NoNeedSkill;
        }
    }
    if (newSkillTemplate[tSkill.skillLevel] > newSkillTemplate[tSkill.skillMaxLevel]) {
        return errorCodes.SkillFull;
    }
    var learnLevel = newSkillTemplate[tSkill.learnLevel];
    newLevel = newSkillTemplate[tSkill.skillLevel];
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_SkillGuid = log_getGuid.GetUuid();
    var log_roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var log_skillArgs = [log_SkillGuid, log_roleID, gameConst.eAddSkillType.New, newSkillID,
        log_utilSql.DateToString(new Date())];
    log_insLogSql.InsertSql(eTableTypeInfo.Skill, log_skillArgs);
    //logger.info( '学习技能事件 数据入库成功' );

    var log_MoneyGuid = log_getGuid.GetUuid();
    var log_beforeMoney;
    var log_afterMoney;
    var log_MoneyType;

    if (expLevel < learnLevel) {
        return errorCodes.ExpLevel;
    }
    for (var i = 0; i < 2; ++i) {
        var assetsID = newSkillTemplate['consumeID_' + i];
        var assetsNum = newSkillTemplate['consumeNum_' + i];
        if (assetsID > 0 && assetsNum > 0) {
            if (assetsManager.CanConsumeAssets(assetsID, assetsNum) == false) {
                return errorCodes.NoMoney;
            }
        }
    }
    for (var i = 0; i < 2; ++i) {
        var assetsID = newSkillTemplate[tSkill['consumeID_' + i]];
        var assetsNum = newSkillTemplate[tSkill['consumeNum_' + i]];
        if (assetsID > 0 && assetsNum > 0) {
            log_beforeMoney = assetsManager.GetAssetsValue(assetsID);
            //assetsManager.SetAssetsValue(assetsID, -assetsNum)
            assetsManager.AlterAssetsValue(assetsID, -assetsNum, eAssetsReduce.SkillLevelUp);
            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            log_afterMoney = assetsManager.GetAssetsValue(assetsID);
            log_MoneyType = assetsID;
            var log_MoneyArgs = [log_MoneyGuid, log_roleID, gameConst.eMoneyChangeType.LearnSkill, log_SkillGuid,
                log_MoneyType, log_beforeMoney, log_afterMoney,
                log_utilSql.DateToString(new Date())];
            log_insLogSql.InsertSql(eTableTypeInfo.MoneyChange, log_MoneyArgs);
            //logger.info( '学习技能金钱变化 数据入库成功' );
            ///////////////////////////////////////////////////////////////////////////////////////////////////////
        }
    }

    var newSkill = new skill(newSkillTemplate);
    var tempInfo = new Array(eSkillInfo.Max);
    tempInfo[eSkillInfo.RoleID] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    tempInfo[eSkillInfo.TempID] = newSkillID;
    tempInfo[eSkillInfo.CdTime] = 0;
    tempInfo[eSkillInfo.RuneBranch] = runeBranch;
    newSkill.SetSkillAllInfo(tempInfo);
    this.skillList[seriesID] = newSkill;
    self.SaveSkillInfo();
    if (newLevel > oldLevel) {
        this.owner.UpdateZhanli(learnLevel * 5, true, true);
    }
    return 0;
};

handler.SendSkillMsg = function ( tempID) {
    if (null == this.owner) {
        logger.error('SendSkillMsg玩家是空的')
        return;
    }
    var route = 'ServerSkillUpdate';
    var skillMsg = {
        skillList: [],
        media_id: defaultValues.thumb_media_id
    };
    if (null == tempID) {
        for (var index in this.skillList) {
            var tempSkill = this.skillList[index];
            var tempMsg = {};
            for (var i = 0; i < eSkillInfo.Max; ++i) {
                tempMsg[i] = tempSkill.GetSkillInfo(i);
            }
            skillMsg.skillList.push(tempMsg);
        }
    }
    else {
        if (null == this.skillList[tempID]) {
            return;
        }
        else {
            var tempSkill = this.skillList[tempID];
            var tempMsg = {};
            for (var i = 0; i < eSkillInfo.Max; ++i) {
                tempMsg[i] = tempSkill.GetSkillInfo(i);
            }
            skillMsg.skillList.push(tempMsg);
        }
    }
    this.owner.SendMessage(route, skillMsg);
};

handler.UseSkill = function ( skillID) {
    skillID = skillID + '';
    skillID = skillID.substring(0, skillID.length - 2);

    logger.info('使用技能啦skillID=' + skillID);

    var buffIDList = [];
    if (null == this.owner) {
        return buffIDList;
    }

    var oldSkill = this.skillList[skillID];
    if (null == oldSkill) {
        logger.info('没有这个技能');
        return buffIDList;
    }

    var SkillTemplate = oldSkill.GetTemplate();
    var playerType = SkillTemplate[tSkill.playerType];
    logger.info('技能类型为playerType=' + playerType);

    if (playerType == 1) {
        for (var i = 0; i < 4; ++i) {
            var buffID = SkillTemplate['buffID_' + i];
            if (buffID > 0) {
                buffIDList.push(buffID);
                buffManager.AddBuff(this.owner, this.owner, buffID);
            }
        }
    }

    return buffIDList;
};

handler.GetSkill = function ( seriesID) {
    if (seriesID in this.skillList) {
        return this.skillList[seriesID];
    } else {
        return null;
    }
};

handler.GetAllSkill = function () {
    var skillList = [];
    for (var index in this.skillList) {
        skillList.push(this.skillList[index]);
    }
    return skillList;
};

handler.GetAllSkillID = function () {
    var skillIDList = [];
    for (var index in this.skillList) {
        var temp = this.skillList[index];
        if (null != temp['skillTemplate']) {
            skillIDList.push(temp['skillTemplate'].attID);
        }
    }
    return skillIDList;
};

/**
 * 获取 所有技能信息
 *
 * @return {Array}
 * */
handler.GetAllSkillInfo = function () {
    var skillList = [];

    for (var index in this.skillList) {
        var tempSkill = this.skillList[index];
        var tempMsg = {};
        for (var i = 0; i < eSkillInfo.Max; ++i) {
            tempMsg[i] = tempSkill.GetSkillInfo(i);
        }
        skillList.push(tempMsg);
    }
    return skillList;
};

handler.skillIsLearn = function ( seriesID) {
    if (seriesID in this.skillList) {
        if (this.skillList[seriesID] != undefined) {
            return true;
        } else {
            return false;
        }
    }
    else {
        return false;
    }
};

handler.AddBuff = function ( buffID) {      //添加buff
    if (null == this.owner) {
        return false;
    }
    if (buffID < 0) {
        return false;
    }
    buffManager.AddBuff(this.owner, this.owner, buffID);
};

handler.DelBuff = function ( buffList) {      //删除buff
    if (null == this.owner || null == buffList) {
        return false;
    }
    for (var i in buffList) {
        if (buffList[i] > 0) {
            buffManager.DeleteBuff(this.owner, buffList[i]);
        }
    }
};

handler.GetBuffIDList = function () {
    if (null == this.owner) {
        return [];
    }
    return buffManager.GetBuffList(this.owner);
};

/**
 * @return {boolean}
 */
handler.PushSoulBuffList = function ( buffList) {
    if (null == this.owner) {
        return false;
    }

    if (!buffList.length) {
        return false;
    }

    this.soulBuffInAction = buffList;
};

/**
 *
 * @returns {Array}
 * @constructor
 */
handler.PopSoulBuffList = function () {      //删除buff
    if (null == this.owner) {
        return [];
    }

    var buffList = this.soulBuffInAction;

    this.soulBuffInAction = [];

    return buffList;
};

/**
 * @return {boolean}
 */
handler.HasSoulBuffList = function () {
    if (null == this.owner) {
        return false;
    }

    return !!this.soulBuffInAction.length;
};

// 是否需要转换
handler.isNeedTrans = function() {
    var currCareerID = this.owner.GetPlayerInfo(ePlayerInfo.TEMPID);
    if(currCareerID > 3){
        currCareerID += 6;
    }

    for(var seriesID in this.skillList) {
        var oldCareerID = Math.floor(seriesID / 1000);
        if (!_.contains(defaultValues.careerIDs, oldCareerID)) {
            continue;
        }

        if(currCareerID != oldCareerID){
            return true;
        }

        var oldSkill = this.skillList[seriesID];
        if(oldSkill == null){
            continue;
        }

        oldCareerID = Math.floor(oldSkill.GetSkillInfo(eSkillInfo.TempID) / 100000);
        if(oldCareerID != currCareerID){
            return true;
        }
    }

    return false;
}

/**
 * 转职, 转换技能
 * */
handler.TransferSkill = function() {
    var skillList = {};
    var careerID = this.owner.GetPlayerInfo(ePlayerInfo.TEMPID);
    for(var seriesID in this.skillList) {
        if(!_.contains(defaultValues.careerIDs, Math.floor(seriesID / 1000))) {
            continue;
        }
        var careerMark = careerID > 3 ? careerID + 6 : careerID;  // 职业ID 和技能ID的职业标识没对上， 需要转换
        var newSeriesID = seriesID % 1000 + careerMark * 1000;
        var newSkillID = 0;
        var oldSkill = this.skillList[seriesID];
        if(null == oldSkill) {
            var learnTemplate = templateManager.GetTemplateByID('SkillLearnTemplate', newSeriesID);
            if (null == learnTemplate) {
                return errorCodes.NoTemplate;
            }
            newSkillID = learnTemplate[tSkillLearn.beginSKill];
        } else {
            var skillID = oldSkill.GetSkillInfo(eSkillInfo.TempID);
            newSkillID = skillID % 1e+5 + careerMark * 1e+5;
        }
        if (newSkillID == 0) {
            return errorCodes.SkillFull;
        }
        var newSkillTemplate = templateManager.GetTemplateByID('SkillTemplate', newSkillID);
        if (null == newSkillTemplate) {
            return errorCodes.NoTemplate;
        }
        var newSkill = new skill(newSkillTemplate);
        var tempInfo = new Array(eSkillInfo.Max);
        tempInfo[eSkillInfo.RoleID] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
        tempInfo[eSkillInfo.TempID] = newSkillID;
        tempInfo[eSkillInfo.CdTime] = 0;
        tempInfo[eSkillInfo.RuneBranch] = 0;
        newSkill.SetSkillAllInfo(tempInfo);
        skillList[newSeriesID] = newSkill;
        delete this.skillList[seriesID];
    }
    for(var index in skillList) {
        this.skillList[index] = skillList[index];
    }
    this.SaveSkillInfo();
};
/**
 * Created by Cuilin on 14-8-7.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utilSql = require('../../tools/mysql/utilSql');
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var Rune = require('./rune');
var errorCodes = require('../../tools/errorCodes');
var globalFunction = require('../../tools/globalFunction');
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var ePlayerInfo = gameConst.ePlayerInfo;
var eRuneInfo = gameConst.eRuneInfo;
var eSkillInfo = gameConst.eSkillInfo;
var tRune = templateConst.tRune;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.runeList = {};
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (runeList) {
    var runeZhanLi = 0;
    for (var index in runeList) {
        var runeID = runeList[index][eRuneInfo.tempID];
        var runeTemplate = templateManager.GetTemplateByID('RuneTemplate', runeID);
        if (runeTemplate != null) {
            var seriesID = runeTemplate[tRune.SkillType];
            var grade = runeTemplate[tRune.branchNum];
            var temp = new Rune(runeTemplate);
            temp.SetRuneAllInfo(runeList[index]);
            if (this.runeList[seriesID] == undefined) {
                this.runeList[seriesID] = [];
            }
            this.runeList[seriesID][grade - 1] = temp;
            var zhanli = runeTemplate[tRune.zhanLi];
            runeZhanLi += zhanli;
        }
    }
    return runeZhanLi;
};

handler.GetSqlStr = function () {
    var runeList = {};
    for (var id in this.runeList) {
        for (var index in this.runeList[id]) {
            var rune = this.runeList[id][index];
            var runeID = rune.GetRuneInfo(eRuneInfo.tempID);
            runeList[runeID] = rune;
        }
    }
    return utilSql.BuildSqlStringFromObjects(runeList, 'GetRuneInfo', eRuneInfo);
};

handler.LearnRune = function (seriesID, runeID) {
    var runeTemplate = templateManager.GetTemplateByID('RuneTemplate', runeID);
    // 判断传来的runeID是否符合seriesID
    if (seriesID != runeTemplate[tRune.SkillType]) {
        logger.info('符文与技能不符');
        return errorCodes.Rune_MatchingError;
    }
    // 判断该符文的技能有没有学习
    if (!this.owner.GetSkillManager().skillIsLearn(seriesID)) {
        logger.info('技能还没有学习，seriesID = ' + seriesID);
        return errorCodes.Rune_NoSkill;
    }
    // 判断等级是否满足
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var learnLevel = runeTemplate[tRune.openLevel];
    if (expLevel < learnLevel) {
        logger.info('学习等级不足, runeID = ' + runeID);
        return errorCodes.ExpLevel;
    }
    var grade = runeTemplate[tRune.branchNum];
    var seriesSkill = this.owner.GetSkillManager().GetSkill(seriesID);
    if (this.runeList[seriesID] != undefined) {
        // 判断是否是同一个分支
        if (runeTemplate[tRune.branch] != seriesSkill.GetSkillInfo(eSkillInfo.RuneBranch)) {
            logger.info('不是同一个技能符文分支，无法学习');
            return errorCodes.Rune_RuneBranch;
        }
        // 判断是否是第一层符文（新开启分支）
        if (grade != 1) {
            // 判断该符文前置符文有没有学习(上阶级lv)
            if (this.runeList[seriesID][grade - 2] == undefined) {
                logger.info('前置技能符文没有学习，无法学习本阶技能符文');
                return errorCodes.Rune_NoNeedRune;
            }
        }
        // 判断该符文重复学习（本阶）
        if ((grade - 1) in this.runeList[seriesID]) {
            logger.info('本阶节能符文已学习，无法重复学习')
            return errorCodes.Rune_RuneHasLearn;
        }
    } else {
        if (seriesSkill.GetSkillInfo(eSkillInfo.RuneBranch) != 0) {
            seriesSkill.SetSkillInfo(eSkillInfo.RuneBranch, 0);
            this.owner.GetSkillManager().SaveSkillInfo();
        }
        if (grade != 1) {
            logger.info('前置技能符文没有学习，无法学习本阶技能符文');
            return errorCodes.Rune_NoNeedRune;
        }
    }

    // 判断消耗(是否是终极技能符文 --> 判符文)
    var assetsManager = this.owner.GetAssetsManager();
    //TODO: 财产消耗 要修改
    var skillPointCost = runeTemplate[tRune.skillPoint];
    if (skillPointCost > 0) {
        if (assetsManager.CanConsumeAssets(globalFunction.GetSkillPoint(), skillPointCost) == false) {
            return errorCodes.Rune_NoEnoughSkillPoint;
        }
        assetsManager.AlterAssetsValue(globalFunction.GetSkillPoint(), -skillPointCost, eAssetsReduce.LearnRune);
    }
    if (runeTemplate[tRune.branchNum] == 4) {
        var assetsID = runeTemplate[tRune.runeID];
        var assetsNum = runeTemplate[tRune.runeNum];
        if (assetsID > 0 && assetsNum > 0) {
            if (assetsManager.CanConsumeAssets(assetsID, assetsNum) == false) {
                return errorCodes.Rune_NoEnoughRuneAssets;
            }
            assetsManager.AlterAssetsValue(assetsID, -assetsNum, eAssetsReduce.LearnRune);
        }
    }
    // runelist push
    var rune = new Rune(runeTemplate);
    var tempInfo = new Array(eRuneInfo.Max);
    tempInfo[eRuneInfo.roleID] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    tempInfo[eRuneInfo.tempID] = runeID;
    tempInfo[eRuneInfo.skillType] = seriesID;
    rune.SetRuneAllInfo(tempInfo);
    if (this.runeList[seriesID] == undefined) {
        this.runeList[seriesID] = [];
        seriesSkill.SetSkillInfo(eSkillInfo.RuneBranch, runeTemplate[tRune.branch]);
        this.owner.GetSkillManager().SaveSkillInfo();
    }
    this.runeList[seriesID][grade - 1] = rune;
    // update zhanli
    this.owner.UpdateZhanli(runeTemplate[tRune.zhanLi], true, true);
    this.SendRuneMsg(null);
    return 0;
};

handler.ResetRune = function (seriesID, notSend) {
    // 判断该技能有没有学习
    if (!this.owner.GetSkillManager().skillIsLearn(seriesID)) {
        logger.info('技能还没有学习，seriesID = ' + seriesID);
        return errorCodes.Rune_NoSkill;
    }
    if (!(seriesID in this.runeList)) {
        logger.info('没有学习该技能的任何符文，seriesID = ' + seriesID);
        return errorCodes.Rune_NoRune;
    }
    // 根据seriesID遍历 this.runeList[seriesID] 表，算出要返还的技能点和符文个数
    var SkillPointCost = 0;
    var Zhanli = 0;
    var assetsManager = this.owner.GetAssetsManager();
    for (var index in this.runeList[seriesID]) {
        var runeTemplate = this.runeList[seriesID][index].runeTemplate;
        Zhanli = Zhanli + runeTemplate[tRune.zhanLi];
        SkillPointCost = SkillPointCost + runeTemplate[tRune.skillPoint];

        if (runeTemplate[tRune.branchNum] == 4) {
            var assetsNum = runeTemplate[tRune.runeNum];
            var assetsID = runeTemplate[tRune.runeID];
            assetsManager.AlterAssetsValue(assetsID, assetsNum, eAssetsAdd.ResetRune);
        }
    }
    delete this.runeList[seriesID];
    // skillList中的branch值 置为默认值 0
    var seriesSkill = this.owner.GetSkillManager().GetSkill(seriesID);
    seriesSkill.SetSkillInfo(eSkillInfo.RuneBranch, 0);
    this.owner.GetSkillManager().SaveSkillInfo();
    // 返还财产
    assetsManager.AlterAssetsValue(globalFunction.GetSkillPoint(), SkillPointCost, eAssetsAdd.ResetRune);
    // update zhanli
    this.owner.UpdateZhanli(Zhanli, false, true);
    if (!notSend) {
        this.SendRuneMsg(null);
    }
    return 0;
};

handler.SendRuneMsg = function (seriesID) {
    if (null == this.owner) {
        logger.error('SendRuneMsg玩家是空的')
        return;
    }
    var route = 'ServerRuneUpdate';
    var RuneMsg = {
        runeList: []
    };
    if (null == seriesID || undefined == seriesID) {
        for (var id in this.runeList) {
            var tempRune = this.runeList[id][this.runeList[id].length - 1];
            var tempMsg = {};
            for (var i in eRuneInfo) {
                if (eRuneInfo[i] != eRuneInfo.Max) {
                    tempMsg[i] = tempRune.GetRuneInfo(eRuneInfo[i]);
                }
            }
            RuneMsg.runeList.push(tempMsg);
        }
    } else {
        if (null == this.runeList[seriesID] || undefined == this.runeList[seriesID]) {
            //return;
        }
        else {
            var tempRune = this.runeList[seriesID][this.runeList[seriesID].length - 1];
            var tempMsg = {};
            for (var i in eRuneInfo) {
                if (eRuneInfo[i] != eRuneInfo.Max) {
                    tempMsg[i] = tempRune.GetRuneInfo(eRuneInfo[i]);
                }
            }
            RuneMsg.runeList.push(tempMsg);
        }
    }
    this.owner.SendMessage(route, RuneMsg);
};

handler.GetUseRuneTemp = function (seriesID) {   //获取当前客户端用到符文模版(注：目前仅用于服务器伤害复盘)
    var temp = this.runeList[seriesID];
    if (null != temp) {
        return temp[temp.length - 1].runeTemplate;
    }
    return null;
};

/***
 * 获取所有 符文信息
 *
 * */
handler.getAllRuneInfo = function () {
    var runeList = [];
    for (var id in this.runeList) {
        var tempRune = this.runeList[id][this.runeList[id].length - 1];
        var tempMsg = {};
        for (var i in eRuneInfo) {
            if (eRuneInfo[i] != eRuneInfo.Max) {
                tempMsg[i] = tempRune.GetRuneInfo(eRuneInfo[i]);
            }
        }
        runeList.push(tempMsg);
    }
    return runeList;
};

/**
 * 所有符文重置， 转职用
 * */
handler.ResetAllRune4Transfer = function () {
    for (var seriesID in this.runeList) {
        this.ResetRune(seriesID, true);
    }
};
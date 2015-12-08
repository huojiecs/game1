/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-8-13
 * Time: 下午4:54
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var soul = require('./soul');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var redisManager = require('../chartRedis/redisManager');
var _ = require('underscore');

var eSoulInfo = gameConst.eSoulInfo;
var eAttInfo = gameConst.eAttInfo;
var eAttLevel = gameConst.eAttLevel;
var tSoul = templateConst.tSoul;
var tSoulInfo = templateConst.tSoulInfo;
var tSoulWake = templateConst.tSoulWake;
var tNotice = templateConst.tNotice;
var tBuff = templateConst.tBuff;
var tBuffAction = templateConst.tBuffAction;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eRedisClientType = gameConst.eRedisClientType;
var eForbidChartType = gameConst.eForbidChartType;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.soulList = {};
    this.owner = owner;
    this.AkeySoulInfo = {};
    this.isBianShen = false;
    this.bianShenBuffList = [];
    this.bianShenAttList = [];
    this.hasBianShenAtt = false;
    this.bianShenCDList = {};
    this.bianShenEndTime = 0;
};

var handler = Handler.prototype;

handler.LoadDataByDB = function ( soulList, isOff) {
    for (var index in soulList) {
        var tempID = soulList[index][eSoulInfo.TEMPID];
        var SoulTemplate = templateManager.GetTemplateByID('SoulTemplate', tempID);
        if (null != SoulTemplate) {
            var level = soulList[index][eSoulInfo.LEVEL];
            var propLevel = level || 1;
            var soulInfoID = SoulTemplate['att_' + ( propLevel - 1)];
            var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
            if (soulList[index][eSoulInfo.PROBABILITY] == undefined ||
                soulList[index][eSoulInfo.PROBABILITY] == 0) {
                soulList[index][eSoulInfo.PROBABILITY] = SoulInfoTemplate[tSoulInfo.probability]
            }
            if (this.owner.GetAssetsManager) {
                //player.GetAssetsManager().SetAssetsMaxValue( SoulInfoTemplate[ tSoulInfo.comSoulID], SoulInfoTemplate[ tSoulInfo.maxSoulNum ] );
                this.owner.GetAssetsManager().SetAssetsMaxValue(SoulInfoTemplate[tSoulInfo.comSoulID],
                                                            gameConst.eAssetsInfo.ASSETS_MAXVALUE);    //取消魂的最大值
            }
            var tempSoul = new soul(SoulTemplate);
            tempSoul.SetSoulAllInfo(soulList[index]);
            this.soulList[tempID] = tempSoul;
            var skillID = this.GetSoulSkill(tempSoul);
            if (skillID > 0) {
                if (this.owner.GetSkillManager) {
                    this.owner.GetSkillManager().AddSkill( skillID, gameConst.eAddSkillType.Load);
                }
            }
            if (level > 0) {
                this.SetSoulAtt(tempSoul, true, false, isOff);
//                /**********检查玩家邪神已经开启，洗练还没开启***************/
//                var soulIDs = player.GetSoulSuccinctManager().souls;
//                if (_.indexOf(soulIDs,tempID) == -1) {
//                    player.GetSoulSuccinctManager().OpenOneSuccinct(player, tempID, SoulTemplate['succinctID_0']);
//                }
            }
        }
    }
//    this.changeRedisMsg();
};

handler.GetMaxSoul = function () {
    var result = null;
    for (var index in this.soulList) {
        var temp = this.soulList[index];
        if (temp) {
            if (temp.GetSoulInfo(eSoulInfo.LEVEL) > 0) {
                result = temp;
            }
        }
    }
    return result;
};

handler.GetMaxSoulID = function () {
    var result = -1;
    for (var tempID in this.soulList) {
        var temp = this.soulList[tempID];
        if (temp) {
            if (temp.GetSoulInfo(eSoulInfo.LEVEL) > 0) {
                result = tempID;
            }
        }
    }
    return result;
};

handler.GetMaxSoulTemplate = function () {
    var result = null;
    for (var index in this.soulList) {
        var temp = this.soulList[index];
        if (temp && temp.GetSoulInfo(eSoulInfo.LEVEL) > 0) {
            if (!result) {
                result = temp;
            } else if (temp.GetSoulInfo(eSoulInfo.TEMPID) > result.GetSoulInfo(eSoulInfo.TEMPID)) {
                result = temp;
            }
        }
    }
    return result;
};

handler.GetSoulByEvolveCustomID = function (customID) {
    for (var index in this.soulList) {
        var soul = this.soulList[index];
        if (!soul)
            continue;
        var SoulTemplate = soul.GetTemplate();
        if (!SoulTemplate || SoulTemplate[tSoul.evolutionCustomID]!=customID)
            continue;
        return soul;
    }
    return null;
}

handler.SetSoulAtt = function (soul, isAdd, isSend, isOff) {
    var attList = new Array(eAttInfo.MAX);
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attList[i] = temp;
    }
    for (var i = 0; i < 3; ++i) {
        var attID = soul.GetSoulInfo(eSoulInfo['ATTID_' + i]);
        var attNum = soul.GetSoulInfo(eSoulInfo['ATTNUM_' + i]);
        attList[attID][0] += attNum;
    }
    var soulZhanli = soul.GetSoulInfo(eSoulInfo.Zhanli);
    this.owner.UpdateZhanli(soulZhanli, isAdd, isSend);
    this.owner.UpdateAtt(eAttLevel.ATTLEVEL_EQUIP, attList, isAdd, isSend);

    /**　soul zhanli 变化时， 改变redis 相关值*/
    if (!isOff) {
        this.changeRedisMsg();
    }
};

handler.GetSoulSkill = function (soul) {
    var SoulTemplate = soul.GetTemplate();
    var level = soul.GetSoulInfo(eSoulInfo.LEVEL);
    if (level > 0) {
        var attID = SoulTemplate['att_' + ( level - 1 )];
        var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', attID);
        if (null != SoulInfoTemplate) {
            return SoulInfoTemplate[tSoulInfo.skillID];
        }
    }
    return 0;
};

handler.GetSoulStillTime = function (soul) {
    var SoulTemplate = soul.GetTemplate();
    var level = soul.GetSoulInfo(eSoulInfo.LEVEL);
    if (level > 0) {
        var attID = SoulTemplate['att_' + ( level - 1 )];
        var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', attID);
        if (null != SoulInfoTemplate) {
            return SoulInfoTemplate[tSoulInfo.stillTime];
        }
    }
    return 0;
};

handler.GetSoulAttBuff = function (soul) {      //获取变身的属性buff
    var SoulTemplate = soul.GetTemplate();
    var level = soul.GetSoulInfo(eSoulInfo.LEVEL);
    if (level > 0) {
        var attID = SoulTemplate['att_' + ( level - 1 )];
        var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', attID);
        if (null != SoulInfoTemplate) {
            return SoulInfoTemplate[tSoulInfo.attributeBuff];
        }
    }
    return 0;
};

handler.GetSoulSkillBuff = function (soul) {    //获取变身的光环buff
    var SoulTemplate = soul.GetTemplate();
    var level = soul.GetSoulInfo(eSoulInfo.LEVEL);
    if (level > 0) {
        var attID = SoulTemplate['att_' + ( level - 1 )];
        var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', attID);
        if (null != SoulInfoTemplate) {
            return SoulInfoTemplate[tSoulInfo.skillBuff];
        }
    }
    return 0;
};

handler.GetSoul = function (soulID) {
    return this.soulList[soulID];
};

/**
 * 获取soul 列表
 * @return {Array}
 * */
handler.getSoulList = function () {
    var list = [];
    if (this.soulList != null) {
        for (var id in this.soulList) {
            list.push(this.soulList[id]);
        }
    }
    return list;
};

handler.GetSoulList = function () {
    if (this.soulList == null) {
        return null;
    }
    return this.soulList;
};

handler.GetSqlStr = function () {
    var soulInfo = '';
    for (var index in this.soulList) {
        var temp = this.soulList[index];
        soulInfo += '(';
        for (var i = 0; i < eSoulInfo.Max; ++i) {
            var value = temp.GetSoulInfo(i);
            soulInfo += value + ',';
        }
        soulInfo = soulInfo.substring(0, soulInfo.length - 1);
        soulInfo += '),';
    }
    soulInfo = soulInfo.substring(0, soulInfo.length - 1);

    var sqlString = utilSql.BuildSqlStringFromObjects(this.soulList, 'GetSoulInfo', eSoulInfo);

    if (sqlString !== soulInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, soulInfo);
    }

    return sqlString;
};

handler.SendSoulMsg = function (tempID) {
    if (null == this.owner) {
        logger.error('SendSoulMsg玩家是空的')
        return;
    }
    var route = 'ServerSoulUpdate';
    var soulMsg = {
        soulList: []
    };
    if (null == tempID) {

        for (var index in this.soulList) {
            var tempSoul = this.soulList[index];
            var tempMsg = {};
            for (var i = 0; i < eSoulInfo.Max; ++i) {
                tempMsg[i] = tempSoul.GetSoulInfo(i);
                //logger.info('111112' + tempMsg[i]);
            }
            soulMsg.soulList.push(tempMsg);
        }
    }
    else {
        if (null == this.soulList[tempID]) {
            return;
        }
        else {
            var tempSoul = this.soulList[tempID];
            var tempMsg = {};
            for (var i = 0; i < eSoulInfo.Max; ++i) {
                tempMsg[i] = tempSoul.GetSoulInfo(i);
            }
            soulMsg.soulList.push(tempMsg);
        }
    }
    //logger.info(soulMsg);
    this.owner.SendMessage(route, soulMsg);

};

handler.GetSoulSkillZhanSum = function (tempID) {   //获取变身的技能假战力和
    var skillZhan = 0;
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var SoulTemplate = templateManager.GetTemplateByID('SoulTemplate', tempID);
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }
    var skillNum = oldSoul.GetSoulInfo(eSoulInfo.SkillNum); //当前变身开启的的技能数量
    for (var i = 1; i <= skillNum; ++i) {
        var addZhan = SoulTemplate['SkillZhanli_' + i];
        if (addZhan > 0) {
            skillZhan += addZhan;
        }
    }
    return skillZhan;
};

handler.SmeltSoul = function (tempID, smeltType) {
    var self = this;
    this.AkeySoulInfo = {};
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);

    var SoulTemplate = templateManager.GetTemplateByID('SoulTemplate', tempID);
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }

    var evolveNum = oldSoul.GetSoulInfo(eSoulInfo.EvolveNum);
    if (evolveNum == 0)
    {
        if (soulLevel > SoulTemplate[tSoul.maxLevel] || soulLevel <= 0) {
            return errorCodes.Soul_MaxLevel;
        }
    }
    else
    {
        if (soulLevel > SoulTemplate[tSoul.evolutionmaxLevel] || soulLevel <= 0) {
            return errorCodes.Soul_MaxLevel;
        }
    }

    var soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    if (null == SoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulID = SoulInfoTemplate[tSoulInfo.comSoulID];
    var soulNum = SoulInfoTemplate[tSoulInfo.comSoulNum];
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    if (assetsManager.CanConsumeAssets(soulID, soulNum) == false && smeltType != 1) {
        return errorCodes.NoAssets;
    }
    var soulAllNum = assetsManager.GetAssetsValue(soulID);
//    smeltType = 3;
    if (gameConst.eSmeltSoulType.AKeySoul == smeltType) {
        var player = self.owner;
        var vipLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
        var vipID = vipLevel + 1;
        var VipTemplate = templateManager.GetTemplateByID('VipTemplate', vipID);
        if (null == VipTemplate) {
            return errorCodes.NoTemplate;
        }
        var AKeySoulTop = VipTemplate['soulVipNeed'];
        if (1 == AKeySoulTop) {
            var num = parseInt(soulAllNum / soulNum);
            if (num > 50) {
                num = 50;
            }
            for (var i = 0; i < num; i++) {
                var numTop = false;
                for (var r = 0; r < 3; r++) {
                    var maxAttNum = SoulInfoTemplate['maxAttNum_' + r];
                    var playerNum = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + r]);
                    if (playerNum < maxAttNum) {
                        numTop = true;
                    }
                }

                if (numTop) {
                    self.SmeltSoulInterface(soulID, soulNum, tempID, smeltType, assetsManager, oldSoul,
                                            SoulInfoTemplate);
                } else {
                    break;
                }
            }
//            var oldZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
//            this.SetSoulAtt(oldSoul, true, true, false);
//            oldSoul.SetSoulZhanli(SoulInfoTemplate[tSoulInfo.upAdd_Zhan] + this.GetSoulSkillZhanSum(tempID));
//            var newZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
            var soulNumAll = this.AkeySoulInfo['soulNumAll'];
            assetsManager.SetAssetsValue(soulID, -soulNumAll);         //普通炼魂只消耗魂
            var soulZhanli = this.AkeySoulInfo['soulZhanli'];

            this.SetSoulAtt(oldSoul, false, false, false);
            this.SetSoulAtt(oldSoul, true, true, false);
            this.owner.UpdateZhanli(+soulZhanli, true, true);
            this.SendSoulMsg(tempID);
            this.changeRedisMsg();
            this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SemlSoul, 0, 1);
            this.owner.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.SemlSoul, 0, 1);     //判断悬赏任务是否完成
        } else {
            return errorCodes.VipLevel;
        }
    } else {
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_soulGuid = log_getGuid.GetUuid();
        var log_addTime = utilSql.DateToString(new Date());
        var log_soulType = gameConst.eSmeltSoulType.Normal;
        var log_soulArgs = [log_soulGuid, oldSoul.GetSoulInfo(eSoulInfo.RoleID), gameConst.eSoulOperType.SmeltSoul,
                            oldSoul.GetSoulInfo(eSoulInfo.LEVEL),
                            oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0), oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1),
                            oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2)];

        var log_MoneyArgs1 = [log_getGuid.GetUuid(), oldSoul.GetSoulInfo(eSoulInfo.RoleID),
                              gameConst.eMoneyChangeType.SmeltSoul,
                              log_soulGuid, soulID, assetsManager.GetAssetsValue(soulID)];

        if (smeltType == 1) {           //判断是否为强力炼魂引起的金钱变化
            var log_MoneyArgs = [log_getGuid.GetUuid(), oldSoul.GetSoulInfo(eSoulInfo.RoleID),
                                 gameConst.eMoneyChangeType.SmeltSoul,
                                 log_soulGuid, SoulInfoTemplate[tSoulInfo.comMoneyID],
                                 assetsManager.GetAssetsValue(SoulInfoTemplate[tSoulInfo.comMoneyID])];
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if (smeltType == 1) {           //强力炼魂
            var moneyID = SoulInfoTemplate[tSoulInfo.comMoneyID];
            var moneyNum = SoulInfoTemplate[tSoulInfo.comMoneyNum];
            if (assetsManager.CanConsumeAssets(moneyID, moneyNum) == false) {
                return errorCodes.NoAssets;
            }
            assetsManager.SetAssetsValue(moneyID, -moneyNum);   //强力炼魂只消耗元宝
            log_soulType = gameConst.eSmeltSoulType.Strong;
        }
        else {          //普通炼魂
            assetsManager.SetAssetsValue(soulID, -soulNum);         //普通炼魂只消耗魂
        }
        var minNum = SoulInfoTemplate[tSoulInfo.minAttRandom];
        var maxNum = SoulInfoTemplate[tSoulInfo.maxAttRandom];
        var moneyNum = SoulInfoTemplate[tSoulInfo.moneyAttAdd];
        var cha = maxNum - minNum + 1;
        var result = Math.floor(Math.random() * cha) + minNum;
        if (smeltType == 1) {
            result += moneyNum;
        }
        this.SetSoulAtt(oldSoul, false, false, false);
        for (var i = 0; i < result; ++i) {
            var randNum = Math.floor(Math.random() * 3);
            var maxAttNum = SoulInfoTemplate['maxAttNum_' + randNum];
            var playerNum = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + randNum]);
            var doubleNum = SoulInfoTemplate['doubleNum_' + randNum];
            if (playerNum >= maxAttNum) {
                var temp1 = randNum + 1;
                if (temp1 >= 3) {
                    temp1 = 0;
                }
                var maxAttNum1 = SoulInfoTemplate['maxAttNum_' + temp1];
                var playerNum1 = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + temp1]);
                var doubleNum1 = SoulInfoTemplate['doubleNum_' + temp1];
                if (playerNum1 >= maxAttNum1) {
                    var temp2 = temp1 + 1;
                    if (temp2 >= 3) {
                        temp2 = 0;
                    }
                    var maxAttNum2 = SoulInfoTemplate['maxAttNum_' + temp2];
                    var playerNum2 = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + temp2]);
                    var doubleNum2 = SoulInfoTemplate['doubleNum_' + temp2];
                    if (playerNum2 >= maxAttNum2) {
                        break;
                    }
                    else {
                        var addNum = playerNum2 + doubleNum2;
                        if (addNum > maxAttNum2) {
                            addNum = maxAttNum2;
                        }
                        oldSoul.SetSoulInfo(eSoulInfo['ATTNUM_' + temp2], addNum);
                    }
                }
                else {
                    var addNum = playerNum1 + doubleNum1;
                    if (addNum > maxAttNum1) {
                        addNum = maxAttNum1;
                    }
                    oldSoul.SetSoulInfo(eSoulInfo['ATTNUM_' + temp1], addNum);
                }
            }
            else {
                var addNum = playerNum + doubleNum;
                if (addNum > maxAttNum) {
                    addNum = maxAttNum;
                }
                oldSoul.SetSoulInfo(eSoulInfo['ATTNUM_' + randNum], addNum);
            }
        }
        var oldZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
        this.SetSoulAtt(oldSoul, true, true, false);
        oldSoul.SetSoulZhanli(SoulInfoTemplate[tSoulInfo.upAdd_Zhan] + this.GetSoulSkillZhanSum(tempID));
        var newZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
        this.owner.UpdateZhanli(newZhan - oldZhan, true, true);
        this.SendSoulMsg(tempID);
        /**　soul zhanli 变化时， 改变redis 相关值*/
        this.changeRedisMsg();

        this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SemlSoul, 0, 1);

        this.owner.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.SemlSoul, 0, 1);     //判断悬赏任务是否完成

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        log_soulArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0));
        log_soulArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1));
        log_soulArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2));
        log_soulArgs.push(log_soulType);
        log_soulArgs.push(log_addTime);
        log_insLogSql.InsertSql(gameConst.eTableTypeInfo.SmeltSoul, log_soulArgs);
        //logger.info( '炼魂 数据入库成功' );

        log_MoneyArgs1.push(assetsManager.GetAssetsValue(soulID));
        log_MoneyArgs1.push(log_addTime);
        log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs1);
        //logger.info( '炼魂金钱变化 入库成功' );

        if (smeltType == 1) {
            log_MoneyArgs.push(assetsManager.GetAssetsValue(SoulInfoTemplate[tSoulInfo.comMoneyID]));
            log_MoneyArgs.push(log_addTime);
            log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
            //logger.info( '强力炼魂金钱变化 入库成功' );
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
    return 0;
};


handler.LearnSoulSkill = function (tempID) {        //变身技能学习
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var skillNum = oldSoul.GetSoulInfo(eSoulInfo.SkillNum);   //当前学习的技能数量
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);     //当前变身等级
    skillNum += 1;      //将要学习的下一个技能的等级
    /*if (skillNum < 0 || skillNum > 3) {
     logger.info('变身技能学习等级错误');
     return errorCodes.SoulSkillLevelErr;
     }*/
    var SoulTemplate = templateManager.GetTemplateByID('SoulTemplate', tempID);
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }
    var needLevel = SoulTemplate['openStar_' + skillNum];   //开启技能需要的等级
    var moneyID = SoulTemplate['SkillCost_' + skillNum];     //开启技能需要的财产类型
    var moneyNum = SoulTemplate['costNum_' + skillNum];    //开启技能需要的财产数量
    var addZhanli = SoulTemplate['SkillZhanli_' + skillNum];    //开启技能需要的增加的假战力
    if (null == needLevel || null == moneyID || null == moneyNum) {
        logger.info('变身技能学习等级错误');
        return errorCodes.SoulSkillLevelErr;
    }
    if (soulLevel < needLevel) {    //等级不足
        return errorCodes.LessSoulLevel;
    }
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    //console.log('*************** moneyID = %j, moneyNum = %j', moneyID, moneyNum);
    if (assetsManager.CanConsumeAssets(moneyID, moneyNum) == false) {
        return errorCodes.NoAssets;
    }
    assetsManager.SetAssetsValue(moneyID, -moneyNum);
    oldSoul.SetSoulInfo(eSoulInfo.SkillNum, skillNum);

    //学习技能增加假战力
    this.owner.UpdateZhanli(addZhanli, true, true);
    oldSoul.AddSoulZhanli(addZhanli);
    this.SendSoulMsg(tempID);
    /**　soul zhanli 变化时， 改变redis 相关值*/
    this.changeRedisMsg();
    return errorCodes.OK;
};

handler.UpSoulLevel = function (tempID, assetsType) {
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);   //当前等级
    //logger.info('soulLevel = '+soulLevel);
    //logger.info('tempID='+tempID);
    //logger.info(oldSoul);
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }
    var evolveNum = oldSoul.GetSoulInfo(eSoulInfo.EvolveNum);
    if (evolveNum == 0)
    {
        if (soulLevel >= SoulTemplate[tSoul.maxLevel] || soulLevel <= 0) {
            return errorCodes.Soul_MaxLevel;
        }
    }
    else
    {
        if (soulLevel >= SoulTemplate[tSoul.evolutionmaxLevel] || soulLevel <= 0) {
            return errorCodes.Soul_MaxLevel;
        }
    }

    var soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    //logger.info('soulInfoID = ' + soulInfoID);
    var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    //logger.info(SoulInfoTemplate);
    if (null == SoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }
    var oldAtt_0 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0);
    var oldAtt_1 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1);
    var oldAtt_2 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2);
    var maxAtt_0 = SoulInfoTemplate[tSoulInfo.maxAttNum_0];
    var maxAtt_1 = SoulInfoTemplate[tSoulInfo.maxAttNum_1];
    var maxAtt_2 = SoulInfoTemplate[tSoulInfo.maxAttNum_2];
    /*if (( oldAtt_0 == maxAtt_0 || oldAtt_1 == maxAtt_1 || oldAtt_2 == maxAtt_2 ) == false) {
     return errorCodes.Soul_AlreadyMax;
     }*/
    var nowZhanLi = oldSoul.GetSoulZhanli();    //邪神当前的战力
    //logger.info('nowZhanLi = '+ nowZhanLi);
    var needZhanLi = SoulInfoTemplate[tSoulInfo.upLevel_Zhan]; //升星所需的战力
    //logger.info('needZhanLi = ' + needZhanLi);
    if (nowZhanLi < needZhanLi) {
        logger.info('战力不足');
        return errorCodes.Soul_LessZhan;
    }
    var cost = 0;
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    var comSoulID = SoulInfoTemplate[tSoulInfo.comSoulID];
    if (assetsType == comSoulID) {
        cost = SoulInfoTemplate[tSoulInfo.upLevel];
    }
    else if (assetsType == SoulInfoTemplate[tSoulInfo.comMoneyID]) {
        cost = SoulInfoTemplate[tSoulInfo.upLevelMoney];
    }
    else {
        return errorCodes.ParameterWrong;
    }
    if (assetsManager.CanConsumeAssets(assetsType, cost) == false) {
        return errorCodes.NoAssets;
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_UpLevelGuid = log_getGuid.GetUuid();
    var log_UpLevelRoleID = oldSoul.GetSoulInfo(eSoulInfo.RoleID);
    var log_UpLevelArgs = [log_UpLevelGuid, log_UpLevelRoleID, oldSoul.GetSoulInfo(eSoulInfo.LEVEL),
                           oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0), oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1),
                           oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2)];

    var log_MoneyArgs = [log_getGuid.GetUuid(), oldSoul.GetSoulInfo(eSoulInfo.RoleID),
                         gameConst.eMoneyChangeType.UpSoulLevel,
                         log_UpLevelGuid, assetsType, assetsManager.GetAssetsValue(assetsType)];
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    assetsManager.SetAssetsValue(assetsType, -cost);
    var prob = oldSoul.GetSoulInfo(eSoulInfo.PROBABILITY);
    if (Math.random() * 100 >= prob) {                              //升星失败
        prob = prob + 5 > 100 ? 100 : prob + 5;
        oldSoul.SetSoulInfo(eSoulInfo.PROBABILITY, prob);

        // 返回80%魂
        if (assetsType == comSoulID) {
            cost = SoulInfoTemplate[tSoulInfo.upLevel] * 0.8;
            assetsManager.SetAssetsValue(comSoulID, Math.floor(cost));
        }
        this.SendSoulMsg(tempID);
        return errorCodes.Soul_Failed;
    }
    soulLevel += 1;
    var nowAtt_0 = oldAtt_0 + SoulInfoTemplate[tSoulInfo.upAddNum_0];
    var nowAtt_1 = oldAtt_1 + SoulInfoTemplate[tSoulInfo.upAddNum_1];
    var nowAtt_2 = oldAtt_2 + SoulInfoTemplate[tSoulInfo.upAddNum_2];

    this.SetSoulAtt(oldSoul, false, false, false);

    soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    oldSoul.SetSoulInfo(eSoulInfo.LEVEL, soulLevel);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_0, nowAtt_0);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_1, nowAtt_1);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_2, nowAtt_2);
    oldSoul.SetSoulInfo(eSoulInfo.PROBABILITY, SoulInfoTemplate[tSoulInfo.probability]);
    var skillID = this.GetSoulSkill(oldSoul);
    if (skillID > 0) {
        this.owner.GetSkillManager().AddSkill( skillID, gameConst.eAddSkillType.UpSoulLevel);
    }
    //assetsManager.SetAssetsMaxValue( comSoulID, SoulInfoTemplate[ tSoulInfo.maxSoulNum ] );         //设置魂的最大存储量
    assetsManager.SetAssetsMaxValue(comSoulID, gameConst.eAssetsInfo.ASSETS_MAXVALUE);        //最大值不设置上限


    var baseZhanLi = SoulInfoTemplate[tSoulInfo.upAdd_Zhan];
    //logger.info('baseZhanLi = ' + baseZhanLi);
    var oldZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    this.SetSoulAtt(oldSoul, true, true, false);
    oldSoul.SetSoulZhanli(baseZhanLi + this.GetSoulSkillZhanSum(tempID));
    var newZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    this.owner.UpdateZhanli(newZhan - oldZhan, true, true);
    this.SendSoulMsg(tempID);
    /**　soul zhanli 变化时， 改变redis 相关值*/
    this.changeRedisMsg();
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SoulUpLev, tempID, soulLevel);
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SoulUpLev, tempID, soulLevel);
    //法宝达到指定级别后发送公告
    var faBaoID = 'faBao_' + tempID + '_' + oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', faBaoID);
    if (null != NoticeTemplate) {
        var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
        var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
        var endStr = NoticeTemplate[tNotice.noticeEndStr];
        var content = beginStr + ' ' + roleName + ' ' + endStr;
        pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.FaBao, 0, content, utils.done);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_UpLevelArgs.push(oldSoul.GetSoulInfo(eSoulInfo.LEVEL));
    log_UpLevelArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0));
    log_UpLevelArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1));
    log_UpLevelArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2));
    log_UpLevelArgs.push(utilSql.DateToString(new Date()));
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.UpSoulLevel, log_UpLevelArgs);
    //logger.info( '提升魂魄等级  数据入库成功' );

    log_MoneyArgs.push(assetsManager.GetAssetsValue(assetsType));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
    //logger.info( '提升魂魄等级金钱变化  数据入库成功' );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return errorCodes.OK;
};

handler.OpenNew = function (byMatch) {
    var self = this;
    var oldSoul = this.GetMaxSoulTemplate();
    var SoulTemplate = oldSoul.GetTemplate();
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_OpenSoulGuid = log_getGuid.GetUuid();
    var log_MoneyArgs = [log_getGuid.GetUuid(), self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                         gameConst.eMoneyChangeType.SoulOpen,
                         log_OpenSoulGuid, globalFunction.GetYuanBaoTemp(),
                         self.owner.assetsManager.GetAssetsValue(yuanbaoID)];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var openID = SoulTemplate[tSoul.openID];
    if (byMatch == false) {
        // 只有VIP有资格使用元宝解锁.
        var vip = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
        var reqVip = SoulTemplate[tSoul.openRequireVip];
        if (vip < reqVip) {
            return errorCodes.VipLevel;
        }
        var yuanbaoID = globalFunction.GetYuanBaoTemp();
        var cost = SoulTemplate[tSoul.openCost];
        if (self.owner.assetsManager.CanConsumeAssets(yuanbaoID, cost) == false) {
            return errorCodes.NoYuanBao;
        }
        // for tlog
        if (openID == 1001) {
            var factor = eAssetsReduce.UnlockSoul2;
        } else if (openID == 1002) {
            var factor = eAssetsReduce.UnlockSoul3;
        } else if (openID == 1003) {
            var factor = eAssetsReduce.UnlockSoul4;
        } else if (openID == 1004) {
            var factor = eAssetsReduce.UnlockSoul5;
        }
        //self.owner.assetsManager.SetAssetsValue(yuanbaoID, -cost);
        self.owner.assetsManager.AlterAssetsValue(yuanbaoID, -cost, factor)
    }
    var openSoul = this.soulList[openID];
    if (null == openSoul) {
        logger.error('这里出错了，没有这个法宝' + openID);
        return errorCodes.NoSoul;
    }
    openSoul.SetSoulInfo(eSoulInfo.LEVEL, 1);
    var skillID = this.GetSoulSkill(openSoul);
    if (skillID > 0) {
        this.owner.GetSkillManager().AddSkill( skillID, gameConst.eAddSkillType.OpenNew);
    }
    var openSoulTemplate = openSoul.GetTemplate();
    soulInfoID = openSoulTemplate['att_0'];
    SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    var baseZhanLi = 0;
    if (null != SoulInfoTemplate) {
        baseZhanLi = SoulInfoTemplate[tSoulInfo.upAdd_Zhan];
    }
    //logger.info('openNew baseZhanLi = ' + baseZhanLi);
    openSoul.SetSoulZhanli(baseZhanLi);
    this.SetSoulAtt(openSoul, true, true, false);
    this.SendSoulMsg(openID);
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.OpenSoul, openID, 1);
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SoulUpLev, openID,
                                                 openSoul.GetSoulInfo(eSoulInfo.LEVEL));

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_SoulArgs = [log_OpenSoulGuid, openSoul.GetSoulInfo(eSoulInfo.RoleID), gameConst.eSoulOperType.SoulOpen,
                        openSoul.GetSoulInfo(eSoulInfo.LEVEL), openSoul.GetSoulInfo(eSoulInfo.ATTNUM_0),
                        openSoul.GetSoulInfo(eSoulInfo.ATTNUM_1),
                        openSoul.GetSoulInfo(eSoulInfo.ATTNUM_2), openSoul.GetSoulInfo(eSoulInfo.ATTNUM_0),
                        openSoul.GetSoulInfo(eSoulInfo.ATTNUM_1),
                        openSoul.GetSoulInfo(eSoulInfo.ATTNUM_2), gameConst.eSmeltSoulType.OpenNew,
                        utilSql.DateToString(new Date())];
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.SmeltSoul, log_SoulArgs);
    //logger.info( 'SoulOpen魂魄打开  数据入库成功' );

    if (byMatch == false) {
        log_MoneyArgs.push(self.owner.assetsManager.GetAssetsValue(yuanbaoID));
        log_MoneyArgs.push(utilSql.DateToString(new Date()));
        log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( 'SoulOpen金钱变化  数据入库成功' );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //开启法宝后发送公告
    var faBaoID = 'faBao_' + openID + '_' + 1;
    var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', faBaoID);
    if (null != NoticeTemplate) {
        var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
        var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
        var endStr = NoticeTemplate[tNotice.noticeEndStr];
        var content = beginStr + ' ' + roleName + ' ' + endStr;
        pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.FaBao, 0, content, utils.done);
    }

    if (!!self.owner) {
        logger.warn("OpenNew roleID:%d, soulID:%d", self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), openID);
    }
    return errorCodes.OK;
};

handler.BeginMatch = function (callback) {
    var self = this;

    var oldSoul = this.GetMaxSoulTemplate();
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var SoulTemplate = oldSoul.GetTemplate();

    var openOther = SoulTemplate[tSoul.openLevel];
    if (soulLevel < openOther) {
        callback(null, 13);
        return;
    }
    callback(null, 0);
};

handler.Accomplish = function (customID, areaWin, callback) {
    var self = this;

    if (!areaWin) {
        callback(null, {result: 0});
        return;
    }

    var oldSoul = this.GetMaxSoulTemplate();
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var SoulTemplate = oldSoul.GetTemplate();
    var openID = SoulTemplate[tSoul.openID];
    var nextSoulTemplate = templateManager.GetTemplateByID('SoulTemplate', openID);
    if (null == nextSoulTemplate) {
        callback(null, {result: errorCodes.SystemWrong});
        return;
    }
    var openCustomID = nextSoulTemplate[tSoul.openCustomID];
    var openLevel = SoulTemplate[tSoul.openLevel];
    if (soulLevel < openLevel) {
        callback(null, {result: errorCodes.Soul_Level});
        return;
    }
    if (customID != openCustomID) {
        callback(null, {result: errorCodes.NoTemplate});
        return;
    }

    var ret = self.OpenNew(true);

    if (ret != 0) {
        callback(null, {result: ret});
        return;
    }

    callback(null, {result: 0});
};

/*handler.GetSoulList = function () {
 return this.soulList;
 };*/
0

/**
 * 获取所有soul 信息
 * @return {Array}
 * */
handler.GetAllSoulInfo = function () {
    var info = [];
    var list = this.soulList;
    for (var id in list) {
        info.push(list[id].GetSoulAllInfo());
    }
    return info;
};

/**
 * 获取所有soul 信息
 * @return {Array}
 * */
handler.GetAllSoulList = function () {
    return this.soulList;
};

/**
 * 设置该玩家redis信息
 *
 * */
handler.changeRedisMsg = function () {

    var list = this.soulList;
    var keys = _.keys(this.soulList).sort();
    var sumZhanli = 0;
    var levels = [];

    for (var id in keys) {
        var soul = list[keys[id]];
        sumZhanli += soul.GetSoulZhanli();
        levels.push(soul.GetSoulInfo(eSoulInfo.LEVEL));
    }

    var roleID = this.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];
    var client = redisManager.getClient(eRedisClientType.Chart);

    var param = {forbidChart: [eForbidChartType.SOUL, eForbidChartType.ALL]};
    client.chartZadd(redisManager.getSoulSetName(), roleID, sumZhanli, param, function (err, data) {
        if (!!err) {
            logger.error('add soul total zhanle to redis: %s', utils.getErrorMessage(err));
        }
    });

    var soulInfo = {
        levels: levels,
        zhanli: sumZhanli,
        name: this.owner.playerInfo[gameConst.ePlayerInfo.NAME],
        roleID: this.owner.playerInfo[gameConst.ePlayerInfo.ROLEID]
    };

    client.hSet(redisManager.getSoulInfoSetName(), roleID, JSON.stringify(soulInfo), function (err, data) {
        if (!!err) {
            logger.error('add soul level message to redis: %s', utils.getErrorMessage(err));
        }
    });

    /** 添加 soul pvp 需要的redis 数据*/
    this.owner.buildSoulPvpToRedis();
};

handler.OpenOneSoul = function (soulID) {        //开启一个变身
    var openSoul = this.soulList[soulID];
    if (null == openSoul) {
        return;
    }
    if (openSoul.GetSoulInfo(gameConst.eSoulInfo.LEVEL) >= 1) {
        return;
    }
    openSoul.SetSoulInfo(gameConst.eSoulInfo.LEVEL, 1);
    var skillID = this.GetSoulSkill(openSoul);
    if (skillID > 0) {
        this.owner.GetSkillManager().AddSkill( skillID, gameConst.eAddSkillType.OpenNew);
    }

    /*soulInfoID = openSoul['att_0'];
     var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
     var baseZhanLi = 0;
     if (null != SoulInfoTemplate) {
     logger.info('null');
     baseZhanLi = SoulInfoTemplate[tSoulInfo.upAdd_Zhan];
     }
     logger.info('openNew baseZhanLi = ' + baseZhanLi);*/

    openSoul.SetSoulZhanli(0);


    this.SetSoulAtt(openSoul, true, true, false);
    this.SendSoulMsg(soulID);
};

handler.GMUpSoulLevel = function (tempID) { //该函数只用于gm命令
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);   //当前等级
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }
    var evolveNum = oldSoul.GetSoulInfo(eSoulInfo.EvolveNum);
    if (evolveNum == 0)
    {
        if (soulLevel >= SoulTemplate[tSoul.maxLevel] || soulLevel <= 0) {
            return errorCodes.Soul_MaxLevel;
        }
    }
    else
    {
        if (soulLevel >= SoulTemplate[tSoul.evolutionmaxLevel] || soulLevel <= 0) {
            return errorCodes.Soul_MaxLevel;
        }
    }
    var soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    if (null == SoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }
    var oldAtt_0 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0);
    var oldAtt_1 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1);
    var oldAtt_2 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2);
    soulLevel += 1;
    var nowAtt_0 = oldAtt_0 + SoulInfoTemplate[tSoulInfo.upAddNum_0];
    var nowAtt_1 = oldAtt_1 + SoulInfoTemplate[tSoulInfo.upAddNum_1];
    var nowAtt_2 = oldAtt_2 + SoulInfoTemplate[tSoulInfo.upAddNum_2];
    this.SetSoulAtt(oldSoul, false, false, false);
    soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    oldSoul.SetSoulInfo(eSoulInfo.LEVEL, soulLevel);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_0, nowAtt_0);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_1, nowAtt_1);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_2, nowAtt_2);
    oldSoul.SetSoulInfo(eSoulInfo.PROBABILITY, SoulInfoTemplate[tSoulInfo.probability]);
    var skillID = this.GetSoulSkill(oldSoul);
    if (skillID > 0) {
        this.owner.GetSkillManager().AddSkill( skillID, gameConst.eAddSkillType.UpSoulLevel);
    }
    var baseZhanLi = SoulInfoTemplate[tSoulInfo.upAdd_Zhan];
    var oldZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    this.SetSoulAtt(oldSoul, true, true, false);
    oldSoul.SetSoulZhanli(baseZhanLi + this.GetSoulSkillZhanSum(tempID));
    var newZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    this.owner.UpdateZhanli(newZhan - oldZhan, true, true);
    this.SendSoulMsg(tempID);
    /**　soul zhanli 变化时， 改变redis 相关值*/
    this.changeRedisMsg();
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SoulUpLev, tempID,
                                                 oldSoul.GetSoulInfo(eSoulInfo.LEVEL));
    //法宝达到指定级别后发送公告
    var faBaoID = 'faBao_' + tempID + '_' + oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', faBaoID);
    if (null != NoticeTemplate) {
        var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
        var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
        var endStr = NoticeTemplate[tNotice.noticeEndStr];
        var content = beginStr + ' ' + roleName + ' ' + endStr;
        pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.FaBao, 0, content, utils.done);
    }
    return errorCodes.OK;
};

handler.GetAllSoulSkillID = function () {     //获取所有变身必杀技的ID
    var skillIDList = [];
    for (var index in this.soulList) {
        var temp = this.soulList[index];
        var tempInfo = temp.soulInfo;
        var skillNum = tempInfo[eSoulInfo.SkillNum];
        var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', index);
        if (skillNum <= 0 || null == soulTemplate) {
            continue;
        }
        for (var i = 1; i <= skillNum; ++i) {
            var skillID = soulTemplate['soulSkill_' + i];
            skillIDList.push(parseInt(skillID));
        }
    }
    return skillIDList;
};

handler.GetAllSoulNormalSkillID = function () {     //获取所有变身普攻的ID
    var typeMap = {1000: 3, 1001: 4, 1002: 5, 1003: 6, 1004: 7};    //变身ID和type对应关系
    var skillIDList = [];
    for (var index in this.soulList) {
        var temp = this.soulList[index];
        var tempInfo = temp.soulInfo;
        var skillLevel = tempInfo[eSoulInfo.LEVEL];
        if (skillLevel <= 0) {
            continue;
        }
        var type = typeMap[index];
        var initSkillTemplate = templateManager.GetAllTemplate('InitSkillTemplate');
        for (var i in initSkillTemplate) {
            var skillTemp = initSkillTemplate[i];
            if (type != skillTemp['type']) {
                continue;
            }
            for (var bIndex = 0; bIndex <= 3; ++bIndex) {
                var skillID = skillTemp['skillID_' + bIndex]
                if (skillID > 0) {
                    skillIDList.push(parseInt(skillID));
                }
            }
        }
    }
    return skillIDList;
};

handler.SmeltSoulInterface = function (soulID, soulNum, tempID, smeltType, assetsManager, oldSoul, SoulInfoTemplate) {
    var self = this;
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_soulGuid = log_getGuid.GetUuid();
    var log_addTime = utilSql.DateToString(new Date());
    var log_soulType = gameConst.eSmeltSoulType.Normal;
    var log_soulArgs = [log_soulGuid, oldSoul.GetSoulInfo(eSoulInfo.RoleID), gameConst.eSoulOperType.SmeltSoul,
                        oldSoul.GetSoulInfo(eSoulInfo.LEVEL),
                        oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0), oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1),
                        oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2)];

    var log_MoneyArgs1 = [log_getGuid.GetUuid(), oldSoul.GetSoulInfo(eSoulInfo.RoleID),
                          gameConst.eMoneyChangeType.SmeltSoul,
                          log_soulGuid, soulID, assetsManager.GetAssetsValue(soulID)];

    if (smeltType == 1) {           //判断是否为强力炼魂引起的金钱变化
        var log_MoneyArgs = [log_getGuid.GetUuid(), oldSoul.GetSoulInfo(eSoulInfo.RoleID),
                             gameConst.eMoneyChangeType.SmeltSoul,
                             log_soulGuid, SoulInfoTemplate[tSoulInfo.comMoneyID],
                             assetsManager.GetAssetsValue(SoulInfoTemplate[tSoulInfo.comMoneyID])];
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (smeltType == 1) {           //强力炼魂
        var moneyID = SoulInfoTemplate[tSoulInfo.comMoneyID];
        var moneyNum = SoulInfoTemplate[tSoulInfo.comMoneyNum];
        if (assetsManager.CanConsumeAssets(moneyID, moneyNum) == false) {
            return errorCodes.NoAssets;
        }
        assetsManager.SetAssetsValue(moneyID, -moneyNum);   //强力炼魂只消耗元宝
        log_soulType = gameConst.eSmeltSoulType.Strong;
    }
    else {          //普通炼魂
//        assetsManager.SetAssetsValue(soulID, -soulNum);         //普通炼魂只消耗魂
        if (!this.AkeySoulInfo['soulNumAll']) {
            this.AkeySoulInfo['soulNumAll'] = soulNum;
        } else {
            this.AkeySoulInfo['soulNumAll'] += soulNum;
        }
    }
    var minNum = SoulInfoTemplate[tSoulInfo.minAttRandom];
    var maxNum = SoulInfoTemplate[tSoulInfo.maxAttRandom];
    var moneyNum = SoulInfoTemplate[tSoulInfo.moneyAttAdd];
    var cha = maxNum - minNum + 1;
    var result = Math.floor(Math.random() * cha) + minNum;
    if (smeltType == 1) {
        result += moneyNum;
    }
    this.SetSoulAtt(oldSoul, false, false, false);
    for (var i = 0; i < result; ++i) {
        var randNum = Math.floor(Math.random() * 3);
        var maxAttNum = SoulInfoTemplate['maxAttNum_' + randNum];
        var playerNum = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + randNum]);
        var doubleNum = SoulInfoTemplate['doubleNum_' + randNum];
        if (playerNum >= maxAttNum) {
            var temp1 = randNum + 1;
            if (temp1 >= 3) {
                temp1 = 0;
            }
            var maxAttNum1 = SoulInfoTemplate['maxAttNum_' + temp1];
            var playerNum1 = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + temp1]);
            var doubleNum1 = SoulInfoTemplate['doubleNum_' + temp1];
            if (playerNum1 >= maxAttNum1) {
                var temp2 = temp1 + 1;
                if (temp2 >= 3) {
                    temp2 = 0;
                }
                var maxAttNum2 = SoulInfoTemplate['maxAttNum_' + temp2];
                var playerNum2 = oldSoul.GetSoulInfo(eSoulInfo['ATTNUM_' + temp2]);
                var doubleNum2 = SoulInfoTemplate['doubleNum_' + temp2];
                if (playerNum2 >= maxAttNum2) {
                    break;
                }
                else {
                    var addNum = playerNum2 + doubleNum2;
                    if (addNum > maxAttNum2) {
                        addNum = maxAttNum2;
                    }
                    oldSoul.SetSoulInfo(eSoulInfo['ATTNUM_' + temp2], addNum);
                }
            }
            else {
                var addNum = playerNum1 + doubleNum1;
                if (addNum > maxAttNum1) {
                    addNum = maxAttNum1;
                }
                oldSoul.SetSoulInfo(eSoulInfo['ATTNUM_' + temp1], addNum);
            }
        }
        else {
            var addNum = playerNum + doubleNum;
            if (addNum > maxAttNum) {
                addNum = maxAttNum;
            }
            oldSoul.SetSoulInfo(eSoulInfo['ATTNUM_' + randNum], addNum);
        }
    }
    var oldZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);

    this.SetSoulAtt(oldSoul, true, false, false);

    oldSoul.SetSoulZhanli(SoulInfoTemplate[tSoulInfo.upAdd_Zhan] + this.GetSoulSkillZhanSum(tempID));
    var newZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    if (!this.AkeySoulInfo['soulZhanli']) {
        this.AkeySoulInfo['soulZhanli'] = newZhan - oldZhan;
    } else {
        this.AkeySoulInfo['soulZhanli'] += (newZhan - oldZhan);
    }
//    this.owner.UpdateZhanli(newZhan - oldZhan, true, true);
//    this.SendSoulMsg(tempID);
//    //     *　soul zhanli 变化时， 改变redis 相关值
//    this.changeRedisMsg();
//
//    this.owner.GetMissionManager().IsMissionOver(this.owner, gameConst.eMisType.SemlSoul, 0, 1);
//
//    this.owner.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.SemlSoul, 0, 1);     //判断悬赏任务是否完成

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_soulArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0));
    log_soulArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1));
    log_soulArgs.push(oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2));
    log_soulArgs.push(log_soulType);
    log_soulArgs.push(log_addTime);
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.SmeltSoul, log_soulArgs);
    //logger.info( '炼魂 数据入库成功' );

    log_MoneyArgs1.push(assetsManager.GetAssetsValue(soulID));
    log_MoneyArgs1.push(log_addTime);
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs1);
    //logger.info( '炼魂金钱变化 入库成功' );

    if (smeltType == 1) {
        log_MoneyArgs.push(assetsManager.GetAssetsValue(SoulInfoTemplate[tSoulInfo.comMoneyID]));
        log_MoneyArgs.push(log_addTime);
        log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( '强力炼魂金钱变化 入库成功' );
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};

// 进阶
handler.EvolveSoul = function (tempID) {
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }

    var soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    //logger.info('soulInfoID = ' + soulInfoID);
    var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    //logger.info(SoulInfoTemplate);
    if (null == SoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }

    //--------------------------------------------------------------------------------------------
    // 条件判断开始
    // 星级限制
    var maxLevel = SoulTemplate[tSoul.maxLevel];
    if (soulLevel < maxLevel) {
        return errorCodes.LessSoulLevel;
    }
    // 战力限制
    var needZhanli = SoulInfoTemplate[tSoulInfo.upLevel_Zhan];
    if (oldSoul.GetSoulInfo(eSoulInfo.Zhanli) < needZhanli) {
        return errorCodes.Soul_LessZhan;
    }
    // 是否已经进阶过
    var evolveNum = oldSoul.GetSoulInfo(eSoulInfo.EvolveNum);
    if (evolveNum > 0) {
        return errorCodes.SOUL_EVOLVE_ALREADY;
    }
    // 是否学满技能
    var skillNum = oldSoul.GetSoulInfo(eSoulInfo.SkillNum);
    if (skillNum < 3) {
        return errorCodes.SoulSkillLevelErr;
    }

    // 是否完成试炼管卡
    var customAccomplish = oldSoul.GetSoulInfo(eSoulInfo.Accomplish);
    if (customAccomplish == 0) {
        return errorCodes.SOUL_EVOLVE_NO_CUSTOM;
    }

    // 魂消耗判断
    var consumeSoulID = SoulTemplate[tSoul.soulType];
    var consumeSoulNum = SoulTemplate[tSoul.evolutionConsume];
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    if (!assetsManager.CanConsumeAssets(consumeSoulID, consumeSoulNum)) {
        return errorCodes.NoAssets;
    }
    // 材料消耗判断
    var consumeItemID = SoulTemplate[tSoul.evolutionID];
    var consumeItemNum = SoulTemplate[tSoul.evolutionNum];
    if (!assetsManager.CanConsumeAssets(consumeItemID, consumeItemNum)) {
        return errorCodes.NoItem;
    }

    //--------------------------------------------------------------------------------------------
    // 进阶效果
    // 升到第11星
    var oldAtt_0 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_0);
    var oldAtt_1 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_1);
    var oldAtt_2 = oldSoul.GetSoulInfo(eSoulInfo.ATTNUM_2);
    var maxAtt_0 = SoulInfoTemplate[tSoulInfo.maxAttNum_0];
    var maxAtt_1 = SoulInfoTemplate[tSoulInfo.maxAttNum_1];
    var maxAtt_2 = SoulInfoTemplate[tSoulInfo.maxAttNum_2];

    var nowZhanLi = oldSoul.GetSoulZhanli();    //邪神当前的战力

    soulLevel += 1;
    var nowAtt_0 = oldAtt_0 + SoulInfoTemplate[tSoulInfo.upAddNum_0];
    var nowAtt_1 = oldAtt_1 + SoulInfoTemplate[tSoulInfo.upAddNum_1];
    var nowAtt_2 = oldAtt_2 + SoulInfoTemplate[tSoulInfo.upAddNum_2];

    this.SetSoulAtt(oldSoul, false, false, false);

    soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    if (null == SoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }

    oldSoul.SetSoulInfo(eSoulInfo.LEVEL, soulLevel);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_0, nowAtt_0);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_1, nowAtt_1);
    oldSoul.SetSoulInfo(eSoulInfo.ATTNUM_2, nowAtt_2);
    oldSoul.SetSoulInfo(eSoulInfo.PROBABILITY, SoulInfoTemplate[tSoulInfo.probability]);
    var skillID = this.GetSoulSkill(oldSoul);
    if (skillID > 0) {
        this.owner.GetSkillManager().AddSkill( skillID, gameConst.eAddSkillType.UpSoulLevel);
    }
    assetsManager.SetAssetsMaxValue(consumeSoulID, gameConst.eAssetsInfo.ASSETS_MAXVALUE);        //最大值不设置上限


    var baseZhanLi = SoulInfoTemplate[tSoulInfo.upAdd_Zhan];
    //logger.info('baseZhanLi = ' + baseZhanLi);
    var oldZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    this.SetSoulAtt(oldSoul, true, true, false);
    oldSoul.SetSoulZhanli(baseZhanLi + this.GetSoulSkillZhanSum(tempID));
    var newZhan = oldSoul.GetSoulInfo(eSoulInfo.Zhanli);
    this.owner.UpdateZhanli(newZhan - oldZhan, true, true);
    /**　soul zhanli 变化时， 改变redis 相关值*/
    this.changeRedisMsg();
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.SoulUpLev, tempID, soulLevel);
    //法宝达到指定级别后发送公告
    var faBaoID = 'faBao_' + tempID + '_' + oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', faBaoID);
    if (null != NoticeTemplate) {
        var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
        var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
        var endStr = NoticeTemplate[tNotice.noticeEndStr];
        var content = beginStr + ' ' + roleName + ' ' + endStr;
        pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.FaBao, 0, content, utils.done);
    }

    //--------------------------------------------------------------------------------------------
    // 后续处理
    evolveNum = 1;
    oldSoul.SetSoulInfo(eSoulInfo.EvolveNum, evolveNum);
    // 消耗
    assetsManager.SetAssetsValue(consumeSoulID, -consumeSoulNum);
    assetsManager.SetAssetsValue(consumeItemID, -consumeItemNum);
    // 通知客户端
    this.SendSoulMsg(tempID);

    return errorCodes.OK;
};

handler.WakeSoul = function (tempID) {
    if (null == this.owner) {
        return errorCodes.NoRole;
    }
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    var soulLevel = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return errorCodes.NoTemplate;
    }

    var soulInfoID = SoulTemplate['att_' + ( soulLevel - 1)];
    var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
    if (null == SoulInfoTemplate) {
        return errorCodes.NoTemplate;
    }

    //--------------------------------------------------------------------------------------------
    // 条件判断开始
    // 是否进阶
    var evolveNum = oldSoul.GetSoulInfo(eSoulInfo.EvolveNum);
    if (evolveNum <= 0) {
        return errorCodes.SOUL_WAKE_NOT_EVOLVE;
    }
    // 觉醒等级
    var wakeLevel = oldSoul.GetSoulInfo(eSoulInfo.WakeLevel);
    if (wakeLevel >= 10) {
        return errorCodes.SOUL_WAKE_MAX_LEVEL;
    }
    var newWakeLevel = wakeLevel + 1;
    var wakeID = SoulTemplate["wake_" + (newWakeLevel - 1)];
    var SoulWakeTemplate = templateManager.GetTemplateByID('SoulWakeTemplate', wakeID);
    if (null == SoulWakeTemplate) {
        return errorCodes.NoTemplate;
    }
    var needSoulLevel = SoulWakeTemplate[tSoulWake.soulLevel];
    if (soulLevel < needSoulLevel) {
        return errorCodes.SOUL_WAKE_LESS_LEVEL;
    }
    // 消耗
    var consumeSoulID = SoulTemplate[tSoul.soulType];
    var consumeSoulNum = SoulWakeTemplate[tSoulWake.consumeSoul];
    var assetsManager = this.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    if (!assetsManager.CanConsumeAssets(consumeSoulID, consumeSoulNum)) {
        return errorCodes.NoAssets;
    }

    var consumeItemID = SoulWakeTemplate[tSoulWake.assetsID];
    var consumeItemNum = SoulWakeTemplate[tSoulWake.assetsNum];
    if (!assetsManager.CanConsumeAssets(consumeItemID, consumeItemNum)) {
        return errorCodes.NoItem;
    }

    //--------------------------------------------------------------------------------------------
    // 觉醒成功
    oldSoul.SetSoulInfo(eSoulInfo.WakeLevel, newWakeLevel);
    // 增加战力
    var addZhanli = SoulWakeTemplate[tSoulWake.zhanli];
    this.owner.UpdateZhanli(addZhanli, true, true);
    oldSoul.AddSoulZhanli(addZhanli);
    /**　soul zhanli 变化时， 改变redis 相关值*/
    this.changeRedisMsg();
    // 消耗
    assetsManager.SetAssetsValue(consumeSoulID, -consumeSoulNum);
    assetsManager.SetAssetsValue(consumeItemID, -consumeItemNum);
    // 通知客户端
    this.SendSoulMsg(tempID);

    return errorCodes.OK;
};

handler.GMSetWakeLevel = function(tempID, wakeLevel) {
    var oldSoul = this.soulList[tempID];
    if (null == oldSoul) {
        return errorCodes.NoSoul;
    }
    if (wakeLevel > 10) {
        wakeLevel = 10;
    }
    oldSoul.SetSoulInfo(eSoulInfo.WakeLevel, wakeLevel);
    this.SendSoulMsg(tempID);
    return errorCodes.OK;
};

handler.Update = function (nowTime) {
    if (this.isBianShen && nowTime>this.bianShenEndTime) {
        // 自动取消变身
        this.UnBianShen();
    }
};

// 重置觉醒属性
handler.ResetBianShenAttList = function () {
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        this.bianShenAttList[i] = [0, 0];
    }
    this.hasBianShenAtt = false;
};

// 计算变身属性
handler.BuildBianShenAttList = function (oldSoul, attList) {
    if (null == oldSoul) {
        return false;
    }
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return false;
    }
    var hasBianShenAtt = false;

    var wakeLevel = oldSoul.GetSoulInfo(eSoulInfo.WakeLevel);
    for (var level=0; level<wakeLevel; level++)
    {
        var wakeID = SoulTemplate["wake_" + level];
        var SoulWakeTemplate = templateManager.GetTemplateByID('SoulWakeTemplate', wakeID);
        if (null == SoulWakeTemplate) {
            return;
        }
        var attNum = SoulWakeTemplate[tSoulWake.attNum];
        for (var i=0; i<attNum; i++) {
            var att = SoulWakeTemplate["att_" + i];
            var attVal = SoulWakeTemplate["attVal_" + i];
            var attPer = SoulWakeTemplate["attPer_" + i];
            attList[att][0] += attVal;
            attList[att][1] += attPer;
        }

        if (attNum > 0) {
            hasBianShenAtt = true;
        }
    }
    return hasBianShenAtt;
};

// 计算觉醒减技能CD
handler.BuildBianShenSkillCD = function (oldSoul) {
    if (null == oldSoul) {
        return;
    }
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return;
    }
    var wakeLevel = oldSoul.GetSoulInfo(eSoulInfo.WakeLevel);
    for (var level=0; level<wakeLevel; level++)
    {
        var wakeID = SoulTemplate["wake_" + (wakeLevel-1)];
        var SoulWakeTemplate = templateManager.GetTemplateByID('SoulWakeTemplate', wakeID);
        if (null == SoulWakeTemplate) {
            return;
        }
        var skillID = SoulWakeTemplate[tSoulWake.skillID];
        var skillCD = SoulWakeTemplate[tSoulWake.skillCD];
        if (skillID != 0) {
            this.bianShenCDList[skillID] = skillCD;
        }
    }
};

//  变身
handler.BianShen = function (soulID) {
    // 如果正在变身
    if (this.isBianShen) {
        return false;
    }

    var player = this.owner;
    var oldSoul = this.GetSoul(soulID);
    if (null == player || null == oldSoul) {
        return false;
    }
    var SoulTemplate = oldSoul.GetTemplate();
    if (null == SoulTemplate) {
        return false;
    }

    // 加BUFF
    var skillSeries = this.GetSoulSkill(oldSoul);
    var attBuffID = this.GetSoulAttBuff(oldSoul);       //属性buffID
    var skillBuffID = this.GetSoulSkillBuff(oldSoul);   //变身光环buffID
    this.bianShenBuffList = player.GetSkillManager().UseSkill( skillSeries);
    if (attBuffID > 0) {
        player.GetSkillManager().AddBuff( attBuffID);
        this.bianShenBuffList.push(attBuffID);
    }
    if (skillBuffID > 0) {
        player.GetSkillManager().AddBuff( skillBuffID);
        this.bianShenBuffList.push(skillBuffID);
    }
    // 加觉醒属性
    this.ResetBianShenAttList();
    this.hasBianShenAtt = this.BuildBianShenAttList(oldSoul, this.bianShenAttList);
    if (this.hasBianShenAtt) {
        player.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, this.bianShenAttList, true, true);
    }
    // 加觉醒减CD
    this.bianShenCDList = {};
    this.BuildBianShenSkillCD(oldSoul);

    // 计算变身结束时间
    var nowTime = new Date();
    var nowSec = nowTime.getTime();
    var stillTime = this.GetBianShenStillTime(oldSoul);
    this.bianShenEndTime = nowSec + stillTime * 1000;
    this.isBianShen = true;
    return true;
};

// 取得变身后属性
handler.GetBianShenAttr = function() {
    var player = this.owner;
    var buffAtt = [];
    var bufffLevel = eAttLevel.ATTLEVEL_JICHU;
    var wakeAtt = [];
    var hasBuffAtt = false;
    var hasBianShenAtt = false;
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        buffAtt[i] = [0, 0];
        wakeAtt[i] = [0, 0];
    }

    var attInfo = new Array(eAttInfo.MAX);
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        attInfo[i] = player.attManager.GetAttValue(i);
    }

    if (!this.isBianShen) {
        var maxSoulID = this.GetMaxSoulID();
        if (maxSoulID <= 0) {
            return attInfo;
        }
        var oldSoul = this.GetSoul(maxSoulID);
        var attBuffID = this.GetSoulAttBuff(oldSoul);
        var BuffTemplate = templateManager.GetTemplateByID('BuffTemplate', attBuffID);
        var beginID = BuffTemplate[tBuff.beginAction];       //添加buff马上出发的行为
        bufffLevel = BuffTemplate[tBuff.buffLevel];      //buff的等级

        // 加变身后buff属性

        if (beginID > 0) {
            var actionList = templateManager.GetTemplateByID('BuffActionListTemplate', beginID);
            if (actionList) {
                var actionNum = actionList['actionNum'];
                for (var i = 0; i < actionNum; ++i) {
                    var actionID = actionList['action_' + i];
                    var action = templateManager.GetTemplateByID('BuffActionTemplate', actionID);
                    if (action) {
                        var actType = action[tBuffAction.actType];        //行为类型
                        var attType = action[tBuffAction.attType];        //属性类型
                        var change = action[tBuffAction.change];          //改变的百分比
                        var changeNum = action[tBuffAction.changeNum];   //改变的数值
                        if (actType == 1) {     //行为类型为效果
                            buffAtt[attType][0] += changeNum;
                            buffAtt[attType][1] += change;
                        }
                    }
                }
                player.UpdateAtt(bufffLevel,  buffAtt, true, false);
                hasBuffAtt = true;
            }
        }

        // 加觉醒属性
        hasBianShenAtt = this.BuildBianShenAttList(oldSoul, wakeAtt);
        if (hasBianShenAtt) {
            player.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, wakeAtt, true);
        }
    }

    for (var i = 0; i < eAttInfo.MAX; ++i) {
        attInfo[i] = player.attManager.GetAttValue(i);
    }

    // 减变身BUFF属性
    if (hasBuffAtt) {
        player.UpdateAtt(bufffLevel,  buffAtt, false);
    }

    // 减觉醒属性
    if (hasBianShenAtt) {
        player.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, wakeAtt, false);
    }

    return attInfo;
};

// 取消变身
handler.UnBianShen = function () {
    if (!this.isBianShen) {
        return;
    }
    this.isBianShen = false;
    this.bianShenEndTime = 0;
    var player = this.owner;
    if (null == player) {
        return;
    }
    // 删BUFF
    if (this.bianShenBuffList.length > 0) {
        player.GetSkillManager().DelBuff( this.bianShenBuffList);
        this.bianShenBuffList = [];
    }
    // 减觉醒属性
    if (this.hasBianShenAtt) {
        player.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, this.bianShenAttList, false, true);
        this.hasBianShenAtt = false;
    }
    // 清除觉醒减CD
    this.bianShenCDList = {};
};

// 获得变身时间
handler.GetBianShenStillTime = function (soul) {    //获取变身的光环buff
    if (null == soul) {
        return 0;
    }
    var SoulTemplate = soul.GetTemplate();
    if (null == SoulTemplate) {
        return 0;
    }
    var level = soul.GetSoulInfo(eSoulInfo.LEVEL);
    var wakeLevel = soul.GetSoulInfo(eSoulInfo.WakeLevel);
    var stillTime = 0;
    if (level > 0) {
        var attID = SoulTemplate['att_' + ( level - 1 )];
        var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', attID);
        if (null != SoulInfoTemplate) {
            stillTime = SoulInfoTemplate[tSoulInfo.stillTime];
        }
    }
    for (var i=0; i<wakeLevel; i++) {
        var wakeID = SoulTemplate['wake_' + i];
        var SoulWakeTemplate = templateManager.GetTemplateByID('SoulWakeTemplate', wakeID);
        if (null != SoulWakeTemplate) {
            stillTime += SoulWakeTemplate[tSoulWake.mergeTimeAdd];
        }
    }
    return stillTime;
};

// 邪神进阶试炼完成
handler.AccomplishEvolve = function (customID, areaWin, callback) {
    if (!areaWin) {
        callback(null, {result: 0});
        return;
    }
    var oldSoul = this.GetSoulByEvolveCustomID(customID);
    if (!oldSoul) {
        callback(null, {result: errorCodes.NoSoul});
        return;
    }
    var SoulTemplate = oldSoul.GetTemplate();
    if (!SoulTemplate) {
        callback(null, {result: errorCodes.NoTemplate});
        return;
    }
    var level = oldSoul.GetSoulInfo(eSoulInfo.LEVEL);
    if (level < SoulTemplate.maxLevel) {
        callback(null, {result: errorCodes.LessSoulLevel});
        return;
    }

    var accomplish = 1;
    oldSoul.SetSoulInfo(eSoulInfo.Accomplish, accomplish);
    var tempID = oldSoul.GetSoulInfo(eSoulInfo.TEMPID);
    this.SendSoulMsg(tempID);

    callback(null, {result: 0});
};

handler.GMAccomplishEvolve = function(tempID, accomplish) {
    var oldSoul = this.GetSoul(tempID);
    if (null == oldSoul) {
        return;
    }
    oldSoul.SetSoulInfo(eSoulInfo.Accomplish, accomplish);
    this.SendSoulMsg(tempID);
};

handler.GetWakeSkillCD = function (skillID) {
    if (skillID in this.bianShenCDList) {
        return this.bianShenCDList[skillID];
    }
    return 0;
};
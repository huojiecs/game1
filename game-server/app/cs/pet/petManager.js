/**
 * Created by CUILIN on 15-1-13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Pet = require('./pet');
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var globalFunction = require('../../tools/globalFunction');
var _ = require('underscore');
var defaultValues = require('../../tools/defaultValues');
var utilSql = require('../../tools/mysql/utilSql');
var cityManager = require('../majorCity/cityManager');

var ePetInfo = gameConst.ePetInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var ePetStatus = gameConst.ePetStatus;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAttLevel = gameConst.eAttLevel;
var eAttInfo = gameConst.eAttInfo;
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;


module.exports = function(owner) {
    return new Handler(owner);
};

var Handler = function(owner) {
    this.owner = owner;
    this.AddZhanli = 0;
    this.AddPoint = 0;
    this.petList = {};
    this.StatusList = {};
};

var handler = Handler.prototype;

handler.LoadDataByDB = function(petList) {

    this.AddPoint = 0;
    for(var i in petList) {
        var petID = petList[i][ePetInfo.petID];
        var opt = {
            'level': petList[i][ePetInfo.level],
            'exp': petList[i][ePetInfo.exp],
            'grade': petList[i][ePetInfo.grade],
            'skillList': JSON.parse(petList[i][ePetInfo.skillList]),
            'status': petList[i][ePetInfo.status]
        };
        if(opt.status != ePetStatus.rest) {
            if(opt.status in this.StatusList) {
                logger.error('pet status matching repeat, petID = %d, status = %d', petID, opt.status);
                opt.status = ePetStatus.rest;
            } else {
                this.StatusList[opt.status] = petID;
            }
        }
        var pet = new Pet(petID, opt);
        this.petList[petID] = pet;
    }
    this.CalcPlayerAttAndZhanli(false);
    this.RefreshPoint(false);
};

handler.GetSqlStr = function(roleID) {
    var petList = [];
    for(var i in this.petList) {
        var temp = [
            roleID,
            this.petList[i].petID,
            this.petList[i].zhanli,
            this.petList[i].level,
            this.petList[i].exp,
            this.petList[i].grade,
            JSON.stringify(this.petList[i].skillList),
            this.petList[i].status
        ];
        petList.push(temp);
    }
    return petList;
};

handler.GetAttSqlStr = function(roleID) {
    var rows = [];
    for(var i in this.petList) {
        var pet = this.petList[i];
        var row = [roleID, pet.petID];
        var dataStr = '(' + roleID + ',' + pet.petID + ',';
        for (var index in pet.GetPetAttManager().attList) {
            var value = pet.GetPetAttManager().GetAttFinalValue(index);
            dataStr += value + ',';

            row.push(value);
        }
        dataStr = dataStr.substring(0, dataStr.length - 1);
        dataStr += ')';

        rows.push(row);
    }

    var sqlString = utilSql.BuildSqlValues(rows);


    return sqlString;
};

handler.SendPetMsg = function(petID) {
    var player = this.owner;
    if(null == player) {
        logger.error('SendPetMsg player is null');
        return;
    }
    var route = 'ServerPetUpdate';
    var PetMsg = {
        'petList': [],
        'AddZhanli' : this.AddZhanli,
        'AddPoint' : this.AddPoint
    };

    if(null == petID) {
        for(var i in this.petList) {
            var tempPet = {
                'petID': this.petList[i].petID,
                'level': this.petList[i].level,
                'exp': this.petList[i].exp,
                'grade': this.petList[i].grade,
                'zhanli': this.petList[i].zhanli,
                'skillList': this.petList[i].skillList,
                'status': this.petList[i].status,
                'attList': this.petList[i].GetPetAttManager().GetAllAtt()
            };
            PetMsg.petList.push(tempPet);
        }
    } else {
        if(petID in this.petList) {
            var tempPet = {
                'petID': petID,
                'level': this.petList[petID].level,
                'exp': this.petList[petID].exp,
                'grade': this.petList[petID].grade,
                'zhanli': this.petList[petID].zhanli,
                'skillList': this.petList[petID].skillList,
                'status': this.petList[petID].status,
                'attList': this.petList[petID].GetPetAttManager().GetAllAtt()
            };
            PetMsg.petList.push(tempPet);
        }
    }

    player.SendMessage(route, PetMsg);
};

// 刷新积分和给角色增加色属性
handler.RefreshPoint = function(isSend) {
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');
    if(allTemplate == null){
        return;
    }
    this.AddPoint = 0;
    for(var petID in this.petList){
        var pet = this.petList[petID];
        var grade = pet.grade;
        this.AddPoint += (+allTemplate[216 + (grade - 1)]['attnum']);
    }
    this.AddZhanli = 0;
    var PetScoreTemplate = templateManager.GetAllTemplate('PetScoreTemplate')
    if(PetScoreTemplate == null){
        return;
    }

    var attManager = this.owner.GetAttManager();
    var oldZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_PET_POINT);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    /**清除原来套装属性加成*/
    attManager.clearLevelAtt(eAttLevel.ATTLEVEL_PET_POINT, eAttInfo.MAX);
    attManager.clearZhanli(eAttLevel.ATTLEVEL_PET_POINT);

    for(var attID in PetScoreTemplate){
        var scoreTemplate = PetScoreTemplate[attID];
        if(scoreTemplate == null || scoreTemplate['scorePet'] > this.AddPoint){
            continue;
        }

        attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_PET_POINT, scoreTemplate['att_0'], scoreTemplate['attNum_0']);
    }

    /** 重算玩家所有属性*/
    attManager.UpdateAtt();
    attManager.computeZhanli(eAttLevel.ATTLEVEL_PET_POINT);
    /** 重新获取战力*/
    var newZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_PET_POINT);
    this.AddZhanli = newZhanli;
    /**发布战力更新*/
    this.owner.UpdateZhanli(Math.abs(Math.floor((newZhanli - oldZhanli))), (newZhanli - oldZhanli) > 0 ? true : false, isSend);
    /**通知客户属性变更*/
    attManager.SendAttMsgToOther(null, eAttLevel.ATTLEVEL_PET_POINT);
    attManager.SendAttMsg(null);
};

handler.GetFightPetInfo = function() {
    if(defaultValues.IsPetOpening) {
        var petID = this.StatusList[ePetStatus.fight];
        if(petID && this.petList[petID]) {
            var fightPet = {
                'petID': petID,
                'level': this.petList[petID].level,
                'exp': this.petList[petID].exp,
                'grade': this.petList[petID].grade,
                'zhanli': this.petList[petID].zhanli,
                'skillList': this.petList[petID].skillList,
                'status': this.petList[petID].status,
                'attList': this.petList[petID].GetPetAttManager().GetAllAtt()
            };
            return [fightPet];
        }
        return [];
    } else {
        return [];
    }
};

handler.GetCarryPetInfo = function() {
    var petList = [];
    if(defaultValues.IsPetOpening) {
        for(var i = ePetStatus.spirit_1; i <= ePetStatus.fight; i++) {
            var petID = this.StatusList[i];
            if(petID && this.petList[petID]) {
                var pet = {
                    'petID': petID,
                    'level': this.petList[petID].level,
                    'exp': this.petList[petID].exp,
                    'grade': this.petList[petID].grade,
                    'zhanli': this.petList[petID].zhanli,
                    'skillList': this.petList[petID].skillList,
                    'status': this.petList[petID].status,
                    'attList': this.petList[petID].GetPetAttManager().GetAllAtt()
                };
                petList.push(pet);
            }
        }
   }
   return petList;
};

// 召唤宠物
handler.CreatePet = function(petID, type) {
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', petID);
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');
    if(null == petTemplate || null == allTemplate) {
        logger.error('Template is null! ' + utils.getFilenameLine());
        return errorCodes.SystemWrong;
    }
    if(petID in this.petList) {
        logger.error('this pet is already in your pocket, petID = %d, roleID = %j', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.Pet_Repeat;
    }
    var assetsManager = this.owner.GetAssetsManager();
    var grade = petTemplate['initColor'];
    var assetsNum = allTemplate[138 + (grade - 1)]['attnum'];
    var assetsID = petTemplate['consumeID'];
    var generalID = globalFunction.GetPetGeneralFragID();
    var myAssetsNum = assetsManager.GetAssetsValue(assetsID);
    if(myAssetsNum == null){
        myAssetsNum = 0;
    }
    var myGeneral = assetsManager.GetAssetsValue(generalID);
    if(myGeneral == null){
        myGeneral = 0;
    }
    var generalNum = allTemplate[211 + (grade - 1)]['attnum'] < myGeneral ? allTemplate[211 + (grade - 1)]['attnum'] : myGeneral;

    if(myAssetsNum + generalNum < assetsNum){
        return errorCodes.Pet_No_Assets;
    }

    if(type){
        if(generalNum >= assetsNum){
            assetsManager.AlterAssetsValue(generalID, -assetsNum, eAssetsReduce.CreatePet);
        }else{
            assetsManager.AlterAssetsValue(generalID, -generalNum, eAssetsReduce.CreatePet);
            assetsManager.AlterAssetsValue(assetsID, -(assetsNum - generalNum), eAssetsReduce.CreatePet);
        }
    }else{
        if(myAssetsNum >= assetsNum){
            assetsManager.AlterAssetsValue(assetsID, -assetsNum, eAssetsReduce.CreatePet);
        }else{
            assetsManager.AlterAssetsValue(assetsID, -myAssetsNum, eAssetsReduce.CreatePet);
            assetsManager.AlterAssetsValue(generalID, -(assetsNum - myAssetsNum), eAssetsReduce.CreatePet);
        }
    }

    var pet = new Pet(petID);
    this.petList[petID] = pet;
    this.RefreshPoint(true);
    this.SendPetMsg(petID);

    return errorCodes.OK;
};

handler.ToFight = function(petID) {
    var pet = this.petList[petID];
    if(null == pet) {
        logger.error('do not have this pet, petID = %d, roleID = %d', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.No_Pet;
    }
    var oldPetID = this.StatusList[ePetStatus.fight];
    if(oldPetID) {
        var oldPet = this.petList[oldPetID];
        oldPet.status = ePetStatus.rest;
    }
    pet.status = ePetStatus.fight;
    this.StatusList[ePetStatus.fight] = petID;
    this.CalcPlayerAttAndZhanli(true);
    this.SendPetMsg();
    this.UpdateAoi();

    return errorCodes.OK;
};

handler.CancelFight = function() {
    var oldPetID = this.StatusList[ePetStatus.fight];
    if(!oldPetID) {
        return errorCodes.Pet_No_Fight;
    }
    var oldPet = this.petList[oldPetID];
    oldPet.status = ePetStatus.rest;
    delete this.StatusList[ePetStatus.fight];
    this.CalcPlayerAttAndZhanli(true);
    this.SendPetMsg();
    this.UpdateAoi();

    return errorCodes.OK;
};

handler.ToSpirit = function(petID, field) {
    if(!_.contains([ePetStatus.spirit_1,
                    ePetStatus.spirit_2,
                    ePetStatus.spirit_3,
                    ePetStatus.spirit_4], +field)) {
        return errorCodes.Pet_Spirit_Wrong_Field;
    }
    var pet = this.petList[petID];
    if(null == pet) {
        logger.error('do not have this pet, petID = %d, roleID = %d', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.No_Pet;
    }
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');

    if(expLevel < allTemplate[143 + (field - 1)]['attnum']) {
        return errorCodes.Pet_Spirit_Level;
    }
    var oldPetID = this.StatusList[field];
    if(oldPetID) {
        var oldPet = this.petList[oldPetID];
        oldPet.status = ePetStatus.rest;
    }
    pet.status = field;
    this.StatusList[field] = petID;
    this.CalcPlayerAttAndZhanli(true);
    this.SendPetMsg();

    return errorCodes.OK;
};

handler.CancelSpirit = function(field) {
    if(!_.contains([ePetStatus.spirit_1,
                    ePetStatus.spirit_2,
                    ePetStatus.spirit_3,
                    ePetStatus.spirit_4], +field)) {
        return errorCodes.Pet_Spirit_Wrong_Field;
    }
    var oldPetID = this.StatusList[field];
    if(!oldPetID) {
        return errorCodes.Pet_No_Spirit;
    }
    var oldPet = this.petList[oldPetID];
    oldPet.status = ePetStatus.rest;
    delete this.StatusList[field];
    this.CalcPlayerAttAndZhanli(true);
    this.SendPetMsg();

    return errorCodes.OK;
};

/**
 * @param: type 喂食种类[1,2,3] 对应财产 [1601,1602,1603]
 * */
handler.PetAddExp = function(petID, type, num) {
    // 防止客户端没有穿num， 导致num为null，而引起计算的exp为null，
    // 最后导致存库失败， 宠物删除
    if(!num) {
        num = 1;
    }
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', petID);
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');
    if(null == petTemplate || null == allTemplate) {
        logger.error('Template is null! petID = %j ' + utils.getFilenameLine(), petID);
        return errorCodes.SystemWrong;
    }
    var foodID = 1600 + type;
    var pet = this.petList[petID];
    if(null == pet) {
        logger.error('do not have this pet, petID = %d, roleID = %j', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.No_Pet;
    }
    var playerLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    if(pet.level >= playerLevel) {
        return errorCodes.Pet_Level_Limit;
    }
    // 先计算下可以升到多少级
    var foodValue = allTemplate[156 + (type - 1)]['attnum'];
    var tempLevel = pet.level;
    var tempExp = pet.exp + foodValue * num;

    for(;;) {
        var attTempID = petTemplate['attTempID'] * 1000 + tempLevel;
        var petAttTemplate = templateManager.GetTemplateByID('PetAttTemplate', attTempID);
        if(null == petAttTemplate) {
            logger.error('petAttTemplate is null, level = %d', pet.level);
            return errorCodes.SystemWrong;
        }
        var nextLevelExp = petAttTemplate['exp'];
        if(petAttTemplate['nextID'] == 0 || tempLevel >= playerLevel) {
            // 如果药丸数量冒了，需要返还 //////////
            num -= Math.floor(tempExp / foodValue);
            //////////////////////////////////////
            tempExp = 0;
            break;
        } else {
            if(tempExp >= nextLevelExp) {
                tempLevel++;
                tempExp -= nextLevelExp;
                continue;
            } else {
                break;
            }
        }
    }
    var assetsManager = this.owner.GetAssetsManager();
    if (assetsManager.CanConsumeAssets(foodID, num) == false) {
        return errorCodes.Pet_No_Food;
    }
    assetsManager.AlterAssetsValue(foodID, -num, eAssetsReduce.FeedPet);

    if(tempLevel > pet.level) { // 升级
        if(tempLevel > playerLevel) {
            // 当宠物等级达到玩家等级时，卡0%经验
            var priorAttTemplate = templateManager.GetTemplateByID('PetAttTemplate', playerLevel - 1);
            pet.level = playerLevel;
            pet.exp = priorAttTemplate['exp'];
        } else {
            pet.level = tempLevel;
            pet.exp = tempExp;
        }
        pet.Update();
        if(utils.mapContains(this.StatusList, petID) != null) {
            this.CalcPlayerAttAndZhanli(true);
        }
    } else {
        pet.level = tempLevel;
        pet.exp = tempExp;
    }
    this.SendPetMsg(petID);

    return errorCodes.OK;
};

handler.GradeLevelUp = function(petID, grade, type) {
    var pet = this.petList[petID];
    if(null == pet) {
        logger.error('do not have this pet, petID = %d, roleID = %j', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.No_Pet;
    }
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', petID);
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');
    if(null == petTemplate || null == allTemplate) {
        logger.error('template is null! petID = %j ' + utils.getFilenameLine(), petID);
        return errorCodes.SystemWrong;
    }
    if(pet.grade >= petTemplate['maxColor']) {
        return errorCodes.Pet_Max_Grade;
    }
    if(grade != pet.grade + 1) {
        return errorCodes.Pet_Wrong_Grade;
    }
    var assetsManager = this.owner.GetAssetsManager();

    var assetsNum = allTemplate[138 + (grade - 1)]['attnum'];
    var assetsID = petTemplate['consumeID'];
    var generalID = globalFunction.GetPetGeneralFragID();
    var myAssetsNum = assetsManager.GetAssetsValue(assetsID);
    if(myAssetsNum == null){
        myAssetsNum = 0;
    }
    var myGeneral = assetsManager.GetAssetsValue(generalID);
    if(myGeneral == null){
        myGeneral = 0;
    }
    var generalNum = allTemplate[211 + (grade - 1)]['attnum'] < myGeneral ? allTemplate[211 + (grade - 1)]['attnum'] : myGeneral;

    if(myAssetsNum + generalNum < assetsNum){
        return errorCodes.Pet_No_Assets;
    }

    if(type){
        if(generalNum >= assetsNum){
            assetsManager.AlterAssetsValue(generalID, -assetsNum, eAssetsReduce.PetGradeUp);
        }else{
            assetsManager.AlterAssetsValue(generalID, -generalNum, eAssetsReduce.PetGradeUp);
            assetsManager.AlterAssetsValue(assetsID, -(assetsNum - generalNum), eAssetsReduce.PetGradeUp);
        }
    }else{
        if(myAssetsNum >= assetsNum){
            assetsManager.AlterAssetsValue(assetsID, -assetsNum, eAssetsReduce.PetGradeUp);
        }else{
            assetsManager.AlterAssetsValue(assetsID, -myAssetsNum, eAssetsReduce.PetGradeUp);
            assetsManager.AlterAssetsValue(generalID, -(assetsNum - myAssetsNum), eAssetsReduce.PetGradeUp);
        }
    }

    pet.grade = grade;
    pet.Update();

    if(utils.mapContains(this.StatusList, petID) != null) {
        this.CalcPlayerAttAndZhanli(true);
    }
    this.RefreshPoint(true);
    this.SendPetMsg(petID);

    return errorCodes.OK;
};

handler.UnlockSkill = function(petID, skillGrade) {
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', petID);
    if(null == allTemplate || null == petTemplate) {
        logger.error('Template is null! petID = %j ' + utils.getFilenameLine(), petID);
        return errorCodes.SystemWrong;
    }
    var pet = this.petList[petID];
    if(null == pet) {
        logger.error('do not have this pet, petID = %d, roleID = %j', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.No_Pet;
    }
    if((skillGrade - 1) in pet.skillList) {
        return errorCodes.Pet_Skill_Repeat;
    }
    if(skillGrade == 1) {
        logger.error('there are something wrong with pet skillList, petID = %d, roleID = %j',
                     petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.Pet_Wrong_Skill;
    }
    if(!((skillGrade - 2) in pet.skillList)) {
        return errorCodes.Pet_Prior_Skill;
    }

    var assetsID = 1604;
    var assetsNum = allTemplate[151 + (skillGrade - 1)]['attnum'];
    var assetsManager = this.owner.GetAssetsManager();
    if (assetsManager.CanConsumeAssets(assetsID, assetsNum) == false) {
        return errorCodes.Pet_No_Assets;
    }
    assetsManager.AlterAssetsValue(assetsID, -assetsNum, eAssetsReduce.PetUnlockSkill);
    pet.skillList[skillGrade - 1] = petTemplate['colorSkill_' + (skillGrade - 1)] * 1000 + 1;
    pet.Update();

    if(utils.mapContains(this.StatusList, petID) != null) {
        this.CalcPlayerAttAndZhanli(true);
    }
    this.SendPetMsg(petID);

    return errorCodes.OK;
};

handler.SkillLevelUp = function(petID, skillGrade, skillID) {
    var pet = this.petList[petID];
    if(null == pet) {
        logger.error('do not have this pet, petID = %d, roleID = %j', petID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        return errorCodes.No_Pet;
    }
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', petID);
    if(null == petTemplate) {
        logger.error('pettemplate is null! petID = %j ' + utils.getFilenameLine(), petID);
        return errorCodes.SystemWrong;
    }
    if(Math.floor(skillID / 1000) != petTemplate['colorSkill_' + (skillGrade - 1)]) {
        return errorCodes.Pet_Incorrect_SkillGrade;
    }
    if(!(skillGrade - 1) in pet.skillList) {
        return errorCodes.Pet_Skill_Locked;
    }
    var nowSkillTemplate = templateManager.GetTemplateByID('PetSkillTemplate', pet.skillList[skillGrade - 1]);
    if(null == nowSkillTemplate) {
        logger.error('petskilltemplate is null! skillID = %j ' + utils.getFilenameLine(), pet.skillList[skillGrade - 1]);
        return errorCodes.SystemWrong;
    }
    if(nowSkillTemplate['nextID'] == 0) {
        return errorCodes.Pet_Skill_Max;
    }
    if(nowSkillTemplate['nextID'] != skillID) {
        logger.error('skillID is not echo next ID %j %j ', skillID, nowSkillTemplate['nextID']);
        skillID = nowSkillTemplate['nextID'];
    }

    var nextSkillTemplate = templateManager.GetTemplateByID('PetSkillTemplate', skillID);
    if(null == nextSkillTemplate) {
        logger.error('template is null! skillID = %j ' + utils.getFilenameLine(), skillID);
        return errorCodes.SystemWrong;
    }
    var needLevel = nextSkillTemplate['needLevel'];
    if(pet.level < needLevel) {
        return errorCodes.Pet_Low_Level;
    }
    var assetsID = nextSkillTemplate['consumeID'];
    var assetsNum = nextSkillTemplate['consumeNum'];
    var assetsManager = this.owner.GetAssetsManager();
    if (assetsManager.CanConsumeAssets(assetsID, assetsNum) == false) {
        return errorCodes.Pet_No_Assets;
    }
    assetsManager.AlterAssetsValue(assetsID, -assetsNum, eAssetsReduce.PetLevelUpSkill);

    pet.skillList[skillGrade - 1] = skillID;
    pet.Update();

    if(utils.mapContains(this.StatusList, petID) != null) {
        this.CalcPlayerAttAndZhanli(true);
    }
    this.SendPetMsg(petID);

    return errorCodes.OK;
};

handler.CalcPlayerAttAndZhanli = function (isSend) {
    /** 属性管理器*/
    var attManager = this.owner.attManager;
    /** 获取原来战力 */
    var oldZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_PET);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    /**清除原来套装属性加成*/
    attManager.clearLevelAtt(eAttLevel.ATTLEVEL_PET, eAttInfo.MAX);
    attManager.clearZhanli(eAttLevel.ATTLEVEL_PET);
    /** 宠物附加加成 */
    for(var index in this.StatusList) {
        if(!_.contains([ePetStatus.spirit_1,
                        ePetStatus.spirit_2,
                        ePetStatus.spirit_3,
                        ePetStatus.spirit_4,
                        ePetStatus.fight], +index)) {
            continue;
        }
        var petID = this.StatusList[index];
        if(null == petID) {
            logger.error('petID in statusList is null, index = %d, roleID = %d', index, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
            continue;
        }
        this.addPetAddition(attManager, petID, index);
    }

    /** 重算玩家所有属性*/
    attManager.UpdateAtt();
    /** 重算玩家号称战力*/
//    attManager.computeZhanli(eAttLevel.ATTLEVEL_TITLE, MAX_ATT);
    /** 重新获取战力*/
    var newZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_PET);
    /**发布战力更新*/
    this.owner.UpdateZhanli(Math.abs(Math.floor((newZhanli - oldZhanli))), (newZhanli - oldZhanli) > 0 ? true : false, isSend);
    /**通知客户属性变更*/
    this.owner.attManager.SendAttMsg(null);
};

handler.addPetAddition = function(attManager, petID, type) {
    var pet = this.petList[petID];
    if(pet == null){
        return;
    }
    var zhanli = 0;
    if(type == ePetStatus.fight) { // 出战
        zhanli = pet.zhanli;
    } else { // 附身
        zhanli = Math.floor(pet.zhanli * 0.1);
        var mainAtt = [0,1,4,6];
        for(var attIndex in mainAtt) {
            var petAttValue = this.petList[petID].GetPetAttManager().GetAttFinalValue(mainAtt[attIndex]);
            var addValue = Math.floor(petAttValue * 0.1);
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_PET, mainAtt[attIndex], addValue);
        }

        for(var index in pet.skillList) {
            var skillID = pet.skillList[index];
            var petSkillTemplate = templateManager.GetTemplateByID('PetSkillTemplate', skillID);
            if(!petSkillTemplate) {
                logger.error('PetSkillTemplate is null, attID = %d', pet.skillList[index]);
                return;
            }
            //宠物被动技能，增加玩家属性
            for(var j = 0; j < petSkillTemplate['playAttNum']; j++) {
                var att = petSkillTemplate['playAtt_' + j];
                var attNum = petSkillTemplate['playNum_' + j];
                //var coefficient = petSkillTemplate['playReduce_' + j];
                /** 添加属性加成 */
                attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_PET, att, attNum);
            }
        }
    }
    /** 添加假战力*/
    attManager.addZhanli(eAttLevel.ATTLEVEL_PET, zhanli);
};

handler.UpdateAoi = function() {
    var posState = this.owner.GetWorldState(eWorldState.PosState);
    var customID = this.owner.GetWorldState(eWorldState.CustomID);
    var tempCustom = null;
    if (posState == ePosState.Hull) {
        tempCustom = cityManager.GetCity(customID);
        tempCustom.SendFightPet(this.owner);
    }
};

// 分解宠物
handler.ResolvePet = function(petID, next) {
    var pet = this.petList[petID];
    if(pet == null){
        return next(null, {'result': errorCodes.No_Pet});
    }

    if(pet.grade < 4){
        return next(null, {'result': errorCodes.Pet_Resolve_Grade});
    }

    if(pet.status == ePetStatus.fight){
        return next(null, {'result': errorCodes.Pet_Resolve_Fight});
    }

    var allTempID = pet.grade == 4 ? 209 : 210;
    var fragNum = templateManager.GetTemplateByID('AllTemplate', allTempID);
    if(fragNum == null){
        return next(null, {'result': errorCodes.NoTemplate});
    }

    delete this.petList[petID];
    for(var opt in this.StatusList) {
        if(this.StatusList[opt] == petID){
            this.StatusList[opt] = 0;
        }
    }
    this.owner.GetAssetsManager().AlterAssetsValue(globalFunction.GetPetGeneralFragID(), +fragNum['attnum'], eAssetsAdd.PetResolve);
    this.RefreshPoint(true);
    this.SendPetMsg(petID);

    return  next(null,{
            'result': errorCodes.OK,
            'petID' : petID,
            'fragNum' : fragNum
    });
};


// 万能碎片兑换
handler.PetFragExchange = function(petID, fragNum, next) {
    var pet = this.petList[petID];
    if(pet == null){
        return next(null, {'result': errorCodes.No_Pet});
    }

    var petTemplate = templateManager.GetTemplateByID('PetTemplate', pet.petID);
    if(petTemplate == null){
        return next(null, {'result': errorCodes.NoTemplate});
    }

    if(pet.grade < petTemplate['maxColor']){
        return next(null, {'result': errorCodes.Pet_Exchange_Grade});
    }

    var allNum = templateManager.GetTemplateByID('AllTemplate', 230);
    if(allNum == null){
        return next(null, {'result': errorCodes.NoTemplate});
    }

    var needFrag = +allNum['attnum'] * fragNum;
    var myFrag = this.owner.GetAssetsManager().GetAssetsValue(petTemplate['consumeID']);
    if(myFrag == null || myFrag <= 0){
        return next(null, {'result': errorCodes.Pet_No_Assets});
    }

    if(myFrag < needFrag){
        return next(null, {'result': errorCodes.Pet_No_Assets});
    }

    this.owner.GetAssetsManager().AlterAssetsValue(petTemplate['consumeID'], -needFrag , eAssetsReduce.FragExchange);
    this.owner.GetAssetsManager().AlterAssetsValue(globalFunction.GetPetGeneralFragID(), fragNum , eAssetsAdd.FragExchange);

    return  next(null,{
        'result': errorCodes.OK
    });
};
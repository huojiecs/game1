/**
 * Created by CUILIN on 15-1-13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../tools/templateManager');
var gameConst = require('../../tools/constValue');
var _ = require('underscore');
var PetAttManager = require('./petAttManager');

var eAttFactor = gameConst.eAttFactor;
var ePetStatus = gameConst.ePetStatus;
var ePetAttLevel = gameConst.ePetAttLevel;
var ePetZhanliLevel = gameConst.ePetZhanliLevel;

module.exports = function(petID, opt) {
    return new Handler(petID, opt);
};

var Handler = function(petID, opt) {
    this.Init(petID, opt)
};

var handler = Handler.prototype;

handler.Init = function(petID, opt) {
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', petID);
    if(null == petTemplate) {
        logger.error('PetTemplate is null!');
        return;
    }
    this.petID = petID;
    this.zhanli = 0;
    if(opt == null) {
        this.level = 1;
        this.exp = 0;
        this.grade = petTemplate['initColor'];
        this.skillList = [petTemplate['colorSkill_0'] * 1000 + 1];
        this.status = ePetStatus.rest;
    } else {
        this.level = opt.level;
        this.exp = opt.exp;
        this.grade = opt.grade;
        this.skillList = opt.skillList;
        this.status = opt.status;
    }
    this.attTempID = petTemplate['attTempID'] * 1000 + this.level;
    this.petAttManager = new PetAttManager(this.attTempID);

    this.CheckPetSkill();
    this.UpdateAtt();
    this.UpdateZhanli();
};

handler.GetPetAttManager = function() {
    return this.petAttManager;
};

/**
 * 技能在服务器中无太多信息，只是记录一下给客户端用
 * 所以用了比较简单的数据结构，存放的形式比较简单，所以在这里check一下
 * */
handler.CheckPetSkill = function() {
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', this.petID);
    if(null == petTemplate) {
        logger.error('PetTemplate is null!');
        return;
    }

    if(_.isEmpty(this.skillList)) {
        this.skillList = [petTemplate['colorSkill_0'] * 1000 + 1];
    }
    if(this.skillList.length > this.grade) {
        this.skillList.splice(this.grade, this.skillList.length - this.grade);
    }
    for(var i in this.skillList) {
        if(Math.floor(this.skillList[i] / 1000) != petTemplate['colorSkill_' + i]) {
            logger.error('pet skill match error, skillTempID = %j, skillID = %j', petTemplate['colorSkill_' + i], this.skillList[i]);
            this.skillList[i] = petTemplate['colorSkill_' + i] * 1000 + (this.skillList[i] % 1000);
            if(this.skillList[i] % 1000 == 0) {
                this.skillList[i]++;
            }
        }
    }
};

handler.UpdateAtt = function() {
    var mainAtt = [0,1,4,6];
    for(var i in mainAtt) {
        this.petAttManager.UpdateEndCoefficient(mainAtt[i], 5 * this.grade, 1);
    }

    for(var i in this.skillList) {
        var skillID = this.skillList[i];
        var petSkillTemplate = templateManager.GetTemplateByID('PetSkillTemplate', skillID);
        if(!petSkillTemplate) {
            logger.error('UpdateAtt PetSkillTemplate is null, attID = %j', skillID);
            return;
        }
        //被动技能，增加宠物自身属性
        for(var j = 0; j < petSkillTemplate['attNum']; j++) {
            var att = petSkillTemplate['att_' + j];
            var attNum = petSkillTemplate['attNum_' + j];
            var coefficient = petSkillTemplate['attReduce_' + j];
            this.petAttManager.UpdateSigleAtt(att, ePetAttLevel.ATTLEVEL_SKILL, attNum, 1);
            this.petAttManager.UpdateEndCoefficient(att, coefficient, 1);
        }
    }
    this.petAttManager.UpdateEndAtt();
};

handler.UpdateZhanli = function() {
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', this.petID);
    if(!petTemplate) {
        logger.error('petTemplate is null, petID = %d', this.petID);
        return;
    }
    this.petAttManager.CalcJiChuZhanli();

    var gradeZhanli = petTemplate['colorZhanLi_' + (this.grade - 1)];
    this.petAttManager.SetExtraZhanli(ePetZhanliLevel.ZHANLILEVEL_GRADE, gradeZhanli, 1);

    for(var i in this.skillList) {
        var skillID = this.skillList[i];
        var petSkillTemplate = templateManager.GetTemplateByID('PetSkillTemplate', skillID);
        if(!petSkillTemplate) {
            logger.error('UpdateZhanli PetSkillTemplate is null, attID = %j', skillID);
            return;
        }
        var zhanli = petSkillTemplate['zhanli'];
        this.petAttManager.SetExtraZhanli(ePetZhanliLevel.ZHANLILEVEL_SKILL, zhanli, 1);
    }
    this.zhanli = this.petAttManager.UpdateZhanli();
};

handler.Update = function() {
    var petTemplate = templateManager.GetTemplateByID('PetTemplate', this.petID);
    if(null == petTemplate) {
        logger.error('PetTemplate is null!');
        return;
    }
    if(this.attTempID != petTemplate['attTempID'] * 1000 + this.level) { // 升级，需要新的att模板
        this.attTempID = petTemplate['attTempID'] * 1000 + this.level;
        this.petAttManager = new PetAttManager(this.attTempID);
    } else { // 没有升级，走正常的刷新，沿用原来的att模板，att重置
        this.petAttManager.Reset();
    }
    this.UpdateAtt();
    this.UpdateZhanli();
};
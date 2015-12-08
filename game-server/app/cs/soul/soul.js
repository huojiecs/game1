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
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var eSoulInfo = gameConst.eSoulInfo;
var eAttInfo = gameConst.eAttInfo;
var tSoulInfo = templateConst.tSoulInfo;
var tSoulWake = templateConst.tSoulWake;
module.exports = function (SoulTemplate) {
    return new Handler(SoulTemplate);
};

var Handler = function (SoulTemplate) {
    this.SoulTemplate = SoulTemplate;
    this.soulInfo = new Array(eSoulInfo.Max);
    for (var i = 0; i < eSoulInfo.Max; ++i) {
        this.soulInfo[i] = 0;
    }
};

var handler = Handler.prototype;
handler.GetTemplate = function () {
    return this.SoulTemplate;
};

handler.GetSoulInfo = function (Index) {
    if (IsTrueIndex(Index)) {
        return this.soulInfo[Index];
    }
    return null;
};

handler.SetSoulInfo = function (Index, value) {
    if (IsTrueIndex(Index)) {
        this.soulInfo[Index] = value;
    }
};

handler.SetSoulAllInfo = function (soulInfo) {
    this.soulInfo = soulInfo;
    var tempID = soulInfo[eSoulInfo.TEMPID];
    var SoulTemplate = templateManager.GetTemplateByID('SoulTemplate', tempID);
    var initZhan = 0;   //每个变身的虚战力值
    if (null != SoulTemplate) {
        var level = soulInfo[eSoulInfo.LEVEL];
        var propLevel = level || 1;
        var soulInfoID = SoulTemplate['att_' + ( propLevel - 1)];
        var SoulInfoTemplate = templateManager.GetTemplateByID('SoulInfoTemplate', soulInfoID);
        initZhan = SoulInfoTemplate[tSoulInfo.upAdd_Zhan];

        var skillNum = soulInfo[eSoulInfo.SkillNum];    //当前变身开启的的技能数量
        for (var i = 1; i <= skillNum; ++i) {
            var addZhan = SoulTemplate['SkillZhanli_' + i];
            if (addZhan > 0) {
                initZhan += addZhan;
            }
        }

    }
    //logger.info('initZhan = ' + initZhan);
    this.SetSoulZhanli(initZhan);
};

handler.GetSoulAllInfo = function () {
    return this.soulInfo;
};

handler.SetSoulZhanli = function (baseZhan) {
    if (this.soulInfo[eSoulInfo.LEVEL] == 0) {
        return 0;
    }
    var soulZhanli = 0;
    for (var i = 0; i < 3; ++i) {
        var attID = this.soulInfo[eSoulInfo['ATTID_' + i]];
        var attNum = this.soulInfo[eSoulInfo['ATTNUM_' + i]];
        switch (attID) {
            case eAttInfo.ATTACK:        //攻击力
                soulZhanli += attNum * gameConst.eAttFactor.GONGJI;
                break;
            case eAttInfo.DEFENCE:         //防御力
                soulZhanli += attNum * gameConst.eAttFactor.FANGYU;
                break;
            case eAttInfo.MAXHP:           //最大血量
                soulZhanli += attNum * gameConst.eAttFactor.MAXHP;
                break;
        }
    }

    var wakeZhanli = 0;
    var wakeLevel = this.soulInfo[eSoulInfo.WakeLevel];
    for (i=0; i<wakeLevel; i++)
    {
        var wakeID = this.SoulTemplate["wake_" + i];
        var SoulWakeTemplate = templateManager.GetTemplateByID('SoulWakeTemplate', wakeID);
        if (!!SoulWakeTemplate) {
            wakeZhanli += SoulWakeTemplate[tSoulWake.zhanli];
        }
    }

    this.soulInfo[eSoulInfo.Zhanli] = Math.floor(soulZhanli) + baseZhan + wakeZhanli;
};

handler.AddSoulZhanli = function (value) {
    if (value >= 0) {
        this.soulInfo[eSoulInfo.Zhanli] += value;
    }
};

handler.GetSoulZhanli = function () {            //获取法宝的当前战力
    return this.soulInfo[eSoulInfo.Zhanli];
};

function IsTrueIndex(Index) {
    if (Index >= 0 && Index < eSoulInfo.Max) {
        return true;
    }
    return false;
};
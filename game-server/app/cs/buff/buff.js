/**
 * Created with JetBrains WebStorm.
 * User: edere
 * Date: 13-6-4
 * Time: 上午11:34
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateConst = require('../../../template/templateConst');
var templateManager = require('../../tools/templateManager');
var tBuff = templateConst.tBuff;
var tBuffAction = templateConst.tBuffAction;
var eAttInfo = gameConst.eAttInfo;
var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function (BuffTemplate) {
    return new Handler(BuffTemplate);
};

var Handler = function (BuffTemplate) {
    this.BuffTemplate = BuffTemplate;
    this.isLife = false;
    this.endTime = 0;
    this.beginInfo = {
        buff0: [],
        buff1: []
    };
    this.stillInfo = {
        buff0: [],
        buff1: [],
        stillTime: 0,
        endTime: 0
    };
    this.endInfo = {
        buff0: [],
        endTime: 0
    };
};

var handler = Handler.prototype;

handler.BeginAction = function (player, userPlayer) {
    var beginID = this.BuffTemplate[tBuff.beginAction];       //添加buff马上出发的行为
    var bufffLevel = this.BuffTemplate[tBuff.buffLevel];      //buff的等级
    var nowTime = new Date();
    var nowSec = nowTime.getTime();
    if (this.BuffTemplate[tBuff.isLife] == 1) {               //判断是否一直存在
        this.isLife = true;
    }
    else {
        var duration = this.BuffTemplate[tBuff.duration];
        this.endInfo.endTime = nowSec + duration * 1000;        //不是一直存在的计算结束时间
    }
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var begin0 = [0, 0];
        var begin1 = [0, 0];
        var still0 = [0, 0];
        var still1 = [0, 0];
        var end0 = [0, 0];
        this.beginInfo.buff0[i] = begin0;
        this.beginInfo.buff1[i] = begin1;
        this.stillInfo.buff0[i] = still0;
        this.stillInfo.buff1[i] = still1;
        this.endInfo.buff0[i] = end0;
    }
    if (beginID > 0) {
        var actionList = templateManager.GetTemplateByID('BuffActionListTemplate', beginID);
        if (actionList) {
            var actionNum = actionList['actionNum'];
            for (var i = 0; i < actionNum; ++i) {
                var actionID = actionList['action_' + i];
                var action = templateManager.GetTemplateByID('BuffActionTemplate', actionID);
                if (action) {
                    var playerType = action[tBuffAction.playerType];
                    var actType = action[tBuffAction.actType];        //行为类型
                    var attType = action[tBuffAction.attType];        //属性类型
                    var change = action[tBuffAction.change];          //改变的百分比
                    var changeNum = action[tBuffAction.changeNum];   //改变的数值
                    if (actType == 0) {     //行为类型为效果
                        this.beginInfo.buff0[attType][0] +=
                        GetAttEndNum(player, userPlayer, change, changeNum, attType, playerType);
                    }
                    else if (actType == 1) {   //行为类型为属性
                        this.beginInfo.buff1[attType][0] += changeNum;
                        this.beginInfo.buff1[attType][1] += change;
                    }
                }
            }
            this.AttributeUpdate(player, bufffLevel, this.beginInfo.buff1, true, false);
            this.AttributeUpdate(player, bufffLevel, this.beginInfo.buff0, true, true);
        }
    }
    var stillID = this.BuffTemplate[tBuff.stillAction];  //持续过程中触发的行为
    if (stillID > 0) {
        var actionList = templateManager.GetTemplateByID('BuffActionListTemplate', stillID);
        if (actionList) {
            var buffInfo = new Array(eAttInfo.MAX);
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                var buff = [0, 0];
                buffInfo[i] = buff;
            }
            var actionNum = actionList['actionNum'];
            for (var i = 0; i < actionNum; ++i) {
                var actionID = actionList['action_' + i];
                var action = templateManager.GetTemplateByID('BuffActionTemplate', actionID);
                if (action) {
                    var attType = action[tBuffAction.attType];
                    var change = action[tBuffAction.change];
                    var actType = action[tBuffAction.actType];
                    var changeNum = action[tBuffAction.changeNum];
                    var playerType = action[tBuffAction.playerType];
                    if (actType == 0) {
                        this.stillInfo.buff0[attType][0] +=
                        GetAttEndNum(player, userPlayer, change, changeNum, attType, playerType);
                    }
                    else if (actType == 1) {
                        this.stillInfo.buff1[attType][0] += changeNum;
                        this.stillInfo.buff1[attType][1] += change;
                    }
                }
            }
            this.stillInfo.stillTime = this.BuffTemplate[tBuff.stillTime] * 1000;
            this.stillInfo.endTime = nowSec + this.stillInfo.stillTime;
        }
    }
    var endID = this.BuffTemplate[tBuff.endAction];   //buff结束后出发的行为
    if (endID > 0) {
        var actionList = templateManager.GetTemplateByID('BuffActionListTemplate', endID);
        if (actionList) {
            var actionNum = actionList['actionNum'];
            for (var i = 0; i < actionNum; ++i) {
                var actionID = actionList['action_' + i];
                var action = templateManager.GetTemplateByID('BuffActionTemplate', actionID);
                if (action) {
                    var actType = action[tBuffAction.actType];
                    var playerType = action[tBuffAction.playerType];
                    var attType = action[tBuffAction.attType];
                    var change = action[tBuffAction.change];
                    var changeNum = action[tBuffAction.changeNum];
                    this.endInfo.buff0[attType][0] +=
                    GetAttEndNum(player, userPlayer, change, changeNum, attType, playerType);
                    if (actType != 0) {
                        logger.error('buff结束的时候不能有属性行为或者状态行为，否则减少的属性无法恢复');
                    }
                }
            }
        }
    }
};

handler.StillAction = function (player, nowSec) {
    if (this.BuffTemplate[tBuff.stillAction] == 0) {
        return;
    }
    if (this.stillInfo.endTime > nowSec) {
        return;
    }
    this.stillInfo.endTime = nowSec + this.stillInfo.stillTime;
    var bufffLevel = this.BuffTemplate[tBuff.buffLevel];
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        this.beginInfo.buff1[i][0] += this.stillInfo.buff1[i][0];
        this.beginInfo.buff1[i][1] += this.stillInfo.buff1[i][1];
    }
    this.AttributeUpdate(player, bufffLevel, this.stillInfo.buff1, true, false);
    this.AttributeUpdate(player, bufffLevel, this.stillInfo.buff0, true, true);
};

handler.EndAction = function (player, nowSec) {
    if (this.BuffTemplate[tBuff.isLife] == 1) {
        return false;
    }
    if (this.endInfo.endTime > nowSec) {
        return false;
    }
    var buffLevel = this.BuffTemplate[tBuff.buffLevel];
    this.AttributeUpdate(player, buffLevel, this.endInfo.buff0, true, false);
    this.AttributeUpdate(player, buffLevel, this.beginInfo.buff1, false, true);
    return true;
};

handler.DelAction = function (player) {
    if (this.BuffTemplate[tBuff.isLife] == 1) {
        return false;
    }
    var buffLevel = this.BuffTemplate[tBuff.buffLevel];
    this.AttributeUpdate(player, buffLevel, this.endInfo.buff0, true, false);
    this.AttributeUpdate(player, buffLevel, this.beginInfo.buff1, false, true);
    return true;
};

handler.AttributeUpdate = function (player, attLevel, attList, isAdd, isSend) {
    if (null == player) {
        return;
    }
    player.UpdateAtt(attLevel, attList, isAdd, isSend);
};

function GetAttEndNum(player, userPlayer, change, changeNum, attType, playerType) {
    var resultNum = 0;
    switch (attType) {
        case  eAttInfo.HP :
            resultNum = ChangeHP(player, userPlayer, change, changeNum, playerType);
            break;
        default:
            resultNum = ChangeNum(player, userPlayer, change, changeNum, attType, playerType);
    }
    return resultNum;
};

function ChangeHP(player, userPlayer, change, changeNum, playerType) {
    if (changeNum >= 0) {
        return changeNum;
    }
    var tempChange
    var resultNum = 0;
    var attManager = player.GetAttManager();
    var userAttManager = userPlayer.GetAttManager();
    var randomCrit = Math.floor(Math.random() * 100);
    var randomResult = Math.floor(Math.random() * 5);
    //产生的攻击力
    var userExpLevel = userPlayer.GetPlayerInfo(ePlayerInfo.ExpLevel);     //使用者的等级
    var userAttack = userAttManager.GetAttValue(eAttInfo.ATTACK);//使用者的攻击力
    userAttack = userAttack * change + changeNum;
    var userCrit = userAttManager.GetAttValue(eAttInfo.CRIT);//使用者的暴击值
    userCrit = userCrit / ( userCrit * 2 + userExpLevel * 100 + 500);
    var userDamageUp = userAttManager.GetAttValue(eAttInfo.DAMAGEUP);//使用者的伤害提升
    userDamageUp = userDamageUp / 10000;
    var userCritDamage = userAttManager.GetAttValue(eAttInfo.CRITDAMAGE);//使用者的暴击伤害

    //产生的防御力
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);     //自己的等级
    var defence = attManager.GetAttValue(eAttInfo.DEFENCE);    //自己的防御力
    defence = defence / ( defence * 1.4 + expLevel * 220 + 400 );
    var antiCrit = attManager.GetAttValue(eAttInfo.ANTICRIT);    //自己的暴击抵抗
    antiCrit = antiCrit / ( antiCrit * 2 + expLevel * 50 + 100);
    var damageReduce = attManager.GetAttValue(eAttInfo.DAMAGEREDUCE);    //自己的伤害减免
    damageReduce = damageReduce / 10000;
    var critDamageReduce = attManager.GetAttValue(eAttInfo.CRITDAMAGEREDUCE);    //自己的暴击伤害减免
    damageReduce = damageReduce / 10000;

    //判断是否暴击
    var isCrit = 100 * userCrit / ( userCrit + antiCrit ) * userCrit - randomCrit + 5;
    if (isCrit > 0) {//暴击了
        var temp = userCritDamage - critDamageReduce;
        if (temp < -5000) {
            temp = -5000;
        }
        userAttack = userAttack * ( 15000 + temp ) / 10000;
    }
    resultNum =
    Math.floor(userCrit * ( 1 - defence ) * ( 1 + userDamageUp - damageReduce ) * ( 1 + randomResult / 100  ));
};

function ChangeNum(player, userPlayer, change, changeNum, attType, playerType) {
    var attManager = player.GetAttManager();
    if (playerType == 1) {
        attManager = userPlayer.GetAttManager();
    }
    var attNum = attManager.GetAttValue(attType);
    var resultNum = Math.floor(change / 100 + 1) * attNum + changeNum;
    return resultNum;
};

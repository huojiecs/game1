/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午12:03
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Player = require('./player');
var gameConst = require('../../tools/constValue');
var ePlayerInfo = gameConst.ePlayerInfo;
var templateManager = require('../../tools/templateManager');
var defaultValue = require('../../tools/defaultValues');

var Handler = module.exports;
Handler.Init = function () {
    this.playerList = {};
    this.dukeUnionID = 0;
    this.roleTimer = {};        // 公会战伤害定时器
    this.blackList = {};        // 黑名单角色
};

Handler.GetDukeUnionID = function () {
    return this.dukeUnionID;
};

Handler.SetDukeUnionID = function (dukeID) {
    this.dukeUnionID = dukeID;
};

Handler.GetPlayer = function (roleID) {
    return this.playerList[roleID];
};

Handler.GetAllPlayer = function () {
    return this.playerList;
};

Handler.AddPlayer = function (playerInfo, csID, uid, sid) {
    var player = new Player(playerInfo, csID, uid, sid);
    var roleID = playerInfo[ePlayerInfo.ROLEID];
    this.playerList[roleID] = player;
};

Handler.DeletePlayer = function (roleID) {
    delete this.playerList[roleID];
};

/**
 * 修改玩家的csID
 *
 * @param {Number} roleID 玩家id
 * @param {Number} csServerID 玩家csID
 * */

Handler.SetPlayerCs = function (roleID, csServerID) {
    var player = this.playerList[roleID];
    if (null != player) {
        player.SetPlayerCs(csServerID);
    }
};

Handler.IsInBlackList = function (roleID) {
    return this.blackList[roleID] != null;
};


Handler.addBlackList = function (roleID) {
    if(defaultValue.cheatBlack){
        this.blackList[roleID] = 1;
    }

};

// 伤害频率监视
Handler.checkDamageRate = function (roleID) {
    if(this.blackList[roleID]){
        logger.error('black');
        return true;
    }
    var player = this.playerList[roleID];
    if(player == null){
        logger.error('no role');
        return true;
    }
    var self = this;
    if(this.roleTimer[roleID] == null){
        this.roleTimer[roleID] = {
            perTimer : 0,
            perCount : 1,
            rangeDamages : [],
            rangeAllDamage : 1
        };
        var pertTimer = setInterval(function(){
            var roleInfo = self.roleTimer[roleID];
            if(roleInfo == null){
                return;
            }
            if(roleInfo.rangeDamages.length >= 30){
                roleInfo.rangeAllDamage -= roleInfo.rangeDamages.shift();
            }
            roleInfo.rangeDamages.push(roleInfo.perCount);
            roleInfo.perCount = 0;

        }, 1000);
        this.roleTimer[roleID].perTimer = pertTimer;

        return false;
    }

    var careerID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    --careerID;
    var checkTemplate = templateManager.GetTemplateByID('CheckDamageTemplate', 1000 + careerID);
    if(checkTemplate == null){
        logger.fatal('checkTemplate null %j ', careerID);
        return true;
    }

    if(++this.roleTimer[roleID].perCount > checkTemplate['perHitCount']){
        this.addBlackList(roleID);
        logger.fatal('per count over %j ', checkTemplate['perHitCount']);
        return true;
    }

    if(++this.roleTimer[roleID].rangeAllDamage > checkTemplate['rangeHitCount']){
        this.addBlackList(roleID);
        logger.fatal('rangeAllDamage count over %j ', checkTemplate['rangeHitCount']);
        return true;
    }

    return false;
};

// 删除所有的攻击定时器
Handler.deleteDamageRate = function(){
    logger.error('blackList Roles is  %j ', this.blackList);
    this.blackList = {};
    for(var roleID in this.roleTimer){
        var roleInfo = this.roleTimer[roleID];
        clearInterval(roleInfo.perTimer);
    }
    this.roleTimer = {};
};

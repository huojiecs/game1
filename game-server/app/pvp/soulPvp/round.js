/**
 * The file ares.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/01/04 1:09:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../player/playerManager');
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var defaultValue = require('../../tools/defaultValues');
var soulPvpFormula = require('./soulPvpFormula');
var Q = require('q');
var BATTLE_TYPE = soulPvpFormula.BATTLE_TYPE;

var ePlayerInfo = gameConst.ePlayerInfo;

/**
 * 战神 一次回合战斗
 * */
module.exports = function (roundInfo) {
    return new Handler(roundInfo);
};

var Handler = function (roundInfo) {
    /** 回合id */
    this.id = roundInfo.id;
    /** 类型*/
    this.type = roundInfo.type;
    /** pvp red 方(挑战方)*/
    this.red = roundInfo.red;
    /** pvp blue 方（被挑战方）*/
    this.blue = roundInfo.blue;
    /**　ares mgr 管理器*/
    this.mgr = roundInfo.mgr;

    /** 玩家列表*/
    this.playerList = {};
    this.playerList[this.blue.roleID] = this.red;
    this.playerList[this.red.roleID] = this.blue;

    /** 回合战斗开始时间*/
    this.startTime = new Date().getTime();

    var self = this;
    this.timeOut = setTimeout(function () {
        self.doTimeOut();
    }, defaultValue.ARES_DEFAULT_BATTLE_TIME);


    this.mgr.addBattleType(this.red.roleID, BATTLE_TYPE.BATTLING);
    this.mgr.addBattleType(this.blue.roleID, BATTLE_TYPE.BATTLED);

    logger.info('ares create round %d - type: %d, red: %d  vs  blue: %d', this.id, this.type, this.red.roleID,
                this.blue.roleID);
};

var handler = Handler.prototype;

/**
 * 获取id
 * */
handler.GetRoundID = function () {
    return this.id;
};

handler.SetRoundID = function (index, value) {
    this.id = value;
};

/**
 * 获取挑战方， 红方
 *
 * @return {Object}
 * */
handler.getRed = function () {
    return this.red;
};

/**
 * 获取被挑战方， 蓝方
 *
 * @return {Object}
 * */
handler.getBlue = function () {
    return this.blue;
};

/**
 * 获取回合状态
 * @return {number}
 * */
handler.GetRoundState = function () {
    return this.roundState;
};

/**
 * 设置回合状态
 * @param {number} value 状态
 * */
handler.SetRoundState = function (value) {
    this.roundState = value;
};

/**
 * 是否包含指定玩家
 * @param {number} roleID 玩家id
 * @return {boolean}
 * */
handler.IsHavePlayer = function (roleID) {
    if (this.playerList[roleID]) {
        return true;
    }
    return false;
};

/**
 * 是否挑战成功
 * @param {number} roleID 玩家id
 * @return {boolean}
 * */
handler.IsBattleWin = function (winID) {
    if (this.red.roleID == winID) {
        return true;
    }
    return false;
};

/**
 * 战斗结束
 * @param {number} winID 获胜者id
 * */
handler.battleOver = function (winID) {
    var self = this;

    /**不存在获胜玩家*/
    if (!this.IsHavePlayer(winID)) {
        return Q.reject(errorCodes.ParameterWrong);
    }

    var mgr = this.mgr;
    /** 清除超时处理*/
    clearTimeout(this.timeOut);

    /** 结束又异步处理*/
    mgr.addBattleType(this.red.roleID, BATTLE_TYPE.BALANCE);
    mgr.addBattleType(this.blue.roleID, BATTLE_TYPE.BALANCE);

    //logger.error('&&&&&&&&&&&&&&: %j -- %d -- %s', this.red, winID, this.IsBattleWin(winID));

    var deferred = Q.defer();
    this.doBalance(this.IsBattleWin(winID))
        .then(function () {
                  deferred.resolve();
              })
        .catch(function (err) {
                   deferred.reject(err);
               })
        .finally(function () {
                     self.destroy();
                 });
    return deferred.promise;

};

/**
 * do balance
 *
 * */
handler.doBalance = function (isSucceed) {
    var mgr = this.mgr;
    if (isSucceed) {
        return mgr.balanceWin(this);
    } else {
        return mgr.balanceFail(this);
    }
};

/**
 * 销毁回合
 *
 * @api public
 * */
handler.destroy = function () {

    var mgr = this.mgr;
    /** 删除玩家 战斗状态*/
    mgr.deleteBattleType(this.red.roleID);
    mgr.deleteBattleType(this.blue.roleID);

    /*** 删除回合**/
    mgr.deleteRoundByID(this.id);
};

/**
 * 超时处理, 正常情况是不会出现的
 * @return {object}
 * */
handler.doTimeOut = function () {
    /** 暂时 定为蓝方赢 挑战失败， 正式后这个时间定为很多， 理论是不会出现*/
    this.battleOver(this.blue.roleID);
    logger.warn('timeOut round %d - type: %d, red: %d  ares battle  blue: %d', this.id, this.type, this.red.roleID,
                this.blue.roleID);
};

/**
 * 发送消息
 * @param {number} roleID 玩家id
 * @param {string} route msg 路由消息
 * @param {object} msg 推送消息
 * */
handler.SendRoundMsg = function (roleID, route, msg) {
    var player = playerManager.GetPlayer(roleID);
    if (player) {
        player.SendMessage(route, msg);
    }
};




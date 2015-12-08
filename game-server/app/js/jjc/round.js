/**
 * The file bout.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/16 13:46:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../player/playerManager');
var jjcManager = require('../jjc/jjcManager');
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var defaultValue = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var jjcFormula = require('../common/jjcFormula');
var Q = require('q');

var ePlayerInfo = gameConst.ePlayerInfo;
var eRoundState = gameConst.eRoundState;
var BATTLE_TYPE = jjcFormula.BATTLE_TYPE;
var eRoundType = gameConst.eRoundType;


/**
 * jjc 一次回合战斗
 * */
module.exports = function (roundInfo) {
    return new Handler(roundInfo);
};

var Handler = function (roundInfo) {
    /** 回合id */
    this.id = roundInfo.id;
    /** 类型*/
    this.type = roundInfo.type;
    /** pvp red 方*/
    this.red = roundInfo.red;
    /** pvp blue 方*/
    this.blue = roundInfo.blue;
    /** 房间状态*/
    this.roundState = eRoundState.Round;
    /**　jjc mgr 管理器*/
    this.mgr = roundInfo.mgr;


    /** 玩家列表*/
    this.playerList = {};
    this.playerList[this.blue.roleID] = this.blue;
    this.playerList[this.red.roleID] = this.red;

    /** 回合战斗开始时间*/
    this.startTime = new Date().getTime();

    /** 战斗超时处理*/
    var self = this;
    this.timeOut = setTimeout(function () {
        self.doTimeOut();
    }, defaultValue.JJC_RoundLifeTime);

    /** 添加回合id*/
    this.red.jjcMgr.AddRoundID(this.id);
    this.blue.jjcMgr.AddRoundID(this.id);

    this.mgr.addBattleType(this.red.roleID, BATTLE_TYPE.READY);
    this.mgr.addBattleType(this.blue.roleID, BATTLE_TYPE.READY);

    if (this.type == eRoundType.Battle) {
        /** 添加战斗次数*/
        this.red.jjcMgr.data.AddChallengeTimes();
        this.blue.jjcMgr.data.AddChallengeTimes();
    }

    /** 通知匹配成功*/
    this.sendSucceedBattle();

    logger.info('create round %d - type: %d, red: %d  vs  blue: %d', this.id, this.type, this.red.roleID,
                this.blue.roleID);

    this.waitForTimeOut = setTimeout(function() {
        self.StartGame();
    }, defaultValue.JJC_RoundWaitForTime);
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
 * @Brief: 开始游戏
 *
 * @return {void}
 * */
handler.StartGame = function () {
    var self = this;
    pomelo.app.rpc.rs.roomRemote.StartGame(null, this.red.roleID, function(err, res) {
        if (!!err || res['result'] != errorCodes.OK) {
            logger.error('jjc round start game err: %s, res: %j', utils.getErrorMessage(err), res);
        }

        self.mgr.addBattleType(self.red.roleID, BATTLE_TYPE.BATTLING);
        self.mgr.addBattleType(self.blue.roleID, BATTLE_TYPE.BATTLING);
    });
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
 * 战斗结束
 * @param {number} winID 获胜者id
 * */
handler.battleOver = function (winID) {
    /**不存在获胜玩家*/
    if (!this.IsHavePlayer(winID)) {
        return Q.reject(new Error('winID NOT round player winID: %d', winID));
    }

    this.mgr.addBattleType(this.red.roleID, BATTLE_TYPE.BALANCE);
    this.mgr.addBattleType(this.blue.roleID, BATTLE_TYPE.BALANCE);

    /**获胜玩家数据处理*/
    var player = playerManager.GetPlayer(winID);

    /**失败玩家数据处理*/
    var rival = playerManager.GetPlayer(this.getRival(winID).roleID);

    if (!!rival && !!player) {
        player.GetRoleJJCManager().win(this.type, rival);
        rival.GetRoleJJCManager().fail(this.type, player);
    }

    /**从管理器中删除*/
    this.destroy();
    return Q.resolve();
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

    clearTimeout(this.timeOut);
    clearTimeout(this.waitForTimeOut);
};

/**
 * 获取对手
 * @param {number} roleID 玩家id
 * @return {object}
 * */
handler.getRival = function (roleID) {
    if (this.red.roleID == roleID) {
        return this.blue;
    }
    return this.red;
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
 * 超时处理, 正常情况是不会出现的
 * @param {number} nowSec 当前时间
 * @return {object}
 * */
handler.timeOut = function (nowSec) {
    if (nowSec - this.startTime >= defaultValue.JJC_RoundLifeTime) {
        /** 暂时 定为红方赢， 正式后这个时间定为很多， 理论是不会出现*/
        this.battleOver(this.red.roleID);
        logger.warn('timeOut round %d - type: %d, red: %d  vs  blue: %d', this.id, this.type, this.red.roleID,
                    this.blue.roleID);
    }
};

/**
 * 发送匹配成功发送消息
 * */
handler.sendSucceedBattle = function () {
    var route = 'ServerBattleStats';
    var self = this;

    var blue = this.blue;
    var red = this.red;

    var jobs = [
        blue.jjcMgr.GetPersonMessage(),
        red.jjcMgr.GetPersonMessage()
    ];

    Q.all(jobs)
        .then(function (datas) {
                  if (!datas || !datas[0] || !datas[1]) {
                      Q.reject(new Error('sendSucceedBattle GetPersonMessage blueID: %d redID: %d', blue.roleID,
                                         red.roleID));
                  }

                  var blueInfo = datas[0];
                  var redInfo = datas[1];

                  self.SendRoundMsg(red.roleID, route, {
                      isSccuess: 1,
                      roleID: blue.roleID,
                      oneID: red.roleID,
                      twoID: blue.roleID,
                      roleInfo: blueInfo
                  });

                  self.SendRoundMsg(blue.roleID, route, {
                      isSccuess: 1,
                      roleID: red.roleID,
                      oneID: red.roleID,
                      twoID: blue.roleID,
                      roleInfo: redInfo
                  });
              })
        .catch(function (err) {
                   logger.error('sendSucceedBattle err: %s', utils.getErrorMessage(err));
               })
        .done();
};

/**
 * 发送消息
 * @param {number} roleID 玩家id
 * @param {string} route msg 路由消息
 * @param {object} msg 推送消息
 * */
handler.SendRoundMsg = function (roleID, route, msg) {
    var player = playerManager.GetPlayer(roleID);
    if (!!player) {
        player.SendMessage(route, msg);
    }
};





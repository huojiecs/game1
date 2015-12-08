/**
 * The file jjc.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/10 16:51:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../../tools/config');
var utils = require('../../tools/utils');
var errorCodes = require('../../tools/errorCodes');
var playerManager = require('../player/playerManager');
var gameConst = require('../../tools/constValue');
var defaultValue = require('../../tools/defaultValues');
var roomManager = require('./roomManager');
var messageService = require('../../tools/messageService');
var Room = require('./room');
var util = require('util');
var Q = require('q');
var _ = require('underscore');

var eEntityType = gameConst.eEntityType;
var eAttInfo = gameConst.eAttInfo;

/**
 * jjc 同步1v1 房间场景 继承 room
 * */

var Handler = function (teamInfo, customID) {
    Room.call(this, teamInfo, customID);

    /** 红方数据*/
    this.red = null;

    /** 蓝方数据*/
    this.blue = null;

    /** 关卡倒计时*/
    this.timeOut = null;
};

/**
 * 继承
 * */
util.inherits(Handler, Room);

module.exports = Handler;

var JJCRoom = Handler.prototype;

/**
 * @Brief: 添加玩家到副本
 *
 * @param {Number} roleID 玩家id
 * */
JJCRoom.AddPlayer = function (roleID) {
    /** 调用父类方法*/
    //logger.error('jjc room add role{roleID: %d}', roleID);
    Room.prototype.AddPlayer.call(this, roleID);
    /** 添加玩家*/
    if (!!this.IsAddRed()) {
        this.AddBlue(roleID);
    } else {
        this.AddRed(roleID);
    }

};

/**
 * @Brief: 同步玩家属性
 *
 * @Override
 * */
JJCRoom.SendPlayerAtt = function (player, attType, attNum, playerState, otherID, beforeValue, duringTime) {

    if (eAttInfo.HP == attType) {

        var afterValue = this.ChangeHp(beforeValue - attNum, otherID || player.id);

        Room.prototype.SendPlayerAtt.call(this, player, attType, afterValue, playerState, otherID, beforeValue,
                                          duringTime);
    } else {

        Room.prototype.SendPlayerAtt.call(this, player, attType, attNum, playerState, otherID, beforeValue, duringTime);
    }
};

/**
 * @Brief: 副本结束（玩家主动退出）
 *
 * @Override
 * */
JJCRoom.GameOver = function (player, areaWin, customSco, starNum, ipAddress, tlogInfo, params, callback) {

    if (!areaWin && !!this.red && !!this.blue) {
        if (this.IsRed(player.id)) {
            this.Fail();
        } else {
            this.Win();
        }
    }

    Room.prototype.GameOver.call(this, player, areaWin, customSco, starNum, ipAddress, tlogInfo, params,
                                 callback);
};

/**
 * @Brief: 是否可以用
 *
 * @return {Boolean}
 * */
JJCRoom.Disable = function() {
    return !!this.red && !! this.blue;
};

/**
 * @Brief: 玩家变身
 *
 * @Override
 * */
JJCRoom.SendBianShen = function (player, soulLu, soulType, soulID, soulIndex) {
    if (!this.Disable()) {
        return ;
    }
    if (!!this.IsRed(player.id)) {
        this.red['soulType'] = soulType;
        this.red['hp'] = this.red['total'];
    } else {
        this.blue['soulType'] = soulType;
        this.blue['hp'] = this.blue['total'];
    }

    Room.prototype.SendBianShen.call(this, player, soulLu, soulType, soulID, soulIndex);
};

/**
 * @Brief: 发送游戏开始
 *
 * @Override
 * */
JJCRoom.SendGameBegin = function (player) {
    var self = this;
    this.timeOut = setTimeout(function () {
        self.DoTimeOut();
    }, this.CustomTemplate['endTime'] * 1000);

    Room.prototype.SendGameBegin.call(this, player);
};

/**
 * @Brief: 是否添加红方， 先进入的为红方， 后进的为蓝方
 *
 * @return {boolean}
 * */
JJCRoom.IsAddRed = function () {
    return !!this.red;
};

/**
 * @Brief: 添加红方队伍
 *
 * @param {Number} roleID 玩家id
 * */
JJCRoom.AddRed = function (roleID) {
    //logger.error('****** add red： %d', roleID);
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.error('jjcRoom addPlayer player null err roleID: %d', roleID);
        return;
    }


    var attManager = player.attManager;

    var AddPercent_HP_Player = this.CustomTemplate['AddPercent_HP_Player']; //hp加成百分比 玩家
    var maxHp = Math.floor(attManager.GetAttValue(gameConst.eAttInfo.MAXHP) * (1 + AddPercent_HP_Player
        / 100));

    this.red = {
        'roleID': roleID,
        'hp': maxHp,
        'total': maxHp,
        'soulType': 0
    };

    //logger.error('****** add red： %j', this.red);
};

/**
 * @Brief: 添加蓝方队伍
 *
 * @param {Number} roleID 玩家id
 * */
JJCRoom.AddBlue = function (roleID) {
    //logger.error('****** add blue： %d', roleID);
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.error('jjcRoom addPlayer player null err roleID: %d', roleID);
        return;
    }
    var attManager = player.attManager;

    var AddPercent_HP_Player = this.CustomTemplate['AddPercent_HP_Player']; //hp加成百分比 玩家
    var maxHp = Math.floor(attManager.GetAttValue(gameConst.eAttInfo.MAXHP) * (1 + AddPercent_HP_Player
        / 100));

    this.blue = {
        'roleID': roleID,
        'hp': maxHp,
        'total': maxHp,
        'soulType': 0
    };
    //logger.error('****** add blue： %j', this.blue);
};

/**
 * @Brief； 是否是红方队伍
 *
 * @param {Number} roleID 玩家ID
 * @return {boolean}
 * */
JJCRoom.IsRed = function (roleID) {
    return this.red['roleID'] == roleID;
};

/**
 * @Brief； 改变血量
 *
 * @param {Number} value 改变血量
 * @param {Object} roleID 改变角色
 * */
JJCRoom.ChangeHp = function (value, roleID) {
    if (!this.Disable()) {
        return ;
    }
    var afterValue = !!this.IsRed(roleID) ? ChangeHpValue(value, this.red) : ChangeHpValue(value, this.blue);
    this.CheckIsFinish();
    return afterValue;
};

/**
 * @Brief； 改变血量
 *
 * @param {Number} value 改变血量
 * @param {Object} role 改变角色
 * */
var ChangeHpValue = function (value, role) {
    role['hp'] -= value;
    if (role['hp'] > role['total']) {
        role['hp'] = role['total'];
    }

    return role['hp'];
};

/**
 * @Brief: 检查是否结束战斗
 *
 *
 * */
JJCRoom.CheckIsFinish = function () {
    if (this.red['hp'] <= 0 && !this.blue['soulType']) {
        this.Fail();
    } else if (this.blue['hp'] <= 0 && !this.blue['soulType']) {
        this.Win();
    }
};

/**
 * @Brief: 超时检查是否结束战斗
 *
 *
 * */
JJCRoom.CheckIsFinishByTimeout = function () {
    var redReHp = this.red['total'] - this.red['hp'];
    var blueReHp = this.blue['total'] - this.blue['hp'];
    if (redReHp > blueReHp) {  // 红被造成 伤害值 大于 蓝 默认为red 失败（输）
        this.Fail();
    } else {
        this.Win();
    }
};


/**
 * @Brief 战斗红方获胜
 *
 *
 * */
JJCRoom.Win = function () {
    var self = this;
    pomelo.app.rpc.js.jsRemote.BattleResult(null, this.red.roleID, function (err, res) {
        if (!!err) {
            logger.error('JJCRoom Win err: %s --- red: %j, blue: %j', utils.getErrorMessage(err), self.red, self.blue);
        }

        self.Destroy();
    });
};

/**
 * @Brief 战斗红方失败
 *
 *
 * */
JJCRoom.Fail = function () {
    var self = this;
    pomelo.app.rpc.js.jsRemote.BattleResult(null, this.blue.roleID, function (err, res) {
        if (!!err) {
            logger.error('JJCRoom Fail err: %s --- red: %j, blue: %j', utils.getErrorMessage(err), self.red, self.blue);
        }

        self.Destroy();
    });
};

/**
 * @Brief: 副本超时结算
 *
 * @return {Number}
 * */
JJCRoom.DoTimeOut = function () {
    this.CheckIsFinishByTimeout();
};

/**
 * @Brief: 消息重载 父类 通过 this 为当前 jjc room  调用的为 jjcroom  方法
 *
 * @Override
 * */
JJCRoom.UseSkillSendAoiMsg = function (pos, route, msg, player) {
    var uids = this.GetWatcherUidsByUserSkill(pos, [eEntityType.PLAYER]);
    var tempUids = [];
    if (uids.length > 1) {
        for (var index in uids) {
            tempUids.push(uids[index]);
        }
        uids = tempUids;
    }
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, route, msg);
    }
};

/**
 * @房间销毁处理
 *
 * */
JJCRoom.Destroy = function () {
    this.red = null;
    this.blue = null;
    clearTimeout(this.timeOut);
};
/**
 * The file playerManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/5 16:06:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Player = require('./player');
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var Q = require('q');

var ePlayerInfo = gameConst.ePlayerInfo;

/**
 * 玩家数据管理器
 * */
var Handler = module.exports;
Handler.Init = function () {
    this.playerList = {};

    /** 添加 5分钟 刷新 队列， 提高效率 */
    this.saveTimeQueue = [];
};

Handler.GetPlayer = function (roleID) {
    return this.playerList[roleID];
};
Handler.GetAllPlayer = function () {
    return this.playerList;
};

Handler.AddPlayer = function (playerInfo, csID, uid, sid, callback) {
    var self = this;
    var player = new Player(playerInfo, csID, uid, sid);
    var roleID = playerInfo[ePlayerInfo.ROLEID];
    player.Init()
        .then(function () {
                  self.playerList[roleID] = player;
                  /** 添加时间队列*/
                  self.saveTimeQueue.unshift(roleID);
                  return callback();
              })
        .catch(function (err) {
                   self.playerList[roleID] = player;
                   return callback(err);
               });
};

/***
 * 删除玩家
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback
 * @api public
 * */
Handler.DeletePlayer = function (roleID, callback) {
    var self = this;
    var player = this.playerList[roleID];
    if (null != player) {
        /** 这里可能会有问题， 玩家频繁上下线的话*/
        player.Down()
            .finally(function () {
                         delete self.playerList[roleID];
                         return callback();
                     });
    } else {
        return callback();
    }
};

/**
 * player 刷帧方法， 定时更新操作， interval 1000
 * @param {Date} nowTime 当前时间
 * */
Handler.Update = function (nowTime) {
    var self = this;
    var nowSec = nowTime.getTime();

    while (self.saveTimeQueue.length != 0) {
        var roleID = self.saveTimeQueue.pop();
        var tempPlayer = self.playerList[roleID];

        if (!!tempPlayer) {
            self.saveTimeQueue.unshift(roleID);
            if (tempPlayer.IsSaveDB(nowSec) == true) {
                /** 保存数据到数据库*/
                tempPlayer.SaveToDB();
            } else {
                break;
            }
        }
    }
    /*    for (var Index in self.playerList) {
     var tempPlayer = self.playerList[Index];
     if (tempPlayer.IsSaveDB(nowSec) == true) {
     */
    /** 保存数据到数据库*/
    /*
     tempPlayer.SaveToDB();
     }
     }*/
};

/**
 * @Brief: shutdown 关服之前 方法
 * --------------------
 *
 * @param {Date} nowTime 当前时间
 * @param {Function} callback
 * */
Handler.Down = function (nowTime, callback) {
    var self = this;

    var jobs = [];
    for (var Index in self.playerList) {
        var tempPlayer = self.playerList[Index];
        /** 保存数据到数据库*/
        jobs.push(tempPlayer.Down());
    }
    Q.all(jobs)
        .finally(function () {
                     callback();
                 });
};
/**
 *
 * */
Handler.GetNumPlayer = function (num, exRoleID) {
    var playerList = [];
    for (var index in this.playerList) {
        var tempPlayer = this.playerList[index];
        if (exRoleID != tempPlayer.GetPlayerInfo(ePlayerInfo.ROLEID)) {
            playerList.push(this.playerList[index]);
            if (playerList.length >= num) {
                break;
            }
        }
    }
    //logger.error(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,, %j', playerList.length);
    return playerList;
};

/**
 * Brief: 获取玩家总数
 * ------------------
 * @api public
 *
 * @return {Number} 玩家总数
 * */
Handler.GetPlayerNum = function () {
    return _.size(this.playerList);
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

/**
 * Brief: 兑换物品扣除勋章
 * ----------------------
 * @api public
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} deductValue 扣除勋章数
 * @param {Function} callback
 * */
Handler.deductMedal = function (roleID, deductValue, callback) {
    var player = this.playerList[roleID];
    if (null != player) {
        player.GetRoleAresManager().deductMedal(deductValue, callback);
    } else {
        callback(errorCodes.NoRole);
    }
};

/**
 * Brief: gm 添加勋章
 * ----------------------
 * @api public
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} addValue 添加勋章数
 * @param {Function} callback
 * */
Handler.addMedal = function (roleID, addValue, callback) {
    var player = this.playerList[roleID];
    if (null != player) {
        player.GetRoleAresManager().gmAddMedal(addValue, callback);
    } else {
        callback(errorCodes.NoRole);
    }
};
Handler.addDamage = function(roleID,addValue,callback) {
    var player = this.playerList[roleID];
    if (null != player) {
        player.GetRoleWorldBossManager().AddPlayerDamage(addValue,callback);
    } else {
        callback(errorCodes.NoRole);
    }
    
}
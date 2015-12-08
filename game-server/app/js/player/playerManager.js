/**
 * The file playerManager.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/13 16:06:00
 * To change this template use File | Setting |File Template
 */
var Player = require('./player');
var gameConst = require('../../tools/constValue');
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
                   //self.playerList[roleID] = player;
                   /** 添加时间队列*/
                   //self.saveTimeQueue.unshift(roleID);


                   return callback(err);
               });
};

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
    return playerList;
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
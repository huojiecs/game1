/**
 * The file player.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/5 16:05:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var messageService = require('../../tools/messageService');
var defaultValues = require('../../tools/defaultValues');
var RoleAresManager = require('./roleares/roleAresManager');
var RoleAresLogManager = require('./roleares/roleAresLogManager');
var RoleSoulPvpManager = require('./rolesoulpvp/roleSoulPvpManager');
var RoleSoulPvpLogManager = require('./rolesoulpvp/roleSoulPvpLogManager');
var roleWorldBossManager = require('./roleWorldBoss/roleWorldBossManager');
var NoticeManager = require('./../notice/noticeManager');
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var util = require('util');
var Q = require('q');

var ePlayerInfo = gameConst.ePlayerInfo;
var ePlayerEventType = gameConst.ePlayerEventType;

module.exports = function (playerInfo, csID, uid, sid) {
    return new Handler(playerInfo, csID, uid, sid);
};


var EventEmitter = require('events').EventEmitter;

/**
 * js 服（jjc） 玩家逻辑对象。
 *
 * */
var Handler = function (playerInfo, csID, uid, sid) {
    EventEmitter.call(this);
    this.sid = sid;
    this.uid = uid;
    this.playerInfo = playerInfo;
    this.csID = csID;
    //
    var dateManager = new Date();

    /**刷新时间*/
    this.refreshTime = dateManager.getTime();

    /**战神榜*/
    this.roleAresManager = new RoleAresManager(this);
    /**战神榜*/
    this.roleAresLogManager = new RoleAresLogManager(this);
    /** 邪神竞技场*/
    this.roleSoulPvpManager = new RoleSoulPvpManager(this);
    /** 邪神竞技场日志*/
    this.roleSoulPvpLogManager = new RoleSoulPvpLogManager(this);
    /** 公告 */
    this.noticeManager = new NoticeManager(this);
    /**世界boss*/
    this.roleWorldBossManager = new roleWorldBossManager(this);
    /** 调用初始化方法*/
    //return this.Init();
};

util.inherits(Handler, EventEmitter);
var handler = Handler.prototype;


/**
 * 初始化方法
 * */
handler.Init = function () {
    /** 玩家各个模块初始化， 有promise 保证各个模块的顺序*/
    var deferred = Q.defer();
    /**初始化战神榜*/
    this.roleAresManager.Init(this)
        .then(function (owner) {
                  /** 玩家日志初始化 */
                  return owner.roleAresLogManager.Init(owner);
              })
        .then(function (owner) {
                  /** 玩家邪神竞技场初始化 */
                  return owner.roleSoulPvpManager.Init(owner);
              })
        .then(function (owner) {
                  /** 玩家邪神竞技场日志初始化 */
                  return owner.roleSoulPvpLogManager.Init(owner);
              })
        .then(function (owner) {
            /** 玩家邪神竞技场日志初始化 */
            return owner.roleWorldBossManager.Init(owner);
        })
        .then(function () {
                  return deferred.resolve();
              })
        .catch(function (err) {
                   logger.error('pvp player module init error： %s', utils.getErrorMessage(err));
                   return deferred.reject(err);
               })
        .done();
    return deferred.promise;
};


/**
 * 定时保存数据
 * */
handler.SaveToDB = function () {
    logger.info('player %d in pvp SaveToDB: ', this.getID());
    var deferred = Q.defer();
    this.roleAresManager.SaveToDB(this)
        .then(function (owner) {
                  return owner.roleAresLogManager.SaveToDB(owner);
              })
        .then(function (owner) {
                  return owner.roleSoulPvpManager.SaveToDB(owner);
              })
        .then(function (owner) {
                  /** 邪神竞技场 日志 保存事件*/
                  return owner.roleSoulPvpLogManager.SaveToDB(owner);
              })        
        .catch(function (err) {
                   logger.error('pvp player module SaveToDB error： %s', utils.getErrorMessage(err));
               })
        .finally(function () {
                     return deferred.resolve();
                 })
        .done();
    return deferred.promise;
};

/**
 * 玩家下线
 * */
handler.Down = function () {
    logger.info('player %d in pvp Down: ', this.getID());
    var deferred = Q.defer();
    this.roleAresManager.Down(this)
        .then(function (owner) {
                  owner.roleAresManager.destroy();
                  return owner.roleAresLogManager.Down(owner);
              })
        .then(function (owner) {
                  /** 玩家下线保存 战神榜日志*/
                  owner.roleAresLogManager.destroy();
                  /** 下线保存 邪神竞技场*/
                  return owner.roleSoulPvpManager.Down(owner);
              })
        .then(function (owner) {
                  /** 邪神竞技场 销毁*/
                  owner.roleSoulPvpManager.destroy();
                  /** 邪神竞技场 下线保存日志*/
                  return owner.roleSoulPvpLogManager.Down(owner);
              })
        .then(function (owner) {
                  /** 邪神竞技场日志 销毁*/
                  owner.roleSoulPvpLogManager.destroy();
              })
        .catch(function (err) {
                   logger.error('pvp player module Down error： %s', utils.getErrorMessage(err));
               })
        .finally(function () {
                     return deferred.resolve();
                 })
        .done();
    return deferred.promise;
};

/**
 * 是否进行定时保存数据
 * @param {number} nowSec 当前时间（毫秒）
 * @return {boolean}
 */
handler.IsSaveDB = function (nowSec) {
    if (nowSec - this.refreshTime >= defaultValues.DBTime) {
        this.refreshTime = nowSec;
        return true;
    }
    return false;
};

handler.GetPlayerInfo = function (index) {
    return this.playerInfo[index];
};

/**
 * 获取玩家 战神榜Manager
 * @return {object}
 * @api public
 * */
handler.GetRoleAresManager = function () {
    return this.roleAresManager;
};

/**
 * 获取玩家 战神榜日志Manager
 * @return {object}
 * @api public
 * */
handler.GetRoleAresLogManager = function () {
    return this.roleAresLogManager;
};


/**
 * 获取玩家 邪神竞技场Manager
 * @return {object}
 * @api public
 * */
handler.GetRoleSoulPvpManager = function () {
    return this.roleSoulPvpManager;
};

/**
 * @Brief: 获取玩家 邪神竞技场日志Manager
 * -----------------------------------
 *
 * @return {object}
 * @api public
 * */
handler.GetRoleSoulPvpLogManager = function () {
    return this.roleSoulPvpLogManager;
};

/**获取公告管理器*/
handler.GetNoticeManager = function () {
    return this.noticeManager;
};
/**获取世界boss理器*/
handler.GetRoleWorldBossManager = function () {
    return this.roleWorldBossManager;
};
/**
 * 获取玩家id
 * */
handler.getID = function () {
    return this.playerInfo[ePlayerInfo.ROLEID];
};

handler.SetPlayerInfo = function (index, value) {
    this.playerInfo[index] = value;
    if (index == ePlayerInfo.ExpLevel) {
        this.emit(ePlayerEventType.UP_LEVEL, {owner: this, newLevel: value});
    }
};

handler.GetPlayerCs = function () {
    return this.csID;
};

handler.SetPlayerCs = function (value) {
    this.csID = value;
};

handler.GetPlayerUid = function () {
    return this.uid;
};

handler.GetPlayerSid = function () {
    return this.sid;
};

/**
 * 发送消息， 先推送到frontend, 在转发给客户端
 * @param {string} route 路由消息号
 * @param {object} msg 推送消息
 * */
handler.SendMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.uid, sid: this.sid}, route, msg);
};

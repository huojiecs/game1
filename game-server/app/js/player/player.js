/**
 * The file player.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/13 16:01:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var messageService = require('../../tools/messageService');
var defaultValues = require('../../tools/defaultValues');
var RoleJJCManager = require('./jjc/roleJJCManager');
var gameConst = require('../../tools/constValue');
var NoticeManager = require('./../notice/noticeManager');
var Q = require('q');
var utils = require('../../tools/utils');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var ePlayerInfo = gameConst.ePlayerInfo;
var ePlayerEventType = gameConst.ePlayerEventType;


module.exports = function (playerInfo, csID, uid, sid) {
    return new Handler(playerInfo, csID, uid, sid);
};

/**
 * js 服（jjc） 玩家逻辑对象。
 *
 * */
var Handler = function (playerInfo, csID, uid, sid) {
    this.sid = sid;
    this.uid = uid;
    this.playerInfo = playerInfo;
    this.csID = csID;
    //
    var dateManager = new Date();

    /**刷新时间*/
    this.refreshTime = dateManager.getTime();

    /**jjc*/
    this.roleJJCManager = new RoleJJCManager(this);

    /** 公告 */
    this.noticeManager = new NoticeManager(this);
};


util.inherits(Handler, EventEmitter);
var handler = Handler.prototype;

/**
 * 初始化方法
 * */
handler.Init = function () {
    /** 玩家各个模块初始化， 有promise 保证各个模块的顺序*/
    var deferred = Q.defer();
    /**初始化jjc*/
    this.roleJJCManager.Init(this)
        .then(function (owner) {
                  /** jjc */
                 // owner.roleJJCManager.Init(owner);
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
    logger.info('player %d in js SaveToDB: ', this.GetId());
    this.roleJJCManager.SaveToDB(this)
        .then(function (owner) {
                  /** jjc */
                 // owner.roleJJCManager.SaveToDB(owner);
              })
        .catch(function (err) {
                   logger.error('js player module init error： %j', utils.getErrorMessage(err));
               })
        .done();
};

/**
 * 玩家下线
 * */
handler.Down = function () {
    logger.info('player %d in pvp Down: ', this.GetId());
    var deferred = Q.defer();
    this.roleJJCManager.Down(this)
        .then(function (owner) {
                  owner.roleJJCManager.destroy();
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
    if (nowSec - this.refreshTime >= defaultValues.JSDBTime) {
        this.refreshTime = nowSec;
        return true;
    }
    return false;
};

handler.GetPlayerInfo = function (index) {
    return this.playerInfo[index];
};

/**
 * 获取玩家 jjcManager
 * @return {object}
 * @api public
 * */
handler.GetRoleJJCManager = function () {
    return this.roleJJCManager;
};

/**获取公告管理器*/
handler.GetNoticeManager = function () {
    return this.noticeManager;
};

/**
 * 获取玩家id
 * */
handler.GetId = function () {
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

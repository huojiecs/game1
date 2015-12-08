/**
 * The file main.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/13 15:59:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('./player/playerManager');
var jjcManager = require('./jjc/jjcManager');
var gameClient = require('../tools/mysql/gameClient');
var config = require('../tools/config');
var templateManager = require('../tools/templateManager');
var redisManager = require('./redis/jsRedisManager');
var config = require('../tools/config');
var Q = require('q');

var Handler = module.exports;

Handler.InitServer = function () {
    /**添加redis 客户端*/
    redisManager.Init();
    /** 加载模板, 全部加载会造成浪费， 除cs 服只加载 需要的*/
    templateManager.Init();
    /**玩家管理器*/
    playerManager.Init();
    /**jjc 管理器*/
    jjcManager.Init();
    /**刷帧函数*/
    setInterval(UpdateServer, 3000);
    return Q.resolve();
};

/**
 * 服务器帧函数 1000 毫秒
 * @api private
 * */
function UpdateServer() {
    var nowTime = new Date();
    /** 玩家player 定时刷新*/
    playerManager.Update(nowTime);
    /** jjc 定时刷新*/
    jjcManager.Update(nowTime);
};
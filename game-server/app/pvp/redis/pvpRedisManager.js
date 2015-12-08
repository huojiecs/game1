/**
 * The file pvpRedisManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/8 15:56:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var RedisManager = require('../../tools/redis/redisManager');
var constValue = require('../../tools/constValue');
var config = require('../../tools/config');
var util = require('util');

var eRedisClientType = constValue.eRedisClientType;

var Handler = function (opts) {
    RedisManager.call(this, opts);
};

/**
 *js 服redis 连接管理器
 * */
util.inherits(Handler, RedisManager);

module.exports = new Handler();

var handler = Handler.prototype;

handler.Init = function () {
    /** 创建排行榜连接*/
    this.addClient(eRedisClientType.Chart, config.redis.chart.host, config.redis.chart.port, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
};

/**
 * 获取 ares sort list setName
 * */
handler.getAresSetName = function() {
    return config.redis.chart.zsetName + ':ares@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取 setName
 * */
handler.getAresInfoSetName = function() {
    return config.redis.chart.zsetName + ':aresInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取 role info setName
 * */
handler.getRoleInfoSetName = function() {
    return config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取 ares log  setName
 * */
handler.getAresLogInfoSetName = function() {
    return config.redis.chart.zsetName + ':aresLog@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取 ares log  setName
 * */
handler.getZhanliSetName = function() {
    return config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};


/**
 * Brief: 获取 soul pvp sort list setName
 * --------------------------------------
 *  chart:ares@9001:26090
 * */
handler.getSoulPvpSetName = function() {
    return config.redis.chart.zsetName + ':soulpvp@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * Br获取 setName
 * */
handler.getSoulPvpInfoSetName = function() {
    return config.redis.chart.zsetName + ':soulpvpInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * @Brief: 获取 SoulPvp setName
 * ---------------------------
 *
 * @return {String}
 * */
handler.getSoulDetailSetName = function() {
    return config.redis.chart.zsetName + ':soulDetail@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};
/**
 * 
 *@Brief: 获取 WorldBoss setName
 * --------------------------- 
 * @returns {string}
 */
handler.getWorldBossSetName = function() {
    return config.redis.chart.zsetName + ':worldBoss@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
};

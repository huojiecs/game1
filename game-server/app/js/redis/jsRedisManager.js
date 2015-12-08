/**
 * The file jsRedisManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/17 17:23:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var RedisManager = require('../../tools/redis/redisManager');
var constValue = require('../../tools/constValue');
var config = require('../../tools/config');
var util = require('util');
var utils = require('../../tools/utils');

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
 * 获取 setName
 * */
handler.getZSetName = function() {
    return config.redis.chart.zsetName + ':jjc@' + config.list.serverUid + ':' + utils.getMonthOfYear2(new Date());
};

/**
 * 获取上个月 setName
 * */
handler.getPreZSetName = function() {
    return config.redis.chart.zsetName + ':jjc@' + config.list.serverUid + ':' + utils.getPreMonthOfYear(new Date());
};

/**
 * 获取 玩家 info setName
 * */
handler.getRoleInfoSetName = function() {
    return config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取 玩家竞技场 info setName
 * */
handler.getJJCInfoZSetName = function() {
    return config.redis.chart.zsetName + ':jjcInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};
/**
 * Created by CL on 14-11-27.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var redis = require("redis");
var config = require('../tools/config');
var defaultValues = require('../tools/defaultValues');
var Q = require('q');
var utils = require('../tools/utils');
var _ = require('underscore');
var chartSql = require('../tools/mysql/chartSql');
var RedisManager = require('../tools/redis/redisManager');
var constValue = require('../tools/constValue');
var util = require('util');

var eRedisClientType = constValue.eRedisClientType;

var Handler = function (opts) {
    RedisManager.call(this, opts);
};

/**
 *cs 服redis 连接管理器
 * */
util.inherits(Handler, RedisManager);

module.exports = new Handler();

var handler = Handler.prototype;

handler.Init = function () {
    var self = this;

    self.redisRoleDetail =
    config.redis.chart.zsetName + ':roleDetail@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.petZsetName =
    config.redis.chart.zsetName + ':pet@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    /** 创建排行榜连接*/
    this.addClient(eRedisClientType.Chart, config.redis.chart.host, config.redis.chart.port, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    self.chartBlackMap = {};
    return Q.ninvoke(chartSql, 'ChartLoadBlackList')
        .then(function (roleList) {
                  _.each(roleList, function (info) {
                      self.chartBlackMap[info.roleID] = true;
                  });
              });
};

handler.getRoleDetailSetName = function () {
    return this.redisRoleDetail;
};

handler.getPetZsetName = function() {
    return this.petZsetName;
};
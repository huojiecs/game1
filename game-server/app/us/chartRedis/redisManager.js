/**
 * Created by CL on 14-9-12.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var redis = require("redis");
var config = require('../../tools/config');
var defaultValues = require('../../tools/defaultValues');
var Q = require('q');
var utils = require('../../tools/utils');
var _ = require('underscore');
var chartSql = require('../../tools/mysql/chartSql');
var RedisManager = require('../../tools/redis/redisManager');
var constValue = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
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

    /** 创建排行榜连接*/
    this.addClient(eRedisClientType.Chart, config.redis.chart.host, config.redis.chart.port, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    self.chartClient = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
    self.chartClient.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    self.pvpClient = redis.createClient(config.redis.asyncPvP.port, config.redis.asyncPvP.host, {
        auth_pass: config.redis.asyncPvP.password,
        no_ready_check: true
    });
    self.pvpClient.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    /** 添加详细信息， 主要是为了跨服查询用 和roleInfo 不同 是因为roleInfo 实时更新， roleDetail 有时延*/
    self.redisRoleDetail =
    config.redis.chart.zsetName + ':roleDetail@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.chartBlackMap = {};
    return Q.ninvoke(chartSql, 'ChartLoadBlackList')
        .then(function (roleList) {
                  _.each(roleList, function (info) {
                      self.chartBlackMap[info.roleID] = true;
                  });
              });
};

/**
 * 获取roleDetail setName
 * @return {string}
 * @api public
 * */

handler.getRoleDetailSetName = function () {
    return this.redisRoleDetail;
};

/**
 * 获取roleDetail across setName
 * @param {string} serverUid 服务器id
 * @return {string}
 * @api public
 * */

handler.getRoleDetailSetNameByServerUid = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':roleDetail@' + serverUid + ':' + pomelo.app.getMaster().port;
};

handler.getRoleInfoOpenIDByServerUid = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':roleInfo@' + serverUid + ':' + pomelo.app.getMaster().port;
};
handler.getUnionChartServerUid = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':union@' + serverUid + ':' + pomelo.app.getMaster().port;
};
handler.getUnionScoreServerUid = function (serverUid) {
    return config.redis.chart.zsetName + ':unionHel@' + serverUid + ':' + pomelo.app.getMaster().port;
};
handler.getUnionInfoServerUid = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':unionInfo@' + serverUid + ':' + pomelo.app.getMaster().port;
};


//handler.AddUnionChartScore = function (redisName, roleID, score, callback) {
//    var forbidTime = playerManager.GetForbidChartInfo(roleID);
//    if (null != forbidTime && (new Date() < new Date(forbidTime))) {
//        return callback(null, 0);
//    }
//    if (this.chartBlackMap[roleID]) {
//        return callback(null, 0);
//    }
//
//
//    this.getClient(eRedisClientType.Chart).zAdd(redisName, roleID, score, function (err, count) {
//        callback(err, count);
//    });
//};
//
//handler.UpdateUnionChartScore = function (redisName, roleInfo, callback) {
//    var forbidTime = playerManager.GetForbidChartInfo(roleInfo.roleID);
//    if (null != forbidTime && (new Date() < new Date(forbidTime))) {
//        return callback(null, 0);
//    }
//
//    if (this.chartBlackMap[roleInfo.roleID]) {
//        return callback(null, 0);
//    }
//
//    this.getClient(eRedisClientType.Chart).hSet(redisName, roleInfo.roleID, JSON.stringify(roleInfo),
//                                                function (err, count) {
//                                                    callback(err, count);
//                                                });
//};
//
//handler.RemoveUnionChartScore = function (zsetName, hashName, roleID, callback) {
//    var self = this;
//    var zrem = Q.nbind(self.chartClient.zrem, self.chartClient);
//    var hdel = Q.nbind(self.chartClient.hdel, self.chartClient);
//
//    var jobs = [];
//    if (zsetName != null) {
//        jobs.push(zrem(zsetName, roleID));
//    }
//    if (hashName != null) {
//        jobs.push(hdel(hashName, roleID));
//    }
//
//    Q.all(jobs)
//        .spread(function (count, gCount) {
//                    return callback(null, count);
//                })
//        .catch(function (err) {
//                   logger.error("error when remove player %d, %s", roleID, utils.getErrorMessage(err));
//                   return callback(err);
//               })
//        .done();
//};


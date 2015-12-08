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
var playerManager = require('../player/playerManager');
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

    /** 添加chartSoul total zhanli信息*/
    self.soulZsetName =
    config.redis.chart.zsetName + ':soul@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    /** 添加chartSoul level message信息*/
    self.soulInfoZsetName =
    config.redis.chart.zsetName + ':soulInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    /** 添加chartPet 信息*/
    self.petZsetName =
    config.redis.chart.zsetName + ':pet@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;


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
 * 获取soul setName
 * @return {string}
 * @api public
 * */

handler.getSoulSetName = function () {
    return this.soulZsetName;
};

/**
 * 获取soulInfo setName
 * @return {string}
 * @api public
 * */

handler.getSoulInfoSetName = function () {
    return this.soulInfoZsetName;
};

handler.getPetZsetName = function() {
    return this.petZsetName;
};

/**
 * Brief: 获取 ares setName
 * ------------------------
 * @api public
 *
 * @return {String}
 * */
handler.getAresSetName = function() {
    return config.redis.chart.zsetName + ':ares@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * Brief: 获取 aresInfo setName
 * ----------------------------
 * @api public
 *
 * @return {String}
 * */
handler.getAresInfoSetName = function() {
    return config.redis.chart.zsetName + ':aresInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * Brief: 获取 JJCInfo setName
 * ----------------------------
 * @api public
 *
 * @return {String}
 * */
handler.getJJCInfoSetName = function() {
    return config.redis.chart.zsetName + ':jjcInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};



/**
 * 获取 zhanli  setName
 * */
handler.getZhanliSetName = function() {
    return config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取 setName
 * */
handler.getAresInfoSetName = function() {
    return config.redis.chart.zsetName + ':aresInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
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

handler.AddPlayerChartScore = function (redisName, roleID, score, param, callback) {
    if(param.forbidChart) {
        var forbidChartList = playerManager.GetForbidChartInfo(roleID);
        if (forbidChartList) {
            var forbidChart = param.forbidChart;
            for(var i in forbidChart) {
                if(forbidChartList[forbidChart[i]] && new Date() < new Date(forbidChartList[forbidChart[i]])) {
                    return callback(null, 0);
                }
            }
        }
    }
    if (this.chartBlackMap[roleID]) {
        return callback(null, 0);
    }


    this.getClient(eRedisClientType.Chart).zAdd(redisName, roleID, score, function (err, count) {
        callback(err, count);
    });
};

handler.UpdatePlayerChartScore = function (redisName, roleInfo, callback) {
    var forbidTime = playerManager.GetForbidChartInfo(roleInfo.roleID);
    if (null != forbidTime && (new Date() < new Date(forbidTime))) {
        return callback(null, 0);
    }

    if (this.chartBlackMap[roleInfo.roleID]) {
        return callback(null, 0);
    }

    this.getClient(eRedisClientType.Chart).hSet(redisName, roleInfo.roleID, JSON.stringify(roleInfo),
                                                function (err, count) {
                                                    callback(err, count);
                                                });
};

handler.RemovePlayerChartScore = function (zsetName, hashName, roleID, callback) {
    var self = this;
    var zrem = Q.nbind(self.chartClient.zrem, self.chartClient);
    var hdel = Q.nbind(self.chartClient.hdel, self.chartClient);

    var jobs = [];
    if (zsetName != null) {
        jobs.push(zrem(zsetName, roleID));
    }
    if (hashName != null) {
        jobs.push(hdel(hashName, roleID));
    }

    Q.all(jobs)
        .spread(function (count, gCount) {
                    return callback(null, count);
                })
        .catch(function (err) {
                   logger.error("error when remove player %d, %s", roleID, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

handler.GetAwardChart = function (roleID, chartType, callback) {
    var self = this;
    self.awardScore =
    config.redis.chart.zsetName + ':award@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.redisAwardRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    var zRevRank = Q.nbind(self.chartClient.zrevrank, self.chartClient);
    var zRevRange = Q.nbind(self.chartClient.zrevrange, self.chartClient);
    var zScore = Q.nbind(self.chartClient.zscore, self.chartClient);
    var hmGet = Q.nbind(self.chartClient.hmget, self.chartClient);

    var myChartID = null;
    var myScore = 0;
    var scores = {};

    var jobs = [zRevRank(self.awardScore, roleID), zScore(self.awardScore, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    myChartID = (rank || 0) + 1;
                    myScore = score;
                    return zRevRange(self.awardScore, 0, defaultValues.chartNiuDanScoreTopListCount - 1, 'WITHSCORES');
                })
        .then(function (roleIDs) {
                  var keys = [];
                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }

                  if (keys.length === 0) {
                      return Q.resolve([]);
                  }

                  return hmGet(self.redisAwardRoleInfo, keys);
              })
        .then(function (roles) {
                  var rank = 0;
                  roles = _.compact(roles);
                  var rankList = _.map(roles, function (role) {
                      var newRole = JSON.parse(role);
                      if(!!newRole && !!newRole.roleID){
                          newRole.id = ++rank;
                          newRole.awardScore = scores[newRole.roleID];
                          return {id: newRole.id, name: newRole.name, score: newRole.awardScore, roleID: newRole.roleID};
                      }else{
                          logger.error("GetAwardChart has null role : %j", role);
                      }

                  });
                  logger.debug('roles: %j', rankList);
                  return callback(null, myChartID, myScore, rankList);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

handler.GetSevenRechargeChart = function (roleID, chartType, callback) {
    var self = this;

    self.sevenRecharge =
    config.redis.chart.zsetName + ':recharge@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.redisrechargeRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    var zRevRank = Q.nbind(self.chartClient.zrevrank, self.chartClient);
    var zRevRange = Q.nbind(self.chartClient.zrevrange, self.chartClient);
    var zScore = Q.nbind(self.chartClient.zscore, self.chartClient);
    var hmGet = Q.nbind(self.chartClient.hmget, self.chartClient);

    var myChartID = null;
    var myScore = 0;
    var scores = {};

    var jobs = [zRevRank(self.sevenRecharge, roleID), zScore(self.sevenRecharge, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    myChartID = (rank || 0) + 1;
                    myScore = score;
                    return zRevRange(self.sevenRecharge, 0, defaultValues.chartNiuDanScoreTopListCount - 1,
                                     'WITHSCORES');
                })
        .then(function (roleIDs) {
                  var keys = [];
                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }

                  if (keys.length === 0) {
                      return Q.resolve([]);
                  }

                  return hmGet(self.redisrechargeRoleInfo, keys);
              })
        .then(function (roles) {
                  var rank = 0;
                  roles = _.compact(roles);
                  var rankList = _.map(roles, function (role) {
                      var newRole = JSON.parse(role);
                      if(!!newRole && !!newRole.roleID){
                          newRole.id = ++rank;
                          newRole.sevenRecharge = scores[newRole.roleID];
                          return {id: newRole.id, name: newRole.name, score: newRole.sevenRecharge, roleID: newRole.roleID};
                      }else{
                          logger.error("GetSevenRechargeChart has null role : %j", role);
                      }

                  });
                  logger.debug('roles: %j', rankList);
                  return callback(null, myChartID, myScore, rankList);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

handler.GetChestPointChart = function (roleID, chartType, callback) {
    var self = this;

    self.chestPoint =
    config.redis.chart.zsetName + ':chestPoint@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.redisPointsRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    var zRevRank = Q.nbind(self.chartClient.zrevrank, self.chartClient);
    var zRevRange = Q.nbind(self.chartClient.zrevrange, self.chartClient);
    var zScore = Q.nbind(self.chartClient.zscore, self.chartClient);
    var hmGet = Q.nbind(self.chartClient.hmget, self.chartClient);

    var myChartID = null;
    var myScore = 0;
    var scores = {};

    var jobs = [zRevRank(self.chestPoint, roleID), zScore(self.chestPoint, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    myChartID = (rank || 0) + 1;
                    myScore = score;
                    return zRevRange(self.chestPoint, 0, defaultValues.chartChestPointTopListCount - 1,
                                     'WITHSCORES');
                })
        .then(function (roleIDs) {
                  var keys = [];
                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }

                  if (keys.length === 0) {
                      return Q.resolve([]);
                  }

                  return hmGet(self.redisPointsRoleInfo, keys);
              })
        .then(function (roles) {
                  var rank = 0;
                  roles = _.compact(roles);
                  var rankList = _.map(roles, function (role) {
                      var newRole = JSON.parse(role);
                      if(!!newRole && !!newRole.roleID){
                          newRole.id = ++rank;
                          newRole.chestPoint = scores[newRole.roleID];
                          return {id: newRole.id, name: newRole.name, score: newRole.chestPoint, roleID: newRole.roleID};
                      }else{
                          logger.error("GetChestPointChart has null role : %j", role);
                      }

                  });
                  logger.debug('roles: %j', rankList);
                  return callback(null, myChartID, myScore, rankList);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

handler.ClearAwardScore = function () {     //清空抽奖积分排行榜
    var self = this;
    self.awardScore =
    config.redis.chart.zsetName + ':award@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    var del = Q.nbind(self.chartClient.del, self.chartClient);
    var jobs = [del(self.awardScore)];
    Q.all(jobs)
        .catch(function(err) {
                       logger.error("redis error when del %j, error: %s", self.awardScore, utils.getErrorMessage(err));
                   })
        .done();
};

handler.ClearSevenRecharge = function () {     //清空7天充值排行榜
    var self = this;
    self.sevenRecharge =
    config.redis.chart.zsetName + ':recharge@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    var del = Q.nbind(self.chartClient.del, self.chartClient);
    var jobs = [del(self.sevenRecharge)];
    Q.all(jobs)
        .catch(function(err) {
                   logger.error("redis error when del %j, error: %s", self.awardScore, utils.getErrorMessage(err));
               })
        .done();
};

handler.ClearChestPoint = function() {     //清楚宝箱积分排行榜
    var self = this;
    self.chestPoint =
    config.redis.chart.zsetName + ':chestPoint@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    var del = Q.nbind(self.chartClient.del, self.chartClient);
    var jobs = [del(self.chestPoint)];
    Q.all(jobs)
        .catch(function(err) {
                   logger.error("redis error when del %j, error: %s", self.chestPoint, utils.getErrorMessage(err));
               })
        .done();

};
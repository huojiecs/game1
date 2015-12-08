/**
 * The file chartSoul.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/18 19:45:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./chartManager');
var chartSql = require('../tools/mysql/chartSql');
var config = require('../tools/config');
var utils = require('../tools/utils');
var defaultValues = require('../tools/defaultValues');
var errorCodes = require('../tools/errorCodes');
var async = require('async');
var redis = require("redis");
var Q = require('q');
var gameConst = require('../tools/constValue');
require('q-flow'); // extends q
var _ = require('underscore');
var eForbidChartType = gameConst.eForbidChartType;

var Handler = module.exports;

/**
 * 邪神 总战力排行榜
 * */
Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    /** 设置数据key 类似于表名*/
    self.zsetName =
    config.redis.chart.zsetName + ':soul@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisSoulInfo =
    config.redis.chart.zsetName + ':soulInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.eachLoadPlayer = 300;

    /** 创建redis连接*/
    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    logger.info('Use redis %s:%d zsetname name:%s', config.redis.chart.host, config.redis.chart.port, self.zsetName);

    /**　删除redis 原有的数据*/
    var del = Q.nbind(self.client.del, self.client);

    if (!!defaultValues.RedisReloadAtStartup) {
        var jobs = [
            del(self.zsetName),
            del(self.redisSoulInfo)
        ];

        Q.all(jobs)
            .then(function () {
                      var dbLoopCount = config.mysql.global.loopCount;
                      /** 对数据库进行循环*/
                      return Q.until(function () {
                          --dbLoopCount;
                          var lastRoleID = 0;
                          /** 对一个数据库下所有数据读取*/
                          return Q.until(function () {
                              return Q.ninvoke(chartSql, 'ChartLoadSoul', dbLoopCount, lastRoleID)
                                  .then(function (players) {

                                            /** 一次读取100个玩家数据*/
                                            self.AddPlayers(players);
                                            logger.info("ChartLoadSoul load player: %s", players.length);

                                            if (players.length > 0) {
                                                lastRoleID = players[players.length-1]['roleID'];
                                            }

                                            /** 判断该服玩家数据是否读取完毕*/
                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartLoadSoul failed: %s", utils.getErrorMessage(err));
                                             return true;
                                         });
                          }).then(function (each) {
                              /** 所有数据库读取完毕结束条件*/
                              return dbLoopCount === 0;
                          });
                      })
                  })
            .finally(function () {
                         return deferred.resolve();
                     })
            .done();
    }
    else {
        return Q.resolve();
    }

    return deferred.promise;
};

/**
 * 添加玩家数据
 *
 * @param {Array} players 玩家数
 * */
Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Soul Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        var roleID = player['roleID'];
        var name = player['name'];
        var zhanli = player['zhanli'];
        var soulIDs = player['soulID'];
        var soulLevels = player['soulLevel'];

        /** 在黑白 名单不显示的玩家*/
        if (!chartManager.IsInBlackList(roleID)
                && !chartManager.IsInForbidList(roleID, eForbidChartType.SOUL)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
            if (roleID == 306) {
            }
            multi.zadd(self.zsetName, zhanli, roleID, function (err, count) {

            });
        }

        /** 添加玩家各个邪神等级信息 确保有序。。。 有必要么！！！*/
        var soulInfo = {};
        var levels = [];
        if (!!soulIDs && !!soulLevels) {
            soulIDs = soulIDs.split(',');
            soulLevels = soulLevels.split(',');
            for (var i in soulIDs) {
                soulInfo[parseInt(soulIDs[i])] = parseInt(soulLevels[i])
            }
            var keys = _.keys(soulInfo).sort();
            for (var i in keys) {
                levels.push(soulInfo[keys[i]]);
            }
        }
        var key = roleID;
        var value = JSON.stringify({roleID: roleID, levels: levels, zhanli: zhanli, name: name});
        multi.hset(self.redisSoulInfo, key, value);
    });

    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};

/**
 * 删除玩家redis 中相关的邪神信息
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback  回调函数
 * @api public
 * */
Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);
    var hdel = Q.nbind(self.client.hdel, self.client);

    var jobs = [
        zrem(self.zsetName, roleID),
        hdel(self.redisSoulInfo, roleID)
    ];

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

/**
 * 获取排行榜信息
 *
 * @param {Number} roleID 玩家id
 * @param {Number} chartType 排行榜类型
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.GetChart = function (roleID, callback) {
    var self = this;

    /** 绑定相关方法 用于流程控制*/
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);

    /** 玩家排行榜*/
    var chartInfo = {};
    var scores = {};

    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    chartInfo["magicRanking"] = (rank || 0) + 1;
                    chartInfo["magicZhanli"] = score || 0;

                    /** 获取排行榜前100的玩家*/
                    return zRevRange(self.zsetName, 0, defaultValues.chartTopListCount - 1, 'WITHSCORES');
                })
        .then(function (roleIDs) {
                  /** 获取前100 玩家 邪神等级信息*/
                  var keys = [];
                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }

                  if (keys.length === 0) {
                      return Q.resolve([]);
                  }

                  var jobs = [hmGet(self.redisSoulInfo, keys), hmGet(self.redisRoleInfo, keys)];
                  return Q.all(jobs);
//                  return hmGet(self.redisSoulInfo, keys);
              })
        .then(function (dates) {
                  var rank = 0;
                  var i = 0;
                  var roles = _.map(dates[1], function (role) {
                      return JSON.parse(role);
                  });
                  var rankList = _.map(dates[0], function (soul) {
                      var newSoul = JSON.parse(soul);
                      var role = roles[i++];
                      var levels = newSoul.levels;

                      return {
                          ranking: ++rank,
                          zhanli: scores[newSoul.roleID],
                          roleID: newSoul.roleID,
                          name: newSoul.name || '',
                          soul0: levels[0] || 0,
                          soul1: levels[1] || 0,
                          soul2: levels[2] || 0,
                          soul3: levels[3] || 0,
                          soul4: levels[4] || 0,
                          vipLevel: !!role ? role.vipLevel : 0,
                          isNobility: !!role ? role.isNobility : 0,
                          isQQMember: !!role ? role.isQQMember : 0
                      };
                  });
                  logger.debug('roles: %j', rankList);
                  chartInfo["chartList"] = rankList;
                  return callback(null, chartInfo);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * 获取与排行榜前一名玩家 的差值
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.GetDiffer = function (roleID, callback) {
    var self = this;

    /** 绑定相关方法 用于流程控制*/
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);

    var myScore = {};

    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    if (!rank) {
                        rank = 1;
                    }
                    myScore = score || 0;
                    return zRevRange(self.zsetName, rank - 1, rank, 'WITHSCORES');
                })
        .then(function (score) {
                  if (!!score || score.length > 0) {
                      var differ = score[0] - myScore > 0 ? score[0] - myScore : 1;
                      return callback(null, {differ: differ});
                  }
                  return callback(null, {differ: 1});
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(errorCodes.ParameterWrong);
               })
        .done();
};


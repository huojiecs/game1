/**
 * Created by xykong on 2014/7/12.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./chartManager');
var chartSql = require('../tools/mysql/chartSql');
var config = require('../tools/config');
var utils = require('../tools/utils');
var defaultValues = require('../tools/defaultValues');
var errorCodes = require('../tools/errorCodes');
var utilSql = require('../tools/mysql/utilSql');
var async = require('async');
var redis = require("redis");
var Q = require('q');
var gameConst = require('../tools/constValue');
require('q-flow'); // extends q
var _ = require('underscore');
var eForbidChartType = gameConst.eForbidChartType;

var Handler = module.exports;


Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.zsetName =
    config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.eachLoadPlayer = 1000;
    self.scoreName = 'zhanli';

    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    var del = Q.nbind(self.client.del, self.client);

    self.playerMap = {};
    //self.playerCount = 0;  //目前无用，先注掉

    logger.info('Use redis %s:%d zsetname name:%s', config.redis.chart.host, config.redis.chart.port, self.zsetName);

    if (!!defaultValues.RedisReloadAtStartup) {
        var jobs = [
            del(self.zsetName),
            del(self.redisRoleInfo)
        ];

        Q.all(jobs)
            .then(function () {
                      var dbLoopCount = config.mysql.global.loopCount;
                      return Q.until(function () {
                          --dbLoopCount;
                          var lastRoleID = 0;
//                logger.warn("dbLoopCount: %s", dbLoopCount);
                          return Q.until(function () {
                              return Q.ninvoke(chartSql, 'ChartLoadRoleInfo', dbLoopCount, lastRoleID)
                                  .then(function (players) {
                                            /* code which eventually returns true */
                                            logger.info("ChartLoadRoleInfo load player: %s", players.length);
                                            self.AddPlayers(players);
                                            if (players.length > 0) {
                                                lastRoleID = players[players.length-1]['roleID'];
                                            }

                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartLoadRoleInfo failed: %s", utils.getErrorMessage(err));

                                             return true;
                                         });
                          }).then(function (each) {
                              /* finished */
//                    logger.warn("finished dbLoopCount: %s", dbLoopCount);
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

        logger.warn('Skip to reload mysql data to redis.');
        return Q.resolve();
    }

    return deferred.promise;
};

Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        player["nickName"] = utilSql.MysqlDecodeString(player["nickName"]);
        var score = player[self.scoreName];
        var roleID = player['roleID'];
        if (!chartManager.IsInBlackList(roleID)
                && !chartManager.IsInForbidList(roleID, eForbidChartType.ZHANLI)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.ZHANLI)) {
            multi.zadd(self.zsetName, score, roleID, function (err, count) {
                //self.playerCount += count;
            });
        }

        var key = roleID;
        //delete player[self.scoreName];
        var value = JSON.stringify(player);
        multi.hset(self.redisRoleInfo, key, value);
    });

    // you can re-run the same transaction if you like
    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};

Handler.AddPlayerScore = function (roleID, score, callback) {
    var self = this;

    logger.debug('AddPlayerScore roleID: %j, score: %j', roleID, score);

    if (chartManager.IsInBlackList(roleID)
            || chartManager.IsInForbidList(roleID, eForbidChartType.ZHANLI)
        || chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
        return callback();
    }

    var zAdd = Q.nbind(self.client.zadd, self.client);

    zAdd(self.zsetName, score, roleID)
        .then(function (count) {
                  //self.playerCount += count;
                  return callback(null, count);
              })
        .catch(function (err) {
                   logger.error("error when add player %d, %d, %s", roleID, score, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.UpdatePlayerScore = function (roleInfo, callback) {
    var self = this;

    logger.debug('UpdatePlayerScore roleID: %j, score: %j', roleInfo.roleID, roleInfo.zhanli);

    var hset = Q.nbind(self.client.hset, self.client);

    var key = roleInfo.roleID;
    var value = JSON.stringify(roleInfo);

    hset(self.redisRoleInfo, key, value)
        .then(function () {
                  return self.AddPlayerScore(roleInfo.roleID, roleInfo.zhanli, callback);
              })
        .catch(function (err) {
                   logger.error("error when add player %d, %d, %s", roleInfo.roleID, roleInfo.zhanli,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);
    var hdel = Q.nbind(self.client.hdel, self.client);

    var jobs = [
        zrem(self.zsetName, roleID),
        hdel(self.redisRoleInfo, roleID)
    ];

    Q.all(jobs)
        .spread(function (count, gCount) {
                    //self.playerCount -= count;
                    return callback(null, count);
                })
        .catch(function (err) {
                   logger.error("error when remove player %d, %s", roleID, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.RemovePlayerScoreForBan = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);

    var jobs = [
        zrem(self.zsetName, roleID),
    ];

    Q.all(jobs)
        .spread(function (count, gCount) {
                    //self.playerCount -= count;
                    return callback(null, count);
                })
        .catch(function (err) {
                   logger.error("error when remove player %d, %s", roleID, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.GetChart = function (roleID, chartType, callback) {
    var self = this;

    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);

    var chartID = null;
    var scores = {};

    zRevRank(self.zsetName, roleID)
        .then(function (rank) {
                  chartID = (rank || 0) + 1;
                  return zRevRange(self.zsetName, 0, defaultValues.chartTopListCount - 1, 'WITHSCORES');
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

                  return hmGet(self.redisRoleInfo, keys);
              })
        .then(function (roles) {
                  var rank = 0;
                  var rankList = _.map(roles, function (role) {
                      var newRole = JSON.parse(role);
                      newRole.id = ++rank;
                      newRole.zhanli = scores[newRole.roleID];
                      return newRole;
                  });
                  logger.debug('roles: %j', rankList);
                  return callback(null, chartID, rankList);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

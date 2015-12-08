/**
 * Created by xykong on 2014/7/12.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./chartManager');
var config = require('../tools/config');
var chartSql = require('../tools/mysql/chartSql');
var globalFunction = require('../tools/globalFunction');
var utils = require('../tools/utils');
var defaultValues = require('../tools/defaultValues');
var async = require('async');
var redis = require("redis");
var errorCodes = require('../tools/errorCodes');
var Q = require('q');
var gameConst = require('../tools/constValue');
require('q-flow');  // extends q
var _ = require('underscore');
var eForbidChartType = gameConst.eForbidChartType;

var Handler = module.exports;

Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.zsetName =
    config.redis.chart.zsetName + ':honor@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.zsetZhanli =
    config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.eachLoadPlayer = 1000;
    self.scoreName = 'honor';

    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    var zremrangebyrank = Q.nbind(self.client.zremrangebyrank, self.client);

    self.playerMap = {};
    //self.playerCount = 0;  //目前无用 ，先注掉

    logger.info('Use redis %s:%d zsetname name:%s', config.redis.chart.host, config.redis.chart.port, self.zsetName);

    if (!!defaultValues.RedisReloadAtStartup) {
        zremrangebyrank(self.zsetName, 0, -1)
            .then(function (result) {

                      var dbLoopCount = config.mysql.global.loopCount;
                      return Q.until(function () {
                          --dbLoopCount;
                          var lastRoleID = 0;
//                logger.warn("dbLoopCount: %s", dbLoopCount);
                          return Q.until(function () {
//                    logger.warn("finished inner: %s, beginIndex: %s", dbLoopCount, beginIndex);
                              return Q.ninvoke(chartSql, 'ChartLoadHonor', dbLoopCount, lastRoleID)
                                  .then(function (players) {
                                            /* code which eventually returns true */
                                            logger.info("ChartLoadHonor load player: %s", players.length);
                                            self.AddPlayers(players);
                                            if (players.length > 0) {
                                                lastRoleID = players[players.length-1]['roleID'];
                                            }

                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartLoadHonor failed: %s", utils.getErrorMessage(err));
                                             return true;
                                         });
                          }).then(function (each) {
                              /* finished */
                              logger.warn("finished dbLoopCount: %s", dbLoopCount);
                              return dbLoopCount === 0;
                          });
                      })

                  })
            .finally(function () {
//            self.GetChart(1, 1, utils.done);
                         return deferred.resolve();
                     })
            .done();
    }
    else {
        return Q.resolve();
    }

    return deferred.promise;
};

Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        var roleID = player['roleID'];
        if (!chartManager.IsInBlackList(roleID)
                && !chartManager.IsInForbidList(roleID, eForbidChartType.HONOR)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
            multi.zadd(self.zsetName, player[self.scoreName], roleID, function (err, count) {
                //self.playerCount += count;
            });
        }
    });
    // you can re-run the same transaction if you like
    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};

Handler.AddPlayerScore = function (roleID, score, callback) {
    var self = this;
    if (chartManager.IsInBlackList(roleID)
            || chartManager.IsInForbidList(roleID, eForbidChartType.HONOR)
        || chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
        return callback();
    }

    var zadd = Q.nbind(self.client.zadd, self.client);

    zadd(self.zsetName, score, roleID)
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
    return this.AddPlayerScore(roleInfo.roleID, roleInfo.honor, callback);
};

Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);

    zrem(self.zsetName, roleID)
        .then(function (count) {
                  //self.playerCount -= count;
                  return callback(null, count);
              })
        .catch(function (err) {
                   logger.error("error when remove player %d, %s", roleID, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.GetPlayerRank = function (roleID, callback) {
    var self = this;

    self.client.zrevrank(self.zsetName, roleID, function (err, rank) {
        if (err) {
            logger.error("error when GetPlayerRank %s", utils.getErrorMessage(err));
            return callback(err);
        }
        rank = (rank || 0) + 1;
        return callback(null, rank);
    });
};

Handler.GetChart = function (roleID, chartType, callback) {
    var self = this;

    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);

    var chartID = null;
    var keys = [];
    var scores = {};
    var zhanlis = {};

    zRevRank(self.zsetName, roleID)
        .then(function (rank) {
                  chartID = (rank || 0) + 1;
                  return zRevRange(self.zsetName, 0, defaultValues.chartTopListCount - 1, 'WITHSCORES');//top
              })
        .then(function (roleIDs) {
                  logger.debug('roleIDs: %j', roleIDs);

                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }
              })
        .then(function () {

                  var deferred = Q.defer();

                  var multi = self.client.multi();
                  _.each(keys, function (roleId) {
                      multi.zscore(self.zsetZhanli, roleId, function (err, score) {
                          zhanlis[roleId] = score;

                          logger.debug('zhanli: %j:%j', roleId, score);
                      });
                  });

                  // you can re-run the same transaction if you like
                  multi.exec(deferred.makeNodeResolver());

                  return deferred.promise;

              }).then(function () {
                          if (!keys || keys.length === 0) {
                              return Q.resolve([]);
                          }
                          return hmGet(self.redisRoleInfo, keys);
                      })
        .then(function (roles) {
                  var rank = 0;
                  for (var r in roles) {
                      if (!roles[r]) {
                          roles.splice(r, 1);
                      }
                  }
                  var rankList = _.map(roles, function (role) {
                      logger.debug('role: %j', role);
                      if (!!role) {
                          var newRole = JSON.parse(role);
                          if (!!newRole) {
                              newRole.id = ++rank;
                              newRole.honor = scores[newRole.roleID];
                              newRole.zhanli = zhanlis[newRole.roleID] || "0"; // 0是为了避免禁战力排行榜时，斩魂榜报错
                              return newRole;
                          }
                      } else {
                          return {
                              "roleID": 0,
                              "name": '',
                              "expLevel": 0,
                              "vipLevel": 0,
                              "isNobility": 0,
                              "isQQMember": 0,
                              "id": 0,
                              "honor": "0",
                              "zhanli": "0"
                          };
                      }
                  });
                  for (var index in rankList) {
                      if (0 == rankList[index].roleID) {
                          rankList.splice(index, 1);
                      }
                  }
                  logger.debug('roles: chartID: %j, rankList: %j', chartID, rankList);
                  return callback(null, chartID, rankList);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};
Handler.GetHonorRankingList = function (callback) {
    var self = this;
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    zRevRange(self.zsetName, 0, defaultValues.HonrRewardNumber)
        .then(function (roleIDs) {
                  return callback(null, roleIDs);
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

    var myScore = 0;
    var myRank = 0;
    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    var index = rank - 1;
                    if (index < 0) {
                        index = 0;
                    }
                    myScore = score || 0;
                    myRank = rank;
                    return zRevRange(self.zsetName, index, index, 'WITHSCORES');
                })
        .then(function (score) {
                  if (!!score || score.length > 0) {
                      var differ = myRank == 0 ? 0 : (score[1] - myScore > 0 ? score[1] - myScore : 1);
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
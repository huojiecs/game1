/**
 * The file chartSoulPvp.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/01/12 18:07:00
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
var templateManager = require('../tools/templateManager');
var gameConst = require('../tools/constValue');
var redisManager = require('./redisManager');
var Q = require('q');
require('q-flow'); // extends q
var _ = require('underscore');

var Handler = module.exports;

var eRedisClientType = gameConst.eRedisClientType;
var eSoulInfo = gameConst.eSoulInfo;
var eAttInfo = gameConst.eAttInfo;

/**
 * 战神榜 排行榜
 * */
Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    /** 设置数据key 类似于表名*/
    self.zsetName =
    config.redis.chart.zsetName + ':soulpvp@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisSoulPvpInfo =
    config.redis.chart.zsetName + ':soulpvpInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisSoulDetail =
    config.redis.chart.zsetName + ':soulDetail@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;


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
            del(self.redisSoulPvpInfo)
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
                              return Q.ninvoke(chartSql, 'ChartLoadSoulPvp', dbLoopCount, lastRoleID)
                                  .then(function (players) {

                                            /** 一次读取100个玩家数据*/
                                            self.AddPlayers(players);
                                            logger.info("ChartLoadSoulPvp load player: %s", players.length);
                                            if (players.length > 0) {
                                                lastRoleID = players[players.length-1]['roleID'];
                                            }

                                            /** 判断该服玩家数据是否读取完毕*/
                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartLoadSoulPvp failed: %s", utils.getErrorMessage(err));
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
    logger.info("SoulPvp Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        var roleID = player['roleID'];
        var name = player['name'];
        var rankKey = player['rankKey'];

        /** 在黑白 名单不显示的玩家*/
        var forbidTime = chartManager.GetForbidTime(roleID);
        if (!chartManager.IsInBlackList(roleID) && (!forbidTime || new Date() >= new Date(forbidTime))) {
            multi.zadd(self.zsetName, rankKey, roleID, function (err, count) {

            });
        }

        /** 添加玩家战神榜相关信息*/
        var value = JSON.stringify(player);
        multi.hset(self.redisSoulPvpInfo, roleID, value);
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
        hdel(self.redisSoulPvpInfo, roleID)
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
    var zRange = Q.nbind(self.client.zrange, self.client);
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);

    /** 玩家排行榜*/
    var chartInfo = {};
    var scores = {};
    var keys = [];

    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    //chartInfo["magicRanking"] = (rank || 0) + 1;
                    //chartInfo["magicZhanli"] = score;

                    /** 获取邪神竞技场排行榜前50的玩家*/
                    return zRange(self.zsetName, 0, defaultValues.chartSoulPvpTopListCount - 1, 'WITHSCORES');
                })
        .then(function (roleIDs) {
                  /** 获取前100 玩家 邪神等级信息*/
                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }

                  if (keys.length === 0) {
                      return Q.resolve([]);
                  }

                  var jobs = [
                      hmGet(self.redisSoulPvpInfo, keys),
                      hmGet(self.redisRoleInfo, keys),
                      hmGet(self.redisSoulDetail, keys)
                  ];
                  return Q.all(jobs);
//                  return hmGet(self.redisSoulPvpInfo, keys);
              })
        .then(function (datas) {
                  var rank = 0;
                  var roleInfos = datas[1];
                  var soulPvpInfos = datas[0];
                  var soulDetails = datas[2];

                  var rankList = [];

                  for (var i = 0; i < keys.length; i++) {
                      if (!!roleInfos[i] && !!soulPvpInfos[i] && !!soulDetails[i]) {
                          var roleInfo = JSON.parse(roleInfos[i]);
                          var soulPvpInfo = JSON.parse(soulPvpInfos[i]);
                          var soulDetail = JSON.parse(soulDetails[i]);

                          var zhanlis = soulDetail.zhanlis;
                          var sumZhanli = 0;

                          if (!!zhanlis) {
                              sumZhanli += !!soulPvpInfo.defense1? zhanlis[soulPvpInfo.defense1]: 0;
                              sumZhanli += !!soulPvpInfo.defense2? zhanlis[soulPvpInfo.defense2]: 0;
                              sumZhanli += !!soulPvpInfo.defense3? zhanlis[soulPvpInfo.defense3]: 0;
                          }

                          var info = {
                              rank: ++rank,
                              soulZhanli: sumZhanli,
                              roleID: soulPvpInfo.roleID,
                              name: roleInfo.name || '',
                              vipLevel: !!roleInfo ? roleInfo.vipLevel : 0,
                              isNobility: !!roleInfo ? roleInfo.isNobility : 0,
                              isQQMember: !!roleInfo ? roleInfo.isQQMember : 0
                          };
                          rankList.push(info);
                      }
                  }

                  /* var roles = _.map(dates[1], function (role) {
                   return JSON.parse(role);
                   });
                   var rankList = _.map(dates[0], function (soul) {
                   var newAres = JSON.parse(soul);
                   var role = roles[i++];
                   var levels = newAres.levels;

                   return {
                   ranking: ++rank,
                   zhanli: scores[newAres.roleID],
                   roleID: newAres.roleID,
                   name: newAres.name || '',
                   vipLevel: !!role ? role.vipLevel : 0,
                   isNobility: !!role ? role.isNobility : 0,
                   isQQMember: !!role ? role.isQQMember : 0
                   };
                   });*/
                  logger.debug('roles: %j', rankList);
                  chartInfo["rankingList"] = rankList;
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

    var myScore = 0;

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

/**
 * 当redis 没有数据时 重mysql 重建
 * -----------------------------------------------------
 * @api public
 *
 * @param {Number} roleID 玩家id
 * */
Handler.rebuildSoulDetailToRedis = function (roleID) {

    if (!roleID) {
        return ;
    }

    logger.warn('rebuildSoulDetailToRedis why will do this function, roleID: %s', roleID);

    chartSql.LoadSoulDetail(roleID, function(err, res) {
        if (!!err || !res) {
            logger.error('soul pvp rebuildSoulDetailToRedis err: %s', uitls.getErrorMessage(err));
            return;
        }

        if (!res[0]) {
            return ;
        }

        var soulList = res[0];

        var souls = {};
        var zhanlis = {};
        var atts = {};

        for (var id in soulList) {
            var sumZhanli = 0;

            var soul = soulList[id];
            sumZhanli += soul[eSoulInfo.Zhanli];

            souls[soul[eSoulInfo.TEMPID]] = soul;
            var attList = new Array(eAttInfo.MAX);

            for (var i = 0; i < eAttInfo.MAX; ++i) {
                attList[i] = 0;
            }

            /** 添加 邪神 洗练属性*/


            /** 添加邪神属性*/
            for (var i = 0; i <= 2; i++) {
                attList[soul[eSoulInfo['ATTID_' + i]]] += soul[eSoulInfo['ATTNUM_' + i]];
            }

            /**策划数据 属性*/
            var tempID = soul[eSoulInfo.TEMPID] * 100 + soul[eSoulInfo.LEVEL];
            var temp = templateManager.GetTemplateByID('XieShenAttTemplate', tempID);
            if (!!temp) {
                for (var i = 0; i <= 9; i++) {
                    attList[temp['att_' + i]] += temp['att_Num' + i];
                }
                sumZhanli += temp['att_10'];
            }

            atts[soul[eSoulInfo.TEMPID]] = {
                soulID: soul[eSoulInfo.TEMPID],
                skillNum: soul[eSoulInfo.SkillNum],
                atts: attList
            };

            zhanlis[soul[eSoulInfo.TEMPID]] = sumZhanli;
        }

        var info = {
            souls: souls,
            atts: atts,
            zhanlis: zhanlis
        };

        var client = redisManager.getClient(eRedisClientType.Chart);
        client.hSet(redisManager.getSoulDetailSetName(), roleID, JSON.stringify(info), function (err, data) {
            if (!!err) {
                logger.error('add soul detail message to redis: %s', utils.getErrorMessage(err));
            }
        });
    });
};



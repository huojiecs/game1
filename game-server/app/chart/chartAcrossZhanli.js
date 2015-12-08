/**
 * The file chartAcrossZhanli.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/1/27 18:21:00
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
var utilSql = require('../tools/mysql/utilSql');
var async = require('async');
var redis = require("redis");
var Q = require('q');
var gameConst = require('../tools/constValue');
require('q-flow'); // extends q
var _ = require('underscore');
var eForbidChartType = gameConst.eForbidChartType;

var Handler = module.exports;

/**
 * 跨服戰力排行榜 管理器
 * 1， 此跨服榜 爲一個大區內的排行榜
 * 2， 大區下對所有戰力要求的玩家進行排序     只有战力达到10W的玩家才会上榜（为了防止入围玩家基数太大）
 * 3， 功能是根据redis集群进行的 sort set 排序
 * 4， 各个区服对战力达到要求的玩家 进行上报 zhanli he roleInfo 后最都一样
 *
 * redis key 规则 serverUID % 1000 前缀 作为大区号
 *
 * 5， 策划需求
 *        跨服战力榜显示内容：
 1.    角色名
 2.    战斗力
 3.    所在服务器  例如QQ1服或者微信1服
 4.    所在公会名称
     排行榜显示前100名玩家数据
     跨服排行榜没有任何奖励

 *
 * */
Handler.Init = function () {
    var self = this;

    var deferred = Q.defer();

    self.zhanlizsetName =
    config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    /** 跨服redis key zhanli sort set*/
    self.zsetName =
    config.redis.chart.zsetName + ':zhanli@across_' + utils.getRegionID(config.list.serverUid) + ':' + 3846;

    /** 跨服redis roleInfo: {
    *   roleID:,
    *   NAME:
    *   ...
    * }*/
    self.redisAcrossRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@across_' + utils.getRegionID(config.list.serverUid) + ':' + 3846;

    self.eachLoadPlayer = 1000;
    self.scoreName = 'zhanli';

    /** redis 连接*/
    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    /** 异常获取*/
    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    /** redis 不能有清榜*/
        //var del = Q.nbind(self.client.del, self.client);

    self.playerMap = {};
    //self.playerCount = 0;  //目前无用，先注掉

    logger.info('Use redis %s:%d zsetname name:%s', config.redis.chart.host, config.redis.chart.port, self.zsetName);

    if (!!defaultValues.AcrossRedisReloadAtStartup) {
        var jobs = [
            //del(self.zsetName),
            //del(self.redisAcrossRoleInfo)
        ];

        Q.all(jobs)
            .then(function () {
                      var dbLoopCount = config.mysql.global.loopCount;
                      return Q.until(function () {
                          --dbLoopCount;
                          var lastRoleID = 0;
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

        var score = player[self.scoreName];
        var roleID = player['roleID'];

        /**  战力限制 100000*/
        if (score >= defaultValues.ACROSS_ZHANLI_LIMIT) {

            /** 黑名单 禁止玩家*/
            if (!chartManager.IsInBlackList(roleID)
                    && !chartManager.IsInForbidList(roleID, eForbidChartType.ZHANLI)
                && !chartManager.IsInForbidList(roleID, eForbidChartType.ZHANLI)) {
                multi.zadd(self.zsetName, score, roleID, function (err, count) {
                    //self.playerCount += count;
                });
            }

            var validServerUid = player.serverUid;
            if (!validServerUid) {
                validServerUid = config.list.serverUid;
            }

            var info = {
                roleID: roleID,
                name: player.name,
                zhanli: player.zhanli,
                unionName: player.unionName,
                vipLevel: player.vipLevel,
                isNobility: player.isNobility,
                isQQMember: player.isQQMember,
                serverUID: validServerUid
            };

            var key = roleID;
            var value = JSON.stringify(info);
            multi.hset(self.redisAcrossRoleInfo, key, value);
        }
    });

    // you can re-run the same transaction if you like
    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};

/**
 * @Brief: 移除玩家跨服排行榜信息
 * ---------------------------
 *
 * @param {Number} roleID  需要移除玩家id
 * @param {Function} callback
 * */
Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);
    var hdel = Q.nbind(self.client.hdel, self.client);

    var jobs = [
        zrem(self.zsetName, roleID),
        hdel(self.redisAcrossRoleInfo, roleID)
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

/**
 * @Brief: 获取排行榜
 * -----------------
 * @api public
 *
 * @param {Number} roleID 查看排行榜玩家ID
 * @param {Number} chartType 排行榜类型
 * @param {Function} callback
 * */
Handler.GetChart = function (roleID, chartType, callback) {
    var self = this;

    /** 绑定相关方法、 方便流程控制*/
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);

    var scores = {};

    /**返回消息*/
    var msg = {};

    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zhanlizsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, zhanli) {
                  if (null == rank) {
                      msg['myRank'] = 0;
                  } else {
                      msg['myRank'] = (rank || 0) + 1;
                  }
                  msg['myZhanli'] = zhanli || 0;
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
                  /** 获取相关 玩家跨服info*/
                  return hmGet(self.redisAcrossRoleInfo, keys);
              })
        .then(function (roles) {
                  var rank = 0;
                  var rankList = _.map(roles, function (role) {
                      var newRole = JSON.parse(role);
                      newRole.rank = ++rank;
                      newRole.zhanli = scores[newRole.roleID];
                      var serverName = self.GetServerMap(newRole.serverUID);
                      newRole.serverName = !!serverName? serverName: utils.getRegionName(newRole.serverUID);
                      return newRole;
                  });

                  msg['rankingList'] = rankList;
                  logger.debug('roles: %j', rankList);
                  return callback(null, msg);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * @Brief: 获取区服map
 * ------------------
 *
 * @return {Object}
 * */
Handler.GetServerMap = function (serverUID) {

    if (!this.serverMapTime || utils.getCurTime() - this.serverMapTime > defaultValues.ACROSS_SERVER_MAP_TIME) {
        this.serverMapTime = utils.getCurTime();

        if (!config.gameServerList || !config.gameServerList.list) {
            this.serverMap = null;
            return null;
        }

        this.serverMap = _.indexBy(config.gameServerList.list, 'serverUid');
    }

    if (null == this.serverMap) {
        return null;
    }

    var map = this.serverMap[serverUID];

    return !map? null: map.displayName;
};

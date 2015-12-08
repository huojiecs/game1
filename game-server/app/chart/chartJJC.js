/**
 * The file chartJJC.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/15 1:17:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./chartManager');
var config = require('../tools/config');
var chartSql = require('../tools/mysql/chartSql');
var globalFunction = require('../tools/globalFunction');
var utils = require('../tools/utils');
var defaultValues = require('../tools/defaultValues');
var errorCodes = require('../tools/errorCodes');
var gameConst = require('../tools/constValue');
var async = require('async');
var redis = require("redis");
var Q = require('q');
require('q-flow');  // extends q
var _ = require('underscore');

var Handler = module.exports;

Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    /** 设置数据key 类似于表名*/
    self.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisJJCInfo =
    config.redis.chart.zsetName + ':jjcInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.eachLoadPlayer = 1000;
    self.scoreName = 'credits';

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

    if (!defaultValues.RedisReloadAtStartup) {
        var jobs = [
            del(self.getZSetName(config.list.serverUid)),
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
                              return Q.ninvoke(chartSql, 'ChartLoadCredits', dbLoopCount, lastRoleID)
                                  .then(function (players) {

                                            /** 一次读取1000个玩家数据*/
                                            self.AddPlayers(players);
                                            logger.info("ChartLoadCredits load player: %s", players.length);

                                            if (players.length > 0) {
                                                lastRoleID = players[players.length - 1]['roleID'];
                                            }

                                            /** 判断该服玩家数据是否读取完毕*/
                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartLoadCredits failed: %s", utils.getErrorMessage(err));
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


Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {

        var roleID = player['roleID'];
        var name = player['name'];
        var credits = player['credits'];

        /** 在黑白 名单不显示的玩家*/
        var forbidTime = chartManager.GetForbidTime(roleID);
        if (!chartManager.IsInBlackList(roleID) && (!forbidTime || new Date() >= new Date(forbidTime))) {
            multi.zadd(self.getZSetName(config.list.serverUid), credits, roleID, function (err, count) {

            });
        }

        /** 添加玩家战神榜相关信息*/
        var value = JSON.stringify(player);
        multi.hset(self.redisJJCInfo, roleID, value);
    });
    // you can re-run the same transaction if you like
    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};

Handler.AddPlayerScore = function (roleID, score, callback) {
    var self = this;

    if (chartManager.IsInBlackList(roleID)) {
        return callback();
    }

    var zadd = Q.nbind(self.client.zadd, self.client);

    zadd(self.getZSetName(config.list.serverUid), score, roleID)
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
    return this.AddPlayerScore(roleInfo.roleID, roleInfo.credits, callback);
};

Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);

    zrem(self.getZSetName(config.list.serverUid), roleID)
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

    self.client.zrevrank(self.getZSetName(config.list.serverUid), roleID, function (err, rank) {
        if (err) {
            logger.error("error when GetPlayerRank %s", utils.getErrorMessage(err));
            return callback(err);
        }
        rank = (rank || 0) + 1;
        return callback(null, rank);
    });
};

Handler.GetChart = function (roleID, chartType, curPage, callback) {
    var self = this;

    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);
    var zCard = Q.nbind(self.client.zcard, self.client);

    var chartID = null;
    var keys = [];
    var scores = {};
    var maxPage = 0;

    var jobs = [
        zRevRank(self.getZSetName(config.list.serverUid), roleID),
        zCard(self.getZSetName(config.list.serverUid))
    ];

    Q.all(jobs)
        .then(function (datas) {
                  chartID = (datas[0] || 0) + 1;

                  var dataCount = _.isNumber(datas[1]) ? parseInt(datas[1]) : 0;
                  maxPage = 0 == dataCount ? 0 : Math.floor((dataCount - 1) / defaultValues.JJC_PageNum) + 1;
                  maxPage = maxPage > defaultValues.JJC_MaxPage ? defaultValues.JJC_MaxPage : maxPage;

                  if (curPage > maxPage) {
                      return callback(errorCodes.ParameterNull);
                  }

                  var start = (curPage - 1) * defaultValues.JJC_PageNum;
                  var end = curPage * defaultValues.JJC_PageNum;
                  end = (end > dataCount ? dataCount : end) - 1;
                  return zRevRange(self.getZSetName(config.list.serverUid), start, end, 'WITHSCORES');//获取一页数据
              })
        .then(function (roleIDs) {
                  logger.info('roleIDs: %j', roleIDs);
                  for (var i = 0; i < roleIDs.length; i += 2) {
                      keys.push(roleIDs[i]);
                      scores[roleIDs[i]] = roleIDs[i + 1];
                  }
                  var jobs = [
                      hmGet(self.redisRoleInfo, keys),
                      hmGet(self.getJJCInfoZSetName(config.list.serverUid), keys)
                  ];

                  return Q.all(jobs);
              })
        .then(function (datas) {
                  var rank = (curPage - 1) * defaultValues.JJC_PageNum;
                  var roleInfos = datas[0];
                  var jjcInfos = datas[1];
                  var rankList = [];
                  for (var i = 0; i < keys.length; i++) {
                      var roleInfo = roleInfos[i];
                      var jjcInfo = jjcInfos[i];
                      if (!!roleInfo && !!jjcInfo) {
                          var newRole = JSON.parse(roleInfo);
                          var newInfo = JSON.parse(jjcInfo);
                          rankList.push({
                                            'roleID': newRole['roleID'],
                                            'ranking': ++rank,
                                            'roleName': newRole['name'],
                                            'friendName': newRole['nickName'],
                                            'openID': newRole['openID'],
                                            'picture': newRole['picture'],
                                            'expLevel': newRole['expLevel'],
                                            'zhanli': newRole['zhanli'],
                                            'serverName': '',
                                            'credits': newInfo['credits'],
                                            'jjcCoin': newInfo['jjcCoin'],
                                            'winNum': newInfo['winNum'],
                                            'winRate': self.GetWinRate(newInfo['winNum'], newInfo['totalNum']),
                                            'streaking': newInfo['streaking'],
                                            'maxStreaking': newInfo['maxStreaking']
                                        });
                      }
                  }

                  logger.info('roles: chartID: %j, rankList: %j', chartID, rankList);
                  return callback(null, {rankingList: rankList, maxPage: maxPage});
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * jjc 积分好友排行榜
 * @param {number} roleID 玩家id
 * @param {number} chartType 好友排行类型
 * @param {number} curPage 当前页， 因为好友特殊， 有可能不用
 * @param {function} callback 回调函数
 * */
Handler.GetFriChart = function (roleID, chartType, curPage, callback) {
    var self = this;

    var zScore = Q.nbind(self.client.zscore, self.client);
    var hGet = Q.nbind(self.client.hget, self.client);

    var myInfo = {};
    var topRoleIDs;
    var openIDs;
    var serverUids;
    var nickNames;
    var pictures;
    var maxPage = 0;
    Q.ninvoke(pomelo.app.rpc.fs.fsRemote, 'GetFriendRoleIDs', null, roleID,
              gameConst.eFriendType.All)
        .then(function (dataList) {
                  topRoleIDs = dataList.roleIDs;
                  openIDs = dataList.openIDs;
                  serverUids = dataList.serverUids;
                  nickNames = dataList.nickNames;
                  pictures = dataList.pictures;
                  topRoleIDs.push(roleID);
                  serverUids.push('' + config.list.serverUid);
                  nickNames.push(dataList.myNickName);
                  pictures.push(dataList.myPicture);

                  var jobs = [];
                  for (var i = 0; i < topRoleIDs.length; ++i) {
                      var curServerUid = globalFunction.GetUseServerUId(serverUids[i]);
                      jobs.push(zScore(self.getZSetName(curServerUid), topRoleIDs[i]));
                      jobs.push(hGet(self.getRoleZSetName(curServerUid), topRoleIDs[i]));
                      jobs.push(hGet(self.getJJCInfoZSetName(curServerUid), topRoleIDs[i]));
                  }
                  return Q.all(jobs);
              })
        .then(function (datas) {
                  var rankList = [];

                  for (var i = 0; i < datas.length; i = i + 3) {
                      var credits = datas[i];
                      var roleInfo = datas[i + 1];
                      var jjcInfo = datas[i + 2];

                      if (null != credits && !!roleInfo && !!jjcInfo) {
                          var newRole = JSON.parse(roleInfo);
                          var newInfo = JSON.parse(jjcInfo);
                          rankList.push({
                                            'roleID': newRole['roleID'],
                                            'ranking': 0,
                                            'roleName': newRole['name'],
                                            'friendName': newRole['nickName'],
                                            'openID': newRole['openID'],
                                            'picture': newRole['picture'],
                                            'expLevel': newRole['expLevel'],
                                            'zhanli': newRole['zhanli'],
                                            'serverName': '',
                                            'credits': +newInfo['credits'],
                                            'jjcCoin': newInfo['jjcCoin'],
                                            'winNum': newInfo['winNum'],
                                            'winRate': self.GetWinRate(newInfo['winNum'], newInfo['totalNum']),
                                            'streaking': newInfo['streaking'],
                                            'maxStreaking': newInfo['maxStreaking']
                                        });
                      }
                  }

                  /** 对玩家的好友榜进行排序*/
                  rankList.sort(function (a, b) {
                      return b.credits - a.credits;
                  });

                  var dataCount = rankList.length;
                  maxPage = 0 == dataCount ? 0 : Math.floor((dataCount - 1) / defaultValues.JJC_PageNum) + 1;
                  maxPage = maxPage > defaultValues.JJC_MaxPage ? defaultValues.JJC_MaxPage : maxPage;
                  if (curPage > maxPage) {
                      return callback(errorCodes.ParameterNull);
                  }
                  var start = (curPage - 1) * defaultValues.JJC_PageNum;
                  var end = curPage * defaultValues.JJC_PageNum;
                  end = (end > dataCount ? dataCount : end) - 1;

                  var needList = [];
                  for (var index = 0; index < dataCount; ++index) {
                      var temp = rankList[index];
                      temp.ranking = index + 1;
                      if (index >= start && index <= end) {
                          needList.push(temp);
                      }
                      if (temp.roleID == roleID) {
                          myInfo['myRanking'] = temp.ranking;
                      }
                  }

                  myInfo['rankingList'] = needList;
                  myInfo['maxPage'] = maxPage;
                  return callback(null, myInfo);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * 获取好友爬塔跨服好友SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getZSetName = function (serverUid) {
    return config.redis.chart.zsetName + ':jjc@' + serverUid + ':' + utils.getMonthOfYear2(new Date());
};

/**
 * 获取好玩家信息SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getRoleZSetName = function (serverUid) {
    return config.redis.chart.zsetName + ':roleInfo@' + serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取好玩家竞技场信息SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getJJCInfoZSetName = function (serverUid) {
    return config.redis.chart.zsetName + ':jjcInfo@' + serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * @Brief: 计算胜率
 *
 * @param {Number} winNum 获胜场次
 * @param {Number} totalNum 总战斗次数
 * @return {Number}
 * */
Handler.GetWinRate = function (winNum, totalNum) {
    if (!winNum || !totalNum) {
        return 0;
    } else {
        return Math.floor(winNum / totalNum  * 100);
    }
};
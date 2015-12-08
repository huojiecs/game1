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
var gameConst = require('../tools/constValue');
var defaultValues = require('../tools/defaultValues');
var templateManager = require('../tools/templateManager');
var templateConst = require('../../template/templateConst');
var async = require('async');
var redis = require("redis");
var Q = require('q');
require('q-flow');  // extends q
var _ = require('underscore');
var util = require('util');
var stringValue = require('../tools/stringValue');
var sChartString = stringValue.sChartString;
var eForbidChartType = gameConst.eForbidChartType;

var Handler = module.exports;


Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.zsetName =
    config.redis.chart.zsetName + ':climb@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.zsetZhanli =
    config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.eachLoadPlayer = 1000;
    self.scoreName = 'weekScore';

    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    var zremrangebyrank = Q.nbind(self.client.zremrangebyrank, self.client);

    self.playerMap = {};
    //self.playerCount = 0;  //目前无用，先注掉

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
                              return Q.ninvoke(chartSql, 'ChartClimbScore', dbLoopCount, lastRoleID)
                                  .then(function (players) {
                                            /* code which eventually returns true */
                                            logger.info("ChartClimbScore load player: %s", players.length);
                                            self.AddPlayers(players);
                                            if (players.length > 0) {
                                                lastRoleID = players[players.length - 1]['roleID'];
                                            }

                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartClimbScore failed: %s", utils.getErrorMessage(err));
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
                && !chartManager.IsInForbidList(roleID, eForbidChartType.CLIMB)
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
            || chartManager.IsInForbidList(roleID, eForbidChartType.CLIMB)
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
    return this.AddPlayerScore(roleInfo.roleID, roleInfo.climbScore || 0, callback);
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

Handler.GetChart = function (roleID, chartType, callback) {
    var self = this;

    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);

    var myInfo = {};
    var chartList = {};
    var keys = [];
    var scores = {};
    var range = {};

    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
                    myInfo.myChart = (rank || 0) + 1;
                    myInfo.myScore = Math.floor(score / 1000);
                    myInfo.myCengNum = score % 1000;
                    myInfo.type = chartType;
                    myInfo.days = 7 - new Date().getDay();

                    range = {
                        low: myInfo.myChart - defaultValues.chartMyRangeListCount > defaultValues.chartClimbTopListCount
                            ? myInfo.myChart - defaultValues.chartMyRangeListCount :
                             defaultValues.chartClimbTopListCount,
                        high: myInfo.myChart + defaultValues.chartMyRangeListCount
                                  > defaultValues.chartClimbTopListCount
                            ? myInfo.myChart + defaultValues.chartMyRangeListCount :
                              defaultValues.chartClimbTopListCount
                    };


                    var jobs = [
                        zRevRange(self.zsetName, 0, defaultValues.chartClimbTopListCount - 1, 'WITHSCORES'),
                        zRevRange(self.zsetName, range.low, range.high, 'WITHSCORES')
                    ];

                    return Q.all(jobs);
                })
        .spread(function (topRoleIDs, nearRoleIDs) {
                    logger.debug('roleIDs: %j, %j', topRoleIDs, nearRoleIDs);

                    for (var i = 0; i < topRoleIDs.length; i += 2) {
                        keys.push(topRoleIDs[i]);
                        scores[topRoleIDs[i]] = topRoleIDs[i + 1];
                        chartList[topRoleIDs[i]] = {
                            chart: Math.floor(i / 2) + 1,
                            roleID: +topRoleIDs[i],
                            score: Math.floor(topRoleIDs[i + 1] / 1000),
                            cengNum: topRoleIDs[i + 1] % 1000
                        };
                    }

                    for (var i = 0; i < nearRoleIDs.length; i += 2) {
                        keys.push(nearRoleIDs[i]);
                        scores[nearRoleIDs[i]] = nearRoleIDs[i + 1];
                        chartList[nearRoleIDs[i]] = {
                            chart: Math.floor(i / 2) + range.low + 1,
                            roleID: +nearRoleIDs[i],
                            score: Math.floor(nearRoleIDs[i + 1] / 1000),
                            cengNum: nearRoleIDs[i + 1] % 1000
                        };
                    }
                }).then(function () {
                            keys = _.map(chartList, function (item) {
                                return item.roleID;
                            });
                            if (!keys || keys.length === 0) {
                                return Q.resolve([]);
                            }
                            return hmGet(self.redisRoleInfo, keys);
                        })
        .then(function (roles) {
                  var rank = 0;
                  var rankList = _.map(roles, function (role) {
                      logger.debug('role: %j', role);
                      var newRole = JSON.parse(role);
                      if (!!newRole) {
                          chartList[newRole.roleID].openID = newRole.openID || '';
                          chartList[newRole.roleID].roleName = newRole.name || '';
                          chartList[newRole.roleID].expLevel = +newRole.expLevel || 0;
                          chartList[newRole.roleID].friendName = newRole.nickName || '';
                          chartList[newRole.roleID].picture = !!newRole.wxPicture ? newRole.wxPicture : '';
                          return chartList[newRole.roleID];
                      }
                      return {};
                  });
                  logger.debug('roles: chartID: %j, rankList: %j', myInfo.myChart, rankList);
                  rankList.sort(function (a, b) {
                      return a.chart - b.chart;
                  });
                  myInfo.chartList = rankList;
                  return callback(null, myInfo);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.GetFriClimbChart = function (roleID, chartType, callback) {     //爬塔好友榜
    var self = this;

    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var mGet = Q.nbind(self.client.mget, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);
    var hGet = Q.nbind(self.client.hget, self.client);

    var myInfo = {};
    var chartList = {};
    var keys = [];
    var scores = {};
    var range = {};
    var topRoleIDs;
    var openIDs;
    var serverUids;
    var nickNames;
    var pictures;

    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];
    Q.all(jobs)
        .spread(function (rank, score) {
                    myInfo.myChart = (rank || 0) + 1;
                    myInfo.myScore = Math.floor(score / 1000);
                    myInfo.myCengNum = score % 1000;
                    myInfo.type = chartType;
                    myInfo.days = 7 - new Date().getDay();
                    return Q.ninvoke(pomelo.app.rpc.fs.fsRemote, 'GetFriendRoleIDs', null, roleID,
                                     gameConst.eFriendType.All);
                })
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
                      var func = zScore(self.getZSetName(curServerUid), topRoleIDs[i]);
                      jobs.push(func);
                  }
                  ;
                  return Q.all(jobs);
              })
        .then(function (scores) {
                  for (var i = 0; i < topRoleIDs.length; ++i) {
                      chartList[topRoleIDs[i]] = {
                          openID: openIDs[i] || '',
                          chart: i + 1,
                          roleID: +topRoleIDs[i],
                          serverUid: serverUids[i],
                          friendName: nickNames[i],
                          picture: !!pictures[i] ? pictures[i] : '',
                          score: Math.floor(scores[i] / 1000),
                          cengNum: scores[i] % 1000
                      };
                  }
              })
        .then(function () {
                  keys = _.map(chartList, function (item) {
                      return item.roleID;
                  });
                  if (!keys || keys.length === 0) {
                      return Q.resolve([]);
                  }
                  var jobs = [];
                  for (var i = 0; i < keys.length; ++i) {
                      /** 会出现 read serverUid from undefined bug 添加为空时， 指定本服*/
                      var serverUid = chartList[keys[i]] == null ? config.list.serverUid : chartList[keys[i]].serverUid;
                      var func = hGet(self.getRoleZSetName(serverUid), keys[i]);
                      jobs.push(func);
                  };
                  return Q.all(jobs);
              })
        .then(function (roles) {
                  var rankList = _.map(roles, function (role) {
                      logger.debug('role: %j', role);
                      var newRole = JSON.parse(role);
                      if (!!newRole) {
                          chartList[newRole.roleID].openID =
                          chartList[newRole.roleID].openID.length > 0 ? chartList[newRole.roleID].openID :
                          (newRole.openID || '');
                          chartList[newRole.roleID].roleName = newRole.name || '';
                          chartList[newRole.roleID].expLevel = +newRole.expLevel || 0;
//                          chartList[newRole.roleID].friendName = newRole.nickName || '';
                          return chartList[newRole.roleID];
                      }
                      return {};
                  });
                  logger.debug('roles: chartID: %j, rankList: %j', myInfo.myChart, rankList);
                  for (var index in rankList) {
                      if (null == rankList[index].roleID || rankList[index].roleID <= 0) {
                          rankList.splice(index, 1);
                      }
                  }
                  rankList.sort(function (a, b) {
                      return b.score - a.score;
                  });
                  for (var index = 0; index < rankList.length; ++index) {
                      rankList[index].chart = index + 1;
                      if (rankList[index].roleID == roleID) {
                          myInfo.myChart = index + 1;
                      }
                  }
                  ;
                  myInfo.chartList = rankList;
                  return callback(null, myInfo);
              })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.sendRewardOfClimbSingleChart = function () {   //单区排行榜发奖
    var self = this;

    var climbRewardTemplate = templateManager.GetTemplateByID('ClimbRewardTemplate', 510002);
    if (!climbRewardTemplate) {
        logger.error('The charts award prizes error : No template');
        return;
    }

    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var chartList = {};
    var jobs = [zRevRange(self.zsetName, 0, 1000 - 1, 'WITHSCORES')];
    logger.warn('sendRewardOfClimbSingleChart');
    Q.all(jobs)
        .spread(function (topRoleIDs) {
                    for (var i = 0; i < topRoleIDs.length; i += 2) {
                        chartList[topRoleIDs[i]] = {
                            chart: Math.floor(i / 2) + 1,
                            roleID: +topRoleIDs[i]
                        };
                    }
                    logger.warn('climb single chart top 1000 info: %j', chartList);
                    for (var index in chartList) {
                        var ranking = +chartList[index].chart
                        var mailDetail = {
                            recvID: +index,
                            subject: stringValue.sPublicString.mailTitle_1,
                            mailType: gameConst.eMailType.System
                        };
                        if (ranking === 1) {
                            var prizeID = climbRewardTemplate['itemID_0'] || 0;
                            var prizeNum = climbRewardTemplate['itemNum_0'] || 0;

                            mailDetail.content = util.format(sChartString.content_1, ranking, prizeNum); // '您的万魔塔单区排行:' + ranking + '名,获得钻石:' + prizeNum;
                            mailDetail.items = [
                                [prizeID, prizeNum]
                            ];
                        } else if (ranking === 2) {
                            var prizeID = climbRewardTemplate['itemID_1'] || 0;
                            var prizeNum = climbRewardTemplate['itemNum_1'] || 0;

                            mailDetail.content = util.format(sChartString.content_1, ranking, prizeNum); //'您的万魔塔单区排行:' + ranking + '名,获得钻石:' + prizeNum;
                            mailDetail.items = [
                                [prizeID, prizeNum]
                            ];
                        } else if (ranking === 3) {
                            var prizeID = climbRewardTemplate['itemID_2'] || 0;
                            var prizeNum = climbRewardTemplate['itemNum_2'] || 0;

                            mailDetail.content = util.format(sChartString.content_1, ranking, prizeNum); // '您的万魔塔单区排行:' + ranking + '名,获得钻石:' + prizeNum;
                            mailDetail.items = [
                                [prizeID, prizeNum]
                            ];
                        } else if (ranking >= 4 && ranking <= 100) {
                            var prizeID = climbRewardTemplate['itemID_3'] || 0;
                            var prizeNum = climbRewardTemplate['itemNum_3'] || 0;

                            mailDetail.content = util.format(sChartString.content_1, ranking, prizeNum); //'您的万魔塔单区排行:' + ranking + '名,获得钻石:' + prizeNum;
                            mailDetail.items = [
                                [prizeID, prizeNum]
                            ];
                        } else if (ranking >= 101 && ranking <= 1000) {
                            var prizeID = climbRewardTemplate['itemID_4'] || 0;
                            var prizeNum = climbRewardTemplate['itemNum_4'] || 0;

                            mailDetail.content = util.format(sChartString.content_1, ranking, prizeNum); //'您的万魔塔单区排行:' + ranking + '名,获得钻石:' + prizeNum;
                            mailDetail.items = [
                                [prizeID, prizeNum]
                            ];
                        }
                        pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
                    }
                })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
               })
        .done();
};

Handler.clearClimbScore = function () {   //将爬塔数据置0
    var self = this;
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    climbRoleList = [];
    var jobs = [zRevRange(self.zsetName, 0, -1, 'WITHSCORES')];
    logger.warn('clearClimbScore');
    Q.all(jobs)
        .spread(function (topRoleIDs) {
                    for (var i = 0; i < topRoleIDs.length; i += 2) {
                        var roleID = +topRoleIDs[i] || 0;
                        var clmbscore = +topRoleIDs[i + 1] || 0;
                        var climbInfo = {
                            roleID: roleID,
                            ceng: clmbscore % 1000
                        };
                        climbRoleList.push(climbInfo);
                        //var roleInfo = {roleID: topRoleIDs[i], climbScore: 0};
                        //self.UpdatePlayerScore(roleInfo, utils.done);
                    }
                })
        .catch(function (err) {
                   logger.error("error when GetChart %s", utils.getErrorMessage(err));
               })
        .done();
    setTimeout(self.sendRewardOfFriendChart, 1000 * 60 * 10);   //10分钟后调用
};

Handler.sendRewardOfFriendChart = function () {     //好友榜发奖
    var climbRewardTemplate = templateManager.GetTemplateByID('ClimbRewardTemplate', 510001);
    if (!climbRewardTemplate) {
        logger.error('The charts award prizes error : No template');
        return;
    }
    var itemID = climbRewardTemplate['itemID_0'] || 0;
    var itemBaseNum = climbRewardTemplate['itemNum_0'] || 0;
    //var itemRandomNum = climbRewardTemplate['itemNum_1'] || 0;
    logger.warn('climbRoleList is %j ', climbRoleList.length);
    var sendFriMail = function () {
        var mailDetails = [];
        for (var i = 0; i < defaultValues.climbChartPerSend; i++) {
            if (climbRoleList.length <= 0) {
                break;
            }
            var climbInfo = climbRoleList.splice(0, 1);
            var itemNum = itemBaseNum + 100 * climbInfo[0].ceng;
            var mailDetail = {
                recvID: +climbInfo[0].roleID,
                subject: stringValue.sPublicString.mailTitle_1,
                mailType: gameConst.eMailType.System,
                content: util.format(sChartString.content_2, itemNum),//'您的万魔塔闯关奖励金币：' + itemNum,
                items: [
                    [itemID, itemNum]
                ]
            };
            mailDetails.push(mailDetail);
            if (mailDetails.length >= 30) {
                pomelo.app.rpc.ms.msRemote.SendMails(null, mailDetails, utils.done);
                mailDetails = [];
            }
        }
        if (mailDetails.length > 0) {
            pomelo.app.rpc.ms.msRemote.SendMails(null, mailDetails, utils.done);
        }else{
            return;
        }
        setTimeout(sendFriMail, 1000);
    };
    sendFriMail();
};

/**
 * 获取好友爬塔跨服好友SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getZSetName = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':climb@' + serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取好玩家信息SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getRoleZSetName = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':roleInfo@' + serverUid + ':' + pomelo.app.getMaster().port;
};
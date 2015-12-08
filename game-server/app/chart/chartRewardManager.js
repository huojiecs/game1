/**
 * 用于排行榜发奖 奖励表存库的通用接口
 * */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../tools/constValue');
var Handler = module.exports;
var _ = require('underscore');
var defaultValues = require('../tools/defaultValues');
var config = require('../tools/config');
var redisManager = require('./redisManager');
var utilSql = require('../tools/mysql/utilSql');
var utils = require('../tools/utils');
var Q = require('q');
var util = require('util');
var errorCodes = require('./../tools/errorCodes');

var eRedisClientType = gameConst.eRedisClientType;

/** 排行榜奖励表名称*/
var CHART_REWARD_TABLE_NAME = 'chartreward';

/**
 * 排行榜奖励管理器 暂时只有奖励结算
 *
 * */
Handler.Init = function () {

    /** 排行榜对应 setName*/
    this.setNameMap = {};
    this.setUnionNameMap = {};

    /** 荣誉排行榜 */
    /*  this.setNameMap[gameConst.eChartType.Honor] =
     config.redis.chart.zsetName + ':honor@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;*/

    /** 战力排行榜*/
    this.setNameMap[gameConst.eChartType.Zhanli] =
    config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    /** ...*/

    this.setUnionNameMap[gameConst.eChartType.UnionScore] =
    config.redis.chart.zsetName + ':unionHel@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    /** 婚姻 姻缘值排行榜*/
    this.setUnionNameMap[gameConst.eChartType.Marry] =
        config.redis.chart.zsetName + ':marry@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 每天刷新一次 排行榜奖励结算 使用
 * */
Handler.balance = function (callback) {
    var self = this;
    var chartKeys = _.keys(this.setNameMap);
    var client = redisManager.getClient(eRedisClientType.Chart);
    if (!client) {
    /** 为什么会出现呢！不应该出现的啊！！*/
        logger.warn("chart get redis client null!!!");
        return callback(errorCodes.SystemWrong);
    }
    /** 对所有排行榜进行结算 一个排行榜结算完成才进行下一个排行榜结算 减少性能压力*/
    return Q.until(function () {
        /** 获取前2000 的玩家*/
        var chartType = chartKeys.shift();
        return self.balanceOneChart(client, chartType, self.setNameMap)
            .then(function () {
                      var flag = chartKeys.length == 0;
                      if (flag) {
                          callback();
                      }
                      return flag;
                  })
            .catch(function (err) {
                       var flag = chartKeys.length == 0;
                       if (flag) {
                           callback(err);
                       }
                       return flag;
                   });

    });
};

/** 每周刷新一次的 公会排行榜  和 婚姻 姻缘值排行榜 公用*/
Handler.balanceUnionRank = function (callback) {
    var self = this;
    var chartKeys = _.keys(this.setUnionNameMap);
    var client = redisManager.getClient(eRedisClientType.Chart);
    if (!client) {
        /** 为什么会出现呢！不应该出现的啊！！*/
        logger.warn("chart get redis client null!!!");
        return callback(errorCodes.SystemWrong);
    }
    /** 对所有排行榜进行结算 一个排行榜结算完成才进行下一个排行榜结算 减少性能压力*/
    return Q.until(function () {
        /** 获取前2000 的玩家*/
        var chartType = chartKeys.shift();
        return self.balanceOneChart(client, chartType, self.setUnionNameMap)
            .then(function () {
                var flag = chartKeys.length == 0;
                if (flag) {
                    callback();
                }
                return flag;
            })
            .catch(function (err) {
                var flag = chartKeys.length == 0;
                if (flag) {
                    callback(err);
                }
                return flag;
            });

    });
};


/**
 * 对一个排行榜进行结算
 *
 * @param {Object} client redis客户端连接
 * @param {Number} chartType 要结算的排行榜类型
 * @api public
 * */
Handler.balanceOneChart = function (client, chartType, names) {
    var deferred = Q.defer();
    try {
        client.zRevRange(names[chartType], 0, defaultValues.ChartRewardNumber)
            .then(function (ranks) {
                      if(chartType == gameConst.eChartType.UnionScore){
                          return enterToUnionRankToDB(ranks, chartType, CHART_REWARD_TABLE_NAME);
                      }else if(chartType == gameConst.eChartType.Marry){
                          return enterToMarryDB(ranks, chartType, CHART_REWARD_TABLE_NAME);
                      }
                      else{
                          return enterBalanceToDB(ranks, chartType, CHART_REWARD_TABLE_NAME);
                      }
                  })
            .then(function () {
                      return  deferred.resolve();
                  })
            .catch(function (err) {
                       logger.error("balanceOneChart chartType: %d failed: %s", chartType,
                                    utils.getErrorMessage(err));
                       return deferred.reject(err);
                   });
        return deferred.promise;
    }
    catch (err) {
        logger.error(util.inspect(err));
    }


};

/**
 * 将一个排行结算结果插入数据库
 * @param {Array} chartList 前2000 玩家数据
 * @param {Number} chartType 排行榜类型
 * @param {String} tableName 存储数据库表名称
 * @api private
 * */

var enterToUnionRankToDB = function (chartList, chartType, tableName){
    var rank1 = 1;
    for (var i = 0; i < chartList.length; i++) {
        var unionID1 = chartList[i];
        var saveUnionRank = function(unionID, rank){
            pomelo.app.rpc.us.usRemote.saveRoleUnionRank(null, unionID, function(err, roleList, bossID){
                for(var roleID in roleList){
                    var args = [roleID, chartType, rank, utilSql.DateToString(new Date()),  _.contains(bossID, roleID) ? 1 : 0];
                    utilSql.SaveChartRewardList(tableName, roleID, chartType, [args], function(err){

                    });
                }
            });
        }
        saveUnionRank(unionID1, rank1);
        ++rank1;
    }
}

 var enterBalanceToDB = function (chartList, chartType, tableName) {
    var deferred = Q.defer();
    /** 每次存100个，返回来后 再进行第二次存储 减少数据库连接压力*/

    var rank = 1;
    return Q.until(function () {
        var jobs = [];
        for (var i = 0; i < 100 && chartList.length != 0; i++) {
            var roleID = chartList.shift();

            var args = [roleID, chartType, rank++, utilSql.DateToString(new Date()), 0];
            jobs.push(
                Q.ninvoke(utilSql, 'SaveChartRewardList', tableName, roleID, chartType, [args])
            );
        }
        return Q.all(jobs)
            .then(function () {
                      var flag = chartList.length === 0;
                      if (flag) {
                          deferred.resolve();
                      }
                      return flag;
                  })
            .catch(function (err) {
                       logger.error("enterBalanceToDB failed: %s",
                                    utils.getErrorMessage(err));
                       return false;
                   });
    });

    return deferred.promise;
};


/** 将姻缘排行榜 插入可领奖数据库表 */
var enterToMarryDB = function (chartList, chartType, tableName) {
    var deferred = Q.defer();
    /** 每次存100个，返回来后 再进行第二次存储 减少数据库连接压力*/

    var rank = 1;
    return Q.until(function () {
        var jobs = [];
        for (var i = 0; i < 100 && chartList.length != 0; i++) {
            var roleID = chartList.shift();//此处是夫妻两人的记录
            var roles = roleID.split("+");
            var rankNow = rank++;
            var args = [roles[0], chartType, rankNow, utilSql.DateToString(new Date()), 0];
            var args2 = [roles[1], chartType, rankNow, utilSql.DateToString(new Date()), 0];
            jobs.push(
                Q.ninvoke(utilSql, 'SaveChartRewardList', tableName, roles[0], chartType, [args]),
                Q.ninvoke(utilSql, 'SaveChartRewardList', tableName, roles[1], chartType, [args2])
            );
        }
        return Q.all(jobs)
            .then(function () {
                var flag = chartList.length === 0;
                if (flag) {
                    deferred.resolve();
                }
                return flag;
            })
            .catch(function (err) {
                logger.error("enterToMarryDB failed: %s",
                    utils.getErrorMessage(err));
                return false;
            });
    });

    return deferred.promise;
};
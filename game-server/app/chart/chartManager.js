/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-11-14
 * Time: 下午2:33
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartZhanli = require('./chartZhanli');
var chartAcrossZhanli = require('./chartAcrossZhanli');
var chartHonor = require('./chartHonor');
var chartClimb = require('./chartClimb');
var chartSoul = require('./chartSoul');
var chartAres = require('./chartAres');
var chartSoulPvp = require('./chartSoulPvp');
var chartUnion = require('./chartUnion');
var chartAwardScore = require('./chartAwardScore');
var chartRecharge = require('./chartRecharge');
var chartUnionScore = require('./chartUnionScore');
var chartChestPoint = require('./chartChestPoint');
var chartWorldBoss = require('./chartWorldBoss');
var chartPet = require('./chartPet');
var chartStoryScore = require('./chartStoryScore');
var errorCodes = require('../tools/errorCodes');
var utils = require('../tools/utils');
var gameConst = require('../tools/constValue');
var chartSql = require('../tools/mysql/chartSql');
var globalFunction = require('../tools/globalFunction');
var csSql = require('../tools/mysql/csSql');
var gmSql = require('../tools/mysql/gmSql');
var utilSql = require('../tools/mysql/utilSql');
var playerManager = require('../cs/player/playerManager');
var chartJJC = require('./chartJJC');
var chartMarry = require('./chartMarry');
var async = require('async');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;


Handler.Init = function () {
    Handler.chartBlackMap = {};
    Handler.forbidChartMap = {};
    var jobs = [Q.ninvoke(chartSql, 'ChartLoadBlackList'), Q.ninvoke(gmSql, 'GetForbidChartTime')];
    return Q.all(jobs)
        .spread(function (roleList, forbidList) {
                    var nowDate = new Date();
                    _.each(roleList, function (info) {
                        Handler.chartBlackMap[info.roleID] = true;
                    });
                    _.each(forbidList, function (info) {
                        var forbidChart = JSON.parse(info.forbidChart);
                        _.each(forbidChart, function (value, key) {
                            if (nowDate < new Date(value)) {
                                if (Handler.forbidChartMap[info.roleID] == null) {
                                    Handler.forbidChartMap[info.roleID] = {};
                                }
                                Handler.forbidChartMap[info.roleID][key] = new Date(value);
                            }
                        });
                    });
                });
};

Handler.IsInBlackList = function (roleID) {
    return _.has(Handler.chartBlackMap, roleID);
};

Handler.IsInForbidList = function (roleID, type) {
    if (Handler.forbidChartMap[roleID] && Handler.forbidChartMap[roleID][type]) {
        if (new Date() < new Date(Handler.forbidChartMap[roleID][type])) {
            return true;
        }
    }
    return false;
};

Handler.AddBlackList = function (roleID) {
    Handler.chartBlackMap[roleID] = true;

    chartZhanli.RemovePlayerScore(roleID, utils.done);
    chartHonor.RemovePlayerScore(roleID, utils.done);
    chartClimb.RemovePlayerScore(roleID, utils.done);
    chartAwardScore.RemovePlayerScore(roleID, utils.done);
    chartRecharge.RemovePlayerScore(roleID, utils.done);
    chartSoul.RemovePlayerScore(roleID, utils.done);
    chartAres.RemovePlayerScore(roleID, utils.done);
    chartSoulPvp.RemovePlayerScore(roleID, utils.done);
    chartAcrossZhanli.RemovePlayerScore(roleID, utils.done);
    chartUnionScore.RemovePlayerScore(roleID, utils.done);
    chartChestPoint.RemovePlayerScore(roleID, utils.done);
	chartJJC.RemovePlayerScore(roleID, utils.done);
    chartMarry.RemovePlayerScore(roleID, utils.done);
	chartStoryScore.RemovePlayerScore(roleID, utils.done);
    pomelo.app.rpc.ps.psRemote.AddBlackList(null, roleID, utils.done);

    return Q.ninvoke(chartSql, 'ChartAddBlackList', roleID);
};

/***
 *获取jjc 排行榜
 * @param {number} roleID  获取排行榜的玩家id
 * @param {number} chartType 排行榜类型
 * @param {number} curPage 当前页
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.GetJJCChart = function (roleID, chartType, curPage, callback) {
    if (chartType === gameConst.eChartType.JJC) {
        return chartJJC.GetChart(roleID, chartType, curPage, callback);
    }
    if (chartType === gameConst.eChartType.FriendJJC) {
        return chartJJC.GetFriChart(roleID, chartType, curPage, callback);
    }
    return callback(null, {result: errorCodes.ParameterWrong});
};

/**
 * 获取排行榜前一位的相差值
 *
 * @param {Number} roleID 查询玩家id
 * @param {Number} chartType 排行榜类型
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.GetDiffer = function (roleID, chartType, callback) {
    if (chartType === gameConst.eChartType.Honor) {
        return chartHonor.GetDiffer(roleID, callback);
    }
    /*  if (chartType === gameConst.eChartType.Soul) {
     return chartSoul.GetDiffer(roleID, callback);
     }*/
    return callback(errorCodes.ParameterWrong);
};

Handler.GetChart = function (roleID, chartType, callback) {
    var self = this;
    if (chartType === gameConst.eChartType.Zhanli) {
        return chartZhanli.GetChart(roleID, chartType, callback);
    }

    if (chartType === gameConst.eChartType.Honor) {
        return chartHonor.GetChart(roleID, chartType, callback);
    }

    if (chartType === gameConst.eChartType.AwardScore) {
        return chartAwardScore.GetChart(roleID, chartType, callback);
    }

    if (chartType === gameConst.eChartType.Recharge) {
        return chartRecharge.GetChart(roleID, chartType, callback);
    }

    if (chartType === gameConst.eChartType.UnionScore) {
        return chartUnionScore.GetChart(roleID, chartType, callback);
    }
    
    if (chartType === gameConst.eChartType.Pet) {
        return chartPet.GetChart(roleID, chartType, callback);
    }
    
    if (chartType === gameConst.eChartType.ChestPoint) {
        return chartChestPoint.GetChart(roleID, chartType, callback);
    }
    
    if (chartType === gameConst.eChartType.WorldBoss) {
        return chartWorldBoss.GetChart(roleID, chartType, callback);
    }

    if (chartType === gameConst.eChartType.Marry) {
        return chartMarry.GetChart(roleID, chartType, callback);
    }

	if (chartType === gameConst.eChartType.StoryScore) {
        return chartStoryScore.GetChart(roleID, chartType, callback);
    }
    return callback(null, {result: errorCodes.ParameterWrong});
};

Handler.GetClimbChart = function (roleID, chartType, callback) {
    if (chartType === gameConst.eChartType.Climb) {
        return chartClimb.GetChart(roleID, chartType, callback);
    }
    if (chartType === gameConst.eChartType.FriendClimb) {
        return chartClimb.GetFriClimbChart(roleID, chartType, callback);
    }
    return callback(null, {result: errorCodes.ParameterWrong});
};

/***
 * 获取邪神排行榜
 *
 * @param {Number} roleID 玩家id
 * @param {Number} chartType  排行榜类型 7
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.GetSoulChart = function (roleID, chartType, callback) {
    if (chartType === gameConst.eChartType.Soul) {
        return chartSoul.GetChart(roleID, callback);
    }
    return callback(errorCodes.ParameterWrong);
};

/***
 * 获取婚姻 姻缘值排行榜
 *
 * @param {Number} roleID 玩家id
 * @param {Number} chartType  排行榜类型 7
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.GetMarryChart = function (roleID, chartType, callback) {
    if (chartType === gameConst.eChartType.Marry) {
        return chartMarry.GetChart(roleID, callback);
    }
    return callback(errorCodes.ParameterWrong);
};


/***
 * 获取邪神竞技场排行榜
 *
 * @param {Number} roleID 玩家id
 * @param {Number} chartType  排行榜类型 7
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.GetSoulPvpChart = function (roleID, chartType, callback) {
    if (chartType === gameConst.eChartType.SoulPvp) {
        return chartSoulPvp.GetChart(roleID, callback);
    }
    return callback(errorCodes.ParameterWrong);
};

/***
 * 获取跨服排行榜
 *
 * @param {Number} roleID 玩家id
 * @param {Number} chartType  排行榜类型 0 战力
 * @param {Function} callback 回调函数
 * @api public
 * */
Handler.getAcrossChart = function (roleID, chartType, callback) {
    if (chartType === gameConst.eAcrossChartType.Zhanli) {
        return chartAcrossZhanli.GetChart(roleID, chartType, callback);
    }
    return callback(errorCodes.ParameterWrong);
};

Handler.GetUnionChart = function (roleID, unionID, callback) { //工会排行帮
    return chartUnion.GetChart(roleID, unionID, callback);
};

Handler.GetUnionScoreChart = function (roleID, unionID, callback) { //工会排行帮
    return chartUnionScore.GetChart(roleID, unionID, callback);
};

Handler.countOfHonorReward = function (callback) {
    chartHonor.GetHonorRankingList(function (err, chartList) {
        if (!!err || !chartList) {
            logger.error("error when countOfHonorReward %s %j",
                         utils.getErrorMessage(err), chartList);
            return;
        }
        /** 每次存100个，返回来后 再进行第二次存储 减少数据库连接压力*/
        var rank = 1;
        return Q.until(function () {
            var jobs = [];
            for (var i = 0; i < 100 && chartList.length != 0; i++) {
                var roleID = chartList.shift();
                jobs.push(
                    Q.ninvoke(utilSql, 'SaveList', 'chartprize', roleID, [
                        [roleID, rank++, new Date(), new Date(0)]
                    ])
                );
            }
            return Q.all(jobs)
                .then(function () {
                          var flag = chartList.length === 0;
                          if (flag) {
                              callback();
                          }
                          return flag;
                      })
                .catch(function (err) {
                           logger.error("countOfHonorReward failed: %s",
                                        utils.getErrorMessage(err));
                           return false;
                       });
        });
    });
};

/**
 * @return {string}
 */
Handler.GetSqlStr = function (HonorRole) {  //数据库保存
    var strInfo = '(';
    for (var t in HonorRole) {
        if (t < HonorRole.length - 1) {
            if (typeof (HonorRole[t]) == 'string') {
                strInfo += "'" + HonorRole[t] + "',";
            } else {
                strInfo += HonorRole[t] + ',';
            }
//            strInfo += mineInfo[t] + ',';
        } else {
            strInfo += '\'' + HonorRole[t] + '\')';
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(HonorRole));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }
    return sqlString;
};

//    "Type" : ,          /* 榜单类型（1 炼狱榜，2 荣誉榜，3战力榜，4魔塔榜，5邪神榜，6活动榜，99全选） */
Handler.ClearChartData = function (roleID, type) {  //清零排行榜数据
    if (type == 2 || type == 99) {
        chartHonor.RemovePlayerScore(roleID, utils.done);
    }
    if (type == 3 || type == 99) {
        chartZhanli.RemovePlayerScoreForBan(roleID, utils.done);
        /**  跨服战力排行榜*/
        chartAcrossZhanli.RemovePlayerScoreForBan(roleID, utils.done);
    }
    if (type == 4 || type == 99) {
        chartClimb.RemovePlayerScore(roleID, utils.done);
    }
    if (type == 5 || type == 99) {
        chartSoul.RemovePlayerScore(roleID, utils.done);
    }
    if (type == 6 || type == 99) {
        chartAwardScore.RemovePlayerScore(roleID, utils.done);
        chartRecharge.RemovePlayerScore(roleID, utils.done);
        chartChestPoint.RemovePlayerScore(roleID, utils.done);
    }

    if (type == 17 || type == 99) {
        chartStoryScore.RemovePlayerScore(roleID, utils.done);
    }

    //chartAres.RemovePlayerScore(roleID, utils.done);
    //chartSoulPvp.RemovePlayerScore(roleID, utils.done);
};

Handler.GetForbidTime = function (roleID) {
    return Handler.forbidChartMap[roleID];
};

//    "Type" : ,          /* 榜单类型（1 炼狱榜，2 荣誉榜，3战力榜，4魔塔榜，5邪神榜，6活动榜，99全选） */
Handler.SetForbidTime = function (roleID, type, dateStr) {
    if (type == 2 || type == 99) {
        chartHonor.RemovePlayerScore(roleID, utils.done);
    }
    if (type == 3 || type == 99) {
        chartZhanli.RemovePlayerScoreForBan(roleID, utils.done);
        /**  跨服战力排行榜*/
        chartAcrossZhanli.RemovePlayerScoreForBan(roleID, utils.done);
    }
    if (type == 4 || type == 99) {
        chartClimb.RemovePlayerScore(roleID, utils.done);
    }
    if (type == 5 || type == 99) {
        chartSoul.RemovePlayerScore(roleID, utils.done);
    }
    if (type == 6 || type == 99) {
        chartAwardScore.RemovePlayerScore(roleID, utils.done);
        chartRecharge.RemovePlayerScore(roleID, utils.done);
        chartChestPoint.RemovePlayerScore(roleID, utils.done);
    }

    if (type == 17 || type == 99) {
        chartStoryScore.RemovePlayerScore(roleID, utils.done);
    }

    // 先做不了禁炼狱榜，先剔除
    if (type != 1) {
        if (Handler.forbidChartMap[roleID] == null) {
            Handler.forbidChartMap[roleID] = {};
        }
        Handler.forbidChartMap[roleID][type] = new Date(dateStr);
        pomelo.app.rpc.ps.psRemote.AddForbidChartInfo(null, roleID, type, dateStr, utils.done);
    }
};
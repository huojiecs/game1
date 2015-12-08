/**
 * Created by xykong on 2014/7/12.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartZhanli = require('../../../chart/chartZhanli');
var chartAcrossZhanli = require('../../../chart/chartAcrossZhanli');
var chartHonor = require('../../../chart/chartHonor');
var chartClimb = require('../../../chart/chartClimb');
var chartJJC = require('../../../chart/chartJJC');
var chartAwardScore = require('../../../chart/chartAwardScore');
var chartStoryScore = require('../../../chart/chartStoryScore');
var chartRecharge = require('../../../chart/chartRecharge');
var chartChestPoint = require('../../../chart/chartChestPoint');
var chartWorldBoss = require('../../../chart/chartWorldBoss');
var chartSoul = require('../../../chart/chartSoul');
var chartJJC = require('../../../chart/chartJJC');
var chartMarry = require('../../../chart/chartMarry');
var chartAres = require('../../../chart/chartAres');
var chartSoulPvp = require('../../../chart/chartSoulPvp');
var gameConst = require('../../../tools/constValue');
var chartManager = require('../../../chart/chartManager');
var idipUtils = require('../../../tools/idipUtils');
var config = require('./../../../tools/config');
var redisManager = require('../../../chart/redisManager');
var detailUtils = require('../../../tools/redis/detailUtils');
var utils = require('../../../tools/utils');
var Q = require('q');
var _ = require('underscore');
var errorCodes = require('../../../tools/errorCodes');
var pvpRedisManager = require('../../../../app/pvp/redis/pvpRedisManager.js');

var eRedisClientType = gameConst.eRedisClientType;


module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.UpdateZhanli = function (roleInfo, callback) {
    chartZhanli.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};

handler.UpdateHonor = function (roleInfo, callback) {
    chartHonor.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};
handler.UpdateWorldBoss = function (roleInfo, callback) {
    chartWorldBoss.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};

handler.UpdateMarry = function (roleInfo, callback) {
    chartMarry.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};

handler.UpdateClimbScore = function (roleInfo, callback) {
    chartClimb.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};

handler.UpdateStoryScore = function (roleInfo, callback) {
    chartStoryScore.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};

handler.RemovePlayerScore = function (roleID, callback) {
    chartZhanli.RemovePlayerScore(roleID, function (err, res) {
        chartHonor.RemovePlayerScore(roleID, function (err, res) {
            chartClimb.RemovePlayerScore(roleID, function (err, res) {
                chartAwardScore.RemovePlayerScore(roleID, function (err, res) {
                    chartRecharge.RemovePlayerScore(roleID, function (err, res) {
                        chartSoul.RemovePlayerScore(roleID, function (err, res) {
                            chartAres.RemovePlayerScore(roleID, function (err, res) {
                                chartSoulPvp.RemovePlayerScore(roleID, function (err, res) {
                                    chartAcrossZhanli.RemovePlayerScore(roleID, function (err, res) {
                                        chartChestPoint.RemovePlayerScore(roleID, function (err, res) {
                                            chartWorldBoss.RemovePlayerScore(roleID, function (err, res) {
                                                chartJJC.RemovePlayerScore(roleID, function (err, res) {
                                                    chartMarry.RemovePlayerScore(roleID, function (err, res) {
													 chartStoryScore.RemovePlayerScore(roleID, function (err, res) {
                                                        var client = redisManager.getClient(eRedisClientType.Chart);
                                                        var hGet = Q.nbind(client.client.hget, client.client);
                                                        var zRem = Q.nbind(client.client.zrem, client.client);
                                                        var jobs = [hGet(redisManager.getRoleDetailSetName(), roleID)];
                                                        Q.all(jobs)
                                                            .then(function (data) {
                                                                if (data[0] != null) {
                                                                    var rData = detailUtils.unzip(data);
                                                                    var oldPetList = rData.petList;
                                                                    var zremJobs = [];
                                                                    for (var i in oldPetList) {
                                                                        var key = roleID + '+' + oldPetList[i].petID;
                                                                        zremJobs.push(zRem(redisManager.getPetZsetName(),
                                                                            key));
                                                                    }
                                                                    if (_.isEmpty(zremJobs)) {
                                                                        return Q.resolve([]);
                                                                    }
                                                                    return Q.all(zremJobs);
                                                                } else {
                                                                    return Q.resolve([]);
                                                                }
                                                            })
                                                            .then(function () {
                                                                return callback(null);
                                                            })
                                                            .catch(function (err) {
                                                                if (!!err) {
                                                                    logger.error('refreshDetailToRedis error: %s',
                                                                        utils.getErrorMessage(err));
                                                                }
                                                            })
                                                            .done();
                                                    });
												 });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

handler.GetPlayerHonorRank = function (roleID, callback) {
    chartHonor.GetPlayerRank(roleID, function (err, res) {
        return callback(err, res);
    })
};

/**
 * 排行榜更新 credits jjc 积分
 * @param {object} roleInfo {roleID, credits}
 * @param {callback} 回调函数
 * */
handler.UpdateCredits = function (roleInfo, callback) {
    chartJJC.UpdatePlayerScore(roleInfo, function (err, res) {
        return callback(null);
    });
};

/**
 * 获取指定玩家积分排名
 * @param {number} roleID 查询玩家id
 * @param {callback} 回调函数
 * */
handler.GetPlayerCreditsRank = function (roleID, callback) {
    chartJJC.GetPlayerRank(roleID, function (err, res) {
        return callback(err, res);
    })
};

handler.GetChart = function (roleID, chartType, callback) {
    if (chartType == gameConst.eChartType.AwardScore) {
        chartAwardScore.GetChart(roleID, chartType, callback);
    }
    else if (chartType == gameConst.eChartType.Recharge) {
        chartRecharge.GetChart(roleID, chartType, callback);
    }
    else if (chartType == gameConst.eChartType.Zhanli) {
        chartZhanli.GetChart(roleID, chartType, callback);
    }
    else if (chartType == gameConst.eChartType.ChestPoint) {
        chartChestPoint.GetChart(roleID, chartType, callback);
    }
    else if (chartType == gameConst.eChartType.WorldBoss) {
        chartManager.GetChart(roleID, chartType, callback);
    }
    else if (chartType == gameConst.eChartType.Marry) {
        chartManager.GetChart(roleID, chartType, callback);
    }
};

handler.SetForbidTime = function (roleID, type, dateStr, callback) {
    chartManager.SetForbidTime(roleID, type, dateStr);
    return callback();
};

handler.idipCommands = function (data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);

    var chartCommands = require('../../../adminCommands/chartCommands');

    idipUtils.dispatchIdipCommands(chartCommands, data_packet, callback);
};

/**
 * @Brief: 从登陆服更新服务器列表
 * ----------------------------
 *
 * @param {Number} serverList 服务器列表
 * @param callback
 * @constructor
 */
handler.refreshServerList = function (serverList, callback) {
    config.gameServerList.list = serverList;
    return callback();
};

/**
 * @Brief: 获取自己好友排行榜排名
 * ---------------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback
 * */
handler.GetJJCFriRanking = function (roleID, callback) {
    chartManager.GetJJCChart(roleID, gameConst.eChartType.FriendJJC, 1, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);
        if (!!result) {
            return callback(null, {result: result});
        }

        return callback(null, {result: result, ranking: chartInfo['myRanking']});
    });
};


/**
 * @Brief: 离婚后 删除姻缘值排行榜
 * ----------------------------
 *
 * @param {Number} serverList 服务器列表
 * @param callback
 * @constructor
 */
handler.deleteMarryChart = function (roleID, callback) {
    chartMarry.RemovePlayerScore(roleID, callback);
};

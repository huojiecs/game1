/**
 * Created by eder on 2014/10/15.
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
/**世界boss排行榜*/
Handler.Init = function () {
    var self = this;

    self.zsetName =
        config.redis.chart.zsetName + ':worldBoss@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
        config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.eachLoadPlayer = 1000;
    self.scoreName = 'worldBoss';

    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    self.playerMap = {};

    logger.info('Use redis %s:%d zsetname name:%s', config.redis.chart.host, config.redis.chart.port, self.zsetName);

    return Q.resolve();

};

Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        var roleID = player['roleID'];
        if (!chartManager.IsInBlackList(roleID)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.OP_ACT)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
            multi.zadd(self.zsetName, +player[self.scoreName], roleID, function (err, count) {
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
    if (chartManager.IsInBlackList(roleID)) {
        return callback();
    }

    if (chartManager.IsInForbidList(roleID, eForbidChartType.WORLDBOSS)
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
    return this.AddPlayerScore(roleInfo.roleID, roleInfo.score || 0, callback);
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
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var zScore = Q.nbind(self.client.zscore, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);

    var scores = {};
    var chartInfo = {
        myChartID:0,
        myScore:0,
        rankList:[]
    };
    var jobs = [zRevRank(self.zsetName, roleID), zScore(self.zsetName, roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
            chartInfo['myChartID'] = (rank || 0) + 1;
            chartInfo['myScore'] = parseInt(score);
            return zRevRange(self.zsetName, 0, defaultValues.chartWorldBossTopListCount - 1, 'WITHSCORES');
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
                newRole.score = scores[newRole.roleID];
                return {
                    id: newRole.id,
                    roleID:newRole.roleID,
                    name: newRole.name,
                    expLevel: newRole.expLevel,
                    zhanli:newRole.zhanli,
                    damage: parseInt(newRole.score)
                };
            });
            chartInfo['rankList'] = rankList;
            chartInfo['myScore'] = !!chartInfo['myScore']?chartInfo['myScore']:0;
            chartInfo['myChartID'] = !!chartInfo['myScore']?chartInfo['myChartID']:0;
            logger.fatal('======chartInfo====%j',chartInfo);
            return callback(null, chartInfo);
        })
        .catch(function (err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return callback(err);
        })
        .done();
};



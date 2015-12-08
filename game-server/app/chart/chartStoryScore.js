/**
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./chartManager');
var chartSql = require('../tools/mysql/chartSql');
var config = require('../tools/config');
var utils = require('../tools/utils');
var defaultValues = require('../tools/defaultValues');
var errorCodes = require('../tools/errorCodes');
var Q = require('q');
var gameConst = require('../tools/constValue');
var redis = require("redis");
var _ = require('underscore');
var redisManager = require('../cs/chartRedis/redisManager');
var detailUtils = require('../tools/redis/detailUtils');
var templateManager = require('../tools/templateManager');
var events = require('events');
var offlinePlayer = require('../ps/player/offlinePlayer');

var eForbidChartType = gameConst.eForbidChartType;
var ePlayerInfo = gameConst.ePlayerInfo;
var eRedisClientType = gameConst.eRedisClientType;


var Handler = module.exports;
var event = new events.EventEmitter();

Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.zsetName =
        config.redis.chart.zsetName + ':story@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.zsetZhanli =
        config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
        config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.eachLoadPlayer = 300;
    self.scoreName = 'storyScore';
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
            del(self.zsetName)
        ];
        Q.all(jobs)
            .then(function () {
                var dbLoopCount = config.mysql.global.loopCount;
                return Q.until(function () {
                    --dbLoopCount;
                    var lastRoleID = 0;
                    return Q.until(function () {
                        return Q.ninvoke(chartSql, 'ChartLoadStory', dbLoopCount, lastRoleID)
                            .then(function (players) {
                                self.AddPlayers(players);
                                logger.info("ChartLoadStory load player: %s", players.length);

                                if (players.length > 0) {
                                    lastRoleID = players[players.length - 1]['roleID'];
                                }

                                /** 判断该服玩家数据是否读取完毕*/
                                return players.length < self.eachLoadPlayer;
                            })
                            .catch(function (err) {
                                logger.error("ChartLoadStory failed: %s", utils.getErrorMessage(err));
                                return true;
                            });
                    }).then(function () {
                        /** 所有数据库读取完毕结束条件*/
                        return dbLoopCount === 0;
                    });
                })
            })
            .finally(function () {
                return deferred.resolve();
            })
            .done();
    } else {
        return Q.resolve();
    }

    return deferred.promise;
};

Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Soul Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        var roleID = player['roleID'];
        var zhanli = player['zhanli'];
        var storyScore = player['storyScore'];

        if (!chartManager.IsInBlackList(roleID)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.StoryScore)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
            multi.zadd(self.zsetName, player[self.scoreName], roleID, function (err, count) {
                //self.playerCount += count;
            });
        }
    });

    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};


Handler.AddPlayerScore = function (roleID, score, callback) {
    var self = this;
    if (chartManager.IsInBlackList(roleID)
        || chartManager.IsInForbidList(roleID, eForbidChartType.StoryScore)
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

    var jobs = [
        zrem(self.zsetName, roleID)
    ];

    Q.all(jobs)
        .spread(function (count) {
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
                        newRole.score = scores[newRole.roleID];
                        newRole.zhanli = zhanlis[newRole.roleID] || 0; // 0是为了避免禁战力排行榜时，斩魂榜报错
                        return newRole;
                    }
                } else {
                    return {
                        "roleID": 0,
                        "name": '',
                        "level" : 0,
                        "zhanli": 0,
                        "score" : 0
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


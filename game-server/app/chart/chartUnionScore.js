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
var errorCodes = require('../tools/errorCodes');
var defaultValues = require('../tools/defaultValues');
var templateManager = require('../tools/templateManager');
var templateConst = require('../../template/templateConst');
var async = require('async');
var redis = require("redis");
var Q = require('q');
require('q-flow');  // extends q
var _ = require('underscore');

var Handler = module.exports;

Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.zsetName =
        config.redis.chart.zsetName + ':unionHel@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
//    self.zsetZhanli =
//    config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisUnionInfo =
        config.redis.chart.zsetName + ':unionInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.eachLoadUnion = 1000;
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
                    var lastUnionID = 0;
                    return Q.until(function () {
                        return Q.ninvoke(chartSql, 'ChartLoadUnion', dbLoopCount, lastUnionID)
                            .then(function (unions) {
                                /* code which eventually returns true */
                                logger.info("ChartLoadUnion load union: %s", unions.length);
                                self.AddUnions(unions);
                                if (unions.length > 0) {
                                    lastUnionID = unions[unions.length-1]['unionID'];
                                }
                                return unions.length < self.eachLoadUnion;
                            })
                            .catch(function (err) {
                                logger.error("ChartLoadUnion failed: %s", utils.getErrorMessage(err));
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

Handler.AddUnions = function (unions, callback) {
    var self = this;
    logger.info("Try to AddPlayers count: %d", unions.length);

    var multi = self.client.multi();
    _.each(unions, function (union) {
        var unionID = union['unionID'];
        var unionLeve = union['unionLevel'];
        var unionScore = union['unionScore'];
        var Score =  unionScore * 100 + unionLeve;
        multi.zadd(self.zsetName, Score, unionID, function (err, count) {
        });
        var key = unionID;
        var value = JSON.stringify(union);
        multi.hset(self.redisUnionInfo, key, value);
    });

    // you can re-run the same transaction if you like
    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};
Handler.GetChart = function (roleID, unionID, callback) {
    var self = this;
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);

    var chartID = null;
    var scores = {};
    var result = {
        result: errorCodes.OK,
        unionName: '',
        unionRanking: 0,
        unionScore : 0,
        scoreRank : 0,
        ouccHel : 0
    };
    zRevRank(self.zsetName, unionID)
        .then(function (rank) {
            if (null != rank) {
                chartID = (rank || 0) + 1;
                result['scoreRank'] = chartID;
            }
            return zRevRange(self.zsetName, 0, 50 - 1, 'WITHSCORES');
        })
        .then(function (unionIDs) {
            var keys = [];
            for (var i = 0; i < unionIDs.length; i += 2) {
                keys.push(unionIDs[i]);
                scores[unionIDs[i]] = unionIDs[i + 1];
            }

            if (keys.length === 0) {
                return Q.resolve([]);
            }
            if (unionID > 0) {
                keys.push(unionID);
            }
            return hmGet(self.redisUnionInfo, keys);
        })
        .then(function (unions) {
            var rank = 0;
            var unionTop = unions.length - 1;
            if (0 != result['scoreRank']) {
                var thisUnion = unions[unionTop];
                var playerUnion = JSON.parse(thisUnion);
                result.unionName = playerUnion.unionName;
                result.unionScore = playerUnion.unionScore;
                result.ouccHel = playerUnion.ouccHel;
                unions.splice(unionTop, 1);
            }
            var rankList = _.map(unions, function (union) {
                if(union == null){
                    return;
                }
                var newUnion = JSON.parse(union);
                newUnion['scoreRank'] = ++rank;
                var unionLevel = newUnion.unionLevel;
                var attID = 1000 + unionLevel;
                var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', attID);
                if (!UnionLevelTemplate) {
                    return callback(null, {'result': errorCodes.ParameterNull});
                }
                var maxRoleNum = UnionLevelTemplate[templateConst.tUnionLeve.maxRoleNum];
                newUnion['unionNum'] = maxRoleNum;
                delete newUnion['announcement'];
                delete newUnion['bossID'];
                delete newUnion['unionWeiWang'];
                return newUnion;
            });
            rankList = _.compact(rankList);
            result['chartList'] = rankList;
            return callback(null, result);
        })
        .catch(function (err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return callback(err);
        })
        .done();
};

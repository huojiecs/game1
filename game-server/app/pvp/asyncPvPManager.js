/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午3:54
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var pvpSql = require('../tools/mysql/pvpSql');
var utils = require('../tools/utils');
var config = require('../tools/config');
var async = require('async');
var redis = require("redis");
var Q = require('q');
var gameConst = require('../tools/constValue');
var _ = require('underscore');
var errorCodes = require('../tools/errorCodes');
var defaultValues = require('../tools/defaultValues');


var Handler = module.exports;

Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.honor =
    config.redis.asyncPvP.zsetName + ':honor@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.pvpInfo =
    config.redis.asyncPvP.zsetName + ':pvpInfo@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.firstRange = 100;
    self.scoreName = 'honor';

    self.client = redis.createClient(config.redis.asyncPvP.port, config.redis.asyncPvP.host, {
        auth_pass: config.redis.asyncPvP.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s, %s", err.message, err.stack);
    });

    // self.playerList = {};
    self.updateList = [];
    self.updateNumOnce = 1000;
    self.playerCount = 0;

    // retrieve all player id and score for pvp.
    // here score is honor.

    logger.warn('Use redis %s:%d zsetname name:%s', config.redis.asyncPvP.host, config.redis.asyncPvP.port,
                self.honor);

    if (!!defaultValues.RedisReloadAtStartup) {
        async.series([
                         function (seriesCallback) {
                             self.client.del(self.pvpInfo, function (err, res) {
                                 // remove all value in zset.
                                 self.client.zremrangebyrank(self.honor, 0, -1, function (err, response) {
                                     seriesCallback();
                                 });
                             });
                         },
                         function (seriesCallback) {
                             var jobs = [];
                             for (var i = 0; i < config.mysql.global.loopCount; ++i) {
                                 jobs.push(self.loadOneDataInOneTime(i));
                             }
                             Q.all(jobs)
                                 .then(function () {
                                           seriesCallback();
                                       })
                                 .done();
                         },
                         function (seriesCallback) {
                             logger.info("Save players to redis done!");
                             seriesCallback();
                         }
                     ], function () {
            logger.info("Players add to redis %s : %d", self.honor, self.playerCount);

            return deferred.resolve();
        });
    }
    else {

        var zcount = Q.nbind(self.client.zcount, self.client);

        zcount(self.honor, '-inf', '+inf')
            .then(function (count) {
                      self.playerCount = count;
                      logger.warn("Async PVP load. zset: %s, playerCount: %d", self.honor, self.playerCount);
                  })
            .finally(function () {
                         return deferred.resolve();
                     })
            .done();
    }

    return deferred.promise;
};

/**
 * add one database data
 * */

Handler.loadOneDataInOneTime = function (i) {
    var self = this;
    var deferred = Q.defer();
    var count = 1;
    var lastRoleID = 0;
    async.doUntil(
        function (doCallback) {
            pvpSql.LoadPlayers(i, lastRoleID, function (err, players) {
                self.AddPlayers(players);
                count = players.length;
                if (count > 0) {
                    lastRoleID = players[count-1]["roleID"];
                }
                doCallback(err);
            });
        },
        function () {
            logger.info("async.whilst check count:" + count);
            return count < 100;
        },
        function (err) {
            if (!!err) {
                logger.error("Error while doUntil: %s", utils.getErrorMessage(err));
            }
            return deferred.resolve();
        }
    );
    return deferred.promise;
};

/*
 param : 0 持久化存盘   1 关服存盘
 */
Handler.UpdatePvPInfoToDB = function (type, callback) {
    var self = this;

    if (type == 0) {
        var max = self.updateNumOnce;
    } else {
        var max = self.updateList.length;
    }

    var tempList = self.updateList.splice(0, max);
    tempList = _.uniq(tempList);

    var jobs = _.map(tempList, function (roleID) {
        if (!roleID) {
            return;
        }
        self.GetPlayerPvpInfo(roleID, function (err, info) {
            if (err) {
                logger.error('error when pvp get info for update, %s', utils.getErrorMessage(err));
                return;
            }
            if (_.isEmpty(info)) {
                logger.warn('GetPlayerPvpInfo obj is empty, %d', roleID);
                return callback(errorCodes.NoRole);
            }
            // log for test
            logger.warn('GetPlayerPvpInfo on UpdatePvPInfoToDB, roleID == %d, obj == %j', roleID, info);
            var asyncPvpInfo = '('
                                   + info[gameConst.eAsyncPvPInfo_EX.roleID] + ','
                                   + info[gameConst.eAsyncPvPInfo_EX.attackNum] + ','
                                   + info[gameConst.eAsyncPvPInfo_EX.attackedNum] + ','
                                   + info[gameConst.eAsyncPvPInfo_EX.lostTimes] + ','
                                   + info[gameConst.eAsyncPvPInfo_EX.loseLingli] + ','
                                   + info[gameConst.eAsyncPvPInfo_EX.lingli] + ','
                                   + info[gameConst.eAsyncPvPInfo_EX.honor] + ')';

            pvpSql.SavePvPInfoToDB(info[gameConst.eAsyncPvPInfo_EX.roleID], asyncPvpInfo, function (err) {
                if (err) {
                    logger.error('error when pvp update info to db %d, %s', info[gameConst.eAsyncPvPInfo_EX.roleID],
                                 utils.getErrorMessage(err));
                }
            });
        });
    });
    Q.all(jobs)
        .then(function () {
                  callback();
              })
        .catch(function (err) {
                   logger.error('error when pvp UpdatePvPInfoToDB, %s', utils.getErrorMessage(err));
               })
        .done();
};


Handler.AddPlayers = function (players) {
    var self = this;
    logger.info("Try to AddPlayers count:%d", players.length);

    for (var i in players) {
        var value = JSON.stringify(players[i]);
        self.client.hset(self.pvpInfo, players[i]["roleID"], value, function (err, res) {
            if (err) {
                logger.error("error when pvp AddPvpInfos %d, %s, %s", players[i]["roleID"], value,
                             utils.getErrorMessage(err));
            }
        });

        self.client.zadd(self.honor, players[i][self.scoreName], players[i]["roleID"], function (err, response) {
            if (err) {
                logger.error("error when pvp AddPlayers %d, %d, %j",
                             players[i]["roleID"],
                             players[i][self.scoreName], err);
            }
            self.playerCount += response;
        });
    }
};

Handler.AddPlayerScore = function (roleID, pvpInfo, callback) {
    var self = this;
    var value = JSON.stringify(pvpInfo);

    var hset = Q.nbind(self.client.hset, self.client);
    var zadd = Q.nbind(self.client.zadd, self.client);
    var jobs = [
        hset(self.pvpInfo, pvpInfo['roleID'], value),
        zadd(self.honor, pvpInfo[self.scoreName], roleID)
    ];
    Q.all(jobs)
        .then(function (results) {
                  self.playerCount += results[1];
                  self.updateList.push(roleID);
                  pomelo.app.rpc.chart.chartRemote.UpdateHonor(null, pvpInfo, utils.done);
                  return callback(null);
              })
        .catch(function (err) {
                   logger.error('error when pvp AddPlayerScore %d, %s, %s', roleID, value,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.AddPlayerPvpInfo = function (roleID, pvpInfo, callback) {
    var self = this;
    var value = JSON.stringify(pvpInfo);
    self.client.hset(self.pvpInfo, pvpInfo['roleID'], value, function (err, res) {
        if (!!err) {
            logger.error("error when pvp AddPlayerPvpInfo %d, %j", roleID, err);
            return callback(err);
        }
        self.updateList.push(roleID);
        return callback(null);
    });
};

Handler.UpdatePlayerScore = function (roleID, pvpInfo, callback) {
    Handler.AddPlayerScore(roleID, pvpInfo, callback);
};

Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    self.client.zrem(self.honor, roleID, function (err, response) {
        if (err) {
            logger.error("error when pvp remove player %d, %j", roleID, err);
            return callback(err);
        }

        self.playerCount -= response;
        return callback(null);
    });
};

Handler.RemovePlayerPvpInfo = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);
    var hdel = Q.nbind(self.client.hdel, self.client);
    var jobs = [
        zrem(self.honor, roleID),
        hdel(self.pvpInfo, roleID)
    ];

    Q.all(jobs)
        .then(function (results) {
                  self.playerCount -= results[1];
                  for (var i = 0; i < self.updateList.length; i++) {
                      if (roleID == self.updateList[i]) {
                          self.updateList.splice(i, 1);
                          break;
                      }
                  }
                  return callback(null);
              })
        .catch(function (err) {
                   logger.error("error when pvp RemovePlayerScore %d, %s", roleID, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.GetPlayerPvpInfo = function (roleID, callback) {
    var self = this;
    self.client.hget(self.pvpInfo, roleID, function (err, info) {
        if (err) {
            logger.error('error when pvp get pvpinfo %d, %s', roleID, utils.getErrorMessage(err));
            callback(err);
        }
        var pvpInfo = JSON.parse(info);
        callback(null, pvpInfo);
    });
};

Handler.FindRivals = function (count, roleID, excepts, callback) {
    var self = this;
    var left = count;
    var result = [];
    var retryTimes = count;
    if (Object.keys(excepts).length >= Handler.playerCount) {
        return callback(new Error("no more players"), result);
    }
    async.whilst(
        function () {
            return left > 0;
        },
        function (next) {
            Handler.FindRival(roleID, excepts, function (err, otherID) {
                if (err != null) {
                    logger.info(err);
                    return callback(err);
                }

                if (otherID != null && otherID != 0) {
                    pvpSql.CheckRoleInDB(otherID, function(err, res) {
                        logger.fatal('ttt roleID = %j, res = %j', otherID, res);
                        if((!!err || res == 0) && --retryTimes > 0) {
                            next();
                            excepts[otherID] = true;
                        } else {
                            left -= 1;
                            result.push(otherID);
                            excepts[otherID] = true;
                            next();
                        }
                    });
                }
                else {
                    // we can not find any more, return.
                    left = 0;
                    next();
                }
            });
        },
        function (err) {
            logger.info("FindRivals %d for %d, from %d players, excepts %j, got players: %j", count, roleID,
                        Handler.playerCount, excepts, result);
            callback(err, result);
        }
    );
};

function EnsureValidRival(self, otherID, rank, excepts, callback) {
    var anchor = 0;

    async.whilst(
        function () {
            return (otherID == 0 || otherID in excepts) && anchor < Handler.playerCount;
        },
        function (nextWhilst) {
            rank = (rank + 1) % Handler.playerCount;
            anchor += 1;
            self.client.zrevrange(self.honor, rank, rank, function (err, response) {
                if (err) {
                    throw err;
                }
                if (response == null || response.length == 0) {
                    callback(new Error("Can't find range by given rank:" + rank));
                }
                otherID = Number(response[0]);
                nextWhilst();
            });
        },
        function (err) {
            otherID = anchor == Handler.playerCount ? 0 : otherID;
            callback(null, otherID);
        }
    );

};

function SelectFromRange(self, rankBegin, rankEnd, excepts, callback) {
    var anchor = 0;
    var params = {};
    var otherID = null;

    var rank = rankBegin + Math.floor(Math.random() * (rankEnd - rankBegin));

    self.client.zrevrange(self.honor, rank, rank, function (err, response) {
        if (err) {
            throw err;
        }
        if (response == null || response.length == 0) {
            callback(new Error("Can't find range by given rank:" + rank));
        }

        EnsureValidRival(self, Number(response[0]), rank, excepts, callback);
    });
};

Handler.FindRival = function (roleID, excepts, callback) {
    var self = this;
    async.waterfall([
                        function (next) {
                            /*  var rand = Math.random();
                             if (rand < 0.1 || Handler.playerCount <= self.firstRange) {
                             logger.fatal('------------------- playerCount == %d, firstRange == %d !!!!!', Handler.playerCount, self.firstRange);
                             var params = {};
                             SelectFromRange(self, 0, Math.min(self.firstRange, Handler.playerCount), excepts,
                             function (err, otherID) {
                             callback(null, otherID);
                             });
                             } else {*/
                            self.client.zrevrank(self.honor, roleID, function (err, response) {
                                if (response == null) {
                                    return callback(new Error("Can't find score by given roleID:" + roleID));
                                }
                                next(null, {"rank": response});
                            });
                            //  }
                        },
                        function (params, next) {
                            var self_rank = params["rank"];
                            params["top_rank"] = self_rank - defaultValues.aPvPMatchingUpperLimit >= 0 ?
                                                 self_rank - defaultValues.aPvPMatchingUpperLimit : 0;
                            self.client.zcard(self.honor, function (err, response) {
                                if (response == null) {
                                    callback(new Error("Can't get the zcard"));
                                }
                                params["tail_rank"] = self_rank + defaultValues.aPvPMatchingLowerLimit < response ?
                                                      self_rank + defaultValues.aPvPMatchingLowerLimit :
                                                      response;
                                next(null, params);
                            });
                        },
                        function (params, next) {
                            var rank = Math.floor(Math.random() * (params["top_rank"] - params["tail_rank"])
                                                      + params["higher_rank"]);
                            SelectFromRange(self, params["top_rank"], params["tail_rank"], excepts,
                                            function (err, otherID) {
                                                if (otherID == 0) {
                                                    SelectFromRange(self, 0,
                                                                    Math.min(self.firstRange, Handler.playerCount),
                                                                    excepts, function (err, otherID) {
                                                            next(null, {"otherID": otherID});
                                                        });
                                                }
                                                else {
                                                    next(null, {"otherID": otherID});
                                                }
                                            })
                        }
                    ], function (err, result) {
        // result now equals 'done'
        callback(err, result["otherID"]);
    });
};
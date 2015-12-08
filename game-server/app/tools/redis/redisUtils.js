/**
 * Created by CL on 14-9-12.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var redisManager = require('../../cs/chartRedis/redisManager');
var utils = require('../utils');
var config = require('../config');

var Handler = module.exports;

Handler.AddPlayerClimbScore = function (roleID, score, param, callback) {
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }
    var zsetClimb =
            config.redis.chart.zsetName + ':climb@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    redisManager.AddPlayerChartScore(zsetClimb, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.AddPlayerHonorScore = function (roleID, score, param, callback) {
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }
    var zsethonor =
            config.redis.chart.zsetName + ':honor@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    redisManager.AddPlayerChartScore(zsethonor, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.AddPlayerZhanliScore = function (roleID, score, param, callback) {
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }
    var zsetZhanli =
            config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    redisManager.AddPlayerChartScore(zsetZhanli, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.AddPlayerRechargeScore = function (roleID, score, param, callback) {   //充值榜
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }
    var zsetRecharge =
            config.redis.chart.zsetName + ':recharge@' + pomelo.app.getMaster().host + ':'
            + pomelo.app.getMaster().port;
    redisManager.AddPlayerChartScore(zsetRecharge, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.AddPlayerAwardScore = function (roleID, score, param, callback) {  //抽奖积分榜
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }
    var zsetAward =
            config.redis.chart.zsetName + ':award@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    redisManager.AddPlayerChartScore(zsetAward, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};
/**开启宝箱排行榜*/
Handler.AddPlayerChestsScore = function (roleID, score, param, callback) {
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }

    var zsetChests =
            config.redis.chart.zsetName + ':chestPoint@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    redisManager.AddPlayerChartScore(zsetChests, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.UpdatePlayerClimbScore = function (roleInfo, param, callback) {
    return this.AddPlayerClimbScore(roleInfo.roleID, roleInfo.climbScore || 0, param, callback);
};

Handler.UpdatePlayerHonorScore = function (roleInfo, param, callback) {
    return this.AddPlayerHonorScore(roleInfo.roleID, roleInfo.honor, param, callback);
};

Handler.UpdatePlayerZhanliScore = function (roleInfo, param, callback) {
    var self = this;
    var redisRoleInfo =
            config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    redisManager.UpdatePlayerChartScore(redisRoleInfo, roleInfo, function (err) {
        if (!!err) {
            return callback(err);
        }
        return self.AddPlayerZhanliScore(roleInfo.roleID, roleInfo.zhanli, param, callback);
    });
};

/**
 * @Brief: 战力更新时 更新跨服redis info
 * -----------------------------------
 * @api public
 *
 * @param {Object} roleInfo 玩家跨服查看信息
 * @param {Object} param 黑名单相关
 * @param {Function} callback
 * */
Handler.UpdatePlayerAcrossZhanliScore = function (roleInfo, param, callback) {
    var self = this;

    var redisRoleInfo = config.redis.chart.zsetName + ':roleInfo@across_' +
                        utils.getRegionID(config.list.serverUid) + ':' + 3846;

    redisManager.UpdatePlayerChartScore(redisRoleInfo, roleInfo, function (err) {
        if (!!err) {
            return callback(err);
        }
        return self.AddPlayerAcrossZhanliScore(roleInfo.roleID, roleInfo.zhanli, param, callback);
    });
};

/**
 * @Brief: 战力更新时 更新跨服zhanli
 * -----------------------------------
 * @api public
 *
 * @param {Number} roleID 玩家id
 * @param {Number} score 战力值
 * @param {Object} param 黑名单相关
 * @param {Function} callback
 * */
Handler.AddPlayerAcrossZhanliScore = function (roleID, score, param, callback) {
    if (redisManager.IsInBlackList(roleID)) {
        return callback();
    }

    var zsetZhanli = config.redis.chart.zsetName + ':zhanli@across_' +
                     utils.getRegionID(config.list.serverUid) + ':' + 3846;

    redisManager.AddPlayerChartScore(zsetZhanli, roleID, score, param, function (err, count) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.UpdatePlayerRechargeScore = function (roleInfo, param, callback) {      //更新充值榜
    return this.AddPlayerRechargeScore(roleInfo.roleID, roleInfo.sevenRecharge || 0, param, callback);
};

Handler.UpdatePlayerAwardScore = function (roleInfo, param, callback) {         //更新积分榜
    return this.AddPlayerAwardScore(roleInfo.roleID, roleInfo.score || 0, param, callback);
};

Handler.UpdatePlayerChestsScore = function (roleInfo, param, callback) {        //更新宝箱排行榜

    return this.AddPlayerChestsScore(roleInfo.roleID, roleInfo.chestPoint || 0, param, callback);
};


Handler.RemovePlayerClimbScore = function (roleID, callback) {
    var zsetClimb =
            config.redis.chart.zsetName + ':climb@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    redisManager.RemovePlayerChartScore(zsetClimb, null, roleID, function (err) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.RemovePlayerHonorScore = function (roleID, callback) {
    var zsethonor =
            config.redis.chart.zsetName + ':honor@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    redisManager.RemovePlayerChartScore(zsethonor, null, roleID, function (err) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.RemovePlayerZhanliScore = function (roleID, callback) {
    var zsetZhanli =
            config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    var redisRoleInfo =
            config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    redisManager.RemovePlayerChartScore(zsetZhanli, redisRoleInfo, roleID, function (err) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, count);
    });
};

Handler.RemovePlayerRechargeScore = function (roleID, callback) {        //移除充值榜
    var zsetClimb =
            config.redis.chart.zsetName + ':recharge@' + pomelo.app.getMaster().host + ':'
            + pomelo.app.getMaster().port;
    /*redisManager.RemovePlayerChartScore(zsetClimb, null, roleID, function(err) {
     if(!!err) {
     return callback(err);
     }
     return callback(null, count);
     });*/
};

Handler.RemovePlayerAwardScore = function (roleID, callback) {       //移除积分榜
    var zsetClimb =
            config.redis.chart.zsetName + ':award@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    /*redisManager.RemovePlayerChartScore(zsetClimb, null, roleID, function(err) {
     if(!!err) {
     return callback(err);
     }
     return callback(null, count);
     });*/
};

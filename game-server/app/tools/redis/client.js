/**
 * The file client.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/17 16:54:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var redis = require("redis");
var utils = require('../utils');
var Q = require('q');
var _ = require('underscore');
var playerManager = require('../../../app/cs/player/playerManager');

module.exports = function (host, port, options, owner) {
    return new Handler(host, port, options, owner);
};

/** redis 内存数据库
 *
 *
 * sort set  有序集合
 *
 * */
var Handler = function (host, port, options, owner) {
    /**创建连接*/
    this.client = redis.createClient(port, host, options);
    this.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    this.owner = owner;
};

var handler = Handler.prototype;

handler.SaveString = function (index, value) {
    this.client.set(index, value, function (err, result) {
        if (err) {
            logger.error('存储信息出现问题:%j', err.stack);
        }
    })
};

handler.LoadString = function (index, callback) {
    this.client.get(index, function (err, result) {
        if (err) {
            logger.error('存储信息出现问题:%j', err.stack);
            callback(null, null);
        }
        else {
            callback(null, result);
        }
    })
};

/**
 * zAdd to Sort set 添加数据到有序集合，score 排序列
 * @param {string} redisName
 * @param {number} roleID 玩家ID
 * @param {number} score 有序记录
 * @param {function} callback
 * */
handler.zAdd = function (redisName, roleID, score, callback) {
    var self = this;
    var zadd = Q.nbind(self.client.zadd, self.client);

    if (this.owner.IsInBlackList(roleID)) {
        return callback();
    }

    zadd(redisName, score, roleID)
        .then(function (count) {
                  return callback(null, count);
              })
        .catch(function (err) {
                   logger.error("error when add player %s %d, %d, %s", redisName, roleID, score,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * zAdd to Sort set 添加数据到有序集合，score 排序列, 用于cs中进行排行榜信息修改
 * @param {string} redisName
 * @param {number} roleID 玩家ID
 * @param {number} score 有序记录
 * @param {object} param 额外参数，用于其他
 * @param {function} callback
 * */
handler.chartZadd = function (redisName, roleID, score, param, callback) {
    var self = this;
    var zadd = Q.nbind(self.client.zadd, self.client);

    if (this.owner.IsInBlackList(roleID)) {
        return callback();
    }

    if (param.forbidChart) {
        var forbidChartList = playerManager.GetForbidChartInfo(roleID);
        if (forbidChartList) {
            var forbidChart = param.forbidChart;
            for (var i in forbidChart) {
                if (forbidChartList[forbidChart[i]] && new Date() < new Date(forbidChartList[forbidChart[i]])) {
                    return callback(null, 0);
                }
            }
        }
    }

    zadd(redisName, score, roleID)
        .then(function (count) {
                  return callback(null, count);
              })
        .catch(function (err) {
                   logger.error("error when add player %s %d, %d, %s", redisName, roleID, score,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * get rank from Sort set 从有序集合中获得 序列 序列下标 从1 开始
 * @param {string} redisName
 * @param {number} roleID 玩家ID
 * @param {function} callback
 * */
handler.zRevRank = function (redisName, roleID, callback) {
    var self = this;
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);

    if (this.owner.IsInBlackList(roleID)) {
        return callback();
    }

    zRevRank(redisName, roleID)
        .then(function (rank) {
                  return callback(null, (rank || 0) + 1);
              })
        .catch(function (err) {
                   logger.error("error when add player %s %d, %d, %s", redisName, roleID, score,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * hSet <field, value> to Hash 添加记录到指定hash map 中
 * @param {string} redisName
 * @param {number} filed  记录key
 * @param {object} info 记录值
 * @param {function} callback
 * */
handler.hSet = function (redisName, filed, value, callback) {
    var self = this;

    var hset = Q.nbind(self.client.hset, self.client);

//    var value = JSON.stringify(info);

    hset(redisName, filed, value)
        .then(function () {
                  return callback();
              })
        .catch(function (err) {
                   logger.error("error when hSet player %d, %j, %s", filed, value,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * hmGet <field, value> from Hash 获取多条记录从指定hash map 中
 * @param {string} redisName
 * @param {Array} fileds  记录keys
 * @param {function} callback
 * */
handler.hmGet = function (redisName, fileds, callback) {
    var self = this;

    var hmget = Q.nbind(self.client.hmget, self.client);

    hmget(redisName, fileds)
        .then(function (datas) {
                  return callback(null, datas);
              })
        .catch(function (err) {
                   logger.error("error when hSet player %j, %s", fileds,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * hmGet <field, value> from Hash 获取记录从指定hash map 中
 * @param {string} redisName
 * @param {number} filed  记录key
 * @param {function} callback
 * */
handler.hGet = function (redisName, filed, callback) {
    var self = this;

    var hget = Q.nbind(self.client.hget, self.client);

    hget(redisName, filed)
        .then(function (data) {
                  return callback(null, data);
              })
        .catch(function (err) {
                   logger.error("error when hSet player %d, %s", filed,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};
/**
 * hmGet <field, value>
 * @param redisName
 * @param filed
 * @param callback
 */
handler.zRem = function (redisName, filed, callback) {
    var self = this;
    var zrem = Q.nbind(self.client.zrem, self.client);
    zrem(redisName, filed)
        .then(function (data) {
                  return callback(null, data);
              })
        .catch(function (err) {
                   logger.error("error when zRem player %d, %s", filed,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 *
 * @param redisName
 * @param filed
 * @param callback
 */
handler.hDel = function (redisName, filed, callback) {
    var self = this;
    var hdel = Q.nbind(self.client.hdel, self.client);
    hdel(redisName, filed)
        .then(function (data) {
                  return callback(null, data);
              })
        .catch(function (err) {
                   logger.error("error when hDel player %d, %s", filed,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

handler.zRevRank = function (redisName, filed, callback) {
    var self = this;
    var zrevrank = Q.nbind(self.client.zrevrank, self.client);
    zrevrank(redisName, filed)
        .then(function (data) {
                  return callback(null, data);
              })
        .catch(function (err) {
                   logger.error("error when zRevRank player %d, %s", filed,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * zUAdd to Sort set 添加数据到有序集合，score 排序列
 * @param {string} redisName
 * @param {number} unionID 工会ID
 * @param {number} score 有序记录
 * @param {function} callback
 * */
handler.zUAdd = function (redisName, roleID, score, callback) {
    var self = this;
    var zadd = Q.nbind(self.client.zadd, self.client);
    zadd(redisName, score, roleID)
        .then(function (count) {
                  return callback(null, count);
              })
        .catch(function (err) {
                   logger.error("error when add player %s %d, %d, %s", redisName, roleID, score,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * get rank from Sort set 从有序集合中获得 序列 序列下标 从1 开始
 * @param {string} redisName
 * @param {number} startIndex 有序序列 开始下标
 * @param {number} endIndex 有序序列 结束下标
 * */
handler.zRevRange = function (redisName, startIndex, endIndex) {
    var deferred = Q.defer();

    this.client.zrevrange(redisName, startIndex, endIndex, function (err, ranks) {
        if (!!err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return deferred.reject(err);
        }

        return deferred.resolve(ranks);
    });

    return deferred.promise;
};

/**
 * zPAdd to Sort set 添加数据到有序集合，score 排序列
 * @param {string} redisName
 * @param {number} unionID 工会ID
 * @param {number} score 有序记录
 * */
handler.zPAdd = function (redisName, roleID, score) {
    var deferred = Q.defer();
    this.client.zadd(redisName, score, roleID, function (err, count) {
        if (!!err) {
            return deferred.reject(err);
        }
        return deferred.resolve(count);
    });
    return deferred.promise;
};

/**
 * hSet <field, value> to Hash 添加记录到指定hash map 中
 * @param {string} redisName
 * @param {number} filed  记录key
 * @param {object} info 记录值
 * */
handler.hPSet = function (redisName, filed, value) {
    var deferred = Q.defer();
    this.client.hset(redisName, filed, value, function (err) {
        if (!!err) {
            return deferred.reject(err);
        }
        return deferred.resolve();
    });
    return deferred.promise;
};

/**
 * 清除对应key
 *
 * @param redisName
 * @param callback
 */
handler.del = function (redisName) {

    var deferred = Q.defer();

    this.client.del(redisName, function (err) {
        if (!!err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return deferred.reject(err);
        }
        return deferred.resolve();
    });

    return deferred.promise;
};

/**
 * 获取 multi
 *
 * @return {Object}
 * @api public
 * */
handler.multi = function () {
    return self.client.multi();
};
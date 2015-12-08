/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-1-17
 * Time: 下午2:10
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var redis = require("redis");
var Handler = module.exports;

Handler.Init = function (host, port, options) {
    this.client = redis.createClient(port, host, options);
};

Handler.SaveString = function (index, value) {
    this.client.set(index, value, function (err, result) {
        if (err) {
            logger.error('存储信息出现问题:%j', err.stack);
        }
    })
};

Handler.LoadString = function (index, callback) {
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
 * @param {score} 有序记录
 * @param {function} callback
 * */
Handler.zAdd = function (redisName, roleID, score, callback) {
    var self = this;
    var zadd = Q.nbind(self.client.zadd, self.client);

    zadd(redisName, score, roleID)
        .then(function (count) {
                  return callback(null, count);
              })
        .catch(function (err) {
                   logger.error("error when add player %d, %d, %s", roleID, score, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};


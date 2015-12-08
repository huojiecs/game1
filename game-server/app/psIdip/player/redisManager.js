/**
 * Created by CUILIN on 2014/12/31.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var RedisManager = require('../../tools/redis/redisManager');
var constValue = require('../../tools/constValue');
var config = require('../../tools/config');
var util = require('util');
var eRedisClientType = constValue.eRedisClientType;

var Handler = function (opts) {
    RedisManager.call(this, opts);
};

util.inherits(Handler, RedisManager);

module.exports = new Handler();

var handler = Handler.prototype;

handler.Init = function() {
    this.addClient(eRedisClientType.Chart, config.redis.chart.host, config.redis.chart.port, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
};

handler.hGet = function(redisName, roleID, callback) {
    this.getClient(eRedisClientType.Chart)
        .hGet(redisName, roleID, function (err, info) {
            if(err) {
                return callback(err);
            }
            info = JSON.parse(info);
            return callback(null, info);
        });
};
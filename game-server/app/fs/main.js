/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-21
 * Time: 下午5:59
 * To change this template use File | Settings | File Templates.
 */
var friendManager = require('./friend/friendManager');
var playerManager = require('./player/playerManager');
var friendClient = require('./friend/friendClient');
var gameClient = require('../tools/mysql/gameClient');
var accountClient = require('../tools/mysql/accountClient');
var redisClient = require('../tools/redis/redisClient');
var config = require('../tools/config');
var Q = require('q');

///////////////////////////////////////
var logClient = require('../tools/mysql/logClient');
///////////////////////////////////////

var Handler = module.exports;

Handler.InitServer = function () {
    redisClient.Init(config.redis.fs.host, config.redis.fs.port, {
        auth_pass: config.redis.fs.password,
        no_ready_check: true
    });
    friendManager.Init();
    playerManager.Init();
    friendClient.Init();
    return Q.resolve();
};
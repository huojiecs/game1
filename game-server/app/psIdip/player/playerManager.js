/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-26
 * Time: 下午1:48
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var defaultValues = require('../../tools/defaultValues');
var redisManager = require('./redisManager');
var Q = require('q');
var _ = require('underscore');
var constValue = require('../../tools/constValue');
var eRedisClientType = constValue.eRedisClientType;
var config = require('../../tools/config');

var Handler = module.exports;

Handler.Init = function () {
    var self = this;

    this.accountMap = {};
    this.playerMap = {};

    setInterval(this.PrintStateInfo.bind(this), defaultValues.PrintStateInfoDelaySeconds * 1000);
};

Handler.GetRoleInfoOnRedis = function(roleID, callback) {
    if(!redisManager.getClient(eRedisClientType.Chart)) {
        redisManager.Init();
    }

    if(!this.redisRoleInfo) {
        this.redisRoleInfo =
        config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    }

    redisManager.hGet(this.redisRoleInfo, roleID, function (err, info) {
        if (err) {
            return callback(err);
        }
        return callback(null, info);
    });
};

Handler.PrintStateInfo = function () {

    logger.fatal('PlayerManger PlayerCount: %d', _.size(this.playerMap));
};

Handler.ModifyPlayer = function (playerInfo) {

    logger.warn('PlayerManager ModifyPlayer playerInfo: %j', playerInfo);

    if (!playerInfo) {
        return;
    }

    if (!this.accountMap) {
        this.accountMap = {};
    }

    if (!this.playerMap) {
        this.playerMap = {};
    }

    if (!playerInfo.csServerID) {
        delete this.accountMap[playerInfo.roleID];
        delete this.playerMap[playerInfo.roleID];
        return;
    }

    this.accountMap[playerInfo.accountID] = playerInfo;
    this.playerMap[playerInfo.roleID] = playerInfo;
};

Handler.SyncPlayers = function (playerList) {

    _.each(playerList, this.ModifyPlayer);
};

/**
 * @return {string}
 */
Handler.GetPlayerCs = function (roleID) {

    if (!this.playerMap) {
        return '';
    }

    if (!this.playerMap[roleID]) {
        return '';
    }

    return this.playerMap[roleID].csServerID;
};

/**
 * @return {string}
 */
Handler.GetAccountCheckID = function (accountID) {

    if (!this.accountMap) {
        return '';
    }

    if (!this.accountMap[accountID]) {
        return '';
    }

    return this.accountMap[accountID].checkID;
};

/**
 * @return {string}
 */
Handler.GetAccountFrontendID = function (accountID) {

    if (!this.accountMap) {
        return '';
    }

    if (!this.accountMap[accountID]) {
        return '';
    }

    return this.accountMap[accountID].frontendID;
};

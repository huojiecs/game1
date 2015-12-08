/**
 * Created by xykong on 2014/9/11.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./config');
var utils = require('./utils');
var errorCodes = require('./errorCodes');
var util = require('util');
var redis = require("redis");
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.Init = function () {
    var self = this;

    self.queueRedis = ':' + config.redis.session.zsetName + ':queue@'
                      + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;

    self.client = redis.createClient(config.redis.session.port, config.redis.session.host, {
        auth_pass: config.redis.session.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });
};

Handler.Push = function (key, value, callback) {
    var self = this;
    return;

    if (!self.client) {
        self.Init();
    }

    var rPush = Q.nbind(self.client.rpush, self.client);

    key += self.queueRedis;

    rPush(key, value)
        .then(function (result) {
                  return utils.invokeCallback(callback, null, result);
              })
        .catch(function (error) {
                   logger.error('Push failed, key: %j, value: %j, error: %s', key, value, utils.getErrorMessage(error));
                   return utils.invokeCallback(callback, error);
               })
        .done();
};

Handler.Pop = function (key) {
    var self = this;

    if (!self.client) {
        self.Init();
    }

    var blPop = Q.nbind(self.client.blpop, self.client);

    key += self.queueRedis;

    blPop(key)
        .then(function (result) {
                  return utils.invokeCallback(callback, null, result);
              })
        .catch(function (error) {
                   logger.error('Pop failed, key: %j, error: %s', key, utils.getErrorMessage(error));
                   return utils.invokeCallback(callback, error);
               })
        .done();
};

Handler.Pops = function (key, count, callback) {
    var self = this;

    if (count <= 0) {
        return utils.invokeCallback(callback, errorCodes.ParameterWrong);
    }

    if (!self.client) {
        self.Init();
    }

    var lRange = Q.nbind(self.client.lrange, self.client);
    var lTrim = Q.nbind(self.client.ltrim, self.client);

    key += self.queueRedis;

    var results = [];

    lRange(key, 0, count - 1)
        .then(function (list) {
                  results = list;

                  return lTrim(key, results.length, -1);
              })
        .then(function () {
                  return utils.invokeCallback(callback, null, results);
              })
        .catch(function (error) {
                   logger.error('Pops failed, key: %j, count: %j, error: %s', key, count, utils.getErrorMessage(error));
                   return utils.invokeCallback(callback, error);
               })
        .done();
};

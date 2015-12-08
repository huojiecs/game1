/**
 * The file firewall.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/12 21:40:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../config');
var firewallManager = require('../common/firewallManager');
var errorCodes = require('../errorCodes');

/**
 * 默认不过滤消息
 * */
var IGNORE_FIREWALL = config.filter.ignoreFirewall;

module.exports = function () {
    return new Filter();
};

var Filter = function () {

};


Filter.prototype.before = function (msg, session, next) {

    var route = msg.route;
    if (!!(IGNORE_FIREWALL && route in IGNORE_FIREWALL)) {
        return next();
    }
    if (!firewallManager.checkRequestTime( session.id, route)) {
        return next(new Error('message too frequently'), {result: errorCodes.SystemBusy});
    }
    return next();
};

Filter.prototype.after = function (err, msg, session, resp, next) {

    if (!!(IGNORE_FIREWALL && msg.route in IGNORE_FIREWALL)) {
        return next();
    }

    next(err, msg);
};
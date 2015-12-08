/**
 * The file globalSerial.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/24 18:35:00
 * To change this template use File | Setting |File Template
 */

/**
 * Filter to keep request sequence.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var taskManager = require('../common/taskManager');
var errorCodes = require('../errorCodes');
var defaultValues = require('../defaultValues');
var config = require('./../config');

/**
 * 游戏全局消息队列, 从pomelo 拿出来, 可能有其他修改， 方便， 如超时处理等
 * */

var GLOBAL_QUEUE = config.filter.globalQueue;

module.exports = function () {
    return new Filter();
};

var Filter = function () {
    this.__serialTask__ = {};
};

/**
 * request serialization after filter
 */
Filter.prototype.before = function (msg, session, next) {
    if (!!defaultValues.filterDisableTaskManager) {
        return next();
    }

    var self = this;
    var route = msg.route;
    /** 判断该接口是否需要添加全局队列 */
    if (!GLOBAL_QUEUE || !GLOBAL_QUEUE[route]) {
        return next();
    }
    /** 大于指定队列时 不接受请求*/
    if (taskManager.getGlobalQueueLength(route) > GLOBAL_QUEUE[route]) {
        return next(new Error('global message queue too long'), {result: errorCodes.SystemBusy});
    }

    taskManager.addGlobalTask(route, function (task) {
        self.__serialTask__[route] = task;
        next();
    }, function () {
        logger.warn('[global serial filter] msg timeout, msg:' + JSON.stringify(msg));
    });
};

/**
 * request serialization after filter
 */
Filter.prototype.after = function (err, msg, session, resp, next) {
    if (!!defaultValues.filterDisableTaskManager) {
        return next();
    }

    var route = msg.route;

    /** 判断该接口是否需要添加全局队列 */
    if (!GLOBAL_QUEUE || !GLOBAL_QUEUE[route]) {
        return next(err);
    }

    var task = this.__serialTask__[route];
    if (task) {
        if (!task.done() && !err) {
            err = new Error('global task time out. msg:' + JSON.stringify(msg));
        }
    }
    next(err);
};

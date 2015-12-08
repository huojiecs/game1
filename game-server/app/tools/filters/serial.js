/**
 * The file serial.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/17 17:36:00
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
 * 玩家消息队列, 从pomelo 拿出来, 可能有其他修改， 方便， 如超时处理等
 * */

/** 消息队列大于值时直接 kick session*/
var DEFAULT_MAX_QUEUE = config.filter.disconnectQueueSize;

var DROP_MESSAGE = config.filter.drop;

module.exports = function () {
    return new Filter();
};

var Filter = function () {
};

/**
 * request serialization after filter
 */
Filter.prototype.before = function (msg, session, next) {
    if (!!defaultValues.filterDisableTaskManager) {
        return next();
    }

    var route = msg.route;
    /** 玩家 队列太大时， 默认服务器压力大，不在加入队列*/
    if (!!DROP_MESSAGE && !!DROP_MESSAGE[route] && taskManager.getQueueLength(session.id) > DROP_MESSAGE[route]) {
        return next(new Error('message queue too long'), {result: errorCodes.SystemBusy});
    }

    /** 大于指定队列时 kick session*/
    if (taskManager.getQueueLength(session.id) > DEFAULT_MAX_QUEUE) {

        logger.warn("kick session checkID: %d accountID: %d by message queue too long",
                    session.uid, session.get('accountID'));
        var sessionService = pomelo.app.get('sessionService');

        sessionService.kick(session.uid, 'Reason　message queue too long', function () {
            session.unbind();
            logger.warn("kick session checkID: %d accountID: %d by message queue too long",
                        session.uid, session.get('accountID'));
            return next(new Error('message queue too long'));
        });
    }

    taskManager.addTask(session.id, function (task) {
        session.__serialTask__ = task;
        next();
    }, function () {
        logger.warn('[serial filter] msg timeout, msg:' + JSON.stringify(msg));
    });
};

/**
 * request serialization after filter
 */
Filter.prototype.after = function (err, msg, session, resp, next) {
    if (!!defaultValues.filterDisableTaskManager) {
        return next();
    }

    var task = session.__serialTask__;
    if (task) {
        if (!task.done() && !err) {
            err = new Error('task time out. msg:' + JSON.stringify(msg));
        }
    }
    next(err);
};

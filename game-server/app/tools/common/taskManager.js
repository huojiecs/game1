/**
 * The file taskManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/17 17:32:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var sequeue = require('seq-queue');

var manager = module.exports;

var queues = {};

/** 全局队列*/
var globalQueues = {};

manager.queue_warn_length = 30;
manager.timeout = 3000;

manager.globalTimeout = 3000;


manager.getTaskQueues = function () {
    return [queues, globalQueues];
};

/**
 * Add tasks into task group. Create the task group if it dose not exist.
 *
 * @param {String}   key       task key
 * @param {Function} fn        task callback
 * @param {Function} ontimeout task timeout callback
 */
manager.addTask = function (key, fn, ontimeout) {
    var queue = queues[key];
    if (!queue) {
        queue = sequeue.createQueue(manager.timeout);
        queues[key] = queue;
    }
    /** 加入队列时，检测 队列长度， 暂时没有做任何处理*/
    if (queue.queue.length > manager.queue_warn_length) {
        /**这里应该需要处理的 队列大了， 说明后端处理不过来了， 或者前端消息来的过快， 也是不正常的*/
        logger.warn('[serial filter] msg queue too long %d sessionID: %d', queue.queue.length, key);
    }

    return queue.push(fn, ontimeout);
};

/**
 * Add tasks into task group. Create the task group if it dose not exist.
 *
 * @param {String}   key       task key
 * @param {Function} fn        task callback
 * @param {Function} ontimeout task timeout callback
 */
manager.addGlobalTask = function (key, fn, ontimeout) {
    var queue = globalQueues[key];
    if (!queue) {
        queue = sequeue.createQueue(manager.globalTimeout);
        globalQueues[key] = queue;
    }

    return queue.push(fn, ontimeout);
};

/**
 * Destroy task group
 *
 * @param  {String} key   task key
 * @param  {Boolean} force whether close task group directly
 */
manager.closeQueue = function (key, force) {
    if (!queues[key]) {
        return;
    }

    queues[key].close(force);
    delete queues[key];
};

/**
 * get queue length
 *
 * @param {String} key task key
 * return {Number}
 * @api public
 */
manager.getQueueLength = function (key) {
    if (!queues[key]) {
        return 0;
    }
    return queues[key].queue.length;
};

/**
 * get global queue length
 *
 * @param {String} key task key
 * return {Number}
 * @api public
 */
manager.getGlobalQueueLength = function (key) {
    if (!globalQueues[key]) {
        return 0;
    }
    return globalQueues[key].queue.length;
};

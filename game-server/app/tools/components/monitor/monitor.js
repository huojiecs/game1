/**
 * The file monitor.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/10 13:39:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var MemoryMonitor = require('./memoryMonitor');

var _ = require('underscore');
var Q = require('q');

/** 默认 打印内存时间*/
var DEFAULT_MEMORY_MONITOR_TIME = 3 * 60 * 1000;
var DEFAULT_MEMORY_WATCH = 0;
var DEFAULT_MEMORY_HEAPDUMP = false;

/**
 * monitor component factory function
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 *                       opts.acceptorFactory {Object}: acceptorFactory.create(opts, cb)
 * @return {Object}     remote component instances
 */
module.exports = function (app, opts) {
    opts = opts || {};

    var isWin = !!process.platform.match(/^win/);

    /** memwatch config 0: 不开启， 1： leak , 2 leak and stats*/
    opts.memwatch = isWin ? DEFAULT_MEMORY_WATCH : opts.memwatch || DEFAULT_MEMORY_WATCH;
    /** heapdum 内存镜像 config true 开启， false 不开启 */
    opts.heapdump = isWin ? DEFAULT_MEMORY_HEAPDUMP : opts.heapdump || DEFAULT_MEMORY_HEAPDUMP;

    opts.memoryMonitorTime = opts.memoryMonitorTime || DEFAULT_MEMORY_MONITOR_TIME;

    return new Component(app, opts);
};

/**
 * monitor component class
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Component = function (app, opts) {
    this.app = app;
    this.opts = opts;

    this.memoryMonitor = new MemoryMonitor(app, opts);
};

var pro = Component.prototype;

pro.name = '__performance_monitor__';

/**
 * monitor component lifecycle function
 *
 * @param {Function} cb
 * @return {Void}
 */
pro.start = function (cb) {

    this.memoryMonitor.start();
    process.nextTick(cb);
};

/**
 * monitor component lifecycle function
 *
 * @param {Boolean}  force whether stop the component immediately
 * @param {Function}  cb
 * @return {Void}
 */
pro.stop = function (force, cb) {

    this.memoryMonitor.stop();
    process.nextTick(cb);
};

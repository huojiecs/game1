/**
 * The file memoryMonitor.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/10 14:05:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var os = require('os');

/**
 * memoryMonitor component factory function
 *
 * @param {Object} app  current application context
 * @param {Object} s construct parameters
 *                       opts.acceptorFactory {Object}: acceptorFactory.create(opts, cb)
 * @return {Object}     remote component instances
 */
module.exports = function (app, opts) {
    return new Component(app, opts);
};

/**
 * memoryMonitor component class
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Component = function (app, opts) {
    this.app = app;
    this.opts = opts;
};

var pro = Component.prototype;

/**
 * memoryMonitor component lifecycle function
 *
 * @return {Void}
 */
pro.start = function () {

    if (this.opts.memwatch > 0) {
        this.memwatch();
    }

    if (this.opts.heapdump) {
        heapdump();
    }

    /** 刷新方法 */
    function UpdateMonitor() {
        showMem();
    }

    this.interval = setInterval(UpdateMonitor, this.opts.memoryMonitorTime);
};

/**
 * memoryMonitor component lifecycle function
 *
 * @return {Void}
 */
pro.stop = function () {
    clearInterval(this.interval);
};

/**
 * 刷帧方法
 * @param {Number} sec 当前时间
 * @return {Void}
 * */
pro.update = function (sec) {

};

/**
 * 打印内存使用情况 格式 memory use Process: heapTotal 0 MB, heapUsed 0MB, rss 0MB ---- Os: total 0MB, free 0MB
 * Process:
 * 1，heapTotal: 是堆中总共申请的内存量
 * 2，headUsed: 目前堆内存使用量
 * 3，rss: 堆外内存量， 如 Buffer 对象在此表现
 * Os:
 * 1, total: 系统内存总量
 * 2，free: 系统空闲内存内存
 * */
var showMem = function () {
    /** 进程内存情况*/
    var mem = process.memoryUsage();
    /** 系统内存情况*/
    var osMen = os;

    /** 转换成 MB单位格式打印*/
    var format = function (bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + 'MB';
    };

    logger.fatal('%s memory use Process: heapTotal %s, headUsed %s, rss %s ---- Os: total %s, free %s',
                 pomelo.app.getServerId(), format(mem.heapTotal), format(mem.heapUsed), format(mem.rss),
                 format(osMen.totalmem()), format(osMen.freemem()));
};

/**
 *
 * 内存监测， 用menwatch 检查是否有内存泄露产生
 *
 * 1,stats: 内存进行全堆垃圾回收时， 会触发一次stats事件
 * 2,leak: 连续5次垃圾回收，都没释放， 意味着垃圾内存泄露的产生？ ！！！
 *
 *
 */
pro.memwatch = function () {

    var memwatch = require('memwatch');

    if (this.opts.memwatch > 0) {
        memwatch.on('leak', function (info) {
            logger.fatal('memwatch -> leak: %j', info);
        });
    }

    if (this.opts.memwatch > 1) {
        memwatch.on('stats', function (stats) {
            logger.fatal('memwatch -> stats: %j', stats);
        });
    }

};

/**
 * 开启内存镜像 使用heapdump 引入次对象， 可以获取内存镜像文件 但是查看非常麻烦
 * 1， 服务器启动后, 可以用 kill -USR2 pid 获取该进程的内存镜像
 * 2， 内存镜像是一个json 文件， 用chrome profiles 进行分析 （有点大）
 * */
var heapdump = function () {
    require('heapdump');
};




/**
 * Created by kazi on 2014/6/13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('lifecycle', __filename);
var utils = require('./../../tools/utils');
var Q = require('q');


module.exports.beforeStartup = function (app, cb) {
    logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
    logger.fatal('beforeStartup.');
    var main = require('../../dbcache/main');
    main.InitServer(cb);
    //cb();
};

module.exports.afterStartup = function (app, cb) {
    logger.fatal('afterStartup.');
    cb();
};

module.exports.beforeShutdown = function (app, cb) {
    logger.fatal('beforeShutdown.');

    var jobs = [
        Q.ninvoke(utils, 'waitingForRpc', 'cs', false),
        Q.ninvoke(utils, 'waitingForRpc', 'ps', false),
        Q.ninvoke(utils, 'waitingForRpc', 'rs', false),
        Q.ninvoke(utils, 'waitingForRpc', 'us', false)
    ];

    Q.all(jobs)
        .finally(function () {
                     logger.fatal('cs, rs not exist, Shutdown.');

                     var workerManager = require('../../dbcache/workerManager');

                     utils.waitingFor(function () {
                         var queryCount = workerManager.getQueryCount();
                         logger.fatal('queryCount: %s.', queryCount);
                         return !queryCount;
                     }, function () {
                         logger.fatal('beforeShutdown no query on this dbcache, shutdown.');

                         cb();
                     });
                 })
        .done();
};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');
};

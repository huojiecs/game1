/**
 * Created by kazi on 2014/6/13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('lifecycle', __filename);
var utils = require('./../../tools/utils');


module.exports.beforeStartup = function (app, cb) {
    logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
    logger.fatal('beforeStartup.');
    cb();
};

module.exports.afterStartup = function (app, cb) {
    logger.fatal('afterStartup.');

    utils.waitingForRpc('dbcache', true, function () {
        var main = require('../../us/main');

        main.InitServer()
            .then(function () {
                      utils.waitingForRpc('connector', true, function () {
                          utils.notifyStatus('connector', true, cb);
                      });
                  });
    });
};

module.exports.beforeShutdown = function (app, cb) {
    logger.fatal('beforeShutdown.');
    var main = require('../../us/main');
    var unionManager = require('../../us/union/unionManager');
    main.BeforeCloseServer(function () {
        utils.waitingFor(function () {
            return !unionManager.getCurrQueueNum();
        }, function () {
            logger.fatal('beforeShutdown no players on this us, shutdown.');

            cb();
        });
    });
};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');
};

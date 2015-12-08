/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-1-6
 * Time: 上午10:20
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('lifecycle', __filename);
var utils = require('./../../tools/utils');
var _ = require('underscore');

var Handler = module.exports;

module.exports.beforeStartup = function (app, cb) {
    logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
    logger.fatal('beforeStartup.');
    cb();
};

module.exports.afterStartup = function (app, cb) {
    logger.fatal('afterStartup.');

    utils.waitingForRpc('dbcache', true, function () {

        var main = require('../../cs/main');
        main.InitServer()
            .then(function () {
                      logger.fatal('afterStartup.OK.');
                      utils.waitingForRpc('connector', true, function () {
                          utils.notifyStatus('connector', true, cb);
                      });
                  });
    });
};

module.exports.beforeShutdown = function (app, cb) {
    logger.fatal('beforeShutdown.');

    var playerManager = require('../../cs/player/playerManager');
    var utils = require('../../tools/utils');

    utils.waitingFor(function () {
        return !playerManager.GetNumPlayer(1, 0).length;
    }, function () {
        logger.fatal('beforeShutdown no players on this cs, shutdown.');

        cb();
    });
};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');
};

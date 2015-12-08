/**
 * Created by xykong on 2014/7/30.
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
    var waitingForRpc = function () {
        if (!app || !app.rpc || !( 'dbcache' in app.rpc)) {
            logger.fatal('afterStartup: waiting for dbcache rpc startup...');
            return setTimeout(waitingForRpc, 1000);
        }

        var main = require('../../adjust/main');
        main.InitServer()
            .then(cb);
    };

    waitingForRpc();
};

module.exports.beforeShutdown = function (app, cb) {
    logger.fatal('beforeShutdown.');
    cb();
};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');
};

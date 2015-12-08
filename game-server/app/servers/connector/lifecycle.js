/**
 * Created by kazi on 2014/6/13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('lifecycle', __filename);
var stlogger = require('pomelo/node_modules/pomelo-logger').getLogger('connector-status', __filename);
var utils = require('./../../tools/utils');
var Q = require('q');
var _ = require('underscore');


module.exports.beforeStartup = function (app, cb) {
    logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
    logger.fatal('beforeStartup.');
    cb();
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
        Q.ninvoke(utils, 'waitingForRpc', 'rs', false)
    ];

    Q.all(jobs)
        .finally(function () {
                     logger.fatal('servers not exist, Shutdown.');

                     cb();
                 })
        .done();
};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');

    utils.waitingFor(function () {
        return utils.allServerIsOk();
    }, 5, function () {
        logger.fatal('all the servers is Ok and set disableConnect ..false..');
        pomelo.app.set('disableConnect', false);
    });

    var defaultValues = require('./../../tools/defaultValues');
    setInterval(function () {

        var sessionService = app.get('sessionService');
        var sessionsCount = sessionService ? _.size(sessionService.service.sessions) : 0;
        var bindedCount = sessionService ? _.size(sessionService.service.uidMap) : 0;

        var maxUserPerConnector = defaultValues.maxUserPerConnector;
        if (app.getServerId().indexOf('ls') != -1) {
            maxUserPerConnector = defaultValues.maxUserPerConnectorLs;
        }

        stlogger.warn('connector status sessionsCount: %j, bindedCount: %j, maxUserPerConnector: %j, available: %j',
                      sessionsCount, bindedCount, maxUserPerConnector,
                      maxUserPerConnector - bindedCount);
    }, 60000);

};

/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-1-6
 * Time: 上午10:20
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('ps-lifecycle', __filename);
var utils = require('./../../tools/utils');

module.exports.beforeStartup = function (app, cb) {
    logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
    logger.fatal('beforeStartup.');
    cb();
};

module.exports.afterStartup = function (app, cb) {
    logger.fatal('afterStartup.');

    utils.waitingForRpc('dbcache', true, function () {
        var main = require('../../ps/main');

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

    var psCommands = app.get('psCommands');

    psCommands.PrepareShutdown()(function () {

//        var offlinePlayerManager = require('./../../ps/player/offlinePlayerManager');
//        offlinePlayerManager.LogoutAll(cb);

//        cb();
        var main = require('../../ps/main');
        main.BeforeCloseServer(function () {
            cb();
        });


    });
};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');

    var loginClient = require('./../../ps/login/loginClient');
    var defaultValues = require('./../../tools/defaultValues');

    setTimeout(function () {
        loginClient.RegisterToLoginServer();
    }, defaultValues.NOTIFY_LOGIN_TIME);
};

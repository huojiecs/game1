/**
 * The file lifecycle.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/13 15:49:00
 * To change this template use File | Setting |File Template
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
        var main = require('../../js/main');

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

    var main = require('../../pvp/main');
    var playerManager = require('../../js/player/playerManager');
    var utils = require('../../tools/utils');

    utils.waitingForRpc('ps', false, function () {
        playerManager.Down(new Date(), function () {
            return cb();
        });
    });

    /*    utils.waitingFor(function () {
     return !playerManager.GetNumPlayer(1, 0).length;
     }, function () {
     logger.fatal('beforeShutdown no players on this js, shutdown.');

     cb();
     });*/

};

module.exports.afterStartAll = function (app) {
    logger.fatal('afterStartAll.');
};

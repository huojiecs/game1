/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午6:29
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('./../utils');

var Handler = module.exports;

Handler.query = function (roleID, sql, args, callback) {
    logger.debug('gameClient: %j, %j', sql, args);

    if (!pomelo.app.rpc.dbcache) {
        utils.invokeCallback(callback, new Error('no dbcache available!'));
    }

    pomelo.app.rpc.dbcache.mysqlRemote.tbLogQuery(null, roleID, sql, args, function (err, result) {
        logger.debug('gameClient query result: %j, %j', result, err);

        utils.invokeCallback(callback, err, result);
    });
};

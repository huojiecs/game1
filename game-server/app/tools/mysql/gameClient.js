/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午6:29
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var utils = require('./../utils');

var Handler = module.exports;

Handler.query = function (roleID, sql, args, callback) {
    var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
    logger.debug('gameClient query roleID: %j, sql: %j, args: %j', roleID, sql, args);
    pomelo.app.rpc.dbcache.mysqlRemote.gameQuery(null, roleID, sql, args, function (err, result) {
        logger.debug('gameClient query result roleID: %j, sql: %j, args: %j, result: %j, err: %j', roleID, sql, args,
                     result, err);

        utils.invokeCallback(callback, err, result);
    });
};

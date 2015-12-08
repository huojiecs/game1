/**
 * Created by kazi on 2014/6/13.
 */
var pomelo = require('pomelo');
var utils = require('./../utils');

var Handler = module.exports;

Handler.query = function (dbName, indexId, sql, args, callback) {

    var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);

    if (!pomelo.app.rpc.dbcache) {
        logger.debug('Mysql database %j query failed indexId: %j, sql: %j, args: %j', dbName, indexId, sql, args);

        return utils.invokeCallback(callback, new Error('no dbcache available!'));
    }

    pomelo.app.rpc.dbcache.mysqlRemote[dbName + 'Query'](null, indexId, sql, args, function (err, result) {
        logger.debug('Mysql database %j query result indexId: %j, sql: %j, args: %j, result: %j, err: %j', dbName,
                     indexId, sql, args, result, err);

        return utils.invokeCallback(callback, err, result);
    });
};

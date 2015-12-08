/**
 * Created with JetBrains WebStorm.
 * User: yqWang
 * Date: 14-11-12
 * Time: 下午4:15
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);

var Handler = module.exports;

Handler.query = function (accountID, sql, args, callback) {
    pomelo.app.rpc.dbcache.mysqlRemote.account_globalQuery(null, accountID, sql, args, callback);
};
/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-22
 * Time: 下午7:39
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);

var Handler = module.exports;

Handler.query = function (sql, args, callback) {
    pomelo.app.rpc.dbcache.mysqlRemote.accountQuery(sql, args, callback);
};

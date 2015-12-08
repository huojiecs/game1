/**
 * Created by xykong on 2014/6/26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameClient = require('./../tools/mysql/gameClient');
var logClient = require('./../tools/mysql/logClient');
var accountClient = require('./../tools/mysql/accountClient');
var errorCodes = require('./../tools/errorCodes');


var handler = module.exports = {
    sqlClients: [gameClient, logClient, accountClient]
};

handler.Reload = function () {
    var module = './dbCommands';
    delete require.cache[require.resolve(module)];
    var dbCommands = require(module);
    pomelo.app.set('dbCommands', dbCommands);
    return errorCodes.OK;
};

['gameClient', 'logClient', 'accountClient'].forEach(function (item, idx) {
    handler[item] = function (sql, args) {
        return function (callback) {
            handler.sqlClients[idx].query(sql, args, function (err, res) {
                if (!!err) {
                    return callback(null, err.stack);
                }
                return callback(null, res);
            });
        };
    }
});

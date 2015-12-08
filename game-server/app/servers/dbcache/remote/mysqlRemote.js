/**
 * Created by kazi on 2014/6/13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var workerManager = require('../../../dbcache/workerManager');


module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

[
    'gameQuery',
    'logQuery',
    'accountQuery',
    'tbLogQuery',
    'account_globalQuery',
    'cmge_paymentQuery'
].forEach(function (item, idx) {
              handler[item] = function (id, sql, args, callback) {
                  logger.debug('%s: %j', item, arguments);
                  return workerManager[item](id, sql, args, callback);
              }
          });

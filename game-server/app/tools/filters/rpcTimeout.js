/**
 * Created by xykong on 2014/9/5.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('rpc-timeout', __filename);
var utils = require('pomelo/lib/util/utils');
var config = require('./../config');

var DEFAULT_TIMEOUT = 100;
var DEFAULT_PRINT_MESSAGE = true;

module.exports = function (timeout, printMessage) {
    return new Filter(timeout || DEFAULT_TIMEOUT, printMessage || DEFAULT_PRINT_MESSAGE);
};

var Filter = function (timeout, printMessage) {
    var self = this;

    self.timeout = timeout;
    self.printMessage = printMessage;
};

Filter.prototype.name = 'rpcTimeout';

/**
 * Before filter for rpc
 */

Filter.prototype.before = function (serverId, msg, opts, next) {
    opts = opts || {};
    opts.__start_time__ = Date.now();

    next();
};

/**
 * After filter for rpc
 */
Filter.prototype.after = function (serverId, msg, opts, next) {
    if (!opts || !opts.__start_time__) {
        logger.error('rpc timeout invalid opts: %s', !opts);
    }

    var timeUsed = Date.now() - opts.__start_time__;

    if (this.printMessage && timeUsed > this.timeout) {
        logger.warn('rpc running cost: %dms, msg: %j', timeUsed, msg);
    }

    next();
};

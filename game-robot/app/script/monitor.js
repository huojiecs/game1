/**
 * Created by kazi on 14-3-6.
 */
var logger = require('pomelo-logger').getLogger('monitor', __filename);
var monitor = module.exports = {};


var START = 'start';
var END = 'end';

monitor.begin = function (name, reqId) {
    if (typeof actor !== 'undefined') {
        actor.emit(START, name, reqId);
    } else {
        logger.error(Array.prototype.slice.call(arguments, 0));
    }
};

monitor.end = function (name, reqId) {
    if (typeof actor !== 'undefined') {
        actor.emit(END, name, reqId);
    } else {
        logger.error(Array.prototype.slice.call(arguments, 0));
    }
};

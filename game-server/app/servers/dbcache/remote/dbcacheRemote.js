/**
 * Created by xykong on 2014/8/27.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('./../../../tools/utils');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.ping = function (id, callback) {
    return utils.invokeCallback(callback);
};

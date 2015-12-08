/**
 * Created by xykong on 2014/7/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var idipCenter = require('./../../../idip/idipCenter');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.Ping = function (id, msg, callback) {

    return callback(null, msg);
};

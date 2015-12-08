/**
 * Created by xykong on 2014/7/28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var adjustCenter = require('./adjustCenter');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.InitServer = function () {
    adjustCenter.Init();

    return Q.resolve();
};

/**
 * Created by xykong on 2014/7/28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var apiCenter = require('./apiCenter');
var apiClient = require('./apiClient');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.isCenter = function () {
    return pomelo.app.getServerId().indexOf('global') !== -1;
};

Handler.InitServer = function () {
    if (Handler.isCenter()) {
        apiCenter.Init();
    }
    else {
        apiClient.Init();
    }

    return Q.resolve();
};

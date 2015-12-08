/**
 * Created by xykong on 2014/7/28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('anhei', __filename);
var idipCenter = require('./idipCenter');
var idipClient = require('./idipClient');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.isCenter = function () {
    return pomelo.app.getServerId().indexOf('global') !== -1;
};

Handler.InitServer = function () {
    if (Handler.isCenter()) {
        idipCenter.Init();
    }
    else {
        idipClient.Init();
    }

    return Q.resolve();
};

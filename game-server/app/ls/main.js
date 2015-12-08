/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-10
 * Time: 上午11:18
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('anhei', __filename);
var accountClient = require('../tools/mysql/accountClient');
var config = require('../tools/config');
var serverManager = require('./serverManager');
var friendCenter = require('./friendCenter');
var gameConst = require('./../tools/constValue');
var Q = require('q');

var Handler = module.exports;

/**
 *
 * */
Handler.isLogin = function () {
    return pomelo.app.get(gameConst.eEnvName) == gameConst.eEnv.LOGIN;
};

Handler.InitServer = function () {
    serverManager.Init();
    if (Handler.isLogin()) {
        friendCenter.Init();
    }

    return Q.resolve();
};

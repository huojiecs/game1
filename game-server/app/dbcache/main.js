/**
 * Created by kazi on 2014/6/13.
 */
/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-27
 * Time: 上午11:50
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var workerManager = require('./workerManager');

var Handler = module.exports;

Handler.InitServer = function (cb) {
    workerManager.Init(cb);
};
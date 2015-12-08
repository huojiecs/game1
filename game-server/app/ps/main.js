/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-3
 * Time: 上午11:24
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var accountClient = require('../tools/mysql/accountClient');
var gameClient = require('../tools/mysql/gameClient');
var config = require('../tools/config');
var templateManager = require('../tools/templateManager');
var templateConst = require('../../template/templateConst');
var utils = require('../tools/utils');
var guidManager = require('../tools/guid');
var playerManager = require('./player/playerManager');
var offlinePlayerManager = require('./player/offlinePlayerManager');
var limitedGoodsManager = require('./limitedGoods/limitedGoodsManager');
var chartOperateManager = require('./player/chartOperateManager');
var redisManager = require('../cs/chartRedis/redisManager');
var psRedisManager = require('./psRedisManager');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;
var dateManager = new Date();

Handler.InitServer = function () {
    psRedisManager.Init(); // ps自己使用的redismanager
    redisManager.Init();  // 用于offlineplayer 使用
    playerManager.Init();
    offlinePlayerManager.Init();
    templateManager.Init();
    chartOperateManager.Init();
    limitedGoodsManager.Init();
    setInterval(UpdateServer, 1000);
    setInterval(function () {
        limitedGoodsManager.UpdateLimitGoods(function () {
        });
    }, 300000);

    return Q.resolve();
};
Handler.BeforeCloseServer = function (cb) {
    limitedGoodsManager.UpdateLimitGoods(cb);
};
function UpdateServer() {
    chartOperateManager.updateChartOperate();
}


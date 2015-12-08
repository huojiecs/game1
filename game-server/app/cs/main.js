/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-27
 * Time: 上午11:50
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('./player/playerManager');
var offlinePlayerManager = require('./../ps/player/offlinePlayerManager');
var roomManager = require('./room/roomManager');
var buffManager = require('./buff/buffManager');
var cityManager = require('./majorCity/cityManager');
var tssManager = require('./tencentSecuritySystem/tssManager');
var gameClient = require('../tools/mysql/gameClient');
var templateManager = require('../tools/templateManager');
var redisManager = require('./chartRedis/redisManager');
var operateControl = require('./operateActivity/operateControl');
var advanceController = require('./advance/advanceController');
var chestsController = require('./chestsActivity/chestsActivityControl');
var Q = require('q');
var weeklyFreeNpc = require('./coliseum/weeklyFreeNpc');

var Handler = module.exports;

Handler.InitServer = function () {
    playerManager.Init();
    offlinePlayerManager.Init();
    templateManager.Init();
    roomManager.Init();
    buffManager.Init();
    cityManager.Init();
    tssManager.Init();
    redisManager.Init();
    operateControl.Init();
    advanceController.Init();
    chestsController.Init();
    weeklyFreeNpc.Init();
    templateManager.ReloadSync();



    function UpdateServer() {
        var nowTime = new Date();
        playerManager.UpdatePlayer(nowTime);
        roomManager.UpdateRoomList(nowTime);
        buffManager.UpdateBuff(nowTime);
        playerManager.CheckForbidTimeIsOver(nowTime);
    }

    setInterval(UpdateServer, 100);

    return Q.resolve();
};

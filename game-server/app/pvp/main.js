/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午4:02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var asyncPvPManager = require('./asyncPvPManager');
var playerManager = require('./player/playerManager');
var Q = require('q');
var utils = require('../tools/utils');
var gameClient = require('../tools/mysql/gameClient');
var aresManager = require('./ares/aresManager');
var soulPvpManager = require('./soulPvp/soulPvpManager');
var worldBossManager = require('./worldBoss/worldBossManager');
var worldBossControl = require('./worldBoss/worldBossControl');
var pvpRedisManager = require('./redis/pvpRedisManager');
var templateManager = require('../tools/templateManager');

var Handler = module.exports;

Handler.InitServer = function () {
    var deferred = Q.defer();
    logger.info("pvp server initializing...");

    var self = this;
    /** 初始化json数据*/
    templateManager.Init();
    templateManager.ReloadSync();
    /** 初始化pvpRedisManager*/
    pvpRedisManager.Init();
    /** 初始化pvp playerManager Init*/
    playerManager.Init();
    worldBossControl.Init();
    worldBossManager.Init();
    asyncPvPManager.Init()
        .then(function () {
            /** 初始化 战神榜管理器 */
            return aresManager.init();
        })
        .then(function () {
            /** 初始化 邪神竞技场管理器 */
            return soulPvpManager.init();
        })
        .then(function () {
            self.intervalID = setInterval(UpdatePvPInfoToDB, 1000);
            
            return deferred.resolve();
        })        
        .catch(function () {
            return deferred.reject();
        })
        .done();

    return deferred.promise;
};

Handler.BeforeCloseServer = function (callback) {
    clearInterval(this.intervalID);
    asyncPvPManager.UpdatePvPInfoToDB(1, callback);
};

function UpdatePvPInfoToDB() {
    asyncPvPManager.UpdatePvPInfoToDB(0, utils.done);
    playerManager.Update(new Date());
};




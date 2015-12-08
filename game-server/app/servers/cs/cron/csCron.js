
/**
 * Created by kazi on 14-3-26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('./../../../../app/cs/player/playerManager');
var globalFunction = require('./../../../../app/tools/globalFunction');
var updateTime = null;
var csSql = require('../../../tools/mysql/csSql');
var climbManager = require('./../../../../app/cs/climb/climbManager');
var operateControl = require('./../../../../app/cs/operateActivity/operateControl');
var advanceController = require('./../../../../app/cs/advance/advanceController');
var chestsController = require('./../../../../app/cs/chestsActivity/chestsActivityControl');
var utils = require('../../../tools/utils');
var weeklyFreeNpc = require('./../../../../app/cs/coliseum/weeklyFreeNpc');

module.exports = function (app) {
    return new Cron(app);
};

var Cron = function (app) {
    this.app = app;
    updateTime = new Date();
};

var cron = Cron.prototype;

cron.sendMoney = function () {
    logger.info('%s server is sending money now!', this.app.serverId);

    if (!playerManager) {
        return;
    }

    var playerNum = 0;
    var saveNum = 0;
    for (var index in playerManager.playerList) {
        ++playerNum;
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.assetsManager.ModifyAssets(globalFunction.YuanBaoID, 1);
    }
};

cron.ReplyPhysical = function () {
    //logger.fatal('%s server is sending ReplyPhysical now!', this.app.serverId);

    if (playerManager == null) {
        return;
    }
    for (var index in playerManager.playerList) {
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.physicalManager.ReplyPhysical();
    }
};

//周末清空爬塔数据
cron.initRoleClimbData = function () {

    logger.info('cron.initRoleClimbData');

    //csSql.initRoleClimbInfo();
};

//周末发送爬塔好友排行奖励
cron.sendRewardOfClimbChart = function () {

    logger.info('cron.sendRewardOfClimbChart');

    if (climbManager == null) {
        return;
    }
    //climbManager.sendRewardOfFriendChart();
};

//周末发送爬塔排行奖励
cron.sendRewardOfClimbSingleChart = function () {

    logger.info('cron.sendRewardOfClimbSingleChart');

    if (climbManager == null) {
        return;
    }
    //climbManager.sendRewardOfSingleChart();
};

cron.UpdateOperate = function () {
    operateControl.JudgeTime();
    advanceController.onTimer();
    chestsController.ChestOnTimer();
};

cron.Update12Info = function () {
    logger.warn('cron.Update12Info');
    if (playerManager == null) {
        return;
    }
    for (var index in playerManager.playerList) {
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.Update();
        //12点清空求婚次数
        tempPlayer.toMarryManager.countNum = 0;
    }
};

cron.UpdateWeeklyInfo = function () {
    logger.warn('cron.UpdateWeeklyInfo');
    weeklyFreeNpc.updateWeekFreeNpc();
    if (playerManager == null) {
        return;
    }
    for (var index in playerManager.playerList) {
        var tempPlayer = playerManager.playerList[index];
        tempPlayer.GetColiseumManager().SendWeeklyFreeNpc();
    }
};
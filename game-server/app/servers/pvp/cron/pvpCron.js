/**
 * Created by yqWang on 14-8-14.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('../../../tools/config');
var playerManager = require('./../../../../app/ps/player/playerManager');
var worldBossManager = require('./../../../../app/pvp/worldBoss/worldBossManager');
var worldBossControl = require('./../../../../app/pvp/worldBoss/worldBossControl');
var defaultValues = require('./../../../../app/tools/defaultValues');
var utils = require('../../../tools/utils');
var Q = require('q');
var _ = require('underscore');

module.exports = function (app) {
    return new Cron(app);
};

var Cron = function (app) {
    this.app = app;
};

var cron = Cron.prototype;

// 更新跨天
cron.Update12Info = function () {
    if (worldBossManager == null) {
        return;
    }
    logger.warn('WorldBossUpdate12Info');
    worldBossManager.WorldBossUpdate12Info();
};

cron.OnCreateBossFight = function () {

    worldBossControl.WorldBossOnTimer();
};



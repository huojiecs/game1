/**
 * Created by bj on 2015/7/23.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var Q = require('q');
var async = require('async');
var _ = require('underscore');
var config = require('../../tools/config');
var errorCodes = require('../../tools/errorCodes');
var constValue = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateManager = require('../../tools/templateManager');
var templateConst = require('./../../../template/templateConst');
var worldBossManager = require('./worldBossManager')
var util = require('util');
var tBossOpen = templateConst.tBossOpenList;

var Handler = module.exports;

Handler.Init = function () {
    this.runningBoss = {};   // 正在进行的活动
};

// 定时器，定时检测活动开始和结束的运行状态
Handler.WorldBossOnTimer = function () {
    var bossOpenAllTemplate = templateManager.GetAllTemplate('BossOpenListTemplate');
    if (null == bossOpenAllTemplate) {
        return;
    }
    var nowDate = new Date();
    var startBossID = 0;
    var stopBossID = 0;
    for (var index in bossOpenAllTemplate) {
        var temp = bossOpenAllTemplate[index];

        var bossID = temp[tBossOpen.attID];

        var beginTime = temp[tBossOpen.beginTime];
        var delayTime = temp[tBossOpen.delayTime];
        var startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
        var endTime = new Date(startTime).getTime() + delayTime * 1000;     

        // 活动时间内
        if (nowDate >= new Date(new Date(startTime).getTime() - defaultValues.WORLD_BOSS_NOTICE) && nowDate < new Date(endTime)) {
            if (null == this.runningBoss[bossID]) {
                this.runningBoss[bossID] = 1;
                startBossID = bossID;
                break;
            }
        }
        if (nowDate > new Date(endTime)) {
            if (null != this.runningBoss[bossID]) {
                delete this.runningBoss[bossID];
                stopBossID = bossID;
                break;
            }
        }
    }
    if (startBossID > 0) {
        this.BeginWorldBoss('' + startBossID); 
    }
    
    if(stopBossID > 0){
        this.EndWorldBoss(''+ stopBossID); 
    }
    
};

Handler.BeginWorldBoss = function (attID) {
    worldBossManager.CreateBossFight(attID);
    
};

Handler.EndWorldBoss = function (attID) {
    worldBossManager.EndBossFight(attID);
};

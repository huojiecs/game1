/**
 * Created by bj on 2015/5/20.
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
var util = require('util');
var playerManager = require('../player/playerManager');

var Handler = module.exports;

Handler.Init = function () {
    this.runningChests = {};   // 正在进行的活动
};

// 定时器，定时检测活动开始和结束的运行状态
Handler.ChestOnTimer = function () {
    var chestsAllTemplate = templateManager.GetAllTemplate('ChestsActivityTemplate');
    if (null == chestsAllTemplate) {
        return;
    }
    var nowDate = new Date();
    var startList = [];
    var stopList = [];
    for (var index in chestsAllTemplate) {
        var temp = chestsAllTemplate[index];

        var chestID = temp[templateConst.tChestsActivity.attID];
        var startTime = temp[templateConst.tChestsActivity.startTime];
        var endTime = temp[templateConst.tChestsActivity.endTime];

        // 活动时间内
        if (nowDate >= new Date(startTime) && nowDate < new Date(endTime)) {
            if (null == this.runningChests[chestID]) {
                this.runningChests[chestID] = 1;
                startList.push(chestID);
            }
        }
        if (nowDate > new Date(endTime)) {
            if (null != this.runningChests[chestID]) {
                delete this.runningChests[chestID];
                stopList.push(chestID);
            }
        }
    }

    for (var i = 0; i < startList.length; ++i) {
        this.BeginChest(startList[i]);
    }

    for (var i = 0; i < stopList.length; ++i) {
        this.EndChest(stopList[i]);
    }
};

Handler.BeginChest = function (attID) { //开始
    var chestTemplate = templateManager.GetTemplateByID('ChestsActivityTemplate', attID);
    if (null == chestTemplate) {
        return;
    }
    var endTimeDesc = chestTemplate[templateConst.tChestsActivity.endTimeDesc];
    var chestName = chestTemplate[templateConst.tChestsActivity.name];
    var chestInstructions = chestTemplate[templateConst.tChestsActivity.instructions];
    var chestModelPath = chestTemplate[templateConst.tChestsActivity.modelPath];
    var ChestOpenModelPath = chestTemplate[templateConst.tChestsActivity.openModelPath];
    var openKey = chestTemplate[templateConst.tChestsActivity.openID];

    var msg = {
        attID: attID,
        name: chestName,
        instructions: chestInstructions,
        openID: openKey,
        endTimeDesc: endTimeDesc,
        modelPath: chestModelPath,
        openModelPath: ChestOpenModelPath,
        assertsNum: 0    //开启宝箱的财产
    };
    var route = 'ServerStartChestInfo';

    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        var keyNums = tempPlayer.GetAssetsManager().GetAssetsValue(openKey);
        msg.assertsNum = keyNums;
        tempPlayer.SendMessage(route, msg);
    }
};
// 结束活动
Handler.EndChest = function (attID) {
    var chestTemplate = templateManager.GetTemplateByID('ChestsActivityTemplate', attID);
    if (null == chestTemplate) {
        return;
    }
    var route = 'ServerStopChestInfo';
    var msg = {
        attID: attID
    };
    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        tempPlayer.SendMessage(route, msg);
    }
};

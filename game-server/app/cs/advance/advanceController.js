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


var Minute = 60 * 1000;
var Handler = module.exports;

Handler.Init = function(){
    this.runningAdvance = {};   // 正在进行的活动
    this.aheadAdvance = {};     // 预显示活动的列表
    this.isStarted = true;
};

// 定时器，定时检测活动开始和结束的运行状态
Handler.onTimer = function(){
    if(!this.isStarted){
        return;
    }

    var advanceAllTemplate = templateManager.GetAllTemplate('AdvanceTemplate');
    if (null == advanceAllTemplate) {
        return;
    }

    var nowDate = new Date();
    // 目前只有一种启动类型，所以只做绝对时间判断
    var startList = [];
    var stopList = [];
    var notifyList = [];
    for (var index in advanceAllTemplate) {
        var temp = advanceAllTemplate[index];
        var attID = temp['attID'];
        //var startType = temp['startType'];     //活动开始类型

        var startDateTime = new Date(temp['beginTime']);     //活动开始时间
        var endDateTime = new Date(temp['endTime']);         //活动结束时间
        var aheadTime = new Date(temp['aheadTime']);         //预显示提前秒数

        // 活动时间内
        if(startDateTime <= nowDate && nowDate < endDateTime){
            if(this.runningAdvance[attID] == null){
                this.runningAdvance[attID] = 1;
                startList.push(attID);
            }
            if(this.aheadAdvance[attID] != null){
                delete this.aheadAdvance[attID];
            }
        }else if(startDateTime > nowDate && aheadTime <= nowDate){
            if(this.aheadAdvance[attID] == null){
                this.aheadAdvance[attID] = 1;
                notifyList.push(attID);
            }
        }else if(nowDate >= endDateTime){
            if(this.runningAdvance[attID] != null){
                delete this.runningAdvance[attID];
                stopList.push(attID);
            }
        }
    }

    for(var i = 0; i < startList.length; ++i){
        this.startAdvance(startList[i]);
    }

    for(var i = 0; i < stopList.length; ++i){
        this.endAdvance(stopList[i]);
    }
};

// 开始活动
Handler.startAdvance = function(attID){
    var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
    if (null == advanceTemplate) {
        return;
    }

    var route = 'ServerAdvanceInfo';
    var msg = {
        isStart: 0,
        attID: attID,
        advanceInfo : advanceTemplate
    };

    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        tempPlayer.GetAdvanceManager().StartAdvance(attID);
        tempPlayer.SendMessage(route, msg);
    }
};

// 结束活动
Handler.endAdvance = function(attID){
    var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
    if (null == advanceTemplate) {
        return;
    }

    var route = 'ServerStopAdvance';
    var msg = {
        attID: attID
    };

    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        tempPlayer.SendMessage(route, msg);
        tempPlayer.GetAdvanceManager().EndAdvance(attID);   // 删掉角色相关的活动数据
    }
};

// 按活动类型得到运行中的活动
Handler.getRunningAdvanceByType = function(advanceType){
   var retAdvance = {};
   for(var attID in this.runningAdvance){
       if(this.runningAdvance[attID] <= 0){
            continue;
       }

       var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
       if (null == advanceTemplate) {
           return;
       }

       if(advanceTemplate['activeType'] == advanceType){
           retAdvance[attID] = 1;
       }
   }
   return retAdvance;
};


// 按条件类型得到运行中的活动
Handler.getRunningAdvanceByCondition = function(conditionType){
    var retAdvance = {};
    for(var attID in this.runningAdvance){
        if(this.runningAdvance[attID] <= 0){
            continue;
        }

        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            return;
        }

        if(advanceTemplate['condition'] == conditionType){
            retAdvance[attID] = 1;
        }
    }
    return retAdvance;
};

// 发给客户端的消息
Handler.toClientMessage = function(){
    var retMsg = {};
    retMsg.runningAdvance = [];
    retMsg.aheadAdvance = [];
    retMsg.result = errorCodes.OK;
    var nowTime = new Date().getTime();
    for(var attID in this.runningAdvance){
        if(this.runningAdvance[attID] <= 0){
            continue;
        }

        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            continue;
        }

        advanceTemplate['leftTime'] = Math.ceil((new Date(advanceTemplate['endTime']).getTime()- nowTime) / Minute);
        retMsg.runningAdvance.push(advanceTemplate);
    }

    for(var attID in this.aheadAdvance){
        if(this.aheadAdvance[attID] <= 0){
            continue;
        }

        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            continue;
        }

        advanceTemplate['leftTime'] = Math.ceil((new Date(advanceTemplate['beginTime']).getTime()- nowTime) / Minute);

        retMsg.aheadAdvance.push(advanceTemplate);
    }

    return retMsg;
};

// 活动是否在运行中
Handler.isRunningAdvance = function(attID){
    return this.runningAdvance[attID] != null;
};

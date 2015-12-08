/**
 * Created with JetBrains WebStorm.
 * User: yqWang
 * Date: 14-10-8
 * Time: 下午3:22
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var gameClient = require('../../tools/mysql/gameClient');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var redisManager = require('../chartRedis/redisManager');
var playerManager = require('../player/playerManager');
var utilSql = require('../../tools/mysql/utilSql');
var config = require('../../tools/config');
var util = require('util');
var _ = require('underscore');
var Q = require('q');
var activityExchangeTMgr = require('../../tools/template/ActivityExchangeTMgr');
var defaultValues = require('../../tools/defaultValues');
var operateActivityObject = require('./operateActivityObject');
var operateMail = require('./operateMail');

var Handler = module.exports;

Handler.Init = function () {
    this.startList = {};    //已经开始的活动脚本
    this.notifyList = {};   //预显示的活动ID(未开始)
    this.serviceTime = 0;       //开服时间
};
//判断活动的开启和关闭
Handler.JudgeTime = function () {
    var self = this;
    if (null == this.startList) {
        return;
    }
    var operateTemplate = templateManager.GetAllTemplate('OperateActivityTemplate');
    if (null == operateTemplate) {
        return;
    }

    var nowDate = new Date();
    for (var index in operateTemplate) {
        var temp = operateTemplate[index];
        var attID = temp[templateConst.tOperateActivity.attID];
        //活动开始类型
        var startType = temp[templateConst.tOperateActivity.startType];
        //活动类型
        var activeType = temp[templateConst.tOperateActivity.activeType];
        switch (startType) {
            case 0:
                //绝对时间
                var startDateTime = temp[templateConst.tOperateActivity.startDateTime];     //活动开始时间
                var endDateTime = temp[templateConst.tOperateActivity.endDateTime];         //活动结束时间
                var aheadTime = temp[templateConst.tOperateActivity.aheadTime];             //预显示提前秒数
                var notifyDateTime = new Date(new Date(startDateTime).getTime() - aheadTime * 1000);

                if (new Date(startDateTime) >= new Date(endDateTime)) {
                    continue;
                }

                if (nowDate >= new Date(startDateTime) && nowDate < new Date(endDateTime) && !_.has(self.startList,
                                                                                                    attID)) {
                    self.BeginOperate(attID, activeType);
                }
                if (nowDate >= new Date(endDateTime) && _.has(self.startList, attID)) {//结束活动
                    self.StopOperate(attID, activeType);
                }

                if (aheadTime > 0) {
                    //预显示活动
                    if (nowDate > notifyDateTime && nowDate < new Date(startDateTime)) {
                        if (!_.has(self.notifyList, attID)) {
                            self.NotifyOperate(attID);
                        }
                    }

                    if (nowDate >= new Date(startDateTime)) {
                        if (_.has(self.notifyList, attID)) {
                            //删除预显示
                            delete(self.notifyList[attID]);
                        }
                    }
                }
                break;
            case 1:
                var dateStr = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate() + ' ';
                var startDay = temp[templateConst.tOperateActivity.day];     //周几开始活动
                var startTime = dateStr + temp[templateConst.tOperateActivity.startTime];     //开始时间
                var relayTime = temp[templateConst.tOperateActivity.relayTime];     //持续时间(秒)
                var endTime = new Date(startTime).getTime() + relayTime * 1000;

                if (relayTime <= 0) {
                    continue;
                }

                if (startDay == nowDate.getDay() && nowDate >= new Date(startTime) && nowDate.getTime() < endTime
                    && !_.has(self.startList, attID)) {
                    self.BeginOperate(attID, activeType);
                }
                if (nowDate.getTime() >= endTime && _.has(self.startList, attID)) {
                    self.StopOperate(attID, activeType);
                }
                break;
            case 2:
                if (self.serviceTime == 0 || null == self.serviceTime) {
                    self.GetServiceTime();
                    return;
                }
                var startTime = self.serviceTime;   //开服时间
                var relayTime = temp[templateConst.tOperateActivity.relayTime];     //持续时间(秒)
                var endTime = new Date(startTime).getTime() + relayTime * 1000;              //结束时间

                if (relayTime <= 0) {
                    continue;
                }

                if (nowDate.getTime() < endTime && !_.has(self.startList, attID)) {
                    self.BeginOperate(attID, activeType);
                }
                if (nowDate.getTime() >= endTime && _.has(self.startList, attID)) {
                    self.StopOperate(attID, activeType);
                }
                break;
        }
    }
    //检测活动兑换表是否已经改变
    if (activityExchangeTMgr.HasChanged()) {
        var playerList = playerManager.GetAllPlayer();
        for (var id in playerList) {
            var player = playerList[id];
            player.GetExchangeManager().OnExchangeInfoChange();
        }
    }
    activityExchangeTMgr.ChangesInformed();
};

Handler.NotifyOperate = function (attID, activeType) {//预显示
    var self = this;
    self.notifyList[attID] = new operateActivityObject(attID, activeType);

    var tempRunner = self.notifyList[attID];
    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        if (!tempRunner.notify) {
            continue;
        }
        tempRunner.notify(tempPlayer);
    }
};

Handler.BeginOperate = function (attID, activeType) { //开始
    var self = this;
    // add to start list
    self.startList[attID] = new operateActivityObject(attID, activeType);

    var operateActivity = self.startList[attID];
    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        operateActivity.start(tempPlayer);
    }
};

//活动结束
Handler.StopOperate = function (activityId, activityType) {
    var self = this;
    var operateActivity = self.startList[activityId];
    var playerList = playerManager.GetAllPlayer();      //获取当前所有的在线玩家
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        operateActivity.stop(tempPlayer);
    }
    delete self.startList[activityId];

    if (activityType == templateConst.tOperateType.OPERATE_TYPE_2) {
        //7天充值
        self.ResetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_2);
    } else if (activityType == templateConst.tOperateType.OPERATE_TYPE_5) {
        //积分抽奖
        self.ResetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_5);
    } else if (activityType == templateConst.tOperateType.OPERATE_TYPE_11) {
        //宝箱抽奖
        self.ResetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_11);
    } else {
        //非排行榜活动采用活动id为参数,重置运营活动数据库
        self.ResetOperateInfo(activityId);
    }
};

Handler.OnLogin = function (player) {    //登录消息
    var self = this;
    for (var index in this.startList) {
        var tempRunner = self.startList[index];
        tempRunner.start(player);
    }

    for (var index in this.notifyList) {
        var tempRunner = self.notifyList[index];
        tempRunner.notify(player);
    }
};

Handler.GetOperateLeftTime = function (player, callback) {     //获取关卡剩余时间(秒)
    var self = this;
    var nowDate = new Date();
    var infos = [];
    for (var index in this.startList) {
        var msg = {};
        var attID = +index;
        var temp = templateManager.GetTemplateByID('OperateActivityTemplate', attID);
        if (null == temp) {
            continue;
        }
        var startType = temp[templateConst.tOperateActivity.startType];     //活动开始类型
        var activeType = temp[templateConst.tOperateActivity.activeType];     //活动开始类型
        var field = temp[templateConst.tOperateActivity.field];             //排行榜数据所在字段
        if (0 == startType) {       //绝对时间
            msg['attID'] = attID;
            var endDateTime = temp[templateConst.tOperateActivity.endDateTime];         //活动结束时间
            msg['leftTime'] = Math.floor((new Date(endDateTime).getTime() - nowDate.getTime()) / 1000);
        }
        else if (1 == startType) {  //相对时间
            msg['attID'] = attID;
            var dateStr = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate() + ' ';
            var startTime = dateStr + temp[templateConst.tOperateActivity.startTime];     //开始时间
            var relayTime = temp[templateConst.tOperateActivity.relayTime];     //持续时间(秒)
            var endTime = new Date(startTime).getTime() + relayTime * 1000;
            msg['leftTime'] = Math.floor((endTime - nowDate.getTime()) / 1000);
        }
        else if (2 == startType) {  //开服计时活动
            msg['attID'] = attID;
            var startTime = self.serviceTime;   //开服时间
            var relayTime = temp[templateConst.tOperateActivity.relayTime];     //持续时间(秒)
            var endTime = new Date(startTime).getTime() + relayTime * 1000;              //结束时间
            msg['leftTime'] = Math.floor((endTime - new Date().getTime()) / 1000);
        }

        if (activeType == templateConst.tOperateType.OPERATE_TYPE_2
                || activeType == templateConst.tOperateType.OPERATE_TYPE_5
                || activeType == templateConst.tOperateType.OPERATE_TYPE_11) {
            self.UpdateChartData(player, attID, activeType, temp[field]);
        }
        infos.push(msg);
    }
    return callback(null, {result: 0, infos: infos});
};


Handler.UpdateChartData = function (player, attID, activeType, dataStr) {     //填充排行榜数据
    var route = 'UpdateOperateChartInfo';
    var msg = {
        attID: attID
    };
    if (activeType == templateConst.tOperateType.OPERATE_TYPE_2) { //抽奖积分榜
        redisManager.GetAwardChart(player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                                   gameConst.eChartType.AwardScore,
                                   function (err, myChart, myScore, rankList) {
                                       if (!!err) {
                                           logger.error('get awardScore error: %s', utils.getErrorMessage(err));
                                           return;
                                       }
                                       if (null == myScore) {
                                           myChart = 0;
                                           myScore = 0;
                                       }
                                       dataStr = util.format(dataStr, myScore, myChart);
                                       for (var index = 0; index < 10; ++index) {
                                           if (null == rankList[index]) {
                                               rankList[index] = {name: '', score: 0};
                                           }
                                           dataStr = util.format(dataStr, rankList[index].name, rankList[index].score);
                                       }
                                       msg.chartStr = dataStr;
                                       player.SendMessage(route, msg);
                                   });
    }
    if (activeType == templateConst.tOperateType.OPERATE_TYPE_5) { //七日充值榜
        redisManager.GetSevenRechargeChart(player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                                           gameConst.eChartType.AwardScore,
                                           function (err, myChart, myScore, rankList) {
                                               if (!!err) {
                                                   logger.error('get awardScore error: %s', utils.getErrorMessage(err));
                                                   return;
                                               }
                                               if (null == myScore) {
                                                   myChart = 0;
                                                   myScore = 0;
                                               }
                                               dataStr = util.format(dataStr, myScore, myChart);
                                               for (var index = 0; index < 10; ++index) {
                                                   if (null == rankList[index]) {
                                                       rankList[index] = {name: '', score: 0};
                                                   }
                                                   dataStr =
                                                   util.format(dataStr, rankList[index].name, rankList[index].score);
                                               }
                                               msg.chartStr = dataStr;
                                               player.SendMessage(route, msg);
                                           });
    }
    if (activeType == templateConst.tOperateType.OPERATE_TYPE_11) { //宝箱排行榜
        redisManager.GetChestPointChart(player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                                        gameConst.eChartType.ChestPoint,
                                        function (err, myChart, myScore, rankList) {
                                            if (!!err) {
                                                logger.error('get chestPoint error: %s', utils.getErrorMessage(err));
                                                return;
                                            }
                                            if (null == myScore) {
                                                myChart = 0;
                                                myScore = 0;
                                            }
                                            dataStr = util.format(dataStr, myScore, myChart);
                                            for (var index = 0; index < 10; ++index) {
                                                if (null == rankList[index]) {
                                                    rankList[index] = {name: '', score: 0};
                                                }
                                                dataStr =
                                                util.format(dataStr, rankList[index].name, rankList[index].score);
                                            }
                                            msg.chartStr = dataStr;
                                            player.SendMessage(route, msg);
                                        });
    }
};
//重置运营活动信息以便循环开启
Handler.ResetOperateInfo = function (attID) {
    //获取当前所有的在线玩家
    var playerList = playerManager.GetAllPlayer();
    for (var index in playerList) {
        var tempPlayer = playerList[index];
        tempPlayer.GetoperateManager().ResetOperateInfo(attID);
    }
    var sqlStr = 'CALL sp_resetOperateInfo(?);';    //清除数据库中数据
    var args = [attID];
    for (var i = 0; i < config.mysql.global.loopCount; ++i) {
        Q.nfcall(gameClient.query, i, sqlStr, args)
            .catch(function (err) {
                       logger.error('reset seven recharge info error: %s', utils.getErrorMessage(err))
                   }).done();
    }
};

Handler.GetServiceTime = function () {   //到ps获取开服时间
    var self = this;
    pomelo.app.rpc.ps.psRemote.GetServiceTime(null, function (err, res) {
        if (!!err) {
            logger.error('Get Service Time err: %s', utils.getErrorMessage(err));
            return;
        }
        if (null != res) {
            self.serviceTime = res;
        }
    });
};



Handler.containOperateActivity = function (activityId) {
    var self = this;
    if (null == self.startList) {
        return false;
    }

    if(_.has(self.startList, activityId)) {
        return true;
    }
    return false;
};
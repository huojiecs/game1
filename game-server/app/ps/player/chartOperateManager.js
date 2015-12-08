/**
 * Created with JetBrains WebStorm.
 * User: yqWang
 * Date: 14-10-17
 * Time: 下午5:42
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var playerManager = require('./playerManager');
var redisManager = require('../../cs/chartRedis/redisManager');
var operateMail = require('../../cs/operateActivity/operateMail');
var gameConst = require('../../tools/constValue');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.Init = function () {
    this.chartOperateList = [];
};

Handler.updateChartOperate = function () {
    var self = this;
    if (null == self.chartOperateList) {
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

        if (activeType != templateConst.tOperateType.OPERATE_TYPE_2
            && activeType != templateConst.tOperateType.OPERATE_TYPE_5
            && activeType != templateConst.tOperateType.OPERATE_TYPE_11) {
            //如果不是排行榜类型的活动，继续循环
            continue;
        }

        switch (startType) {
            case 0:
                //绝对时间
                var startDateTime = temp[templateConst.tOperateActivity.startDateTime];     //活动开始时间
                var endDateTime = temp[templateConst.tOperateActivity.endDateTime];         //活动结束时间

                if (new Date(startDateTime) >= new Date(endDateTime)) {
                    continue;
                }

                if (nowDate >= new Date(startDateTime)
                    && nowDate < new Date(endDateTime)
                    && -1 == self.chartOperateList.indexOf(attID)) {
                    self.BeginChartOperate(attID, activeType);
                }
                if (nowDate >= new Date(endDateTime) && -1 != self.chartOperateList.indexOf(attID)) {//结束活动
                    self.StopChartOperate(attID, activeType);
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

                if (startDay == nowDate.getDay()
                    && nowDate >= new Date(startTime)
                    && nowDate.getTime() < endTime
                    && -1 == self.chartOperateList.indexOf(attID)) {
                    self.BeginChartOperate(attID, activeType);
                }
                if (nowDate.getTime() >= endTime && -1 != self.chartOperateList.indexOf(attID)) {
                    self.StopChartOperate(attID, activeType);
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

                if (nowDate.getTime() < endTime && -1 == self.chartOperateList.indexOf(attID)) {
                    self.BeginChartOperate(attID, activeType);
                }
                if (nowDate.getTime() >= endTime && -1 != self.chartOperateList.indexOf(attID)) {
                    self.StopChartOperate(attID, activeType);
                }
                break;
        }
    }
};

Handler.BeginChartOperate = function (activityId, activityType) { //开始
    logger.warn('BeginChartOperate activityId %j, activityType %j', activityId ,activityType);
    var self = this;
    // add to start list
    if (-1 == self.chartOperateList.indexOf(activityId)) {
        self.chartOperateList.push(activityId);
    }
};

//活动结束
Handler.StopChartOperate = function (activityId, activityType) {
    logger.warn('StopChartOperate activityId %j, activityType %j', activityId ,activityType);
    var self = this;
    if(-1 == self.chartOperateList.indexOf(activityId)) {
        return;
    }
    self.chartOperateList = _.without(self.chartOperateList, activityId);
    // 从ps进程中,调用定时器执行，排行榜活动结束
    //带排行榜的活动 10分钟后发奖,15分钟后清除redis
    if (activityType == templateConst.tOperateType.OPERATE_TYPE_2) {
        //积分抽奖
        setTimeout(function () {self.rewardByChartAwardScore(activityId);}, 10 * 60 * 1000);
        setTimeout(function () {redisManager.ClearAwardScore();}, 15 * 60 * 1000);
    } else if (activityType == templateConst.tOperateType.OPERATE_TYPE_5) {
        //充值榜
        setTimeout(function () {self.rewardByChartRecharge(activityId);}, 10 * 60 * 1000);
        setTimeout(function () {redisManager.ClearSevenRecharge();}, 15 * 60 * 1000);
    } else if (activityType == templateConst.tOperateType.OPERATE_TYPE_11) {
        //宝箱抽奖
        setTimeout(function () {self.rewardByChestPoint(activityId);}, 10 * 60 * 1000);
        setTimeout(function () {redisManager.ClearChestPoint();}, 15 * 60 * 1000);
    }
};

//根据抽奖积分排行榜发奖
Handler.rewardByChartAwardScore = function (activityId) {
    pomelo.app.rpc.chart.chartRemote.GetChart(null, 0, gameConst.eChartType.AwardScore,
                                              function (err, myChartID, myScore, rankList) {
                                                  logger.warn('rewardByChartAwardScore activityId %j rankList %j ', activityId, rankList);
                                                  if (!!err) {
                                                      logger.error('ERROR! rewardByChart error: %j',
                                                                   utils.getErrorMessage(err));
                                                      return;
                                                  }
                                                  operateMail.operateRewardByRankList(activityId, rankList);
                                              });
};

//根据充值排行榜发奖
Handler.rewardByChartRecharge = function (activityId) {
    pomelo.app.rpc.chart.chartRemote.GetChart(null, 0, gameConst.eChartType.Recharge,
                                              function (err, myChartID, myScore, rankList) {
                                                  logger.warn('rewardByChartRecharge activityId %j rankList %j ', activityId, rankList);
                                                  if (!!err) {
                                                      logger.error('ERROR! rewardByChartRecharge error: %j',
                                                                   utils.getErrorMessage(err));
                                                      return;
                                                  }
                                                  operateMail.operateRewardByRankList(activityId, rankList);
                                              });
};

//根据抽奖积分排行榜发奖
Handler.rewardByChestPoint = function (activityId) {
    var self = this;
    pomelo.app.rpc.chart.chartRemote.GetChart(null, 0, gameConst.eChartType.ChestPoint,
                                              function (err, myChartID, myScore, rankList) {
                                                  logger.warn('rewardByChestPoint activityId %j rankList %j ', activityId, rankList);
                                                  if (!!err) {
                                                      logger.error('ERROR! rewardByChart error: %j',
                                                                   utils.getErrorMessage(err));
                                                      return;
                                                  }
                                                  operateMail.operateRewardByRankList(activityId, rankList);
                                              });
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
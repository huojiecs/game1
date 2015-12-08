/**
 * Created by yqWang on 14-6-26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./../../../chart/chartManager');
var chartClimb = require('./../../../chart/chartClimb');
var chartMarry = require('./../../../chart/chartMarry');
var chartRewardManager = require('../../../chart/chartRewardManager');

module.exports = function (app) {
    return new Cron(app);
};

var Cron = function (app) {
    this.app = app;
};

var cron = Cron.prototype;

cron.refreshHonorChart = function () {
    if (chartManager == null) {
        return;
    }
};

cron.countOfHonorReward = function () { //荣耀排行榜初始化
    if (chartManager == null) {
        return;
    }
    chartManager.countOfHonorReward(function () {
        var list = pomelo.app.getServersByType('cs');
        if (!list || !list.length) {
            return;
        }
        for (var index in list) {
            var csSeverID = list[index].id;
            pomelo.app.rpc.cs.csRemote.countOfHonorReward(null, csSeverID, function (result) {
                if (result != 0) {
                    logger.error('countOfHonorReward:\n%j', result);
                }
            });
        }
    });
};

cron.sendRewardOfClimbSingleChart = function () { //爬塔单区排行榜周末前三名发奖
    logger.warn('**** sendRewardOfClimbSingleChart ****');
    chartClimb.sendRewardOfClimbSingleChart();
};

cron.clearClimbScore = function () {    //周末情况爬塔数据
    logger.warn('**** clearClimbScore ****');
    chartClimb.clearClimbScore();
};

/**
 * 每晚零点 8分， 刷新排行榜奖励
 * */
cron.refreshChartReward = function () {
    logger.warn('chartCron.refreshChartReward');

    try {
        chartRewardManager.balance(function(err) {
            if(err) {
                logger.error('refreshChartReward error!');
                return;
            }
            var list = pomelo.app.getServersByType('cs');
            if (!list || !list.length) {
                logger.error('No cs available. %j', list);
                return;
            }
            for (var index in list) {
                var csSeverID = list[index].id;
                pomelo.app.rpc.cs.csRemote.UpdateChartRewardOnline(null, csSeverID, function (result) {
                    if (result != 0) {
                        logger.error('UpdateChartRewardOnline:\n%j', result);
                    }
                });
            }
        });
    } catch (err) {
        logger.error("chartCron.refreshChartReward: %s", utils.getErrorMessage(err));
    }

};

//  刷新公会积分榜  和 婚姻 姻缘值排行榜 公用 ，每周日晚上23:56
cron.refreshChartUnionScoreReward = function () {
    logger.warn('chartCron.refreshChartUnionScoreReward');

    try {
        chartRewardManager.balanceUnionRank(function(err) {
            if(err) {
                logger.error('refreshChartReward error!');
                return;
            }
        });
    } catch (err) {
        logger.error("chartCron.refreshChartUnionScoreReward: %s", utils.getErrorMessage(err));
    }

};

//每天定时 23点 50分 刷新 姻缘值 排行榜
cron.refreshChartMarry = function () {    //每天刷新姻缘值排行榜
    logger.warn('###### refreshChartMarry #####');
    chartMarry.RefreshChartMarry();
};
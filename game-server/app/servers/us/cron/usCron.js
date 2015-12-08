/**
 * Created by yqWang on 14-6-26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var unionManager = require('./../../../us/union/unionManager');

module.exports = function (app) {
    return new Cron(app);
};

var Cron = function (app) {
    this.app = app;
};

var cron = Cron.prototype;

// 更新跨天
cron.Update12Info = function () {
    if (unionManager == null) {
        return;
    }
    logger.warn('UnionUpdate12Info');
    unionManager.UnionUpdate12Info();
};

// 更新跨周
cron.UpdateWeekInfo = function () {
    if (unionManager == null) {
        return;
    }
    logger.warn('UnionUpdateWeekInfo');
    unionManager.UnionUpdateWeekInfo();

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
};

// 周一晚上12点，创建报名角色的神兽
cron.UpdateFightInfo = function () {
    if (unionManager == null) {
        return;
    }

    logger.warn('UpdateFightInfo');
    unionManager.UnionUpdateAnimalInfo();
};

// 创建公会夺城战
cron.OnCreateUnionFight = function(){
    if (unionManager == null) {
        return;
    }

    logger.warn('OnCreateUnionFight');
    unionManager.createFight();
};



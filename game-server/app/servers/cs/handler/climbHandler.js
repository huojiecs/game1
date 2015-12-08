/**
 * Created by Administrator on 14-5-21.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../cs/player/playerManager');
var templateManager = require('../../../tools/templateManager');
var gameConst = require('../../../tools/constValue');


module.exports = function () {
    return new Handler();
};

var Handler = function () {
};
var handler = Handler.prototype;


handler.cengFinishResult = function (msg, session, next) {  //完成某一层后客户端传过来的结果，返回本次得分，今天得分，返回三个成就(时间，连击数，是否满血)
    var roleID = session.get("roleID");
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var climbManager = player.GetClimbManager();
    if (null == climbManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    climbManager.finishResult( msg, function (err, data) {
        return next(null, {
            'result': 0,
            'score': data.score,
            'todayScore': data.todayScore,
            'targetValue1Score': data.targetValue1,
            'targetValue2Score': data.targetValue2,
            'targetValue3Score': data.targetValue3
        });
    })
};

handler.addTimeWar = function (msg, session, next) {    //加时战斗，返回
    var roleID = session.get("roleID");
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole})
    }
    var climbManager = player.GetClimbManager();
    if (null == climbManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    var addTime = msg.addTime;
    var template = templateManager.GetTemplateByID('ClimbTemplate', msg.attID);
    if (addTime != template['addTime_Value_1'] && addTime != template['addTime_Value_2']) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }
    climbManager.addTimeWar( msg, function (err, data) {
        return next(null, {'result': data.result, 'addTime': data.addTime});
    })
};

handler.fastCar = function (msg, session, next) {
    var roleID = session.get("roleID");
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var climbManager = player.GetClimbManager();
    if (null == climbManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }

    climbManager.fastCar( msg, function (err, data) {
        if (!!err) {
            return next(null, {'result': errorCodes.toClientCode(err)});
        }
        return next(null, {'result': data.result, 'score': data.list});
    })

};

handler.luckNumber = function (msg, session, next) {    //转盘幸运数字
    var roleID = session.get("roleID");
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var climbManager = player.GetClimbManager();
    if (null == climbManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    var number = climbManager.getLuckNumber();
    return next(null, {'result': 0, 'number': number});
};

//进入爬塔返回好友排行和单区排行榜数据
handler.enterClimb = function (msg, session, next) {
    var roleID = session.get("roleID");
    var chartType = msg.type;
    if (null == roleID || null == chartType) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    if (chartType < gameConst.eClimbChartType.friendChart || chartType >= gameConst.eClimbChartType.MAX) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var climbManager = player.GetClimbManager();
    if (null == climbManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    climbManager.chartClimb(roleID, chartType, function (err, data) {
        if (typeof err === 'number') {
            return next(null, {'result': err, type: msg.type});
        }
        if (!!err) {
            return next(null, {'result': errorCodes.SystemWrong, type: msg.type});
        }

        return next(null, {
            type: data.type,
            myChart: data.chartID,
            myScore: data.myScore,
            myCengNum: data.myCengNum,
            days: data.days,
            chartList: data.chartList
        });

    });

};
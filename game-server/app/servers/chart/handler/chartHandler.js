/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-11-14
 * Time: 下午3:55
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('../../../chart/chartManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var _ = require('underscore');

var eChartType = gameConst.eChartType;
var eAcrossChartType = gameConst.eAcrossChartType;

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.GetChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }

    chartManager.GetChart(roleID, chartType, function (err, chartID, chartList) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }

        return next(null, {
            result: result,
            chartType: chartType,
            chartID: chartID,
            chartList: chartList
        });
    });
};
handler.GetWorldBossChart = function(msg,session,next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;
    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }
    chartManager.GetChart(roleID, chartType, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);
            
        if (!!result) {
            return next(null, {
                result: result
            })
        }
        chartInfo.result = errorCodes.OK; 
        return next(null, chartInfo);
    });
};
handler.GetClimbChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.type;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }

    chartManager.GetClimbChart(roleID, chartType, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        chartInfo.result = errorCodes.OK;
        return next(null, chartInfo);
    });
};

/**
 * 获取jjc 排行榜列表（分页）
 * "msg={
       chartType
       curPage\
}"
 * */
handler.getJjcChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;
    var curPage = +msg.curPage;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(curPage) || !_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }

    chartManager.GetJJCChart(roleID, chartType, curPage, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);
        if (!!result) {
            return next(null, {
                result: result
            });
        }

        delete chartInfo['myRanking'];
        chartInfo['chartType'] = chartType;
        chartInfo['curPage'] = curPage;
        chartInfo['result'] = errorCodes.OK;
        return next(null, chartInfo);
    });
};

/**
 * 获取邪神排行榜
 *
 * @param {Object} msg 请求消息 {chartType:7}
 * @param {Object} session 会话
 * @param {Function} next 回调函数
 * */
handler.GetSoulChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }
    chartManager.GetSoulChart(roleID, chartType, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        chartInfo.chartType = chartType;
        chartInfo.result = errorCodes.OK;
        return next(null, chartInfo);
    });
};

handler.GetUnionChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var unionID = msg.unionID;
    if (!roleID || null == unionID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    chartManager.GetUnionChart(roleID, unionID, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        chartInfo.result = errorCodes.OK;
        return next(null, chartInfo);
    });
};

handler.GetUnionScoreChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var unionID = msg.unionID;
    if (!roleID || null == unionID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    chartManager.GetUnionScoreChart(roleID, unionID, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        chartInfo.result = errorCodes.OK;
        return next(null, chartInfo);
    });
};

/**
 * 获取与排行榜前一名玩家的差值
 *
 * @param {Object} msg 请求消息 {chartType:7}
 * @param {Object} session 会话
 * @param {Function} next 回调函数
 * */
handler.GetDiffer = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }
    chartManager.GetDiffer(roleID, chartType, function (err, differ) {

        if (!!err) {
            return next(null, {
                result: errorCodes.toClientCode(err)
            });
        }
        differ.chartType = chartType;
        differ.result = errorCodes.OK;
        return next(null, differ);
    });
};

/**
 * 获取邪神竞技场排行榜
 *
 * @param {Object} msg 请求消息 {chartType:9}
 * @param {Object} session 会话
 * @param {Function} next 回调函数
 * */
handler.getSoulPvpChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }
    chartManager.GetSoulPvpChart(roleID, chartType, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        chartInfo.chartType = chartType;
        chartInfo.result = errorCodes.OK;
        return next(null, chartInfo);
    });
};

/**
 * 获取跨服排行榜
 *
 * @param {Object} msg 请求消息 {chartType:{0： 战力}}
 * @param {Object} session 会话
 * @param {Function} next 回调函数
 * */
handler.getAcrossChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = +msg.chartType;

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (!_.isNumber(chartType) || chartType < 0 || chartType >= eAcrossChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        });
    }
    chartManager.getAcrossChart(roleID, chartType, function (err, chartInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        chartInfo.chartType = chartType;
        chartInfo.result = errorCodes.OK;
        return next(null, chartInfo);
    });
};
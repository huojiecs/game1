/**
 * Created by Administrator on 14-1-17.
 */

var pomelo = require('pomelo');
var gameConst = require('../../../tools/constValue');
var templateManager = require('../../../tools/templateManager');
var teamManager = require('../../../rs/team/teamManager');
var occupantManager = require('../../../rs/occupant/occupantManager');
var playerManager = require('../../../rs/player/playerManager');
var rsSql = require('../../../tools/mysql/rsSql');
var eChartType = gameConst.eChartType;
var errorCodes = require('../../../tools/errorCodes');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.GetChart = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = msg.chartType;
    if (null == roleID || null == chartType) {
        return next(null, {
            result: errorCodes.ParameterNull
        })

    }
    if (chartType < 0 || chartType >= eChartType.Max) {
        return next(null, {
            result: errorCodes.ParameterWrong
        })
    }

    occupantManager.GetChart(function (result, chartList) {
        if (result == 0) {
            return next(null, {
                result: result,
                chartList: chartList
            });

        }
        else {
            return next(null, {
                result: errorCodes.toClientCode(result)
            });
        }
    });
};
/**
 * Created by xykong on 2014/8/26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var util = require('util');
var utils = require('./../tools/utils');
var gmSql = require('./../tools/mysql/gmSql');
var utilSql = require('./../tools/mysql/utilSql');
var errorCodes = require('./../tools/errorCodes');
var chartManager = require('./../chart/chartManager');
var chartRewardManager = require('./../chart/chartRewardManager');
var Q = require('q');
var _ = require('underscore');


var handler = module.exports = {
};

handler.Reload = function () {
    var module = './chartCommands';
    delete require.cache[require.resolve(module)];
    var chartCommands = require(module);
    pomelo.app.set('chartCommands', chartCommands);
    return errorCodes.OK;
};

handler.addBlackList = function () {
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];

    chartManager.AddBlackList(roleID);

    return errorCodes.OK;
};

/* 设置禁止参与排行榜信息（AQ） */
//[cmd]: 10084819
//
//[request]: IDIP_AQ_DO_BAN_JOINRANK_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "IsZeroRank" : ,      /* 是否清零榜单数据 0 否 1是 */
//    "Type" : ,          /* 榜单类型（1 炼狱榜，2 荣誉榜，3战力榜，4魔塔榜，5邪神榜，6活动榜，99全选） */
//    "Time" : ,       /* 禁止时长(秒) */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_BAN_JOINRANK_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_ban_joinrank = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };
        var roleID = +req_value.RoleId;
        var second = +req_value.Time;
        var isClear = +req_value.IsZeroRank;
        var openID = req_value.OpenId;
        var type = req_value.Type;

        Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
            .then(function (res) {
                      var accountID = res;
                      if (!roleID || !second || !accountID) {
                          rsp_result.Result = errorCodes.ParameterWrong;
                          rsp_result.RetErrMsg = 'ParameterWrong';

                          rsp_value.Result = errorCodes.ParameterWrong;
                          rsp_value.RetMsg = 'ParameterWrong';

                          return callback(null, [rsp_result, rsp_value]);
                      }

                      var canSendTime = new Date().getTime() + second * 1000;
                      chartManager.SetForbidTime(roleID, type, utilSql.DateToString(new Date(canSendTime)));
                      //将玩家踢下线
//                              var data_packet = {
//                                  body: {
//                                      accountID: accountID
//                                  },
//                                  command: {
//                                      "path": "kickUserOut",
//                                      "server": "psIdip"
//                                  }
//                              };
//                              pomelo.app.rpc.ps.psRemote.idipCommands(null, data_packet, utils.done);

                      if (1 == isClear) {
                          //将玩家排行榜数据清零
                          chartManager.ClearChartData(roleID, type);
                      }
                      gmSql.GetRoleForbidChartTime(roleID, function (err, res) {
                          if (!!err) {
                              rsp_result.Result = errorCodes.SystemWrong;
                              rsp_result.RetErrMsg = utils.getErrorMessage(err);
                              return callback(null, [rsp_result, rsp_value]);
                          }
                          var forbidChartList = {};
                          if (_.isEmpty(res[0]) == false && _.isEmpty(res[0]['forbidChart']) == false) {
                              forbidChartList = JSON.parse(res[0]['forbidChart']);
                          }

                          forbidChartList[type] = utilSql.DateToString(new Date(canSendTime));
                          forbidChartList = JSON.stringify(forbidChartList);
                          gmSql.SetForbidChartTime(roleID, forbidChartList, function (err, res) {
                              if (!!err) {
                                  rsp_result.Result = errorCodes.SystemWrong;
                                  rsp_result.RetErrMsg = utils.getErrorMessage(err);
                                  return callback(null, [rsp_result, rsp_value]);
                              }
                              return callback(null, [rsp_result, rsp_value]);
                          });
                      });
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = "SystemWrong";

                       rsp_value.Result = errorCodes.SystemWrong;
                       rsp_value.RetMsg = "parameter";

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();


    }
};

handler.refreshChartReward = function () {
    logger.warn('chartCommands.refreshChartReward');

    try {
        chartRewardManager.balance(function () {
            var list = pomelo.app.getServersByType('cs');
            if (!list || !list.length) {
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
        logger.error("chartCommands.refreshChartReward: %s", utils.getErrorMessage(err));
    }
};
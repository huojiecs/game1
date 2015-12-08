/**
 * Created by yqWang on 2014/10/23.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('./../rs/player/playerManager');
var occupantManager = require('./../rs/occupant/occupantManager');
var errorCodes = require('./../tools/errorCodes');
var utils = require('./../tools/utils');
var gmSql = require('./../tools/mysql/gmSql');
var gameConst = require('./../tools/constValue');
var Q = require('q');
var _ = require('underscore');


var handler = module.exports = {

};

handler.Reload = function () {
    var module = './rsCommands';
    delete require.cache[require.resolve(module)];
    var psCommands = require(module);
    pomelo.app.set('rsCommands', psCommands);
    return errorCodes.OK;
};

/* 设置副本关卡id占领状态（AQ） */
//[cmd]: 10084822
//
//[request]: IDIP_AQ_DO_SET_DUPPASS_STATUS_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "DupId" : ,        /* 关卡ID */
//    "Score" : ,        /* 占领积分 */
//    "Value" : ,        /* 占领状态(0 不占领 1 强制占领) */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_SET_DUPPASS_STATUS_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_set_duppass_status = function (req_value) {
    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK"
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var openID = '' + req_value.OpenId;
        var customID = +req_value.DupId;            //关卡ID
        var occupyScore = +req_value.Score;       //关卡积分
        var occupyTpye = +req_value.Value;         //占领状态(0 不占领 1 强制占领)
        if (!roleID || !customID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }
        var player = playerManager.GetPlayer(roleID);
        if (!!player) {
            var roleName = player.GetPlayerInfo(gameConst.ePlayerInfo.NAME);
            var unionID = player.GetPlayerInfo(gameConst.ePlayerInfo.UnionID);
            var unionName = player.GetPlayerInfo(gameConst.ePlayerInfo.UnionName);
            var accountID = player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID);
            var roleLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
            occupantManager.SetOccupantInfo(roleID, roleName, occupyScore, customID, unionID, unionName, occupyTpye, roleLevel);
            var data_packet = {
                body: {
                    roleID: roleID,
                    openID: openID,
                    accountID: accountID
                },
                command: {
                    "path": "kickUserOut",
                    "server": "psIdip"
                }
            };
            pomelo.app.rpc.psIdip.psIdipRemote.idipCommands(null, data_packet, utils.done);
            return callback(null, [rsp_result, rsp_value]);
        }
        gmSql.GetPlayerInfoForOccupy(roleID, function (err, res) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = utils.getErrorMessage(err);
                return callback(null, [rsp_result, rsp_value]);
            }

            if (!!res['_result']) {
                rsp_result.Result = errorCodes.NoRole;
                rsp_result.RetErrMsg = 'NoRole';

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            var roleName = res['_name'] || '';
            var unionID = res['_unionID'] || 0;
            var unionName = res['_unionName'] || '';
            occupantManager.SetOccupantInfo(roleID, roleName, occupyScore, customID, unionID, unionName, occupyTpye, roleLevel);
            return callback(null, [rsp_result, rsp_value]);
        });
    }
};

handler.SendAllOccupantPrize = function() {     //炼狱所有关卡发奖接口(合服前使用，会清空所有炼狱关卡的占领数据)
    occupantManager.SendAllCusPrize();      //炼狱发奖
    return errorCodes.OK;
};
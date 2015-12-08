/**
 * The file jsCommands.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/17 13:15:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('./../tools/errorCodes');
var playerManager = require('../js/player/playerManager');
var jjcManager = require('../js/jjc/jjcManager');
var utils = require('./../tools/utils');
var gameConst = require('./../tools/constValue');
var Q = require('q');
var _ = require('underscore');

var eJJCInfo = gameConst.eJJCInfo;

/**
 * js command 命令
 * */
var handler = module.exports = {

};

handler.Reload = function () {
    var module = './jsCommands';
    delete require.cache[require.resolve(module)];
    var jsCommands = require(module);
    pomelo.app.set('jsCommands', jsCommands);
    return errorCodes.OK;
};

/**
 *测试handler 消息
 * */
handler.handlerMsg = function (msg) {
    return function (callback) {
        var rsp_result = {};
        var rsp_value = {};

        if (msg.type == 1) {
            rsp_value.resp = getRoleJJCMsg(msg);
        } else if (msg.type == 2){
            rsp_value.resp = requestBattle(msg);
        }

        rsp_result.Result = errorCodes.OK;
        rsp_result.RetErrMsg = 'OK';

        rsp_value.Result = errorCodes.OK;
        rsp_value.RetMsg = 'OK';

        return callback(null, [rsp_result, rsp_value]);
    };
};

/**
 * 获取玩家jjc 信息
 * @param {object} msg 传送消息
 * @return {object}
 * */
var getRoleJJCMsg = function(msg) {
    var player = playerManager.GetPlayer(msg.roleID);
    if (null == player) {

        return {err :'no role'};
    }
    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {

        return {err :'no role'};
    }

    return  {
        result: 0,
        winNum: roleJJCManager.GetJJCInfo(eJJCInfo.WINNUM),
        winRate: roleJJCManager.GetJJCWinRate(),
        credits: roleJJCManager.GetJJCInfo(eJJCInfo.CREDIS),
        maxStreaking: roleJJCManager.GetJJCInfo(eJJCInfo.MaxStreaking),
        streaking: roleJJCManager.GetJJCInfo(eJJCInfo.Streaking),
        jjcCoin: roleJJCManager.GetJJCInfo(eJJCInfo.JjcCoin),
        ranking: roleJJCManager.GetJJCInfo(eJJCInfo.Ranking),
        lastRanking: roleJJCManager.GetJJCInfo(eJJCInfo.LastRanking),
        friendRanking: roleJJCManager.GetJJCInfo(eJJCInfo.FriendRanking),
        acrossRanking: roleJJCManager.GetJJCInfo(eJJCInfo.AcrossRanking),
        lastAccrossRanking: roleJJCManager.GetJJCInfo(eJJCInfo.LastAccrossRanking),
        cutTime: jjcManager.getCutTime(),
        acrossCutTime: '',
        RRStats: 1,
        ARRStats: 1,
        DRStatus: 1,
        jjcStartTime: jjcManager.getShowTime(),
        isStart: jjcManager.isStartBattle()? 0: 1,
        reTimes: roleJJCManager.GetJJCInfo(eJJCInfo.DayChallengeTimes)
    };
}


/**
 * 请求战斗
 * @param {object} msg 传送消息
 * @return {object}
 * */
var requestBattle = function(msg) {
    var player = playerManager.GetPlayer(msg.roleID);
    if (null == player) {

        return {err :'no role'};
    }
    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {

        return {err :'no role'};
    }
    return {
        result: jjcManager.requestBattle(player)
    }
}




/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/6/10
 * To change this template use File | Setting |File Template
 */
var defaultValue = require('../../tools/defaultValues');
var gameConst = require('../../tools/constValue');
var uitls = require('../../tools/utils');
var eJJCInfo = gameConst.eJJCInfo;
var jjcManager = require('../jjc/jjcManager');

/**
 * 初始化 玩家jjc 数据 太麻烦了， 也不是办法啊
 * @return {Array} 初始化数组
 * @api private
 * */
var factory = module.exports;
factory.init = function () {
};


/**
 * @Brief: 创建玩家初始化数据
 *
 * @param {Object} owner 创建数据的玩家
 * */
factory.createDefaultInfo = function (owner) {
    var data = new Array(eJJCInfo.MAX);
    data[eJJCInfo.ROLEID] = owner.GetId();
    data[eJJCInfo.WINNUM] = 0;
    data[eJJCInfo.TOTALNUM] = 0;
    data[eJJCInfo.CREDIS] = defaultValue.JJC_DefaultCredits;
    data[eJJCInfo.MaxStreaking] = 0;
    data[eJJCInfo.Streaking] = 0;
    data[eJJCInfo.JjcCoin] = 0;
    data[eJJCInfo.Ranking] = 0;
    data[eJJCInfo.LastRanking] = 0;
    data[eJJCInfo.FriendRanking] = 0;
    data[eJJCInfo.AcrossRanking] = 0;
    data[eJJCInfo.LastAccrossRanking] = 0;
    data[eJJCInfo.DayChallengeTimes] = 0;
    data[eJJCInfo.RefreshChallengeTime] = 0;
    data[eJJCInfo.LastRewardTime] = 0;
    data[eJJCInfo.LastAcrossRewardTime] = 0;
    data[eJJCInfo.LastDayRewardTime] = 0;
    data[eJJCInfo.VipBugTimes] = 0;
    data[eJJCInfo.LastvipBugTime] = 0;
    data[eJJCInfo.Phase] = uitls.getMonthOfYear2(new Date);
    return data;
};

/**
 * @Brief: 创建个人显示数据
 *
 * @param {Number} rank  排名
 * @param {Object} jjcData 竞技场信息
 * @param {Array} roleInfo 竞技场信息
 * @return Object
 * */
factory.buildPersonShowInfo = function(rank, jjcData, roleInfo) {

    var showInfo = {
        'roleID': roleInfo['roleID'],
        'ranking': rank,
        'roleName': roleInfo['name'],
        'friendName': roleInfo['nickName'],
        'zhanli': roleInfo['zhanli'],
        'openID': roleInfo['openID'],
        'picture': roleInfo['picture'],
        'expLevel': roleInfo['expLevel'],
        'serverName': '',
        'credits': jjcData.GetJJCInfo(eJJCInfo.CREDIS),
        'jjcCoin': jjcData.GetJJCInfo(eJJCInfo.JjcCoin),
        'winNum': jjcData.GetJJCInfo(eJJCInfo.WINNUM),
        'winRate': jjcData.GetWinRate(),
        'streaking': jjcData.GetJJCInfo(eJJCInfo.Streaking),
        'maxStreaking': jjcData.GetJJCInfo(eJJCInfo.MaxStreaking)
    };

    return showInfo;
};

/**
 * @Brief: 计算胜率
 *
 * @param {Number} winNum 获胜场次
 * @param {Number} totalNum 总战斗次数
 * @return {Number}
 * */
factory.calWinRate = function(winNum, totalNum) {
    return Math.floor((winNum/totalNum) * 100);
};

/**
 * @Brief: 获取竞技场主界面信息
 *
 * @param {Number} rank  排名
 * @param {Object} jjcData 竞技场信息
 * @return {Object}
 * */
factory.buildMainPageInfo = function(rank, jjcData) {

    var mainInfo = {
        'ranking': rank,
        'lastRanking': jjcData.GetJJCInfo(eJJCInfo.LastRanking),
        'friendRanking': jjcData.GetFriRanking(),
        'acrossRanking': jjcData.GetJJCInfo(eJJCInfo.AcrossRanking),
        'lastAccrossRanking': jjcData.GetJJCInfo(eJJCInfo.LastAccrossRanking),
        'cutTime': jjcManager.getCutTime(),
        'acrossCutTime': '',
        'RRStats': jjcData.IsGetReward()? 1: 2,
        'ARRStats': 1,
        'DRStatus': jjcData.IsFinishDayBattle()? (jjcData.IsGetDayReward()? 0: 2) : 1,
        'jjcStartTime': jjcManager.getShowTime(),
        'isStart': jjcManager.isStartBattle()? 0: 1,
        'reTimes': jjcData.GetReBattleTimes(),
        'shopTimes': jjcData.GetVipBugTimes()
    };
    return mainInfo;
};

/**
 * @Brief: 创建玩家redis 存储数据
 *
 * @param {Number} roleID 玩家ID
 * @param {Object} data 玩家jjcInfo
 * @return {Object}
 * */
factory.buildInfoToRedis = function(roleID, data) {
    var info = {
        'roleID': roleID,
        'credits': data.GetJJCInfo(eJJCInfo.CREDIS),
        'jjcCoin': data.GetJJCInfo(eJJCInfo.JjcCoin),
        'winNum': data.GetJJCInfo(eJJCInfo.WINNUM),
        'totalNum': data.GetJJCInfo(eJJCInfo.TOTALNUM),
        'streaking': data.GetJJCInfo(eJJCInfo.Streaking),
        'maxStreaking': data.GetJJCInfo(eJJCInfo.MaxStreaking),
        'phase' : data.GetJJCInfo(eJJCInfo.Phase)
    };

    return info;
};
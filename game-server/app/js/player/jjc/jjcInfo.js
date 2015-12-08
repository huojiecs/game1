/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/6/12
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var defaultValue = require('../../../tools/defaultValues');
var utils = require('../../../tools/utils');
var utilSql = require('../../../tools/mysql/utilSql');
var templateManager = require('../../../tools/templateManager');
var playerManager = require('../playerManager');
var defaultValues = require('../../../tools/defaultValues');
var errorCodes = require('../../../tools/errorCodes');
var eJJCInfo = gameConst.eJJCInfo;
var ePlayerInfo = gameConst.ePlayerInfo;

/**
 * jjc 竞技数据
 * */
module.exports = function (jjcInfo) {
    return new Handler(jjcInfo);
};

var Handler = function (jjcInfo) {
    /** 玩家竞技场消息*/
    this.data = jjcInfo;
    /** 数据标识位*/
    this.dirty = false;
};

var handler = Handler.prototype;

/**
 * @Brief: 新建一行数据
 *
 * @param {Array} allInfo 竞技场数据
 * */
handler.Insert = function (allInfo) {
    this.data = allInfo;
    this.dirty = true;
};

/**
 * @Brief: 是否是脏数据
 *
 * return Boolean
 * */
handler.IsDirty = function () {
    return this.dirty;
};

/**
 * @Brief: 标识脏数据
 *
 * */
handler.MarkDirty = function () {
    this.dirty = true;
};

/**
 * @Brief: 标识为干净数据
 *
 * @api public
 * */
handler.RemarkDirty = function () {
    this.dirty = false;
};

/**
 * 获取存储字符串
 *
 * @return {String}
 * */
handler.GetSqlStr = function () {
    var sqlStr = '';
    var temp = this.data;
    sqlStr += '(';
    for (var i = 0; i < eJJCInfo.MAX; i++) {
        var value = temp[i];
        sqlStr += value + ',';
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
    sqlStr += ')';

    var sqlString = utilSql.BuildSqlValues([this.data]);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;
};

/**
 * @检查当前信息期数 是否是当前信息
 *
 * @return {boolean}
 * */
handler.CheckIsCurPhase = function() {
    return this.data[eJJCInfo.Phase] == utils.getMonthOfYear2(new Date());
};

/**
 * 获取玩家jjc数据
 * @return {Array}
 * @api public
 * */
handler.GetJJCData = function () {
    return this.data;
};

/**
 * @Brief: 获取玩家jjc数据
 *
 * @param {number} index 数据下标
 * @return {number}
 * @api public
 * */
handler.GetJJCInfo = function (index) {
    return this.data[index];
};

/**
 * @Brief: 计算胜率
 *
 * @param {Number} winNum 获胜场次
 * @param {Number} totalNum 总战斗次数
 * @return {Number}
 * */
handler.GetWinRate = function () {
    var data = this.data;
    if (!data[eJJCInfo.WINNUM] || !data[eJJCInfo.TOTALNUM]) {
        return 0;
    } else {
        return Math.floor(data[eJJCInfo.WINNUM] / data[eJJCInfo.TOTALNUM] * 100);
    }
};

/**
 * @Brief: 设置玩家jjc数据
 *
 * @param {Number} index 数据下标
 * @param {Number} value 数据值
 * @return {number}
 * @api public
 * */
handler.SetJJCInfo = function (index, value) {
    this.data[index] = value;
    this.MarkDirty();
};

/**
 *
 *
 *
 * */
handler.IsCanBattle = function () {
};

/**
 * @Brief: 是否领取过奖励
 *
 * @Return Boolean
 * */
handler.IsGetReward = function () {
    /** 根据这个月是否有领取奖励记录时间 */
    return utils.isTheSameMonth(new Date().getTime(), utils.minuteToSec(this.GetJJCInfo(eJJCInfo.LastRewardTime)));
};

/**
 * @Brief: 是否完成每日挑战
 *
 * @return Boolean
 * */
handler.IsFinishDayBattle = function () {
    /** 根据这个月是否有领取奖励记录时间 */
    return this.GetJJCInfo(eJJCInfo.DayChallengeTimes) >= defaultValue.JJC_DAY_BATTLE_TIMES;
};

/**
 * @Brief: 是否领取过每日奖励
 *
 * @Return Boolean
 * */
handler.IsGetDayReward = function () {
    /** 根据这个月是否有领取奖励记录时间 */
    return utils.isTheSameDay(new Date().getTime(), utils.minuteToSec(this.GetJJCInfo(eJJCInfo.LastDayRewardTime)));
};

/**
 * @Brief: 获取vip购买剩余次数
 *
 * @return {Number}
 * */
handler.GetVipBugTimes = function () {

    if (!utils.isTheSameDay(new Date().getTime(), utils.minuteToSec(this.GetJJCInfo(eJJCInfo.LastvipBugTime)))) {
        this.SetJJCInfo(eJJCInfo.VipBugTimes, 0);
        this.SetJJCInfo(eJJCInfo.LastvipBugTime, utils.getCurMinute());
    }

    return this.GetJJCInfo(eJJCInfo.VipBugTimes);
};

/**
 * @Brief: 获取玩家剩余购买次数
 *
 * @return {Number}
 * */
handler.GetReVipBugTimes = function () {

    var player = playerManager.GetPlayer(this.GetJJCInfo(eJJCInfo.ROLEID));
    if (!player) {
        return 0;
    }

    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;

    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }

    if (null == vipTemplate) {
        return 0;
    }

    var shopTimes = this.GetVipBugTimes();
    var totalShopTimes = vipTemplate['buySyncPVPNum'];

    return totalShopTimes - shopTimes;
};

/**
 * @Brief: 获取战斗剩余次数
 *
 * @return {Number}
 * */
handler.GetReBattleTimes = function () {

    if (!utils.isTheSameDay(new Date().getTime(), utils.minuteToSec(this.GetJJCInfo(eJJCInfo.RefreshChallengeTime)))) {
        this.SetJJCInfo(eJJCInfo.DayChallengeTimes, 0);
        this.SetJJCInfo(eJJCInfo.RefreshChallengeTime, utils.getCurMinute());
    }

    var allNum = 10;
    var AllTemplate = templateManager.GetTemplateByID('AllTemplate', 247);//直通车的消耗
    if(AllTemplate != null){
        allNum = AllTemplate['attnum']
    }

    return allNum + this.GetJJCInfo(eJJCInfo.VipBugTimes)
        - this.GetJJCInfo(eJJCInfo.DayChallengeTimes);
};

/**
 * @Brief： 添加挑战次数
 *
 * @return {Number}
 * */
handler.AddChallengeTimes = function() {
    this.SetJJCInfo(eJJCInfo.DayChallengeTimes, this.GetJJCInfo(eJJCInfo.DayChallengeTimes) + 1);
};

/**
 * @Brief: 获取连胜加成竞技币  --- 竞技币连胜加成：(N-1)*2，其中N为连胜场次
 *
 * @return {Number}
 * */
handler.GetStreakingAddCoin = function() {
    return (this.GetJJCInfo(eJJCInfo.Streaking) -  1) * 2;
};

/**
 * @Brief: 获取连胜加成积分  --- 积分连胜加成：N-1，其中N为连胜场次
 *
 * @return {Number}
 * */
handler.GetStreakingAddCredits = function() {
    return this.GetJJCInfo(eJJCInfo.Streaking) -  1;
};

/**
 * @Brief: 获取好友排行榜， 因为好友排行榜
 *
 * @return {Number}
 * */
handler.GetFriRanking = function () {
    if (!this.refreshFriRankTime || utils.getCurMinute() -
                                    this.refreshFriRankTime > defaultValues.JJC_DEFAULT_OPEN_LEVEL) {
        this.refreshFriRankTime = utils.getCurMinute();
        var self = this;
        pomelo.app.rpc.chart.chartRemote.GetJJCFriRanking(null, this.GetJJCInfo(eJJCInfo.ROLEID), function (err, res) {
            if (!!err || errorCodes.OK != res.result) {
                logger.error('GetFriRanking get fri ranking err: %s -- res: %j', utils.getErrorMessage(err), res);
            } else {
                self.data[eJJCInfo.FriendRanking] = res.ranking;
            }

        });
    }

    return this.GetJJCInfo(eJJCInfo.FriendRanking);
};

/**
 * @获取玩家信息 roleDetail jjcInfo 存储信息
 *
 * @return {Object}
 * */
handler.GetDataForRoleDetail = function() {
    return {
        'roleID': jjcInfo[eJJCInfo.ROLEID] || 0,
        'ranking': 0,
        'roleName': '',
        'friendName': '',
        'zhanli': 0,
        'openID': '',
        'picture': '',
        'expLevel': 0,
        'serverName': '',
        'credits': this.GetJJCInfo(eJJCInfo.CREDIS) || 0,
        'jjcCoin': 0,
        'winNum': this.GetJJCInfo(eJJCInfo.WINNUM) || 0,
        'winRate': this.GetWinRate() || 0,
        'streaking': 0,
        'maxStreaking': 0,
        'phase': ( '' + this.GetJJCInfo(eJJCInfo.Phase) || '')
    }
};
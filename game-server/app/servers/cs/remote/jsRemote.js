/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/6/17
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../cs/player/playerManager');
var errorCodes = require('../../../tools/errorCodes');
var jjcRewardTMgr = require('../../../tools/template/jjcRewardTMgr');
var jjcDayRewardTMgr = require('../../../tools/template/jjcDayRewardTMgr');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var globalFunction = require('../../../tools/globalFunction');

var eAssetsChangeReason = gameConst.eAssetsChangeReason;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

/**
 * @Brief: 竞技场发放排行榜奖励
 *
 * @param {String} csID 玩家所在cs ID
 * @param {Number} roleID  玩家id
 * @param {Number} rank 玩家排行
 * @param {Function} callback 回调函数
 * */
handler.JjcRankingReward = function (csID, roleID, rank, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(null, {result: errorCodes.NoRole});
    }

    /** 根据排行获取奖励模板*/
    var temp = jjcRewardTMgr.GetTempByRank(rank, utils.getPreMonthOfYear(new Date()));
    if (!temp) {
        return callback(null, {result: errorCodes.JJC_RANK_CAN_NOT_GET_REWARD});
    }

    var itemList = [];

    /** 获取单区榜奖励*/
    for (var index = 0; index < 3; index++) {
        var assetsID = temp['assetsID_' + index];
        var assetsNum = temp['assetsNum_' + index];
        if (!!assetsID && !!assetsNum) {
            itemList.push({assetsID: assetsID, assetsNum: assetsNum});
            player.assetsManager.AlterAssetsValue(assetsID, assetsNum, eAssetsChangeReason.Add.JjcRankingReward);
        }
    }

    return callback(null, {result: errorCodes.OK, itemList: itemList});
};

/**
 * @Brief: 竞技场发放每日奖励
 *
 * @param {String} csID 玩家所在cs ID
 * @param {Number} roleID  玩家id
 * @param {Number} credits 玩家积分
 * @param {Function} callback 回调函数
 * */
handler.JjcDayReward = function (csID, roleID, credits, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(null, {result: errorCodes.NoRole});
    }

    /** 根据排行获取奖励模板*/
    var temp = jjcDayRewardTMgr.GetTempByCredits(credits);
    if (!temp) {
        logger.error('cs GetDayReward get template null credits: %d, roleID: %d', credits, roleID);
        return callback(null, {result: errorCodes.JJC_NOT_FINISH_DAY_BATTLE});
    }

    var itemList = [];

    /** 获取单区榜奖励*/
    for (var index = 0; index < 4; index++) {
        var assetsID = temp['assetsID_' + index];
        var assetsNum = temp['assetsNum_' + index];
        var assetsPercent = temp['assetsPercent_' + index];
        if (!!assetsID && !!assetsNum && parseInt(Math.random() * 100, 10) <= assetsPercent) {
            itemList.push({assetsID: assetsID, assetsNum: assetsNum});
            player.assetsManager.AlterAssetsValue(assetsID, assetsNum, eAssetsChangeReason.Add.JjcDayReward);
        }
    }

    return callback(null, {result: errorCodes.OK, itemList: itemList});
};

/**
 * @Brief: 购买竞技场次数， 扣除砖石
 *
 * @param {String} csID 玩家所在cs ID
 * @param {Number} roleID  玩家id
 * @param {Number} price 玩家积分
 * @param {Function} callback 回调函数
 * */
handler.ShopBattleTimes = function (csID, roleID, price, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    if (!player.assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, price)) {
        return callback(errorCodes.NoYuanBao);
    }

    player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -price,
                                          eAssetsChangeReason.Reduce.JjcShopTimes);
    return callback();
};
/**
 * Created by kazi on 14-3-13.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var asyncPvPManager = require('../../../pvp/asyncPvPManager');
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var templateManager = require('../../../tools/templateManager');
var errorCodes = require('../../../tools/errorCodes');
var globalFunction = require('../../../tools/globalFunction');

var eAssetsChangeReason = gameConst.eAssetsChangeReason;
var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;


handler.AsyncPvPAccomplishLose = function (csID, roleID, params, callback) {
    logger.info("handler.AsyncPvPAccomplishLose " + csID + " " + roleID);
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(new Error('no such player!'), null);
    }

    player.asyncPvPManager.AsyncPvPAccomplishLose(params, true, function (err, res) {
        return callback(err, res);
    });
};

handler.Bless = function (csID, roleID, params, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    player.asyncPvPManager.Bless(params, function (err, result) {
        return callback(null, result);
    });
};

handler.RequireBlessing = function (csID, roleID, params, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    player.asyncPvPManager.RequireBlessing(params, function (err, result) {
        return callback(null, result);
    });
};

handler.BlessReceived = function (csID, roleID, params, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    player.asyncPvPManager.BlessReceived(params, function (err, result) {
        if (!!err) {
            return callback(err);
        }
        return callback(null, result);
    });
};

/**
 * max rank in history and and masonry
 *
 * @param {Number} csID 玩家csID
 * @param {Number} roleID 玩家id
 * @param {Number} addValue 添加奖励
 * @param {Function} callback
 * @api public
 * */
handler.aresMaxRankReward = function (csID, roleID, addValue, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), addValue,
                                          eAssetsChangeReason.Add.AresMaxRank);
    return callback();
};

/**
 * max rank in history and and masonry
 *
 * @param {Number} csID 玩家csID
 * @param {Number} roleID 玩家id
 * @param {Number} deleteValue 添加奖励
 * @param {Function} callback
 * @api public
 * */
handler.areVipShop = function (csID, roleID, deleteValue, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    if (!player.assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, deleteValue)) {
        return callback(errorCodes.NoYuanBao, null);
    }

    player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -deleteValue,
                                          eAssetsChangeReason.Reduce.AresVipShop);
    return callback();
};


/**
 * soul pvp battle cost yuanbao
 *
 * @param {Number} csID 玩家csID
 * @param {Number} shopTimes 战斗购买次数
 * @param {Number} roleID 玩家id
 * @param {Number} deleteValue 添加奖励
 * @param {Function} callback
 * @api public
 * */
handler.soulPvpVipShop = function (csID, shopTimes, roleID, deleteValue, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var temp = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);

    if (!temp || temp.buySoulPVPNum <= shopTimes) {
        return callback(errorCodes.SOUL_PVP_VIP_SHOP_TIMES);
    }

    if (!player.assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, deleteValue)) {
        return callback(errorCodes.NoYuanBao, null);
    }

    player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -deleteValue,
                                          eAssetsChangeReason.Reduce.SoulPvpVipShop);
    return callback();
};

/**
 * @Brief: clear cd time
 * ---------------------
 *
 * @param {Number} csID 玩家csID
 * @param {Number} roleID 玩家id
 * @param {Number} deleteValue 添加奖励
 * @param {Function} callback
 * @api public
 * */
handler.soulPvpClearCDTime = function (csID, roleID, deleteValue, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    if (!player.assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, deleteValue)) {
        return callback(errorCodes.NoYuanBao, null);
    }

    player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -deleteValue,
                                          eAssetsChangeReason.Reduce.SoulPvpClearCDTime);
    return callback();
};

/**
 * @Brief: 添加邪神竞技币
 *
 * @param {Number} csID 玩家csID
 * @param {Number} roleID 玩家id
 * @param {Number} addValue 添加奖励
 * @param {Function} callback
 * @api public
 * */
handler.soulPvpAddMedal = function (csID, roleID, addValue, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    player.assetsManager.AlterAssetsValue(globalFunction.GetSoulPvpTemp(), addValue,
                                          eAssetsChangeReason.Add.SoulPvp);
    return callback();
};

/**
 * @Brief: 获取竞技币 -- 财产
 *
 * @param {Number} csID 玩家csID
 * @param {Number} roleID 玩家id
 * @param {Function} callback
 * @api public
 * */
handler.GetSoulPvpMedal = function (csID, roleID, callback) {

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return callback(errorCodes.NoRole);
    }

    var value = player.assetsManager.GetAssetsValue(globalFunction.GetSoulPvpTemp());
    return callback(null, {value: value});
};
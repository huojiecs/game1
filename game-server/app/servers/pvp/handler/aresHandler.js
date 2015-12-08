/**
 * The file aresHandler.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/9 18:21:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../pvp/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var util = require('util');
var _ = require('underscore');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * get ares main page info
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.getAresInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        logger.warn('pvp get ares info is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('pvp get ares info is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var aresManager = player.GetRoleAresManager();

    if (!aresManager) {
        logger.warn('pvp get ares info is none ares manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!aresManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.ARES_LEVEL_LACK,
            'message': '开启战神榜等级不足'
        });
    }

    aresManager.getMainInfo(function(err, aresInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        aresInfo.result = errorCodes.OK;
        //logger.error('chart msg: %j', aresInfo);
        return next(null, aresInfo);
    });
};

/**
 * request battle
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.requestBattle = function (msg, session, next) {
    var roleID = session.get('roleID');
    var rivalID = msg.rivalID;
    var rivalRank = msg.rivalRank;
    var myRank = msg.myRank;
    var isVipShop = msg.isVipShop;

    if (!roleID || !rivalID || !rivalRank || !myRank) {
        logger.warn('pvp get ares info is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('pvp get ares info is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var aresManager = player.GetRoleAresManager();

    if (!aresManager) {
        logger.warn('pvp get ares info is none ares manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    /** 判断等级是否 充足*/
    if (!aresManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.ARES_LEVEL_LACK,
            'message': '开启战神榜等级不足'
        });
    }

    aresManager.requestBattle(rivalID, myRank, rivalRank, isVipShop, function(err, aresInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        aresInfo.result = errorCodes.OK;
        //logger.error('requestBattle msg: %j', aresInfo);
        return next(null, aresInfo);
    });
};


/**
 *  battle over do balance
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.battleOver = function (msg, session, next) {
    var roleID = session.get('roleID');
    var winID = msg.winID;
    var roundID = msg.roundID;

    if (!roleID || !winID || !roundID) {
        logger.warn('pvp get ares info is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('pvp get ares info is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var aresManager = player.GetRoleAresManager();

    if (!aresManager) {
        logger.warn('pvp get ares info is none ares manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    /** 判断等级是否 充足*/
    if (!aresManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.ARES_LEVEL_LACK,
            'message': '开启战神榜等级不足'
        });
    }

    aresManager.battleOver(winID, roundID, function(err, aresInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        aresInfo.result = errorCodes.OK;
        //logger.error('battleOver msg: %j', aresInfo);
        return next(null, aresInfo);
    });
};
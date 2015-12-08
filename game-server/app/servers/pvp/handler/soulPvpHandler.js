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
var templateManager = require('../../../tools/templateManager');
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
 * get my soul pvp  main page info
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.GetMySoulPVPInfo  = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        logger.warn('GetMySoulPVPInfo is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('GetMySoulPVPInfo is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('GetMySoulPVPInfo is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.GetMySoulPVPInfo(function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        //logger.error('chart msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
    });
};

/**
 * @Brief: get SoulPVPPlayerList  main page info
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.GetSoulPVPPlayerList  = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        logger.warn('GetSoulPVPPlayerList is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('GetSoulPVPPlayerList is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('GetSoulPVPPlayerList is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.GetSoulPVPPlayerList(function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        //logger.error('chart msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
    });
};

/**
 * @Brief: SetDefenseCast
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.SetDefenseCast  = function (msg, session, next) {
    var roleID = session.get('roleID');

    var defense1 = msg.defense1;
    var defense2 = msg.defense2;
    var defense3 = msg.defense3;

    if (!roleID) {
        logger.warn('SetDefenseCast is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!defense1 && !defense2 && !defense3) {
        logger.warn('soul pvp SetDefenseCast is ParameterWrong: %j, %j, %j', defense1, defense2, defense3);
        return next(null, {
            'result': errorCodes.SOUL_PVP_NO_DEFENCE_CAST
        });
    }

    var temps = templateManager.GetAllTemplate('SoulTemplate');

    if (!!defense1 && !temps[defense1]) {
        logger.warn('SetDefenseCast is ParameterWrong: %j, %j, %j', defense1, defense2, defense3);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!!defense2 && !temps[defense2]) {
        logger.warn('SetDefenseCast is ParameterWrong: %j, %j, %j', defense1, defense2, defense3);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!!defense3 && !temps[defense3]) {
        logger.warn('SetDefenseCast is ParameterWrong: %j, %j, %j', defense1, defense2, defense3);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('SetDefenseCast is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('SetDefenseCast is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.SetDefenseCast(defense1, defense2, defense3, function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        //logger.error('chart msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
    });
};


/**
 * @Brief: get GetSoulPVPPlayerInfo  main page info
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.GetSoulPVPPlayerInfo  = function (msg, session, next) {
    var roleID = session.get('roleID');

    var otherID = msg.roleID;

    if (!roleID || !otherID) {
        logger.warn('GetSoulPVPPlayerInfo is none roleID: %j  otherID: %j', roleID, otherId);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('GetSoulPVPPlayerInfo is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('GetSoulPVPPlayerInfo is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.GetSoulPVPPlayerInfo(otherID, function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        // logger.error('chart msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
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
    var battle1 = msg.battle1;
    var battle2 = msg.battle2;
    var battle3 = msg.battle3;

    var temps = templateManager.GetAllTemplate('SoulTemplate');

    if (!battle1 && !battle2 && !battle3) {
        logger.warn('soul pvp requestBattle is ParameterWrong: %j, %j, %j', battle1, battle2, battle3);
        return next(null, {
            'result': errorCodes.SOUL_PVP_NO_BATTLE_CAST
        });
    }

    if (!!battle1 && !temps[battle1]) {
        logger.warn('soul pvp requestBattle is ParameterWrong: %j, %j, %j', battle1, battle2, battle3);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!!battle2 && !temps[battle2]) {
        logger.warn('soul pvp requestBattle is ParameterWrong: %j, %j, %j', battle1, battle2, battle3);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!!battle3 && !temps[battle3]) {
        logger.warn('soul pvp requestBattle is ParameterWrong: %j, %j, %j', battle1, battle2, battle3);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleID || !rivalID || !rivalRank || !myRank) {
        logger.warn('soul pvp requestBattle is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('soul pvp requestBattle is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }


    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('soul pvp requestBattle is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    var csID = player.GetPlayerCs();
    pomelo.app.rpc.cs.csRemote.IsSoulPvp(null, csID, roleID, function (err, res) {
        if (!!err || !res) {
            logger.error('IsSoulPvp failed err: %s', utils.getErrorMessage(err));
            return next(null, {
                result: errorCodes.toClientCode(err)
            });
        }

        if (res.result > 0) {
            return next(null, {
                'result': res.result
            });
        }

        roleSoulPvpManager.requestBattle(rivalID, myRank, rivalRank, isVipShop, battle1, battle2, battle3, function(err, soulPvpInfo) {
            var result = errorCodes.toClientCode(err);

            if (!!result) {
                return next(null, {
                    result: result
                });
            }
            soulPvpInfo.result = errorCodes.OK;
            //logger.error('requestBattle msg: %j', soulPvpInfo);
            return next(null, soulPvpInfo);
        });

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

    if (!roleID || !winID) {
        logger.warn('soul pvp battleOver is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('soul pvp battleOver is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('soul pvp battleOvere is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.battleOver(winID, function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        //logger.error('battleOver msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
    });
};


/**
 * @Brief: get ClearBattleTime  清除战斗cd
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.ClearBattleTime  = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (!roleID) {
        logger.warn('ClearBattleTime is none roleID: %j  otherID: %j', roleID, otherId);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('ClearBattleTime is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('ClearBattleTime is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.ClearBattleTime(function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        // logger.error('chart msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
    });
};

/**
 * @Brief: refreshMedal  刷新结算属性
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.refreshMedal  = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (!roleID) {
        logger.warn('refreshMedal is none roleID: %j  otherID: %j', roleID, otherId);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('refreshMedal is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var roleSoulPvpManager = player.GetRoleSoulPvpManager();

    if (!roleSoulPvpManager) {
        logger.warn('refreshMedal is none soulPvp manager roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (!roleSoulPvpManager.isOpenAres()) {
        return next(null, {
            'result': errorCodes.SOUL_PVP_LEVEL_LACK
        });
    }

    roleSoulPvpManager.refreshMedal(function(err, soulPvpInfo) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        soulPvpInfo.result = errorCodes.OK;
        // logger.error('chart msg: %j', soulPvpInfo);
        return next(null, soulPvpInfo);
    });
};
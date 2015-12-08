/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-6
 * Time: 上午9:58
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var util = require('util');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var messageService = require('./../../../tools/messageService');
var playerManager = require('../../../pvp/player/playerManager');
var templateManager = require('../../../tools/templateManager');
var ePlayerInfo = gameConst.ePlayerInfo;
var _ = require('underscore');
var Q = require('q');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**点击主城世界boss按钮 */
handler.ClickWorldBoss = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('ClickWorldBoss is none roleID: %j', roleID);
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    player.GetRoleWorldBossManager().LevelLimit(player);
    player.GetRoleWorldBossManager().ClickWorldBoss(roleID, function (err, msg) {
        return next(null, msg);
    });
};
/**进入战斗*/
handler.EnterBossFight = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    player.GetRoleWorldBossManager().LevelLimit(player);
    var atkValue = player.GetRoleWorldBossManager().GetAttATTACK();
    if (atkValue == 0) {
        var csID = player.GetPlayerCs();
        pomelo.app.rpc.cs.csRemote.GetPlayerATTACK(null, csID, roleID, function (err, value) {
            player.GetRoleWorldBossManager().SetAttATTACK(value);
            player.GetRoleWorldBossManager().EnterBossFight(roleID, function (err, msg) {
                return next(null, msg);
            });
        });
    } else {
        player.GetRoleWorldBossManager().EnterBossFight(roleID, function (err, msg) {
            return next(null, msg);
        });
    }
};
handler.AddBossDamage = function (msg, session, next) {
    var roleID = session.get('roleID');
    var hitDamage = msg.hitDamage;
    if (null == roleID || null == hitDamage || _.isNumber(hitDamage) == false || hitDamage <= 0) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var atkValue = player.GetRoleWorldBossManager().GetAttATTACK();
    var errCode = this.CheckDamage(atkValue, hitDamage);
    if (errCode != errorCodes.OK) {
        pomelo.app.rpc.cs.csRemote.playerCheat(null, player.GetPlayerCs(), roleID, 0, function (err) {
            if (err != null) {
                return;
            }
            logger.error('player %s has cheat by damage is %j, and atk value is %j', roleID, hitDamage, atkValue);
        });
    } else {
        player.GetRoleWorldBossManager().AddPlayerDamage(hitDamage,function (err, msg) {
            return next(null, msg);
        })

    }
};

handler.CheckDamage = function (atkValue, hitDamage) {
    var maxDamageTemplate = templateManager.GetAllTemplate('MaxDamageTemplate');
    var tempID = 0;
    for (var i in maxDamageTemplate) {
        if (maxDamageTemplate[i]['minPower'] <= atkValue && maxDamageTemplate[i]['maxPower'] >= atkValue) {
            tempID = i;
            break;
        }
    }
    var errCode = errorCodes.OK;
    if (maxDamageTemplate[tempID] == null) {
        errCode = errorCodes.ParameterNull;
    }

    if (hitDamage > maxDamageTemplate[tempID]['maxDamage']) {
        errCode = errorCodes.ParameterNull;
    }

    return errCode;
};

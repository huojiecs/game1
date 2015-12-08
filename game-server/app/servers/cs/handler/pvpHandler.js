/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午2:38
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var defaultValues = require('../../../tools/defaultValues');
var globalFunction = require('../../../tools/globalFunction');
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var errorCodes = require('../../../tools/errorCodes');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.RequireState = function (msg, session, next) {
    return next(null, {'result': errorCodes.OK});
};

EnsureMessageValid = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var asyncPvPManager = player.GetAsyncPvPManager();
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }

    if (player.playerInfo[gameConst.ePlayerInfo.ExpLevel] < defaultValues.aPvPRequireLevel) {
        return next(null, {'result': errorCodes.ExpLevel});
    }

    return asyncPvPManager;
};

handler.RequirePrice = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    asyncPvPManager.RequirePrice(function (err, data) {
        //logger.info('Async PvP rivals:' + JSON.stringify(data));
        return next(null, data);
    });
};

handler.RefreshRival = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var type = +msg.type;
    if (typeof type !== 'number' || type < gameConst.eRivalState.ZhanHun0 || type > gameConst.eRivalState.ZhanHun2) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    asyncPvPManager.RefreshRival(type, function (err, data) {
        //logger.info('Async PvP rivals:' + JSON.stringify(data));
        return next(null, {'result': err, 'rivals': data});
    });
};

handler.RequireRival = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var type = +msg.type;
    if (typeof type !== 'number' || type < gameConst.eRivalState.ZhanHun0 || type > gameConst.eRivalState.ZhanHun2) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var rivals = asyncPvPManager.RequireRival(type, {}, function (err, data) {
//        logger.info('Async PvP rivals:' + JSON.stringify(data));
        return next(null, {
            'result': err,
            'rivals': data
        });
    });
};

handler.RequireRevenge = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var rivals = asyncPvPManager.RequireRevenge(function (err, data) {
//        logger.info('Async PvP revenge :' + JSON.stringify(data));
        return next(null, {
            'result': err,
            'revenges': data
        });
    });
};

handler.BeginMatchRival = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var type = +msg.type;
    if (typeof type !== 'number' || type < gameConst.eRivalState.ZhanHun0 || type > gameConst.eRivalState.ZhanHun2) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    asyncPvPManager.BeginMatchRival(type, function (err, players) {
        if (err) {
            return next(null, {'result': err});
        }

        return next(null, {
            'result': errorCodes.OK,
            'players': players
        });
    });
};

handler.BeginMatchRevenge = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var otherID = +msg.otherID;
    var otherType = +msg.otherType;

    if (typeof otherID !== 'number' || typeof otherType !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    asyncPvPManager.BeginMatchRevenge(otherID, otherType, function (err, players) {
        if (err) {
            return next(null, {'result': err});
        }

        return next(null, {
            'result': errorCodes.OK,
            'players': players
        });
    });
};

handler.LingliExchange = function (msg, session, next) {
    var roleID = session.get('roleID');
    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    var exchangeID = +msg.exchangeID;
    if (typeof exchangeID !== 'number') {
        return next(null, {'result': errorCodes.ParameterWrong});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    if (player.GetItemManager().IsFullEx(gameConst.eBagPos.EquipOff) == true) {
        return next(null, {'result': errorCodes.Cs_ItemFull});
    }

    asyncPvPManager.LingliExchange(exchangeID, function (err, result) {
        if (err) {
            return next(null, {'result': err});
        }

        result.result = errorCodes.OK;
        return next(null, result);
    });
};

handler.RequireBlessList = function (msg, session, next) {
    return next(null, {'result': errorCodes.ParameterWrong});
};

handler.Bless = function (msg, session, next) {
    return next(null, {'result': errorCodes.ParameterWrong});
};

handler.RequireExchangeList = function (msg, session, next) {

    var asyncPvPManager = EnsureMessageValid(msg, session, next);
    if (!asyncPvPManager) {
        return next(null, {'result': errorCodes.ParameterWrong});
    }

    asyncPvPManager.RequireExchangeList(function (err, list) {
        if (err) {
            return next(null, {'result': err});
        }

        return next(null, {
            'result': errorCodes.OK,
            'items': list
        });
    });
};

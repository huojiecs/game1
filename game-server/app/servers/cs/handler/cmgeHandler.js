/**
 * Created by xykong on 2015/3/20.
 */
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var gameConst = require('../../../tools/constValue');
var playerManager = require('../../../cs/player/playerManager');


module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.verifyPayment = function (msg, session, next) {
    var roleID = session.get("roleID");
    if (!roleID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    var cmgeManager = player.GetCmgeManager();
    if (!cmgeManager) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    cmgeManager.verifyPayment(msg, function (err, data) {
        if (err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, data);
    });


    return next();
};
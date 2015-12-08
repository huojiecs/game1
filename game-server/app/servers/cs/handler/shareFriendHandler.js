/**
 * Created by mm on 2015/4/10.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var eMisType = gameConst.eMisType;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.shareSuccess = function (msg, session, next) {
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
    player.GetMissionManager().IsMissionOver(eMisType.ShareSuccess, 0, 1);
    return next(null, {
        'result': errorCodes.OK
    });
};
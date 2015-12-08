/**
 * Created by Administrator on 14-7-30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../cs/player/playerManager');
module.exports = function () {
    return new Handler();
};


var Handler = function () {
};

var handler = Handler.prototype;

handler.getCodeToGift = function (msg, session, next) {
    var roleID = session.get('roleID');
    var giftCode = msg.giftCode;
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
    if (null == giftCode) {
        return next(null, {
            'result': errorCodes.GiftCodeInvalid
        });
    }
    if (giftCode.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/)) {
        return next(null, {
            'result': errorCodes.GiftCodeInvalid
        });
    }
    player.GetGiftManager().getGiftCodeInfo(roleID, giftCode, function (result) {
        return next(null, result);
    });

}
;

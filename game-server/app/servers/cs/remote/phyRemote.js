/**
 * Created by Administrator on 14-3-28.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var physicalManager = require('../../../cs/physical/physicalManager');
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;


handler.GiveFriPhysical = function (csID, roleID, friendID, callback) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return callback();
    }
    player.physicalManager.GiveFriPhysical(friendID, function (err) {
    });
    return callback();
};

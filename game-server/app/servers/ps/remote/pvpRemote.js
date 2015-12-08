/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-21
 * Time: 下午4:28
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var playerManager = require('../../../ps/player/playerManager');
var offlinePlayerManager = require('../../../ps/player/offlinePlayerManager');
var globalFunction = require('../../../tools/globalFunction');
var errorCodes = require('../../../tools/errorCodes');
var pvpSql = require('../../../tools/mysql/pvpSql');
var utils = require('../../../tools/utils');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.AsyncPvPAccomplishLose = function (roleID, params, callback) {
    var self = this;

    logger.info('ps玩家 AsyncPvPAccomplishLose:' + roleID);

    var csID = playerManager.GetPlayerCs(roleID);

    if (!!csID) {
        pomelo.app.rpc.cs.pvpRemote.AsyncPvPAccomplishLose(null, csID, roleID, params, function (err, data) {
            if (!!err) {
                logger.error('AsyncPvPAccomplishLose failed: %s', utils.getErrorMessage(err));
            }
            return callback(err, data);
        });
    }
    else {
        offlinePlayerManager.LoadPlayer(roleID, function(err, op) {
            if(!!err) {
                logger.error('error when AsyncPvPAccomplishLose to LoadPlayer, %d, %s', roleID, utils.getErrorMessage(err));
                return callback(err);
            }
            if (!!op) {
                op.asyncPvPManager.AsyncPvPAccomplishLose(params, false, callback);
            }
            else {
                return callback(errorCodes.SystemWrong);
            }
        });
    }
};

/**
 * Created by Administrator on 2014/12/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../../tools/constValue');
var util = require('util');
var playerManager = require('../../../psIdip/player/playerManager');
var errorCodes = require('../../../tools/errorCodes');
var utils = require('../../../tools/utils');
var idipUtils = require('../../../tools/idipUtils');

var Q = require('q');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.ping = function (id, callback) {
    return utils.invokeCallback(callback);
};

handler.idipCommands = function (data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);

    var server = data_packet.command.server;

    if (!server) {
        return callback(null, {result: errorCodes.ParameterWrong});
    }

    if (server === 'cs') {
        var roleID = data_packet.body.RoleId;
        if (!roleID) {
            return callback(null, {result: errorCodes.ParameterWrong});
        }

        var csID = playerManager.GetPlayerCs(roleID);
        logger.debug('idipCommands: %j, csID: %j', data_packet, csID);

        if (!csID) {
            // just select one.

            // get all csServers
            var csServers = pomelo.app.getServersByType('cs');
            if (!csServers || csServers.length === 0) {
                return callback(null, {
                    result: errorCodes.SystemNoServer
                });
            }

            var selected = Math.floor(Math.random() * csServers.length);
            csID = csServers[selected].id;
        }

        pomelo.app.rpc.cs.gmRemote.idipCommands(null, csID, data_packet, function (err, res) {
            if (!!err) {
                return callback(null, {
                    result: errorCodes.SystemWrong,
                    RetErrMsg: utils.getErrorMessage(err)
                });
            }

            return callback(null, res);
        });

        return;
    }

    if (server === 'psIdip') {
        var psCommands = require('../../../adminCommands/psCommands');

        return idipUtils.dispatchIdipCommands(psCommands, data_packet, callback);
    }

    return callback(null, {result: errorCodes.ParameterWrong});
};

handler.notifyUserStatus = function (sId, msg, callback) {

    logger.warn('notifyUserStatus msg: %j', msg);

    playerManager.ModifyPlayer(msg);

    callback();
};

handler.notifyAllUsersStatus = function (sId, msg, callback) {

    logger.warn('notifyAllUsersStatus msg: %j', msg);

    playerManager.SyncPlayers(msg.playerList);

    callback();
};
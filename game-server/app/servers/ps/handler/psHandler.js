/**
 * Created by xykong on 2015/4/24.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var util = require('util');
var playerManager = require('../../../ps/player/playerManager');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var messageService = require('./../../../tools/messageService');
var _ = require('underscore');
var Q = require('q');
var md5 = require('md5');

var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.DebugCommands = function (msg, session, next) {
    if ('17935bfcd7841d41baef6adfb8950512' != md5.digest_s('' + msg.key)) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var csID = playerManager.GetPlayerCs(roleID);
    if (!csID) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    pomelo.app.rpc.cs.gmRemote.GMorder(null, csID, roleID, msg.cmd, msg.params, function (err, res) {
        if (!!err) {
            return next(null, {'result': errorCodes.SystemWrong});
        }

        if (res.result > 0) {
            return next(null, {
                'result': res.result
            });
        }

        return next(null, res);
    });
};
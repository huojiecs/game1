/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-21
 * Time: 上午10:19
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var offlinePlayer = require('./offlinePlayer');
var playerManager = require('./playerManager');
var csUtil = require('./../../cs/csUtil');
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var _ = require('underscore');
var Q = require('q');

var Handler = module.exports;

Handler.Init = function () {
    this.cachedPlayers = {};
};

Handler.GetPlayer = function (roleID) {

    var player = null;

    if (!player) {
        player = this.cachedPlayers[roleID];
    }

    return player;
};

//此函数不要用
/*Handler.GetPlayerAsync = function (roleID, callback) {
    var self = this;

    var op = self.GetPlayer(roleID);
    if (op) {
        return callback(null, op);
    }

    self.LoadPlayer(roleID, function (err, op) {
        if (err) {
            return callback(err);
        }

        self.AddPlayer(roleID, op);
        return callback(err, op);
    });
};*/

Handler.GetUnionPlayerAsync = function (roleID, callback) {
    var self = this;

    self.LoadOfflinePlayer(roleID, function (err, op) {
        if (err) {
            return callback(err);
        }
        return callback(err, op);
    });
};

Handler.AddPlayer = function (roleID, player) {
    if (player) {
        this.cachedPlayers[roleID] = player;
    }
};

Handler.DeletePlayer = function (roleID) {
    delete this.cachedPlayers[roleID];
};

Handler.LoadPlayer = function (roleID, callback) {

    var op = new offlinePlayer();

    op.LoadDataByDB(roleID, function (err) {
        return callback(err, op);
    });

};

Handler.LoadOfflinePlayer = function (roleID, callback) {

    var op = new offlinePlayer();

    op.LoadOfflineDataByDB(roleID, function (err) {
        return callback(err, op);
    });

};
Handler.Logout = function (roleID, callback) {
    var self = this;

    self.SavePlayer(roleID, function () {
        self.DeletePlayer(roleID);
        return callback();
    });
};

Handler.LogoutAll = function (callback) {
    var self = this;

    var jobs = _.map(this.cachedPlayers, function (item, roleID) {
        return Q.ninvoke(self, 'Logout', +roleID);
    });

    Q.all(jobs)
        .finally(function () {
                     utils.invokeCallback(callback);
                 })
        .done();
};

Handler.SavePlayer = function (roleID, callback) {
    var self = this;

    var op = self.GetPlayer(roleID);
    if (!op) {
        return callback();
    }

    var strInfo = {};

    strInfo['PLAYERDB_PLAYERINFO'] = op.GetSqlStr();
    strInfo['PLAYERDB_ASSETS'] = op.assetsManager.GetSqlStr(roleID);
    strInfo['AsyncPvPRival'] = op.asyncPvPManager.GetSqlStrRival(roleID);
    strInfo['AsyncPvPInfo'] = op.asyncPvPManager.GetSqlStrInfo(roleID);

    logger.warn('save offline player info roleID: %j, strInfo: %j', roleID, JSON.stringify(strInfo));

    csUtil.SaveOfflinePlayerInfo(roleID, strInfo, function (err, res) {
        logger.info('%d SaveOfflinePlayerInfo: %j', roleID, res);
        if (!!err) {
            logger.info('%d SaveOfflinePlayerInfo failed: %s', roleID, utils.getErrorMessage(err));
            return callback(null, {result: errorCodes.SystemWrong});
        }

        return callback(null, {result: 0});
    });
};

Handler.GetDetails = function (roleID, callback) {
    var self = this;

    var csID = playerManager.GetPlayerCs(roleID);
    if (!!csID) {
        pomelo.app.rpc.cs.csRemote.GetDetails(null, csID, roleID, function (err, details) {
            if (!!err) {
                logger.error('pomelo.app.rpc.cs.csRemote.GetDetails: %s', utils.getErrorMessage(err));
                self.LoadPlayer(roleID, function (err, op) {
                    if (!!op) {
                        return callback(err, op.GetDetails());
                    }
                    return callback(err, null);
                });
                return;
            }
            return callback(err, details);
        });
    }
    else {
        self.LoadPlayer(roleID, function (err, op) {
            if (err || !op) {
                return callback("Can't retrieve player details." + roleID, null);
            }
            else {
                return callback(err, op.GetDetails());
            }
        });
    }
};

Handler.GetPlayerDetails = function (roleID, callback) {
    var self = this;
    var csID = playerManager.GetPlayerCs(roleID);
    if (!!csID) {
        pomelo.app.rpc.cs.csRemote.GetPlayerDetails(null, csID, roleID, function (err, details) {
            if (!!err) {
                logger.error('pomelo.app.rpc.cs.csRemote.GetDetails: %s', utils.getErrorMessage(err));
                self.GetUnionPlayerAsync(roleID, function (err, op) {
                    if (!!op) {
                        op.GetPlayerDetails(null, function (err, details) {
                            return callback(null, details);
                        });
                    }
                    return callback(err, null);
                });
                return callback(err, null);
            }
            return callback(err, details, csID);
        });
    }
    else {
        self.GetUnionPlayerAsync(roleID, function (err, op) {
            if (err || !op) {
                return callback("Can't retrieve player details." + roleID, null);
            }
            else {
                op.GetPlayerDetails(null, function (err, details) {
                    return callback(null, details, csID);
                });
            }
        });
    }
};
Handler.AttConstructMessage = function (roleID, callback) {
    var self = this;

    var csID = playerManager.GetPlayerCs(roleID);
    if (csID) {
        pomelo.app.rpc.cs.csRemote.AttConstructMessage(null, csID, roleID, function (err, attList) {
            if (!!err) {
                logger.error('pomelo.app.rpc.cs.csRemote.AttConstructMessage: %s', utils.getErrorMessage(err));
                self.LoadPlayer(roleID, function (err, op) {
                    if (op) {
                        return callback(err, op.attManager.ConstructMessage());
                    }
                    else {
                        return callback(err, null);
                    }
                });
                return;
            }
            return callback(err, attList);
        });
    }
    else {
        self.LoadPlayer(roleID, function (err, op) {
            if (op) {
                return callback(err, op.attManager.ConstructMessage());
            }
            else {
                return callback(err, null);
            }
        });
    }
};

Handler.GetPlayerDetailsEX = function (roleID, callback) {
    var self = this;
    self.LoadPlayer(roleID, function (err, op) {
        if (err) {
            return callback(err);
        }
        op.GetDetails(null, function (err, details) {
            return callback(err, details);
        });
    });
};

Handler.PvpAttConstructMessage = function (roleID, callback) {
    var self = this;
    self.LoadPlayer(roleID, function (err, op) {
        if (err) {
            return callback(err);
        }
        return callback(err, op.attManager.ConstructMessage());
    });
};

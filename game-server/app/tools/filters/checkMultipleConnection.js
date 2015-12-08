/**
 * Created by xykong on 2014/6/28.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('../utils');
module.exports = function () {
    return new Filter();
};

var Filter = function () {
    var self = this;
};

var NotifyLoginTime = function (frontendId, accountID, loginTime, uid) {
    var args = Array.prototype.slice.call(arguments, 0);

//    logger.fatal("NotifyLoginTime: %j", args);

    var accountLoginTimeMap = pomelo.app.get('accountLoginTimeMap');

    if (!accountLoginTimeMap) {
        accountLoginTimeMap = {};
    }

    accountLoginTimeMap[accountID] = {frontendId: frontendId, accountID: accountID, loginTime: loginTime, uid: uid};

    pomelo.app.set('accountLoginTimeMap', accountLoginTimeMap);

    var conns = pomelo.app.getServersByType('connector');
    for (var i in conns) {
        var conn = conns[i];
        pomelo.app.rpc.connector.connectorRemote.SetAccountLoginTime(null, conn.id, frontendId, accountID, loginTime,
                                                                     uid, utils.done);
    }

    var css = pomelo.app.getServersByType('cs');
    for (var i in css) {
        var cs = css[i];
        pomelo.app.rpc.cs.csRemote.SetAccountLoginTime(null, cs.id, frontendId, accountID, loginTime, uid, utils.done);
    }
};

Filter.prototype.before = function (msg, session, next) {
    var self = this;

    var accountID = session.get('accountID');

    if (!accountID) {
        return next();
    }

    var loginTime = +session.get('loginTime');
    if (!loginTime) {
        return next();
    }

    var accountLoginTimeMap = pomelo.app.get('accountLoginTimeMap');
    if (!accountLoginTimeMap) {
        accountLoginTimeMap = {};
    }

    if (!(accountID in accountLoginTimeMap)) {
        NotifyLoginTime(session.frontendId, accountID, loginTime, session.uid);
        return next();
    }

    if (loginTime === accountLoginTimeMap[accountID].loginTime) {
        return next();
    }

    if (loginTime > accountLoginTimeMap[accountID].loginTime) {
        logger.warn('Multiple Connection: new account login: %s, %j, %s, %s', accountID, accountLoginTimeMap[accountID],
                    loginTime, session.uid);

        var old = accountLoginTimeMap[accountID];
        if (old.uid !== session.uid) {
            process.nextTick(function () {
                pomelo.app.rpc.connector.connectorRemote.Kick(null, old.frontendId, old.uid, function () {
                    logger.warn('Multiple Connection: kick old by new account: %s, %j, %s, %s', accountID,
                                accountLoginTimeMap[accountID], loginTime, session.uid);
                });
            });
        }

        NotifyLoginTime(session.frontendId, accountID, loginTime, session.uid);

        return next();
    }

    logger.warn('Multiple Connection: old account checked: %s, %j, %s, %s', accountID, accountLoginTimeMap[accountID],
                loginTime, session.uid);

    process.nextTick(function () {
        pomelo.app.rpc.connector.connectorRemote.Kick(null, session.frontendId, session.uid, function () {
            logger.warn('Multiple Connection: old account kicked: %s, %j, %s, %s', accountID,
                        accountLoginTimeMap[accountID], loginTime, session.uid);
        });
    });

    next(new Error('Multiple Connection'), {result: 4});
};

Filter.prototype.after = function (err, msg, session, resp, next) {
    var self = this;
    next(err, msg);
};

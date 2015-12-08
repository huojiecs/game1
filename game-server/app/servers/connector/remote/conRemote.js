/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-12-13
 * Time: 下午4:38
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var util = require('util');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.SetPlayerCsID = function (sid, uid, csID, callback) {
    var sessionService = pomelo.app.get('sessionService');
    var sessions = sessionService.getByUid(uid);
    for (var index in sessions) {
        sessions[index].set('csServerID', csID);
    }
    return callback(null, {result: 0});
};

// 设置重复登录的玩家离线
handler.SetUserOut = function (sid, checkID, callback) {
    var sessionService = pomelo.app.get('sessionService');
    var sessions = sessionService.getByUid(checkID);

    if (!sessions || sessions.length === 0) {
        logger.warn('SetUserOut no sessions get by uid: %s', checkID);
        return callback();
    }

    logger.info('Received handler.SetUserOut: %s, %j', checkID, util.inspect(sessions[0]));

    var session = sessions[0];

    pomelo.app.rpc.ps.psRemote.UserLeave(session, session.get('csServerID'), session.uid, session.get('accountID'), 0,
                                         function () {
                                             sessionService.kick(checkID, 'Reason SetUserOut', function () {
                                                 session.unbind();
                                                 logger.warn('SetUserOut psRemote.UserLeave by checkID: %s', checkID);
                                                 return callback();
                                             });
                                         });
};

/**
 * 踢出玩家， 还是按原来流程走， 新添加清除流程麻烦 和SetUserOut 一样， 方便添加日志等
 *
 * **/
handler.KickUserBySaveErr = function (sid, checkID, callback) {
    logger.warn('Received handler.KickUserBySaveErr');
    var sessionService = pomelo.app.get('sessionService');
    var sessions = sessionService.getByUid(checkID);

    if (!sessions || sessions.length === 0) {
        logger.warn('KickUserBySaveErr no sessions get by uid: %s', checkID);
        return callback();
    }

    logger.warn('Received handler.KickUserBySaveErr: %s, %j', checkID, require('util').inspect(sessions[0]));

    var session = sessions[0];

    logger.warn('KickUserBySaveErr kicked by checkID: %s', checkID);

    sessionService.kick(checkID, 'Reason　KickUserBySaveErr', function () {
        session.unbind();
        logger.warn('KickUserBySaveErr psRemote.User by checkID: %s',
                    checkID);
        return callback();
    });
};

handler.PrepareShutdown = function (sid, callback) {

    logger.fatal('handler.PrepareShutdown');
    pomelo.app.set('disableConnect', true);

    var sessionService = pomelo.app.get('sessionService');
    sessionService.forEachSession(function (session) {
        sessionService.kickBySessionId(session.id);
    });

    return callback();
};

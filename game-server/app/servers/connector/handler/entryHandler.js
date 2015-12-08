var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('pomelo/node_modules/pomelo-logger').getLogger('tlog', __filename);
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var utils = require('../../../tools/utils');
var globalFunction = require('../../../tools/globalFunction');
var defaultValues = require('../../../tools/defaultValues');
var config = require('../../../tools/config');
var templateManager = require('../../../tools/templateManager');
var taskManager = require('../../../tools/common/taskManager');
var firewallManager = require('../../../tools/common/firewallManager');
var _ = require('underscore');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.Ping = function (msg, session, next) {
    return next(null, msg);
};

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.Enter = function (msg, session, next) {
    var self = this;
    var sessionService = self.app.get('sessionService');
    session.on('closed', OnUserLeave.bind(null, self.app));
    session.set('loginTime', Date.now());
    //session.set('platform', msg.platform);
    session.pushAll();

    var taskQueues = taskManager.getTaskQueues();
    var sessionsCount = sessionService ? _.size(sessionService.service.sessions) : 0;
    logger.warn('sessionId: %j connector status sessionsCount: %j, Q1: %j, Q2: %j, firewallManager: %j',
                session.id, sessionsCount, _.size(taskQueues[0]), _.size(taskQueues[1]),
                _.size(firewallManager.firewallMaps));

    if (pomelo.app.get('disableConnect')) {
        next(null, {result: errorCodes.SeverMaintain});
        return sessionService.kickBySessionId(session.id);
    }

    var checkID = '' + msg.checkID;
    if (checkID.length === 0) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    var versionID = '' + msg.versionID;
    var platform = '' + msg.platform;

    logger.warn('sessionId: %j player enter checkID: %s, versionID: %s, platform: %s, remoteAddress: %j', session.id,
                msg.checkID, msg.versionID, msg.platform, session.__session__.__socket__.remoteAddress);

    if (!platform || !(platform in config.version)) {
        if (config.version.isCheck && versionID !== 'loginClient' && checkID.split('|').length !== 2) {
            if (globalFunction.VersionCompare(versionID, config.version.minVersion) < 0) {
                return next(null, {result: errorCodes.VersionWrong, url: config.version.url});
            }
            else if (globalFunction.VersionCompare(versionID, config.version.curVersion) < 0) {
                if (!!config.version.promoteDownload) {
                    return next(null, {result: errorCodes.VersionWarn, url: config.version.url});
                }
            }
        }
    }
    else {
        if (config.version[platform].isCheck && versionID !== 'loginClient') {
            if (!_.contains(config.version[platform].versions, versionID)) {
                return next(null, {result: errorCodes.VersionWrong, url: config.version[platform].url});
            }
        }
    }

    // duplicate log in
    // session.kickByUid();
    if (!!sessionService.getByUid(checkID)) {
        sessionService.kick(checkID, function () {
            //logger.warn('*************** session解绑完成');
        });
    }

    // if we need user turn to another connector
    var selfConnector = this.app.getCurServer();
    if (selfConnector.dedicateDispatcher === 'true') {
        // get all connectors
        var connectors = this.app.getServersByType('connector');
        if (!connectors || connectors.length === 0) {
            return next(null, {
                result: errorCodes.SystemNoServer
            });
        }

        var list = [];
        // select connector
        for (var i in connectors) {
            if (connectors[i].dedicateDispatcher === 'true') {
                continue;
            }
            if (connectors[i].logicType !== selfConnector.logicType) {
                continue;
            }
            list.push(connectors[i]);
        }
        if (list.length > 0) {
            var selected = Math.floor(Math.random() * list.length);
            var res = list[selected];
            return next(null, {
                result: errorCodes.Ls_Dispatch,
                host: res.mapClientHost,
                port: res.mapClientPort
            });
        }
        // if no connector
        return next(null, {
            result: errorCodes.SystemNoServer
        });
    }

    //当连接数超过定义，提示玩家系统繁忙，然后断线
    var maxUserPerConnector = defaultValues.maxUserPerConnector;
    if (self.app.getServerId().indexOf('ls') != -1) {
        maxUserPerConnector = defaultValues.maxUserPerConnectorLs;
    }

    logger.info('maxUserPerConnector: %j', maxUserPerConnector);

    var bindedCount = sessionService ? _.size(sessionService.service.uidMap) : 0;

    if (bindedCount > maxUserPerConnector) {
        setTimeout(function () {
            sessionService.kickBySessionId(session.id);
        }, 5000);

        logger.warn('sessionId: %j Server maxUserPerConnector reached getSessionsCount: %j, maxUserPerConnector: %j',
                    session.id, sessionService.getSessionsCount(), maxUserPerConnector);

        return next(null, {
                result: errorCodes.ServerFull
            }
        );
    }

    /*var platId = config.vendors.tencent.platId;
     var clientTemplate = null;
     if (platId === 0) {     //IOS
     clientTemplate = templateManager.GetTemplateByID('ClientTemplate', 'iOS');
     }
     if (platId === 1) {     //Android
     clientTemplate = templateManager.GetTemplateByID('ClientTemplate', 'android');
     }
     if (null == clientTemplate) {
     logger.error('clientTemplate is null!');
     sessionService.kickBySessionId(session.id);
     return next(null, {result: errorCodes.NoTemplate});
     }
     var versionTemplate = clientTemplate[versionID];
     if (null == versionTemplate) {
     logger.error('versionTemplate is null!');
     sessionService.kickBySessionId(session.id);
     return next(null, {result: errorCodes.NoTemplate});
     }
     var keyList = _.keys(versionTemplate);
     var indexKey = keyList[Math.floor(Math.random() * keyList.length)]
     var checkHash = versionTemplate[indexKey];
     session.set('checkHash', checkHash);*/

    session.bind(checkID);
    session.set('remoteAddress', session.__session__.__socket__.remoteAddress);
    session.set('loginTime', Date.now());
    session.pushAll();

    return next(null, {result: 0});
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var OnUserLeave = function (app, session) {

    var loginTime = session.get('loginTime');
    logger.warn('sessionId: %j player leave checkId: %s, remoteAddress: %j, duration: %jms', session.id,
                session.uid, session.__session__.__socket__.remoteAddress, Date.now() - loginTime);

    /** 移除消息队列*/
    taskManager.closeQueue(session.id, true);
    /** 移除玩家 接口时间map*/
    firewallManager.deleteMap(session.id);

    if (null === session || null === session.uid) {
        return;
    }

    if (!!session.get('accountID')) {
        logger.info('OnUserLeave psRemote.UserLeave.accountID:%s, csid: %s', session.get('accountID'),
                    session.get('csServerID'));
        app.rpc.ps.psRemote.UserLeave(session, session.get('csServerID'), session.uid, session.get('accountID'), 0,
                                      function () {
                                          logger.info('Back psRemote.UserLeave. accountID:%s, csid: %s',
                                                      session.get('accountID'), session.get('csServerID'));
                                      });
    }
};

handler.PrintLog = function (msg, session, next) {
    var log = '' + msg.log;
    var roleID = session.get('roleID');
    var checkID = session.uid;

    logger.warn('PrintLog sessionId: %j, roleID: %d, checkID: %s, remoteAddress: %j, log: %s', session.id,
                roleID, checkID, session.__session__.__socket__.remoteAddress, log);

    tlogger.info(log);

    return next(null, {'result': errorCodes.OK});
};

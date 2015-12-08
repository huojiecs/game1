/**
 * Created by bj on 2015/3/11.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../config');
var errorCodes = require('../errorCodes');

/**
 * 默认不过滤消息
 * */
//var catchRoles = config.filter.catchRoleMsg;

module.exports = function () {
    return new Filter();
};

var Filter = function () {

};


Filter.prototype.before = function (msg, session, next) {

    var roleID = session.get('roleID');

    if(roleID != null){
        var isRoleCatch = 0;
        if(config.filter.catchRoleMsg != null){
            isRoleCatch = config.filter.catchRoleMsg[roleID.toString()];
        }
        if(isRoleCatch > 0){
            if (!!session.__session__) {
                if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                    logger.warn('catch role %j msg, %s recv: %j %j', roleID, pomelo.app.getServerId(), session.__session__.__socket__.remoteAddress,
                        msg);
                }
                else {
                    logger.warn('catch role %j msg, recv: %j %j', roleID, session.__session__.__socket__.remoteAddress, msg);
                }
            }
            else {
                if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                    logger.warn('catch role %j msg, %s recv: %j, %j', roleID, pomelo.app.getServerId(), session.uid, msg);
                }
                else {
                    logger.warn('catch role %j msg, recv: %j, %j', roleID, session.uid, msg);
                }
            }
        }
    }
    return next();
};

Filter.prototype.after = function (err, msg, session, resp, next) {
    var roleID = session.get('roleID');

    if(roleID != null) {
        var isRoleCatch = 0;
        if(config.filter.catchRoleMsg != null){
            isRoleCatch = config.filter.catchRoleMsg[roleID.toString()];
        }
        if (isRoleCatch > 0) {
            if (!!session.__session__) {
                if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                    logger.warn('catch role %j msg, %s send:  %j %j ', roleID, session.__sessionService__.app.serverId,
                        session.__session__.__socket__.remoteAddress, resp);
                }
                else {
                    logger.warn('catch role %j msg, send: %j %j ', roleID, session.__session__.__socket__.remoteAddress, resp);
                }
            }
            else {
                if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                    logger.warn('catch role %j msg, %s send: %j %j ', roleID, session.__sessionService__.app.serverId, session.uid,
                        resp);
                }
                else {
                    logger.warn('catch role %j msg, send: %j %j ', roleID, session.uid, resp);
                }
            }
        }
    }
    next(err, msg);
};
/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-24
 * Time: 下午2:50
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var watch = require('node-watch');
var fs = require('fs');
var config = require('./../config');

var DEFAULT_TIMEOUT = 3000;
var DEFAULT_PRINT_MESSAGE = true;

module.exports = function (timeout, printMessage) {
    return new Filter(timeout || DEFAULT_TIMEOUT, printMessage || DEFAULT_PRINT_MESSAGE);
};

var Filter = function (timeout, printMessage) {
    var self = this;

    self.timeout = timeout;
    self.timeouts = {};
    self.curId = 0;
    self.printMessage = printMessage;
};


Filter.prototype.before = function (msg, session, next) {
    var self = this;

    if (!!(config.filter.ignoreMessage && msg.__route__ in config.filter.ignoreMessage)) {
        return next();
    }

    this.curId++;

    this.timeouts[this.curId] = {
        timeout: setTimeout(function () {
            logger.warn('request %j timeout over %dms.', msg.__route__, self.timeout);
        }, this.timeout),
        time: new Date()
    };
    session.__timeout__ = this.curId;

    if (this.printMessage) {
        if (!!session.__session__) {
            if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                logger.debug('%s recv: %j %j', pomelo.app.getServerId(), session.__session__.__socket__.remoteAddress,
                             msg);
            }
            else {
                logger.debug('recv: %j %j', session.__session__.__socket__.remoteAddress, msg);
            }
        }
        else {
            if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                logger.debug('%s recv: %j, %j', pomelo.app.getServerId(), session.uid, msg);
            }
            else {
                logger.debug('recv: %j, %j', session.uid, msg);
            }
        }
    }

    next();
};

Filter.prototype.after = function (err, msg, session, resp, next) {
    var self = this;

    if (!!(config.filter.ignoreMessage && msg.__route__ in config.filter.ignoreMessage)) {
        return next();
    }

    if (!(session.__timeout__ in this.timeouts)) {
        return next();
    }

    var timeout = this.timeouts[session.__timeout__].timeout;

    if (timeout) {
        clearTimeout(timeout);
    }

    var timespend = new Date() - this.timeouts[session.__timeout__].time;

    delete this.timeouts[session.__timeout__];

    if (this.printMessage) {
        if (!!session.__session__) {
            if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                logger.debug('%s send: %dms %j %j ', session.__sessionService__.app.serverId, timespend,
                             session.__session__.__socket__.remoteAddress, resp);
            }
            else {
                logger.debug('send: %dms %j %j ', timespend, session.__session__.__socket__.remoteAddress, resp);
            }
        }
        else {
            if (session.__sessionService__.app && 'serverId' in session.__sessionService__.app) {
                logger.debug('%s send: %dms %j %j ', session.__sessionService__.app.serverId, timespend, session.uid,
                             resp);
            }
            else {
                logger.debug('send: %dms %j %j ', timespend, session.uid, resp);
            }
        }
    }

    next(err, msg);
};

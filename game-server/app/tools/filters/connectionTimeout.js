/**
 * Created by Administrator on 2015/1/7.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var defaultValues = require('./../defaultValues');
var _ = require('underscore');
var errorCodes = require('../errorCodes');

var DEFAULT_SIZE = 1000;

module.exports = function (maxSize) {
    return new Filter(maxSize || DEFAULT_SIZE);
};

var Filter = function (maxSize) {
    this.maxSize = maxSize;
    this.timeouts = {};
};

Filter.prototype.before = function (msg, session, next) {
    if (!defaultValues.connectorDisconnectWithoutMessageSeconds
        || defaultValues.connectorDisconnectWithoutMessageSeconds < 1) {
        return next();
    }

    var self = this;

//    logger.warn('sessionId :%j timeouts: %j received connection message %j', session.id, !!self.timeouts[session.id],
//                msg);

    if (!!self.timeouts[session.id]) {
        clearTimeout(self.timeouts[session.id]);
        delete self.timeouts[session.id];
    }

    var count = _.size(this.timeouts);
    if (count > self.maxSize) {
        logger.warn('connection timeout filter is out of range, current size is %s, max size is %s', count,
                    self.maxSize);
        return next();
    }

    self.timeouts[session.id] = setTimeout(function () {

        delete self.timeouts[session.id];

        if (!!session.__sessionService__.get(session.id)) {
            logger.warn('sessionId :%j kick timeout session.', session.id);
            session.__sessionService__.kickBySessionId(session.id);
        }

    }, defaultValues.connectorDisconnectWithoutMessageSeconds * 1000);

    return next();
};

Filter.prototype.after = function (err, msg, session, resp, next) {
    return next(err);
};

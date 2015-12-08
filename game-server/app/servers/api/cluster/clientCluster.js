/**
 * Created by xykong on 2014/7/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var idipCenter = require('./../../../idip/idipCenter');
var errorCodes = require('../../../tools/errorCodes');
var config = require('../../../tools/config');
var Q = require('q');
var _ = require('underscore');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.Ping = function (id, msg, callback) {

    return callback(null, msg);
};


handler.idipCommands = function (id, data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.warn('idipCommands: id: %j, %j', id, data_packet);

    var serverType = '' + data_packet.command.server;

    if (!serverType || !_.isString(serverType)) {
        return callback(null, {
            result: errorCodes.ParameterWrong,
            RetErrMsg: 'No such server type.'
        });
    }

    if (serverType === 'cs') {
        serverType = 'psIdip';
    }

    if (!pomelo.app
        || !pomelo.app.rpc
        || !pomelo.app.rpc[serverType]
        || !pomelo.app.rpc[serverType][serverType + 'Remote']
        || !pomelo.app.rpc[serverType][serverType + 'Remote'].idipCommands) {
        return callback(null, {
            result: errorCodes.ParameterWrong,
            RetErrMsg: 'No support server.'
        });
    }

    pomelo.app.rpc[serverType][serverType + 'Remote'].idipCommands(null, data_packet, function (err, res) {
        if (!!err) {
            return callback(null, {result: errorCodes.SystemWrong});
        }

        return callback(null, res);
    });
};

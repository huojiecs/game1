/**
 * Created by xykong on 2014/8/21.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var idipLogger = require('pomelo/node_modules/pomelo-logger').getLogger('idip');
var errorCodes = require('./errorCodes');
var utils = require('./utils');
var _ = require('underscore');

var idipUtils = module.exports = {};

idipUtils.dispatchIdipCommands = function (idipCommands, data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'dispatchIdipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);
    idipLogger.warn('idip commands recv: %j', data_packet);

    var command = idipCommands[data_packet.command.path];
    if (!_.isFunction(command)) {

        var retValue = {
            result: errorCodes.ParameterWrong,
            RetErrMsg: 'No such command.' + utils.getFilenameLine()
        };

        if (!!data_packet.profiler) {
            idipLogger.warn('idip commands callback: %j, profiler: %j', retValue, data_packet.profiler);
        }

        return callback(null, retValue);
    }

    var result = command.call(command, data_packet.body, data_packet);
    if (_.isFunction(result)) {

        if (!!data_packet.profiler) {
            var profiler = utils.profiler({
                                              server: pomelo.app.getServerId(),
                                              command: data_packet.command.path,
                                              start: Date.now()
                                          });
        }

        return result.call(null, function (err, result) {

            if (!!data_packet.profiler) {
                data_packet.profiler.push(profiler.extendMessage({elapsed: profiler.elapsed()}));
            }

            var util = require('util');

            if (!!data_packet.profiler) {
//                idipLogger.warn('idip commands callback: %j, profiler: %s', result, util.inspect(data_packet.profiler));
                idipLogger.warn('idip commands callback: %j, profiler: %s', result, data_packet.profiler);
            }
            return callback(err, result);
        });
    }

    if (!!data_packet.profiler) {
        idipLogger.warn('idip commands callback: %j, profiler: %j', result, data_packet.profiler);
    }

    return callback(null, result);
};

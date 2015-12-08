/**
 * Created by Administrator on 2014/12/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var idipUtils = require('../../../tools/idipUtils');
var serverManager = require('./../../../ls/serverManager');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.idipCommands = function (data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);

    var lsCommands = require('../../../adminCommands/lsCommands');

    idipUtils.dispatchIdipCommands(lsCommands, data_packet, callback);
};

/**
 * Created by xykong on 2014/8/5.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var Q = require('q');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.dispatchIdipCluster = function (id, data_packet, callback) {

    logger.debug('idipCommands: id: %j, %j', id, data_packet);

    Q.ninvoke(pomelo.app.cluster.idip.clientCluster, 'idipCommands', null, id, data_packet)
        .then(function (result) {
                  return callback(null, result);
              })
        .catch(function (err) {
                   return callback(null, err);
               })
        .done();
};

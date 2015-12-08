/**
 * Created by xykong on 2014/7/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var idipLogger = require('pomelo/node_modules/pomelo-logger').getLogger('idip');
var idipSql = require('./../../../tools/mysql/idipSql');
var errorCodes = require('./../../../tools/errorCodes');
var config = require('./../../../tools/config');
var utils = require('./../../../tools/utils');
var routeUtil = require('./../../../tools/routeUtil');
var globalFunction = require('./../../../tools/globalFunction');
var util = require('util');
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

    logger.debug('idipCommands: id: %j, %j', id, data_packet);

    Q().then(function () {

        var rsp_result = {
            Result: errorCodes.ParameterWrong,
            RetErrMsg: 'ParameterWrong.'
        };

        if (data_packet.body.AreaId != config.vendors.tencent.areaId) {
            rsp_result.RetErrMsg += util.format(' Invalid AreaId. require AreaId: %s, data_packet: %j',
                                                config.vendors.tencent.areaId, data_packet);
            return Q.reject([rsp_result, {}]);
        }

        if ((data_packet.body.PlatId != 2
            && data_packet.body.PlatId != config.vendors.tencent.platId)) {
            rsp_result.RetErrMsg +=
            util.format(' Invalid PlatId. require PlatId 2 or %s, data_packet: %j',
                        config.vendors.tencent.platId, data_packet);
            return Q.reject([rsp_result, {}]);
        }

        if (!data_packet.body.RoleId && !data_packet.body.OpenId) {
            return Q.resolve();
        }

        return Q.nfcall(idipSql.GetInfoByRoleID, data_packet.body.RoleId || 0,
                        data_packet.body.OpenId, data_packet.body.Partition)
            .then(function (result) {
                      if (!result || !result.accountID || (!_.isUndefined(data_packet.body.RoleId)
                          && result.roleID != data_packet.body.RoleId)) {
                          var rsp_result = {
                              Result: errorCodes.NoRole,
                              RetErrMsg: util.format('No Role: data_packet: %j', data_packet)
                          };
                          return Q.reject([rsp_result, {}]);
                      }

                      data_packet.body.AccountId = result.accountID;
                  });
    })
        .then(function () {

                  // logger.warn('data_packet: %j', data_packet);

                  if (data_packet.command.server === 'lsIdip') {
                      return Q.ninvoke(pomelo.app.rpc.lsIdip.lsIdipRemote, 'idipCommands', null, data_packet);
                  }

                  // check Partition available
                  if (!routeUtil.clusterContainsId(data_packet.body.Partition, pomelo.app)) {

                      var comp = pomelo.app.components['__proxy_cluster__'].client._station.servers;
                      logger.warn('Partition %j is not available data_packet: %j servers: %j',
                                  data_packet.body.Partition, data_packet, comp);

                      var rsp_result = {
                          Result: errorCodes.ParameterWrong,
                          RetErrMsg: util.format('Partition %j is not available data_packet: %j',
                                                 data_packet.body.Partition, data_packet)
                      };
                      return Q.reject([rsp_result, {}]);
                  }

                  // send to the real server.
                      var serverUid = globalFunction.GetUseServerUId(data_packet.body.Partition);      //做合服后的serverUid兼容

                  return Q.ninvoke(pomelo.app.cluster.idip.clientCluster, 'idipCommands', null,
                                       serverUid, data_packet);
              })
        .then(function (result) {
                  return callback(null, result);
              })
        .catch(function (err) {
                   return callback(null, err);
               })
        .done();
};

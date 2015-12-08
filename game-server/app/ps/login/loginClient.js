/**
 * Created by xykong on 2014/6/25.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../../tools/config');
var utils = require('../../tools/utils');
var errorCodes = require('../../tools/errorCodes');
var playerManager = require('../player/playerManager');
var util = require('util');
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.serverUid = +config.list.serverUid;

Handler.SendRegister = function () {
    var deferred = Q.defer();

    // retrieve server connector available address.
    var connectors = pomelo.app.getServersByType('connector');
    if (!connectors || connectors.length === 0) {
        return;
    }

    var sendListConfig = _.clone(config.list);

    sendListConfig.host = connectors[0].mapClientHost;
    sendListConfig.port = connectors[0].mapClientPort;

    // select connector
    for (var i in connectors) {
        if (connectors[i].dedicateDispatcher === 'true') {
            sendListConfig.host = connectors[i].mapClientHost;
            sendListConfig.port = connectors[i].mapClientPort;
            break;
        }
    }

    sendListConfig.curUsers = playerManager.GetPlayerCount();

    logger.info('Try SendRegister...');

    if (!pomelo.app.cluster || !pomelo.app.cluster.ls || !pomelo.app.cluster.ls.lsCluster) {
        logger.error('pomelo.app.cluster.ls.lsCluster not exist!');
        return Q.reject('pomelo.app.cluster.ls.lsCluster not exist!');
    }

    var registerServer = Q.nbind(pomelo.app.cluster.ls.lsCluster.Register, pomelo.app.cluster.ls.lsCluster);

//    if (!!config.mergeServerList && !!config.mergeServerList.serverUidList) {   //合服后处理
//        sendListConfig.mList = config.mergeServerList.serverUidList;
//    }

    registerServer(null, null, sendListConfig)
        .then(function (data) {
                  logger.info('ls.lsCluster.Register : %j', data);
                  if (data.result !== 0) {
                      return deferred.reject(errorCodes.SystemCanNotConnect);
                  }

                  if (!!data.serverList) {
                      pomelo.app.rpc.chart.chartRemote.refreshServerList(null, data.serverList, utils.done);
                  }

                  return deferred.resolve();
              })
        .catch(function (err) {
                   logger.error('SendRegister failed: %s', utils.getErrorMessage(err));
                   return deferred.reject();
               })
        .done();

    return deferred;
};

Handler.RegisterToLoginServer = function () {

    logger.info('Register to list server!');

    var self = this;

    logger.info('pomeloClient connecting to %s:%d as id:%s', config.list.loginHost, config.list.loginPort,
                config.list.serverUid);

    Q.resolve()
//        .timeout(3000)
        .then(function () {
                  return self.SendRegister();
              })
        .then(function (data) {
                  logger.fatal('ls.listHandler.Register : %j', util.inspect(data));

//            setInterval(function () {
//                self.SendRegister();
//            }, 60000);
              })
        .catch(function (err) {
                   logger.error('Register To LoginServer failed: %s', utils.getErrorMessage(err));
               })
        .finally(function () {
                     setInterval(function () {
                         self.SendRegister();
                     }, 30000);
                 })
        .done();
};

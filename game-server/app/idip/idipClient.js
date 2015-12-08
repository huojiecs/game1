/**
 * Created by xykong on 2014/7/29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('./../tools/errorCodes');
var config = require('./../tools/config');
var utils = require('./../tools/utils');
var ServerCluster = require('./../tools/components/serverCluster.js');
var util = require('util');
var Q = require('q');
var _ = require('underscore');

var Handler = function (opts) {
    ServerCluster.call(this, opts);
};

util.inherits(Handler, ServerCluster);

module.exports = new Handler();

var handler = Handler.prototype;


handler.Init = function () {
    this.RegisterToCenter();
};


handler.SendRegister = function () {
    var deferred = Q.defer();

    logger.info('Try SendRegister...');

    if (!pomelo.app.cluster || !pomelo.app.cluster.idip || !pomelo.app.cluster.idip.idipCluster) {
        logger.error('pomelo.app.cluster.idip.idipCluster not exist!');

        return Q.reject('pomelo.app.cluster.idip.idipCluster not exist!');
    }

    var serverId = pomelo.app.getServerId();
    if (!config || !config.clusters || !config.clusters.idip || !config.clusters.idip[serverId]
            || !config.clusters.idip[serverId].idip || !config.clusters.idip[serverId].idip[0]
        || !config.clusters.idip[serverId].idip[0].id) {

        logger.error('config for remote cluster not exist!, serverId: %j', serverId);

        return Q.reject('config for remote cluster not exist!');
    }

    var registerServer = Q.nbind(pomelo.app.cluster.idip.idipCluster.Register, pomelo.app.cluster.idip.idipCluster);


    var serverUid = null;
    if (pomelo.app.getServerId().indexOf('ls') !== -1) {
//        serverUid = util.format('idip-%s-%s', config.vendors.tencent.areaId, config.vendors.tencent.platId);
        serverUid = util.format('idip-%s-%s-%s:%s', config.vendors.tencent.areaId, config.vendors.tencent.platId,
                                pomelo.app.getCurServer().host, pomelo.app.getCurServer().port);
    }
    else {
        serverUid = config.list.serverUid;
    }

    var info = {
        areaId: config.vendors.tencent.areaId,
        platId: config.vendors.tencent.platId,
        serverUid: serverUid,
        serverType: 'idip',
        host: config.clusters.idip[serverId].host,
        port: config.clusters.idip[serverId].port
    };

    var jobs = _.map(config.clusters.idip[serverId].idip, function (remoteCluster) {
        registerServer(null, remoteCluster.id, info)
    });

    Q.all(jobs)
        .then(function (data) {
                  logger.warn('pomelo.app.cluster.idip.idipCluster.Register data: %j, info: %j', data, info);

//                  if (data.result !== 0) {
//                      return Q.reject(errorCodes.SystemCanNotConnect);
//                  }
                  return deferred.resolve();
              })
        .catch(function (err) {
                   logger.error('SendRegister failed: %s', utils.getErrorMessage(err));
                   return deferred.reject(err);
               })
        .done();

    return deferred;
};

handler.RegisterToCenter = function () {
    var self = this;

    logger.warn('Register to idip center server!');

//    logger.info('pomeloClient connecting to %s:%d as id:%s', listConfig.loginHost, listConfig.loginPort, listConfig.serverUid);

    Q.resolve()
        .delay(6000)
        .then(function () {
                  return self.SendRegister();
              })
        .then(function (data) {
                  logger.fatal('idip RegisterToCenter: %j', util.inspect(data));

              })
        .catch(function (err) {
                   logger.error('idip RegisterToCenter failed: %s', err.message);
               })
        .finally(function () {
                     setInterval(function () {
                         self.SendRegister();
                     }, 30000);
                 })
        .done();
};
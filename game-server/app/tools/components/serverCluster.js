/**
 * Created by xykong on 2014/8/29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('./../../tools/errorCodes');
var Q = require('q');
var _ = require('underscore');


var Handler = function (opts) {
    this.servers = {};
};

var handler = Handler.prototype;

module.exports = Handler;

handler.Register = function (info) {

    logger.fatal('Register new idip server info: %j', info);

    if (info.port < 1024 || info.port > 65535) {
        return errorCodes.ParameterWrong;
    }

    if (!info.serverUid) {
        return errorCodes.ParameterWrong;
    }

    if (!this.servers) {
        return errorCodes.SystemInitializing;
    }

    if (info.serverUid in this.servers) {
        logger.info('Replace server id: %s, old:%j, new:%j', info.serverUid, this.servers[info.serverUid], info);
    }

    this.servers[info.serverUid] = info;

    this.AddClusterServers(info);

    return errorCodes.OK;
};

handler.UnRegister = function (serverUid) {
    logger.warn('UnRegister server uid: %j, list: %j', serverUid, this.servers);

    if (!(serverUid in this.servers)) {
        logger.error('UnRegister server, no uid: %d server in current server list: %j.', serverUid, this.servers);
        return errorCodes.ParameterWrong;
    }

    delete this.servers[serverUid];

    return errorCodes.OK;
};

handler.AddClusterServers = function (info) {
    logger.info('Connect to idip client server!');

    var proxy = pomelo.app.components['__proxy_cluster__'];

    if (!proxy) {
        logger.error('AddClusterServers can not find proxy!');
        return Q.reject();
    }

    var list = [
        {
            id: info.serverUid,
            serverType: info.serverType,
            host: info.host,
            port: info.port
        }
    ];

    //上级接到下级idip上报，建立连接，判断连接队列里是否有次连接，只创建一次连接
    if(proxy.client._station.onlines[info.serverUid]) {
        var online = proxy.client._station.onlines[info.serverUid];
        if((info.serverType == 'idip' || info.serverType == 'fs') && online >= 1) {
            return;
        }
    }

    proxy.addServers(list);

    return Q.resolve();
};

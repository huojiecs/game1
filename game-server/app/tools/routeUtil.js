/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-27
 * Time: 下午2:03
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var util = require('util');
var _ = require('underscore');

var Handler = module.exports;

Handler.setRoute = function (app, key, serverType, routeFunc) {
    var routes = app.get(key);
    if (!routes) {
        routes = {};
        app.set(key, routes);
    }
    routes[serverType] = routeFunc;
    return app;
};

Handler.noRoute = function (session, msg, app, cb) {
    cb(new Error('gate no route'));
};

Handler.selectByArg = function (session, msg, app, cb) {
    var serverId = msg.args[0];
    if (!serverId) {
        return cb(util.format('ServerID is null. msg: %j', msg));
    }
    return cb(null, serverId);
};

Handler.selectClusterByArgHeadMatch = function (session, msg, app, cb) {
    var comp = pomelo.app.components['__proxy_cluster__'];
    if (!comp) {
        return cb(new Error('Can not find server info by component __proxy_cluster__.'));
    }
    var serversMap = comp.client._station.serversMap;
    if (!serversMap) {
        return cb(new Error('Can not find server info for no serversMap.'));
    }
    var servers = serversMap[msg.serverType];
    if (!servers || !servers.length) {
        return cb(new Error('Can not find servers info for serverType: ' + msg.serverType));
    }

    var serverIdHead = msg.args[0];

    var filters = _.filter(servers, function (serverId) {
        return ('' + serverId).indexOf(serverIdHead) != -1;
    });

    var serverIndex = _.random(filters.length - 1);

//    console.warn('selectClusterByArgHeadMatch servers: %j filters: %j serverIndex: %j', servers, filters, serverIndex);

    return cb(null, filters[serverIndex]);
};

Handler.selectClusterFirst = function (session, msg, app, cb) {
    var comp = pomelo.app.components['__proxy_cluster__'];
    if (!comp) {
        return cb(new Error('Can not find server info by component __proxy_cluster__.'));
    }
    var serversMap = comp.client._station.serversMap;
    if (!serversMap) {
        return cb(new Error('Can not find server info for no serversMap.'));
    }
    var servers = serversMap[msg.serverType];
    if (!servers || !servers.length) {
        return cb(new Error('Can not find servers info for serverType: ' + msg.serverType));
    }
    var serverId = servers[0];
    if (!serverId) {
        return cb(new Error('Can not find server info for serverType: ' + msg.serverType));
    }
    return cb(null, serverId);
};

Handler.clusterContainsId = function (serverId, app) {
    var comp = app.components['__proxy_cluster__'];
    if (!comp) {
        return false;
    }
    var servers = comp.client._station.servers;

    return _.contains(_.keys(servers), '' + serverId);
};

Handler.selectFirstRpc = function (session, msg, app, cb) {
    var servers = pomelo.app.getServersByType(msg.serverType);
    if (!servers || !servers.length) {

        var logServers = _.mapObject(pomelo.app.serverTypeMaps, function (value) {
            return _.map(value, function (item) {
                return [item.id, item.port, item.pid];
            })
        });

        return cb(new Error(util.format('Can not find server info for serverType: %j, serverTypeMaps: %j',
                                        msg.serverType, logServers)));
    }
    return cb(null, servers[0].id);
};

Handler.selectByBind = function (session, msg, app, cb) {

    var bindId = this;

    var servers = pomelo.app.getServersByType(msg.serverType);

    //console.warn('selectByBind bindId %j servers: %j', this, servers);

    var index = _.find(servers, function (server) {
        return server.id == bindId;
    });

    if (!servers || !servers.length || !index) {
        return cb(new Error(util.format('Can not find server info for bindId %j servers: %j, serverType: %j, serverTypeMaps: %j',
                                        bindId, servers, msg.serverType, pomelo.app.serverTypeMaps)));
    }
    return cb(null, bindId);
};

Handler.selectRandomByMatch = function (session, msg, app, cb) {

    var bindMatch = this;

    var servers = pomelo.app.getServersByType(msg.serverType);

    if (!servers || !servers.length) {
        return cb(new Error(util.format('Can not find server info for bindMatch %j servers: %j, serverType: %j, serverTypeMaps: %j',
                                        bindMatch, servers, msg.serverType, pomelo.app.serverTypeMaps)));
    }

    //console.warn('selectRandomByMatch bindMatch %j servers: %j', this, servers);

    var filters = _.filter(servers, function (server) {
        return server.id.search(bindMatch) != -1;
    });

    var serverIndex = _.random(filters.length - 1);

//    console.warn('selectRandomByMatch bindMatch %j servers: %j filters: %j serverIndex: %j', this, servers, filters,
//                 serverIndex);

    return cb(null, filters[serverIndex].id);
};

Handler.con2cs = function (session, msg, app, cb) {
    var serverId = session.get('csServerID');
    if (!serverId) {
        return cb(new Error(util.format('con2cs csServerID is null. msg: %j', msg)));
    }
    return cb(null, serverId);
};

Handler.selectRandomRpc = function (session, msg, app, cb) {
    var servers = pomelo.app.getServersByType(msg.serverType);
    if (!servers || !servers.length) {
        return cb(new Error('Can not find server info for serverType: ' + msg.serverType));
    }

    var serverIndex = _.random(servers.length - 1);

    //console.warn('selectRandomRpc serverIndex: %j, server: %j', serverIndex, servers[serverIndex]);

    return cb(null, servers[serverIndex].id);
};

Handler.selectRandomRpcExceptFirst = function (session, msg, app, cb) {
    var servers = pomelo.app.getServersByType(msg.serverType);
    if (!servers || !servers.length) {
        return cb(new Error('Can not find server info for serverType: ' + msg.serverType));
    }

    var serverIndex = _.random(1, servers.length - 1);

    if (serverIndex >= servers.length) {
        return cb(new Error('Only one server for selectRandomRpcExceptFirst serverType: ' + msg.serverType));
    }

    return cb(null, servers[serverIndex].id);
};

Handler.all2dbcache = function (session, msg, app, cb) {
    var servers = pomelo.app.getServersByType('dbcache');
    if (!servers || !servers.length) {
        return cb(new Error('dbcache Server is null.'));
    }

    var selected = 0;

    if (_.isNumber(msg.args[0])) {
        selected = msg.args[0] % servers.length;
    }
    else {
        selected = _.random(servers.length - 1);
    }

    return cb(null, servers[selected].id);
};

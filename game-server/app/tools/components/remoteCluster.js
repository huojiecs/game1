/**
 * Component for remote service.
 * Load remote service and add to global context.
 */
var fs = require('fs');
var path = require('path');
var util = require('util');
var pathUtil = require('pomelo/lib/util/pathUtil');
var Constants = require('pomelo/lib/util/constants');
var RemoteServer = require('pomelo/node_modules/pomelo-rpc').server;
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('rpc-cluster', __filename);

/**
 * Remote component factory function
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 *                       opts.acceptorFactory {Object}: acceptorFactory.create(opts, cb)
 * @return {Object}     remote component instances
 */
module.exports = function (app, opts) {
    opts = opts || {};

    // cacheMsg is deprecated, just for compatibility here.
    opts.bufferMsg = opts.bufferMsg || opts.cacheMsg || false;
    opts.interval = opts.interval || 30;
//    if (app.enabled('rpcDebugLog')) {
//        opts.rpcDebugLog = true;
//        opts.rpcLogger = require('pomelo-logger').getLogger('rpc-debug', __filename);
//    }
    return new Component(app, opts);
};

/**
 * Remote component class
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
var Component = function (app, opts) {
    this.app = app;
    this.opts = opts;
};

var pro = Component.prototype;

pro.name = '__remote_cluster__';

/**
 * Remote component lifecycle function
 *
 * @param {Function} cb
 * @return {Void}
 */
pro.start = function (cb) {
    this.app.loadConfigBaseApp('clusters', '/config/clusters.json');

    var serverType = this.app.getServerType();
    var serverId = this.app.getServerId();
    var options = this.app.get('clusters');

    if (!options) {
        return process.nextTick(cb);
    }
    options = options[serverType];
    if (!options) {
        return process.nextTick(cb);
    }
    options = options[serverId];
    if (!options) {
        return process.nextTick(cb);
    }

    this.opts.port = options.port;
    this.remote = genRemote(this.app, this.opts);
    if (this.remote) {
        this.remote.start();
    }
    process.nextTick(cb);
};

/**
 * Remote component lifecycle function
 *
 * @param {Boolean}  force whether stop the component immediately
 * @param {Function}  cb
 * @return {Void}
 */
pro.stop = function (force, cb) {
    if (this.remote) {
        this.remote.stop(force);
    }
    process.nextTick(cb);
};

var getUserClusterPath = function (appBase, serverType) {
    var p = path.join(appBase, '/app/servers/', serverType, 'cluster');
    return fs.existsSync(p) ? p : null;
};

/**
 * Get remote paths from application
 *
 * @param {Object} app current application context
 * @return {Array} paths
 *
 */
var getRemotePaths = function (app) {
    var paths = [];

    var serverType = app.getServerType();
    var userPath = getUserClusterPath(app.getBase(), serverType);
    if (fs.existsSync(userPath)) {
        paths.push(pathUtil.remotePathRecord('user', serverType, userPath));
    }

    return paths;
};

/**
 * Generate remote server instance
 *
 * @param {Object} app current application context
 * @param {Object} opts contructor parameters for rpc Server
 * @return {Object} remote server instance
 */
var genRemote = function (app, opts) {
    opts.paths = getRemotePaths(app);
    opts.context = app;
    logger.info('genRemote: port: %d, paths: %j', opts.port, opts.paths);
    if (!opts || !opts.port || opts.port < 0 || !opts.paths || opts.paths.length === 0) {
        return null;
    }
    if (!!opts.rpcServer) {
        return opts.rpcServer.create(opts);
    } else {
        return RemoteServer.create(opts);
    }
};

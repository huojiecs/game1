/**
 * Created by xykong on 2014/7/29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var adjustLogger = require('pomelo/node_modules/pomelo-logger').getLogger('adjust');
var errorCodes = require('./../tools/errorCodes');
var defaultValues = require('./../tools/defaultValues');
var restify = require('restify');
var config = require('./../tools/config');
var templateManager = require('./../tools/templateManager');
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
    this.StartRestfulServer();
};


handler.StartRestfulServer = function () {

    var self = this;

    function respond_get_print(req, res, next) {
        logger.warn('respond_get_print recv path: %j req.query: %j', req._url.pathname, req.query);
        //adjustLogger.warn('respond_get_print recv path: %j req: %s', req._url.pathname, util.inspect(req, {depth: 10}));

        adjustLogger.fatal('%s,%s,%s', new Date().toISOString(), req._url.pathname, _.values(req.query).join(','));

        res.send('ok');

        return next();
    }

    function respond_post_print(req, res, next) {
        logger.warn('respond_post_print recv path: %j req.body: %j', req._url.pathname, req.body);

        adjustLogger.fatal('%s,%s,%s', new Date().toISOString(), req._url.pathname, _.values(req.body).join(','));

        res.send('ok');

        return next();
    }

    var server = restify.createServer({
        name: 'adjust restify',
        version: '1.0.0'
    });

    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    server.post('/callback/.*', respond_post_print);

    server.get('/callback/.*', respond_get_print);

    //server.get('/callback/click', respond_get_print);
    //server.get('/callback/install', respond_get_print);
    //server.get('/callback/session', respond_get_print);
    //server.get('/callback/event', respond_get_print);

    var curServer = pomelo.app.getCurServer();
    server.listen(curServer.adjustPort, curServer.adjustHost, function () {
        logger.fatal('%s listening at %s', server.name, server.url);
    });
};

/**
 * Created by xykong on 2014/7/29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var idipLogger = require('pomelo/node_modules/pomelo-logger').getLogger('idip');
var errorCodes = require('./../tools/errorCodes');
var defaultValues = require('./../tools/defaultValues');
var restify = require('restify');
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
    this.StartRestfulServer();
};

/**
 * @return {number}
 */
handler.ConvertErrorToIdip = function (error) {

    if (error === errorCodes.OK) {
        return 0;   // ERR_NO_USER
    }
    else if (error === errorCodes.NoRole) {
        return 1;   // ERR_NO_USER
    }
    else if (error === errorCodes.ParameterNull) {
        return -3996;   // CMD_ERROR_API_INVALID_PARAM
    }
    else if (error === errorCodes.ParameterWrong) {
        return -3996;   // CMD_ERROR_API_INVALID_PARAM
    }
    else if (error === errorCodes.SystemNoServer) {
        return -3995;   // CMD_ERROR_API_GET_SERVER
    }

    return -1;  // ERR_SYSTEM = -1
};

handler.StartRestfulServer = function () {

    var self = this;

    function respond(req, res, next) {
        logger.info('req: %j', req.query);
        res.send('hello ' + req.params.name);

        return next();
    }

    function respond_post_command(req, res, next) {

        idipLogger.debug('idip recv req.body: %s', req.body);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      logger.debug('recv post idip: %s', req.body);

                      req.data_packet = JSON.parse(req.body.replace('data_packet=', ''));
                      var cmdId = req.data_packet.head.Cmdid;
                      req.data_packet.command = config.idip.commands[cmdId];


                      if (!!defaultValues.idipEnableProfiler) {
                          req.data_packet.profiler = [];

                          req.data_packet.profiler.push({
                                                            server: pomelo.app.getServerId(),
                                                            command: 'respond_post_command',
                                                            start: Date.now()
                                                        });
                      }

                      return respond_command(req, res, next);
                  })
            .then(function (body) {

                      if (!!body.result) {
                          return Q.reject(body);
                      }

                      if (!_.isArray(body)) {
                          return Q.reject(body);
                      }

                      if (_.isArray(body) && !!body[0].Result) {
                          return Q.reject(body);
                      }

                      var head = req.data_packet.head;
                      head.Cmdid++;
                      head.Result = body[0].Result;
                      head.RetErrMsg = body[0].RetErrMsg;

                      head.Result = self.ConvertErrorToIdip(head.Result);

                      var result = JSON.stringify({head: head, body: body[1]});
                      return Q.resolve(result);
                  })
            .catch(function (err) {
                       logger.debug('send post failed: %s', utils.getErrorMessage(err));

                       var head = req.data_packet.head;
                       head.Cmdid++;
                       if (_.isArray(err)) {
                           head.Result = err[0].Result;
                           head.RetErrMsg = err[0].RetErrMsg || err[0].RetMsg || utils.getErrorMessage(err);
                       }
                       else {
                           head.Result = errorCodes.SystemWrong;
                           head.RetErrMsg = utils.getErrorMessage(err);
                       }

                       head.Result = self.ConvertErrorToIdip(head.Result);

                       var result = JSON.stringify({head: head, body: {}});

                       return Q.resolve(result);
                   })
            .then(function (result) {
                      var head = {
                          'Content-Length': Buffer.byteLength(result),
                          'Content-Type': 'text/html'
                      };

                      idipLogger.warn("idip respond_post_command elapsed %s, req.body: %j, response head: %j, result: %j",
                                      profiler.elapsed(), req.body, head, result);

                      res.writeHead(200, head);
                      res.write(result);
                      res.end();
                  })
            .finally(function () {
                         return next();
                     })
            .done();
    }

    function respond_get_command(req, res, next) {

        idipLogger.debug('idip recv req.query: %j', req.query);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      req.data_packet = {
                          body: req.query
                      };

                      for (var k in config.idip.commands) {
                          var v = config.idip.commands[k];
                          if (v.path === req.params.command) {
                              req.data_packet.command = v;
                              break;
                          }
                      }

                      if (!!defaultValues.idipEnableProfiler) {
                          req.data_packet.profiler = [];

                          req.data_packet.profiler.push({
                                                            server: pomelo.app.getServerId(),
                                                            command: 'respond_get_command',
                                                            start: Date.now()
                                                        });
                      }

                      return respond_command(req, res, next);
                  })
            .then(function (result) {

                      if (!!result.result) {
                          return Q.reject(result);
                      }

                      if (!_.isArray(result)) {
                          return Q.reject(result);
                      }

                      if (_.isArray(result) && !!result[0].Result) {
                          return Q.reject(result);
                      }

                      result[0].Result = self.ConvertErrorToIdip(result[0].Result);

                      logger.info('respond_command result: %j', result);
                      res.send(JSON.stringify(result));

                      idipLogger.warn("idip respond_get_command elapsed %s, req.params: %j, response result: %j",
                                      profiler.elapsed(), req.params, result);
                  })
            .catch(function (err) {
                       err.Result = self.ConvertErrorToIdip(err.Result);

                       res.send(JSON.stringify(err));

                       idipLogger.warn("idip respond_get_command elapsed %s, req.query: %j, failed: %s",
                                       profiler.elapsed(), req.query, utils.getErrorMessage(err));
                   })
            .finally(function () {

                         return next();
                     })
            .done();
    }

    function respond_command(req, res, next) {

        if (!!req.data_packet.profiler) {
            req.data_packet.profiler.push({
                                              server: pomelo.app.getServerId(),
                                              command: 'respond_command',
                                              start: Date.now()
                                          });
        }

        if (!req.data_packet.command) {
            return Q.reject({
                                Result: errorCodes.ParameterWrong,
                                RetErrMsg: util.format('No available commands in idip.json, data_packet: %j',
                                                       req.data_packet) + utils.getFilenameLine()
                            }
            );
        }

        if (!pomelo.app.cluster) {
            return Q.reject({
                                Result: errorCodes.SystemInitializing,
                                RetErrMsg: 'SystemInitializing.' + utils.getFilenameLine()
                            }
            );
        }

        return Q.resolve()
            .then(function () {

                      var rsp_result = {
                          Result: errorCodes.ParameterWrong,
                          RetErrMsg: 'ParameterWrong.' + utils.getFilenameLine()
                      };

                      //"AreaId" : ,       /* 服务器：微信（1），手Q（2）, 3, 990 - 1000 */
                      //"PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
                      if (req.data_packet.body.AreaId != 1 && req.data_packet.body.AreaId != 2
                              && req.data_packet.body.AreaId != 3
                          && !(req.data_packet.body.AreaId >= 990 && req.data_packet.body.AreaId <= 1000)) {
                          rsp_result.RetErrMsg +=
                          util.format(' Invalid AreaId. require AreaId: 1 or 2, data_packet: %j', req.data_packet);
                          return Q.reject([rsp_result, {}]);
                      }

                      if (req.data_packet.body.PlatId != 0 && req.data_packet.body.PlatId != 1) {
                          rsp_result.RetErrMsg +=
                          util.format(' Invalid PlatId. require PlatId: 0 or 1, data_packet: %j', req.data_packet);
                          return Q.reject([rsp_result, {}]);
                      }

                      // send to idip ls server.
                      var serverUid = util.format('idip-%s-%s', req.data_packet.body.AreaId,
                                                  req.data_packet.body.PlatId);

                      return Q.ninvoke(pomelo.app.cluster.idip.loginCluster, 'idipCommands', null,
                                       serverUid, req.data_packet);
                  });

    }

    var server = restify.createServer({
                                          name: 'idip restify',
                                          version: '1.0.0'
                                      });

    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    server.get('/hello/:name', respond);
    server.head('/hello/:name', respond);
    server.get('/api/:command', respond_get_command);
    server.post('/api/idip', respond_post_command);

    var curServer = pomelo.app.getCurServer();
    server.listen(curServer.idipPort, curServer.idipHost, function () {
        logger.fatal('%s listening at %s', server.name, server.url);
    });
};

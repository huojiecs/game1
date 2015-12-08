/**
 * Created by xykong on 2014/7/29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var apiLogger = require('pomelo/node_modules/pomelo-logger').getLogger('api');
var errorCodes = require('./../tools/errorCodes');
var defaultValues = require('./../tools/defaultValues');
var restify = require('restify');
var cmgeSql = require('./../tools/mysql/cmgeSql');
var config = require('./../tools/config');
var templateManager = require('./../tools/templateManager');
var adjust = require('./../tools/openSdks/adjust/adjust');
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
handler.ConvertErrorToApi = function (error) {

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

    function respond_get_print(req, res, next) {
        apiLogger.warn('respond_get_print recv path: %j req.query: %j req.params: %j', req._url.pathname, req.query,
                       req.params);

        res.send('ok');

        return next();
    }

    function respond_post_print(req, res, next) {
        apiLogger.warn('respond_post_print recv path: %j req.body: %j', req._url.pathname, req.body);

        res.send('ok');

        return next();
    }

    function respond_post_command(req, res, next) {
        apiLogger.warn('respond_post_command recv path: %j req.params: %s', req._url.pathname, req.params);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      logger.info('respond_post_command params: %j', req.params);

                      req.data_packet = {
                          body: req.params
                      };

                      if (!!defaultValues.apiEnableProfiler) {
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

                      var result = 'success';
                      return Q.resolve(result);
                  })
            .catch(function (err) {
                       logger.error('respond_post_command failed: %s', utils.getErrorMessage(err));

                       var result = 'failed';

                       return Q.resolve(result);
                   })
            .then(function (result) {
                      var head = {
                          'Content-Length': Buffer.byteLength(result),
                          'Content-Type': 'text/html'
                      };

                      apiLogger.warn("respond_post_command elapsed %s, req.body: %j, response head: %j, result: %j",
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
        apiLogger.warn('respond_get_command recv path: %j req.query: %j', req._url.pathname, req.query);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      req.data_packet = {
                          body: req.query
                      };

                      if (!!defaultValues.apiEnableProfiler) {
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
                      logger.info('respond_command result: %j', result);

                      if (!!result.result) {
                          return Q.reject(result);
                      }

                      if (!_.isArray(result)) {
                          return Q.reject(result);
                      }

                      if (_.isArray(result) && !!result[0].Result) {
                          return Q.reject(result);
                      }

                      result[0].Result = self.ConvertErrorToApi(result[0].Result);

                      logger.info('respond_command result: %j', result);
                      res.send(result);

                      apiLogger.warn("respond_get_command elapsed %s, req.params: %j, response result: %j",
                                     profiler.elapsed(), req.params, result);
                  })
            .catch(function (err) {
                       err.Result = self.ConvertErrorToApi(err.Result);

                       res.send(err);

                       apiLogger.warn("respond_get_command elapsed %s, req.query: %j, failed: %s",
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

        if (!!req.data_packet.body.payTime) {
            req.data_packet.body.payTime = utils.getDateFromFormat(req.data_packet.body.payTime, 'yyyyMMddHHmmss');
        }

        if (!!req.data_packet.body.paySUTime) {
            req.data_packet.body.paySUTime = utils.getDateFromFormat(req.data_packet.body.paySUTime, 'yyyyMMddHHmmss');
        }

        return Q.resolve()
            .then(function () {

                      var rsp_result = {
                          Result: errorCodes.ParameterWrong,
                          RetErrMsg: 'ParameterWrong.' + utils.getFilenameLine()
                      };

                      if (!req.data_packet.body.callBackInfo) {
                          return Q.reject(rsp_result);
                      }

                      // Fix client data format error.
                      if (req.data_packet.body.callBackInfo.indexOf('idfv') != -1
                          && req.data_packet.body.callBackInfo.indexOf(',idfv') == -1) {
                          req.data_packet.body.callBackInfo =
                              req.data_packet.body.callBackInfo.replace('idfv', ',idfv');
                      }

                      /// begin parse callBackInfo
                      _.each(req.data_packet.body.callBackInfo.split(','), function (item) {
                          var info = item.split('=');

                          if (!_.contains(['ver', 'activityId', 'idfa', 'idfv', 'mac', 'mac_md5', 'mac_sha1',
                                           'android_id', 'gps_adid'], info[0])) {
                              return;
                          }

                          if (!info[1]) {
                              return;
                          }

                          req.data_packet.body[info[0]] = info[1];
                      });

                      req.data_packet.body.activityId = +req.data_packet.body.activityId || 0;
                      /// end parse callBackInfo

                      var activityDataSet;
                      var activityData;
                      if (!req.data_packet.body.activityId) {
                          activityDataSet = templateManager.GetAllTemplate('RechargeActivityTemplate');

                          _.find(activityDataSet, function (item) {
                              if (item.realMoney == req.data_packet.body.amount) {
                                  req.data_packet.body.activityId = item.activityId;
                                  return true;
                              }
                          });
                      }

                      if (!!req.data_packet.body.activityId) {
                          activityDataSet = templateManager.GetAllTemplate('RechargeActivityTemplate');

                          if (!req.data_packet.body.channelId) {
                              req.data_packet.body.channelId = 'default';
                          }

                          activityData = _.find(activityDataSet, function (item) {
                              return item.channelId == req.data_packet.body.channelId
                                     && item.activityId == req.data_packet.body.activityId;
                          });

                      }

                      if (!!activityData) {
                          var isTime = (new Date(activityData.activityBeginTime) < new Date()
                                        && new Date(activityData.activityEngTime) > new Date());

                          req.data_packet.body.amount = '' + (+req.data_packet.body.amount + 1);
                          req.data_packet.body.baseMoney = activityData.baseMoney;
                          req.data_packet.body.generate = isTime ? activityData.activity : activityData.extra;
                          req.data_packet.body.extra = activityData.extra;
                      }
                      else {
                          req.data_packet.body.amount = '' + (+req.data_packet.body.amount + 1);
                          req.data_packet.body.baseMoney = req.data_packet.body.amount;
                          req.data_packet.body.generate = 0;
                          req.data_packet.body.extra = 0;
                      }

                      // save to mysql.
                      return Q.ninvoke(cmgeSql, 'SaveOrders', req.data_packet.body);
                  })
            .then(function (result) {

                      logger.warn('SaveOrders result: %j', result);

                      if (result.Result == 0) {
                          var params = {
                              revenue: (+req.data_packet.body.amount - 1) / 100
                          };

                          var found = false;
                          _.each(['idfa', 'idfv', 'mac', 'mac_md5', 'mac_sha1', 'gps_adid', 'android_id'],
                              function (deviceId) {
                                  if (deviceId in req.data_packet.body) {
                                      params[deviceId] = req.data_packet.body[deviceId];
                                      found = true;
                                  }
                              });

                          if (!!found) {
                              adjust.revenue(params).done();
                          }
                          else {
                              logger.warn('respond_command no valid deviceId in req.data_packet.body: %j',
                                          req.data_packet.body);
                          }
                      }

                      return Q.resolve(result);
                  });
    }


    function respond_get_query_balance(req, res, next) {

        apiLogger.warn('respond_get_query_balance recv req query: %j', req.query);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      req.data_packet = {
                          body: req.query
                      };

                      if (!!defaultValues.apiEnableProfiler) {
                          req.data_packet.profiler = [];

                          req.data_packet.profiler.push({
                              server: pomelo.app.getServerId(),
                              command: 'respond_get_query_balance',
                              start: Date.now()
                          });
                      }

                      return respond_query_balance(req, res, next);
                  })
            .then(function (result) {
                      logger.info('respond_query_balance result: %j', result);

                      if (!!result.Result) {
                          return Q.reject(result);
                      }

                      result.Result = self.ConvertErrorToApi(result.Result);

                      //res.send(JSON.stringify(result));
                      res.send(result);

                      apiLogger.warn("respond_get_command elapsed %s, req.params: %j, response result: %j",
                                     profiler.elapsed(), req.params, result);
                  })
            .catch(function (err) {
                       err.Result = self.ConvertErrorToApi(err.Result);

                       res.send(err);

                       apiLogger.warn("respond_get_command elapsed %s, req.query: %j, failed: %s",
                                      profiler.elapsed(), req.query, utils.getErrorMessage(err));
                   })
            .finally(function () {

                         return next();
                     })
            .done();
    }

    function respond_query_balance(req, res, next) {

        if (!!req.data_packet.profiler) {
            req.data_packet.profiler.push({
                server: pomelo.app.getServerId(),
                command: 'respond_query_balance',
                start: Date.now()
            });
        }

        return Q.resolve()
            .then(function () {

                      var rsp_result = {
                          Result: errorCodes.ParameterWrong,
                          RetErrMsg: 'ParameterWrong.' + utils.getFilenameLine()
                      };

                      // save to mysql.
                      return Q.ninvoke(cmgeSql, 'QueryBalance', req.data_packet.body);
                  });

    }


    function respond_get_pay_balance(req, res, next) {

        apiLogger.warn('respond_get_pay_balance recv req query: %j', req.query);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      req.data_packet = {
                          body: req.query
                      };

                      if (!!defaultValues.apiEnableProfiler) {
                          req.data_packet.profiler = [];

                          req.data_packet.profiler.push({
                              server: pomelo.app.getServerId(),
                              command: 'respond_get_pay_balance',
                              start: Date.now()
                          });
                      }

                      return respond_pay_balance(req, res, next);
                  })
            .then(function (result) {
                      logger.info('respond_pay_balance result: %j', result);

                      if (!!result.result) {
                          return Q.reject(result);
                      }

                      if (!_.isArray(result)) {
                          return Q.reject(result);
                      }

                      if (_.isArray(result) && !!result[0].Result) {
                          return Q.reject(result);
                      }

                      result[0].Result = self.ConvertErrorToApi(result[0].Result);

                      res.send(result);

                      apiLogger.warn("respond_get_pay_balance elapsed %s, req.params: %j, response result: %j",
                                     profiler.elapsed(), req.params, result);
                  })
            .catch(function (err) {
                       err.Result = self.ConvertErrorToApi(err.Result);

                       res.send(err);

                       apiLogger.warn("respond_get_pay_balance elapsed %s, req.query: %j, failed: %s",
                                      profiler.elapsed(), req.query, utils.getErrorMessage(err));
                   })
            .finally(function () {

                         return next();
                     })
            .done();
    }

    function respond_pay_balance(req, res, next) {

        if (!!req.data_packet.profiler) {
            req.data_packet.profiler.push({
                server: pomelo.app.getServerId(),
                command: 'respond_pay_balance',
                start: Date.now()
            });
        }

        return Q.resolve()
            .then(function () {

                      var rsp_result = {
                          Result: errorCodes.ParameterWrong,
                          RetErrMsg: 'ParameterWrong.' + utils.getFilenameLine()
                      };

                      // save to mysql.
                      return Q.ninvoke(cmgeSql, 'PayBalance', req.data_packet.body);
                  });

    }

    function respond_post_query_balance(req, res, next) {

        apiLogger.warn('respond_post_query_balance recv req query: %j', req.query);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      req.data_packet = {
                          body: req.query
                      };

                      if (!!defaultValues.apiEnableProfiler) {
                          req.data_packet.profiler = [];

                          req.data_packet.profiler.push({
                              server: pomelo.app.getServerId(),
                              command: 'respond_post_query_balance',
                              start: Date.now()
                          });
                      }

                      return respond_query_balance(req, res, next);
                  })
            .then(function (result) {
                      logger.info('respond_query_balance result: %j', result);

                      if (!!result.result) {
                          return Q.reject(result);
                      }

                      if (!_.isArray(result)) {
                          return Q.reject(result);
                      }

                      if (_.isArray(result) && !!result[0].Result) {
                          return Q.reject(result);
                      }

                      result[0].Result = self.ConvertErrorToApi(result[0].Result);

                      logger.info('respond_query_balance result: %j', result);
                      res.send(result);

                      apiLogger.warn("respond_post_query_balance elapsed %s, req.params: %j, response result: %j",
                                     profiler.elapsed(), req.params, result);
                  })
            .catch(function (err) {
                       err.Result = self.ConvertErrorToApi(err.Result);

                       res.send(err);

                       apiLogger.warn("respond_post_query_balance elapsed %s, req.query: %j, failed: %s",
                                      profiler.elapsed(), req.query, utils.getErrorMessage(err));
                   })
            .finally(function () {

                         return next();
                     })
            .done();
    }

    function respond_get_require_payment_list(req, res, next) {

        apiLogger.warn('respond_get_require_payment_list recv req query: %j', req.query);

        var profiler = utils.profiler();

        Q.resolve()
            .then(function () {
                      req.data_packet = {
                          body: req.query
                      };

                      if (!!defaultValues.apiEnableProfiler) {
                          req.data_packet.profiler = [];

                          req.data_packet.profiler.push({
                              server: pomelo.app.getServerId(),
                              command: 'respond_get_require_payment_list',
                              start: Date.now()
                          });
                      }


                      var result = {
                          "result": 0,
                          "mp_info": {
                              "utp_mpinfo": [
                                  {"id": 12087839, "num": 500, "send_num": 500, "realMoney": 499, "send_ext": "1001"},
                                  {"id": 12087840, "num": 1000, "send_num": 100, "realMoney": 999, "send_ext": "1002"}
                              ]
                          }
                      };

                      //return Q.resolve(result);

                      return respond_require_payment_list(req, res, next);
                  })
            .then(function (result) {
                      logger.info('respond_get_require_payment_list result: %j', result);

                      if (!!result.result) {
                          return Q.reject(result);
                      }

                      result.result = self.ConvertErrorToApi(result.result);

                      logger.info('respond_get_require_payment_list result: %j', result);
                      res.send(result);

                      apiLogger.warn("respond_get_require_payment_list elapsed %s, req.params: %j, response result: %j",
                                     profiler.elapsed(), req.params, result);
                  })
            .catch(function (err) {
                       err.result = self.ConvertErrorToApi(err.result);

                       res.send(err);

                       apiLogger.warn("respond_get_require_payment_list elapsed %s, req.query: %j, failed: %s",
                                      profiler.elapsed(), req.query, utils.getErrorMessage(err));
                   })
            .finally(function () {

                         return next();
                     })
            .done();
    }

    function respond_require_payment_list(req, res, next) {

        if (!!req.data_packet.profiler) {
            req.data_packet.profiler.push({
                server: pomelo.app.getServerId(),
                command: 'respond_require_payment_list',
                start: Date.now()
            });
        }

        return Q.resolve()
            .then(function () {

                      var rsp_result = {
                          Result: errorCodes.ParameterWrong,
                          RetErrMsg: 'ParameterWrong.' + utils.getFilenameLine()
                      };

                      if (!req.data_packet.body.serverId) {
                          rsp_result.RetErrMsg +=
                              util.format('ParameterWrong serverId: %j %j', req.data_packet.body.serverId,
                                          utils.getFilenameLine());
                          return Q.reject(rsp_result);
                      }

                      if (!req.data_packet.body.roleId) {
                          rsp_result.RetErrMsg +=
                              util.format('ParameterWrong roleId: %j %j', req.data_packet.body.roleId,
                                          utils.getFilenameLine());
                          return Q.reject(rsp_result);
                      }

                      if (!req.data_packet.body.channelId) {
                          req.data_packet.body.channelId = 'default';
                      }

                      var activityData = templateManager.GetAllTemplate('RechargeActivityTemplate');

                      req.data_packet.body.activities = _.map(_.filter(activityData, function (item) {
                          return item.channelId == req.data_packet.body.channelId;
                      }), function (value) {
                          return value.activityId;
                      }).join(',');

                      // save to mysql.
                      return Q.ninvoke(cmgeSql, 'QueryActivity', req.data_packet.body);
                  })
            .then(function (queryResult) {

                      var result = {
                          "result": 0,
                          "mp_info": {
                              "utp_mpinfo": [
                                  //{"id": 12087839, "num": 500, "send_num": 500, "realMoney": 499, "send_ext": "1001"},
                                  //{"id": 12087840, "num": 1000, "send_num": 100, "realMoney": 999, "send_ext": "1002"}
                              ]
                          }
                      };

                      var activityData = templateManager.GetAllTemplate('RechargeActivityTemplate');
                      result.mp_info.utp_mpinfo = _.map(_.filter(activityData, function (item) {
                          return item.channelId == req.data_packet.body.channelId;
                      }), function (value, key) {

                          var activities = _.map(queryResult, function (item) {
                              return item.activityId;
                          });

                          var isActivity = _.contains(activities, value.activityId);

                          var isTime = new Date(value.activityBeginTime) < new Date()
                                       && new Date(value.activityEngTime) > new Date();

                          return {
                              "id": value.feePointId,
                              "num": value.baseMoney,
                              "send_num": isTime && !isActivity ? value.activity : value.extra,
                              "realMoney": value.realMoney,
                              "send_ext": isTime && !isActivity ? '' + value.activityId : ''
                          };
                      });

                      return Q.resolve(result);
                  });

    }

    var server = restify.createServer({
        name: 'api restify',
        version: '1.0.0'
    });

    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    server.get('/callback/payment/android', respond_get_command);
    server.get('/callback/payment/ios', respond_get_command);
    server.post('/callback/payment/android', respond_post_command);
    server.post('/callback/payment/ios', respond_post_command);

    server.get('/payment/require_payment_list', respond_get_require_payment_list);
    server.get('/payment/query_balance', respond_get_query_balance);
    server.post('/payment/query_balance', respond_post_query_balance);

    server.get('/payment/pay_balance', respond_get_pay_balance);

    var curServer = pomelo.app.getCurServer();
    server.listen(curServer.apiPort, curServer.apiHost, function () {
        logger.fatal('%s listening at %s', server.name, server.url);
    });
};

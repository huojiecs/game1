/**
 * Created by xykong on 2014/7/29.
 */

/**
 * The file friendCenter.js Create with WebStorm
 * @Author        gaosi  修改抽象
 * @Email         angus_gaosi@163.com
 * @Date          2014/9/3 1:55:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('../config');
var utils = require('../utils');
var errorCodes = require('../errorCodes');
var util = require('util');
var Q = require('q');
var _ = require('underscore');

/**
 * cluster client 抽象， 主要做对服务器的注册， 保持连接,
 *
 * */

var Handler = function (opts) {
    this.servers = {};
};

var handler = Handler.prototype;

module.exports = Handler;

/**
 * clientCluster初始化方法 对client info 进行设置
 * 初始化信息必须提供 opts = {
 *                               serverUid:
 *                               serverType:
 *                               host:
 *                               port:
 *                               delay: 注册时间间隔
 *                               namespace: 要注册的
 *                          }
 *    额外添加用 addProxyInfo 方法
 * */
handler.InitClient = function (opts) {
    //client 代理信息
    this.proxyInfo = {
        serverUid: opts.serverUid,
        serverType: opts.serverType,
        host: opts.host,
        port: opts.port
    };
    this.delay = 30; //opts.delay | 10; //注册时间间隔
    this.namespace = opts.namespace;
};

/**
 * 设置添加proxyInfo 信息， 为了各个客户端有不同的信息需求
 * @param {string} key 字段信息key
 * @param {object} value 字段信息
 * */
handler.addProxyInfo = function (key, value) {
    this.proxyInfo[key] = value;
};

/**
 * 获取本服的client的ip和post等信息到 Center 注册
 * */
handler.SendRegister = function () {
    var deferred = Q.defer();
    var self = this;

    logger.info('%j Try Register Server %s.%sCluster...', this.proxyInfo, this.namespace, this.proxyInfo.serverType);

    if (!pomelo.app.cluster || !pomelo.app.cluster[this.namespace]
        || !pomelo.app.cluster[this.namespace][this.proxyInfo.serverType + 'Cluster']) {
        logger.error('pomelo.app.cluster.%s.%sCluster not exist!', this.namespace, this.proxyInfo.serverType);
        return Q.reject('pomelo.app.cluster.%s.%sCluster not exist!', this.namespace, this.proxyInfo.serverType);
    }

    var registerServer = Q.nbind(pomelo.app.cluster[this.namespace][this.proxyInfo.serverType + 'Cluster'].Register,
                                 pomelo.app.cluster[this.namespace][this.proxyInfo.serverType + 'Cluster']);

    registerServer(null, null, this.proxyInfo)
        .then(function (data) {
                  logger.info('%s.%sCluster.Register : %j', self.namespace, self.proxyInfo.serverType,
                              data);
                  if (data.result !== 0) {
                      return deferred.reject(errorCodes.SystemCanNotConnect);
                  }
                  return deferred.resolve();
              })
        .catch(function (err) {
                   logger.error('%j Try Register %s Center failed: %s', self.proxyInfo, self.namespace,
                                utils.getErrorMessage(err));
                   return deferred.reject();
               })
        .done();

    return deferred;
};

/**
 * 注册到服务器中心
 * */
handler.RegisterToCenter = function () {

    var self = this;

    logger.info('Register to server %j!', self.proxyInfo);

    Q.resolve()
        .then(function () {
                  return self.SendRegister();
              })
        .then(function (data) {
                  logger.fatal('%sCluster.Register : %j', self.proxyInfo.serverType, util.inspect(data));
              })
        .catch(function (err) {
                   logger.error('%j Register To Center failed: %s', self.proxyInfo, utils.getErrorMessage(err));
               })
        .finally(function () {
                     setInterval(function () {
                         self.SendRegister();
                     }, self.delay * 1000);
                 })
        .done();
};

/**
 * 发送消息到其他服务器
 * @param {number} toUid 发送消息到其他服务器id
 * @param {string} method 调用其他game服fs.lsCluster method 方法
 * @param {object} toMsg 消息封装
 * */
handler.SendMsgToOther = function (toUid, method, toMsg) {
    var deferred = Q.defer();
    var self = this;

    logger.info('%j Try SendMsgToOther %s.%sCluster...', this.proxyInfo, this.namespace, this.proxyInfo.serverType);

    if (!pomelo.app.cluster || !pomelo.app.cluster[this.namespace]
        || !pomelo.app.cluster[this.namespace][this.proxyInfo.serverType + 'Cluster']) {
        logger.error('pomelo.app.cluster.%s.%sCluster not exist!', this.namespace, this.proxyInfo.serverType);
        return Q.reject('pomelo.app.cluster.%s.%sCluster not exist!', this.namespace, this.proxyInfo.serverType);
    }

    var registerServer = Q.nbind(pomelo.app.cluster[this.namespace][this.proxyInfo.serverType
        + 'Cluster'].sendMsgToOhterGame, pomelo.app.cluster[this.namespace][this.proxyInfo.serverType + 'Cluster']);

    registerServer(null, null, toUid, method, toMsg)
        .then(function (data) {
                  logger.info('%s.%sCluster.SendMsgToOther : %j', self.namespace, self.proxyInfo.serverType,
                              data);
                  if (data.result !== 0) {
                      return deferred.reject(errorCodes.SystemCanNotConnect);
                  }
                  return deferred.resolve(data);
              })
        .catch(function (err) {
                   logger.error('%j Try SendMsgToOther %s Center failed: %s', self.proxyInfo, self.namespace,
                                utils.getErrorMessage(err));
                   return deferred.reject(err);
               })
        .done();

    return deferred.promise;
};



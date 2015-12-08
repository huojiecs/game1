/**
 * The file friendCenter.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/9/3 1:55:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('./../tools/errorCodes');
var config = require('./../tools/config');
var ServerCluster = require('./../tools/components/serverCluster.js');
var util = require('util');
var utils = require('../tools/utils');
var Q = require('q');
var _ = require('underscore');


/**
 * ls 服 cluster friendCenter（中心login服）：
 * 1, 功能是实现好友跨服， 发送祝福， 发送邮件（待做）等功能的跨服处理中心
 * 2, 此中心只有大区login服存在
 * 3, 各个游戏服启动后fs服会到此添加服务器注册， 并添加注册服务器的proxyCluster 代理 实现双向通信（原来功能只有单向请求）
 * 4, 各个游戏的fs会添加相应的friendCenter  并对该中心服务定期ping 保持连接的通畅
 * 5, 好友信息分发中心 为形状结构 {client <-> center <-> client}
 * */
var Handler = function (opts) {
    ServerCluster.call(this, opts);
};

util.inherits(Handler, ServerCluster);

module.exports = new Handler();

var handler = Handler.prototype;

/**
 * 中心初始化方法
 * */
handler.Init = function () {

};

/**
 * 发送消息到其他服务器(转发消息)
 * @param {number} serverUid 游戏区服id
 * @param {string} 调用其他服务器的远程方法 method:
 * @param {object} toMsg:{} 发送到其他服务器的消息
 * @param {string} type  module cluster type (可选, 不)
 * */
handler.sendMessageToOtherGame = function(serverUid ,method, toMsg, serverType, callback) {
    var self = this;

    var info = self.servers[serverUid];

    if (!info) {
        return callback(errorCodes.SystemCanNotConnect);
    }

    logger.info('Try Send message to game{%s} method{%s} msg{%j} serverType{%s}...', serverUid, method, toMsg, serverType);

    if (!pomelo.app.cluster || !pomelo.app.cluster.fs
        || !pomelo.app.cluster.fs[serverType + 'Cluster']) {
        logger.error('pomelo.app.cluster.ls.%sCluster not exist!', serverType);
        return callback('pomelo.app.cluster.ls.%sCluster not exist!', serverType);
    }

    var sendMsgToGame = Q.nbind(pomelo.app.cluster.fs[serverType + 'Cluster'][method],
                                 pomelo.app.cluster.fs[serverType + 'Cluster']);

    sendMsgToGame(null, serverUid, toMsg)
        .then(function (data) {
                  logger.info('fs.%sCluster.%s : %j', serverType, method, data);
         /*         if (data.result !== 0) {
                      return callback(errorCodes.SystemCanNotConnect);
                  }*/
                  return callback(null, data);

              })
        .catch(function (err) {
                   logger.error('fs.%sCluster.%s failed: %j', serverType, method,
                                utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};


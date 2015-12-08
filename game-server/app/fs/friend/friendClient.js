/**
 * The file friendCenter.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/9/3 1:55:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../../tools/config');
var utils = require('../../tools/utils');
var errorCodes = require('../../tools/errorCodes');
var ClientCluster = require('../../tools/components/clientCluster.js');
var util = require('util');
var Q = require('q');
var _ = require('underscore');

/**
 * fs 服 friendClient 各服好友客户端
 * 1, 此客户端主要用于保持与服务器的通信, 每10秒会到ls 的friendCenter 中心去注册。
 * 2, 第一次建立连接是服务器会往回注册代理 实现双向通信
 * */

var Handler = function (opts) {
    ClientCluster.call(this, opts);
};

/**
 *
 * */
util.inherits(Handler, ClientCluster);

module.exports = new Handler();

var handler = Handler.prototype;

/**
 * friendClient初始化方法
 * */
handler.Init = function () {
    //加这个是因为 components start 是在lifecycle.js 只后所以要先载入
    // 还不能直接用 pomelo.app.getServersByType('fs') 因为 servers.js fs 用的是内网
    pomelo.app.loadConfigBaseApp('clusters', '/config/clusters.json');
    var serverType = pomelo.app.getServerType();
    var serverId = pomelo.app.getServerId();
    var options = pomelo.app.get('clusters');

    if (!options) {
        return;
    }
    options = options[serverType];
    if (!options) {
        return;
    }
    options = options[serverId];
    if (!options) {
        return;
    }

    if (!options || options.length === 0) {
        return;
    }

    this.InitClient({
                        serverUid: config.list.serverUid,
                        serverType: 'fs',
                        host: options.host,
                        port: options.port,
                        delay: 10,
                        namespace: 'ls'
                    });
    this.RegisterToCenter();
};

/**
 *发送消息到其他游戏服务器，fs.lsCluster 下接口
 * @param {string} serverUid 服务器区服id
 * @param {string} method fs.lsCluster下方法名称
 * @param {object} toMsg 发送消息 封装对象
 * @param {function} callback 回调函数
 * */
handler.sendMsgToOtherGame = function (serverUid, method, toMsg, callback) {
    this.SendMsgToOther(serverUid, method, toMsg)
        .then(function (data) {
                  callback(null, data);
              })
        .catch(function (err) {
                   callback(err);
               })
        .done();
};

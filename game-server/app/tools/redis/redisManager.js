/**
 * The file redisManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/17 17:03:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var redis = require("redis");
var config = require('../../tools/config');
var utils = require('../../tools/utils');
var chartSql = require('../../tools/mysql/chartSql');
var Client = require('./client');

var _ = require('underscore');
var Q = require('q');

var Handler = function () {
    var self = this;

    /**客户端连接*/
    this.clientMap = {};

    self.chartBlackMap = {};
    return Q.ninvoke(chartSql, 'ChartLoadBlackList')
        .then(function (roleList) {
                  _.each(roleList, function (info) {
                      self.chartBlackMap[info.roleID] = true;
                  });
              });
};

var handler = Handler.prototype;

module.exports = Handler;

/**
 * 添加client连接
 * */
handler.addClient = function (type, host, port, options) {
    this.clientMap[type] = new Client(host, port, options, this);
};

/**
 * 获取连接
 * */
handler.getClient = function (type) {
    return this.clientMap[type];
};

/**
 * 是否在黑名单
 * */
handler.IsInBlackList = function (roleID) {
    return _.has(this.chartBlackMap, roleID);
};

/**
 * 每个服需要添加 remote
 * */
handler.AddBlackList = function (roleID) {
    this.chartBlackMap[roleID] = true;
};

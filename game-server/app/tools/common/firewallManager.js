/**
 * The file firewallManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/12 23:18:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../config');

var DEFAULT_INTERVAL = config.filter.defaultFirewall || 0;

/**
 * 路由时间间隔
 * */
var ROUTE_FIREWALL_MAP = config.filter.firewall || {};

var Handler = function () {

    /** 防火墙map */
    this.firewallMaps = {};
};

var pro = Handler.prototype;

module.exports = new Handler();

/**
 * Destroy task group
 *
 * @param  {String} key   task key
 * @param  {Boolean} force whether close task group directly
 */
pro.deleteMap = function (key) {
    if (!this.firewallMaps[key]) {
        return;
    }

    delete this.firewallMaps[key];
};

/***
 * 检查前端请求是否过于密集
 * @param {Object} session 玩家session
 * @param {String} route
 * @return {Boolean}
 * */
pro.checkRequestTime = function(sessionID, route) {

    if (!ROUTE_FIREWALL_MAP[route]) {
        return true;
    }

    /** 获取防火墙*/
    var firewallMap = this.firewallMaps[sessionID];
    /** 当前时间*/
    var now = new Date().getTime();

    /** 没有初始化 防火墙 map */
    if (null == firewallMap) {
        firewallMap = {};
        this.firewallMaps[sessionID] = firewallMap;
        this.firewallMaps[sessionID][route] = buildFirewall(now);
        return true;
    }

    /** 初始化 该路由 */
    var firewall = firewallMap[route];
    if (null == firewall)  {
        firewallMap[route] = buildFirewall(now);
        return true;
    }

    /** 判断是否过快 消息*/
    if ((now - firewall.lastTime) > (ROUTE_FIREWALL_MAP[route] || DEFAULT_INTERVAL)) {
        firewall.lastTime = now;
        return true;
    } else {
        return false;
    }
};

/**
 * build default firewall message
 * @return {Object}
 * */
var buildFirewall = function(now) {
    return  {
        lastTime: now
    };
};

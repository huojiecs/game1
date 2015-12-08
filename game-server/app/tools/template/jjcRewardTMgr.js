/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/6/17
 * To change this template use File | Setting |File Template
 */

/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com  idea from liufeng
 * @Date          2015/6/12
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('pomelo/lib/util/utils');
var templateManager = require('../templateManager');

/**
 * 单区排行榜奖励模板管理器
 * */
var Handler = module.exports = {};
var templateName = "SyncPVPRewardTemplate";

Handler.Init = function(){

    var temps = templateManager.GetAllTemplate(templateName);
    if(!temps){
        return;
    }

    this.BuildData(temps);
};

Handler.Initialized = function(){
    var templates = templateManager.GetAllTemplate(templateName);
    return templates && templates.enhenced;
};

/**
 * @Brief: 根据id获取数据
 *
 * @param {String} templateID 模板id
 * @return {Object}
 * */
Handler.GetTemplateByID = function(templateID){
    return templateManager.GetTemplateByID(templateName, templateID);
};

/**
 * @Brief 创建数据
 *
 * @Param {Object} temps 模板数据
 * */
Handler.BuildData = function(temps) {
    temps.enhenced = true;
    this.temps = temps;
    this.typeMap = {};
    this.typeListMap = {};

    for (var attID in temps) {
        var temp = temps[attID];
        var time = temp['time'];
        if (!this.typeMap[time]) {
            this.typeMap[time] = {};
        }
        if (!this.typeListMap[time]) {
            this.typeListMap[time] = [];
        }


        this.typeMap[time][attID] = temp;
        this.typeListMap[time].push(temp);
    }
};

/**
 * @Brief: 根据积分获取模板
 *
 * @param {Number} credits 玩家积分
 * @param {Number} type
 * @return {Object}
 * @api public
 * */
Handler.GetTempByRank = function (credits, type) {

    if(!this.Initialized()) {
        this.Init();
    }

    var temps = this.typeMap[type] || this.typeMap[0];
    for (var id in temps) {
        var temp = temps[id];
        if (credits >= temp['minLevel'] && credits <= temp['maxLevel']) {
            return temp;
        }
    }
    return null;
};

/**
 * @Brief: 根据积分获当期数据模板
 *
 * @param {Number} type
 * @return {Object}
 * @api public
 * */
Handler.GetTempsByType = function (type) {

    if(!this.Initialized()) {
        this.Init();
    }

    return this.typeListMap[type] || this.typeListMap[0];
};
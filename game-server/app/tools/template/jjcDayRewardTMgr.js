/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/6/24
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('pomelo/lib/util/utils');
var templateManager = require('../templateManager');

/**
 * 每日排行榜奖励模板管理器
 * */
var Handler = module.exports = {};
var templateName = "SyncPVPDayRewardTemplate";

Handler.Init = function () {

    var temps = templateManager.GetAllTemplate(templateName);
    if (!temps) {
        return;
    }

    this.BuildData(temps);
};

Handler.Initialized = function () {
    var templates = templateManager.GetAllTemplate(templateName);
    return templates && templates.enhenced;
};

/**
 * @Brief: 根据id获取数据
 *
 * @param {String} templateID 模板id
 * @return {Object}
 * */
Handler.GetTemplateByID = function (templateID) {
    return templateManager.GetTemplateByID(templateName, templateID);
};

/**
 * @Brief 创建数据
 *
 * @Param {Object} temps 模板数据
 * */
Handler.BuildData = function (temps) {
    temps.enhenced = true;
    this.temps = temps;
};

/**
 * @Brief: 根据积分获取模板
 *
 * @param {Number} credits 玩家积分
 * @return {Object}
 * @api public
 * */
Handler.GetTempByCredits = function (credits) {

    if (!this.Initialized()) {
        this.Init();
    }

    var template = null;

    var temps = this.temps;
    for (var id in temps) {
        var temp = temps[id];
        if (credits >= temp['limitMedal']) {
            if (!template) {
                template = temp;
            } else if (!!template && temp['limitMedal'] >= template['limitMedal']) {
                template = temp;
            }
        }
    }
    return template;
};
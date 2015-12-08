/**
 * The file aresTempMgr.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/8 20:22:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('pomelo/lib/util/utils');

var Handler = module.exports = {};

/** 实时奖励*/
Handler.REAL_TIME_TYPE = 0;
/** 历史最高奖励*/
Handler.HISTORY_TYPE = 1;

/**
 * 战神榜template数据特殊处理管理器
 * */
Handler.Init = function () {

    /** 类型map <type, <id, ares>>*/
    this.typeMap = {};
    /** 是否初始化 标示*/
    this.initalized = true;
};


/**
 * 加载数据
 *
 * @param {String} fileName json 文件名称
 * @param {Object} data  template 数据
 * @api public
 * */
Handler.Load = function (fileName, data) {

    if (!this.initalized) {
        this.Init();
    }

    var typeMap = this.typeMap;
    for (var id in data) {
        var temp = data[id];
        if (!typeMap[temp.Type]) {
            typeMap[temp.Type] = {};
        }
        typeMap[temp.Type][id] = temp;
    }
};

/**
 * 数据重加载 主要用于热更新
 *
 * @param {String} fileName json 文件名称
 * @param {Object} data  template 数据
 * @api public
 * */
Handler.Reload = function (filename, data) {

    logger.warn('reload ares template data！！！');
    this.Load(filename, data);
};

/**
 * 根据类型和id 获取template 数据
 *
 * @param {Number} type 数据类型
 * @param {String} templateID 数据id
 * @return {Object}
 */
Handler.GetTemplateByID = function (type, templateID) {

    if (this.typeMap[type]) {
        return this.typeMap[type][templateID];
    }
    return null;
};

/**
 * 根据类型获取所有数据
 *
 * @param {Number} type 数据类型
 * @
 * */
Handler.GetAllTemplate = function (type) {
    return this.typeMap[type];
};

/**
 * 根据排行获取对应数据
 *
 * @param {Number} type 数据类型
 * @param {Number} rank 玩家排名
 * @api public
 * */
Handler.getDataByRank = function (type, rank) {
    var ares = null;
    if (!!this.typeMap[type]) {
        var map = this.typeMap[type];
        for (var id in  map) {
            var temp = map[id];
            if (rank >= temp.minLevel && rank <= temp.maxLevel) {
                ares = temp;
                break;
            }
        }
    }
    return ares;
};

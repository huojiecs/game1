/**
 * Created by Administrator on 2015/1/9.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(__filename);
var utils = require('pomelo/lib/util/utils');

var Handler = module.exports = {};

/**
 * 邪神竞技场 template数据特殊处理管理器
 * */
Handler.Init = function () {

    /** 类型map <id, soulPvp>*/
    this.dataMap = {};
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

    var dataMap = this.dataMap;
    for (var id in data) {
        var temp = data[id];
        dataMap[id] = temp;
    }
};

/**
 * 数据重加载 主要用于热更新
 *
 * @param {String} filename json 文件名称
 * @param {Object} data  template 数据
 * @api public
 * */
Handler.Reload = function (filename, data) {

    logger.warn('reload soul pvp template data！！！');
    this.Load(filename, data);
};

/**
 * 根据类型和id 获取template 数据
 *
 * @param {String} templateID 数据id
 * @return {Object}
 */
Handler.GetTemplateByID = function (templateID) {

   return this.dataMap[templateID];
};


/**
 * 根据排行获取对应数据
 *
 * @param {Number} rank 玩家排名
 * @api public
 * */
Handler.getDataByRank = function (rank) {
    var soulPvp = null;
    if (!!this.dataMap) {
        var map = this.dataMap;
        for (var id in  map) {
            var temp = map[id];
            if (rank >= temp.minLevel && rank <= temp.maxLevel) {
                soulPvp = temp;
                break;
            }
        }
    }
    return soulPvp;
};

/**
 * 根据排行获取对应数据
 *
 * @api public
 * */
Handler.GetAllTemplate = function () {
    return this.dataMap;
};


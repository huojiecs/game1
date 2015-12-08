/**
 * The file roleTitleManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/27 21:21:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');

var ePlayerInfo = gameConst.ePlayerInfo;
var eTitleInfo = gameConst.eTitleInfo;
var eTitleStats = gameConst.eTitleStats;
var eAttLevel = gameConst.eAttLevel;
var ePlayerEventType = gameConst.ePlayerEventType;
var ePlayerDB = gameConst.ePlayerDB;
var eAttInfo = gameConst.eAttInfo;

var _ = require('underscore');
var Q = require('q');

var MAX_ATT = eAttInfo.MAX;

/**
 * 玩家号称管理器
 * */
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /** 号称状态列表*/
    this.titles = {};
};

var handler = Handler.prototype;

/**
 * add check event
 * @api private
 * */
var addCheckEvent = function (owner, manager) {
    for (var key in manager.titles) {
        if (manager.titles[key][eTitleInfo.STATS] == eTitleStats.NO) {
            owner.on(ePlayerEventType.CollectTitle, function () {
                owner.GetRoleTitleManager().checkTitleStats(true);
            });
            break;
        }
    }
};

/**
 * 玩家财产添加号称碎片时，检查号称是否达到开启条件并开启
 * @api public
 */
handler.checkTitleStats = function (isSend) {
    var owner = this.owner;
    var computeFlag = false;

    for (var id in this.titles) {
        var temp = this.titles[id];
        if (!!temp && temp[eTitleInfo.STATS] == eTitleStats.NO) {
            var template = getTemplateById(temp[eTitleInfo.TITLEID]);
            if (!!template) {
                var value = owner.assetsManager.GetAssetsValue(template.assetsID);
                if (!!value && value >= template.assetsNum) {
                    logger.info('set role: %d title %s stats to 1 with value: %d', owner.id, template.suiPianID,
                                value);
                    this.SetTitleValue(id, 1);

                    //公告
                    var noticeID = "title_" + id;
                    this.owner.GetNoticeManager().SendRepeatableGM(gameConst.eGmType.Title, noticeID);

                    computeFlag = true;
                }
            }
        }
    }
    if (computeFlag) {
        this.computeAttAndZhanli(isSend);
    }
};

/**
 * 属性战力重算
 * @api public
 */
handler.computeAttAndZhanli = function (isSend) {
    /** 属性管理器*/
    var attManager = this.owner.attManager;
    /** 获取原来战力 */
    var oldZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_TITLE);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    /**清除原来套装属性加成*/
    attManager.clearLevelAtt(eAttLevel.ATTLEVEL_TITLE, MAX_ATT);
    attManager.clearZhanli(eAttLevel.ATTLEVEL_TITLE);
    for (var key in this.titles) {
        var temp = this.titles[key];
        if (temp[eTitleInfo.STATS] != eTitleStats.NO) {
            var template = getTemplateById(temp[eTitleInfo.TITLEID]);
            if (!!template) {
                //添加套装属性 和战力
                addTitleAtt(template, attManager);
            }
        }
    }

    /** 重算玩家所有属性*/
    attManager.UpdateAtt();
    /** 重算玩家号称战力*/
//    attManager.computeZhanli(eAttLevel.ATTLEVEL_TITLE, MAX_ATT);
    /** 重新获取战力*/
    var newZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_TITLE);
    /**发布战力更新*/
    this.owner.UpdateZhanli(Math.floor((newZhanli - oldZhanli)), (newZhanli - oldZhanli) > 0 ? true : false, isSend);
    /**通知客户属性变更*/
    this.owner.attManager.SendAttMsg(null);
};

/**
 * 添加一个号称属性
 * @param {Object} template  号称模板数据
 * @param {Object} attManager  玩家属性管理器
 * @api private
 * @return {number} 状态： 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
 */
var addTitleAtt = function (template, attManager) {
    var attID = template.attributesID;
    var attNum = template.attributesNum;
    var zhanli = template.zhanLi;
    /**添加属性*/
    attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_TITLE, attID, attNum);
    /** 添加假战力*/
    attManager.addZhanli(eAttLevel.ATTLEVEL_TITLE, zhanli);
};

/**
 * @Brief: 添加新号称， 增量添加
 * ---------------------------
 *
 *
 * @param {number} roleID 玩家id
 * @param {Object} suits 时装id
 * @api private
 * */
var addNewSuitData = function (roleID, suits) {


    /** 新增时装 兼容 处理*/
    var ids = gettitleTemplateIds();
    if (ids.length <= _.size(suits)) {
        return ;
    }

    for (var id in ids) {
        if (!suits[ids[id]]) {
            suits[ids[id]] = [roleID, ids[id], 0];
        }
    }
    return suits;
};

/**
 * 获取号称状态
 * @param {string} suitID 号称ID
 * @api public
 * @return {number} 状态： 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
 */
handler.GetTitleValue = function (suitID) {
    return this.titles[suitID][eTitleInfo.STATS];
};

/**
 * 设置号称状态
 * @param {string} suitID 号称ID
 * @param {number} stats 号称stats 状态： 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
 * @api public
 */
handler.SetTitleValue = function (suitID, stats) {
    this.titles[suitID][eTitleInfo.STATS] = stats;
};

/**
 * 重数据库加载数据：1, 如果数据为空， 初始化数据
 *                  2, 否， 则赋值给 titles
 *
 * */
handler.LoadDataByDB = function (titleInfo) {
    var self = this;
    if (null == titleInfo || titleInfo.length == 0) {
        this.titles = initSuitData(this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        /**号称 初始化 添加模板数据*/
        this.owner.addDirtyTemplate(ePlayerDB.Title, this.GetSqlStr());
        this.checkTitleStats(false);
    } else {
        _.each(titleInfo, function (title) {
            self.titles[title[eTitleInfo.TITLEID]] = title;
        });

        /** 新增时装 兼容 处理*/
        addNewSuitData(this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), this.titles);

        /**登陆战力计算*/
        this.computeAttAndZhanli(false);
    }

    //添加事件监听
    addCheckEvent(this.owner, this);
};

/**
 * 初始化套装状态数据
 * @param {number} roleID 玩家id
 * @api private
 * @param {Array} 玩家初始化号称列表
 * */
var initSuitData = function (roleID) {
    var ids = gettitleTemplateIds();
    var titles = {};
    for (var id in ids) {
        titles[ids[id]] = [roleID, ids[id], 0];
    }
    return titles;
};

/**
 * 获取号称套装 id列表
 * @api private
 * @return {Array} id列表数据
 * */
var gettitleTemplateIds = function () {
    var titleTemplates = templateManager.GetAllTemplate('TiTleTemplate');
    if (null == titleTemplates) {
        logger.error('title templates: {titleTemplate all} not exists error !!!!');
        return [];
    }
    return _.keys(titleTemplates).sort();
};

/**
 * get tempate with attID
 * @param {string} attrID  号称模板id
 * @api private
 * @return {object}
 * */
var getTemplateById = function (attID) {
    var titleTemplates = templateManager.GetAllTemplate('TiTleTemplate');
    if (null == titleTemplates) {
        logger.error('title templates: {titleTemplate all} not exists error !!!!');
        return null;
    }
    var template = titleTemplates[attID];
    if (null == template) {
        logger.error('title template: { id -> %d } not exists error !!!!', attID);
        return null;
    }
    return template;
};

/**
 * 使用号称
 * @param {string} attID 号称id
 * @api public
 * @return {number}
 * */
handler.Activate = function (attID) {
    var template = getTemplateById(attID);
    if (null == template) {
        return errorCodes.SystemWrong;
    }
    if (this.GetTitleValue(attID) == 0) {
        return errorCodes.Suit_NoActivate;
    }
    this.owner.SetPlayerInfo(gameConst.ePlayerInfo.titleID, attID);
    return 0;
};

/**
 * 隐藏号称
 * @param {string} attID 号称id
 * @api public
 * @return {number}
 * */
handler.UnActivate = function (attID) {
    var template = getTemplateById(attID);
    if (null == template) {
        return errorCodes.SystemWrong;
    }
    if (this.GetTitleValue(attID) == 0) {
        return errorCodes.Suit_NoActivate;
    }
    this.owner.SetPlayerInfo(gameConst.ePlayerInfo.titleID, 0);
    return 0;
};

/**
 * 获取存储字符串
 * @return {string}
 */
handler.GetSqlStr = function () {
    var rows = [];

    var titleInfo = '';
    for (var index in this.titles) {
        var temp = this.titles[index];

        titleInfo += '(';
        var row = [];

        for (var i = 0; i < eTitleInfo.MAX; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                titleInfo += '\'' + value + '\'' + ',';
            }
            else {
                titleInfo += value + ',';
            }

            row.push(value);
        }
        titleInfo = titleInfo.substring(0, titleInfo.length - 1);
        titleInfo += '),';

        rows.push(row);
    }
    titleInfo = titleInfo.substring(0, titleInfo.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== titleInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, titleInfo);
    }
    return sqlString;
};

/**
 * Brief: 玩家销毁事件
 *  1, 添加销毁事件, 防止泄露
 * ------------------------
 * @api private
 *
 * */
handler.destroy = function () {
    this.titles = null;
    if (!!this.owner) {
        this.owner.removeAllListeners(ePlayerEventType.CollectTitle);
    }
    this.owner = null;
};


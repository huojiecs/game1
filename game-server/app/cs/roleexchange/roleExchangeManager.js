/**
 * The file roleExchangeManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/15 13:27:00
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
var exchangeTMgr = require('../../tools/template/exchangeTMgr');
var redisManager = require('../chartRedis/redisManager');

var ePlayerInfo = gameConst.ePlayerInfo;
var tExchange = templateConst.tExchange;
var eExchangeInfo = gameConst.eExchangeInfo;
var eRedisClientType = gameConst.eRedisClientType;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;

var _ = require('underscore');
var Q = require('q');

/**
 * 玩家兑换 管理
 * */
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /** 玩家兑换状态列表*/
    this.exchanges = {};
};

var handler = Handler.prototype;

/**
 * Brief: 获取兑换 信息
 * -------------------
 * @api public
 *
 * @param {String} exchangeID 兑换ID
 * @api public
 * @return {Object}
 */
handler.GetExchangeInfo = function (exchangeID) {
    return this.exchanges[exchangeID];
};

/**
 * Brief: 添加 玩家信息
 * -------------------
 * @api public
 *
 * @param {String} exchangeID 兑换ID
 * @param {Object} value 兑换信息
 * @api public
 */
handler.SetExchangeInfo = function (exchangeID, value) {
    this.exchanges[exchangeID] = value;
};

/**
 * Brief: 重数据库加载数据：1, 如果数据为空， 初始化数据
 *                  2, 否， 则赋值给
 * --------------------------------------------------
 * @api public
 *
 * */
handler.LoadDataByDB = function (exchangeInfo) {
    var self = this;
    if (null != exchangeInfo && exchangeInfo.length > 0) {
        _.each(exchangeInfo, function (exchange) {
            self.exchanges[exchange[eExchangeInfo.EXCHANGE_ID]] = exchange;
        });
    }
};

/**
 * Brief: 获取存储字符串
 * --------------------
 * @api public
 *
 * @return {String}
 */
handler.GetSqlStr = function () {
    var rows = [];

    var exchangeInfo = '';
    for (var index in this.exchanges) {
        var temp = this.exchanges[index];

        exchangeInfo += '(';
        var row = [];

        for (var i = 0; i < eExchangeInfo.MAX; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                exchangeInfo += '\'' + value + '\'' + ',';
            }
            else {
                exchangeInfo += value + ',';
            }

            row.push(value);
        }
        exchangeInfo = exchangeInfo.substring(0, exchangeInfo.length - 1);
        exchangeInfo += '),';

        rows.push(row);
    }
    exchangeInfo = exchangeInfo.substring(0, exchangeInfo.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== exchangeInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, exchangeInfo);
    }
    return sqlString;
};

/**
 * Brief: 根据类型获取 兑换剩余情况
 * ------------------------------
 * @api public
 *
 * @param {Number} type 获取查看的类型
 * @param {Function} callback 回调函数
 * @return
 * */
handler.requestLeftList = function (type, callback) {
    var self = this;

    var exchangeTemplates = exchangeTMgr.GetAllTemplate(type);
    if (!exchangeTemplates) {
        return callback(errorCodes.NoTemplate);
    }

    var items = [];

    for (var i in exchangeTemplates) {

        var temp = exchangeTemplates[i];
        var buyLeft = exchangeLeft(self.exchanges, temp[tExchange.exchangeId], temp[tExchange.buyMax]);

        items.push({
                       "exchangeID": temp[tExchange.exchangeId],
                       "itemId": temp[tExchange.itemId],
                       "itemCount": temp[tExchange.itemCount],
                       "type": temp[tExchange.type],
                       "rank": temp[tExchange.rank],
                       "number": temp[tExchange.number],
                       "buyMax": temp[tExchange.buyMax],
                       "buyLeft": buyLeft
                   }
        );
    }

    return callback(null, {'leftList': items});
};

/**
 * Brief: 获取剩余次数
 * ------------------
 * @api private
 *
 * @param {Object} exchangeList 兑换列表
 * @param {Number} exchangeID 兑换id
 * @param {Number} maxBuy 最大购买次数
 * @return {Number} 剩余次数
 * */
var exchangeLeft = function (exchangeList, exchangeID, maxBuy) {
    var exchangeData = exchangeList[exchangeID];
    if (!exchangeData) {
        return maxBuy;
    }

    /** 检查 重置次数*/
    if (!utils.isTheSameDay(utils.getCurTime(), utils.minuteToSec(exchangeData[eExchangeInfo.LAST_EXCHANGE_TIME]))) {
        exchangeData[eExchangeInfo.EXCHANGE_TIMES] = 0;
        exchangeData[eExchangeInfo.LAST_EXCHANGE_TIME] = utils.getCurMinute();
    }
    return maxBuy - exchangeData[eExchangeInfo.EXCHANGE_TIMES];
};

/**
 * Brief: 物品兑换
 * ------------------------------
 * @api public
 *
 * @param {Number} type 获取查看的类型
 * @param {Number}  exchangeID 兑换类型
 * @param {Function} callback 回调函数
 * */
handler.exchangeGood = function(type, exchangeID, callback) {
    var temp = exchangeTMgr.GetTemplateByID(type, exchangeID);
    if (!temp) {
        return callback(errorCodes.NoTemplate);
    }

    /** 战神榜兑换*/
    if (exchangeTMgr.EXCHANGE_ARES_TYPE == type) {
        return this.aresExchangeGood(type, exchangeID, callback);
    }

    return callback(errorCodes.ParameterWrong);
};

/**
 * Brief: 根据类型获取 兑换剩余情况
 * ------------------------------
 * @api public
 *
 * @param {Number} type 获取查看的类型
 * @param {String}  exchangeID 兑换类型
 * @param {Function} callback 回调函数
 * @return
 * */
handler.aresExchangeGood = function (type, exchangeID, callback) {
    var self = this;

    var temp = exchangeTMgr.GetTemplateByID(type, exchangeID);
    if (!temp) {
        return callback(errorCodes.NoTemplate);
    }

    var buyLeft = exchangeLeft(self.exchanges, temp[tExchange.exchangeId], temp[tExchange.buyMax]);

    if (buyLeft <= 0) {
        // 30009 -> 您的兑换次数已用完
        return callback(errorCodes.ARES_EXCHANGE_USE_UP);
    }

    var client = redisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);
    var hGet = Q.nbind(client.hget, client);
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var owner = this.owner;
    var self = this;

    var jobs = [
        zRank(redisManager.getAresSetName(), roleID),
        hGet(redisManager.getAresInfoSetName(), roleID)
    ];

    Q.all(jobs)
        .then(function (datas) {
                  /** 数据不存在*/
                  if (!datas || null == datas[0] || !datas[1]) {
                      return callback(errorCodes.ARES_EXCHANGE_USE_UP);
                  }
                  var rank = (datas[0] || 0) + 1;
                  var aresInfo = JSON.parse(datas[1]);
                  /** 排名 是否到达*/
                  if (0 != temp[tExchange.rank] && rank > temp[tExchange.rank]) {
                      // 30010 -> 兑换需要的战神榜排名不足。
                      return callback(errorCodes.ARES_EXCHANGE_RANK_LIMIT);
                  }

                  /** 需要勋章是否充足*/
                  if (aresInfo.totalMedal < temp[tExchange.number]) {
                      // 30011 -> 兑换需要的勋章不足
                      return callback(errorCodes.ARES_EXCHANGE_MADEL_LIMIT);
                  }

                  pomelo.app.rpc.pvp.pvpRemote.deductMedal(null, roleID, temp[tExchange.number], function (err, res) {
                      if (!!err) {
                          return callback(errorCodes.toClientCode(err));
                      }
                      /** 检查 原本是否存在该兑换数据， 没有添加*/
                      if (!self.exchanges[temp[tExchange.exchangeId]]) {
                          self.exchanges[temp[tExchange.exchangeId]] =
                          buildExchangeData(roleID, temp[tExchange.exchangeId], exchangeTMgr.EXCHANGE_ARES_TYPE);
                      }
                      self.useExchangeTimes(temp[tExchange.exchangeId]);
                      owner.AddItem(temp[tExchange.itemId], temp[tExchange.itemCount], eAssetsAdd.AresMedalExchange, 0);

                      /** 兑换成功 */
                      return callback(null, {
                          exchangeID: exchangeID,
                          buyLeft: exchangeLeft(self.exchanges, exchangeID, temp[tExchange.buyMax]),
                          totalMedal: res.totalMedal
                      });
                  });

              })
        .catch(function (err) {
                   return callback(errorCodes.toClientCode(err));
               })
        .done();

};

/**
 * Brief: 使用兑换次数购买
 * ------------------
 * @api private
 *
 * @param {String} exchangeID 兑换id
 * @return {Boolean} 是否成功
 * */
handler.useExchangeTimes = function (exchangeID) {
    var exchangeData = this.GetExchangeInfo(exchangeID);
    if (!exchangeData) {
        return false;
    }

    exchangeData[eExchangeInfo.EXCHANGE_TIMES] = exchangeData[eExchangeInfo.EXCHANGE_TIMES] + 1;
    this.SetExchangeInfo(exchangeID, exchangeData);

    return true;
};

/**
 * Brief: 创建没有相关兑换数据 时 build玩家兑换数据
 * ------------------
 * @api private
 *
 * @param {Number} roleID 玩家ID
 * @param {String} exchangeID 兑换id
 * @param {Number} type 类型
 * @return {Array} 新建的兑换数据
 * */
var buildExchangeData = function (roleID, exchangeID, type) {
    var exchangeData = new Array(eExchangeInfo.MAX);

    exchangeData[eExchangeInfo.ROLE_ID] = roleID;
    exchangeData[eExchangeInfo.EXCHANGE_ID] = exchangeID;
    exchangeData[eExchangeInfo.TYPE] = type;
    exchangeData[eExchangeInfo.EXCHANGE_TIMES] = 0;
    exchangeData[eExchangeInfo.LAST_EXCHANGE_TIME] = utils.getCurMinute();

    return exchangeData;
};
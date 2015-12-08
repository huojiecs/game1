/**
 * The file roleAresLogLogManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/11 23:09:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var utilSql = require('../../../tools/mysql/utilSql');
var pvpSql = require('../../../tools/mysql/pvpSql');
var aresFactory = require('../../ares/aresFactory');
var pvpRedisManager = require('../../redis/pvpRedisManager');

var _ = require('underscore');
var Q = require('q');

var ePlayerInfo = gameConst.ePlayerInfo;
var eRedisClientType = gameConst.eRedisClientType;
var eAresLogInfo = gameConst.eAresLogInfo;

/** 玩家英雄榜 表名*/
var ARES_LOG_TABLE = 'areslog';
/** 日志 长度*/
var ARES_LOG_LONG = 10;

/**
 * 玩家英雄榜 异步pvp（类斩魂） 管理器
 * */
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /** 玩家竞技场消息*/
    this.aresLog = [];
    /** 数据标识位*/
    this.dirty = false;
};

var handler = Handler.prototype;

/**
 * 初始化方法
 *
 * @return {Object} promise
 * @api public
 */
handler.Init = function (owner) {
    var deferred = Q.defer();
    var self = this;

    /**加载数据*/
    this.LoadDataByDB(function (data) {
        /** 如果数据为空则初始化数据*/
        //self.aresLog = data || [];
        if (!!data || data.length > 0) {
            data.sort(function (a, b) {
                return a[eAresLogInfo.CREATE_TIME] > b[eAresLogInfo.CREATE_TIME];
            });
            for (var i in data) {
                self.addAresLogInfo(data[i], false);
            }

            /** 登录 发送 客户端*/
            self.sendMessageToClient();
        }
        //self.dirty = true;

        /*  self.redisToData()
         .finally(function () {
         return deferred.resolve(owner);
         });*/
        return deferred.resolve(owner);
    });

    return deferred.promise;
};

/**
 * Brief: 玩家销毁事件
 *  1, 添加销毁事件, 防止泄露
 * -------------------------
 * @api private
 *
 * */
handler.destroy = function () {
    this.aresLog = null;
    this.owner = null;
};

/**
 * 非在线玩家日志 先存在redis 上线前需要 还原
 *
 * */
handler.redisToData = function () {
    var deferred = Q.defer();
    var self = this;
    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    var hGet = Q.nbind(client.hget, client);
    var zRem = Q.nbind(client.zRem, client);

    hGet(pvpRedisManager.getAresLogInfoSetName(), this.owner.getID())
        .then(function (data) {
                  if (!data) {
                      return deferred.resolve();
                  }
                  data = JSON.parse(data);

                  for (var id in data) {
                      var temp = data[id];
                      self.addAresLogInfo(aresFactory.buildLogToSql(temp), false);
                  }

                  return zRem(pvpRedisManager.getAresLogInfoSetName(), self.owner.getID());
                  //return deferred.resolve();
              })
        .catch(function (err) {
                   logger.error("ares log build to sql error: %s", utils.getErrorMessage(err));
                   return deferred.reject(err);
               })
        .done();

    return deferred.promise;
};

/**
 * 从数据库加载数据：
 *
 * @param {function} cb 回调函数
 * */
handler.LoadDataByDB = function (cb) {
    pvpSql.LoadInfo(ARES_LOG_TABLE, this.owner.getID(), function (err, data) {
        if (!!err) {
            logger.error('ares log player module init error： %s', utils.getErrorMessage(err));
            return cb([]);
        }
        return cb(data);
    });
};

/**
 * 保存数据到数据库
 * */
handler.SaveToDB = function (owner) {
    var self = this;
    var deferred = Q.defer();
    if (!this.dirty) {
        return Q.resolve(owner);
    }
    var roleID = this.owner.getID();
    pvpSql.SaveInfo(ARES_LOG_TABLE, roleID, this.GetSqlStr(), roleID, function (err) {
        if (!!err) {
            logger.error('ares log player module save error： %s', utils.getErrorMessage(err));
        }
        self.dirty = false;
        return deferred.resolve(owner);
    });

    return deferred.promise;
};

/**
 * Brief: 玩家下线 其特殊处理及保存数据到数据库
 * -----------------------------------------
 * @api public
 *
 * @param {Object} owner 管理器所有者
 * */
handler.Down = function (owner) {

    return this.SaveToDB(owner);
};

/**
 * 获取存储字符串
 *
 * @return {String}
 * */
handler.GetSqlStr = function () {
    var rows = [];

    var aresLogInfo = '';
    for (var index in this.aresLog) {
        var temp = this.aresLog[index];

        aresLogInfo += '(';
        var row = [];

        for (var i = 0; i < eAresLogInfo.MAX; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                aresLogInfo += '\'' + value + '\'' + ',';
            }
            else {
                aresLogInfo += value + ',';
            }

            row.push(value);
        }
        aresLogInfo = aresLogInfo.substring(0, aresLogInfo.length - 1);
        aresLogInfo += '),';

        rows.push(row);
    }
    aresLogInfo = aresLogInfo.substring(0, aresLogInfo.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== aresLogInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, aresLogInfo);
    }
    return sqlString;
};

/**
 * 获取 战神榜事件信息
 *
 * @param {Number} index 数据枚举下标
 * @api public
 * */
handler.getAllAresLogInfo = function () {
    return this.aresLog;
};

/**
 * 设置 战神榜信息
 *
 * @param {Array} log 数组数据
 * @api public
 * */
handler.addAresLogInfo = function (log, isSend) {
    this.dirty = true;
    this.aresLog.unshift(log);
    if (this.aresLog.length > ARES_LOG_LONG) {
        this.aresLog.pop();
    }

    if (isSend) {
        this.sendMessageToClient();
    }
};

/**
 * 获取 战神榜事件信息 给前端的
 *
 * @param {Number} index 数据枚举下标
 * @api public
 * */
handler.getAllAresLogShowInfo = function () {
    var tempList = [];
    for (var id in this.aresLog) {
        var temp = aresFactory.buildLogToRedis(this.aresLog[id]);
        temp.context = temp.createTime + "";  // context 字段 现在用于 记录时间
        temp.createTime = utils.getCurMinute() - temp.createTime;
        tempList.push(temp);
    }
    return tempList;
};


/**
 * @Brief: 获取 邪神竞技场事件信息 给前端的
 *-------------------------------------
 *
 * @param {Number} index 数据枚举下标
 * @api public
 * */
handler.sendMessageToClient = function () {

    var route = 'ServerAresLogState';
    var message = {
        logList: this.getAllAresLogShowInfo()
    };

    this.owner.SendMessage(route, message);
};
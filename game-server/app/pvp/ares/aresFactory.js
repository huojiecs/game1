/**
 * The file aresFactory.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/5 20:30:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var aresManager = require('./aresManager');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');

var _ = require('underscore');
var Q = require('q');

var eAresInfo = gameConst.eAresInfo;
var eAresLogInfo = gameConst.eAresLogInfo;

/**
 * ares（战神榜） 工场类
 * */
var factory = module.exports;
factory.init = function () {
};

/** 战神榜类型 -- 玩家*/
factory.ARES_TYPE_ROLE = 0;
/** 战神榜类型 -- 机器人*/
factory.ARES_TYPE_ROBOT = 1;
/** 机器人玩家数据， 基本值 10 0000 0000 */
factory.BASE_ROLE_INDEX = 1000000000;

/**
 * 初始化 玩家数据
 *
 * @param {Object} role 玩家
 * */
factory.createAres = function (role, type, roleName) {
    var ares = new Array(eAresInfo.MAX);
    if (type == factory.ARES_TYPE_ROBOT) { //机器人特殊处理 用排名兑换 战力排名的玩家属性
        ares[eAresInfo.RANK_KEY] = aresManager.getRankID();
        ares[eAresInfo.ROLE_ID] = factory.BASE_ROLE_INDEX + ares[eAresInfo.RANK_KEY];
    } else {
        ares[eAresInfo.ROLE_ID] = role.getID();
        ares[eAresInfo.RANK_KEY] = aresManager.getRankID();
    }

    ares[eAresInfo.MAX_RANK] = 0;                     // 历史最大排名
    ares[eAresInfo.TYPE] = type;          // 类型： 玩家， 机器人（假人）
    ares[eAresInfo.BATTLE_TIMES] = 0;                // 当日战斗次数
    ares[eAresInfo.LAST_BATTLE_TIME] = 0;        //最后战斗时间
    ares[eAresInfo.MEDAL] = 0;               //勋章
    ares[eAresInfo.TOTAL_MEDAL] = 0;                     // 总共获得勋章数
    ares[eAresInfo.SHOP_TIMES] = 0;        // vip购买次数
    ares[eAresInfo.LAST_SHOP_TIME] = utils.getCurMinute();          // 最后购买时间
    ares[eAresInfo.OCCUPY_TIME] = utils.getCurMinute();   // 占领关卡
    ares[eAresInfo.ROLE_NAME] = roleName;   // 角色名称

    return ares;
};

/**
 * 重新build 数据 重redis 结果 变换 为 mysql
 *
 * @param {Object} role 玩家
 * */
factory.buildToSql = function (data) {
    var ares = new Array(eAresInfo.MAX);

    ares[eAresInfo.ROLE_ID] = data.roleID;
    ares[eAresInfo.RANK_KEY] = data.rankKey;
    ares[eAresInfo.MAX_RANK] = data.maxRank;                     // 历史最大排名
    ares[eAresInfo.TYPE] = data.type;          // 类型： 玩家， 机器人（假人）
    ares[eAresInfo.BATTLE_TIMES] = data.battleTimes ;                // 当日战斗次数
    ares[eAresInfo.LAST_BATTLE_TIME] = data.lastBattleTime;        //最后战斗时间
    ares[eAresInfo.MEDAL] = data.medal;               //勋章
    ares[eAresInfo.TOTAL_MEDAL] = data.totalMedal;                     // 总共获得勋章数
    ares[eAresInfo.SHOP_TIMES] = data.shopTimes;        // vip购买次数
    ares[eAresInfo.LAST_SHOP_TIME] = data.lastShopTime;          // 最后购买时间
    ares[eAresInfo.OCCUPY_TIME] = data.occupyTime;   // 占领关卡
    ares[eAresInfo.ROLE_NAME] = data.roleName;   // 占领关卡

    return ares;
};

/**
 * 重新build 数据 重mysql  结果 变换 为 redis
 *
 * @param {Object} role 玩家
 * */
factory.buildToRedis = function (ares) {

    var redisData = {
        'roleID': ares[eAresInfo.ROLE_ID],
        'rankKey': ares[eAresInfo.RANK_KEY],
        'maxRank': ares[eAresInfo.MAX_RANK],
        'type': ares[eAresInfo.TYPE],
        'battleTimes': ares[eAresInfo.BATTLE_TIMES],
        'lastBattleTime': ares[eAresInfo.LAST_BATTLE_TIME],
        'medal': ares[eAresInfo.MEDAL],
        'totalMedal': ares[eAresInfo.TOTAL_MEDAL],
        'lastShopTime': ares[eAresInfo.LAST_SHOP_TIME],
        'shopTimes': ares[eAresInfo.SHOP_TIMES],
        'occupyTime': ares[eAresInfo.OCCUPY_TIME],
        'roleName': ares[eAresInfo.ROLE_NAME]
    };

    return redisData;
};

/**
 * 获取存储字符串
 * */
factory.buildSqlStr = function (temp) {
    var sqlStr = '';
    sqlStr += '(';
    for (var i = 0; i < eAresInfo.MAX; i++) {
        var value = temp[i];

        if (typeof  value == 'string') {
            sqlStr += '\'' + value + '\'' + ',';
        }
        else {
            sqlStr += value + ',';
        }
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
    sqlStr += ')';

    var sqlString = utilSql.BuildSqlValues([temp]);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;
};

/**
 * 重新build 数据 重redis 结果 变换 为 mysql 日志
 *
 * @param {Object} role 玩家
 * */
factory.buildLogToSql = function (data) {
    var ares = new Array(eAresLogInfo.MAX);

    ares[eAresLogInfo.ROLE_ID] = data.roleID;
    ares[eAresLogInfo.TYPE] = data.type;
    ares[eAresLogInfo.RIVAL_ID] = data.rivalID;
    ares[eAresLogInfo.RIVAL_NAME] = data.rivalName;
    ares[eAresLogInfo.CONTEXT] = data.context ;
    ares[eAresLogInfo.CREATE_TIME] = data.createTime;
    ares[eAresLogInfo.CHANGE_RANK] = data.changeRank;
    ares[eAresLogInfo.ZHANLI] = data.zhanli;

    return ares;
};

/**
 * 重新build 数据 重mysql  结果 变换 为 redis 日志
 *
 * @param {Object} role 玩家
 * */
factory.buildLogToRedis = function (aresLog) {

    var redisData = {
        'roleID': aresLog[eAresLogInfo.ROLE_ID],
        'type': aresLog[eAresLogInfo.TYPE],
        'rivalID': aresLog[eAresLogInfo.RIVAL_ID],
        'rivalName': aresLog[eAresLogInfo.RIVAL_NAME],
        'context': aresLog[eAresLogInfo.CONTEXT],
        'createTime': aresLog[eAresLogInfo.CREATE_TIME],
        'changeRank': aresLog[eAresLogInfo.CHANGE_RANK],
        'zhanli': aresLog[eAresLogInfo.ZHANLI]
    };

    return redisData;
};

/**
 * 新建日志
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} type 类型
 * @param {Number} rivalID 对手id
 * @param {String} rivalName 对手名称
 * @param {String} context 文字内容
 * @param {Number} cRank 名次变化
 * @param {Number} zhanli 战力
 * @return {Array}
 * */
factory.createAresLog = function (roleID, type, rivalID, rivalName, context, cRank, zhanli) {
    var ares = new Array(eAresLogInfo.MAX);

    ares[eAresLogInfo.ROLE_ID] = roleID;
    ares[eAresLogInfo.TYPE] = type;
    ares[eAresLogInfo.RIVAL_ID] = rivalID;
    ares[eAresLogInfo.RIVAL_NAME] = rivalName;
    ares[eAresLogInfo.CONTEXT] = context ;
    ares[eAresLogInfo.CREATE_TIME] = utils.getCurMinute();
    ares[eAresLogInfo.CHANGE_RANK] = cRank;
    ares[eAresLogInfo.ZHANLI] = zhanli;

    return ares;
};


/**
 * Created by Administrator on 2015/1/2.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var soulPvpManager = require('./soulPvpManager');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');

var _ = require('underscore');
var Q = require('q');

var eSoulPvpInfo = gameConst.eSoulPvpInfo;
var eSoulPvpLogInfo = gameConst.eSoulPvpLogInfo;

/**
 * soulInfo（战神榜） 工场类
 * */
var factory = module.exports;
    factory.init = function () {
};

/** 战神榜类型 -- 玩家*/
factory.SOUL_PVP_TYPE_ROLE = 0;
/** 战神榜类型 -- 机器人*/
factory.SOUL_PVP_TYPE_ROBOT = 1;
/** 机器人玩家数据， 基本值 10 0000 0000 */
factory.BASE_ROLE_INDEX = 1000000000;

/**
 * 初始化 玩家数据
 *
 * @param {Object} role 玩家
 * */
factory.createSoulInfo = function (role, type, roleName) {
    var soulInfo = new Array(eSoulPvpInfo.MAX);
    if (type == factory.SOUL_PVP_TYPE_ROBOT) { //机器人特殊处理 用排名兑换 战力排名的玩家属性
        soulInfo[eSoulPvpInfo.RANK_KEY] = soulPvpManager.getRankID();
        soulInfo[eSoulPvpInfo.ROLE_ID] = factory.BASE_ROLE_INDEX + soulInfo[eSoulPvpInfo.RANK_KEY];
    } else {
        soulInfo[eSoulPvpInfo.ROLE_ID] = role.getID();
        soulInfo[eSoulPvpInfo.RANK_KEY] = soulPvpManager.getRankID();
    }

    soulInfo[eSoulPvpInfo.MAX_RANK] = 0;                     // 历史最大排名
    soulInfo[eSoulPvpInfo.TYPE] = type;          // 类型： 玩家， 机器人（假人）
    soulInfo[eSoulPvpInfo.BATTLE_TIMES] = 0;                // 当日战斗次数
    soulInfo[eSoulPvpInfo.LAST_BATTLE_TIME] = 0;        //最后战斗时间
    soulInfo[eSoulPvpInfo.MEDAL] = 0;               //勋章
    soulInfo[eSoulPvpInfo.TOTAL_MEDAL] = 0;                     // 总共获得勋章数
    soulInfo[eSoulPvpInfo.SHOP_TIMES] = 0;        // vip购买次数
    soulInfo[eSoulPvpInfo.LAST_SHOP_TIME] = utils.getCurMinute();          // 最后购买时间
    soulInfo[eSoulPvpInfo.OCCUPY_TIME] = utils.getCurMinute();   // 占领关卡
    soulInfo[eSoulPvpInfo.ROLE_NAME] = roleName;   // 角色名称

    soulInfo[eSoulPvpInfo.DEFENSE_1] = 1000;          // 防御1号
    soulInfo[eSoulPvpInfo.DEFENSE_2] = 0;          // 防御2号
    soulInfo[eSoulPvpInfo.DEFENSE_3] = 0;          // 防御3号
    soulInfo[eSoulPvpInfo.ATTACK_1] = 0;   // 进攻1号
    soulInfo[eSoulPvpInfo.ATTACK_2] = 0;   // 进攻2号
    soulInfo[eSoulPvpInfo.ATTACK_3] = 0;   // 进攻3号
    soulInfo[eSoulPvpInfo.CD_TIME] = 0;

    return soulInfo;
};

/**
 * 重新build 数据 重redis 结果 变换 为 mysql
 *
 * @param {Object} role 玩家
 * */
factory.buildToSql = function (data) {
    var soulInfo = new Array(eSoulPvpInfo.MAX);
    soulInfo[eSoulPvpInfo.ROLE_ID] = data.roleID;
    soulInfo[eSoulPvpInfo.RANK_KEY] = data.rankKey;
    soulInfo[eSoulPvpInfo.MAX_RANK] = data.maxRank;                     // 历史最大排名
    soulInfo[eSoulPvpInfo.TYPE] = data.type;          // 类型： 玩家， 机器人（假人）
    soulInfo[eSoulPvpInfo.BATTLE_TIMES] = data.battleTimes ;                // 当日战斗次数
    soulInfo[eSoulPvpInfo.LAST_BATTLE_TIME] = data.lastBattleTime;        //最后战斗时间
    soulInfo[eSoulPvpInfo.MEDAL] = data.medal;               //勋章
    soulInfo[eSoulPvpInfo.TOTAL_MEDAL] = data.totalMedal;                     // 总共获得勋章数
    soulInfo[eSoulPvpInfo.SHOP_TIMES] = data.shopTimes;        // vip购买次数
    soulInfo[eSoulPvpInfo.LAST_SHOP_TIME] = data.lastShopTime;          // 最后购买时间
    soulInfo[eSoulPvpInfo.OCCUPY_TIME] = data.occupyTime;   // 占领关卡
    soulInfo[eSoulPvpInfo.ROLE_NAME] = data.roleName;   // 占领关卡

    soulInfo[eSoulPvpInfo.DEFENSE_1] = data.defense1;          // 防御1号
    soulInfo[eSoulPvpInfo.DEFENSE_2] = data.defense2;          // 防御2号
    soulInfo[eSoulPvpInfo.DEFENSE_3] = data.defense3;          // 防御3号
    soulInfo[eSoulPvpInfo.ATTACK_1] = data.battle1;   // 进攻1号
    soulInfo[eSoulPvpInfo.ATTACK_2] = data.battle2;   // 进攻2号
    soulInfo[eSoulPvpInfo.ATTACK_3] = data.battle3;   // 进攻3号

    soulInfo[eSoulPvpInfo.CD_TIME] = data.cdTime;     //战斗 cd时间

    return soulInfo;
};

/**
 * 重新build 数据 重mysql  结果 变换 为 redis
 *
 * @param {Object} role 玩家
 * */
factory.buildToRedis = function (soulInfo) {

    var redisData = {
        'roleID': soulInfo[eSoulPvpInfo.ROLE_ID],
        'rankKey': soulInfo[eSoulPvpInfo.RANK_KEY],
        'maxRank': soulInfo[eSoulPvpInfo.MAX_RANK],
        'type': soulInfo[eSoulPvpInfo.TYPE],
        'battleTimes': soulInfo[eSoulPvpInfo.BATTLE_TIMES],
        'lastBattleTime': soulInfo[eSoulPvpInfo.LAST_BATTLE_TIME],
        'medal': soulInfo[eSoulPvpInfo.MEDAL],
        'totalMedal': soulInfo[eSoulPvpInfo.TOTAL_MEDAL],
        'lastShopTime': soulInfo[eSoulPvpInfo.LAST_SHOP_TIME],
        'shopTimes': soulInfo[eSoulPvpInfo.SHOP_TIMES],
        'occupyTime': soulInfo[eSoulPvpInfo.OCCUPY_TIME],
        'roleName': soulInfo[eSoulPvpInfo.ROLE_NAME],

        'defense1': soulInfo[eSoulPvpInfo.DEFENSE_1],
        'defense2': soulInfo[eSoulPvpInfo.DEFENSE_2],
        'defense3': soulInfo[eSoulPvpInfo.DEFENSE_3],
        'battle1': soulInfo[eSoulPvpInfo.ATTACK_1],
        'battle2': soulInfo[eSoulPvpInfo.ATTACK_2],
        'battle3': soulInfo[eSoulPvpInfo.ATTACK_3],
        'cdTime': soulInfo[eSoulPvpInfo.CD_TIME]
    };

    return redisData;
};

/**
 * 获取存储字符串
 * */
factory.buildSqlStr = function (temp) {
    var sqlStr = '';
    sqlStr += '(';
    for (var i = 0; i < eSoulPvpInfo.MAX; i++) {
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
    var soulInfo = new Array(eSoulPvpLogInfo.MAX);

    soulInfo[eSoulPvpLogInfo.LOG_ID] = data.logID;
    soulInfo[eSoulPvpLogInfo.ROLE_ID] = data.roleID;
    soulInfo[eSoulPvpLogInfo.TYPE] = data.type;
    soulInfo[eSoulPvpLogInfo.RIVAL_ID] = data.rivalID;
    soulInfo[eSoulPvpLogInfo.RIVAL_NAME] = data.rivalName;
    soulInfo[eSoulPvpLogInfo.CONTEXT] = data.context ;
    soulInfo[eSoulPvpLogInfo.CREATE_TIME] = data.createTime;
    soulInfo[eSoulPvpLogInfo.CHANGE_RANK] = data.changeRank;
    soulInfo[eSoulPvpLogInfo.ZHANLI] = data.zhanli;

    return soulInfo;
};

/**
 * 重新build 数据 重mysql  结果 变换 为 redis 日志
 *
 * @param {Object} role 玩家
 * */
factory.buildLogToRedis = function (soulInfoLog) {

    var redisData = {
        'logID': soulInfoLog[eSoulPvpLogInfo.LOG_ID],
        'roleID': soulInfoLog[eSoulPvpLogInfo.ROLE_ID],
        'type': soulInfoLog[eSoulPvpLogInfo.TYPE],
        'rivalID': soulInfoLog[eSoulPvpLogInfo.RIVAL_ID],
        'rivalName': soulInfoLog[eSoulPvpLogInfo.RIVAL_NAME],
        'context': soulInfoLog[eSoulPvpLogInfo.CONTEXT],
        'createTime': soulInfoLog[eSoulPvpLogInfo.CREATE_TIME],
        'changeRank': soulInfoLog[eSoulPvpLogInfo.CHANGE_RANK],
        'zhanli': soulInfoLog[eSoulPvpLogInfo.ZHANLI]
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
factory.createSoulPvpLog = function (roleID, type, rivalID, rivalName, context, cRank, zhanli) {
    var soulInfo = new Array(eSoulPvpLogInfo.MAX);

    soulInfo[eSoulPvpLogInfo.LOG_ID] = soulPvpManager.getAddLogID();
    soulInfo[eSoulPvpLogInfo.ROLE_ID] = roleID;
    soulInfo[eSoulPvpLogInfo.TYPE] = type;
    soulInfo[eSoulPvpLogInfo.RIVAL_ID] = rivalID;
    soulInfo[eSoulPvpLogInfo.RIVAL_NAME] = rivalName;
    soulInfo[eSoulPvpLogInfo.CONTEXT] = context ;
    soulInfo[eSoulPvpLogInfo.CREATE_TIME] = utils.dateString(utils.getCurTime());
    soulInfo[eSoulPvpLogInfo.CHANGE_RANK] = cRank;
    soulInfo[eSoulPvpLogInfo.ZHANLI] = zhanli;

    return soulInfo;
};



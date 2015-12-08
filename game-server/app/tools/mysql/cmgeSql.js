/**
 * Created by xykong on 2015/3/18.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');
var mysqlProxy = require('./mySqlProxy');
var gameConst = require('../constValue');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var globalFunction = require('../../tools/globalFunction');


var Handler = module.exports;

Handler.LoadPlayerInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['role', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, []);
        }
        else {
            if (res[0].length == 0) {
                if (!!(res[1].serverStatus | 1)) {  // ServerStatus.SERVER_STATUS_IN_TRANS == 1
                    return callback(errorCodes.SystemBusy, []);
                }
                return callback(errorCodes.NoRole, []);
            }

            var index = 0;
            var playerInfo = new Array(ePlayerInfo.MAX);

            for (var aIndex in res[0][0]) {
                playerInfo[index] = res[0][0][aIndex];

                if (gameConst.ePlayerInfo.NickName == index) {
                    playerInfo[index] = utilSql.MysqlDecodeString(res[0][0][aIndex]);
                }

                ++index;
                if (index >= ePlayerInfo.MAX) {
                    break;
                }
            }
            return callback(null, playerInfo);
        }
    });
};

Handler.SaveOrders = function (orderDetails, callback) {

    var ordersTableSchema = [
        ['openId', 'bigint', 20, 0],
        ['serverId', 'varchar', 63, ''],
        ['serverName', 'varchar', 63, ''],
        ['roleId', 'varchar', 31, ''],
        ['roleName', 'varchar', 63, ''],
        ['orderId', 'varchar', 63, ''],
        ['orderStatus', 'varchar', 31, ''],
        ['payType', 'int', 11, 0],
        ['payId', 'int', 11, 0],
        ['payName', 'varchar', 31, ''],
        ['amount', 'int', 11, 0],
        ['currency', 'varchar', 15, ''],
        ['remark', 'varchar', 63, ''],
        ['callBackInfo', 'varchar', 255, ''],
        ['payTime', 'datetime', 0, 'NOW'],
        ['paySUTime', 'datetime', 0, 'NOW'],
        ['sign', 'varchar', 63, ''],
        ['recvTime', 'datetime', 0, 'NOW'],
        ['flowId', 'int', 11, 0],
        ['flowTime', 'datetime', 0, 'NOW']
    ];

    var sqlString = utilSql.BuildSqlValuesWithSchema([orderDetails], ordersTableSchema);

    var primaryKey = orderDetails['orderId'];

    var sql = 'CALL sp_saveOrders(?, ?, ?, ?, ?, ?, ?, ?)';
    var args = [primaryKey, orderDetails.serverId, orderDetails.roleId, orderDetails.baseMoney, orderDetails.generate,
                orderDetails.extra, orderDetails.activityId, sqlString];

    logger.info('Handler.SaveOrders:%j, %j', sql, args);

    mysqlProxy.query('cmge_payment', 0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        var retResult = {
            Result: 0
        };

        if (!!res[0][0]._result) {
            retResult.Result = res[0][0]._result;
        }

        return callback(null, retResult);
    });
};

Handler.QueryBalance = function (queryDetails, callback) {

    var sql = 'CALL sp_queryBalance(?, ?)';
    var args = [queryDetails.serverId, queryDetails.roleId];

    logger.info('Handler.QueryBalance:%j, %j', sql, args);

    mysqlProxy.query('cmge_payment', 0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        var balanceResult = {
            Result: 0,
            serverId: queryDetails.serverId,
            roleId: queryDetails.roleId,
            amount: !!res[0][0] ? res[0][0].amount : 0,
            generate: !!res[0][0] ? res[0][0].generate : 0,
            balance: !!res[0][0] ? res[0][0].balance : 0
        };

        return callback(null, balanceResult);
    });
};

Handler.PayBalance = function (payDetails, callback) {

    var sql = 'CALL sp_payBalance(?, ?, ?)';
    var args = [payDetails.serverId, payDetails.roleId, payDetails.amount];

    logger.info('Handler.QueryBalance:%j, %j', sql, args);

    mysqlProxy.query('cmge_payment', 0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        var Result = {
            Result: res[0][0].result,
            serverId: payDetails.serverId,
            roleId: payDetails.roleId,
            reduction: 0,
            amount: 0,
            generate: 0,
            balance: 0
        };

        if (res[0][0].result == errorCodes.OK) {
            Result.reduction = res[0][0]._balance;
            Result.amount = res[0][0].amount;
            Result.generate = res[0][0].generate;
            Result.balance = res[0][0].balance;
        }

        return callback(null, Result);
    });
};

Handler.QueryActivity = function (queryDetails, callback) {

    var sql = 'CALL sp_queryActivity(?, ?, ?)';
    var args = [queryDetails.serverId, queryDetails.roleId, queryDetails.activities];

    logger.info('Handler.QueryBalance:%j, %j', sql, args);

    mysqlProxy.query('cmge_payment', 0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        return callback(null, res[0]);
    });
};

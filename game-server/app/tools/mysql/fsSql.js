/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-22
 * Time: 上午11:29
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');
var redisClient = require('../redis/redisClient');
var gameClient = require('./gameClient');
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var gameConst = require('../constValue');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var globalFunction = require('../../tools/globalFunction');

var eFriendInfo = gameConst.eFriendInfo;
var eRechargeInfo = gameConst.eRechargeInfo;

var Handler = module.exports;

Handler.LoadFriendList = function (roleID, friendType, callback) {
    var sql = 'CALL sp_friendLoadList(?, ?)';
    var args = [roleID, friendType];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [], 0);
        }

        var Len = res[0].length;
        var dataList = [];
        for (var Num = 0; Num < Len; ++Num) {
            var temp = new Array(eFriendInfo.Max);
            var index = 0;
            for (var k in  res[0][Num]) {
                temp[index] = res[0][Num][k];
                index = index + 1;
                if (index >= eFriendInfo.Max) {
                    break;
                }
            }
            dataList.push(temp);
        }
        return callback(null, dataList);
    });
};

Handler.GetAccountsByOpenID = function (type, ids, callback) {
    var sql = 'CALL sp_getAccountsByOpenID(?, ?)';
    var strIDs = "'" + ids.join("','") + "'";
    var args = [type, strIDs];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [], 0);
        }

        var result = _.map(res[0], _.toArray);

        return callback(null, result);
    });
};

Handler.GetRoleListByOpenIds = function (ids, callback) {
    var sql = 'CALL sp_friendGetRoleListByOpenIds(?)';
    var openIds = "'" + ids.join("','") + "'";
    var args = [openIds];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [], 0);
        }

//        var result = _.map(res[0], _.toArray);

        return callback(null, res[0]);
    });
};

Handler.FriendRemoveByOutside = function (roleId, friendRoleIds, callback) {
    var sql = 'CALL sp_friendRemoveByOutside(?, ?)';

    var strIDs = "'" + friendRoleIds.join("','") + "'";

    var args = [roleId, strIDs];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        return callback(null);
    });
};

Handler.FriendAddByOutside = function (roleId, list, callback) {
    var sql = 'CALL sp_friendAddByOutside(?)';

    var params = utilSql.BuildSqlValues(list);

    var args = [params];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        return callback(null);
    });
};

Handler.GetRechargeList = function (roleID, callback) {
    var sql = 'CALL sp_rechargeGetList(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            logger.error('获取充值列表出现错误roleID=%j,buyID=%j,err=%j', roleID, buyID, err.stack);
            callback(null, []);
        }
        else {
            var Len = res[0].length;
            var dataList = [];
            for (var Num = 0; Num < Len; ++Num) {
                var temp = new Array(eRechargeInfo.Max);
                var index = 0;
                for (var k in  res[0][Num]) {
                    temp[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eRechargeInfo.Max) {
                        break;
                    }
                }
                dataList.push(temp);
            }
            callback(null, dataList);
        }
    });
};

Handler.GetRechargeID = function (roleID, buyID, callback) {
    var sql = 'CALL sp_rechargeGetID(?,?)';
    var args = [roleID, buyID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            logger.error('获取充值ID出现错误roleID=%j,buyID=%j,err=%j', roleID, buyID, err.stack);
            callback(null, errorCodes.SystemWrong);
        }
        else {
            var result = res[0][0]['_result'];
            callback(null, result);
        }
    });
};

Handler.IsAppCode = function (appCode, callback) {
    redisClient.LoadString(appCode, function (err, roleID) {
        if (null == roleID) {
            callback(true);
        }
        else {
            callback(false);
        }
    });
};

Handler.SaveAppCode = function (appCode, roleID) {
    redisClient.SaveString(appCode, roleID);
};

Handler.AddPvPBlessReceived = function(roleID, callback) {
    var sql = 'CALL sp_asyncPvPBlessReceived(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function(err, res) {
        if(err) {
            logger.error('AddPvPBlessReceived 出现错误 roleID=%j, err=%j', roleID, err);
            return callback(err);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    })
};

Handler.BlessReceived = function (roleID, friendID, callback) {
    var sql = 'CALL sp_friendBlessReceived(?,?)';
    var args = [roleID, friendID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            logger.error('BlessReceived 出现错误 roleID=%j, friendID=%j, err=%j', roleID, friendID, err);
            return callback(null, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

Handler.Bless = function (roleID, friendID, callback) {
    var sql = 'CALL sp_friendBless(?,?)';
    var args = [roleID, friendID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            logger.error('Bless 出现错误 roleID=%j, friendID=%j, err=%j', roleID, friendID, err);
            return callback(null, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

Handler.BlessCount = function (roleID, callback) {
    var sql = 'CALL sp_friendBlessCount(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            logger.error('BlessCount 出现错误 roleID=%j, err=%j', roleID, err);
            return callback(null, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

/**
 * 加载玩家pvp相关模块 相关数据
 * @param {string} table 表名
 * @param {number} roleID 玩家id
 * @param {function} callback 回调函数
 * */
Handler.LoadInfo = function (table, roleID, callback) {

    utilSql.LoadList(table, roleID, function (err, dataList) {
        callback(err, dataList);
    });
};

/**
 * @Brief:  添加好友申请
 * -------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * @param {Array} list 申请列表
 * @param {Function} callback 回调函数
 * */
Handler.addFriendApply = function (roleID, friendID, list, callback) {
    var sql = 'CALL sp_addFriendApply(?,?,?)';

    var params = utilSql.BuildSqlValues(list);

    var args = [roleID, friendID, params];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        return callback(null);
    });
};

/**
 * @Brief:  删除好友申请
 * -------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 好友id
 * @param {Function} callback 回调函数
 * */
Handler.removeFriendApply = function (roleID, friendID, callback) {
    var sql = 'CALL sp_removeFriendApply(?, ?)';

    var args = [roleID, friendID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        return callback(null);
    });
};

/**
 * @Brief:  获取申请人数
 * -------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback 回调函数
 * */
Handler.selectFriendApplyNum = function (roleID, callback) {
    var sql = 'select count(*) num from friendapply where applyFriendID = ?';

    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err);
        }

        return callback(null, !!res? res[0]['num']: 0);
    });
};
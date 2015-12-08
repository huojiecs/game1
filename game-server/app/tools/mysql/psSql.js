/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-23
 * Time: 下午6:08
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var eLoginType = gameConst.eLoginType;
var config = require('../config');
var eItemInfo = gameConst.eItemInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');

var Handler = module.exports;

Handler.CheckLogin = function (accountID, checkID, key, serverUid, callback) {
    var sql = 'CALL sp_checkLoginKey(?,?,?,?)';
    var args = [accountID, checkID, key, serverUid];
    accountClient.query(accountID, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            var result = res[0][0]['_result'];
            var accountType = res[0][0]['_accountType'];
            var isBind = res[0][0]['_isBind'];
            var openID = res[0][0]['_openID'];
            var retServerUid = res[0][0]['_retServerUid'];
            var retCheckID = res[0][0]['_retCheckID'];
            var openToken = res[0][0]['_openToken'];
            callback(null, result, accountType, isBind, openID, retServerUid, retCheckID, openToken);
        }
    });
};

Handler.Register = function (account, password, checkID, registerType, callback) {//现在该函数的功能为检测用户名是否重复，用户注册存储过程改为sp_loginByAccount
    var sql = 'CALL sp_registerAccount(?,?,?,?)';
    var args = [account, password, checkID, registerType];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            var result = res[0][0]['_result'];
            callback(null, result);
        }
    });
};

Handler.CheckAccount = function (account, callback) {
    var sql = 'CALL sp_checkAccount(?)';
    var args = [account];
    accountClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            var result = res[0][0]['_result'];
            callback(null, result);
        }
    });
};

Handler.BindEmail = function (accountID, emailStr, callback) {
    var sql = 'CALL sp_bindEmail(?,?)';
    var args = [accountID, emailStr];
    accountClient.query(accountID, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            callback(null, 0);
        }
    });
};

Handler.ChangePassword = function (accountID, oldPassword, newPassword, callback) {
    var sql = 'CALL sp_changePassword(?,?,?)';
    var args = [accountID, oldPassword, newPassword];
    accountClient.query(accountID, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            var result = res[0][0]['_result'];
            callback(null, result);
        }
    });
};

Handler.CreateRole =
function (accountID, roleID, roleName, tempID, expLevel, zhanLi, LifeNum, serverUid, itemInfo, skillInfo, soulInfo, misInfo,
          IDGroupInfo, misFinishInfo, assetsInfo, mailInfo, physicalInfo, giftSqlStr, magicSoulInfoSqlStr, climbSqlStr,
          alchemyInfoSqlStr, mineSweepInfoSqlStr, loginGiftInfo, rewardmisInfo, callback) {
    logger.info('itemInfo = %j', itemInfo);
    logger.info('skillInfo = %j', skillInfo);
    logger.info('soulInfo = %j', soulInfo);
    logger.info('misInfo = %j', misInfo);
    logger.info('IDGroupInfo = %j', IDGroupInfo);
    logger.info('misFinishInfo = %j', misFinishInfo);
    logger.info('assetsInfo = %j', assetsInfo);
    logger.info('mailInfo = %j', mailInfo);
    logger.info('giftSqlStr = %j', giftSqlStr);
    logger.info('roleID = %j', roleID);
    logger.info('magicSoulInfoSqlStr = %j', magicSoulInfoSqlStr);
    logger.info('physicalInfo = %j', physicalInfo);
    logger.info('climbInfo = %j', climbSqlStr);
    logger.info('alchemyInfoSqlStr = %j', alchemyInfoSqlStr);
    logger.info('mineSweepInfoSqlStr = %j', mineSweepInfoSqlStr);
    logger.info('loginGiftInfo = %j', loginGiftInfo);
    logger.info('rewardmisInfo = %j', rewardmisInfo);

    var sql = 'CALL sp_createRole(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    var args = [accountID, roleID, tempID, roleName, expLevel, zhanLi, LifeNum, serverUid, itemInfo, skillInfo, soulInfo, misInfo,
                IDGroupInfo, misFinishInfo, assetsInfo, mailInfo, giftSqlStr, magicSoulInfoSqlStr, physicalInfo,
                climbSqlStr, alchemyInfoSqlStr, mineSweepInfoSqlStr, loginGiftInfo, rewardmisInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('CreateRole=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

Handler.DeleteRole = function (roleID, callback) {
    var sql = 'CALL sp_deleteRole(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, 1);
        }
        else {
            var result = res[0][0]['_result'];
            callback(null, result);
        }
    });
};

/**
 * Brief: 删除角色 ares 数据 因为不分库， 需要特殊处理
 * -------------------------------------------------
 * @api public
 *
 * @param {Number} roleID 玩家ID
 * @param {Function} callback 回调函数
 * */
Handler.DeleteRoleAresInfo = function (roleID, callback) {
    var sql = 'DELETE FROM ares where roleID = ?';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.CheckRoleName = function (roleName, accountID, callback) {
    var sql = 'CALL sp_checkRoleName(?,?)';
    var args = [roleName, accountID];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res[0][0]);
    });
};

Handler.SetRoleIDandSvrUid = function (roleID, serverUid, roleName, callback) {
    var sql = 'CALL sp_setRoleIDandSvrUid(?,?,?)';
    var args = [roleID, serverUid, roleName];
    account_globalClient.query(0, sql, args, function (err) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback();
    });
};

Handler.DeleteRoleName = function (roleName, callback) {
    var sql = 'CALL sp_deleteRoleName(?)';
    var args = [roleName];
    account_globalClient.query(0, sql, args, function (err) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback();
    });
};

Handler.GetRoleIDListbyAccountID = function (accountID, serverUid, callback) {
    var sql = 'CALL sp_getRoleIDList(?, ?)';
    var args = [accountID, serverUid];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        var roleIDList = [];
        for (var i in res[0]) {
            if (null != res[0][i]['roleID']) {
                roleIDList.push(res[0][i]['roleID']);
            }
        }
        return callback(null, roleIDList);
    });
};

Handler.GetServiceTime = function (callback) {
    var dateStr = utils.dateString();
    dateStr = '(\'' + dateStr + "\')";
    var sql = 'CALL sp_getServiceTime(?)';
    var args = [dateStr];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, new Date());
        }
        var startTime = res[0][0]['_openTime'];
        return callback(null, startTime);
    });
};

Handler.GetVipInfoByRoleID = function(roleID, callback) {
    var sql = 'CALL sp_getVipInfoByRoleID(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var result = res[0][0];
            callback(null, result);
        }
    });
};

Handler.SetVipInfoByRoleID = function(roleID, vipLevel, vipPoint, callback) {
    var sql = 'CALL sp_setVipInfoByRoleID(?,?,?)';
    var args = [roleID, vipLevel, vipPoint];

    gameClient.query(roleID, sql, args, function(err) {
        if (err) {
            return callback(err, []);
        }
        return callback();
    });
};

/**
 *
 * @param roleNames 待检查的角色名字， 字符串数组
 * @param callback  回调， res是个结果数组
 * @constructor
 */
Handler.CheckRoleNames=function(roleNames, callback){
    var sql = "select roleName from rolename where roleName in (";
    var sql_suffix = ") group by roleName;";

    if(roleNames.length == 1){
        sql = sql +"'" + roleNames[0] +"'"+sql_suffix;
    }else{
        for(var i=0; i<roleNames.length-1;i++){
            sql += "'" + roleNames[i] +"',"
        }
        sql += "'" + roleNames[i] +"'" + sql_suffix;
    }

    account_globalClient.query(0, sql, [], function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }

        if(res.length==0){
            return callback(null, []);
        }else{
            return callback(null, res);
        }
    });
};

/** 同步结婚玩家的 婚礼等级 marryLevel */
Handler.UpdateMarryLevel = function (roleID, marryLevel, callback) {
    var sql = 'CALL sp_updateMarryLevel(?,?)';
    var args = [roleID, marryLevel];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};
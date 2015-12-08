/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-7-30
 * Time: 上午11:02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameClient = require('./gameClient');
var accountClient = require('./accountClient');
var gameConst = require('../constValue');
var account_globalClient = require('./account_globalClient');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var globalFunction = require('../../tools/globalFunction');
var ePlayerInfo = gameConst.ePlayerInfo;

var Handler = module.exports;

Handler.GetPlayerInfo = function (roleID, callback) {
    var sql = 'CALL sp_gm_getPlayerInfo(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.GetExp = function (roleID, callback) {
    var sql = 'CALL sp_gm_getExp(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0][0]);
    });
};

Handler.SetExp = function (roleID, exp, expLevel, callback) {
    var sql = 'CALL sp_gm_setExp(?, ?, ?)';
    var args = [roleID, exp, expLevel];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0][0]['_result']);
    });
};

Handler.GetAssetsInfo = function (roleID, tempID, callback) {
    var sql = 'CALL sp_gm_getAssetsInfo(?, ?)';
    var args = [roleID, tempID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0][0]);
    });
};

Handler.SetAssetsInfo = function (roleID, tempID, amount, callback) {
    var sql = 'CALL sp_gm_setAssetsInfo(?, ?, ?)';
    var args = [roleID, tempID, amount];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0][0]);
    });
};

Handler.GetRoleList = function (openId, callback) {
    var sql = 'CALL sp_gm_getRoleList(?)';
    var args = [openId];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }

        return callback(null, res[0]);
    });
};

Handler.GetRoleListByServerUid = function(openId, serverUid, callback) {
    var sql = 'CALL sp_gm_getRoleListByServerUid(?,?)';
    var args = [openId, serverUid];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }

        return callback(null, res[0]);
    });
};

Handler.GetRoleListInfo = function (roleID, callback) {
    var sql = 'CALL sp_gm_getRoleListInfo(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }

        return callback(null, res[0][0]);
    });
};

Handler.GetRoleJobType = function (roleID, callback) {
    var sql = 'CALL sp_gm_getRoleJobType(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0][0]);
    });
};

Handler.GetRoleInfoByName = function(name, callback) {
    var sql = 'CALL sp_gm_getRoleInfoByName(?)';
    var args = [name];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0][0]);
    });
};

Handler.AddItem = function (roleID, itemInfo, callback) {
    var sql = 'CALL sp_gm_addItem(?, ?)';
    var args = [roleID, itemInfo];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0][0]);
    });
};

Handler.DeleteItem = function (roleID, itemId, itemNum, callback) {
    var sql = 'CALL sp_gm_deleteItem(?, ?, ?)';
    var args = [roleID, itemId, itemNum];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.DeleteAllItem =
function (roleID, isClearProgress, isClearMoney, isClearLevel, isClearAsset, isClearItem, callback) {
    var sql = 'CALL sp_gm_deleteAllItem(?, ?, ?, ?, ?, ?)';
    var args = [roleID, isClearProgress, isClearMoney, isClearLevel, isClearAsset, isClearItem];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.GetAccountIDByOpenID = function (openID, callback) {
    var sql = 'CALL sp_getAccountIDByOpenID(?)';
    var args = [openID];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0][0]['_accountID']);
    });
};

Handler.SetAccountCanLoginTime = function (accountID, date, callback) {
    var sql = 'CALL sp_setAccountCanLoginTime(?,?)';
    var args = [accountID, date];

    accountClient.query(accountID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0][0]['_result']);
    });
};

Handler.GetAccountUnbanTime = function (accountID, callback) {
    var sql = 'CALL sp_gm_getAccountUnbanTime(?)';
    var args = [accountID];

    accountClient.query(accountID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0][0]['_UnbanTime']);
    });
};

Handler.GetPlayerBasicInfo = function (roleID, callback) {
    var sql = 'CALL sp_gm_getPlayerBasicInfo(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.GetPlayerOccupyID = function (roleID, callback) {
    var sql = 'CALL sp_gm_getPlayerOccupyID(?)';
    var args = [roleID];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.GetPlayerInfoForOccupy = function (roleID, callback) {
    var sql = 'CALL sp_gm_getPlayerInfoForOccupy(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.SetClimbScoreZero = function (roleID, callback) {
    var sql = 'CALL sp_gm_setClimbZero(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.GetClimbScoreInfo = function (roleID, callback) {
    var sql = 'CALL sp_gm_getClimbScoreInfo(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.SetClimbScoreInfo = function (roleID, climbData, historyData, callback) {
    var sql = 'CALL sp_gm_setClimbScoreInfo(?,?,?)';
    var args = [roleID, climbData, historyData];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.GetPlayerForbidInfo = function (roleID, callback) {
    var sql = 'CALL sp_gm_getPlayerForbidInfo(?)';
    var args = [roleID];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0][0]);
    });
};

Handler.GetAllPlayerForbidInfo = function (callback) {
    var sql = 'CALL sp_gm_getAllPlayerForbidInfo()';
    var args = [];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0]);
    });
};

Handler.SetForbidChatTime = function (roleID, data, callback) {
    var sql = 'CALL sp_gm_setForbidChatTime(?,?)';
    var args = [roleID, data];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res);
    });
};

Handler.SetForbidProfitTime = function (roleID, dateStr, callback) {
    var sql = 'CALL sp_gm_setForbidProfitTime(?,?)';
    var args = [roleID, dateStr];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res);
    });
};

Handler.SetForbidPlayInfo = function (roleID, dateStr, dataList, callback) {
    var sql = 'CALL sp_gm_setForbidPlayInfo(?,?,?)';
    var args = [roleID, dateStr, dataList];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res);
    });
};

Handler.SetForbidChartTime = function (roleID, dateStr, callback) {
    var sql = 'CALL sp_gm_setForbidChartTime(?,?)';
    var args = [roleID, dateStr];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res);
    });
};

Handler.GetForbidChartTime = function (callback) {
    var sql = 'CALL sp_gm_getForbidChartTime()';
    var args = [];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0]);
    });
};

Handler.GetForbidChatTime = function(callback) {
    var sql = 'CALL sp_gm_getForbidChatTime()';
    var args = [];

    gameClient.query(0, sql, args, function(err, res) {
        if(!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
    });
};

Handler.GetRoleForbidChartTime = function(roleID, callback) {
    var sql = 'CALL sp_gm_getRoleForbidChartTime(?)';
    var args = [roleID];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res[0]);
    });
};

Handler.RemoveForbid = function (roleID, removeProfit, removeChat, removeChart, removePlay, removePlayList, callback) {
    var sql = 'CALL sp_gm_removeForbid(?,?,?,?,?,?)';
    var args = [roleID, removeProfit, removeChat, removeChart, removePlay, removePlayList];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, [])
        }
        return callback(null, res);
    });
};

Handler.GetRoleIdsByServerUid = function(serverUid, callback) {
    var sql = 'CALL sp_gm_getRoleIdsByServerUid(?)';
    var args = [serverUid];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
    });
};

Handler.GetAccountIDsByServerUid = function(serverUid, callback) {
    var sql = 'SELECT DISTINCT accountID FROM rolename WHERE serverUid = ' + serverUid + ';';

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

Handler.SetExtraVipPointAndroid = function (accountIDs, serverUid, value, callback) {
    var sql = 'INSERT INTO extravippoint (accountID, serverUid, point) VALUES(';
    var sql_suffix = ') ON DUPLICATE KEY UPDATE point = point + (' + value + ');';

    if(accountIDs.length == 0) {
        return callback(null, errorCodes.SystemWrong);
    }

    if(accountIDs.length == 1){
        sql = sql + accountIDs[0] + ',' + serverUid + ',' + value + sql_suffix;
    }else{
        for(var i=0; i<accountIDs.length-1;i++){
            sql += accountIDs[i] + ',' + serverUid + ',' + value + '),(';
        }
        sql += accountIDs[i] + ',' + serverUid + ',' + value + sql_suffix;
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

Handler.SetExtraVipPointIOS = function(roleIDs, value, callback) {
    var sql = 'INSERT INTO assets (roleID, tempID, num) VALUES(';
    var sql_suffix = ') ON DUPLICATE KEY UPDATE num = num + (' + value + ');';

    if(roleIDs.length == 0) {
        return callback(null, errorCodes.SystemWrong);
    }

    if(roleIDs.length == 1){
        sql = sql + roleIDs[0]  + ',' + globalFunction.GetExtraVipPoint() + ',' + value + sql_suffix;
    }else{
        for(var i=0; i<roleIDs.length-1;i++){
            sql += roleIDs[i] + ',' + globalFunction.GetExtraVipPoint() + ',' + value + '),(';
        }
        sql += roleIDs[i] + ',' + globalFunction.GetExtraVipPoint() + ',' + value + sql_suffix;
    }

    gameClient.query(0, sql, [], function (err, res) {
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
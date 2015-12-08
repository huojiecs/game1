/**
 * Created by Administrator on 14-10-8.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var errorCodes = require('../../tools/errorCodes');
var Handler = module.exports;

Handler.LoadUnions = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionInfo()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.UnionLoad = function (unionID, tableName, callback) {
    var sql = 'CALL sp_unionLoad(?)'
    var args = [tableName];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.loadUnionMembers = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionMemberInfo()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.loadMemFightDamage = function (unionID, callback) {
    var sql = 'CALL sp_loadMemFightDamage()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};


Handler.loadUnionRoleShopInfo = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionRoleShopInfo()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

//
Handler.loadUnionMagicInfo = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionMagicInfo()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.loadPlayerApplySql = function (unionID, callback) {
    var sql = 'CALL sp_loadPlayerApplyInfo()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.loadUnionApplySql = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionApplyInfo()';
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

// 读取公会神殿信息
Handler.LoadUnionTemple = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionTemple()';
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

// 读取公会神兽信息
Handler.LoadUnionAnimal = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionAnimal()';
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

// 读取公会神殿信息
Handler.loadUnionsDamage = function (unionID, callback) {
    var sql = 'CALL sp_loadUnionsDamage()';
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

// 读取公会神殿信息
Handler.LoadPlayerOffer = function (unionID, callback) {
    var sql = 'CALL sp_loadPlayerOffer()'
    var args = [];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.CheckUnionName = function (unionName, callback) {
    var sql = 'CALL sp_checkUnionName(?)';
    var args = [unionName];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res[0][0]);
    });
};

Handler.CreateUnion = function (unionID, roleID, unionInfoSqlStr, unionMemberInfoSqlStr, callback) {
    logger.info('unionInfoSqlStr = %j', unionInfoSqlStr);
    logger.info('unionMemberInfoSqlStr = %j', unionMemberInfoSqlStr);
    var sql = 'CALL sp_createUnion(?,?,?,?)';
    var args = [unionID, roleID, unionInfoSqlStr, unionMemberInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('CreateUnion=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};
Handler.SaveUnionMember = function (unionID, args, callback) {
    var sql = 'CALL sp_saveUnionMember(?,?)';
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveUnionMember=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};
Handler.SaveMemFightDamage = function (unionID, args, callback) {
    var sql = 'CALL sp_SaveMemFightDamage(?,?)';
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveMemFightDamage=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};
Handler.SavePlayerApply = function (roleID, playerApplyInfoSqlStr, callback) {
    var sql = 'CALL sp_savePlayerApply(?,?)';
    var args = [roleID, playerApplyInfoSqlStr];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('EnterUnion=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};
Handler.SaveUnionApply = function (unionID, unionMemberInfoSqlStr, callback) {
    var sql = 'CALL sp_saveUnionApply(?,?)';
    var args = [unionID, unionMemberInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('EnterUnion=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};


Handler.SaveUnion = function (unionID, unionInfoSqlStr, callback) {
    var sql = 'CALL sp_saveUnion(?,?)';
    var args = [unionID, unionInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveUnion=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

Handler.SaveUnionLogList = function (unionID, unionLogSqlStr, callback) {
    var sql = 'CALL sp_saveUnionList(?,?,?)';
    var args = ['unionlog', unionID, unionLogSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveUnionLogList=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

Handler.SaveCultureLogList = function (unionID, unionLogSqlStr, callback) {
    var sql = 'CALL sp_saveUnionList(?,?,?)';
    var args = ['unionculture', unionID, unionLogSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveUnionLogList=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

/**
 * 保存玩家工会商店信息
 */
Handler.SaveRoleUnionShopInfo = function (roleID, unionRoleShopSqlStr, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['unionshop', roleID, unionRoleShopSqlStr];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveRoleUnionShopInfo=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

// 保存角色离开公会的信息
Handler.SavePlayerSignOut = function (roleID, unionSql, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['playersignout', roleID, unionSql];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SavePlayerSignOut=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

// 保存公会技能信息
Handler.SaveUnionMagicInfo = function (unionID, magicStr, callback) {
    var sql = 'CALL sp_saveUnionList(?,?,?)';
    var args = ['unionmagic', unionID, magicStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveUnionMagicInfo=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

// 保存公会神殿信息
Handler.SaveUnionTemple = function (unionID, unionInfoSqlStr, callback) {
    var sql = 'CALL sp_saveUnionTemple(?,?)';
    var args = [unionID, unionInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveUnionTemple =%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

// 保存角色祭拜信息
Handler.SavePlayerOffer = function (unionID, unionInfoSqlStr, callback) {
    var sql = 'CALL sp_savePlayerOffer(?,?)';
    var args = [unionID, unionInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SavePlayerOffer =%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

// 保存公会神兽信息
Handler.SaveUnionAnimal = function (unionID, unionInfoSqlStr, callback) {
    var sql = 'CALL sp_saveUnionAnimal(?,?)';
    var args = [unionID, unionInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('sp_saveUnionAnimal =%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

// 删除角色公会信息
Handler.DeleteRoleUnion = function (unionID, roleID, callback) {
    var sql = 'CALL sp_deleteUnion(?)';
    var args = [roleID];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('DeleteRoleUnion=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

// 删除公会全部信息
Handler.DeleteUnionInfo = function (unionID, callback) {
    var sql = 'CALL sp_deleteAllUnionInfo(?)';
    var args = [unionID];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('DeleteUnionInfo=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
}

// 删除公会的单个角色
Handler.DeleteMember = function (unionID, roleID, callback) {
    var sql = 'CALL sp_deleteMember(?)';
    var args = [roleID];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('DeleteMember=%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};

Handler.DeleteUnionName = function (unionName, callback) {
    var sql = 'CALL sp_deleteUnionName(?)';
    var args = [unionName];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

Handler.DeleteAllPlayerOffer = function (callback) {
    var sql = 'CALL sp_deletePlayerOffer()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

//删除公会红包领取和 发送记录
Handler.DeleteAllUnionGift = function (callback) {
    var sql = 'CALL sp_deleteUnionGift()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

//删除公会其他数据 （炼狱次数记录，）
Handler.DeleteAllUnionData = function (callback) {
    var sql = 'CALL sp_deleteUnionData()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

//加载公会红包
Handler.loadUnionGiftSql = function (i, tabName, callback) {
    //加载发送的公会红包
    var sql = 'CALL sp_loadUnionGiftInfo(?)';
    var args = [tabName];
    gameClient.query(i, sql, args, function (err, res) {
        if (!!err) {
            return callback(err,errorCodes.SystemWrong);
        }else{
            callback(null, res[0]);
        }
    });
};

//加载公会其他数据  （炼狱次数， ）
Handler.loadUnionDataSql = function (i, tabName, callback) {
    var sql = 'CALL sp_loadUnionData(?)';
    var args = [tabName];
    gameClient.query(i, sql, args, function (err, res) {
        if (!!err) {
            return callback(err,errorCodes.SystemWrong);
        }else{
            callback(null, res[0]);
        }
    });
};

/**
 *
 * 存储公会领取的红包
 * chen_s
 *
 * */
Handler.SaveUnionGiftReceive = function (roleID,args,callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            callback(err, [], 0);
        }
        else {
            callback(null, res);
        }
    });
};


/**
 *
 * 存储公会发放红包
 * chen_s
 *
 * */
Handler.SaveUnionGiftSend = function (unionID,args,callback) {
    var sql = 'CALL sp_saveUnionList(?,?,?)';
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            callback(err, [], 0);
        }
        else {
            callback(null, res);
        }
    });
};


/**
 *
 * 存储公会其他数据 （炼狱）
 * chen_s
 *
 * */
Handler.SaveUnionData = function (unionID,args,callback) {
    var sql = 'CALL sp_saveUnionList(?,?,?)';
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            callback(err, [], 0);
        }
        else {
            callback(null, res);
        }
    });
};// 删掉所有公会神兽信息
Handler.DeleteAllUnionAnimal = function (callback) {
    var sql = 'CALL sp_deleteAllUnionAnimal()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

// 删掉所有公会神兽信息
Handler.DeleteAllMemFightDamage = function (callback) {
    var sql = 'CALL sp_deleteAllMemFightDamage()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

Handler.DeleteAllUnionsDamage = function(callback){
    var sql = 'CALL sp_deleteAllUnionsDamage()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

Handler.DeleteCultureLog = function(callback){
    var sql = 'CALL sp_deleteCultureLog()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }
        return callback(null, res);
    });
};

// 保存公会神兽信息
Handler.SaveUnionsDamage = function (unionID, unionInfoSqlStr, callback) {
    var sql = 'CALL sp_saveUnionsDamage(?,?)';
    var args = [unionID, unionInfoSqlStr];
    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('sp_saveUnionsDamage =%s', err.stack);
            return callback(err, errorCodes.SystemWrong);
        }
        var result = res[0][0]['_result'];
        return callback(null, result);
    });
};



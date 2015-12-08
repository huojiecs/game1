/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午8:28
 * To change this template use File | Settings | File Templates.
 *.................................................................................................................................................../
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var logClient = require('./logClient');
var utils = require('./../utils');
var globalfunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');

var ePlayerInfo = gameConst.ePlayerInfo;
var eItemInfo = gameConst.eItemInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eAttInfo = gameConst.eAttInfo;
var eAttDBStr = gameConst.eAttDBStr;
var eNiuDanInfo = gameConst.eNiuDanInfo;
var eGoodsInfo = gameConst.eGoodsInfo;
var eMissionInfo = gameConst.eMisInfo;
var eGiftInfo = gameConst.eGiftInfo;
var eAchiInfo = gameConst.eAchiInfo;
var eMagicSoulInfo = gameConst.eMagicSoulInfo;
var eAlchemyInfo = gameConst.eAlchemyInfo;
var eLoginGiftInfo = gameConst.eLoginGiftInfo;
var eMagicOutputInfo = gameConst.eMagicOutputInfo;
var eQQMemberGift = gameConst.eQQMemberGift;
var eToMarry = gameConst.eToMarryInfo;
var eMarry = gameConst.eMarryInfo;
var eXuanYan = gameConst.eXuanYan;
var eMarryMsg = gameConst.eMarryMsg;

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

Handler.SavePlayerInfo = function (roleID, playerInfo, callback) {
    playerInfo[ePlayerInfo.CreateTime] = utilSql.DateToString(new Date(playerInfo[ePlayerInfo.CreateTime]));
    if (playerInfo[ePlayerInfo.RefreshTime] != '0000-00-00 00:00:00') {
        playerInfo[ePlayerInfo.RefreshTime] = utilSql.DateToString(new Date(playerInfo[ePlayerInfo.RefreshTime]));
    }

    if (!playerInfo[ePlayerInfo.ZHANLI]) {
        logger.error('%d SavePlayerInfo invalid ZHANLI', roleID);
        playerInfo[ePlayerInfo.ZHANLI] = 1;
    }

    var sqlstr = '(';
    for (var i = 0; i < ePlayerInfo.MAX; ++i) {
        var value = playerInfo[i];
        if (typeof  value == 'string') {
            sqlstr += '\'' + value + '\'' + ',';
        }
        else {
            sqlstr += value + ',';
        }
    }
    sqlstr = sqlstr.substring(0, sqlstr.length - 1);
    sqlstr += ')';
    var sql = 'CALL sp_savePlayerInfo(?)';
    var args = [sqlstr];
    logger.info('Handler.SavePlayerInfo:%j, %j', sql, args);
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err);
    });
};

Handler.LoadItemInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['item', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        }
        else {
            var Len = res[0].length;
            var itemList = [];
            for (var Num = 0; Num < Len; ++Num) {
                var itemInfo = new Array(eItemInfo.Max);
                var index = 0;
                for (var k in  res[0][Num]) {
                    itemInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eItemInfo.Max) {
                        break;
                    }
                }
                itemList.push(itemInfo);
            }
            callback(null, itemList, Len);
        }
    });
};

Handler.SaveItemInfo = function (roleID, itemList, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['item', roleID, itemList];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadAssetsInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['assets', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var assetsInfo = {};
            for (var aIndex in res[0]) {
                assetsInfo[res[0][aIndex]['tempID']] = res[0][aIndex]['num'];
            }
            callback(null, assetsInfo);
        }
    });
};

Handler.SaveAssetsInfo = function (roleID, assetsInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['assets', roleID, assetsInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadAreaSco = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['areasco', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var areaList = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                }
                areaList.push(temp);
            }
            callback(null, areaList);
        }
    });
};

Handler.SaveAreaSco = function (roleID, areaInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['areasco', roleID, areaInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.SaveRoleAttribute = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['attribute', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleSkill = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['skill', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var skillList = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                }
                skillList.push(temp);
            }
            callback(null, skillList);
        }
    });
};

Handler.SaveSkillInfo = function (roleID, skillInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['skill', roleID, skillInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

// 存玩家的公会技能信息
Handler.SaveUnionPlayerMagic = function (roleID, magicInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['playermagic', roleID, magicInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

// 存玩家的新版活动信息
Handler.SaveAdvanceInfo = function (roleID, advanceInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['advance', roleID, advanceInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleSoul = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['soul', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var soulList = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                }
                soulList.push(temp);
            }
            callback(null, soulList);
        }
    });
};

Handler.SaveSoulInfo = function (roleID, soulInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['soul', roleID, soulInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleMagicSoul = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['magicsoul', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var magicSoulInfo = [];
            var index = 0;
            for (var rIndex in res[0][0]) {
                magicSoulInfo[index] = res[0][0][rIndex];
                index = index + 1;
                if (index >= eMagicSoulInfo.Max) {
                    break;
                }
            }
            callback(null, magicSoulInfo);
        }
    });
};

Handler.SaveMagicSoulInfo = function (roleID, magicSoulInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['magicsoul', roleID, magicSoulInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleAlchemyData = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['alchemy', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var alchemyInfo = [];
            var index = 0;
            for (var rIndex in res[0][0]) {
                alchemyInfo[index] = res[0][0][rIndex];
                index = index + 1;
                if (index >= eAlchemyInfo.Max) {
                    break;
                }
            }
            callback(null, alchemyInfo);
        }
    });
};
Handler.SaveAlchemyInfo = function (roleID, alchemyInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['alchemy', roleID, alchemyInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadMisFinishData = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['misfinish', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var misFinishInfo = [];
            var index = 0;
            for (var rIndex in res[0][0]) {
                misFinishInfo[index] = res[0][0][rIndex];
                index = index + 1;
                if (index >= 2) {
                    break;
                }
            }
            callback(null, misFinishInfo);
        }
    });
};
Handler.SaveMisFinishData = function (roleID, misFinishInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['misfinish', roleID, misFinishInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};


Handler.LoadRolePhysical = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['physical', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var magicSoulInfo = [];
            var index = 0;
            for (var rIndex in res[0][0]) {
                magicSoulInfo[index] = res[0][0][rIndex];
                index = index + 1;
                if (index >= eMagicSoulInfo.Max) {
                    break;
                }
            }
            callback(null, magicSoulInfo);
        }
    });
};

Handler.SavePhysicalInfo = function (roleID, PhysicalInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['physical', roleID, PhysicalInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};


Handler.SaveClimbInfo = function (roleID, climbInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['climb', roleID, climbInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};


Handler.LoadRoleMisGroup = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['misgroup', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var magicSoulInfo = [];
            var index = 0;
            for (var rIndex in res[0][0]) {
                magicSoulInfo[index] = res[0][0][rIndex];
                index = index + 1;
                if (index >= 2) {
                    break;
                }
            }
            callback(null, magicSoulInfo);
        }
    });
};

Handler.SaveRoleMisGroup = function (roleID, MisGroupInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['misgroup', roleID, MisGroupInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 * 保存数据到数据ku, 1, 其他很多方法都是 只有表名不同通过传table 可以实现统一接口
 *                  2, insert into 'table' values (), ()...; 方式
 * @param {string} table 表名
 * @param {string} roleID 玩家id, 主键或联合主键之一，
 * @param {string} info 存储字符串
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.SaveInfo = function (table, roleID, Info, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = [table, roleID, Info];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

/*
 Handler.LoadMisAccount = function (accountID, callback) {
 var sql = 'CALL sp_loadMisAccount(?)';
 var args = [ accountID ];
 gameClient.query(sql, args, function (err, res) {
 if (err) {
 callback(err, []);
 }
 else {
 var magicSoulInfo = [];
 var index = 0;
 for (var rIndex in res[0][0]) {
 magicSoulInfo[ index ] = res[0][0][rIndex];
 index = index + 1;
 if (index >= 2) {
 break;
 }
 }
 callback(null, magicSoulInfo);
 }
 });
 };

 Handler.SaveMisAccount = function (accountID, MisAccountInfo, callback) {
 var sql = 'CALL sp_saveMisAccount(?,?)';
 var args = [ accountID, MisAccountInfo ];
 gameClient.query(sql, args, function (err, res) {
 callback(err, res);
 });
 };
 */

Handler.LoadRoleNiuDan = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['niudan', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, {});
        }

        var niuInfo = [];
        for (var aIndex in res[0]) {
            var temp = [];
            var index = 0;
            for (var rIndex in res[0][aIndex]) {
                temp[index] = res[0][aIndex][rIndex];
                index = index + 1;
                if (index >= eNiuDanInfo.Max) {
                    break;
                }
            }
            niuInfo.push(temp);
        }
        return callback(null, niuInfo);
    });
};

Handler.SaveRoleNiuDan = function (roleID, niuInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['niudan', roleID, niuInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleShop = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['shop', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var dataInfo = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                    if (index >= eGoodsInfo.Max) {
                        break;
                    }
                }
                dataInfo.push(temp);
            }
            callback(null, dataInfo);
        }
    });
};

Handler.SaveRoleShop = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['shop', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleMission = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['mission', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var dataInfo = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                    if (index >= eMissionInfo.Max) {
                        break;
                    }
                }
                dataInfo.push(temp);
            }
            callback(null, dataInfo);
        }
    });
};

Handler.SaveRoleMission = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['mission', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleAchieve = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['achieve', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var dataInfo = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                    if (index >= eAchiInfo.Max) {
                        break;
                    }
                }
                dataInfo.push(temp);
            }
            callback(null, dataInfo);
        }
    });
};

Handler.SaveRoleAchieve = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['achieve', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleNewHelp = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['newplayer', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var dataInfo = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp.push(res[0][aIndex][rIndex]);
                    index = index + 1;
                    if (index >= 2) {
                        break;
                    }
                }
                dataInfo.push(temp);
            }
            callback(null, dataInfo);
        }
    });
};

Handler.SaveRoleNewHelp = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['newplayer', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleGift = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['gift', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var dataInfo = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp.push(res[0][aIndex][rIndex]);
                    index = index + 1;
                    if (index >= eGiftInfo.Max) {
                        break;
                    }
                }
                dataInfo.push(temp);
            }
            callback(null, dataInfo);
        }
    });
};

Handler.SaveRoleGift = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['gift', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleActivity = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['activity', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var activityList = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                }
                activityList.push(temp);
            }
            callback(null, activityList);
        }
    });
};

Handler.SaveActivityInfo = function (roleID, activityInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['activity', roleID, activityInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadAsyncPvPRival = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['asyncpvprival', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err);
        }

        var list = [];
        for (var i in res[0]) {
            list.push(
                utils.values(res[0][i])
            );
        }

        callback(null, list);
    });
};

Handler.LoadAsyncPvPInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['asyncpvpbless', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err);
        }

        var aList = utils.values(res[0][0]);
        callback(null, aList);
    });
};

Handler.SaveAsyncPvPRival = function (roleID, info, callback) {
    var sql = 'CALL sp_saveAsyncPvPRival(?,?)';
    var args = [roleID, info];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.SaveAsyncPvPRivalOffline = function (roleID, info, callback) {
    var sql = 'CALL sp_saveAsyncPvPRivalOffline(?,?)';
    var args = [info, roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.SaveAsyncPvPInfo = function (roleID, info, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['asyncpvpbless', roleID, info];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.insertLog = function (tableName, logList, callback) {
    if (logList.length == 0) {
        return;
    }
    var sql = 'insert into `database_log`.`' + tableName + '` value (';
    for (var index in logList) {
        sql += logList[index] + ',';
    }
    sql = sql.substring(0, sql.length - 1);
    sql += ')';
    logger.info(sql);
    var args = [];
    logClient.query(sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.GetRoleInfoByID = function (roleID, callback) {
    var sql = 'CALL sp_getRoleInfoByID(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], []);
        }
        else {
            var itemList = [];
            var soulList = [];
            var playerIndex = 0;
            var itemIndex = 0;
            var soulIndex = 0;
            var playerInfo = new Array(ePlayerInfo.MAX);
            for (var aIndex in res[0][0]) {
                playerInfo[playerIndex] = res[0][0][aIndex];
                if (playerIndex == ePlayerInfo.NickName) {
                    playerInfo[playerIndex] = utilSql.MysqlDecodeString(playerInfo[playerIndex]);
                }
                ++playerIndex;
                if (playerIndex >= ePlayerInfo.MAX) {
                    break;
                }
            }
            for (var Index in res[1]) {
                itemIndex = 0;
                var itemInfo = new Array(eItemInfo.Max);
                for (var aIndex in res[1][Index]) {
                    itemInfo[itemIndex] = res[1][Index][aIndex];
                    ++itemIndex;
                    if (itemIndex >= eItemInfo.Max) {
                        break;
                    }
                }
                itemList.push(itemInfo);
            }
            for (var Index in res[2]) {
                soulIndex = 0;
                var soulInfo = new Array(eSoulInfo.Max);
                for (var aIndex in res[2][Index]) {
                    soulInfo[soulIndex] = res[2][Index][aIndex];
                    ++soulIndex;
                    if (soulIndex >= eSoulInfo.Max) {
                        break;
                    }
                }
                soulList.push(soulInfo);
            }
            callback(null, playerInfo, itemList, soulList);
        }
    });
};

Handler.GetRoleInfoByName = function (roleID, callback) {
    var sql = 'CALL sp_getRoleInfoByName(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], []);
        }
        else {
            var itemList = [];
            var soulList = [];
            var attList = [];
            var magicSoulList = [];
            var petList = [];
            var jjcInfo = {};
            var playerIndex = 0;
            var itemIndex = 0;
            var soulIndex = 0;
            var attIndex = 0;
            var magicSoulIndex = 0;
            var playerInfo = new Array(ePlayerInfo.MAX);
            for (var aIndex in res[0][0]) {
                playerInfo[playerIndex] = res[0][0][aIndex];
                if (playerIndex == ePlayerInfo.NickName) {
                    playerInfo[playerIndex] = utilSql.MysqlDecodeString(playerInfo[playerIndex]);
                }
                ++playerIndex;
                if (playerIndex >= ePlayerInfo.MAX) {
                    break;
                }
            }
            for (var Index in res[1]) {
                itemIndex = 0;
                var itemInfo = new Array(eItemInfo.Max);
                for (var aIndex in res[1][Index]) {
                    itemInfo[itemIndex] = res[1][Index][aIndex];
                    ++itemIndex;
                    if (itemIndex >= eItemInfo.Max) {
                        break;
                    }
                }
                itemList.push(itemInfo);
            }
            for (var Index in res[2]) {
                soulIndex = 0;
                var soulInfo = new Array(eSoulInfo.Max);
                for (var aIndex in res[2][Index]) {
                    soulInfo[soulIndex] = res[2][Index][aIndex];
                    ++soulIndex;
                    if (soulIndex >= eSoulInfo.Max) {
                        break;
                    }
                }
                soulList.push(soulInfo);
            }
            for (var aIndex in res[3][0]) {
                ++attIndex;
                attList.push(res[3][0][aIndex]);
                if (attIndex > eAttInfo.MAX) {
                    break;
                }
            }
            for (var aIndex in res[4][0]) {
                ++magicSoulIndex;
                magicSoulList.push(res[4][0][aIndex]);

                if (magicSoulIndex >= eMagicSoulInfo.MAX) {
                    break;
                }
            }
            for (var Index in res[5]) {
                var petAttList = new Array(eAttInfo.MAX);
                for(var i = 0; i < eAttInfo.MAX; i++) {
                    petAttList[i] = res[5][Index][eAttDBStr[i]];
                }
                var pet = {
                    'petID': res[5][Index]['petID'],
                    'level': res[5][Index]['level'],
                    'exp': res[5][Index]['exp'],
                    'grade': res[5][Index]['grade'],
                    'zhanli': res[5][Index]['zhanli'],
                    'skillList': JSON.parse(res[5][Index]['skillList']),
                    'status': res[5][Index]['status'],
                    'attList': petAttList
                };
                petList.push(pet);
            }

            /***获取竞技场信息*/
            for (var aIndex in res[6][0]) {
                jjcInfo[aIndex] = res[6][0][aIndex];
            }

            var jjcShowInfo = {
                'roleID': jjcInfo['roleID'] || 0,
                'ranking': 0,
                'roleName':'',
                'friendName': '',
                'zhanli': 0,
                'openID': '',
                'picture': '',
                'expLevel': 0,
                'serverName': '',
                'credits': jjcInfo['credits'] || 0,
                'jjcCoin': 0,
                'winNum': jjcInfo['winNum'] || 0,
                'winRate': Math.floor((jjcInfo['winNum']/jjcInfo['totalNum']) * 100) || 0,
                'streaking': 0,
                'maxStreaking': 0,
                'phase': ( '' + jjcInfo['phase'] || '')


            };

            callback(null, playerInfo, itemList, soulList, attList, magicSoulList, petList, jjcShowInfo);
        }
    });
};

Handler.SaveVipInfo = function (roleID, vipInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['vipinfo', roleID, vipInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadVipInfoData = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['vipinfo', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err);
        }
        else {
            var dataList = utils.values(res[0][0]);
            callback(null, dataList);
        }
    });
};

Handler.LoadMineInfoData = function (roleID, callback) {  //魔域查询列表
    var sql = 'CALL sp_load(?,?)';
    var args = ['minesweep', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var dataList = utils.values(res[0][0]);
            callback(null, dataList);
        }
    });
};
Handler.SaveMineInfoData = function (roleID, mineInfo, callback) {  //魔域保存列表
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['minesweep', roleID, mineInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};
Handler.LoadRoleClimbData = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['climb', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        logger.debug('LoadRoleClimbData, res: %j', res[0][0]);

        if (err) {
            callback(err, [], []);
        }
        else {
            var data = {};
            if (!res[0][0]) {
                res[0][0] =
                {
                    "roleID": roleID,
                    "climbData": "[]",
                    "todayData": "[]",
                    "customNum": 0,
                    "historyData": "[]",
                    "weekScore": 0,
                    "fastCarNum": 1
                };
            }
            if (null != res[0][0]) {
                for (var attID in res[0][0]) {
                    data[attID] = res[0][0][attID];
                }
            }
            callback(null, data);
        }
    });
};

Handler.LoadPhyList = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['friendphysical', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        }
        else {
            var Len = res[0].length;
            var dataList = [];
            for (var Num = 0; Num < Len; ++Num) {
                var temp = {};
                var index = 0;
                for (var k in  res[0][Num]) {
                    temp[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= gameConst.eFriPhyInfo.Max) {
                        break;
                    }
                }
                dataList.push(temp);
            }
            callback(null, dataList);
        }
    });
};

Handler.SaveFriPhyInfo = function (roleID, friendID, phyInfo, callback) {
    var sql = 'CALL sp_saveFriPhyInfo(?,?,?)';
    var args = [roleID, friendID, phyInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.refreshPhyList = function (roleID, callback) {
    var sql = 'CALL sp_refreshPhyList(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRoleRune = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['rune', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var runeList = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                }
                runeList.push(temp);
            }
            callback(null, runeList);
        }
    });
};

Handler.SaveRuneInfo = function (roleID, runeInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['rune', roleID, runeInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

module.exports.initRoleClimbInfo = function () {
    var sql = 'CALL sp_initRoleClimbInfo()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            logger.error("module.exports.initRoleClimbInfo error: %s", utils.getErrorMessage(err));
        }
    });
};

Handler.GetRoleIDByName = function (roleName, callback) {
    var sql = 'CALL sp_getRoleIDByName(?)';
    var args = [roleName];
    account_globalClient.query(0, sql, args, function (err, res) {

        if (null != res[0][0]['_roleID']) {
            return callback(err, res[0][0]['_roleID']);
        }
        return callback(err, 0);
    });
};

//登陆礼包获得数据库数据
Handler.LoadLoginGift = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['logingift', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var dataInfo = [];
            var index = 0;
            for (var rIndex in res[0][0]) {
                dataInfo[index] = res[0][0][rIndex];
                index = index + 1;
                if (index >= eLoginGiftInfo.Max) {
                    break;
                }
            }
            callback(null, dataInfo);
        }
    });
};

Handler.SaveLoginGift = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['logingift', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};


Handler.LoadSuitData = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['suit', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        else {
            var suitData = {
                roleID: 0,
                strengthen: [],
                inlay: []
            }
            if (null != res[0][0]) {
                suitData = {
                    roleID: JSON.parse(res[0][0].roleID),
                    strengthen: JSON.parse(res[0][0].strengthen),
                    inlay: JSON.parse(res[0][0].inlay)
                }
            }

            return callback(null, suitData);
        }
    });
};

Handler.SaveSuitInfo = function (roleID, sqlStrInfo, callback) {
    var sqlStr = 'CALL sp_saveList(?,?,?)';
    var args = ['suit', roleID, sqlStrInfo];
    gameClient.query(roleID, sqlStr, args, function (err, res) {
        return callback(err, res);
    });
};

Handler.SaveHonorReward = function (roleID, honorInfo, callback) {  //保存发奖数据
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['chartprize', roleID, honorInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};
Handler.LoadHonorRewardData = function (roleID, callback) {  //初始化发奖数据
    var sql = 'CALL sp_load(?,?)';
    var args = ['chartprize', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        else {
            return callback(null, res[0]);
        }
    });
};

Handler.LoadChartRewardData = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['chartreward', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        else {
            return callback(null, res[0]);
        }
    });
};

Handler.SaveGiftCode = function (GiftCodeID, GiftCode, callback) {
    var sql = 'CALL sp_saveCodeList(?,?,?)';
    var args = ['giftcode', GiftCodeID, GiftCode];
    account_globalClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.getGiftCodeInfo = function (roleID, giftCode, callback) {
    var sql = 'CALL sp_getGiftCode(?,?)';
    var args = ['giftcode', giftCode];
    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        else {
            return callback(null, res);
        }
    });
};
Handler.getGiftCodeRepeat = function (roleID, giftID, callback) {
    var sql = 'CALL sp_loadGiftNum(?,?,?)';
    var args = ['giftusenum', roleID, giftID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return  callback(err, []);
        }
        else {
            return callback(null, res);
        }
    });
};

Handler.SaveGiftCodeRepeat = function (roleID, giftID, sqlStr, callback) {
    var sql = 'CALL sp_saveGiftNum(?,?,?,?)';
    var args = ['giftusenum', roleID, giftID, sqlStr];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.UpdateGiftCode = function (GiftCodeID, callback) {
    var sql = 'CALL sp_updateGiftNum(?,?)';
    var args = ['giftcode', GiftCodeID];
    account_globalClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadRewardMis = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['rewardmis', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            callback(err, '[]');
        }
        else {
            var data;
            if (null == res[0][0]) {
                data = '[]';
            }
            else {
                data = res[0][0]["misState"];
            }
            callback(null, data);
        }
    });
};

Handler.SaveRewardMis = function (roleID, data, callback) {
    var sqlStr = 'CALL sp_saveList(?,?,?)';
    var args = ['rewardmis', roleID, data];
    gameClient.query(roleID, sqlStr, args, function (err, res) {
        return callback(err, res);
    });
};

Handler.LoadActivityCD = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['activitycd', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        else {
            var cdList = {};
            for (var index in res[0]) {
                cdList[res[0][index]['activityID']] = res[0][index]['cd'];
            }
            callback(null, cdList);
        }
    });
};

Handler.SaveActivityCdInfo = function (roleID, data, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['activitycd', roleID, data];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadOperateInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['operateinfo', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
            if (!!err) {
                return callback(err, []);
            }
            return callback(err, res[0]);
        }
    );
};

Handler.SaveOperateInfo = function (roleID, data, callback) {
    var sqlStr = 'CALL sp_saveList(?,?,?)';
    var args = ['operateinfo', roleID, data];
    gameClient.query(roleID, sqlStr, args, function (err, res) {
        return callback(err, res);
    });
};
Handler.LoadMagicIndex = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['askmagic', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(err, res[0]);
    });
};
Handler.LoadMagicOutputInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['magicoutput', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(err, res[0]);
    });
};

Handler.LoadSuccinctInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['soulsuccinct', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        var Len = res[0].length;
        var dataList = [];
        for (var Num = 0; Num < Len; ++Num){
             var temp = {};
            var index = 0;
            var array=[];
            for (var k in  res[0][Num]) {
                index = index + 1;
                array.push(res[0][Num][k]);
                if (index >= gameConst.eSuccinctInfo.Max) {
                    temp[res[0][Num].soulID] = array;
                    break;
                }
            }
            dataList.push(temp);
        }
        return callback(err, dataList);
    });
};

Handler.LoadSuccinctNum = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['succinctinfo', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(err, res[0]);
    });
};

Handler.LoadNoticeInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['noticeinfo', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(err, res[0][0]||{});
    });
};

Handler.SaveMagicIndex = function (roleID, askMagic, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['askmagic', roleID, askMagic];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};
Handler.SaveMagicOutputsInfo = function (roleID, magicOutputInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['magicoutput', roleID, magicOutputInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadPlayerUnionMagic = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['playermagic', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, {});
        }
        else {
            var skillList = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                }
                skillList.push(temp);
            }

            callback(null, skillList);
        }
    });
};

Handler.LoadRoleTempleInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['roletemple', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err);
        }
        else {
            var dataList = utils.values(res[0][0]);
            callback(null, dataList);
        }
    });
};

Handler.SaveSuccinctInfo = function (roleID, soulSuccinct, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['soulsuccinct', roleID, soulSuccinct];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};
Handler.SaveSuccinctNum = function (roleID, succinctNum, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['succinctinfo', roleID, succinctNum];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.SaveNoticeInfo = function (roleID, noticeInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['noticeinfo', roleID, noticeInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};


Handler.SaveRoleTempleInfo = function (roleID, info, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['roletemple', roleID, info];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadExtraVipPoint = function(accountID, callback) {
    var sql = 'SELECT point, serverUid FROM extravippoint WHERE accountID = ' + accountID + ';';

    account_globalClient.query(accountID, sql, [], function (err, res) {
        if (err) {
            return callback(err, errorCodes.SystemWrong);
        }

        if(res.length==0){
            return callback(null, []);
        }else{
            return callback(null, res);
        }
    });
};

/**
 *
 * 获取新手礼包是否可领取
 * chen_s
 *
 * */
Handler.LoadGiftNewInfo = function (roleID,accountId, callback) {
    var sql = 'CALL sp_loadByAccountID(?,?)';
    var args = ['qqmembergift', accountId];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        }
        else {
            var giftlList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eQQMemberGift.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eQQMemberGift.Max) {
                        break;
                    }
                }
                giftlList.push(giftInfo);
            }

            callback(null, giftlList);
        }
    });
};


/**
 *
 * 获取新手礼包是否可领取
 * chen_s
 *
 * */
Handler.SaveGiftInfo = function (accountID,setStr,callback) {
    var sql = 'CALL sp_saveqqgift(?,?,?)';
    var args = ['qqmembergift', accountID, setStr];
    gameClient.query(accountID, sql, args, function (err, res) {
        if (!!err) {
            callback(err, [], 0);
        }
        else {
            callback(null, res);
        }
    });
};

Handler.SavePetsAttribute = function (roleID, dataInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['petsattribute', roleID, dataInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 *
 * 获取求婚信息
 * chen_s
 *
 * */
Handler.LoadToMarryInfo = function (roleID, callback) {
    var self = this;
    var sql = 'CALL sp_loadToMarryInfo(?,?)';
    var args = ['tomarry', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var tomarrylList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eToMarry.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eToMarry.Max) {
                        break;
                    }
                }
                tomarrylList.push(giftInfo);
            }
            var marry = {
                toMarry: tomarrylList
            };
            //同时加载上 结婚信息
            self.LoadMarryInfo(roleID, marry, callback)
        }
    });
};

/**加载结婚信息*/
Handler.LoadMarryInfo = function (roleID, marry, callback) {
    var self = this;
    var sql = 'CALL sp_loadToMarryInfo(?,?)';
    var args = ['marryinfo', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var marryList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eMarry.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eMarry.Max) {
                        break;
                    }
                }
                marryList.push(giftInfo);
            }
            marry['marryInfo'] = marryList

            //同时加载上 宣言信息
            self.LoadMarryXuanYan(roleID, marry, callback)
        }
    });
};

/**
 *
 * 获取宣言信息
 * chen_s
 *
 * */
Handler.LoadMarryXuanYan = function (roleID, marry, callback) {
    if(!marry){
        marry = {};
    }
    var self = this;
    var sql = 'CALL sp_load(?,?)';
    var args = ['xuanyan', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var tomarrylList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eXuanYan.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eXuanYan.Max) {
                        break;
                    }
                }
                tomarrylList.push(giftInfo);
            }
            marry['marryXuanYan'] = tomarrylList;
            //同时加载上 宣言信息
            self.LoadMarryMsgNum(roleID, marry, callback)
        }
    });
};

/**
 *
 * 获取结婚消息数信息
 * chen_s
 *
 * */
Handler.LoadMarryMsgNum = function (roleID, marry, callback) {
    if(!marry){
        marry = {};
    }
    var self = this;
    var sql = 'CALL sp_load(?,?)';
    var args = ['marrymsg', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var tomarrylList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eMarryMsg.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eMarryMsg.Max) {
                        break;
                    }
                }
                tomarrylList.push(giftInfo);
            }
            marry['marryMsg'] = tomarrylList;
            return callback(null, marry);
        }
    });
};


 /** 存储求婚信息 */
Handler.SaveToMarryInfo = function (roleID, toMarryInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['tomarry', roleID, toMarryInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};

/** 存储结婚信息 */
Handler.SaveMarryInfo = function (roleID, marryInfo, callback) {
    var sql = 'CALL sp_saveMarryInfo(?,?,?)';
    var args = ['marryinfo', roleID, marryInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};
/** 存储宣言信息 */
Handler.SaveMarryXuanYan = function (roleID, xuanyan, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['xuanyan', roleID, xuanyan];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};

/** 存储消息数 */
Handler.SaveMarryMsg = function (roleID, marryMsg, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['marrymsg', roleID, marryMsg];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};


/** 求婚玩家离线时 直接存储同意求婚信息 */
Handler.SaveAgreeMarry = function (marryID, roleID, xinWuID, callback) {
    var sql = 'CALL sp_saveAgreeMarry(?,?,?)';
    var args = [marryID, roleID, xinWuID];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};

/** 求婚玩家离线时 直接存储拒绝求婚信息 */
Handler.SaveRefuseMarry = function (fromMarryID, roleID, marryID, callback) {
    var sql = 'CALL sp_saveRefuseMarry(?,?,?)';
    var args = [fromMarryID, roleID, marryID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if(res.length==0){
            return callback(null, []);
        }else{
            return callback(null, res);
        }
    });
};

/** 求婚玩家离线时 直接存储同意协议离婚信息 */
Handler.SaveDivorceMarry = function (marryID, roleID, callback) {
    var sql = 'CALL sp_saveDivorceMarry(?,?)';
    var args = [marryID, roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};

/** 发起离婚玩家离线时 拒绝离婚请求 */
Handler.sp_saveRefuseDivorce = function (marryID, roleID, callback) {
    var sql = 'CALL sp_saveRefuseDivorce(?,?)';
    var args = [marryID, roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};


/** 求婚玩家离线时 直接存储协议离婚信息 */
Handler.SaveDivorceAgree = function (roleID, marryID, callback) {
    var sql = 'CALL sp_saveDivorceAgree(?,?)';
    var args = [roleID, marryID];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
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


Handler.LoadColiseumInfo = function (roleID, callback) {
    var sql = 'CALL sp_loadColiseumInfo(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        } else {
            if(res[0][0]) {
                callback(null, res[0][0]);
            } else {
                callback(err, [], 0);
            }
        }
    });
};

Handler.SaveColiseumInfo = function (roleID, coliseumInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['coliseum', roleID, coliseumInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadArtifactInfo = function (roleID, callback) {
    var sql = 'CALL sp_loadArtifactInfo(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        } else {
            if(res[0][0]) {
                callback(null, res[0][0]);
            } else {
                callback(err, [], 0);
            }
        }
    });
};
Handler.SaveStoryDrak = function (roleID, Info, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['rolestory', roleID, Info];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.LoadStoryDrak = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['rolestory', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err);
        }
        else {
            var dataList = utils.values(res[0][0]);
            callback(null, dataList);
        }
    });
};
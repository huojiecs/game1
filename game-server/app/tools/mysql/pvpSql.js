/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午5:43
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var async = require('async');
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var utilSql = require('./utilSql');
var errorCode = require('../../tools/errorCodes');

var ePlayerInfo = gameConst.ePlayerInfo;

var Handler = module.exports;

Handler.LoadPlayers = function (roleID, lastRoleID, callback) {
    var sql = 'CALL sp_loadPvpInfo(?)';
    var args = [lastRoleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.SavePlayerInfo = function (roleID, playerInfo, callback) {
    var sql = 'CALL sp_saveRoleInfo(?,?,?,?,?,?)';
    var args = [roleID,
                playerInfo[ePlayerInfo.ExpLevel],
                playerInfo[ePlayerInfo.EXP],
                playerInfo[ePlayerInfo.ZHANLI],
                playerInfo[ePlayerInfo.LifeNum],
                playerInfo[ePlayerInfo.LoginTime]
    ];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err);
    });
};

Handler.LoadRival = function (roleID, callback) {
    var sql = 'CALL sp_getRoleInfo(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {

            var details = {};
            var error = null;
            try {
                details.roleID = res[0][0]["roleID"];
                details.name = res[0][0]["name"];
                details.expLevel = res[0][0]["expLevel"];
                details.zhanli = res[0][0]["zhanli"];
                details.APvPAttackNum = res[0][0]["APvPAttackNum"];
                details.APvPAttackedNum = res[0][0]["APvPAttackedNum"];
                details.equips = [];
                for (var i in res[1]) {
                    details.equips.push(res[1][i]["itemTempID"]);
                    details.zhanli += res[1][i]["zhanli"];
                }
                details.souls = [];         // 法宝ID
                for (var i in res[2]) {
                    details.souls.push({"soulID": res[2][i]["soulID"], "soulLevel": res[2][i]["soulLevel"]});
                }
            }
            catch (ex) {
                error = ex;
                logger.info(ex);
            }

            callback(error, details);
        }
    });
};

Handler.AccomplishLose = function (roleID, rZhanli, ownerID, oZhanli, areaWin, rivalState, callback) {
    var sql = 'CALL sp_asyncPvPAccomplishLose(?, ?, ?, ?, ?, ?)';
    var args = [roleID, rZhanli, ownerID, oZhanli, areaWin, rivalState];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        }
        else {
            callback(null, res[0][0]["_gain"]);
        }
    });
};

Handler.SavePvPInfoToDB = function (roleID, pvpInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['asyncpvp', roleID, pvpInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 * 加载玩家pvp相关模块 相关数据
 * @param {string} table 表名
 * @param {number} roleID 玩家id
 * @param {number} index 数据库下标
 * @param {function} callback 回调函数
 * */
Handler.LoadInfoIndex = function (table, roleID, index, callback) {

    utilSql.LoadListIndex(table, roleID, index, function (err, dataList) {
        callback(err, dataList);
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
 * 保存数据到数据ku, 1, 其他很多方法都是 只有表名不同通过传table 可以实现统一接口
 *                  2, insert into 'table' values (), ()...; 方式
 * @param {string} table 表名
 * @param {number} roleID 玩家id, 主键或联合主键之一，
 * @param {string} Info 存储字符串
 * @param {Number} index 存储字符串
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.SaveInfo = function (table, roleID, Info, index, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = [table, roleID, Info];
    if (index == 0) {
        gameClient.query(index, sql, args, function (err, res) {
            callback(err, res);
        });
    }
    else {
        gameClient.query(index, sql, args, function (err, res) {
            callback(err, res);
        });
    }

};

/**
 * 获取 战神榜 rankKey 最大值， 为新进玩家分配rankKey
 *
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.LoadMaxRankKey = function (callback) {
    var sql = 'select MAX(rankKey) maxRankKey from ares';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 * 日志 插入数据看
 *
 * @param {Number} roleID 玩家id
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.SaveAresLog = function (roleID, args, callback) {
    var sql = 'INSERT INTO areslog VALUES(?,?,?,?,?,?,?,?);';

    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

Handler.SaveBossData = function (bossID, bossInfo, callback) {
    var sql = 'CALL sp_saveBoss(?,?)';
    var args = [bossID, bossInfo];
    gameClient.query(bossID, sql, args, function (err, res) {
        if (!!err) {
            logger.error('SaveBoss=%s', err.stack);
            return callback(err, errorCode.SystemWrong);
        }
        callback(null, res);
    });
};

/**查询已有的bossID*/
Handler.LoadBossData = function(callback) {
        var sql = 'CALL sp_loadWorldBossById()';
        var args = [];
        gameClient.query(0,sql, args, function (err, res) {
            callback(err,res[0][0]);
        });
};

Handler.DelBossData = function(callback) {
    var sql = 'CALL sp_deleteWorldBoss()';
    var args = [];
    gameClient.query(0,sql, args, function (err, res) {
        callback(err, res);
    });
};
/**
 * 日志 插入数据看
 *
 * @param {Number} roleID 玩家id
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.SaveSoulPvpLog = function (roleID, args, callback) {
    var sql = 'INSERT INTO soulpvplog VALUES(?,?,?,?,?,?,?,?,?);';

    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 * 获取 邪神混战榜 rankKey 最大值， 为新进玩家分配rankKey
 *
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.LoadSoulMaxRankKey = function (callback) {
    var sql = 'select MAX(rankKey) maxRankKey from soulpvp';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 * 获取 邪神混战榜 rankKey 最大值， 为新进玩家分配rankKey
 *
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.LoadSoulLogMaxKey = function (callback) {
    var sql = 'select MAX(logID) maxKey from soulpvplog';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

/**
 * 获取 redis 信息
 * */
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

Handler.LoadSuccinctInfo = function (roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = ['soulsuccinct', roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        var Len = res[0].length;
        var dataList = [];
        for (var Num = 0; Num < Len; ++Num) {
            var temp = {};
            var index = 0;
            var array = [];
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

/**
 * @Brief: 加载邪神相关信息， 现在只加载了邪神信息， 没有加载邪神洗练信息
 * --------------------------------------------------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callFun 回调函数
 * */
Handler.LoadSoulDetail = function (roleID, callFun) {
    async.series([
                     function (callback) {
                         Handler.LoadRoleSoul(roleID, function (err, soulInfo) {
                             callback(err, soulInfo);
                         });
                     }/*,
                      function (callback) {
                      Handler.LoadSuccinctInfo(roleID, function (err, soulInfo) {
                      callback(err, soulInfo);
                      });
                      }*/
                 ],
                 function (err, res) {
                     callFun(err, res);
                 }
    )
};

Handler.CheckRoleInDB = function(roleID, cb) {
    var sql = 'SELECT count(*) AS exist FROM role WHERE roleID = ?;';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            cb(err, 0);
        }
        else {
            cb(null, res[0]['exist']);
        }
    });
};
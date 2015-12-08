/**
 * Created by xykong on 2014/7/12.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var defaultValues = require('../defaultValues');
var Q = require('q');
require('q-flow');  // extends q
var _ = require('underscore');
var templateConst = require('../../../template/templateConst');

var ePlayerInfo = gameConst.ePlayerInfo;

var Handler = module.exports;

Handler.ChartLoadRoleInfo = function (roleId, lastRoleID, callback) {

    var sql = 'CALL sp_chartLoadRoleInfo(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.ChartLoadAsset = function (roleId, assetId, beginIndex, length, callback) {

    var sql = 'CALL sp_chartLoadAsset(?, ?, ?)';
    var args = [assetId, beginIndex, length];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.ChartLoadHonor = function (roleId, lastRoleID, callback) {
    var sql = 'CALL sp_chartLoadHonor(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
    });
};
Handler.ChartLoadUnion = function (unionID, lastUnionID, callback) {
    var sql = 'CALL sp_chartLoadUnion(?)';
    var args = [lastUnionID];

    gameClient.query(unionID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
    });
};
Handler.ChartClimbScore = function (roleId, lastRoleID, callback) {

    var sql = 'CALL sp_chartLoadClimbScore(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.ChartLoadBlackList = function (callback) {

    var sql = 'CALL sp_chartLoadBlackList(?)';
    var args = [0];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
    });
};

Handler.ChartAddBlackList = function (roleID, callback) {

    var sql = 'CALL sp_chartAddBlackList(?)';
    var args = [roleID];

    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

/**
 *加载玩家jjc 积分
 * @param {number} roleId 玩家id(其实是分库下标)
 * @param {number} lastRoleID 玩家最小ID
 * @param {Function} callback
 * */
Handler.ChartLoadCredits = function(roleId, lastRoleID, callback) {
    var sql = 'select roleID, credits, jjcCoin, winNum, totalNum, streaking, maxStreaking from rolejjc  ' +
              'WHERE roleID > ? ORDER BY roleID ASC LIMIT 1000 ;';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function(err, res) {
        if(!!err || res.length == 0) {
            return callback(err, []);
        }
        return callback(null, res);
    });
};

Handler.ChartLoadAwardScore = function (roleId, lastRoleID, callback) {
    var sql = 'CALL sp_chartLoadNiuDanScore(?,?)';
    //var args = [lastRoleID, defaultValues.operateNiuDanID];
    //抽奖排行榜采用活动类型作为参数
    var args = [lastRoleID, templateConst.tOperateType.OPERATE_TYPE_2];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
    });
};

Handler.ChartLoadRecharge = function (roleId, lastRoleID, callback) {
    var sql = 'CALL sp_chartLoadRecharge(?,?)';
    //var args = [lastRoleID, defaultValues.operate7RechargeID];
    //充值排行榜采用活动类型作为参数
    var args = [lastRoleID, templateConst.tOperateType.OPERATE_TYPE_5];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};


Handler.ChartLoadSoul = function (roleId, lastRoleID, callback) {

    var sql = 'CALL sp_chartLoadSoul(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

/**
 * 获取 marry 婚姻 姻缘值排行榜相关信息:
 *  1启动服务器时调用
 *  2用于跟新redis 数据
 *
 *  @param {Number} roleID  玩家id
 *  @param {Number} beginIndex mysql limit 开始下标
 *  @param {Number} length  每次获取记录长度
 *  @param {Function} callback
 *  @api public
 * */
Handler.ChartLoadMarryScore = function (roleId, lastRoleID, callback) {

    var sql = 'CALL sp_chartLoadMarryInfo(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

/**
 * 获取 ares 战神榜相关信息:
 *  1启动服务器时调用
 *  2用于跟新redis 数据
 *
 *  @param {Number} roleID  玩家id
 *  @param {Number} beginIndex mysql limit 开始下标
 *  @param {Number} length  每次获取记录长度
 *  @param {Function} callback
 *  @api public
 * */
Handler.ChartLoadAres = function (roleId, lastRoleID, callback) {

    var sql = 'CALL sp_chartLoadAresInfo(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};


/**
 * 获取 soul pvp 邪神竞技场相关信息:
 *  1启动服务器时调用
 *  2用于跟新redis 数据
 *
 *  @param {Number} roleID  玩家id
 *  @param {Number} beginIndex mysql limit 开始下标
 *  @param {Number} length  每次获取记录长度
 *  @param {Function} callback
 *  @api public
 * */
Handler.ChartLoadSoulPvp = function (roleId, lastRoleID, callback) {

    var sql = 'CALL sp_chartLoadSoulPvpInfo(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.ChartLoadPet = function(roleId, lastRoleID, callback) {
    var sql = 'CALL sp_chartLoadPet(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }

        return callback(null, res[0]);
    });
};

Handler.ChartLoadStory = function (roleId, lastRoleID, callback) {
    var sql = 'CALL sp_chartLoadStory(?)';
    var args = [lastRoleID];

    gameClient.query(roleId, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, []);
        }
        return callback(null, res[0]);
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
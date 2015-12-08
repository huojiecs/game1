/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-10
 * Time: 下午5:20
 * To change this template use File | Settings | File Templates.
 */
var gameClient = require('./gameClient');
var gameConst = require('../constValue');
var OccupantInfo = gameConst.eOccupantInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var eItemInfo = gameConst.eItemInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eAttInfo = gameConst.eAttInfo;
var eMagicSoulInfo = gameConst.eMagicSoulInfo;
var eWedding = gameConst.eWedding;
var eMarryInfo = gameConst.eMarryInfo;
var eMarryGift = gameConst.eMarryGift;
var eXuanYan = gameConst.eXuanYan;
var eMarryLog = gameConst.eMarryLog;
var utilSql = require('./utilSql');

var Handler = module.exports;

Handler.SaveOccupantInfo = function (occInfo, callback) {
    var sql = 'CALL sp_OccupantInfoSave(?)';
    var args = [occInfo];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};


Handler.LoadOccupantInfo = function (callback) {
    var sql = 'CALL sp_OccupantInfoLoad()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var List = [];
            for (var aIndex in res[0]) {
                var temp = [];
                var index = 0;
                for (var rIndex in res[0][aIndex]) {
                    temp[index] = res[0][aIndex][rIndex];
                    index = index + 1;
                    if (index >= OccupantInfo.Max) {
                        break;
                    }
                }
                List.push(temp);
            }
            callback(null, List);
        }
    });
};

Handler.GetRoleInfoByName = function (roleID, callback) {
    var sql = 'CALL sp_getRoleInfoByName(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], [], [], [], []);
        }
        else {
            var itemList = [];
            var soulList = [];
            var attList = [];
            var magicSoulList = [];
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
            callback(null, playerInfo, itemList, soulList, attList, magicSoulList);
        }
    });
};


/** 启动时候加载婚礼预约列表 ,结婚信息*/
Handler.loadWedding = function (roleID, callback) {
    var self = this;
    var sql = 'CALL sp_loadList(?)';
    var args = ['wedding'];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var weddingList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eWedding.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eWedding.Max) {
                        break;
                    }
                }
                weddingList.push(giftInfo);
            }

            //同时加载上 结婚信息
            self.loadMarryInfo(roleID, weddingList, callback)
        }
    });
};

/** 启动时候加载结婚信息列表 */
Handler.loadMarryInfo = function (roleID, weddingList, callback) {
    var self = this;
    var sql = 'CALL sp_loadList(?)';
    var args = ['marryinfo'];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var marryList = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eMarryInfo.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eMarryInfo.Max) {
                        break;
                    }
                }
                marryList.push(giftInfo);
            }
            var resList = {
                wedding:weddingList,
                marryInfo:marryList
            }
            //同时加载上 结婚信息
            self.loadMarryGift(roleID, resList, callback)
        }
    });
};


/** 启动时候加载爱的礼物信息列表 */
Handler.loadMarryGift = function (roleID, resList, callback) {
    var self = this;
    var sql = 'CALL sp_loadList(?)';
    var args = ['marrygift'];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var marryGift = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var giftInfo = new Array(eMarryGift.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    giftInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eMarryGift.Max) {
                        break;
                    }
                }
                marryGift.push(giftInfo);
            }
            resList['marryGift'] = marryGift;
            //同时加载上 结婚信息
            self.loadMarryXuanYan(roleID, resList, callback)

        }
    });
};

/** 启动时候加载爱情宣言信息 */
Handler.loadMarryXuanYan = function (roleID, resList, callback) {
    var self = this;
    var sql = 'CALL sp_loadList(?)';
    var args = ['xuanyan'];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var marryXuanYan = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var xuanYna = new Array(eXuanYan.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    xuanYna[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eXuanYan.Max) {
                        break;
                    }
                }
                marryXuanYan.push(xuanYna);
            }
            resList['xuanYan'] = marryXuanYan;
            //同时加载上 夫妻日志
            self.loadMarryLog(roleID, resList, callback)

        }
    });
};

/** 启动时候加载夫妻日志信息列表 */
Handler.loadMarryLog = function (roleID, resList, callback) {
    var self = this;
    var sql = 'CALL sp_loadList(?)';
    var args = ['marrylog'];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err, [], 0);
        }
        else {
            var marryLog = [];
            var Len = res[0].length;
            for (var Num = 0; Num < Len; ++Num) {
                var log = new Array(eMarryLog.Max);//表字段数
                var index = 0;
                for (var k in  res[0][Num]) {
                    log[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eMarryLog.Max) {
                        break;
                    }
                }
                marryLog.push(log);
            }
            resList['marryLog'] = marryLog;
            return callback(err, resList);

        }
    });
};

/** 存储 婚礼预定列表 */
Handler.UpdateWedding = function (weddingInfo, callback) {
    var sql = 'CALL sp_updateMarry(?,?)';
    var args = ['wedding',weddingInfo];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

/** 存储 爱的礼物列表 */
Handler.UpdateMarryGift = function (weddingInfo, callback) {
    var sql = 'CALL sp_save(?,?)';
    var args = ['marrygift',weddingInfo];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

/** 存储 夫妻日志列表 */
Handler.UpdateMarryLog = function (marryLog, callback) {
    var sql = 'CALL sp_updateMarry(?,?)';
    var args = ['marrylog',marryLog];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

/** 存储 更新玩家消息数量 */
Handler.UpdateMarryMsg = function (roleID, callback) {
    var sql = 'CALL sp_updateMarryMsg(?)';
    var args = [roleID];
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
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

/** 删号时删除玩家结婚信息 */
Handler.DeleteRoleForMarry = function (roleID, callback) {
    var sql = 'CALL sp_delRoleForMarry(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        return callback(err, res);
    });
};
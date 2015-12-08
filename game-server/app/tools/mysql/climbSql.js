/**
 * Created by Administrator on 14-5-22.
 */



var gameClient = require('./gameClient');
var gameconst = require('../../tools/constValue')
var eChartClimbInfo = gameconst.eChartClimbInfo;
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var async = require('async');
var errorCodes = require('../../tools/errorCodes');
var Handler = module.exports;
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var utils = require('../../tools/utils');
Handler.LoadRoleData = function (roleID, callback) {
    var sql = "CALL sp_loadRoleData(?)";
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, {});
        }
        else {
            var index = 0;
            var climbInfo = new Array(3);
            for (var index in res[0][0]) {
                climbInfo[index] = res[0][0][index];
                +index;
            }
            return callback(null, climbInfo);
        }
    });
}

Handler.refreshChartClimb = function (callback) {
    var sql = "CALL sp_chartClimb()";
    var args = [];
    gameClient.query(0, sql, args, function (err) {
        callback(err);
    })
}

Handler.refreshChartClimbFriend = function (roleID, callback) {
    var sql = "CALL sp_chartClimbFriend(?)";
    var args = [roleID];
    gameClient.query(0, sql, args, function (err) {
        callback(err);
    })
}
/*
Handler.saveChartClimb = function (roleID, strInfo, callback) {
    var sql = "CALL sp_saveClimbForChart(?,?)";
    var args = [roleID, strInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    })
}*/

//单区排行
Handler.GetClimbChartList = function (roleID, callback) {
    var sql = 'CALL sp_chartclimbList(?)';
    var args = [roleID];
    async.waterfall([
//        function (cb) {
//            var sql = "CALL sp_chartClimb()";
//            var args = [];
//            var sucess = "";
//            logger.warn('before roleID, sql, args:', roleID, sql, args);
//            gameClient.query(sql, args, function (err) {
//                logger.warn('after roleID, sql, args:', roleID, sql, args);
//                if (!!err) {
//                    return callback(err, []);
//                }
//                cb(err, sucess);
//            })
//        },
                        function (cb) {
                            logger.warn('before roleID, sql, args:', roleID, sql, args);
                            gameClient.query(0, sql, args, function (err, res) {
                                logger.warn('after roleID, sql, args:', roleID, sql, args);
                                if (!!err) {
                                    return callback(err, []);
                                }

                                if (!res || !res[0] || res[0].length === 0) {
                                    return callback(errorCodes.SystemBusy);
                                }

                                var condition = "";
                                for (var index in res[0]) {
                                    condition += "'" + res[0][index].roleID + "',";
                                }
                                condition = condition.substring(0, condition.length - 1);
                                cb(null, condition);
                            })
                        },
                        function (condition, cb) {
                            var sqlar = 'CALL sp_queryAccountIDAndRoleID(?)'; //查询database_game
                            var argsar = [condition];
                            logger.warn('before roleID, sql, args:', roleID, sqlar, argsar);
                            account_globalClient.query(0, sqlar, argsar, function (err, res) {
                                logger.warn('after roleID, sql, args:', roleID, sqlar, argsar);
                                if (!!err) {
                                    return callback(err, []);
                                }
                                var accountIDArr = "";
                                var accountList = [];
                                for (var index in res[0]) {
                                    accountIDArr += "'" + res[0][index].accountID + "',";
                                    var account = {
                                        accountID: res[0][index].accountID,
                                        roleID: res[0][index].roleID
                                    }
                                    accountList.push(account);
                                }
                                accountIDArr = accountIDArr.substring(0, accountIDArr.length - 1);
                                cb(null, accountIDArr, accountList);
                            })
                        },
                        function (accountIDArr, accountList, cb) {
                            var sqlap = 'CALL sp_queryAccountIDAndOpenID(?)';  //查询database_account
                            var argsap = [accountIDArr];
                            logger.warn('before roleID, sql, args:', roleID, sqlap, argsap);
                            account_globalClient.query(0, sqlap, argsap, function (err, res) {
                                logger.warn('after roleID, sql, args:', roleID, sqlap, argsap);
                                if (!!err) {
                                    return callback(err, []);
                                }
                                var dataList = [];
                                for (var index in res[0]) {
                                    var data = {
                                        accountID: res[0][index].accountID,
                                        openID: res[0][index].openID
                                    }
                                    dataList.push(data);
                                }

                                var openIDList = [];
                                for (var indexd in dataList) {
                                    for (var indexa in accountList) {
                                        if (dataList[indexd].accountID == accountList[indexa].accountID) {
                                            var openID = {
                                                roleID: accountList[indexa].roleID,
                                                openID: dataList[indexd].openID
                                            }
                                            openIDList.push(openID);
                                        }
                                    }
                                }
                                cb(null, openIDList);
                            })
                        },
                        function (openIDList, cb) {
                            logger.warn('before roleID, sql, args:', roleID, sql, args);
                            gameClient.query(0, sql, args, function (err, res) {
                                logger.warn('after roleID, sql, args:', roleID, sql, args);
                                if (!!err) {
                                    return callback(err, []);
                                }
                                else {
                                    var tempList = [];
                                    for (var index in res[0]) {
                                        for (var a in openIDList) {
                                            if (res[0][index].roleID == openIDList[a].roleID) {
                                                var data = {
                                                    chart: res[0][index].id,
                                                    roleID: res[0][index].roleID,
                                                    expLevel: res[0][index].expLevel,
                                                    friendName: '',
                                                    roleName: res[0][index].roleName,
                                                    score: res[0][index].score,
                                                    cengNum: res[0][index].cengNum,
                                                    openID: openIDList[a].openID
                                                }
                                                tempList.push(data);
                                                break;
                                            }
                                        }
                                    }
                                    callback(null, tempList);
                                }
                            });
                        }
                    ], function (err) {
        if (!!err) {
            logger.error("climb chart of single server error: %s", utils.getErrorMessage(err));
            return callback(err);
        }
        return callback(null);
    });
    return;
};


//好友排行
Handler.GetClimbChartFriendList = function (roleID, callback) {
    var sql = 'CALL sp_chartclimbFriendList(?)';
    var args = [0];//0是type,0：查询数据库里所有好友   1：取前3名周末发奖励
    var sqlgame = 'CALL sp_getMyAccountIDByRoleID(?)';
    var argsgame = [roleID];
    async.waterfall([
                        function (cb) {
                            gameClient.query(0, sqlgame, argsgame, function (err, res) {
                                if (!!err) {
                                    return callback(err, []);
                                }
                                var account = {
                                    roleID: 0,
                                    accountID: 0
                                };
                                for (var index in res[0]) {
                                    account = {
                                        roleID: res[0][index].roleID,
                                        accountID: res[0][index].accountID
                                    };
                                }
                                cb(null, account);
                            })
                        },
                        function (account, cb) {
                            var sqlAccount = 'CALL sp_getMyOpenID(?)';
                            var argsAccount = [account.accountID];
                            accountClient.query(account.accountID, sqlAccount, argsAccount, function (err, res) {
                                if (!!err) {
                                    return callback(err, []);
                                }
                                var data = {
                                    accountID: 0,
                                    roleID: account.roleID,
                                    openID: 0
                                };
                                for (var index in res[0]) {
                                    data = {
                                        accountID: res[0][index].accountID,
                                        roleID: account.roleID,
                                        openID: res[0][index].openID
                                    }
                                }
                                cb(null, data);
                            })
                        },
                        function (data, cb) {
                            var tempRoleID = data.roleID;
                            var tempOpenID = data.openID;
                            gameClient.query(tempRoleID, sql, args, function (err, res) {
                                if (!!err) {
                                    return callback(err, []);
                                }

                                for (var i = 0; i < 1; ++i) {
                                    var tempList = [];
                                    for (var index in res[i]) {
                                        if (res[i][index].roleID == tempRoleID) {
                                            var data = {
                                                chart: res[i][index].id,
                                                roleID: res[i][index].roleID,
                                                expLevel: res[i][index].expLevel,
                                                friendName: res[i][index].friendName,
                                                roleName: res[i][index].roleName,
                                                score: res[i][index].score,
                                                cengNum: res[i][index].cengNum,
                                                openID: tempOpenID
                                            }
                                        } else {
                                            var data = {
                                                chart: res[i][index].id,
                                                roleID: res[i][index].roleID,
                                                expLevel: res[i][index].expLevel,
                                                friendName: res[i][index].friendName,
                                                roleName: res[i][index].roleName,
                                                score: res[i][index].score,
                                                cengNum: res[i][index].cengNum,
                                                openID: res[i][index].openID
                                            }
                                        }
                                        tempList.push(data);
                                    }
                                }
                                callback(null, tempList);
                            });
                        }
                    ], function (callback) {
        return callback(errorCodes.SystemWrong);
    });

};
/*
Handler.GetClimbChartID = function (roleID, callback) {
    //chartID,myScore,myCengNum
    var sql = 'CALL sp_ChartClimbGetID(?)';
    var args = [roleID];
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            callback(err, 0);
        }
        else {
            if (res[0].length == 0) {
                callback(null, 0);
            } else {
                callback(null, res[0][0].id, res[0][0].score, res[0][0].cengNum);
            }
        }
    })
};
*/
/*
Handler.GetClimbFriendChartID = function (roleID, callback) {
    //chartID,myScore,myCengNum
    var sql = 'CALL sp_ChartClimbFriendGetID(?)';
    var args = [roleID];sp_ChartClimbGetID
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            callback(err, 0);
        }
        else {
            if (res[0].length == 0) {
                callback(null, 0);
            } else {
                callback(null, res[0][0].id, res[0][0].score, res[0][0].cengNum);
            }
        }
    })
};
*/

Handler.SaveClimbInfo = function (roleID, climbInfo, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = ['climb', roleID, climbInfo];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};


//发送爬塔好友排行奖励
Handler.takeRewardOfFriend = function (callback) {
    var self = this;
    var sql = 'CALL sp_chartclimbFriendList(?)';
    var args = [1];//0是type,0：查询数据库里所有好友   1：取前3名周末发奖励
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            callback(err, []);
        }
        else {
            var num = 0;
            for (var i = 0; i < 1; ++i) {
                var tempList = [];
                for (var index in res[i]) {
                    var pmObj = {
                        id: 0,
                        roleID: 0,
                        rewardNum: 0
                    }
                    pmObj.id = res[i][index].id;
                    pmObj.roleID = res[i][index].roleID;
                    switch (res[i][index].id) {
                        case 1:
                            num = 3000;
                            break;
                        case 2:
                            num = 2000;
                            break;
                        case 3:
                            num = 1000;
                            break;
                        default:
                            num = 0;
                    }
                    pmObj.rewardNum = num;

                    tempList.push(pmObj);
                }
            }
            callback(null, tempList);
        }
    })
};

//发送爬塔单区排行奖励
Handler.takeRewardOfSingleZone = function (callback) {
    var self = this;
    var sql = 'CALL sp_chartclimbFriendList(?)';
    var args = [2];//0是type,0：查询数据库里所有好友   1：取前3名周末发奖励 2  爬塔单区排行奖励前1000名
    gameClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            callback(err, []);
        }
        else {
            var num = 0;
            for (var i = 0; i < 1; ++i) {
                var tempList = [];
                for (var index in res[i]) {
                    var pmObj = {
                        id: 0,
                        roleID: 0,
                        rewardNum: 0
                    }
                    pmObj.id = res[i][index].id;
                    pmObj.roleID = res[i][index].roleID;
                    var myChart = res[i][index].id;
                    if (myChart == 1) {
                        num = 100;
                    } else if (myChart == 2) {
                        num = 60;
                    } else if (myChart == 3) {
                        num = 30;
                    } else if (myChart >= 4 && myChart <= 100) {
                        num = 10;
                    } else {
                        num = 5;
                    }
                    pmObj.rewardNum = num;
                    tempList.push(pmObj);
                }
            }
            callback(null, tempList);
        }
    })
};

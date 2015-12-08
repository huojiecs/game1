/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-28
 * Time: 下午2:39
 * To change this template use File | Settings | File Templates.
 */
var gameClient = require('./gameClient');
var gameConst = require('../constValue');
var defaultValues = require('../defaultValues');
var eMailInfo = gameConst.eMailInfo;
var eChartType = gameConst.eChartType;
var eChartZhanliInfo = gameConst.eChartZhanliInfo;
var errorCodes = require('../../tools/errorCodes');

var Handler = module.exports;

Handler.LoadMailList = function (roleID, callback) {
    var sql = 'CALL sp_mailLoadList(?)';
    var args = [roleID];

    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        }
        else {
            var Len = res[0].length;
            var dataList = [];
            for (var Num = 0; Num < Len; ++Num) {
                var temp = new Array(eMailInfo.Max);
                var index = 0;
                for (var k in  res[0][Num]) {
                    temp[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eMailInfo.Max) {
                        break;
                    }
                }
                dataList.push(temp);
            }
            callback(null, dataList);
        }
    });
};

Handler.SendMail = function (mailDetail, callback) {
    // roleID, sendID, sendName, subject, content, mailType, itemList
    var sql = 'CALL sp_mailSend(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    var args = [mailDetail.recvID, mailDetail.roleID, mailDetail.sendName, mailDetail.subject, mailDetail.content,
                mailDetail.mailType,mailDetail.sendUid,
                mailDetail.items[0][0], mailDetail.items[0][1],
                mailDetail.items[1][0], mailDetail.items[1][1],
                mailDetail.items[2][0], mailDetail.items[2][1],
                mailDetail.items[3][0], mailDetail.items[3][1],
                mailDetail.items[4][0], mailDetail.items[4][1]
    ];

    gameClient.query(mailDetail.recvID, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }

        var result = res[0][0]['_result'];
        var mailID = res[0][0]['_mailID'];
        return callback(null, result, mailID);
    });
};

Handler.SetMailState = function (roleID, mailID, mailState, callback) {
    var sql = 'CALL sp_mailSetState(?,?,?)';
    var args = [roleID, mailID, mailState];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            callback(null, 0);
        }
    });
};

Handler.DelMail = function (roleID, mailID, callback) {
    var sql = 'CALL sp_mailDel(?, ?)';
    var args = [roleID, mailID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            callback(null, 0);
        }
    });
};

Handler.GetMailItem = function (roleID, mailID, callback) {
    var sql = 'CALL sp_mailGetItem(?,?)';
    var args = [roleID, mailID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, errorCodes.SystemWrong);
        }
        else {
            callback(null, 0);
        }
    });
};
/*
Handler.RefreshChart = function (callback) {
    var sql = 'CALL sp_chartAllRefresh()';
    var args = [];
    gameClient.query(0, sql, args, function (err) {
        callback(err);
    });
};*/
/*
Handler.RefreshRongyuChart = function (callback) {
    var sql = 'CALL sp_chartRongyuAllRefresh()';
    var args = [];
    gameClient.query(0, sql, args, function (err) {
        callback(err);
    });
};
*/
//发送荣誉排行奖励
Handler.takeRewardOfHonor = function (callback) {
    var self = this;
    var sql = 'CALL sp_chartrongyuList()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var objList = [];
            for (var i = 0; i < eChartType.Max; ++i) {
                for (var index in res[i]) {
                    var tempInfo = [];
                    var sum = 0;
                    for (var aIndex in  res[i][0]) {
                        var id = res[i][index].id;
                        var roleID = res[i][index].roleID;
                        var lingliNum = 0;
                        if (id == 1) {
                            lingliNum = 1000;
                        } else if (1 < id && id <= 10) {
                            lingliNum = 800;
                        } else if (10 < id && id <= 50) {
                            lingliNum = 500
                        } else if (50 < id && id <= 100) {
                            lingliNum = 300;
                        } else if (100 < id && id <= 500) {
                            lingliNum = 200;
                        } else if (500 < id && id <= 1000) {
                            lingliNum = 150;
                        } else if (1000 < id && id <= 2000) {
                            lingliNum = 100;
                        } else {
                            lingliNum = 50;
                        }
                        ++sum;
                        var pmObj = {
                            id: 0,
                            roleID: 0,
                            lingliNum: 0
                        };
                        pmObj.id = id;
                        pmObj.roleID = roleID;
                        pmObj.lingliNum = lingliNum;
                        if (sum == 1) {
                            break;
                        }
                    }
                    objList.push(pmObj);
                }

            }
            callback(null, objList);
        }
    })
};


//荣誉排行
Handler.GetRongyuChartList = function (callback) {
    var sql = 'CALL sp_chartrongyuList()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var DataList = [];
            for (var i = 0; i < eChartType.Max; ++i) {
                var tempList = [];
                for (var index in res[i]) {
                    var tempInfo = [];
                    var sum = 0;
                    for (var aIndex in  res[i][index]) {
                        tempInfo.push(res[i][index][aIndex])
                        ++sum;
                        if (sum == eChartRongyuInfo.Max) {
                            break;
                        }
                    }
                    tempList.push(tempInfo);
                }
                DataList.push(tempList);
            }
            callback(null, DataList);
        }
    });
};

/*
Handler.GetChartList = function (callback) {
    var sql = 'CALL sp_chartList()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var DataList = [];
            for (var i = 0; i < eChartType.Max; ++i) {
                var tempList = [];
                for (var index in res[i]) {
                    var tempInfo = [];
                    var sum = 0;
                    for (var aIndex in  res[i][index]) {
                        tempInfo.push(res[i][index][aIndex])
                        ++sum;
                        if (sum == eChartZhanliInfo.Max) {
                            break;
                        }
                    }
                    tempList.push(tempInfo);
                }
                DataList.push(tempList);
            }
            callback(null, DataList);
        }
    });
};
*/
/*
Handler.GetChartID = function (roleID, chartType, callback) {
    var sql = 'CALL sp_ChartGetID(?,?)';
    var args = [roleID, chartType];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, 0);
        }
        else {
            if (res[0].length == 0) {
                callback(null, 0);
            }
            else {
                callback(null, res[0][0].id);
            }
        }
    });
};
*/
/*
//荣誉排行
Handler.GetRongyuChartID = function (roleID, chartType, callback) {
    var sql = 'CALL sp_ChartGetID(?,?)';
    var args = [roleID, 2];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, 0);
        }
        else {
            if (res[0].length == 0) {
                callback(null, 0);
            } else {
                callback(null, res[0][0].id);
            }
        }
    })

};
*/
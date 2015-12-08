/**
 * Created by Administrator on 14-1-21.
 */

var pomelo = require('pomelo');
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var logClient = require('./logClient');
var eFirstKillInfo = gameConst.eFirstKillInfo;

var Handler = module.exports;

Handler.LoadNoticeInfo = function (callback) {
    var sql = 'CALL sp_noticeInfoLoad()';
    var args = [];
    gameClient.query(0, sql, args, function (err, res) {
        if (err) {
            callback(err, [], 0);
        }
        else {
            var Len = res[0].length;
            var tgList = [];
            for (var Num = 0; Num < Len; ++Num) {
                var tgInfo = new Array(eFirstKillInfo.Max);
                var index = 0;
                for (var k in  res[0][Num]) {
                    tgInfo[index] = res[0][Num][k];
                    index = index + 1;
                    if (index >= eFirstKillInfo.Max) {
                        break;
                    }
                }
                tgList.push(tgInfo);
            }
            callback(null, tgList, Len);
        }
    });
};

Handler.NoticeInfoAdd = function (noticeInfo, callback) {
    var sql = 'CALL sp_noticeInfoAdd(?,?,?)';
    var args = [];
    for (var i = 0; i < eFirstKillInfo.Max; ++i) {
        args.push(noticeInfo[i]);
    }
    gameClient.query(0, sql, args, function (err, res) {
        callback(err, res);
    });
};

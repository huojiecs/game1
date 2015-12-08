/**
 * Created by Administrator on 14-3-28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var csSql = require('../../../tools/mysql/csSql');
var utils = require('../../../tools/utils');
var playerManager = require('../../../ps/player/playerManager');
var offlinePlayerManager = require('../../../ps/player/offlinePlayerManager');
var globalFunction = require('../../../tools/globalFunction');
var utilSql = require('../../../tools/mysql/utilSql');

var pvpSql = require('../../../tools/mysql/pvpSql');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.GiveFriPhysical = function (roleID, friendID, callback) {
    logger.info('ps玩家 GiveFriPhysical:' + friendID);
    var self = this;
    var csID = playerManager.GetPlayerCs(friendID);
    if (csID) {     //好友在线
        pomelo.app.rpc.cs.phyRemote.GiveFriPhysical(null, csID, friendID, roleID, utils.done);
    }
    else {      //好友离线
        //首先更具ID获取好友体力列表，如果有该赠送信息则更新，没有则插入
        var friendPhyList = [];
        csSql.LoadPhyList(friendID, function (err, dataList) {
            if (!!err) {
                logger.error('加载玩家好友出错%j', err.stack);
            }
            else {
                for (var i in dataList) {
                    friendPhyList.push(dataList[i]);
                }
                var temp;
                for (var index in friendPhyList) {
                    if (roleID == friendPhyList[index]['1']) {
                        temp = friendPhyList[index];
                        break;
                    }
                }
                var phyInfo;
                if (null == temp) { //当列表中没有该好友的信息时
                    temp = {};
                    temp['0'] = friendID;
                    temp['1'] = roleID;
                    temp['2'] = 1;          //领取标志
                    temp['3'] = 0;          //赠送标志
                    temp['4'] = utilSql.DateToString(new Date());          //好友赠送个给我的最新时间
                    friendPhyList.push(temp);      //将最新数据插入到列表
                    phyInfo = '(' + friendID + ',' + roleID + ',' + 1 + ',' + 0 + ',' + '\''
                              + utilSql.DateToString(new Date(temp['4'])) + '\'' + ')';
                }
                else {  //当列表中存在该好友信息时
                    temp['2'] = 1;          //赠送标志
                    phyInfo = '(' + friendID + ',' + roleID + ',' + 1 + ',' + temp['3'] + ',' + '\''
                              + utilSql.DateToString(new Date(temp['4'])) + '\'' + ')';
                }
                csSql.SaveFriPhyInfo(friendID, roleID, phyInfo, function (err, res) {       //将数据更新到数据库
                    if (!!err) {
                        logger.error('离线玩家获取好友赠送体力存档出现错误%j', err.stack);
                    }
                });
            }
        });
    }
    return callback();
};

handler.DelFriPhysical = function (roleID, friendID, callback) {    //当删除好友后删除数据库中的对应数据
    logger.info('ps玩家 DelFriPhysical:' + roleID);
    var self = this;
    var csID = playerManager.GetPlayerCs(roleID);
    //当好友离线时直接将赠送信息删除
    var phyInfo = '';
    csSql.SaveFriPhyInfo(roleID, friendID, phyInfo, function (err, res) {       //将数据更新到数据库
        if (!!err) {
            logger.error('删除好友体力信息出错%j', err.stack);
        }
    });
    return callback();
};

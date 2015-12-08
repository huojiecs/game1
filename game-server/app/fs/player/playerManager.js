/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-1-15
 * Time: 下午5:35
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Player = require('./player');
var gameConst = require('../../tools/constValue');
var ePlayerInfo = gameConst.ePlayerInfo;

var Handler = module.exports;

Handler.Init = function () {
    this.playerList = {};
    this.playerFriList = {};
};

Handler.GetPlayer = function (roleID) {
    return this.playerList[roleID];
};

Handler.AddPlayer = function (roleID, csID, uid, sid, details) {
    this.playerList[roleID] = new Player(roleID, csID, uid, sid, details);
    this.playerFriList[roleID] = {
        canGetFriendTime: new Date().getTime(),
        friendList: []
    };
};

Handler.DeletePlayer = function (roleID) {
    delete this.playerList[roleID];
    delete this.playerFriList[roleID];
};

Handler.GetFriendList = function(roleID) {
    return this.playerFriList[roleID];
};

Handler.SetFriendList = function(roleID, timeNum, friendList) {
    if (null == this.playerFriList[roleID]) {
        this.playerFriList[roleID] = {
            canGetFriendTime: 0,
            friendList: []
        };
    }
    this.playerFriList[roleID].canGetFriendTime = timeNum;
    this.playerFriList[roleID].friendList = friendList;
};

/**
 * @Brief: 本地好友添加
 * ------------------
 *
 * @param {Number} roleID 好友id
 *
 * */
Handler.reSetFriendListTime = function(roleID) {

    if (!!this.playerFriList[roleID]) {
        this.playerFriList[roleID].canGetFriendTime = new Date().getTime();
    }
};
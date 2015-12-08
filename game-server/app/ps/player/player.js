/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-26
 * Time: 下午1:48
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var messageService = require('../../tools/messageService');
var ePlayerInfo = gameConst.ePlayerInfo;
var ePlayerState = gameConst.ePlayerState;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.session = null;
    this.csServerID = null;
    this.roomID = -1;
    this.playerState = ePlayerState.NONE;
    this.playerInfo = new Array(ePlayerInfo.MAX);
    for (var i = 0; i < ePlayerInfo.MAX; ++i) {
        this.playerInfo[i] = 0;
    }
};

var handler = Handler.prototype;

handler.SetRoomID = function (roomID) {
    this.roomID = roomID;
};

handler.GetRoomID = function () {
    return this.roomID;
};

handler.SetPlayerState = function (gameState) {
    this.playerState = gameState;
};

handler.GetPlayerState = function () {
    return this.playerState;
};

handler.SetCsServerID = function (csServerID) {
    this.csServerID = csServerID;
};

handler.GetCsServerID = function () {
    return this.csServerID;
};

handler.IsTrueIndex = function (Index) {
    if (Index >= 0 && Index < ePlayerInfo.MAX) {
        return true;
    }
    return false;
};

handler.CreatePlayer = function (session, playerInfo) {
    this.session = session;
    this.playerInfo = playerInfo;
};

handler.SetPlayerInfo = function (Index, Value) {
    if (this.IsTrueIndex(Index)) {
        this.playerInfo[Index] = Value;
    }
};

handler.GetPlayerInfo = function (Index) {
    if (this.IsTrueIndex(Index)) {
        return this.playerInfo[Index];
    }
    return 0;
};

handler.GetSession = function () {
    return this.session;
};

handler.update = function (nowTime) {
};

handler.sendMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.session.uid, sid: this.session.serverId}, route, msg);
};

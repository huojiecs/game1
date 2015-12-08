/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-29
 * Time: 下午4:14
 * To change this template use File | Settings | File Templates.
 */
var messageService = require('../../tools/messageService');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.Init = function (frontendId, uid, roleID, name, openID, accountType) {
    this.frontendId = frontendId;
    this.uid = uid;
    this.friendList = [];
    this.roleID = roleID;
    this.name = name;
    this.groupID = 0;
    this.openID = openID;
    this.accountType = accountType;
    this.roomInfo = {
        roomID: 0,
        customID: 0
    };
};

handler.SetRoomInfo = function (roomInfo) {
    this.roomInfo = roomInfo;
};

handler.GetRoomInfo = function () {
    return this.roomInfo;
};

handler.GetName = function () {
    return this.name;
};

handler.SendMessage = function (msg) {
    var route = 'ServerChat_Self';
    messageService.pushMessageToPlayer({uid: this.uid, sid: this.frontendId}, route, msg);
};

handler.PushMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.uid, sid: this.frontendId}, route, msg);
};
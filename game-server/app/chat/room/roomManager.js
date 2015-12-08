/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-3
 * Time: 上午9:58
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');


var Handler = module.exports;
Handler.Init = function () {
    this.roomList = {};
};

Handler.DeleteRoom = function (customID, roomID) {
    if (null != this.roomList[customID]) {
        delete this.roomList[customID][roomID];
    }
};

Handler.AddPlayer = function (customID, roomID, roleID) {
    if (null == this.roomList[customID]) {
        this.roomList[customID] = {}
    }
    var temp = this.roomList[customID];
    if (null == temp[roomID]) {
        temp[roomID] = {}
    }
    temp[roomID][roleID] = {};
};

Handler.DeletePlayer = function (customID, roomID, roleID) {
    var temp = this.roomList[customID];
    if (null != temp && null != temp[roomID]) {
        delete temp[roomID][roleID];
    }
};

Handler.GetRoomList = function (customID, roomID) {
    var temp = this.roomList[customID];
    var playerList = [];
    if (null != temp && null != temp[roomID]) {
        for (var index in temp[roomID]) {
            playerList.push(index);
        }
    }
    return playerList;
};

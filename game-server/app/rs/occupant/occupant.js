/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-10
 * Time: 下午3:59
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var OccupantInfo = gameConst.eOccupantInfo;
var eOccupantInfo = gameConst.eOccupantInfo;
module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.info = new Array(OccupantInfo.Max);
};

var handler = Handler.prototype;
handler.SetOccuInfo = function (Index, value) {
    if(value == null){
        value = 0;
    }
    this.info[Index] = value;
};

handler.GetOccupantInfo = function (Index) {
    return this.info[Index];
};

// 封装构造
handler.CreateOccupant = function (roleID, roleName, roleSco, customID, unionID, unionName, roleLevel) {
    var tempTime = new Date();
    this.SetOccuInfo(eOccupantInfo.CustomID, customID);
    this.SetOccuInfo(eOccupantInfo.RoleID, roleID);
    this.SetOccuInfo(eOccupantInfo.RoleName, roleName);
    this.SetOccuInfo(eOccupantInfo.RoleSco, roleSco);
    this.SetOccuInfo(eOccupantInfo.LeaveTime, defaultValues.OccupantTime + tempTime.getTime());
    this.SetOccuInfo(eOccupantInfo.UnionID, unionID);
    this.SetOccuInfo(eOccupantInfo.UnionName, unionName);
    this.SetOccuInfo(eOccupantInfo.RoleLevel, roleLevel);
};

// 封装成消息
handler.MakeMessage = function (time){
    var tempMsg = {
        customID: this.GetOccupantInfo(eOccupantInfo.CustomID),
        roleID: this.GetOccupantInfo(eOccupantInfo.RoleID),
        name: this.GetOccupantInfo(eOccupantInfo.RoleName),
        customSco: this.GetOccupantInfo(eOccupantInfo.RoleSco),
        leaveTime: this.GetOccupantInfo(eOccupantInfo.LeaveTime) - time,
        unionID: this.GetOccupantInfo(eOccupantInfo.UnionID),
        unionName: this.GetOccupantInfo(eOccupantInfo.UnionName),
        roleLevel: this.GetOccupantInfo(eOccupantInfo.RoleLevel)
    };

    return tempMsg;
}
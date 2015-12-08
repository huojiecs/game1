/**
 * Created with JetBrains WebStorm.
 * User: xykong
 * Date: 13-9-26
 * Time: 下午4:54
 * To change this template use File | Settings | File Templates.
 */

//var gameConst = require('../../tools/constValue');
//var ACTIVITYINFO = gameConst.ACTIVITYINFO;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
//    this.activityInfo = new Array(ACTIVITYINFO.ACTIVITYINFO_MAX);
//    for (var i = 0; i < ACTIVITYINFO.ACTIVITYINFO_MAX; ++i) {
//        this.activityInfo[i] = 0;
//    }

    this.currentActivity = 0;
    this.records = {};
    this.cd = 0;
};

var handler = Handler.prototype;

handler.GetActivityInfo = function (Index) {
    if (IsValidIndex(Index)) {
        return this.activityInfo[Index];
    }
    return null;
};

handler.SetActivityRecord = function (instanceID, num) {
    this.records[instanceID] = num;
};

handler.SetActivityAllInfo = function (activityInfo) {
    this.activityInfo = activityInfo;
};

handler.FillInfo = function (activityInfo) {
    this.activityInfo = activityInfo;
};

handler.SetActivityCD = function(time) {
    this.cd = time;
};

handler.GetActivityCD = function() {
    return this.cd;
};

function IsValidIndex(Index) {
    if (Index >= 0 && Index < ACTIVITYINFO.ACTIVITYINFO_MAX) {
        return true;
    }
    return false;
};
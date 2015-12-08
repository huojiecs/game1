/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-26
 * Time: 上午10:17
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var eCustomInfo = gameConst.eCustomInfo;
module.exports = function (customTemplate) {
    return new Handler(customTemplate);
};

var Handler = function (customTemplate) {
    this.customTemplate = customTemplate;
    this.dataInfo = new Array(eCustomInfo.MAX);
    for (var i = 0; i < eCustomInfo.MAX; ++i) {
        this.dataInfo[i] = 0;
    }
};

var handler = Handler.prototype;
function IsTrueIndex(infoIndex) {
    if (infoIndex >= 0 && infoIndex < eCustomInfo.MAX) {
        return true;
    }
    return false;
};

handler.SetCustomInfo = function (infoIndex, value) {
    switch (infoIndex) {
        case eCustomInfo.SCO :
            if (this.dataInfo[eCustomInfo.SCO] < value) {
                this.dataInfo[eCustomInfo.SCO] = value;
            }
            break;
        case eCustomInfo.WIN:
            if (this.dataInfo[infoIndex] != 1) {
                this.dataInfo[infoIndex] = value;
            }
            break;
        default :
            this.dataInfo[infoIndex] = value;
    }
};

handler.GetCustomInfo = function (infoIndex) {
    if (IsTrueIndex(infoIndex)) {
        return this.dataInfo[infoIndex];
    }
    return null;
};

handler.SetCustomAllInfo = function (dataInfo) {
    this.dataInfo = dataInfo;
};

handler.SetTemplate = function (customTemplate) {
    this.customTemplate = customTemplate;
};

handler.GetTemplate = function () {
    return this.customTemplate;
};

handler.toMessage = function(){
    var msg = {
        customID: this.GetCustomInfo(eCustomInfo.AREAID),
        customNum: this.GetCustomInfo(eCustomInfo.NUM),
        customSco: this.GetCustomInfo(eCustomInfo.SCO),
        customWin: this.GetCustomInfo(eCustomInfo.WIN),
        customPrize: this.GetCustomInfo(eCustomInfo.Prize),
        starNum: this.GetCustomInfo(eCustomInfo.StarNum),
        Achieve: this.GetCustomInfo(eCustomInfo.Achieve)
    };

    return msg;
};
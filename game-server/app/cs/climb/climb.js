/**
 * Created by Administrator on 14-5-21.
 */


var gameConstant = require('../../tools/constValue');
var eClimbInfo = gameConstant.eClimbInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.climbInfo = new Array(eClimbInfo.Max)

};

var handler = Handler.prototype;

handler.SetClimbInfo = function (index, value) {
    this.climbInfo[index] = value;
};

handler.GetClimbInfo = function (index) {
    return this.climbInfo[index];
};

handler.setAllInfo = function (info) {
    this.climbInfo = info;
};

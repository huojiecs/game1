/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-21
 * Time: 上午11:39
 * To change this template use File | Settings | File Templates.
 */

var gameConst = require('../../tools/constValue');
var eGoodsInfo = gameConst.eGoodsInfo;
module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.dataInfo = new Array(eGoodsInfo.Max);
    this.dataTemplate = null;
};

var handler = Handler.prototype;

handler.SetDataInfo = function (index, value) {
    this.dataInfo[index] = value;
};

handler.GetDataInfo = function (index) {
    return this.dataInfo[index];
};

handler.SetAllInfo = function (info) {
    this.dataInfo = info;
};

handler.GetTemplate = function () {
    return this.dataTemplate;
};
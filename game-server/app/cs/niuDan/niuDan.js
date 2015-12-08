/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-17
 * Time: 下午2:10
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var eNiuDanInfo = gameConst.eNiuDanInfo;
module.exports = function (template) {
    return new Handler(template);
};

var Handler = function (template) {
    this.niuDanInfo = new Array(eNiuDanInfo.Max);
    this.niuTemplate = template;
};

var handler = Handler.prototype;

handler.SetNiuInfo = function (index, value) {
    this.niuDanInfo[index] = value;
};

handler.GetNiuInfo = function (index) {
    return this.niuDanInfo[index];
};

handler.SetAllInfo = function (info) {
    this.niuDanInfo = info;
};

handler.GetTemplate = function () {
    return this.niuTemplate;
};
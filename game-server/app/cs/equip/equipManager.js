/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午12:05
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var eEquipBag = gameConst.eEquipBag;
module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.equipList = new Array(eEquipBag.MAX);
    for (var i = 0; i < eEquipBag.MAX; ++i) {
        this.equipList[i] = 0;
    }
};

var handler = Handler.prototype;
handler.IsTrueIndex = function (equipIndex) {
    if (equipIndex >= 0 && equipIndex < eEquipBag.MAX) {
        return true;
    }
    return false;
};

handler.SetEquip = function (equipIndex, value) {
    if (this.IsTrueIndex(equipIndex)) {
        this.equipList[equipIndex] = value;
    }
};

handler.GetEquip = function (equipIndex) {
    if (this.IsTrueIndex(equipIndex)) {
        return this.equipList[equipIndex];
    }
    return 0;
};

handler.GetAllEquip = function () {
    return this.equipList;
};
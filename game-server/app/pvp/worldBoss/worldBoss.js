/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-17
 * Time: 下午2:10
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var eWorldBossInfo = gameConst.eWorldBossInfo;
module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.worldBossInfo = new Array(eWorldBossInfo.Max);
    for (var index = 0; index < eWorldBossInfo.Max; i++) {
        this.worldBossInfo[index] = 0;
    }
};

var handler = Handler.prototype;

handler.SetBossInfo = function (index, value) {
    this.worldBossInfo[index] = value;
};

handler.GetBossInfo = function (index) {
    return this.worldBossInfo[index];
};

handler.SetAllInfo = function (info) {
    this.worldBossInfo = info;
};


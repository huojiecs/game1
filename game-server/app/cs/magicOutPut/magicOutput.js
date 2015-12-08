/**
 * @Author        wangwenping
 * @Date          2014/12/23
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var eMagicOutputInfo = gameConst.eMagicOutputInfo;//求魔的产出信息

module.exports = function () {
    return new Handler();
};
var Handler = function (magicOutputInfo) {
    this.magicOutputInfo = magicOutputInfo;
};
var handler = Handler.prototype;

handler.IsTrueIndex = function (infoIndex) {
    if (infoIndex >= 0 && infoIndex < eMagicOutputInfo.Max) {
        return true;
    }
    return false;
};

handler.SetDataInfo = function (infoIndex, value) {
    if (this.IsTrueIndex(infoIndex)) {
        this.magicOutputInfo[infoIndex] = value;
    }
};
handler.GetMagicOutputInfo = function (infoIndex) {
    if (this.IsTrueIndex(infoIndex)) {
        return this.magicOutputInfo[infoIndex];
    }
    return null;
};


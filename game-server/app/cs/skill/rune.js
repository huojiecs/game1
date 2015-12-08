/**
 * Created by Cuilin on 14-8-7.
 */

var gameConst = require('../../tools/constValue');
var eRuneInfo = gameConst.eRuneInfo;

module.exports = function (runeTemplate) {
    return new Handler(runeTemplate);
};

var Handler = function (runeTemplate) {
    this.runeInfo = new Array(eRuneInfo.Max);
    for (var i = 0; i < eRuneInfo.Max; i++) {
        this.runeInfo[i] = 0;
    }
    this.runeTemplate = runeTemplate;
};

var handler = Handler.prototype;

handler.SetRuneAllInfo = function (runeInfo) {
    this.runeInfo = runeInfo;
};

handler.GetRuneAllInfo = function () {
    return this.runeInfo;
};

handler.SetRuneInfo = function (index, value) {
    if (IsTrueIndex(index)) {
        this.runeInfo[index] = value;
    }
};

handler.GetRuneInfo = function (index) {
    if (IsTrueIndex(index)) {
        return this.runeInfo[index];
    }
    return null;
};

handler.GetTemplate = function () {
    return this.runeTemplate;
};

function IsTrueIndex(Index) {
    return !!(Index >= 0 && Index < eRuneInfo.Max);
};
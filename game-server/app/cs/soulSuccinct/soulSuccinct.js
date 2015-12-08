/**
 * @Author        wangwenping
 * @Date          2015/01/06
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var eSuccinctInfo = gameConst.eSuccinctInfo;
var eAttInfo = gameConst.eAttInfo;
var eAttState = gameConst.eAttState;

module.exports = function (SoulSuccinctTemplate) {
    return new Handler(SoulSuccinctTemplate);
};

var Handler = function (SoulSuccinctTemplate) {
    this.succinctTemplate = SoulSuccinctTemplate;
    this.succinctInfo = new Array(eSuccinctInfo.Max);
    for (var i = 0; i < eSuccinctInfo.Max; ++i) {
        this.succinctInfo[i] = 0;
    }
};

var handler = Handler.prototype;
handler.GetTemplate = function () {
    return this.succinctTemplate;
};

handler.GetSuccinctInfo = function (Index) {
    if (IsTrueIndex(Index)) {
        return this.succinctInfo[Index];
    }
    return null;
};

handler.SetSuccinctInfo = function (Index, value) {
    if (IsTrueIndex(Index)) {
        this.succinctInfo[Index] = value;
    }
};
function IsTrueIndex(Index) {
    if (Index >= 0 && Index < eSuccinctInfo.Max) {
        return true;
    }
    return false;
};


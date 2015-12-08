/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-8-8
 * Time: 上午10:41
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var eSkillInfo = gameConst.eSkillInfo;

module.exports = function (skillTemplate) {
    return new Handler(skillTemplate);
};

var Handler = function (skillTemplate) {
    this.skillInfo = new Array(eSkillInfo.Max);
    for (var i = 0; i < eSkillInfo.Max; ++i) {
        this.skillInfo[i] = 0;
    }
    this.skillTemplate = skillTemplate;
};

var handler = Handler.prototype;

handler.SetSkillAllInfo = function (skillInfo) {
    this.skillInfo = skillInfo;
};

handler.GetSkillAllInfo = function () {
    return this.skillInfo;
};

/**
 * @return {null}
 */
handler.GetSkillInfo = function (Index) {
    if (IsTrueIndex(Index)) {
        return this.skillInfo[Index];
    }
    return null;
};

handler.SetSkillInfo = function (Index, Value) {
    if (IsTrueIndex(Index)) {
        this.skillInfo[Index] = Value;
    }
};

handler.GetTemplate = function () {
    return this.skillTemplate;
};

/**
 * @return {boolean}
 */
function IsTrueIndex(Index) {
    return !!(Index >= 0 && Index < eSkillInfo.Max);
};
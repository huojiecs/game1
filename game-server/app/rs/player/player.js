/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-12-12
 * Time: 下午6:18
 * To change this template use File | Settings | File Templates.
 */

var messageService = require('../../tools/messageService');
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');

var ePlayerInfo = gameConst.ePlayerInfo;
var tRoleInit = templateConst.tRoleInit;

module.exports = function (playerInfo, csID, uid, sid) {
    return new Handler(playerInfo, csID, uid, sid);
};

var Handler = function (playerInfo, csID, uid, sid) {
    this.sid = sid;
    this.uid = uid;
    this.playerInfo = playerInfo;
    this.csID = csID;
    this.teamInfo = [-1, -1, 0, 0, 0];
    this.marryInfo = [];
};

var handler = Handler.prototype;

handler.SetTeamInfo = function (index, value) {

    this.teamInfo[index] = value;
};

handler.GetTeamInfo = function (index) {
    return this.teamInfo[index];
};

handler.GetPlayerInfo = function (index) {
    return this.playerInfo[index];
};

handler.SetPlayerInfo = function (index, value) {
    this.playerInfo[index] = value;
};

handler.SetMarryInfo = function (index, value) {
    this.marryInfo[index] = value;
};

handler.GetPlayerCs = function () {
    return this.csID;
};

handler.SetPlayerCs = function (value) {
    this.csID = value;
};

handler.GetPlayerUid = function () {
    return this.uid;
};

handler.GetPlayerSid = function () {
    return this.sid;
};

handler.SendMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.uid, sid: this.sid}, route, msg);
};

/**
 * @Brief: 获取玩家vip 等级
 *
 * @return {Number}
 * */
handler.GetVipLevel = function (){
    return this.playerInfo[ePlayerInfo.VipLevel];
};

/**
 * @Brief: 获取玩家职业
 *
 * @return {number}
 */
handler.GetJobType = function () {
    var tempID = this.playerInfo[ePlayerInfo.TEMPID];
    var InitTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == InitTemplate) {
        return 0;
    }
    return InitTemplate[tRoleInit.profession];
};
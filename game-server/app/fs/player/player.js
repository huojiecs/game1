/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-1-15
 * Time: 下午5:35
 * To change this template use File | Settings | File Templates.
 */
var messageService = require('../../tools/messageService');

module.exports = function (roleID, csID, uid, sid, details) {
    return new Handler(roleID, csID, uid, sid, details);
};

var Handler = function (roleID, csID, uid, sid, details) {
    this.roleID = roleID;
    this.csID = csID;
    this.uid = uid;
    this.sid = sid;
    this.name = details.name;
    this.openid = details.openid;
    this.token = details.token;
    this.accountType = details.accountType;
};

var handler = Handler.prototype;

handler.GetPlayerCs = function () {
    return this.csID;
};

handler.SetPlayerCs = function (value) {
    this.csID = value;
};

/**
 * 获取玩家的账号类型
 * */
handler.getAccountType = function() {
    return this.accountType;
};

/**
 * 发送消息， 先推送到frontend, 在转发给客户端
 * @param {string} route 路由消息号
 * @param {object} msg 推送消息
 * */
handler.SendMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.uid, sid: this.sid}, route, msg);
};
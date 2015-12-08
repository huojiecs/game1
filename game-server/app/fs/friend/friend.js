/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-21
 * Time: 下午5:59
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var config = require('./../../tools/config');
var globalFunction = require('../../tools/globalFunction');

module.exports = function (meta) {
    return new Handler(meta);
};

var Handler = function (meta) {
    this.dataInfo = new Array(gameConst.eFriendInfo.Max);

    if (!!meta) {

        /**区服id*/
        this.serverUid = meta.serverUid || config.list.serverUid;
        /** openId*/
        this.openID = meta.openID || '';
        /** 昵称*/
        this.nickName = meta.nickName || '';
        /** 好友图片　只有微信有，　其他为　‘’　*/
        this.picture = meta.picture || "";
        this.isQQMember = meta.isQQMember || 0;

        this.dataInfo[gameConst.eFriendInfo.RoleID] = meta.roleID;
        this.dataInfo[gameConst.eFriendInfo.FriendID] = meta.friendID;
        this.dataInfo[gameConst.eFriendInfo.FriendType] = meta.friendType;
    } else {
        /**区服id*/
        this.serverUid = '' + config.list.serverUid;
        /** openId*/
        this.openID = '';
        /** 昵称*/
        this.nickName ='';
        /** 好友图片　只有微信有，　其他为　‘’　*/
        this.picture = "";
        this.isQQMember = 0;
    }
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

handler.GetServerUid = function () {
    return globalFunction.GetUseServerUId(this.serverUid);
};

/**
 * @brief： 获取玩家的原始区服
 * -------------------------
 *
 * @return {String}
 * */
handler.GetShowServerUid = function () {
    return this.serverUid;
};

handler.GetOpenID = function () {
    return this.openID;
};

/**
 * 获取好友昵称
 * @return {string}
 * @api public
 * */
handler.getNickName = function () {
    return this.nickName;
};

/**
 * 获取好友头像图标 url(微信才有)
 * @return {string}
 * @api public
 * */
handler.getPicture = function () {
    return this.picture;
};

handler.getISQQMember = function () {
    return this.isQQMember;
};

/**
 * 是否是跨服好友
 * @return {boolean}
 * */
handler.isAcross = function () {
    return this.GetDataInfo(gameConst.eFriendInfo.FriendType) == gameConst.eFriendType.QQ && this.GetServerUid()
        != config.list.serverUid;
};

/**
 * @Brief： 获取显示信息
 * -------------------
 *
 * */
/**
 * 是否是跨服好友
 * @return {boolean}
 * */
handler.getShowInfo = function () {

    var eFriendInfo = gameConst.eFriendInfo;
    var dataInfo = this.dataInfo;

    return {
        roleID: dataInfo[eFriendInfo.RoleID],
        friendID: dataInfo[eFriendInfo.FriendID],
        friendType: dataInfo[eFriendInfo.FriendType],
        nickName: this.nickName,
        picture: this.picture,
        isQQMember : this.isQQMember,
        serverUid: this.serverUid
    };
};
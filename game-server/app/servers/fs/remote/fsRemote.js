/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-23
 * Time: 下午3:21
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var friendManager = require('../../../fs/friend/friendManager');
var playerManager = require('../../../fs/player/playerManager');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.LoadFriendList = function (roleID, csID, uid, sid, details, callback) {
    playerManager.AddPlayer(roleID, csID, uid, sid, details);
    friendManager.LoadDataByDB(roleID);
    return callback();
};

handler.DeletePlayer = function (roleID, callback) {
    var fsNumber = friendManager.DeletePlayer(roleID);
    playerManager.DeletePlayer(roleID);
    return callback(null, fsNumber);
};

handler.UpdateFriendInfo = function (roleID, index, value, callback) {
    friendManager.UpdateFriendInfo(roleID, index, value);
    return callback();
};

handler.GetFriendNum = function (roleID, friendType, callback) {
    var friendNum = friendManager.GetFriendNum(roleID, friendType);
    if (friendNum < 0) {
        friendNum = 0;
    }
    return callback(null, {'number': friendNum});
};

handler.GetFriendRoleIDs = function (roleID, friendType, callback) {
    /*var friListInfo = friendManager.GetFriendRoleIDs(roleID, friendType);
     return callback(null, {friListInfo: friListInfo});*/
    friendManager.GetFriendInfo(roleID, function (err, list) {
        return callback(null, list);
    });
};

/**
 * 友情点赠送跨服实现， 原来再cs完成， 再cs handler 到达时，
 * 先到这里查看该朋友是否是跨服好友， 是的话这就转发信息， 结果回来后并告诉cs结果?
 * 回去后cs还得特殊处理
 * @param {number} roleID 赠送者id
 * @param {number} friendID 好友id
 * @param {function} callback
 * */
handler.checkAcrossFriendPhysical = function (roleID, friendID, callback) {
    logger.info('check FriendPhysical to game across roleID%s friendID%s', roleID, friendID);
    if (friendManager.IsAcrossFriend(roleID, friendID)) {
        friendManager.sendFriendPhysicalAcross(roleID, friendID, function (err) {
            if (!!err) {
                logger.error('FriendPhysical to game across roleID%s friendID%s , err: ', roleID, friendID,
                             utils.getErrorMessage(err));
            }
        });
        return callback(null, {isAcross: true});
    }
    return callback(null, {isAcross: false});
};

/**
 * 检查该玩家是否是本服玩家的跨服好友
 * @param {number} roleID 玩家id
 * @param {function} callback
 */
handler.checkAndGetServerUid = function (roleID, callback) {
    if (friendManager.isAcrossByID(roleID)) {
        var serverUid = friendManager.getServerUidByID(roleID);
        return callback(null, {isAcross: true, serverUid: serverUid});
    }
    return callback(null, {isAcross: false, serverUid: 0});
};

/**
 * 发送跨服邮件
 * @param {number} roleID 玩家id
 * @param {function} callback
 */
handler.sendAcrossMail = function (severUid, mailDetail, callback) {
    friendManager.sendAcrossMail(severUid, mailDetail, function (err, res) {
        return callback(null, {result: res.result});
    });
};

/**
 * 请求回复跨服玩家信息， 此方法存在一定风险， 玩家 发送一个 不存在id
 * @param {Number} serverUid 服务id
 * @param {Number} roleID 玩家id
 * @param {function} callback
 */
handler.rebuildRoleDetail = function (serverUid, roleID, callback) {
    /**  发送跨服消息*/
    friendManager.rebuildRoleDetail(serverUid, roleID, function (err, res) {
        return callback(null, {result: res.result});
    });
};
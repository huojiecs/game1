/**
 * The file lsCluster.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/9/4 20:07:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var friendManager = require('../../../fs/friend/friendManager');
var errorCodes = require('../../../tools/errorCodes');
var utils = require('../../../tools/utils');

module.exports = function (app) {
    return new Handler(app);
};

/**
 * 重ls转发过来的消息处理器
 * 1, 改消息是由其他游戏服务器fs发过来，由ls登陆服ls服务friendCenter 转发过来的消息
 * */

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * 测试， 由其他服务器ping过来的消息
 *  @param {number} id 服务器区服id
 *  @param {object} msg 由其他服务器发送过来的消息
 *  @param {function} callback
 * */
handler.Ping = function (id, msg, callback) {
    return callback(null, {result: 0});
};

/**
 *其他game服务器发送的好友祝福祝福， 1->1
 * @param {string} id serverUid
 * @param {object} msg 其他服务器发送过来的消息 {
 *                                               roleID: 发送者
  *                                              friendID: 本服接收者
 *                                             }
 * @param {function} callback
 * */
handler.Blessing = function (id, msg, callback) {
    var friendID = msg.roleID;
    var roleID = msg.friendID;

    friendManager.BlessFromOtherGame(roleID, friendID, function (err, result) {
        if (!!err) {
            return callback(null, {result: errorCodes.toClientCode(err)});
        }
        return callback(null, result);
    });
};

/**
 * 送到跨服好友求祝福信息
 * @param {string} id serverUid
 * @param {object} msg 其他服务器发送过来的消息{mailDetail{邮件对象}}
 * @param {function} callback
 * */

handler.RequireBlessing = function (id, msg, callback) {
    var mailDetail = msg.mailDetail;

    if (null == mailDetail) {
        return callback(null, {result: errorCodes.Ls_1025});
    }

    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail,
                                        utils.done);
    return callback(null, {result: errorCodes.OK});
};

/**
 * 跨服友情点赠送
 * @param {string} id serverUid
 * @param {object} msg 其他服务器发送过来的消息{
 *                                               roleID: 发送者
  *                                              friendID: 本服接收者
 *                                             }
 * @param {function} callback
 * */
handler.FriendPhysical= function (id, msg, callback) {
    var roleID = msg.roleID;
    var friendID = msg.friendID;

    if (null == roleID || null == friendID) {
        callback(null, {result:errorCodes.ParameterNull});
    }
    pomelo.app.rpc.ps.phyRemote.GiveFriPhysical(null, roleID, friendID, utils.done);
    callback(null, {result:errorCodes.OK});
};

/**
 * 发送跨服邮件
 * @param {string} id serverUid
 * @param {object} msg 其他服务器发送过来的消息{mailDetail{邮件对象}}
 * @param {function} callback
 * */

handler.sendAcrossMail = function (id, msg, callback) {
    var mailDetail = msg.mailDetail;

    if (null == mailDetail) {
        return callback(null, {result: errorCodes.Ls_1025});
    }

    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail,
                                        utils.done);
    return callback(null, {result: errorCodes.OK});
};

/**
 * 其他服发送请求好友信息
 * @param {string} id serverUid
 * @param {object} msg 其他服务器发送过来的消息{roleID:0}
 * @param {function} callback
 * */

handler.rebuildRoleDetail = function (id, msg, callback) {
    var roleID = msg.roleID;
    if (null == roleID) {
        return callback(null, {result: errorCodes.ParameterNull});
    }

    /** 随机获取一个 cs 为 其 服务*/
    var servers = pomelo.app.getServersByType('cs');
    if (!servers || !servers.length) {
        return cb(new Error(util.format('Can not find server info for serverType: %j, serverTypeMaps: %j',
                                        cs, pomelo.app.serverTypeMaps)));
    }
    var csID = servers[Math.floor(Math.random() * servers.length)].id;

    /** 向cs 发送 回复消息*/
    pomelo.app.rpc.cs.csRemote.rebuildRoleDetail(null, csID, roleID, utils.done);

    return callback(null, {result: errorCodes.OK});
};
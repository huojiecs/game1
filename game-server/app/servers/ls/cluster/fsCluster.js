/**
 * Created by xykong on 2014/8/13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var fsSql = require('./../../../tools/mysql/fsSql');
var friendCenter = require('./../../../ls/friendCenter');
var Q = require('q');
var _ = require('underscore');


module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.Ping = function (id, msg, callback) {

    return callback(null, msg);
};

handler.GetFriendsByOpenIds = function (id, openIds, callback) {
    logger.info('handler.GetFriendsByOpenIds: %j', openIds);

    Q.ninvoke(fsSql, 'GetRoleListByOpenIds', openIds)
        .then(function (roleList) {
                  return callback(null, roleList);
              })
        .catch(function (err) {
                   return callback(err, null);
               })
        .done();
};

/**
 * 转发服务器消息， 从一个服转发到另个个游戏服
 * @param {number} id 发送消息uid
 * @param {number} serverUid toUid
 * @param {object} toMsg 发送消息用对象封装
 * */
handler.sendMsgToOhterGame = function (id, serverUid, method, toMsg, callback) {
    logger.info('handler.sendMsgToOhterGame: %j', toMsg);

    friendCenter.sendMessageToOtherGame(serverUid, method, toMsg, 'ls', callback);
};

/**
 * 服务器注册
 * @param {number} id 发送消息uid
 * @param {object} toMsg 发送消息用对象封装
 * */
handler.Register = function (id, msg, callback) {
    logger.info('Register new server info: %j', msg);

    var result = friendCenter.Register(msg);

    return callback(null, {result: result});
};


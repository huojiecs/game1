/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-27
 * Time: 下午4:49
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
//var area = require('./area/area');
//var timer = require('./area/timer');
//var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var EntityType = require('./constValue').eEntityType;
var utils = require('./utils');

var exp = module.exports;

exp.pushMessage = function (route, msg, cb) {
    //area.channel().pushMessage(route, msg, errHandler);
};

exp.pushMessageByUids = function (uids, route, msg) {
    pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, errHandler);
};

/**
 * 向同一个前端推送消息 相比 pushMessageByUids 少来uids 分组 提高效率
 * 但必须保证uids 必须是同一前端的。
 * @param {String} sid 前端服务器id
 * @param {Array} uids 玩家sessionID数组
 * @param {String} route 向服务器推送的路由
 * @param {Object} msg 推送消息
 * @api public
 * */
exp.pushMessageByUidsAndSid = function (sid, uids, route, msg) {
    var app = pomelo.app;
    var namespace = 'sys';
    var service = 'channelRemote';
    var method = 'pushMessage';

    var opts = {type: 'push', userOptions: {}};
    opts.isPush = true;

    app.rpcInvoke(sid, {namespace: namespace, service: service,
        method: method, args: [route, msg, uids, opts]}, errHandler);
};

/**
 * 向同一个前端推送消息 相比 pushMessageByUids 少来uids 分组 提高效率
 * 但必须保证uids 必须是同一前端的。
 * @param {String} sid 前端服务器id
 * @param {Array} uids 玩家sessionID数组
 * @param {String} route 向服务器推送的路由
 * @param {Object} msg 推送消息
 * @param {Object} 添加cb 控制queue 用
 * @api public
 * */
exp.pushMessageByUidsAndSidWithCb = function (sid, uids, route, msg, cb) {
    var app = pomelo.app;
    var namespace = 'sys';
    var service = 'channelRemote';
    var method = 'pushMessage';

    var opts = {type: 'push', userOptions: {}};
    opts.isPush = true;

    app.rpcInvoke(sid, {namespace: namespace, service: service,
        method: method, args: [route, msg, uids, opts]}, cb);
};

/**
 * 广播消息，世界消息， 玩家多做成rpc调用过多。。。
 * 1, 世界聊天改用广播消息到前端， 前端再做消息分发
 * @param {string} route 路由消息
 * @param {object} msg 消息
 * @param  {Object}   opts       user-defined broadcast options, optional
 *                               opts.binded: push to binded sessions or all the sessions
 *                               opts.filterParam: parameters for broadcast filter.
 * */
exp.broadcast = function (route, msg, opts) {
    pomelo.app.get('channelService').broadcast('connector', route, msg, opts || {}, errHandler);
};

/**
 * 广播消息，到其他 后端游戏 玩家多做成rpc调用过多。。。
 * 1, 世界聊天改用广播消息到前端， 前端再做消息分发
 * -----------------------------------------------
 *
 * @param {String} sType 服务器类型
 * @param {object} msg 消息
 * @param  {Object}   opts       user-defined broadcast options, optional
 *                               opts.binded: push to binded sessions or all the sessions
 *                               opts.filterParam: parameters for broadcast filter.
 * */
exp.broadcastRpc = function (sType, msg, opts) {
    var app = pomelo.app;
    //var namespace = opts.namespace || 'user';
    var service = opts.service || 'broadcastRemote';
    var method = opts.method || 'broadcast';
    var servers = app.getServersByType(sType);
    var ignoreID = opts.ignoreID || '';

    if (!servers || servers.length === 0) {
        // server list is empty
        //utils.invokeCallback(cb);
        return;
    }

    if (!pomelo.app.rpc || !pomelo.app.rpc[sType]
        || !pomelo.app.rpc[sType][service]) {
        logger.error('pomelo.app.rpc.%s.%s not exist!', sType, service);
        return;
    }


    for (var idx in servers) {
        if (servers[idx].id !== ignoreID) {
            pomelo.app.rpc[sType][service][method](null, servers[idx].id, msg, errHandler);
        }
    }
};

exp.pushMessageToPlayer = function (uid, route, msg) {
    exp.pushMessageByUids([uid], route, msg);
};

exp.pushMessageByAOI = function (room, route, msg, pos) {
    var uids = room.GetWatcherUids(pos, [EntityType.PLAYER]);

    if (uids.length > 0) {
        exp.pushMessageByUids(uids, route, msg);
    }
};

function errHandler(err, fails) {
    if (!!err) {
        logger.error('Push Message error! %j', err.stack);
    }
    // if(!!fails && fails.length > 0){
    //  for(var i = 0; i < fails.length; i++){
    // area.removePlayerByUid(fails[i]);
    // }
    // }
};
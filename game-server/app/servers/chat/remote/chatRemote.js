var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Player = require('../../../chat/player/player');
var playerManager = require('../../../chat/player/playerManager');
var zhuanPanManager = require('../../../chat/zhuanpan/zhuanPanManager');
var roomManager = require('../../../chat/room/roomManager');
var gameConst = require('../../../tools/constValue');
var _ = require('underscore');
var errorCodes = require('../../../tools/errorCodes');
var idipUtils = require('../../../tools/idipUtils');

var eChatType = gameConst.eChatType;
var eFirstNoticeType = gameConst.eFirstNoticeType;


module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {

};

var handler = Handler.prototype;

handler.AddPlayer = function (uid, frontendId, roleID, name, openID, accountType, callback) {
    var newPlayer = new Player();
    newPlayer.Init(frontendId, uid, roleID, name, openID, accountType);
    playerManager.AddPlayer(roleID, newPlayer);
    return callback();
};

handler.DeletePlayer = function (roleID, callback) {
    playerManager.DeletePlayer(roleID);
    return callback();
};

handler.RoomAddPlayer = function (customID, roomID, roleID, callback) {
    roomManager.AddPlayer(customID, roomID, roleID);
    var player = playerManager.GetPlayer(roleID);
    if (player) {
        var roomInfo = {
            roomID: roomID,
            customID: customID
        };
        player.SetRoomInfo(roomInfo);
    }
    return callback();
};


handler.DeleteRoom = function (customID, roomID, callback){
    roomManager.DeleteRoom(customID, roomID);
    callback(null);
}

handler.RoomDeletePlayer = function (customID, roomID, roleID, callback) {
    roomManager.DeletePlayer(customID, roomID, roleID);
    var player = playerManager.GetPlayer(roleID);
    if (player) {
        var roomInfo = {
            roomID: 0,
            customID: 0
        };
        player.SetRoomInfo(roomInfo);
    }

    return callback();
};

handler.SendChat = function (gmType, compareValue, chatContent, callback) {
    if (null == gmType) {
        return callback();
    }
    if (gmType < 0 || gmType >= gameConst.eGmType.Max) {
        return callback();
    }
    var noticeList = playerManager.GetNoticeList();
    switch (gmType) {
        case gameConst.eGmType.ZhanLi:
        {
            for (var i in noticeList) {
                if (eFirstNoticeType.ZhanLi != noticeList[i][gameConst.eFirstKillInfo.typeID]) {
                    continue;
                }
                if (compareValue == noticeList[i][gameConst.eFirstKillInfo.NpcID]) {
                    return callback(null, {result: 1});      //不是第一个达到指定战力，返回
                }
            }
            //当是第一个达到指定战力
            var tempInfo = [eFirstNoticeType.ZhanLi, compareValue, 1];
            noticeList.push(tempInfo);           //首先将数据添加到缓存
            playerManager.NoticeInfoAdd(tempInfo);   //将数据插入到数据库
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.FirstKill:
        {
            for (var i in noticeList) {
                if (eFirstNoticeType.FirstKill != noticeList[i][gameConst.eFirstKillInfo.typeID]) {
                    continue;
                }
                if (compareValue == noticeList[i][gameConst.eFirstKillInfo.NpcID]) {
                    //logger.info('不是首杀数据');
                    return callback(null, {result: 1});      //不是首杀，返回失败数据
                }
            }
            //当是首杀数据时
            var tempInfo = [eFirstNoticeType.FirstKill, compareValue, 1];
            noticeList.push(tempInfo);           //首先将数据添加到缓存
            playerManager.NoticeInfoAdd(tempInfo);   //将数据插入到数据库
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.KillBoss:
        {   //击杀boss公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.GetAsset:
        {    //获取指定物品公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.GetItem:
        {    //获取指定物品公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.NiuDan:
        {     //扭蛋奖励公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.FaBao:
        {      //法宝达到指定级别公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.PaTa:
        {      //爬塔达到指定级别公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.ZhuanPan:
        {   //幸运转盘达到指钻石发公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        case gameConst.eGmType.WorldBoss:
        {   //开宝箱获得特等奖发公告
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
            break;
        default:
        {   //默认公告类型
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
            return callback(null, {result: 0});
        }
    }
    //playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
    return callback();
};

handler.idipCommands = function (data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);

    var chatCommands = require('../../../adminCommands/chatCommands');

    idipUtils.dispatchIdipCommands(chatCommands, data_packet, callback);
};

handler.SendGMChat = function (type, startTime, endTime, freq, count, content, priority, callback) {
    playerManager.SendGMChat(type, 1, startTime, endTime, freq, count, content, priority);
    return callback();
};

handler.DeleteGMChat = function (chatID, callback) {
    playerManager.DeleteGMChat(chatID);
    return callback();
};

handler.SetSendChatTime = function (roleID, data, callback) {
    playerManager.SetSendChatTime(roleID, data, callback);
};

handler.GetForbidChatInfo = function (roleID, callback) {
    var data = playerManager.GetForbidChat(roleID);
    if (_.isEmpty(data) == false) {
        return callback(data);
    }
    return callback();
};

/**
 *
 * @param roleID
 * @param callback
 * @returns {*}
 * @constructor
 */
handler.SyncRewardList = function (roleID, callback) {
    zhuanPanManager.SyncRewardList(roleID);
    return callback();
};

/**
 *
 * @param rewards
 * @param callback
 * @returns {*}
 * @constructor
 */
handler.PushRewards = function (rewards, callback) {
    zhuanPanManager.PushRewards(rewards);
    return callback();
};

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../chat/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var CHATTYPE = gameConst.eChatType;
var util = require('util');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.SendChat = function (msg, session, next) {
    var ipAddress = session.get('remoteAddress').ip;
    var sendID = session.get('roleID');
    if (!sendID) {
        logger.warn('SendChat sendID is none sendID: %j', sendID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var sendPlayer = playerManager.GetPlayer(sendID);
    if (!sendPlayer) {
        logger.info('SendChat sendPlayer is none sendID: %j', sendID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var recvID = +msg.recvID;
    var chatType = +msg.chatType;
    var chatContent = '' + msg.chatContent;

    if (chatType < CHATTYPE.WORLD
            || chatType >= CHATTYPE.GM
        || chatContent.length === 0) {
        logger.warn('SendChat发送聊天有空值recvID:' + recvID + '   chatType:' + '  chatContent:' + chatContent);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (chatType === CHATTYPE.ONE) {
        if (!recvID) {
            logger.warn('SendChat发送聊天有空值recvID:' + recvID);
            return next(null, {
                'result': errorCodes.ParameterWrong
            });
        }

        var recvPlayer = playerManager.GetPlayer(recvID);
        if (!recvPlayer) {
            logger.warn('SendChat发送聊天有空值recvID:' + recvID);
            return next(null, {
                'result': errorCodes.Chat_ReceiverOffline
            });
        }
    }
    var sendChatTime = playerManager.GetSendChatTime(sendID);
    if (new Date().getTime() < sendChatTime) {
        return next(null, {
            'result': errorCodes.IDIP_FORBID_CHAT
        });
    }

    if (sendID === recvID) {
        return next(null, {
            'result': errorCodes.Chat_Self
        });
    }

    playerManager.SendChat(chatType, sendID, recvID, chatContent, ipAddress);

    return next(null, {
        'result': errorCodes.OK
    });
};
/**
 * 工会聊天
 * 注：由于获取工会信息需要RPC 远程调用所以工会聊天走单独接口
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.SendUnionChat = function (msg, session, next) {
    var sendID = session.get('roleID');
    if (!sendID) {
        logger.warn('SendChat sendID is none sendID: %j', sendID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var sendPlayer = playerManager.GetPlayer(sendID);
    if (!sendPlayer) {
        logger.info('SendChat sendPlayer is none sendID: %j', sendID);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }
    var chatType = +msg.chatType;
    var chatContent = '' + msg.chatContent;

    if (chatType != CHATTYPE.GROUP || chatContent.length === 0) {
        logger.warn('SendChat发送聊天有空值' + '   chatType:' + '  chatContent:' + chatContent);
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

//    var sendChatTime = playerManager.GetSendChatTime(sendID);
//    if (new Date().getTime() < sendChatTime) {
//        return next(null, {
//            'result': errorCodes.IDIP_FORBID_CHAT
//        });
//    }

    playerManager.SendGroup(sendID, chatContent, function () {
        return next(null, {
            'result': errorCodes.OK
        });
    });
};

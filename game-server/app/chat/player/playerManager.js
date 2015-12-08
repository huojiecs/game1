/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-29
 * Time: 下午4:14
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var roomManager = require('../room/roomManager');
var eChatType = gameConst.eChatType;
var errorCodes = require('../../tools/errorCodes');
var messageService = require('../../tools/messageService');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var gmSql = require('../../tools/mysql/gmSql');
var _ = require('underscore');
var urlencode = require('urlencode');
var config = require('../../tools/config');
if (!config) {
    return;
}
/////////////////////////////////////
var log_insLogSql = require('../../tools/mysql/insLogSql');
var log_utilSql = require('../../tools/mysql/utilSql');
var log_getGuid = require('../../tools/guid');
var log_eTableTypeInfo = gameConst.eTableTypeInfo;
////////////////////////////////////
var noticeSql = require('../../tools/mysql/noticeSql');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var tNotice = templateConst.tNotice;

var Handler = module.exports;

Handler.Init = function () {
    this.GMChatOffset = 0;
    this.GMChatOffsetWorld = 100000;
    this.playerList = {};
    this.noticeList = [];       //首次通关列表
    this.chatList = [];
    this.gmChatMap = {};
    this.sendChatList = {};     //发送世界聊天时间列表

    /**世界聊天队列*/
    this.worldQueue = [];
    this.forbidChatList = {};

    this.InitNoticeList();
    var self = this;

    gmSql.GetForbidChatTime(function (err, forbidList) {
        if (err) {
            logger.error('GetForbidChatTime error');
            return;
        }
        _.each(forbidList, function (info) {
            var forbidChat = JSON.parse(info.forbidChat);
            self.forbidChatList[info.roleID] = forbidChat;
        });
    });

    setInterval(function () {
        self.SendChatInterval();
    }, 3000);
};

Handler.chat = function (_chatType, _sendID, _recvID, _chatConcent) {
    var chatUnit = {
        chatType: _chatType,
        sendID: _sendID,
        recvID: _recvID,
        chatConcent: _chatConcent
    };
    return chatUnit;
};

Handler.gmChat = function (_type, _chatID, _startTime, _endTime, _freq, _count, _content, _priority, _infinity) {
    var chatUnit = {
        type: _type,
        chatID: _chatID,
        startTime: _startTime,
        endTime: _endTime,
        freq: _freq,
        count: _count,
        content: _content,
        priority: _priority,
        infinity: _infinity
    };
    return chatUnit;
};

Handler.GetPlayer = function (roleID) {
    return this.playerList[roleID];
};

Handler.AddPlayer = function (roleID, player) {
    this.playerList[roleID] = player;
    if (roleID in this.forbidChatList) {
        this.sendChatList[roleID] = new Date(this.forbidChatList[roleID]['time']);
    } else {
        this.sendChatList[roleID] = Date.now();
    }
};

Handler.DeletePlayer = function (roleID) {
    delete this.playerList[roleID];
};

Handler.ReplaceStr = function (str) {
    str = str.toLowerCase();
    var strList = templateManager.GetAllTemplate('NoTalk');
    if(defaultValues.chatCheck) {   //只有腾讯版本去掉聊天中的空格
        str = str.replace(/\s+/g, "");
    }
    for (var index in strList) {
        str = str.replace(strList[index], '*');
    }
    return str;
};

Handler.InitNoticeList = function () {    //初始化通过数据
    var self = this;
    noticeSql.LoadNoticeInfo(function (err, dataList, nLen) {
        if (err) {
            logger.error('加载首次通关数据失败 %s', utils.getErrorMessage(err));
        }
        else {
            for (var i = 0; i < nLen; ++i) {
                self.noticeList.push(dataList[i]);
            }
        }
    });
};

Handler.NoticeInfoAdd = function (dataList) {    //保存通过数据
    var self = this;
    noticeSql.NoticeInfoAdd(dataList, function (err, res) {
        if (err) {
            logger.info('保存首次通关数据失败 %s', utils.getErrorMessage(err));
        }
    });
};

Handler.GetNoticeList = function () {
    return this.noticeList;
};

Handler.SendChat = function (chatType, sendID, recvID, chatConcent, ipAddress) {
    switch (chatType) {
        case eChatType.ONE:
            chatConcent = this.ReplaceStr(chatConcent);
            this.SendOne(sendID, recvID, chatConcent, ipAddress);
            break;
        case eChatType.WORLD:
            chatConcent = this.ReplaceStr(chatConcent);
            this.SendWorld(sendID, chatConcent, ipAddress);
            break;
        case eChatType.GM:
            var chat = this.chat(chatType, sendID, recvID, chatConcent);
            this.chatList.push(chat);
            break;
        case eChatType.ROOM:
            chatConcent = this.ReplaceStr(chatConcent);
            this.SendRoom(sendID, chatConcent);
            break;
    }
};
/*
 param:
 type:           公告类型  1.弹窗公告  2.滚动公告
 partitionType： 公告作用域   0.全区  >0.单服
 startTime:      开始时间（秒数）
 endTime:        结束时间（秒数）  0 表示不设结束时间
 freq:           频率（毫秒数） 每过多少毫秒刷一次
 count:          刷公告次数（整数）
 content:        公告内容（字符串）
 priority:       公告优先级  1.高优先级，放队列头  0.低优先级，放队列尾
 */
Handler.SendGMChat = function (type, partitionType, startTime, endTime, freq, count, content, priority) {
    if (partitionType == 0) {
        var chatID = this.GMChatOffsetWorld + 1;
    } else {
        var chatID = this.GMChatOffset + 1;
    }
    for (var index in this.gmChatMap) {
        if (chatID == this.gmChatMap[index].chatID) {
            logger.info('GM公告ID冲突');
            var res = {
                Result: errorCodes.SystemWrong,
                RetMsg: "GM公告ID冲突",
                NoticeId: chatID
            };
            return res;
        }
    }
    var startTm = new Date(startTime * 1000);
    var nowTm = new Date();
    if (startTm < nowTm) {
        logger.info('GM公告开始时间过期');
        var res = {
            Result: errorCodes.SystemWrong,
            RetMsg: "GM公告开始时间过期",
            NoticeId: chatID
        };
        return res;
    }
    if (endTime != null && endTime != undefined && endTime != 0) {
        var endTm = new Date(endTime * 1000);
        if (endTm < nowTm) {
            logger.info('GM公告结束时间无效');
            var res = {
                Result: errorCodes.SystemWrong,
                RetMsg: "GM公告结束时间无效",
                NoticeId: chatID
            };
            return res;
        }
    } else {
        var endTm = 0;
    }
    if (0 == count) {
        var infinity = true;
    } else {
        var infinity = false;
    }
    var chat = this.gmChat(type, chatID, startTm, endTm, freq, count, content, priority, infinity);
    this.gmChatMap[chatID] = chat;

    var res = {
        Result: errorCodes.OK,
        RetMsg: "OK.",
        NoticeId: chatID
    };
    if (partitionType == 0) {
        this.GMChatOffsetWorld++;
    } else {
        this.GMChatOffset++;
    }
    return res;
};

Handler.SendOne = function (sendID, recvID, chatConcent, ipAddress) {
    var sendPlayer = this.playerList[sendID];
    if (!sendPlayer) {
        return false;
    }
    var recvPlayer = this.playerList[recvID];
    if (!recvPlayer) {
        return false;
    }
    var msg = {
        chatMsg: {
            chatType: eChatType.ONE,
            sendID: sendID,
            sendName: sendPlayer.GetName(),
            recvID: recvID,
            revName: recvPlayer.GetName(),
            chatContent: chatConcent
        }
    };
    recvPlayer.SendMessage(msg);
    sendPlayer.SendMessage(msg);
    ////////////////////////////////////
    var log_Date = new Date();
    var log_args = [log_getGuid.GetUuid(), eChatType.ONE, sendID, recvID, chatConcent,
                    log_utilSql.DateToString(log_Date)];
    log_insLogSql.InsertSql(log_eTableTypeInfo.Chat, log_args);
    ////////////////////////////////////
    var openID = sendPlayer.openID;
    var accountType = sendPlayer.accountType;
    var recvOpenID = recvPlayer.openID;
    if (ipAddress == null) {
        ipAddress = 0
    }
    var areaID = config.vendors.tencent.areaId;
    var zoneID = config.list.serverUid;
    tlogger.log('SecTalkFlow', accountType, openID, sendID, 0, 0, ipAddress, recvOpenID, recvID, 0, 1, 0, chatConcent,
                areaID, zoneID, sendID);
};

Handler.SendWorld = function (sendID, chatConcent, ipAddress) {
    var sendPlayer = this.playerList[sendID];
    if (null == sendPlayer) {
        return false;
    }
    var sendTime = this.sendChatList[sendID];
    if (null == sendTime || sendTime > Date.now()) {      //判断玩家的世界聊天CD时间是否已到
        logger.warn('player SendWorld chat time is not arrive, roleID: %j, chatConcent: %j', sendID, chatConcent);
        return false;
    }
    this.sendChatList[sendID] = Date.now() + defaultValues.chatCDTime;   //将玩家的世界聊天CD时间延迟
    var msg = {
        chatMsg: {
            chatType: eChatType.WORLD,
            sendID: sendID,
            sendName: sendPlayer.GetName(),
            chatContent: chatConcent
        }
    };

    //将循环遍历发送rpc改为广播

    enqueue(this, msg);
    /*
     var route = 'ServerChat_Self';
     messageService.broadcast(route, msg);*/
    /*    for (var index in this.playerList) {
     var player = this.playerList[index];
     player.SendMessage(msg);
     }*/
    ////////////////////////////////////
    var log_Date = new Date();
    var log_args = [log_getGuid.GetUuid(), eChatType.WORLD, sendID, 0, chatConcent, log_utilSql.DateToString(log_Date)];
    log_insLogSql.InsertSql(log_eTableTypeInfo.Chat, log_args);
    ////////////////////////////////////
    var openID = sendPlayer.openID;
    var accountType = sendPlayer.accountType;
    if (ipAddress == null) {
        ipAddress = 0
    }
    var areaID = config.vendors.tencent.areaId;
    var zoneID = config.list.serverUid;
    tlogger.log('SecTalkFlow', accountType, openID, sendID, 0, 0, ipAddress, 0, 0, 0, 2, 0, chatConcent, areaID, zoneID,
                sendID);

};

Handler.SendRoom = function (sendID, chatConcent) {
    var sendPlayer = this.playerList[sendID];
    if (null == sendPlayer) {
        return false;
    }
    var roomInfo = sendPlayer.GetRoomInfo();
    var customID = roomInfo.customID;
    var roomID = roomInfo.roomID;
    if (customID == 0) {
        return;
    }
    var msg = {
        chatMsg: {
            chatType: eChatType.ROOM,
            sendID: sendID,
            sendName: sendPlayer.GetName(),
            chatContent: chatConcent
        }
    };
    var playerList = roomManager.GetRoomList(customID, roomID);
    for (var index in playerList) {
        var roleID = playerList[index];
        var player = this.playerList[roleID];
        if (!!player) {
            player.SendMessage(msg);
        }
        else {
            logger.info('player is none: %j', roleID);
        }
    }
    ////////////////////////////////////
    var log_Date = new Date();
    var log_args = [log_getGuid.GetUuid(), eChatType.ROOM, sendID, 0, chatConcent, log_utilSql.DateToString(log_Date)];
    log_insLogSql.InsertSql(log_eTableTypeInfo.Chat, log_args);
    ////////////////////////////////////
};

Handler.SendGM = function (chatConcent) {
    var msg = {
        chatMsg: {
            chatType: eChatType.GM,
            chatContent: chatConcent
        }
    };

    //将循环遍历发送rpc改为广播
    var route = 'ServerChat_Self';
    messageService.broadcast(route, msg);
    /*    for (var index in this.playerList) {
     var player = this.playerList[index];
     player.SendMessage(msg);
     }*/
    ////////////////////////////////////
    var log_Date = new Date();
    var log_args = [log_getGuid.GetUuid(), eChatType.GM, 0, 0, chatConcent, log_utilSql.DateToString(log_Date)];
    log_insLogSql.InsertSql(log_eTableTypeInfo.Chat, log_args);
    ////////////////////////////////////
};
/**
 * 工会聊天
 * @param sendID  角色ID
 * @param chatConcent 发送内容
 * @constructor
 */
Handler.SendGroup = function (sendID, chatConcent, callback) {
    var self = this;
    var sendPlayer = this.playerList[sendID];
    var RChatConcent = this.ReplaceStr(chatConcent);
    if (null == sendPlayer) {
        return false;
    }
    var msg = {
        chatMsg: {
            chatType: eChatType.GROUP,
            sendID: sendID,
            sendName: sendPlayer.GetName(),
            chatContent: RChatConcent
        }
    };
    self.GetUnionMemberID(sendID, function (err, memberIDs) {
        if (!!err) {
            logger.error("error when chat playerManager SendGroup %s", utils.getErrorMessage(err));
            memberIDs = [];
            return callback();
        }
        if (memberIDs.length > 0) {
            for (var index in memberIDs) {
                var roleID = +memberIDs[index];
                var player = self.playerList[roleID];
                if (!!player) {
                    player.SendMessage(msg);
                }
                else {
                    logger.info('player is none: %j', roleID);
                }
            }
        }
        return callback();
    });
};
Handler.UpdateGMChat = function (nowTime) {
    for (var index in this.gmChatMap) {
        var gmChat = this.gmChatMap[index];
        if (gmChat.endTime != null
                && gmChat.endTime != undefined
            && gmChat.endTime != 0) {
            if (nowTime >= gmChat.endTime) {
                delete this.gmChatMap[index];
            }
        }
        if (nowTime >= gmChat.startTime) {
            var chat = this.chat(eChatType.GM, 0, 0, gmChat.content);
            if (gmChat.priority == 1) {
                this.chatList.unshift(chat);
            } else if (gmChat.priority == 0) {
                this.chatList.push(chat);
            }
            gmChat.startTime = new Date(gmChat.startTime.getTime() + gmChat.freq);
            if (!gmChat.infinity) {
                gmChat.count -= 1;
                if (gmChat.count == 0) {
                    delete this.gmChatMap[index];
                }
            }
        }
    }
};

Handler.QueryGMChat = function () {
    var count = 0;
    var list = [];
    var retErrMsg = 'OK'
    for (var index in this.gmChatMap) {
        var chatUnit = this.gmChatMap[index];
        var content = urlencode(chatUnit.content.toString('utf8'));
        var ret = {
            Type: chatUnit.type,
            NoticeId: chatUnit.chatID,
            NoticeTitle: '',
            NoticeContent: content,
            PageNo: 1,
            PageNum: 1
        }
        list.push(ret);
        count++;
    }
    if (count == 0) {
        retErrMsg = '系统内无任何GM公告';
    }
    return {RetErrMsg: retErrMsg, NoticeList_count: count, NoticeList: list};
}

Handler.DeleteGMChat = function (chatID) {
    if (chatID in this.gmChatMap) {
        delete this.gmChatMap[chatID];
        var res = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };
        return {Result: errorCodes.OK, RetMsg: "OK."};
    } else {
        return {Result: errorCodes.SystemWrong, RetMsg: "系统内无此ID的GM公告，ID = " + chatID};
    }
};

Handler.SendChatInterval = function () {
    if (this.chatList.length != 0) {
        var chat = this.chatList.shift();
        this.SendGM(chat.chatConcent);
    }

    // 禁言列表，遍历查看过期数据 将其删掉
    for (var i in this.forbidChatList) {
        if (new Date(this.forbidChatList[i]['time']).getTime() < new Date().getTime()) {
            delete this.forbidChatList[i];
        }
    }
};

Handler.SetSendChatTime = function (roleID, data, callback) {     //设置禁言时间
    this.sendChatList[roleID] = new Date(data.time).getTime();
    this.forbidChatList[roleID] = data;

    return callback();
};

Handler.GetSendChatTime = function (roleID) {     //获取禁言时间
    if (null != this.sendChatList[roleID]) {
        return this.sendChatList[roleID];
    }
    return 0;
};

Handler.GetForbidChat = function (roleID) {
    if (roleID in this.forbidChatList) {
        return this.forbidChatList[roleID];
    }
    return {};
};

/**
 * 刷新世界聊天队列
 * @param {Number} nowTime
 * @api public
 * */
Handler.updateWorld = function (nowTime) {
    flush(this);
};

/**
 * 添加世界聊天队列
 * @param {Object} self player 管理器
 * @param {Object} msg 聊天消息
 * @api private
 * */
var enqueue = function (self, msg) {
    if (self.worldQueue.length < 20) {
        self.worldQueue.push(msg);
    }
};

/**
 * 刷新世界聊天队列， 每分钟发一次，或者 队列长度大于100 时也刷新一次
 * @param {Object} self
 * @api private
 * */
var flush = function (self) {

    var route = 'ServerChat_Self';
    var queue = self.worldQueue;

    if (!queue || queue.length === 0) {
        return;
    }

    messageService.broadcast(route, queue, {});
    self.worldQueue = [];
};

/***
 * 获取工会的成员信息
 * @param roleID
 * @constructor
 */
Handler.GetUnionMemberID = function (roleID, callback) {
    pomelo.app.rpc.us.usRemote.GetUnionMemberID(null, roleID, function (err, memberIDList) {
        if (!!err) {
            logger.error("error when chat playerManager GetUnionMemberID %s", utils.getErrorMessage(err));
            callback(null, []);
        }
        callback(null, memberIDList);
    });
};

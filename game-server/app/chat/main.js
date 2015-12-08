/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-29
 * Time: 下午4:03
 * To change this template use File | Settings | File Templates.
 */
var playerManager = require('./player/playerManager');
var zhuanPanManager = require('./zhuanpan/zhuanPanManager');
var roomManager = require('./room/roomManager');
///////////////////////////////////////
var logClient = require('../tools/mysql/logClient');
var config = require('../tools/config');
///////////////////////////////////////
var gameClient = require('../tools/mysql/gameClient');

var templateManager = require('../tools/templateManager');
var templateConst = require('../../template/templateConst');
var tNotice = templateConst.tNotice;
var gameConst = require('../tools/constValue');
var eChatType = gameConst.eChatType;
var Q = require('q');

var Handler = module.exports;

Handler.InitServer = function () {
    playerManager.Init();
    zhuanPanManager.Init();
    roomManager.Init();
    setInterval(SysNotice, 2 * 60000);
    //setInterval( SendTestMsg, 60000 );
    setInterval(UpdateGMChat, 500);
    /** 1秒钟刷新一次世界聊天*/
    setInterval(updateWorld, 1000);

    return Q.resolve();
};

function SendTestMsg() {
    playerManager.SendChat(10, 0, 0, '大家新年快乐，马上有钱，马上发财，马上中大奖。')
};

var sysNoticeIndex = 1;

function SysNotice() {
    var noticeTempalteID = 'system_1';
    var noticeTempalte = templateManager.GetTemplateByID('NoticeTempalte', noticeTempalteID);
    if (null != noticeTempalte) {
        var noticeNum = noticeTempalte[tNotice.noticeEndStr];
        var sysID = 'system_' + sysNoticeIndex;
        var sysNoticeTempalte = templateManager.GetTemplateByID('NoticeTempalte', sysID);
        if (null != sysNoticeTempalte) {
            var chatContent = sysNoticeTempalte[tNotice.noticeBeginStr];
            playerManager.SendChat(eChatType.GM, 0, 0, chatContent);
        }
        ++sysNoticeIndex;
        if (sysNoticeIndex > noticeNum) {
            sysNoticeIndex = 1;
        }
    }
};

function UpdateGMChat() {
    var nowTime = new Date();
    playerManager.UpdateGMChat(nowTime);
};

function updateWorld() {
    var nowTime = new Date();
    playerManager.updateWorld(nowTime);
};
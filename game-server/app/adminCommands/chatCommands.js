/**
 * Created by xykong on 2014/7/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('./../tools/constValue');
var defaultValues = require('./../tools/defaultValues');
var errorCodes = require('./../tools/errorCodes');
var utilSql = require('./../tools/mysql/utilSql');
var playerManager = require('../chat/player/playerManager');
var gmSql = require('./../tools/mysql/gmSql');
var utils = require('./../tools/utils');
var Q = require('q');
var _ = require('underscore');
var urlencode = require('urlencode');
var config = require('../tools/config');

var handler = module.exports = {

};

handler.Reload = function () {
    var module = './chatCommands';
    delete require.cache[require.resolve(module)];
    var chatCommands = require(module);
    pomelo.app.set('chatCommands', chatCommands);
    return errorCodes.OK;
};

/* 发送停服前通知 */
//[cmd]: 10084016
//
//[request]: IDIP_DO_SEND_CLOSEAREA_NOTICE_REQ
//    "PlatId" : ,             /* 平台：IOS（0），安卓（1），全部（2） */
//    "Cycle" : ,              /* 弹出周期：打开APP，读取logo后弹出 */
//    "NoticeTitle" : "",      /* 公告标题 */
//    "NoticeContent" : "",    /* 公告内容 */
//    "BeginTime" : ,          /* 开始时间 */
//    "EndTime" : ,            /* 结束时间：不配置，则表示不限制结束时间 */
//    "Source" : ,             /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""            /* 流水号，由前端生成，不需要填写 */
//    "AreaId" :               /* 服务器：微信（1），手Q（2） */
//
//[rsponse]: IDIP_DO_SEND_CLOSEAREA_NOTICE_RSP
//    "Result" : ,      /* 结果 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_closearea_notice = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var startTime = +req_value.BeginTime;
        var endTime = +req_value.EndTime;
        var chatContent = '' + req_value.NoticeContent;
        chatContent = urlencode.decode(chatContent, 'utf8');

        var res = playerManager.SendGMChat(2, 0, startTime, endTime, 0, 1, chatContent, 1);
        rsp_result.Result = res.Result;
        rsp_result.RetErrMsg = res.RetMsg;

        rsp_value.Result = res.Result;
        rsp_value.RetMsg = res.RetMsg;

        return callback(null, [rsp_result, rsp_value]);
    }
};

/* 发送游戏内公告 */
//[cmd]: 10084017
//
//[request]: IDIP_DO_SEND_GAME_NOTICE_REQ
//    "AreaId" : ,             /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,          /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,             /* 平台：IOS（0），安卓（1），全部（2） */
//    "Type" : ,               /* 内容类型：文本（0），图片（1） */
//    "Cycle" : ,              /* 弹出周期：1每日首次登录后弹出，2每日登录后弹出，3进入游戏主界面后弹出 */
//    "Url" : "",              /* 跳转url（0表示无） */
//    "SendWay" : ,            /* 发送方式：0 公告、1 邮件、2 Both */
//    "NoticeTitle" : "",      /* 公告标题 */
//    "NoticeContent" : "",    /* 公告内容 */
//    "BeginTime" : ,          /* 开始时间 */
//    "EndTime" : ,            /* 结束时间：不配置，则表示不限制结束时间     */
//    "NoticeType" : ,         /* 公告类型：1 弹窗公告，2滚动公告 */
//    "Source" : ,             /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""            /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_GAME_NOTICE_RSP
//    "NoticeId" : ,    /* 公告ID */
//    "Result" : ,      /* 结果 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_game_notice = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK.",
            NoticeId: 0
        };

//        if(req_value.SendWay == 0) {
//            if(req_value.NoticeType == 2) {
        var startTime = +req_value.BeginTime;
        var endTime = +req_value.EndTime;
        var chatContent = '' + req_value.NoticeContent;
        chatContent = urlencode.decode(chatContent, 'utf8');

        var res = playerManager.SendGMChat(req_value.NoticeType, 1, startTime, endTime, 0, 1, chatContent, 0);
        rsp_result.Result = res.Result;
        rsp_result.RetErrMsg = res.RetMsg;

        rsp_value.Result = res.Result;
        rsp_value.RetMsg = res.RetMsg;
        rsp_value.NoticeId = res.NoticeId;
//            }
//        }

        return callback(null, [rsp_result, rsp_value]);
    }
};

/* 发送滚动公告 */
//[cmd]: 10084018
//
//[request]: IDIP_DO_SEND_ROLLNOTICE_REQ
//    "AreaId" : ,             /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,          /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,             /* 平台：IOS（0），安卓（1），全部（2） */
//    "NoticeContent" : "",    /* 公告内容 */
//    "BeginTime" : ,          /* 开始时间 */
//    "EndTime" : ,            /* 结束时间 */
//    "Freq" : ,               /* 滚动频率 */
//    "Speed" : ,              /* 滚动速度 */
//    "Times" : ,              /* 滚动次数限制：0表示不限制次数 */
//    "Source" : ,             /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""            /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_ROLLNOTICE_RSP
//    "NoticeId" : ,    /* 公告ID */
//    "Result" : ,      /* 结果 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_rollnotice = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK.",
            NoticeId: 0,
            Partition: config.list && config.list.serverUid || config.gameServerList.serverUid
        };

        var startTime = +req_value.BeginTime;
        var endTime = +req_value.EndTime;
        var freq = +req_value.Freq;
        var times = +req_value.Times;
        var chatContent = '' + req_value.NoticeContent;
        chatContent = urlencode.decode(chatContent, 'utf8');
        var partitionType = req_value.Partition;

        var res = playerManager.SendGMChat(2, partitionType, startTime, endTime, freq, times, chatContent, 0);
        rsp_result.Result = res.Result;
        rsp_result.RetErrMsg = res.RetMsg;

        rsp_value.Result = res.Result;
        rsp_value.RetMsg = res.RetMsg;
        rsp_value.NoticeId = res.NoticeId;

        return callback(null, [rsp_result, rsp_value]);
    }
};

/* 查询公告 */
//[cmd]: 10084019
//
//[request]: IDIP_QUERY_NOTICE_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "Type" : ,         /* 公告类型：1 弹窗公告，2滚动公告，3停服通知  */
//    "BeginTime" : ,    /* 开始时间 */
//    "EndTime" : ,      /* 结束时间 */
//    "PageNo" :         /* 页码 */
//
//[rsponse]: IDIP_QUERY_NOTICE_RSP
//    "NoticeList_count" : ,    /* 公告信息列表的最大数量 */
//    "NoticeList" :            /* 公告信息列表 */
//    [
//        {
//            "Type" : ,               /* 公告类型 */
//            "NoticeId" : ,           /* 公告ID */
//            "NoticeTitle" : "",      /* 公告标题 */
//            "NoticeContent" : "",    /* 公告内容 */
//            "PageNo" : ,             /* 页码 */
//            "PageNum" :              /* 总页数 */
//        }
//    ]
handler.query_notice = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            NoticeList_count: 0,
            NoticeList: []
        };

        var res = playerManager.QueryGMChat();

        rsp_value.NoticeList_count = res.NoticeList_count;
        rsp_value.NoticeList = res.NoticeList;

        return callback(null, [rsp_result, rsp_value]);
    }
};

/* 删除公告 */
//[cmd]: 10084020
//
//[request]: IDIP_DO_DEL_NOTICE_REQ
//    "AreaId" : ,      /* 服务器：微信（1），手Q（2） */
//    "PlatId" : ,      /* 平台：IOS（0），安卓（1），全部（2） */
//    "Type" : ,        /* 公告类型：1 弹窗公告，2滚动公告，3停服通知   */
//    "NoticeId" : ,    /* 公告ID */
//    "Source" : ,      /* 渠道号，由前端生成，不需填写 */
//    "Serial" : ""     /* 流水号，由前端生成，不需填写 */
//
//[rsponse]: IDIP_DO_DEL_NOTICE_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_del_notice = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK.",
            Partition: config.list && config.list.serverUid || config.gameServerList.serverUid
        };

        var noticeID = +req_value.NoticeId;
        var res = playerManager.DeleteGMChat(noticeID);
        rsp_result.Result = res.Result;
        rsp_result.RetErrMsg = res.RetMsg;

        rsp_value.Result = res.Result;
        rsp_value.RetMsg = res.RetMsg;

        return callback(null, [rsp_result, rsp_value]);
    }
};

/* 设置禁言时间（AQ） */
//[cmd]: 10084823
//
//[request]: IDIP_AQ_DO_MASKCHAT_ROLE_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Time" : ,       /* 禁言时长(秒) */
//    "Reason" : "",     /* 禁言提示原因 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_MASKCHAT_ROLE_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_maskchat_role = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var openID = req_value.OpenId;
        var roleID = +req_value.RoleId;
        var second = +req_value.Time;
        var reason = req_value.Reason;
        reason = urlencode.decode(reason, 'utf8');

        Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
            .then(function (res) {
                      var accountID = res;
                      if (!roleID || !second || !accountID) {
                          rsp_result.Result = errorCodes.ParameterWrong;
                          rsp_result.RetErrMsg = 'ParameterWrong';

                          rsp_value.Result = errorCodes.ParameterWrong;
                          rsp_value.RetMsg = 'ParameterWrong';

                          return callback(null, [rsp_result, rsp_value]);
                      }
                      var player = playerManager.GetPlayer(roleID);
                      var canSendTime = new Date().getTime() + second * 1000;
                      if (!!player) {
                          var data_packet = {
                              body: {
                                  accountID: accountID
                              },
                              command: {
                                  "path": "kickUserOut",
                                  "server": "psIdip"
                              }
                          };
                          pomelo.app.rpc.psIdip.psIdipRemote.idipCommands(null, data_packet, utils.done);
                      }

                      var data = {'time': utilSql.DateToString(new Date(canSendTime)), 'reason': reason};
                      playerManager.SetSendChatTime(roleID, data, utils.done);
                      data = JSON.stringify(data);
                      gmSql.SetForbidChatTime(roleID, data, function (err, res) {
                          if (!!err) {
                              rsp_result.Result = errorCodes.SystemWrong;
                              rsp_result.RetErrMsg = utils.getErrorMessage(err);
                              return callback(null, [rsp_result, rsp_value]);
                          }
                          return callback(null, [rsp_result, rsp_value]);
                      });
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = "SystemWrong";

                       rsp_value.Result = errorCodes.SystemWrong;
                       rsp_value.RetMsg = "parameter";

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};
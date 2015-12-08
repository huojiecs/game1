/**
 * Created by xykong on 2014/7/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('./../tools/constValue');
var defaultValues = require('./../tools/defaultValues');
var errorCodes = require('./../tools/errorCodes');
var mailManager = require('./../ms/mail/mailManager');
var templateManager = require('./../tools/templateManager');
var util = require('util');
var _ = require('underscore');
var gmSql = require('./../tools/mysql/gmSql');
var urlencode = require('urlencode');
var utils = require('../tools/utils');

var handler = module.exports = {

};

/* 发送系统邮件送物品 */
//[cmd]: 10084015
//
//[request]: IDIP_DO_SEND_MAIL_ITEM_REQ
//    "AreaId" : ,                /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,             /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,                /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",              /* openid */
//    "RoleId" : ,                /* 角色ID */
//    "MailTitle" : "",           /* 邮件标题 */
//    "MailContent" : "",         /* 邮件内容 */
//    "MailItemList_count" : ,    /* 邮件物品信息列表的最大数量 */
//    "MailItemList" :            /* 邮件物品信息列表 */
//        [
//            {
//                "ItemId" : ,     /* 物品ID */
//                "ItemNum" :      /* 物品数量 */
//            }
//        ],
//    "Time" : ,                  /* 生效时间 */
//    "Source" : ,                /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""               /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_MAIL_ITEM_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_mail_item = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK." + utils.getFilenameLine()
        };

        var roleID = +req_value.RoleId;
        var mailTitle = urlencode.decode('' + req_value.MailTitle, 'utf8');
        var mailContent = urlencode.decode('' + req_value.MailContent, 'utf8');
        var mailItemCount = +req_value.MailItemList_count;
        var mailItemList = req_value.MailItemList;

        var errorString;

        if (_.isString(mailItemList)) {
            mailItemList = utils.strToArray(mailItemList, ['ItemId', 'ItemNum']);
        }

        if (!roleID || mailTitle.length === 0 || mailContent.length === 0) {

            errorString =
            util.format(' roleID: %j, MailItemList_count: %j, mailItemList: %j, mailTitle.length: %j, roleID: %j',
                        !roleID, !_.isNumber(req_value.MailItemList_count), !mailItemList,
                        !mailTitle.length, !mailContent.length);

            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }

        if (!!mailItemCount && (!_.isArray(mailItemList) || mailItemList.length != mailItemCount)) {

            errorString = util.format(' MailItemList_count: %j, mailItemList: %j', !mailItemCount, mailItemList);

            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }


        var itemList = [];
        for (var i = 0; i < mailItemCount; ++i) {
            var itemID = +mailItemList[i]['ItemId'];
            var itemNum = +mailItemList[i]['ItemNum'];
            var itemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
            if (!itemTemplate || itemNum < 0) {
                rsp_result.Result = errorCodes.ParameterWrong;
                rsp_result.RetErrMsg = 'No item or item number less zero' + utils.getFilenameLine();

                rsp_value.Result = errorCodes.ParameterWrong;
                rsp_value.RetMsg = 'No item or item number less zero' + utils.getFilenameLine();

                return callback(null, [rsp_result, rsp_value]);
            }
            itemList.push([itemID, itemNum]);
        }

        for (var i = 0; i < 5 - mailItemCount; ++i) {
            itemList.push([0, 0]);
        }

        var mailDetail = {
            recvID: roleID,
            subject: mailTitle,
            content: mailContent,
            mailType: gameConst.eMailType.System,
            items: itemList
        };

        mailManager.SendMail(mailDetail, function (err, result) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong' + utils.getFilenameLine();

                rsp_value.Result = errorCodes.SystemWrong;
                rsp_value.RetMsg = 'SystemWrong' + utils.getFilenameLine();
                return callback(null, [rsp_result, rsp_value]);
            }
            else if (result != 0) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong' + utils.getFilenameLine();

                rsp_value.Result = errorCodes.SystemWrong;
                rsp_value.RetMsg = 'SystemWrong' + utils.getFilenameLine();
                return callback(null, [rsp_result, rsp_value]);
            }
            return callback(null, [rsp_result, rsp_value]);
        });
    }
};


/* 发送系统邮件（AQ） */
//[cmd]: 10084811
//
//[request]: IDIP_AQ_DO_SEND_MAIL_REQ
//    "AreaId" : ,                /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,             /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,                /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",              /* openid */
//    "RoleId" : ,                /* 角色ID */
//    "MailContent" : "",         /* 邮件内容 */
//    "Source" : ,                /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""               /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_SEND_MAIL_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_send_mail = function (req_value) {
    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var mailTitle = '系统邮件';
        var mailContent = '' + req_value.MailContent;
        mailContent = urlencode.decode(mailContent, 'utf8');

        if (!roleID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }


        var mailDetail = {
            recvID: roleID,
            subject: mailTitle,
            content: mailContent,
            mailType: gameConst.eMailType.System,
            items: []
        };
        mailManager.SendMail(mailDetail, function (err, result) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong';

                rsp_value.Result = errorCodes.SystemWrong;
                rsp_value.RetMsg = 'SystemWrong';
                return callback(null, [rsp_result, rsp_value]);
            }
            else if (result != 0) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong';

                rsp_value.Result = errorCodes.SystemWrong;
                rsp_value.RetMsg = 'SystemWrong';
                return callback(null, [rsp_result, rsp_value]);
            }
            return callback(null, [rsp_result, rsp_value]);
        });
    }
};


/* 批量发送系统邮件送物品 */
//
//[request]: IDIP_DO_SEND_MAIL_ITEM_REQ
//    "AreaId" : ,                /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,             /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,                /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",              /* openid */
//    "RoleIds" : ,               /* 角色ID数组 */
//    "MailTitle" : "",           /* 邮件标题 */
//    "MailContent" : "",         /* 邮件内容 */
//    "MailItemList_count" : ,    /* 邮件物品信息列表的最大数量 */
//    "MailItemList" :            /* 邮件物品信息列表 */
//        [
//            {
//                "ItemId" : ,     /* 物品ID */
//                "ItemNum" :      /* 物品数量 */
//            }
//        ],
//    "Source" : ,                /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""               /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_MAIL_ITEM_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_prizemail = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleIDs = req_value.RoleIds || [];
        var mailTitle = '' + req_value.MailTitle;
        var mailContent = '' + req_value.MailContent;
        var mailItemCount = +req_value.MailItemList_count;
        var mailItemList = req_value.MailItemList;

        var errorString;

        if (_.isString(mailItemList)) {
            mailItemList = utils.strToArray(mailItemList, ['ItemId', 'ItemNum']);
        }

        if (!_.isNumber(req_value.MailItemList_count) || !mailItemList || mailTitle.length === 0
            || mailContent.length === 0) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }

        var itemList = [];
        for (var i = 0; i < mailItemCount; ++i) {
            var itemID = mailItemList[i]['ItemId'];
            var itemNum = mailItemList[i]['ItemNum'];
            var itemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
            if (!itemTemplate || itemNum < 0) {
                rsp_result.Result = errorCodes.ParameterWrong;
                rsp_result.RetErrMsg = 'No item or item number less zero';

                rsp_value.Result = errorCodes.ParameterWrong;
                rsp_value.RetMsg = 'No item or item number less zero';

                return callback(null, [rsp_result, rsp_value]);
            }
            itemList.push([itemID, itemNum]);
        }
        for (var i = 0; i < 5 - mailItemCount; ++i) {
            itemList.push([0, 0]);
        }

        var sendPrizeMail = function () {
            for (var i = 0; i < 100; i++) {
                if (roleIDs.length <= 0) {
                    return callback(null, [rsp_result, rsp_value]);
                }
                var roleID = roleIDs.splice(0, 1);
                var mailDetail = {
                    recvID: roleID[0],
                    subject: mailTitle,
                    content: mailContent,
                    mailType: gameConst.eMailType.System,
                    items: itemList
                };
                mailManager.SendMail(mailDetail, function (err, result) {
                    if (!!err) {
                        rsp_result.Result = errorCodes.SystemWrong;
                        rsp_result.RetErrMsg = 'SystemWrong';

                        rsp_value.Result = errorCodes.SystemWrong;
                        rsp_value.RetMsg = 'SystemWrong';
                        return callback(null, [rsp_result, rsp_value]);
                    }
                    else if (result != 0) {
                        rsp_result.Result = errorCodes.SystemWrong;
                        rsp_result.RetErrMsg = 'SystemWrong';

                        rsp_value.Result = errorCodes.SystemWrong;
                        rsp_value.RetMsg = 'SystemWrong';
                        return callback(null, [rsp_result, rsp_value]);
                    }
                });
            }
            setTimeout(sendPrizeMail, 1000);
        };
        sendPrizeMail();
    }
};

/* 全服邮件 */
//[cmd]: 10084022
//
//[request]: IDIP_DO_SEND_MAIL_ALL_REQ
//   "AreaId" : ,                   /* 服务器：微信（1），手Q（2） */
//   "Partition" : ,                /* 小区 */
//   "PlatId" : ,                   /* 平台：IOS（0），安卓（1）,全部（2） */
//   "MailTitle" : "",              /* 邮件标题 */
//   "MailContent" : "",            /* 邮件内容 */
//   "AllMailItemList_count" : ,    /* 道具列表的最大数量 */
//   "AllMailItemList" :            /* 道具列表 */
//   [
//       {
//          "ItemId" : ,     /* 物品ID */
//          "ItemNum" :      /* 物品数量 */
//       }
//   ],
//   "Star" : ,                     /* 装备星级：0表示随机 */
//   "Source" : ,                   /* 渠道号，由前端生成，不需要填写 */
//   "Serial" : ""                  /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_MAIL_ALL_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_mail_all = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK.",
            Partition: +req_value.Partition
        };

        var mailTitle = urlencode.decode('' + req_value.MailTitle, 'utf8');
        var mailContent = urlencode.decode('' + req_value.MailContent, 'utf8');
        var mailItemCount = +req_value.AllMailItemList_count;
        var mailItemList = req_value.AllMailItemList;
        var serverUid = +req_value.Partition;

        var errorString;

        if (_.isString(mailItemList)) {
            mailItemList = utils.strToArray(mailItemList, ['ItemId', 'ItemNum']);
        }

        if (mailTitle.length === 0 || mailContent.length === 0) {

            errorString = util.format(' MailItemList_count: %j, mailItemList: %j, mailTitle.length: %j, roleID: %j',
                                      !_.isNumber(req_value.MailItemList_count), !mailItemList, !mailTitle.length,
                                      !mailContent.length);

            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }

        if (!!mailItemCount && (!_.isArray(mailItemList) || mailItemList.length != mailItemCount)) {

            errorString = util.format(' AllMailItemList_count: %j, mailItemList: %j', !mailItemCount, mailItemList);

            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }

        gmSql.GetRoleIdsByServerUid(serverUid, function (err, res) {
            if (err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = "SystemWrong" + utils.getFilenameLine();

                rsp_value.Result = errorCodes.SystemWrong;
                rsp_value.RetMsg = "SystemWrong" + utils.getFilenameLine();

                return callback(null, [rsp_result, rsp_value]);
            }

            var roleIDs = _.pluck(res, 'roleID');

            var itemList = [];
            for (var i = 0; i < mailItemCount; ++i) {
                var itemID = +mailItemList[i]['ItemId'];
                var itemNum = +mailItemList[i]['ItemNum'];
                var itemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
                if (!itemTemplate || itemNum < 0) {
                    rsp_result.Result = errorCodes.ParameterWrong;
                    rsp_result.RetErrMsg = 'No item or item number less zero' + utils.getFilenameLine();

                    rsp_value.Result = errorCodes.ParameterWrong;
                    rsp_value.RetMsg = 'No item or item number less zero' + utils.getFilenameLine();

                    return callback(null, [rsp_result, rsp_value]);
                }
                itemList.push([itemID, itemNum]);
            }
            for (var i = 0; i < 5 - mailItemCount; ++i) {
                itemList.push([0, 0]);
            }

            callback(null, [rsp_result, rsp_value]); // 直接callback不return，不然idip报 timeout，功能还是照样走

            var sendMail = function (mailDetail) {
                mailManager.SendMail(mailDetail, function (err, result) {
                    if (!!err) {
                        logger.error('send mail error when idip, roleid=%d, errorinfo=%s', mailDetail.recvID,
                                     utils.getErrorMessage(err));
                    }
                    else if (result != 0) {
                        logger.error('send mail failed when idip, roleID=%d, result=%d', mailDetail.recvID, result);
                    }
                });
            };

            var sendPrizeMail = function () {
                for (var i = 0; i < 200; i++) {
                    if (roleIDs.length <= 0) {
                        return;
                    }
                    var roleID = roleIDs.splice(0, 1);
                    var mailDetail = {
                        recvID: roleID[0],
                        subject: mailTitle,
                        content: mailContent,
                        mailType: gameConst.eMailType.System,
                        items: itemList
                    };
                    sendMail(mailDetail);
                }
                setTimeout(sendPrizeMail, 1000);
            };
            sendPrizeMail();
        });

    }
};
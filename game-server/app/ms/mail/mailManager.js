/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-28
 * Time: 上午11:52
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var _ = require('underscore');
var Mail = require('./mail');
var messageService = require('../../tools/messageService');
var msSql = require('../../tools/mysql/msSql');
var globalFunction = require('../../tools/globalFunction');
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var config = require('../../tools/config');

var eMailInfo = gameConst.eMailInfo;
var eMailState = gameConst.eMailState;
var eMailType = gameConst.eMailType;
var stringValue = require('../../tools/stringValue');
var sMsString = stringValue.sMsString;
////////////////////////////////////
var log_insLogSql = require('../../tools/mysql/insLogSql');
var log_utilSql = require('../../tools/mysql/utilSql');
var log_getGuid = require('../../tools/guid');
var log_eTableTypeInfo = gameConst.eTableTypeInfo;
var log_eMailOperateType = gameConst.eMailOperateType;
////////////////////////////////////

var Handler = module.exports;

Handler.Init = function () {
    this.PlayerMails = {};
};

Handler.LoadDataByDB = function (roleID, name, uid, sid, openID, accountType) {
    var self = this;
    msSql.LoadMailList(roleID, function (err, mailList) {
        if (!!err) {
            logger.error('加载玩家好友出错%j', err.stack);
            return;
        }
        self.PlayerMails[roleID] = {
            mailList: {},
            uid: uid,
            sid: sid,
            name: name,
            openId: openID,
            accountType: accountType
        };

        self.AddMailToList(roleID, mailList);
    });
};

Handler.AddMailToList = function (roleID, mailList) {
    logger.warn('player login add mail to list,roleID: %j, mailList: %j',roleID, mailList);
    var tempList = this.PlayerMails[roleID];
    if (!tempList) {
        return;
    }

    for (var index in mailList) {
        var mailID = mailList[index][eMailInfo.MailID];
        var tempMail = new Mail();
        tempMail.SetAllInfo(mailList[index]);
        tempList.mailList[mailID] = tempMail;
    }

    this.DelFullMail(roleID);
    this.DelTimeOutMail(roleID);
    this.RecoveryStateFailMail(roleID);
    this.SendMailMsg(tempList.mailList, tempList.uid, tempList.sid, 0);
};

Handler.AddMailDetailToList = function (roleID, mailDetail) {
    if (null == this.PlayerMails) {
        return;
    }
    var tempList = this.PlayerMails[roleID];
    if (!tempList) {
        return;
    }

    var mailID = mailDetail.mailID;
    var tempMail = new Mail();
    tempMail.SetMailDetail(mailDetail);
    tempList.mailList[mailID] = tempMail;

    this.DelFullMail(roleID);
    this.DelTimeOutMail(roleID);
    this.SendMailMsg(tempList.mailList, tempList.uid, tempList.sid, 0);
};

Handler.DelMailByID = function (roleID, mailID) {
    var tempList = this.PlayerMails[roleID];
    if (null == tempList) {
        return;
    }
    delete tempList.mailList[mailID];
    this.SendMailMsg(tempList.mailList, tempList.uid, tempList.sid, 0);
};

Handler.DeletePlayer = function (roleID) {
    delete this.PlayerMails[roleID]
};

/**
 * @return {number}
 */
Handler.GetMailNum = function (roleID, mailType) {
    var tempList = this.PlayerMails[roleID];
    if (!tempList) {
        return defaultValues.mailNum;
    }
    var num = 0;
    for (var index in tempList.mailList) {
        var tempMail = tempList.mailList[index];
        if (tempMail.GetDataInfo(eMailInfo.MailType) === mailType) {
            ++num;
        }
    }
    return num;
};

Handler.ReplaceStr = function (str) {       //邮件屏蔽字
    str = str.toLowerCase();
    if(defaultValues.chatCheck) {   //只有腾讯版本去掉聊天中的空格
        str = str.replace(/\s+/g, "");
    }
    var strList = require('../../tools/templateManager').GetAllTemplate('NoTalk');
    for (var index in strList) {
        str = str.replace(strList[index], '*');
    }
    return str;
};

Handler.DelTimeOutMail = function (roleID) {    //系统邮件30后删除
    var tempList = this.PlayerMails[roleID];
    if (!tempList) {
        return;
    }
    var nowDate = new Date();
    for (var index in tempList.mailList) {
        var tempMail = tempList.mailList[index];
        if (tempMail.GetDataInfo(eMailInfo.MailType) == eMailType.System) {   //系统邮件
            var sendDate = new Date(tempMail.GetDataInfo(eMailInfo.SendTime));
            if ((defaultValues.sysmailDay - (parseInt((nowDate - sendDate) / 1000 / 60 / 60 / 24))) <= 0) {
                delete tempList.mailList[index];
            }
        }

        if (tempMail.GetDataInfo(eMailInfo.MailType) == eMailType.User) {   //用户邮件
            var sendDate = new Date(tempMail.GetDataInfo(eMailInfo.SendTime));
            if ((defaultValues.usermailDay - (parseInt((nowDate - sendDate) / 1000 / 60 / 60 / 24))) <= 0) {
                delete tempList.mailList[index];
            }
        }
    }
};

Handler.RecoveryStateFailMail = function (roleID) {    //恢复邮件状态不对的邮件
    var tempList = this.PlayerMails[roleID];
    if (!tempList) {
        return;
    }
    for (var index in tempList.mailList) {
        var tempMail = tempList.mailList[index];
        if (tempMail.GetDataInfo(eMailInfo.MailState) == eMailState.GetItem) {  //将首次加载邮件状态为获取物品的邮件设置为已读状态
            tempMail.SetDataInfo(eMailInfo.MailState, eMailState.Read);
        }
    }
};

Handler.DelFullMail = function (roleID) {
    var tempList = this.PlayerMails[roleID];
    if (!tempList) {
        return;
    }
    var mailNum = this.GetMailNum(roleID, eMailType.System) - defaultValues.mailNum;
    for (var i = 0; i < mailNum; ++i) {
        var delMailID = 0;
        for (var index in tempList.mailList) {
            var tempMail = tempList.mailList[index];
            if (tempMail.GetDataInfo(eMailInfo.MailType) == eMailType.System) {
                delMailID = index;
                break;
            }
        }
        delete tempList.mailList[delMailID];
    }
    mailNum = this.GetMailNum(roleID, eMailType.User) - defaultValues.mailNum;
    for (var i = 0; i < mailNum; ++i) {
        var delMailID = 0;
        for (var index in tempList.mailList) {
            var tempMail = tempList.mailList[index];
            if (tempMail.GetDataInfo(eMailInfo.MailType) == eMailType.User) {
                delMailID = index;
                break;
            }
        }
        delete tempList.mailList[delMailID];
    }
};

/**
 * 获取跨服邮件详细信息 添加必要的跨服信息
 * @param {Object} mailDetail 邮件信息
 * @return {object}
 * */
Handler.buildAcrossMail = function (mailDetail) {
    /** 添加跨服着服务器id*/
    mailDetail.sendUid = config.list.serverUid;

    if (mailDetail.roleID === mailDetail.recvID) {
        return errorCodes.Fs_Self;
    }

    var tempList = this.PlayerMails[mailDetail.roleID];
    if (!tempList) {
        return errorCodes.ParameterWrong;
    }

    mailDetail.sendName = '' + (mailDetail.sendName || tempList.name);

    return mailDetail;
};

Handler.SendMail = function (mailDetail, callback) {
    var self = this;

    if (!mailDetail) {
        return callback(null, errorCodes.ParameterNull);
    }

    if (!_.isNumber(mailDetail.recvID)
            || !mailDetail.recvID
            || !_.isString(mailDetail.subject)
            || !_.isString(mailDetail.content)
            || mailDetail.content.length === 0
            || !_.isNumber(mailDetail.mailType)
            || mailDetail.mailType > eMailType.User
        || mailDetail.mailType < eMailType.System
        ) {
        return callback(null, errorCodes.ParameterWrong);
    }

    var ipAddress = mailDetail.sendIpAddress; // for tlog
    delete mailDetail.sendIpAddress;

    if (mailDetail.mailType === eMailType.User) {
        if (!_.isNumber(mailDetail.roleID)) {
            return callback(null, errorCodes.ParameterWrong);
        }

        var tempList = this.PlayerMails[mailDetail.roleID];
        if (!tempList && !mailDetail.sendUid) {
            return callback(null, errorCodes.ParameterWrong);
        }

        mailDetail.sendName = '' + (mailDetail.sendName || tempList.name);

        mailDetail.subject = self.ReplaceStr(mailDetail.subject);
        mailDetail.content = self.ReplaceStr(mailDetail.content);
    }

    if (mailDetail.mailType === eMailType.System) {
        mailDetail.roleID = 0;
        mailDetail.sendName = sMsString.sendName;//'系统邮件';
    }
    if (null == mailDetail.sendUid) {
        mailDetail.sendUid = '';
    }

    if (mailDetail.roleID === mailDetail.recvID) {
        return callback(null, errorCodes.Fs_Self);
    }

    if (!_.isArray(mailDetail.items)) {
        mailDetail.items = [];
    }
    for (var i = mailDetail.items.length; i < defaultValues.mailItemNum; ++i) {
        mailDetail.items.push([0, 0]);
    }
    // Todo: check each item is [number, number].

    msSql.SendMail(mailDetail, function (err, result, mailID) {
        if (!!err) {
            logger.error('发送邮件出现错误:%s', err.stack);
            return callback(null, errorCodes.SystemWrong);
        }

        if (result > 0) {
            return callback(null, result);
        }

        mailDetail.mailID = mailID;
        mailDetail.mailState = eMailState.UnRead;
        mailDetail.sendTime = utilSql.DateToString(new Date());
        self.AddMailDetailToList(mailDetail.recvID, mailDetail);

        //////////////////////////////////////////////////////////////
        if (mailDetail.mailType === eMailType.User) {
            var roleID = mailDetail.roleID;
            var recvID = mailDetail.recvID;
            var title = mailDetail.subject;
            var content = mailDetail.content;
            var areaID = config.vendors.tencent.areaId;
            var zoneID = config.list.serverUid;
            if (roleID != 0) {
                if (!!self.PlayerMails[roleID]) {
                    var accountType = self.PlayerMails[roleID].accountType || gameConst.eLoginType.LT_CheckID;
                    var openID = self.PlayerMails[ roleID ].openId || 'default-openid';

                    tlogger.log('SecTalkFlow', accountType, openID, roleID, 0, 0, ipAddress, 0, recvID, 0, 0, title,
                                content, areaID, zoneID, roleID);
                }
            }
        }

//        ///////////////////////////////////
//        var log_args = [ log_getGuid.GetUuid(), log_eMailOperateType.SendMail, roleID, result, recvID, subject, content, mailType, log_utilSql.DateToString(new Date()),
//            itemList[0][0], itemList[0][1], itemList[1][0], itemList[1][1], itemList[2][0], itemList[2][1], itemList[3][0], itemList[3][1], itemList[4][0], itemList[4][1],
//            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, log_utilSql.DateToString(new Date()) ];
//        log_insLogSql.InsertSql(log_eTableTypeInfo.Mail, log_args);
//        ///////////////////////////////////

        return callback(null, 0);
    });
};

Handler.ReadMail = function (roleID, mailID, callback) {
    var self = this;
    var tempList = this.PlayerMails[roleID];
    if (null == tempList) {
        return callback(null, errorCodes.Ms_NoMail);
    }
    var oldMail = tempList.mailList[mailID];
    if (null == oldMail) {
        return callback(null, errorCodes.Ms_NoMail);
    }
    var oldState = oldMail.GetDataInfo(eMailInfo.MailState);
    if (oldState != eMailState.UnRead) {
        return callback(null, 0);
    }
    oldMail.SetDataInfo(eMailInfo.MailState, eMailState.Read);
    msSql.SetMailState(roleID, mailID, eMailState.Read, function (err, result) {
        if (!!err) {
            oldMail.SetDataInfo(eMailInfo.MailState, oldState);
            logger.error('发送邮件出现错误%j', err.stack);
            return callback(null, errorCodes.SystemWrong);
        }
        if (result == 0) {
            self.SendMailMsg([oldMail], tempList.uid, tempList.sid, 1);
            ///////////////////////////////////////////////////////////////////////
            var mailType = oldMail.GetDataInfo(eMailInfo.MailState);
            var accountType = self.PlayerMails[roleID].accountType;
            var openID = self.PlayerMails[roleID].openId || 'default-openid';
            tlogger.log('SnsFlow', accountType, openID, 1, 1, 5, mailType);
            ///////////////////////////////////////////////////////////////////////
        }
        else {
            oldMail.SetDataInfo(eMailInfo.MailState, oldState);
        }
        return callback(null, result);
    });
};

Handler.DelMail = function (roleID, mailID, callback) {
    var self = this;
    var itemList = self.GetMailItemNum(roleID, mailID);
    if (typeof itemList != 'number') {
        return callback(null, errorCodes.Ms_MailHaveItem);
    }
    else if (itemList != 0) {
        return callback(null, itemList);
    }
    msSql.DelMail(roleID, mailID, function (err, result) {
        if (!!err) {
            logger.error('发送邮件出现错误%j', err.stack);
            return callback(null, errorCodes.SystemWrong);
        }
        if (result == 0) {
            self.DelMailByID(roleID, mailID);
        }
        ///////////////////////////////////
        var log_args = [log_getGuid.GetUuid(), log_eMailOperateType.DelMail, roleID, mailID, 0, '', '', 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        log_utilSql.DateToString(new Date())];
        log_insLogSql.InsertSql(log_eTableTypeInfo.Mail, log_args);
        ///////////////////////////////////
        return callback(null, result);
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Handler.SetArgsItems = function (roleID, mailID, log_args, callback) {     //为sql语句的参数中的item项设置值(即获取邮件数据项赋值给sql语句)
    var self = this;
    var tempList = this.PlayerMails[roleID];
    if (null == tempList) {
        return callback(null, errorCodes.Ms_NoMail);
    }
    var oldMail = tempList.mailList[mailID];
    if (null == oldMail) {
        return callback(null, errorCodes.Ms_NoMail);
    }
    for (var i = 0; i < 5; i++) {
        log_args.push(oldMail.GetDataInfo(eMailInfo['ItemID_' + i]));
        log_args.push(oldMail.GetDataInfo(eMailInfo['ItemNum_' + i]));
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Handler.SetLeftArgsItems = function (roleID, mailID, log_args) {  //设置剩余的sql语句参数，并调用执行sql语句
    this.SetArgsItems(roleID, mailID, log_args, function (err, result) {  //设置获取物品之后的参数
        if (null != err) {
            logger.info('获取邮件物品失败 ' + result);
        }
    });
    log_args.push(log_utilSql.DateToString(new Date()));  //插入时间
    log_insLogSql.InsertSql(log_eTableTypeInfo.Mail, log_args); //执行sql语句
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.GetItem = function (roleID, mailID, csID, callback) {
    var self = this;
    var tempList = this.PlayerMails[roleID];
    if (null == tempList) {
        return callback(null, errorCodes.Ms_NoMail);
    }
    var oldMail = tempList.mailList[mailID];
    if (null == oldMail) {
        return callback(null, errorCodes.Ms_NoMail);
    }
    var oldState = oldMail.GetDataInfo(eMailInfo.MailState)
    if (oldState == eMailState.GetItem) {
        return callback(null, errorCodes.Ms_MailState);
    }
    ///////////////////////////////////
    var log_args = [log_getGuid.GetUuid(), log_eMailOperateType.GetMailItem, roleID];
    log_args.push(this.PlayerMails[roleID].mailList[mailID].GetDataInfo(eMailInfo.MailID));     //获取邮件的ID
    log_args.push(0);
    log_args.push('');
    log_args.push('');
    log_args.push(0);
    log_args.push(0);
    this.SetArgsItems(roleID, mailID, log_args, function (err, result) { //设置获取物品之前的参数
        if (null != err) {
            logger.info('获取邮件物品失败 ' + result);
        }
    });
    ///////////////////////////////////
    var itemList = this.GetMailItemNum(roleID, mailID);
    logger.warn('player get mail item, roleID: %j, mailID: %j, csID: %j, itemList: %j',roleID, mailID, csID, itemList);
    if (typeof itemList == 'number') {
        return callback(null, itemList)
    }
    oldMail.SetDataInfo(eMailInfo.MailState, eMailState.GetItem);
    msSql.SetMailState(roleID, mailID, eMailState.GetItem, function (err, result) {
        if (!!err) {
            ///////////////////////////////////
            self.SetLeftArgsItems(roleID, mailID, log_args);
            ///////////////////////////////////
            oldMail.SetDataInfo(eMailInfo.MailState, oldState);
            logger.error('获取邮件物品出现错误%j', err.stack);
            return callback(null, errorCodes.SystemWrong);
        }

        if (result === 0) {
            pomelo.app.rpc.cs.csRemote.GetMailItem(null, csID, roleID, mailID, itemList, function (err, result) {
                if (!!err) {
                    ///////////////////////////////////
                    self.SetLeftArgsItems(roleID, mailID, log_args);
                    ///////////////////////////////////
                    logger.error('cs获取邮件物品出现问题%j', err.stack);
                    oldMail.SetDataInfo(eMailInfo.MailState, oldState);
                    return callback(null, errorCodes.SystemWrong);
                }
                if (result.result > 0) {
                    oldMail.SetDataInfo(eMailInfo.MailState, oldState);
                    return callback(null, result.result);
                }
                msSql.GetMailItem(roleID, mailID, function (err, result) {
                    if (!!err) {
                        ///////////////////////////////////
                        self.SetLeftArgsItems(roleID, mailID, log_args);
                        ///////////////////////////////////
                        logger.error('sql设置邮件物品出现问题%j', err.stack);
                        return callback(null, errorCodes.SystemWrong);
                    }
                    ///////////////////////////////////
                    self.SetLeftArgsItems(roleID, mailID, log_args);
                    ///////////////////////////////////
                    oldMail.SetDataInfo(eMailInfo.MailState, eMailState.Read);
                    oldMail.SetItemZero();
                    self.SendMailMsg([oldMail], tempList.uid, tempList.sid, 1);
                    return callback(null, 0);
                })
            });
        }
        else {
            ///////////////////////////////////
            self.SetLeftArgsItems(roleID, mailID, log_args);
            ///////////////////////////////////
            oldMail.SetDataInfo(eMailInfo.MailState, oldState);
            return callback(null, result);
        }
    });
};

Handler.GetMailItemNum = function (roleID, mailID) {
    var tempList = this.PlayerMails[roleID];
    if (null == tempList) {
        return errorCodes.Ms_NoMail;
    }
    var oldMail = tempList.mailList[mailID];
    if (null == oldMail) {
        return errorCodes.Ms_NoMail;
    }
    var isItem = false;
    var itemList = [];
    for (var i = 0; i < defaultValues.mailItemNum; i++) {
        var temp = [];
        temp[0] = oldMail.GetDataInfo(eMailInfo['ItemID_' + i]);
        temp[1] = oldMail.GetDataInfo(eMailInfo['ItemNum_' + i]);
        if (temp[0] > 0) {
            isItem = true;
        }
        itemList.push(temp);
    }
    if (isItem == true) {
        return itemList;
    }
    else {
        return 0;
    }
};

Handler.SendMailMsg = function (mailList, uid, sid, nType) {
    var msg = {
        nType: nType,
        mailList: []
    };
    var route = 'ServerMailInfo';
    for (var index in mailList) {
        var temp = mailList[index];
        var tempMsg = {};
        for (var mIndex in eMailInfo) {
            tempMsg[mIndex] = temp.GetDataInfo(eMailInfo[mIndex]);
        }
        var mailDate = new Date(temp.GetDataInfo(eMailInfo.SendTime));  //发送时间
        var nowDate = new Date();   //当前时间
        if (isNaN(mailDate)) {
            mailDate = nowDate;
        }
        var leftSec = Math.floor((nowDate - mailDate) / 1000);
        tempMsg['leftSec'] = leftSec;
        msg.mailList.push(tempMsg);
    }
    messageService.pushMessageToPlayer({uid: uid, sid: sid}, route, msg);
};

Handler.GetPlayerMails = function (roleID) {
    if (roleID in this.PlayerMails) {
        return this.PlayerMails[roleID];
    }
    return null;
};
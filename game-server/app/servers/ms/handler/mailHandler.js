/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-28
 * Time: 下午3:17
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var mailManager = require('../../../ms/mail/mailManager');
var gameConst = require('../../../tools/constValue');
var eMailType = gameConst.eMailType;
var errorCodes = require('../../../tools/errorCodes');
var config = require('../../../tools/config');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.SendMail = function (msg, session, next) {
    var ipAddress = session.get('remoteAddress').ip;
    var roleID = session.get('roleID');
    var recvID = +msg.recvID;
    var subject = '' + msg.subject;
    var content = '' + msg.content;
    var serverUid = msg.serverUid;

    if (null == roleID || null == recvID || null == subject || null == content) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var mailDetail = {
        roleID: roleID,
        recvID: recvID,
        sendID: roleID,
        subject: subject,
        content: content,
        mailType: eMailType.User,
        sendIpAddress: ipAddress
    };

    /** 添加跨服判断*/
    if (null == serverUid || '' == serverUid || serverUid == config.list.serverUid) {
        mailManager.SendMail(mailDetail, function (err, result) {
            return next(null, {
                'result': result
            });
        });
    } else {
        /** build 跨服邮件*/
        mailDetail = mailManager.buildAcrossMail(mailDetail);
        if (typeof mailDetail == 'number') {
            return next(null, {
                'result': mailDetail
            });
        }
        pomelo.app.rpc.fs.fsRemote.sendAcrossMail(null, serverUid, mailDetail, function(err, res) {
            return next(null, {
                'result': res.result
            });
        });
    }
};

handler.ReadMail = function (msg, session, next) {
    var roleID = session.get('roleID');
    var mailID = msg.mailID;
    if (null == roleID || null == mailID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    mailManager.ReadMail(roleID, mailID, function (err, result) {
        return next(null, {
            'result': result
        });
    });
};

handler.DelMail = function (msg, session, next) {
    var roleID = session.get('roleID');
    var mailID = msg.mailID;
    if (null == roleID || null == mailID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    mailManager.DelMail(roleID, mailID, function (err, result) {
        return next(null, {
            'result': result
        });
    });
};

handler.GetItem = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    var mailID = msg.mailID;
    if (null == roleID || null == mailID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    mailManager.GetItem(roleID, mailID, csID, function (err, result) {
        return next(null, {
            'result': result
        });
    });
};
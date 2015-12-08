/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-29
 * Time: 下午3:10
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var mailManager = require('../../../ms/mail/mailManager');
var errorCodes = require('../../../tools/errorCodes');
var idipUtils = require('../../../tools/idipUtils');
var _ = require('underscore');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.GetMailList = function (roleID, name, uid, sid, openID, accountType, callback) {
    mailManager.LoadDataByDB(roleID, name, uid, sid, openID, accountType);
    if (_.isFunction(callback)) {
        return callback();
    }
};

handler.DeletePlayer = function (roleID, callback) {
    mailManager.DeletePlayer(roleID);
    return callback();
};

handler.SendMail = function (mailDetail, callback) {
    if (!_.isFunction(callback)) {
        callback = function () {
        };
    }
    mailManager.SendMail(mailDetail, callback);
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

    var mailCommands = require('../../../adminCommands/mailCommands');

    idipUtils.dispatchIdipCommands(mailCommands, data_packet, callback);
};

/**
 * 发送多封邮件 问题（邮件列表太多会不会有问题 暂时定为30？）
 * @param {Array} mailDetails 邮件列表
 * @param {function} callback
 * */
handler.SendMails = function (mailDetails, callback) {
    if (!_.isFunction(callback)) {
        callback = function () {
        };
    }
    for (var index in mailDetails) {
        mailManager.SendMail(mailDetails[index], callback);
    }
};
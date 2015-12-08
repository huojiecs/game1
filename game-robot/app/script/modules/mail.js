/**
 * Created by yqWang on 2014-03-10.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var mailData = require('./../../data/json/mail');


var Handler = module.exports = function (client, interval) {
    this.client = client;
    this.pomelo = client.pomelo;
    this.interval = interval;
};

var handler = Handler.prototype;

handler.run = function () {
    var self = this;

    setInterval(
        function () {
            self.update();
        }, self.interval);
};

handler.update = function () {
    var self = this;
    var msgList = mailData[Math.floor(Math.random() * (mailData.length - 2)) + 2];
    if (null == msgList) {
        logger.info('Get message failure');
        return;
    }
    var operTypeID = msgList[0];
    var recvID = msgList[1];
    var mailID = msgList[2];
    var theme = msgList[3];
    var content = msgList[4];
    switch (operTypeID) {
        case 0:
        {    //发送邮件
            self.SendMail(recvID, theme, content);
        }
            break;
        case 1:
        {    //查看邮件
            self.SeeMail(mailID);
        }
            break;
        case 2:
        {    //删除邮件
            self.DelMail(mailID);
        }
            break;
        case 3:
        {    //获取邮件物品
            self.GetItem(mailID);
        }
            break;
        default:
        {
            logger.info('操作类型错误');
        }
    }
};

handler.SendMail = function (recvID, theme, content) {
    var message = {};
    message['revID'] = recvID;
    message['theme'] = theme;
    message['content'] = content;
    monitor.begin('SendMail', 0);
    this.pomelo.request('ms.mailHandler.SendMail', message, function (result) {
        logger.info('SendMail result = ' + result.result);
        monitor.end('SendMail', 0);
    });
}

handler.SeeMail = function (mailID) {
    var message = {};
    message['mailID'] = mailID;
    monitor.begin('SeeMail', 0);
    this.pomelo.request('ms.mailHandler.ReadMail', message, function (result) {
        logger.info('SeeMail result = ' + result.result);
        monitor.end('SeeMail', 0);
    });
}

handler.DelMail = function (mailID) {
    var message = {};
    message['mailID'] = mailID;
    monitor.begin('DelMail', 0);
    this.pomelo.request('ms.mailHandler.DelMail', message, function (result) {
        logger.info('DelMail result = ' + result.result);
        monitor.end('DelMail', 0);
    });
}

handler.GetItem = function (mailID) {
    var message = {};
    message['mailID'] = mailID;
    monitor.begin('GetItem', 0);
    this.pomelo.request('ms.mailHandler.GetItem', message, function (result) {
        logger.info('GetItem result = ' + result.result);
        monitor.end('GetItem', 0);
    });
}

/**
 * Created by yqWang on 2014-03-08.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var friendData = require('./../../data/json/friend');


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
    var msgList = friendData[Math.floor(Math.random() * (friendData.length - 2)) + 2];
    if (null == msgList) {
        logger.info('Get message failure');
        return;
    }
    var operTypeID = msgList[0];
    var friendID = msgList[1];
    var agreeType = msgList[2];
    switch (operTypeID) {
        case 0:
        {    //添加好友
            self.AddFriend(friendID);
        }
            break;
        case 1:
        {    //同意添加
            self.AgreeFriend(friendID, agreeType);
        }
            break;
        case 2:
        {    //删除好友
            self.DelFriend(friendID);
        }
            break;
        default:
        {
            logger.info('操作类型错误');
        }
    }
};

handler.AddFriend = function (friendID) {
    var message = {};
    message['friendID'] = friendID;
    monitor.begin('AddFriend', 0);
    this.pomelo.request('fs.friendHandler.AddFriend', message, function (result) {
        logger.info('AddFriend result = ' + result.result);
        monitor.end('AddFriend', 0);
    });
};

handler.AgreeFriend = function (friendID, agreeType) {
    var message = {};
    message['friendID'] = friendID;
    message['nType'] = agreeType;
    monitor.begin('AgreeFriend', 0);
    this.pomelo.request('fs.friendHandler.AgreeFriend', message, function (result) {
        logger.info('AgreeFriend result = ' + result.result);
        monitor.end('AgreeFriend', 0);
    });
};

handler.DelFriend = function (friendID) {
    var message = {};
    message['friendID'] = friendID;
    monitor.begin('DelFriend', 0);
    this.pomelo.request('fs.friendHandler.DelFriend', message, function (result) {
        logger.info('DelFriend result = ' + result.result);
        monitor.end('DelFriend', 0);
    });
};
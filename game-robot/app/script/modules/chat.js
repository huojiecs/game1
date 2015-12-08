/**
 * Created by kazi on 14-3-7.
 */

var logger = require('pomelo-logger').getLogger("chat", __filename);
var monitor = require('./../monitor');
var chatStat = require('./../statistic').chatStat;
var _ = require('underscore');

var Handler = module.exports = function (client, interval) {
    this.client = client;
    this.pomelo = client.pomelo;
    this.interval = interval;
    this.responseTime = [];
    this.lastSendTime = new Date().getTime();
    this.timecnt = 0;
};

var handler = Handler.prototype;

handler.run = function () {
    var self = this;

    /*self.pomelo.on('ServerChat_Self', function (msg) {
     monitor.end('chat', 0);
     logger.info('ServerChat_Self:%j', msg);
     });*/

    setInterval(
        function () {
            self.update();
        }, self.interval);

//    setInterval(function () {
//        self.printInfo();
//    }, 1000);
};


handler.update = function () {
    /*++this.timecnt;
    if (this.timecnt < 10000) {
        this.sendInfo();
    }*/
    this.sendChatMessage();
};


handler.sendChatMessage = function () {     //聊天信息，发送世界聊天
    var talkData = require('./../../data/json/talk');

     var message = {};
     message["revID"] = 0;
     message["chatType"] = 0;
     message["chatContent"] = talkData[Math.floor(Math.random() * (talkData.length - 2)) + 2][5];
     logger.info('chat.chatHandler.SendChat:%s', message["chatContent"]);

     monitor.begin('chat', 0);
     this.pomelo.request('chat.chatHandler.SendChat', message, function (result) {
     monitor.end('chat', 0);
     });

     /*if (!chatStat.idDict[this.client.player[2]]) {
     chatStat.idDict[this.client.player[2]] = true;
     }
     chatStat.total++;*/
    /*var self = this;
    var nowSendTime = new Date().getTime();
    var count = nowSendTime - this.lastSendTime;
    this.lastSendTime = nowSendTime;

    for (var i = 0; i < count / 5; ++i) {
        self.sendInfo();
    }*/
};

handler.sendInfo = function () {
    var self = this;
    var talkData = require('./../../data/json/talk');

    var message = {};
    message["revID"] = 0;
    message["sendtime"] = new Date().getTime();
    message["chatContent"] = talkData[Math.floor(Math.random() * (talkData.length - 2)) + 2][5];
    logger.info('cs.roomHandler.testRpcSendChat: %s', message["chatContent"]);

    this.pomelo.request('cs.roomHandler.testRpcSendChat', message, function (err, res) {
        logger.info('cs.roomHandler.testRpcSendChat callback: %j', message["chatType"]);
        self.responseTime.push(new Date().getTime() - message["sendtime"]);
    });
};

handler.printInfo = function () {
    var self = this;
    var maxValue = _.max(this.responseTime);
    var minValue = _.min(this.responseTime);
    var resCount = this.responseTime.length;
    var sumValue = _.reduce(self.responseTime, function (memo, num) {
        return memo + num;
    }, 0);
    var avgValue = Math.floor(sumValue / resCount);

    logger.info('maxValue = %d, minValue = %d, resCount = %d,avgValue = %d, timecnt: %s',
                maxValue, minValue, resCount, avgValue, this.timecnt);
    this.responseTime.splice(0, this.responseTime.length);
};
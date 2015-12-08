/**
 * Created by yqWang on 2014-03-08.
 */

var logger = require('pomelo-logger').getLogger("bianshen", __filename);
var monitor = require('./../monitor');
var bianshenData = require('./../../data/json/bianshen');

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

    var msgList = bianshenData[Math.floor(Math.random() * (bianshenData.length - 2)) + 2];
    if (null == msgList) {
        logger.info('Get message failure');
        return;
    }
    var operTypeID = msgList[0];
    var tempID = msgList[1];
    var type = msgList[2];
    switch (operTypeID) {
        case 0:
        {    //炼魂
            self.SmeltSoul(tempID, type);
        }
            break;
        case 1:
        {    //升星
            self.UpSoulLevel(tempID, type);
        }
            break;
        case 2:
        {    //开启新变身
            self.SoulOpen();
        }
            break;
        default:
        {
            logger.info('操作类型错误');
        }
    }
};

handler.SmeltSoul = function (tempID, smelType) {
    logger.info('炼魂');
    var message = {};
    message['tempID'] = tempID;
    message['smeltType'] = smelType;
    monitor.begin('SmeltSoul', 0);
    this.pomelo.request('cs.playerHandler.SmeltSoul', message, function (result) {
        logger.info('炼魂 result = ' + result.result);
        monitor.end('SmeltSoul', 0);
    });
};

handler.UpSoulLevel = function (tempID, assID) {
    logger.info('升星');
    var message = {};
    message['tempID'] = tempID;
    message['assetsType'] = assID;
    monitor.begin('UpSoulLevel', 0);
    this.pomelo.request('cs.playerHandler.UpSoulLevel', message, function (result) {
        logger.info('升星 result = ' + result.result);
        monitor.end('UpSoulLevel', 0);
    });
};

handler.SoulOpen = function () {
    logger.info('开启新变身');
    var message = {};
    monitor.begin('SoulOpen', 0);
    this.pomelo.request('cs.playerHandler.SoulOpen', message, function (result) {
        logger.info('开启新变身 result = ' + result.result);
        monitor.end('SoulOpen', 0);
    });
};




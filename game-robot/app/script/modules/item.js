/**
 * Created by yqWang on 2014-03-10.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var itemData = require('./../../data/json/item');


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
    var msgList = itemData[Math.floor(Math.random() * (itemData.length - 2)) + 2];
    if (null == msgList) {
        logger.info('Get message failure');
        return;
    }
    var operTypeID = msgList[0];
    var itemGuid = msgList[1];
    var starIndex = msgList[2];
    var starID = msgList[3];
    switch (operTypeID) {
        case 0:
        {    //装备
            self.EquipItem(itemGuid);
        }
            break;
        case 1:
        {    //出售
            self.SellItem(itemGuid);
        }
            break;
        case 2:
        {    //镶嵌灵石
            self.InlayStar(itemGuid, starIndex, starID);
        }
            break;
        case 3:
        {    //移除灵石
            self.RemoveStar(itemGuid, starIndex);
        }
            break;
        case 4:
        {    //合成灵石
            self.SynthesizeStar(starIndex, starID);
        }
            break;
        case 5:
        {    //装备强化
            self.Intensify(itemGuid);
        }
            break;
        default:
        {
            logger.info('操作类型错误');
        }
    }
};

handler.Intensify = function (itemGuid) {
    var message = {};
    message['itemGuid'] = itemGuid;
    monitor.begin('Intensify', 0);
    this.pomelo.request('cs.itemHandler.Intensify', message, function (result) {
        logger.fatal('Intensify result = ' + result.result);
        monitor.end('Intensify', 0);
    });
}

handler.SynthesizeStar = function (synNum, synID) {
    var message = {};
    message['synNum'] = synNum;
    message['synID'] = synID;
    monitor.begin('SynthesizeStar', 0);
    this.pomelo.request('cs.itemHandler.SynthesizeStar', message, function (result) {
        logger.fatal('SynthesizeStar result = ' + result.result);
        monitor.end('SynthesizeStar', 0);
    });
}

handler.EquipItem = function (itemGuid) {
    var message = {};
    message['itemGuid'] = itemGuid;
    monitor.begin('EquipItem', 0);
    this.pomelo.request('cs.itemHandler.EquipItem', message, function (result) {
        logger.fatal('EquipItem result = ' + result.result);
        monitor.end('EquipItem', 0);
    });
}

handler.SellItem = function (itemGuid) {
    var message = {};
    message['itemGuid'] = itemGuid;
    monitor.begin('SellItem', 0);
    this.pomelo.request('cs.itemHandler.SellItem', message, function (result) {
        logger.fatal('SellItem result = ' + result.result);
        monitor.end('SellItem', 0);
    });
}

handler.InlayStar = function (itemGuid, starID, starIndex) {
    var message = {};
    message['itemGuid'] = itemGuid;
    message['starID'] = starID;
    message['starIndex'] = starIndex;
    monitor.begin('InlayStar', 0);
    this.pomelo.request('cs.itemHandler.InlayStar', message, function (result) {
        logger.fatal('InlayStar result = ' + result.result);
        monitor.end('InlayStar', 0);
    });
}

handler.RemoveStar = function (itemGuid, starIndex) {
    var message = {};
    message['itemGuid'] = itemGuid;
    message['starIndex'] = starIndex;
    monitor.begin('RemoveStar', 0);
    this.pomelo.request('cs.itemHandler.RemoveStar', message, function (result) {
        logger.fatal('RemoveStar result = ' + result.result);
        monitor.end('RemoveStar', 0);
    });
}
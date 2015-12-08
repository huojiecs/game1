/**
 * Created by yqWang on 2014-06-12.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
//var itemDate = require('./../../data/json/newitem');
var fs = require('fs');


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
    self.GetItemID();
};

handler.GetItemID = function () {
    var self = this;
    var index = 0;
    while(1) {
        var randNum = Math.floor(Math.random() * (itemDate.length - 2)) + 2;
        if (index != itemDate[randNum][1]){
            continue;
        }
        var itemID = itemDate[randNum][0];
        self.CreateItem(itemID);
        ++index;
        if (index >= 7) {
            break;
        }
    }
};

handler.CreateItem = function (itemID) {
    var self = this;
     var message = {};
     message['cmd'] = "itemdrop";
     message['params'] = [itemID, 1];
     this.pomelo.request('ps.playerHandler.GmControl', message, function (result) {
        if (0 == result.result && null != result.guid) {
            self.EquipItem(result.guid);
        }
     });
};

handler.EquipItem = function (itemGuid) {
    var message = {};
    message['itemGuid'] = itemGuid;
    this.pomelo.request('cs.itemHandler.EquipItem', message, function (result) {
        if (0 == result.result) {
            logger.info('******************************装备成功 %j', itemGuid);
        }
    });
};

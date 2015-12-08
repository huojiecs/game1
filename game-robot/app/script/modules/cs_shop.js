/**
 * Created by yqWang on 14-8-5.
 */

var logger = require('pomelo-logger').getLogger("cs_shop", __filename);
var monitor = require('./../monitor');

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
    var randomNum = Math.floor(Math.random() * 20);
    switch (randomNum) {
        case 0:
        {
            this.GetShopList();
        }
            break;
        case 1:
        {
            this.BuyGoods();
        }
            break;
        case 2:
        {
            this.BuyPhysical();
        }
            break;
        case 3:
        {
            this.FriendPhysical();
        }
            break;
    }
};


handler.GetShopList = function () {     //获取商品列表
    var message = {};

    monitor.begin('GetShopList', 0);
    this.pomelo.request('cs.shopHandler.GetShopList', message, function (result) {
        logger.info('GetShopList result = ' + result.result);
        monitor.end('GetShopList', 0);
    });
};

handler.BuyGoods = function () {     //购买商品
    var message = {};
    message['goodsID'] = [1001, 1002, 1003, 1004, 1005, 2001, 2002, 2003, 2004, 2005, 3001, 3002, 3003, 3004, 3005, 4001, 4002, 4003, 4004, 4005][Math.floor(Math.random() * 20)];     //商品ID
    monitor.begin('BuyGoods', 0);
    this.pomelo.request('cs.shopHandler.BuyGoods', message, function (result) {
        logger.info('BuyGoods result = ' + result.result);
        monitor.end('BuyGoods', 0);
    });
};

handler.BuyPhysical = function () {     //购买体力
    var message = {};

    monitor.begin('BuyPhysical', 0);
    this.pomelo.request('cs.shopHandler.BuyPhysical', message, function (result) {
        logger.info('BuyPhysical result = ' + result.result);
        monitor.end('BuyPhysical', 0);
    });
};

handler.FriendPhysical = function () {     //赠送体力
    var message = {};
    message['friendID'] = 1 + Math.floor(Math.random() * 200);  //好友roleID
    message['type'] = [0, 1][Math.floor(Math.random() * 2)];
        monitor.begin('FriendPhysical', 0);
    this.pomelo.request('cs.shopHandler.FriendPhysical', message, function (result) {
        logger.info('FriendPhysical result = ' + result.result);
        monitor.end('FriendPhysical', 0);
    });
};





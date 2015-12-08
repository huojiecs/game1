/**
 * Created by yqWang on 14-8-5.
 */

var logger = require('pomelo-logger').getLogger("cs_room", __filename);
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
    this.CustomSweep();
};


handler.CustomSweep = function () {     //扫荡
    var message = {};
    message['customID'] = [1001, 1002, 1003, 1004, 2001, 2002, 2003, 2004, 2005, 2006, 3001, 3002, 3003, 3004, 3005, 3006, 3007][Math.floor(Math.random() * 17)];     //关卡ID
    message['nType'] = [0, 1][Math.floor(Math.random() * 2)];
    message['sType'] = [0, 1][Math.floor(Math.random() * 2)];
    monitor.begin('CustomSweep', 0);
    this.pomelo.request('cs.roomHandler.CustomSweep', message, function (result) {
        logger.info('CustomSweep result = ' + result.result);
        monitor.end('CustomSweep', 0);
    });
};










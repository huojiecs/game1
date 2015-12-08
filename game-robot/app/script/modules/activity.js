/**
 * Created by yqWang on 14-8-5.
 */

var logger = require('pomelo-logger').getLogger("activity", __filename);
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
    var randomNum = Math.floor(Math.random() * 2);
    if (randomNum === 0) {
        this.RequireState();    //获取活动状态
    }
    else {
        this.UseLotteryDraw();  //使用扭蛋
    }
};

handler.RequireState = function () {
    var message = {};
    monitor.begin('RequireState', 0);
    this.pomelo.request('cs.activityHandler.RequireState', message, function (result) {
        logger.info('RequireState result = ' + result.result);
        monitor.end('RequireState', 0);
    });
};


handler.UseLotteryDraw = function () {
    var niuDanID = [60001, 60002, 60003, 60004];
    var message = {};
    message["attID"] = niuDanID[Math.floor(Math.random() * 4)];
    message["nType"] = Math.floor(Math.random() * 2);
    monitor.begin('UseLotteryDraw', 0);
    this.pomelo.request('cs.activityHandler.UseLotteryDraw', message, function (result) {
        logger.info('UseLotteryDraw result = ' + result.result);
        monitor.end('UseLotteryDraw', 0);
    });
};



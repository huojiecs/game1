/**
 * Created by yqWang on 14-8-5.
 */

var logger = require('pomelo-logger').getLogger("mission", __filename);
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
    this.OneKeyComplete();
};

handler.OneKeyComplete = function () {    //任务一键完成
    var misID = [50500004, 10100001, 30900001, 31000001, 10100002, 20100002, 20300002, 21200002, 21200001, 20800001];
    var message = {};
    message["misID"] = misID[Math.floor(Math.random() * 10)];

    monitor.begin('OneKeyComplete', 0);
    this.pomelo.request('cs.missionHandler.OneKeyComplete', message, function (result) {
        logger.info('OneKeyComplete result = ' + result.result);
        monitor.end('OneKeyComplete', 0);
    });
};

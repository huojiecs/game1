/**
 * Created by yqWang on 14-8-5.
 */

var logger = require('pomelo-logger').getLogger("chart", __filename);
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
    if (randomNum == 0) {
    this.GetChart();
    }
    else {
    this.GetOccChart();
    }
};

handler.GetChart = function () {    //获取排行榜信息(荣誉/战力)
    var message = {};
    message['chartType'] = 3; //Math.floor(Math.random() * 3);   //0:战力排行榜  2：荣誉排行榜  其它：错误
    monitor.begin('chart GetChart', 0);
    this.pomelo.request('chart.chartHandler.GetChart', message, function (result) {
        logger.info('chart GetChart result = ' + result.result);
        monitor.end('chart GetChart', 0);
    });
};

handler.GetOccChart = function () {    //获取炼狱排行榜信息
    var message = {};
    message['chartType'] = 1;   //0:战力排行榜  2：荣誉排行榜  其它：错误
    monitor.begin('rs GetChart', 0);
    this.pomelo.request('rs.chartHandler.GetChart', message, function (result) {
        logger.info('rs GetChart result = ' + result.result);
        monitor.end('rs GetChart', 0);
    });
};


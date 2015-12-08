/**
 * Created by eder on 2015/1/25.
 */



var logger = require('pomelo-logger').getLogger("climb", __filename);
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

handler.update = function(){
    var randomNum = Math.floor(Math.random()*2) ;
    switch(randomNum){
        case 0:
        {
            this.ZhuanPanLuckNum();
        }
            break;
        case 1:
        {
            this.ZhuanPanRewardList();
        }
            break;
    }

};

handler.ZhuanPanLuckNum =function(){
    var message = {};
    monitor.begin('ZhuanPanLuckNum',0);
    this.pomelo.request("cs.zhuanPanHandler.ZhuanPanLuckNum", message, function(result){
        logger.fatal("ZhuanPanLuckNum result"+result.result);
        monitor.end('ZhuanPanLuckNum',0);
    })
};

handler.ZhuanPanRewardList =function(){
    var message = {};
    monitor.begin('ZhuanPanRewardList',0);
    this.pomelo.request("cs.zhuanPanHandler.ZhuanPanRewardList", message, function(result){
        logger.fatal("ZhuanPanRewardList result"+result.result);
        monitor.end('ZhuanPanRewardList',0);
    })
};
/**
 * Created by yqWang on 14-8-5.
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

handler.update = function () {
    var randomNum = Math.floor(Math.random() * 4);
    switch (randomNum) {
        case 0:
        {
            this.cengFinishResult();    //爬塔通关
        }
            break;
        case 1:
        {
            this.addTimeWar();          ////加时战斗
        }
            break;
        case 2:
        {
            this.fastCar();             //直通车
        }
            break;
        case 3:
        {
            this.luckNumber();      //获取转盘随机数
        }
            break;
    }
};

var customID = [830001, 830002, 830003, 830004, 830005, 830006, 830007, 830008, 830009, 830010,
    830011, 830012, 830013, 830014, 830015, 830016, 830017, 830018, 830019, 830020,];

handler.cengFinishResult = function () {    //爬塔闯关完成
    var message = {};
    message["attID"] = customID[Math.floor(Math.random() * 20)];         //关卡ID
    message["targetValue1"] = 5 + Math.floor(Math.random() * 20);        //通关时间
    message["targetValue2"] = 10 + Math.floor(Math.random() * 20);        //连击值
    message["targetValue3"] = Math.floor(Math.random() * 2);              //是否满血通关

    monitor.begin('cengFinishResult', 0);
    this.pomelo.request('cs.climbHandler.cengFinishResult', message, function (result) {
        logger.info('cengFinishResult result = ' + result.result);
        monitor.end('cengFinishResult', 0);
    });
};

handler.addTimeWar = function () {    //加时战斗
    var message = {};
    message["attID"] = customID[Math.floor(Math.random() * 20)];         //关卡ID
    message["addTime"] = 10 + Math.floor(Math.random() * 20);             //增加时间（s）

    monitor.begin('addTimeWar', 0);
    this.pomelo.request('cs.climbHandler.addTimeWar', message, function (result) {
        logger.info('addTimeWar result = ' + result.result);
        monitor.end('addTimeWar', 0);
    });
};

handler.fastCar = function () {    //直通车
    var message = {};
    message["isFastCar"] = Math.floor(Math.random() * 2);             //0: 直通车  1：转盘

    monitor.begin('fastCar', 0);
    this.pomelo.request('cs.climbHandler.fastCar', message, function (result) {
        logger.info('fastCar result = ' + result.result);
        monitor.end('fastCar', 0);
    });
};

handler.luckNumber = function () {    //获取转盘随机数
    var message = {};

    monitor.begin('luckNumber', 0);
    this.pomelo.request('cs.climbHandler.luckNumber', message, function (result) {
        logger.info('luckNumber result = ' + result.result);
        monitor.end('luckNumber', 0);
    });
};

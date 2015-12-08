/**
 * Created by yqWang on 14-8-5.
 */

var logger = require('pomelo-logger').getLogger("cs_player", __filename);
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
        case 0: {this.HPandMP();} break;
        case 1: {this.GetExp();} break;
        case 2: {this.GetCustomPrize();} break;
        case 3: {this.GetGiftItem();} break;
        case 4: {this.GetLoginGift();} break;
        case 5: {this.GetLoginPrize();} break;
        case 6: {this.LearnSkill();} break;
        case 7: {this.SmeltSoul();} break;
        case 8: {this.UpSoulLevel();} break;
        case 9: {this.LearnSoulSkill();} break;
        case 10: {this.SacrificeMagicSoul();} break;
        case 11: {this.SurmountMagicSoul();} break;
        case 12: {this.UpSkillMagicSoul();} break;
        case 13: {this.OpenMagicSoul();} break;
        case 14: {this.SetNewPlayer();} break;
        case 15: {this.SoulOpen();} break;
        case 16: {this.SoulMatch();} break;
        case 17: {this.SetStoryID();} break;
        case 18: {this.UseAlchemy();} break;
        case 19: {this.UseFlop();} break;
    }
};

handler.HPandMP = function () {     //加血和加蓝
    var message = {};
    message['ID'] = [4001, 4051][Math.floor(Math.random() * 2)];

    monitor.begin('HPandMP', 0);
    this.pomelo.request('cs.playerHandler.HPandMP', message, function (result) {
        logger.info('HPandMP result = ' + result.result);
        monitor.end('HPandMP', 0);
    });
};

handler.GetExp = function () {     //杀怪后获取财产
    var message = {};
    message['customID'] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Math.floor(Math.random() * 20)];     //npcID

    monitor.begin('GetExp', 0);
    this.pomelo.request('cs.playerHandler.GetExp', message, function (result) {
        logger.info('GetExp result = ' + result.result);
        monitor.end('GetExp', 0);
    });
};

handler.GetCustomPrize = function () {     //获取关卡奖励
    var message = {};
    message['customID'] = [1001, 1002, 1003, 1004, 2001, 2002, 2003, 2004, 2005, 2006, 3001, 3002, 3003, 3004, 3005, 3006, 3007][Math.floor(Math.random() * 17)];     //关卡ID

    monitor.begin('GetCustomPrize', 0);
    this.pomelo.request('cs.playerHandler.GetCustomPrize', message, function (result) {
        logger.info('GetCustomPrize result = ' + result.result);
        monitor.end('GetCustomPrize', 0);
    });
};

handler.GetGiftItem = function () {     //获取礼包物品
    var message = {};
    message['giftID'] = [1001, 2002, 2003, 2004, 2005, 3002, 3001, 3003, 3004, 4010, 4011, 4012, 4013, 10001, 10002, 10003, 20001, 20002, 20003, 20004][Math.floor(Math.random() * 20)];     //礼包ID

    monitor.begin('GetGiftItem', 0);
    this.pomelo.request('cs.playerHandler.GetGiftItem', message, function (result) {
        logger.info('GetGiftItem result = ' + result.result);
        monitor.end('GetGiftItem', 0);
    });
};

handler.GetLoginGift = function () {     //获取登录礼包
    var message = {};

    monitor.begin('GetLoginGift', 0);
    this.pomelo.request('cs.playerHandler.GetLoginGift', message, function (result) {
        logger.info('GetLoginGift result = ' + result.result);
        monitor.end('GetLoginGift', 0);
    });
};

handler.GetLoginPrize = function () {     //获取登录奖励
    var message = {};

    monitor.begin('GetLoginPrize', 0);
    this.pomelo.request('cs.playerHandler.GetLoginPrize', message, function (result) {
        logger.info('GetLoginPrize result = ' + result.result);
        monitor.end('GetLoginPrize', 0);
    });
};

handler.LearnSkill = function () {     //学习技能
    var message = {};
    message['seriesID'] = [1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 7001, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
        2018, 2019, 3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019][Math.floor(Math.random() * 28)];     //技能ID
    message['learnType'] = 0;   //学习类型

    monitor.begin('LearnSkill', 0);
    this.pomelo.request('cs.playerHandler.LearnSkill', message, function (result) {
        logger.info('LearnSkill result = ' + result.result);
        monitor.end('LearnSkill', 0);
    });
};

handler.SmeltSoul = function () {     //炼魂
    var message = {};
    message['tempID'] = [1000, 1001, 1002, 1003, 1004][Math.floor(Math.random() * 5)];     //邪神ID
    message['smeltType'] = 0;   //炼魂类型

    monitor.begin('SmeltSoul', 0);
    this.pomelo.request('cs.playerHandler.SmeltSoul', message, function (result) {
        logger.info('SmeltSoul result = ' + result.result);
        monitor.end('SmeltSoul', 0);
    });
};

handler.UpSoulLevel = function () {     //邪神升星
    var message = {};
    message['tempID'] = [1000, 1001, 1002, 1003, 1004][Math.floor(Math.random() * 5)];     //邪神ID
    message['smeltType'] = 0;   //炼魂类型

    monitor.begin('UpSoulLevel', 0);
    this.pomelo.request('cs.playerHandler.UpSoulLevel', message, function (result) {
        logger.info('UpSoulLevel result = ' + result.result);
        monitor.end('UpSoulLevel', 0);
    });
};

handler.LearnSoulSkill = function () {     //邪神必杀技
    var message = {};
    message['tempID'] = [1000, 1001, 1002, 1003, 1004][Math.floor(Math.random() * 5)];     //邪神ID

    monitor.begin('LearnSoulSkill', 0);
    this.pomelo.request('cs.playerHandler.LearnSoulSkill', message, function (result) {
        logger.info('LearnSoulSkill result = ' + result.result);
        monitor.end('LearnSoulSkill', 0);
    });
};

handler.SacrificeMagicSoul = function () {     //祭炼
    var message = {};
    message['tempID'] = [1000, 1001, 1002, 1003, 1004][Math.floor(Math.random() * 5)];      //该值是程序中为用到
    message['SacrificeType'] = 0;

    monitor.begin('SacrificeMagicSoul', 0);
    this.pomelo.request('cs.playerHandler.SacrificeMagicSoul', message, function (result) {
        logger.info('SacrificeMagicSoul result = ' + result.result);
        monitor.end('SacrificeMagicSoul', 0);
    });
};

handler.SurmountMagicSoul = function () {     //突破
    var message = {};
    message['tempID'] = [1000, 1001, 1002, 1003, 1004][Math.floor(Math.random() * 5)];      //该值是程序中为用到
    message['SurmountType'] = [0, 1][Math.floor(Math.random() * 2)];

    monitor.begin('SurmountMagicSoul', 0);
    this.pomelo.request('cs.playerHandler.SurmountMagicSoul', message, function (result) {
        logger.info('SurmountMagicSoul result = ' + result.result);
        monitor.end('SurmountMagicSoul', 0);
    });
};

handler.UpSkillMagicSoul = function () {     //魔灵提升技能
    var message = {};
    message['tempID'] = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020][Math.floor(Math.random() * 20)];      //
    message['UpSkillType'] = [0, 1][Math.floor(Math.random() * 2)];

    monitor.begin('UpSkillMagicSoul', 0);
    this.pomelo.request('cs.playerHandler.UpSkillMagicSoul', message, function (result) {
        logger.info('UpSkillMagicSoul result = ' + result.result);
        monitor.end('UpSkillMagicSoul', 0);
    });
};

handler.OpenMagicSoul = function () {     //开启一个魔灵
    var message = {};

    monitor.begin('OpenMagicSoul', 0);
    this.pomelo.request('cs.playerHandler.OpenMagicSoul', message, function (result) {
        logger.info('OpenMagicSoul result = ' + result.result);
        monitor.end('OpenMagicSoul', 0);
    });
};

handler.SetNewPlayer = function () {     //新手引导
    var message = {};
    message['newID'] = 1 + Math.floor(Math.random() * 30);

    monitor.begin('SetNewPlayer', 0);
    this.pomelo.request('cs.playerHandler.SetNewPlayer', message, function (result) {
        logger.info('SetNewPlayer result = ' + result.result);
        monitor.end('SetNewPlayer', 0);
    });
};

handler.SoulOpen = function () {     //邪神开启
    var message = {};

    monitor.begin('SoulOpen', 0);
    this.pomelo.request('cs.playerHandler.SoulOpen', message, function (result) {
        logger.info('SoulOpen result = ' + result.result);
        monitor.end('SoulOpen', 0);
    });
};

handler.SoulMatch = function () {
    var message = {};

    monitor.begin('SoulMatch', 0);
    this.pomelo.request('cs.playerHandler.SoulMatch', message, function (result) {
        logger.info('SoulMatch result = ' + result.result);
        monitor.end('SoulMatch', 0);
    });
};

handler.SetStoryID = function () {      //设置剧情
    var message = {};
    message['storyID'] = 1 + Math.floor(Math.random() * 70);

    monitor.begin('SetStoryID', 0);
    this.pomelo.request('cs.playerHandler.SetStoryID', message, function (result) {
        logger.info('SetStoryID result = ' + result.result);
        monitor.end('SetStoryID', 0);
    });
};

handler.UseAlchemy = function () {      //炼金
    var message = {};

    monitor.begin('UseAlchemy', 0);
    this.pomelo.request('cs.playerHandler.UseAlchemy', message, function (result) {
        logger.info('UseAlchemy result = ' + result.result);
        monitor.end('UseAlchemy', 0);
    });
};

handler.UseFlop = function () {      //翻牌
    var message = {};
    message['customID'] = [1001, 1002, 1003, 1004, 2001, 2002, 2003, 2004, 2005, 2006, 3001, 3002, 3003, 3004, 3005, 3006, 3007][Math.floor(Math.random() * 17)];
    message['nType'] = [0, 1][Math.floor(Math.random() * 2)];   //翻牌类型 0：免费 1：付费
    monitor.begin('UseFlop', 0);
    this.pomelo.request('cs.playerHandler.UseFlop', message, function (result) {
        logger.info('UseFlop result = ' + result.result);
        monitor.end('UseFlop', 0);
    });
};











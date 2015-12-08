/**
 * Created by LiJianhua on 2015/7/31.
 * 斗兽场,每周免费NPC初始化和每周日晚上24点更新
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../tools/templateManager');

var Handler = module.exports;

Handler.Init = function () {
    this.weeklyFreeNpc = [];
    this.updateWeekFreeNpc();
};

Handler.updateWeekFreeNpc = function () {
    var self = this;
    logger.warn('handler.updateWeekFreeNpc');
    var freeNpcTemplate = templateManager.GetAllTemplate('ColiseumFreeNpcTemplate');
    if (null == freeNpcTemplate) {
        logger.error('ColiseumFreeNpcTemplate is null');
        return;
    }

    var nowDate = new Date();
    for (var index in freeNpcTemplate) {
        var temp = freeNpcTemplate[index];
        var startDateTime = temp['startDateTime'];
        var endDateTime = temp['endDateTime'];
        if (nowDate >= new Date(startDateTime) && nowDate < new Date(endDateTime)) {
            // update free npc
            self.weeklyFreeNpc = [];

            self.weeklyFreeNpc.push(temp['npcID_0']);
            self.weeklyFreeNpc.push(temp['npcID_1']);
            self.weeklyFreeNpc.push(temp['npcID_2']);
            self.weeklyFreeNpc.push(temp['npcID_3']);
            self.weeklyFreeNpc.push(temp['npcID_4']);
            self.weeklyFreeNpc.push(temp['npcID_5']);
            logger.warn('updateWeekFreeNpc %j ', self.weeklyFreeNpc);
            break;
        }
    }
};

Handler.getWeeklyFreeNpc = function () {
    return this.weeklyFreeNpc;
};

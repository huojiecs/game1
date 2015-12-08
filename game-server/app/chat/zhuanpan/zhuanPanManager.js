/**
 * Created by eder on 2015/1/25.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var messageService = require('../../tools/messageService');
var defaultValues = require('../../tools/defaultValues');
var playerManager = require('../../chat/player/playerManager');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var utils = require('../../tools/utils');
var _ = require('underscore');
var Q = require('q');
var urlencode = require('urlencode');
var config = require('../../tools/config');
if (!config) {
    return;
}

var Handler = module.exports;

Handler.Init = function () {
    var self = this;
    /**幸运转盘发奖记录**/
    this.rewardQueue = [];

    //自动发送转盘中奖记录
    setInterval(function () {
        self.GenerateRewardInfo();
    }, 10 * 60 * 1000);//*10

    self.GenerateRewardInfo();
};

Handler.PushRewards = function (rewards) {
    if (!_.isArray(this.rewardQueue)) {
        this.rewardQueue = [];
    }

    if (_.isArray(rewards)) {
        this.rewardQueue = this.rewardQueue.concat(rewards);
    }
    else {
        this.rewardQueue.push(rewards);
    }

    if (this.rewardQueue.length > defaultValues.ZhuanPanListLength) {
        this.rewardQueue.splice(0, this.rewardQueue.length - defaultValues.ZhuanPanListLength);
    }

    // push to all players.
    var route = "ServerZhuanPanRewardList";
    var msg = {
        result: 0,
        rewardList: _.isArray(rewards) ? rewards : [rewards]
    };

    messageService.broadcast(route, msg, {});
};

/**
 *
 * @param roleID
 * @constructor
 */
Handler.SyncRewardList = function (roleID) {

    var self = this;

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return;
    }

    var route = "ServerZhuanPanRewardList";
    var msg = {
        result: 0,
        rewardList: self.rewardQueue
    };

    player.PushMessage(route, msg);
};


Handler.GetAutoSendReward = function (size) {
    var self = this;
    var attIDArray = [];
    var template;

    for (var index = 1; index <= 12; index++) {
        template = templateManager.GetTemplateByID("ZhuanPanTemplate", index);
        var attID = template[templateConst.tZhuanPan.attID];
        if (attID != 4 && attID != 8) {
            attIDArray.push(attID);
        }
    }

    var rewardList = [];
    var names = self.GetNewNames(size);
    for (var i = 0; i < size; ++i) {
        var myAttID = _.sample(attIDArray, 1);
        template = templateManager.GetTemplateByID("ZhuanPanTemplate", myAttID);
        var yuanBaoNum = template[templateConst.tZhuanPan.yuanBaoNum];
        rewardList.push({roleName: '' + names[i], yuanBaoNum: yuanBaoNum });
    }

    return rewardList;
};


/**
 * 获取num个不同的随机名字， 并且它们与roleName数据库记录不同
 * @param num
 * @constructor
 */
Handler.GetNewNames = function (num) {

    var ZhuanpanNames = templateManager.GetAllTemplate('ZhuanpanNames');

    //return utils.invokeCallback(callback, null, _.pluck(_.sample(ZhuanpanNames, num), 'name'));
    return  _.pluck(_.sample(ZhuanpanNames, num), 'name');
};


//每隔10分钟自动发送一次中奖数据
Handler.GenerateRewardInfo = function () {

    var size = defaultValues.ZhuanPanListLength - this.rewardQueue.length;
    if (!size) {
        size = 1;
    }
    var rewards = this.GetAutoSendReward(size);

    this.PushRewards(rewards);
};

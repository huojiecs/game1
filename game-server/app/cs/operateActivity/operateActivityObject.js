/**
 * @auther LiJianhua
 * @email ljhdhr@gmail.com
 * @date 2015-06-05
 * 运营活动对象，初始化，活动开始，活动停止，更新活动内容
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var util = require('util');
var templateManager = require('../../tools/templateManager');
var operateMail = require('./operateMail');
var operateControl = require('./operateControl');
var templateConst = require('../../../template/templateConst');
var utils = require('../../tools/utils');
var defaultValues = require('../../tools/defaultValues');
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var eventValue = require('../../tools/eventValue');
var redisUtils = require('../../tools/redis/redisUtils');
var activityDropTMgr = require('../../tools/template/activityDropTMgr');
var _ = require('underscore');

module.exports = function (activityId, activityType) {
    return new Handler(activityId, activityType);
};

var Handler = function (activityId, activityType) {
    this.activityId = activityId;
    this.activityType = activityType;
};

var handler = Handler.prototype;

handler.start = function (player) {
    var self = this;
    switch (this.activityType) {
        case templateConst.tOperateType.OPERATE_TYPE_0:
            self.rechargeCallBack = self.recharge.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_RECHARGE, self.rechargeCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_2:
            //抽奖积分
            self.awardScoreCallBack = self.awardScore.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_CHART_YUAN_BAO, self.awardScoreCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_3:
            self.increaseCallBack = self.increase.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_LEVEL_UP, self.increaseCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_4:
            self.increaseCallBack = self.increase.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_ZHAN_LI, self.increaseCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_5:
            //充值榜
            self.rechargeChartCallBack = self.sevenDayRecharge.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_RECHARGE, self.rechargeChartCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_6:
            var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', self.activityId);
            if (null == operateTemplate) {
                return;
            }
            var multiple = operateTemplate[templateConst.tOperateActivity.multiple];     //倍数
            player.GetItemManager().SetActivityItemDrops(1, true, multiple);        //开始金币双倍活动
            player.GetCustomManager().SetActivityInfo(1, true, multiple);       //扫荡翻倍
            break;
        case templateConst.tOperateType.OPERATE_TYPE_7:
            //双倍经验
            var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', self.activityId);
            if (null == operateTemplate) {
                return;
            }
            var multiple = operateTemplate[templateConst.tOperateActivity.multiple];     //倍数
            player.GetItemManager().SetActivityItemDrops(0, true, multiple);  //开始经验双倍活动
            player.GetCustomManager().SetActivityInfo(0, true, multiple);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_8:
            //双倍魂魄
            var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', self.activityId);
            if (null == operateTemplate) {
                return;
            }
            var multiple = operateTemplate[templateConst.tOperateActivity.multiple];     //倍数
            player.GetItemManager().SetActivityItemDrops(2, true, multiple);  //开始魂魄双倍活动
            player.GetCustomManager().SetActivityInfo(2, true, multiple);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_9:
            self.consumeCallBack = self.consume.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_YUAN_BAO, self.consumeCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_10:
            self.consumeCallBack = self.consume.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_PHYSICAL, self.consumeCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_11:
            //抽奖积分
            self.chestPointCallBack = self.chestPoint.bind(self);
            player.on(eventValue.OPERATE_EVENT_REWARD_BY_CHEST_POINT, self.chestPointCallBack);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_20:
            self.helperFunc = self.getDrops.bind(self);
            player.GetItemManager().RegisterDropActivities(self.helperFunc);
            break;
    }
    self.SendStartMsg(player);
};

handler.stop = function (player) {
    var self = this;
    switch (self.activityType) {
        case templateConst.tOperateType.OPERATE_TYPE_0:
            if (!!self.rechargeCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_RECHARGE, self.rechargeCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_2:
            if (!!self.awardScoreCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_CHART_YUAN_BAO, self.awardScoreCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_3:
            if (!!self.increaseCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_LEVEL_UP, self.increaseCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_4:
            if (!!self.increaseCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_ZHAN_LI, self.increaseCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_5:
            if (!!self.rechargeChartCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_RECHARGE, self.rechargeChartCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_6:
            //停止金币翻倍活动
            player.GetItemManager().SetActivityItemDrops(1, false, 1);
            player.GetCustomManager().SetActivityInfo(1, false, 1);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_7:
            //停止经验翻倍活动
            player.GetItemManager().SetActivityItemDrops(0, false, 1);
            player.GetCustomManager().SetActivityInfo(0, false, 1);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_8:
            //停止魂魄翻倍活动
            player.GetItemManager().SetActivityItemDrops(2, false, 1);
            player.GetCustomManager().SetActivityInfo(2, false, 1);
            break;
        case templateConst.tOperateType.OPERATE_TYPE_9:
            if (!!self.consumeCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_YUAN_BAO, self.consumeCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_10:
            if (!!self.consumeCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_CONSUME_PHYSICAL, self.consumeCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_11:
            if (!!self.chestPointCallBack) {
                player.removeListener(eventValue.OPERATE_EVENT_REWARD_BY_CHEST_POINT, self.chestPointCallBack);
            }
            break;
        case templateConst.tOperateType.OPERATE_TYPE_20:
            //停止掉落活动
            if (!!self.helperFunc) {
                player.GetItemManager().DeleteDropActivities(self.helperFunc);
            }
            break;
    }
    self.SendStopMsg(player);
};

handler.SendStartMsg = function (player) {
    var self = this;
    var bigTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', self.activityId);
    if (null == bigTemplate) {
        return;
    }
    //是否热更
    var isUpdate = bigTemplate[templateConst.tOperateActivity.isUpdate];
    var route = '';
    var msg;
    var temp = fillContent(player, bigTemplate, self.activityId);
    if (0 == isUpdate) {
        route = 'ServerOperateInfo';
        msg = {
            isStart: 0,
            attID: self.activityId
        };
    } else {
        route = 'ServerOperateUpdate';
        delete temp[templateConst.tOperateActivity.operateMail];
        msg = {
            bigInfo: temp
        };
    }
    player.SendMessage(route, msg);
};

handler.UpdateMsg = function (player) {
    var self = this;
    var bigTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', self.activityId);
    if (null == bigTemplate) {
        return;
    }
    var temp = fillContent(player, bigTemplate, self.activityId);
    var route = 'UpdateOperateChartInfo';
    var msg = {
        attID: self.activityId
    };
    var filed = temp[templateConst.tOperateActivity.field];   //填充数据所在字段
    if (filed != 0) {   //此时需要填充
        msg.chartStr = temp[filed]
    }
   
    player.SendMessage(route, msg);
};

var fillContent = function (player, SrcTemp, attID) {
    var temp = _.clone(SrcTemp);
    var filed = temp[templateConst.tOperateActivity.field];   //填充数据所在字段
    if (filed != 0) {   //此时需要填充
        var content = temp[filed];   //模版中的填充信息
        var fillInfo = 0;   //填充信息
        var operInfo = player.GetoperateManager().GetOperateInfo(attID);   //获取填充信息
        if (!!operInfo) {   //当存在玩家数据时
            operInfo = JSON.parse(operInfo);
            if (null != operInfo.nowRechargeNum) {  //注意：截止2015-05-18检测所有脚本记录冲消信息的键值只有nowRechargeNum、num两个名称
                fillInfo = +operInfo.nowRechargeNum;
            }
            if (null != operInfo.num) {
                fillInfo = +operInfo.num;
            }
        }
        content = util.format(content, fillInfo);
        temp[filed] = content;
    }
    return temp;
};

handler.SendStopMsg = function (player) {
    var self = this;
    var route = 'ServerOperateInfo';
    var msg = {
        isStart: 1,
        attID: self.activityId
    };
    player.SendMessage(route, msg);
};

handler.notify = function (player) {
    this.SendNotifyMsg(player);
};


handler.SendNotifyMsg = function (player) {
    var self = this;
    var bigTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', self.activityId);
    if (null == bigTemplate) {
        return;
    }
    var isUpdate = bigTemplate[templateConst.tOperateActivity.isUpdate];
    var route = '';
    var msg;
    if (0 == isUpdate) {
        route = 'ServerOperateInfo';
        msg = {
            isStart: 2,
            attID: self.activityId
        };
    } else {
        route = 'ServerOperateUpdate';
        msg = {
            isNotify: 1,
            bigInfo: bigTemplate
        };
    }
    player.SendMessage(route, msg);
};

/**
 * 玩家消费类的运营活动,消费钻石，体力
 * @param {object} player   玩家对象
 * @param {number} value    消费数量
 * */
handler.consume = function (player, value) {
    var self = this;
    if(operateControl.containOperateActivity(self.activityId)) {
        operateMail.operateRewardByConsume(self.activityId, player, value);
        //更新客户端显示数据
        self.UpdateMsg(player);
    }
};

/**
 * 数据提升的运营活动，升级，战力提升
 * @param {object} player 玩家
 * @param {number} oldValue 玩家变化前的属性值
 * @param {number} newValue 玩家变化后的属性值
 * */
handler.increase = function (player, oldValue, newValue) {
    var self = this;
    if(operateControl.containOperateActivity(self.activityId)) {
        operateMail.operateRewardByIncrease(self.activityId, player, oldValue, newValue);
    }
};

/**
 * 累冲判断逻辑
 * @param {object} player 玩家
 * @param {number} vipPoint 玩家vip点数
 * @param {number} payValue 玩家的本次充值金额
 * */
handler.recharge = function (player, vipPoint, payValue) {
    var self = this;
    if(operateControl.containOperateActivity(self.activityId)) {
        operateMail.operateRewardByRecharge(self.activityId, player, vipPoint, payValue);
        //更新客户端显示数据
        self.UpdateMsg(player);
    }
};

/**
 * 更新玩家开服7天充值信息
 * @param {object} err 错误信息
 * @param {object} player 玩家
 * @param {number} vipPoint vip点数
 * @param {number} payValue 充值钻石数量 *0.1为充值金额
 * */
handler.sevenDayRecharge = function (player, vipPoint, payValue) {   //7天充值
    var self = this;
    if (payValue <= 0 || !operateControl.containOperateActivity(self.activityId)) {
        return;
    }
    //充值排行榜采用类型存储和获取活动信息
    var nowRechargeNum = player.GetoperateManager().GetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_5); //玩家当前保存的充值金额
    if (null == nowRechargeNum) {
        nowRechargeNum = 0;
    }
    nowRechargeNum = +nowRechargeNum;
    var newRechargeNum = nowRechargeNum + parseInt(payValue / 10);
    //充值排行榜采用类型存储和获取活动信息
    player.GetoperateManager().SetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_5, '' + newRechargeNum); //更新

    var roleInfo = {};
    roleInfo['roleID'] = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    roleInfo['sevenRecharge'] = newRechargeNum;

    var param = {forbidChart: [gameConst.eForbidChartType.OP_ACT, gameConst.eForbidChartType.ALL]};

    redisUtils.UpdatePlayerRechargeScore(roleInfo, param, utils.done);
    //更新客户端显示数据
    self.UpdateMsg(player);
};

/**
 * 更新玩家积分抽奖信息
 * @param {object} player 玩家
 * @param {number} vipPoint vip点数
 * @param {number} payValue 充值钻石数量 *0.1为充值金额
 * */
handler.awardScore = function (player, vipPoint, payValue) {
    var self = this;
    if (payValue <= 0 || !operateControl.containOperateActivity(self.activityId)) {
        return;
    }
    //var nowScore = player.GetoperateManager().GetOperateInfo(self.activityId); //玩家当前保存的抽奖积分
    //抽奖积分排行榜采用类型存储和获取活动信息
    var nowScore = player.GetoperateManager().GetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_2); //玩家当前保存的抽奖积分
    if (null == nowScore) {
        nowScore = 0;
    }
    nowScore = +nowScore;
    var newSocre = nowScore + payValue;
    //player.GetoperateManager().SetOperateInfo(self.activityId, '' + newSocre); //更新
    //抽奖积分排行榜采用类型存储和获取活动信息
    player.GetoperateManager().SetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_2, '' + newSocre); //更新

    var roleInfo = {};
    roleInfo['roleID'] = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);  //角色ID
    roleInfo['score'] = newSocre;                                   //抽奖积分
    logger.warn('operate awardScore activityId %j player info, roleID: %j, roleInfo: %j', self.activityId,
                player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), roleInfo);

    var param = {forbidChart: [gameConst.eForbidChartType.OP_ACT, gameConst.eForbidChartType.ALL]};

    redisUtils.UpdatePlayerAwardScore(roleInfo, param, utils.done);
    //更新客户端显示数据
    self.UpdateMsg(player);
};

/**
 * 更新玩家积分抽奖信息
 * @param {object} err 错误信息
 * @param {object} player 玩家
 * @param {number} assetsID 财产ID
 * @param {number} assetsNum 财产数量
 * */
handler.chestPoint = function (player, assetsNum) {   //积分抽奖
    var self = this;
    if (assetsNum <= 0 || !operateControl.containOperateActivity(self.activityId)) {
        return;
    }
    var nowScore = player.GetoperateManager().GetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_11);
    if (null == nowScore) {
        nowScore = 0;
    }
    nowScore = +nowScore;
    var newScore = nowScore + assetsNum;
    player.GetoperateManager().SetOperateInfo(templateConst.tOperateType.OPERATE_TYPE_11, '' + newScore); //更新

    var roleInfo = {};
    roleInfo['roleID'] = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);  //角色ID
    roleInfo['chestPoint'] = newScore;                                   //抽奖积分
    logger.warn('operate 1000067 player info, roleID: %j, roleInfo: %j',
                player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), roleInfo);

    var param = {forbidChart: [gameConst.eForbidChartType.OP_ACT, gameConst.eForbidChartType.ALL]};
    redisUtils.UpdatePlayerChestsScore(roleInfo, param, utils.done);
    //更新客户端显示数据
    self.UpdateMsg(player);
};

/**获取关卡对应的掉落, 返回的数据格式为: {assetID: assetNum, ...}*/
handler.getDrops = function (err, player, customID, npcID) {
    var self = this;
    if(operateControl.containOperateActivity(self.activityId)) {
        if (!err) {
            return activityDropTMgr.GetDrops(self.activityId, customID, npcID);
        }
        return null;
    }
}
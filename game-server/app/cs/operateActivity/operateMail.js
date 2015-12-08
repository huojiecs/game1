/**
 * @auther LiJianhua
 * @email ljhdhr@gmail.com
 * @date 2015-06-03
 *
 * 运营活动奖励发放
 *
 * 活动类型: 0：累计充值  1：首冲  2：抽奖积分  3：火速升级  4：战力飙升
 *          5：开服7天充值榜送礼  6：金币双倍  7：经验双倍  8：魂魄双倍
 *          9：累积消费钻石  10：消耗体力  20:活动掉落
 *
 * 配置说明:
 subject:
 邮件标题.
 content:
 邮件内容,如果邮件中有需要改变的数据,例如排行榜等级,充值金额的变化,需要传入参数%var0.这个参数需要策划在文本中加入%var0字符占坑.
 由程序代码传入参数,自动替换%var0.
 %var0:
 邮件内容中需要替换的字符串。
 举个栗子:
 充值排行榜活动中,需要传入排行榜名次.
 rewards:
 邮件中奖励物品列表.
 gt
 greatThan的缩写，获得奖励物品条件,大于等于这个设定值.
 lt
 lessThan的缩写，获得奖励物品条件,小于等于这个设定值. 满足gt和lt的条件时,发送奖励物品.
 items
 物品列表,配置格式和上个版本一致.
 举个栗子:
 "gt":4, "lt":10 表示 大于等于4,小于等于10,在充值排行榜中,当玩家在排行榜4到10名之间时,获得items列表中的奖励.
 ----------------------------------------------------------------------------------------------
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateConst = require('../../../template/templateConst');
var templateManager = require('./../../tools/templateManager');
var gameConst = require('./../../tools/constValue');
var utils = require('./../../tools/utils');

var Handler = module.exports = {};

/**
 * 根据数值提升发放奖励
 * 火速升级 战力飙升
 * @activityId  {number}    活动ID
 * @player      {object}    玩家对象
 * @oldValue    {number}    升级前的等级
 * @newValue    {number}    升级后的等级
 */
Handler.operateRewardByIncrease = function (activityId, player, oldValue, newValue) {
    var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', activityId);
    var operateMailData = operateTemplate[templateConst.tOperateActivity.operateMail];
    if (null == operateMailData || operateMailData === "0") {
        logger.warn("operateRewardByIncrease null == operateMailData activityId %j", activityId);
        return;
    }
    //获取玩家该活动的数据,如果没有则初始化
    var rewardHistory = player.GetoperateManager().GetOperateInfo(activityId);  //充值信息
    if (null == rewardHistory) {
        rewardHistory = {prizeList: []};
    }
    else {
        rewardHistory = JSON.parse(rewardHistory);
    }
    if (null == rewardHistory.prizeList) {
        rewardHistory.prizeList = [];
    }

    if (operateMailData.hasOwnProperty(templateConst.tOperateMailContent.rewards)) {
        var allRewards = operateMailData[templateConst.tOperateMailContent.rewards];
        for (var index in allRewards) {
            var moreThan = allRewards[index][templateConst.tOperateMailContent.gt];
            if (oldValue < moreThan && newValue >= moreThan && -1 == rewardHistory.prizeList.indexOf(moreThan) && -1 == rewardHistory.prizeList.indexOf('' + moreThan)) {
                logger.warn('operateRewardByIncrease activityId %j roleID: %j, oldValue: %j, newValue: %j moreThan: %j', activityId,
                    player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), oldValue, newValue, moreThan);
                rewardHistory.prizeList.push(moreThan);
                //初始化邮件内容
                var mailSubject = operateMailData[templateConst.tOperateMailContent.subject];
                var mailContent = operateMailData[templateConst.tOperateMailContent.content];
                //替换邮件中的数字
                mailContent = mailContent.replace(templateConst.tOperateMailContent.var0, moreThan);
                var mailDetail = {
                    recvID: player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                    subject: mailSubject,
                    mailType: gameConst.eMailType.System,
                    content: mailContent
                };
                player.GetoperateManager().SetOperateInfo(activityId, JSON.stringify(rewardHistory));
                mailDetail.items = allRewards[index][templateConst.tOperateMailContent.items];
                //发送邮件
                pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
            }
        }
    }
};

/**
 * 更具消耗数值发放奖励活动
 * 累积消费钻石，消耗体力 活动奖励发放
 * @activityId  {number}    活动ID
 * @player      {object}    玩家对象
 * @value       {number}    玩家消耗的数值，例如体力，钻石等
 */
Handler.operateRewardByConsume = function (activityId, player, value) {
    var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', activityId);
    var operateMailTemplate = operateTemplate[templateConst.tOperateActivity.operateMail];
    if (null == operateMailTemplate || operateTemplate === "0") {
        logger.warn("operateRewardByConsume null == operateMailTemplate activityId %j", activityId);
        return;
    }
    //获取玩家该活动的数据,如果没有则初始化
    var rewardHistory = player.GetoperateManager().GetOperateInfo(activityId);  //充值信息
    if (null == rewardHistory) {
        rewardHistory = {num: 0, prizeList: []};
    }
    else {
        rewardHistory = JSON.parse(rewardHistory);
    }
    if (null == rewardHistory.num) {
        rewardHistory.num = 0;
    }
    if (null == rewardHistory.prizeList) {
        rewardHistory.prizeList = [];
    }
    rewardHistory.num += value;
    if (operateMailTemplate.hasOwnProperty(templateConst.tOperateMailContent.rewards)) {
        var allRewards = operateMailTemplate[templateConst.tOperateMailContent.rewards];
        for (var index in allRewards) {
            var moreThan = allRewards[index][templateConst.tOperateMailContent.gt];
            if (rewardHistory.num >= moreThan && -1 == rewardHistory.prizeList.indexOf(moreThan) && -1 == rewardHistory.prizeList.indexOf('' + moreThan)) {
                logger.warn('operateRewardByConsume activityId %j roleID: %j, value: %j, moreThan: %j, rewardHistory.num %j ', activityId,
                    player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), value, moreThan, rewardHistory.num);
                rewardHistory.prizeList.push(moreThan);
                //替换邮件中的数字
                var mailContent = operateMailTemplate[templateConst.tOperateMailContent.content];
                mailContent = mailContent.replace(templateConst.tOperateMailContent.var0, moreThan);
                var mailSubject = operateMailTemplate[templateConst.tOperateMailContent.subject];
                var mailDetail = {
                    recvID: player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                    subject: mailSubject,
                    mailType: gameConst.eMailType.System,
                    content: mailContent
                };
                var allRewards = operateMailTemplate[templateConst.tOperateMailContent.rewards];
                mailDetail.items = allRewards[index][templateConst.tOperateMailContent.items];
                //发送邮件
                pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
            }
        }
    }

    //更新活动记录
    player.GetoperateManager().SetOperateInfo(activityId, JSON.stringify(rewardHistory));
};

/**
 * 根据累计充值发放活动奖励
 * @param {number} activityId   活动ID
 * @param {object} player       玩家
 * @param {number} vipPoint     玩家vip点数
 * @param {number} payValue     玩家的本次充值金额
 */
Handler.operateRewardByRecharge = function (activityId, player, vipPoint, payValue) {
    var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', activityId);
    var operateMailTemplate = operateTemplate[templateConst.tOperateActivity.operateMail];
    if (null == operateMailTemplate || operateTemplate === "0") {
        logger.warn("operateRewardByRecharge null == operateMailTemplate activityId %j", activityId);
        return;
    }

    var rechargeInfo = player.GetoperateManager().GetOperateInfo(activityId); //充值相关信息
    if (null == rechargeInfo) {
        rechargeInfo = {nowRechargeNum: 0, awardInfo: []};
    }
    else {
        try {
            rechargeInfo = JSON.parse(rechargeInfo);
        } catch (err) {
            rechargeInfo = {nowRechargeNum: parseInt(vipPoint / 10), awardInfo: []};
        }
    }

    rechargeInfo.nowRechargeNum = rechargeInfo.nowRechargeNum + parseInt(payValue / 10);   //最新充值总金额
    if (operateMailTemplate.hasOwnProperty(templateConst.tOperateMailContent.rewards)) {
        var allRewards = operateMailTemplate[templateConst.tOperateMailContent.rewards];
        for (var index in allRewards) {
            var moreThan = allRewards[index][templateConst.tOperateMailContent.gt];
            if (rechargeInfo.nowRechargeNum >= moreThan && -1 == rechargeInfo.awardInfo.indexOf(moreThan) && -1 == rechargeInfo.awardInfo.indexOf('' + moreThan) ) {
                logger.warn('operateRewardByRecharge activityId %j roleID: %j, vipPoint: %j, payValue: %j, moreThan %j, rechargeInfo: %j', activityId,
                    player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), vipPoint, payValue, moreThan, rechargeInfo);
                rechargeInfo.awardInfo.push(moreThan);
                //替换邮件中的数字
                var mailContent = operateMailTemplate[templateConst.tOperateMailContent.content];
                var mailSubject = operateMailTemplate[templateConst.tOperateMailContent.subject];
                mailContent = mailContent.replace(templateConst.tOperateMailContent.var0, moreThan);
                var mailDetail = {
                    recvID: player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                    subject: mailSubject,
                    mailType: gameConst.eMailType.System,
                    content: mailContent
                };
                var allRewards = operateMailTemplate[templateConst.tOperateMailContent.rewards];
                mailDetail.items = allRewards[index][templateConst.tOperateMailContent.items];
                //发送邮件
                pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
            }
        }
    }
    //更新活动记录
    player.GetoperateManager().SetOperateInfo(activityId, JSON.stringify(rechargeInfo));
};

/**
 * 根据活动排行榜，发放奖励的活动 ：抽奖积分,累积消费钻石
 * 开服7天充值榜送礼 活动奖励发放
 * @activityId  {number}        活动ID
 * @rankList    {object}        排行榜列表
 */
Handler.operateRewardByRankList = function (activityId, rankList) {
    logger.warn('operateRewardByRankList activityId: %j, rankList: %j', activityId, rankList);
    var operateTemplate = templateManager.GetTemplateByID('OperateActivityTemplate', activityId);
    var operateMailTemplate = operateTemplate[templateConst.tOperateActivity.operateMail];
    if (null == operateMailTemplate || operateTemplate === "0") {
        logger.warn("operateRewardByRankList operateMail is null activityId %j", activityId);
        return;
    }
    var activeType = operateTemplate[templateConst.tOperateActivity.activeType];

    for (var rankIndex in rankList) {
        var rank = JSON.parse(rankList[rankIndex].id);
        var roleID = rankList[rankIndex].roleID;
        if (operateMailTemplate.hasOwnProperty(templateConst.tOperateMailContent.rewards)) {
            var allRewards = operateMailTemplate[templateConst.tOperateMailContent.rewards];
            for (var rewardIndex in allRewards) {
                var moreThan = allRewards[rewardIndex][templateConst.tOperateMailContent.gt];
                var lessThan = allRewards[rewardIndex][templateConst.tOperateMailContent.lt];
                if (rank >= moreThan && rank <= lessThan) {
                    logger.warn('operateRewardByRankList activityId: %j, roleID: %j, rank %j, moreThan %j, lessThan %j ', activityId, roleID, rank, moreThan, lessThan);
                    var mailContent = operateMailTemplate[templateConst.tOperateMailContent.content];
                    //替换邮件中的数字
                    mailContent = mailContent.replace(templateConst.tOperateMailContent.var0, rank);
                    var mailSubject = operateMailTemplate[templateConst.tOperateMailContent.subject];
                    var mailDetail = {
                        recvID: +roleID,
                        subject: mailSubject,
                        mailType: gameConst.eMailType.System,
                        content: mailContent
                    };
                    var allRewards = operateMailTemplate[templateConst.tOperateMailContent.rewards];
                    mailDetail.items = allRewards[rewardIndex][templateConst.tOperateMailContent.items];
                    //发送邮件
                    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
                    if(activeType == templateConst.tOperateType.OPERATE_TYPE_5) {
                        if(allRewards[rewardIndex].hasOwnProperty(templateConst.tOperateMailContent.re)) {
                            var refundPercent = allRewards[rewardIndex][templateConst.tOperateMailContent.re];
                            var refundNum = +rankList[rankIndex].score;
                            if(refundNum > 0 && refundPercent > 0) {
                                refundNum = Math.floor(refundNum * refundPercent / 10);
                                if(refundNum > 0) {
                                    this.refundDiamondByRechargeRank(roleID, rank, refundNum, operateMailTemplate);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 * 根据充值排行榜排名，按照配置比例返回钻石
 * @param roleID    玩家ID
 * @param rank      排行榜名次
 * @param refundNum 返钻数量
 * @param operateMailTemplate   活动信息用于修改邮件内容
 */
Handler.refundDiamondByRechargeRank = function (roleID, rank, refundNum, operateMailTemplate) {
    logger.warn("refundDiamondByRechargeRank roleID %j, rank %j, refundNum %j ", roleID, rank, refundNum);
    // 充值榜反钻
    var mailContent1 = operateMailTemplate[templateConst.tOperateMailContent.content1];
    mailContent1 = mailContent1.replace(templateConst.tOperateMailContent.var0, rank);
    mailContent1 = mailContent1.replace(templateConst.tOperateMailContent.var1, refundNum);
    var mailSubject = operateMailTemplate[templateConst.tOperateMailContent.subject];
    var mailDetail = {
        recvID: +roleID,
        subject: mailSubject,
        mailType: gameConst.eMailType.System,
        content: mailContent1
    };

    mailDetail.items = [[1002, refundNum]];
    //发送邮件
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
};
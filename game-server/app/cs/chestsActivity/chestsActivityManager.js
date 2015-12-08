/**
 * Created with JetBrains WebStorm.
 * User: wangwenping
 * Date: 15-06-03
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var playerManager = require('../../cs/player/playerManager');
var errorCodes = require('../../tools/errorCodes');
var Q = require('q');
var _ = require('underscore');
var defaultValues = require('../../tools/defaultValues');
var tNotice = templateConst.tNotice;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eventValue = require('../../tools/eventValue');

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {

    this.owner = owner;
};
var handler = Handler.prototype;


handler.OnRunningChest = function () {
    var self = this;
    var chestsAllTemplates = templateManager.GetAllTemplate('ChestsActivityTemplate');
    if (null == chestsAllTemplates) {
        return errorCodes.SystemWrong;
    }
    var chestsIDs = [];
    var nowDate = new Date();

    for (var index in chestsAllTemplates) {
        var temp = chestsAllTemplates[index];
        var attID = temp[templateConst.tChestsActivity.attID];
        var startTime = temp[templateConst.tChestsActivity.startTime];

        var endTime = temp[templateConst.tChestsActivity.endTime];
        if (nowDate >= new Date(startTime) && nowDate < new Date(endTime) && !_.has(chestsIDs, attID)) {
            chestsIDs.push(attID);
        }
        if (nowDate > new Date(endTime) && _.has(chestsIDs, attID)) {
            chestsIDs.splice(_.indexOf(chestsIDs, attID), 1);
        }
    }
    var chestsInfos = self.GetChestInfo(chestsIDs);

    return chestsInfos;
};
/**获得宝箱的信息*/
handler.GetChestInfo = function (chestIds) {
    var chestInfos = [];
    if (chestIds.length > 0) {
        for (var id in chestIds) {
            var chestTemplate = templateManager.GetTemplateByID('ChestsActivityTemplate', chestIds[id]);
            if (null == chestTemplate) {
                return;
            }
            var endTimeDesc = chestTemplate[templateConst.tChestsActivity.endTimeDesc];
            var chestName = chestTemplate[templateConst.tChestsActivity.name];
            var chestInstructions = chestTemplate[templateConst.tChestsActivity.instructions];
            var chestModelPath = chestTemplate[templateConst.tChestsActivity.modelPath];
            var ChestOpenModelPath = chestTemplate[templateConst.tChestsActivity.openModelPath];
            var openKey = chestTemplate[templateConst.tChestsActivity.openID];
            var keyNums = this.owner.GetAssetsManager().GetAssetsValue(openKey);
            var chest = {
                attID: chestIds[id],
                name: chestName,
                instructions: chestInstructions,
                openID: openKey,
                endTimeDesc: endTimeDesc,
                modelPath: chestModelPath,
                openModelPath: ChestOpenModelPath,
                assertsNum: keyNums    //开启宝箱的财产
            };
            chestInfos.push(chest);
        }
    }
    return chestInfos;
};
/**查看宝箱*/
handler.ViewDetail = function (chestID) {
    var chestTemplate = templateManager.GetTemplateByID('ChestsActivityTemplate', chestID);
    if (null == chestTemplate) {
        return {'result': errorCodes.NoTemplate};
    }
    var showNum = chestTemplate[templateConst.tChestsActivity.showNum];

    var showInfos = [];
    for (var index = 0; index < showNum; index++) {
        showInfos.push(chestTemplate['showID_' + index]);
    }
    return {
        'result': errorCodes.OK,
        'showMsg': showInfos
    };
};
handler.SendChestsList = function () {
    var self = this;
    if (null == self.owner) {
        logger.error('SendChestsList玩家是空的');
        return;
    }
    var route = "ServerLoginChestsList";
    var chestsList = {};
    var msg = self.OnRunningChest();
    if (typeof msg == 'number') {
        chestsList = {
            result: msg
        }
    } else {
        chestsList = {
            result: errorCodes.OK,
            chestsMsg: msg
        }
    }
    self.owner.SendMessage(route, chestsList);
};
/**开启宝箱*/
handler.OpenChest = function (attID, openType) {
    var self = this;
    var player = self.owner;
    var chestTemplate = templateManager.GetTemplateByID('ChestsActivityTemplate', attID);
    if (null == chestTemplate) {
        return errorCodes.NoTemplate;
    }
    var openKey = chestTemplate[templateConst.tChestsActivity.openID];
    var keyNums = self.owner.GetAssetsManager().GetAssetsValue(openKey);
    var consumeNum = chestTemplate[templateConst.tChestsActivity.openNum];
    if (keyNums < consumeNum) {
        return errorCodes.chest_NoChestKey;
    }

    var chestPoint = chestTemplate[templateConst.tChestsActivity.gainPoint];   //积分
    var prideMsg = {
        result: errorCodes.OK,
        assertsNum: 0,
        prideIDs: []
    };
    var allConsume = 0;   //消耗财产
    var openTimes = 0;    //开启次数
    var countPoints = 0;  //获得积分点
    //开启1次
    if (openType == 1) {
        openTimes = 1;
        allConsume = consumeNum;
        countPoints = chestPoint;
    } else {
        //开启多次
        var openNums = keyNums / consumeNum; //开启次数
        if (openNums > 0 && openNums < 10) {
            openTimes = openNums;
            allConsume = consumeNum * openNums;
            countPoints = chestPoint * openNums;
        } else if (openNums >= 10) {
            openTimes = 10;
            allConsume = consumeNum * 10;
            countPoints = chestPoint * 10;
        }
    }
    if (allConsume > 0) {
        player.GetAssetsManager().AlterAssetsValue(openKey, -allConsume, eAssetsReduce.ChestsActivity);
        prideMsg.prideIDs = self.OutputPrideIds(chestTemplate, openTimes);

        //开宝箱加积分
        self.notifyOperateByChartChestPoint(player, countPoints);
    }
    for (var index in prideMsg.prideIDs) {
        player.AddItem(prideMsg.prideIDs[index].prideID, prideMsg.prideIDs[index].prideNum, eAssetsAdd.ChestsActivity,
                       null);
        //公告
        var noticeID = "chestsPride_" + prideMsg.prideIDs[index].sign;
        this.owner.GetNoticeManager().SendRepeatableGM(gameConst.eGmType.ChestsActivity, noticeID);

    }
    prideMsg.assertsNum = player.GetAssetsManager().GetAssetsValue(openKey);
    return prideMsg;
};

/**开宝箱获得的奖品*/
handler.OutputPrideIds = function (chestTemp, count) {
    var self = this;

    var prideInfo = [];
    for (var i = 0; i < count; i++) {
        var prideList = self.GetPrideWeightList(chestTemp);
        var prideIndex = self.GetRondamPrideIndex(prideList);
        var id = chestTemp['prideID_' + prideIndex];
        var num = chestTemp['prideNum_' + prideIndex];
        var prideSign = chestTemp['sign_' + prideIndex];
        var prideMsg = {
            prideID: id,
            prideNum: num,
            sign: prideSign
        };
        prideInfo.push(prideMsg);
    }

    return  prideInfo;
};

/**每个宝箱所有的奖品数组*/
handler.GetPrideWeightList = function (chestTemplate) {
    var prideWeightList = [];
    for (var i = 1; i < chestTemplate[templateConst.tChestsActivity.prideNum] + 1; i++) {
        var prideWeight = chestTemplate['weight_' + i];
        prideWeightList.push(prideWeight);
    }
    return prideWeightList;
};

/**根据权重数组获得奖励下标*/
handler.GetRondamPrideIndex = function (chestTemp) {
    var min = 1;
    var max = defaultValues.RandomNum;

    var rand = utils.randomAtoB(min, max);
    var index = 0; //概率下标
    for (var i = 0; i < chestTemp.length; i++) {
        if (rand <= chestTemp[i]) {
            index = i;
            break;
        }
        rand = rand - chestTemp[i];
    }
    return index;
};


/**
 * 运营活动函数通知
 * @param player
 * @param payValue
 */
handler.notifyOperateByChartChestPoint = function (player, chestPoint) {
    //发送充值事件，更新活动
    player.emit(eventValue.OPERATE_EVENT_REWARD_BY_CHEST_POINT, player, chestPoint);
};
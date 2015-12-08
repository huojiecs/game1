/**
 * Created by Administrator on 14-5-21.
 */
var pomelo = require('pomelo');
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var errorCodes = require('../../tools/errorCodes');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var csSql = require('../../tools/mysql/csSql');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');
var climbSql = require('../../tools/mysql/climbSql');
var mailManager = require('../../../app/ms/mail/mailManager');
var playerManager = require('../../../app/cs/player/playerManager');
var async = require('async');
var _ = require('underscore');
var defaultValues = require('../../tools/defaultValues');
var redisUtils = require('../../tools/redis/redisUtils');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var sCsString = stringValue.sCsString;
var sPublicString = stringValue.sPublicString;
var eClimbInfo = gameConst.eClimbInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var tNotice = templateConst.tNotice;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eForbidChartType = gameConst.eForbidChartType;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    // this.dataList = {};
    this.fastCarNum = 1;
    this.weekScore = 0;
    this.luckNumber = 0;
    this.cengDataList = {};//历史关卡层数据,attID是index
    this.todayDataList = {};//当天的关卡层数,attID是index
    this.historyData = [];

    /** 当前 副本iD*/
    this.curCustomID = 0;
};
var handler = Handler.prototype;

handler.LoadDataByDB = function (climbList) {
    logger.debug('climbList: %j', climbList);

    if (null != climbList) {
        this.customNum = climbList.customNum;
        this.weekScore = climbList.weekScore;
        this.fastCarNum = climbList.fastCarNum;
        //历史关卡层信息
        var climbDataArray = JSON.parse(climbList.climbData);
        if (_.isArray(climbDataArray)) {
            for (var index in climbDataArray) {
                if (_.isArray(climbDataArray[index])) {
                    var data = {attID: climbDataArray[index][0], score: climbDataArray[index][1]};
                    this.cengDataList[data.attID] = data;
                } else {
                    var attID = climbDataArray[index].attID;
                    this.cengDataList[attID] = climbDataArray[index];
                }

            }
        }
        //当天闯关卡层信息
        var todayDataArray = JSON.parse(climbList.todayData);
        if (_.isArray(todayDataArray)) {
            for (var index in todayDataArray) {
                if (_.isArray(todayDataArray[index])) {
                    var todayData = {
                        attID: todayDataArray[index][0],
                        score: todayDataArray[index][1],//历史得分
                        targetValue1: todayDataArray[index][2],
                        targetValue2: todayDataArray[index][3],
                        targetValue3: todayDataArray[index][4],
                        todayScore: todayDataArray[index][5],//当天得分
                        cengStatus: todayDataArray[index][6] //本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
                    };
                    this.todayDataList[todayData.attID] = todayData;
                }
                else {
                    var attID = todayDataArray[index].attID;
                    this.todayDataList[attID] = todayDataArray[index];
                }
            }

            this.historyData = JSON.parse(climbList.historyData);
        }
    }
};

/**
 * @Brief: 添加副本进入纪录
 * ---------------------
 *
 * @param {Number} _customID 进入爬塔关卡id
 * */
handler.addEnterCustomTag = function (_customID) {
    this.curCustomID = _customID;
};

/**
 * @Brief: 验证结束关卡是否正确
 * --------------------------
 *
 * @param {Number} curCustomID 当前关卡id
 * @param {Object} climbTemplate  爬塔模板
 * @param {Number} customID 客户端发送id
 * @return boolean
 * */
var isRightCustom = function (curCustomID, climbTemplate, customID) {
    if (climbTemplate['customID'] != customID || curCustomID != customID) {
        logger.error('climbManager finishResult param error attID: %d, customID: %d, curCustomID: %d',
                     climbTemplate['attID'], customID, curCustomID);
        return false;
    }
    this.curCustomID = 0;
    return true;
};

handler.getCengDataList = function () {

    var cList = [];
    for (var index in this.cengDataList) {
        cList.push(this.cengDataList[index]);
    }
    return cList;
};

handler.getTodayDataList = function () {
    var tList = [];
    for (var index in this.todayDataList) {
        tList.push(this.todayDataList[index]);
    }
    return tList;
};

module.exports.initPlayerClimbInfo = function () {
    csSql.initRoleClimbInfo(function (err, res) {
        if (!!err) {
            logger.error("module.exports.initRoleClimbInfo error: %s", err.stack);
        }
    });
//    self.sendChartOfFriend();
};

//（12点清空当天数据todayDataList）
handler.UpdateTodayData12Info = function () {
    var self = this;
    var roleInfo = {};
    var msg = {
        weekScore: 0,
        fastCar: 0,
        zhuanPan: 0,
        attList: [],
        historyList: []
    };

    this.todayDataList = {};
    this.fastCarNum = 1;
    var markFastCar = 0;
    var cengDataList = self.getCengDataList();
    if (cengDataList.length >= 10) {
        markFastCar = cengDataList.length - 7;
    }
    var todayScore = 0;
    for (var index in this.todayDataList) {
        if (null != this.todayDataList[index]) {
            todayScore += this.todayDataList[index].todayScore;
        }
    }   //周积分取今天积分和昨天积分取最大
    this.weekScore = Math.max(this.weekScore, todayScore);
    msg = {
        weekScore: this.weekScore,
        fastCar: markFastCar,
        zhuanPan: 0,
        attList: [],
        historyList: self.GetHistoryDataList()
    };
    //刷新排行榜中自己的周积分
    roleInfo['roleID'] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    roleInfo['climbScore'] = msg.weekScore * 1000 + cengDataList.length;
//    }
    //pomelo.app.rpc.chart.chartRemote.UpdateClimbScore(null, roleInfo, utils.done);
    var param = {forbidChart: [eForbidChartType.CLIMB, eForbidChartType.ALL]};
    redisUtils.UpdatePlayerClimbScore(roleInfo, param, utils.done);
    this.owner.GetMissionManager().IsMissionOver(gameConst.eMisType.OverCus, 0, 0);     //当爬塔数据更新时设置爬塔任务数据为0
    var route = "ServerInitClimbData";
    this.owner.SendMessage(route, msg);
};

handler.UpdateCengDataWeekInfo = function () {
    var msg = {
        weekScore: 0,
        fastCar: 1,
        zhuanPan: 0, // >=5
        attList: [],
        historyList: this.getCengDataList()
    };
    //this.cengDataList = {};
    this.todayDataList = {};
    this.weekScore = 0;
    this.fastCarNum = 0;

    this.owner.GetMissionManager().IsMissionOver(gameConst.eMisType.OverCus, 0, 0);     //当爬塔数据更新时设置爬塔任务数据为0
    var route = "ServerInitClimbData";
    this.owner.SendMessage(route, msg);
};

handler.GetSqlStr = function () {
    var todayScore = 0;
    var self = this;
    for (var index in this.todayDataList) {
        if (null != this.todayDataList[index]) {
            todayScore += this.todayDataList[index].todayScore;
        }
    }
    var climbDataLength = self.getCengDataList().length;
    var todayDataLength = self.getTodayDataList().length;
    var climbInfo = '';
    climbInfo += '(';
    climbInfo += this.owner.id + ',';
    if (!_.isEmpty(this.cengDataList)) {//getCengDataJson(this.cengDataList).length > 1
        climbInfo += '\'' + self.GetCengDataJson() + '\'' + ',';//climbData
    } else {
        climbInfo += '\'[]\'' + ',';//climbData
    }
    if (!_.isEmpty(this.todayDataList)) {
        climbInfo += '\'' + self.GetTodayDataJson() + '\'' + ',';
    } else {
        climbInfo += '\'[]\'' + ',';//todayData
    }
    climbInfo += climbDataLength >= todayDataLength ? climbDataLength : todayDataLength;
    climbInfo += ',' + '\'' + self.GetHistoryDataJson() + '\'' + ',';
    climbInfo += Math.max(todayScore, this.weekScore) + ',';
    climbInfo += this.fastCarNum + ')';
    return climbInfo;
};


handler.SaveClimbInfo = function () {
    var climbInfo = this.GetSqlStr();
    var self = this;
    climbSql.SaveClimbInfo(this.owner.id, climbInfo, function (err, res) {
        if (!!err) {
            logger.error("saveClimbInfo error=%s", err.stack);
        } else {
            self.owner.addDirtyTemplate(gameConst.ePlayerDB.ClimbData, climbInfo);
        }
    });
};

handler.GetCengDataJson = function () {
    var self = this;
    return JSON.stringify(self.GetCengDataArray());
};

handler.GetCengDataArray = function () {
    var dataArray = new Array();
    for (var attID in this.cengDataList) {
        var dataArr = new Array();
        dataArr.push(this.cengDataList[attID].attID);
        dataArr.push(this.cengDataList[attID].score);
        dataArray.push(dataArr);
    }
    return dataArray;
};

handler.GetTodayDataJson = function () {
    var self = this;
    return JSON.stringify(self.GetTodayDataArray());
};

handler.GetTodayDataArray = function () {
    var dataArray = new Array();
    for (var attID in this.todayDataList) {
        var dataArr = new Array();
        dataArr.push(this.todayDataList[attID].attID);
        dataArr.push(this.todayDataList[attID].score);
        dataArr.push(this.todayDataList[attID].targetValue1);
        dataArr.push(this.todayDataList[attID].targetValue2);
        dataArr.push(this.todayDataList[attID].targetValue3);
        dataArr.push(this.todayDataList[attID].todayScore);
        dataArr.push(this.todayDataList[attID].cengStatus);
        dataArray.push(dataArr);
    }
    return dataArray;
};

handler.GetHistoryDataJson = function () {
    var self = this;
    return JSON.stringify(self.GetHistoryArray());
};

handler.GetHistoryArray = function () {
    if (!_.isArray(this.historyData)) {
        this.historyData = [];
    }
    if (!_.isEmpty(this.cengDataList)) {
        var index = 0;
        for (var attID in this.cengDataList) {
            if (this.historyData[index]) {
                if (this.cengDataList[attID].score > this.historyData[index]) {
                    this.historyData[index] = this.cengDataList[attID].score;
                }
            } else {
                this.historyData[index] = this.cengDataList[attID].score;
            }
            index++;
        }
    }
    return this.historyData;
};

handler.GetHistoryDataList = function () {
    var self = this;
    var historyList = [];
    if (this.historyData.length > 0) {
        var attID = 1;
        for (var index in this.historyData) {
            var historyData = {attID: defaultValues.climbMinCustomID + attID, score: this.historyData[index]};
            attID++;
            historyList.push(historyData);
        }
    } else {
        var dataArray = self.GetHistoryArray();
        var index = 0;
        for (var attID = defaultValues.climbMinCustomID;
             attID <= defaultValues.climbMinCustomID + self.getCengDataList().length; attID++) {
            var historyData = {attID: attID, score: dataArray[index]};
            index++;
            historyList.push(historyData);
        }
    }
    return historyList;
};


handler.sendInitClimbData = function (attID) {
    var self = this;
    if (!this.owner) {
        return;
    }

    var cengDataList = self.getCengDataList();
    var todayDataList = self.getTodayDataList();
    /** 计算周积分*/
    var weekScore = 0;
    for (var index in todayDataList) {
        weekScore += todayDataList[index].todayScore;  /** ???　todayScore　change to score*/
    }
    weekScore= Math.max(this.weekScore, weekScore);

    this.weekScore = weekScore;
    /** fastCar*/
    var fastCar = 0;
    if (cengDataList.length >= 10 && this.fastCarNum == 1 && cengDataList.length
        > todayDataList.length + 7) {
        fastCar = cengDataList.length - 7;
    }

    /** zhuanPan*/
    var  zhuanPan = 0;
    if (todayDataList.length >= 1 && null != this.todayDataList[defaultValues.climbMinCustomID
        + this.getTodayDataList().length] &&
        this.todayDataList[defaultValues.climbMinCustomID + this.getTodayDataList().length].cengStatus == 1) {
        zhuanPan = 1;
    }

    /** why*/
    if (null != attID && attID >= defaultValues.climbMinCustomID + 100) {
        fastCar = 0;
        zhuanPan = 0;
    }

    var msg = {
        weekScore: weekScore,
        fastCar: fastCar,
        zhuanPan: zhuanPan,
        attList: todayDataList,
        historyList: self.GetHistoryDataList()
    };

    /** 更新信息*/
    var route = "ServerInitClimbData";
    this.owner.SendMessage(route, msg);


    //刷新排行榜中自己的周积分
    var roleInfo = {};
    roleInfo['roleID'] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    if (new Date().getDay() == 1) { //周一凌晨
        roleInfo['climbScore'] = msg.weekScore * 1000 + todayDataList.length;
    }
    else {
        roleInfo['climbScore'] = msg.weekScore * 1000 + cengDataList.length;
    }
    var param = {forbidChart: [eForbidChartType.CLIMB, eForbidChartType.ALL]};
    redisUtils.UpdatePlayerClimbScore(roleInfo, param, utils.done);
};

//某一层关卡内战斗结束
handler.finishResult = function (msg, callback) {
    var self = this;
    var player = self.owner;
    var attID = msg.attID;
    var useTime = msg.targetValue1;
    var lianJiNum = msg.targetValue2;
    var isFullBlood = msg.targetValue3;
    var customID = msg.customID;

    var template = templateManager.GetTemplateByID('ClimbTemplate', attID);
    if (null == template) {
        return callback(null, {result: errorCodes.ParameterWrong});
    }

    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return callback(null, {result: errorCodes.ParameterWrong});
    }

    /** 判断关卡参数是否合法*/
    if (!isRightCustom(this.curCustomID, template, customID)) {
        return callback(null, {result: errorCodes.ParameterWrong});
    }

    /** 判断上一层 是否完成， 这一层完成的前置条件 写死第一层数据*/
    if (attID != 830001 && !!this.todayDataList && !this.todayDataList[attID - 1]) {
        logger.error('finish but before not finish attID: %d, todayDataList: %j', attID, this.todayDataList);
        return callback(null, {result: errorCodes.ParameterWrong});
    }

    /********************************************************************************************************************/
    /** 积分计算*/
    var timeScore = 0;
    var lianjiScore = 0;
    var fullBloodScore = 0;
    if (useTime <= template['targetValue_1']) {
        timeScore = template['targetScore_1'];
    }

    if (lianJiNum >= template['targetValue_2']) {
        lianjiScore = template['targetScore_2'];
    }

    if (isFullBlood == 0) {
        fullBloodScore = template['targetScore_3'];
    }

    var timeBaseScore = 910 - (useTime - CustomTemplate['duringTime']) * 3;
    var cengBaseScore = timeBaseScore + template['baseScore'];
    var cengCrossScore = cengBaseScore + timeScore + lianjiScore + fullBloodScore;   //通关总得分

    if (playerManager.GetForbidProfitTime(player.GetPlayerInfo(ePlayerInfo.ROLEID)) >= new Date().getTime()) {
        logger.warn('FinishResult can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, ClimbScore value: %j',
                    player[ePlayerInfo.ROLEID], utilSql.DateToString(new Date()),
                    utilSql.DateToString(new Date(playerManager.GetForbidProfitTime(player[ePlayerInfo.ROLEID]))),
                    cengCrossScore);
        cengCrossScore = 0;
    }

    /********************************************************************************************************************/

    //领取奖励
    if (null == this.todayDataList[attID]) {
        //奖励金币
        self.AddMoneyTemp(template);
    }

    /** 跟新数据 今天*/
    var oldData = this.todayDataList[attID];
    this.todayDataList[attID] = {
        attID: attID,
        score: !!oldData? Math.max(oldData.score, cengCrossScore): cengCrossScore,//本层的历史最高分
        todayScore: cengCrossScore,                                        //当天得分
        targetValue1: timeScore,
        targetValue2: lianjiScore,
        targetValue3: fullBloodScore,
        cengStatus: 1//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
    };

    /** 跟新数据 层*/
    var oldCengData = this.cengDataList[attID];
    this.cengDataList[attID] = {
        attID: attID,
        score: !!oldCengData? Math.max(oldCengData.score, this.todayDataList[attID].score): this.todayDataList[attID].score
    };


    // 通过【40，50，60，70，80，90，100】关卡时给世界发通告
    self.sendGongGao(attID);

    player.GetMissionManager().IsMissionOver(gameConst.eMisType.OverCus, 0, self.getTodayDataList().length);     //任务完成
    player.GetMissionManager().IsMissionOver(gameConst.eMisType.OverCus, 0, self.getTodayDataList().length);     //刷新新添加的任务进度
    player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.OverCus, 0, self.getTodayDataList().length);
    //发给 client
    self.sendInitClimbData(attID);

    self.SaveClimbInfo();
    ///////////////////////////////////////////////////////////
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    tlogger.log('RoundFlow', accountType, openID, template['customID'], 2, cengCrossScore, useTime, 1, 0, 0);
    ///////////////////////////////////////////////////////////

    var cengData = this.todayDataList[attID];

    if (callback) {
        return callback(null, cengData)
    }
};

//加时战斗
handler.addTimeWar = function (msg, callback) {
    var template = templateManager.GetTemplateByID('ClimbTemplate', msg.attID);
    if (null == template) {
        return callback(null, {result: errorCodes.ParameterNull});
    }
    var addTime = msg.addTime;
    var resultData = {
        result: 0,
        addTime: msg.addTime
    };

    var assetsManager = this.owner.GetAssetsManager();
    if (addTime == template['addTime_Value_1']) {
        if (assetsManager.CanConsumeAssets(template['addTime_AssetsID_1'], template['addTime_AssetsNum_1']) == false) {
            resultData.result = errorCodes.NoAssets;
            resultData.addTime = msg.addTime;
            return callback(null, resultData);
        }
        assetsManager.SetAssetsValue(template['addTime_AssetsID_1'], -template['addTime_AssetsNum_1']);
    }
    else if (addTime == template['addTime_Value_2']) {
        if (assetsManager.CanConsumeAssets(template['addTime_AssetsID_2'], template['addTime_AssetsNum_2']) == false) {
            resultData.result = errorCodes.NoAssets;
            resultData.addTime = msg.addTime;
            return callback(null, resultData)
        }
        assetsManager.SetAssetsValue(template['addTime_AssetsID_2'], -template['addTime_AssetsNum_2']);
    }
    return callback(null, resultData);
};

//直通车/转盘
handler.fastCar = function (msg, callback) {
    var isFastCar = msg.isFastCar;//0:直通车  1：转盘
    var self = this;
    var player = self.owner;
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);

    var backData = {
        result: 0,
        list: []
    };
    var minCengID = defaultValues.climbMinCustomID;
    var scoreList = [];
    var number = 0;//isFastCar是直通车时number=0,转盘时是随机数字
    var template = '';
    if (isFastCar == 0) {
        var cengDataList = self.getCengDataList();
        var todayDataList = self.getTodayDataList();
        if (cengDataList.length < 10 && this.fastCarNum > 0 && todayDataList.length
            <= cengDataList.length - 7) {
            return callback(null, {result: errorCodes.ParameterWrong});
        }
        this.fastCarNum = 0;
        var AllTemplate = templateManager.GetTemplateByID('AllTemplate', 39);//直通车的消耗
        if (player.GetAssetsManager().CanConsumeAssets(globalFunction.GetYuanBaoTemp(), AllTemplate['attnum'])
            == false) {
            return callback(null, {result: errorCodes.NoAssets});
        }
        //player.GetAssetsManager().SetAssetsValue(globalFunction.GetYuanBaoTemp(), -AllTemplate['attnum']); //扣钻石
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -AllTemplate['attnum'],
                                                   eAssetsReduce.ClimbFastCar); //扣钻石
        var minID = todayDataList.length > 1 ?
                    todayDataList[todayDataList.length - 1].attID + 1 : 1;
        var maxID = Math.min(minCengID + cengDataList.length - 7, 830101);//830100  最大层ID
        if (minID >= maxID) {
            return callback(null, {result: errorCodes.ParameterWrong});
        }
        for (var attID in cengDataList) {
            var index = cengDataList[attID].attID;
            template = templateManager.GetTemplateByID('ClimbTemplate', index);
            if (index >= minID && index <= maxID) {
                //给客户端的层id和分数
                var tmpScore = {
                    id: 0,
                    score: 0
                };
                tmpScore.id = index;
                // this.weekScore += this.cengDataList[index].score;
                var data = this.cengDataList[index];
                if (null != data) {
                    if (playerManager.GetForbidProfitTime(player.GetPlayerInfo(ePlayerInfo.ROLEID))
                        >= new Date().getTime()) {
                        logger.warn('Fastcar can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, ClimbScore value: %j',
                                    player[ePlayerInfo.ROLEID], utilSql.DateToString(new Date()),
                                    utilSql.DateToString(new Date(playerManager.GetForbidProfitTime(player[ePlayerInfo.ROLEID]))),
                                    data.score);
                        data.score = 0;
                    }
                    tmpScore.score = data.score;
                }
                if (null == this.todayDataList[index] && data != null) {
                    var cengData = {
                        attID: index,
                        score: data.score,//本层的历史最高分
                        todayScore: data.score,//当天得分
                        targetValue1: 0,
                        targetValue2: 0,
                        targetValue3: 0,
                        cengStatus: 0//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
                    };
                    this.todayDataList[index] = cengData;
                }
                player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.OverCus, 0,
                                                             self.getTodayDataList().length);
                //奖励金币
                self.AddMoneyTemp(template);
                scoreList.push(tmpScore);
            }
            self.sendGongGao(index);//发世界公告
        }
        backData.list = scoreList;
        //发给 client
        self.sendInitClimbData(null);

        var climbTemp = templateManager.GetTemplateByID('ClimbTemplate', +maxID);
        tlogger.log('TowerFlow', accountType, openID, 3, expLevel, vipLevel, 1, climbTemp['index'], 0);
    }
    else {
        //验证能不能用转盘
        var cengDataList = self.getCengDataList();
        var todayDataList = self.getTodayDataList();

        if (todayDataList.length < 1) {
            return callback(null, {result: errorCodes.ParameterWrong});
        }
        var minID = todayDataList[todayDataList.length - 1].attID + 1;
        var maxID = Math.min(minID + this.luckNumber, 830101);//830100  最大层ID
        maxID = maxID >= 830100 ? 830101 : maxID;
        if (this.luckNumber <= 0 || this.luckNumber > 6) {
            logger.warn("climbManager ZhuanPan have error luckNumber = %j", this.luckNumber);
            this.luckNumber = 1;
        }
        if (cengDataList.length >= maxID) {
            this.luckNumber = 0;
            for (var index in cengDataList) {
                var attID = cengDataList[index].attID;
                template = templateManager.GetTemplateByID('ClimbTemplate', attID);
                if (attID >= minID && attID < maxID) {
                    var tmpScore = {
                        id: 0,
                        score: 0
                    };
                    tmpScore.id = cengDataList[index].attID;
                    tmpScore.score = cengDataList[index].score;
                    //this.weekScore += this.cengDataList[index].score;
                    if (null == this.todayDataList[attID]) {
                        var data = this.cengDataList[attID];
                        if (playerManager.GetForbidProfitTime(player.GetPlayerInfo(ePlayerInfo.ROLEID))
                            >= new Date().getTime()) {
                            logger.warn('fastCar can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, ClimbScore value: %j',
                                        player[ePlayerInfo.ROLEID], utilSql.DateToString(new Date()),
                                        utilSql.DateToString(new Date(playerManager.GetForbidProfitTime(player[ePlayerInfo.ROLEID]))),
                                        cengDataList[index].score);
                            data.score = 0;
                            data.todayScore = 0;
                        }
                        var cengData = {
                            attID: attID,
                            score: data.score,//本层的历史最高分
                            todayScore: data.todayScore,//当天得分
                            targetValue1: 0,
                            targetValue2: 0,
                            targetValue3: 0,
                            cengStatus: 0//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
                        };
                        this.todayDataList[attID] = cengData;
                    }
                    player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.OverCus, 0,
                                                                 self.getTodayDataList().length);
                    //奖励金币
                    self.AddMoneyTemp(template);
                }
                self.sendGongGao(index);//发世界公告
                scoreList.push(tmpScore);
            }
        } else {
            this.luckNumber = 0;
            for (var index = minID; index < maxID; index++) {
                template = templateManager.GetTemplateByID('ClimbTemplate', index);
                if (null == template) {
                    return callback(null, {result: errorCodes.SystemWrong});
                }
                var tmpScore = {
                    id: 0,
                    score: 0
                };
                tmpScore.id = index;
                tmpScore.score = template['baseScore'];
                var cengData = {
                    attID: index,
                    score: template['baseScore'],//本层的历史最高分
                    todayScore: template['baseScore'],//当天得分
                    targetValue1: 0,
                    targetValue2: 0,
                    targetValue3: 0,
                    cengStatus: 0//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
                };
                if (playerManager.GetForbidProfitTime(player.GetPlayerInfo(ePlayerInfo.ROLEID))
                    >= new Date().getTime()) {
                    logger.warn('Can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, ClimbScore value: %j',
                                player[ePlayerInfo.ROLEID], utilSql.DateToString(new Date()),
                                utilSql.DateToString(new Date(playerManager.GetForbidProfitTime(player[ePlayerInfo.ROLEID]))),
                                template['baseScore']);
                    cengData.score = 0;
                    cengData.todayScore = 0;
                }
                this.todayDataList[index] = cengData;
                // this.weekScore += this.cengDataList[index].score;
                //领取奖励
                template = templateManager.GetTemplateByID('ClimbTemplate', index);
                if (null == template) {
                    return callback(null, {result: errorCodes.ParameterWrong});
                }
                player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.OverCus, 0,
                                                             self.getTodayDataList().length);
                //奖励金币
                self.AddMoneyTemp(template);
                if (null == this.cengDataList[index]) {
                    this.cengDataList[index] = {attID: index, score: template['baseScore']};
                }
                scoreList.push(tmpScore);
                self.sendGongGao(index);//发世界公告
            }
        }
        backData.list = scoreList;
        //发给 client
        self.sendInitClimbData(null);

        // tlog
        var climbTemp = templateManager.GetTemplateByID('ClimbTemplate', +maxID - 1);
        tlogger.log('TowerFlow', accountType, openID, 3, expLevel, vipLevel, 1, climbTemp['index'], 0);
    }
    self.SaveClimbInfo();
    player.GetMissionManager().IsMissionOver(gameConst.eMisType.OverCus, 0, self.getTodayDataList().length);     //任务完成
    player.GetMissionManager().IsMissionOver(gameConst.eMisType.OverCus, 0, self.getTodayDataList().length);     //刷新新添加的任务进度

    if (callback) {
        return callback(null, backData);
    }
};

//加金币
handler.AddMoneyTemp = function (climbTemplate) {
    var player = this.owner;
    var vipTemplate = player.GetVipInfoManager().GetVipTemplate();
    if (climbTemplate['moneyNum'] > 0) {
        if (vipTemplate['initDailyClimb'] == 1) {
            player.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(),
                                                     climbTemplate['moneyNum'] * 2);
        } else {
            player.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(), climbTemplate['moneyNum']);
        }
    }
    //添加爬塔物品奖励
    var addItemNum = climbTemplate['itemNum'];
    if (addItemNum > 0) {
        for (var index = 0; index < addItemNum; ++index) {
            var itemID = climbTemplate['itemID_' + index];
            var itemNum = climbTemplate['itemNum_' + index];
            if (itemID > 0 && itemNum > 0) {
                player.AddItem(itemID, itemNum, eAssetsAdd.ClimbCustom, 0);
            }
        }
    }
};

//转盘的随机数
handler.getLuckNumber = function () {
    var self = this;
    var AllTemplate = templateManager.GetTemplateByID('AllTemplate', 38);//转盘的消耗
    if (this.owner.GetAssetsManager().CanConsumeAssets(globalFunction.GetMoneyTemp(), AllTemplate['attnum']) == false) {
        return errorCodes.NoAssets;
    }
    //this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(), -AllTemplate['attnum']); //扣金币
    this.owner.GetAssetsManager().AlterAssetsValue(globalFunction.GetMoneyTemp(), -AllTemplate['attnum'],
                                                   eAssetsReduce.ClimbFastCar) // 扣金币
    var randomNumber = self.getRandom();
    this.luckNumber = randomNumber;
    var todayDataList = self.getTodayDataList();
    if (todayDataList.length + randomNumber > 100) {
        this.luckNumber = 100 - todayDataList.length;
    }
    return this.luckNumber;
};

//按照表中配置的概率随机数
handler.getRandom = function () {
    var rateList = [];
    for (var attID = 1; attID <= 6; attID++) {
        var template = templateManager.GetTemplateByID('ZhuanpanRateTemplate', attID);
        if (null == template) {
            return 1;
        }
        var zpRate = {
            attID: attID,
            rate: template.rate
        };
        rateList.push(zpRate);
    }
    var tmpList = _.indexBy(rateList, 'rate');
    var min = 1;//固定值
    var max = 10000;
    var range = max - min;
    var rand = (min + Math.round(Math.random() * range));
    var num = 0;
    var rate = 0;
    for (var a in tmpList) {
        var tmp = tmpList[a];
        if (rand <= tmp.rate + rate) {
            num = tmp.attID;
            break;
        }
        rate += tmp.rate
    }
    if (num == 0) {
        num = 1;
    }
    return num;
};

handler.Accomplish = function (customID, areaWin, callback) {
    var self = this;
    return callback(null, {result: 0});
};

getCengDataJson = function (cengDataList) {
    var tempCengData = [];
    for (var index in cengDataList) {
        if (null != cengDataList[index]) {
            var cengData = {attID: cengDataList[index].attID, score: cengDataList[index].score};
            tempCengData.push(cengData);
        }
    }
    if (tempCengData.length > 0) {
        return JSON.stringify(tempCengData);
    } else {
        return "";
    }
};
getTodayDataJson = function (todayDataList) {
    var tempTodayData = [];
    for (var indext in todayDataList) {
        var tmpObj = todayDataList[indext];
        if (null != tmpObj) {
            var cengData = {
                attID: tmpObj.attID,
                score: tmpObj.score,//本层的历史最高分
                targetValue1: tmpObj.targetValue1,
                targetValue2: tmpObj.targetValue2,
                targetValue3: tmpObj.targetValue3,
                todayScore: tmpObj.todayScore,//当天得分
                cengStatus: tmpObj.cengStatus//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
            };
            tempTodayData.push(cengData);
        }
    }
    if (tempTodayData.length > 0) {
        return JSON.stringify(tempTodayData);
    } else {
        return "";
    }
};

handler.sendGongGao = function (attID) {
    var template = templateManager.GetTemplateByID('ClimbTemplate', attID);
    var tongGaoArr = [830040, 830050, 830060, 830070, 830080, 830090, 830100];
    if (tongGaoArr.indexOf(attID) != -1) {
        var customID = template['customID'];
        var pataID = 'pata_' + customID;
        var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', pataID);
        if (null != NoticeTemplate) {
            var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
            var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
            var endStr = NoticeTemplate[tNotice.noticeEndStr];
            var content = beginStr + ' ' + roleName + ' ' + endStr;
            pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.PaTa, 0, content, function (err, res) {
            });
        }
    }
    return;
};

module.exports.sendRewardOfFriendChart = function () {
    climbSql.takeRewardOfFriend(function (err, list) {
        if (!!err) {
            logger.error("send mai OF climb friend Reward======error=%j", err.stack);
        }
        else {
            var rewardItem = globalFunction.GetMoneyTemp();
            for (var n in list) {
                var mailDetail = {
                    recvID: list[n].roleID,
                    subject: sPublicString.mailTitle_1,
                    content: util.format(sCsString.content_1, list[n].id, list[n].rewardNum),//'您昨日万魔塔好友排行' + list[n].id + '名获得金币' + list[n].rewardNum,
                    mailType: gameConst.eMailType.System,
                    items: [
                        [rewardItem, list[n].rewardNum]
                    ]
                };
                mailManager.SendMail(mailDetail, function (err, result) {
                    if (!!err) {
                        logger.error("发送万魔塔好友排行奖励邮件时出错" + err.stack);
                    }
                    else if (result != 0) {
                        logger.error("发送万魔塔好友排行奖励邮件时出错==" + err);
                    }
                })
            }
        }
    });
};

module.exports.sendRewardOfSingleChart = function () {
    climbSql.takeRewardOfSingleZone(function (err, list) {
        if (!!err) {
            logger.error("send mai OF climb  Reward======error=%j", err.stack);
        }
        else {
            var rewardItem = globalFunction.GetYuanBaoTemp();
            for (var n in list) {
                var mailDetail = {
                    recvID: list[n].roleID,
                    subject: sPublicString.mailTitle_1,
                    content: util.format(sCsString.content_2, list[n].id, list[n].rewardNum),//'您昨日万魔塔单区排行' + list[n].id + '名获得钻石' + list[n].rewardNum,
                    mailType: gameConst.eMailType.System,
                    items: [
                        [rewardItem, list[n].rewardNum]
                    ]
                };
                mailManager.SendMail(mailDetail, function (err, result) {
                    if (!!err) {
                        logger.error("发送万魔塔单区排行奖励邮件时出错%j" + err.stack);
                    }
                    else if (result != 0) {
                        logger.error("发送万魔塔单区排行奖励邮件时出错==%j" + err.stack);
                    }
                })
            }
        }
    });
};


handler.sendChartOfFriend = function () {
    var self = this;
    var roleID = self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];
    var climbFriendDataList = {};
    var days = 0;
    if (new Date().getDay() == 0) {
        days = 0;
    }
    days = 7 - new Date().getDay();
    var route = "ServerSendChartOfFriend";
    async.series([
                     function (friendNext) {
                         climbSql.refreshChartClimbFriend(roleID, function (err) {
                             if (!!err) {
                                 logger.error('刷新好友排行榜出错%j', err.stack);
                                 return callback(err)
                             }
                             return friendNext();
                         });
                     },
                     function (friendNext) {
                         climbSql.GetClimbChartFriendList(roleID, function (err, DataList) {
                             if (!!err) {
                                 logger.error('加载好友排行榜出错%j', err.stack);
                                 return callback(err)
                             }
                             climbFriendDataList = DataList;
                             return friendNext();
                         })
                     },
                     function (friendNext) {
                         climbSql.GetClimbFriendChartID(roleID, function (err, chartID, myScore, myCengNum) {
                             if (!!err) {
                                 logger.error('加载好友排行我的排名出现错误' + err.stack);
                                 return callback(errorCodes.SystemWrong);
                             }

                             var msg = {
                                 type: 1,
                                 myChart: chartID,
                                 myScore: myScore,
                                 myCengNum: myCengNum,
                                 days: days,
                                 chartList: climbFriendDataList
                             };
                             self.owner.SendMessage(route, msg);

                         });
                     }
                 ], function (err, result) {
        if (typeof err === 'number') {
            return callback(err);
        }
        if (!!err) {
            return callback(errorCodes.SystemWrong);
        }
        return callback();
    });
};

handler.GMFinishResult = function (attID) {

    var self = this;
    var id = attID;
    var useTime = 10;
    var lianJiNum = 10;
    var isFullBlood = 10;

    for (var attID = 830001; attID <= defaultValues.climbMinCustomID + id; attID++) {
        var template = templateManager.GetTemplateByID('ClimbTemplate', attID);
        var timeScore = 0;
        var lianjiScore = 0;
        var fullBloodScore = 0;
        if (useTime <= template['targetValue_1']) {
            timeScore = template['targetScore_1'];
        }
        if (lianJiNum >= template['targetValue_2']) {
            lianjiScore = template['targetScore_2'];
        }
        if (isFullBlood == 0) {
            fullBloodScore = template['targetScore_3'];
        }
        var timeBaseScore = 910 - (useTime - 5) * 3;
        var cengBaseScore = timeBaseScore + template['baseScore'];
        var cengCrossScore = cengBaseScore + timeScore + lianjiScore + fullBloodScore;   //通关总得分

        //领取奖励
        if (null == this.todayDataList[attID]) {
            var template = templateManager.GetTemplateByID('ClimbTemplate', attID);
            if (null == template) {
                return callback(null, {result: errorCodes.ParameterWrong});
            }

            var vipTemplate = this.owner.GetVipInfoManager().GetVipTemplate();

            if (template['moneyNum'] > 0) {
                if (vipTemplate['initDailyClimb'] == 1) {
                    this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(),
                                                                 template['moneyNum'] * 2);
                } else {
                    this.owner.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(), template['moneyNum']);
                }
            }
        }
        var cengData = {
            attID: 0,
            score: 0,//本层的历史最高分
            targetValue1: 0,
            targetValue2: 0,
            targetValue3: 0,
            todayScore: 0,//当天得分
            cengStatus: 1//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
        };
        if (null == this.todayDataList[attID]) {
            cengData.attID = attID;
            cengData.score = cengCrossScore;
            cengData.todayScore = cengCrossScore;//通关得分
            cengData.targetValue1 = timeScore;
            cengData.targetValue2 = lianjiScore;
            cengData.targetValue3 = fullBloodScore;
            cengData.cengStatus = 1;
            this.todayDataList[attID] = cengData;
        }
        else {
            cengData = this.todayDataList[attID];
            var maxScore = Math.max(cengData.score, cengCrossScore);
            cengData.score = maxScore;
            cengData.todayScore = cengCrossScore;
            cengData.targetValue1 = timeScore;
            cengData.targetValue2 = lianjiScore;
            cengData.targetValue3 = fullBloodScore;
            //cengData.cengStatus = 0;
            this.todayDataList[attID] = cengData;
        }
        if (null == this.cengDataList[attID] && null != this.todayDataList[attID]) {
            var data = {
                attID: attID,
                score: this.todayDataList[attID].score
            };
            this.cengDataList[attID] = data;
        }
        else {
            if (null != this.cengDataList[attID] && null != this.todayDataList[attID]) {
                this.cengDataList[attID].score =
                Math.max(this.cengDataList[attID].score, this.todayDataList[attID].score);
            }
        }
        //刷新排行榜中自己的周积分
        var roleInfo = {};
        roleInfo['roleID'] = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
        roleInfo['climbScore'] = this.weekScore * 1000 + this.getCengDataList().length;
        //pomelo.app.rpc.chart.chartRemote.UpdateClimbScore(null, roleInfo, utils.done);
        var param = {forbidChart: [eForbidChartType.CLIMB, eForbidChartType.ALL]};
        redisUtils.UpdatePlayerClimbScore(roleInfo, param, utils.done);
        self.sendInitClimbData(attID);
    }
};

handler.ClearHistoryData = function () {
    this.cengDataList = {};//历史关卡层数据,attID是index
    this.historyData = [];
    this.todayDataList = {};
    this.weekScore = 0;
    this.sendInitClimbData(0);
};

handler.SetHistoryScore = function (customID, scoreNum) {
    if (customID <= defaultValues.climbMinCustomID || customID > defaultValues.climbMaxCustomID || scoreNum < 0) {
        return;
    }
    var temp = this.cengDataList[customID];
    if (null != temp) {
        temp.score = scoreNum;
    }
    var distance = customID - defaultValues.climbMinCustomID;       //设置关卡为第几关
    var hisLength = this.historyData.length;
    if (distance > hisLength + 1) { //设置关卡之前有未打关卡
        return;
    }
    /*  if (distance == hisLength + 1) {
     this.historyData.push(scoreNum);
     this.sendInitClimbData(this.owner, 0);
     }
     this.historyData[distance - 1] = scoreNum;*/

    var cengData = {
        attID: 0,
        score: 0,//本层的历史最高分
        targetValue1: 0,
        targetValue2: 0,
        targetValue3: 0,
        todayScore: 0,//当天得分
        cengStatus: 1//本层是如何通过的，攻打通过的为1，直通车或转盘通过的为0
    };
    if (null == this.todayDataList[customID]) {
        cengData.attID = customID;
        cengData.score = scoreNum;
        cengData.todayScore = scoreNum;//通关得分
        cengData.targetValue1 = 0;
        cengData.targetValue2 = 0;
        cengData.targetValue3 = 0;
        cengData.cengStatus = 1;
        this.todayDataList[customID] = cengData;
    }
    else {
        cengData = this.todayDataList[customID];
        var maxScore = Math.max(cengData.score, scoreNum);
        cengData.score = maxScore;
        cengData.todayScore = scoreNum;
        cengData.targetValue1 = 0;
        cengData.targetValue2 = 0;
        cengData.targetValue3 = 0;
        //cengData.cengStatus = 0;
        this.todayDataList[customID] = cengData;
    }

    if (null == this.cengDataList[customID] && null != this.todayDataList[customID]) {
        var data = {
            attID: customID,
            score: this.todayDataList[customID].score
        };
        this.cengDataList[customID] = data;
    }
    else {
        if (null != this.cengDataList[customID] && null != this.todayDataList[customID]) {
            this.cengDataList[customID].score =
            Math.max(this.cengDataList[customID].score, this.todayDataList[customID].score);
        }
    }
    this.sendInitClimbData(customID);
};


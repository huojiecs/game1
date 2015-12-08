/**
 * The file rolechartManger.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/11/21 15:15:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var csSql = require('../../tools/mysql/csSql');
var defaultValues = require('../../tools/defaultValues');
var globalFunction = require('../../tools/globalFunction');
var stringValue = require('../../tools/stringValue');

var _ = require('underscore');
var Q = require('q');

var ePlayerInfo = gameConst.ePlayerInfo;
var eChartRewardInfo = gameConst.eChartRewardInfo;
var eAcceptRewardInfo = gameConst.eAcceptRewardInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;

var doubleDayBegin = new Date('2015-04-13 0:00:00');  // 奖励开始时间
var doubleDayEnd = new Date('2015-04-20 0:00:00');    // 奖励结束时间


var ObtainDailyBegin = new Date('2015-06-08 0:00:00');  // 奖励开始时间
var ObtainDailyEnd = new Date('2015-06-14 0:00:00');    // 奖励结束时间
var doubleNum = 2;      // 奖励倍数

// 有发奖的排行榜
var rewardChartType = [gameConst.eChartType.Zhanli, gameConst.eChartType.UnionScore, gameConst.eChartType.UnionAnimal, gameConst.eChartType.UnionDamage,gameConst.eChartType.Marry
    /*gameConst.eChartType.Honor*/];

/**
 * 玩家排行榜管理器 主要用于排行榜奖励
 * */
module.exports = function (owner) {
    return new RoleChartManager(owner);
};

var RoleChartManager = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /**  玩家排行榜奖励列表 <type, rewardMap>*/
    this.chartRewardMaps = {};
    this.acceptRewardMaps = {};

    /*
    this.chartRewardMaps[gameConst.eChartType.UnionScore] = {
        'roleID': owner.GetPlayerInfo(ePlayerInfo.ROLEID),
        'chartType': gameConst.eChartType.UnionScore,
        'ranking': 9999,
        'refreshTime': new Date(),
        'isBoss': 0
    }
    */
};

var handler = RoleChartManager.prototype;

/**
 * 从数据库加载数据：1, 以chartType 作为map key 进行数据储存
 *
 * @param {Array} chartRewardInfo 数据库里的数据
 * @api public
 * */
handler.loadDataByDB = function (chartRewardInfo) {
    for (var id in chartRewardInfo) {
        chartRewardInfo[id][eChartRewardInfo.REFRESH_TIME] =
        new Date(chartRewardInfo[id][eChartRewardInfo.REFRESH_TIME]);

        this.chartRewardMaps[chartRewardInfo[id][eChartRewardInfo.CHART_TYPE]] = {
            'roleID': chartRewardInfo[id][eChartRewardInfo.ROLE_ID],
            'chartType': chartRewardInfo[id][eChartRewardInfo.CHART_TYPE],
            'ranking': chartRewardInfo[id][eChartRewardInfo.RANKING],
            'refreshTime': chartRewardInfo[id][eChartRewardInfo.REFRESH_TIME],
            'isBoss': chartRewardInfo[id][eChartRewardInfo.ISBOSS] == null ? 0: chartRewardInfo[id][eChartRewardInfo.ISBOSS]
        };

    }
};

/**
 * 加载领奖信息
 *@param [[],[]]
 * */
handler.loadAcceptTimeByDB = function (acceptInfo) {
    for (var id in acceptInfo) {
        acceptInfo[id][eAcceptRewardInfo.ACCEPT_TIME] =
        new Date(utils.GetDateNYR(new Date(acceptInfo[id][eAcceptRewardInfo.ACCEPT_TIME])));

        this.acceptRewardMaps[acceptInfo[id][eAcceptRewardInfo.CHART_TYPE]] = {
            'roleID': acceptInfo[id][eAcceptRewardInfo.ROLE_ID],
            'chartType': acceptInfo[id][eAcceptRewardInfo.CHART_TYPE],
            'acceptTime': acceptInfo[id][eAcceptRewardInfo.ACCEPT_TIME]
        };
    }
    /* for(var index in rewardChartType) {
     if(this.acceptRewardMaps[rewardChartType[index]] == null) {
     var data = [this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), rewardChartType[index], new Date(utils.GetDateNYR(new Date()))];
     //            var data = {'chartType': rewardChartType[index], 'acceptTime': new Date(utils.GetDateNYR(new Date()))};
     this.acceptRewardMaps[rewardChartType[index]] = data;
     }
     }*/
};

handler.GetZhanliRanking = function(){
    var nowDate = new Date();
    var today = new Date(utils.GetDateNYR(nowDate));

    var chartType = gameConst.eChartType.Zhanli;
    if(nowDate.getHours() > 0 || nowDate.getMinutes() >= 8){
        var ranking = 2001;
        var rewardDay = new Date(utils.GetDateNYR(new Date(0)));
        if (this.chartRewardMaps[chartType]) {
            rewardDay = new Date(utils.GetDateNYR(new Date(this.chartRewardMaps[chartType]['refreshTime'])));
        }
        if(today - rewardDay == 0){
            if(this.chartRewardMaps[gameConst.eChartType.Zhanli] != null){
                ranking = this.chartRewardMaps[chartType]['ranking'];
            }
        }

        return ranking;
    }

    return 0;
};

handler.UpdateChartAdvance = function(){
    var nowDate = new Date();
    var today = new Date(utils.GetDateNYR(nowDate));

    var chartType = gameConst.eChartType.Zhanli;

    if(nowDate.getHours() > 0 || nowDate.getMinutes() >= 8){
        var ranking = 2001;
        var rewardDay = new Date(utils.GetDateNYR(new Date(0)));
        if (this.chartRewardMaps[chartType]) {
            rewardDay = new Date(utils.GetDateNYR(new Date(this.chartRewardMaps[chartType]['refreshTime'])));
        }
        if(today - rewardDay == 0){
            if(this.chartRewardMaps[gameConst.eChartType.Zhanli] != null){
                ranking = this.chartRewardMaps[chartType]['ranking'];
            }
        }
        this.owner.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_SigPower, ranking, 1);
    }
    else{
        this.owner.GetAdvanceManager().createEmptyAdvance(gameConst.eAdvanceType.Advance_SigPower);
    }
};

// 获取每日收益的补偿邮件
handler.ObtainDailyMail = function(){
    var player = this.owner;
    var nowDate = new Date();
    if((nowDate >= ObtainDailyBegin && nowDate < ObtainDailyEnd) == false){
        return;
    }

    var chartType = gameConst.eChartType.UnionAnimal;
    if(this.chartRewardMaps[chartType] == null || this.chartRewardMaps[chartType]['ranking'] != 0){
        return;
    }

    var giftData = player.giftManager.GetGiftData(globalFunction.GetFixDailyID());

    // 已经处理过，就不处理了
    if (giftData != null) {
        return;
    }

    var UnionAwardTemplate = templateManager.GetTemplateByID('UnionAwardTemplate', 1002);
    if(UnionAwardTemplate == null){
        return;
    }

    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var mailDetail = {
        recvID: roleID,
        subject: stringValue.sMsString.sendName,
        mailType: gameConst.eMailType.System,
        content: stringValue.sAdminCommandsString.fixUnionDaily,
        items: []
    };

    for(var i = 1; i < 5; ++i){
        var itemID = UnionAwardTemplate['itemID' + i];
        var itemNum = UnionAwardTemplate['itemNum' + i];
        if(itemID <= 0 || itemNum <= 0){
            break;
        }
        itemNum = itemNum * 3;
        mailDetail.items.push([itemID, itemNum]);
    }

    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }

        player.giftManager.AddSysGift(globalFunction.GetFixDailyID());
    });
};

/**
 * 刷榜时如果玩家在线修改玩家数据
 *
 * @param {Array} chartInfo 排行榜信息
 */
handler.refreshChartRanking = function (chartInfo) {
    this.chartRewardMaps[chartInfo[eChartRewardInfo.CHART_TYPE]] = chartInfo;
};

/**
 * 获取存储字符串
 * @return {string}
 */
handler.getSqlStr = function () {
    var rows = [];

    var chartInfo = '';
    for (var index in this.chartRewardMaps) {
        var temp = this.chartRewardMaps[index];
        temp['refreshTime'] = utilSql.DateToString(new Date(temp['refreshTime']));

        chartInfo += '(';
        var row = [];

        for (var i in temp) {
            var value = temp[i];
            if (typeof  value == 'string') {
                chartInfo += '\'' + value + '\'' + ',';
            }
            else {
                chartInfo += value + ',';
            }

            row.push(value);
        }
        chartInfo = chartInfo.substring(0, chartInfo.length - 1);
        chartInfo += '),';

        rows.push(row);
    }
    chartInfo = chartInfo.substring(0, chartInfo.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== chartInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, chartInfo);
    }
    return sqlString;
};

handler.GetAcceptSqlStr = function () {
    var rows = [];

    var acceptInfo = '';
    for (var index in this.acceptRewardMaps) {
        var temp = this.acceptRewardMaps[index];
        temp['acceptTime'] = utilSql.DateToString(new Date(temp['acceptTime']));

        acceptInfo += '(';
        var row = [];

        for (var i in temp) {
            var value = temp[i];
            if (typeof  value == 'string') {
                acceptInfo += '\'' + value + '\'' + ',';
            }
            else {
                acceptInfo += value + ',';
            }

            row.push(value);
        }
        acceptInfo = acceptInfo.substring(0, acceptInfo.length - 1);
        acceptInfo += '),';

        rows.push(row);
    }
    acceptInfo = acceptInfo.substring(0, acceptInfo.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== acceptInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, acceptInfo);
    }
    return sqlString;
};

handler.UpdateRewardRankInfo = function () {
    var self = this;
    var player = self.owner;
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    csSql.LoadChartRewardData(roleID, function (err, rewardInfo) {
        if (!!err) {
            logger.error('UpdateRewardRankInfo error:\n%j\n%j', err, rewardInfo);
            return;
        }
        for (var id in rewardInfo) {
            rewardInfo[id][eChartRewardInfo.REFRESH_TIME] = new Date(rewardInfo[id][eChartRewardInfo.REFRESH_TIME]);
            self.chartRewardMaps[rewardInfo[id]['chartType']] = rewardInfo[id];
        }
        self.UpdateChartAdvance();
        self.sendCanAcceptRewardOnLogin();
    });
};

// 领取排行榜奖励
handler.GetChartReward = function (chartType) {
    // 公会相关的，判定公会ID
    if(chartType == gameConst.eChartType.UnionScore ||
        chartType == gameConst.eChartType.UnionAnimal ||
        chartType == gameConst.eChartType.UnionDamage){
        var unionID = this.owner.GetPlayerInfo(ePlayerInfo.UnionID);
        if(unionID == null || unionID == 0){
            return {'result': errorCodes.NoChartReward};
        }
    }

    var chartRewardTemplate = templateManager.GetAllTemplate('ChartsRewardTemplat');
    var today = new Date(utils.GetDateNYR(new Date()));

    var rewardDay = new Date(utils.GetDateNYR(new Date(0)));
    var acceptDay = new Date(utils.GetDateNYR(new Date(0)));
    if (this.chartRewardMaps[chartType]) {
        rewardDay = new Date(utils.GetDateNYR(new Date(this.chartRewardMaps[chartType]['refreshTime'])));
    }
    if (this.acceptRewardMaps[chartType]) {
        acceptDay = new Date(utils.GetDateNYR(new Date(this.acceptRewardMaps[chartType]['acceptTime'])));
    }

    var grade = 0;
    var nowDate = new Date();
    var rank = 0;

    switch (chartType){
        case gameConst.eChartType.UnionScore:
            var acceptDate = new Date(this.acceptRewardMaps[chartType]['acceptTime']);
            if(isSameWeek(nowDate, acceptDate)){
                return {'result': errorCodes.NoChartReward};
            }
            var dayDiff = utils.getDayOfDiff(today, rewardDay);
            if (dayDiff > 0 && dayDiff < 8) { // 上榜
                rank = this.chartRewardMaps[chartType]['ranking'];
                for (var i in chartRewardTemplate) {
                    if(chartRewardTemplate[i]['Type'] != chartType){
                        continue;
                    }
                    if (rank >= chartRewardTemplate[i]['minLevel'] && rank <= chartRewardTemplate[i]['maxLevel']) {
                        grade = i;
                        break;
                    }
                }
            } else { // 2000名以外
                grade = chartType * 1000 + 99;
            }
            break;
        case gameConst.eChartType.UnionAnimal:
            // 周日开战后不能
            if(nowDate.getDay() == 0 && nowDate.getHours() >= 21){
                return {'result': errorCodes.NoChartReward};
            }
            var acceptDate = new Date(this.acceptRewardMaps[chartType]['acceptTime']);
            if(isSameWeek(nowDate, acceptDate)){
                return {'result': errorCodes.NoChartReward};
            }
            var dayDiff = utils.getDayOfDiff(today, rewardDay);
            if (dayDiff > 0 && dayDiff < 8) { // 上榜
                rank = this.chartRewardMaps[chartType]['ranking'];
                // 上周是城主的，本周不能领奖
                if(rank == 0){
                    return {'result': errorCodes.NoChartReward};
                }
                for (var i in chartRewardTemplate) {
                    if(chartRewardTemplate[i]['Type'] != chartType){
                        continue;
                    }
                    if (rank >= chartRewardTemplate[i]['minLevel'] && rank <= chartRewardTemplate[i]['maxLevel']) {
                        grade = i;
                        break;
                    }
                }
            } else {
                return {'result': errorCodes.NoChartReward};    // 公会战没进榜的，不能领
            }
            break;
        case gameConst.eChartType.UnionDamage:
            // 周日开战后不能
            if(nowDate.getDay() == 0 && nowDate.getHours() >= 21){
                return {'result': errorCodes.NoChartReward};
            }
            var acceptDate = new Date(this.acceptRewardMaps[chartType]['acceptTime']);
            if(isSameWeek(nowDate, acceptDate)){
                return {'result': errorCodes.NoChartReward};
            }
            var dayDiff = utils.getDayOfDiff(today, rewardDay);
            if (dayDiff > 0 && dayDiff < 8) { // 上榜
                rank = this.chartRewardMaps[chartType]['ranking'];
                for (var i in chartRewardTemplate) {
                    if(chartRewardTemplate[i]['Type'] != chartType){
                        continue;
                    }
                    if (rank >= chartRewardTemplate[i]['minLevel'] && rank <= chartRewardTemplate[i]['maxLevel']) {
                        grade = i;
                        break;
                    }
                }
            } else {
                return {'result': errorCodes.NoChartReward};    // 公会战没进榜的，不能领
            }
            break;
        case gameConst.eChartType.Marry:
            if(1 != this.owner.toMarryManager.playerMarryState){
                return {'result': errorCodes.NOT_MARRY};
            }
            var acceptDate = new Date(this.acceptRewardMaps[chartType]['acceptTime']);
            if(isSameWeek(nowDate, acceptDate)){
                return {'result': errorCodes.NoChartReward};
            }
            var dayDiff = utils.getDayOfDiff(today, rewardDay);
            if (dayDiff > 0 && dayDiff < 8) { // 上榜
                rank = this.chartRewardMaps[chartType]['ranking'];
                for (var i in chartRewardTemplate) {
                    if(chartRewardTemplate[i]['Type'] != chartType){
                        continue;
                    }
                    if (rank >= chartRewardTemplate[i]['minLevel'] && rank <= chartRewardTemplate[i]['maxLevel']) {
                        grade = i;
                        break;
                    }
                }
            } else { // 2000名以外
                grade = chartType * 1000 + 99;
            }
            break;
        default :
            if(today - acceptDay == 0) {
                return {'result': errorCodes.NoChartReward};
            }
            if(!(nowDate.getHours() > 0 || nowDate.getMinutes() >= 8)) {
                return {'result': errorCodes.ChartClearing};
            }
            if (today - rewardDay == 0) { // 2000名以内
                rank = this.chartRewardMaps[chartType]['ranking'];
                for (var i in chartRewardTemplate) {
                    if(chartRewardTemplate[i]['Type'] != chartType){
                        continue;
                    }
                    if (rank >= chartRewardTemplate[i]['minLevel'] && rank <= chartRewardTemplate[i]['maxLevel']) {
                        grade = i;
                        break;
                    }
                }
            } else { // 2000名以外
                if (chartType == gameConst.eChartType.Zhanli) {
                    grade = 1 * 1000 + 99;
                } else {
                    grade = chartType * 1000 + 99;
                }
            }
            break;
    }

    var doubles = 1;
    if (chartType == gameConst.eChartType.Zhanli) {
        var factor = eAssetsAdd.ZhanliChartReward;
    } else if (chartType == gameConst.eChartType.Honor) {
        var factor = eAssetsAdd.HonorReward;
    }else if(chartType == gameConst.eChartType.UnionScore){
        if(nowDate >= doubleDayBegin && nowDate < doubleDayEnd){
            doubles = doubleNum;
        }
    }else if (chartType == gameConst.eChartType.Marry) {
        var factor = eAssetsAdd.MarryChartReward;
    }
    var rewardList = [];
    for (var i = 0; i < 2; i++) {
        var index = i + 1
        var assetsID = chartRewardTemplate[grade]['assetsID' + index];
        var assetsNum = chartRewardTemplate[grade]['Num' + index] * doubles;
        this.owner.AddItem(assetsID, assetsNum, factor, 0);//添加物品方法
        if(assetsID > 0 && assetsNum > 0){
            rewardList.push({'id': assetsID, 'num': assetsNum});
        }
    }

    for (var i = 0; i < 2; i++) {
        var index = i + 1
        var assetsID = chartRewardTemplate[grade]['itemID' + index];
        var assetsNum = chartRewardTemplate[grade]['itemNum' + index] * doubles;
        this.owner.AddItem(assetsID, assetsNum, factor, 0);//添加物品方法
        if(assetsID > 0 && assetsNum > 0){
            rewardList.push({'id': assetsID, 'num': assetsNum});
        }
    }

    // 会长额外获得。。
    if(chartType == gameConst.eChartType.UnionScore){
        if(this.chartRewardMaps[chartType] != null &&
            this.chartRewardMaps[chartType]['isBoss'] == 1){
            var assetsID = chartRewardTemplate[grade]['leaderAssetsID'];
            var assetsNum = chartRewardTemplate[grade]['leaderAssetsNum'] * doubles;
            this.owner.AddItem(assetsID, assetsNum, factor, 0);//添加物品方法

            if(assetsID > 0 && assetsNum > 0){
                rewardList.push({'id': assetsID, 'num': assetsNum});
            }

            var itemID = chartRewardTemplate[grade]['leaderItemID'];
            var itemNum = chartRewardTemplate[grade]['leaderItemNum'] * doubles;
            this.owner.AddItem(itemID, itemNum, factor, 0);//添加物品方法

            if(itemID > 0 && itemNum > 0){
                rewardList.push({'id': itemID, 'num': itemNum});
            }
        }
    }

    var data = {
        'roleID': this.owner.GetPlayerInfo(ePlayerInfo.ROLEID),
        'chartType': chartType,
        'acceptTime': new Date()
    };
    this.acceptRewardMaps[chartType] = data;

    this.sendCanAcceptRewardMsg( {'canAcceptList': [
        {'chartType': chartType, 'canAccept': 0}
    ]});

    return {'result': 0, 'rewardList': rewardList, 'ranking': rank};
};

handler.sendCanAcceptRewardMsg = function ( msg) {
    var player = this.owner;
    if (null == msg) {
        logger.error('sendCanAcceptRewardMsg, msg is null!');
        return;
    }
    if (null == player) {
        logger.error('sendCanAcceptRewardMsg, player is null!');
        return;
    }
    var route = 'ServerChartRewardAccept';
    player.SendMessage(route, msg);
};

function isSameWeek(nowDate, acceptDate){
    var dayDiff = utils.getDayOfDiff(nowDate, acceptDate);
    if(dayDiff >= 7){
        return false;
    }

    if(nowDate.getDay() == acceptDate.getDay()){
        return true;
    }

    if(nowDate.getDay() == 0){
        return true;
    }
    else{
        if(acceptDate.getDay() == 0){
            return false;
        }
        else if(nowDate.getDay() < acceptDate.getDay()){
            return false;
        }
    }

    return true;
}

handler.sendCanAcceptRewardOnLogin = function () {
    var nowDate = new Date();
    var today = new Date(utils.GetDateNYR(nowDate));
    var rewardDay = new Date(utils.GetDateNYR(new Date(0)));
    var canAcceptList = [];
    var unionID = this.owner.GetPlayerInfo(ePlayerInfo.UnionID);
    for (var index in rewardChartType) {
        if (this.acceptRewardMaps[rewardChartType[index]]) {
            //如果排行榜领取有等级限制，先判一下
            if (rewardChartType[index] == gameConst.eChartType.Honor) {
                var playerLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
                if (playerLevel < defaultValues.aPvPExpLevel) { // 斩魂21级开启，发奖也21级开始可以领取
                    canAcceptList.push({'chartType': rewardChartType[index], 'canAccept': 0});
                    continue;
                }
            }

            if (this.chartRewardMaps[rewardChartType[index]]) {
                rewardDay = new Date(utils.GetDateNYR(new Date(this.chartRewardMaps[rewardChartType[index]]['refreshTime'])));
            }
            var acceptDate = new Date(this.acceptRewardMaps[rewardChartType[index]]['acceptTime']);
            var canAccept = 0;
            switch (rewardChartType[index]){
                case gameConst.eChartType.UnionScore:
                    if(unionID != null && unionID > 0 && isSameWeek(nowDate, acceptDate) == false ){
                        canAccept = 1;
                    }
                    break;
                case gameConst.eChartType.UnionAnimal:
                    if(nowDate.getDay() == 0 && nowDate.getHours() >= 21){
                        canAccept = 0;
                        break;
                    }
                    if(this.chartRewardMaps[rewardChartType[index]] == null || this.chartRewardMaps[rewardChartType[index]]['ranking'] == 0){
                        canAccept = 0;
                        break;
                    }
                    var dayDiff = utils.getDayOfDiff(today, rewardDay);
                    if (dayDiff <= 0 || dayDiff >= 8) {
                        canAccept = 0;
                        break;
                    }
                    if(unionID != null && unionID > 0 && isSameWeek(nowDate, acceptDate) == false){
                        canAccept = 1;
                        break;
                    }
                    break;
                case gameConst.eChartType.UnionDamage:
                    if(nowDate.getDay() == 0 && nowDate.getHours() >= 21){
                        canAccept = 0;
                        break;
                    }
                    if(this.chartRewardMaps[rewardChartType[index]] == null){
                        canAccept = 0;
                        break;
                    }
                    var dayDiff = utils.getDayOfDiff(today, rewardDay);
                    if (dayDiff <= 0 || dayDiff >= 8) {
                        canAccept = 0;
                        break;
                    }
                    if(unionID != null && unionID > 0 && isSameWeek(nowDate, acceptDate) == false){
                        canAccept = 1;
                        break;
                    }
                    break;
                case gameConst.eChartType.Marry:
                    if(1 != this.owner.toMarryManager.playerMarryState){
                        canAccept = 0;
                        break;
                    }else{
                        var acceptDay = new Date(utils.GetDateNYR(new Date(this.acceptRewardMaps[rewardChartType[index]]['acceptTime'])));
                        if(today - acceptDay != 0
                            && (nowDate.getHours() > 0 || nowDate.getMinutes() >= 8)){
                            canAccept = 1;
                        }
                    }
                    break;
                default :
                    var acceptDay = new Date(utils.GetDateNYR(new Date(this.acceptRewardMaps[rewardChartType[index]]['acceptTime'])));
                    if(today - acceptDay != 0
                        && (nowDate.getHours() > 0 || nowDate.getMinutes() >= 8)){
                        canAccept = 1;
                    }
                    break;
            }

            canAcceptList.push({'chartType': rewardChartType[index], 'canAccept': canAccept});
        } else { // 没有数据为新号，刷新当天可以领
            /**
             * 创建新号时 没有领过将 数据库刷新同步不会存储当前角色信息  需要初始化
             */
            this.acceptRewardMaps[rewardChartType[index]] = {
                'roleID': this.owner.GetPlayerInfo(ePlayerInfo.ROLEID),
                'chartType': rewardChartType[index],
                'acceptTime': new Date()
            };
            /**新号第一次创建 不可以领奖 1 改为0**/
            canAcceptList.push({'chartType': rewardChartType[index], 'canAccept': 0});
        }
    }
    var msg = {'canAcceptList': canAcceptList};
    this.sendCanAcceptRewardMsg( msg);
};
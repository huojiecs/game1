/**
 * 新版活动
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var templateManager = require('../../tools/templateManager');
var defaultValues = require('../../tools/defaultValues');
var templateConst = require('../../../template/templateConst');
var csSql = require('../../tools/mysql/csSql');
var utils = require('../../tools/utils');
var errorCodes = require('../../tools/errorCodes');
var _ = require('underscore');
var advance = require('./advance');
var advanceController = require('./advanceController');


var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var log_utilSql = require('../../tools/mysql/utilSql');
var eAttLevel = gameConst.eAttLevel;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAdvanceInfo = gameConst.eAdvanceInfo;
var eAssetsAdd= gameConst.eAssetsChangeReason.Add;
var eAttInfo = gameConst.eAttInfo;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.advanceList = {};
};

var handler = Handler.prototype;


// 从数据库读取
handler.LoadDataByDB = function (List) {
    for (var index in List) {
        var tempID = List[index][eAdvanceInfo.TempID];
        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', tempID);
        if (null == advanceTemplate) {
            continue;
        }
        var tempInfo = new advance();
        tempInfo.SetAllAdvanceInfo(List[index]);
        this.advanceList[tempID] = tempInfo;
    }

    this.UpdateAdvanceInfo();
};

handler.GetSqlStr = function () {
    return utilSql.BuildSqlStringFromObjects(this.advanceList, 'GetAdvanceInfo', eAdvanceInfo);
};

// 存盘
handler.SaveAdvanceInfo = function () {
    var sqlStr = utilSql.BuildSqlStringFromObjects(this.advanceList, 'GetAdvanceInfo', eAdvanceInfo);
    csSql.SaveAdvanceInfo(this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), sqlStr, function (err) {
        if (!!err) {
            logger.error("save Advance info error=%s", err.stack);
        }
    });
};

// 清理过期的活动
handler.UpdateAdvanceInfo = function(){
    var nowTime = new Date();
    for (var index in this.advanceList) {
        var advInfo = this.advanceList[index];
        var advDate = new Date(advInfo.GetAdvanceInfo(eAdvanceInfo.EndTime));
        if(nowTime > advDate){
            delete this.advanceList[index];
        }
    }
};



// 更新12点信息
handler.Update12Info = function(){
    var player = this.owner;
    var processed = [];
    for (var index in this.advanceList) {
        var advInfo = this.advanceList[index];
        var id = advInfo.GetAdvanceInfo(eAdvanceInfo.TempID);
        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', id);
        if (null == advanceTemplate) {
            continue;
        }

        if(advanceTemplate['dailyClear'] > 0){
            advInfo.SetAdvanceInfo(eAdvanceInfo.RewardStep, 0);
            processed.push(parseInt(id));
        }
    }

    if(processed.length > 0){
        this.SendAdvanceChange(processed, 1);
    }

    // 累计登陆
    this.ProcessAdvance(gameConst.eAdvanceType.Advance_AllLogin, 1, 0);

    var nowLogin = new Date();
    var refreshTime = new Date(this.owner.playerInfo[ePlayerInfo.RefreshTime]);
    // 连续登陆，不是挨着天数就清掉
    if(utils.getDayOfDiff(nowLogin, refreshTime) != 1){
        this.ClearAdvanceState(gameConst.eAdvanceType.Advance_RunningLogin);
    }
    this.ProcessAdvance(gameConst.eAdvanceType.Advance_RunningLogin, 1, 0);

    this.ProcessAdvance(gameConst.eAdvanceType.Advance_PayOneMoney, 0, 1);

    player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_VIPLevel, player.GetPlayerInfo(ePlayerInfo.VipLevel), 1);
    player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PlayerLevel, player.GetPlayerInfo(ePlayerInfo.ExpLevel), 1);
};


// 更新活动的条件进度
handler.ProcessCondition = function(conditionType, value, processType){
    var runningAdvance = advanceController.getRunningAdvanceByCondition(conditionType);

    var nowDate = new Date();
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var processed = [];
    var reached = [];
    for(var attID in runningAdvance){
        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            continue;
        }

        var advInfo = this.advanceList[attID];
        if(advInfo == null || nowDate >= advInfo.GetAdvanceInfo(eAdvanceInfo.EndTime)) {
            advInfo = new advance();
            advInfo.SetAdvanceInfo(eAdvanceInfo.RoleID, roleID);
            advInfo.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
            advInfo.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplate['endTime'])));
            this.advanceList[attID] = advInfo;
        }


        var oldPoint = advInfo.GetAdvanceInfo(eAdvanceInfo.ConditionPoint);

        if(processType == 0){
            advInfo.SetAdvanceInfo(eAdvanceInfo.ConditionPoint, oldPoint + value);
        }else{
            if(value > oldPoint){
                advInfo.SetAdvanceInfo(eAdvanceInfo.ConditionPoint, value);
            }
        }

        //
        if(oldPoint < advanceTemplate['condPara'] && advInfo.GetAdvanceInfo(eAdvanceInfo.ConditionPoint) >= advanceTemplate['condPara']){
            reached.push(attID);
        }

        processed.push(parseInt(attID));
    }

    for(var i = 0; i < reached.length; ++i){
        this.refreshAdvance(reached[i]);
    }

    if(processed.length > 0){
        this.SendAdvanceChange(processed, 1);
    }

};

// 清理活动信息
handler.ClearAdvanceState = function(advanceType){
    var runningAdvance = advanceController.getRunningAdvanceByType(advanceType);

    var nowDate = new Date();
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    for(var attID in runningAdvance) {
        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            continue;
        }

        var advInfo = this.advanceList[attID];
        if (advInfo == null || nowDate >= advInfo.GetAdvanceInfo(eAdvanceInfo.EndTime)) {
            advInfo = new advance();
            advInfo.SetAdvanceInfo(eAdvanceInfo.RoleID, roleID);
            advInfo.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
            advInfo.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplate['endTime'])));
            this.advanceList[attID] = advInfo;
        }
        advInfo.SetAdvanceInfo(eAdvanceInfo.AdvancePoint, 0);
        advInfo.SetAdvanceInfo(eAdvanceInfo.ReachStep, 0);
        if(advanceTemplate['dailyClear'] > 0){
            advInfo.SetAdvanceInfo(eAdvanceInfo.RewardStep, 0);
        }
    }
};

// 更新活动进度 processType 0:add 1 : update
handler.ProcessAdvance = function(advanceType, value, processType){
    //logger.error('advanceType is %j,value is %j, processType is %j', advanceType, value, processType);
    var runningAdvance = advanceController.getRunningAdvanceByType(advanceType);

    var nowDate = new Date();
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var processed = [];
    var oldPoint = 0;
    for(var attID in runningAdvance){
        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            continue;
        }

        var advInfo = this.advanceList[attID];
        if(advInfo == null || nowDate >= advInfo.GetAdvanceInfo(eAdvanceInfo.EndTime)) {
            advInfo = new advance();
            advInfo.SetAdvanceInfo(eAdvanceInfo.RoleID, roleID);
            advInfo.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
            advInfo.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplate['endTime'])));
            this.advanceList[attID] = advInfo;
        }

        // 没有达到条件的，不处理
        oldPoint = advInfo.GetAdvanceInfo(eAdvanceInfo.AdvancePoint);
        if(advInfo.GetAdvanceInfo(eAdvanceInfo.ConditionPoint) >= advanceTemplate['condPara']){
            if(processType == 0){
                advInfo.SetAdvanceInfo(eAdvanceInfo.AdvancePoint, oldPoint + value);
            }else{
                advInfo.SetAdvanceInfo(eAdvanceInfo.AdvancePoint, value);
            }

        }
        processed.push(parseInt(attID));
    }
    //特殊处理 累计充值满足的天数奖励 Advance_PayDay（满足条件天数加一）
    if(advanceType == gameConst.eAdvanceType.Advance_PayOneMoney){
        var runningAdvancePayDay = advanceController.getRunningAdvanceByType(gameConst.eAdvanceType.Advance_PayDay);
        var nowDate = new Date();
        for(var attID in runningAdvancePayDay) {
            var advanceTemplatePayDay = templateManager.GetTemplateByID('AdvanceTemplate', attID);
            if (null == advanceTemplatePayDay) {
                continue;
            }
            var condPara = advanceTemplatePayDay['condPara'];
            var advInfoPayDay = this.advanceList[attID];
            if(advInfoPayDay == null || nowDate >= advInfoPayDay.GetAdvanceInfo(eAdvanceInfo.EndTime)) {
                advInfoPayDay = new advance();
                advInfoPayDay.SetAdvanceInfo(eAdvanceInfo.RoleID, roleID);
                advInfoPayDay.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
                advInfoPayDay.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplatePayDay['endTime'])));
                this.advanceList[attID] = advInfoPayDay;
            }

            oldPoint = advInfoPayDay.GetAdvanceInfo(eAdvanceInfo.ConditionPoint);
            //logger.fatal("##############Advance_PayOneMoney: oldPoint: %j, condPara: %j", oldPoint, condPara);
            if(0 == value && 1 == processType){
                advInfoPayDay.SetAdvanceInfo(eAdvanceInfo.ConditionPoint, value);
            }else{
                //PS：每天满足条件只加一次
                if(oldPoint >= condPara){
                    continue;
                }
                advInfoPayDay.SetAdvanceInfo(eAdvanceInfo.ConditionPoint, oldPoint + value);
                //如果当天累计金额已经符合要求  则累计天数增加一
                if (advInfoPayDay != null && (oldPoint + value)>=condPara && nowDate < new Date(advInfoPayDay.GetAdvanceInfo(eAdvanceInfo.EndTime))) {
                    var oldPointPayDay = advInfoPayDay.GetAdvanceInfo(eAdvanceInfo.AdvancePoint);
                    advInfoPayDay.SetAdvanceInfo(eAdvanceInfo.AdvancePoint, oldPointPayDay + 1);
                }
                //logger.fatal("##############Advance_PayOneMoney: advInfoPayDay: %j,", advInfoPayDay);
                processed.push(parseInt(attID));
            }
        }
    }
    //同步累计充值满足的天数   结束

    if(processed.length > 0){
        this.SendAdvanceChange(processed, 1);
    }
};

// 创建一个空的活动
handler.createEmptyAdvance = function(advanceType){
    var runningAdvance = advanceController.getRunningAdvanceByType(advanceType);
    var processed = [];
    for(var attID in runningAdvance) {
        var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
        if (null == advanceTemplate) {
            continue;
        }

        var nowTime = new Date();
        if(this.advanceList[attID] != null){
            var advInfo = this.advanceList[attID];
            var advDate = new Date(advInfo.GetAdvanceInfo(eAdvanceInfo.EndTime));
            if(nowTime > advDate){
                delete this.advanceList[attID];
            }else{
                continue;
            }
        }

        var advanceInfo = new advance();
        advanceInfo.SetAdvanceInfo(eAdvanceInfo.RoleID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        advanceInfo.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
        advanceInfo.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplate['endTime'])));
        this.advanceList[attID] = advInfo;

        processed.push(attID);

    }

    if(processed.length > 0){
        this.SendAdvanceChange(processed, 1);
    }
};

// 特殊处理掉登陆问题
handler.ProcessLoginAdvance = function () {
    var self = this;
    var processLogin = function(advanceType){
        var runningAdvance = advanceController.getRunningAdvanceByType(advanceType);

        var nowDate = new Date();
        var roleID = self.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
        var processed = [];
        for(var attID in runningAdvance){
            var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
            if (null == advanceTemplate) {
                continue;
            }

            var advInfo = self.advanceList[attID];
            var created = false;
            if(advInfo == null || nowDate >= advInfo.GetAdvanceInfo(eAdvanceInfo.EndTime)) {
                advInfo = new advance();
                advInfo.SetAdvanceInfo(eAdvanceInfo.RoleID, roleID);
                advInfo.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
                advInfo.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplate['endTime'])));
                self.advanceList[attID] = advInfo;
                created = true;
            }else{
                continue;
            }

            // 没有达到条件的，不处理
            if(advInfo.GetAdvanceInfo(eAdvanceInfo.ConditionPoint) < advanceTemplate['condPara']){
                if(created){
                    processed.push(parseInt(attID));
                }
                continue;
            }

            advInfo.SetAdvanceInfo(eAdvanceInfo.AdvancePoint, 1);
            processed.push(parseInt(attID));
        }

        if(processed.length > 0){
            self.SendAdvanceChange(processed, 1);
        }
    };

    processLogin(gameConst.eAdvanceType.Advance_AllLogin);
    processLogin(gameConst.eAdvanceType.Advance_RunningLogin);
};

handler.refreshAdvance = function(attID){
    var advInfo = this.advanceList[attID];
    if(advInfo == null){
        return;
    }

    var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
    if (null == advanceTemplate) {
        return;
    }

    // 没有达到条件的，不处理
    if(advInfo.GetAdvanceInfo(eAdvanceInfo.ConditionPoint) < advanceTemplate['condPara']){
        return;
    }

    var advanceType = advanceTemplate['activeType'];
    var advancePoint = 0;
    switch (advanceType){
        case gameConst.eAdvanceType.Advance_AllLogin:
        case gameConst.eAdvanceType.Advance_RunningLogin:
            advancePoint = 1;
            break;
        case gameConst.eAdvanceType.Advance_PlayerLevel:
            advancePoint = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
            break;
        case gameConst.eAdvanceType.Advance_SigPower:
            var thisDay = new Date();
            var advanceDay = new Date(advanceTemplate['beginTime']);
            if(thisDay - advanceDay == 0){
                break;
            }
            advancePoint = this.owner.GetRoleChartManager().GetZhanliRanking();
            break;
        case gameConst.eAdvanceType.Advance_VIPLevel:
            advancePoint = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
            break;
        case gameConst.eAdvanceType.Advance_PayDay:
            break;
        case gameConst.eAdvanceType.Advance_PayOneMoney:
            break;
        case gameConst.eAdvanceType.Advance_PayMoreMoney:
            break;
        default :
            logger.error('cant find the advance type %j', advanceType);
            break;
    }

    if(advancePoint > 0){
        advInfo.SetAdvanceInfo(eAdvanceInfo.AdvancePoint, advancePoint);
    }
};

// 开始活动
handler.StartAdvance = function(attID){
    var self = this;
    if(this.advanceList[attID] != null){
        this.EndAdvance(attID);
    }

    var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
    if (null == advanceTemplate) {
        return;
    }

    var processed = [];

    var advInfo = new advance();
    advInfo.SetAdvanceInfo(eAdvanceInfo.RoleID, self.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
    advInfo.SetAdvanceInfo(eAdvanceInfo.TempID, attID);
    advInfo.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(advanceTemplate['endTime'])));
    self.advanceList[attID] = advInfo;

    self.refreshAdvance(attID);

    processed.push(parseInt(attID));
    self.SendAdvanceChange(processed, 1);
};

// 结束活动
handler.EndAdvance = function(attID){
    if(this.advanceList[attID] != null){
        delete this.advanceList[attID];
        this.SendAdvanceChange([parseInt(attID)], 0);
    }
};


// 发送某个活动变化通知 type 0: 结束， 1：更新
handler.SendAdvanceChange = function(attIDArray, changeType){
    var route = 'SendAdvanceChange';
    var retMsg = {
        changeType : changeType,
        attIDArray : attIDArray
    };

    retMsg.advanceArray = [];

    if(changeType == 1){
        for(var i = 0; i < attIDArray.length; ++i){
            if(this.advanceList[attIDArray[i]] != null){
                retMsg.advanceArray.push(this.advanceList[attIDArray[i]].toMessage());
            }
        }
    }

    this.owner.SendMessage(route, retMsg);
};


// 发送消息给玩家
handler.SendAdvanceMsg = function (tempID) {
    if (null == this.owner) {
        logger.error('SendAdvanceMsg');
        return;
    }
    var route = 'SendAdvanceInfo';
    var retMsg = {
        List: []
    };
    if (null == tempID) {
        for (var index in this.advanceList) {
            retMsg.List.push(this.advanceList[index].toMessage());
        }
    }
    else {
        if (null == this.advanceList[tempID]) {
            return;
        }
        else {
            retMsg.List.push(this.advanceList[tempID].toMessage());
        }
    }
    this.owner.SendMessage(route, retMsg);
};

// 发送消息给玩家 step  1~max
handler.OnGetAward = function (attID, step) {
    var retMsg = {
        result : errorCodes.OK
    };

    if (null == this.owner){
        retMsg.result =errorCodes.NoRole;
        return retMsg;
    }

    var advanceInfo = this.advanceList[attID];
    if(advanceInfo == null){
        retMsg.result =errorCodes.Advance_no_open;
        return retMsg;
    }

    var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
    if (null == advanceTemplate) {
        retMsg.result =errorCodes.NoTemplate;
        return retMsg;
    }

    if(step <= 0 || step > advanceTemplate['awardMax']){
        retMsg.result =errorCodes.ParameterWrong;
        return retMsg;
    }

    // 这里递减一次，下面都用step的下表含义
    --step;

    if(advanceInfo.GetAdvanceInfo(eAdvanceInfo.AdvancePoint) < advanceTemplate['awardLevelStart_' + step]
        || advanceInfo.GetAdvanceInfo(eAdvanceInfo.AdvancePoint) > advanceTemplate['awardLevelEnd_' + step]) {
        retMsg.result =errorCodes.Advance_no_reach;
        return retMsg;
    }

    var oldStep = advanceInfo.GetAdvanceInfo(eAdvanceInfo.RewardStep);

    var hasReward = (oldStep & (1 << step));
    if(hasReward){
        retMsg.result =errorCodes.Advance_has_got;
        return retMsg;
    }

    retMsg.rewardItem = [];

    for(var i = 0; i < 4; ++i){
        var itemID = advanceTemplate['awardID_' + step + '_' + i];
        var itemNum = advanceTemplate['awardNum_' + step + '_' + i];
        this.owner.AddItem(itemID, itemNum, eAssetsAdd.Advance, 0);//添加物品方法
        retMsg.rewardItem.push({'id': itemID, 'num': itemNum});
    }

    advanceInfo.SetAdvanceInfo(eAdvanceInfo.RewardStep, (oldStep | (1 << step)));

    retMsg.advanceInfo = advanceInfo.toMessage();

    return retMsg;
};


// 领取原来所有已完成活动奖励
handler.OnGetAwardAll = function (attID) {
    var retMsg = {
        result : errorCodes.OK
    };
    logger.fatal("***** OnGetAwardAll begin attID : %j" , attID);
    if (null == this.owner){
        retMsg.result =errorCodes.NoRole;
        return retMsg;
    }

    var advanceInfo = this.advanceList[attID];
    if(advanceInfo == null){
        retMsg.result =errorCodes.Advance_no_open;
        return retMsg;
    }

    var advanceTemplate = templateManager.GetTemplateByID('AdvanceTemplate', attID);
    if (null == advanceTemplate) {
        retMsg.result =errorCodes.NoTemplate;
        return retMsg;
    }

    var step = advanceTemplate['awardMax'];


    retMsg.rewardItem = [];
    retMsg.advanceInfoList = [];
    for(var j=0; j<step; j++){
        var oldStep = advanceInfo.GetAdvanceInfo(eAdvanceInfo.RewardStep);
        var hasReward = (oldStep & (1 << j));// &位运算 二进制中 只有两位同时为1才为1 其余为0  ，下标为任务id 利用二进制检查哪些任务已领取
        if(hasReward){
            continue;
        }
        if(advanceInfo.GetAdvanceInfo(eAdvanceInfo.AdvancePoint) < advanceTemplate['awardLevelStart_' + j]
            || advanceInfo.GetAdvanceInfo(eAdvanceInfo.AdvancePoint) > advanceTemplate['awardLevelEnd_' + j]) {
            continue;
        }
        for(var i = 0; i < 4; ++i){
            var itemID = advanceTemplate['awardID_' + j + '_' + i];
            var itemNum = advanceTemplate['awardNum_' + j + '_' + i];
            if(itemID && itemNum){
                this.owner.AddItem(itemID, itemNum, eAssetsAdd.Advance, 0);//添加物品方法
                retMsg.rewardItem.push({'id': itemID, 'num': itemNum});
            }
        }

        advanceInfo.SetAdvanceInfo(eAdvanceInfo.RewardStep, (oldStep | (1 << j)));
        retMsg.advanceInfoList.push(advanceInfo.toMessage());
    }
    logger.fatal("***** OnGetAwardAll is over %j" , retMsg);
    //retMsg.advanceInfo = advanceInfo.toMessage();

    return retMsg;
};

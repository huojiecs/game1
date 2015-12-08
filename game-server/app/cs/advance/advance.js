/**
 * Created by bj on 2015/5/19.
 */
var gameConst = require('../../tools/constValue');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utilSql = require('../../tools/mysql/utilSql');
var eAdvanceInfo = gameConst.eAdvanceInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.advanceInfo = new Array(eAdvanceInfo.Max);
    for (var i = 0; i < eAdvanceInfo.Max; ++i) {
        this.advanceInfo[i] = 0;
    }

    this.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(0)));
};

var handler = Handler.prototype;

handler.GetAdvanceInfo = function (Index) {
    if(Index >= 0 && Index < eAdvanceInfo.Max){
        return this.advanceInfo[Index];
    }
    logger.error('GetAdvanceInfo index not match %j', Index);

    return null;
};

handler.SetAllAdvanceInfo = function (info) {
    this.advanceInfo = info;
    this.SetAdvanceInfo(eAdvanceInfo.EndTime, utilSql.DateToString(new Date(this.GetAdvanceInfo(eAdvanceInfo.EndTime))));
};

handler.SetAdvanceInfo = function (Index, Value) {
    if(Index >= 0 && Index < eAdvanceInfo.Max ){
        this.advanceInfo[Index] = Value;
    }
    else{
        logger.error('SetAdvanceInfo index not match %j', Index);
    }
};

// 发送给前端消息
handler.toMessage = function(){
    var retMsg = {};

    retMsg.attID = parseInt(this.GetAdvanceInfo(eAdvanceInfo.TempID));
    retMsg.reachStep = this.GetAdvanceInfo(eAdvanceInfo.ReachStep);
    retMsg.rewardStep = this.GetAdvanceInfo(eAdvanceInfo.RewardStep);
    retMsg.advancePoint = this.GetAdvanceInfo(eAdvanceInfo.AdvancePoint);
    retMsg.conditionPoint = this.GetAdvanceInfo(eAdvanceInfo.ConditionPoint);

    return retMsg;
};

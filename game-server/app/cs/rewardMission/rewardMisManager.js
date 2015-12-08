/**
 * Created by Administrator on 14-6-16.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var templateManager = require('../../tools/templateManager');
var ePlayerInfo = gameConst.ePlayerInfo;
var eRewardMisState = gameConst.eRewardMisState;
var eRewardMisType = gameConst.eRewardMisType;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.dataList = {};
    this.misState = [];
};
var handler = Handler.prototype;

handler.LoadDataByDB = function (data) {
    this.misState = JSON.parse(data);
    if (this.misState.length == 0) {
        this.misState = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }
    for (var index = 0; index < this.misState.length ; ++index) {
        if (eRewardMisState.open != this.misState[index]) {
            continue;
        }
        var attID = 1000 + index + 1;
        var rewardTemplate = templateManager.GetTemplateByID('RewardTemplate', attID);
        if (rewardTemplate != null) {
            this.dataList[attID] = rewardTemplate;
        }
    }
};

handler.GetSqlStr = function () {
    var sqlString = '(' + this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) + ',\'' + JSON.stringify(this.misState) + '\')';
    return sqlString;
};

handler.SendMissionMsg = function () {
    var route = 'ServerUpdateRewardMisState';
    var msg = {
        misState: this.misState
    };
    this.owner.SendMessage(route, msg);
};

handler.Update12Info = function () {
    for (var index = 0; index < this.misState.length ; ++index) {
        if (eRewardMisState.close == this.misState[index]) {
            this.misState[index] = eRewardMisState.open;
            var attID = 1000 + index + 1;
            var rewardTemplate = templateManager.GetTemplateByID('RewardTemplate', attID);
            if (rewardTemplate != null) {
                this.dataList[attID] = rewardTemplate;
            }
            break;
        }
    }
    logger.warn("rewardMisManager on update12info, roleID ==%d",
                this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID));
    this.IsFinishMission(eRewardMisType.ZhanLi, 0, this.owner.GetPlayerInfo(ePlayerInfo.ZHANLI));
    this.SendMissionMsg();
};

handler.IsFinishMission = function (misType, npcID, misNum) {
    for (var i in this.dataList) {
        var temp = this.dataList[i];
        if (temp['misType'] == misType) {
            if (temp['needID'] > 0 && temp['needID'] == npcID) {
                this.misState[temp['dayNum'] - 1] = eRewardMisState.finish;
                delete this.dataList[i];
                this.SendMissionMsg();
            }
            else if (temp['needID'] == 0 && misNum >= temp['overNum']){
                this.misState[temp['dayNum'] - 1] = eRewardMisState.finish;
                delete this.dataList[i];
                this.SendMissionMsg();
            }
        }
    }
};

handler.GetRewardPrize = function (misID) {
    var rewardTemplate = templateManager.GetTemplateByID('RewardTemplate', misID);
    if (rewardTemplate != null && this.misState[rewardTemplate['dayNum'] - 1] == eRewardMisState.finish) {
        this.misState[rewardTemplate['dayNum'] - 1] = eRewardMisState.receive
        var prizeID = rewardTemplate['rewardID'];
        var prizeNum = rewardTemplate['rewardNum'];
        if (prizeID > 0 && prizeNum > 0) {
            this.owner.AddItem(prizeID, prizeNum, eAssetsAdd.RewardGift, 0);
        }
        this.SendMissionMsg();
        return errorCodes.OK;
    }
    return errorCodes.SystemWrong;
};


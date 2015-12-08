/**
 * Created by eder on 2015/1/23.
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
var playerManager = require('../../../app/cs/player/playerManager');
var defaultValues = require('../../tools/defaultValues');
var ePlayerInfo = gameConst.ePlayerInfo;
var tNotice = templateConst.tNotice;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsChangeReason = gameConst.eAssetsChangeReason;
var _ = require('underscore');
var Q = require('q');
var fs = require('fs');
var eMisType = gameConst.eMisType;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.rechargeStatus = gameConst.eZhuanPanStatus.zhuanPanStatusClose;//0:当天充值任务完成 1:当天充值任务未完成
    this.attID = 0;
    this.zhuanPanRewardList = [];
};

var handler = Handler.prototype;

handler.LoadDataByDB = function () {

};


handler.SyncInitData = function () {
    var self = this;

    if (!self.owner) {
        return;
    }

    var roleID = self.owner.playerInfo[ePlayerInfo.ROLEID];

    // 暂时没想到好办法。 InitGame 调用到这里时， chat服务器还没有添加此角色。
    // 最好的解决办法是有个PostInitGame 调用。
    setTimeout(function () {
        pomelo.app.rpc.chat.chatRemote.SyncRewardList(null, roleID, utils.done);
    }, 5000);

};


handler.UpdateZhuanPanRechargeStatus12Info = function () {
    var self = this;
    self.SetRechargeStatus(gameConst.eZhuanPanStatus.zhuanPanStatusClose);//更新没有充值状态
};


handler.SetRechargeStatus = function (status) {
    if (status >= gameConst.eZhuanPanStatus.zhuanPanStatusOpen || status
        <= gameConst.eZhuanPanStatus.zhuanPanStatusClose) {
        this.rechargeStatus = status;
    }
    else {
        this.rechargeStatus = gameConst.eZhuanPanStatus.zhuanPanStatusClose;
    }
    this.SendOpenStatus(this.rechargeStatus);
};


handler.SendOpenStatus = function (status) {
    var self = this;
    var route = "ServerZhuanPanStatus";
    var msg = {
        result: 0,
        status: status
    };

    if (self.rechargeStatus < gameConst.eZhuanPanStatus.zhuanPanStatusOpen || self.rechargeStatus
        > gameConst.eZhuanPanStatus.zhuanPanStatusClose) {
        msg.status = errorCodes.SystemWrong;
    }

    self.owner.SendMessage(route, msg);
};


handler.GetLuckNum = function (msg, callback) {
    var self = this;
    var resultData = {
        'result': errorCodes.OK,
        'luckNum': 0
    };

    // 是否转盘和任务无关。 -- liushengxin，lixiaodong
//    if (self.rechargeStatus != gameConst.eZhuanPanStatus.zhuanPanStatusOpen) {
//        resultData.result = errorCodes.ZHUANPAN_NO_OPEN;
//        return callback(null, resultData);
//    }


    var tmpRateList = [];
    var totalRate = 0;
    for (var id = 1; id <= 12; id++) {
        var zpTemplate = templateManager.GetTemplateByID("ZhuanPanTemplate", id);
        if (!zpTemplate) {
            resultData.result = errorCodes.NoTemplate;
            return callback(null, resultData);
        }
        totalRate += zpTemplate.rate;
        tmpRateList.push({
                             attID: zpTemplate.attID,
                             rate: zpTemplate.rate
                         });
    }

    if (!totalRate) {
        resultData.result = errorCodes.NoTemplate;
        return callback(null, resultData);
    }

    var random = Math.ceil(Math.random() * totalRate);
    var rate = 0;
    var rewardID = 0;
    for (var index in tmpRateList) {
        var temp = tmpRateList[index];
        if (random <= temp.rate + rate) {
            rewardID = temp.attID;
            break;
        }
        rate += temp.rate;
    }

    if (!rewardID) {
        resultData.result = errorCodes.NoTemplate;
        return callback(null, resultData);
    }

    var template = templateManager.GetTemplateByID("ZhuanPanTemplate", rewardID);
    if (!template) {
        resultData.result = errorCodes.NoTemplate;
        return callback(null, resultData);
    }

    var assetsManager = this.owner.GetAssetsManager();
    if (!assetsManager) {
        resultData.result = errorCodes.ParameterWrong;
        return callback(null, resultData);
    }
    if (assetsManager.CanConsumeAssets(template[templateConst.tZhuanPan.assetsID],
                                       template[templateConst.tZhuanPan.assetsNum]) == false) {
        resultData.result = errorCodes.NoAssets;
        return callback(null, resultData);
    }

    self.attID = rewardID;
    assetsManager.AlterAssetsValue(template[templateConst.tZhuanPan.assetsID],
                                   -template[templateConst.tZhuanPan.assetsNum], eAssetsChangeReason.Reduce.LuckSign);
    resultData.luckNum = template[templateConst.tZhuanPan.yuanBaoNum];

    return callback(null, resultData);
};


handler.PostGetLuckNum = function (callback) {
    var self = this;

    var resultData = {
        'result': errorCodes.OK
    };

    if (!self.owner) {
        resultData.result = errorCodes.ParameterWrong;
        return callback(null, resultData);
    }

    if (!self.attID) {
        resultData.result = errorCodes.ParameterWrong;
        return callback(null, resultData);
    }

    var template = templateManager.GetTemplateByID("ZhuanPanTemplate", self.attID);
    if (!template) {
        resultData.result = errorCodes.NoTemplate;
        return callback(null, resultData);
    }

    var rewardID = self.attID;
    self.attID = 0;
    var yuanBaoNum = template[templateConst.tZhuanPan.yuanBaoNum];
    self.owner.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), yuanBaoNum, 1,
                                                   eAssetsReduce.zhuanPan);

    var roleName = self.owner.playerInfo[ePlayerInfo.NAME];
    var rewardInfo = {roleName: roleName, yuanBaoNum: yuanBaoNum };

    pomelo.app.rpc.chat.chatRemote.PushRewards(null, rewardInfo, utils.done);

    self.SendZhuanPanGongGao(rewardID);

    resultData.result = errorCodes.OK;

    return callback(null, resultData);
};


handler.SendZhuanPanGongGao = function (id) {
    var self = this;

    var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', 'zhuanpan_' + id);
    if (!NoticeTemplate) {
        return;
    }

    var roleName = self.owner.playerInfo[ePlayerInfo.NAME];
    var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
    var endStr = NoticeTemplate[tNotice.noticeEndStr];
    var content = beginStr + ' ' + roleName + ' ' + endStr;
    pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.ZhuanPan, 0, content, utils.done);
};

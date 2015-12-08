var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var errorCodes = require('../../tools/errorCodes');

var tCustom = templateConst.tCustom;
var tVipTemp = templateConst.tVipTemp;
var ePlayerInfo = gameConst.ePlayerInfo;
var eLevelTarget = gameConst.eLevelTarget;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eExpChange = gameConst.eExpChangeReason;
var eCustomSmallType = gameConst.eCustomSmallType;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.roomFlop = {
        isWin_Flop: false,
        isNotWin_Flop: false,
        customID_Flop: 0,
        levelTarget: 0
    };
    this.feeNum = 0;
    this.isFree = false;
};

var handler = Handler.prototype;

handler.UpdateCustomInfo = function (roomFlop) {
    if (roomFlop) {
        this.roomFlop = roomFlop;
        this.feeNum = 0;
        this.isFree = false;
    }
};

handler.UseFlop = function ( customID, nType, flopType) { //nType 0:免费 1:付费
    var player = this.owner;
    var CustomTemplate = null;
    var flopTemplate = null;
    var vipTemplate = null;
    var msg = {
        id: 0,
        num: 0,
        nType: nType
    };
    if (true == flopType && (customID != this.roomFlop.customID_Flop || true != this.roomFlop.isWin_Flop)) {
        return errorCodes.Cs_RoomNoWinFlop;
    }
    /****扫荡不需要******/
    var tempFreeNum = this.feeNum;
    var tempIsFree = this.isFree;
    if (false == flopType) {
        this.feeNum = 0;
        this.isFree = false;
    }
    CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return errorCodes.SystemWrong;
    }
    if (CustomTemplate[tCustom.FlopID] <= 0) {
        return errorCodes.Cs_RoomNotFlop;
    }
    flopTemplate = templateManager.GetTemplateByID('FlopTemplate', CustomTemplate[tCustom.FlopID]);
    if (null == flopTemplate) {
        return errorCodes.SystemWrong;
    }

    if(CustomTemplate['smallType'] == eCustomSmallType.StoryDrak){
        //return this.StoryDrakFlop();
    }
    if (nType == 0) { //免费
        if (this.isFree == true) {
            return errorCodes.Cs_RoomNotFlopNum;
        }
        var customType = CustomTemplate[templateConst.tCustom.smallType];
        var factor = eAssetsAdd.CustomTurnOver;
        if (customType == gameConst.eCustomSmallType.Activity) {
            factor = eAssetsAdd.ActivityCustomTurnOver;
        } else if (customType == gameConst.eCustomSmallType.Hell) {
            factor = eAssetsAdd.HellCustomTurnOver;
        }
        if (this.roomFlop.isNotWin_Flop == true) {//第一次免费抽
            player.AddItem(flopTemplate['firstWinID'], flopTemplate['firstWinNum'], factor, eExpChange.Flop);
            msg.id = flopTemplate['firstWinID'];
            msg.num = flopTemplate['firstWinNum'];
        }
        else {
            var freeRandom = 0;
            var freeNum = flopTemplate['freeNum'];
            for (var i = 0; i < freeNum; ++i) {
                freeRandom += flopTemplate['freeRandom_' + i];
            }
            var resultRandom = Math.floor(Math.random() * freeRandom);
            var sum = flopTemplate['freeRandom_0'];
            var prize = freeNum - 1;
            for (var i = 0; i < freeNum - 1; ++i) {
                if (resultRandom < sum) {
                    prize = i;
                    break;
                }
                else {
                    sum += flopTemplate['freeRandom_' + ( i + 1 )];
                }
            }
            player.AddItem(flopTemplate['freeID_' + prize], flopTemplate['freeNum_' + prize], factor, eExpChange.Flop);
            msg.id = flopTemplate['freeID_' + prize];
            msg.num = flopTemplate['freeNum_' + prize];
        }
        /***扫荡不需要改变下列参数***/
        if (true == flopType) {
            this.roomFlop.isNotWin_Flop = false;
            this.isFree = true;  //已领取标记
        }
        if (false == flopType) {
            this.isFree = tempIsFree;
        }
        return msg;
    }
    else {//收费
        var vipLV = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        if (vipLV == null || vipLV == 0) {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
        }
        else {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLV + 1);
        }
        if (vipTemplate == null) {
            return errorCodes.SystemWrong;
        }
        if (eLevelTarget.Hell == this.roomFlop.levelTarget) {
            if (vipTemplate[tVipTemp.flopNum_1] <= this.feeNum) {
                return errorCodes.Cs_RoomNotFlopNum;
            }
        }
        else if (eLevelTarget.Activity == this.roomFlop.levelTarget || eLevelTarget.FaBao == this.roomFlop.levelTarget) {
            if (vipTemplate[tVipTemp.flopNum_2] <= this.feeNum) {
                return errorCodes.Cs_RoomNotFlopNum;
            }
        }
//        if (eLevelTarget.Train == this.roomFlop.levelTarget) {
//            if (1 <= this.feeNum) {
//                return errorCodes.Cs_RoomNotFlopNum;
//            }
//        }
        else {
            if (vipTemplate[tVipTemp.flopNum] <= this.feeNum) {
                return errorCodes.Cs_RoomNotFlopNum;
            }
        }
        // for tlog
        var customType = CustomTemplate[templateConst.tCustom.smallType];
        var reducefactor = eAssetsReduce.CustomTurnOver;
        var addfactor = eAssetsAdd.CustomTurnOver;
        if (customType == gameConst.eCustomSmallType.Activity) {
            reducefactor = eAssetsReduce.ActivityCustomTurnOver;
            addfactor = eAssetsAdd.ActivityCustomTurnOver;
        } else if (customType == gameConst.eCustomSmallType.Hell) {
            reducefactor = eAssetsReduce.HellCustomTurnOver;
            addfactor = eAssetsAdd.HellCustomTurnOver;
        }
        /***扫荡不需要改变下列参数***/
        if (true == flopType) {
            if (flopTemplate['payMoney'] > 0) {
                if (player.GetAssetsManager().CanConsumeAssets(flopTemplate['assetsID'], flopTemplate['payMoney'])
                    == false) {
                    if (flopTemplate['assetsID'] == globalFunction.YuanBaoID) {
                        return errorCodes.NoYuanBao;
                    }
                    return errorCodes.NoAssets;
                }
                player.GetAssetsManager().AlterAssetsValue(flopTemplate['assetsID'], -flopTemplate['payMoney'],
                                                           reducefactor);
            }
        }
        var feeRandom = 0;
        var feeNum = flopTemplate['feeNum'];
        for (var i = 0; i < feeNum; ++i) {
            feeRandom += flopTemplate['feeRandom_' + i];
        }
        var resultRandom = Math.floor(Math.random() * feeRandom);
        var sum = flopTemplate['feeRandom_0'];
        var prize = feeNum - 1;
        for (var i = 0; i < feeNum - 1; ++i) {
            if (resultRandom < sum) {
                prize = i;
                break;
            }
            else {
                sum += flopTemplate['feeRandom_' + ( i + 1 )];
            }
        }
        player.AddItem(flopTemplate['feeID_' + prize], flopTemplate['feeNum_' + prize], addfactor, eExpChange.Flop);
        msg.id = flopTemplate['feeID_' + prize];
        msg.num = flopTemplate['feeNum_' + prize];
        /***扫荡不需要改变下列参数***/
        if (flopType == true) {
            this.feeNum++;//领取次数标记
        }
        if (false == flopType) {
            this.feeNum = tempFreeNum;
        }
        return msg;
    }
};

handler.UseFlopForSweepReward = function ( customID, nType) { //TODO VIP 剧情关扫荡获得翻牌奖励
    var CustomTemplate = null;
    var flopTemplate = null;
    var vipTemplate = null;
    var msg = {
        id: 0,
        num: 0,
        nType: nType
    }

    CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return errorCodes.SystemWrong;
    }
    if (CustomTemplate[tCustom.FlopID] <= 0) {
        return errorCodes.Cs_RoomNotFlopNum;
    }
    flopTemplate = templateManager.GetTemplateByID('FlopTemplate', CustomTemplate[tCustom.FlopID]);
    if (null == flopTemplate) {
        return errorCodes.SystemWrong;
    }

    if (nType == 0) { //免费
        var freeRandom = 0;
        var freeNum = flopTemplate['freeNum'];
        for (var i = 0; i < freeNum; ++i) {
            freeRandom += flopTemplate['freeRandom_' + i];
        }
        var resultRandom = Math.floor(Math.random() * freeRandom);
        var sum = flopTemplate['freeRandom_0'];
        var prize = freeNum - 1;
        for (var i = 0; i < freeNum - 1; ++i) {
            if (resultRandom < sum) {
                prize = i;
                break;
            }
            else {
                sum += flopTemplate['freeRandom_' + ( i + 1 )];
            }
        }
        // player.AddItem(flopTemplate['freeID_'+prize], flopTemplate['freeNum_'+ prize], gameConst.eMoneyChangeType.GETCUSTOMPRIZE, 0);
        msg.id = flopTemplate['freeID_' + prize];
        msg.num = flopTemplate['freeNum_' + prize];

        this.roomFlop.isNotWin_Flop = false;
        this.isFree = true;  //已领取标记
        return msg;
    }
}
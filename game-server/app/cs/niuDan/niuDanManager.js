/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-17
 * Time: 下午3:38
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
var NiuDan = require('./niuDan');
var errorCodes = require('../../tools/errorCodes');
var Q = require('q');
var _ = require('underscore');
var eventValue = require('../../tools/eventValue');

var eNiuDanInfo = gameConst.eNiuDanInfo;
var tNotice = templateConst.tNotice;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_GetGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.niuDanList = {};
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (niuList) {
    if (!_.isEmpty(niuList)) {
        for (var index in niuList) {
            var niuDanID = niuList[index][eNiuDanInfo.NiuDanID];
            var niuTemplate = templateManager.GetTemplateByID('LotterDrawListTemplate', niuDanID);
            if (null != niuTemplate) {
                var temp = new NiuDan(niuTemplate);

                var freeNum = niuTemplate['freeNum'];

                var roleID = niuList[index][eNiuDanInfo.RoleID];
                var player = playerManager.GetPlayer(roleID);
                var niuDanQuan = player.GetAssetsManager().GetAssetsValue(niuTemplate['assets']);

                var niuDanFreeNum = niuList[index][eNiuDanInfo.FreeNum];
                var niuDanCountTime = niuList[index][eNiuDanInfo.CountTime];
                var freeTime = niuDanFreeNum - niuDanQuan;

                if (freeNum > 0 && freeTime == 0 && niuDanCountTime == 0) {
                    niuList[index][eNiuDanInfo.FreeNum] += freeNum;
                }

                temp.SetAllInfo(niuList[index]);
                this.niuDanList[niuDanID] = temp;
            }
        }

    }
};
//赠送一次免费的扭蛋次数
handler.UpdateNiuDan12Info = function () {
    for (var index in this.niuDanList) {
        var temp = this.niuDanList[index];
        var niuTemplate = temp.GetTemplate();
        var assets = niuTemplate['assets'];
        var niuDanQuanNum = this.owner.GetAssetsManager().GetAssetsValue(assets);
        temp.SetNiuInfo(eNiuDanInfo.FreeNum, niuTemplate['freeNum'] + niuDanQuanNum);
    }
    this.SendNiuDanList( null, null);
};

handler.GetSqlStr = function () {
    var niuInfo = '';
    for (var index in this.niuDanList) {
        var temp = this.niuDanList[index];
        niuInfo += '(';
        for (var i = 0; i < eNiuDanInfo.Max; ++i) {
            var value = temp.GetNiuInfo(i);
            if (typeof  value == 'string') {
                niuInfo += '\'' + value + '\'' + ',';
            }
            else {
                niuInfo += value + ',';
            }
        }
        niuInfo = niuInfo.substring(0, niuInfo.length - 1);
        niuInfo += '),';
    }
    niuInfo = niuInfo.substring(0, niuInfo.length - 1);
    var sqlString = utilSql.BuildSqlStringFromObjects(this.niuDanList, 'GetNiuInfo', eNiuDanInfo);
    if (sqlString !== niuInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, niuInfo);
    }
    return sqlString;
};

handler.SendNiuDanList = function ( value, itemID, type) {
    if (null == this.owner) {
        return;
    }
    var route = "ServerLoginNiuDanList";
    var niuDanList = {
        result: errorCodes.OK,
        LotteryDraw: []
    };
    var tempNiuDanList = [];
    var oldNiuDan = null;
    for (var index in this.niuDanList) {
        oldNiuDan = this.niuDanList[index];
    }

    var LotterDrawLists = templateManager.GetAllTemplate('LotterDrawListTemplate');
    if (null == LotterDrawLists) {
        return errorCodes.SystemWrong;
    }
    var niuDanID = 60000;
    for (var id in  LotterDrawLists) {
        var tempMsg = {
            attID: 0,
            //prizePool: [],
            otherPrizePool: [],
            star: 0,
            zuanshi1: 0,
            zuanshi5: 0,
            freeTimes: 0,
            niuDanQuan: 0,
            timeCd: 0

        };
        var nowTime = utils.getCurTime();
        niuDanID = id;
        niuTemplate = LotterDrawLists[niuDanID];
        if (null == niuTemplate) {
            return errorCodes.NoTemplate;
        }
        oldNiuDan = this.niuDanList[niuDanID];
        var niuDanQuan = niuTemplate['assets'];
        var niuDanTimeCd = niuTemplate['timeCd'];
        if (null == oldNiuDan) {
            oldNiuDan = new NiuDan(niuTemplate);
            oldNiuDan.SetNiuInfo(eNiuDanInfo.NiuDanID, niuDanID);
            oldNiuDan.SetNiuInfo(eNiuDanInfo.RoleID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
            oldNiuDan.SetNiuInfo(eNiuDanInfo.StarNum, 0);
            oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, niuTemplate['freeNum']);
            oldNiuDan.SetNiuInfo(eNiuDanInfo.CountTime, 0);


            if (niuDanQuan > 0 && null == value) {
                oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum)
                    + this.owner.GetAssetsManager().GetAssetsValue(niuTemplate['assets']));
            } else if (itemID > 0 && value > 0) {
                oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum) + value);
            }
            if (60002 == niuDanID) {
                oldNiuDan.SetNiuInfo(eNiuDanInfo.StarNum, 7);
            }
            this.niuDanList[niuDanID] = oldNiuDan;
        }
        else {
            /**免费次数*/
            if (niuTemplate['freeNum'] > 0) {
                var time = oldNiuDan.GetNiuInfo(eNiuDanInfo.CountTime);
                if (time > 0 && this.IsReach24(nowTime, time, niuDanTimeCd)) {
                    oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum,
                                         oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum) + niuTemplate['freeNum']);
                    oldNiuDan.SetNiuInfo(eNiuDanInfo.CountTime, 0);
                    tempMsg.timeCd = 0;
                } else {
                    tempMsg.timeCd = this.ShowCountTime(nowTime, time, niuDanTimeCd);
                }
            }

            if (itemID > 0 && value > 0) {
                if (niuTemplate['assets'] == itemID) {
                    oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum) + value);
                }
            }
            this.niuDanList[niuDanID] = oldNiuDan;
        }
        var niuTemplate = oldNiuDan.GetTemplate();
        tempMsg.attID = niuTemplate['attID'];
//        for (var i = 0; i < 3; ++i) {
//            var ID = niuTemplate['bigID_' + i];
//            var Num = niuTemplate['bigNum_' + i];
//            var temp = {
//                id: ID,
//                num: Num
//            }
//            tempMsg.prizePool.push(temp);
//        }
        var otherNum = niuTemplate['baoxiangNum'];
        for (var i = 0; i < otherNum; ++i) {
            var ID = niuTemplate['baoxiangID_' + i];
            var Num = 0;
            var temp = {
                id: ID,
                num: Num
            };
            tempMsg.otherPrizePool.push(temp);
        }
        tempMsg.niuDanQuan = this.owner.GetAssetsManager().GetAssetsValue(niuDanQuan);
        tempMsg.star = oldNiuDan.GetNiuInfo(eNiuDanInfo.StarNum);
        var freeTime = oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum) - tempMsg.niuDanQuan;
        tempMsg.freeTimes = freeTime < 0 ? 0 : freeTime;
        tempMsg.zuanshi1 = niuTemplate['openOne'];
        tempMsg.zuanshi5 = niuTemplate['openFive'];
        tempNiuDanList.push(tempMsg);
    }
    niuDanList.LotteryDraw = tempNiuDanList;
    if (1 == type) {
        return niuDanList;
    }
    this.owner.SendMessage(route, niuDanList);

};
//handler.GetNiuDanList = function (roleID) {
//    var player = playerManager.GetPlayer(roleID);
//    if(null == player ){
//        return;
//    }
//    var niuDanList= [];
//    var oldNiuDan = null;
//    for (var index in this.niuDanList) {
//        oldNiuDan = this.niuDanList[ index ];
//    }
//    for (var niuDanID = 1; niuDanID <= templateManager.GetIdArray('LotterDrawListTemplate').length; niuDanID++) {
//        var tempMsg = {
//            attID: 0,
//            prizePool: [],
//            otherPrizePool: [],
//            star: 0,
//            zuanshi1: 0,
//            zuanshi5: 0,
//            freeTimes: 0
//        };
//        niuTemplate = templateManager.GetTemplateByID('LotterDrawListTemplate', niuDanID);
//        if (null == niuTemplate) {
//            return 3;
//        }
//        oldNiuDan = this.niuDanList[ niuDanID ];
//        var niuDanQuan = niuTemplate['assets'];
//        if(null == oldNiuDan){
//            oldNiuDan = new NiuDan(niuTemplate);
//            oldNiuDan.SetNiuInfo(eNiuDanInfo.NiuDanID, niuDanID);
//            oldNiuDan.SetNiuInfo(eNiuDanInfo.RoleID, roleID);
//            oldNiuDan.SetNiuInfo(eNiuDanInfo.StarNum, 0);
//            oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, niuTemplate['freeNum']);
//            if(niuDanQuan > 0){
//                oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, niuTemplate['freeNum'] + player.GetAssetsManager().GetAssetsValue(niuTemplate['assets']));
//            }
//            this.niuDanList[ niuDanID ] = oldNiuDan;
//        }else{
//            if(niuDanQuan > 0){
//                oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum) + player.GetAssetsManager().GetAssetsValue(niuTemplate['assets']));
//            }
//            this.niuDanList[ niuDanID ] = oldNiuDan;
//        }
//        var niuTemplate = oldNiuDan.GetTemplate();
//        tempMsg.attID = niuTemplate['attID']
//        for (var i = 0; i < 3; ++i) {
//            var ID = niuTemplate['bigID_' + i];
//            var Num = niuTemplate['bigNum_' + i];
//            var temp = {
//                id: ID,
//                num: Num
//            }
//            tempMsg.prizePool.push(temp);
//        }
//        var otherNum = niuTemplate[ 'otherNum' ];
//        for (var i = 0; i < otherNum; ++i) {
//            var ID = niuTemplate['otherID_' + i];
//            var Num = niuTemplate['otherNum_' + i];
//            var temp = {
//                id: ID,
//                num: Num
//            }
//            tempMsg.otherPrizePool.push(temp);
//        }
//        tempMsg.star = oldNiuDan.GetNiuInfo(eNiuDanInfo.StarNum);
//        tempMsg.freeTimes = oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum);
//        tempMsg.zuanshi1 = niuTemplate[ 'openOne' ];
//        tempMsg.zuanshi5 = niuTemplate[ 'openFive' ];
//        niuDanList.push(tempMsg)
//    }
//
//    return niuDanList;
//};
/**
 *
 * @param player
 * @param niuDanID
 * @param nType 0:是1次免费或者一次消费元宝的２新手引导  1:是１０次消费元宝的
 * @returns {*}
 * @constructor
 */
handler.UseNiuDan = function ( niuDanID, nType, isFree) {
    var self = this;
    var player = self.owner;
    var oldNiuDan = self.niuDanList[niuDanID];
    var niuTemplate = null;
    var prizeNum = 1;
    var addStar = 1;
    if (nType == 1) {
        prizeNum = 10;
        addStar = 0;
    }
    if (niuDanID == 60001) {//第一个扭蛋没有十次必出
        addStar = 0;
    }

    var msg = {
        attID: 0,
        itemList: [],
        starNum: 0,
        freeNum: 0,
        niuDanQuan: 0,
        nType: nType,
        timeCd: 0
    };
    msg.attID = niuDanID;
    var nowTime = utils.getCurTime();
    if (null == oldNiuDan) {
        niuTemplate = templateManager.GetTemplateByID('LotterDrawListTemplate', niuDanID);
        if (null == niuTemplate) {
            return errorCodes.SystemWrong;
        }
        oldNiuDan = new NiuDan(niuTemplate);
        oldNiuDan.SetNiuInfo(eNiuDanInfo.NiuDanID, niuDanID);
        oldNiuDan.SetNiuInfo(eNiuDanInfo.RoleID, player.id);
        oldNiuDan.SetNiuInfo(eNiuDanInfo.StarNum, 0);
        var niuDanQuan = niuTemplate['assets'];
        if (niuDanQuan > 0) {
            oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, player.GetAssetsManager().GetAssetsValue(niuDanQuan));
        } else {
            oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, 0);
        }
        if (niuTemplate['freeNum'] > 0) {
            oldNiuDan.SetNiuInfo(eNiuDanInfo.timeCd, nowTime);
        } else {
            oldNiuDan.SetNiuInfo(eNiuDanInfo.timeCd, 0);
        }
        self.niuDanList[niuDanID] = oldNiuDan;
    }
    else {
        niuTemplate = oldNiuDan.GetTemplate();
    }
    if (player.GetPlayerInfo(ePlayerInfo.ExpLevel) < niuTemplate['level']) {
        return errorCodes.ExpLevel;
    }

    var yuanBao = niuTemplate['openFive'];
    var freeNum = oldNiuDan.GetNiuInfo(eNiuDanInfo.FreeNum);//免费次数
    var timeCd = 0;
    var niuDanTime = niuTemplate['timeCd'];
    if (nType == 0 || nType == 2) {

        if (freeNum > 0) {
            yuanBao = 0;
            var LotterDrawListTemplate = templateManager.GetTemplateByID('LotterDrawListTemplate', niuDanID);
            if (null == LotterDrawListTemplate) {
                return errorCodes.SystemWrong;
            }
            var assets = LotterDrawListTemplate['assets'];
            var niuDanQuanNum = player.GetAssetsManager().GetAssetsValue(assets);
            var topNum = freeNum - niuDanQuanNum;
            if (isFree == 1 && topNum > 0) {//使用免费次数
                oldNiuDan.SetNiuInfo(eNiuDanInfo.CountTime, nowTime);
            }
            freeNum -= 1;
            oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, freeNum);
            if (player.GetAssetsManager().CanConsumeAssets(niuTemplate['assets'], 1)) {
                if (topNum <= 0) {   //使用扭蛋券
                    player.GetAssetsManager().AlterAssetsValue(niuTemplate['assets'], -1, eAssetsReduce.NiuDanCost);
                }
            }
        }
        else {
            yuanBao = niuTemplate['openOne'];
        }
        /**使用非免费次数*/
        timeCd = oldNiuDan.GetNiuInfo(eNiuDanInfo.CountTime);
        if (isFree != 1 && self.IsReach24(nowTime, timeCd, niuDanTime)) {
            oldNiuDan.SetNiuInfo(eNiuDanInfo.FreeNum, freeNum + niuTemplate['freeNum']);
            oldNiuDan.SetNiuInfo(eNiuDanInfo.CountTime, 0);
            msg.timeCd = 0;
        } else {
            msg.timeCd = self.ShowCountTime(nowTime, timeCd, niuDanTime);
        }

    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_NiuDanGuid = log_GetGuid.GetUuid();
    var log_MoneyArgs = [log_GetGuid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                         gameConst.eMoneyChangeType.UseNiuDan,
                         log_NiuDanGuid, globalFunction.GetYuanBaoTemp(),
                         player.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp())];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (yuanBao > 0) {
        var yuanBaoID = globalFunction.GetYuanBaoTemp();
        if (player.GetAssetsManager().CanConsumeAssets(yuanBaoID, yuanBao) == false) {
            return errorCodes.NoYuanBao;
        }
        //player.GetAssetsManager().SetAssetsValue(yuanBaoID, -yuanBao);
        var costFactor = eAssetsReduce.NiuDanCost;
        if (niuTemplate['tlogType'] == 0) { // 魂
            costFactor = eAssetsReduce.UseSoulNiudan;
        } else if (niuTemplate['tlogType'] == 1) { // 橙装碎片
            costFactor = eAssetsReduce.UseEquipNiudan;
        }
        player.GetAssetsManager().AlterAssetsValue(yuanBaoID, -yuanBao, costFactor);

        self.notifyOperateByChartYuanBao(player, yuanBao);
    }

    var bigRandom = 0;
    var otherRandom = 0;
    var bigNum = niuTemplate['bigNum'];
    for (var i = 0; i < bigNum; ++i) {
        bigRandom += niuTemplate['bigRandom_' + i];
    }
    var otherNum = niuTemplate['otherNum'];
    for (var i = 0; i < otherNum; ++i) {
        otherRandom += niuTemplate['otherRandom_' + i];
    }
    var starNum = oldNiuDan.GetNiuInfo(eNiuDanInfo.StarNum);
    var maxStar = niuTemplate['stepNum'] * niuTemplate['starNum'];
    starNum += addStar;
    var isBig = true;
    var sumRandom = bigRandom + otherRandom;
    for (var j = 0; j < prizeNum; ++j) {
        if (nType == 2) {//新手引导
            var tempID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
            var AllTemplate = null;
            var AllTemplate_1 = null;
            AllTemplate = templateManager.GetTemplateByID('AllTemplate', 72);
            AllTemplate_1 = templateManager.GetTemplateByID('AllTemplate', 73);
            var ID = AllTemplate['attnum'];
            var Num = AllTemplate_1['attnum'];
            var temp = {
                id: ID,
                num: Num
            };
            msg.itemList.push(temp);
        }
        else {  //抽中宝箱
            var resultRandom = Math.floor(Math.random() * ( sumRandom ));
            if (prizeNum >= 10 && isBig && niuDanID != 60001) {
                resultRandom = Math.floor(Math.random() * bigRandom);
            }
            if (starNum == maxStar && isBig) {
                resultRandom = Math.floor(Math.random() * bigRandom);
                starNum = 0;
            }
            if (resultRandom > bigRandom) {
                var sum = niuTemplate['otherRandom_0'] + bigRandom;
                var prize = otherNum - 1;
                for (var i = 0; i < otherNum - 1; ++i) {
                    if (resultRandom < sum) {
                        prize = i;
                        break;
                    }
                    else {
                        sum += niuTemplate['otherRandom_' + ( i + 1 )];
                    }
                }
                var ID = niuTemplate['otherID_' + prize];
                var Num = niuTemplate['otherNum_' + prize];
                var temp = {
                    id: ID,
                    num: Num
                };
                msg.itemList.push(temp);
            }
            else {  //获得大奖了
                // starNum = 0;
                var sum = niuTemplate['bigRandom_0'];
                var prize = bigNum - 1;
                for (var i = 0; i < bigNum - 1; ++i) {
                    if (resultRandom < sum) {
                        prize = i;
                        break;
                    }
                    else {
                        sum += niuTemplate['bigRandom_' + ( i + 1 )];
                    }
                }
                var ID = niuTemplate['bigID_' + prize];
                var Num = niuTemplate['bigNum_' + prize];
                var temp = {
                    id: ID,
                    num: Num
                };
                msg.itemList.unshift(temp);
                isBig = false;

                //扭蛋获奖的公告
                var niuDanID1 = 'niuDan_' + (prize + 1);
                var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', niuDanID1);
                if (null != NoticeTemplate) {
                    var roleName = player.playerInfo[gameConst.ePlayerInfo.NAME];
                    var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
                    var endStr = NoticeTemplate[tNotice.noticeEndStr];
                    var content = beginStr + ' ' + roleName + ' ' + endStr;
                    pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.NiuDan, 0, content, utils.done);
                }
            }
        }
    }
    var itemIdList = []; // for tlog
    var itemNumList = []; // for tlog
    for (var index in msg.itemList) {
        var temp = msg.itemList[index];
        var itemTemplate = templateManager.GetTemplateByID('LotteryDrawTemplate', temp.id);
        if (null != itemTemplate) {
            //player.AddSPecial(itemTemplate['type'], itemTemplate['itemID'], temp.num, gameConst.eMoneyChangeType.UseNiuDan, log_NiuDanGuid);
            player.AddItem(itemTemplate['itemID'], temp.num, eAssetsAdd.NiuDan, log_NiuDanGuid);
        }
        itemIdList.push(itemTemplate['itemID']);
        itemNumList.push(temp.num);
    }
    oldNiuDan.SetNiuInfo(eNiuDanInfo.StarNum, starNum);
    msg.starNum = starNum;
    msg.freeNum = freeNum;

    // for tlog
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var niuDanType = niuDanID % 10000 - 1;
    tlogger.log('NiudanFlow', accountType, openID, expLevel, niuDanType, nType, 0, yuanBao, 0, itemIdList, itemNumList,
                vipLevel);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp()));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
    var log_NiuDanArgs = [log_NiuDanGuid];
    for (var i = 0; i < gameConst.eNiuDanInfo.Max; ++i) {
        log_NiuDanArgs.push(oldNiuDan.GetNiuInfo(i));
    }
    log_NiuDanArgs.push(utilSql.DateToString(new Date()));
    log_insLogSql.InsertSql(gameConst.eTableTypeInfo.NiuDan, log_NiuDanArgs);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var LotterDrawListTemplate = templateManager.GetTemplateByID('LotterDrawListTemplate', niuDanID);
    if (null == LotterDrawListTemplate) {
        return errorCodes.SystemWrong;
    }
    var assets = LotterDrawListTemplate['assets'];
    msg.niuDanQuan = player.GetAssetsManager().GetAssetsValue(assets);
    var freeTime = msg.freeNum - msg.niuDanQuan;//免费次数
    msg.freeNum = freeTime < 0 ? 0 : freeTime;

    //self.SendNiuDanList(self.owner, null, null);
    return msg;
};
//是否超过24小时
handler.IsReach24 = function (nowTime, timeCd, niuDanTimeCd) {
    if (nowTime < timeCd) {
        return true;
    }
    return nowTime - timeCd >= niuDanTimeCd * 60 * 1000;
};
//发送请求的倒计时时间
handler.ShowCountTime = function (nowTime, timeCd, niuDanTimeCd) {
    if (timeCd > 0) {
        if (nowTime < timeCd) {
            return niuDanTimeCd * 60 * 1000;
        } else {
            return niuDanTimeCd * 60 * 1000 - (nowTime - timeCd);
        }
    } else {
        return 0;
    }
};

/**
 * 运营活动函数通知
 * @param player
 * @param payValue
 */
handler.notifyOperateByChartYuanBao = function (player, payValue) {
    var vipPoint = player.GetPlayerInfo(gameConst.ePlayerInfo.VipPoint);
    //发送充值事件，更新活动
    player.emit(eventValue.OPERATE_EVENT_REWARD_BY_CHART_YUAN_BAO, player, vipPoint, payValue);
};

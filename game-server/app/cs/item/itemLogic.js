/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-12
 * Time: 上午11:27
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var playerManager = require('../player/playerManager');
var templateManager = require('../../tools/templateManager');
var gameConst = require('../../tools/constValue');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var _ = require('underscore');

var eItemInfo = gameConst.eItemInfo;
var eAttInfo = gameConst.eAttInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttLevel = gameConst.eAttLevel;
var eItemType = gameConst.eItemType;
var eBagPos = gameConst.eBagPos;
var eAssetsType = gameConst.eAssetsType;
var eCreateType = gameConst.eCreateType;
var eMisType = gameConst.eMisType;
var tItem = templateConst.tItem;
var tAssets = templateConst.tAssets;
var tIntensify = templateConst.tIntensify;
var tSynthesize = templateConst.tSynthesize;
var tResolve = templateConst.tItemResolve;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_guid = require('../../tools/guid');
var log_insertSql = require('../../tools/mysql/insLogSql');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = module.exports;

Handler.SellItem = function (player, itemGuid) {
    var item = player.GetItemManager().GetItem(itemGuid);
    if (null == item) {
        return errorCodes.Cs_NoFindItem;
    }
    var itemTemplate = item.GetItemTemplate();
    if (itemTemplate[tItem.itemType] == eItemType.Armor || itemTemplate[tItem.itemType] == eItemType.Weapon
        || itemTemplate[tItem.itemType] == eItemType.Jewelry) {
        if (item.GetItemInfo(eItemInfo.BAGTYPE) != eBagPos.EquipOff) {
            return errorCodes.Cs_NoSellOrResolveEquipOn;
        }
        var oldStar = item.GetItemInfo(eItemInfo['STAR' + 0]);
        if(oldStar > 0) {
            player.GetAssetsManager().SetAssetsValue(oldStar,1);
        }
        var Money = itemTemplate[tItem.sellValue];//出售价格
        var assetsID = itemTemplate[tItem.sellID];//出售物品ID
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_ItemGuid = log_guid.GetUuid();         //物品变化的logID
        var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                             gameConst.eMoneyChangeType.SellItem, log_ItemGuid, assetsID,
                             player.GetAssetsManager().GetAssetsValue(assetsID)];
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        player.GetAssetsManager().SetAssetsValue(assetsID, Money);//
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(assetsID));
        log_MoneyArgs.push(utilSql.DateToString(new Date()));
        log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( '出售物品金钱变化 数据入库成功' );
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        player.GetItemManager().DeleteItem(itemGuid);
        // for tlog
        var openID = player.GetOpenID();
        var accountType = player.GetAccountType();
        var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
        var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        var color = itemTemplate[tItem.color];
        var tempID = itemTemplate[tItem.attID];
        if(_.contains([eItemType.Armor, eItemType.Weapon, eItemType.Jewelry], itemTemplate[tItem.itemType])) {
            tlogger.log('EquipChangeFlow', accountType, openID, expLevel, vipLevel, tempID, color, 2);
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_ItemArgs = [log_ItemGuid];
        for (var i = 0; i < gameConst.eItemInfo.Max; ++i) {
            log_ItemArgs.push(item.GetItemInfo(i));
        }
        log_ItemArgs.push(gameConst.eItemChangeType.Sell);
        log_ItemArgs.push(gameConst.eEmandationType.DEL);
        log_ItemArgs.push(utilSql.DateToString(new Date()));
        log_insertSql.InsertSql(gameConst.eTableTypeInfo.ItemChange, log_ItemArgs);
        //logger.info( '出售物品  数据入库成功' );
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        player.GetAssetsManager().SendAssetsMsg(assetsID);
        return 0;
    }
    return errorCodes.Cs_EquipType;
};

Handler.EquipOn = function (player, itemGuid, isSend) {
    var item = player.GetItemManager().GetItem(itemGuid);
    if (null == item) {
        return errorCodes.Cs_NoFindItem;
    }
    return this.EquipOnWithoutCheck(item, itemGuid, player, isSend);
};

Handler.EquipOnWithoutCheck = function (item, itemGuid, player, isSend) {
    var itemTemplate = item.GetItemTemplate();
    var jobType = player.GetJobType() + 1;
    var jobMark = jobType > 3 ? jobType + 6 : jobType;
    var jobTempID = Math.floor(itemTemplate[tItem.attID] / defaultValues.itemBeginNum);
    if (jobMark != jobTempID) {
        return errorCodes.Cs_ItemWrongJob;
    }
    var playerLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);   //玩家的当前等级
    var itemUseLevel = itemTemplate[tItem.useLevel];                //装备的使用等级
    if (playerLevel < itemUseLevel) {   //穿戴装备等级不足
        return errorCodes.ExpLevel;
    }
    if (itemTemplate[tItem.itemType] == eItemType.Armor || itemTemplate[tItem.itemType] == eItemType.Weapon
        || itemTemplate[tItem.itemType] == eItemType.Jewelry) {
        var equipIndex = itemTemplate[tItem.equipType];
        var oldGuid = player.equipManager.GetEquip(equipIndex);
        if (oldGuid == itemGuid) {
            return errorCodes.Cs_EquipUse;
        }
        var equipItem = null;
        if (oldGuid.length > 0) {
            equipItem = player.itemManager.GetItem(oldGuid);
        }
        if (null == equipItem) {  //没有装备
            item.SetDataInfo(eItemInfo.BAGTYPE, eBagPos.EquipOn);
            player.equipManager.SetEquip(equipIndex, itemGuid);
            this.AttributeUpdate(player, item, true, isSend);
        }
        else {
            this.AttributeUpdate(player, equipItem, false, false);
            for (var i = 0; i < 3; ++i) {
                var starID = equipItem.GetItemInfo(eItemInfo['STAR' + i]);
                if (starID > 0) {
                    player.GetAssetsManager().SetAssetsValue(starID, 1);
                    equipItem.SetDataInfo(eItemInfo['STAR' + i], 0);
                }
            }
            equipItem.SetDataInfo(eItemInfo.BAGTYPE, eBagPos.EquipOff);
            item.SetDataInfo(eItemInfo.BAGTYPE, eBagPos.EquipOn);
            player.equipManager.SetEquip(equipIndex, itemGuid);
            equipItem.SetItemZhanli();
            this.AttributeUpdate(player, item, true, isSend);
            player.itemManager.UpdateStateWhenChangeEquip( 0, item, equipItem);
            player.itemManager.SendItemMsg( [ equipItem, item  ], eCreateType.New, gameConst.eItemOperType.OtherType);
        }
        return 0;
    }
    return errorCodes.Cs_EquipType;
};

Handler.AttributeUpdate = function (player, item, isAdd, isSend) {
    if (null == player || null == item) {
        return;
    }
    var itemTemplate = item.GetItemTemplate();
    if (null == itemTemplate) {
        return;
    }
    var starNum = itemTemplate[tItem.starNum];
    var percent = 0;
    for (var i = 0; i < starNum; ++i) {
        var starID = item.GetItemInfo(eItemInfo['STAR' + i]);
        if (starID > 0) {
            var assetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', starID);
            if (null == assetsTemplate) {
                continue;
            }
            var percent = assetsTemplate[tAssets.percent];
            starNum += percent;
        }
    }
    var attList = new Array(eAttInfo.MAX);
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attList[i] = temp;
    }
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        attList[i][0] = Math.floor(item.GetItemInfo(eItemInfo.ATTACK + i) * ( 1 + starNum / 100 ));
    }
    var level = item.GetItemInfo(eItemInfo.Intensify);
    var levelAtt = itemTemplate[tItem.levelID];
    var IntensifyTemplate = templateManager.GetTemplateByID('IntensifyTemplate', levelAtt);
    if (null != IntensifyTemplate) {
        var maxLevel = IntensifyTemplate[tIntensify.addNum];
        for (var i = 0; i < maxLevel; ++i) {
            var attID = IntensifyTemplate['attID_' + i];
            var attNum = IntensifyTemplate['attNum_' + i];
            attNum *= level;
            attList[attID][0] += attNum;
        }
    }
    var itemZhanli = item.GetItemInfo(eItemInfo.ZHANLI);
    player.UpdateZhanli(itemZhanli, isAdd, isSend);
    player.UpdateAtt(eAttLevel.ATTLEVEL_EQUIP, attList, isAdd, isSend);
};

Handler.InlayStar = function (player, itemGuid, starID, starIndex) {
    var oldItem = player.GetItemManager().GetItem(itemGuid);
    if (null == oldItem) {
        return errorCodes.Cs_NoFindItem;
    }
    if (starIndex < 0 || starIndex > defaultValues.inlayNum) {
        return errorCodes.Cs_Hole;
    }
    var itemTemplate = oldItem.GetItemTemplate();
    if (null == itemTemplate) {
        return errorCodes.SystemWrong;
    }
    var starNum = itemTemplate[tItem.starNum];
    if(starIndex >= starNum){
        return errorCodes.SystemWrong;
    }
    if (player.GetAssetsManager().CanConsumeAssets(starID, 1) == false) {
        return errorCodes.NoStar;
    }
    var oldStar = oldItem.GetItemInfo(eItemInfo['STAR' + starIndex]);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemGuid = log_guid.GetUuid();        //物品变化的Guid
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    if (oldStar > 0) {
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                             gameConst.eMoneyChangeType.InlayStar, log_ItemGuid, oldStar,
                             player.GetAssetsManager().GetAssetsValue(oldStar)];
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        player.GetAssetsManager().SetAssetsValue(oldStar, 1);
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(oldStar));
        log_MoneyArgs.push(utilSql.DateToString(new Date()));
        log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( '镶嵌钻石金钱变化  数据如果成功' );
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
    var bagType = oldItem.GetItemInfo(eItemInfo.BAGTYPE);
    if (bagType == eBagPos.EquipOn) {
        this.AttributeUpdate(player, oldItem, false, false);
    }

    oldItem.SetDataInfo(eItemInfo['STAR' + starIndex], starID);
    oldItem.SetItemZhanli();
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                         gameConst.eMoneyChangeType.InlayStar, log_ItemGuid, starID,
                         player.GetAssetsManager().GetAssetsValue(starID)];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    player.GetAssetsManager().SetAssetsValue(starID, -1);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(starID));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
    //logger.info( '镶嵌钻石金钱变化  数据如果成功' );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (bagType == eBagPos.EquipOn) {
        this.AttributeUpdate(player, oldItem, true, true);
    }
    player.GetItemManager().SendItemMsg( [oldItem], eCreateType.New, gameConst.eItemOperType.OtherType);
    //player.GetMissionManager().MissionOver(player, eMisType.lingXiang, 0, 1);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemArgs = [log_ItemGuid];
    for (var i = 0; i < gameConst.eItemInfo.Max; ++i) {
        log_ItemArgs.push(oldItem.GetItemInfo(i));
    }
    log_ItemArgs.push(gameConst.eItemChangeType.InlayStar);
    log_ItemArgs.push(gameConst.eEmandationType.Other);
    log_ItemArgs.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.ItemChange, log_ItemArgs);
    //logger.info( '镶嵌钻石物品变化  数据入库成功' );
    // tlog
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    tlogger.log('InlayFlow', accountType, openID, expLevel, vipLevel);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    player.GetMissionManager().IsMissionOver( eMisType.InlayStar, 0, 1);
    player.GetItemManager().UpdateStateWhenChangeEquip( 1);
    return 0;
};

Handler.RemoveStar = function (player, itemGuid, starIndex) {
    var oldItem = player.GetItemManager().GetItem(itemGuid);
    if (null == oldItem) {
        return errorCodes.Cs_NoFindItem;
    }
    if (starIndex < 0 || starIndex > defaultValues.inlayNum) {
        return errorCodes.Cs_Hole;
    }
    var itemTemplate = oldItem.GetItemTemplate();
    if(itemTemplate == null){
        return errorCodes.SystemWrong;
    }
    var oldStar = oldItem.GetItemInfo(eItemInfo['STAR' + starIndex]);
    if (oldStar <= 0) {
        return errorCodes.NoStar;
    }
    var bagType = oldItem.GetItemInfo(eItemInfo.BAGTYPE);
    if (bagType == eBagPos.EquipOn) {
        this.AttributeUpdate(player, oldItem, false, false);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemGuid = log_guid.GetUuid();                 //物品变化的Guid
    var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                         gameConst.eMoneyChangeType.RemoveStar,
                         log_ItemGuid, oldStar, player.GetAssetsManager().GetAssetsValue(oldStar)];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    player.GetAssetsManager().SetAssetsValue(oldStar, 1, null, null, true); //不发送公告
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(oldStar));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
    //logger.info( '移除钻石金钱变化  数据入库成功' );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    oldItem.SetDataInfo(eItemInfo['STAR' + starIndex], 0);
    oldItem.SetItemZhanli();
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemArgs = [log_ItemGuid];
    for (var i = 0; i < gameConst.eItemInfo.Max; ++i) {
        log_ItemArgs.push(oldItem.GetItemInfo(i));
    }
    log_ItemArgs.push(gameConst.eItemChangeType.RemoveStar);
    log_ItemArgs.push(gameConst.eEmandationType.Other);
    log_ItemArgs.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.ItemChange, log_ItemArgs);
    //logger.info( '移除钻石物品变化  数据入库成功' );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (bagType == eBagPos.EquipOn) {
        this.AttributeUpdate(player, oldItem, true, true);
    }
    player.GetItemManager().UpdateStateWhenChangeEquip( 1);
    player.GetItemManager().SendItemMsg( [oldItem], eCreateType.New, gameConst.eItemOperType.OtherType);
    return 0;
};

Handler.SynthesizeStar = function (player, synID, synNum) {
    var SynthesizeTemplate = templateManager.GetTemplateByID('SynthesizeTemplate', synID);
    if (null == SynthesizeTemplate) {
        return errorCodes.SystemWrong;
    }
    var needNum = SynthesizeTemplate[tSynthesize.needNum];
    var createNum = SynthesizeTemplate[tSynthesize.createNum];
    var needMoney = SynthesizeTemplate[tSynthesize.needMoney];
    var endList = {};
    for (var i = 0; i < needNum; ++i) {
        var tempID = SynthesizeTemplate['needID_' + i];
        var tempNum = SynthesizeTemplate['needNum_' + i];
        if (player.GetAssetsManager().CanConsumeAssets(tempID, tempNum * synNum) == false) {
            return errorCodes.NoStar;
        }
    }
    var moneyID = globalFunction.GetMoneyTemp();
    if (player.GetAssetsManager().CanConsumeAssets(moneyID, needMoney * synNum) == false) {
        logger.warn('SynthesizeStar金币不足' + needMoney);
        return errorCodes.NoMoney;
    }
    for (var i = 0; i < needNum; ++i) {
        var tempID = SynthesizeTemplate['needID_' + i];
        var tempNum = SynthesizeTemplate['needNum_' + i];
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                             gameConst.eMoneyChangeType.SynthesizeStar,
                             0, tempID, player.GetAssetsManager().GetAssetsValue(tempID)];
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        player.GetAssetsManager().SetAssetsValue(tempID, -( tempNum * synNum ));
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(tempID));
        log_MoneyArgs.push(utilSql.DateToString(new Date()));
        log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( '合成灵石金钱变化  数据入库成功' );
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                         gameConst.eMoneyChangeType.SynthesizeStar,
                         0, moneyID, player.GetAssetsManager().GetAssetsValue(moneyID)];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    player.GetAssetsManager().SetAssetsValue(moneyID, -( needMoney * synNum ));
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(moneyID));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
    //logger.info( '合成灵石金钱变化  数据入库成功' );
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    for (var num = 0; num < synNum; ++num) {
        var rand = Math.floor(Math.random() * 10000);
        for (var i = 0; i < createNum; ++i) {
            var tempID = SynthesizeTemplate['assetsID_' + i];
            var tempNum = SynthesizeTemplate['assetsNum_' + i];
            var percent = SynthesizeTemplate['percent_' + i];
            if (rand <= percent) {
                if (null == endList[tempID]) {
                    endList[tempID] = tempNum;
                }
                else {
                    endList[tempID] += tempNum;
                }
                break;
            }
        }
    }
    var itemList = [];
    for (var index in endList) {
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_MoneyArgs = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                             gameConst.eMoneyChangeType.SynthesizeStar,
                             0, index, player.GetAssetsManager().GetAssetsValue(index)];
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //player.GetAssetsManager().SetAssetsValue(index, endList[index]);
        player.GetAssetsManager().AlterAssetsValue(index, endList[index], eAssetsAdd.Synthesis);
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(index));
        log_MoneyArgs.push(utilSql.DateToString(new Date()));
        log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs);
        //logger.info( '合成灵石金钱变化  数据入库成功' );
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var tempItem = {
            itemID: index,
            itemNum: endList[index]
        }
        itemList.push(tempItem);
    }
    return itemList;
};

Handler.SynthesizeEquip = function (player, synID) {
    var SynthesizeTemplate = templateManager.GetTemplateByID('SynthesizeTemplate', synID);
    if (null == SynthesizeTemplate) {
        return errorCodes.SystemWrong;
    }
    var needNum = SynthesizeTemplate[tSynthesize.needNum];
    var equipID = SynthesizeTemplate[tSynthesize.assetsID_0];
    var type = SynthesizeTemplate[tSynthesize.type];
    if (type != 1) {
        return errorCodes.SystemWrong;
    }
    if (player.GetItemManager().IsFullEx(gameConst.eBagPos.EquipOff) == true) {   //背包已满
        return errorCodes.Cs_ItemFull;
    }
    for (var i = 0; i < needNum; ++i) {
        var tempID = SynthesizeTemplate['needID_' + i];
        var tempNum = SynthesizeTemplate['needNum_' + i];
        if (player.GetAssetsManager().CanConsumeAssets(tempID, tempNum) == false) {
            return errorCodes.NoAssets;
        }
    }
    for (var i = 0; i < needNum; ++i) {
        var tempID = SynthesizeTemplate['needID_' + i];
        var tempNum = SynthesizeTemplate['needNum_' + i];
        player.GetAssetsManager().SetAssetsValue(tempID, -tempNum);
    }
    var itemManager = player.GetItemManager();
    var newItem = itemManager.CreateItem( equipID);
    player.GetItemManager().SendItemMsg( [newItem], eCreateType.New, gameConst.eItemOperType.GetItem);
    equipID = equipID % defaultValues.itemBeginNum + defaultValues.itemBeginNum;
    player.GetMissionManager().IsMissionOver( gameConst.eMisType.SynthesisEquip, equipID, 1);
    return newItem;
};

Handler.Intensify = function (player, itemGuid) {
    var oldItem = player.GetItemManager().GetItem(itemGuid);
    if (null == oldItem) {
        return errorCodes.Cs_NoFindItem;
    }
    var ItemTemplate = oldItem.GetItemTemplate();
    if (null == ItemTemplate) {
        return errorCodes.SystemWrong;
    }
    var stoneID = ItemTemplate[tItem.stoneID];
    var nowLevel = oldItem.GetItemInfo(eItemInfo.Intensify);
    if (nowLevel >= ItemTemplate[tItem.maxLevel]) {
        return errorCodes.Cs_MaxIntensify;
    }
    //var itemTemplate = oldItem.GetItemTemplate();

    var levelAtt = ItemTemplate[tItem.levelID];
    var IntensifyTemplate = templateManager.GetTemplateByID('IntensifyTemplate', levelAtt);
    if (null == IntensifyTemplate) {
        return errorCodes.SystemWrong;
    }
    var moneyID = globalFunction.GetMoneyTemp();
    var moneyNum = IntensifyTemplate[tIntensify.needMoney];
    if (player.GetAssetsManager().CanConsumeAssets(moneyID, moneyNum) == false) {
        return errorCodes.NoMoney;
    }
    var stoneNum = IntensifyTemplate[tIntensify.intrnsifyNum];    //强化物品需要的强化石的数量
    if (player.GetAssetsManager().CanConsumeAssets(stoneID, stoneNum) == false) {
        return errorCodes.NoStone;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemGuid = log_guid.GetUuid();                     //物品变化的Guid
    var log_MoneyArgs1 = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                          gameConst.eMoneyChangeType.Intensify,
                          log_ItemGuid, moneyID, player.GetAssetsManager().GetAssetsValue(moneyID)];
    var log_MoneyArgs2 = [log_guid.GetUuid(), player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                          gameConst.eMoneyChangeType.Intensify,
                          log_ItemGuid, stoneID, player.GetAssetsManager().GetAssetsValue(stoneID)];
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /*player.GetAssetsManager().SetAssetsValue(moneyID, -moneyNum);
    player.GetAssetsManager().SetAssetsValue(stoneID, -stoneNum);*/
    player.GetAssetsManager().AlterAssetsValue(moneyID, -moneyNum, eAssetsReduce.Intensify);
    player.GetAssetsManager().AlterAssetsValue(stoneID, -stoneNum, eAssetsReduce.Intensify);

    var result = errorCodes.OK;
    var enhanceRate = Math.floor(oldItem.GetItemInfo(eItemInfo.Intensify) / 5);
    //TODO vip特权装备强化提升百分率
    var myVipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == myVipLevel || 0 == myVipLevel) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', myVipLevel + 1);
    }
    var vipAdd = 0;
    if (null != vipTemplate) {
        vipAdd = vipTemplate[templateConst.tVipTemp.strengthenSuccessRate];
    }
    var percent = IntensifyTemplate['percent_' + enhanceRate] + vipAdd;
    var random = Math.random() * 100;
    var bSurcess = random <= percent;
    if (bSurcess) {
        var bagType = oldItem.GetItemInfo(eItemInfo.BAGTYPE);
        if (bagType == eBagPos.EquipOn) {
            this.AttributeUpdate(player, oldItem, false, false);
        }
        oldItem.SetDataInfo(eItemInfo.Intensify, nowLevel + 1);
        oldItem.SetItemZhanli();
        if (bagType == eBagPos.EquipOn) {
            this.AttributeUpdate(player, oldItem, true, true);
        }
        player.GetItemManager().SendItemMsg( [oldItem], eCreateType.New, gameConst.eItemOperType.OtherType);
        player.GetMissionManager().IsMissionOver( eMisType.Intensify, 0, 1);

    }
    else {
        result = errorCodes.Cs_IntensifyFailed;
    }
    player.GetrewardMisManager().IsFinishMission(gameConst.eRewardMisType.Intensify, 0, 1);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    log_MoneyArgs1.push(player.GetAssetsManager().GetAssetsValue(moneyID));
    log_MoneyArgs1.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs1);
    // logger.info( '强化灵石金钱变化  数据入库成功1' );
    log_MoneyArgs2.push(player.GetAssetsManager().GetAssetsValue(stoneID));
    log_MoneyArgs2.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.MoneyChange, log_MoneyArgs2);
    //logger.info( '强化灵石金钱变化  数据入库成功2' );

    var log_ItemArgs = [log_ItemGuid];
    for (var i = 0; i < gameConst.eItemInfo.Max; ++i) {
        log_ItemArgs.push(oldItem.GetItemInfo(i));
    }
    log_ItemArgs.push(gameConst.eItemChangeType.Intensify);
    log_ItemArgs.push(gameConst.eEmandationType.Other);
    log_ItemArgs.push(utilSql.DateToString(new Date()));
    log_insertSql.InsertSql(gameConst.eTableTypeInfo.ItemChange, log_ItemArgs);
    // logger.info( '强化灵石物品变化  数据入库成功' );
    // for tlog
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    tlogger.log('IntensifyFlow', accountType, openID, expLevel, vipLevel);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return result;
};

Handler.Resolve = function (player, itemGuid) {
    var item = player.GetItemManager().GetItem(itemGuid);
    var result = [];
    result['result'] = errorCodes.OK;
    if (null == item) {
        result['result'] = errorCodes.Cs_NoFindItem;
        return result;
    }
    var itemTemplate = item.GetItemTemplate();
    if (itemTemplate[tItem.itemType] == eItemType.Armor || itemTemplate[tItem.itemType] == eItemType.Weapon
        || itemTemplate[tItem.itemType] == eItemType.Jewelry) {
        if (item.GetItemInfo(eItemInfo.BAGTYPE) != eBagPos.EquipOff) {
            result['result'] = errorCodes.Cs_NoSellOrResolveEquipOn;
            return result;
        }

        var resolveID = itemTemplate[tItem.resolveID];
        var resolveTemplate = templateManager.GetTemplateByID('ItemResolveTemplate', resolveID);
        if (null == resolveTemplate) {
            result['result'] = errorCodes.NoTemplate;
            return result;
        }

        var oldStar = item.GetItemInfo(eItemInfo['STAR' + 0]);
        if (oldStar > 0) {  //分解的装备上有灵石
            player.GetAssetsManager().SetAssetsValue(oldStar, 1);
        }

        var itemIDList = [];
        var itemNumList = [];
        for (var i = 0; i < 2; ++i) {
            var itemID = resolveTemplate['baseOutputID_' + i];
            var itemNum = resolveTemplate['baseOutputNum_' + i];
            if (itemID > 0 && itemNum > 0) {
                player.AddItem(itemID, itemNum, eAssetsAdd.Decompose, itemGuid);
                itemIDList.push(itemID);
                itemNumList.push(itemNum);
            }
        }

        var starLevel = item.GetItemInfo(eItemInfo.ItemStar);
        if (starLevel > 0) {
            var starPercent = resolveTemplate['starOutputPercent_' + (starLevel - 1)];
            var randomPercent = Math.random() * 100;
            if (randomPercent < starPercent) {
                var itemID = resolveTemplate['starOutputID_' + (starLevel - 1)];
                var itemNum = resolveTemplate['starOutputNum_' + (starLevel - 1)];

                if (itemID > 0 && itemNum > 0) {
                    player.AddItem(itemID, itemNum, eAssetsAdd.Decompose, itemGuid);
                    itemIDList.push(itemID);
                    itemNumList.push(itemNum);
                }
            }
        }

        var enhanceLevel = item.GetItemInfo(eItemInfo.Intensify);
        if (enhanceLevel > 0) {
            var enhanceRate = Math.floor((enhanceLevel - 1) / 5);

            var itemID = resolveTemplate['enhanceOutputID_' + enhanceRate];
            var itemNum = resolveTemplate['enhanceOutputNum_' + enhanceRate];
            if (itemID > 0 && itemNum > 0) {
                player.AddItem(itemID, itemNum, eAssetsAdd.Decompose, itemGuid);
                itemIDList.push(itemID);
                itemNumList.push(itemNum);
            }
        }

        result['itemIDList'] = itemIDList;
        result['itemNumList'] = itemNumList;

        player.GetItemManager().DeleteItem(itemGuid);
        // for tlog
        var openID = player.GetOpenID();
        var accountType = player.GetAccountType();
        var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
        var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        var color = itemTemplate[tItem.color];
        var tempID = itemTemplate[tItem.attID];
        if(_.contains([eItemType.Armor, eItemType.Weapon, eItemType.Jewelry], itemTemplate[tItem.itemType])) {
            tlogger.log('EquipChangeFlow', accountType, openID, expLevel, vipLevel, tempID, color, 1);
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_ItemGuid = log_guid.GetUuid();         //物品变化的logID
        var log_ItemArgs = [log_ItemGuid];
        for (var i = 0; i < gameConst.eItemInfo.Max; ++i) {
            log_ItemArgs.push(item.GetItemInfo(i));
        }
        log_ItemArgs.push(gameConst.eItemChangeType.ItemResolve);
        log_ItemArgs.push(gameConst.eEmandationType.DEL);
        log_ItemArgs.push(utilSql.DateToString(new Date()));
        log_insertSql.InsertSql(gameConst.eTableTypeInfo.ItemChange, log_ItemArgs);
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        return result;
    }
    return result;
};

// state: 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
Handler.Activate = function (player, attID, activate) {
    var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', attID);
    if (null == suitTemplate) {
        return errorCodes.SystemWrong;
    }

    if (suitTemplate['type'] === 0) {//强化
        if (activate === 0) {//取消激活
            if (player.itemManager.GetStateByAttID(attID, 0) != 2) {
                return errorCodes.Suit_NoActivate;
            }
            return player.itemManager.CancelActivateState(attID, 0);

        } else if (activate == 1) {   //激活

            if (player.itemManager.GetLevelByType(0) < suitTemplate['limit']) {
                return errorCodes.Suit_NoLevel;
            }
            if (player.itemManager.GetStateByAttID(attID, 0) != 1) {
                return errorCodes.Suit_NoUnlock;
            }
            return player.itemManager.ActivateSuitState( attID, 0);
        }
        //装备属性加成
    }
    else if (suitTemplate['type'] === 1) {//镶嵌

        if (activate === 0) {   //取消激活
            if (player.itemManager.GetStateByAttID(attID, 1) != 2) {
                return errorCodes.Suit_NoActivate;
            }
            return player.itemManager.CancelActivateState(attID, 1);

        } else if (activate === 1) {  //激活
            if (player.itemManager.GetLevelByType(1) < suitTemplate['limit']) {
                return errorCodes.Suit_NoLevel;
            }
            if (player.itemManager.GetStateByAttID(attID, 1) === 0) {
                return errorCodes.Suit_NoUnlock;
            }
            return player.itemManager.ActivateSuitState( attID, 1);
        }
    }
};
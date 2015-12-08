/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-10
 * Time: 下午3:59
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var globalFunction = require('../../tools/globalFunction');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');
var eMineSweepInfo = gameConst.eMineSweepInfo;
var eMineSweepField = gameConst.eMineSweepField;
var templateConst = require('../../../template/templateConst');
var tVipTemp = templateConst.tVipTemp;
var eItemType = gameConst.eItemType;
var eSpecial = gameConst.eSpecial;
var tItem = templateConst.tItem;
var ePlayerInfo = gameConst.ePlayerInfo;
var eVipInfo = gameConst.eVipInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};
var handler = Handler.prototype;


handler.resetTimes = function (mineInfo, player) {//重置次数
    var mineSweepID = mineInfo['mineSweepID'];
    var vipTop = mineInfo['leftTimes'];
    var VipInfoManager = player.GetVipInfoManager();
    if (null == mineSweepID || null == vipTop || null == VipInfoManager) {
        return errorCodes.ParameterNull;
    }
    if (vipTop > 0) {
        var MineSweepTemplate = templateManager.GetTemplateByID('MineSweepTemplate', mineSweepID);//根据关卡ID 获取当前难道关卡
        var resetZuanShi = MineSweepTemplate['resetZuanShi'];
        var yuanbaoID = globalFunction.GetYuanBaoTemp();
//        player.GetAssetsManager().GetAssetsValue(yuanbaoID) > 0 &&
        if (yuanbaoID > 0) {
            if (player.GetAssetsManager().CanConsumeAssets(yuanbaoID, resetZuanShi) == false) {
                return errorCodes.NoAssets;
            }
            player.GetAssetsManager().SetAssetsValue(yuanbaoID, -1 * resetZuanShi);
            var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
            VipInfoManager.setNumByType(roleID, eVipInfo.MineSweepNum, 1);//更新每日免费扫荡次数+1
            return errorCodes.OK;
        }
    }
    return errorCodes.MineSweep;
};

handler.receiveMineSweepLevelBaoXiang = function (mineInfo, player) { //获取每一层宝箱
    var mineSweepLevelID = mineInfo['mineSweepLevelID'];
    if (null == mineSweepLevelID) {
        return errorCodes.ParameterNull;
    }
    var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', mineSweepLevelID);
    if (null == MineSweepLevelTemplate) {
        return errorCodes.ParameterNull;
    }
    var baoXiangID = MineSweepLevelTemplate['baoXiangID'];
//    var items = mineInfo.items;
//    for (var i in items) {
//        if (items[i].state == eMineSweepField.state_1) {
//            return errorCodes.Cs_MissionLost;
//        }
//    }
    // for tlog
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var difficulty = Math.floor(mineSweepLevelID / 100) % 10;
    var level = mineSweepLevelID % 100;

    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', baoXiangID);
    for (var gift = 0; gift < 10; gift++) {
        var itemID = GiftTemplate['itemID_' + gift];
        var itemNum = GiftTemplate['itemNum_' + gift];
        player.AddItem(itemID, itemNum, eAssetsAdd.Mine, 0);//添加物品方法
        // tlog
        if(itemID == globalFunction.GetYuanBaoTemp()) {
            tlogger.log('MineAssetsFlow', accountType, openID, expLv, vipLv, difficulty, level+1, 1, itemNum);
        }
    }
    return 0;
};


handler.receiveMineSweepBaoXiang = function (mineInfo, player) {//领取通关礼包
    var mineSweepID = mineInfo['mineSweepID'];
    if (null == mineSweepID) {
        return errorCodes.ParameterNull;
    }
    var MineSweepTemplate = templateManager.GetTemplateByID('MineSweepTemplate', mineSweepID);
    if (null == MineSweepTemplate) {
        return errorCodes.ParameterNull;
    }
    var mineSweepLevelID = mineInfo['mineSweepLevelID'];//取到当前关卡ID
    var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', mineSweepLevelID);
    if (null == MineSweepLevelTemplate) {
        return errorCodes.ParameterNull;
    }
    var levelIndex = MineSweepLevelTemplate['levelIndex'];
    var levelNum = MineSweepTemplate['levelNum'];
    if (levelIndex == levelNum) {
//        var items = mineInfo.items;
//        for (var i in items) {
//            if (items[i].state == eMineSweepField.state_1) {
//                return errorCodes.Cs_MissionLost;
//            }
//        }
        var baoXiangID = MineSweepTemplate['baoXiangID'];
        var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', baoXiangID);
        if (null == GiftTemplate) {
            return errorCodes.ParameterNull;
        }
        // for tlog
        var openID = player.GetOpenID();
        var accountType = player.GetAccountType();
        var expLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
        var vipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        var difficulty = Math.floor(mineSweepLevelID / 100) % 10;
        var level = mineSweepLevelID % 100;

        for (var gift = 0; gift < 10; gift++) {
            var itemID = GiftTemplate['itemID_' + gift];
            var itemNum = GiftTemplate['itemNum_' + gift];
            player.AddItem(itemID, itemNum, eAssetsAdd.Mine, 0);//添加物品方法
            // tlog
            if(itemID == globalFunction.GetYuanBaoTemp()) {
                tlogger.log('MineAssetsFlow', accountType, openID, expLv, vipLv, difficulty, level+1, 1, itemNum);
            }
        }
        player.GetMissionManager().IsMissionOver( gameConst.eMisType.MineSweep, mineSweepLevelID, 1);
        // tlog
        tlogger.log('MineFinishFlow', accountType, openID, expLv, vipLv, difficulty, level+1);
        return 0;
    }
    return errorCodes.ParameterNull;
};
handler.removeCDtime = function (mineInfo, player) {//清楚冷却时间
    var mineSweepLevelID = mineInfo['mineSweepLevelID'];
    if (null != mineSweepLevelID) {
        var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', mineSweepLevelID);//通过当前层ID 获取当前层信息
        if (null == MineSweepLevelTemplate) {
            return errorCodes.ParameterNull;
        }
        var costZuanShi = MineSweepLevelTemplate['costZuanShi'];
        var yuanbaoID = globalFunction.GetYuanBaoTemp();
        if (player.GetAssetsManager().GetAssetsValue(yuanbaoID) > 0 && yuanbaoID > 0) {
            if (player.GetAssetsManager().CanConsumeAssets(yuanbaoID, costZuanShi) == false) {
                return errorCodes.NoYuanBao;
            }
            //player.GetAssetsManager().SetAssetsValue(yuanbaoID, -1 * costZuanShi);
            player.GetAssetsManager().AlterAssetsValue(yuanbaoID, -1 * costZuanShi, eAssetsReduce.RefreshMine);
            mineInfo['cdTime'] = 0;

            // for tlog
            var openID = player.GetOpenID();
            var accountType = player.GetAccountType();
            var expLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            var vipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
            var difficulty = Math.floor(mineSweepLevelID / 100) % 10;
            var level = mineSweepLevelID % 100;
            tlogger.log('MineAssetsFlow', accountType, openID, expLv, vipLv, difficulty, level+1, 0, costZuanShi);

            return mineInfo;
        }

    }
    return errorCodes.NoYuanBao;
};

handler.addHpMaxValue = function (mineInfo, player) {//补满HP
    var mineSweepID = mineInfo['mineSweepID'];
    var mineSweepLevelID = mineInfo['mineSweepLevelID'];
    if (mineSweepID > 0) {
        var MineSweepTemplate = templateManager.GetTemplateByID('MineSweepTemplate', mineSweepID);//根据关卡ID 获取当前难道关卡
        var resumeZuanShi = MineSweepTemplate['resumeZuanShi'];
        var yuanbaoID = globalFunction.GetYuanBaoTemp();
        if (player.GetAssetsManager().GetAssetsValue(yuanbaoID) > 0 && yuanbaoID > 0) {
            if (player.GetAssetsManager().CanConsumeAssets(yuanbaoID, resumeZuanShi) == false) {
                return errorCodes.NoYuanBao;
            }
            //player.GetAssetsManager().SetAssetsValue(yuanbaoID, -1 * resumeZuanShi);
            player.GetAssetsManager().AlterAssetsValue(yuanbaoID, -1 * resumeZuanShi, eAssetsReduce.MineReFullHp);
            mineInfo['currentHp'] = mineInfo['maxHp'];

            // for tlog
            var openID = player.GetOpenID();
            var accountType = player.GetAccountType();
            var expLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            var vipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
            var difficulty = Math.floor(mineSweepLevelID / 100) % 10;
            var level = mineSweepLevelID % 100;
            tlogger.log('MineAssetsFlow', accountType, openID, expLv, vipLv, difficulty, level+1, 0, resumeZuanShi);

            return mineInfo;
        }
        return errorCodes.NoYuanBao;
    }
    return errorCodes.ParameterNull;
};

handler.getIntoNextCustom = function (mineInfo, player) {//获取下一关列表
    var mineSweepLevelID = mineInfo['mineSweepLevelID'];
    var mineSweepItemDataArray = [];
    if (mineSweepLevelID > 0) {
        player.GetMissionManager().IsMissionOver( gameConst.eMisType.MineSweep, mineSweepLevelID, 1);
        mineInfo['baoXiang_KillAll'] = 0;

        var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', mineSweepLevelID);//通过首层ID 获取当前层信息
        var nextID = MineSweepLevelTemplate['nextID'];
        if (nextID > 0) {
            mineInfo['mineSweepLevelID'] = nextID;//初始化当前关卡ID
            mineInfo['times'] = 0;
            var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', nextID);
            if (null == MineSweepLevelTemplate) {
                return mineInfo;
            }
            mineSweepItemDataArray = new Array(defaultValues.GridNum);
            mineInfo[eMineSweepField.cdTime] = MineSweepLevelTemplate['cdTime']; //进入下一关需要的时间
            mineInfo[eMineSweepField.passCdTime] = utilSql.DateToString(new Date());
            var itemNumList = new Array();
            for (var d = 0; d < 10; d++) {
                itemNumList[d] = MineSweepLevelTemplate['itemNum_' + d];//获取掉落类型
            }
            for (var s = 0; s < 30; s++) {
                for (var index = 0; index < 10; index++) {
                    var itemID = MineSweepLevelTemplate['itemID_' + index];
                    if (itemID > 0 && itemNumList[index] > 0) {
                        var MineSweepItemTemplate = templateManager.GetTemplateByID('MineSweepItemTemplate', itemID);
                        if (null == MineSweepLevelTemplate) {
                            return mineInfo;
                        }
                        var itemDorp = {};
                        var dorpId = MineSweepItemTemplate['dropItemID'];
                        itemDorp[eMineSweepField.id] = itemID;
                        itemDorp[eMineSweepField.state] = eMineSweepField.state_0;
                        var attValue = MineSweepItemTemplate['attValue_Max'] - MineSweepItemTemplate['attValue_Min'];
                        if (attValue > 0) {
                            itemDorp[eMineSweepField.attValue] =
                            Math.floor(Math.random() * attValue) + MineSweepItemTemplate['attValue_Min'];
                        } else {
                            itemDorp[eMineSweepField.attValue] = 0;
                        }
                        var dropItemNum = MineSweepItemTemplate['dropItemNum_Max']
                                          - MineSweepItemTemplate['dropItemNum_Min'];
                        if (dropItemNum >= 0) {
                            itemDorp[eMineSweepField.dropItemNum] =
                            Math.floor(Math.random() * dropItemNum) + MineSweepItemTemplate['dropItemNum_Min'];
                        } else {
                            itemDorp[eMineSweepField.dropItemNum] = 0;
                        }
                        var type = MineSweepItemTemplate['type'];
                        if (type == eMineSweepField.state_1) {
                            var baoXiang_item = getBaoXiangDropItemID(dorpId, player);
                            itemDorp[eMineSweepField.baoXiangItemID] = baoXiang_item[0].id;
                            itemDorp[eMineSweepField.dropItemNum] = baoXiang_item[0].num;
                        } else {
                            itemDorp[eMineSweepField.baoXiangItemID] = 0;
                        }
//                        mineSweepItemDataArray.push(itemDorp);
                        var itemTop = utils.randomAtoB(0, 30);
                        while (mineSweepItemDataArray[itemTop]) {
                            itemTop = utils.randomAtoB(0, 30);
                        }
                        mineSweepItemDataArray[itemTop] = itemDorp;
                        itemNumList[index] = itemNumList[index] - 1;
                    }
                }
            }
        }
    }
    else{
        mineInfo['items'] = mineSweepItemDataArray;
        return mineInfo;
    }
    for (var gTop = 0; gTop < mineSweepItemDataArray.length; gTop++) {
        if (null == mineSweepItemDataArray[gTop]) {
            mineSweepItemDataArray[gTop] = {
                "id": 0,
                "state": 0,
                "attValue": 0,
                "dropItemNum": 0,
                "baoXiangItemID": 0
            }
        }
    }
    mineInfo['items'] = mineSweepItemDataArray;


    // tlog
    var openID = player.GetOpenID();
    var accountType = player.GetAccountType();
    var expLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var difficulty = Math.floor(mineSweepLevelID / 100) % 10;
    var level = mineSweepLevelID % 100;
    tlogger.log('MineFinishFlow', accountType, openID, expLv, vipLv, difficulty, level+1);

    return mineInfo;
};
handler.mineSweepRequestServerChangeState = function (index, mineInfo, player) {//更新格子状态
    var mineSweepItemInfo = mineInfo.items[index];
//    logger.fatal('mineSweepItemInfo的值是……' + JSON.stringify(mineSweepItemInfo));
    var itemID = mineSweepItemInfo[eMineSweepField.id];
    var state = mineSweepItemInfo[eMineSweepField.state];
    if (itemID == 0) {
        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_4;
        return mineInfo;
    }
    var MineSweepItemTemplate = templateManager.GetTemplateByID('MineSweepItemTemplate', itemID);
    if (null == mineSweepItemInfo) {
        return mineInfo;
    }
    var type = MineSweepItemTemplate['type'];
    if (mineSweepItemInfo[eMineSweepField.baoXiangItemID] > 0) {
        var dropItemID = mineSweepItemInfo[eMineSweepField.baoXiangItemID];//掉落的物品ID
    } else {
//        var dropItemID = mineSweepItemInfo[eMineSweepField.id];//掉落的物品ID
        var dropItemID = MineSweepItemTemplate["dropItemID"];//掉落的物品ID
    }
//    var dropItemID = MineSweepItemTemplate["dropItemID"];//掉落的物品ID
//    var dropItmeNum = mineSweepItemInfo[eMineSweepField.dropItemNum];
    switch (state) {//判断当前翻盘状态
        case 0://点击翻盘
            switch (type) {
                case 0:
                    mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_3;
                    break;
                case 1:
                    mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_2;
                    break;
                case 2:
                    mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_1;
                    break;
                case 3:
                    mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_1;
                    break;
                case 4:
                    mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_1;
                    break;
            }
            break;
        case 1://点击杀怪
            switch (type) {
                case 2:
                    if (mineInfo[eMineSweepField.currentHp] + mineSweepItemInfo[eMineSweepField.attValue]
                        <= player.GetPlayerInfo(ePlayerInfo.ZHANLI)) {
                        mineInfo[eMineSweepField.currentHp] += mineSweepItemInfo[eMineSweepField.attValue];//当前血量+获得血量
                    } else {
                        mineInfo[eMineSweepField.currentHp] = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
                    }
                    if (dropItemID > 0) {
                        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_3;
                    } else {
                        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_4;
                    }
                    break;
                case 3:
                    mineInfo[eMineSweepField.currentHp] -= mineSweepItemInfo[eMineSweepField.attValue];//当前血量-获得血量
                    if (mineInfo[eMineSweepField.currentHp] < 0) {
                        mineInfo[eMineSweepField.currentHp] = 0;
                    }
//                    mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_3;
                    if (dropItemID > 0) {
                        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_3;
                    } else {
                        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_4;
                    }
                    break;
                case 4:
                    mineInfo[eMineSweepField.currentHp] -= mineSweepItemInfo[eMineSweepField.attValue];//当前血量-获得血量
                    mineInfo[eMineSweepField.passCdTime] = utilSql.DateToString(new Date());
                    if (mineInfo[eMineSweepField.currentHp] < 0) {
                        mineInfo[eMineSweepField.currentHp] = 0;
                    }
                    if (dropItemID > 0) {
                        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_3;
                    } else {
                        mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_4;
                    }
                    break;
            }
            break;
        case 2: //开启宝箱
            mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_3;
            break;
        case 3://等待收取
            //收取物品功能
            var value = mineSweepItemInfo[eMineSweepField.dropItemNum];
            player.AddItem(dropItemID, value, eAssetsAdd.Mine, 0);//添加物品方法
            mineSweepItemInfo[eMineSweepField.state] = eMineSweepField.state_4;
            //tlog
            if(dropItemID == globalFunction.GetYuanBaoTemp()) {
                var openID = player.GetOpenID();
                var accountType = player.GetAccountType();
                var expLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
                var vipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
                var levelID = mineInfo['mineSweepLevelID'];
                var difficulty = Math.floor(levelID / 100) % 10;
                var level = levelID % 100;
                tlogger.log('MineAssetsFlow', accountType, openID, expLv, vipLv, difficulty, level+1, 1, value);
            }
            break;
        case 4:// 格子死亡
            break;
    }
    mineInfo.items[index] = mineSweepItemInfo;

    return mineInfo;
};

handler.getMineSweepData = function (mineSweepID, player) {//根据总关卡ID 获取关卡信息
    var mineSweepList = {};  //定义反馈列表
    var mineSweepItemDataArray = new Array(defaultValues.GridNum);  //没个格子的详情
    var MineSweepTemplate = templateManager.GetTemplateByID('MineSweepTemplate', mineSweepID);//根据关卡ID 获取当前难道关卡
    if (null == MineSweepTemplate) {//  验证是否为空
        return mineSweepList;
    }
    var firstLevelID = MineSweepTemplate['firstLevelID'];  //获取当前层ID
    var VipInfoManager = player.GetVipInfoManager();
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);//vip等级
    var vipID = vipLevel + 1;
    var VipTemplate = templateManager.GetTemplateByID('VipTemplate', vipID);
    var mineSweepNum = VipTemplate['mineSweepNum'];
    var vipTop = VipInfoManager.getNumByType(eVipInfo.MineSweepNum);
    var leftTimes = 0;
    if (mineSweepNum - vipTop > 0) {
        leftTimes = mineSweepNum - vipTop;
    }
    mineSweepList[eMineSweepField.mineSweepID] = mineSweepID;//总关卡ID
    mineSweepList[eMineSweepField.mineSweepLevelID] = firstLevelID;//当前关卡ID
    mineSweepList[eMineSweepField.maxHp] = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
    mineSweepList[eMineSweepField.currentHp] = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
    mineSweepList[eMineSweepField.leftTimes] = leftTimes;
    mineSweepList[eMineSweepField.leftReviveTimes] = eMineSweepField.leftTimesNum;
    mineSweepList[eMineSweepField.baoXiang_ClearLevel] = 0;
    mineSweepList[eMineSweepField.baoXiang_KillAll] = 0;
    mineSweepList[eMineSweepField.times] = 0;
    var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', firstLevelID);//通过首层ID 获取当前层信息
    if (null == MineSweepLevelTemplate) {
        return mineSweepList;
    }
    mineSweepList[eMineSweepField.cdTime] = MineSweepLevelTemplate['cdTime']; //进入下一关需要的时间
    mineSweepList[eMineSweepField.passCdTime] = utilSql.DateToString(new Date());
    var itemNumList = new Array(10);
    for (var d = 0; d < 10; d++) {
        itemNumList[d] = MineSweepLevelTemplate['itemNum_' + d];//获取掉落类型
    }
    for (var s = 0; s < 30; s++) {
        for (var index = 0; index < 10; index++) {
            var itemID = MineSweepLevelTemplate['itemID_' + index];
            if (itemID > 0 && itemNumList[index] > 0) {
                var MineSweepItemTemplate = templateManager.GetTemplateByID('MineSweepItemTemplate', itemID);
                if (null == MineSweepLevelTemplate) {
                    return mineSweepList;
                }
                var itemDorp = {};
                var dorpId = MineSweepItemTemplate['dropItemID'];
                itemDorp[eMineSweepField.id] = itemID;
                itemDorp[eMineSweepField.state] = eMineSweepField.state_0;
                var attValue = MineSweepItemTemplate['attValue_Max'] - MineSweepItemTemplate['attValue_Min'];
                if (attValue > 0) {
                    itemDorp[eMineSweepField.attValue] =
                    Math.floor(Math.random() * attValue) + MineSweepItemTemplate['attValue_Min'];
                } else {
                    itemDorp[eMineSweepField.attValue] = 0;
                }
                var dropItemNum = MineSweepItemTemplate['dropItemNum_Max'] - MineSweepItemTemplate['dropItemNum_Min'];
                if (dropItemNum >= 0) {
                    itemDorp[eMineSweepField.dropItemNum] =
                    Math.floor(Math.random() * dropItemNum) + MineSweepItemTemplate['dropItemNum_Min'];
                } else {
                    itemDorp[eMineSweepField.dropItemNum] = 0;
                }
                var type = MineSweepItemTemplate['type'];
                if (type == eMineSweepField.state_1) {
                    var baoXiang_item = getBaoXiangDropItemID(dorpId, player);
                    itemDorp[eMineSweepField.baoXiangItemID] = baoXiang_item[0].id;
                    itemDorp[eMineSweepField.dropItemNum] = baoXiang_item[0].num;
                } else {
                    itemDorp[eMineSweepField.baoXiangItemID] = 0;
                }
//                mineSweepItemDataArray.push(itemDorp);
                var itemTop = utils.randomAtoB(0, 30);
                while (mineSweepItemDataArray[itemTop]) {
                    itemTop = utils.randomAtoB(0, 30);
                }
                mineSweepItemDataArray[itemTop] = itemDorp;
                itemNumList[index] = itemNumList[index] - 1;
            }
        }
//        logger.fatal('循环次数：' + s);
    }
//    logger.fatal('mineSweepItemDataArray_格子长度：' + mineSweepItemDataArray.length);
    for (var gTop = 0; gTop < mineSweepItemDataArray.length; gTop++) {
        if (null == mineSweepItemDataArray[gTop]) {
            mineSweepItemDataArray[gTop] = {
                "id": 0,
                "state": 0,
                "attValue": 0,
                "dropItemNum": 0,
                "baoXiangItemID": 0
            }
        }
    }
    mineSweepList['items'] = mineSweepItemDataArray;
    return mineSweepList;
};
handler.getMineSweepInitData = function (mineDataInfo) {//获取初始化对象
    var mineInfo = {};
    mineInfo[gameConst.eMineSweepField.mineSweepID] = +mineDataInfo[eMineSweepInfo.mineSweepID];
    mineInfo[gameConst.eMineSweepField.mineSweepLevelID] = +mineDataInfo[eMineSweepInfo.mineSweepLevelID];
    mineInfo[gameConst.eMineSweepField.maxHp] = +mineDataInfo[eMineSweepInfo.maxHp];
    mineInfo[gameConst.eMineSweepField.currentHp] = +mineDataInfo[eMineSweepInfo.currentHp];
    mineInfo[gameConst.eMineSweepField.leftTimes] = +mineDataInfo[eMineSweepInfo.leftTimes];
    mineInfo[gameConst.eMineSweepField.leftReviveTimes] = +mineDataInfo[eMineSweepInfo.leftReviveTimes];
    mineInfo[gameConst.eMineSweepField.cdTime] = +mineDataInfo[eMineSweepInfo.cdTime];
    mineInfo[gameConst.eMineSweepField.passCdTime] = mineDataInfo[eMineSweepInfo.passCdTime];
    mineInfo[gameConst.eMineSweepField.baoXiang_ClearLevel] = +mineDataInfo[eMineSweepInfo.baoXiang_ClearLevel];
    mineInfo[gameConst.eMineSweepField.baoXiang_KillAll] = +mineDataInfo[eMineSweepInfo.baoXiang_KillAll];
    mineInfo[gameConst.eMineSweepField.items] = getMineSweepItemDate(mineDataInfo[eMineSweepInfo.items]);
    mineInfo[gameConst.eMineSweepField.times] = +mineDataInfo[eMineSweepInfo.times];
    return mineInfo;

};
function getMineSweepItemDate(itemDate) {
    var mineSweepItemDate = JSON.parse(itemDate);
    var mineList = [];
    for (var index in mineSweepItemDate) {
        var mineItem = {};
        mineItem[gameConst.eMineSweepField.id] = mineSweepItemDate[index][0];
        mineItem[gameConst.eMineSweepField.state] = mineSweepItemDate[index][1];
        mineItem[gameConst.eMineSweepField.attValue] = mineSweepItemDate[index][2];
        mineItem[gameConst.eMineSweepField.dropItemNum] = mineSweepItemDate[index][3];
        mineItem[gameConst.eMineSweepField.baoXiangItemID] = mineSweepItemDate[index][4];
        mineList.push(mineItem);
    }
    return mineList;
};

handler.createNewMineSweepInitData = function () {
    var mineSweepInfo = new Array(eMineSweepInfo.MAX);
    mineSweepInfo[eMineSweepInfo.roleID] = 0;
    mineSweepInfo[eMineSweepInfo.mineSweepID] = 0;
    mineSweepInfo[eMineSweepInfo.mineSweepLevelID] = 0;
    mineSweepInfo[eMineSweepInfo.maxHp] = 0;
    mineSweepInfo[eMineSweepInfo.currentHp] = 0;
    mineSweepInfo[eMineSweepInfo.leftTimes] = 0;
    mineSweepInfo[eMineSweepInfo.leftReviveTimes] = 0;
    mineSweepInfo[eMineSweepInfo.cdTime] = 0;
    mineSweepInfo[eMineSweepInfo.passCdTime] = utilSql.DateToString(new Date());
    mineSweepInfo[eMineSweepInfo.baoXiang_ClearLevel] = 0;
    mineSweepInfo[eMineSweepInfo.baoXiang_KillAll] = 0;
    mineSweepInfo[eMineSweepInfo.items] = JSON.stringify(GetMineSweepItemData());
    mineSweepInfo[eMineSweepInfo.times] = 0;
    return mineSweepInfo;
}
function GetMineSweepItemData() { //初始化魔域格子信息
    var grid = [];
    for (var g = 0; g < defaultValues.GridNum; g++) {
        var gridInfo = [];
        for (var i = 0; i < defaultValues.GridInfoNum; i++) {
            gridInfo.push(0);
        }
        grid.push(gridInfo);
    }
//    logger.fatal('格子的长度：' + grid.length);
    return grid;
};

handler.createMineSweepSaveData = function (mineInfo, roleID) {  //创建保存数据格式
    var mineSweepInfo = new Array();
    mineSweepInfo[eMineSweepInfo.roleID] = roleID;
    mineSweepInfo[eMineSweepInfo.mineSweepID] = mineInfo[eMineSweepField.mineSweepID];
    mineSweepInfo[eMineSweepInfo.mineSweepLevelID] = mineInfo[eMineSweepField.mineSweepLevelID];
    mineSweepInfo[eMineSweepInfo.maxHp] = mineInfo[eMineSweepField.maxHp];
    mineSweepInfo[eMineSweepInfo.currentHp] = mineInfo[eMineSweepField.currentHp];
    mineSweepInfo[eMineSweepInfo.leftTimes] = mineInfo[eMineSweepField.leftTimes];
    mineSweepInfo[eMineSweepInfo.leftReviveTimes] = mineInfo[eMineSweepField.leftReviveTimes];
    mineSweepInfo[eMineSweepInfo.cdTime] = mineInfo[eMineSweepField.cdTime];
    mineSweepInfo[eMineSweepInfo.passCdTime] = mineInfo[eMineSweepField.passCdTime];
    mineSweepInfo[eMineSweepInfo.baoXiang_ClearLevel] = mineInfo[eMineSweepField.baoXiang_ClearLevel];
    mineSweepInfo[eMineSweepInfo.baoXiang_KillAll] = mineInfo[eMineSweepField.baoXiang_KillAll];
    mineSweepInfo[eMineSweepInfo.items] = JSON.stringify(createMineSweepSaveItemData(mineInfo[eMineSweepField.items]));
    mineSweepInfo[eMineSweepInfo.times] = mineInfo[eMineSweepField.times];
    return mineSweepInfo;
};

function createMineSweepSaveItemData(items) {
    var mineInfo = new Array();
    if (null == items) {
        return mineInfo;
    }
    for (var i in items) {
        var itemInfo = new Array();
        itemInfo[eMineSweepField.state_0] = items[i].id;
        itemInfo[eMineSweepField.state_1] = items[i].state;
        itemInfo[eMineSweepField.state_2] = items[i].attValue;
        itemInfo[eMineSweepField.state_3] = items[i].dropItemNum;
        itemInfo[eMineSweepField.state_4] = items[i].baoXiangItemID;
        mineInfo.push(itemInfo)
    }
    return mineInfo;
}
function getBaoXiangDropItemID(itemID, player) {
    var ItemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
    var msg = {
        itemList: []
    }
//    var route = "ServerTreasureBoxList";
    if (null == ItemTemplate) {
        return null;
    }
    if (ItemTemplate[tItem.itemType] != eItemType.Special) {
        return null;
    }
    if (ItemTemplate[tItem.subType] != eSpecial.TreasureBox) {
        return null;
    }
    var TreasureBoxListTemplate = templateManager.GetTemplateByID('TreasureBoxListTemplate',
                                                                  ItemTemplate[tItem.otherID]);
    if (null == TreasureBoxListTemplate) {
        return null;
    }
    var vipLV = player.GetPlayerInfo(ePlayerInfo.VipLevel) + 1;
    var ExpLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    if (vipLV < TreasureBoxListTemplate['vipMin'] || vipLV > TreasureBoxListTemplate['vipMax']) {
        return null;
    }
    var tempLevel = null;
    if (ExpLevel <= 9) {
        tempLevel = 'boxID_0';
    }
    else if (ExpLevel <= 19) {
        tempLevel = 'boxID_1';
    }
    else if (ExpLevel <= 29) {
        tempLevel = 'boxID_2';
    }
    else if (ExpLevel <= 39) {
        tempLevel = 'boxID_3';
    }
    else if (ExpLevel <= 49) {
        tempLevel = 'boxID_4';
    }
    else if (ExpLevel <= 59) {
        tempLevel = 'boxID_5';
    }
    else if (ExpLevel <= 69) {
        tempLevel = 'boxID_6';
    }
    else if (ExpLevel <= 79) {
        tempLevel = 'boxID_7';
    }
    else if (ExpLevel <= 89) {
        tempLevel = 'boxID_8';
    }
    else if (ExpLevel <= 99) {
        tempLevel = 'boxID_9';
    }
    else {
        tempLevel = 'boxID_10';
    }
    var TreasureBoxTemplate = templateManager.GetTemplateByID('TreasureBoxTemplate',
                                                              TreasureBoxListTemplate[tempLevel]);
    if (null == TreasureBoxTemplate) {
        return null;
    }
    var itemRandom = 0;
    var itemNum = TreasureBoxTemplate['itemNum'];
    for (var i = 0; i < itemNum; ++i) {
        itemRandom += TreasureBoxTemplate['itemRandom_' + i];
    }
    var tempNum = TreasureBoxListTemplate['itemNum'];
    for (var i = 0; i < tempNum; ++i) {
        var resultRandom = Math.floor(Math.random() * itemRandom);
        var sum = TreasureBoxTemplate['itemRandom_0'];
        var prize = itemNum - 1;
        for (var i = 0; i < itemNum - 1; ++i) {
            if (resultRandom < sum) {
                prize = i;
                break;
            }
            else {
                sum += TreasureBoxTemplate['itemRandom_' + ( i + 1 )];
            }
        }
        var ID = TreasureBoxTemplate['itemID_' + prize];
        var Num = TreasureBoxTemplate['itemNum_' + prize];
        var temp = {
            id: ID,
            num: Num
        }
        msg.itemList.push(temp);
    }
//    logger.fatal('宝箱掉落物品：' + JSON.stringify(msg.itemList));
    return msg.itemList;
};

handler.JumpLayer = function (mineInfo, player) {//获取下一关列表
    var mineSweepLevelID = mineInfo['mineSweepLevelID'];
    if (!mineSweepLevelID) {
        return false;
    }
    if (mineSweepLevelID > 0) {
        mineInfo['baoXiang_KillAll'] = 0;
        var nextID = mineInfo['mineSweepLevelID'];//初始化当前关卡ID
        var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', nextID);
        if (null == MineSweepLevelTemplate) {
            return mineInfo;
        }
        var mineSweepItemDataArray = new Array(defaultValues.GridNum);
        mineInfo[eMineSweepField.cdTime] = MineSweepLevelTemplate['cdTime']; //进入下一关需要的时间
        var itemNumList = new Array();
        for (var d = 0; d < 10; d++) {
            itemNumList[d] = MineSweepLevelTemplate['itemNum_' + d];//获取掉落类型
        }
        for (var s = 0; s < 30; s++) {
            for (var index = 0; index < 10; index++) {
                var itemID = MineSweepLevelTemplate['itemID_' + index];
                if (itemID > 0 && itemNumList[index] > 0) {
                    var MineSweepItemTemplate = templateManager.GetTemplateByID('MineSweepItemTemplate', itemID);
                    if (null == MineSweepLevelTemplate) {
                        return mineInfo;
                    }
                    var itemDorp = {};
                    var dorpId = MineSweepItemTemplate['dropItemID'];
                    itemDorp[eMineSweepField.id] = itemID;
                    itemDorp[eMineSweepField.state] = eMineSweepField.state_0;
                    var attValue = MineSweepItemTemplate['attValue_Max'] - MineSweepItemTemplate['attValue_Min'];
                    if (attValue > 0) {
                        itemDorp[eMineSweepField.attValue] =
                        Math.floor(Math.random() * attValue) + MineSweepItemTemplate['attValue_Min'];
                    } else {
                        itemDorp[eMineSweepField.attValue] = 0;
                    }
                    var dropItemNum = MineSweepItemTemplate['dropItemNum_Max']
                                      - MineSweepItemTemplate['dropItemNum_Min'];
                    if (dropItemNum > 0) {
                        itemDorp[eMineSweepField.dropItemNum] =
                        Math.floor(Math.random() * dropItemNum) + MineSweepItemTemplate['dropItemNum_Min'];
                    } else {
                        itemDorp[eMineSweepField.dropItemNum] = 0;
                    }
                    var type = MineSweepItemTemplate['type'];
                    if (type == eMineSweepField.state_1) {
                        var baoXiang_item = getBaoXiangDropItemID(dorpId, player);
                        itemDorp[eMineSweepField.baoXiangItemID] = baoXiang_item[0].id;
                        itemDorp[eMineSweepField.dropItemNum] = baoXiang_item[0].num;
//                            itemDorp[eMineSweepField.baoXiangItemID] = dorpId;
                    } else {
                        itemDorp[eMineSweepField.baoXiangItemID] = 0;
                    }
//                        mineSweepItemDataArray.push(itemDorp);
                    var itemTop = utils.randomAtoB(0, 30);
                    while (mineSweepItemDataArray[itemTop]) {
                        itemTop = utils.randomAtoB(0, 30);
                    }
                    mineSweepItemDataArray[itemTop] = itemDorp;
                    itemNumList[index] = itemNumList[index] - 1;
                }
            }
        }
    }
    for (var gTop = 0; gTop < mineSweepItemDataArray.length; gTop++) {
        if (null == mineSweepItemDataArray[gTop]) {
            mineSweepItemDataArray[gTop] = {
                "id": 0,
                "state": 0,
                "attValue": 0,
                "dropItemNum": 0,
                "baoXiangItemID": 0
            }
        }
    }
    mineInfo['items'] = mineSweepItemDataArray;
    return mineInfo;
};

handler.VerifyMineSweepTemplate = function (mineDataInfo) {
    var mineSweepID = mineDataInfo['mineSweepID']
    if (!mineSweepID) {
        return false;
    }
    var MineSweepTemplate = templateManager.GetTemplateByID('MineSweepTemplate', mineSweepID);//根据关卡ID 获取当前难道关卡
    if (!mineSweepID) {
        return false;
    }
    var baoXiangID = MineSweepTemplate['baoXiangID'];
    if (!baoXiangID) {
        return false;
    }
    var mineSweepLevelID = mineDataInfo['mineSweepLevelID'];
    if (!mineSweepLevelID) {
        return false;
    }
    var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', mineSweepLevelID);//通过首层ID 获取当前层信息
    if (!MineSweepLevelTemplate) {
        return false;
    }
    var itemDropID = new Array(10);
    for (var d = 0; d < 10; d++) {
        itemDropID[d] = MineSweepLevelTemplate['itemID_' + d];//获取掉落类型
    }
    var itemsTop = [];
    for (var s = 0; s < 30; s++) {
        var id = mineDataInfo['items'][s].id;
        if (id > 0) {
            for (var index = 0; index < 10; index++) {
                if (id == itemDropID[index]) {
                    itemsTop[s] = true;
                }
            }
            if (!itemsTop[s]) {
                itemsTop[s] = false;
            }
        } else {
            itemsTop[s] = true;
        }
    }
    for (var i in itemsTop) {
        if (!itemsTop[i]) {
            return false;
        }
    }
    return true;
};

handler.getCdTime = function (mineDataInfo) {
    var mineSweepLevelID = mineDataInfo['mineSweepLevelID'];
    if (!mineSweepLevelID) {
        return false;
    }
    var MineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', mineSweepLevelID);//通过首层ID 获取当前层信息
    if (!MineSweepLevelTemplate) {
        return false;
    }
    var cdTime = MineSweepLevelTemplate['cdTime'];
    return cdTime;
};

handler.copyMineInfo =  function(mineInfo) {
    var tempInfo = {};

    tempInfo[eMineSweepField.mineSweepID] = +mineInfo[eMineSweepField.mineSweepID];
    tempInfo[eMineSweepField.mineSweepLevelID] = +mineInfo[eMineSweepField.mineSweepLevelID];
    tempInfo[eMineSweepField.maxHp] = +mineInfo[eMineSweepField.maxHp];
    tempInfo[eMineSweepField.currentHp] = +mineInfo[eMineSweepField.currentHp];
    tempInfo[eMineSweepField.leftTimes] = +mineInfo[eMineSweepField.leftTimes];
    tempInfo[eMineSweepField.leftReviveTimes] = +mineInfo[eMineSweepField.leftReviveTimes];
    tempInfo[eMineSweepField.cdTime] = +mineInfo[eMineSweepField.cdTime];
    tempInfo[eMineSweepField.passCdTime] = mineInfo[eMineSweepField.passCdTime];
    tempInfo[eMineSweepField.baoXiang_ClearLevel] = +mineInfo[eMineSweepField.baoXiang_ClearLevel];
    tempInfo[eMineSweepField.baoXiang_KillAll] = +mineInfo[eMineSweepField.baoXiang_KillAll];
    tempInfo[eMineSweepField.items] = copyMineSweepItemDate(mineInfo[eMineSweepField.items]);
    tempInfo[eMineSweepField.times] = +mineInfo[eMineSweepField.times];

    return tempInfo;
};

function copyMineSweepItemDate(mineSweepItemDate) {
    var mineList = [];
    for (var index in mineSweepItemDate) {
        var mineItem = {};
        mineItem[eMineSweepField.id] = mineSweepItemDate[index][eMineSweepField.id];
        mineItem[eMineSweepField.state] = mineSweepItemDate[index][eMineSweepField.state];
        mineItem[eMineSweepField.attValue] = mineSweepItemDate[index][eMineSweepField.attValue];
        mineItem[eMineSweepField.dropItemNum] = mineSweepItemDate[index][eMineSweepField.dropItemNum];
        mineItem[eMineSweepField.baoXiangItemID] = mineSweepItemDate[index][eMineSweepField.baoXiangItemID];
        mineList.push(mineItem);
    }
    return mineList;
};

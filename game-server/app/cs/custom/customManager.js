/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-22
 * Time: 下午5:33
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var _ = require('underscore');

var eCustomInfo = gameConst.eCustomInfo;
var eLevelTarget = gameConst.eLevelTarget;
var tCustom = templateConst.tCustom;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eGiftType = gameConst.eGiftType;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eTableTypeInfo = gameConst.eTableTypeInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var eItemInfo = gameConst.eItemInfo;
var log_utilSql = require('../../tools/mysql/utilSql');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var custom = require('./custom');
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.dataList = new Array(eLevelTarget.Max);
    this.activityFlag = [       //运营活动翻倍 经验 金币 魂魄
        {
            'flag': false,      //是否开启
            'double': 1         // 倍数
        },
        {
            'flag': false,
            'double': 1
        },
        {
            'flag': false,
            'double': 1,
            'soul': [1004, 1005, 1006, 1007, 1008]
        }
    ];
    this.canGetItemFlag = false;
};

var handler = Handler.prototype;

handler.UpdateCustom12Info = function () {
//    logger.warn('UpdateCustom12Info roleID: %j, dataList: %j', player.id, this.dataList);
    for (var index in this.dataList) {
        var tempList = this.dataList[index];
        for (var listIndex in tempList) {
            tempList[listIndex].SetCustomInfo(eCustomInfo.NUM, 0);
        }
    }
    this.SendCustomMsg();
};

handler.IsFull = function (customID, levelTarget) {
    var tempList = this.dataList[levelTarget];
    if (null == tempList) {
        return 0;
    }
    var tempCustom = tempList[customID];
    if (null == tempCustom) {
        return 0;
    }
    var customTemplate = tempCustom.GetTemplate();
    if (null == customTemplate) {
        return 1;
    }

    if (customTemplate[tCustom.customNum] == -1) {
        return 0;
    }
    if (tempCustom.GetCustomInfo(eCustomInfo.NUM) < customTemplate[tCustom.customNum]) {
        return 0;
    }

    return 2;
};

/**
 * @return {number}
 */
handler.GetMaxWinCustomID = function (levelTarget) {
    var self = this;

    var tempList = this.dataList[levelTarget];

    var idList = _.keys(tempList).sort();

    for (var i = idList.length - 1; i >= 0; --i) {
        if (self.IsWin(idList[i], levelTarget) === 0) {
            return idList[i];
        }
    }

    return 0;
};

/**
 * @return {number}
 */
handler.IsWin = function (customID, levelTarget) {
    var tempList = this.dataList[levelTarget];
    if (null == tempList) {
        return 1;
    }
    var tempCustom = tempList[customID];
    if (null == tempCustom) {
        return 1;
    }
    var customTemplate = tempCustom.GetTemplate();
    if (null == customTemplate) {
        return 1;
    }

    if (tempCustom.GetCustomInfo(eCustomInfo.WIN) >= 1) {
        return 0;
    }

    return 1;
};

handler.LoadDataByDB = function (dataList) {
    for (var index in dataList) {
        var customID = dataList[index][eCustomInfo.AREAID];
        var levelTarget = dataList[index][eCustomInfo.LevelTarget];
        var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
        if (customTemplate != null) {
            var temp = new custom(customTemplate);
            temp.SetCustomAllInfo(dataList[index]);
            if (null == this.dataList[levelTarget]) {
                this.dataList[levelTarget] = {};
            }
            this.dataList[levelTarget][customID] = temp;
        }
    }
};

handler.AddCustom = function (customID, levelTarget) {
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (customTemplate == null) {
        return;
    }
    var customType = customTemplate[templateConst.tCustom.smallType];
    // 特殊关卡特殊处理
    if(IsSpecialCustom(customType)){
        return;
    }

    /** 如果是爬塔 给 climbManage 添加 customID 进行后续验证*/
    if (isClimbCustom(customType)) {
        this.owner.GetClimbManager().addEnterCustomTag(customID);
    }

    if (null == this.dataList[levelTarget]) {
        this.dataList[levelTarget] = {}
    }
    var tempList = this.dataList[levelTarget];
    var oldCustom = tempList[customID];
    if (null == oldCustom) {
        var customInfo = createCustom(customID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) , levelTarget);
        var newCustom = new custom();
        newCustom.SetTemplate(customTemplate);
        newCustom.SetCustomAllInfo(customInfo);
        tempList[customID] = newCustom;
    }
    else {
        var newNum = oldCustom.GetCustomInfo(eCustomInfo.NUM) + 1;
        oldCustom.SetCustomInfo(eCustomInfo.NUM, newNum);
    }
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.TakePvp, customID, 1);
    this.SendCustomMsg(levelTarget, customID);
};

handler.AddSpecialCustom = function (customID, levelTarget) {
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (customTemplate == null) {
        return;
    }
    var customType = customTemplate[templateConst.tCustom.smallType];

    // 特殊关卡特殊处理
    if(IsSpecialCustom(customType) == false){
        return;
    }

    if (null == this.dataList[levelTarget]) {
        this.dataList[levelTarget] = {}
    }
    var tempList = this.dataList[levelTarget];
    var oldCustom = tempList[customID];
    if (null == oldCustom) {
        var customInfo = createCustom(customID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID) , levelTarget);
        var newCustom = new custom();
        newCustom.SetTemplate(customTemplate);
        newCustom.SetCustomAllInfo(customInfo);
        tempList[customID] = newCustom;
    }
    else {
        var newNum = oldCustom.GetCustomInfo(eCustomInfo.NUM) + 1;
        oldCustom.SetCustomInfo(eCustomInfo.NUM, newNum);
    }
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.TakePvp, customID, 1);
    if (customType == gameConst.eCustomSmallType.Activity) {
        this.SendSomeCustom(this.dataList[eLevelTarget.Activity], 'ServerActivityCustom');
    } else {
        this.SendCustomMsg(levelTarget, customID);
    }
};

handler.GetCustom = function (customID, levelTarget) {
    if (null == this.dataList[levelTarget]) {
        return null;
    }
    return this.dataList[levelTarget][customID];
};

handler.GetCustoms = function(levelTarget){
    if(null == this.dataList[levelTarget]){
        return null;
    }

    return this.dataList[levelTarget];
};

handler.GetSqlStr = function (roleID) {

    var rows = [];

    var customInfo = '';
    for (var index in this.dataList) {
        var tempList = this.dataList[index];
        for (var listIndex in tempList) {
            var temp = tempList[listIndex];
            customInfo += '(';

            var row = [];

            for (var i = 0; i < eCustomInfo.MAX; ++i) {
                var value = temp.GetCustomInfo(i);
                if (typeof  value == 'string') {
                    customInfo += '\'' + value + '\'' + ',';
                }
                else {
                    customInfo += value + ',';
                }

                row.push(value);
            }
            customInfo = customInfo.substring(0, customInfo.length - 1);
            customInfo += '),';

            rows.push(row);
        }
    }
    customInfo = customInfo.substring(0, customInfo.length - 1);
//    return customInfo;
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== customInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, customInfo);
    }

    return sqlString;
};

handler.GetCustomPrize = function (customID) {
    var levelTarget = eLevelTarget.Normal;
    var tempList = this.dataList[levelTarget];
    if (null == tempList) {
        return errorCodes.Cs_NoCustom;
    }
    var tempCustom = tempList[customID];
    if (null == tempCustom) {
        return errorCodes.Cs_NoCustom;
    }
    var isGet = tempCustom.GetCustomInfo(eCustomInfo.Prize);
    if (0 != isGet) {
        return errorCodes.Cs_GetCustom
    }
    var CustomTemplate = tempCustom.GetTemplate();
    var prizeNum = CustomTemplate[tCustom.prizeNum];

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemGuid = log_getGuid.GetUuid();
    var log_roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var log_addTime = log_utilSql.DateToString(new Date());
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    for (var i = 0; i < prizeNum; ++i) {
        var itemID = CustomTemplate['prizeID_' + i];
        var itemNum = CustomTemplate['prizeNum_' + i];
        var log_ItemList = this.owner.AddItem(itemID, itemNum, eAssetsAdd.HellScoreBox, 0);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        for (var j in log_ItemList) {
            var log_ItemArgs = [log_ItemGuid];
            var tempItem = log_ItemList[j];
            for (var k = 0; k < eItemInfo.Max; ++k) {      //将物品的详细信息插入到sql语句中
                log_ItemArgs.push(tempItem.GetItemInfo(k));
            }
            log_ItemArgs.push(gameConst.eItemChangeType.GETCUSTOMPRIZE);
            log_ItemArgs.push(gameConst.eEmandationType.ADD);
            log_ItemArgs.push(log_addTime);
            log_insLogSql.InsertSql(eTableTypeInfo.ItemChange, log_ItemArgs);
            //logger.info( '获取关卡奖品物品变化 数据入库成功' );
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
    tempCustom.SetCustomInfo(eCustomInfo.Prize, 1);
    this.SendCustomMsg( levelTarget, customID);
    return 0;
};

handler.SendSomeCustom = function (customs, route) {
    if (route == null || route.length == 0) {
        return;
    }
    var customMsg = {
        customList: []
    };
    for (var index in customs) {
        var temp = customs[index];
        if (null == temp) {
            continue;
        }

        customMsg.customList.push(temp.toMessage());
    }
    this.owner.SendMessage(route, customMsg);
};

handler.AddAchieveGift = function(){
    var customs = this.dataList[eLevelTarget.StoryDrak];
    for (var index in customs) {
        var temp = customs[index];
        if (null == temp) {
            continue;
        }

        var customTemplate = temp.GetTemplate();

        var scoreGift = templateManager.GetTemplateByID('GiftTemplate', customTemplate['giftID']);
        if(scoreGift == null){
            continue;
        }

        this.owner.GetGiftManager().AddGift(+customTemplate['giftID'], eGiftType.StoryDrak, temp.GetCustomInfo(eCustomInfo.SCO));
    }
};

handler.SendCustomMsg = function ( levelTarget, index) {
    this.AddAchieveGift();
    var routeList = {};
    routeList[eLevelTarget.Normal] = 'ServerNormalCustom';
    routeList[eLevelTarget.Activity] = 'ServerActivityCustom';
    routeList[eLevelTarget.ZhanHun] = 'ServerPvPCustom';
    routeList[eLevelTarget.FaBao] = 'ServerFaBaoCustom';
    routeList[eLevelTarget.Train] = 'ServerTrainCustom';
    routeList[eLevelTarget.TeamDrak] = 'ServerTeamDrakCustom';
    routeList[eLevelTarget.Coliseum] = 'SendColiseumUpdate';
    routeList[eLevelTarget.StoryDrak] = 'SendStoryDrakCustom';
    routeList[eLevelTarget.marry] = 'SendMarryCustom';
    routeList[eLevelTarget.worldBoss] = 'SendWorldBossCustom';

    if (null == levelTarget && null == index) {
        this.SendSomeCustom(this.dataList[eLevelTarget.Normal], routeList[eLevelTarget.Normal]);
        this.SendSomeCustom(this.dataList[eLevelTarget.Activity], routeList[eLevelTarget.Activity]);
        this.SendSomeCustom(this.dataList[eLevelTarget.ZhanHun], routeList[eLevelTarget.ZhanHun]);
        this.SendSomeCustom(this.dataList[eLevelTarget.FaBao], routeList[eLevelTarget.FaBao]);
        this.SendSomeCustom(this.dataList[eLevelTarget.Train], routeList[eLevelTarget.Train]);
        this.SendSomeCustom(this.dataList[eLevelTarget.TeamDrak], routeList[eLevelTarget.TeamDrak]);
        this.SendSomeCustom(this.dataList[eLevelTarget.Coliseum], routeList[eLevelTarget.Coliseum]);
        this.SendSomeCustom(this.dataList[eLevelTarget.marry], routeList[eLevelTarget.marry]);
        this.SendSomeCustom(this.dataList[eLevelTarget.StoryDrak], routeList[eLevelTarget.StoryDrak]);
        this.SendSomeCustom(this.dataList[eLevelTarget.worldBoss], routeList[eLevelTarget.worldBoss]);
        return;
    }
    var tempList = this.dataList[levelTarget];
    if (null == tempList) {
        return;
    }
    if (null == index) {
        this.SendSomeCustom(tempList, routeList[levelTarget]);
        return;
    }
    this.SendSomeCustom([tempList[index]], routeList[levelTarget]);
};

handler.OpenOneCustom = function (customID, roleID, levelTarget) {        //开启指定的一个关卡
    if (null == customID || 0 == customID) {
        return;
    }
    if (null == this.dataList[levelTarget]) {
        this.dataList[levelTarget] = {}
    }
    var tempList = this.dataList[levelTarget];
    var oldCustom = tempList[customID];
    if (null == oldCustom) {
        var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
        if (customTemplate == null) {
            return;
        }
        var customInfo = createCustom(customID, roleID , levelTarget);
        customInfo[eCustomInfo.WIN] = 1;
        var newCustom = new custom();
        newCustom.SetTemplate(customTemplate);
        newCustom.SetCustomAllInfo(customInfo);
        tempList[customID] = newCustom;
    }
};

handler.ClearCustomInfo = function () {    //清楚关卡数据
    for (var index in this.dataList) {
        this.dataList[index] = null;
    }
};

handler.SetActivityInfo = function (type, flag, multiple) { //设置运营活动翻倍信息
    this.activityFlag[type].flag = flag;
    this.activityFlag[type].double = multiple;
};

handler.GetActivityInfo = function () { //获取运营活动翻倍信息
    return this.activityFlag;
};

handler.GetItemFlag = function () {     //获取是否可以获取关卡物品标志位
    return this.canGetItemFlag;
};

handler.SetItemFlag = function (flag) {     //设置是否可以获取关卡物品标志位
    this.canGetItemFlag = flag;
};


// 是否结束关卡后才扣次数
IsSpecialCustom = function (customType) {
    if (customType == gameConst.eCustomSmallType.Team ||
        customType == gameConst.eCustomSmallType.Activity ||
        customType == gameConst.eCustomSmallType.Train ||
        customType == gameConst.eCustomSmallType.TeamDrak ||
        customType == gameConst.eCustomSmallType.StoryDrak) {
        return true;
    }

    return false;
};

/**
 * @Brief: 判断是否爬塔
 * -------------------
 *
 * @param {Number} customType 副本类型
 * @return Boolean
 * */
isClimbCustom = function (customType) {
    return customType == gameConst.eCustomSmallType.Climb;
};

function createCustom(customID, roleID, levelTarget){
    var customInfo = new Array(eCustomInfo.MAX);
    customInfo[eCustomInfo.AREAID] = customID;
    customInfo[eCustomInfo.NUM] = 1;
    customInfo[eCustomInfo.ROLEID] = roleID;
    customInfo[eCustomInfo.SCO] = 0;
    customInfo[eCustomInfo.WIN] = 0;
    customInfo[eCustomInfo.Prize] = 0;
    customInfo[eCustomInfo.LevelTarget] = levelTarget;
    customInfo[eCustomInfo.StarNum] = 0;
    customInfo[eCustomInfo.Achieve] = 0;

    return customInfo;
}
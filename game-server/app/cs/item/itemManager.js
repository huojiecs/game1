/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 上午10:15
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var item = require('./item');
var itemDrop = require('./itemDrop');
var itemLogic = require('./itemLogic');
var gameConst = require('../../tools/constValue');
var guidManager = require('../../tools/guid');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var defaultValues = require('../../tools/defaultValues');
var playerManager = require('../player/playerManager');
var constValue = require('../../tools/constValue');
var utilSql = require('../../tools/mysql/utilSql');
var _ = require('underscore');
var eAttFactor = gameConst.eAttFactor;
var errorCodes = require('../../tools/errorCodes');

var eItemInfo = gameConst.eItemInfo;
var eBagPos = gameConst.eBagPos;
var eItemOperType = gameConst.eItemOperType;
var tItem = templateConst.tItem;
var tNotice = templateConst.tNotice;
var ePlayerInfo = gameConst.ePlayerInfo;
var eItemType = gameConst.eItemType;
var tIntensify = templateConst.tIntensify;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.itemDrop = new itemDrop(owner);
    this.itemList = {};
    this.callbackList = [];
    this.strengthenList = [];
    this.inlayList = [];
    this.addAttList = new Array(gameConst.eAttInfo.MAX);
    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        this.addAttList[i] = temp;
    }
};

var handler = Handler.prototype;

handler.AddItem = function (itemGuid, item) {
    this.itemList[itemGuid] = item;
};

handler.DeleteItem = function (itemGuid) {
    delete this.itemList[itemGuid];
};

handler.GetBagNum = function (bagType) {
    var itemNum = 0;
    for (var index in this.itemList) {
        var item = this.itemList[index];
        if (item.GetItemInfo(eItemInfo.BAGTYPE) == bagType) {
            itemNum += 1;
        }
    }
    return itemNum;
};

/**
 * 获取装备信息
 * @return {Array}
 * */
handler.GetEquipInfo = function () {
    var itemInfo = [];
    for (var index in this.itemList) {
        var item = this.itemList[index];
        if (item.GetItemInfo(eItemInfo.BAGTYPE) == gameConst.eBagPos.EquipOn) {
            itemInfo.push(item.GetAllInfo());
        }
    }
    return itemInfo;
};

handler.IsFull = function (bagType) {
    var itemNum = this.GetBagNum(bagType);
    var itemNum_shen = this.GetBagNum(gameConst.eBagPos.EquipOn);
    //logger.info('itemNum_shen = ' + itemNum_shen );
    if ((itemNum + itemNum_shen) >= defaultValues.equipBagNum) {
        return true;
    }
    return false;
};

handler.IsFullEx = function (bagType) {
    var itemNum = this.GetBagNum(bagType);
    var itemNum_shen = this.GetBagNum(gameConst.eBagPos.EquipOn);
    //logger.info('itemNum_shen = ' + itemNum_shen );
    if ((itemNum + itemNum_shen) >= defaultValues.equipBagNumEx) {
        return true;
    }
    return false;
};

handler.GetItem = function (itemGuid) {
    return this.itemList[itemGuid];
};

handler.GetAllItem = function () {
    return this.itemList;
};

handler.GetSqlStr = function () {
    var sqlStr = '';
    for (var index in this.itemList) {
        var oldItem = this.itemList[index];
        sqlStr += '(';
        for (var i = 0; i < eItemInfo.Max; ++i) {
            var value = oldItem.GetItemInfo(i);
            if (typeof  value == 'string') {
                sqlStr += '\'' + value + '\'';
                sqlStr += ',';
            }
            else {
                sqlStr += value;
                sqlStr += ',';
            }
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr += '),';
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);

    var sqlString = utilSql.BuildSqlStringFromObjects(this.itemList, 'GetItemInfo', eItemInfo);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;
};

/**
 * @return {null}
 */
handler.CreateItemInfo = function (roleId, jobType, tempID) {
    var self = this;

    var jobTempID = Math.floor(tempID / defaultValues.itemBeginNum);
    if (jobType != jobTempID) {
        var tempNum = tempID % defaultValues.itemBeginNum;
        tempID = jobType * defaultValues.itemBeginNum + tempNum;
    }

    var itemTemp = templateManager.GetTemplateByID('ItemTemplate', tempID);
    if (!itemTemp) {
        logger.error('CreateItem 没有这个物品 tempID: %s', tempID);
        return null;
    }

    //var newGuid = guidManager.GetItemID();
    var itemInfo = new Array(eItemInfo.Max);
    for (var i = 0; i < eItemInfo.Max; ++i) {
        itemInfo[i] = 0;
    }

    itemInfo[eItemInfo.TEMPID] = tempID;
    itemInfo[eItemInfo.ROLEID] = roleId;
    itemInfo[eItemInfo.NUM] = 1;

    var starValue = 0;
    var randomtotal = 0;
    for (var i = 0; i < 4; ++i) {
        var baseValue = itemTemp[ 'baseValue_' + i];
        var randomValue = itemTemp[ 'randomValue_' + i];
        var value = baseValue + Math.floor(Math.random() * randomValue);
        var attIndex = itemTemp[ 'baseAtt_' + i];
        if (value > 0) {
            itemInfo[ eItemInfo.ATTACK + attIndex ] = value;
        }
        if (randomValue <= 0) {
            continue;
        }
        value -= baseValue;
        switch (attIndex + eItemInfo.ATTACK) {
            case eItemInfo.ATTACK:
            { //攻击
                starValue += value * gameConst.eAttFactor.GONGJI;
                randomtotal += randomValue * gameConst.eAttFactor.GONGJI;
            }
                break;
            case eItemInfo.DEFENCE:
            { //防御
                starValue += value * gameConst.eAttFactor.FANGYU;
                randomtotal += randomValue * gameConst.eAttFactor.FANGYU;
            }
                break;
            case eItemInfo.ITEMINFO_MAXHP:
            { //最大血量
                starValue += value * gameConst.eAttFactor.MAXHP;
                randomtotal += randomValue * gameConst.eAttFactor.MAXHP;
            }
                break;
            case eItemInfo.ITEMINFO_MAXMP:
            { //最大魔法量
                starValue += value * gameConst.eAttFactor.MAXMP;
                randomtotal += randomValue * gameConst.eAttFactor.MAXMP;
            }
                break;
            case eItemInfo.ITEMINFO_CRIT:
            { //暴击值
                starValue += value * gameConst.eAttFactor.BAOJILV;
                randomtotal += randomValue * gameConst.eAttFactor.BAOJILV;
            }
                break;
            case eItemInfo.ITEMINFO_ANTICRIT:
            { //暴击抵抗
                starValue += value * gameConst.eAttFactor.BAOJIDIKANG;
                randomtotal += randomValue * gameConst.eAttFactor.BAOJIDIKANG;
            }
                break;
        }
    }

    //计算星级
    var star = starValue / randomtotal;
    star = Math.round(star * 10) / 10;  //对计算结果小数点后第二位做四舍五入处理
    if (star < 0.2) {
        itemInfo[eItemInfo.ItemStar] = 1;
    }
    else if (star < 0.4) {
        itemInfo[eItemInfo.ItemStar] = 2;
    }
    else if (star < 0.6) {
        itemInfo[eItemInfo.ItemStar] = 3;
    }
    else if (star < 0.8) {
        itemInfo[eItemInfo.ItemStar] = 4;
    }
    else {
        itemInfo[eItemInfo.ItemStar] = 5;
    }

    for (var i = 0; i < 4; ++i) {
        var baseValue = itemTemp[ 'baseAdd_' + i];
        var randomValue = itemTemp[ 'randomAdd_' + i];
        var value = baseValue + Math.floor(Math.random() * randomValue);
        var attIndex = itemTemp[ 'addAtt_' + i];
        if (value > 0) {
            itemInfo[ eItemInfo.ATTACK + attIndex ] = value;
        }
    }

    itemInfo[ eItemInfo.ZHANLI ] = this.GetItemZhanli(itemTemp[ tItem.baseZhanli], 0, 0);
    itemInfo[eItemInfo.GUID] = guidManager.GetUuid();

    return itemInfo;
};

/**
 * @return {null}
 */
handler.CreateItem = function ( tempID) {

    var self = this;

    if (null == this.owner || tempID <= 0) {
        return null;
    }
    var roleID = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var nowDate = new Date().getTime();
    var canGetProfitTime = playerManager.GetForbidProfitTime(roleID);
    if (nowDate < canGetProfitTime) {
        logger.warn('Can not to obtain the proceeds of time, roleID: %j, nowDate: %j, canGetProfitTime: %j, tempID: %j',
                    roleID, utilSql.DateToString(new Date(nowDate)), utilSql.DateToString(new Date(canGetProfitTime)),
                    tempID);
        return null;
    }
    ///////////////////
    // 这块注意： 因为第四个职位开始，职业ID和 装备ID的职业编号位 没有对上
    // 所以jobtype 从2以后开始要加上6, 2之前的不变
    var jobType = this.owner.GetJobType();
    var CareerMarkOfEquip = jobType + 1;
    if(CareerMarkOfEquip > 3) {
        CareerMarkOfEquip += 6;
    }
    ////////////////////
    var itemInfo = self.CreateItemInfo(this.owner.id, CareerMarkOfEquip, tempID);

    if (!itemInfo) {
        return null;
    }

    var itemTemp = templateManager.GetTemplateByID('ItemTemplate', itemInfo[eItemInfo.TEMPID]);
    if (!itemTemp) {
        logger.error('CreateItem 没有这个物品 tempID: %s', tempID);
        return null;
    }

    var newItem = new item(itemInfo, itemTemp);
    self.AddItem(itemInfo[eItemInfo.GUID], newItem);
    // for tlog
    var openID = this.owner.GetOpenID();
    var accountType = this.owner.GetAccountType();
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
    var itemTemplate = templateManager.GetTemplateByID('ItemTemplate', tempID);
    var color = itemTemplate['color'];
    if (_.contains([eItemType.Armor, eItemType.Weapon, eItemType.Jewelry], itemTemplate['itemType'])) {
        tlogger.log('EquipChangeFlow', accountType, openID, expLevel, vipLevel, tempID, color, 0);
    }
    return newItem;
};


handler.LoadDataByDB = function ( itemInfo, Len, callback) {
    for (var i = 0; i < Len; ++i) {
        var guid = itemInfo[i][eItemInfo.GUID];
        var tempID = itemInfo[i][eItemInfo.TEMPID];
        var itemTemp = templateManager.GetTemplateByID('ItemTemplate', tempID);
        if (itemTemp) {
            var itemDB = new item(itemInfo[i], itemTemp);
            this.AddItem(guid, itemDB);
            if (itemInfo[i][eItemInfo.BAGTYPE] == eBagPos.EquipOn) {
                if (callback == null) {
                    itemLogic.EquipOn(this.owner, guid, false);
                }
                else {
                    callback(itemLogic, this.owner.id, guid, itemDB);
                }
            }
        }
    }
};


//加载套装数据
handler.LoadSuitDataByDB = function (suitData) {
    var self = this;
//    if(null != suitData)
    // var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    if (null != suitData) {
        var tempList = suitData.strengthen;
        var tempInlayList = suitData.inlay;
        for (var attID in tempList) {
            if (null != tempList[attID]) {
                this.strengthenList[attID] = tempList[attID];
            }
        }
        for (var id in tempInlayList) {
            if (null != tempInlayList[id]) {
                this.inlayList[id] = tempInlayList[id];
            }
        }
        self.CalAtt( true, 0, false);
        self.CalInlayAtt( true, 0, false);

    }
};


handler.GetSqlStrForSuit = function (roleID) {
    var sqlStr = '';
    sqlStr += '(';
    sqlStr += roleID + ',';
    sqlStr += '\'' + JSON.stringify(this.strengthenList) + '\'' + ',';
    sqlStr += '\'' + JSON.stringify(this.inlayList) + '\'' + ',';
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
    sqlStr += ')';
    return sqlStr;
};


//发送装备套装强化
handler.SendSuitAcitveState = function () {
    var route = "ServerSuitAcitveState";
    var minAttID = 1001;
    var msg = {
        suitAcitveState: []
    };
    // state: 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
    var suitTemplate = templateManager.GetAllTemplate('SuitTemplate');
    if (null == this.strengthenList || this.strengthenList.length == 0) {
        for (var attID in suitTemplate) {
            var tempTemplate = suitTemplate[attID];
            if (tempTemplate['type'] == 0) {
                var suitState = {
                    attID: tempTemplate['attID'],
                    state: 0
                };
                if (suitState.attID === minAttID) {
                    suitState.state = 1;
                }
                msg.suitAcitveState.push(suitState);
            }
        }
    }
    else {
        for (var id in this.strengthenList) {
            msg.suitAcitveState.push(this.strengthenList[id]);
        }
    }
    this.strengthenList = msg.suitAcitveState;
    this.owner.SendMessage(route, msg);
};

//发送装备套装镶嵌
handler.SendInlayAcitveState = function () {
    var route = "ServerInlayAcitveState";
    var minAttID = 2001;
    var msg = {
        suitAcitveState: []
    };
    // state: 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
    var suitTemplate = templateManager.GetAllTemplate('SuitTemplate');
    if (null == this.inlayList || this.inlayList.length == 0) {
        for (var attID in suitTemplate) {
            var tempTemplate = suitTemplate[attID];
            if (tempTemplate['type'] == 1) {
                var suitState = {
                    attID: tempTemplate['attID'],
                    state: 0
                };
                if (suitState.attID === minAttID) {
                    suitState.state = 1;
                }
                msg.suitAcitveState.push(suitState);
            }
        }
    }
    else {
        for (var id in this.inlayList) {
            msg.suitAcitveState.push(this.inlayList[id]);
        }
    }
    this.inlayList = msg.suitAcitveState;
    this.owner.SendMessage(route, msg);
};

//激活套装  // state: 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
handler.ActivateSuitState = function ( attID, type) {
    var self = this;
    var openID = this.owner.GetOpenID();
    var accountType = this.owner.GetAccountType();
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.vipLevel);
    var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', attID);

    var attIDReduce = 0;
    if (type === 0) { //强化
        for (var id in this.strengthenList) {
            if (this.strengthenList[id].state == 2) {
                attIDReduce = this.strengthenList[id].attID;
            }
        }
        if (attIDReduce > 0) {
            self.AddBaseAtt( attIDReduce, false, true);
        }
        for (var id in this.strengthenList) {
            if (this.strengthenList[id].attID < attID) {
                this.strengthenList[id].state = 1;
            }
            if (this.strengthenList[id].attID == attID) {
                attIDReduce = attID;
                this.strengthenList[id].state = 2;
            }
            if (null != this.strengthenList[id] && this.strengthenList[id].attID == attID + 1) {
                this.strengthenList[id].state = 1;
            }
            if (this.strengthenList[id].attID > attID && this.strengthenList[id].state == 2) {
                this.strengthenList[id].state = 1;
            }
        }
        self.AddBaseAtt( attID, true, true);
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveEnhanceSuitID, attID);
        self.SendSuitAcitveState();
        // tlog
        tlogger.log('IntensifySuitFlow', accountType, openID, expLevel, vipLevel, 1, suitTemplate['color']);
    }
    else if (type === 1) {    //镶嵌
        for (var id in this.inlayList) {
            if (this.inlayList[id].state == 2) {
                attIDReduce = this.inlayList[id].attID;
            }
        }
        if (attIDReduce > 0) {
            self.AddYanShengAtt( attIDReduce, false, true, 1); //减去原来(上一次)激活的装备衍生属性
        }
        for (var id in this.inlayList) {
            if (this.inlayList[id].attID < attID) {
                this.inlayList[id].state = 1;
            }
            if (this.inlayList[id].attID == attID) {
                this.inlayList[id].state = 2;
            }
            if (null != this.inlayList[id] && this.inlayList[id].attID == attID + 1) {
                this.inlayList[id].state = 1;
            }
            if (this.inlayList[id].attID > attID && this.inlayList[id].state == 2) {
                this.inlayList[id].state = 1;
            }
        }
        self.AddYanShengAtt( attID, true, true, 1); //增加装备衍生属性
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveInsetSuitID, attID);
        self.SendInlayAcitveState();
        // tlog
        tlogger.log('InlaySuitFlow', accountType, openID, expLevel, vipLevel, 1, suitTemplate['color']);
    }
    return 0;
};
//取消激活 state: 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
handler.CancelActivateState = function ( attID, type) {
    var self = this;
    var openID = this.owner.GetOpenID();
    var accountType = this.owner.GetAccountType();
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
    var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', attID);

    if (type === 0) { //强化取消激活
        for (var id in this.strengthenList) {
            if (this.strengthenList[id].attID == attID && this.strengthenList[id].state == 2) {
                this.strengthenList[id].state = 1;
                break;
            }
        }
        self.AddBaseAtt( attID, false, true);
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveEnhanceSuitID, 0);
        self.SendSuitAcitveState();
        // tlog
        tlogger.log('IntensifySuitFlow', accountType, openID, expLevel, vipLevel, 0, suitTemplate['color']);
    }
    else if (type === 1) {    //镶嵌取消激活
        for (var id in this.inlayList) {
            if (this.inlayList[id].attID == attID && this.inlayList[id].state == 2) {
                this.inlayList[id].state = 1;
                break;
            }
        }
        self.AddYanShengAtt( attID, false, true, 1); //减装备衍生属性
        //self.CalAtt(this.owner, false,attID); //减战力
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveInsetSuitID, 0);
        self.SendInlayAcitveState();
        // tlog
        tlogger.log('InlaySuitFlow', accountType, openID, expLevel, vipLevel, 0, suitTemplate['color']);
    }
    return 0;
};


handler.GetStateByAttID = function (attID, type) {
    if (type === 0) {
        for (var id in this.strengthenList) {
            if (this.strengthenList[id].attID == attID) {
                return this.strengthenList[id].state;
            }
        }
    }
    else if (type === 1) {
        for (var id in this.inlayList) {
            if (this.inlayList[id].attID == attID) {
                return this.inlayList[id].state;
            }
        }
    }
};

//换装备或摘除灵石时更新激活状态  state: 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
handler.UpdateStateWhenChangeEquip = function ( type, newEquip, oldEquip) {
    var self = this;
    if (type === 0) {//装备有更新
        //判断装备强化等级
        var strengthenLevel = 0;
        for (var index in this.itemList) {
            var item = this.itemList[index];
            if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
                strengthenLevel += item.GetItemInfo(eItemInfo.Intensify);
            }
        }
        for (var index in  this.strengthenList) {
            if (this.strengthenList[index].state == 2) {
                var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', this.strengthenList[index].attID);
                self.AddBaseAtt( this.strengthenList[index].attID, false, true, oldEquip, newEquip);
                if (strengthenLevel < suitTemplate['limit']) {
                    this.strengthenList[index].state = 1;
                    this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveEnhanceSuitID, 0);
                }
                else {
                    self.AddBaseAtt( this.strengthenList[index].attID, true, true, oldEquip, newEquip);
                }
            }
        }
        self.SendSuitAcitveState();

        //判断装备灵石镶嵌
        var starLevel = 0;
        for (var index in this.itemList) {
            var item = this.itemList[ index ];
            if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
                var assetTemplate = templateManager.GetTemplateByID('AssetsTemplate',
                                                                    item.GetItemInfo(eItemInfo.STAR0));
                if (null != assetTemplate) {
                    starLevel += assetTemplate['starLevel'];
                }
            }
        }
        for (var index in  this.inlayList) {
            if (this.inlayList[index].state == 2) {
                self.AddYanShengAtt( this.inlayList[index].attID, false, true, type, oldEquip, newEquip);
                var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', this.inlayList[index].attID);
                if (starLevel < suitTemplate['limit']) {
                    this.inlayList[index].state = 1;
                    this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveInsetSuitID, 0);
                } else {
                    self.AddYanShengAtt( this.inlayList[index].attID, true, true, 1);
                }
            }
        }
        self.SendInlayAcitveState();
    }
    else if (type === 1) { //镶嵌
        var starLevel = 0;
        for (var index in this.itemList) {
            var item = this.itemList[index];
            if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
                var assetTemplate = templateManager.GetTemplateByID('AssetsTemplate',
                                                                    item.GetItemInfo(eItemInfo.STAR0));
                if (null != assetTemplate) {
                    starLevel += assetTemplate['starLevel'];
                }
            }
        }
        for (var index in  this.inlayList) {
            if (this.inlayList[index].state == 2) {
                var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', this.inlayList[index].attID);
                if (starLevel < suitTemplate['limit']) {
                    self.AddYanShengAtt( this.inlayList[index].attID, false, true, 1); //减装备衍生属性
                    this.inlayList[index].state = 1;
                    this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveInsetSuitID, 0);
                }
            }
        }
        self.SendInlayAcitveState();
    }
};

//获取套装强化等级和镶嵌等级
handler.GetLevelByType = function (type) {

    var level = 0;
    if (type === 0) {//装备有更新
        for (var index in this.itemList) {
            var item = this.itemList[index];
            if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
                level += item.GetItemInfo(eItemInfo.Intensify);
            }
        }
    }
    else if (type === 1) { //镶嵌
        for (var index in this.itemList) {
            var item = this.itemList[index];
            if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
                var assetTemplate = templateManager.GetTemplateByID('AssetsTemplate',
                                                                    item.GetItemInfo(eItemInfo.STAR0));
                if (null != assetTemplate) {
                    level += assetTemplate['starLevel'];
                }
            }
        }
    }

    return level;
};

handler.SendItemMsg = function ( itemList, isInit, itemOperType) {
    if (null == this.owner) {
        logger.error('SendItemMsg这个玩家不存在');
        return;
    }
    var route = 'ServerItemUpdate';
    var itemMsg = {
        init: isInit,
        itemList: []
    };
    for (var index in itemList) {
        var item = itemList[index];
        if (null == item) {
            continue;
        }
        itemMsg.itemList.push(item.GetAllInfo());

        //获取物品的公告
        if (eItemOperType.GetItem == itemOperType) {
            var getItemID = 'getItem_' + item.GetItemInfo(gameConst.eItemInfo.TEMPID);
            var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', getItemID);
            if (null != NoticeTemplate) {
                var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
                var beginStr = NoticeTemplate[tNotice.noticeBeginStr];
                var endStr = NoticeTemplate[tNotice.noticeEndStr];
                var content = beginStr + ' ' + roleName + ' ' + endStr;
                pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.GetItem, 0, content, utils.done);
           }
        }
    }
    this.owner.SendMessage(route, itemMsg);
};

handler.SendServerDeleteItem = function ( itemGuidList) {
    if (!this.owner) {
        logger.error('SendServerDeleteItem 这个玩家不存在');
        return;
    }

    var route = 'ServerDeleteItem';
    var message = {
        items: itemGuidList
    };

    if (!message.items || message.items.length === 0) {
        return;
    }

    this.owner.SendMessage(route, message);
};

handler.GetItemZhanli = function (base, qiang, ling) {
    return base + qiang + ling;
};

handler.getDropList = function (customID) {//获取掉落列表
    var dropList =  this.itemDrop.getItemDropList(customID); //非活动掉落
    var items = this.getItemInfos().items; //掉落的记录（杀死怪后， dropList中对应的条目会被删除， items会保存0
    this.AddActivityDrops( customID, dropList, items); //增加活动掉落
    return dropList;
};

/**  获得关卡的活动掉落列表:
 *      {assetID: [assetType, assetNum], ...}
 * @param customID
 */
handler.getActivityDrops = function(customID){
    //活动掉落
    var activityDrops = {};

    //获得npcList, callbackList
    var npcList = this.itemDrop.getCustomNpcList(customID).npcList; //[npcID1, npcID2, ...]
    var callbackList = this.callbackList;
    var player = this.owner;

    //累计npc身上的掉落
    npcList.forEach(function(npcID){
        callbackList.forEach(function(callback){
            var drops = callback(null, player, customID, npcID); //{assetID: [assetType, assetNum], ...}
            for(var id in drops){
                if (!activityDrops[id]){
                    activityDrops[id] = drops[id];
                }else{
                    activityDrops[id][1] += drops[id][1];
                }
            }
        });
    });
    return activityDrops;
};

handler.getNpcDropInfo = function (DropNpcID) {
    return this.itemDrop.getNpcDropInfo(DropNpcID);
};

handler.GetCustomInfo = function () {
    return this.itemDrop.GetCustomDropInfo();
};

handler.GetCustomBaseInfo = function () {
    return this.itemDrop.GetCustomDropBaseInfo();
};


handler.getItemInfos = function () {
    return this.itemDrop.getItemInfos();
};
handler.GetItemDrops = function () {
    return this.itemDrop.GetItemDrops();
};
handler.SetActivityItemDrops = function (type, flag, double) {//活动掉落
    this.itemDrop.SetActivityItemDrop(type, flag, double);
};

handler.GetActivityItemDrops = function (type) {
    return this.itemDrop.GetActivityItemDrop(type);
}

handler.SetItemDrops = function (itemDrops) {
    var this_itemDrops = JSON.parse(itemDrops);
    this.itemDrop.SetItemDrops(this_itemDrops.itemDropList,
                               this_itemDrops.itemIDList,
                               this_itemDrops.items,
                               this_itemDrops.itemDropBaseList,
                               this_itemDrops.itemsBase,
                               this_itemDrops.customInfo);
};

handler.AddBaseAttEquipOn = function ( attID, isAdd, isLogin, equipItem) {
    var self = this;
    //基础属性:生命  魔法   攻击  防御   暴击  暴击抵抗
    var mp = 0,
        hp = 0,
        attack = 0,
        defence = 0,
        baoji = 0,
        baojidefence = 0,
        zhanli = 0;

    var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', attID);
    var addAttr = suitTemplate['attAdd'] / 100;
    for (var index in this.itemList) {
        var item = this.itemList[index];
        if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOff && item.GetItemInfo(eItemInfo.GUID)
            == equipItem.GetItemInfo(eItemInfo.GUID)) {
            hp += item.GetItemInfo(eItemInfo.ITEMINFO_MAXHP);   //ITEMINFO_HP
            mp += item.GetItemInfo(eItemInfo.ITEMINFO_MAXMP);   //ITEMINFO_MP
            attack += item.GetItemInfo(eItemInfo.ATTACK);
            defence += item.GetItemInfo(eItemInfo.DEFENCE);
            baoji += item.GetItemInfo(eItemInfo.ITEMINFO_CRIT);
            baojidefence += item.GetItemInfo(eItemInfo.ITEMINFO_ANTICRIT);
        }
    }

    var attInfo = new Array(gameConst.eAttInfo.MAX);
    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attInfo[i] = temp;
    }

    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        switch (i) {
            case  gameConst.eAttInfo.MAXHP:
                attInfo[i][0] = hp * addAttr;
                break;
            case gameConst.eAttInfo.MAXMP:
                attInfo[i][0] = mp * addAttr;
                break;
            case gameConst.eAttInfo.ATTACK:
                attInfo[i][0] = attack * addAttr;
                break;
            case gameConst.eAttInfo.DEFENCE:
                attInfo[i][0] = defence * addAttr;
                break;
            case gameConst.eAttInfo.CRIT:
                attInfo[i][0] = baoji * addAttr;
                break;
            case gameConst.eAttInfo.ANTICRIT:
                attInfo[i][0] = baojidefence * addAttr;
                break;
            default:
                attInfo[i][0] = 0;
                break;
        }
    }

    self.UpdateAtt( gameConst.eAttLevel.ATTLEVEL_JICHU, attInfo, isAdd, true);
};

handler.AddBaseAtt = function ( attID, isAdd, isLogin, oldEquip, newEquip) {
    var self = this;
    //基础属性:生命  魔法   攻击  防御   暴击  暴击抵抗
    var mp = 0,
        hp = 0,
        attack = 0,
        defence = 0,
        baoji = 0,
        baojidefence = 0,
        zhanli = 0;

    var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', attID);
    var addAttr = 0;
    if (isAdd) {
        addAttr = suitTemplate['attAdd'] / 100;
    }
    else {
        addAttr = 0 - (suitTemplate['attAdd'] / 100);
    }

    for (var index in this.itemList) {
        var item = this.itemList[index];
        if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
            if (isAdd == false && newEquip == item) {
                item = oldEquip;
            }
            hp += item.GetItemInfo(eItemInfo.ITEMINFO_MAXHP);   //ITEMINFO_HP
            mp += item.GetItemInfo(eItemInfo.ITEMINFO_MAXMP);   //ITEMINFO_MP
            attack += item.GetItemInfo(eItemInfo.ATTACK);
            defence += item.GetItemInfo(eItemInfo.DEFENCE);
            baoji += item.GetItemInfo(eItemInfo.ITEMINFO_CRIT);
            baojidefence += item.GetItemInfo(eItemInfo.ITEMINFO_ANTICRIT);
        }
    }

    var attInfo = new Array(gameConst.eAttInfo.MAX);
    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attInfo[i] = temp;
    }

    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        switch (i) {
            case  gameConst.eAttInfo.MAXHP:
                attInfo[i][0] = hp * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.MAXHP;
                break;
            case gameConst.eAttInfo.MAXMP:
                attInfo[i][0] = mp * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.MAXMP;
                break;
            case gameConst.eAttInfo.ATTACK:
                attInfo[i][0] = attack * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.GONGJI;
                break;
            case gameConst.eAttInfo.DEFENCE:
                attInfo[i][0] = defence * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.FANGYU;
                break;
            case gameConst.eAttInfo.CRIT:
                attInfo[i][0] = baoji * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.BAOJILV;
                break;
            case gameConst.eAttInfo.ANTICRIT:
                attInfo[i][0] = baojidefence * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.BAOJIDIKANG;
                break;
            default:
                attInfo[i][0] = 0;
                break;
        }
    }
    if (isAdd) {
        this.owner.UpdateZhanli(Math.floor(zhanli), isAdd, isLogin);
    } else {
        this.owner.UpdateZhanli(Math.floor(-zhanli), isAdd, isLogin);
    }
    self.UpdateAtt( gameConst.eAttLevel.ATTLEVEL_JICHU, attInfo, true, true);
};

//镶嵌的时候增加衍生属性
handler.AddYanShengAtt = function ( attID, isAdd, isLogin, type, oldEquip, newEquip) {
    var self = this;
    //衍生属性
    var itemInfo_CritDamage = 0,
        itemInfo_DamageUp = 0,
        itemInfo_HunMiReduce = 0,
        itemInfo_HouYangReduce = 0,
        itemInfo_HPRate = 0,
        itemInfo_MPRate = 0,
        itemInfo_CritDamageReduce = 0,
        itemInfo_damagereduce = 0,
        itemInfo_AntiHunMi = 0,
        itemInfo_AntiHouYang = 0,
        antiFuKong = 0,
        antiJiTui = 0,
        hunMiRate = 0,
        houYangRate = 0,
        fuKongRate = 0,
        jiTuiRate = 0,
        freezeRate = 0,
        stoneRate = 0,
        antiFreeze = 0,
        antiStone = 0,
        zhanli = 0;
    var suitTemplate = templateManager.GetTemplateByID('SuitTemplate', attID);

    var addAttr = 0;
    if (isAdd) {
        addAttr = suitTemplate['attAdd'] / 100;
    }
    else {
        addAttr = 0 - (suitTemplate['attAdd'] / 100);
    }

    for (var index in this.itemList) {
        var item = this.itemList[index];
        if (item.GetItemInfo(eItemInfo.BAGTYPE) == eBagPos.EquipOn) {
            if (type == 0 && newEquip == item) {
                item = oldEquip;
            }
            itemInfo_CritDamage += item.GetItemInfo(eItemInfo.ITEMINFO_CRITDAMAGE);
            itemInfo_DamageUp += item.GetItemInfo(eItemInfo.ITEMINFO_DAMAGEUP);
            itemInfo_HunMiReduce += item.GetItemInfo(eItemInfo.ITEMINFO_HUNMIREDUCE);

            itemInfo_HouYangReduce += item.GetItemInfo(eItemInfo.ITEMINFO_HOUYANGREDUCE);
            itemInfo_HPRate += item.GetItemInfo(eItemInfo.ITEMINFO_HPRATE);
            itemInfo_MPRate += item.GetItemInfo(eItemInfo.ITEMINFO_MPRATE);

            itemInfo_CritDamageReduce += item.GetItemInfo(eItemInfo.ITEMINFO_CRITDAMAGEREDUCE);
            itemInfo_damagereduce += item.GetItemInfo(eItemInfo.ITEMINFO_DAMAGEREDUCE);
            itemInfo_AntiHunMi += item.GetItemInfo(eItemInfo.ITEMINFO_ANTIHUNMI);
            itemInfo_AntiHouYang += item.GetItemInfo(eItemInfo.ITEMINFO_ANTIHOUYANG);

            antiFuKong += item.GetItemInfo(eItemInfo.ANTIFUKONG);
            antiJiTui += item.GetItemInfo(eItemInfo.ANTIJITUI);
            hunMiRate += item.GetItemInfo(eItemInfo.HUNMIRATE);
            houYangRate += item.GetItemInfo(eItemInfo.HOUYANGRATE);
            fuKongRate += item.GetItemInfo(eItemInfo.FUKONGRATE);
            jiTuiRate += item.GetItemInfo(eItemInfo.JITUIRATE);

            freezeRate += item.GetItemInfo(eItemInfo.FREEZERATE);
            stoneRate += item.GetItemInfo(eItemInfo.STONERATE);
            antiFreeze += item.GetItemInfo(eItemInfo.ANTIFREEZE);
            antiStone += item.GetItemInfo(eItemInfo.ANTISTONE);
        }
    }
    var attInfo = new Array(gameConst.eAttInfo.MAX);
    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attInfo[i] = temp;
    }
    // //基础属性:生命  魔法   攻击  防御   暴击  暴击抵抗
    for (var i = 0; i < gameConst.eAttInfo.MAX; ++i) {
        switch (i) {
            case gameConst.eAttInfo.CRITDAMAGE:
                attInfo[i][0] = itemInfo_CritDamage * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.BAOJISHANGHAI;
                break;
            case gameConst.eAttInfo.DAMAGEUP:
                attInfo[i][0] = itemInfo_DamageUp * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.SHANGHAITISHENG;
                break;
            case gameConst.eAttInfo.HUNMIREDUCE:
                attInfo[i][0] = itemInfo_HunMiReduce * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HUNMI;
                break;
            case gameConst.eAttInfo.HOUYANGREDUCE:
                attInfo[i][0] = itemInfo_HouYangReduce * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HOUYANG;
                break;
            case gameConst.eAttInfo.HPRATE:
                attInfo[i][0] = itemInfo_HPRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HPHUIFU;
                break;
            case gameConst.eAttInfo.MPRATE:
                attInfo[i][0] = itemInfo_MPRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.MPHUIFU;
                break;
            case gameConst.eAttInfo.CRITDAMAGEREDUCE:
                attInfo[i][0] = itemInfo_CritDamageReduce * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.BJSHHJM;
                break;
            case gameConst.eAttInfo.DAMAGEREDUCE:
                attInfo[i][0] = itemInfo_CritDamageReduce * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.SHANGHAIJIANMIAN;
                break;
            case gameConst.eAttInfo.ANTIHUNMI:
                attInfo[i][0] = itemInfo_AntiHunMi * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HUNMIDIKANG;
                break;
            case gameConst.eAttInfo.ANTIHOUYANG:
                attInfo[i][0] = itemInfo_AntiHouYang * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HOUYANGDIKANG;
                break;
            case gameConst.eAttInfo.ANTIFUKONG:
                attInfo[i][0] = antiFuKong * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.FUKONGDIKANG;
                break;
            case gameConst.eAttInfo.ANTIJITUI:
                attInfo[i][0] = antiJiTui * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.JITUIDIKANG;
                break;
            case gameConst.eAttInfo.HUNMIRATE:
                attInfo[i][0] = hunMiRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HUNMIJILV;
                break;
            case gameConst.eAttInfo.HOUYANGRATE:
                attInfo[i][0] = houYangRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.HOUYANGJILV;
                break;
            case gameConst.eAttInfo.FUKONGRATE:
                attInfo[i][0] = fuKongRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.FUKONGJILV;
                break;
            case gameConst.eAttInfo.JITUIRATE:
                attInfo[i][0] = jiTuiRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.JITUIJILV;
                break;

            case gameConst.eAttInfo.FREEZERATE:
                attInfo[i][0] = freezeRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.FREEZERATE;
                break;
            case gameConst.eAttInfo.STONERATE:
                attInfo[i][0] = stoneRate * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.STONERATE;
                break;
            case gameConst.eAttInfo.ANTIFREEZE:
                attInfo[i][0] = antiFreeze * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.ANTIFREEZE;
                break;
            case gameConst.eAttInfo.ANTISTONE:
                attInfo[i][0] = antiStone * addAttr;
                zhanli += attInfo[i][0] * eAttFactor.ANTISTONE;
                break;
        }
    }

    if (isAdd) {
        this.owner.UpdateZhanli(Math.floor(zhanli), isAdd, isLogin);
    }
    else {
        this.owner.UpdateZhanli(Math.floor(-zhanli), isAdd, isLogin);
    }
    self.UpdateAtt( gameConst.eAttLevel.ATTLEVEL_JICHU, attInfo, true, true);
};


handler.UpdateAtt = function ( attLevel, attInfo, isAdd, isSend) {
    var self = this;
    self.owner.attManager.Update(attLevel, attInfo, isAdd);
    if (isSend) {
        self.owner.attManager.SendAttMsg(null);
    }
};


handler.CalAtt = function ( isAdd, attID, isLogin) {
    var self = this;
    var strengthenID = 0;
    if (attID >= 1001 && attID <= 1005) {//取消激活
        for (var id in this.strengthenList) {
            if (this.strengthenList[id].attID == attID) {
                strengthenID = attID;
            }
        }
        self.AddBaseAtt( strengthenID, true, isLogin);

    }
    else {
        for (var id in this.strengthenList) {
            if (this.strengthenList[id].state == 2) {
                strengthenID = this.strengthenList[id].attID;
            }
        }
        if (strengthenID > 0) {
            self.AddBaseAtt( strengthenID, true, isLogin);
        }
    }
};


handler.CalInlayAtt = function ( isAdd, attID, isLogin) {
    var self = this;
    var inlayID = 0;
    if (attID > 2001 && attID <= 2005) {
        for (var id in this.inlayList) {
            if (this.inlayList[id].state == attID) {
                inlayID = attID;
            }
        }
        self.AddYanShengAtt( inlayID, true, isLogin, 1);
    }
    else {
        for (var id in this.inlayList) {
            if (this.inlayList[id].state == 2) {
                inlayID = this.inlayList[id].attID;
            }
        }
        if (inlayID > 0) {
            self.AddYanShengAtt( inlayID, true, isLogin, 1);
        }
    }
};

// 是否需要转换
handler.isNeedTrans = function() {
    var currCareerID = this.owner.GetPlayerInfo(ePlayerInfo.TEMPID);
    if(currCareerID > 3){
        currCareerID += 6;
    }

    for(var index in this.itemList) {
        var tempItem = this.itemList[index];
        var itemTemplate = tempItem.GetItemTemplate();
        if (itemTemplate[tItem.itemType] == eItemType.Armor || itemTemplate[tItem.itemType] == eItemType.Weapon
            || itemTemplate[tItem.itemType] == eItemType.Jewelry) {
            var oldTempID = tempItem.GetItemInfo(eItemInfo.TEMPID);
            var oldCareerID = Math.floor(oldTempID / defaultValues.itemBeginNum);
            if (!_.contains(defaultValues.careerIDs, oldCareerID)) {
                continue;
            }
            if(currCareerID != oldCareerID){
                return true;
            }
        }
    }

    return false;
}

/**
 * 转职--转换装备
 */
handler.TransferEquip = function() {
    var newCareerID = this.owner.GetPlayerInfo(ePlayerInfo.TEMPID);
    var newItemList = {};
    var newCareerMark = newCareerID > 3 ? newCareerID + 6 : newCareerID;
    for(var index in this.itemList) {
        var tempItem = this.itemList[index];
        var itemTemplate = tempItem.GetItemTemplate();
        if (itemTemplate[tItem.itemType] == eItemType.Armor || itemTemplate[tItem.itemType] == eItemType.Weapon
            || itemTemplate[tItem.itemType] == eItemType.Jewelry) {
            var oldTempID = tempItem.GetItemInfo(eItemInfo.TEMPID);
            if(!_.contains(defaultValues.careerIDs, Math.floor(oldTempID / defaultValues.itemBeginNum))) {
                continue;
            }
            var oldStar = tempItem.GetItemInfo(eItemInfo['STAR' + 0]);
            if (oldStar > 0) {  //分解的装备上有灵石
                this.owner.GetAssetsManager().SetAssetsValue(oldStar, 1);
            }
            var levelAtt = itemTemplate[tItem.levelID];
            var IntensifyTemplate = templateManager.GetTemplateByID('IntensifyTemplate', levelAtt);
            if (null == IntensifyTemplate) {
                return errorCodes.SystemWrong;
            }
            var stoneNum = IntensifyTemplate[tIntensify.intrnsifyNum];    //强化物品需要的强化石的数量

            var enhanceLevel = tempItem.GetItemInfo(eItemInfo.Intensify);
            var stoneID = itemTemplate[tItem.stoneID];
            var stoneTotal = stoneNum * enhanceLevel;
            this.owner.GetAssetsManager().SetAssetsValue(stoneID, stoneTotal);

            var starLevel = tempItem.GetItemInfo(eItemInfo.ItemStar);
            var bagType = tempItem.GetItemInfo(eItemInfo.BAGTYPE);

            var newTempID = (oldTempID % defaultValues.itemBeginNum) + newCareerMark * defaultValues.itemBeginNum;  // 道具模板id第六位开始为职业模板id
            this.DeleteItem(index);

            var newItemInfo = this.CreateTransferItemInfo( newTempID, starLevel);

            if (!newItemInfo) {
                return null;
            }

            var itemTemp = templateManager.GetTemplateByID('ItemTemplate', newItemInfo[eItemInfo.TEMPID]);
            if (!itemTemp) {
                logger.error('TransformEquip 没有这个物品 tempID: %s', newTempID);
                return null;
            }

            var newItem = new item(newItemInfo, itemTemp);
            newItem.SetDataInfo(eItemInfo.BAGTYPE, bagType);
            newItemList[newItemInfo[eItemInfo.GUID]] = newItem;
        }
    }
    for(var index in newItemList) {
        var newItem = newItemList[index];
        this.AddItem(index, newItem);
    }
};

handler.CreateTransferItemInfo = function( tempID, star) {
    var roleID = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var itemTemp = templateManager.GetTemplateByID('ItemTemplate', tempID);
    if (!itemTemp) {
        logger.error('CreateTransferItemInfo 没有这个物品 tempID: %s', tempID);
        return null;
    }

    var itemInfo = new Array(eItemInfo.Max);
    for (var i = 0; i < eItemInfo.Max; ++i) {
        itemInfo[i] = 0;
    }

    itemInfo[eItemInfo.TEMPID] = tempID;
    itemInfo[eItemInfo.ROLEID] = roleID;
    itemInfo[eItemInfo.NUM] = 1;
    itemInfo[eItemInfo.ItemStar] = star;

    for (var i = 0; i < 4; ++i) {
        var baseValue = itemTemp[ 'baseValue_' + i];
        var randomValue = itemTemp[ 'randomValue_' + i];
        var value = baseValue + Math.floor((((star - 1) * 20 + Math.random() * 20) * randomValue) / 100);
        var attIndex = itemTemp[ 'baseAtt_' + i];
        if (value > 0) {
            itemInfo[ eItemInfo.ATTACK + attIndex ] = value;
        }
    }
    for (var i = 0; i < 4; ++i) {
        var baseValue = itemTemp[ 'baseAdd_' + i];
        var randomValue = itemTemp[ 'randomAdd_' + i];
        var value = baseValue + Math.floor(Math.random() * randomValue);
        var attIndex = itemTemp[ 'addAtt_' + i];
        if (value > 0) {
            itemInfo[ eItemInfo.ATTACK + attIndex ] = value;
        }
    }

    itemInfo[ eItemInfo.ZHANLI ] = this.GetItemZhanli(itemTemp[ tItem.baseZhanli], 0, 0);
    itemInfo[eItemInfo.GUID] = guidManager.GetUuid();

    return itemInfo;
};

handler.RegisterDropActivities = function(cb){
    this.callbackList.push(cb);
};

handler.DeleteDropActivities = function(cb){
  this.callbackList = _.without(this.callbackList, cb);
};

/**将活动相关的掉落加入到dropList及记录items:
 *      drop.npcDropList[i].activityAssetDropList = [{dropType:0, assetID:id, assetNum:3, ]  //一个npc身上的掉落
 *      items.activityNpcDropList[i].activityAssetDropList = 与上述一样 //一个npc身上的掉落
 * @param player
 * @param customID
 * @param dropList
 * @param items
 * @constructor
 */

handler.AddActivityDrops = function( customID, dropList, items){
    var player = this.owner;
    var callbackList = this.callbackList;
    var npcDropList = dropList.npcDropList;

    items.activityNpcDropList = [];
    npcDropList.forEach(function(npcDrop){
        //计算表示
        var activityDrops = {}; //{assetID: [assetType, assetNum], ...}

        //累积
        callbackList.forEach(function(callback){
            var drops = callback(null, player, customID, npcDrop.npcID); //{assetID: [assetType, assetNum], ...}
            for(var id in drops){
                if (!activityDrops[id]){
                    activityDrops[id] = drops[id];
                }else{
                    activityDrops[id][1] += drops[id][1];
                }
            }
        });

        //格式转换
        var activityAssetDropList = []; // [{dropType:0, assetID: 1101, assetNum:2}, ]
        for(var id in activityDrops){
            var drop = activityDrops[id];
            activityAssetDropList.push({dropType:drop[0], assetID:+id, assetNum:drop[1]});
        }
        npcDrop.activityAssetDropList = activityAssetDropList;
        items.activityNpcDropList.push(activityAssetDropList);
    });
};


// 卸掉玩家多出来的灵石
handler.RemoveExtraLingshi = function(){
    var player = this.owner;
    if(player == null){
        return;
    }
    for (var index in this.itemList) {
        var item = this.itemList[index];
        if(item == null){
            continue;
        }

        var itemTemplate = item.GetItemTemplate();
        if(itemTemplate == null){
            logger.error('item template is null %j ', item);
            continue;
        }

        var starNum = itemTemplate[tItem.starNum];
        if(starNum < 0){
            starNum = 0;
        }
        for(var i = 2; i >= starNum; --i){
            var starID = item.GetItemInfo(eItemInfo['STAR' + i]);
            if(starID > 0){
                itemLogic.RemoveStar(player, item.GetItemInfo(eItemInfo.GUID), i);
            }
        }
    }
}

handler.getItemDropListByNpcId = function (DropNpcID) {
    return this.itemDrop.getItemDropListByNpcId(DropNpcID);
};
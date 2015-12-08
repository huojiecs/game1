var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var errorCodes = require('../../tools/errorCodes');
var globalFunction = require('../../tools/globalFunction');

var tVipTemp = templateConst.tVipTemp;
var ePlayerInfo = gameConst.ePlayerInfo;
var eItemType = gameConst.eItemType;
var eSpecial = gameConst.eSpecial;
var tItem = templateConst.tItem;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
};

var handler = Handler.prototype;

handler.UseTreasureBox = function ( itemID, changeType) {
    var player = this.owner;
    var ItemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
    var msg = {
        itemList: [],
        type: 0
    }
    var route = "ServerTreasureBoxList";
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
    for (var index in msg.itemList) {
        var temp = msg.itemList[index];
        player.AddItem(temp.id, Num, changeType, 0);
    }
    player.SendMessage(route, msg);
};
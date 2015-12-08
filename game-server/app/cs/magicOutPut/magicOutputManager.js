/**
 * @Author        wangwenping
 * @Date          2014/12/23
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultConst = require('../../tools/defaultValues');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var config = require('../../tools/config');
var _ = require('underscore');
var tMagicOutput = templateConst.tMagicOutput;
var tStockItems = templateConst.tStockItems;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.magicOutputList = [];
    this.curIndex = -1;
};
var handler = Handler.prototype;
/**
 * 获得当前玩家的求魔信息
 * @param mineSweepID
 * @returns {*}
 */
handler.LoadDataByDB = function (ackmagic) {
    var self = this;
    if (!_.isEmpty(ackmagic)) {
        self.curIndex = ackmagic[0].curIndex;
    }
};
handler.LoadMagicOutputDataByDB = function (outputList) {
    var self = this;
    if (!_.isEmpty(outputList)) {
        self.magicOutputList = outputList;
    }
};
/**
 * 进入求魔显示页面
 * @returns {{result: (exports.OK|*), magicOutputList: Array, curIndex: (*|number)}}
 * @constructor
 */
handler.GetMagicOutputInfo = function () {
    var self = this;
    var items = [];
    for (var index in self.magicOutputList) {
        var item = {
            'itemID': self.magicOutputList[index].itemID,
            'num': self.magicOutputList[index].num
        };

        items.push(item);
    }
    var result = {
        'result': errorCodes.OK,
        'magicOutputList': items,
        'curIndex': self.curIndex
    };
    return result;
};
/**
 * 点击求魔产生新物品
 * @param roleId
 * @param CurIndex 当前的宠物下标
 * @returns {*}
 * @constructor
 */
handler.OutputItemInfo = function ( curIndex) {
    var self = this;
    var player = self.owner;
    if (self.magicOutputList.length >= defaultConst.MagicOutputGridNum) {
        return errorCodes.Cs_NoMagicOutputGrid;
    }
    var tempID = curIndex;
    var magicOutputTemp = templateManager.GetTemplateByID('MagicOutputTemplate', tempID);
    if (!magicOutputTemp) {
        logger.error('MagicOutputTemplate 这个模板不存在 tempID: %s', tempID);
        return errorCodes.SystemWrong;
    }
    /****宠物跳动的概率****/
    var leapRandom = Math.floor(Math.random() * defaultConst.RandomNum);

    var backPer = magicOutputTemp[tMagicOutput.backPercent];
    var remainPer = magicOutputTemp[tMagicOutput.remainPercent];
    var forwardPer = magicOutputTemp[tMagicOutput.forwardPercent];
    var consumeID = magicOutputTemp[tMagicOutput.consumeID];
    var consumeNum = magicOutputTemp[tMagicOutput.consumeNum];

    if (player.GetAssetsManager().CanConsumeAssets(consumeID, consumeNum) == false) {
        return errorCodes.NoMoney;
    }
    player.GetAssetsManager().AlterAssetsValue(consumeID, -consumeNum, eAssetsReduce.AskMagic);
    if (leapRandom <= backPer) {
        tempID = tempID - 1;
    } else if (leapRandom > backPer && leapRandom <= remainPer) {
        tempID = tempID;
    } else if (leapRandom > remainPer && leapRandom <= forwardPer) {
        tempID = tempID + 1;
    }
    /****产出库的概率****/
    var outputStockID = self.GetRandomOutput(magicOutputTemp, tMagicOutput.stockNum, 'stockPercent_', 'stockID_');
    var stockTemplate = templateManager.GetTemplateByID('StockTemplate', outputStockID[0]);
    if (!stockTemplate) {
        logger.error('StockTemplate 这个模板不存在 tempID: %s', stockTemplate);
        return errorCodes.SystemWrong;
    }
    /****产出库中具体物品的概率****/
    var res = self.GetRandomOutput(stockTemplate, tStockItems.goodTypes, 'weight_', 'itemID_', 'num_');
    var magicOutput = {
        'roleID': player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
        'itemID': res[0],
        'num': res[1]
    };
    self.curIndex = tempID;
    self.magicOutputList.push(magicOutput);

    var result = {
        'result': errorCodes.OK,
        'curIndex': self.curIndex,
        'itemID': res[0],
        'num': res[1]
    };
    return result;
};
handler.GetRandomOutput = function (template, property1, property2, property3, property4) {
    var itemRandom = Math.floor(Math.random() * defaultConst.RandomNum);
    var property = template[property1];
    var left = 0;
    var right = 0;
    for (var i = 1; i <= property; ++i) {
        right = template[property2 + i];
        if (itemRandom > left && itemRandom <= right) {
            var pro3 = property3 ? template[property3 + i] : 0;
            var pro4 = property4 ? template[property4 + i] : 0;
            break;
        }
        left = right;
    }
    var result = [pro3, pro4];
    return result;
};
/**
 * 一键拾取
 *
 */
handler.PickOutputItems = function () {
    var player = this.owner;
    var list = this.magicOutputList;
    var items = [];
    if (null == list || list.length <= 0) {
        return errorCodes.Cs_NoMagicOutput;
    }
    var info = this.GetOutputList();
    /******删除数组中的元素**********/
    this.magicOutputList.splice(0, list.length);

    for (var index in info) {
        player.GetAssetsManager().AlterAssetsValue(info[index].itemID, info[index].num, eAssetsAdd.MagicOutput);
        var item = {
            'itemID': info[index].itemID,
            'num': info[index].num
        };
        items.push(item);
    }

    var result = {
        'result': errorCodes.OK,
        'magicOutputList': items
    };
    return result;
};
/**
 * save数据库
 * @param roleID
 * @returns {string}
 * @constructor
 */
handler.GetSqlStr = function (roleID) {
    var self = this;
    var magicOutputList = self.magicOutputList;
    var rows = [];
    var magicOutputInfoSqlStr = '';
    for (var index = 0, len = magicOutputList.length; index < len; ++index) {
        var itemID = magicOutputList[index].itemID;
        var num = magicOutputList[index].num;
        magicOutputInfoSqlStr += '(' + roleID + ',' + itemID + ',' + num + '),';
        rows.push([roleID, itemID, num]);
    }
    magicOutputInfoSqlStr = magicOutputInfoSqlStr.substring(0, magicOutputInfoSqlStr.length - 1);

    var sqlString = utilSql.BuildSqlValues(rows);
    if (sqlString !== magicOutputInfoSqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, magicOutputInfoSqlStr);
    }
    return sqlString;
};
handler.GetMagicSqlStr = function (roleID) {
    var self = this;
    var magicSqlStr = '(' + roleID + ',' + self.curIndex + ')';

    return magicSqlStr;
};

handler.GetOutputList = function () {
    var info = [];
    for (var index in this.magicOutputList) {
        info.push(this.magicOutputList[index]);
    }
    return info;
};


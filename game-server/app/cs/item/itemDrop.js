/**
 * Created by Administrator on 14-7-21.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');
var util = require('util');
var templateManager = require('../../tools/templateManager');
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateConst = require('../../../template/templateConst');
var tCustom = templateConst.tCustom;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;

    this.itemDropList = {
        npcDropList: []
    };
    this.itemIDList = {
        npcIDList: []
    };
    this.items = {
        itemInfo: []
    };
    this.activityFlag = [
        {
            'flag': false,
            'double': 1
        },
        {
            'flag': false,
            'double': 1,
            'limitNpcIDs': []
        },
        {
            'flag': false,
            'double': 1,
            'soul': [1004, 1005, 1006, 1007, 1008]
        }
    ];
    this.activityCustom =
    [1820, 1821, 1822, 1823, 1824, 1825, 1826, 1827, 1828, 1829, 1830, 1831, 1832, 1833, 1834, 1835, 1836, 1837, 1701,
     1702, 1703, 1704, 1705, 1706, 1707, 1711, 1712, 900011, 900012, 900013, 900014, 900015, 18271, 18272, 18273, 18274,
        18275, 18276, 18277, 18278, 18279, 18280, 1754, 22001, 22002, 22003, 22004, 22005, 22006];
    this.customInfo = {
        'exps': 0,
        'moneys': 0,
        'items': {}
    };
    this.customBaseInfo = {
        'exps': 0,
        'moneys': 0,
        'items': {}
    };
    this.customID = 0;
    this.itemDropBaseList = {}; //原始掉落表，即使有任何加成，这个表里的数据也都是最原始的
    this.itemsBase = {}; //原始掉落表，即使有任何加成，这个表里的数据也都是最原始的
};

var handler = Handler.prototype;

handler.getCustomNpcList = function (customID) { //获取关卡中所有NPC
    var npcList = [];
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);//获取关卡模板
    if (null == CustomTemplate) {
//        return npcList;
        return {'npcList': npcList};
    }
    var npcListID = CustomTemplate['npcListID'];
    var LevelNpcListTemplate = templateManager.GetTemplateByID('LevelNpcListTemplate', npcListID);
    if (null == LevelNpcListTemplate) {
//        return npcList;
        return {'npcList': npcList};
    }
    for (var trunkIndex = 0; trunkIndex < 20; ++trunkIndex) {
        var npcTrunkID = LevelNpcListTemplate['npcTrunk_' + trunkIndex];
        while (npcTrunkID > 0) {
            var LevelNpcTemplate = templateManager.GetTemplateByID('LevelNpcTemplate', npcTrunkID);
            if (null != LevelNpcTemplate) {
                for (var npcIndex = 0; npcIndex < 20; ++npcIndex) {
                    var npcID = LevelNpcTemplate['npcID_' + npcIndex];
                    if (npcID > 0) {
                        npcList.push(npcID);
                    }
                }
                npcTrunkID = LevelNpcTemplate['nextID'];
            }
        }
    }
    for (var OtherTrunkIndex = 0; OtherTrunkIndex < 20; ++OtherTrunkIndex) {
        var OtherNpcTrunkID = LevelNpcListTemplate['OtherNpcTrunk_' + OtherTrunkIndex];
        while (OtherNpcTrunkID > 0) {
            var LevelNpcTemplate = templateManager.GetTemplateByID('LevelNpcTemplate', OtherNpcTrunkID);
            if (null != LevelNpcTemplate) {
                for (var npcIndex = 0; npcIndex < 20; ++npcIndex) {
                    var npcID = LevelNpcTemplate['npcID_' + npcIndex];
                    if (npcID > 0) {
                        npcList.push(npcID);
                    }
                }
                OtherNpcTrunkID = LevelNpcTemplate['nextID'];
            }
        }
    }
    var limitNpcNum = [];
    limitNpcNum.push(CustomTemplate['limitDropNpcNum_0']);
    limitNpcNum.push(CustomTemplate['limitDropNpcNum_1']);
    limitNpcNum.push(CustomTemplate['limitDropNpcNum_2']);
    limitNpcNum.push(CustomTemplate['limitDropNpcNum_3']);
    limitNpcNum.push(CustomTemplate['limitDropNpcNum_4']);
    return {'npcList': npcList, 'limitNpcNum': limitNpcNum};
};

handler.getDropItem = function (dropID) {  //根据掉落ID 获取 随机掉落物品
    var item = {'dropID': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]};
    var itemIDList = {'dropID': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]};
    var items = {};
    var DropTemplate = templateManager.GetTemplateByID('DropTemplate', dropID);
    if (null != DropTemplate) {
        var subType = DropTemplate['subType'];
        var dropType = DropTemplate['dropType'];//掉落类型
        if (subType == 0) {
            for (var itemIndex = 1; itemIndex <= 10; ++itemIndex) {
                var itemID = DropTemplate['dropID_' + itemIndex];
                if (itemID > 0) {
                    var randomNum = Math.floor(Math.random() * 100);
                    var dropPercent = DropTemplate['dropPercent_' + itemIndex];
                    var dropNum_Min = DropTemplate['dropNum_Min_' + itemIndex];
                    var dropNum_Max = DropTemplate['dropNum_Max_' + itemIndex];
                    if (randomNum < dropPercent) {
                        var cutNum = dropNum_Max - dropNum_Min;
                        if (cutNum >= 0) {
                            cutNum = Math.floor(Math.random() * cutNum) + dropNum_Min;
                            item.dropID[itemIndex - 1] = cutNum;
                            itemIDList.dropID[itemIndex - 1] = itemID;
                            if (!items[itemID]) {
                                items[itemID] = cutNum;
                            } else {
                                items[itemID] = items[itemID] + cutNum;
                            }

                        }
                    }
                }
            }
        }
        else {
            var randomNum = Math.floor(Math.random() * 100);
            for (var itemIndex = 1; itemIndex <= 10; ++itemIndex) {
                var itemID = DropTemplate['dropID_' + itemIndex];
                var dropPercent = DropTemplate['dropPercent_' + itemIndex];
                var dropNum_Min = DropTemplate['dropNum_Min_' + itemIndex];
                var dropNum_Max = DropTemplate['dropNum_Max_' + itemIndex];
                if (itemID > 0) {
                    if (randomNum < dropPercent) {
                        var cutNum = dropNum_Max - dropNum_Min;
                        if (cutNum >= 0) {
                            cutNum = Math.floor(Math.random() * cutNum) + dropNum_Min;
                            item.dropID[itemIndex - 1] = cutNum;
                            itemIDList.dropID[itemIndex - 1] = itemID;
                            if (!items[itemID]) {
                                items[itemID] = cutNum;
                            } else {
                                items[itemID] = items[itemID] + cutNum;
                            }
                        }
                        break;
                    } else {
                        randomNum -= dropPercent;
                    }
                }
            }
        }
    }
    return {'item': item, 'itemIDList': itemIDList, 'items': items};
};

handler.getItemDropList = function (customID) {
    var self = this;
    self.itemDropList = {
        npcDropList: []
    };
    self.itemIDList = {
        npcIDList: []
    };
    self.items = {
        itemInfo: []
    };
    self.customInfo = {
        'exps': 0,
        'moneys': 0,
        'items': {}
    };
    self.customBaseInfo = {
        'exps': 0,
        'moneys': 0,
        'items': {}
    };
    self.customID = customID;
    var npcInof = self.getCustomNpcList(customID); // 关卡npc列表
    if (!npcInof || !npcInof.npcList || 0 == (npcInof.npcList).length) {
        return self.itemDropList;
    }
    var dropInfo = {};
    var npcInfoList = self.getLimiDropNpcList(npcInof.npcList, npcInof.limitNpcNum); //add new Limi
    var npcList = npcInfoList.npcIds;
    self.itemDropList = npcInfoList.itemDropList;
    for (var npcIndex in npcList) {
        if (!self.itemDropList.npcDropList[npcIndex]) {
            self.itemDropList.npcDropList[npcIndex] = {
                "id": 0,
                "npcID": '',
                "dropExp": '',
                "dropList": [],
                "limiNpcDropList": {
                    "dropID": [0, 0, 0, 0, 0]
                }
            }
        }

        var dropItemID = {
            "dropList": []
        };
        var itemsArray = [];
        var npcID = npcList[npcIndex];
        var NpcTemplate = templateManager.GetTemplateByID('NpcTemplate', npcID);
        if (null != NpcTemplate) {
            self.itemDropList.npcDropList[npcIndex]['id'] = (parseInt(npcIndex) + 1);
            self.itemDropList.npcDropList[npcIndex]['npcID'] = npcID;
            self.itemDropList.npcDropList[npcIndex]['dropExp'] = NpcTemplate['dropExp'];
//            var npcDropRes=this.itemDropList.npcDropList[npcIndex];
//            npcDropRes['npcID'] = npcID;
//            npcDropRes['dropExp'] = NpcTemplate['dropExp'];
//            npcDropRes.limiNpcDropList = limiNpcDromItem.item;
            var maxTop = 0;
            for (var top = 1; top <= 10; ++top) {
                var dropID = NpcTemplate['dropID_' + top];
                if (dropID > 0) {
                    maxTop = top;
                }
            }
            for (var dropIndex = 1; dropIndex <= 10; ++dropIndex) {
                var dropID = NpcTemplate['dropID_' + dropIndex];
                if (dropID > 0) {
                    var dropJson = self.getDropItem(dropID);
                    self.itemDropList.npcDropList[npcIndex]['dropList'].push(dropJson.item);
                    dropItemID.dropList.push(dropJson.itemIDList);
                    itemsArray.push(dropJson.items);

                }
                else {
                    if (dropIndex <= maxTop) {
                        self.itemDropList.npcDropList[npcIndex]['dropList'].push({
                                                                                     'dropID': [0, 0, 0, 0, 0, 0, 0, 0,
                                                                                                0, 0]
                                                                                 });
                        dropItemID.dropList.push({'dropID': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]});
                        itemsArray.push({});
                    }
                }
            }
//            this.itemDropList.npcDropList.push(npcDropRes);
            self.itemIDList.npcIDList.push(dropItemID);
            self.items.itemInfo.push(itemsArray);
        }
    }

    self.itemDropBaseList = JSON.parse(JSON.stringify(self.itemDropList));
    self.itemsBase = JSON.parse(JSON.stringify(self.items));
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);//获取关卡模板
    if (null == CustomTemplate) {
        return self.itemDropList;
    }
    var smallType = CustomTemplate[tCustom.smallType];
    if (!_.contains(self.activityCustom, customID) && _.contains([1, 2, 3], smallType)) {
        self.updateItemDropInfo();
    }
    return self.itemDropList;

};

handler.getNpcDropInfo = function (dropNpcID) { //删除杀死怪物
    var self = this;
    var npcDropInfo = self.itemDropList.npcDropList[dropNpcID - 1];
    if (!_.size(npcDropInfo)) {
        return null;
    }
    if (npcDropInfo) {
        var itemIDList = self.itemIDList.npcIDList[dropNpcID - 1];
        var itemInfos = self.items.itemInfo[dropNpcID - 1];
        var npcDropBaseInfo = self.itemDropBaseList.npcDropList[dropNpcID - 1];
        var itemInfosBase = self.itemsBase.itemInfo[dropNpcID - 1];
        self.itemDropList.npcDropList[dropNpcID - 1] = {};
        self.addCustomInfo(npcDropInfo, itemInfos);
        self.addBaseCustomInfo(npcDropBaseInfo, itemInfosBase);
        return {'npcDropInfo': npcDropInfo, 'itemIDList': itemIDList, 'itemInfos': itemInfos, 'npcDropBaseInfo': npcDropBaseInfo};
    }
    return null;
};

handler.getItemInfos = function () {
    var items = this.items;
    var npcTop = this.itemDropList;
    var customID = this.customID;
    return {'items': items, 'npcTop': npcTop, 'customID': customID};
};

handler.getLimiDropNpc = function (npcDropID, limitNpcNum, npcDropTop) {  //根据掉落ID 获取 随机掉落隐藏NPC
    var item = {'dropID': [0, 0, 0, 0, 0]};
    var itemIDList = {'dropID': [0, 0, 0, 0, 0]};
    var items = {};
    var self = this;
    if (npcDropID > 0) {//判断存在掉落ID
        var NpcDropTemplate = templateManager.GetTemplateByID('DropNpcTemplate', npcDropID);//获取掉落l
        if (null != NpcDropTemplate) {
            for (var itemIndex = 0; itemIndex <= 5; ++itemIndex) {
                var npcID = NpcDropTemplate['dropNpcID_' + itemIndex];
                var npcNum = limitNpcNum[itemIndex];
                if (npcID > 0) {
                    var randomNum = Math.floor(Math.random() * 10000);
                    var dropNpcPercent = NpcDropTemplate['dropNpcPercent_' + itemIndex];
                    var dropNpcNum = NpcDropTemplate['dropNpcNum_' + itemIndex];
                    if (randomNum < dropNpcPercent) {
                        var cutNum = dropNpcNum;
                        if (cutNum >= 0 && npcDropTop[itemIndex] < npcNum) {
                            cutNum = dropNpcNum;
                            item.dropID[itemIndex] = cutNum;
                            npcDropTop[itemIndex] += cutNum;
                            itemIDList.dropID[itemIndex] = npcID;
                            items[npcID] = cutNum;
                        }
                    }
                }
            }
        }
    }
    return {'item': item, 'itemIDList': itemIDList, 'items': items, 'npcDropTop': npcDropTop};
};

handler.getLimiDropNpcList = function (npcList, limitNpcNum) {//获取小妖掉落npc状态
    var self = this;
    self.itemDropList = {
        npcDropList: []
    };
    var npcIds = npcList;
    var npcDropTop = [0, 0, 0, 0, 0];
    for (var npcIndex in npcList) {
        var npcDropRes = {
            "id": 0,
            "npcID": '',
            "dropExp": '',
            "dropList": [],
            "limiNpcDropList": {}
        };
        var npcID = npcList[npcIndex];
        var NpcTemplate = templateManager.GetTemplateByID('NpcTemplate', npcID);
        if(NpcTemplate == null){
            continue;
        }
        var npcDropId = NpcTemplate['dropNpcTempID'];
        var limiNpcDropList = self.getLimiDropNpc(npcDropId, limitNpcNum, npcDropTop); // 获取掉落列表
        npcDropTop = limiNpcDropList.npcDropTop;
        npcDropRes["limiNpcDropList"] = limiNpcDropList.item;
        var limNpcIDs = limiNpcDropList.itemIDList.dropID;
        for (var npcId in limNpcIDs) {
            if (limNpcIDs[npcId] > 0) {
                npcIds.push(limNpcIDs[npcId]);
                self.activityFlag[1].limitNpcIDs.push(limNpcIDs[npcId]);
            }
        }
        self.itemDropList.npcDropList[npcIndex] = npcDropRes;
    }
    return {"npcIds": npcIds, "itemDropList": self.itemDropList};
}

handler.SetItemDrops = function (itemDropList, itemIDList, items, itemDropBaseList, itemsBase, customInfo) {
    var self = this;
    self.itemDropList = itemDropList;
    self.itemIDList = itemIDList;
    self.items = items;
    self.customInfo = customInfo;
    self.itemDropBaseList = itemDropBaseList;
    self.itemsBase = itemsBase;
};
handler.GetItemDrops = function () {
    var self = this;
    return(
    {
        'itemDropList': self.itemDropList,
        'itemIDList': self.itemIDList,
        'items': self.items,
        'itemDropBaseList': self.itemDropBaseList,
        'itemsBase': self.itemsBase,
        'customInfo': self.customInfo });
};
handler.SetActivityItemDrop = function (type, flag, double) {//活动掉落  0经验  1金币 2魂魄
    var self = this;
    if (_.contains([0, 1, 2], type) && typeof (flag) == 'boolean' && typeof (double) == 'number') {//验证type 是否是符合条件参数
        self.activityFlag[type]['flag'] = flag;
        self.activityFlag[type]['double'] = double;
    }
};

handler.GetActivityItemDrop = function (type) { //活动掉落  0经验  1金币 2魂魄
    var self = this;
    if (_.contains([0, 1, 2], type)) {
        return {
            flag: self.activityFlag[type]['flag'],
            double: self.activityFlag[type]['double']
        };
    }
    return null;
}

handler.updateItemDropInfo = function () {//更新掉落信息
    var self = this;
    for (var i in self.activityFlag) {
        if (0 == parseInt(i)) {
            if (self.activityFlag[i].flag) {
                var d = self.activityFlag[i].double;
                for (var n in self.itemDropList.npcDropList) {
                    var dropExp = self.itemDropList.npcDropList[n].dropExp;
                    self.itemDropList.npcDropList[n].dropExp = Math.floor(dropExp * d);
                }
            }
        } else if (1 == parseInt(i)) {
            if (self.activityFlag[i].flag) {
                var d = self.activityFlag[i].double;
                for (var n in self.itemDropList.npcDropList) {
                    var npcID = self.itemDropList.npcDropList[n].npcID;
                    if (!_.contains(self.activityFlag[1].limitNpcIDs, npcID)) {
                        var dropListNum = self.itemDropList.npcDropList[n].dropList;
                        var dropListID = self.itemIDList.npcIDList[n].dropList;
                        for (var j in  dropListID) {
                            for (var id in dropListID[j].dropID) {
                                var dropID = dropListID[j].dropID[id];
                                if (globalFunction.GetMoneyTemp() == dropID) {
                                    for (var item in self.items.itemInfo[n]) {
                                        var itemId = self.items.itemInfo[n][item][dropID];
                                        if (!!itemId) {
                                            self.items.itemInfo[n][item][dropID] =
                                            Math.floor(dropListNum[j].dropID[id] * d);
                                        }
                                    }
                                    self.itemDropList.npcDropList[n].dropList[j].dropID[id] =
                                    Math.floor(dropListNum[j].dropID[id] * d);
                                }
                            }
                        }
                    }

                }
            }
        } else if (2 == parseInt(i)) {
            if (self.activityFlag[i].flag) {
                var d = self.activityFlag[i].double;
                for (var n in self.itemDropList.npcDropList) {
                    var npcID = self.itemDropList.npcDropList[n].npcID;
                    if (!_.contains(self.activityFlag[1].limitNpcIDs, npcID)) {
                        var dropListNum = self.itemDropList.npcDropList[n].dropList;
                        var dropListID = self.itemIDList.npcIDList[n].dropList;
                        for (var j in  dropListID) {
                            for (var id in dropListID[j].dropID) {
                                var dropID = dropListID[j].dropID[id];
                                if (_.contains(self.activityFlag[2].soul, dropID)) {
                                    self.itemDropList.npcDropList[n].dropList[j].dropID[id] =
                                    Math.floor(dropListNum[j].dropID[id] * d);
                                    self.items.itemInfo[n][j][dropID] = Math.floor(dropListNum[j].dropID[id]);
                                }
                            }
                        }
                    }

                }
            }
        }
    }
};

handler.addCustomInfo = function (npcDropInfo, itemInfos) {
    var self = this;

    var roleID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);

    logger.info('addCustomInfo roleID: %j, npcDropInfo: %j, itemInfos: %j', roleID, npcDropInfo, itemInfos);

    self.customInfo['exps'] += npcDropInfo['dropExp'];
    for (var i in itemInfos) {
        var item = itemInfos[i];
        for (var key in item) {
            if (globalFunction.GetMoneyTemp() == key) {
                self.customInfo['moneys'] += item[key]
            } else {
                if (!self.customInfo['items'][key]) {
                    self.customInfo['items'][key] = item[key];
                } else {
                    self.customInfo['items'][key] += item[key];
                }
            }
        }
    }
};

handler.addBaseCustomInfo = function (npcDropInfo, itemInfos) {
    var self = this;
    self.customBaseInfo['exps'] += npcDropInfo['dropExp'];
    for (var i in itemInfos) {
        var item = itemInfos[i];
        for (var key in item) {
            if (globalFunction.GetMoneyTemp() == key) {
                self.customBaseInfo['moneys'] += item[key]
            } else {
                if (!self.customBaseInfo['items'][key]) {
                    self.customBaseInfo['items'][key] = item[key];
                } else {
                    self.customBaseInfo['items'][key] += item[key];
                }
            }
        }
    }
};
handler.GetCustomDropInfo = function () {
    var self = this;
    return self.customInfo;
};

handler.GetCustomDropBaseInfo = function () {
    var self = this;
    return self.customBaseInfo;
};

handler.getItemDropListByNpcId = function (npcID) {
    var self = this;
    var itemsArray = [];
    var NpcTemplate = templateManager.GetTemplateByID('NpcTemplate', npcID);
    if (null != NpcTemplate) {
        for (var dropIndex = 1; dropIndex <= 10; ++dropIndex) {
            var dropID = NpcTemplate['dropID_' + dropIndex];
            if (dropID > 0) {
                var dropJson = self.getDropItem(dropID);
                if(_.size(dropJson.items) > 0) {
                    itemsArray.push(dropJson.items);
                }
            }
        }
    }
    return itemsArray;
};
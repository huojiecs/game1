/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-21
 * Time: 上午11:39
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var Goods = require('./goods');
var utilSql = require('../../tools/mysql/utilSql');
var utils = require('../../tools/utils');
var ePlayerInfo = gameConst.ePlayerInfo;
var eGoodsInfo = gameConst.eGoodsInfo;
var eItemType = gameConst.eItemType;
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var tGoods = templateConst.tGoods;
var tItem = templateConst.tItem;
var tVipTemp = templateConst.tVipTemp;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var eItemInfo = gameConst.eItemInfo;
var eSpecial = gameConst.eSpecial;
var eItemChangeType = gameConst.eItemChangeType;
var eEmandationType = gameConst.eEmandationType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var log_utilSql = require('../../tools/mysql/utilSql');
var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.dataList = {};
    this.severNumList = {};
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (dataList) {
    for (var index in dataList) {
        var tempID = dataList[index][eGoodsInfo.GoodsID];
        var tempGoods = new Goods();
        tempGoods.SetAllInfo(dataList[index]);
        this.dataList[tempID] = tempGoods;
    }
};

handler.UpdateShop12Info = function () {
    for (var index in this.dataList) {
        var tempShop = this.dataList[index];
        if (tempShop) {
            var attID = tempShop.GetDataInfo(eGoodsInfo.GoodsID);
            var goodsTemplate = templateManager.GetTemplateByID('GoodsTemplate', attID);

            // var vipTemplate = null;
            var myVipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);//TODO  钻石商店物品购买次数+1
            var addNum = 0;
            if (!!goodsTemplate && goodsTemplate[tGoods.addNumForVipLevel] > 0 && myVipLevel
                >= goodsTemplate[tGoods.addNumForVipLevel]
                    && attID > 2000 && attID <= 3000) { //钻石商店物品
                addNum = 1;
            }
            if (!!goodsTemplate) {
                tempShop.SetDataInfo(eGoodsInfo.BuyNum, goodsTemplate[tGoods.buyNum] + addNum);
                tempShop.SetDataInfo(eGoodsInfo.VipBuyTop, 0);

            }
        }
    }
};

handler.GetSqlStr = function () {
    var dataStr = '';
    for (var index in this.dataList) {
        var tempShop = this.dataList[index];
        dataStr += '(';
        for (var i = 0; i < eGoodsInfo.Max; ++i) {
            var value = tempShop.GetDataInfo(i);
            if (typeof  value == 'string') {
                dataStr += '\'' + value + '\'' + ',';
            }
            else {
                dataStr += value + ',';
            }
        }
        dataStr = dataStr.substring(0, dataStr.length - 1);
        dataStr += '),';
    }
    dataStr = dataStr.substring(0, dataStr.length - 1);

    var sqlString = utilSql.BuildSqlStringFromObjects(this.dataList, 'GetDataInfo', eGoodsInfo);

    if (sqlString !== dataStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, dataStr);
    }

    return sqlString;
};

handler.GetShopList = function ( callback) {
    var self = this;
    var tempTemplate = templateManager.GetAllTemplate('ShopTemplate');
    if (null == tempTemplate) {
        return callback(errorCodes.SystemWrong);
    }
    var msg = {
        result: 0,
        shopList: [],
        goodsList: []
    }
    var isOK = 1;
    for (var index in tempTemplate) {
        var temp = tempTemplate[index];
        var tempMsg = {
            attID: parseInt(index),
            goodsType: temp['goodsType'],
            advertList: [],
            goodsList: []
        }
        var advertNum = temp['advertNum'];
        var goodsNum = temp['goodsNum'];
        for (var i = 0; i < advertNum; ++i) {
            tempMsg.advertList.push(temp['advertLu_' + i]);
        }
        for (var i = 0; i < goodsNum; ++i) {
            var goodsMsg = {
                goodsID: temp['goodsID_' + i],
                goodsSell: temp['goodsSell_' + i]
            }
            isOK = 1;
            var tempGoodsTemplate = templateManager.GetTemplateByID('GoodsTemplate', temp['goodsID_' + i]);
            if (null == tempGoodsTemplate) {
                isOK = 0;
                continue;
            }
            var beginTime = tempGoodsTemplate[tGoods.beginTime];
            var endTime = tempGoodsTemplate[tGoods.endTime];
            var weekTime = tempGoodsTemplate[tGoods.weekTime];
            var beginDate = new Date(beginTime);
            var endDate = new Date(endTime);
            var nowDate = new Date();
            var week = nowDate.getDay();
            if (weekTime.indexOf(week) < 0) {
                isOK = 0;
            }
            if (isNaN(beginDate.getYear()) == false && beginDate > nowDate) {
                isOK = 0;
            }
            if (isNaN(endDate.getYear()) == false && endDate < nowDate) {
                isOK = 0;
            }

            if (1 == isOK) {
                goodsMsg['goodTemp'] = tempGoodsTemplate;
                goodsMsg['goodTemp']['needVip_1'] = 0;
                goodsMsg['goodTemp']['addNum_1'] = 0;
                goodsMsg['goodTemp']['needVip_2'] = 0;
                goodsMsg['goodTemp']['addNum_2'] = 0;
                goodsMsg['goodTemp']['needVip_3'] = 0;
                goodsMsg['goodTemp']['addNum_3'] = 0;
                goodsMsg['goodTemp']['needVip_4'] = 0;
                goodsMsg['goodTemp']['addNum_4'] = 0;
                goodsMsg['goodTemp']['needVip_5'] = 0;
                goodsMsg['goodTemp']['addNum_5'] = 0;
                goodsMsg['goodTemp']['leftTime'] = 0;

                if (1 == temp['goodsSell_' + i]) { //折扣商品判断在折扣时间否
                    var tempType = 1; //默认打折
                    var beginTime_sale = tempGoodsTemplate[ tGoods.saleBeginTime ];
                    var endTime_sale = tempGoodsTemplate[ tGoods.saleEndTime ];
                    var weekTime_sale = tempGoodsTemplate[ tGoods.saleWeekTime ];
                    var beginDate_sale = new Date(beginTime_sale);
                    var endDate_sale = new Date(endTime_sale);
                    var nowDate_sale = new Date();
                    var week_sale = nowDate_sale.getDay();
                    if (weekTime_sale.indexOf(week_sale) < 0) {
                        tempType = 0;
                    }
                    if (isNaN(beginDate_sale.getYear()) == false && beginDate_sale > nowDate_sale) {
                        tempType = 0;
                    }
                    if (isNaN(endDate_sale.getYear()) == false && endDate_sale < nowDate_sale) {
                        tempType = 0;
                    }
                    if (0 == tempType) {//类型切换成正常商品
                        goodsMsg.goodsSell = 0;
                    }else{
                        goodsMsg['goodTemp']['leftTime'] = (endDate_sale.getTime() - nowDate.getTime())/1000;
                    }


                }else if(4 == temp['goodsSell_' + i] || 5 == temp['goodsSell_' + i]){
                    goodsMsg['goodTemp']['leftTime'] = (endDate.getTime() - nowDate.getTime())/1000;

                }

                tempMsg.goodsList.push(goodsMsg);
            }
        }
        msg.shopList.push(tempMsg);
    }
    pomelo.app.rpc.ps.psRemote.
        GetLimitGoods(null, function (goodsInfo) {
                          for (var index in self.dataList) {
                              var temp = self.dataList[index];
                              var goodsID = temp.GetDataInfo(eGoodsInfo.GoodsID);
                              var serverNum = -1;
                              var limtGoodsNum = goodsInfo[goodsID] || 0;
                              var tempGoodsTemplate = templateManager.GetTemplateByID('GoodsTemplate',
                                                                                      goodsID);
                              if (null != tempGoodsTemplate) {
                                  var tempServerNum = tempGoodsTemplate[tGoods.serverNum];
                                  if (tempServerNum > 0) {
                                      var topNum = tempServerNum - limtGoodsNum;
                                      if (topNum >= 0) {
                                          serverNum = topNum;
                                      }
                                  }
                              }
                              var tempMsg = {
                                  goodsID: temp.GetDataInfo(eGoodsInfo.GoodsID),
                                  goodsNum: temp.GetDataInfo(eGoodsInfo.BuyNum),
                                  serverNum: serverNum
                              }
                              msg.goodsList.push(tempMsg);
                          }
                          for (var goodsID in goodsInfo) {
                              var goodsTop = false;
                              for (var g in msg.goodsList) {
                                  if (goodsID == msg.goodsList[g].goodsID) {
                                      goodsTop = true;
                                  }
                              }
                              if (!goodsTop) {
                                  var tempGoodsTemplate = templateManager.GetTemplateByID('GoodsTemplate',
                                                                                          goodsID);
                                  var tempServerNum = tempGoodsTemplate[tGoods.serverNum];

                                  var goodsMsg = {
                                      goodsID: +goodsID,
                                      goodsNum: tempGoodsTemplate[tGoods.buyNum],
                                      serverNum: tempServerNum - goodsInfo[goodsID] >= 0 ?
                                                 tempServerNum - goodsInfo[goodsID] : -1
                                  }
                                  msg.goodsList.push(goodsMsg);
                              }
                          }
                          return callback(msg);
                      }
    );

};

handler.BuyGoods = function ( goodsID, callback) {
    var self = this;
    var player = self.owner;
    var tempTemplate = templateManager.GetTemplateByID('GoodsTemplate', goodsID);
    if (null == tempTemplate) {
        return callback(errorCodes.SystemWrong);
    }
    var giftItemNum = tempTemplate[tGoods.giftItemNum];
    if (null == giftItemNum) {
        return callback(errorCodes.ParameterNull);
    }
    var itemID = tempTemplate[tGoods.itemID];
    //判断该物品是否是限量够买
    if(templateManager.fashionPieceObj[itemID]) {
        var limitFashionPiece = templateManager.fashionPieceObj[itemID];
        if(player.GetAssetsManager().GetAssetsValue(itemID) >= limitFashionPiece) {
            //达到该物品购买上限
            return callback(errorCodes.Cs_ShopGetLimitNum);
        }
    } else if(templateManager.titlePieceObj[itemID]) {
        var limitTitlePiece = templateManager.titlePieceObj[itemID];
        if(player.GetAssetsManager().GetAssetsValue(itemID) >= limitTitlePiece) {
            //达到该物品购买上限
            return callback(errorCodes.Cs_ShopGetLimitNum);
        }
    }
    var treasureBox = false;
    if (giftItemNum <= 0) { //判断该物品是否是商城热更礼包
        var itemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
        if (null == itemTemplate) {
            return callback(errorCodes.SystemWrong);
        }
        if (itemTemplate[tItem.itemType] == eItemType.Special) {
            if (itemTemplate[tItem.subType] == eSpecial.TreasureBox) {
                treasureBox = true;
            }
        }
    }

    var beginTime = tempTemplate[tGoods.beginTime];
    var endTime = tempTemplate[tGoods.endTime];
    var weekTime = tempTemplate[tGoods.weekTime];
    var vipLevel = tempTemplate[tGoods.vipLevel];
    var beginDate = new Date(beginTime);
    var endDate = new Date(endTime);
    var nowDate = new Date();
    var week = nowDate.getDay();
    if (player.GetPlayerInfo(ePlayerInfo.VipLevel) < vipLevel) {//TODO 判断用户等级是否达到购买条件
        return callback(errorCodes.VipLevel);
    }
    if (weekTime.indexOf(week) < 0) {
        return callback(errorCodes.Cs_ShopWeek);
    }
    if (isNaN(beginDate.getYear()) == false && beginDate > nowDate) {
        return callback(errorCodes.Cs_ShopDate);
    }
    if (isNaN(endDate.getYear()) == false && endDate < nowDate) {
        return callback(errorCodes.Cs_ShopDate);
    }
    var moneyID = tempTemplate[tGoods.moneyID];
    var moneyNum = tempTemplate[tGoods.moneyNum];
    var oldMoneyNum = tempTemplate[tGoods.oldMoneyNum];
    var goodSell = tempTemplate[ tGoods.goodSell ];
    if (1 == goodSell) {  // 折扣类型商品判断原价还是折扣
        var tempType = 1; //默认打折
        var beginTime_sale = tempTemplate[ tGoods.saleBeginTime ];
        var endTime_sale = tempTemplate[ tGoods.saleEndTime ];
        var weekTime_sale = tempTemplate[ tGoods.saleWeekTime ];
        var beginDate_sale = new Date(beginTime_sale);
        var endDate_sale = new Date(endTime_sale);
        var nowDate_sale = new Date();
        var week_sale = nowDate_sale.getDay();
        if (weekTime_sale.indexOf(week_sale) < 0) {
            tempType = 0;
        }
        if (isNaN(beginDate_sale.getYear()) == false && beginDate_sale > nowDate_sale) {
            tempType = 0;
        }
        if (isNaN(endDate_sale.getYear()) == false && endDate_sale < nowDate_sale) {
            tempType = 0;
        }
        if (0 == tempType) {    // 不打折
            moneyNum = oldMoneyNum;
        }
    }

    if (player.GetAssetsManager().CanConsumeAssets(moneyID, moneyNum) == false) {
        if (6001 == moneyID) {
            return callback(errorCodes.ShopNotYouQingDian);
        }
        return callback(errorCodes.NoAssets);
    }
    var myVipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);//vip特权 TODO      增加 MP/HP 携带数量
    var vipTemplate = null;
    if (null == myVipLevel || 0 == myVipLevel) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1)
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', myVipLevel + 1)
    }
    if (null == vipTemplate) {
        return callback(errorCodes.ParameterNull);
    }

    if (itemID == globalFunction.GetHpTemp() && player.GetAssetsManager().GetAssetsValue(itemID) >= defaultValues.HpNum
        + vipTemplate[tVipTemp.takeBlueBloodNum]) {
        return callback(errorCodes.Cs_ShopHpFull);
    }
    if (itemID == globalFunction.GetMpTemp() && player.GetAssetsManager().GetAssetsValue(itemID) >= defaultValues.MpNum
        + vipTemplate[tVipTemp.takeBlueBloodNum]) {
        return callback(errorCodes.Cs_ShopMpFull);
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_EventGuid = log_getGuid.GetUuid();    //全网唯一标识
    var log_MoneyArgs = [log_getGuid.GetUuid(), player.GetPlayerInfo(ePlayerInfo.ROLEID), eMoneyChangeType.BUYITEM];
    var log_beforeMoneyChange = player.GetAssetsManager().GetAssetsValue(moneyID);  //变化前金钱值
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    //vip特权 TODO      增加购买次数的vip等级
    var addNum = 0;
    if (tempTemplate[tGoods.addNumForVipLevel] > 0 && myVipLevel >= tempTemplate[tGoods.addNumForVipLevel] && goodsID
        > 2000
        && goodsID < 3000) {
        addNum = 1;
    }
    var buyNum = tempTemplate[tGoods.buyNum];
    var serverNum = tempTemplate[tGoods.serverNum];
    if (buyNum != -1) {
        buyNum += addNum;
    }
    var msg = {
        result: 0,
        goodsID: goodsID,
        goodsNum: -1,
        serverNum: -1,
        itemList: []
    };
    if (serverNum > 0) {
        pomelo.app.rpc.ps.psRemote.
            GetLimitGoods(null, function (goodsInfo) {
                              if (buyNum > 0) {
                                  var tempGoods = self.dataList[goodsID];
                                  if (serverNum > 0) { //同服限次
                                      var serverGoods = goodsInfo[goodsID];
                                      if (null == serverGoods) {
                                          msg.serverNum = serverNum - 1;
                                          pomelo.app.rpc.ps.psRemote.SetLimitGoods(null, goodsID, 1, utils.done);
                                      } else {
                                          var buyOldNum = buyNum;
                                          if (!!tempGoods) {
                                              buyOldNum = tempGoods.GetDataInfo(eGoodsInfo.BuyNum);
                                          }
                                          if (buyOldNum <= 0) {
                                              var code = {
                                                  result: errorCodes.Cs_ShopSeverUpdate,
                                                  goodsID: goodsID,
                                                  goodsNum: buyOldNum,
                                                  serverNum: serverNum - serverGoods
                                              }
                                              return callback(code);
                                          }
                                          if (serverNum - serverGoods > 0) {
                                              pomelo.app.rpc.ps.psRemote.SetLimitGoods(null, goodsID, serverGoods + 1,
                                                                                       utils.done);
                                              msg.serverNum = serverNum - (serverGoods + 1);
                                          } else {
                                              var code = {
                                                  result: errorCodes.Cs_ShopSeverUpdate,
                                                  goodsID: goodsID,
                                                  goodsNum: buyOldNum,
                                                  serverNum: 0
                                              }
                                              return callback(code);
                                          }
                                      }
                                  }
                                  if (null == tempGoods) {
                                      tempGoods = new Goods();
                                      tempGoods.SetDataInfo(eGoodsInfo.GoodsID, goodsID);
                                      tempGoods.SetDataInfo(eGoodsInfo.RoleID, player.id);
                                      tempGoods.SetDataInfo(eGoodsInfo.BuyNum, buyNum - 1);
                                      var VipBuyTop = self.dataList[goodsID];
                                      if (!!!VipBuyTop) {
                                          tempGoods.SetDataInfo(eGoodsInfo.VipBuyTop, 0);
                                      }
                                      self.dataList[goodsID] = tempGoods;
                                      msg.goodsNum = buyNum - 1;
                                  }
                                  else {
                                      var oldNum = tempGoods.GetDataInfo(eGoodsInfo.BuyNum);
                                      if (oldNum > 0) {
                                          tempGoods.SetDataInfo(eGoodsInfo.BuyNum, oldNum - 1);
                                          msg.goodsNum = oldNum - 1;
                                      }
                                      else {
                                          if (tempTemplate[tGoods.addNumForVipLevel] > 0) {
                                              if (myVipLevel >= tempTemplate[tGoods.addNumForVipLevel] && goodsID > 2000
                                                  && goodsID < 3000) {
                                                  return callback(errorCodes.Cs_ShopVipNoBuy);
                                              }
                                              return callback(errorCodes.Cs_ShopNoBuy);
                                          }
                                          else {
                                              return callback(errorCodes.TodayNoTimes);
                                          }

                                      }
                                  }
                              }
                              else if (buyNum == 0) {
                                  if (tempTemplate[tGoods.addNumForVipLevel] > 0) {
                                      if (myVipLevel >= tempTemplate[tGoods.addNumForVipLevel] && goodsID > 2000
                                          && goodsID
                                              < 3000) {
                                          return callback(errorCodes.Cs_ShopVipNoBuy);
                                      }
                                      return callback(errorCodes.Cs_ShopNoBuy);
                                  }
                                  else {
                                      return callback(errorCodes.TodayNoTimes);
                                  }
                              }

                              // for tlog ///////////////////////
                              var costFactor = eAssetsReduce.ShopPurchase;
                              if (giftItemNum <= 0) {
                                  if (itemTemplate[tItem.itemType] == eItemType.Special) {
                                      if (itemTemplate[tItem.subType] == eSpecial.TreasureBox) {
                                          costFactor = eAssetsReduce.ShopTreasure;
                                      } else if (itemTemplate[tItem.subType] == eSpecial.Assets) {
                                          var otherID = itemTemplate[tItem.otherID];
                                          var assetsTemplate = templateManager.GetTemplateByID('AssetsTemplate',
                                                                                               otherID);

                                          var assetsType = assetsTemplate['type'];

                                          if (assetsType == 6) { // 生命水
                                              costFactor = eAssetsReduce.BuyHpInShop;
                                          } else if (assetsType == 7) { // 魔法水
                                              costFactor = eAssetsReduce.BuyMpInShop;
                                          } else if (assetsType == 4) { // 1-10级灵石
                                              costFactor = eAssetsReduce.BuyLingshi;
                                          } else if (assetsType == 8) { // 1-5级强化石
                                              costFactor = eAssetsReduce.BuyIntensifyStone;
                                          } else if (itemID == 9101) { // 紫色熔炼石
                                              costFactor = eAssetsReduce.BuyPurpleStone;
                                          } else if (itemID == 9102) { // 橙色熔炼石
                                              costFactor = eAssetsReduce.BuyOrangeStone;
                                          } else if (assetsType == 12) { // 魔晶
                                              costFactor = eAssetsReduce.BuyCrystal;
                                          } else if (assetsType == 13) { //神果
                                              costFactor = eAssetsReduce.BuySuperFruit;
                                          } else if (itemID == 1004) { // 魂1
                                              costFactor = eAssetsReduce.BuySoul1;
                                          } else if (itemID == 1005) { // 魂2
                                              costFactor = eAssetsReduce.BuySoul2;
                                          } else if (itemID == 1006) { // 魂3
                                              costFactor = eAssetsReduce.BuySoul3;
                                          } else if (itemID == 1007) { // 魂4
                                              costFactor = eAssetsReduce.BuySoul4;
                                          } else if (itemID == 1008) { // 魂5
                                              costFactor = eAssetsReduce.BuySoul5;
                                          } else if (assetsType == 18) { // 符文
                                              costFactor = eAssetsReduce.BuyRune
                                          } else if (assetsType == 19) { // 时装碎片
                                              costFactor = eAssetsReduce.BuyFashionChip
                                          } else if (assetsType == 2) {  // 符文技能点
                                              costFactor = eAssetsReduce.BuyRunePoint
                                          }
                                      }
                                  }
                              }

                              //////////////////////////////////
                              player.GetAssetsManager().AlterAssetsValue(moneyID, -moneyNum, costFactor);

                              // for tlog /////////////////////
                              var produceFactor = eAssetsAdd.GoldShop;
                              if (moneyID == globalFunction.GetYuanBaoTemp()) {
                                  produceFactor = eAssetsAdd.ZuanshiShop;
                              } else if (moneyID == globalFunction.GetFriend()) {
                                  produceFactor = eAssetsAdd.FdPointShop;
                              }
                              /////////////////////////////////
                              var log_itemList = [];
                              if (giftItemNum > 0) {
                                  var giftItems = self.GetShopGiftItemList(goodsID);
                                  if (!giftItems) {
                                      return errorCodes.ParameterNull;
                                  }
                                  for (var i in giftItems.itemList) {
                                      var ID = giftItems.itemList[i].id;
                                      var num = giftItems.itemList[i].num;
                                      log_itemList = player.AddItem(+ID, num, produceFactor, log_EventGuid);
                                  }
                                  var route = "ServerTreasureBoxList";
                                  player.SendMessage(route, giftItems);
                              } else if (treasureBox) {
                                  var boxItems = self.GetTreasureBoxItemID(itemID);
                                  if (null == boxItems) {
                                      return errorCodes.SystemWrong;
                                  }
                                  for (var i in boxItems.itemList) {
                                      var ID = boxItems.itemList[i].id;
                                      var num = boxItems.itemList[i].num;
                                      log_itemList = player.AddItem(+ID, num, produceFactor, log_EventGuid);
                                  }
                                  var route = "ServerTreasureBoxList";
                                  player.SendMessage(route, boxItems);
                              } else {
                                  log_itemList =
                                  player.AddItem(itemID, tempTemplate[tGoods.itemNum], produceFactor, log_EventGuid);
                              }
                              msg.itemList.push(goodsID);
                              ///////////////////////////////////////////////////////////////////////////
                              var openID = player.GetOpenID();
                              var accountType = player.GetAccountType();
                              var lv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
                              if (moneyID == globalFunction.GetMoneyTemp()) {
                                  var moneyType = 0;
                              } else if (moneyID == globalFunction.GetYuanBaoTemp()) {
                                  var moneyType = 1;
                              } else {
                                  var moneyType = 2;
                              }
                              if (giftItemNum <= 0) {
                                  tlogger.log({3: 0}, 'ItemMoneyFlow', accountType, openID, itemTemplate[tItem.itemType], itemID,
                                              tempTemplate[tGoods.itemNum],
                                              moneyNum, lv, moneyType);
                              }
                              ///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                              var log_ItemGuid = log_getGuid.GetUuid();    //全网唯一标识
                              var log_date = log_utilSql.DateToString(new Date());
                              var log_RoleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
                              var log_BuyItemFlag = false;        //判断玩家购买的是否为物品
                              for (var index in log_itemList) {
                                  log_BuyItemFlag = true;
                                  var log_ItemArgs = [log_ItemGuid];
                                  var tempItem = log_itemList[index];
                                  for (var i = 0; i < eItemInfo.Max; ++i) {      //将物品的详细信息插入到sql语句中
                                      log_ItemArgs.push(tempItem.GetItemInfo(i));
                                  }
                                  log_ItemArgs.push(eItemChangeType.BUY);                           //物品变化原因
                                  log_ItemArgs.push(eEmandationType.ADD);                           //购买、出售
                                  log_ItemArgs.push(log_date);                                         //变化时间
                                  log_insLogSql.InsertSql(eTableTypeInfo.ItemChange, log_ItemArgs);
                              }

                              var log_EventArgs = [log_EventGuid, player.GetPlayerInfo(ePlayerInfo.ROLEID),
                                                   moneyID, moneyNum, log_utilSql.DateToString(new Date())];
                              log_insLogSql.InsertSql(eTableTypeInfo.BuyEvent, log_EventArgs);

                              if (log_BuyItemFlag) {
                                  log_MoneyArgs.push(log_ItemGuid);         //购买物品的guid
                              }
                              else {
                                  log_MoneyArgs.push(log_EventGuid);         //当用户购买的不是物品时字段设置为购买事件的guid
                              }
                              log_MoneyArgs.push(moneyID);                                                  //金钱类型
                              log_MoneyArgs.push(log_beforeMoneyChange);                                    //变化前金钱值
                              log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(moneyID));        //变化后金钱值
                              log_MoneyArgs.push(log_utilSql.DateToString(new Date()));         //时间
                              log_insLogSql.InsertSql(eTableTypeInfo.MoneyChange, log_MoneyArgs);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                              return callback(msg);
                          });
    } else {
        if (buyNum > 0) {
            var tempGoods = self.dataList[goodsID];
            if (null == tempGoods) {
                tempGoods = new Goods();
                tempGoods.SetDataInfo(eGoodsInfo.GoodsID, goodsID);
                tempGoods.SetDataInfo(eGoodsInfo.RoleID, player.id);
                tempGoods.SetDataInfo(eGoodsInfo.BuyNum, buyNum - 1);
                var VipBuyTop = self.dataList[goodsID];
                if (!!!VipBuyTop) {
                    tempGoods.SetDataInfo(eGoodsInfo.VipBuyTop, 0);
                }
                self.dataList[goodsID] = tempGoods;
                msg.goodsNum = buyNum - 1;
            }
            else {
                var oldNum = tempGoods.GetDataInfo(eGoodsInfo.BuyNum);
                if (oldNum > 0) {
                    tempGoods.SetDataInfo(eGoodsInfo.BuyNum, oldNum - 1);
                    msg.goodsNum = oldNum - 1;
                }
                else {
                    if (tempTemplate[tGoods.addNumForVipLevel] > 0) {
                        if (myVipLevel >= tempTemplate[tGoods.addNumForVipLevel] && goodsID > 2000
                            && goodsID < 3000) {
                            return callback(errorCodes.Cs_ShopVipNoBuy);
                        }
                        return callback(errorCodes.Cs_ShopNoBuy);
                    }
                    else {
                        return callback(errorCodes.TodayNoTimes);
                    }

                }
            }
        }
        else if (buyNum == 0) {
            if (tempTemplate[tGoods.addNumForVipLevel] > 0) {
                if (myVipLevel >= tempTemplate[tGoods.addNumForVipLevel] && goodsID > 2000
                    && goodsID
                        < 3000) {
                    return callback(errorCodes.Cs_ShopVipNoBuy);
                }
                return callback(errorCodes.Cs_ShopNoBuy);
            }
            else {
                return callback(errorCodes.TodayNoTimes);
            }
        }

        // for tlog ///////////////////////
        var costFactor = eAssetsReduce.ShopPurchase;
        if (giftItemNum <= 0) {
            if (itemTemplate[tItem.itemType] == eItemType.Special) {
                if (itemTemplate[tItem.subType] == eSpecial.TreasureBox) {
                    costFactor = eAssetsReduce.ShopTreasure;
                } else if (itemTemplate[tItem.subType] == eSpecial.Assets) {
                    var otherID = itemTemplate[tItem.otherID];
                    var assetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', otherID);

                    var assetsType = assetsTemplate['type'];

                    if (assetsType == 6) { // 生命水
                        costFactor = eAssetsReduce.BuyHpInShop;
                    } else if (assetsType == 7) { // 魔法水
                        costFactor = eAssetsReduce.BuyMpInShop;
                    } else if (assetsType == 4) { // 1-10级灵石
                        costFactor = eAssetsReduce.BuyLingshi;
                    } else if (assetsType == 8) { // 1-5级强化石
                        costFactor = eAssetsReduce.BuyIntensifyStone;
                    } else if (itemID == 9101) { // 紫色熔炼石
                        costFactor = eAssetsReduce.BuyPurpleStone;
                    } else if (itemID == 9102) { // 橙色熔炼石
                        costFactor = eAssetsReduce.BuyOrangeStone;
                    } else if (assetsType == 12) { // 魔晶
                        costFactor = eAssetsReduce.BuyCrystal;
                    } else if (assetsType == 13) { //神果
                        costFactor = eAssetsReduce.BuySuperFruit;
                    } else if (itemID == 1004) { // 魂1
                        costFactor = eAssetsReduce.BuySoul1;
                    } else if (itemID == 1005) { // 魂2
                        costFactor = eAssetsReduce.BuySoul2;
                    } else if (itemID == 1006) { // 魂3
                        costFactor = eAssetsReduce.BuySoul3;
                    } else if (itemID == 1007) { // 魂4
                        costFactor = eAssetsReduce.BuySoul4;
                    } else if (itemID == 1008) { // 魂5
                        costFactor = eAssetsReduce.BuySoul5;
                    } else if (assetsType == 18) { // 符文
                        costFactor = eAssetsReduce.BuyRune
                    } else if (assetsType == 19) { // 时装碎片
                        costFactor = eAssetsReduce.BuyFashionChip
                    } else if (assetsType == 2) {  // 符文技能点
                        costFactor = eAssetsReduce.BuyRunePoint
                    }
                }
            }
        }
        //////////////////////////////////
        player.GetAssetsManager().AlterAssetsValue(moneyID, -moneyNum, costFactor);

        // for tlog /////////////////////
        var produceFactor = eAssetsAdd.GoldShop;
        if (moneyID == globalFunction.GetYuanBaoTemp()) {
            produceFactor = eAssetsAdd.ZuanshiShop;
        } else if (moneyID == globalFunction.GetFriend()) {
            produceFactor = eAssetsAdd.FdPointShop;
        }
        /////////////////////////////////
        var log_itemList = [];
        if (giftItemNum > 0) {
            var giftItems = self.GetShopGiftItemList(goodsID);
            if (!giftItems) {
                return errorCodes.ParameterNull;
            }
            for (var i in giftItems.itemList) {
                var ID = giftItems.itemList[i].id;
                var num = giftItems.itemList[i].num;
                log_itemList = player.AddItem(+ID, num, produceFactor, log_EventGuid);
            }
            var route = "ServerTreasureBoxList";
            player.SendMessage(route, giftItems);
        } else if (treasureBox) {
            var boxItems = self.GetTreasureBoxItemID(itemID);
            if (null == boxItems) {
                return errorCodes.SystemWrong;
            }
            for (var i in boxItems.itemList) {
                var ID = boxItems.itemList[i].id;
                var num = boxItems.itemList[i].num;
                log_itemList = player.AddItem(+ID, num, produceFactor, log_EventGuid);
            }
            var route = "ServerTreasureBoxList";
            player.SendMessage(route, boxItems);
        } else {
            log_itemList =
            player.AddItem(itemID, tempTemplate[tGoods.itemNum], produceFactor, log_EventGuid);
        }
        msg.itemList.push(goodsID);
        ///////////////////////////////////////////////////////////////////////////
        var openID = player.GetOpenID();
        var accountType = player.GetAccountType();
        var lv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
        if (moneyID == globalFunction.GetMoneyTemp()) {
            var moneyType = 0;
        } else if (moneyID == globalFunction.GetYuanBaoTemp()) {
            var moneyType = 1;
        } else {
            var moneyType = 2;
        }
        if (giftItemNum <= 0) {
            tlogger.log({3: 0}, 'ItemMoneyFlow', accountType, openID, itemTemplate[tItem.itemType], itemID,
                        tempTemplate[tGoods.itemNum],
                        moneyNum, lv, moneyType);
        }
        ///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var log_ItemGuid = log_getGuid.GetUuid();    //全网唯一标识
        var log_date = log_utilSql.DateToString(new Date());
        var log_RoleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
        var log_BuyItemFlag = false;        //判断玩家购买的是否为物品
        for (var index in log_itemList) {
            log_BuyItemFlag = true;
            var log_ItemArgs = [log_ItemGuid];
            var tempItem = log_itemList[index];
            for (var i = 0; i < eItemInfo.Max; ++i) {      //将物品的详细信息插入到sql语句中
                log_ItemArgs.push(tempItem.GetItemInfo(i));
            }
            log_ItemArgs.push(eItemChangeType.BUY);                           //物品变化原因
            log_ItemArgs.push(eEmandationType.ADD);                           //购买、出售
            log_ItemArgs.push(log_date);                                         //变化时间
            log_insLogSql.InsertSql(eTableTypeInfo.ItemChange, log_ItemArgs);
        }

        var log_EventArgs = [log_EventGuid, player.GetPlayerInfo(ePlayerInfo.ROLEID),
                             moneyID, moneyNum, log_utilSql.DateToString(new Date())];
        log_insLogSql.InsertSql(eTableTypeInfo.BuyEvent, log_EventArgs);

        if (log_BuyItemFlag) {
            log_MoneyArgs.push(log_ItemGuid);         //购买物品的guid
        }
        else {
            log_MoneyArgs.push(log_EventGuid);         //当用户购买的不是物品时字段设置为购买事件的guid
        }
        log_MoneyArgs.push(moneyID);                                                  //金钱类型
        log_MoneyArgs.push(log_beforeMoneyChange);                                    //变化前金钱值
        log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(moneyID));        //变化后金钱值
        log_MoneyArgs.push(log_utilSql.DateToString(new Date()));         //时间
        log_insLogSql.InsertSql(eTableTypeInfo.MoneyChange, log_MoneyArgs);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        return callback(msg);
    }

};

handler.SetVipBuyNum = function (newLevel) {
    var self = this;
    for (var index in self.dataList) {
        var tempShop = self.dataList[index];
        if (tempShop) {
            var attID = tempShop.GetDataInfo(eGoodsInfo.GoodsID);
            var goodsTemplate = templateManager.GetTemplateByID('GoodsTemplate', attID);

            // var vipTemplate = null;
            var myVipLevel = self.owner.GetPlayerInfo(ePlayerInfo.VipLevel);//TODO  钻石商店物品购买次数+1
            var addNum = 0;
            var VipBuyTop = +tempShop.GetDataInfo(eGoodsInfo.VipBuyTop);
            if (!!goodsTemplate && goodsTemplate[tGoods.addNumForVipLevel] > 0 && myVipLevel
                >= goodsTemplate[tGoods.addNumForVipLevel]
                    && attID > 2000 && attID <= 3000 && VipBuyTop == 0) { //钻石商店物品
                self.dataList[index].SetDataInfo(eGoodsInfo.VipBuyTop, 1);
                addNum = 1;
            }
            if (!!goodsTemplate) {
                tempShop.SetDataInfo(eGoodsInfo.BuyNum, tempShop.GetDataInfo(eGoodsInfo.BuyNum) + addNum);
            }
        }
    }
};

handler.GetTreasureBoxItemID = function (itemID) {
    var ItemTemplate = templateManager.GetTemplateByID('ItemTemplate', itemID);
    var msg = {
        itemList: [],
        type: 1
    }
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
//    var vipLV = player.GetPlayerInfo(ePlayerInfo.VipLevel) + 1;
    var ExpLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
//    if (vipLV < TreasureBoxListTemplate['vipMin'] || vipLV > TreasureBoxListTemplate['vipMax']) {
//        return null;
//    }
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
//    var itemNum = TreasureBoxTemplate['itemNum'];
    var itemNum = TreasureBoxListTemplate['itemNum'];
    for (var i = 0; i < itemNum; ++i) {
        var ID = TreasureBoxTemplate['itemID_' + i];
        var Num = TreasureBoxTemplate['itemNum_' + i];
        var temp = {
            id: ID,
            num: Num
        }
        msg.itemList.push(temp);
    }
    return msg;
};
handler.GetShopGiftItemList = function (goodsID) {
    var tempTemplate = templateManager.GetTemplateByID('GoodsTemplate', goodsID);
    if (null == tempTemplate) {
        return false;
    }
    var giftItemNum = tempTemplate[tGoods.giftItemNum];
    if (null == giftItemNum) {
        return false;
    }
    var msg = {
        itemList: [],
        type: 1
    }
    if (giftItemNum > 0) {
        var itemNum = tempTemplate['itemNum'];
        for (var i = 0; i < giftItemNum; ++i) {
            var ID = tempTemplate['giftItemID_' + i];
            var Num = tempTemplate['giftItemNum_' + i];
            var temp = {
                id: ID,
                num: Num
            }
            msg.itemList.push(temp);
        }
        return msg;
    }
    return false;
};
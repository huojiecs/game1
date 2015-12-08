/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午2:36
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var _ = require('underscore');
var async = require('async');
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var rival = require('./rival');
var globalFunction = require('../../tools/globalFunction');
var playerManager = require('./../player/playerManager');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var pvpFormula = require('./pvpFormula');
var utils = require('../../tools/utils');
var fsSql = require('../../tools/mysql/fsSql');
var utilSql = require('../../tools/mysql/utilSql');
var csSql = require('../../tools/mysql/csSql');
var Q = require('q');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var sCsString = stringValue.sCsString;
var sPublicString = stringValue.sPublicString;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

/** 战魂购买次数*/
var PVP_PURSE_TIMES = 177;

/** 战魂刷新对手*/
var PVP_REFRESH_REVAL = 178;

/** 战魂二次复仇*/
var PVP_2_REVENGE = 179;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.rivals = [];
    this.matchRunning = {running: false};
    this.owner = owner;
    this.attackNum = 0;
    this.attackedNum = 0;
    this.loseTimes = 0;
    this.lostLingli = 0;
    this.blessLeft = 0;
    this.blessReceived = utils.packWithDay(0);
    this.attackNumAddByBless = utils.packWithDay(0);
    this.refreshLastTime = new Date(0);
    this.exchange = [];
    this.attackCost = 0;
    this.requireBlessLeft = 0;
    this.buyPvpNum = 0;
    this.players = [];
};

var MAX_ZHAN_LEN = 50;

var handler = Handler.prototype;

handler.LoadRival = function (data) {
    var excepts = {};

    for (var index in data) {

        if (data[index][3] === 0 && data[index][2] in excepts) {
            continue;
        }

        excepts[data[index][2]] = true;

        var aRival = new rival();
        aRival.SetRecord("rivalID", data[index][0]);
        aRival.SetRecord("otherID", data[index][2]);
        aRival.SetRecord("otherType", data[index][3]);
        aRival.SetRecord("lingliLost", data[index][4] || 0);
        this.rivals.push(aRival);

        if(this.rivals.length >= MAX_ZHAN_LEN){
            break;
        }
    }
};

handler.LoadInfo = function (data, isOffline) {

    var self = this;

    if (data.length > 0) {
        self.blessLeft = data[gameConst.eAsyncPvPInfo.BlessLeft] || 0;
        self.blessLeft = defaultValues.aPvPBlessNumMax - utils.unpackWithDay(self.blessLeft);

        // 受祝福次数，此数据在离线的时候也会有变动，因其数据的特殊性，在此做一些换算处理
        // 需要修改此值时先用utils.unpackWithDay解包，得到的数做完修改操作再将得出的新值打包赋值到此变量上
        self.blessReceived = data[gameConst.eAsyncPvPInfo.BlessReceived] || 0;
        self.blessReceived = utils.unpackWithDay(self.blessReceived);
        self.blessReceived = utils.packWithDay(self.blessReceived);


        // 因受到祝福后，产生的斩魂次数额外增加值，原理同上
        self.attackNumAddByBless = data[gameConst.eAsyncPvPInfo.AttackNumAddByBless] || 0;
        self.attackNumAddByBless = utils.unpackWithDay(self.attackNumAddByBless);
        self.attackNumAddByBless = utils.packWithDay(self.attackNumAddByBless);

        self.refreshLastTime = data[gameConst.eAsyncPvPInfo.RefreshLastTime] || 0;
        self.refreshLastTime = new Date(self.refreshLastTime);

        self.attackCost = data[gameConst.eAsyncPvPInfo.AttackCost];

        self.requireBlessLeft = data[gameConst.eAsyncPvPInfo.RequireBlessLeft] || 0;
        self.requireBlessLeft = defaultValues.aPvPRequireBlessLeftMax - utils.unpackWithDay(self.requireBlessLeft);
    }
    else {
        // default values if no data in db.

        //self.attackNum = defaultValues.aPvPAttackNumMax;
        var allTemplate = templateManager.GetTemplateByID('AllTemplate', PVP_PURSE_TIMES);

        self.blessLeft = defaultValues.aPvPBlessNumMax;
        self.refreshLastTime = new Date(0);
        self.attackCost = allTemplate['attnum'];//defaultValues.aPvPAttackCost;
        self.requireBlessLeft = defaultValues.aPvPRequireBlessLeftMax;
    }

    var roleID = self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];
    var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel); // TODO VIP PVP被祝福次数+1
    var vipTemplate = null;
    if (null == ownerVipLevel || ownerVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
    }
    var vipAddBlessNum = 0;
    if (null != vipTemplate) {
        vipAddBlessNum = vipTemplate[templateConst.tVipTemp.PVPBlessedNum];
    }

    var _blessReceived = utils.unpackWithDay(self.blessReceived);
    var _attackNumAddByBless = utils.unpackWithDay(self.attackNumAddByBless);
    if (!isOffline && _attackNumAddByBless < _blessReceived) {
        if (_attackNumAddByBless >= defaultValues.aPvPBlessReceivedNumMax + vipAddBlessNum) {
            return;
        }
        if (_blessReceived > defaultValues.aPvPBlessReceivedNumMax + vipAddBlessNum) {
            var value = defaultValues.aPvPBlessReceivedNumMax + vipAddBlessNum;
        }
        else {
            var value = _blessReceived;
        }
        //var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
        pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, roleID, function (err, obj) {
            if (!!err) {
                return;
            }
            if (_.isEmpty(obj)) {
                logger.warn('GetPlayerPvpInfo obj is empty, %d', roleID);
                return;
            }
            // log for test
            logger.warn('GetPlayerPvpInfo on login load, roleID == %d, blessReceived == %d, attackNumAddByBless == %d, obj == %j',
                        roleID, _blessReceived, _attackNumAddByBless, obj);

            var attackNum = obj[gameConst.eAsyncPvPInfo_EX.attackNum] || 0;
            attackNum = utils.unpackAttackNumWithDay(attackNum);
            obj[gameConst.eAsyncPvPInfo_EX.attackNum] =
            utils.packWithDay(attackNum + (value - _attackNumAddByBless));
            pomelo.app.rpc.pvp.pvpRemote.AddPlayerPvpInfo(null, roleID, obj, function (err) {
                logger.info('roleID %d, attackNum is added on login, attackNum_old[%d], attackNum_new[%d], addNum[%d]',
                            roleID, attackNum, attackNum + (value - _attackNumAddByBless),
                            (value - _attackNumAddByBless));
                self.attackNumAddByBless = utils.packWithDay(value);
                // log for test
                logger.warn('AddPlayerPvpInfo on login load, roleID == %d, blessReceived == %d, attackNumAddByBless == %d, obj == %j',
                            roleID, _blessReceived, value, obj);
            });
        });
    }
};

handler.LoadShopLingliInfo = function (data) {
    var self = this;
    self.exchange = data;

    self.exchange.forEach(function (data) {
        data[3] = utils.unpackWithDay(data[3]);
    });
};

handler.GetShopLingliSqlStr = function () {
    var self = this;
    var exchangeData = JSON.parse(JSON.stringify(self.exchange));
    exchangeData.forEach(function (data) {
        data[3] = utils.packWithDay(data[3]);
    });
    return exchangeData;
};

/**
 * @return {string}
 */
handler.GetSqlStrRival = function (roleID) {
    var self = this;
    var rows = [];

    var info = '';
    for (var i in this.rivals) {
        var temp = this.rivals[i];
        info += '(';
        info +=
        roleID + ',' + temp.records["otherID"] + ',' + temp.records["otherType"] + ',' + (temp.records["lingliLost"]
            || 0);
        info += '),';

        rows.push([roleID, temp.records["otherID"], temp.records["otherType"], (temp.records["lingliLost"] || 0)]);
    }
    info = info.substring(0, info.length - 1);

    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== info) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, info);
    }

    return sqlString;
};

handler.GetSqlStrInfo = function (roleID) {

    var blessLeft = utils.packWithDay(defaultValues.aPvPBlessNumMax - this.blessLeft);

    var blessReceived = utils.unpackWithDay(this.blessReceived);
    blessReceived = utils.packWithDay(blessReceived);

    var attackNumAddByBless = utils.unpackWithDay(this.attackNumAddByBless);
    attackNumAddByBless = utils.packWithDay(attackNumAddByBless);

    var attackCost = this.attackCost;

    var requireBlessLeft = utils.packWithDay(defaultValues.aPvPRequireBlessLeftMax - this.requireBlessLeft);

    var info = '';
    info += '(';
    info += roleID
                + ',' + blessLeft
                + ',' + blessReceived
                + ',' + attackNumAddByBless
                + ',' + this.refreshLastTime.getTime()
                + ',' + attackCost
                + ',' + requireBlessLeft
    ;
    info += ')';

    //logger.error('%d handler.GetSqlStrInfo: %s', roleID, info);

//    return info;

    var sqlString = utilSql.BuildSqlValues([
                                               [
                                                   roleID, blessLeft, blessReceived, attackNumAddByBless,
                                                   this.refreshLastTime.getTime(), attackCost, requireBlessLeft]
                                           ]);

    if (sqlString !== info) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, info);
    }

    return sqlString;
};

handler.Update12Info = function () {
    var self = this;
    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    /* pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
     if (!!err) {
     return;
     }
     if(_.isEmpty(obj)) {
     logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
     return;
     }
     // loge for test
     logger.warn('GetPlayerPvpInfo on update12info, roleID == %d, obj == %j', ownerID, obj);
     obj[gameConst.eAsyncPvPInfo_EX.attackNum] = utils.packWithDay(defaultValues.aPvPAttackNumMax);
     obj[gameConst.eAsyncPvPInfo_EX.attackedNum] = utils.packWithDay(0);
     pomelo.app.rpc.pvp.pvpRemote.AddPlayerPvpInfo(null, ownerID, obj, function() {
     // log for test
     logger.warn('AddPlayerPvpInfo on update12info, roleID == %d, obj == %j', ownerID, obj);
     });
     });*/
    var allTemplate = templateManager.GetTemplateByID('AllTemplate', PVP_PURSE_TIMES);

    this.blessLeft = defaultValues.aPvPBlessNumMax;
    this.requireBlessLeft = defaultValues.aPvPRequireBlessLeftMax;
    this.attackCost = allTemplate['attnum']; //defaultValues.aPvPAttackCost;
    this.exchange = [];

    this.blessReceived = utils.unpackWithDay(this.blessReceived);
    this.blessReceived = utils.packWithDay(this.blessReceived);

    this.attackNumAddByBless = utils.unpackWithDay(this.attackNumAddByBless);
    this.attackNumAddByBless = utils.packWithDay(this.attackNumAddByBless);
    // log for test
    logger.warn('AddPlayerPvpInfo on update12info, roleID == %d, blessReceived == %d, attackNumAddByBless == %d',
                ownerID, utils.unpackWithDay(this.blessReceived), utils.unpackWithDay(this.attackNumAddByBless));
};

handler.RequireState = function () {

    var result = new Array();

    return result;

};

var _keys = function (obj) {
    if (Object.keys) {
        return Object.keys(obj);
    }
    var keys = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            keys.push(k);
        }
    }
    return keys;
};

var _values = function (obj) {
    var values = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            values.push(obj[k]);
        }
    }
    return values;
};

var SelectRivals = function (otherType, arr) {
    var values = [];
    for (var k in arr) {
        if (arr[k].GetRecord("otherType") === otherType) {
            values.push(arr[k]);
        }
    }
    return values;
};

var SelectRecords = function (otherType, key, arr) {
    var values = [];
    for (var k in arr) {
        if (arr[k].GetRecord("otherType") === otherType) {
            values.push(arr[k].GetRecord(key));
        }
    }
    return values;
};

var SelectRival = function (otherID, otherType, arr) {

    for (var k in arr) {
        if (arr[k].GetRecord("otherID") === otherID && arr[k].GetRecord("otherType") === otherType) {
            return arr[k];
        }
    }

    return null;
};

var RemoveRival = function (otherID, otherType, arr) {
    for (var k = 0; k < arr.length; ++k) {
        if (arr[k].GetRecord("otherID") === otherID && arr[k].GetRecord("otherType") === otherType) {
            arr.splice(k, 1);
            return;
        }
    }
};

var RemoveRivals = function (otherType, arr) {
    var result = {};
    for (var k = 0; k < arr.length; ++k) {
        if (arr[k].GetRecord("otherType") === otherType) {
            result[arr[k].GetRecord("otherID")] = true;
            arr.splice(k, 1);
            k -= 1;
        }
    }
    return result;
};

var SelectRevenges = function (arr) {
    var values = [];
    for (var k in arr) {
        if (arr[k].GetRecord("otherType") > gameConst.eRivalState.ZhanHun2) {
            values.push(arr[k]);
        }
    }
    return values;
};

handler.AddRevenge = function (roleID, otherID, rivalState, lost, isOnline) {
    if (isOnline) {
        if(this.rivals.length >= MAX_ZHAN_LEN){
            return;
        }
        var aRival = new rival();
        aRival.SetRecord("rivalID", 0);
        aRival.SetRecord("otherID", otherID);
        aRival.SetRecord("otherType", rivalState);
        aRival.SetRecord("lingliLost", lost);
        this.rivals.push(aRival);

    } else {
        var info = '';
        info += '(';
        info += roleID + ',' + otherID + ',' + rivalState + ',' + (lost || 0);
        info += ')';
        csSql.SaveAsyncPvPRivalOffline(roleID, info, function (err) {
            if (!!err) {
                logger.warn('error when SaveAsyncPvPRivalOffline, %d', roleID);
                return;
            }
        });
    }
};

handler.RefreshRival = function (type, callback) {
    var self = this;

    if (typeof type !== 'number' || type < gameConst.eRivalState.ZhanHun0 || type > gameConst.eRivalState.ZhanHun2) {
        return callback(errorCodes.ParameterWrong);
    }

    if (self.matchRunning.running) {
        return callback(errorCodes.PvP_InMatch);
    }

    var now = new Date();

    var allTemplate = templateManager.GetTemplateByID('AllTemplate', PVP_REFRESH_REVAL);

    if (now.getTime() - self.refreshLastTime.getTime() < defaultValues.aPvPRefreshSeconds * 1000) {
        var yuanbaoID = globalFunction.GetYuanBaoTemp();
        var cost = allTemplate['attnum'];//defaultValues.aPvPRefreshCost;
        if (!self.owner.assetsManager.CanConsumeAssets(yuanbaoID, cost)) {
            return callback(errorCodes.NoYuanBao, null);
        }
        else {
            self.owner.assetsManager.SetAssetsValue(yuanbaoID, -cost);
        }
    }

    self.refreshLastTime = now;

    var excepts = RemoveRivals(type, self.rivals);

    self.RequireRival(type, excepts, callback);
};

handler.RequireRival = function (type, excepts, callback) {
    var self = this;

    if (typeof type !== 'number' || type < gameConst.eRivalState.ZhanHun0 || type > gameConst.eRivalState.ZhanHun2) {
        return callback(errorCodes.ParameterWrong);
    }

    if (self.matchRunning.running) {
        return callback(errorCodes.PvP_InMatch);
    }
    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
        if (!!err) {
            return callback(errorCodes.SystemWrong);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
            return callback(errorCodes.NoRole);
        }
        var result = [];
        var newRivals = [];
        var rivalCount = pvpFormula.RivalCount(type);
        var ownerLingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
        var ownerExpLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
        var ownerHonor = obj[gameConst.eAsyncPvPInfo_EX.honor];
        var values;

        var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel); // TODO VIP PVP被祝福次数+1
        var vipTemplate = null;
        if (null == ownerVipLevel || ownerVipLevel == 0) {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
        } else {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
        }
        var vipAddBlessNum = 0;
        if (null == vipTemplate) {
            return callback(errorCodes.SystemWrong);
        }

        excepts[self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID]] = true;

        async.auto({
                       check_rivals: function (autoCallback) {
                           var rivals = SelectRivals(type, self.rivals);
                           async.each(rivals,
                                      function (item, eachCallback) {
                                          item.GetDetails(self.owner, function (err, data) {
                                              if (!err /*&& item.IsValid()*/) {
                                                  excepts[item.GetRecord("otherID")] = true;
                                                  data["lingliGet"] =
                                                  pvpFormula.ZhanHunLingliWin(ownerLingli, ownerExpLevel, data.lingli,
                                                                              data.expLevel,
                                                                              vipTemplate[templateConst.tVipTemp.PVPGetLingLiAdd])[0];
                                                  data["lingliLoss"] = pvpFormula.ZhanHunLingliLose(type)[0];
                                                  data["honorGet"] = pvpFormula.HonorWin(ownerHonor, data.honor)[0];
                                                  data["honorLoss"] = pvpFormula.HonorLose(ownerHonor, data.honor)[0];
                                                  result.push(data);
                                              }
                                              else {
                                                  var index = self.rivals.indexOf(item);
                                                  if (index > -1) {
                                                      self.rivals.splice(index, 1);
                                                  }
                                              }
                                              eachCallback();
                                          });
                                      },
                                      function (err) {
                                          autoCallback(err, result);
                                      });
                       },
                       retrieve_enough_rival: ["check_rivals", function (autoCallback) {
                           var count = rivalCount - result.length;
                           if (count < 0) {
                               result.splice(rivalCount - 1, -count);
                               RemoveRivals(type, self.rivals);
                               count = 0;
                           }
                           if (count === 0) {
                               return autoCallback(null, self.rivals);
                           }
                           pomelo.app.rpc.pvp.pvpRemote.FindRivals(null, count,
                                                                   self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID],
                                                                   excepts, function (err, data) {
                                   newRivals = data || [];
                                   autoCallback(err, data);
                               });
                       }],
                       get_rival_details: ["retrieve_enough_rival", function (autoCallback) {
                           async.each(newRivals,
                                      function (item, eachCallback) {
                                          var newRival = new rival();
                                          newRival.SetRecord("otherID", item);
                                          newRival.SetRecord("otherType", type);
                                          newRival.GetDetails(self.owner, function (err, data) {
                                              if (!!err) {
                                                  return eachCallback(err);
                                              }
                                              data["lingliGet"] =
                                              pvpFormula.ZhanHunLingliWin(ownerLingli, ownerExpLevel, data.lingli,
                                                                          data.expLevel,
                                                                          vipTemplate[templateConst.tVipTemp.PVPGetLingLiAdd])[0];
                                              data["lingliLoss"] = pvpFormula.ZhanHunLingliLose(type)[0];
                                              data["honorGet"] = pvpFormula.HonorWin(ownerHonor, data.honor)[0];
                                              data["honorLoss"] = pvpFormula.HonorLose(ownerHonor, data.honor)[0];
                                              result.push(data);
                                              self.rivals.push(newRival);
                                              return eachCallback();
                                          });
                                      },
                                      function (err) {
                                          autoCallback(err, result);
                                          if (result.length !== rivalCount) {
                                              return callback(errorCodes.PvP_NotEnoughRivals);
                                          }

                                          return callback(errorCodes.OK, result);
                                      });
                       }]
                   });
    });
};

handler.RequireRevenge = function (callback) {
    var self = this;
    var result = [];

    if (self.matchRunning.running) {
        return callback(errorCodes.PvP_InMatch);
    }
    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
        if (!!err) {
            return callback(errorCodes.SystemWrong);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
            return callback(errorCodes.NoRole);
        }
        var ownerLingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
        var ownerHonor = obj[gameConst.eAsyncPvPInfo_EX.honor];
        var revenges = SelectRevenges(self.rivals);
        async.each(revenges,
                   function (item, eachCallback) {
                       item.GetDetails(self.owner, function (err, data) {
                           if (!err) {
                               data["otherType"] = item.GetRecord("otherType");
                               data["lingliGet"] =
                               pvpFormula.FuChouLingliWin(data.lingli, data.expLevel)[0];
                               data["lingliLoss"] = pvpFormula.FuChouLingliLose(gameConst.eRivalState.FuChou)[0];
                               data["honorGet"] = pvpFormula.HonorWin(ownerHonor, data.honor)[0];
                               data["honorLoss"] = pvpFormula.HonorLose(ownerHonor, data.honor)[0];
                               data["lingliLost"] = item.GetRecord("lingliLost");
                               result.push(data);
                           }
                           else {
                               var index = self.rivals.indexOf(item);
                               if (index > -1) {
                                   self.rivals.splice(index, 1);
                               }
                           }
                           eachCallback();
                       });
                   },
                   function (err) {
                       return callback(errorCodes.OK, result);
                   });
    });
};

handler.BeginMatchRival = function (type, callback) {
    var self = this;

    if (typeof type !== 'number' || type < gameConst.eRivalState.ZhanHun0 || type > gameConst.eRivalState.ZhanHun2) {
        return callback(errorCodes.ParameterWrong);
    }

    var rivals = SelectRivals(type, self.rivals);
    var matchRequirePlayerCount = type * 2 + 1;

    if (!rivals || rivals.length !== matchRequirePlayerCount) {
        return callback(errorCodes.PvP_InvalidRival, null);
    }

    rivals.forEach(function (rival) {
        if (rival.GetRecord("otherType") < gameConst.eRivalState.ZhanHun0
            && rival.GetRecord("otherType") > gameConst.eRivalState.ZhanHun2) {
            return callback(errorCodes.PvP_RivalState, null);
        }
    });

    if (!!self.matchRunning.running) {
        return callback(errorCodes.PvP_InMatch, null);
    }

    var useYuanbao = false;
    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
        if (!!err) {
            return callback(errorCodes.SystemWrong);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
            return callback(errorCodes.NoRole);
        }
        var attackNum = obj[gameConst.eAsyncPvPInfo_EX.attackNum] || 0;
        attackNum = utils.unpackAttackNumWithDay(attackNum);

        if (attackNum <= 0) {
            if (!self.owner.assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, self.attackCost)) {
                return callback(errorCodes.NoYuanBao, null);
            }
            else {

                var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel); //TODO 达到vip可购买1次斩魂次数
                var vipTemplate = null;
                if (null == ownerVipLevel || ownerVipLevel == 0) {
                    vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
                } else {
                    vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
                }
                if (null == vipTemplate) {
                    return;
                }
                if (vipTemplate[templateConst.tVipTemp.buyPVPNum] <= 0) {
                    return callback(errorCodes.VipLevel, null);
                }
                var pvpNum = self.owner.vipInfoManager.getNumByType(gameConst.eVipInfo.BuyPVPNum);
                if (pvpNum >= vipTemplate[templateConst.tVipTemp.buyPVPNum]) {
                    return callback(errorCodes.PVPNoTimes, null);
                }
                self.owner.vipInfoManager.setNumByType(self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID],
                                                       gameConst.eVipInfo.BuyPVPNum, 1);

                useYuanbao = true;
            }
//        return callback(errorCodes.PvP_aPvVPAttackNum, null);
        }

        var players = [];
        async.each(rivals,
                   function (rival, eachCallback) {
                       var otherID = rival.GetRecord("otherID");
                       var otherType = rival.GetRecord("otherType");
                       rival.GetDetails(self.owner, function (err, details) {
                           if (!!err) {
                               RemoveRival(otherID, otherType, self.rivals);
                               pomelo.app.rpc.pvp.pvpRemote.RemovePlayerScore(null, otherID, utils.done);
                               return callback(errorCodes.PvP_InvalidRival, null);
                           }

                           /*if (otherType >= gameConst.eRivalState.ZhanHun0 && otherType <= gameConst.eRivalState.ZhanHun2) {
                            if (details.APvPAttackedNum >= defaultValues.aPvPAttackedNumMax) {
                            RemoveRival(otherID, otherType, self.rivals);
                            pomelo.app.rpc.pvp.pvpRemote.RemovePlayerScore(null, otherID, utils.done);
                            return callback(errorCodes.PvP_aPvPAttackedNum);
                            }
                            }*/

                           pomelo.app.rpc.ps.psRemote.PvpAttConstructMessage(null, otherID, function (err, attList) {
                               if (!!err) {
                                   logger.info(err);
                                   RemoveRival(otherID, otherType, self.rivals);
                                   pomelo.app.rpc.pvp.pvpRemote.RemovePlayerScore(null, otherID, utils.done);
                                   return callback(errorCodes.PvP_InvalidRival, null);
                               }

                               attList.roleID = otherID;
                               attList.maxSoulTemplateID = details.maxSoulTemplateID;
                               attList.maxSoulLevel = details.maxSoulLevel;
                               attList.expLevel = details.expLevel;
                               attList.petList = details.petList;
                               players.push(attList);
                               eachCallback();
                           });
                       });
                   },
                   function (err) {
                       var roleID = self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];
                       pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, roleID, function (err, obj) {
                           if (!!err) {
                               return callback(errorCodes.SystemWrong);
                           }
                           if (_.isEmpty(obj)) {
                               logger.warn('GetPlayerPvpInfo obj is empty, %d', roleID);
                               return callback(errorCodes.NoRole);
                           }
                           // log for test
                           logger.warn('GetPlayerPvpInfo on BeginMatchRival, roleID == %d, obj == %j', roleID, obj);
                           var attackNum = obj[gameConst.eAsyncPvPInfo_EX.attackNum] || 0;
                           attackNum = utils.unpackAttackNumWithDay(attackNum);

                           if (type >= gameConst.eRivalState.ZhanHun0 && type <= gameConst.eRivalState.ZhanHun2
                               && attackNum > 0) {
                               obj[gameConst.eAsyncPvPInfo_EX.attackNum] = utils.packWithDay(attackNum - 1);
                           }

                           self.matchRunning.type = type;
                           self.matchRunning.rivals = rivals;
                           self.matchRunning.running = true;

                           if (useYuanbao) {
                               //self.owner.assetsManager.SetAssetsValue(globalFunction.YuanBaoID, -self.attackCost);
                               self.owner.assetsManager.AlterAssetsValue(globalFunction.YuanBaoID, -self.attackCost,
                                                                         eAssetsReduce.BuyZhanHunAttackNum);
                               self.attackCost *= 2;
                           }
                           pomelo.app.rpc.pvp.pvpRemote.AddPlayerPvpInfo(null, roleID, obj, function (err) {
                               if (!err) {
                                   logger.info('roleID %d, attackNum is added on login, attackNum_old[%d], attackNum_new[%d], addNum[%d]',
                                               roleID, attackNum, attackNum - 1, -1);
                               }
                               // log for test
                               logger.warn('AddPlayerPvpInfo on BeginMatchRival, roleID == %d, obj == %j', roleID, obj);
                           });
                           self.players = players;
                           return callback(errorCodes.OK, players);
                       });
                   });
    });
};

handler.BeginMatchRevenge = function (otherID, otherType, callback) {
    var self = this;

    var rival = SelectRival(otherID, otherType, self.rivals);

    if (!rival) {
        return callback(errorCodes.PvP_InvalidRival, null);
    }

    if (rival.GetRecord("otherType") !== gameConst.eRivalState.FuChou
        && rival.GetRecord("otherType") !== gameConst.eRivalState.FuChouFailed) {
        return callback(errorCodes.PvP_RivalState, null);
    }

    if (self.matchRunning.running) {
        return callback(errorCodes.PvP_InMatch, null);
    }

    var players = [];
    rival.GetDetails(self.owner, function (err, details) {
        if (!!err) {
            RemoveRival(otherID, otherType, self.rivals);
            pomelo.app.rpc.pvp.pvpRemote.RemovePlayerScore(null, otherID, utils.done);
            return callback(errorCodes.PvP_InvalidRival, null);
        }

        pomelo.app.rpc.ps.psRemote.PvpAttConstructMessage(null, otherID, function (err, attList) {
            if (!!err) {
                logger.info(err);
                RemoveRival(otherID, otherType, self.rivals);
                pomelo.app.rpc.pvp.pvpRemote.RemovePlayerScore(null, otherID, utils.done);
                return callback(errorCodes.PvP_InvalidRival, null);
            }

            var allTemplate = templateManager.GetTemplateByID('AllTemplate', PVP_2_REVENGE);

            if (otherType === gameConst.eRivalState.FuChouFailed) {
                var yuanbaoID = globalFunction.GetYuanBaoTemp();
                var cost = allTemplate['attnum']; //defaultValues.aPvPRevengeCost;
                if (!self.owner.assetsManager.CanConsumeAssets(yuanbaoID, cost)) {
                    return callback(errorCodes.NoYuanBao, null);
                }
                else {
                    self.owner.assetsManager.SetAssetsValue(yuanbaoID, -cost);
                }
            }

            self.matchRunning.running = true;
            self.matchRunning.type = otherType;
            self.matchRunning.revenge = [rival];

            attList.roleID = otherID;
            attList.maxSoulTemplateID = details.maxSoulTemplateID;
            attList.maxSoulLevel = details.maxSoulLevel;
            attList.expLevel = details.expLevel;
            attList.petList = details.petList;

            players.push(attList);
            self.players = players;
            return callback(err, players);
        });
    });
};

handler.Accomplish = function (customID, areaWin, callback) {
    var self = this;

    if (!self.matchRunning.running) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }

    if (self.matchRunning.type >= gameConst.eRivalState.ZhanHun0 && self.matchRunning.type
        <= gameConst.eRivalState.ZhanHun2) {
        return self.AccomplishRivals(customID, areaWin, callback);
    }
    else if (self.matchRunning.type === gameConst.eRivalState.FuChou || self.matchRunning.type
        === gameConst.eRivalState.FuChouFailed) {
        return self.AccomplishRevenge(customID, areaWin, callback);
    }
    else {
        return callback(errorCodes.PvP_MatchInvalidState);
    }
};

handler.AccomplishRevenge = function (customID, areaWin, callback) {
    var self = this;

    if (!self.matchRunning.running) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }

    if (!(self.matchRunning.type === gameConst.eRivalState.FuChou || self.matchRunning.type
        === gameConst.eRivalState.FuChouFailed)) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }

    if (!_.isArray(self.matchRunning.revenge) || self.matchRunning.revenge.length === 0) {
        return callback(errorCodes.PvP_InvalidRival, null);
    }

    var otherID = self.matchRunning.revenge[0].GetRecord("otherID");
    var otherType = self.matchRunning.revenge[0].GetRecord("otherType");
    var rival = SelectRival(otherID, otherType, self.rivals);
    if (!rival) {
        return callback(errorCodes.PvP_InvalidRival, null);
    }

    var left = SelectRecords(self.matchRunning.type, 'otherID', self.matchRunning.revenge);
    var right = SelectRecords(self.matchRunning.type, 'otherID', [rival]);
    if (left.sort().toString() !== right.sort().toString()) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }

    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var openID = self.owner.GetOpenID();
    var accountType = self.owner.GetAccountType();
    var lv = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    var vipLv = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);

    // 远程调用,先扣除对方灵力.避免余额不足.
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
        if (!!err) {
            logger.error('error when AccomplishRevenge to GetPlayerPvpInfo, %d, %s', ownerID,
                         utils.getErrorMessage(err));
            return callback(errorCodes.SystemWrong);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
            return callback(errorCodes.NoRole);
        }
        // log for test
        logger.warn('GetPlayerPvpInfo on AccomplishRevenge, roleID == %d, obj == %j', ownerID, obj);
        var params = {
            ownerID: ownerID,
            oLingli: obj[gameConst.eAsyncPvPInfo_EX.lingli],
            oHonor: obj[gameConst.eAsyncPvPInfo_EX.honor],
            oExpLevel: self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel),
            areaWin: areaWin,
            type: otherType
        };

        self.matchRunning = {running: false};

        var result = [];
        pomelo.app.rpc.ps.pvpRemote.AsyncPvPAccomplishLose(null, otherID, params, function (err, data) {
            if (!!err) {
                return callback(err);
            }
            var lingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
            var honor = obj[gameConst.eAsyncPvPInfo_EX.honor];

            if (honor + data.honorGet >= 0) {
                obj[gameConst.eAsyncPvPInfo_EX.honor] = honor + data.honorGet;
            } else {
                obj[gameConst.eAsyncPvPInfo_EX.honor] = 0;
            }
            var honorChange = obj[gameConst.eAsyncPvPInfo_EX.honor] - honor;

            if (lingli + data.lingliGet >= 0) {
                obj[gameConst.eAsyncPvPInfo_EX.lingli] = lingli + data.lingliGet;
            } else {
                obj[gameConst.eAsyncPvPInfo_EX.lingli] = 0;
            }
            var lingliChange = obj[gameConst.eAsyncPvPInfo_EX.lingli] - lingli;

            pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(
                null, obj[gameConst.eAsyncPvPInfo_EX.roleID], obj, function (err) {
                    if (!!err) {
                        logger.error('pvp AddPlayerScore error when AsyncPvPAccomplishLose, %d, %s',
                                     obj[gameConst.eAsyncPvPInfo_EX.roleID], utils.getErrorMessage(err));
                    }
                    self.SendPvPAssetsMsg(obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                          obj[gameConst.eAsyncPvPInfo_EX.honor]);
                    // log for test
                    logger.warn('GetPlayerPvpInfo on AccomplishRevenge, roleID == %d, obj == %j',
                                obj[gameConst.eAsyncPvPInfo_EX.roleID], obj);
                    ///////////////////////////////////////////////
                    var AddOrReduceLingli = data.lingliGet >= 0 ? 0 : 1;
                    var AddOrReduceHonor = data.honorGet >= 0 ? 0 : 1;
                    tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 0,
                                obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                Math.abs(lingliChange), 2, 0, AddOrReduceLingli);
                    tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 1,
                                obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                Math.abs(honorChange), 2, 0, AddOrReduceHonor);
                    ///////////////////////////////////////////////
                });
            if (areaWin) {
                if (otherType === gameConst.eRivalState.FuChou
                    || otherType === gameConst.eRivalState.FuChouFailed) {
                    RemoveRival(otherID, otherType, self.rivals);
                }
                // send mail
                if (data.attackedNum <= defaultValues.aPvPAttackedNumMax
                    && data.expLevel >= defaultValues.aPvPExpLevel) {
                    var ownerName = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.NAME);
                    var mailDetail = {
                        recvID: otherID,
                        subject: sPublicString.mailTitle_2,
                        content: util.format(sCsString.content_3, ownerName, data.honorGet,
                                             Math.abs(data.rivalLingliLost)),//ownerName + '对您进行了复仇，您损失荣誉值' + data.honorGet + '，损失灵力'
                        //+ Math.abs(data.rivalLingliLost),
                        mailType: gameConst.eMailType.System
                    };
                    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
                }
            } else {
                if (otherType === gameConst.eRivalState.FuChou) {
                    rival.SetRecord("otherType", gameConst.eRivalState.FuChouFailed);
                }
            }

            tlogger.log('ZhanHunFlow', accountType, openID, 4, lv, vipLv, areaWin, lingliChange);

            result.push({
                            roleID: otherID,
                            lingliGet: data.lingliGet,
                            honorGet: data.honorGet
                        });
            return callback(null, result);
        });
    });
};

handler.AccomplishRivals = function (customID, areaWin, callback) {
    var self = this;

    if (!self.matchRunning.running) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }

    if (self.matchRunning.type < gameConst.eRivalState.ZhanHun0
        || self.matchRunning.type > gameConst.eRivalState.ZhanHun2) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }
    var pvpType = self.matchRunning.type;
    var rivals = SelectRivals(self.matchRunning.type, self.rivals);
    var left = SelectRecords(self.matchRunning.type, 'otherID', self.matchRunning.rivals);
    var right = SelectRecords(self.matchRunning.type, 'otherID', rivals);
    if (left.sort().toString() !== right.sort().toString()) {
        return callback(errorCodes.PvP_MatchInvalidState);
    }

    RemoveRivals(self.matchRunning.type, self.rivals);

    self.matchRunning = {running: false};

    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var player = playerManager.GetPlayer(ownerID);
    var result = [];
    // for tlog ////////////////////////////////////////
    var lingliGetForTlog = 0;
    var openID = self.owner.GetOpenID();
    var accountType = self.owner.GetAccountType();
    var lv = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    var vipLv = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    ////////////////////////////////////////////////////////////////////////////////////////
    var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == ownerVipLevel || ownerVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
    }
    if (null == vipTemplate) {
        return callback(errorCodes.SystemWrong);
    }

    if (areaWin) {
        var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
        var zuanshiReward = 0;
        if (pvpType == gameConst.eRivalState.ZhanHun0) {
            zuanshiReward = AllTemplate['91']['attnum'];
        } else if (pvpType == gameConst.eRivalState.ZhanHun1) {
            zuanshiReward = AllTemplate['92']['attnum'];
        } else if (pvpType == gameConst.eRivalState.ZhanHun2) {
            zuanshiReward = AllTemplate['93']['attnum'];
        }
        //player.GetAssetsManager().SetAssetsValue(globalFunction.GetYuanBaoTemp(), zuanshiReward);
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), zuanshiReward,
                                                   eAssetsAdd.ZhanHunReward);
    }
    ////////////////////////////////////////////////////////////////////////////////////////
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
        if (!!err) {
            logger.error('error when AccomplishRivals to GetPlayerPvpInfo, %d, %s', ownerID,
                         utils.getErrorMessage(err));
            return callback(errorCodes.SystemWrong);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
            return callback(errorCodes.NoRole);
        }
        // log for test
        logger.warn('GetPlayerPvpInfo on AccomplishRivals, roleID == %d, obj == %j', ownerID, obj);
        async.each(rivals,
                   function (rival, eachCallback) {
                       // 远程调用,先扣除对方灵力.避免余额不足.
                       var otherID = rival.GetRecord("otherID");
                       var otherType = rival.GetRecord("otherType");
                       var pvpInfo = obj;
                       var params = {
                           ownerID: ownerID,
                           oLingli: pvpInfo[gameConst.eAsyncPvPInfo_EX.lingli],
                           oHonor: pvpInfo[gameConst.eAsyncPvPInfo_EX.honor],
                           oExpLevel: self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel),
                           areaWin: areaWin,
                           vipAddRate: vipTemplate[templateConst.tVipTemp.PVPGetLingLiAdd],
                           type: otherType
                       };
                       pomelo.app.rpc.ps.pvpRemote.AsyncPvPAccomplishLose(null, otherID, params, function (err, data) {
                           if (!!err) {
                               return eachCallback(err);
                           }
                           var lingli = pvpInfo[gameConst.eAsyncPvPInfo_EX.lingli];
                           var honor = pvpInfo[gameConst.eAsyncPvPInfo_EX.honor];
                           if (honor + data.honorGet >= 0) {
                               pvpInfo[gameConst.eAsyncPvPInfo_EX.honor] = honor + data.honorGet;
                           } else {
                               pvpInfo[gameConst.eAsyncPvPInfo_EX.honor] = 0;
                           }
                           var honorChange = pvpInfo[gameConst.eAsyncPvPInfo_EX.honor] - honor;

                           if (lingli + data.lingliGet >= 0) {
                               pvpInfo[gameConst.eAsyncPvPInfo_EX.lingli] = lingli + data.lingliGet;
                           } else {
                               pvpInfo[gameConst.eAsyncPvPInfo_EX.lingli] = 0;
                           }
                           var lingliChange = pvpInfo[gameConst.eAsyncPvPInfo_EX.lingli] - lingli;
                           lingliGetForTlog += lingliChange; // for tlog
                           pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(
                               null, obj[gameConst.eAsyncPvPInfo_EX.roleID], pvpInfo, function (err) {
                                   if (!!err) {
                                       logger.error('pvp AddPlayerScore error when AsyncPvPAccomplishLose, %d, %s',
                                                    obj[gameConst.eAsyncPvPInfo_EX.roleID], utils.getErrorMessage(err));
                                   }
                                   self.SendPvPAssetsMsg(pvpInfo[gameConst.eAsyncPvPInfo_EX.lingli],
                                                         pvpInfo[gameConst.eAsyncPvPInfo_EX.honor]);
                                   // log for log
                                   logger.warn('AddPlayerScore on AccomplishRivals, roleID == %d, obj == %j', ownerID,
                                               obj);

                                   ///////////////////////////////////////////////
                                   var AddOrReduceLingli = data.lingliGet >= 0 ? 0 : 1;
                                   var AddOrReduceHonor = data.honorGet >= 0 ? 0 : 1;
                                   tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 0,
                                               obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                               Math.abs(lingliChange), 1, 0, AddOrReduceLingli);
                                   tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 1,
                                               obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                               Math.abs(honorChange), 1, 0, AddOrReduceHonor);
                                   ///////////////////////////////////////////////
                               });
                           if (areaWin) {
                               // send mail
                               if (data.attackedNum <= defaultValues.aPvPAttackedNumMax
                                   && data.expLevel >= defaultValues.aPvPExpLevel) {
                                   var ownerName = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.NAME);
                                   var mailDetail = {
                                       recvID: otherID,
                                       subject: sPublicString.mailTitle_2,
                                       content: util.format(sCsString.content_4, ownerName, data.honorGet,
                                                            Math.abs(data.rivalLingliLost)),//ownerName + '对您进行了掠夺，您损失荣誉值' + data.honorGet + '，损失灵力'
//                                           + Math.abs(data.rivalLingliLost),
                                       mailType: gameConst.eMailType.System
                                   };

                                   pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
                               }
                           }
                           result.push({
                                           roleID: otherID,
                                           lingliGet: data.lingliGet,
                                           honorGet: data.honorGet
                                       });

                           eachCallback();
                       });

                   },
                   function (err) {
                       tlogger.log('ZhanHunFlow', accountType, openID, pvpType + 1, lv, vipLv, areaWin,
                                   lingliGetForTlog);
                       return callback(err, result);
                   }
        );
    });
};

handler.AsyncPvPAccomplishLose = function (params, isOnline, callback) {
    var self = this;
    var roleID = self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];

    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, roleID, function (err, obj) {
        if (!!err) {
            logger.error('error when AsyncPvPAccomplishLose to GetPlayerPvpInfo, %d, %s', roleID,
                         utils.getErrorMessage(err));
            return callback(errorCodes.SystemWrong);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', roleID);
            return callback(errorCodes.NoRole);
        }
        // log for test
        logger.warn('GetPlayerPvpInfo on AsyncPvPAccomplishLose, roleID == %d, obj == %j', roleID, obj);
        var result = {};
        var lost = 0;
        var honorLost = 0;

        var lingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
        var honor = obj[gameConst.eAsyncPvPInfo_EX.honor];

        var attackedNum = obj[gameConst.eAsyncPvPInfo_EX.attackedNum] || 0;
        attackedNum = utils.unpackWithDay(attackedNum);

        var lostTimes = obj[gameConst.eAsyncPvPInfo_EX.lostTimes];
        var loseLingli = obj[gameConst.eAsyncPvPInfo_EX.loseLingli];

        var level = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);

        var resultLingli;
        var resultHonor;
        var isZhanHun = false;

        if (params.type >= gameConst.eRivalState.ZhanHun0 && params.type <= gameConst.eRivalState.ZhanHun2) {
            isZhanHun = true;
            attackedNum += 1;
            if (params.areaWin) {
                resultLingli =
                pvpFormula.ZhanHunLingliWin(params.oLingli, params.oExpLevel, lingli, level, params.vipAddRate);
                resultHonor = pvpFormula.HonorWin(params.oHonor, honor);
                if (attackedNum <= defaultValues.aPvPAttackedNumMax &&
                    self.owner.playerInfo[gameConst.ePlayerInfo.ExpLevel] >= defaultValues.aPvPExpLevel) {
                    lostTimes += 1;
                    self.AddRevenge(roleID, params.ownerID, gameConst.eRivalState.FuChou, resultLingli[1], isOnline);
                }
            }
            else {
                resultLingli = pvpFormula.ZhanHunLingliLose(params.type);
                resultHonor = pvpFormula.HonorLose(params.oHonor, honor);
            }
        }
        else {
            isZhanHun = false;
            if (params.areaWin) {
                resultLingli = pvpFormula.FuChouLingliWin(lingli, level /*params.oLingli, params.oExpLevel*/);
                resultHonor = pvpFormula.HonorWin(params.oHonor, honor);
                lostTimes += 1;
            }
            else {
                resultLingli = pvpFormula.FuChouLingliLose(params.type);
                resultHonor = pvpFormula.HonorLose(params.oHonor, honor);
            }
        }
        lost = resultLingli[1];
        if (attackedNum <= defaultValues.aPvPAttackedNumMax) {
            loseLingli += lost;
        }
        result.lingliGet = resultLingli[0];
        result.rivalLingliLost = resultLingli[1];
        result.attackedNum = attackedNum;
        result.expLevel = self.owner.playerInfo[gameConst.ePlayerInfo.ExpLevel];

        if (isOnline == false) {
            obj[gameConst.eAsyncPvPInfo_EX.loseLingli] = loseLingli;
            obj[gameConst.eAsyncPvPInfo_EX.lostTimes] = lostTimes;
        }
        obj[gameConst.eAsyncPvPInfo_EX.attackedNum] = utils.packWithDay(attackedNum);

        if (lost !== 0) {
            if (result.expLevel >= defaultValues.aPvPExpLevel
                && (isZhanHun == false || attackedNum <= defaultValues.aPvPAttackedNumMax)) {
                if (lingli + lost >= 0) {
                    obj[gameConst.eAsyncPvPInfo_EX.lingli] = lingli + lost;
                } else {
                    obj[gameConst.eAsyncPvPInfo_EX.lingli] = 0;
                }
                var lingliChange = obj[gameConst.eAsyncPvPInfo_EX.lingli] - lingli;
            }
        }
        honorLost = resultHonor[1];
        result.honorGet = resultHonor[0];
        if (honorLost !== 0) {
            if (result.expLevel >= defaultValues.aPvPExpLevel
                && (isZhanHun == false || attackedNum <= defaultValues.aPvPAttackedNumMax)) {
                if (honor + honorLost >= 0) {
                    obj[gameConst.eAsyncPvPInfo_EX.honor] = honor + honorLost;
                } else {
                    obj[gameConst.eAsyncPvPInfo_EX.honor] = 0;
                }
                var honorChange = obj[gameConst.eAsyncPvPInfo_EX.honor] - honor;
            }
        }

        pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, obj[gameConst.eAsyncPvPInfo_EX.roleID], obj, function (err) {
            if (!!err) {
                logger.error('pvp AddPlayerScore error when AsyncPvPAccomplishLose, %d, %s',
                             obj[gameConst.eAsyncPvPInfo_EX.roleID], utils.getErrorMessage(err));
            }
            self.SendPvPAssetsMsg(obj[gameConst.eAsyncPvPInfo_EX.lingli], obj[gameConst.eAsyncPvPInfo_EX.honor]);
            // log for test
            logger.warn('AddPlayerScore on AsyncPvPAccomplishLose, roleID == %d, obj == %j',
                        obj[gameConst.eAsyncPvPInfo_EX.roleID], obj);
            ///////////////////////////////////////////////
            if (result.expLevel >= defaultValues.aPvPExpLevel && lost != 0
                && (isZhanHun == false || attackedNum <= defaultValues.aPvPAttackedNumMax)) {
                var openID = self.owner.GetOpenID();
                var accountType = self.owner.GetAccountType();
                var lv = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
                var AddOrReduceLingli = lost >= 0 ? 0 : 1;
                var AddOrReduceHonor = honorLost >= 0 ? 0 : 1;
                tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 0,
                            obj[gameConst.eAsyncPvPInfo_EX.lingli],
                            Math.abs(lingliChange), 3, 0, AddOrReduceLingli);
                tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 1,
                            obj[gameConst.eAsyncPvPInfo_EX.lingli],
                            Math.abs(honorChange), 3, 0, AddOrReduceHonor);
            }
            ///////////////////////////////////////////////
        });
        return callback(null, result);

    });
};


handler.RequireExchangeList = function (callback) {
    var self = this;

    var PvPExchangeTemplate = templateManager.GetAllTemplate('PvPExchangeTemplate');
    if (!PvPExchangeTemplate) {
        return errorCodes.NoTemplate;
    }

    var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == ownerVipLevel || ownerVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
    }
    if (null == vipTemplate) {
        return;
    }

    var items = [];

    for (var i in PvPExchangeTemplate) {
        var buyLeft = ExchangeLeft(self.exchange, PvPExchangeTemplate[i][templateConst.tPvPExchange.exchangeID],
                                   PvPExchangeTemplate[i][templateConst.tPvPExchange.buyMax]);

        items.push({
                       "exchangeID": PvPExchangeTemplate[i][templateConst.tPvPExchange.exchangeID],
                       "lingli": PvPExchangeTemplate[i][templateConst.tPvPExchange.lingli],
                       "itemID": PvPExchangeTemplate[i][templateConst.tPvPExchange.itemID],
                       "itemCount": PvPExchangeTemplate[i][templateConst.tPvPExchange.itemNum],
                       "honor": PvPExchangeTemplate[i][templateConst.tPvPExchange.honor],
                       "buyMax": PvPExchangeTemplate[i][templateConst.tPvPExchange.buyMax],
                       "buyLeft": buyLeft
                   }
        );
    }

    return callback(null, items);
};

var ExchangeAdd = function (exchange, attID, roleID) {
    var self = this;

    for (var j = 0; j < exchange.length; ++j) {
        if (exchange[j][2] === attID) {
            exchange[j][3] += 1;
            return;
        }
    }

    exchange.push([0, roleID, attID, 1]);
};

/**
 * @return {number}
 */
var ExchangeLeft = function (exchange, attID, maxNum) {

    var self = this;

    for (var j = 0; j < exchange.length; ++j) {
        if (exchange[j][2] === attID) {
            return maxNum - exchange[j][3];
        }
    }
    return maxNum;
};


handler.LingliExchange = function (exchangeID, callback) {

    var self = this;

    var PvPExchangeTemplate = templateManager.GetTemplateByID('PvPExchangeTemplate', exchangeID);
    if (!PvPExchangeTemplate) {
        return callback(errorCodes.NoTemplate);
    }
    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
        if (!!err) {
            logger.error('error when LingliExchange to GetPlayerPvpInfo, %d, %s', ownerID, utils.getErrorMessage(err));
            return callback(err);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
            return callback(errorCodes.NoRole);
        }
        // log for test
        logger.warn('GetPlayerPvpInfo on LingliExchange, roleID == %d, obj == %j', ownerID, obj);
        var honor = obj[gameConst.eAsyncPvPInfo_EX.honor];
        var lingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];

        var costHonor = PvPExchangeTemplate[templateConst.tPvPExchange.honor];
        if (honor < costHonor) {
            return callback(errorCodes.NoHonor);
        }

        var cost = PvPExchangeTemplate[templateConst.tPvPExchange.lingli];
        if (lingli < cost) {
            return callback(errorCodes.NoLingli);
        }
        var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
        var vipTemplate = null;
        if (null == ownerVipLevel || ownerVipLevel == 0) {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
        } else {
            vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
        }
        if (null == vipTemplate) {
            return;
        }

        if (ExchangeLeft(self.exchange, exchangeID, PvPExchangeTemplate[templateConst.tPvPExchange.buyMax]) <= 0) {
            return callback(errorCodes.NoTimes);
        }

        ExchangeAdd(self.exchange, exchangeID, self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID]);
        // log for test
        logger.warn('ExchangeAdd on LingliExchange, roleID == %d, exchange == %j',
                    self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID], self.exchange);

        obj[gameConst.eAsyncPvPInfo_EX.lingli] = lingli - cost;
        pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, ownerID, obj, function (err) {
            if (!!err) {
                logger.error('err when LingliExchange AddPlayerScore, %d, %s', ownerID, utils.getErrorMessage(err));
                callback(errorCodes.SystemWrong);
            }
            // log for test
            logger.warn('AddPlayerScore on LingliExchange, roleID == %d, obj == %j', ownerID, obj);
            var itemID = PvPExchangeTemplate[templateConst.tPvPExchange.itemID];
            var itemNum = PvPExchangeTemplate[templateConst.tPvPExchange.itemNum];

            self.owner.AddItem(itemID, itemNum, eAssetsAdd.LingliShop);
            self.SendPvPAssetsMsg(obj[gameConst.eAsyncPvPInfo_EX.lingli], obj[gameConst.eAsyncPvPInfo_EX.honor]);
            ///////////////////////////////////////////////
            var openID = self.owner.GetOpenID();
            var accountType = self.owner.GetAccountType();
            var lv = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
            tlogger.log({3: 0}, 'ZhanhunAssetsFlow', accountType, openID, lv, 0,
                        obj[gameConst.eAsyncPvPInfo_EX.lingli], cost, 2, 0, 1);
            ///////////////////////////////////////////////

            return callback(null, {
                exchangeID: exchangeID,
                buyLeft: ExchangeLeft(self.exchange, exchangeID, PvPExchangeTemplate[templateConst.tPvPExchange.buyMax])
            });
        });
    });
};

handler.RequirePrice = function (callback) {
    var self = this;
    var roleID = self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];
    var RefreshSeconds = defaultValues.aPvPRefreshSeconds - (Date.now() - self.refreshLastTime.getTime())
        / 1000;
    if (RefreshSeconds < 0) {
        RefreshSeconds = 0;
    }
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, roleID, function (err, obj) {
        if (!!err) {
            logger.error('pvp RequirePrice error, %d, %s', self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID],
                         utils.getErrorMessage(err));
            return callback(err, null);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', roleID);
            return callback(errorCodes.NoRole);
        }
        // log for test
        logger.warn('GetPlayerPvpInfo on RequirePrice, roleID == %d, obj == %j', roleID, obj);
        var loseTimes = obj[gameConst.eAsyncPvPInfo_EX.lostTimes] || 0;
        var lostLingli = obj[gameConst.eAsyncPvPInfo_EX.loseLingli] || 0;

        var attackNum = obj[gameConst.eAsyncPvPInfo_EX.attackNum] || 0;
        attackNum = utils.unpackAttackNumWithDay(attackNum);

        var attackedNum = obj[gameConst.eAsyncPvPInfo_EX.attackedNum] || 0;
        attackedNum = utils.unpackWithDay(attackedNum);

        var RefreshallTemplate = templateManager.GetTemplateByID('AllTemplate', PVP_REFRESH_REVAL);
        var RevengeallTemplate = templateManager.GetTemplateByID('AllTemplate', PVP_2_REVENGE);
        var data = {
            'result': errorCodes.OK,
            'Refresh': RefreshallTemplate['attnum'],//defaultValues.aPvPRefreshCost,
            'Attack': self.attackCost,
            'Revenge': RevengeallTemplate['attnum'],//defaultValues.aPvPRevengeCost,
            'LoseTimes': loseTimes,
            'LostLingli': lostLingli,
            'AttackNum': attackNum,
            'AttackedNum': attackedNum,
            'BlessLeft': self.blessLeft,
            'BlessReceived': utils.unpackWithDay(self.blessReceived),
            'RefreshSeconds': RefreshSeconds,
            'requireBlessLeft': self.requireBlessLeft
        };
        obj[gameConst.eAsyncPvPInfo_EX.lostTimes] = 0;
        obj[gameConst.eAsyncPvPInfo_EX.loseLingli] = 0;

        pomelo.app.rpc.pvp.pvpRemote.AddPlayerPvpInfo(null, roleID, obj, function () {
            // log for test
            logger.warn('AddPlayerPvpInfo on RequirePrice, roleID == %d, obj == %j', roleID, obj);
        });
        return callback(null, data);
    });
};

handler.Bless = function (params, callback) {
    var self = this;

    if (self.blessLeft <= 0) {
        return callback(errorCodes.Fs_BlessNoTimes);
    }

    self.blessLeft -= 1;
    this.owner.GetMissionManager().IsMissionOver( gameConst.eMisType.BlessFri, 0, 1);
    return callback(null, self.blessLeft);
};

handler.RequireBlessing = function (params, callback) {
    var self = this;

    if (self.requireBlessLeft <= 0) {
        return callback(errorCodes.Fs_RequireBlessingNoTimes);
    }

    self.requireBlessLeft -= 1;

    return callback(null, self.requireBlessLeft);
};

handler.BlessReceived = function (params, callback) {
    var self = this;
    /* if (self.blessLeft <= 0) {
     return callback(errorCodes.Fs_BlessNoTimes);
     }*/

    var ownerVipLevel = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel); // TODO VIP PVP被祝福次数+1
    var vipTemplate = null;
    if (null == ownerVipLevel || ownerVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
    }
    var vipAddBlessNum = 0;
    if (null == vipTemplate) {
        return callback(errorCodes.SystemWrong);
    }
    vipAddBlessNum = vipTemplate[templateConst.tVipTemp.PVPBlessedNum];
    var ownerID = self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);


    var _attackNumAddByBless = utils.unpackWithDay(self.attackNumAddByBless);
    var _blessReceived = utils.unpackWithDay(self.blessReceived);
    // log for test
    logger.warn('blessed old on BlessReceived, roleID == %d, blessLeft == %d', ownerID, _blessReceived);
    if (_attackNumAddByBless < defaultValues.aPvPBlessReceivedNumMax + vipAddBlessNum) {
        pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, ownerID, function (err, obj) {
            if (!!err) {
                logger.error('error when GetPlayerPvpInfo to BlessReceived, %d, %s', ownerID,
                             utils.getErrorMessage(err));
                return callback(err)
            }
            if (_.isEmpty(obj)) {
                logger.warn('GetPlayerPvpInfo obj is empty, %d', ownerID);
                return callback(errorCodes.NoRole);
            }
            // log for test
            logger.warn('GetPlayerPvpInfo on BlessReceived, roleID == %d, attackNumAddByBless == %d, obj == %j',
                        ownerID, _attackNumAddByBless, obj);
            var attackNum = obj[gameConst.eAsyncPvPInfo_EX.attackNum] || 0;
            attackNum = utils.unpackAttackNumWithDay(attackNum);
            obj[gameConst.eAsyncPvPInfo_EX.attackNum] = utils.packWithDay(attackNum + 1);
            pomelo.app.rpc.pvp.pvpRemote.AddPlayerPvpInfo(null, ownerID, obj, function (err) {
                _attackNumAddByBless += 1;
                self.attackNumAddByBless = utils.packWithDay(_attackNumAddByBless);
                logger.info('roleID %d, attackNum is added on login, attackNum_old[%d], attackNum_new[%d], addNum[%d], attackNumAddByBless added 1 ,now is %d',
                            ownerID, attackNum, attackNum + 1, 1, _attackNumAddByBless);
                // log for test
                logger.warn('AddPlayerPvpInfo on BlessReceived, roleID == %d, attackNumAddByBless == %d, obj == %j',
                            ownerID, _attackNumAddByBless, obj);
            });
        });
    }
    _blessReceived += 1;
    self.blessReceived = utils.packWithDay(_blessReceived);
    logger.info('roleID %d, blessReceived added 1, now is %d', ownerID, _blessReceived);
    // log for test
    logger.warn('blessed new on BlessReceived, roleID == %d, blessLeft == %d', ownerID, _blessReceived);

    return callback(null, _blessReceived);
};

handler.SendPvPAssetsMsg = function (lingli, honor) {
    var self = this;

    if (null == self.owner) {
        logger.error('SendPvPAssetsMsg玩家是空的');
        return;
    }
    if (self.owner.type === gameConst.eEntityType.OFFLINEPLAYER) {
        return;
    }

    var route = 'ServerUpdatePvPAssets';
    var pvpAssetsMsg = {};
    pvpAssetsMsg[gameConst.eAsyncPvPInfo_EX.lingli] = lingli;
    pvpAssetsMsg[gameConst.eAsyncPvPInfo_EX.honor] = honor;
    self.owner.SendMessage(route, pvpAssetsMsg);

};

handler.SendPvPAssetsMsgOnLogin = function () {
    var self = this;

    if (null == self.owner) {
        logger.error('SendPvPAssetsMsg玩家是空的');
        return;
    }
    if (self.owner.type === gameConst.eEntityType.OFFLINEPLAYER) {
        return;
    }
    var roleID = self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID];
    var initTemplate = templateManager.GetTemplateByID('InitTemplate', 1);
    Q.ninvoke(pomelo.app.rpc.pvp.pvpRemote, 'GetPlayerPvpInfo', null, roleID)
        .then(function (obj) {
                  if (!_.isEmpty(obj)) {
                      var route = 'ServerUpdatePvPAssets';
                      var pvpAssetsMsg = {};
                      pvpAssetsMsg[gameConst.eAsyncPvPInfo_EX.lingli] = obj[gameConst.eAsyncPvPInfo_EX.lingli];
                      pvpAssetsMsg[gameConst.eAsyncPvPInfo_EX.honor] = obj[gameConst.eAsyncPvPInfo_EX.honor];
                      self.owner.SendMessage(route, pvpAssetsMsg);
                      return Q.resolve();
                  } else {
                      var pvpInfo = {};
                      Q.ninvoke(utilSql, 'LoadList', 'asyncpvp', roleID)
                          .then(function (result) {
                                    if (result[0]) {
                                        var data = result[0];
                                        pvpInfo = {
                                            roleID: roleID,
                                            attackNum: data[1] || utils.packWithDay(defaultValues.aPvPAttackNumMax),
                                            attackedNum: data[2] || utils.packWithDay(0),
                                            lostTimes: data[3] || 0,
                                            loseLingli: data[4] || 0,
                                            lingli: data[5] || initTemplate['pvpLingli'],
                                            honor: data[6] || initTemplate['pvpHonor']
                                        };
                                    } else {
                                        pvpInfo = {
                                            roleID: roleID,
                                            attackNum: utils.packWithDay(defaultValues.aPvPAttackNumMax),
                                            attackedNum: utils.packWithDay(0),
                                            lostTimes: 0,
                                            loseLingli: 0,
                                            lingli: initTemplate['pvpLingli'],
                                            honor: initTemplate['pvpHonor']
                                        };
                                    }
                                    return Q.ninvoke(pomelo.app.rpc.pvp.pvpRemote, 'AddPlayerScore', null, roleID,
                                                     pvpInfo);
                                })
                          .then(function () {
                                    var route = 'ServerUpdatePvPAssets';
                                    var pvpAssetsMsg = {};
                                    pvpAssetsMsg[gameConst.eAsyncPvPInfo_EX.lingli] = pvpInfo['lingli'];
                                    pvpAssetsMsg[gameConst.eAsyncPvPInfo_EX.honor] = pvpInfo['honor'];
                                    self.owner.SendMessage(route, pvpAssetsMsg);
                                })
                          .catch(function (err) {
                                     logger.error('pvp SendPvPInfoMsg error, roleId=%d, %s',
                                                  self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID],
                                                  utils.getErrorMessage(err));
                                 })
                          .finally(function () {
                                       return Q.resolve();
                                   })
                  }
              })
        .catch(function (err) {
                   logger.error('SendPvPAssetsMsgOnLogin error, roleId=%d, %s',
                                self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID],
                                utils.getErrorMessage(err));
               })
        .done();
};


handler.SetCheatPlayerRunning = function () {   //设置玩家pvp战斗结束
    this.matchRunning = {running: false};
};
/*VIP等级升级时重置vip次数
 handler.SetVipInfoNum = function (vipLevel) {
 var vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
 if (null == vipTemplate) {
 return;
 }
 var pvpNum = self.owner.vipInfoManager.getNumByType(gameConst.eVipInfo.BuyPVPNum);
 var vipNum = vipTemplate[templateConst.tVipTemp.buyPVPNum];
 if (vipNum <= 0) {
 return;
 }
 self.owner.vipInfoManager.InitNumByType(self.owner.playerInfo[gameConst.ePlayerInfo.ROLEID], gameConst.eVipInfo.BuyPVPNum, vipNum - pvpNum);

 }  */

handler.GetPlayersInfo = function () {
    return this.players;
};
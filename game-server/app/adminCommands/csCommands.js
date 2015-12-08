/**
 * Created by xykong on 2014/6/26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var util = require('util');
var utils = require('./../tools/utils');
var Player = require('./../cs/csObject/player');
var playerManager = require('./../cs/player/playerManager');
var ItemManager = require('./../cs/item/itemManager');
var gameConst = require('./../tools/constValue');
var templateConst = require('./../../template/templateConst');
var templateManager = require('./../tools/templateManager');
var gmSql = require('./../tools/mysql/gmSql');
var utilSql = require('./../tools/mysql/utilSql');
var item = require('./../cs/item/item');
var defaultValues = require('./../tools/defaultValues');
var errorCodes = require('./../tools/errorCodes');
var globalFunction = require('./../tools/globalFunction');
var cityManager = require('./../cs/majorCity/cityManager');
var giftManager = require('./../cs/gift/giftManager');
var eAttInfo = gameConst.eAttInfo;
var Q = require('q');
var _ = require('underscore');
var urlencode = require('urlencode');
var weddingManager = require('./../rs/marry/weddingManager');

var tCustomList = templateConst.tCustomList;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsInfo = gameConst.eAssetsInfo;
var tRoleInit = templateConst.tRoleInit;
var eItemInfo = gameConst.eItemInfo;
var uuid = require('uuid');
var tItem = templateConst.tItem;
var tAtt = templateConst.tAtt;
var eWorldState = gameConst.eWorldState;
var eMarryInfo = gameConst.eMarryInfo;


var handler = module.exports = {
};

handler.Reload = function () {
    var module = './csCommands';
    delete require.cache[require.resolve(module)];
    var csCommands = require(module);
    pomelo.app.set('csCommands', csCommands);
    return errorCodes.OK;
};


/* 查询当前个人信息 */
//[cmd]: 10084000
//
//[request]: IDIP_QUERY_USER_INFO_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" :         /* 角色ID */
//
//[rsponse]: IDIP_QUERY_USER_INFO_RSP
//    "Source" : ,                   /* 角色注册渠道（1 微信、 2 手Q、 3 QQ游戏、4 应用宝、5QQ空间  6 其他） */
//    "RoleName" : "",               /* 角色名称 */
//    "Money" : ,                    /* 当前金币 */
//    "Level" : ,                    /* 当前等级 */
//    "Physical" : ,                 /* 当前体力值 */
//    "Diamond" : ,                  /* 当前钻石数 */
//    "Devil" : ,                    /* 当前魔灵 */
//    "MaxOrdinaryDuplicate" : ,     /* 当前通关最高普通副本 */
//    "MaxPurgatoryDuplicate" : ,    /* 当前通关最高炼狱副本 */
//    "DevilTower" :                 /* 当前通关万魔塔层数 */
//    "RegisterTime" : "",           /* 用户注册时间 */
//    "LastLoginTime" : "",          /* 最近登陆时间 */
//    "Fight" :                      /* 战力值 */
handler.query_user_info = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Source: 2,
            RoleName: "RoleName",
            Money: 0,
            Level: 0,
            Physical: 0,
            Diamond: 0,
            Devil: 0,
            MaxOrdinaryDuplicate: 0,
            MaxPurgatoryDuplicate: 0,
            DevilTower: 0
        };

        var roleID = req_value.RoleId;
        var player = handler.getPlayer(roleID);

        if (!!player) {
            var roleName = player.GetPlayerInfo(ePlayerInfo.NAME);

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Source = 2;
            rsp_value.RoleName = urlencode(roleName.toString('utf8'));
            rsp_value.Money = player.assetsManager.GetAssetsValue(globalFunction.GetMoneyTemp());
            rsp_value.Level = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            rsp_value.Physical = player.assetsManager.GetAssetsValue(globalFunction.GetPhysical());
            rsp_value.Diamond = player.assetsManager.GetAssetsValue(globalFunction.GetYuanBaoTemp());
            rsp_value.Devil = player.magicSoulManager.GetMagicSoulInfo(gameConst.eMagicSoulInfo.TEMPID);
            rsp_value.MaxOrdinaryDuplicate = player.GetCustomManager().GetMaxWinCustomID(gameConst.eLevelTarget.Normal);
            rsp_value.MaxPurgatoryDuplicate = player.GetCustomManager().GetMaxWinCustomID(gameConst.eLevelTarget.Hell);
            rsp_value.DevilTower = player.climbManager.getCengDataList().length;
            rsp_value.RegisterTime =
            Math.floor(new Date(player.GetPlayerInfo(ePlayerInfo.CreateTime)).getTime() / 1000);
            rsp_value.LastLoginTime =
            Math.floor(new Date(player.GetPlayerInfo(ePlayerInfo.LoginTime)).getTime() / 1000);
            rsp_value.Fight = player.GetPlayerInfo(ePlayerInfo.ZHANLI);

            return callback(null, [rsp_result, rsp_value]);
        }
        gmSql.GetPlayerInfo(roleID, function (err, res) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = utils.getErrorMessage(err);
                return callback(null, [rsp_result, rsp_value]);
            }

            if (!!res['_result']) {
                rsp_result.Result = errorCodes.NoRole;
                rsp_result.RetErrMsg = 'NoRole';

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Source = 2;
            rsp_value.RoleName = urlencode(res['_name'].toString('utf8')) || '';
            rsp_value.Money = res['_moneyNum'] || 0;
            rsp_value.Level = res['_expLevel'] || 0;
            rsp_value.Physical = res['_physicalNum'] || 0;
            rsp_value.Diamond = res['_yuanbaoNum'] || 0;
            rsp_value.Devil = res['_magicsoul'] || 0;
            rsp_value.MaxOrdinaryDuplicate = res['_copyCount'] || 0;
            rsp_value.MaxPurgatoryDuplicate = res['_lyCount'] || 0;
            rsp_value.DevilTower = res['_climbNum'] || 0;
            rsp_value.RegisterTime = Math.floor(new Date(res['_createTime']).getTime() / 1000) || 0;
            rsp_value.LastLoginTime = Math.floor(new Date(res['_loginTime']).getTime() / 1000) || 0;
            rsp_value.Fight = res['_zhanli'] || 0;

            return callback(null, [rsp_result, rsp_value]);
        });
    };
};

/* 查询玩家财产信息 */
//[cmd]: 10084001
//
//[request]: IDIP_QUERY_ASSET_INFO_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" :         /* 角色ID */
//
//[rsponse]: IDIP_QUERY_ASSET_INFO_RSP
//    "AssetList_count" : ,    /* 财产信息列表的最大数量 */
//    "AssetList" :            /* 财产信息列表 */
//    [
//        {
//            "AssetId" : ,    /* 财产ID */
//            "Num" :          /* 财产数量 */
//        }
//    ]
handler.query_asset_info = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            AssetList_count: 0,
            AssetList: []
        };

        var roleID = req_value.RoleId;
        var player = handler.getPlayer(roleID);
        var info = '';

        if (!!player) {
            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.AssetList = _.reduce(player.GetAssetsManager().assetsList, function (memo, v, k) {
                if (!!v.value) {
                    memo.push({
                                  AssetID: k,
                                  Num: v.value
                              });
                }
                return memo;
            }, []);
            rsp_value.AssetList_count = rsp_value.AssetList.length;

            return callback(null, [rsp_result, rsp_value]);
        }

        utilSql.LoadList('assets', roleID, function (err, assetsList) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = utils.getErrorMessage(err);

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.AssetList = _.map(assetsList, function (item) {
                return {
                    AssetId: item[1],
                    Num: item[2]
                }
            });
            rsp_value.AssetList_count = rsp_value.AssetList.length;

            return callback(null, [rsp_result, rsp_value]);
        });
    };
};

/* 查询玩家装备信息 */
// [cmd]: 10084002
//
// [request]: IDIP_QUERY_EQUIP_INFO_REQ
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "RoleId" :         /* 角色ID */
//
// [rsponse]: IDIP_QUERY_EQUIP_INFO_RSP
//     "EquipList_count" : ,    /* 装备信息列表的最大数量 */
//     "EquipList" :            /* 装备信息列表 */
//     [
//         {
//             "EquipId" : ,       /* 装备ID */
//             "StrenLevel" : ,    /* 装备强化等级 */
//             "GainTime" :        /* 获取时间 */
//         }
//     ]
handler.query_equip_info = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            EquipList_count: 0,
            EquipList: []
        };

        var roleID = req_value.RoleId;
        var player = handler.getPlayer(roleID);
        var info = '';
        var itemTemplate = null;

        if (!!player) {
            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.EquipList = _.map(player.GetItemManager().itemList, function (item) {
                return {
                    EquipId: item.itemData[2],
                    StrenLevel: item.itemData[4],
                    GainTime: 0
                };
            });
            rsp_value.EquipList_count = rsp_value.EquipList.length;

            return callback(null, [rsp_result, rsp_value]);
        }

        utilSql.LoadList('item', roleID, function (err, dataList) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = utils.getErrorMessage(err);

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.EquipList = _.map(dataList, function (item) {
                return {
                    EquipId: item[2],
                    StrenLevel: item[4],
                    GainTime: 0
                }
            });
            rsp_value.EquipList_count = rsp_value.EquipList.length;

            return callback(null, [rsp_result, rsp_value]);
        });
    };
};

/* 修改角色经验 */
// [cmd]: 10084008
// // 
// [request]: IDIP_DO_UPDATE_EXP_REQ
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "RoleId" : ,       /* 角色ID */
//     "Value" : ,        /* 数量（正加负减） */
//     "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//     "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
// // 
// [rsponse]: IDIP_DO_UPDATE_EXP_RSP
//     "Result" : ,      /* 结果（0）成功 */
//     "RetMsg" : ""     /* 返回消息 */
handler.do_update_exp = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = req_value.RoleId;
        var addExpNum = req_value.Value;
        var player = handler.getPlayer(roleID);

        if (addExpNum > eAssetsInfo.ASSETS_MAXVALUE) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: Value is invalid.';
            return callback(null, [rsp_result, rsp_value]);
        }

        if (!!player) {
            player.AddExp(addExpNum);
            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Result = errorCodes.OK;
            rsp_value.RetMsg = 'OK';

            return callback(null, [rsp_result, rsp_value]);
        }

        Q.ninvoke(gmSql, 'GetExp', roleID)
            .then(function (result) {
                      var expResult = Player.prototype.CalcExpResult(result.exp, result.expLevel, addExpNum);

                      return Q.resolve(expResult);
                  })
            .then(function (expResult) {
                      if (!!expResult[0]) {
                          return Q.reject();
                      }

                      return Q.ninvoke(gmSql, 'SetExp', roleID, expResult[1], expResult[2]);
                  })
            .then(function () {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    };
};

/* 修改角色等级 */
//[cmd]: 10084009
//
//[request]: IDIP_DO_UPDATE_LEVEL_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Value" : ,        /* 数量（正加负减） */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_UPDATE_LEVEL_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_update_level = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = req_value.RoleId;
        var addExpLevel = +req_value.Value || 0;
        var player = handler.getPlayer(roleID);

        if (addExpLevel > eAssetsInfo.ASSETS_MAXVALUE) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: Value is invalid';

            return callback(null, [rsp_result, rsp_value]);
        }

        if (!!player) {
            var curExp = player.playerInfo[ePlayerInfo.EXP];
            var curExpLevel = player.playerInfo[ePlayerInfo.ExpLevel];

            var expResult = Player.prototype.CalcExpRequired(curExp, curExpLevel, addExpLevel);

            if (!!expResult[0]) {
                rsp_result.Result = errorCodes.ParameterWrong;
                rsp_result.RetErrMsg = 'ParameterWrong: Value is invalid';

                return callback(null, [rsp_result, rsp_value]);
            }

            player.AddExp(expResult[1]);
            if (addExpLevel < 0) {
                player.SetPlayerInfo(ePlayerInfo.ExpLevel, (curExpLevel + addExpLevel));
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Result = errorCodes.OK;
            rsp_value.RetMsg = 'OK';

            return callback(null, [rsp_result, rsp_value]);
        }

        Q.ninvoke(gmSql, 'GetExp', roleID)
            .then(function (result) {
                      var expResult = Player.prototype.CalcExpRequired(result.exp, result.expLevel, addExpLevel);

                      return Q.resolve(expResult);
                  })
            .then(function (expResult) {
                      if (!!expResult[0]) {
                          return Q.reject();
                      }
                      return Q.ninvoke(gmSql, 'SetExp', roleID, 0, expResult[2]);
                  })
            .then(function () {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    };
};

/* 修改玩家体力值 */
//[cmd]: 10084010
//
//[request]: IDIP_DO_UPDATE_PHYSICAL_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Value" : ,        /* 数量（正加负减） */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_UPDATE_PHYSICAL_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_update_physical = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var tempID = globalFunction.GetPhysical();
        var addNum = +req_value.Value;

        var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', tempID);
        if (!AssetsTemplate) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: invalid tempId.';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);
        if (!!player) {
            var assetsManager = player.GetAssetsManager();
            var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);  //玩家的当前等级
            var attTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
            if (!assetsManager || !attTemplate) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong';

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Result = errorCodes.OK;
            rsp_value.AssetId = tempID;

            var maxPhysical = attTemplate[templateConst.tAtt.maxPhysical];
            var nowPhysical = assetsManager.GetAssetsValue(tempID);     //当前体力值
            if (maxPhysical <= nowPhysical + addNum) {
                addNum = maxPhysical - nowPhysical;
            }
            assetsManager.SetAssetsValue(tempID, addNum);

            return callback(null, [rsp_result, rsp_value]);
        }
        var resultValue = 0;
        Q.ninvoke(gmSql, 'GetAssetsInfo', roleID, tempID)
            .then(function (result) {

                      if (!!result['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';
                          return Q.reject([rsp_result, rsp_value]);
                      }

                      resultValue = (result.num || 0) + addNum;
                      return Q.nfcall(gmSql.GetPlayerInfo, roleID);

                  })
            .then(function (res) {
                      if (!!res['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';

                          return callback(null, rsp_result, rsp_value);
                      }
                      var expLevel = res['_expLevel'] || 0;
                      var attTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
                      if (!attTemplate) {
                          rsp_result.Result = errorCodes.SystemWrong;
                          rsp_result.RetErrMsg = 'SystemWrong';

                          return callback(null, [rsp_result, rsp_value]);
                      }
                      var maxPhysical = attTemplate[templateConst.tAtt.maxPhysical];
                      if (resultValue >= maxPhysical) {
                          resultValue = maxPhysical;
                      }
                      return Q.ninvoke(gmSql, 'SetAssetsInfo', roleID, tempID, resultValue);
                  })
            .then(function (result) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.AssetId = tempID;

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 修改财产(非装备类) */
//[cmd]: 10084011
//
//[request]: IDIP_DO_UPDATE_ASSET_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "AssetId" : ,      /* 财产ID */
//    "Value" : ,        /* 修改数量：-减，+加 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_UPDATE_ASSET_RSP
//    "Result" : ,        /* 结果（0）成功 */
//    "AssetId" : ,       /* 财产ID */
//    "BeginValue" : ,    /* 修改前数量 */
//    "EndValue" :        /* 修改后数量 */
handler.do_update_asset = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            AssetId: 0,
            BeginValue: 0,
            EndValue: 0
        };

        var roleID = +req_value.RoleId;
        var tempID = +req_value.AssetId;
        var addNum = +req_value.Value;

        var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', tempID);
        if (!AssetsTemplate) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: invalid AssetId';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);
        if (!!player) {
            var assetsManager = player.GetAssetsManager();
            if (!assetsManager) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong';

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Result = errorCodes.OK;
            rsp_value.AssetId = tempID;
            rsp_value.BeginValue = assetsManager.GetAssetsValue(tempID);
            assetsManager.SetAssetsValue(tempID, addNum);
            rsp_value.EndValue = assetsManager.GetAssetsValue(tempID);

            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(gmSql, 'GetAssetsInfo', roleID, tempID)
            .then(function (result) {

                      if (!!result['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';
                          return Q.reject([rsp_result, rsp_value]);
                      }

                      var resultValue = (result.num || 0) + addNum;
                      return Q.ninvoke(gmSql, 'SetAssetsInfo', roleID, tempID, resultValue);
                  })
            .then(function (result) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.AssetId = tempID;
                      rsp_value.BeginValue = result['_tempCount'];
                      rsp_value.EndValue = result['_retCount'];

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 设置财产(非装备类) */
//[cmd]: 10084012
//
//[request]: IDIP_DO_SET_ASSET_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "AssetId" : ,      /* 财产ID */
//    "Value" : ,        /* 设置期望数量 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SET_ASSET_RSP
//    "Result" : ,        /* 结果（0）成功 */
//    "AssetId" : ,       /* 财产ID */
//    "BeginValue" : ,    /* 设置前数量 */
//    "EndValue" :        /* 设置后数量 */
handler.do_set_asset = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            AssetId: 0,
            BeginValue: 0,
            EndValue: 0
        };

        var roleID = +req_value.RoleId;
        var tempID = +req_value.AssetId;
        var retValue = +req_value.Value;

        var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', tempID);
        if (!AssetsTemplate) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: invalid AssetId';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);
        if (!!player) {
            var assetsManager = player.GetAssetsManager();
            if (!assetsManager) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong';

                return callback(null, [rsp_result, rsp_value]);
            }

            var num = player.GetAssetsManager().GetAssetsValue(tempID);
            retValue = retValue - num;
            assetsManager.SetAssetsValue(tempID, retValue);

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Result = errorCodes.OK;
            rsp_value.AssetId = tempID;
            rsp_value.BeginValue = num;
            rsp_value.EndValue = assetsManager.GetAssetsValue(tempID);

            return callback(null, [rsp_result, rsp_value]);
        }

        Q.ninvoke(gmSql, 'GetAssetsInfo', roleID, tempID)
            .then(function (result) {

                      if (!!result['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';

                          return Q.reject([rsp_result, rsp_value]);
                      }

                      return Q.ninvoke(gmSql, 'SetAssetsInfo', roleID, tempID, retValue);
                  })
            .then(function (result) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.AssetId = tempID;
                      rsp_value.BeginValue = result['_tempCount'];
                      rsp_value.EndValue = result['_retCount'];

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 添加装备 */
//[cmd]: 10084013
//
//[request]: IDIP_DO_ADD_EQUIP_REQ
//    "AreaId" : ,        /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,     /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,        /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",      /* openid */
//    "RoleId" : ,        /* 角色ID */
//    "ItemId" : ,        /* 装备ID */
//    "ItemNum" : ,       /* 装备数量 */
//    "StrenLevel" : ,    /* 装备强化等级 */
//    "Star" : ,          /* 装备星级: 0表示随机 */
//    "Source" : ,        /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""       /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_ADD_EQUIP_RSP
//    "Result" : ,      /* 结果（0）成功、其他失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_add_equip = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var tempID = +req_value.ItemId;
        var addNum = +req_value.ItemNum;

        if (!roleID || !tempID || !addNum) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: Invalid RoleId, ItemId, ItemNum';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong: Invalid RoleId, ItemId, ItemNum';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);

        if (!!player) {
            var itemManager = player.GetItemManager();
            for (var i = 0; i < addNum; ++i) {
                var newItem = itemManager.CreateItem( tempID);
                itemManager.SendItemMsg( [newItem], gameConst.eCreateType.Old, gameConst.eItemOperType.GetItem);
            }

            rsp_value.Result = errorCodes.OK;
            rsp_value.RetMsg = 'OK';

            return callback(null, [rsp_result, rsp_value]);
        }

        Q.ninvoke(gmSql, 'GetRoleJobType', roleID)
            .then(function (result) {

                      var items = [];
                      var itemWrong = [];
                      var itemManager = new ItemManager();

                      var InitTemplate = templateManager.GetTemplateByID('InitTemplate', result['tempID']);
                      var jobType = InitTemplate[tRoleInit.profession];

                      _(addNum).times(function (item) {
                          var itemInfo = itemManager.CreateItemInfo(roleID, jobType + 1, tempID);
                          if (!itemInfo) {
                              itemWrong.push(tempID);
                          }
                          items.push(itemInfo);
                      });

                      if (itemWrong.length) {
                          rsp_result.Result = errorCodes.ParameterWrong;
                          rsp_result.RetErrMsg = util.format('ItemId %j is Wrong', itemWrong);

                          rsp_value.Result = errorCodes.ParameterWrong;
                          rsp_value.RetMsg = util.format('ItemId %j is Wrong', itemWrong);
                          return Q.reject([rsp_result, rsp_value]);
                      }

                      var sqlString = utilSql.BuildSqlValues(items);

                      return Q.ninvoke(gmSql, 'AddItem', roleID, sqlString);
                  })
            .then(function (result) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 删除装备 */
//[cmd]: 10084014
//
//[request]: IDIP_DO_DEL_EQUIP_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "ItemId" : ,       /* 装备ID */
//    "ItemNum" : ,      /* 装备数量: （-1，表全部删除） */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_DEL_EQUIP_RSP
//    "Result" : ,      /* 结果（0）成功、其他失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_del_equip = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var tempID = +req_value.ItemId;
        var itemNum = +req_value.ItemNum || 100000;

        if (!roleID || !tempID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: invalid RoleId, ItemId';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong: invalid RoleId, ItemId';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);

        if (!!player) {
            var itemManager = player.GetItemManager();

            var items = itemManager.GetAllItem();
            var itemDeletes = [];
            for (var i in items) {
                if (items[i].GetItemInfo(gameConst.eItemInfo.TEMPID) == tempID && itemNum--) {
                    itemDeletes.push(items[i].GetItemInfo(gameConst.eItemInfo.GUID));
                }

                if (!itemNum) {
                    break;
                }
            }

            _.each(itemDeletes, function (itemGuid) {
                itemManager.DeleteItem(itemGuid);
            });

            if (itemDeletes.length > 0) {
                var itemList = itemManager.GetAllItem();
                itemManager.SendServerDeleteItem( itemDeletes);
            }

            rsp_value.Result = errorCodes.OK;
            rsp_value.RetMsg = 'OK';

            return callback(null, [rsp_result, rsp_value]);
        }

        Q.ninvoke(gmSql, 'DeleteItem', roleID, tempID, itemNum)
            .then(function (result) {

                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 清除玩家数据 */
//[cmd]: 10084021
//
//[request]: IDIP_DO_CLEAR_USRDATA_REQ
//    "AreaId" : ,             /* 服务器：微信（1），手Q（2） */
//    "PlatId" : ,             /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",           /* openid */
//    "RoleId" : ,             /* 角色ID */
//    "Reason" : "",           /* 操作原因 */
//    "IsClearProgress" : ,    /* 进度清除（1是，0否） */
//    "IsClearMoney" : ,       /* 金币清除（1是，0否） */
//    "IsClearLevel" : ,       /* 角色等级清除（1是，0否） */
//    "IsClearAsset" : ,       /* 财产清除（1是，0否） */
//    "IsClearItem" : ,        /* 物品清除（1是，0否） */
//    "Source" : ,             /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""            /* 流水号，由前端生成，不需要填写 */
//    "Partition" :            /* 分区：INT 服务器Id, 如果填0表示全区 */
//
//[rsponse]: IDIP_DO_CLEAR_USRDATA_RSP
//    "Result" : ,      /* 结果 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_clear_usrdata = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var isClearProgress = +req_value.IsClearProgress;
        var isClearMoney = +req_value.IsClearMoney;
        var isClearLevel = +req_value.IsClearLevel;
        var isClearAsset = +req_value.IsClearAsset;
        var isClearItem = +req_value.IsClearItem;

        if (!roleID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);

        if (!!player) {
            if (!!isClearProgress) {    //清进度
                var customManager = player.GetCustomManager();
                customManager.ClearCustomInfo();
                customManager.SendCustomMsg();
            }
            if (!!isClearMoney) {    //清金币
                var assetsManager = player.GetAssetsManager();
                assetsManager.SetAssetsValue(globalFunction.GetMoneyTemp(),
                                             0 - assetsManager.GetAssetsValue(globalFunction.GetMoneyTemp()));
            }
            if (!!isClearLevel) {    //清等级
                player.SetPlayerInfo(ePlayerInfo.EXP, 0);
                player.SetPlayerInfo(ePlayerInfo.ExpLevel, 1);
            }
            if (!!isClearAsset) {    //清财产
                var assetsManager = player.GetAssetsManager();
                assetsManager.ClearAssets();
            }
            if (!!isClearItem) {    //清物品
                var itemManager = player.GetItemManager();
                var itemList = _.map(itemManager.GetAllItem(), function (item) {
                    return item.GetItemInfo(gameConst.eItemInfo.GUID);
                });

                _.each(itemList, function (itemGuid) {
                    itemManager.DeleteItem(itemGuid);
                });

                itemManager.SendItemMsg( itemList);
            }
            rsp_value.Result = errorCodes.OK;
            rsp_value.RetMsg = 'OK';
            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(gmSql, 'DeleteAllItem', roleID, isClearProgress, isClearMoney, isClearLevel, isClearAsset,
                  isClearItem)
            .then(function (result) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   }).done();
    }
};

//////////////////////////////////////////////////IDIP二期
/* 查询用户基本信息（AQ）*/
//[cmd]: 10084810
//
//[request]: IDIP_AQ_QUERY_USERBASEINFO_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" :         /* 角色ID */
//
//[rsponse]: IDIP_AQ_QUERY_USERBASEINFO_RSP
//    "RoleName" : "",               /* 角色名称 */
//    "Money" : ,                    /* 当前金币 */
//    "Fight" : ,                   /* 玩家战力 */
//    "CustomId" : ,			     /* 占领的副本关卡id */
//    "TowerIdList_count" : ,    /* 万魔塔关卡id列表的最大数量 */
//    "TowerList" : ,             /* 万魔塔历史最高分 */
//      [
//          {
//              TowerId:,          /* 关卡ID */
//              TowerMaxScore:              /* 最高分 */
//          }
//      ]
handler.aq_query_userbaseinfo = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            RoleName: "RoleName",
            Money: 0,
            Fight: 0,
            TowerList_count: 0,
            TowerList: [],
            CustomId: 0
        };

        var roleID = req_value.RoleId;
        if (!roleID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';
            rsp_value = {
                Result: errorCodes.ParameterWrong,
                RetMsg: 'ParameterWrong'
            };
            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);

        if (!!player) {
            var roleName = player.GetPlayerInfo(ePlayerInfo.NAME);

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.RoleName = urlencode(roleName.toString('utf8'));
            rsp_value.Money = player.assetsManager.GetAssetsValue(globalFunction.GetMoneyTemp());
            rsp_value.Fight = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
            var climbList = JSON.parse(player.GetClimbManager().GetCengDataJson());
            for (var index in climbList) {
                var tempData = climbList[index];
                var msg = {
                    TowerId: tempData[0],
                    TowerMaxScore: tempData[1]
                };
                rsp_value.TowerList.push(msg);
            }
            rsp_value.TowerList_count = rsp_value.TowerList.length;
            pomelo.app.rpc.rs.rsRemote.GetOccupantID(null, player.GetPlayerInfo(ePlayerInfo.ROLEID),
                                                     function (err, customID) {
                                                         if (!!err) {
                                                             rsp_result.Result = errorCodes.SystemWrong;
                                                             rsp_result.RetErrMsg = utils.getErrorMessage(err);
                                                             return callback(null, [rsp_result, rsp_value]);
                                                         }
                                                         rsp_value.CustomId = customID;
                                                         return callback(null, [rsp_result, rsp_value]);
                                                     });
        } else {
            Q.nfcall(gmSql.GetPlayerBasicInfo, roleID)
                .then(function (res) {
                          if (!!res['_result']) {
                              rsp_result.Result = errorCodes.NoRole;
                              rsp_result.RetErrMsg = 'NoRole';

                              return callback(null, rsp_result, rsp_value);
                          }
                          rsp_value.RoleName = urlencode(res['_name'].toString('utf8')) || '';
                          rsp_value.Fight = res['_zhanLi'] || 0;
                          rsp_value.Money = res['_moneyNum'] || 0;
                          var climbList = JSON.parse(res['_climbStr'] || '[]');
                          for (var index in climbList) {
                              var tempData = climbList[index];
                              var msg = {
                                  TowerId: tempData[0],
                                  TowerMaxScore: tempData[1]
                              };
                              rsp_value.TowerList.push(msg);
                          }
                          rsp_value.TowerList_count = rsp_value.TowerList.length;
                          return Q.nfcall(gmSql.GetPlayerOccupyID, roleID);
                      })
                .then(function (res) {
                          rsp_value.CustomId = res['_occupyID'];
                          return callback(null, [rsp_result, rsp_value]);
                      })
                .catch(function (err) {
                           if (_.isArray(err)) {
                               return callback(null, err);
                           }

                           rsp_result.Result = errorCodes.ParameterWrong;
                           rsp_result.RetErrMsg = 'ParameterWrong';

                           return callback(null, [rsp_result, rsp_value]);
                       })
                .done();
        }
    };
};

/* 修改财产（AQ）*/
//[cmd]: 10084813
//
//[request]: IDIP_AQ_DO_UPDATE_MONEY_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Value" : ,        /* 修改数量：-减，+加 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_UPDATE_MONEY_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_update_money = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var tempID = globalFunction.GetMoneyTemp();
        var addNum = +req_value.Value;

        if (!roleID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';
            return callback(null, [rsp_result, rsp_value]);
        }
        var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', tempID);
        if (!AssetsTemplate) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong: invalid AssetId';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);
        if (!!player) {
            var assetsManager = player.GetAssetsManager();
            if (!assetsManager) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = 'SystemWrong';

                return callback(null, [rsp_result, rsp_value]);
            }

            rsp_result.Result = errorCodes.OK;
            rsp_result.RetErrMsg = 'OK';

            rsp_value.Result = errorCodes.OK;
            var beginValue = assetsManager.GetAssetsValue(tempID);  //改变前的值
            if (addNum < 0 && (-addNum) > beginValue) {
                addNum = -beginValue;
            }
            assetsManager.SetAssetsValue(tempID, addNum);
            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(gmSql, 'GetAssetsInfo', roleID, tempID)
            .then(function (result) {

                      if (!!result['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';
                          return Q.reject([rsp_result, rsp_value]);
                      }
                      var resultValue = (result.num || 0) + addNum;
                      if (resultValue < 0) {
                          resultValue = 0;
                      }
                      return Q.ninvoke(gmSql, 'SetAssetsInfo', roleID, tempID, resultValue);
                  })
            .then(function (result) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = "OK.";

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 清零爬塔分数（AQ）*/
//[cmd]: 10084814
//
//[request]: IDIP_AQ_DO_CLEAR_GAMESCORE_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Type" :    /* 关卡类型 1: 万魔塔历史积分，  */
//    "IsZero" : ,      /* 是否清零：0: 不清零 1: 清零 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_CLEAR_GAMESCORE_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_clear_gamescore = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var customType = +req_value.Type;
        var isClrae = +req_value.IsZero;
        if (!roleID || !customType) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }
        if (isClrae == 0) {
            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);
        if (!!player) {
            player.GetClimbManager().ClearHistoryData();
            var data_packet = {
                body: {
                    accountID: player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID)
                },
                command: {
                    "path": "kickUserOut",
                    "server": "psIdip"
                }
            };
            pomelo.app.rpc.psIdip.psIdipRemote.idipCommands(null, data_packet, utils.done);
            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(gmSql, 'SetClimbScoreZero', roleID)
            .then(function (result) {
                      if (!!result['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';
                          return Q.reject([rsp_result, rsp_value]);
                      }
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = "OK.";

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 设置爬塔分数（AQ）*/
//[cmd]: 10084815
//
//[request]: IDIP_AQ_DO_SET_GAMESCORE_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Type" :    /* 关卡类型 1: 万魔塔历史积分，  */
//    "CustomId" : ,     /* 关卡ID */
//    "Value" : ,     /* 关卡分数 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_SET_GAMESCORE_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_set_gamescore = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var roleID = +req_value.RoleId;
        var customType = +req_value.Type;
        var customID = +req_value.CustomId;
        var scoreNum = +req_value.Value;
        if (!roleID || !customType || !customID || !scoreNum || customID <= defaultValues.climbMinCustomID || customID
            > defaultValues.climbMaxCustomID || scoreNum < 0) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = handler.getPlayer(roleID);
        if (!!player) {
            player.GetClimbManager().SetHistoryScore(customID, scoreNum);
            var data_packet = {
                body: {
                    accountID: player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID)
                },
                command: {
                    "path": "kickUserOut",
                    "server": "psIdip"
                }
            };
            pomelo.app.rpc.psIdip.psIdipRemote.idipCommands(null, data_packet, utils.done);
            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(utilSql, 'LoadList', 'climb', roleID)
            .then(function (result) {
                      if (!result[0]) {
                          var climbData = [];
                          var todayData = [];
                          var customNum = 0;
                          var historyData = [];
                          var weekScore = 0;
                          var fastCar = 1;
                      } else {
                          var Data = result[0];
                          var climbData = JSON.parse(Data[1] || '[]');
                          var todayData = JSON.parse(Data[2] || '[]');
                          var customNum = Data[3];
                          var historyData = JSON.parse(Data[4] || '[]');
                          var weekScore = Data[5];
                          var fastCar = Data[6];
                      }

                      var climbHasFlag = false;
                      var todayHasFlag = false;

                      if (result[0]) {
                          for (var index in climbData) {
                              if (climbData[index][0] == customID) {
                                  climbData[index][1] = scoreNum;
                                  climbHasFlag = true;
                              }
                          }
                          for (var index in todayData) {
                              if (todayData[index][0] == customID) {
                                  todayData[index][1] = scoreNum;
                                  todayData[index][2] = 0;
                                  todayData[index][3] = 0;
                                  todayData[index][4] = 0;
                                  todayData[index][5] = scoreNum;
                                  todayData[index][6] = 1;
                                  todayHasFlag = true;
                              }
                          }
                      }
                      if (!climbHasFlag) {
                          climbData.push([customID, scoreNum]);
                      }
                      if (!todayHasFlag) {
                          todayData.push([customID, scoreNum, 0, 0, 0, scoreNum, 1]);
                      }

                      var hisLength = historyData.length;
                      var distance = customID - defaultValues.climbMinCustomID;       //设置关卡为第几关
                      if (distance > hisLength + 1) { //设置关卡之前有未打关卡
                          return Q.reject();
                      }
                      if (distance <= hisLength) {
                          historyData[distance - 1] = scoreNum;
                      }
                      else {
                          historyData.push(scoreNum);
                      }
                      customNum = todayData.length;
                      var score = 0;
                      for (var index in todayData) {
                          score = score + todayData[index][1];
                      }
                      weekScore = score;
                      var saveData = [roleID, JSON.stringify(climbData), JSON.stringify(todayData), customNum,
                                      JSON.stringify(historyData), weekScore, fastCar];
                      return Q.ninvoke(utilSql, 'SaveList', 'climb', roleID, [saveData]);
                  })
            .then(function () {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = "OK.";

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 设置零收益时间（AQ） */
//[cmd]: 10084817
//
//[request]: IDIP_AQ_DO_ZEROPROFIT_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Time" : ,       /* 禁言时长(秒) */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_ZEROPROFIT_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_zeroprofit = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };
        var roleID = +req_value.RoleId;
        var second = +req_value.Time;
        if (!roleID || !second) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }


        var player = playerManager.GetPlayer(roleID);
        var canSendTime = new Date().getTime() + second * 1000;
        if (!!player) {
            playerManager.SetForbidProfitTime(roleID, new Date(canSendTime));
            var data_packet = {
                body: {
                    accountID: player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID)
                },
                command: {
                    "path": "kickUserOut",
                    "server": "psIdip"
                }
            };
            pomelo.app.rpc.psIdip.psIdipRemote.idipCommands(null, data_packet, utils.done);
        }
        gmSql.SetForbidProfitTime(roleID, utilSql.DateToString(new Date(canSendTime)), function (err, res) {
            playerManager.SetForbidProfitTime(roleID, new Date(canSendTime));
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = utils.getErrorMessage(err);
                return callback(null, [rsp_result, rsp_value]);
            }
            return callback(null, [rsp_result, rsp_value]);
        });
    }
};

/* 禁止玩法接口（AQ）*/
//[cmd]: 10084818
//
//[request]: IDIP_AQ_DO_BAN_PLAY_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "Type" : ,         /* 禁止类型 （1 普通副本，2 炼狱模式，3 多人副本 4 活动副本，5 万魔塔，6 魔域，7 斩魂，99 全选）*/
//    "Time" : ,       /* 禁言时长(秒) */
//    "Reason" : "",     /* 操作原因 */
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_BAN_PLAY_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_ban_play = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };
        var roleID = +req_value.RoleId;
        var second = +req_value.Time;
        var forbidType = +req_value.Type;
        var reason = req_value.Reason;
        reason = urlencode.decode(reason, 'utf8');

        if (!roleID || !second || !forbidType) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong';

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong';

            return callback(null, [rsp_result, rsp_value]);
        }

        var player = playerManager.GetPlayer(roleID);
        var canSendTime = new Date().getTime() + second * 1000;
//        if (!!player) {
//            var data_packet = {
//                body: {
//                    accountID: player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID)
//                },
//                command: {
//                    "path": "kickUserOut",
//                    "server": "psIdip"
//                }
//            };
//            pomelo.app.rpc.ps.psRemote.idipCommands(null, data_packet, utils.done);
//        }
        gmSql.GetPlayerForbidInfo(roleID, function (err, res) {
            if (!!err) {
                rsp_result.Result = errorCodes.SystemWrong;
                rsp_result.RetErrMsg = utils.getErrorMessage(err);
                return callback(null, [rsp_result, rsp_value]);
            }
            var forbidPlayTime = utilSql.DateToString(new Date(canSendTime));
            var forbidPlayList;
            if (!!res['_result']) {
                //forbidPlayList = JSON.stringify([forbidType]);
                forbidPlayList = {};
            }
            else {
                forbidPlayList = JSON.parse(res['_forbidPlayList']);
            }
            forbidPlayList[forbidType] = [utilSql.DateToString(new Date(canSendTime)), reason];

            playerManager.SetForbidPlayInfo(roleID, forbidPlayList);
            forbidPlayList = JSON.stringify(forbidPlayList);
            gmSql.SetForbidPlayInfo(roleID, forbidPlayTime, forbidPlayList, function (err, res) {
                if (!!err) {
                    rsp_result.Result = errorCodes.SystemWrong;
                    rsp_result.RetErrMsg = utils.getErrorMessage(err);
                    return callback(null, [rsp_result, rsp_value]);
                }
                return callback(null, [rsp_result, rsp_value]);
            });
        });
    }
};


/* 解除处罚接口（AQ） */
//[cmd]: 10084821
//
//[request]: IDIP_AQ_DO_RELIEVE_PUNISH_REQ
//    "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",     /* openid */
//    "RoleId" : ,       /* 角色ID */
//    "RelieveZeroProfit" : , /* 解禁收益   （0 否，1 是）*/
//    "RelieveMaskchat" : ,   /* 解禁聊天   （0 否，1 是）*/
//    "RelieveBanJoinRank" : ,  /* 解禁排行榜 （0 否，1 是）*/
//    "RelievePlay" : ,   /* 解禁玩法   （0 否，1 是）*/
//    "RelieveBan" : ,  /* 解禁封号   （0 否，1 是）*/
//    "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_AQ_DO_RELIEVE_PUNISH_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_relieve_punish = function (req_value) {

    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };
        var roleID = +req_value.RoleId;
        var openID = '' + req_value.OpenId;
        var removeProfit = +req_value.RelieveZeroProfit;
        var removeChat = +req_value.RelieveMaskchat;
        var removeChart = +req_value.RelieveBanJoinRank;
        var removePlay = +req_value.RelievePlay;
        var removeLogin = +req_value.RelieveBan;

        playerManager.RemoveForbid(roleID, removeProfit, removeChat, removeChart, removePlay);

        Q.ninvoke(gmSql, 'GetPlayerForbidInfo', roleID)
            .then(function (result) {
                      if (!!result['_result']) {
                          rsp_result.Result = errorCodes.NoRole;
                          rsp_result.RetErrMsg = 'NoRole';
                          return Q.reject([rsp_result, rsp_value]);
                      }
                      var forbidProfit = result['_forbidProfit'];            //禁止收益结束时间
                      var forbidChat = result['_forbidChat'];                //禁止聊天结束时间
                      var forbidChart = result['_forbidChart'];              //禁止参与排行榜结束时间
                      var forbidPlay = result['_forbidPlay'];                //禁止玩法结束时间
                      var forbidPlayList = result['_forbidPlayList'];        //禁止玩法类型
                      if (1 == removeProfit) {    //解禁收益
                          forbidProfit = '1990-01-01 00:00:00';
                      }
                      if (1 == removeChat) {  //解禁聊天
                          forbidChat = '{}';
                      }
                      if (1 == removeChart) {  //解禁排行榜
                          forbidChart = '{}';
                      }
                      if (1 == removePlay) {  //解禁玩法
                          forbidPlay = '1990-01-01 00:00:00';
                          forbidPlayList = '{}';
                      }
                      return Q.ninvoke(gmSql, 'RemoveForbid', roleID, forbidProfit, forbidChat, forbidChart, forbidPlay,
                                       forbidPlayList);
                  })
            .then(function () {
                      return Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
                  })
            .then(function (res) {
                      var accountID = res;
                      if (accountID <= 0) {
                          return Q.reject();
                      }
                      if (removeLogin == 1) {
                          var dateStr = utilSql.DateToString(new Date());
                          return Q.nfcall(gmSql.SetAccountCanLoginTime, accountID, dateStr);
                      }
                      return Q.resolve();
                  })
            .then(function (res) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }
                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong';

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

handler.getDetails = function () {
    return function (callback) {
        return callback(null);
    }
};


handler.getPlayer = function (roleID) {
    if (!playerManager) {
        return null;
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return null;
    }

    return player;
};

handler.getAllPlayer = function () {
    if (!playerManager) {
        return null;
    }
    var playerList = playerManager.GetAllPlayer();
    if (_.isEmpty(playerList)) {
        return null;
    }
    return playerList;
};

// 增加经验
handler.addexp = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var addExpNum = parseInt(arguments[1]);
    if (!addExpNum) {
        return errorCodes.ParameterWrong;
    }
    player.AddExp(addExpNum);
    return errorCodes.OK;
};

// 增加所有玩家经验
handler.setallplayerlevel = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var setLv = parseInt(arguments[1]);
    if (!setLv || setLv > 110 || setLv <= 0) {
        return errorCodes.ParameterWrong;
    }
    var paramObj = {
        setLv: setLv
    };
    pomelo.app.rpc.ps.psRemote.gmCommands(null, 'setallplayerlevel', paramObj, utils.done);
    return errorCodes.OK;
};

// 增加金钱
handler.addmoney = function () {
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var tempID = parseInt(arguments[1]);
    var addNum = parseInt(arguments[2]);
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var assetsManager = player.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.NoTemplate;
    }
    if (tempID == 1101 || tempID == 1401) { //灵力或荣誉
        pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, roleID, function (err, obj) {
            var honor = obj[gameConst.eAsyncPvPInfo_EX.honor];
            var lingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
            if (tempID == 1101) {
                obj[gameConst.eAsyncPvPInfo_EX.lingli] = lingli + addNum;
            } else if (tempID == 1401) {
                obj[gameConst.eAsyncPvPInfo_EX.honor] = honor + addNum;
            }
            pomelo.app.rpc.pvp.pvpRemote.AddPlayerScore(null, roleID, obj, utils.done);
            player.asyncPvPManager.SendPvPAssetsMsg(obj[gameConst.eAsyncPvPInfo_EX.lingli],
                                                    obj[gameConst.eAsyncPvPInfo_EX.honor]);
            return errorCodes.OK;
        });
    } else {
        assetsManager.SetAssetsValue(tempID, addNum);
        return errorCodes.OK;
    }
};

// 增加所有玩家财产
handler.addallmoney = function () {
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var paramObj = {
        tempID: parseInt(arguments[1]),
        addNum: parseInt(arguments[2])
    };
    pomelo.app.rpc.ps.psRemote.gmCommands(null, 'addallmoney', paramObj, utils.done);
    return errorCodes.OK;
};

// 装备掉落
handler.itemdrop = function () {
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var tempID = parseInt(arguments[1]);
    var addNum = parseInt(arguments[2]);
    if (addNum <= 0 || addNum > defaultValues.equipBagNum) {
        addNum = 1;
    }
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    logger.info('handler.addexp: %j', util.inspect(arguments));
    var itemManager = player.GetItemManager();
    for (var i = 0; i < addNum; ++i) {
        var newItem = itemManager.CreateItem( tempID);
        itemManager.SendItemMsg( [newItem], gameConst.eCreateType.Old, gameConst.eItemOperType.GetItem);
    }
    return errorCodes.OK;
};

// 关卡全开
handler.allcusopen = function () {
    if (arguments.length < 1) {
        return errorCodes.ParameterWrong;
    }
    var isStoryOpen = parseInt(arguments[1]);

    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var customTemplateList = templateManager.GetAllTemplate('CustomListTemplate');
    for (var index in  customTemplateList) {
        var temp = customTemplateList[index];
        var customNum = temp[tCustomList.customNum];
        for (var i = 0; i < customNum; ++i) {
            player.GetCustomManager().OpenOneCustom(temp['custom_' + i], roleID, gameConst.eLevelTarget.Normal);
            player.GetCustomManager().OpenOneCustom(temp['hellCustom_' + i], roleID, gameConst.eLevelTarget.Normal);
            if(isStoryOpen){
                player.GetCustomManager().OpenOneCustom(temp['darkCustom_' + i], roleID, gameConst.eLevelTarget.StoryDrak);
            }
        }
    }
    player.GetCustomManager().SendCustomMsg(gameConst.eLevelTarget.Normal, null);
    if(isStoryOpen){
        player.GetCustomManager().SendCustomMsg(gameConst.eLevelTarget.StoryDrak, null);
    }

    return errorCodes.OK;
};

handler.allplayerallcusopen = function () {
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    pomelo.app.rpc.ps.psRemote.gmCommands(null, 'allplayerallcusopen', null, utils.done);
    return errorCodes.OK;
};

// 技能全开
handler.allskillopen = function () {
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var skillList = [101101, 101201, 101301, 101401, 101501, 101601, 101701, 101801, 700101, 701101];     //战士技能
    var womanSkill = [201101, 201201, 201301, 201401, 201501, 201601, 201701, 201801, 700101, 701101];    //刺客技能
    var job = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    if (2 == job) {
        skillList = womanSkill;
    }
    for (var index in skillList) {
        var result = player.GetSkillManager().AddSkill( skillList[index], gameConst.eAddSkillType.OpenNew);
        if (0 != result) {
            return result;
        }
    }
    player.GetSkillManager().SendSkillMsg( null);
    return errorCodes.OK;
};

// 变身全开
handler.allbianshenopen = function () {
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var soulManager = player.GetSoulManager();
    var soulList = soulManager.GetSoulList();
    for (var index in soulList) {
        soulManager.OpenOneSoul(index);
    }
    return errorCodes.OK;
};


handler.addvippoint = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var addVipNum = parseInt(arguments[1]);
    player.AddVipPoint(addVipNum);
    if(addVipNum > 0){
        player.notifyCheckBalance(addVipNum);
        player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_AllPay, addVipNum, 0);
        player.GetAdvanceManager().ProcessCondition(gameConst.eAdvanceCondition.Condition_OncePay, addVipNum, 1);

        //新累计充值活动
        //player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PayDay, addVipNum, 0);
        player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PayOneMoney, addVipNum, 0);
        player.GetAdvanceManager().ProcessAdvance(gameConst.eAdvanceType.Advance_PayMoreMoney, addVipNum, 0);
    }
    return errorCodes.OK;
};

// 增加所有玩家的vip等级

handler.setallviplevel = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var setVipLv = parseInt(arguments[1]);
    if (!setVipLv || setVipLv <= 0 || setVipLv > 15) {
        return errorCodes.ParameterWrong;
    }
    var paramObj = {
        setVipLv: setVipLv
    };
    pomelo.app.rpc.ps.psRemote.gmCommands(null, 'setallviplevel', paramObj, utils.done);
    return errorCodes.OK;
};

// 魔灵升阶
handler.uplevel = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var level = parseInt(arguments[1]);
    if (level < 1 || level > 17) {
        return errorCodes.ParameterWrong;
    }
    var bigID = level * 1000 + 1;
    var smlID = level * 1000000 + 1001;
    player.magicSoulManager.SetMagicSoulInfo(gameConst.eMagicSoulInfo.TEMPID, bigID);
    player.magicSoulManager.SetMagicSoulInfo(gameConst.eMagicSoulInfo.InfoID, smlID);
    player.magicSoulManager.SendMagicSoulMsg();
    return errorCodes.OK;
};

// 完成任务
handler.missionover = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var misID = parseInt(arguments[1]);
    if (misID < 10100001 || misID > 50500020) {
        return errorCodes.ParameterWrong;
    }
    player.GetMissionManager().MissionComplete( misID);
    return errorCodes.OK;
};

//邪神升星
handler.upsoullevel = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var tempID = 1000 + parseInt(arguments[1]) - 1;
    var soulManager = player.GetSoulManager();
    soulManager.GMUpSoulLevel(tempID);

    return errorCodes.OK;
};

//增加玩家战力
handler.addplayerzhanli = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    player.UpdateZhanli(parseInt(arguments[1]), true, true);
    return errorCodes.OK;
};

//魔域关卡跳转
handler.jumpmine = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    player.mineManager.JumpLayer(parseInt(arguments[1]));
    return errorCodes.OK;
};

handler.addgiftcode = function () { //添加礼品码
    if (arguments.length > 5 || arguments.length <= 1) {
        return errorCodes.ParameterWrong;
    }
    var baoXiangID = +arguments[1];
    var codeNum = +arguments[2] || 10;
    var endDay = +arguments[3] || 30;
    var frequency = +arguments[4] || 1;
    giftManager().addGiftCode(baoXiangID, codeNum, endDay, frequency);
    return errorCodes.OK;

};

handler.sendxgtag = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var route = 'ServerSendXGTag';
    var msg = {
        tag: '' + arguments[1]
    };
    player.SendMessage(route, msg);
    return errorCodes.OK;
};

//通过爬塔第N层
handler.pata = function () {
    if (arguments.length != 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var attID = +arguments[1];
    if (attID <= 0 || attID > 100) {
        return errorCodes.ParameterWrong;
    }
    player.climbManager.GMFinishResult( attID);
};

//增加工会威望
handler.addunionweiwang = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    //var unionID = +arguments[1];
    var weiWangNum = +arguments[1];
    pomelo.app.rpc.us.usRemote.AddUnionWeiWang(null, roleID, weiWangNum, utils.done);
    return errorCodes.OK;
};

//增加工会积分
handler.addunionscore = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    //var unionID = +arguments[1];
    var score = +arguments[1];
    //添加类型  此处为1 炼狱添加公会积分 需要判断炼狱次数， 其他传 0  不做判断
    var lianyuType = 0;
    pomelo.app.rpc.us.usRemote.AddUnionScore(null, roleID, score, 0, lianyuType, utils.done);
    return errorCodes.OK;
};

//开通月卡
handler.addmonthcard = function () {
    if (arguments.length > 2 && arguments.length < 0) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var value = +arguments[1] || 300;//开通月卡值需要大于 300

    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    player.GetRechargeManager().GMOpenMonthCard(value);
    return errorCodes.OK;
};

handler.getchartreward = function () {
    var roleID = +arguments[0];
    var chartType = +arguments[1];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    player.roleChartManager.GetChartReward(chartType);
};

/**
 * 获取主城人数情况
 * */
handler.getAllMajorCityInfo = function () {
    var citys = cityManager.getAllCity();
    var infos = {};
    for (var i in citys) {
        infos[i] = citys[i].toInfo();
    }
    return infos;
};

/**
 * 获取主城人数情况
 * */
handler.getMajorCityInfo = function () {
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var cityID = +arguments[0];
    var city = cityManager.GetCity(cityID);
    return city.toInfo();
};

/**
 * Brief: 添加 勋章
 * ---------------
 * @api public
 *
 * @return {Number}
 * */
handler.addmedal = function () {

    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var addValue = +arguments[1];
    pomelo.app.rpc.pvp.pvpRemote.gmAddMedal(null, roleID, addValue, utils.done);
    return errorCodes.OK;
};

/**
 * 完成邪神进阶挑战关卡
 * */
handler.soulevolvecustom = function () {
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var tempID = 1000 + parseInt(arguments[1]) - 1;
    var accomplish = parseInt(arguments[2]);
    var soulManager = player.GetSoulManager();
    soulManager.GMAccomplishEvolve(tempID, accomplish);
    return errorCodes.OK;
};

/**
 * 邪神进阶测试
 * */
handler.soulevolvetest = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var tempID = 1000 + parseInt(arguments[1]) - 1;
    var soulManager = player.GetSoulManager();
    soulManager.EvolveSoul(tempID);
    return errorCodes.OK;
};

/**
 * 邪神觉醒测试
 * */
handler.soulwaketest = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var tempID = 1000 + parseInt(arguments[1]) - 1;
    var soulManager = player.GetSoulManager();
    soulManager.WakeSoul(tempID);
    return errorCodes.OK;
};

/**
 * 设置觉醒等级
 * */
handler.soulwakelevel = function () {
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var tempID = 1000 + parseInt(arguments[1]) - 1;
    var wakeLevel = arguments[2];
    var soulManager = player.GetSoulManager();
    soulManager.GMSetWakeLevel(tempID, wakeLevel);
    return errorCodes.OK;
};

/**
 * 变身测试
 * */
handler.bianshen = function () {
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }

    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var tempID = 1000 + parseInt(arguments[1]) - 1;
    var isBian = +arguments[2];

    var soulManager = player.GetSoulManager();
    if (isBian > 0) {
        soulManager.BianShen(tempID);
    }
    else {
        soulManager.UnBianShen();
    }
    return errorCodes.OK;
};

/** 测试 QQ会员新手礼包*/
handler.qqgift = function (type) {
    var roleID = +arguments[0];
    var type = parseInt(arguments[1]);       //0非会员  ， 1 普通会员 ， 2 超级会员
    var exeType = parseInt(arguments[2]);    //0开通qq会员 1续费会员 2开通超级 3续费超级 4登陆验证会员

    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    player.MemberGiftType(type,exeType);

    return errorCodes.OK;
};


/**
 * 发放公会红包
 * */
handler.senduniongift = function () {
    var roleID = arguments[0];
    logger.fatal("**** args: %j ,roleID: %j", arguments, roleID );

    pomelo.app.rpc.us.usRemote.SendUnionGift(null ,roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 领取公会红包
 * */
handler.getuniongift = function () {

    var roleID = +arguments[0];
    var fromID = +arguments[1];
    pomelo.app.rpc.us.usRemote.GetUnionGiftForPlayer(null, roleID, fromID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 可领取红包
 * */
handler.unionlist = function () {

    var roleID = +arguments[0];
    pomelo.app.rpc.us.usRemote.UnionList(null, roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};


/**
 * 存储红包
 * */
handler.saveuniongift = function () {

    var roleID = +arguments[0];
    pomelo.app.rpc.us.usRemote.SaveUnionGift(null, roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 主动发送是否发送过红包信息
 * */
handler.sendunioninfo = function () {

    var roleID = +arguments[0];
    pomelo.app.rpc.us.usRemote.SendUnionGiftChange(null, roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 领取QQ红包
 * */

handler.getgift = function () {

    var roleID = +arguments[0];
    var giftID = +arguments[1];
    if(!!giftID){
        var player = handler.getPlayer(roleID);
        player.giftManager.GetGiftItem(giftID);
        return errorCodes.OK;
    }

};

/**
 * 获取炼狱是否可获得公会积分
 * */

handler.getunionlianyu = function () {
    var roleID = +arguments[0];
    pomelo.app.rpc.us.usRemote.GetUnionLianYu(null, roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;

};

/**
 * 存储公会其他数据  （炼狱次数，）
 * */
handler.saveuniondata = function () {

    var roleID = +arguments[0];
    pomelo.app.rpc.us.usRemote.SaveUnionData(null, roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 一键领取新活动奖励
 */
handler.ongetaward = function(){
    var roleID = +arguments[0];
    var attID = +arguments[1];
    if(!!attID){
        var player = handler.getPlayer(roleID);
        player.GetAdvanceManager().OnGetAwardAll(attID);
        return errorCodes.OK;
    }
};

handler.recharge = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var payValue = +arguments[1];
    var payResult = {"balance":0, "save_amt":100};
    player.GetQqManager().payRealMoney(payValue, payResult);
    return errorCodes.OK;
};

/**
 * 查看限時時裝信息
 */
handler.getfashion = function(){
    var roleID = +arguments[0];

    var player = handler.getPlayer(roleID);
    player.roleFashionManager.GetFashionTime(function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });

    return errorCodes.OK;
};

/**
 * 强制开启公会神兽
 * */
handler.unionanimal = function () {
    var roleID = arguments[0];
    pomelo.app.rpc.us.usRemote.gmCreateAllAnimals(null ,roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 强制开启公会战
 * */
handler.unionfight = function () {
    var roleID = arguments[0];
    pomelo.app.rpc.us.usRemote.gmCreateUnionFight(null ,roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

/**
 * 强制结束公会战
 * */
handler.fightend = function () {
    var roleID = arguments[0];
    pomelo.app.rpc.us.usRemote.gmCreateUnionFight(null ,roleID, function (err, res) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('****callback res: %j', res);
        }
    });
    return errorCodes.OK;
};

handler.addworldbossdamage = function() {
        var roleID = +arguments[0];
        var damage = +arguments[1];
        var roleInfo = {
            roleID:roleID,
            score:damage
        };
        pomelo.app.rpc.chart.chartRemote.UpdateWorldBoss(null,roleInfo, utils.done);
        return errorCodes.OK;
};
handler.getworldbosschart = function() {
    var roleID = +arguments[0];
    var chartType = +arguments[1];
    pomelo.app.rpc.chart.chartRemote.GetChart(null, roleID, chartType, utils.done);
};

handler.addplayerdamage = function() {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var addValue = +arguments[1];
    pomelo.app.rpc.pvp.pvpRemote.addPlayerDamage(null, roleID, addValue, utils.done);
    return errorCodes.OK;
};

handler.getplayerattack = function() {
    var roleID = +arguments[0];
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return errorCodes.ParameterNull;
    }
    var ackValue = player.GetAttManager().GetAttValue(eAttInfo.ATTACK);
    return errorCodes.OK;
};

/**
 * 求婚
 * */
handler.tomarry = function () {
    var roleID = arguments[0];
    var toMarryID = +arguments[1];
    var xinwuId = +arguments[2];
    var player = handler.getPlayer(roleID);
    var res = player.toMarryManager.ToMarry(toMarryID, xinwuId, function(err, res){
        logger.fatal('##### tomarry callback res: %j', res);
    });
    return errorCodes.OK;
};
/**
 * 好友可求婚列表e
 * */
handler.getmarryflist = function(){
    var roleID = arguments[0];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.GetToMarryFriendList(function(err, res){
        logger.fatal('##### getmarryflist callback res: %j', res);
    });
    return errorCodes.OK;
}

/**
 * 公会可求婚列表
 * */
handler.getmarryulist = function(){
    var roleID = arguments[0];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.GetToMarryUnionList(function(err, res){
        logger.fatal('##### GetToMarryUnionList callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 周围可求婚列表
 * */
handler.getmarryrlist = function(){
    var roleID = arguments[0];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.GetToMarryRoundList(function(err, res){
        logger.fatal('##### GetToMarryRoundList callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 获取信物列表
 * */
handler.getxinwulist = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.GetXinWuList( function(err, res){
        logger.fatal('##### getxinwulist callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 修改爱情宣言
 * */
handler.updatexuanyan = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var xuanyan = arguments[1];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.UpdateXuanYan(xuanyan, function(err, res){
        logger.fatal('##### UpdateXuanYan callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 同意求婚请求
 * */
handler.agreemarry = function(){
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var fromMarryID = arguments[1];
    var marryID = arguments[2];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.Agree(fromMarryID, marryID, function(err, res){
        logger.fatal('##### agreemarry callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 拒绝求婚请求
 * */
handler.refusemarry = function(){
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var fromMarryID = arguments[1];
    var marryId = arguments[2];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.Refuse(fromMarryID, marryId, function(err, res){
        logger.fatal('##### refusemarry callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 获取求婚信
 * */
handler.getmarrymsg = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var type = arguments[1];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.GetMarryMassage(type, function(err, res){
        logger.fatal('##### getmarrymsg callback res: %j', res);
    });

    return errorCodes.OK;
}



/**
 * 发起离婚请求
 * */
handler.divorce = function(){
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var divorceID = arguments[1];
    var type = arguments[2];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.Divorce(divorceID, type, function(err, res){
        logger.fatal('##### divorce callback res: %j', res);
    });
    return errorCodes.OK;
}

/**
 * 同意离婚请求
 * */
handler.agreedivorce = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var fromDivorceID = arguments[1];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.AgreeDivorce(fromDivorceID, function(err, res){
        logger.fatal('##### AgreeDivorce callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 拒绝离婚请求
 * */
handler.refusedivorce = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var fromDivorceID = arguments[1];
    var player = handler.getPlayer(roleID);
    player.toMarryManager.RefuseDivorce(fromDivorceID, function(err, res){
        logger.fatal('##### RefuseDivorce callback res: %j', res);
    });

    return errorCodes.OK;
}

/**
 * 根据名字搜索结婚对象
 * */
handler.findmarry = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var name = arguments[1];
    pomelo.app.rpc.rs.rsRemote.FindNameToMarry(null ,roleID,  name, function(err, res){
        logger.fatal('##### findmarry callback res: %j', res);
        return errorCodes.OK;
    });
}

/**
 * 获取预约婚礼列表
 * */
handler.getwedding = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var player = handler.getPlayer(roleID);
    pomelo.app.rpc.rs.rsRemote.GetWedding(null, roleID, function(err, res){
        logger.fatal('##### getWedding callback res: %j', res);
        return errorCodes.OK;
    });


}


/**
 * 预约婚礼
 * */
handler.yuuewedding = function(){
    if (arguments.length !== 4) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var wedID = arguments[1];
    var marryLevel = arguments[2];
    var bless = arguments[3];
    var player = handler.getPlayer(roleID);
    pomelo.app.rpc.rs.rsRemote.YuYueWedding(null, roleID, wedID, marryLevel, bless,
        function (err, res) {
            if (!!err) {
                logger.error('##### yuuewedding callback res: %j', res);
            }
            logger.fatal('##### yuYueWedding callback res: %j', res);
            return errorCodes.OK;

        });

}

/**
 * 给所有玩家发送婚礼信息
 * */
handler.sendwedding = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    pomelo.app.rpc.rs.rsRemote.SendWedding(null,
        function (err, res) {
            if (!!err) {
                logger.error('##### sendwedding callback res: %j', res);
            }
            logger.fatal('##### sendwedding callback res: %j', res);
            return errorCodes.OK;

        });

}

/**
 * 结婚之后 基础信息界面
 * */
handler.getmarryinfo = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    pomelo.app.rpc.rs.rsRemote.GetMarryInfo(null, roleID,
        function (err, res) {
            if (!!err) {
                logger.error('##### GetMarryInfo callback res: %j', res);
            }
            logger.fatal('##### GetMarryInfo callback res: %j', res);
            return errorCodes.OK;

        });

}

/**
 * 亲密互动 爱的礼物
 * */
handler.getmarrygift = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    pomelo.app.rpc.rs.rsRemote.GetMarryGiftInfo(null, roleID,
        function (err, res) {
            if (!!err) {
                logger.error('##### GetMarryGiftInfo callback res: %j', res);
            }
            logger.fatal('##### GetMarryGiftInfo callback res: %j', res);
            return errorCodes.OK;

        });

}

/**
 * 亲密互动 爱的礼物
 * */
handler.givemarrygift = function(){
    if (arguments.length !== 3) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var giftID = arguments[1];
    var giveType = arguments[2]; // 1 用碎片  2 不足用钻石
    pomelo.app.rpc.rs.rsRemote.GiveMarryGift(null, roleID, giftID, giveType,
        function (err, res) {
            if (!!err) {
                logger.error('##### givemarrygift callback res: %j', res);
            }
            logger.fatal('##### givemarrygift callback res: %j', res);
            return errorCodes.OK;

        });

}

/**
 * 开始婚礼 返回所有10对 婚礼信息
 * */
handler.beginwedding = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    pomelo.app.rpc.rs.rsRemote.BeginWedding(null, roleID,
        function (err, res) {
            if (!!err) {
                logger.error('##### BeginWedding callback res: %j', res);
            }
            logger.fatal('##### BeginWedding callback res: %j', res);
            return errorCodes.OK;

        });
}

/**
 * 进入某一婚礼
 * */
handler.comingwedding = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var marryID = arguments[1];
    pomelo.app.rpc.rs.rsRemote.ComingWedding(null, roleID, +marryID,
        function (err, res) {
            if (!!err) {
                logger.error('##### comingwedding callback res: %j', res);
            }
            logger.fatal('##### comingwedding callback res: %j', res);
            return errorCodes.OK;
        });
}

/**
 * 祝福某一婚礼
 * */
handler.blesswedding = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var marryID = arguments[1];
    pomelo.app.rpc.rs.rsRemote.BlessWedding(null, roleID, marryID,
        function (err, res) {
            if (!!err) {
                logger.error('##### blesswedding callback res: %j', res);
            }
            logger.fatal('##### blesswedding callback res: %j', res);
            return errorCodes.OK;

        });

}


/**
 * 婚礼进行中 领取红包
 * */
handler.gethongbao = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var marryID = arguments[1];
    pomelo.app.rpc.rs.rsRemote.GetHongBao(null, roleID, marryID,
        function (err, res) {
            if (!!err) {
                logger.error('##### gethongbao callback res: %j', res);
            }
            logger.fatal('##### gethongbao callback res: %j', res);
            return errorCodes.OK;

        });
}

/**
 * 婚礼进行中 购买婚礼特效
 * */
handler.buytexiao = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var texiaoID = arguments[1];
    pomelo.app.rpc.rs.rsRemote.BuyEffectWedding(null, roleID, texiaoID,
        function (err, res) {
            if (!!err) {
                logger.error('##### buytexiao callback res: %j', res);
            }
            logger.fatal('##### buytexiao callback res: %j', res);
            return errorCodes.OK;

        });
}

/**
 * 查看其他玩家消息
 * */
handler.othermarryinfo = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];
    var otherID = arguments[1];
    pomelo.app.rpc.rs.rsRemote.OtherMarryInfo(null, otherID,
        function (err, res) {
            if (!!err) {
                logger.error('##### buytexiao callback res: %j', res);
            }
            logger.fatal('##### buytexiao callback res: %j', res);
            return errorCodes.OK;

        });
}

/**
 * 获取夫妻日志
 * */
handler.getmarrylog = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];

    pomelo.app.rpc.rs.rsRemote.GetMarryLog(null, roleID,
        function (err, res) {
            if (!!err) {
                logger.error('##### getmarrylog callback res: %j', res);
            }
            logger.fatal('##### getmarrylog callback res: %j', res);
            return errorCodes.OK;

        });
}

/**
 * 获取姻缘值排行榜
 * */
handler.getmarrychart = function(){
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var roleID = arguments[0];

    var player = handler.getPlayer(roleID);
//    var marryInfo = player.toMarryManager.marryInfo[0];
//
//    if(!!marryInfo){
//        var roleID = marryInfo[eMarryInfo.roleID];
//        var toMarryID =  marryInfo[eMarryInfo.toMarryID]
//    }

    player.toMarryManager.GetMarryChart( //roleID+"+"+toMarryID, 17,
        function (err, res) {
            if (!!err) {
                logger.error('##### getmarrylog callback res: %j', res);
            }
            logger.fatal('##### getmarrylog callback res: %j', res);
            return errorCodes.OK;

        });
}


/**
 * 排行榜操作 获取夫妻赠送礼物的信息
 * */
handler.chartgift = function(){
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }

    var roleID = arguments[0];
    pomelo.app.rpc.rs.rsRemote.GetChartMarryGift(null, roleID,
        function (err, res) {
            if (!!err) {
                logger.error('##### chartgift callback res: %j', res);
            }
            logger.fatal('##### chartgift callback res: %j', res);
            return errorCodes.OK;

        });
}





handler.collectnpclevelup = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var baseNpcID = +arguments[1];
    var msg = player.GetColiseumManager().GetCollectNpcLevelUpMsg(baseNpcID);
    return msg;
};

handler.collectnpcreward = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var attID = +arguments[1];
    player.GetColiseumManager().getCollectNpcRewardMsg(attID);
    return errorCodes.OK;
};

handler.collectteamreward = function () {
    if (arguments.length !== 2) {
        return errorCodes.ParameterWrong;
    }
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var attID = +arguments[1];
    var msg = player.GetColiseumManager().getCollectTeamRewardMsg(attID);
    return msg;
};

handler.refreshnpc = function () {
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var msg = player.GetColiseumManager().getRefreshNpcMsg();
    return msg;
};

handler.killcoliseumnpc = function () {
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }

    var index = +arguments[1];
    player.GetColiseumManager().killNpc(index);
};

handler.killcoliseumteam = function () {
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }

    var teamID = +arguments[1];
    player.GetColiseumManager().killNpcTeam(teamID);
};

handler.getallartifactinfo = function () {
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var msg = player.GetArtifactManager().getAllArtifactInfo();
    return msg;
};

handler.activation = function () {
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var actionType = +arguments[1];
    var type = +arguments[2];
    var msg = player.GetArtifactManager().getActivationMsg(actionType, type);
    return msg;
};

/**魔域一键完成 * */
handler.allmoyu = function () {
    var roleID = +arguments[0];
    var player = handler.getPlayer(roleID);
    if (!player) {
        return errorCodes.NoRole;
    }
    var layerID = +arguments[1];
    var msg = player.GetMineManager().AllKeyComplete(layerID);
    return msg;
};
/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-27
 * Time: 下午5:42
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var csSql = require('../../../tools/mysql/csSql');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var globalFunction = require('../../../tools/globalFunction');
var constValue = require('../../../tools/constValue');
var playerManager = require('../../../cs/player/playerManager');
var redisManager = require('../../../cs/chartRedis/redisManager');
var offlinePlayer = require('../../../ps/player/offlinePlayer');
var gameConst = require('../../../tools/constValue');
var defaultValues = require('../../../tools/defaultValues');
var errorCodes = require('../../../tools/errorCodes');
var utilSql = require('../../../tools/mysql/utilSql');
var utils = require('../../../tools/utils');
var detailUtils = require('../../../tools/redis/detailUtils');
var roomManager = require('../../../cs/room/roomManager');
var config = require('../../../tools/config');
var ePosState = gameConst.ePosState;

var eWorldState = gameConst.eWorldState;
var tAssets = templateConst.tAssets;
var eAssetsInfo = gameConst.eAssetsInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var eMisType = gameConst.eMisType;
var eRedisClientType = gameConst.eRedisClientType;
var _ = require('underscore');
var Q = require('q');
var ePlayerTeamInfo = gameConst.ePlayerTeamInfo;
var eCustomSmallType = gameConst.eCustomSmallType;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_getGuid = require('../../../tools/guid');
var log_insLogSql = require('../../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var log_globalFunction = require('../../../tools/globalFunction');
var eItemInfo = gameConst.eItemInfo;
var eRoomMemberTlogInfo = gameConst.eRoomMemberTlogInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetReduce = gameConst.eAssetsChangeReason.Reduce;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 关卡内购买血蓝瓶*/
var BUY_HP_AND_MP = 180;

module.exports = function () {
    return new Handler();
};

/**无this属性*/
var Handler = function () {
};

var handler = Handler.prototype;

handler.HPandMP = function (msg, session, next) {

    var roleID = session.get('roleID');
    var tempID = msg.ID;
    if (null == roleID || null == tempID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var AssetsTemplate = templateManager.GetTemplateByID('AssetsTemplate', tempID);
    if (AssetsTemplate == null) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });
    } else {
        if (false == ( AssetsTemplate[tAssets.type] == eAssetsInfo.ASSETS_HP || AssetsTemplate[tAssets.type]
            == eAssetsInfo.ASSETS_MP )) {
            return next(null, {
                'result': errorCodes.ParameterWrong
            });
        }
    }
    var assetsManager = player.GetAssetsManager();
    var allTemplate = templateManager.GetTemplateByID('AllTemplate', BUY_HP_AND_MP);
    if (assetsManager.CanConsumeAssets(tempID, 1) == false) {
        var yuanBao = globalFunction.GetYuanBaoTemp();
        if (assetsManager.CanConsumeAssets(yuanBao, allTemplate['attnum']/*defaultValues.HpNeedYuanBao*/) == false) {
            return next(null, {
                'result': errorCodes.NoYuanBao
            });
        }
        else {
            // for tlog
            var factor;
            if (AssetsTemplate[tAssets.type] == eAssetsInfo.ASSETS_HP) {
                factor = eAssetReduce.BuyHpInCustom;
            } else if (AssetsTemplate[tAssets.type] == eAssetsInfo.ASSETS_MP) {
                factor = eAssetReduce.BuyMpInCustom;
            }
            //player.GetAssetsManager().SetAssetsValue(yuanBao, -defaultValues.HpNeedYuanBao);
            player.GetAssetsManager().AlterAssetsValue(yuanBao, -allTemplate['attnum']/*defaultValues.HpNeedYuanBao*/,
                                                       factor);
            // for tlog /////////////////////////
            var teamID = player.GetWorldState(eWorldState.TeamID);
            var customID = player.GetWorldState(eWorldState.CustomID);
            var tempRoom = roomManager.GetRoom(customID, teamID);
            var key;
            if (AssetsTemplate[tAssets.type] == eAssetsInfo.ASSETS_MP) {
                key = eRoomMemberTlogInfo.buyMpCount;
            } else {
                key = eRoomMemberTlogInfo.buyHpCount;
            }
            if (null != tempRoom) {
                tempRoom.UpdatePlayerTlogInfoValue(roleID, key, 1);
            }
            ////////////////////////////////////
            return next(null, {
                'result': 0
            });
        }
    }

    var log_beforeMoney = player.GetAssetsManager().GetAssetsValue(tempID);

    player.GetAssetsManager().SetAssetsValue(tempID, -1);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_MoneyArgs = [log_getGuid.GetUuid(), roleID, eMoneyChangeType.HPANDMP, 0, tempID, log_beforeMoney];
    log_MoneyArgs.push(player.GetAssetsManager().GetAssetsValue(tempID));
    log_MoneyArgs.push(utilSql.DateToString(new Date()));
    log_insLogSql.InsertSql(eTableTypeInfo.MoneyChange, log_MoneyArgs);
    //logger.info( '玩家吃蓝屏和血瓶金钱变化 数据入库成功' );
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return next(null, {
        'result': 0
    });
};


handler.GetExp = function (msg, session, next) {
    var self = this;
    var roleID = session.get('roleID');
    var npcID = msg.npcID;
    var att = msg.att;//属性验证（客户端）
    var player = playerManager.GetPlayer(roleID);
    var msgExpLevel = msg.expLevel;
    var clientTimeKey = msg.attKey;    //客户端属性时间戳
    var customID = msg.customID;
    var clientPlayerAtt = msg.clientPlayerAtt;  //客户端用户详细属性

//    logger.warn('roleID: %j, GetExp: %j', msg);

    if (!player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var nowTimeKey = Date.now() % defaultValues.playerAttTimeKeyMax;
    var serverAttKey = player.GetAttManager().GetTimeKey();     //服务器属性时间戳
    var expLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
//    var msgExpLevel = expLevel;
    var result = 0;//属性验证（服务器）
    if (null == roleID || null == npcID || null == att) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var attList = {};   //玩家属性列表，仅用于打印误踢详细信息
    for (var i = gameConst.eAttInfo.ATTACK; i < gameConst.eAttInfo.MAX; i++) {
        if (i == gameConst.eAttInfo.HP || i == gameConst.eAttInfo.MP || i == gameConst.eAttInfo.MAXHP || i
            == gameConst.eAttInfo.MAXMP) {
            continue;
        }
        var att_value = player.GetAttManager().GetAttValue(i);
        attList[i] = att_value;
        att_value = att_value % 2 == 0 ? att_value / 2 : att_value * 2;
        result += att_value;
    }
    if (null == customID) {
        pomelo.app.rpc.rs.rsRemote.
            GetCustomId(null, roleID, npcID, att, result, expLevel, msgExpLevel,
                        function (err, customID, npcID, att, result, expLevel, msgExpLevel) {
                            if (!!err) {
                                logger.error("error when playerHandler GetExp %s", utils.getErrorMessage(err));
                            }
                            killNpcDrop(player, customID, att, msgExpLevel, expLevel,
                                        serverAttKey, clientTimeKey, roleID, attList,
                                        clientPlayerAtt, npcID, result, nowTimeKey, next, self);
                        });
    } else {
        killNpcDrop(player, customID, att, msgExpLevel, expLevel, serverAttKey, clientTimeKey, roleID, attList,
                    clientPlayerAtt, npcID, result, nowTimeKey, next, self);
    }
};

handler.GetCustomPrize = function (msg, session, next) {
    var customID = msg.customID;
    var roleID = session.get('roleID');
    if (null == customID || null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetCustomManager().GetCustomPrize(customID);
    logger.info('获取关卡的物品的结果是' + result);
    if (0 == result) {
        return next(null, {
            'result': result,
            'customID': customID
        });
    } else {
        return next(null, {
            'result': result
        });
    }
};

handler.GetGiftItem = function (msg, session, next) {
    var roleID = session.get('roleID');
    var giftID = msg.giftID;
    if (null == roleID || null == giftID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    if (player.GetItemManager().IsFullEx(gameConst.eBagPos.EquipOff) == true) {
        return next(null, {
            'result': errorCodes.Cs_ItemFull
        });
    }
    var result = player.GetGiftManager().GetGiftItem(giftID);
    if (0 == result) {
        return next(null, {
            'result': result,
            'giftID': giftID
        });
    } else {
        return next(null, {
            'result': result
        });
    }

};

handler.GetLoginGift = function (msg, session, next) {
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetGiftManager().getLoginGift();
    return next(null, result);
};

handler.GetLoginPrize = function (msg, session, next) {
    var roleID = session.get('roleID');
    //var giftID = msg.giftID;
//    if (null == roleID || null == giftID) {
//        next(null, {
//            'result': errorCodes.ParameterNull
//        });
//        return;
//    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetGiftManager().getReward();//giftID
    return next(null, {
        'result': result
    });
};


handler.GetLoginPrize1 = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var loginDay = player.GetPlayerInfo(ePlayerInfo.LoginPrize);
    if (loginDay > 10000) {
        return next(null, {
            'result': errorCodes.IsRec
        });
    }
    if (loginDay > defaultValues.maxLoginPrize) {
        loginDay = defaultValues.maxLoginPrize;
    }
    var LoginPrizeTemplate = templateManager.GetTemplateByID('LoginPrizeTemplate', loginDay);
    if (null == LoginPrizeTemplate) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });
    }
    var prizeNum = LoginPrizeTemplate['prizeNum'];
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var log_ItemGuid = log_getGuid.GetUuid();
    var log_addTime = utilSql.DateToString(new Date());
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    for (var i = 0; i < prizeNum; ++i) {
        var itemID = LoginPrizeTemplate['itemID_' + i];
        var itemNum = LoginPrizeTemplate['itemNum_' + i];
        var log_ItemList = player.AddItem(itemID, itemNum, gameConst.eItemChangeType.LOGINPRIZE, 0);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        for (var j in log_ItemList) {
            var log_ItemArgs = [log_ItemGuid];
            var tempItem = log_ItemList[j];
            for (var k = 0; k < eItemInfo.Max; ++k) {      //将物品的详细信息插入到sql语句中
                log_ItemArgs.push(tempItem.GetItemInfo(k));
            }
            log_ItemArgs.push(gameConst.eItemChangeType.LOGINPRIZE);
            log_ItemArgs.push(gameConst.eEmandationType.ADD);
            log_ItemArgs.push(log_addTime);
            log_insLogSql.InsertSql(eTableTypeInfo.ItemChange, log_ItemArgs);
            //logger.info( '获取登录奖品物品变化 数据入库成功' );
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
    loginDay += 10000;
    player.SetPlayerInfo(ePlayerInfo.LoginPrize, loginDay);
    //player.GetMissionManager().MissionOver(player, eMisType.Login, 0, 1);
    return next(null, {
        'result': 0
    });
};

handler.LearnSkill = function (msg, session, next) {
    var roleID = session.get('roleID');
    var seriesID = msg.seriesID;
    var learnType = msg.learnType;
    if (null == roleID || null == seriesID || null == learnType) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetSkillManager().CreateSkill(seriesID, learnType);
    if (0 == result) {
        player.GetMissionManager().IsMissionOver(eMisType.LearnSkill, 0, 1);
    }
    return next(null, {
        'result': result,
        'seriesID': msg.seriesID,
        'learnType': msg.learnType
    });
};

handler.SmeltSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = msg.tempID;
    var smeltType = msg.smeltType;
    //logger.info('%j  SmeltSoul msg = %j', roleID, msg);
    if (null == roleID || null == tempID || null == smeltType) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if (!(smeltType == gameConst.eSmeltSoulType.AKeySoul || smeltType == gameConst.eSmeltSoulType.Normal)) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetSoulManager().SmeltSoul(tempID, smeltType);
    return next(null, {
        'result': result
    });
};

handler.UpSoulLevel = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = msg.tempID;
    var assetsType = msg.assetsType;
    //logger.info('%j  UpSoulLevel msg = %j', roleID, msg);
    if (null == roleID || null == tempID || null == assetsType) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetSoulManager().UpSoulLevel(tempID, assetsType);
    return next(null, {
        'result': result
    });
};

handler.LearnSoulSkill = function (msg, session, next) {    //变身技能学习
    var roleID = session.get('roleID');
    var tempID = +msg.tempID;
    if (null == roleID || null == tempID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var result = player.GetSoulManager().LearnSoulSkill(tempID);
    return next(null, {'result': result});
};

// 邪神进阶
handler.EvolveSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = +msg.tempID;
    if (null == roleID || null == tempID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var result = player.GetSoulManager().EvolveSoul(tempID);
    return next(null, {'result': result});
};

// 邪神觉醒
handler.WakeSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = +msg.tempID;
    if (null == roleID || null == tempID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var result = player.GetSoulManager().WakeSoul(tempID);
    return next(null, {'result': result});
}

handler.SacrificeMagicSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = msg.tempID;
    var SacrificeType = msg.SacrificeType;
    if (null == roleID || null == tempID || null == SacrificeType) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetMagicSoulManager().SacrificeMagicSoul(tempID, SacrificeType);
    return next(null, {
        'result': result
    });
};

handler.SurmountMagicSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = msg.tempID;
    var SurmountType = msg.SurmountType;
    if (null == roleID || null == tempID || null == SurmountType) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetMagicSoulManager().SurmountMagicSoul(tempID, SurmountType);
    return next(null, result);
};

handler.UpSkillMagicSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    var tempID = msg.tempID;
    var UpSkillType = msg.UpSkillType;
    if (null == roleID || null == tempID || null == UpSkillType) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetMagicSoulManager().UpSkillMagicSoul(tempID, UpSkillType);
    return next(null, {
        'result': result
    });
};

handler.OpenMagicSoul = function (msg, session, next) {
    var roleID = session.get('roleID');
    //var tempID = msg.tempID;
    //var SurmountType = msg.SurmountType;
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetMagicSoulManager().OpenMagicSoul();
    return next(null, {
        'result': result
    });
};

handler.SetNewPlayer = function (msg, session, next) {
    var roleID = session.get('roleID');
    var newID = msg.newID;
    if (null == roleID || null == newID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    player.SetNewHelp(newID);
    return next(null, {
        'result': 0
    });
};

handler.FindPlayerByName = function (msg, session, next) {
    var roleID = session.get('roleID');
    var name = msg.name;
    if (null == roleID || null == name) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    if (name.length == 0) {
        var msg = {
            result: 0,
            playerList: []
        };
        var playerList = playerManager.GetNumPlayer(defaultValues.findPlayerNum, roleID);
        for (var index in playerList) {
            var tempPlayer = playerList[index];
            msg.playerList.push(tempPlayer.GetPlayerAoiInfo());
        }
        return next(null, msg);
    }
    if (player.GetFindName() == name) {
        return next(null, {'result': errorCodes.IsRec});
    }
    player.SetFindName(name);
    if (globalFunction.IsValidRoleName(name) == false) {
        return next(null, {result: errorCodes.Ls_NameNum});
    }
    Q.nfcall(csSql.GetRoleIDByName, name)
        .catch(function (err) {
                   return next(null, {result: errorCodes.SystemWrong});
               })
        .then(function (res) {
                  if (res <= 0) {
                      return next(null, {result: errorCodes.FRIEND_SEARCH_NO_ROLE});
                  }
                  csSql.GetRoleInfoByName(res, function (err, playerInfo, itemList, soulList, attList, magicSoulList,
                                                         petList) {
                      if (!!err) {
                          logger.info('FindPlayerByName roleID: %s name: %s, failed: %s', roleID, name,
                                      utils.getErrorMessage(err));
                          return next(null, {result: errorCodes.SystemWrong});
                      }
                      if (playerInfo[0] == null) {
                          return next(null, {result: errorCodes.NoRole});
                      }
                      return next(null, {
                          result: 0,
                          playerList: [
                              {
                                  playerInfo: playerInfo,
                                  itemList: itemList,
                                  soulList: soulList,
                                  attList: attList,
                                  magicSoulList: magicSoulList,
                                  petList: petList
                              }
                          ]
                      });
                  });
              }).done();
};

/**
 * 获取玩家信息 该方法 和 FindPlayer 区别 是 没有重数据库 读取数据 直接重redis 读取数据
 *
 * @param {Object} msg 客户端消息
 * @param {Object} session 客户端回话
 * @param {Function} 回调函数 类似 response
 * @api public
 * */
handler.FindPlayerInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    var queryRoleId = +msg.otherID;
    if (!queryRoleId) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    if (roleID == queryRoleId) {
        var player = playerManager.GetPlayer(roleID);
        if (!!player) {
            return next(null, {
                result: 0,
                playerList: [
                    player.getPlayerShowInfo()
                ]
            });
        }
    }

    var client = redisManager.getClient(eRedisClientType.Chart);

    if (queryRoleId > defaultValues.ARES_BASE_ROLE_INDEX) {
        var rClient = redisManager.getClient(eRedisClientType.Chart).client;
        var zCard = Q.nbind(rClient.zcard, rClient);
        //var zRange = Q.nbind(rClient.zrange, rClient);
        var zRevRange = Q.nbind(rClient.zrevrange, rClient);
        var hGet = Q.nbind(rClient.hget, rClient);

        var aresInfo = null;
        var jobs = [
            zCard(redisManager.getZhanliSetName()),
            hGet(redisManager.getAresInfoSetName(), queryRoleId)
        ];
        Q.all(jobs)
            .then(function (data) {
                      var total = data[0];
                      aresInfo = JSON.parse(data[1]);
                      var rank = ((aresInfo.rankKey) % total) - 1;
                      rank = rank < 0 ? 0 : rank || 0;
                      return zRevRange(redisManager.getZhanliSetName(), rank, rank, 'WITHSCORES');
                  })
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in zhanli rank but not in roleInfo error：%j',
                                       queryRoleId);
                          return next(null, {
                              result: errorCodes.ARES_DELETE_ROLE
                          });
                      }
                      var roleID = datas[0];
                      client.hGet(redisManager.getRoleDetailSetNameByServerUid(config.list.serverUid), roleID,
                                  function (err, data) {
                                      if (!!err || null == data) {
                                          logger.warn("get player detail from redis: %d, %s, %j", roleID,
                                                      utils.getErrorMessage(err), data);
//                                          return next(null, {
//                                              result: errorCodes.ARES_DELETE_ROLE
//                                          });

                                          var op = new offlinePlayer();
                                          op.LoadDetailToRedisDataByDB(roleID, function (err, zippedInfo) {
                                              if (!!err) {
                                                  logger.error("get player detail by LoadDetailToRedisDataByDB: %d, %s",
                                                               roleID, utils.getErrorMessage(err));
                                                  return next(null, {
                                                      result: errorCodes.ARES_DELETE_ROLE
                                                  });
                                              }

                                              /*** 相关数据 替换 如名字 id等*/
                                              var rData = detailUtils.unzip(zippedInfo);
                                              rData.playerInfo[ePlayerInfo.ROLEID] = queryRoleId;
                                              rData.playerInfo[ePlayerInfo.NAME] = aresInfo.roleName;

                                              return next(null, {
                                                  result: 0,
                                                  playerList: [
                                                      rData
                                                  ]
                                              });
                                          });

                                          return;

                                      }
                                      /*** 相关数据 替换 如名字 id等*/
                                      var rData = detailUtils.unzip(data);

                                      /** 检测新功能添加字段*/
                                      if (detailUtils.checkRowUpdate(rData)) {
                                          var op = new offlinePlayer();
                                          op.LoadDetailToRedisDataByDB(roleID, function (err, zippedInfo) {
                                              if (!!err) {
                                                  logger.error("get player detail by LoadDetailToRedisDataByDB: %d, %s",
                                                               roleID, utils.getErrorMessage(err));
                                                  return next(null, {
                                                      result: errorCodes.ARES_DELETE_ROLE
                                                  });
                                              }

                                              /*** 相关数据 替换 如名字 id等*/
                                              var rData = detailUtils.unzip(zippedInfo);
                                              rData.playerInfo[ePlayerInfo.ROLEID] = queryRoleId;
                                              rData.playerInfo[ePlayerInfo.NAME] = aresInfo.roleName;

                                              return next(null, {
                                                  result: 0,
                                                  playerList: [
                                                      rData
                                                  ]
                                              });
                                          });
                                      }


                                      rData.playerInfo[ePlayerInfo.ROLEID] = queryRoleId;
                                      rData.playerInfo[ePlayerInfo.NAME] = aresInfo.roleName;

                                      return next(null, {
                                          result: 0,
                                          playerList: [
                                              rData
                                          ]
                                      });
                                  });
                  }).catch(function (err) {
                               logger.error('ares findPlayerInfo err: %s', utils.getErrorMessage(err));
                               return next(null, {result: errorCodes.ParameterNull});
                           });
    } else {
        client.hGet(redisManager.getRoleDetailSetNameByServerUid(config.list.serverUid), queryRoleId,
                    function (err, data) {
                        if (!!err || null == data) {
                            logger.warn("get player detail from redis: %d, %s, %j", queryRoleId,
                                        utils.getErrorMessage(err), data);
//                                          return next(null, {
//                                              result: errorCodes.ARES_DELETE_ROLE
//                                          });

                            var op = new offlinePlayer();
                            op.LoadDetailToRedisDataByDB(queryRoleId, function (err, zippedInfo) {
                                if (!!err) {
                                    logger.error("get player detail by LoadDetailToRedisDataByDB: %d, %s",
                                                 queryRoleId, utils.getErrorMessage(err));
                                    return next(null, {
                                        result: errorCodes.ARES_DELETE_ROLE
                                    });
                                }

                                var rData = detailUtils.unzip(zippedInfo);
                                return next(null, {
                                    result: 0,
                                    playerList: [
                                        rData
                                    ]
                                });
                            });

                            return;
                        }

                        var rData = detailUtils.unzip(data);

                        /** 检测新功能添加字段*/
                        if (detailUtils.checkRowUpdate(rData)) {
                            var op = new offlinePlayer();
                            op.LoadDetailToRedisDataByDB(queryRoleId, function (err, zippedInfo) {
                                if (!!err) {
                                    logger.error("get player detail by LoadDetailToRedisDataByDB: %d, %s",
                                                 queryRoleId, utils.getErrorMessage(err));
                                    return next(null, {
                                        result: errorCodes.ARES_DELETE_ROLE
                                    });
                                }

                                /** 相关数据 替换 如名字 id等*/
                                var rData = detailUtils.unzip(zippedInfo);

                                return next(null, {
                                    result: 0,
                                    playerList: [
                                        rData
                                    ]
                                });
                            });
                        }

                        return next(null, {
                            result: 0,
                            playerList: [
                                rData
                            ]
                        });
                    });
    }
};


handler.FindPlayer = function (msg, session, next) {
    var roleID = session.get('roleID');
    var queryRoleId = +msg.otherID;
    if (!queryRoleId) {
        return next(null, {result: errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(queryRoleId);

    Q.ninvoke(csSql, 'GetRoleInfoByName', queryRoleId)
        .spread(function (playerInfo, itemList, soulList, attList, magicSoulList, petList, jjcInfo) {
                    if (!!player && playerInfo[ePlayerInfo.ActiveEnhanceSuitID]
                        != player.GetPlayerInfo(ePlayerInfo.ActiveEnhanceSuitID)) {
                        playerInfo[ePlayerInfo.ActiveEnhanceSuitID] =
                        player.GetPlayerInfo(ePlayerInfo.ActiveEnhanceSuitID);
                    }
                    if (!!player && playerInfo[ePlayerInfo.ActiveInsetSuitID]
                        != player.GetPlayerInfo(ePlayerInfo.ActiveInsetSuitID)) {
                        playerInfo[ePlayerInfo.ActiveInsetSuitID] = player.GetPlayerInfo(ePlayerInfo.ActiveInsetSuitID);
                    }

                    if (!!player && playerInfo[ePlayerInfo.ActiveFashionWeaponID]
                        != player.GetPlayerInfo(ePlayerInfo.ActiveFashionWeaponID)) {
                        playerInfo[ePlayerInfo.ActiveFashionWeaponID] =
                        player.GetPlayerInfo(ePlayerInfo.ActiveFashionWeaponID);
                    }

                    if (!!player && playerInfo[ePlayerInfo.ActiveFashionEquipID]
                        != player.GetPlayerInfo(ePlayerInfo.ActiveFashionEquipID)) {
                        playerInfo[ePlayerInfo.ActiveFashionEquipID] =
                        player.GetPlayerInfo(ePlayerInfo.ActiveFashionEquipID);
                    }

                    if (!!player && playerInfo[ePlayerInfo.titleID]
                        != player.GetPlayerInfo(ePlayerInfo.titleID)) {
                        playerInfo[ePlayerInfo.titleID] =
                        player.GetPlayerInfo(ePlayerInfo.titleID);
                    }

                    if (playerInfo[0] == null) {
                        /** 本服取不到玩家信息时， 可能是跨服， 走跨服查询*/
                        return pomelo.app.rpc.fs.fsRemote.checkAndGetServerUid(null, queryRoleId, function (err, res) {
                            if (!!err || !res.isAcross) {
                                return next(null, {
                                    result: errorCodes.SystemBusy
                                });
                            }
                            var client = redisManager.getClient(eRedisClientType.Chart);
                            return client.hGet(redisManager.getRoleDetailSetNameByServerUid(res.serverUid), queryRoleId,
                                               function (err, data) {
                                                   if (!!err) {
                                                       logger.error("get across player failed: %d, %j, %s", queryRoleId,
                                                                    data, utils.getErrorMessage(err));
                                                       return next(null, {
                                                           result: errorCodes.SystemBusy
                                                       });
                                                   }

                                                   if (!data) {
                                                       logger.warn("get across player detail: %d, %j", queryRoleId,
                                                                   data);

                                                       /** 跨服取不到好友信息时 可能存在 一定风险 queryRoleId 跨服不存在， 玩家不断的发 有可能么！！！*/
                                                       pomelo.app.rpc.fs.fsRemote.rebuildRoleDetail(null, res.serverUid,
                                                                                                    queryRoleId,
                                                                                                    utils.done);

                                                       return next(null, {
                                                           result: errorCodes.SystemBusy
                                                       });
                                                   }

                                                   return next(null, {
                                                       result: 0,
                                                       playerList: [
                                                           detailUtils.unzip(data)
                                                       ]
                                                   });
                                               });
                        });
                    } else {
                        return next(null, {
                            result: 0,
                            playerList: [
                                {
                                    playerInfo: playerInfo,
                                    itemList: itemList,
                                    soulList: soulList,
                                    attList: attList,
                                    magicSoulList: magicSoulList,
                                    petList: petList,
                                    jjcInfo: jjcInfo
                                }
                            ]
                        });
                    }
                }
    )
        .
        catch(function (err) {
                  logger.info('FindPlayer %s failed: %s', queryRoleId, utils.getErrorMessage(err));
                  return next(null, {result: errorCodes.toClientCode(err)});
              })
        .done();
};

handler.SoulOpen = function (msg, session, next) {
    var roleID = session.get('roleID');
    //logger.info('%j  SoulOpen msg = %j', roleID, msg);
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetSoulManager().OpenNew(false);
    return next(null, {
        'result': result
    });
};

handler.SoulMatch = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    player.GetSoulManager().BeginMatch(function (err, result) {
        if (err) {
            return next(null, {'result': err});
        }
        else {
            return next(null, {'result': result});
        }
    });
};

handler.SetStoryID = function (msg, session, next) {
    var roleID = session.get('roleID');
    var storyID = msg.storyID;
    if (null == roleID || null == storyID) {
        return next();
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    player.SetPlayerInfo(ePlayerInfo.Story, storyID);
    return next();
};

handler.UseAlchemy = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var msg = player.GetAlchemyManager().UseAlchemy();

    if (typeof msg == 'number') {
        return next(null, {
            'result': msg
        });
    }
    else {
        return next(null, msg);
    }
};

handler.UseFlop = function (msg, session, next) {
    var roleID = session.get('roleID');
    var customID = msg.customID;
    var nType = msg.nType;
    if (null == roleID || nType == null || customID == null) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetFlopManager().UseFlop(customID, nType, true);

    if (typeof result == 'number') {
        return next(null, {
            'result': result
        });
    }
    else {
        return next(null, {
            'result': 0,
            'Flop': result
        });
    }
};

handler.LearnRune = function (msg, session, next) {
    var roleID = session.get('roleID');
    var seriesID = msg.seriesID;
    var attID = msg.attID;
    if (null == roleID || null == seriesID || null == attID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetRuneManager().LearnRune(seriesID, attID);

    return next(null, {
        'result': result
    });
};

handler.ResetRune = function (msg, session, next) {
    var roleID = session.get('roleID');
    var seriesID = msg.seriesID;
    if (null == roleID || null == seriesID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetRuneManager().ResetRune(seriesID);

    return next(null, {
        'result': result
    });
};

handler.CanGetPhysicalGift = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull,
            'nextTime': -1
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole,
            'nextTime': -1
        });
    }
    var result = player.GetPhysicalManager().CanGetPhysicalGift();
    return next(null, result);
};

handler.GetPhysicalGift = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetPhysicalManager().GetPhysicalGift();
    return next(null, {
        'result': result
    });
};

handler.Ping = function (msg, session, next) {
    var roleID = session.get('roleID');
    var checkID = session.uid;
    var frontendId = session.frontendId;
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var nowTime = new Date();
    var nowSec = nowTime.getTime();
    var pingData = {
        'checkID': checkID,
        'frontendId': frontendId,
        'pingSec': nowSec
    };
    player.UpdatePing(pingData);
    return next(null, {
        'result': errorCodes.OK
    });
};

handler.playerCheat = function (roleID, type) { //玩家作弊处理
    var route = 'ServerNotifyUsePlugin';
    var msg = {
        type: type          //0 使用外挂  1属性不一致
    };

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return;
    }
    player.SendMessage(route, msg);

    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState != ePosState.Custom) {
        return;
    }
    var tempRoom = roomManager.GetRoom(customID, teamID);
    if (null == tempRoom) {
        return;
    }
    tempRoom.CheatGameOver(player);
    player.GetAsyncPvPManager().SetCheatPlayerRunning();    //设置pvp战斗结束
};

handler.CheckForbidTime = function (msg, session, next) {
    var roleID = session.get("roleID");
    var type = msg.type;
    var subType = msg.subType;
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (type < 0 && type > 2) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null === player) {
        return next(null, {
            'result': errorCodes.NoRole
        })
    }

    playerManager.CheckForbidTime(roleID, type, subType, function (value) {
        return next(null, {
            'result': value.result,
            'subType': value.subType
        });
    });
};

handler.GetQQMember = function (msg, session, next) {
    //添加续费开通
    var exeType = msg.exeType;
    var roleID = session.get("roleID");
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null === player) {
        return next(null, {
            'result': errorCodes.NoRole
        })
    }
    var openID = player.GetOpenID();
    var token = player.GetToken();
    player.GetQQMember(openID, token, exeType);
    //如果腾讯还有延迟 采用延迟再调
    //setTimeout(player.GetQQMember(openID, token, exeType),3000);
    //setTimeout(player.GetQQMember(openID, token, exeType),30000);
    //setTimeout(player.GetQQMember(openID, token, exeType),60000);
    return next(null, {
        'result': 0
    });
};

handler.GetChartReward = function (msg, session, next) {
    var roleID = session.get('roleID');
    var chartType = msg.chartType;
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var result = player.GetRoleChartManager().GetChartReward(chartType);
    return next(null, result);
};

handler.KillNpc = function (msg, session, next) {    //主角战斗击杀伤害计算复盘
    var self = this;
    var roleID = session.get('roleID');
    var playerAtt = msg.playerAtt;
    var npcAtt = msg.npcAtt;
    var actorID = msg.actorID;
    var npcHash = msg.npcHash;
    var damageList = msg.damageList;
    var customID = msg.customID;
    if (!playerAtt || !npcAtt || !actorID || null == npcHash || !damageList || !customID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    if (customID == defaultValues.newRoleCustomID) {    //新手关不做处理
        return next(null, {'result': 0});
    }
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == customTemplate) {
        return next(null, {'result': errorCodes.NoTemplate});
    }
    var smallType = customTemplate[templateConst.tCustom.smallType];
    if (smallType == gameConst.eCustomSmallType.ZhanHun) {  //战魂关卡需要单独处理
        var pvpPlayerInfo = player.GetAsyncPvPManager().GetPlayersInfo();   //对手的全部信息
        var pvpPlayerAtt;
        var pvpPlayerLevel;
        for (var x = 0; x < pvpPlayerInfo.length; ++x) {
            var pvptemp = pvpPlayerInfo[x];
            if (actorID == pvptemp.roleID) {
                pvpPlayerAtt = pvptemp.attList;
                pvpPlayerLevel = pvptemp.expLevel;
            }
        }
        if (null == pvpPlayerAtt || pvpPlayerAtt.length < 28) {
            return next(null, {'result': errorCodes.SystemWrong});
        }
        var result = 0;
        for (var index = 0; index < gameConst.eAttInfo.MAX; ++index) {
            if (index == gameConst.eAttInfo.HP || index == gameConst.eAttInfo.MP || index == gameConst.eAttInfo.MAXHP
                || index == gameConst.eAttInfo.MAXMP) {
                continue;
            }
            var tempAtt = pvpPlayerAtt[index][index];
            tempAtt = tempAtt % 3 == 0 ? tempAtt / 3 : tempAtt * 3;
            result += tempAtt;
        }

        if (npcHash != result) {
            logger.warn('handler.KillNpc pvp hash check error, roleID: %j, result: %j, npcHash: %j, serverNpsList: %j, npcAtt: %j, actorID: %j, pvpPlayerInfo: %j, msg: %j',
                        roleID, result, npcHash, pvpPlayerAtt, npcAtt, actorID, pvpPlayerInfo, msg);
            if (!!defaultValues.OpenCheckRate) {
                self.playerCheat(roleID, 1);
            }
            return next(null, {result: 0});
        }

        var AddPercent_HP_NPC = customTemplate['AddPercent_HP_NPC'];    //hp加成百分比 npc
        var maxHp = Math.floor(pvpPlayerAtt[gameConst.eAttInfo.MAXHP][gameConst.eAttInfo.MAXHP] * (1 + AddPercent_HP_NPC
            / 100));  //最大血量
        var tempHp = maxHp; //用于计算
        for (var i = 0; i < damageList.length; ++i) {
            if (0 == damageList[i] && 0 < tempHp) {
                logger.warn('handler.KillNpc pvp npc hp is unusual,roleID: %j, maxHp: %j, damageList: %j, playerAtt: %j, npcAtt: %j, actorID: %j, pvpPlayerInfo: %j, customTemplate: %j, msg: %j',
                            roleID, maxHp, damageList, playerAtt, npcAtt, actorID, pvpPlayerInfo, customTemplate, msg);
                if (!!defaultValues.OpenCheckRate) {
                    self.playerCheat(roleID, 1);
                }
            }
            tempHp += damageList[i];
            if (tempHp > maxHp) {
                tempHp = maxHp;
            }
            if (tempHp < 0) {
                tempHp = 0;
            }
        }
        return next(null, {'result': 0});
    }
    else if (smallType == gameConst.eCustomSmallType.Single ||
             smallType == gameConst.eCustomSmallType.Hell ||
             smallType == gameConst.eCustomSmallType.Team ||
             smallType == gameConst.eCustomSmallType.Activity ||
             smallType == gameConst.eCustomSmallType.Climb ||
             smallType == gameConst.eCustomSmallType.SoulCus ||
             smallType == gameConst.eCustomSmallType.Train) {
        var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', actorID);
        if (null != npcAttTemplate) {
            var result = 0;
            var serverNpcList = {};
            for (var index = 0; index < gameConst.eAttInfo.MAX; ++index) {
                if (index == gameConst.eAttInfo.HP || index == gameConst.eAttInfo.MP || index
                    == gameConst.eAttInfo.MAXHP
                    || index == gameConst.eAttInfo.MAXMP) {
                    continue;
                }
                var tempAtt = npcAttTemplate['att_' + index];
                serverNpcList[index] = tempAtt;
                tempAtt = tempAtt % 3 == 0 ? tempAtt / 3 : tempAtt * 3;
                result += tempAtt;
            }

            if (npcHash != result) {
                logger.warn('handler.KillNpc  npc hash is not equal, roleID: %j, result: %j, npcHash: %j, serverNpsList: %j, npcAtt: %j, actorID: %j, customTemplate: %j, npcAttTemplate: %j, msg: %j',
                            roleID, result, npcHash, serverNpcList, npcAtt, actorID, customTemplate, npcAttTemplate,
                            msg);
                if (!!defaultValues.OpenCheckRate) {
                    self.playerCheat(roleID, 1);
                }
                return next(null, {result: 0});
            }
            var AddPercent_HP_NPC = customTemplate['AddPercent_HP_NPC'];    //hp加成百分比 npc
            var maxHp = Math.floor(npcAttTemplate['att_' + gameConst.eAttInfo.MAXHP] * (1 + AddPercent_HP_NPC / 100));  //最大血量
            var tempHp = maxHp; //用于计算
            for (var i = 0; i < damageList.length; ++i) {
                if (0 == damageList[i] && 0 < tempHp) {
                    logger.warn('handler.KillNpc  npc hp is unusual,roleID: %j, maxHp: %j, damageList: %j, playerAtt: %j, npcAtt: %j, customTemplate: %j, npcAttTemplate: %j, msg: %j',
                                roleID, maxHp, damageList, playerAtt, npcAtt, customTemplate, npcAttTemplate, msg);
                    if (!!defaultValues.OpenCheckRate) {
                        self.playerCheat(roleID, 1);
                    }
                }
                tempHp += damageList[i];
                if (tempHp > maxHp) {
                    tempHp = maxHp;
                }
                if (tempHp < 0) {
                    tempHp = 0;
                }
            }
        }
        return next(null, {result: 0});
    }
    else {
        return next(null, {result: 0});
    }

};

handler.CheckDamage = function (msg, session, next) {    //主角战斗攻击伤害计算复盘
    var self = this;
    var roleID = session.get('roleID');
    var type = msg.type;    //0主角对怪 1怪对主角 2宠物对怪 3怪对宠物
    var skillID = msg.skillID;  //技能ID
    var buffID = msg.buffID;    //技能触发的buffID，伤害由buff造成
    var damageNum = msg.damageNum;  //造成伤害量
    var playerAtt = msg.playerAtt;  //玩家的所有属性
    var npcAtt = msg.npcAtt;    //怪的所有属性
    var actorID = msg.npcID;
    var randomCrit = msg.randomCrit;    //暴击随机数
    var randomDamage = msg.randomDamage;    //伤害随机数
    var customID = msg.customID;
    var clientTimeKey = msg.attKey;    //客户端属性时间戳
    if (!skillID || !skillID || !buffID || !damageNum || !playerAtt || !npcAtt || !actorID || !customID
        || !clientTimeKey) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var serverAttKey = player.GetAttManager().GetTimeKey();     //服务器属性时间戳
    if (serverAttKey != clientTimeKey) {
        logger.warn('handler.CheckDamage timeKey not equal roleID: %j, serverAttKey: %j, clientTimeKey: %j', roleID,
                    serverAttKey, clientTimeKey);
        return next(null, {'result': 0});
    }
    if (customID == defaultValues.newRoleCustomID) {    //新手关不做处理
        return next(null, {'result': 0});
    }
//    logger.fatal('***************************** customID = %j', customID);
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == customTemplate) {
        return next(null, {'result': errorCodes.NoTemplate});
    }
    var smallType = customTemplate[templateConst.tCustom.smallType];
    var calDamage = 0;
//    logger.fatal('***************************** smallType = %j', smallType);
    if (smallType == gameConst.eCustomSmallType.ZhanHun) {  //战魂关卡
        calDamage = CalPvpDamage(roleID, buffID, type, skillID, actorID, randomCrit, randomDamage);
        if (calDamage < 0) {
            return next(null, {'result': errorCodes.SystemWrong});
        }
    }
    else if (smallType == gameConst.eCustomSmallType.Single ||
             smallType == gameConst.eCustomSmallType.Hell ||
             smallType == gameConst.eCustomSmallType.Team ||
             smallType == gameConst.eCustomSmallType.Activity ||
             smallType == gameConst.eCustomSmallType.Climb ||
             smallType == gameConst.eCustomSmallType.SoulCus ||
             smallType == gameConst.eCustomSmallType.Train) {
        calDamage = CalDamage(roleID, buffID, type, skillID, actorID, randomCrit, randomDamage);
    }
    else {
        return next(null, {'result': errorCodes.SystemWrong});
    }

    if ((((type == 0 || type == 2) && calDamage < damageNum ) || ((type == 1 || type == 3) && calDamage > damageNum))
        && Math.abs(calDamage - damageNum) > 5) {
        logger.warn('handler.CheckDamage roleID: %j, calDamage: %j, msg: %j, customTemplate: %j, GetAllAtt: %j, playerInfo:'
                        + ' %j skillTemplate: %j, buffTemplate: %j, npcAttTemplate: %j, npcTemplate: %j',
                    roleID, calDamage, msg, customTemplate, player.GetAttManager().GetAllAtt(roleID), player.playerInfo,
                    templateManager.GetTemplateByID('SkillTemplate', skillID),
                    templateManager.GetTemplateByID('BuffTemplate', buffID),
                    templateManager.GetTemplateByID('NpcAttTemplate', actorID),
                    templateManager.GetTemplateByID('NpcTemplate', actorID)
        );
        if (!!defaultValues.OpenCheckRate) {
            self.playerCheat(roleID, 1);
        }
    }
    return next(null, {'result': 0});
};

var CalDamage = function (roleID, buffID, type, skillID, actorID, randomCrit, randomDamage) {    //伤害计算
    var player = playerManager.GetPlayer(roleID);

    if (0 == type) {    //主角对怪
        var att_Attack = 0;
        var att_Crit = 0;
        if (null != player) {
            att_Attack = player.GetAttManager().GetAttValue(gameConst.eAttInfo.ATTACK); //攻击
            att_Crit = player.GetAttManager().GetAttValue(gameConst.eAttInfo.CRIT); //暴击
        }

        att_Attack = GetSkillAtt(player, skillID, gameConst.eAttInfo.ATTACK, att_Attack);
        var buffTemplate = templateManager.GetTemplateByID('BuffTemplate', buffID);     //计算buff加成
        var damagePercent = 0;
        var damageAdd = 0;
        if (null != buffTemplate) {
            damagePercent = buffTemplate[templateConst.tBuff.damagePercent];    //伤害百分比
            damageAdd = buffTemplate[templateConst.tBuff.damageAdd];    //伤害加成
        }
        var baseDamage = Math.abs(Math.floor(damagePercent * att_Attack / 100 + damageAdd));
//        logger.fatal('***************************************** baseDamage = ' + baseDamage);

        var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', actorID);
        var npcTemplate = templateManager.GetTemplateByID('NpcTemplate', actorID);
        att_Crit = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRIT, att_Crit);
//        logger.fatal('***************************************** att_Crit = ' + att_Crit);

        var battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit);
        var percentageCrit = 0; //攻方暴击率
        if (null != battleTemplate) {
            percentageCrit = att_Crit / (battleTemplate['att_1'] / 100 * att_Crit + battleTemplate['att_2']
                * player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel)
                + battleTemplate['att_3']);
            percentageCrit = Math.floor(percentageCrit * 1000000) / 1000000;
        }
//        logger.fatal('***************************************** percentageCrit = ' + percentageCrit);

        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Resistance);
        var percentageAntiCrit = 0; //受方暴击抵抗率
        if (null != npcAttTemplate && null != battleTemplate && null != npcTemplate) {
            percentageAntiCrit = npcAttTemplate['att_' + gameConst.eAttInfo.ANTICRIT] / (battleTemplate['att_1'] / 100 *
                                                                                         npcAttTemplate['att_'
                                                                                             + gameConst.eAttInfo.ANTICRIT]
                                                                                             + battleTemplate['att_2']
                                                                                             * npcTemplate['expLevel']
                + battleTemplate['att_3']);
            percentageAntiCrit = Math.floor(percentageAntiCrit * 1000000) / 1000000;
        }
//        logger.fatal('***************************************** percentageAntiCrit = ' + percentageAntiCrit);
        //是否暴击
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Chance);
        var result = (battleTemplate['att_1'] * percentageCrit * percentageCrit) / (percentageCrit + percentageAntiCrit)
                         - randomCrit + battleTemplate['att_2'];
//        logger.fatal('***************************************** result = ' + result);
        if (result > 0) {   //暴击伤害
            var att_CritDamage = player.GetAttManager().GetAttValue(gameConst.eAttInfo.CRITDAMAGE);
            att_CritDamage = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRITDAMAGE, att_CritDamage);
            var paramA = Math.floor(att_CritDamage) - npcAttTemplate['att_' + gameConst.eAttInfo.CRITDAMAGEREDUCE];
            paramA = paramA < -5000 ? -5000 : paramA;
            battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Damage);
            baseDamage = baseDamage * (battleTemplate['att_1'] + paramA) / battleTemplate['att_2'];
        }
//        logger.fatal('***************************************** baseDamage = ' + baseDamage);
        //对方免伤率-防御
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDefense);
        var percentageDefance = npcAttTemplate['att_' + gameConst.eAttInfo.DEFENCE] / (battleTemplate['att_1'] / 100
                                                                                           * npcAttTemplate['att_'
                + gameConst.eAttInfo.DEFENCE]
                                                                                           + battleTemplate['att_2']
                                                                                           * npcTemplate['expLevel']
            + battleTemplate['att_3']);
        percentageDefance = Math.floor(percentageDefance * 1000000) / 1000000;
//        logger.fatal('***************************************** percentageDefance = ' + percentageDefance);

        //己方总体伤害提升百分比
        var att_DamageUp = player.GetAttManager().GetAttValue(gameConst.eAttInfo.DAMAGEUP);
        att_DamageUp = GetSkillAtt(player, skillID, gameConst.eAttInfo.DAMAGEUP, att_DamageUp);
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageUpgrade);
        var percentageDamageUp = att_DamageUp / battleTemplate['att_1'];
        percentageDamageUp = Math.floor(percentageDamageUp * 1000000) / 1000000;
//        logger.fatal('***************************************** percentageDamageUp = ' + percentageDamageUp);

        //对方总体伤害减免百分比
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageReduction);
        var percentageDamageReduce = npcAttTemplate['att_' + gameConst.eAttInfo.DAMAGEREDUCE] / battleTemplate['att_1'];
        percentageDamageReduce = Math.floor(percentageDamageReduce * 1000000) / 1000000;
//        logger.fatal('***************************************** percentageDamageReduce = ' + percentageDamageReduce);

        //最终伤害
        baseDamage =
        baseDamage * (1 - percentageDefance) * (1 + (percentageDamageUp - percentageDamageReduce) /
                                                    (percentageDamageUp * 0.55 + percentageDamageReduce + 0.5)) * (1
            + randomDamage
                                                                                                                       / 100);
//        logger.fatal('***************************************** baseDamage = ' + baseDamage);
        baseDamage = Math.floor(baseDamage);
        return baseDamage;
    }

    if (1 == type) {    //怪对主角
        var att_Attack = 0;
        var att_Crit = 0;
        var npcAttTemplate = templateManager.GetTemplateByID('NpcAttTemplate', actorID);
        if (null != npcAttTemplate) {
            att_Attack = npcAttTemplate['att_' + gameConst.eAttInfo.ATTACK]; //攻击
            att_Crit = npcAttTemplate['att_' + gameConst.eAttInfo.CRIT];     //暴击
        }
        att_Attack = GetSkillAtt(player, skillID, gameConst.eAttInfo.ATTACK, att_Attack);
        var buffTemplate = templateManager.GetTemplateByID('BuffTemplate', buffID);     //计算buff加成
        var damagePercent = 0;
        var damageAdd = 0;
        if (null != buffTemplate) {
            damagePercent = buffTemplate[templateConst.tBuff.damagePercent];    //伤害百分比
            damageAdd = buffTemplate[templateConst.tBuff.damageAdd];    //伤害加成
        }
        var baseDamage = Math.abs(Math.floor(damagePercent * att_Attack / 100 + damageAdd));
        //      logger.fatal('********************00000********************* baseDamage = ' + baseDamage);

        att_Crit = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRIT, att_Crit);
        //      logger.fatal('********************00000********************* att_Crit = ' + att_Crit);

        var npcTemplate = templateManager.GetTemplateByID('NpcTemplate', actorID);

        var battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit);

        var percentageCrit = 0; //攻方暴击率
        if (null != battleTemplate && null != npcTemplate) {
            percentageCrit =
            att_Crit / (battleTemplate['att_1'] / 100 * att_Crit + battleTemplate['att_2'] * npcTemplate['expLevel']
                + battleTemplate['att_3']);
            percentageCrit = Math.floor(percentageCrit * 1000000) / 1000000;
        }
        //    logger.fatal('**********************00000******************* percentageCrit = ' + percentageCrit);

        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Resistance);
        var percentageAntiCrit = 0; //受方暴击抵抗率
        if (null != battleTemplate) {
            percentageAntiCrit =
            player.GetAttManager().GetAttValue(gameConst.eAttInfo.ANTICRIT) / (battleTemplate['att_1'] / 100 *
                                                                               player.GetAttManager().GetAttValue(gameConst.eAttInfo.ANTICRIT)
                                                                                   + battleTemplate['att_2']
                                                                                   * player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel)
                + battleTemplate['att_3']);
            percentageAntiCrit = Math.floor(percentageAntiCrit * 1000000) / 1000000;
        }
        //     logger.fatal('******************00000*********************** percentageAntiCrit = ' + percentageAntiCrit);
        //是否暴击
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Chance);
        var result = (battleTemplate['att_1'] * percentageCrit * percentageCrit) / (percentageCrit + percentageAntiCrit)
                         - randomCrit + battleTemplate['att_2'];
        //      logger.fatal('*******************00000********************** result = ' + result);
        if (result > 0) {   //暴击伤害
            var att_CritDamage = npcAttTemplate['att_' + gameConst.eAttInfo.CRITDAMAGE];
            att_CritDamage = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRITDAMAGE, att_CritDamage);
            var paramA = Math.floor(att_CritDamage)
                - player.GetAttManager().GetAttValue(gameConst.eAttInfo.CRITDAMAGEREDUCE);
            paramA = paramA < -5000 ? -5000 : paramA;
            battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Damage);
            baseDamage = baseDamage * (battleTemplate['att_1'] + paramA) / battleTemplate['att_2'];
        }
        //       logger.fatal('********************00000********************* baseDamage = ' + baseDamage);
        //对方免伤率-防御
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDefense);
        var percentageDefance = player.GetAttManager().GetAttValue(gameConst.eAttInfo.DEFENCE)
            / (battleTemplate['att_1'] / 100
                   * player.GetAttManager().GetAttValue(gameConst.eAttInfo.DEFENCE) +
               battleTemplate['att_2'] * player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel)
                + battleTemplate['att_3']);
        percentageDefance = Math.floor(percentageDefance * 1000000) / 1000000;
        //      logger.fatal('*********************00000******************** percentageDefance = ' + percentageDefance);

        //己方总体伤害提升百分比
        var att_DamageUp = npcAttTemplate['att_' + gameConst.eAttInfo.DAMAGEUP];
        att_DamageUp = GetSkillAtt(player, skillID, gameConst.eAttInfo.DAMAGEUP, att_DamageUp);
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageUpgrade);
        var percentageDamageUp = att_DamageUp / battleTemplate['att_1'];
        percentageDamageUp = Math.floor(percentageDamageUp * 1000000) / 1000000;
        //      logger.fatal('*********************00000******************** percentageDamageUp = ' + percentageDamageUp);

        //对方总体伤害减免百分比
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageReduction);
        var percentageDamageReduce = player.GetAttManager().GetAttValue(gameConst.eAttInfo.DAMAGEREDUCE)
            / battleTemplate['att_1'];
        percentageDamageReduce = Math.floor(percentageDamageReduce * 1000000) / 1000000;
        //      logger.fatal('*********************00000******************** percentageDamageReduce = ' + percentageDamageReduce);

        //最终伤害
        baseDamage =
        baseDamage * (1 - percentageDefance) * (1 + (percentageDamageUp - percentageDamageReduce) /
                                                    (percentageDamageUp * 0.55 + percentageDamageReduce + 0.5)) * (1
            + randomDamage
                                                                                                                       / 100);
        //       logger.fatal('********************00000********************* baseDamage = ' + baseDamage);
        baseDamage = Math.floor(baseDamage);
        if (Math.abs(baseDamage) < 1) {
            baseDamage = 1;
        }
        return baseDamage;
    }
};

var GetSkillAtt = function (player, skillID, attInfo, attInfoNum) {  //计算skill加成
    var skillTemplate = templateManager.GetTemplateByID('SkillTemplate', skillID);
    if (null == skillTemplate) {
        return attInfoNum;
    }
    var att = attInfoNum;
    for (var i = 0; i <= 5; ++i) {
        if (skillTemplate['att_' + i] == attInfo) {
            att = att * (100 + skillTemplate['attReduce_' + i]) / 100;
            att += skillTemplate['attNum_' + i];
        }
    }
    //计算技能符文加成
    var skillSeries = skillTemplate['skillSeries']; //技能序列
    var runeTemp = player.GetRuneManager().GetUseRuneTemp(skillSeries);
    if (null != runeTemp) {
        var attNum = runeTemp['attNum'];
        for (var index = 0; index < attNum; ++index) {
            if (runeTemp['att_' + index] == attInfo) {
                att = att * (100 + runeTemp['attReduce_' + index]) / 100;
                att += runeTemp['attNum_' + index];
            }
        }
    }
    return att;
};

var CalPvpDamage = function (roleID, buffID, type, skillID, actorID, randomCrit, randomDamage) {
    var player = playerManager.GetPlayer(roleID);
    var pvpPlayerInfo = player.GetAsyncPvPManager().GetPlayersInfo();   //对手的全部信息
    var pvpPlayerAtt;
    var pvpPlayerLevel;
//    logger.fatal('****************************pvpPlayerInfo: %j, actorID: %j', pvpPlayerInfo, actorID);
    for (var x = 0; x < pvpPlayerInfo.length; ++x) {
        var pvptemp = pvpPlayerInfo[x];
        if (actorID == pvptemp.roleID) {
            pvpPlayerAtt = pvptemp.attList;
            pvpPlayerLevel = pvptemp.expLevel;
        }
    }
//    logger.fatal('****************************pvpPlayerAtt: %j, pvpPlayerAtt.length : %j', pvpPlayerAtt, pvpPlayerAtt.length);
    if (null == pvpPlayerAtt || pvpPlayerAtt.length < 28) {
        return -1;
    }
    if (0 == type) {    //主角对怪
        var att_Attack = 0;
        var att_Crit = 0;
        if (null != player) {
            att_Attack = player.GetAttManager().GetAttValue(gameConst.eAttInfo.ATTACK); //攻击
            att_Crit = player.GetAttManager().GetAttValue(gameConst.eAttInfo.CRIT); //暴击
        }

        att_Attack = GetSkillAtt(player, skillID, gameConst.eAttInfo.ATTACK, att_Attack);
        var buffTemplate = templateManager.GetTemplateByID('BuffTemplate', buffID);     //计算buff加成
        var damagePercent = 0;
        var damageAdd = 0;
        if (null != buffTemplate) {
            damagePercent = buffTemplate[templateConst.tBuff.damagePercent];    //伤害百分比
            damageAdd = buffTemplate[templateConst.tBuff.damageAdd];    //伤害加成
        }
        var baseDamage = Math.abs(Math.floor(damagePercent * att_Attack / 100 + damageAdd));
//        logger.fatal('******************PVP*********************** baseDamage = ' + baseDamage);

        att_Crit = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRIT, att_Crit);
//        logger.fatal('*******************PVP********************** att_Crit = ' + att_Crit);

        var battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit);
        var percentageCrit = 0; //攻方暴击率
        if (null != battleTemplate) {
            percentageCrit = att_Crit / (battleTemplate['att_1'] / 100 * att_Crit + battleTemplate['att_2']
                * player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel)
                + battleTemplate['att_3']);
            percentageCrit = Math.floor(percentageCrit * 1000000) / 1000000;
        }
//        logger.fatal('********************PVP********************* percentageCrit = ' + percentageCrit);

        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Resistance);
        var percentageAntiCrit = 0; //受方暴击抵抗率
        if (null != battleTemplate) {
            percentageAntiCrit =
            pvpPlayerAtt[gameConst.eAttInfo.ANTICRIT][gameConst.eAttInfo.ANTICRIT] / (battleTemplate['att_1'] / 100
                                                                                          *
                                                                                      pvpPlayerAtt[gameConst.eAttInfo.ANTICRIT][gameConst.eAttInfo.ANTICRIT]
                                                                                          + battleTemplate['att_2']
                                                                                          * pvpPlayerLevel
                + battleTemplate['att_3']);
            percentageAntiCrit = Math.floor(percentageAntiCrit * 1000000) / 1000000;
        }
//        logger.fatal('***********************PVP****************** percentageAntiCrit = ' + percentageAntiCrit);
        //是否暴击
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Chance);
        var result = (battleTemplate['att_1'] * percentageCrit * percentageCrit) / (percentageCrit + percentageAntiCrit)
                         - randomCrit + battleTemplate['att_2'];
//        logger.fatal('**********************PVP******************* result = ' + result);
        if (result > 0) {   //暴击伤害
            var att_CritDamage = player.GetAttManager().GetAttValue(gameConst.eAttInfo.CRITDAMAGE);
            att_CritDamage = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRITDAMAGE, att_CritDamage);
            var paramA = Math.floor(att_CritDamage)
                - pvpPlayerAtt[gameConst.eAttInfo.CRITDAMAGEREDUCE][gameConst.eAttInfo.CRITDAMAGEREDUCE];
            paramA = paramA < -5000 ? -5000 : paramA;
            battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Damage);
            baseDamage = baseDamage * (battleTemplate['att_1'] + paramA) / battleTemplate['att_2'];
        }
//        logger.fatal('**********************PVP******************* baseDamage = ' + baseDamage);
        //对方免伤率-防御
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDefense);
        var percentageDefance = pvpPlayerAtt[gameConst.eAttInfo.DEFENCE][gameConst.eAttInfo.DEFENCE]
            / (battleTemplate['att_1'] / 100
                   * pvpPlayerAtt[gameConst.eAttInfo.DEFENCE][gameConst.eAttInfo.DEFENCE]
                   + battleTemplate['att_2']
                   * pvpPlayerLevel + battleTemplate['att_3']);
        percentageDefance = Math.floor(percentageDefance * 1000000) / 1000000;
//        logger.fatal('********************PVP********************* percentageDefance = ' + percentageDefance);

        //己方总体伤害提升百分比
        var att_DamageUp = player.GetAttManager().GetAttValue(gameConst.eAttInfo.DAMAGEUP);
        att_DamageUp = GetSkillAtt(player, skillID, gameConst.eAttInfo.DAMAGEUP, att_DamageUp);
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageUpgrade);
        var percentageDamageUp = att_DamageUp / battleTemplate['att_1'];
        percentageDamageUp = Math.floor(percentageDamageUp * 1000000) / 1000000;
        //       logger.fatal('***********************PVP****************** percentageDamageUp = ' + percentageDamageUp);

        //对方总体伤害减免百分比
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageReduction);
        var percentageDamageReduce = pvpPlayerAtt[gameConst.eAttInfo.DAMAGEREDUCE][gameConst.eAttInfo.DAMAGEREDUCE]
            / battleTemplate['att_1'];
        percentageDamageReduce = Math.floor(percentageDamageReduce * 1000000) / 1000000;
//        logger.fatal('**********************PVP******************* percentageDamageReduce = ' + percentageDamageReduce);

        //最终伤害
        baseDamage =
        baseDamage * (1 - percentageDefance) * (1 + (percentageDamageUp - percentageDamageReduce) /
                                                    (percentageDamageUp * 0.55 + percentageDamageReduce + 0.5)) * (1
            + randomDamage
                                                                                                                       / 100);
        //      logger.fatal('*********************PVP******************** baseDamage = ' + baseDamage);
        baseDamage = Math.floor(baseDamage);
        return baseDamage;
    }

    if (1 == type) {    //怪对主角
        var att_Attack = pvpPlayerAtt[gameConst.eAttInfo.ATTACK][gameConst.eAttInfo.ATTACK];
        var att_Crit = pvpPlayerAtt[gameConst.eAttInfo.CRIT][gameConst.eAttInfo.CRIT];

        att_Attack = GetSkillAtt(player, skillID, gameConst.eAttInfo.ATTACK, att_Attack);
        var buffTemplate = templateManager.GetTemplateByID('BuffTemplate', buffID);     //计算buff加成
        var damagePercent = 0;
        var damageAdd = 0;
        if (null != buffTemplate) {
            damagePercent = buffTemplate[templateConst.tBuff.damagePercent];    //伤害百分比
            damageAdd = buffTemplate[templateConst.tBuff.damageAdd];    //伤害加成
        }
        var baseDamage = Math.abs(Math.floor(damagePercent * att_Attack / 100 + damageAdd));
        //       logger.fatal('*********************PVP 00000******************** baseDamage = ' + baseDamage);
        att_Crit = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRIT, att_Crit);
        //      logger.fatal('*********************PVP 00000******************** att_Crit = ' + att_Crit);

        var npcTemplate = templateManager.GetTemplateByID('NpcTemplate', actorID);

        var battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit);

        var percentageCrit = 0; //攻方暴击率
        if (null != battleTemplate) {
            percentageCrit =
            att_Crit / (battleTemplate['att_1'] / 100 * att_Crit + battleTemplate['att_2'] * pvpPlayerLevel
                + battleTemplate['att_3']);
            percentageCrit = Math.floor(percentageCrit * 1000000) / 1000000;
        }
        //      logger.fatal('*********************PVP 00000******************** percentageCrit = ' + percentageCrit);

        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Resistance);
        var percentageAntiCrit = 0; //受方暴击抵抗率
        if (null != battleTemplate) {
            percentageAntiCrit =
            player.GetAttManager().GetAttValue(gameConst.eAttInfo.ANTICRIT) / (battleTemplate['att_1'] / 100 *
                                                                               player.GetAttManager().GetAttValue(gameConst.eAttInfo.ANTICRIT)
                                                                                   + battleTemplate['att_2']
                                                                                   * player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel)
                + battleTemplate['att_3']);
            percentageAntiCrit = Math.floor(percentageAntiCrit * 1000000) / 1000000;
        }
        //      logger.fatal('*********************PVP 00000******************** percentageAntiCrit = ' + percentageAntiCrit);
        //是否暴击
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Chance);
        var result = (battleTemplate['att_1'] * percentageCrit * percentageCrit) / (percentageCrit + percentageAntiCrit)
                         - randomCrit + battleTemplate['att_2'];
        //      logger.fatal('*********************PVP 00000******************** result = ' + result);
        if (result > 0) {   //暴击伤害
            var att_CritDamage = pvpPlayerAtt[gameConst.eAttInfo.CRITDAMAGE][gameConst.eAttInfo.CRITDAMAGE];
            att_CritDamage = GetSkillAtt(player, skillID, gameConst.eAttInfo.CRITDAMAGE, att_CritDamage);
            var paramA = Math.floor(att_CritDamage)
                - player.GetAttManager().GetAttValue(gameConst.eAttInfo.CRITDAMAGEREDUCE);
            paramA = paramA < -5000 ? -5000 : paramA;
            battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eCrit_Damage);
            baseDamage = baseDamage * (battleTemplate['att_1'] + paramA) / battleTemplate['att_2'];
        }
        //       logger.fatal('*********************PVP 00000******************** baseDamage = ' + baseDamage);

        //对方免伤率-防御
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDefense);
        var percentageDefance = player.GetAttManager().GetAttValue(gameConst.eAttInfo.DEFENCE)
            / (battleTemplate['att_1'] / 100
                   * player.GetAttManager().GetAttValue(gameConst.eAttInfo.DEFENCE) +
               battleTemplate['att_2'] * player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel)
                + battleTemplate['att_3']);
        percentageDefance = Math.floor(percentageDefance * 1000000) / 1000000;
        //      logger.fatal('*********************PVP 00000******************** percentageDefance = ' + percentageDefance);

        //己方总体伤害提升百分比
        var att_DamageUp = pvpPlayerAtt[gameConst.eAttInfo.DAMAGEUP][gameConst.eAttInfo.DAMAGEUP];
        att_DamageUp = GetSkillAtt(player, skillID, gameConst.eAttInfo.DAMAGEUP, att_DamageUp);
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageUpgrade);
        var percentageDamageUp = att_DamageUp / battleTemplate['att_1'];
        percentageDamageUp = Math.floor(percentageDamageUp * 1000000) / 1000000;
        //      logger.fatal('*********************PVP 00000******************** percentageDamageUp = ' + percentageDamageUp);

        //对方总体伤害减免百分比
        battleTemplate = templateManager.GetTemplateByID('BattleTemplate', gameConst.eButtleType.eDamageReduction);
        var percentageDamageReduce = player.GetAttManager().GetAttValue(gameConst.eAttInfo.DAMAGEREDUCE)
            / battleTemplate['att_1'];
        percentageDamageReduce = Math.floor(percentageDamageReduce * 1000000) / 1000000;
        //       logger.fatal('*********************PVP 00000******************** percentageDamageReduce = ' + percentageDamageReduce);

        //最终伤害
        baseDamage =
        baseDamage * (1 - percentageDefance) * (1 + (percentageDamageUp - percentageDamageReduce) /
                                                    (percentageDamageUp * 0.55 + percentageDamageReduce + 0.5)) * (1
            + randomDamage
                                                                                                                       / 100);
        //       logger.fatal('*********************PVP 00000******************** baseDamage = ' + baseDamage);
        baseDamage = Math.floor(baseDamage);
        if (Math.abs(baseDamage) < 1) {
            baseDamage = 1;
        }
        return baseDamage;
    }
};

handler.SkillIDandCD = function (msg, session, next) {    //技能ID CD服务器复盘，主角血量变化及死亡信息服务器复盘
    var self = this;
    var roleID = session.get('roleID');
    var damageList = msg.damageList;    //伤害序列
    var clientSkillList = msg.skillList;      //技能ID和CD列表
    var customID = msg.customID;

    if (!damageList || !clientSkillList || !customID) {
        return next(null, {'result': 0});
    }
    if (customID == defaultValues.newRoleCustomID) {    //新手关不做处理
        return next(null, {'result': 0});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': 0});
    }
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == customTemplate) {
        return next(null, {'result': 0});
    }
    var smallType = customTemplate[templateConst.tCustom.smallType];
    if (smallType == gameConst.eCustomSmallType.Arena ||
        smallType == gameConst.eCustomSmallType.NewCus) {
        return next(null, {'result': 0});
    }
    var AddPercent_HP_Player = customTemplate['AddPercent_HP_Player']; //hp加成百分比 玩家
    var maxHp = Math.floor(player.GetAttManager().GetAttValue(gameConst.eAttInfo.MAXHP) * (1 + AddPercent_HP_Player
        / 100));   //最大血量
    var tempHp = maxHp;
    for (var i = 0; i < damageList.length; ++i) {
        tempHp += damageList[i];
        if (tempHp > maxHp) {
            tempHp = maxHp;
        }
        if (tempHp < 0) {
            tempHp = 0;
        }
        if (tempHp == 0 && damageList[i] != 0 && null != damageList[i + 1] && damageList[i + 1] != 0) {
            logger.warn('handler.SkillIDandCD  player hp recalculate error, roleID: %j, maxHp: %j, damageList: %j, i: %j, msg: %j',
                        roleID, maxHp, damageList, i, msg);
            if (!!defaultValues.OpenCheckRate) {
                self.playerCheat(roleID, 1);
            }
            return next(null, {'result': errorCodes.CheatHp});
        }
    }
    //技能CD和ID校验
    var exceptSkillID = [810101, 800201, 800301, 800401, 800601, 800701, 820601];       //不进行检测的技能

    var skillIDList = [];       //服务器获取的当前所有技能ID
    skillIDList = player.GetSkillManager().GetAllSkillID();
    var tempID = player.GetPlayerInfo(gameConst.ePlayerInfo.TEMPID);    //玩家模版ID
    var skillAllTemp = templateManager.GetAllTemplate('SkillTemplate');
    if (null != skillAllTemp) {
        for (var j in skillAllTemp) {
            var temp = skillAllTemp[j];
            var isSkill = temp[templateConst.tSkill.isSkill];   //技能类型
            if (1 != isSkill) { //不是普攻技能
                continue;
            }
            var attID = temp[templateConst.tSkill.attID];       //技能ID
            if (tempID != Math.floor(attID / defaultValues.skillBeginNum)) {  //判断职业是否相符
                continue;
            }
            skillIDList.push(parseInt(attID));
        }
    }
    var soulSkillList = player.GetSoulManager().GetAllSoulSkillID();    //变身必杀技ID
    var soulNormalSkillList = player.GetSoulManager().GetAllSoulNormalSkillID();    //变身普攻技能ID
    skillIDList = _.union(skillIDList, soulSkillList, soulNormalSkillList);

    //进行技能ID是否存在的校验
    for (var index in clientSkillList) {
        if (-1 != exceptSkillID.indexOf(parseInt(index))) { //技能不进行检测
            continue;
        }
        if (-1 == skillIDList.indexOf(parseInt(index))) {   //当前技能在服务器中不存在，即作弊了
            //*******************技能不存在，踢出关卡处理*******************
            logger.warn('handler.SkillIDandCD client skill is not exist, roleID: %j, skillIDList: %j, clientSkillList: %j, skillID: %j, msg: %j',
                        roleID, skillIDList, clientSkillList, index, msg);

            if (!!defaultValues.OpenCheckRate) {
                self.playerCheat(roleID, 1);
            }
            return next(null, {'result': errorCodes.CheatHp});
        }
        var timeList = clientSkillList[index];  //技能ID对应的释放时间戳
        if (timeList.length < 2) {      //如果技能只使用了一次不做技能CD校验
            continue;
        }
        var skillTemp = templateManager.GetTemplateByID('SkillTemplate', index);
        if (null != skillTemp) {
            var skillCD = skillTemp['skillCD'];     //技能CD
            if (skillCD <= 0) { //如果技能CD小于0，不做验证
                continue;
            }
            var skillSeries = skillTemp['skillSeries'];     //技能序列ID
            var runeTemp = player.GetRuneManager().GetUseRuneTemp(skillSeries); //获取当前技能对应的符文模版
            if (null != runeTemp) {
                var runeSkillCD = runeTemp['skillCD'];  //技能符文减少的CD时间
                skillCD -= runeSkillCD; //至此，技能CD时间已经计算完毕
            }
            var wakeSkillCD = player.GetSoulManager().GetWakeSkillCD(index); // 获得邪神觉醒减CD
            if (!!wakeSkillCD) {
                skillCD -= wakeSkillCD;
            }
            //至此，技能CD时间已经计算完毕，接下来校验客户端技能时间戳
            for (var bIndex = timeList.length - 1; bIndex > 0; --bIndex) {
                if (timeList[bIndex] == 0 || (null != timeList[bIndex - 1] && timeList[bIndex - 1] == 0) || (null
                                                                                                                 != timeList[bIndex
                        + 1]
                    && timeList[bIndex
                    + 1]
                                                                                                                 == 0)) {   //序列中出现0代表死亡，该值不做校验
                    continue;
                }
                var timeDiff = timeList[bIndex] - timeList[bIndex - 1]; //计算两次技能释放的时间差
                if (timeDiff < skillCD) {   //当时间差小于技能CD时属于作弊行为
                    //*******************技能CD错误，踢出关卡处理*******************
                    logger.warn('handler.SkillIDandCD client skill CD less than server skillCD, roleID: %j,' +
                                ' skillIDList: %j, timeList: %j, timeDiff: %j, skillCD: %j, msg: %j',
                                roleID, skillIDList, timeList, timeDiff, skillCD, msg);

                    if (!!defaultValues.OpenCheckRate) {
                        self.playerCheat(roleID, 1);
                    }
                    return next(null, {'result': errorCodes.CheatHp});
                }
            }
        }
    }
    return next(null, {'result': 0});
};

/**
 * 转职
 * */
handler.TransferCareer = function (msg, session, next) {
    var self = this;
    var roleID = session.get('roleID');
    var careerID = msg.careerID;
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var oldCareerID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    if (oldCareerID == careerID) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var allTemplate = templateManager.GetAllTemplate('AllTemplate');
    if (null == allTemplate) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });
    }
    if (expLevel < allTemplate['174']['attnum']) {
        return next(null, {
            'result': errorCodes.ExpLevel
        });
    }
    if (vipLevel < allTemplate['172']['attnum']) {
        return next(null, {
            'result': errorCodes.VipLevel
        });
    }
    var yuanbaoCost = allTemplate['173']['attnum'];
    if (yuanbaoCost <= 0) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });
    }
    if (player.GetAssetsManager().CanConsumeAssets(globalFunction.GetYuanBaoTemp(), yuanbaoCost) == false) {
        return next(null, {
            'result': errorCodes.NoYuanBao
        });
    }
    //结婚之后 转职判断
    if(1 == player.toMarryManager.playerMarryState){    //已婚
        /** 校验职业是否符合结婚  1战士 男 2刺客 女 3法师 女 4枪手 男 5召唤 女  */
        if((1 == oldCareerID && 4 != careerID) || (4 == oldCareerID && 1 != careerID)){
            return next(null, {
                'result': errorCodes.MARRY_CAREER_ITEM
            });
        }else if((2 == oldCareerID && 3 != careerID && 5 != careerID) || (3 == oldCareerID && 2 != careerID && 5 != careerID) || (5 == oldCareerID && 2 != careerID && 3 != careerID)){
            return next(null, {
                'result': errorCodes.MARRY_CAREER_ITEM
            });
        }
    }

    player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -yuanbaoCost,
                                               eAssetsReduce.TransferCareer);

    player.SetPlayerInfo(ePlayerInfo.TEMPID, careerID);
    player.GetItemManager().TransferEquip();
    player.GetRuneManager().ResetAllRune4Transfer();
    player.GetSkillManager().TransferSkill();


    var accountID = player.GetPlayerInfo(gameConst.ePlayerInfo.ACCOUNTID);

    pomelo.app.rpc.ps.psRemote.KickUserOut(null, accountID, utils.done);

    return next(null, {
        'result': errorCodes.OK
    });
};

/**
 * 封装杀死NPC 方法  以便于兼容老版本
 * @param player
 * @param customID
 * @param att
 * @param msgExpLevel
 * @param expLevel
 * @param serverAttKey
 * @param clientTimeKey
 * @param roleID
 * @param attList
 * @param clientPlayerAtt
 * @param npcID
 * @param nowTimeKey
 * @param next
 * @returns {*}
 * @param result
 */
var killNpcDrop = function (player, customID, att, msgExpLevel, expLevel, serverAttKey, clientTimeKey, roleID, attList,
                            clientPlayerAtt, npcID, result, nowTimeKey, next, self) {

    var teamID = player.GetWorldState(eWorldState.TeamID);
    var tempRoom = roomManager.GetRoom(customID, teamID);

    var expNum = 0;
    var baseExpNum = 0;
    var ID = 0;
    var value = 0;
    var baseValue = 0;
    if (!customID) {
        return next(null, {'result': errorCodes.NoRole});
    }

    if (att != result) { //属性验证
        if (customID == defaultValues.newRoleCustomID) {
            if (null == player) {
                return next(null, {'result': errorCodes.NoRole});
            }
        } else if (msgExpLevel - expLevel == 1 || msgExpLevel - expLevel == -1) {
            if (null == player) {
                return next(null, {'result': errorCodes.NoRole});
            }
        } else { //属性验证不一致
            if (serverAttKey == clientTimeKey) { //时间戳相等
                tempRoom.SetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.cheating, 1); // for tlog

                logger.warn('attribute validation error, timeKey equal, roleID: %j, customID: %j, npcID: %j, clientAtt: %j,'
                                + ' serverAtt: %j, clientLevel: %j, serverLevel: %j, attList: %j, clientPlayerAtt: %j,'
                                + ' serverAttKey: %j, clientTimeKey: %j, nowTimeKey: %j',
                            roleID, customID, npcID, att, result, msgExpLevel, expLevel, attList, clientPlayerAtt,
                            serverAttKey, clientTimeKey, nowTimeKey);

                //只有非新手关卡做处理
                if (customID != defaultValues.newRoleCustomID
                    && defaultValues.isOpenCheatEnv == 1) {
                    self.playerCheat(roleID, 0);
                }
            }

            if (serverAttKey < clientTimeKey) {
                serverAttKey += defaultValues.playerAttTimeKeyMax;
            }
            if (serverAttKey > nowTimeKey) {
                nowTimeKey += defaultValues.playerAttTimeKeyMax;
            }
            //客户端时间戳小于服务器且延迟大于规定时间
            if (serverAttKey > clientTimeKey && (nowTimeKey - serverAttKey) > defaultValues.timeKeyDiff) {
                tempRoom.SetPlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.cheating, 1); // for tlog

                logger.warn('attribute validation error, timeKey timeout, roleID: %j, customID: %j, npcID: %j, clientAtt: %j,'
                                + ' serverAtt: %j, clientLevel: %j, serverLevel: %j, attList: %j, clientPlayerAtt: %j,'
                                + ' serverAttKey: %j, clientTimeKey: %j, nowTimeKey: %j',
                            roleID, customID, npcID, att, result, msgExpLevel, expLevel, attList, clientPlayerAtt,
                            serverAttKey, clientTimeKey, nowTimeKey);

                //只有非新手关卡做处理
                if (customID != defaultValues.newRoleCustomID && defaultValues.isOpenCheatEnv == 1
                    && 1 == defaultValues.isCheatPlayer) {
                    self.playerCheat(roleID, 1);
                }
            }
        }
    }

    var npcInfo = player.GetItemManager().getNpcDropInfo(npcID);
    if (npcInfo && JSON.stringify(npcInfo.npcDropInfo).length > 2) {
        expNum = parseInt(npcInfo.npcDropInfo.dropExp);
        baseExpNum = parseInt(npcInfo.npcDropBaseInfo.dropExp);
        var dropIDlist = npcInfo.itemIDList.dropList;
        var dropItemList = npcInfo.npcDropInfo.dropList;
        var dropItemBaseList = npcInfo.npcDropBaseInfo.dropList;
        for (var i in dropIDlist) {
            var itemIds = dropIDlist[i].dropID;
            var dropItems = dropItemList[i].dropID;
            var baseDropItems = dropItemBaseList[i].dropID;
            for (var index in itemIds) {
                var itemId = itemIds[index];
                if (itemId == globalFunction.GetMoneyTemp()) {
                    ID = globalFunction.GetMoneyTemp(); //判断是否是金币
                    value = value + dropItems[index];
                    baseValue = baseValue + baseDropItems[index];
                }
            }
        }
    }
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (!CustomTemplate) {
        logger.error('CustomTemplate error, customID == %d', customID);
        if (expNum > 0) {
            player.AddExp(expNum);
        }
        if (ID > 0 && ID == globalFunction.GetMoneyTemp() && value > 0) {
            //player.GetAssetsManager().SetAssetsValue(ID, value, true);
            // for tlog
            var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
            var factor;
            if (customTemplate['smallType'] == eCustomSmallType.Single) {
                factor = eAssetsAdd.NormalCustom;
            } else if (customTemplate['smallType'] == eCustomSmallType.Activity) {
                factor = eAssetsAdd.ActivityCustom;
            } else if (customTemplate['smallType'] == eCustomSmallType.Climb) {
                factor = eAssetsAdd.ClimbCustom;
            }
            player.GetAssetsManager().AlterAssetsValue(ID, value, factor, true);
        }
    } else {
        //判断是否是炼狱模式
        var smallType = CustomTemplate[templateConst.tCustom.smallType];
        if (globalFunction.isNeedCheckMonster(smallType)) {
            if (!npcInfo || !npcInfo.npcDropInfo) {
                return next(null, {'result': errorCodes.Cs_NoCustomNpcTpl});
            }
            if (!roomManager.customMonsters[roleID]) {
                roomManager.customMonsters[roleID] = {};
            }
            if (!roomManager.customMonsters[roleID][customID]) {
                roomManager.customMonsters[roleID][customID] = {bossID: false, monsterNum: 0};
            }
            var customMonstersInfo = roomManager.customMonsters[roleID][customID];
            customMonstersInfo.monsterNum++;
            if (CustomTemplate.bossID && CustomTemplate.bossID == npcInfo.npcDropInfo.npcID) {
                customMonstersInfo.bossID = true;
            }
        } else if (smallType == eCustomSmallType.Coliseum) {
            // 斗兽场杀死NPC
            player.GetColiseumManager().killNpc(npcID);
            return next(null, {'result': errorCodes.OK});
        }
        /*var smallType = CustomTemplate[templateConst.tCustom.smallType];
         if (!_.contains([constValue.eCustomSmallType.Team, constValue.eCustomSmallType.Activity], smallType)) {
         if(player.GetPlayerInfo(ePlayerInfo.IsQQMember) > 0 && smallType == constValue.eCustomSmallType.Single) {
         var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
         value = value + Math.ceil(baseValue * AllTemplate['89']['attnum'] / 100);
         expNum = expNum + Math.ceil(baseExpNum * AllTemplate['88']['attnum'] / 100);
         }
         if (expNum > 0) {
         player.AddExp(expNum);
         }
         if (ID > 0 && ID == globalFunction.GetMoneyTemp() && value > 0) {
         //player.GetAssetsManager().SetAssetsValue(ID, value, true);
         // for tlog
         var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
         if(customTemplate['smallType'] == eCustomSmallType.Single) {
         var factor = eAssetsAdd.NormalCustom;
         } else if(customTemplate['smallType'] == eCustomSmallType.Activity) {
         var factor = eAssetsAdd.ActivityCustom;
         } else if(customTemplate['smallType'] == eCustomSmallType.Climb) {
         var factor = eAssetsAdd.ClimbCustom;
         }
         player.GetAssetsManager().AlterAssetsValue(ID, value, factor, true);
         }
         tempRoom.UpdatePlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.moneyGet, value);
         tempRoom.UpdatePlayerTlogInfoValue(roleID, eRoomMemberTlogInfo.expGet, expNum);
         }*/
    }

    //发送公告
    var playerCheat = function () {//玩家是否作弊
        return (defaultValues.isOpenCheatEnv == 1) && (att != result) &&
               (serverAttKey <= clientTimeKey || (serverAttKey > clientTimeKey && (nowTimeKey - serverAttKey)
                   >= defaultValues.timeKeyDiff) );
    };

    if (!playerCheat() && npcInfo && npcInfo.npcDropInfo) {
        //获得noticeManager
        var noticeManager = playerManager.GetPlayer(roleID).GetNoticeManager();
        //公告id
        var noticeID = "killNPC_" + npcInfo.npcDropInfo.npcID;
        //发送公告
        noticeManager.SendRepeatableGM(gameConst.eGmType.KillNPC, noticeID);
    }
    return next(null, {'result': errorCodes.OK});
};

// 打印客户端发送的log
handler.PrintLog = function (msg, session, next) {
    var log = '' + msg.log;
    var obj = msg.obj || {};
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var openID = player.GetOpenID();
    var name = player.GetPlayerInfo(ePlayerInfo.NAME);

    logger.warn('PrintLog roleID:%d, openID:%s, name:%s, log:%s, obj: %j', roleID, openID, name, log, obj);
    return next(null, {'result': errorCodes.OK});
};

// 玩家语音聊天,扣掉相应的财产
handler.OnVoice = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    if (player.assetsManager.CanConsumeAssets(globalFunction.GetVoiceID(), 1) == false) {
        return next(null,{'result': errorCodes.NoAssets});
    }

    player.GetAssetsManager().AlterAssetsValue(globalFunction.GetVoiceID(), -   1, 0);

    return next(null, {'result': errorCodes.OK});
};
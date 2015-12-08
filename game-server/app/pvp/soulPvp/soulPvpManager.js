/**
 * Created by Administrator on 2015/1/2.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var playerManager = require('../player/playerManager');
var errorCodes = require('../../tools/errorCodes');
var pvpRedisManager = require('../redis/pvpRedisManager');
var pvpSql = require('../../tools/mysql/pvpSql');
var config = require('../../tools/config');
var soulPvpFormula = require('./soulPvpFormula');
var soulPvpFactory = require('./soulPvpFactory');
var Round = require('./round');
var stringValue = require('../../tools/stringValue');
var sPvpString = stringValue.sPvpString;
var BATTLE_TYPE = soulPvpFormula.BATTLE_TYPE;

var _ = require('underscore');
var Q = require('q');

var eRedisClientType = gameConst.eRedisClientType;
var eSoulPvpInfo = gameConst.eSoulPvpInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eAttInfo = gameConst.eAttInfo;

var SOUL_PVP_TABLE = 'soulpvp';

/** 防守阵容 默认邪神 老一 id*/
var SOUL_PVP_DEFENCE_ONE_ID = 1000;
/** 玩家战报id 最大值 100 0000 0000*/
var SOUL_PVP_MAX_LOG_ID = 1000000000;
/**
 * 斩魂 pvp 管理器
 * */
var Handler = module.exports;

/**
 * 初始化
 * */
Handler.init = function () {
    var self = this;
    var deferred = Q.defer();

    /** 玩家 排行榜key 初始化 时 取数据库最大值*/
    self.rankID = 0;
    /** battle status map 玩家战斗状态 map <roleID, type>*/
    this.battleTypeMap = {};
    this.roundGid = 1;
    /** 回合map*/
    this.roundMap = {};

    /** persistence 持久化队列*/
    this.persistenceQueue = [];

    /** 玩家 日志 id 自增*/
    self.addLogID = 0;

    pvpSql.LoadSoulMaxRankKey(function (err, res) {
        if (err) {
            logger.error(utils.getErrorMessage(err));
            return deferred.reject(err);
        }
        self.rankID = !!res[0]['maxRankKey'] ? res[0]['maxRankKey'] : 0;
        /*    if (self.rankID < defaultValues.ARES_DEFAULT_RANK_NUM) {
         //self.rankID = defaultValues.ARES_DEFAULT_RANK_NUM;
         self.initBeforeRole(function () {
         return deferred.resolve();
         });
         } else {
         return deferred.resolve();
         }*/

        pvpSql.LoadSoulLogMaxKey(function (err, res) {
            if (err) {
                logger.error(utils.getErrorMessage(err));
                return deferred.reject(err);
            }
            self.addLogID = !!res[0]['maxKey'] ? res[0]['maxKey'] : 0;

            return deferred.resolve();
        });

    });
    return deferred.promise;
};

/**
 * @Deprecated
 *
 *
 * Brief 首次启动服务器时， 没有前一千名玩家时 初始化
 *------------------------------------------------
 * @public
 *
 * @param {Function} cb 回调控制
 * */
Handler.initBeforeRole = function (cb) {
    var self = this;

    /** 每次吧 对应玩家数据刷新到数据库*/
    return Q.until(function () {
        return self.buildBeforeRoleEnterToDB()
            .then(function () {
                      var flag = self.rankID > defaultValues.ARES_DEFAULT_RANK_NUM;
                      if (flag) {
                          cb();
                      }
                      return flag;
                  })
            .catch(function () {
                       var flag = self.rankID > defaultValues.ARES_DEFAULT_RANK_NUM;
                       if (flag) {
                           cb();
                       }
                       return flag;
                   });
    });
};


/**
 * @Deprecated
 *
 *
 * Brief: 新建一个机器人 进入 ares数据， 并入库
 * ------------------------------------------
 * @api public
 *
 * */
Handler.buildBeforeRoleEnterToDB = function () {
    var deferred = Q.defer();

    var rClient = pvpRedisManager.getClient(eRedisClientType.Chart);

    var aresRole = soulPvpFactory.createAres(null, soulPvpFactory.ARES_TYPE_ROBOT,  sPvpString.aresRobotName);
    var sqlStr = soulPvpFactory.buildSqlStr(aresRole);
    var roleID = aresRole[eSoulPvpInfo.ROLE_ID];

    var jobs = [
        rClient.zPAdd(pvpRedisManager.getSoulPvpSetName(), roleID, aresRole[eSoulPvpInfo.RANK_KEY]),
        rClient.hPSet(pvpRedisManager.getSoulPvpInfoSetName(), roleID,
                      JSON.stringify(soulPvpFactory.buildToRedis(aresRole))),
        Q.ninvoke(pvpSql, 'SaveInfo', SOUL_PVP_TABLE, roleID, sqlStr, 0)
    ];
    Q.all(jobs)
        .catch(function (err) {
                   logger.error("buildBeforeRoleEnterToDB init rank role error roleID: %d failed: %s", roleID,
                                utils.getErrorMessage(err));
               })
        .finally(function () {
                     return deferred.resolve();
                 });
    return deferred.promise;
};

/**
 *  玩家开启战斗 battling
 *
 * @param {Number} roleID 添加玩家战神榜状态
 * @param {Number} rivalID 被挑战者id
 * @param {Number} rank 挑战玩家排名 key
 * @param {Number} rRank 被挑战者排名 key
 * @param {Object} data 挑战者数据
 * @param {Object} rData 被挑战者数据
 * @param {Number} curRank 挑战玩家排名
 * @param {Number} rCurRank 被挑战者排名
 * @api public
 * */
Handler.battle = function (roleID, rivalID, rank, rRank, data, rData, curRank, rCurRank) {

    /**添加战斗状态*/
    this.addBattleType(roleID, BATTLE_TYPE.READY);
    this.addBattleType(rivalID, BATTLE_TYPE.READY);
    var red = {roleID: roleID, rank: rank, curRank: curRank, data: data};
    var blue = {roleID: rivalID, rank: rRank, curRank: rCurRank, data: rData};

    /** 创建回合挑战*/
    return this.createRound(red, blue);
};

/**
 * 玩家挑战成功结算
 *
 * @param {Number} roleID 添加玩家战神榜状态
 * @param {Number} type 玩家战斗状态
 * @api public
 * */
Handler.balanceWin = function (round) {
    var deferred = Q.defer();

    var red = round.getRed();
    var blue = round.getBlue();

    var jobs = [
        this.addSoulPvpLog(red, blue, true),
        this.calculateEarnings(red, red.rank, blue.rank, blue.curRank),
        this.calculateEarnings(blue, blue.rank, red.rank, red.curRank)
    ];

    /** 结算*/
    Q.all(jobs)
        .then(function (res) {
                  deferred.resolve();
              })
        .catch(function () {
                   deferred.reject();
               })
        .done();

    return deferred.promise;
};

/**
 * 玩家挑战失败结算
 *
 * @param {Number} roleID 添加玩家战神榜状态
 * @param {Number} type 玩家战斗状态
 * @api public
 * */
Handler.balanceFail = function (round) {
    /*    var deferred = Q.defer();

     return deferred.promise;*/
    /**　暂时不需要处理 策划要改呢！！！*/
    //return Q.resolve();  var red = round.getRed();

    var red = round.getRed();
    var blue = round.getBlue();

    return this.addSoulPvpLog(red, blue, false);
};


/**
 * @Deprecated
 *
 * 更新函数
 *
 * @param {Number} nowSec 玩家id
 * @api public
 * */
Handler.update = function (nowSec) {
    /** 对非在线玩家进行数据持久化 * */
    this.persistenceData();
};

/**
 * @Deprecated
 *
 * 持久化数据
 *
 * */
Handler.persistenceData = function () {

    var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var queue = this.persistenceQueue;
    //this.persistenceQueue = [];

    /** 每次吧 对应玩家数据刷新到数据库*/
    return Q.until(function () {
        var roleID = queue.shift();
        return self.buildAndEnterToDB(client, roleID)
            .then(function () {
                      return queue.length == 0;
                  })
            .catch(function () {
                       return queue.length == 0;
                   });

    });

};


/**
 * @Deprecated
 *
 *
 * @param {Object} client redis客户端连接
 * @param {Number} roleID 需要持久化玩家
 * @api public
 * */
Handler.buildAndEnterToDB = function (client, roleID) {
    var deferred = Q.defer();
    var hGet = Q.nbind(client.hget, client);

    hGet(pvpRedisManager.getSoulPvpInfoSetName(), roleID)
        .then(function (data) {
                  if (!data) {
                      return deferred.reject();
                  }
                  data = JSON.parse(data);
                  var player = playerManager.GetPlayer(roleID);

                  if (!!player) {
                      /** 玩家在线 处理*/
                      //player.GetRoleAresManager().setAllAresInfo(soulPvpFactory.buildToSql(data));

                      return deferred.resolve();
                  } else {
                      var sqlStr = soulPvpFactory.buildSqlStr(soulPvpFactory.buildToSql(data));

                      pvpSql.SaveInfo(SOUL_PVP_TABLE, roleID, sqlStr, 0, function (err) {
                          if (!!err) {
                              logger.error('buildAndEnterToDB ares player module save error： %j',
                                           utils.getErrorMessage(err));
                          }

                          return deferred.resolve();
                      });
                  }
              })
        .catch(function (err) {
                   logger.error("buildAndEnterToDB roleID: %d failed: %s", roleID,
                                utils.getErrorMessage(err));
                   return deferred.reject(err);
               });
    return deferred.promise;
};

/**
 * 添加战斗日志
 *
 * @param {object} win 获胜玩家
 * @param {object} fail 失败玩家
 * @param {Boolean} isWin 是否成功
 * @api public
 * */
Handler.addSoulPvpLog = function (red, blue, isWin) {


    var deferred = Q.defer();
    /** 玩家不在线*/

    var redInfo = red.data.soulPvpInfo;
    var blueInfo = blue.data.soulPvpInfo;
    //var redRole = red.data.roleInfo;
    //var blueRole = blue.data.roleInfo;
    var redSoulDetail = red.data.soulDetail;
    var blueSoulDetail = blue.data.soulDetail;

    /** 计算 防守战力*/
    var redZhanli = getDefenceZhanli(redSoulDetail, redInfo);
    var blueZhanli = getDefenceZhanli(blueSoulDetail, blueInfo);


    /**  新建日志 */
    var redLog = null;
    var blueLog = null;
    if (!!isWin) {

        redLog =
        soulPvpFactory.createSoulPvpLog(red.roleID, soulPvpFormula.getSoulPvpLogType(red.curRank, blue.curRank),
                                        blue.roleID, blueInfo.roleName, '', red.curRank - blue.curRank,
                                        blueZhanli || 0);

        blueLog =
        soulPvpFactory.createSoulPvpLog(blue.roleID, soulPvpFormula.getSoulPvpLogType(blue.curRank, red.curRank),
                                        red.roleID, redInfo.roleName, '', red.curRank - blue.curRank,
                                        redZhanli || 0);
    } else {
        redLog = soulPvpFactory.createSoulPvpLog(red.roleID, soulPvpFormula.ARES_LOG_TYPE.UN_CHANGED_FAIL,
                                                 blue.roleID, blueInfo.roleName, '', 0,
                                                 blueZhanli || 0);

        blueLog = soulPvpFactory.createSoulPvpLog(blue.roleID, soulPvpFormula.ARES_LOG_TYPE.UN_CHANGED_WIN,
                                                  red.roleID, redInfo.roleName, '', 0, redZhanli || 0);
    }

    /** 做日志添加操作 */
    var jobs2 = [
        addLogToRole(red.roleID, redLog),
        addLogToRole(blue.roleID, blueLog)
    ];

    Q.all(jobs2)
        .then(function (res) {
                  deferred.resolve(res);
              })
        .catch(function (err) {
                   logger.error('ares addWinAresLog bab error why !!! redID: %d, blueID: %d, err: %s',
                                red.roleID, blue.roleID, utils.getErrorMessage(err));
                   deferred.reject(err);
               })
        .done();
    return deferred.promise;

};

/**
 * @Brief:  获取 日志战力信息
 * ------------------------
 *
 * @param {Object} soulDetail 邪神详细信息
 *
 * @return {Number}
 * */
var getDefenceZhanli = function (soulDetail, soulPvpInfo) {

    var sumzhanLi = 0;
    if (!soulDetail || !soulPvpInfo || !soulDetail.zhanlis) {
        logger.error('soulDetail no data err');
        return sumzhanLi;
    }

    var zhanlis = soulDetail.zhanlis;

    if (!!soulPvpInfo.defense1 && !!zhanlis[soulPvpInfo.defense1]) {
        sumzhanLi += zhanlis[soulPvpInfo.defense1];
    }

    if (!!soulPvpInfo.defense2 && !!zhanlis[soulPvpInfo.defense2]) {
        sumzhanLi += zhanlis[soulPvpInfo.defense2];
    }

    if (!!soulPvpInfo.defense3 && !!zhanlis[soulPvpInfo.defense3]) {
        sumzhanLi += zhanlis[soulPvpInfo.defense3];
    }

    return sumzhanLi;
};

/**
 * add log to player online or not online
 *
 * @param {Number} roleID 玩家id
 * @param {Array} log
 * */
var addLogToRole = function (roleID, log) {

    /**  插入日志 */
    var player = playerManager.GetPlayer(roleID);

    if (!!player) {
        /** 玩家在线 处理*/
        player.GetRoleSoulPvpLogManager().addSoulPvpLogInfo(log, true);
        Q.resolve();
    } else {

        var deferred = Q.defer();

        /** 直接插入数据库方案*/
        pvpSql.SaveSoulPvpLog(roleID, log, function (err, res) {
            if (!!err) {
                return deferred.reject(err);
            }
            return deferred.resolve(res);
        });

        /** 使用redis 纪录 方案*/
        /*

         var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
         var hGet = Q.nbind(client.hget, client);
         */
        /** 不在线 比较复杂 啊*/
        /*
         hGet(pvpRedisManager.getAresLogInfoSetName(), roleID)
         .then(function (data) {
         if (!data) {
         return deferred.resolve();
         }
         data = JSON.parse(data);

         */
        /**　加入到 redis */
        /*
         data.push(log);
         if (data.length > 10) {
         data.pop();
         }

         var rClient = pvpRedisManager.getClient(eRedisClientType.Chart);

         return rClient.hPSet(pvpRedisManager.getAresLogInfoSetName(), roleID,
         JSON.stringify(data));

         //return deferred.resolve();
         })
         .catch(function (err) {
         logger.error("ares log build to sql error: %s", utils.getErrorMessage(err));
         return deferred.reject(err);
         })
         .done();
         */
        return deferred.promise;
    }
};

/**
 * 计算收益
 *
 * @param {Object} info red or blue
 * @param {Number} bRank 原来排名
 * @param {Number} cRank 改变排名
 * @param {Number} rCurRank 对手真实排名， 界面显示的
 * @api public
 * */
Handler.calculateEarnings = function (info, bRank, cRank, rCurRank) {

    var roleID = info.roleID;
    var player = playerManager.GetPlayer(roleID);

    if (!!player) {
        /** 玩家在线 处理*/
        return player.GetRoleSoulPvpManager().battleChange(bRank, cRank, info.curRank, rCurRank);
    } else {

        var deferred = Q.defer();

        if (bRank == cRank) {
            cRank += rCurRank < info.curRank ? 0 : 1;
        }

        var data = info.data.soulPvpInfo;

        /*** 计算收益*/
        var medal = soulPvpFormula.calculateEarnings(info.curRank, data.occupyTime) || 0;

        data.medal = data.medal + medal;
        data.totalMedal = data.totalMedal + medal;

        data.rankKey = cRank;
        data.occupyTime = utils.getCurMinute();
        var rClient = pvpRedisManager.getClient(eRedisClientType.Chart);

        var jobs = [
            rClient.zPAdd(pvpRedisManager.getSoulPvpSetName(), roleID, data.rankKey),
            rClient.hPSet(pvpRedisManager.getSoulPvpInfoSetName(), roleID,
                          JSON.stringify(data))
        ];

        var sqlStr = soulPvpFactory.buildSqlStr(soulPvpFactory.buildToSql(data));

        /** 存数据库的 不让等待*/
        pvpSql.SaveInfo(SOUL_PVP_TABLE, roleID, sqlStr, 0, function (err) {
            if (!!err) {
                logger.error('calculateEarnings soul pvp player module save error： %j',
                             utils.getErrorMessage(err));
            }
        });

        Q.all(jobs)
            .then(function (res) {
                      deferred.resolve(res);
                  })
            .catch(function (err) {
                       logger.error('soul pvp calculateEarnings bab error why !!! roleID: %d, bRank: %d, cRank: %d, err: %j',
                                    roleID, bRank, cRank, utils.getErrorMessage(err));
                       deferred.reject(err);
                   })
            .done();
        return deferred.promise;
    }
};

/**
 * 匹配成功进入房间
 * @param {Object} red 红方 挑战方
 * @param {Object} blue 蓝方
 * */
Handler.createRound = function (red, blue) {
    var gId = this.roundGid++;
    /** 创建回合*/
    this.roundMap[gId] = new Round({
                                       id: gId,
                                       type: 0,
                                       red: red,
                                       blue: blue,
                                       mgr: this
                                   });
    return gId;
};

/**
 * 删除回合，战斗结束时
 * @param {number} gId roundID
 * @api public
 * */
Handler.deleteRoundByID = function (gId) {
    delete this.roundMap[gId];
};

/**
 * 获取回合byID，战斗结束时
 * @param {number} gId roundID
 * @api public
 * */
Handler.getRoundByID = function (gId) {
    return this.roundMap[gId];
};

/**
 * add battle type
 *
 * @param {Number} roleID 添加玩家战神榜状态
 * @param {Number} type 玩家战斗状态
 * @api public
 * */
Handler.addBattleType = function (roleID, type) {
    this.battleTypeMap[roleID] = type;
};

/**
 * delete battle type
 *
 * @param {Number} roleID 添加玩家战神榜状态
 * @api public
 * */
Handler.deleteBattleType = function (roleID) {
    delete this.battleTypeMap[roleID];
};

/**
 * 检查 是否可以战斗
 *
 * @param {Number} roleID 挑战者id
 * @param {Number} rivalID 被挑战者id
 * @api public
 * */
Handler.checkBattleType = function (roleID, rivalID) {

    if (this.battleTypeMap[roleID] == BATTLE_TYPE.BATTLING ||
        this.battleTypeMap[roleID] == BATTLE_TYPE.READY ||
        this.battleTypeMap[roleID] == BATTLE_TYPE.BALANCE) {
        return errorCodes.ARES_TYPE_BATTLING;
    } else if (this.battleTypeMap[roleID] == BATTLE_TYPE.BATTLED) {
        return errorCodes.ARES_TYPE_BATTLED;
    }

    if (this.battleTypeMap[rivalID] == BATTLE_TYPE.BATTLING ||
        this.battleTypeMap[rivalID] == BATTLE_TYPE.READY ||
        this.battleTypeMap[rivalID] == BATTLE_TYPE.BALANCE) {
        return errorCodes.ARES_RIVAL_TYPE_BATTLING;
    } else if (this.battleTypeMap[rivalID] == BATTLE_TYPE.BATTLED) {
        return errorCodes.ARES_RIVAL_TYPE_BATTLED;
    }

    return errorCodes.OK;
};

/**
 * 获取areaID 自增长字段
 *
 * @return {Number}
 * @api public
 * */
Handler.getRankID = function () {
    return ++this.rankID;
};

/**
 * 获取日志 ID 自增长字段
 *
 * @return {Number}
 * @api public
 * */
Handler.getAddLogID = function () {

    /** 添加 最大值 判断 理论上 是不会出现的  20万 一天 1000天 2亿*/
    if (this.addLogID > SOUL_PVP_MAX_LOG_ID) {
        this.addLogID = 0;
    }
    return ++this.addLogID;
};

/**
 * 获取对手 列表9个
 *
 * @param {Number} rank
 * @param {Function} callback
 * */
Handler.getRivalList = function (rank, callback) {
    var self = this;


    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    /** 绑定相关方法 用于流程控制*/
    var zRange = Q.nbind(client.zrange, client);
    var hmGet = Q.nbind(client.hmget, client);

    var ranks = soulPvpFormula.findRival(rank);

    /** 当第一名时， 没有数据*/
    if (ranks.length == 0) {
        return callback(null, []);
    }

    var roleIDKeys = null;
    var jobs = [];
    for (var i in ranks) {
        var index = ranks[i] - 1;
        jobs.push(
            zRange(pvpRedisManager.getSoulPvpSetName(), index, index, 'WITHSCORES')
        );
    }

    Q.all(jobs)
        .then(function (roleIDs) {
                  var length = roleIDs.length;
                  /** 获取每个玩家的数据*/
                  var keys = [];
                  for (var i = 0; i < length; i++) {
                      var roleID = +roleIDs[i][0];
                      keys.push((roleID));
                  }

                  roleIDKeys = keys;

                  var jobs = [
                      hmGet(pvpRedisManager.getRoleInfoSetName(), keys),
                      hmGet(pvpRedisManager.getSoulPvpInfoSetName(), keys),
                      hmGet(pvpRedisManager.getSoulDetailSetName(), keys)
                  ];
                  return Q.all(jobs);
              })
        .then(function (datas) {
                  if (!datas || !datas[0] || !datas[1] || !datas[2]) {
                      return Q.reject(errorCodes.SOUL_PVP_NO_SOUL_DETAIL);
                  }
                  var roles = datas[0];
                  var soulPvps = datas[1];
                  var soulDetails = datas[2];
                  var lists = [];
                  var length = roles.length;

                  for (var i = 0; i < length; i++) {

                      /** 数据回复机制*/
                      if (!soulDetails[i]) {
                          self.rebuildSoulDetailToRedis(roleIDKeys[i]);
                      }

                      if (!!roles[i] && !!soulPvps[i] && !!soulDetails[i]) {
                          var roleInfo = JSON.parse(roles[i]);
                          var soulDetail = JSON.parse(soulDetails[i]);
                          var soulPvp = JSON.parse(soulPvps[i]);
                          var name = roleInfo.name;
                          var roleID = +roleInfo.roleID;

                          var info = {
                              roleID: roleID,
                              profession: roleInfo.tempID || 0,
                              roleName: name || '',
                              rank: ranks[i],
                              expLevel: roleInfo.expLevel,
                              unionName: roleInfo.unionName || "",
                              soulList: getSoulInfoList(soulDetail, soulPvp)
                          };
                          lists.push(info);
                      }
                  }
                  return callback(null, lists);
              })
        .catch(function (err) {
                   logger.error('soul pvp getRivalList: %s', utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};


/**
 * Brief: 获取自己 防守邪神信息
 * ------------------
 *
 * @param {Object} souls 邪神信息
 * @param {Object} soulPvp 邪神排行榜信息
 * */
var getSoulInfoList = function (soulDetail, soulPvp) {

    var soulList = [];

    var souls = soulDetail.souls;

    if (!souls) {
        return soulList;
    }

    var zhanlis = soulDetail.zhanlis;

    /*防守1 邪神, 有 取现有， 无 默认显示*/
    var soulID1 = soulPvp.defense1;
    if (!!soulID1 && !!souls[soulID1]) {
        var soul1 = souls[soulID1];
        var info1 = {
            attID: soul1[eSoulInfo.TEMPID],
            star: soul1[eSoulInfo.LEVEL],
            zhanLi: zhanlis[soul1[eSoulInfo.TEMPID]],
            wake: soul1[eSoulInfo.WakeLevel]
        };
        soulList.push(info1);
    } else {
        /***默认没有邪神的情况， 显示老一*/
        var soul1 = souls[SOUL_PVP_DEFENCE_ONE_ID];
        var info1 = {
            attID: soul1[eSoulInfo.TEMPID],
            star: soul1[eSoulInfo.LEVEL],
            zhanLi: zhanlis[soul1[eSoulInfo.TEMPID]],
            wake: soul1[eSoulInfo.WakeLevel]
        };
        soulList.push(info1);
    }

    /*防守2 邪神, 有 取现有， 无 不处理*/
    var soulID2 = soulPvp.defense2;
    if (!!soulID2 && !!souls[soulID2]) {
        var soul2 = souls[soulID2];
        var info2 = {
            attID: soul2[eSoulInfo.TEMPID],
            star: soul2[eSoulInfo.LEVEL],
            zhanLi: zhanlis[soul2[eSoulInfo.TEMPID]],
            wake: soul2[eSoulInfo.WakeLevel]
        };
        soulList.push(info2);
    }

    /*防守3 邪神, 有 取现有， 无 不处理*/
    var soulID3 = soulPvp.defense3;
    if (!!soulID3 && !!souls[soulID3]) {
        var soul3 = souls[soulID3];
        var info3 = {
            attID: soul3[eSoulInfo.TEMPID],
            star: soul3[eSoulInfo.LEVEL],
            zhanLi: zhanlis[soul3[eSoulInfo.TEMPID]],
            wake: soul3[eSoulInfo.WakeLevel]
        };
        soulList.push(info3);
    }

    return soulList;


};

/**
 * @Brief:　获取玩家展示信息， 排行榜有查看信息
 *－－－－－－－－－－－－－－－－－－－－－－－
 *
 * @param {Number} otherID 玩家id
 * @param {Number} curRank 玩家当前排名
 * @api public
 * */
Handler.getSoulPvpInfo = function (otherID, curRank) {

    var self = this;

    var deferred = Q.defer();

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var hGet = Q.nbind(client.hget, client);

    /** 数据存在 */
    var jobs = [
        hGet(pvpRedisManager.getRoleInfoSetName(), otherID),
        hGet(pvpRedisManager.getSoulPvpInfoSetName(), otherID),
        hGet(pvpRedisManager.getSoulDetailSetName(), otherID)
    ];
    Q.all(jobs)
        .then(function (datas) {
                  if (!datas || !datas[1] || !datas[0] || !datas[2]) {
                      logger.error('getSoulPvpDetails role in rank but not in roleInfo error：%j',
                                   otherID);

                      /** 数据回复机制*/
                      if (!!datas && !datas[2]) {
                          self.rebuildSoulDetailToRedis(otherID);
                      }
                      return deferred.reject(errorCodes.SOUL_PVP_NO_SOUL_DETAIL);
                  }

                  var roleInfo = JSON.parse(datas[0]);
                  var soulDetail = JSON.parse(datas[2]);
                  var soulPvp = JSON.parse(datas[1]);

                  var name = roleInfo.name;
                  var roleID = roleInfo.roleID;

                  var info = {
                      roleID: roleID,
                      profession: roleInfo.tempID || 0,
                      roleName: name || '',
                      rank: curRank,
                      expLevel: roleInfo.expLevel,
                      unionName: roleInfo.unionName || "",
                      soulList: getSoulInfoList(soulDetail, soulPvp)
                  };
                  return deferred.resolve(info);
              })
        .catch(function (err) {
                   return deferred.reject(err);
               })
        .done();
    return deferred.promise;
};

/**
 * Brief: 从 redis 获取玩家 roleInfo 和 soulInfo、soulDetail 展示信息
 * -----------------------------------------------------
 * @api public
 *
 * @param {Number} roleID 玩家id
 * */
Handler.getDetails = function (otherID) {
    var self = this;

    var deferred = Q.defer();

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var hGet = Q.nbind(client.hget, client);

    /** 数据存在 */
    var jobs = [
        hGet(pvpRedisManager.getRoleInfoSetName(), otherID),
        hGet(pvpRedisManager.getSoulPvpInfoSetName(), otherID),
        hGet(pvpRedisManager.getSoulDetailSetName(), otherID)
    ];
    Q.all(jobs)
        .then(function (datas) {
                  if (!datas || !datas[1] || !datas[0] || !datas[2]) {
                      logger.error('getSoulPvpDetails role in rank but not in roleInfo error：%j',
                                   otherID);

                      /** 数据回复机制*/
                      if (!!datas && !datas[2]) {
                          self.rebuildSoulDetailToRedis(otherID);
                      }
                      return deferred.reject(errorCodes.SOUL_PVP_NO_SOUL_DETAIL);
                  }

                  var roleInfo = JSON.parse(datas[0]);
                  var soulDetail = JSON.parse(datas[2]);
                  var soulPvpInfo = JSON.parse(datas[1]);

                  var info = {
                      roleInfo: roleInfo,
                      soulDetail: soulDetail,
                      soulPvpInfo: soulPvpInfo
                  };
                  return deferred.resolve(info);
              })
        .catch(function (err) {
                   return deferred.reject(err);
               })
        .done();
    return deferred.promise;
};

/**
 * 当redis 没有数据时 重mysql 重建
 * -----------------------------------------------------
 * @api public
 *
 * @param {Number} roleID 玩家id
 * */
Handler.rebuildSoulDetailToRedis = function (roleID) {

    if (!roleID) {
        return;
    }

    logger.warn('rebuildSoulDetailToRedis why will do this function, roleID: %s', roleID);

    pvpSql.LoadSoulDetail(roleID, function (err, res) {
        if (!!err || !res) {
            logger.error('soul pvp rebuildSoulDetailToRedis err: %s', uitls.getErrorMessage(err));
            return;
        }

        if (!res[0]) {
            return;
        }

        var soulList = res[0];

        var souls = {};
        var zhanlis = {};
        var atts = {};

        for (var id in soulList) {
            var sumZhanli = 0;

            var soul = soulList[id];
            sumZhanli += soul[eSoulInfo.Zhanli];

            souls[soul[eSoulInfo.TEMPID]] = soul;
            var attList = new Array(eAttInfo.MAX);

            for (var i = 0; i < eAttInfo.MAX; ++i) {
                attList[i] = 0;
            }

            /** 添加 邪神 洗练属性*/


            /** 添加邪神属性*/
            for (var i = 0; i <= 2; i++) {
                attList[soul[eSoulInfo['ATTID_' + i]]] += soul[eSoulInfo['ATTNUM_' + i]];
            }

            /**策划数据 属性*/
            var tempID = soul[eSoulInfo.TEMPID] * 100 + soul[eSoulInfo.LEVEL];
            var temp = templateManager.GetTemplateByID('XieShenAttTemplate', tempID);
            if (!!temp) {
                for (var i = 0; i <= 9; i++) {
                    attList[temp['att_' + i]] += temp['att_Num' + i];
                }
                sumZhanli += temp['att_10'];
            }

            atts[soul[eSoulInfo.TEMPID]] = {
                soulID: soul[eSoulInfo.TEMPID],
                skillNum: soul[eSoulInfo.SkillNum],
                atts: attList
            };

            zhanlis[soul[eSoulInfo.TEMPID]] = sumZhanli;
        }

        var info = {
            souls: souls,
            atts: atts,
            zhanlis: zhanlis
        };

        var client = pvpRedisManager.getClient(eRedisClientType.Chart);
        client.hSet(pvpRedisManager.getSoulDetailSetName(), roleID, JSON.stringify(info), function (err, data) {
            if (!!err) {
                logger.error('add soul detail message to redis: %s', utils.getErrorMessage(err));
            }
        });
    });
};



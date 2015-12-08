/**
 * The file aresManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/5 16:20:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var playerManager = require('../player/playerManager');
var errorCodes = require('../../tools/errorCodes');
var pvpRedisManager = require('../redis/pvpRedisManager');
var pvpSql = require('../../tools/mysql/pvpSql');
var config = require('../../tools/config');
var aresFormula = require('./aresFormula');
var aresFactory = require('./aresFactory');
var Round = require('./round');
var BATTLE_TYPE = aresFormula.BATTLE_TYPE;

var _ = require('underscore');
var Q = require('q');

var eRedisClientType = gameConst.eRedisClientType;
var eAresInfo = gameConst.eAresInfo;
var stringValue = require('../../tools/stringValue');
var sPvpString = stringValue.sPvpString;

var ARES_TABLE = 'ares';

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

    pvpSql.LoadMaxRankKey(function (err, res) {
        if (err) {
            logger.error(utils.getErrorMessage(err));
            return deferred.reject(err);
        }
        self.rankID = res[0]['maxRankKey'];
        if (self.rankID < defaultValues.ARES_DEFAULT_RANK_NUM) {
            //self.rankID = defaultValues.ARES_DEFAULT_RANK_NUM;
            self.initBeforeRole(function () {
                return deferred.resolve();
            });
        } else {
            return deferred.resolve();
        }
    });
    return deferred.promise;
};

/**
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
 * Brief: 新建一个机器人 进入 ares数据， 并入库
 * ------------------------------------------
 * @api public
 *
 * */
Handler.buildBeforeRoleEnterToDB = function () {
    var deferred = Q.defer();

    var rClient = pvpRedisManager.getClient(eRedisClientType.Chart);

    var aresRole = aresFactory.createAres(null, aresFactory.ARES_TYPE_ROBOT, sPvpString.aresRobotName);
    var sqlStr = aresFactory.buildSqlStr(aresRole);
    var roleID = aresRole[eAresInfo.ROLE_ID];

    var jobs = [
        rClient.zPAdd(pvpRedisManager.getAresSetName(), roleID, aresRole[eAresInfo.RANK_KEY]),
        rClient.hPSet(pvpRedisManager.getAresInfoSetName(), roleID,
                      JSON.stringify(aresFactory.buildToRedis(aresRole))),
        Q.ninvoke(pvpSql, 'SaveInfo', ARES_TABLE, roleID, sqlStr, 0)
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
        this.addAresLog(red, blue, true),
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

    return this.addAresLog(red, blue, false);
};


/**
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
 *
 *
 * @param {Object} client redis客户端连接
 * @param {Number} roleID 需要持久化玩家
 * @api public
 * */
Handler.buildAndEnterToDB = function (client, roleID) {
    var deferred = Q.defer();
    var hGet = Q.nbind(client.hget, client);

    hGet(pvpRedisManager.getAresInfoSetName(), roleID)
        .then(function (data) {
                  if (!data) {
                      return deferred.reject();
                  }
                  data = JSON.parse(data);
                  var player = playerManager.GetPlayer(roleID);

                  if (!!player) {
                      /** 玩家在线 处理*/
                      player.GetRoleAresManager().setAllAresInfo(aresFactory.buildToSql(data));

                      return deferred.resolve();
                  } else {
                      var sqlStr = aresFactory.buildSqlStr(aresFactory.buildToSql(data));

                      pvpSql.SaveInfo(ARES_TABLE, roleID, sqlStr, 0, function (err) {
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
Handler.addAresLog = function (red, blue, isWin) {


    var deferred = Q.defer();
    /** 玩家不在线*/

    var redInfo = red.data.aresInfo;
    var blueInfo = blue.data.aresInfo;
    var redRole = red.data.roleInfo;
    var blueRole = blue.data.roleInfo;

    /**  新建日志 */
    var redLog = null;
    var blueLog = null;
    if (!!isWin) {
        redLog = aresFactory.createAresLog(red.roleID, aresFormula.getAresLogType(red.curRank, blue.curRank),
                                           blue.roleID, blueInfo.roleName, '', red.curRank - blue.curRank,
                                           blueRole.zhanli || 0);

        blueLog = aresFactory.createAresLog(blue.roleID, aresFormula.getAresLogType(blue.curRank, red.curRank),
                                            red.roleID, redInfo.roleName, '', red.curRank - blue.curRank,
                                            redRole.zhanli || 0);
    } else {
        redLog = aresFactory.createAresLog(red.roleID, aresFormula.ARES_LOG_TYPE.UN_CHANGED_FAIL,
                                           blue.roleID, blueInfo.roleName, '', 0,
                                           blueRole.zhanli || 0);

        blueLog = aresFactory.createAresLog(blue.roleID, aresFormula.ARES_LOG_TYPE.UN_CHANGED_WIN,
                                            red.roleID, redInfo.roleName, '', 0, redRole.zhanli || 0);
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
                   logger.error('ares addWinAresLog bab error why !!! redID: %d, blueID: %d, err: %j',
                                red.roleID, blue.roleID, utils.getErrorMessage(err));
                   deferred.reject(err);
               })
        .done();
    return deferred.promise;

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
        player.GetRoleAresLogManager().addAresLogInfo(log, true);
        Q.resolve();
    } else {

        var deferred = Q.defer();

        /** 直接插入数据库方案*/
        pvpSql.SaveAresLog(roleID, log, function (err, res) {
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
         logger.error("ares log build to sql error: %j", utils.getErrorMessage(err));
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
        return player.GetRoleAresManager().battleChange(bRank, cRank, info.curRank, rCurRank);
    } else {

        var deferred = Q.defer();

        if (bRank == cRank) {
            cRank += rCurRank < info.curRank ? 0 : 1;
        }

        var data = info.data.aresInfo;

        /*** 计算收益*/
        var medal = aresFormula.calculateEarnings(info.curRank, data.occupyTime) || 0;

        /** 服务器调时间 引起赋值 添加判断*/
        if (medal < 0) {
            logger.warn('openCalculateMedal medal < %d curTime: %s,  OCCUPY_TIME: %s',
                        medal, utils.dateString(utils.getCurTime()),
                        utils.dateString(utils.minuteToSec(data.occupyTime)));
            medal = 0;
        }

        /** 因为有玩家报 勋章个数不对 添加log*/

        var curTime = utils.dateString(utils.getCurTime());
        var occupyTime = utils.dateString(utils.minuteToSec(data.occupyTime));
        var rankKey = data.rankKey;
        var beforeRank = bRank;
        var afterRank = cRank;
        var changeReason = 3; // 改变类型 1 主动 内置cd 2 挑战 在线 3 挑战 不在线

        logger.warn('AresMedalChange: %j',
            [roleID, curTime, occupyTime, rankKey, beforeRank, afterRank, changeReason, medal]);


        data.medal = data.medal + medal;
        data.totalMedal = data.totalMedal + medal;

        data.rankKey = cRank;
        data.occupyTime = utils.getCurMinute();
        var rClient = pvpRedisManager.getClient(eRedisClientType.Chart);

        var jobs = [
            rClient.zPAdd(pvpRedisManager.getAresSetName(), roleID, data.rankKey),
            rClient.hPSet(pvpRedisManager.getAresInfoSetName(), roleID,
                          JSON.stringify(data))
        ];

        var sqlStr = aresFactory.buildSqlStr(aresFactory.buildToSql(data));

        /** 存数据库的 不让等待*/
        pvpSql.SaveInfo(ARES_TABLE, roleID, sqlStr, 0, function (err) {
            if (!!err) {
                logger.error('calculateEarnings ares player module save error： %s',
                             utils.getErrorMessage(err));
            }
        });

        Q.all(jobs)
            .then(function (res) {
                      deferred.resolve(res);
                  })
            .catch(function (err) {
                       logger.error('ares calculateEarnings bab error why !!! roleID: %d, bRank: %d, cRank: %d, err: %j',
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
 * 获取对手 列表9个
 *
 * @param {Number} rank
 * @param {Function} callback
 * */
Handler.getRivalList = function (rank, callback) {

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    /** 绑定相关方法 用于流程控制*/
    var zRange = Q.nbind(client.zrange, client);
    var hmGet = Q.nbind(client.hmget, client);
    var zCard = Q.nbind(client.zcard, client);
    var zRevRange = Q.nbind(client.zrevrange, client);

    var ranks = aresFormula.findRival(rank);

    var jobs = [];
    for (var i in ranks) {
        var index = ranks[i] - 1;
        jobs.push(
            zRange(pvpRedisManager.getAresSetName(), index, index, 'WITHSCORES')
        );
    }

    var roleIDList = null;
    var rKeys = [];

    jobs.push(zCard(pvpRedisManager.getZhanliSetName()));

    Q.all(jobs)
        .then(function (roleIDs) {
                  var length = roleIDs.length;
                  var total = roleIDs[length - 1];

                  /** 获取每个玩家的数据*/
                  var keys = [];
                  for (var i = 0; i < length - 1; i++) {
                      var roleID = +roleIDs[i][0];
                      if (!roleID) {
                          continue;
                      }
                      rKeys.push(roleID);
                      if (roleID < aresFactory.BASE_ROLE_INDEX) {
                          keys.push((roleID));
                      } else {
                          var rank = ((+roleIDs[i][1]) % total) - 1;
                          rank = rank < 0 ? 0 : rank || 0;
                          keys.push(zRevRange(pvpRedisManager.getZhanliSetName(), rank, rank, 'WITHSCORES'));
                      }
                  }
                  /* var jobs = [hmGet(self.redisAresInfo, keys), hmGet(self.redisRoleInfo, keys)];
                   return Q.all(jobs);*/
//                  return hmGet(self.redisRoleInfo, keys);
                  roleIDList = roleIDs;
                  return Q.all(keys);
              })
        .then(function (roles) {
                  var keys = [];
                  for (var id in roles) {
                      if (roles[id] instanceof  Array) {
                          keys.push(+roles[id][0]);
                      } else {
                          keys.push(roles[id]);
                      }
                  }
                  var jobs = [
                      hmGet(pvpRedisManager.getRoleInfoSetName(), keys),
                      hmGet(pvpRedisManager.getAresInfoSetName(), rKeys)
                  ];
                  return Q.all(jobs);
                  //return hmGet(pvpRedisManager.getRoleInfoSetName(), keys);
              })
        .then(function (datas) {
                  var roles = datas[0];
                  var ares = datas[1];
                  var lists = [];
                  var length = roles.length;

                  /*     _.map(datas, function (role) {
                   if (!!role) {
                   var roleInfo = JSON.parse(role);
                   var info = {
                   roleID: roleInfo.roleID,
                   name: roleInfo.name || '',
                   rank: ranks[i],
                   zhanli: roleInfo.zhanli || 0
                   };
                   lists.push(info);
                   }
                   });*/

                  for (var i = 0; i < length; i++) {
                      if (!!roles[i]) {
                          var roleInfo = JSON.parse(roles[i]);
                          var name = '';
                          var roleID = +roleIDList[i][0];

                          if (roleID < aresFactory.BASE_ROLE_INDEX) {
                              roleID = roleInfo.roleID;
                              name = roleInfo.name;
                          } else {
                              roleID = +roleIDList[i][0];
                              var are = JSON.parse(ares[i]);
                              name = !!are ? are.roleName : '';
                          }

                          var info = {
                              roleID: roleID,
                              name: name || '',
                              rank: ranks[i],
                              zhanli: roleInfo.zhanli || 0
                          };
                          lists.push(info);
                      }
                  }
                  return callback(null, lists);
              })
        .catch(function (err) {
                   logger.error('getRivalList: %s', utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

/**
 * 获取对手展示信息
 *
 * @param {Array} rivalRank 玩家排名信息 [roleID, rank]
 * @param {Number} curRank 玩家当前排名
 * @api public
 * */
Handler.getRivalDetails = function (rivalRank, curRank) {
    var deferred = Q.defer();
    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var hGet = Q.nbind(client.hget, client);
    var zCard = Q.nbind(client.zcard, client);
    var zRange = Q.nbind(client.zrange, client);

    if (!!rivalRank && rivalRank.length !== 0 && rivalRank[0] < aresFactory.BASE_ROLE_INDEX) {
        /** 数据存在 */
        var jobs = [
            hGet(pvpRedisManager.getAresInfoSetName(), rivalRank[0]),
            hGet(pvpRedisManager.getRoleInfoSetName(), rivalRank[0])
        ];
        Q.all(jobs)
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in rank but not in roleInfo error：%j',
                                       rivalRank[0]);
                          return deferred.resolve({});
                      }
                      var roleInfo = JSON.parse(datas[1]);
                      //var aresInfo = JSON.parse(datas[0]);
                      var info = {
                          roleID: roleInfo.roleID,
                          name: roleInfo.name || '',
                          rank: curRank,
                          zhanli: roleInfo.zhanli || 0
                      };
                      deferred.resolve(info);
                  })
            .catch(function (err) {
                       deferred.reject(err);
                   })
            .done();
    } else {
        /**　玩家不存在时 取 战力排行榜的玩家*/
        zCard(pvpRedisManager.getZhanliSetName())
            .then(function (total) {
                      var rank = (rivalRank[0] - aresFactory.BASE_ROLE_INDEX) % total;
                      return zRange(pvpRedisManager.getZhanliSetName(), rank, rank, 'WITHSCORES');
                  })
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in zhanli rank but not in roleInfo error：%j',
                                       rivalRank[0]);
                          return deferred.reject();
                      }
                      var roleID = datas[0];
                      var jobs = [
                          hGet(pvpRedisManager.getAresInfoSetName(), rivalRank[0]),
                          hGet(pvpRedisManager.getRoleInfoSetName(), roleID)
                      ];
                      return Q.all(jobs);
                  })
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in zhanli rank but not in roleInfo error：%j',
                                       rivalRank[0]);
                          return deferred.reject();
                      }
                      var roleInfo = JSON.parse(datas[1]);
                      var aresInfo = JSON.parse(datas[0]);
                      var info = {
                          roleID: +rivalRank[0],
                          name: aresInfo.roleName || '',
                          rank: curRank,
                          zhanli: roleInfo.zhanli || 0
                      };
                      return deferred.resolve(info);
                  })
            .catch(function (err) {
                       return deferred.reject(err);
                   })
            .done();
    }
    return deferred.promise;
};

/**
 * Brief: 从 redis 获取玩家 roleInfo 和 aresInfo 展示信息
 * -----------------------------------------------------
 * @api public
 *
 * @param {Number} roleID 玩家id
 * @param {Number} rank 玩家排名
 * */
Handler.getDetails = function (roleID, rankKey) {
    var deferred = Q.defer();
    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var hGet = Q.nbind(client.hget, client);
    var zCard = Q.nbind(client.zcard, client);
    //var zRange = Q.nbind(client.zrange, client);
    var zRevRange = Q.nbind(client.zrevrange, client);

    if (roleID < aresFactory.BASE_ROLE_INDEX) {
        /** 数据存在 */
        var jobs = [
            hGet(pvpRedisManager.getAresInfoSetName(), roleID),
            hGet(pvpRedisManager.getRoleInfoSetName(), roleID)
        ];
        Q.all(jobs)
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in rank but not in roleInfo error：%j',
                                       roleID);
                          return deferred.reject(errorCodes.ARES_DELETE_ROLE);
                      }
                      var roleInfo = JSON.parse(datas[1]);
                      var aresInfo = JSON.parse(datas[0]);
                      deferred.resolve({roleInfo: roleInfo, aresInfo: aresInfo});
                  })
            .catch(function (err) {
                       deferred.reject(err);
                   })
            .done();
    } else {
        /**　玩家不存在时 取 战力排行榜的玩家*/
        zCard(pvpRedisManager.getZhanliSetName())
            .then(function (total) {
                      //var rank = (roleID - aresFactory.BASE_ROLE_INDEX) % total;
                      var rank = ((+rankKey) % total) - 1;
                      rank = rank < 0 ? 0 : rank || 0;
                      return zRevRange(pvpRedisManager.getZhanliSetName(), rank, rank, 'WITHSCORES');
                  })
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in zhanli rank but not in roleInfo error：%j',
                                       roleID);
                          return deferred.reject();
                      }
                      var newRoleID = datas[0];
                      var jobs = [
                          hGet(pvpRedisManager.getAresInfoSetName(), roleID),
                          hGet(pvpRedisManager.getRoleInfoSetName(), newRoleID)
                      ];
                      return Q.all(jobs);
                  })
            .then(function (datas) {
                      if (!datas[1] || !datas[0]) {
                          logger.error('ares role in zhanli rank but not in roleInfo error：%j',
                                       roleID);
                          return deferred.reject(errorCodes.ARES_DELETE_ROLE);
                      }
                      var roleInfo = JSON.parse(datas[1]);
                      var aresInfo = JSON.parse(datas[0]);
                      roleInfo.roleID = roleID;
                      return deferred.resolve({roleInfo: roleInfo, aresInfo: aresInfo});
                  })
            .catch(function (err) {
                       return deferred.reject(err);
                   })
            .done();
    }
    return deferred.promise;
};


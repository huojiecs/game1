/**
 * Created by Administrator on 2015/1/1.
 */


var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var templateManager = require('../../../tools/templateManager');
var utilSql = require('../../../tools/mysql/utilSql');
var pvpSql = require('../../../tools/mysql/pvpSql');
var config = require('../../../tools/config');
var soulPvpFactory = require('../../soulPvp/soulPvpFactory');
var pvpRedisManager = require('../../redis/pvpRedisManager');
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var soulPvpTMgr = require('../../../tools/template/soulPvpTMgr');
var soulPvpManager = require('../../soulPvp/soulPvpManager');
var soulPvpFormula = require('../../soulPvp/soulPvpFormula');

var _ = require('underscore');
var Q = require('q');

var BATTLE_TYPE = soulPvpFormula.BATTLE_TYPE;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttLevel = gameConst.eAttLevel;
var eSoulPvpInfo = gameConst.eSoulPvpInfo;
var eRedisClientType = gameConst.eRedisClientType;
var ePlayerEventType = gameConst.ePlayerEventType;
var eSoulInfo = gameConst.eSoulInfo;

/** 玩家英雄榜 表名*/
var SOUL_PVP_TABLE = 'soulpvp';
/** 邪神竞技场 战斗次数购买系数*/
var SOUL_PVP_SHOP_FACTOR_ID = 148;
/** 防守阵容 默认邪神 老一 id*/
var SOUL_PVP_DEFENCE_ONE_ID = 1000;
/** 邪神竞技场 清除战斗cd花费*/
var SOUL_PVP_CLEAR_CD_TIME = 149;

/**
 * 玩家英雄榜 异步pvp（类斩魂） 管理器
 * */
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /** 玩家竞技场消息*/
    this.soulInfo = null;
    /** 数据标识位*/
    this.dirty = false;
    /**　正在进行战斗回合id*/
    this.roundID = 0;
};

var handler = Handler.prototype;

/**
 * 初始化方法s
 *
 * @return {Object} promise
 * @api public
 */
handler.Init = function (owner) {
    var self = this;

    if (!this.isOpenAres()) {
        /** 等级不足 不开启该系统*/
        this.owner.on(ePlayerEventType.UP_LEVEL, function () {
            self.openAresByUpLevel();
        });
        return Q.resolve(owner);
    }

    var deferred = Q.defer();
    /**加载数据*/
    this.LoadDataByDB(function (err, data) {

        if (!!err) {
            return deferred.reject(err);
        }

        /** 如果数据为空则初始化数据*/
        if (!data || data.length == 0) {
            self.soulInfo = soulPvpFactory.createSoulInfo(owner, soulPvpFactory.SOUL_PVP_TYPE_ROLE,
                                                          self.owner.GetPlayerInfo(ePlayerInfo.NAME));
            self.dirty = true;
        } else {
            self.soulInfo = data[0];
        }

        /** 添加数据到redis */
        self.addToRedis();

        return deferred.resolve(owner);
    });
    return deferred.promise;
};

/**
 * Brief: 玩家销毁事件
 *  1, 添加销毁事件, 防止泄露
 * ------------------------
 * @api private
 *
 * */
handler.destroy = function () {
    this.soulInfo = null;
    if (!!this.owner) {
        this.owner.removeAllListeners(ePlayerEventType.UP_LEVEL);
        this.owner = null;
    }
};

/**
 * 从数据库加载数据：
 *
 * @param {function} cb 回调函数
 * */
handler.LoadDataByDB = function (cb) {
    pvpSql.LoadInfoIndex(SOUL_PVP_TABLE, this.owner.getID(), 0, function (err, data) {
        if (!!err) {
            logger.error('soul pvp player module init error： %s', utils.getErrorMessage(err));
            return cb(err, []);
        }
        return cb(null, data);
    });
};

/**
 * 保存数据到数据库
 * */
handler.SaveToDB = function (owner) {
    var self = this;
    var deferred = Q.defer();
    if (!this.dirty || !this.isOpenAres()) {
        return Q.resolve(owner);
    }
    pvpSql.SaveInfo(SOUL_PVP_TABLE, this.owner.getID(), this.GetSqlStr(), 0, function (err) {
        if (!!err) {
            logger.error('soul pvp player module save error： %s', utils.getErrorMessage(err));
        }
        self.dirty = false;
        return deferred.resolve(owner);
    });

    return deferred.promise;
};

/**
 * Brief: 玩家下线 其特殊处理及保存数据到数据库
 * -----------------------------------------
 * @api public
 *
 * @param {Object} owner 管理器所有者
 * */
handler.Down = function (owner) {

    /** 如果回合存在 默认失败处理*/
    if (!!this.roundID) {
        var round = soulPvpManager.getRoundByID(this.roundID);

        if (!round) {
            return Q.resolve(owner);
        }

        if (!round.IsHavePlayer(this.owner.getID())) {
            return Q.resolve(owner);
        }
        var self = this;
        /** 战斗 默认失败*/
        var deferred = Q.defer();
        round.battleOver(round.getBlue().roleID)
            .catch(function (err) {
                       logger.error("error when Down battleOver default fail  %s", utils.getErrorMessage(err));
                   })
            .finally(function () {
                         self.SaveToDB(owner)
                             .finally(function () {
                                          return deferred.resolve(owner);
                                      });
                     })
            .done();
        return deferred.promise;
    } else {
        return this.SaveToDB(owner);
    }
};

/**
 * @Brief 获取存储字符串
 * --------------------
 *
 * @return {String}
 * */
handler.GetSqlStr = function () {
    var sqlStr = '';
    var temp = this.soulInfo;
    sqlStr += '(';
    for (var i = 0; i < eSoulPvpInfo.MAX; i++) {
        var value = temp[i];

        if (typeof  value == 'string') {
            sqlStr += '\'' + value + '\'' + ',';
        }
        else {
            sqlStr += value + ',';
        }
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
    sqlStr += ')';

    var sqlString = utilSql.BuildSqlValues([this.soulInfo]);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;
};

/**
 * 获取 战神榜信息
 *
 * @param {Number} index 数据枚举下标
 * @api public
 * */
handler.getSoulPvpInfo = function (index) {
    return this.soulInfo[index];
};

/**
 * 替换玩家所有信息
 *
 * @param {Array} soulInfo 数据
 * @api public
 * */
handler.setAllSoulPvpInfo = function (soulInfo) {
    this.soulInfo = soulInfo;
};

/**
 * 设置 战神榜信息
 *
 * @param {Number} index 数据枚举下标
 * @param {Object} value 玩家数据
 * @api public
 * */
handler.setSoulPvpInfo = function (index, value) {
    this.dirty = true;
    this.soulInfo[index] = value;
};

/**
 * Brief: 兑换物品扣除勋章
 * ----------------------
 * @api public
 *
 * @param {Number} deductValue 扣除勋章数
 * @param {Function} callback
 * */
handler.deductMedal = function (deductValue, callback) {

    if (deductValue > this.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL)) {
        return callback(errorCodes.SOUL_PVP_EXCHANGE_MADEL_LIMIT);
    }

    this.setSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL, this.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL) - deductValue);

    /**　更新redis 数据*/
    this.addToRedis();
    return callback(null, {'totalMedal': this.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL)});
};

/**
 * Brief: gm 添加勋章
 * ------------------
 * @api public
 *
 * @param {Number} addValue 添加勋章数
 * @param {Function} callback
 * */
handler.gmAddMedal = function (addValue, callback) {

    this.setSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL, this.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL) + addValue);

    /**　更新redis 数据*/
    this.addToRedis();
    return callback(null, {'totalMedal': this.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL)});
};

/**
 * 打开界面时 结算 勋章
 *
 * @param {Number} rank 当前排名
 * @api public
 * */
handler.openCalculateMedal = function (rank) {

    var self = this;

    if (rank <= 0) {
        return;
    }

    if (!this.calculateMedalTime || utils.getCurMinute() -
                                    this.calculateMedalTime > defaultValues.SOUL_PVP_REFRESH_MEDAL_TIME) {

        this.calculateMedalTime = utils.getCurMinute();
        /** 此处 会有问题 RANK_KEY 和 真实的排名会有区别 如删号等*/
        var medal = soulPvpFormula.calculateEarnings(rank,
                                                     this.getSoulPvpInfo(eSoulPvpInfo.OCCUPY_TIME));

        var csID = self.owner.GetPlayerCs();
        var addValue = self.getSoulPvpInfo(eSoulPvpInfo.MEDAL) + medal;
        pomelo.app.rpc.cs.pvpRemote.soulPvpAddMedal(null, csID, self.owner.getID(), addValue, function (err) {
            if (!!err) {
                if (!!self.owner) {
                    logger.error('soul pvp  openCalculateMedal add medal: %d roleID: %d error:%j',
                                 addValue, self.owner.getID(), utils.getErrorMessage(err));
                }
                else {
                    logger.error('soul pvp  openCalculateMedal add medal: %d error:%j owner is undefined',
                                 addValue, utils.getErrorMessage(err));
                }
            }

            self.setSoulPvpInfo(eSoulPvpInfo.MEDAL, 0);
            self.setSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL, self.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL) + medal);

            self.setSoulPvpInfo(eSoulPvpInfo.OCCUPY_TIME, utils.getCurMinute());

            /**　更新redis 数据*/
            self.addToRedis();
        });
    }
};

/**
 * 战斗胜利 玩家修改相关数据
 *
 * @param {Number} bRank 以前排名 key
 * @param {Object} cRank 排名改变 key
 * @api public
 * */
handler.battleChange = function (bRank, cRank, bCurRank, cCurRank) {

    var self = this;

    //var owner = this.owner;

    if (bRank == cRank || bRank != this.getSoulPvpInfo(eSoulPvpInfo.RANK_KEY)) {
        logger.warn('battle win rank key error bRank: %d, cRank: %d, myMaxRank: %d, bCurRank %d, cCurRank: %d', bRank,
                    cRank,
                    this.getSoulPvpInfo(eSoulPvpInfo.RANK_KEY), bCurRank, cCurRank);
        cRank += cCurRank < bCurRank ? 0 : 1;

        //return Q.reject(errorCodes.SystemWrong);
    }

    /*    if (cRank < bRank && cRank < defaultValues.SOUL_PVP_DEFAULT_RANK_NUM) {
     */
    /** 挑战获胜情况 判断历史最大排名*/
    /*
     if (this.getSoulPvpInfo(eSoulPvpInfo.MAX_RANK) == 0 || cRank < this.getSoulPvpInfo(eSoulPvpInfo.MAX_RANK)) {
     */
    /** 改变历史最大值*/
    /*
     this.setSoulPvpInfo(eSoulPvpInfo.MAX_RANK, cRank);
     var addValue = soulPvpFormula.calculateMasonry(bCurRank, cCurRank);
     var csID = this.owner.GetPlayerCs();
     pomelo.app.rpc.cs.pvpRemote.aresMaxRankReward(null, csID, owner.getID(), addValue, function (err) {
     if (!!err) {
     logger.error('soul pvp max rank history roleID: %d -- bRank: %d, cRank: %d error:%j',
     owner.getID(), bRank, cRank, utils.getErrorMessage(err));
     }
     });
     }
     }*/


    var medal = soulPvpFormula.calculateEarnings(bCurRank, self.getSoulPvpInfo(eSoulPvpInfo.OCCUPY_TIME));

    if (medal <= 0) {
        logger.warn('roleID: %d openCalculateMedal medal = 0 curTime: %s,  OCCUPY_TIME: %s , rankKey: %d',
                     this.owner.getID(), utils.dateString(utils.getCurTime()),
                     utils.dateString(utils.minuteToSec(this.getSoulPvpInfo(eSoulPvpInfo.OCCUPY_TIME))),
                     this.getSoulPvpInfo(eSoulPvpInfo.RANK_KEY));
        medal = 0;

        //return;
    }

    var csID = self.owner.GetPlayerCs();
    var addValue = self.getSoulPvpInfo(eSoulPvpInfo.MEDAL) + medal;

    pomelo.app.rpc.cs.pvpRemote.soulPvpAddMedal(null, csID, self.owner.getID(), addValue, function (err) {
        if (!!err) {
            logger.error('soul pvp add medal: %d roleID: %d -- bRank: %d, cRank: %d error:%j',
                         addValue, self.owner.getID(), bRank, cRank, utils.getErrorMessage(err));
        }

        self.setSoulPvpInfo(eSoulPvpInfo.MEDAL, 0);
        self.setSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL, self.getSoulPvpInfo(eSoulPvpInfo.TOTAL_MEDAL) + medal);

        self.setSoulPvpInfo(eSoulPvpInfo.RANK_KEY, cRank);
        self.setSoulPvpInfo(eSoulPvpInfo.OCCUPY_TIME, utils.getCurMinute());

        /**　更新redis 数据*/
        self.addToRedis();
        self.SaveToDB(self.owner);
    });

    Q.resolve();
};

/**
 * 升级时开启系统
 *
 * @api public
 * */
handler.openAresByUpLevel = function () {
    if (this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel) >= defaultValues.SOUL_PVP_DEFAULT_OPEN_LEVEL) {
        this.Init(this.owner);
    }
};

/**
 * 判断系统是否开启
 *
 * @return {Boolean}
 * @api public
 * */
handler.isOpenAres = function () {
//    return true;
    return this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel) >= defaultValues.SOUL_PVP_DEFAULT_OPEN_LEVEL;
};

/**
 * 战神榜请求战斗
 *
 * @param {Number} rivalID 对手id
 * @param {Number} myRank 我的排名
 * @param {Number} rivalRank 对手排名
 * @param {Number} isVipShop 是否使用vip购买
 * @param {Number} battle1 战斗1号，
 * @param {Number} battle2 战斗2号，
 * @param {Number} battle3 战斗3号，
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.requestBattle = function (rivalID, myRank, rivalRank, isVipShop, battle1, battle2, battle3, cb) {
    var self = this;

    /** 判断是否在cd中*/
    if (self.getCurCdTime() > 0) {
        return cb(errorCodes.SOUL_PVP_IN_CD_TIME);
    }

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);

    var jobs = [
        zRank(pvpRedisManager.getSoulPvpSetName(), this.owner.getID()),
        zRank(pvpRedisManager.getSoulPvpSetName(), rivalID),
        soulPvpManager.getDetails(this.owner.getID()),
        soulPvpManager.getDetails(rivalID)
    ];

    /** 设置玩家防守整容玩家*/
    self.SetBattleCast(battle1, battle2, battle3);

    Q.all(jobs)
        .then(function (datas) {
                  if (!datas || datas.length < 4) {
                      return Q.resolve({result: errorCodes.SOUL_PVP_NO_SOUL_DETAIL});
                  }

                  var rank = (datas[0] || 0) + 1;
                  var rRank = (datas[1] || 0) + 1;
                  var myData = datas[2].soulPvpInfo;

                  var riData = datas[3].soulPvpInfo;

                  var mySoulDetail = datas[2].soulDetail;
                  var riSoulDetail = datas[3].soulDetail;

                  //logger.error('myRank: %j, rank: %j, rivalRank: %j, rRank: %j', myRank, rank, rivalRank, rRank);
                  /** 检查自己排名是否相等*/
                  if (myRank !== rank) {
                      return Q.resolve({result: errorCodes.SOUL_PVP_MY_LEVEL_CHANGE});
                  }

                  if (myData.rankKey == riData.rankKey) {
                      logger.warn('why will happen this my rankKey: %d, roleID: %d  rival rankKey: %d, roleID: %d',
                                  myData.rankKey,
                                  self.owner.getID(), riData.rankKey, rivalID);
                      //return Q.resolve({result: errorCodes.SOUL_PVP_RIVAL_TYPE_BATTLED});
                  }

                  /** 检查目标排名是否相等*/
                  if (rivalRank !== rRank) {
                      return Q.resolve({result: errorCodes.SOUL_PVP_RIVAL_LEVEL_CHANGE});
                  }

                  /** 检查自己排名是否大于目标排名 */
                  if (rank <= rRank) {
                      return Q.resolve({result: errorCodes.SOUL_PVP_RIVAL_RANK_OVER});
                  }

                  /** 检查战斗状态*/
                  var check = soulPvpManager.checkBattleType(self.owner.getID(), rivalID);
                  if (!!check) {
                      return Q.resolve({result: check});
                  }

                  /** 判断剩余次数*/
                  if (self.getCanBattleTimes() <= 0) {

                      if (!isVipShop) {
                          return Q.resolve({result: errorCodes.SOUL_PVP_USER_UP_TIMES});
                      }

                      var temp = templateManager.GetTemplateByID('AllTemplate', SOUL_PVP_SHOP_FACTOR_ID);
                      var value = (self.getSoulPvpInfo(eSoulPvpInfo.SHOP_TIMES) + 1) * temp.attnum;

                      /** cs rpc 存在异步 不加 状态控制 有空能前面两次判断 通过 */
                      soulPvpManager.addBattleType(self.owner.getID(), BATTLE_TYPE.READY);
                      soulPvpManager.addBattleType(rivalID, BATTLE_TYPE.READY);

                      var deferred = Q.defer();
                      var csID = self.owner.GetPlayerCs();
                      pomelo.app.rpc.cs.pvpRemote.soulPvpVipShop(null, csID, self.getCurShopTimes(), self.owner.getID(),
                                                                 value, function (err) {
                              if (!!err) {

                                  /** 如果 vip 购买扣除砖石不成功！删除玩家 战斗状态*/
                                  soulPvpManager.deleteBattleType(self.owner.getID());
                                  soulPvpManager.deleteBattleType(rivalID);
                                  return deferred.resolve({result: errorCodes.toClientCode(err)});
                              }
                              self.GetSoulPVPPlayerInfo(rivalID, function (err, res) {

                                  if (!!err) {

                                      /** 如果 vip 购买扣除砖石不成功！删除玩家 战斗状态*/
                                      soulPvpManager.deleteBattleType(self.owner.getID());
                                      soulPvpManager.deleteBattleType(rivalID);
                                      return deferred.resolve({result: errorCodes.toClientCode(err)});
                                  }


                                  /** 纪录购买次数*/
                                  self.deductShopTimes();

                                  /** 重置战斗cd*/
                                  self.resetCdTime();

                                  var gId = soulPvpManager.battle(self.owner.getID(), rivalID, myData.rankKey,
                                                                  riData.rankKey, datas[2], datas[3], rank, rRank);
                                  self.roundID = gId;

                                  /** 设置玩家防守整容玩家*/
                                  self.SetBattleCast(battle1, battle2, battle3);

                                  /**　更新redis 数据*/
                                  self.addToRedis();

                                  var myAttList = getBattleInfo(mySoulDetail,
                                                                self.getSoulPvpInfo(eSoulPvpInfo.ATTACK_1),
                                                                self.getSoulPvpInfo(eSoulPvpInfo.ATTACK_2),
                                                                self.getSoulPvpInfo(eSoulPvpInfo.ATTACK_3));

                                  var riAttList = getBattleInfo(riSoulDetail,
                                                                riData.defense1 || SOUL_PVP_DEFENCE_ONE_ID,
                                                                riData.defense2,
                                                                riData.defense3);
                                  return deferred.resolve({result: errorCodes.OK, myAttList: myAttList, riAttList: riAttList, riInfo: res});
                              });

                          });
                      return deferred.promise;
                  } else {

                      /** */
                      var deferred = Q.defer();

                      self.GetSoulPVPPlayerInfo(rivalID, function (err, res) {
                          if (!!err) {

                              /** 如果 vip 购买扣除砖石不成功！删除玩家 战斗状态*/
                              return deferred.resolve({result: errorCodes.toClientCode(err)});
                          }

                          /** 扣除战斗次数*/
                          self.deductTimes();

                          /** 重置战斗cd*/
                          self.resetCdTime();

                          var gId = soulPvpManager.battle(self.owner.getID(), rivalID, myData.rankKey, riData.rankKey,
                                                          datas[2], datas[3], rank, rRank);
                          self.roundID = gId;

                          /** 设置玩家防守整容玩家*/
                          self.SetBattleCast(battle1, battle2, battle3);

                          /**　更新redis 数据*/
                          self.addToRedis();

                          var myAttList = getBattleInfo(mySoulDetail, self.getSoulPvpInfo(eSoulPvpInfo.ATTACK_1),
                                                        self.getSoulPvpInfo(eSoulPvpInfo.ATTACK_2),
                                                        self.getSoulPvpInfo(eSoulPvpInfo.ATTACK_3));

                          var riAttList = getBattleInfo(riSoulDetail, riData.defense1 || SOUL_PVP_DEFENCE_ONE_ID,
                                                        riData.defense2,
                                                        riData.defense3);

                          return deferred.resolve({result: errorCodes.OK, myAttList: myAttList, riAttList: riAttList, riInfo: res});
                      });

                      return deferred.promise;
                      //return Q.resolve({result: errorCodes.OK, myAttList: mySoulDetail.atts, riAttList: riSoulDetail.atts});
                  }
              })
        .then(function (res) {
                  if (res.result != errorCodes.OK) {
                      return cb(res.result);
                  }
                  return cb(null, {myAttList: res.myAttList, riAttList: res.riAttList, riInfo: res.riInfo});
              })
        .catch(function (err) {
                   logger.error("soul pvp error when requestBattle %s", utils.getErrorMessage(err));
                   return cb(errorCodes.toClientCode(err));
               })
        .done();
};

/**
 * @Brief:  获取 战斗相关信息
 * ------------------------
 *
 * @param {Object} soulDetail 邪神详细信息
 * @param {Object} one 1号
 * @param {Object} two 2号
 * @param {Object} third 2号
 * @return {Array}
 * */
var getBattleInfo = function (soulDetail, one, two, third) {

    var attList = [];
    if (!soulDetail) {
        logger.error('soulDetail no data err');
        return attList;
    }

    var souls = soulDetail.souls;
    var atts = soulDetail.atts;
    var zhanlis = soulDetail.zhanlis;

    if (!souls || !atts) {
        logger.error('soulDetail no data err');
        return attList;
    }

    if (!!one && !!souls[one] && !!atts[one]) {
        atts[one]['zhanLi'] = zhanlis[one];
        atts[one]['star'] = souls[one][eSoulInfo.LEVEL];
        atts[one]['wake'] = souls[one][eSoulInfo.WakeLevel];
        attList.push(atts[one]);
    }

    if (!!two && !!souls[two] && !!atts[two]) {
        atts[two]['zhanLi'] = zhanlis[two];
        atts[two]['star'] = souls[two][eSoulInfo.LEVEL];
        atts[two]['wake'] = souls[two][eSoulInfo.WakeLevel];
        attList.push(atts[two]);
    }

    if (!!third && !!souls[third] && !!atts[third]) {
        atts[third]['zhanLi'] = zhanlis[third];
        atts[third]['star'] = souls[third][eSoulInfo.LEVEL];
        atts[third]['wake'] = souls[third][eSoulInfo.WakeLevel];
        attList.push(atts[third]);
    }

    return attList;
};

/**
 * 战神榜战斗结算进行结算
 *
 * @param {Number} winID 获胜者id
 * @param {Number} roundID 回合id
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.battleOver = function (winID, cb) {
    var self = this;

    if (!self.roundID) {
        return cb(errorCodes.ParameterWrong);
    }

    var round = soulPvpManager.getRoundByID(self.roundID);

    if (!round) {
        return cb(errorCodes.ParameterWrong);
    }

    if (!round.IsHavePlayer(winID) || !round.IsHavePlayer(this.owner.getID())) {
        return cb(errorCodes.ParameterWrong);
    }

    /** 战斗结束 结算*/
    round.battleOver(winID)
        .then(function () {
                  return cb(null, {});
              })
        .catch(function (err) {
                   logger.error("soulPvp error when battleOver %s", utils.getErrorMessage(err));
                   return cb(errorCodes.ParameterWrong);
               })
        .finally(function () {
                     self.resetRivalTime();
                     self.roundID = 0;
                 })
        .done();
};

/**
 * 设置玩家 战斗阵容
 *
 * @param {Number} battle1 战斗1号
 * @param {Number} battle2 战斗2号
 * @param {Number} battle3 战斗3号
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.SetBattleCast = function (battle1, battle2, battle3) {

    this.setSoulPvpInfo(eSoulPvpInfo.ATTACK_1, battle1);
    this.setSoulPvpInfo(eSoulPvpInfo.ATTACK_2, battle2);
    this.setSoulPvpInfo(eSoulPvpInfo.ATTACK_3, battle3);


    /**　更新redis 数据*/
    //this.addToRedis();
};

/**
 * 设置玩家 战斗阵容
 *
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.refreshMedal = function (cb) {
    var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);

    zRank(pvpRedisManager.getSoulPvpSetName(), this.owner.getID())
        .then(function (rank) {

                  rank = (rank || 0) + 1;
                  /** 打开界面时结算勋章*/
                  self.openCalculateMedal(rank);
                  return cb(null, {});
              })
        .catch(function (err) {
                   logger.error("error when refreshMedal %s", utils.getErrorMessage(err));
                   return cb(null, {});
               })
        .done();

};

/**
 * 设置玩家 防御阵容
 *
 * @param {Number} defense1 防御1号
 * @param {Number} defense2 防御2号
 * @param {Number} defense3 防御3号
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.SetDefenseCast = function (defense1, defense2, defense3, cb) {

    this.setSoulPvpInfo(eSoulPvpInfo.DEFENSE_1, defense1);
    this.setSoulPvpInfo(eSoulPvpInfo.DEFENSE_2, defense2);
    this.setSoulPvpInfo(eSoulPvpInfo.DEFENSE_3, defense3);


    /**　更新redis 数据*/
    this.addToRedis();
    return cb(null, {});
};

/**
 * 清除玩家的 战斗cd时间
 *
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.ClearBattleTime = function (cb) {
    var self = this;

    /** 判断是否在cd中*/
    if (self.getCurCdTime() <= 0) {
        return cb(errorCodes.SOUL_PVP_NO_CLEAR_BATTLE_TIME);
    }

    var temp = templateManager.GetTemplateByID('AllTemplate', SOUL_PVP_CLEAR_CD_TIME);
    var value = temp.attnum;

    /** 获取玩家csID*/
    var csID = self.owner.GetPlayerCs();

    /** 到cs扣除玩家 砖石*/
    pomelo.app.rpc.cs.pvpRemote.soulPvpClearCDTime(null, csID, self.owner.getID(), value, function (err) {
        if (!!err) {
            /** 如果 vip 购买扣除砖石不成功！删除玩家 战斗状态*/
            return cb(errorCodes.toClientCode(err));
        }

        self.setSoulPvpInfo(eSoulPvpInfo.CD_TIME, 0);

        /**　更新redis 数据*/
        self.addToRedis();
        return cb(null, {});
    });
};

/**
 * 获取单个玩家 信息
 *
 * @param {Number} otherID 查看玩家id
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.GetSoulPVPPlayerInfo = function (otherID, cb) {
    //var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);

    /** 获取单个玩家的详细信息*/
    zRank(pvpRedisManager.getSoulPvpSetName(), otherID)
        .then(function (rank) {
                  rank = (rank || 0) + 1;
                  return soulPvpManager.getSoulPvpInfo(otherID, rank);
              })
        .then(function (info) {
                  return cb(null, info);
              })
        .catch(function (err) {
                   logger.error("error when GetSoulPVPPlayerInfo %s", utils.getErrorMessage(err));
                   return cb(errorCodes.ParameterWrong);
               })
        .done();

};


/**
 * 获取主界面对手相关信息
 *
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.GetSoulPVPPlayerList = function (cb) {
    var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);
    //var hGet = Q.nbind(client.hget, client);

    var myScore = {};

    zRank(pvpRedisManager.getSoulPvpSetName(), this.owner.getID())
        .then(function (rank) {

                  myScore['myRank'] = (rank || 0) + 1;

                  /** 打开界面时结算勋章*/
                  self.openCalculateMedal(myScore['myRank']);

                  var rewardData = soulPvpTMgr.getDataByRank(myScore['myRank']);
                  myScore['perSoulMoney'] = !!rewardData ? rewardData.Num1 * 60 : 0;

                  /** 从 cs 获取 竞技币 */
                  var csID = self.owner.GetPlayerCs();
                  var roleID = self.owner.getID();
                  return Q.ninvoke(pomelo.app.rpc.cs.pvpRemote, 'GetSoulPvpMedal', null, csID, roleID);
              })
        .then(function (res) {
                  myScore['mySoulMoney'] = res.value;
                  return self.getRivalList(myScore['myRank'], function (err, rivalLists) {
                      if (!!err) {
                          logger.error("error when GetSoulPVPPlayerList %s", utils.getErrorMessage(err));

                          return cb(errorCodes.toClientCode(err));
                      }
                      myScore['playerList'] = rivalLists;
                      return cb(null, myScore);
                  });
              })
        .catch(function (err) {
                   logger.error("error when GetSoulPVPPlayerList %s", utils.getErrorMessage(err));
                   return cb(errorCodes.ParameterWrong);
               })
        .done();

};


/**
 * 获取主界面 自己相关信息
 *
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.GetMySoulPVPInfo = function (cb) {
    var self = this;

    var myScore = {};

    /** 获取相关竞技场信息 */
    myScore['leftTimes'] = self.getCanBattleTimes();
    myScore['shopTimes'] = self.getCurShopTimes();
    myScore['cdTime'] = self.getCurCdTime();

    /** 获取邪神列表*/
    return self.getSoulInfoList(function (err, soulList) {
        if (!!err) {
            logger.error("error when GetMySoulPVPInfo %s", utils.getErrorMessage(err));
            return cb(errorCodes.toClientCode(err));
        }
        myScore['soulList'] = soulList;
        return cb(null, myScore);
    });
};


/**
 * Brief: 获取自己 防守邪神信息
 * ------------------
 *
 * @param {Function} callback
 * */
handler.getSoulInfoList = function (callback) {
    var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var hGet = Q.nbind(client.hget, client);

    var soulList = [];
    hGet(pvpRedisManager.getSoulDetailSetName(), this.owner.getID())
        .then(function (datas) {
                  if (!datas) {
                      return callback(errorCodes.SOUL_PVP_NO_SOUL_DETAIL);
                  }

                  var soulDetail = JSON.parse(datas);

                  var souls = soulDetail.souls;
                  var zhanlis = soulDetail.zhanlis;

                  /*防守1 邪神, 有 取现有， 无 默认显示*/
                  var soulID1 = self.getSoulPvpInfo(eSoulPvpInfo.DEFENSE_1);
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
                  var soulID2 = self.getSoulPvpInfo(eSoulPvpInfo.DEFENSE_2);
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
                  var soulID3 = self.getSoulPvpInfo(eSoulPvpInfo.DEFENSE_3);
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

                  return callback(null, soulList);

              })
        .catch(function (err) {
                   logger.error('getSoulInfoList err: %s', utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();

};

/**
 * Brief: 获取对手列表
 * ------------------
 *
 * @param {Number} rank 排名
 * @param {Function} callback
 * */
handler.getRivalList = function (rank, callback) {
    var self = this;

    if (!this.refreshRivalTime || utils.getCurSecond() - this.refreshRivalTime >
                                  defaultValues.SOUL_PVP_REFRESH_RIVAL_TIME) {
        this.refreshRivalTime = utils.getCurSecond();
        soulPvpManager.getRivalList(rank, function (err, rivalLists) {
            if (!!err) {
                logger.error("error when GetSoulPVPPlayerList %s", utils.getErrorMessage(err));
                return callback(err);
            }
            self.curRivalLis = rivalLists;
            return callback(null, rivalLists);

        });
    } else {
        return callback(null, this.curRivalLis);
    }
};

/**
 * Brief: 重置rival cd时间
 * ----------------------
 * @api public
 *
 * */
handler.resetRivalTime = function () {
    this.refreshRivalTime = 0;
};

/**
 * 获取 战斗剩余次数
 *
 * @return {Number}
 * */
handler.getCanBattleTimes = function () {

    if (!utils.isTheSameDay(utils.getCurTime(),
                            utils.minuteToSec(this.getSoulPvpInfo(eSoulPvpInfo.LAST_BATTLE_TIME)))) {
        this.setSoulPvpInfo(eSoulPvpInfo.BATTLE_TIMES, 0);
        this.setSoulPvpInfo(eSoulPvpInfo.LAST_BATTLE_TIME, utils.getCurMinute());
    }

    return defaultValues.SOUL_PVP_DEFAULT_BATTLE_TIMES - this.getSoulPvpInfo(eSoulPvpInfo.BATTLE_TIMES);
};

/**
 * 获取 当前vip购买次数
 *
 * @return {Number}
 * */
handler.getCurShopTimes = function () {

    if (!utils.isTheSameDay(utils.getCurTime(), utils.minuteToSec(this.getSoulPvpInfo(eSoulPvpInfo.LAST_SHOP_TIME)))) {
        this.setSoulPvpInfo(eSoulPvpInfo.SHOP_TIMES, 0);
        this.setSoulPvpInfo(eSoulPvpInfo.LAST_SHOP_TIME, utils.getCurMinute());
    }

    return this.getSoulPvpInfo(eSoulPvpInfo.SHOP_TIMES);
};

/**
 * @Brief: 获取 战斗cd时间
 * ----------------------
 *
 *
 * @return {Number}
 * */
handler.getCurCdTime = function () {

    if (this.getSoulPvpInfo(eSoulPvpInfo.CD_TIME) <= 0) {
        return 0;
    }

    var time = defaultValues.SOUL_PVP_BATTLE_TIME - (utils.getCurSecond()
        - utils.minuteToSecond(this.getSoulPvpInfo(eSoulPvpInfo.CD_TIME)));

    if (time < 0) {
        time = 0;
    }
    return time;
};

/**
 * @Brief: 重置战斗cd时间
 *----------------------
 *
 * @api public
 * */
handler.resetCdTime = function () {
    this.setSoulPvpInfo(eSoulPvpInfo.CD_TIME, utils.getCurMinute());

    /**　更新redis 数据*/
    //this.addToRedis();
};

/**
 * 获取 当前结算勋章数
 * 获取一次后清空
 *
 * @return {Number}
 * */
handler.getCurMedal = function () {
    var medal = this.getSoulPvpInfo(eSoulPvpInfo.MEDAL);
    //this.setSoulPvpInfo(eSoulPvpInfo.MEDAL, 0);
    return medal;
};

/**
 * 扣除可战斗次数
 *
 * @api public
 * */
handler.deductTimes = function () {
    this.setSoulPvpInfo(eSoulPvpInfo.BATTLE_TIMES, this.getSoulPvpInfo(eSoulPvpInfo.BATTLE_TIMES) + 1);

    //this.setSoulPvpInfo(eSoulPvpInfo.LAST_BATTLE_TIME, utils.getCurMinute());
    /**　更新redis 数据*/
    this.addToRedis();
};

/**
 * 添加购买次数次数
 *
 * @api public
 * */
handler.deductShopTimes = function () {

    this.setSoulPvpInfo(eSoulPvpInfo.SHOP_TIMES, this.getSoulPvpInfo(eSoulPvpInfo.SHOP_TIMES) + 1);

    //this.setSoulPvpInfo(eSoulPvpInfo.LAST_SHOP_TIME, utils.getCurMinute());
    /**　更新redis 数据*/
    //this.addToRedis();
};

/**
 * add data to redis
 *
 * @api public
 * */
handler.addToRedis = function () {
    var client = pvpRedisManager.getClient(eRedisClientType.Chart);
    var redisData = soulPvpFactory.buildToRedis(this.soulInfo);

    var jobs = [
        client.zPAdd(pvpRedisManager.getSoulPvpSetName(), this.owner.getID(), this.soulInfo[eSoulPvpInfo.RANK_KEY]),
        client.hPSet(pvpRedisManager.getSoulPvpInfoSetName(), this.owner.getID(), JSON.stringify(redisData))
    ];

    Q.all(jobs)
        .then(function () {

              })
        .catch(function (err) {
                   logger.error('soul pvp to player info to redis error %s', utils.getErrorMessage(err));
               });

};

/**
 * The file roleAresManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/12/5 18:09:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var templateManager = require('../../../tools/templateManager');
var utilSql = require('../../../tools/mysql/utilSql');
var pvpSql = require('../../../tools/mysql/pvpSql');
var config = require('../../../tools/config');
var aresFactory = require('../../ares/aresFactory');
var pvpRedisManager = require('../../redis/pvpRedisManager');
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var aresTMgr = require('../../../tools/template/aresTMgr');
var aresManager = require('../../ares/aresManager');
var aresFormula = require('../../ares/aresFormula');
var stringValue = require('../../../tools/stringValue');
var globalFunction = require('../../../tools/globalFunction');
var util = require('util');
var _ = require('underscore');
var Q = require('q');


var BATTLE_TYPE = aresFormula.BATTLE_TYPE;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttLevel = gameConst.eAttLevel;
var eAresInfo = gameConst.eAresInfo;
var eRedisClientType = gameConst.eRedisClientType;
var ePlayerEventType = gameConst.ePlayerEventType;

/** 玩家英雄榜 表名*/
var ARES_TABLE = 'ares';
/** 战神榜 战斗次数购买系数*/
var ARES_SHOP_FACTOR_ID = 128;

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
    this.ares = null;
    /** 数据标识位*/
    this.dirty = false;
    /**　正在进行战斗回合id*/
    this.roundID = 0;
};

var handler = Handler.prototype;

/**
 * 初始化方法
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

    /** 花钱战斗 玩家直接 关 客户端 不解除战斗状态 补救机制 找到问题未用*/
        //aresManager.deleteBattleType(self.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
    var deferred = Q.defer();
    /**加载数据*/
    this.LoadDataByDB(function (err, data) {

        if (!!err) {
            return deferred.reject(err);
        }

        /** 如果数据为空则初始化数据*/
        if (!data || data.length == 0) {
            self.ares = aresFactory.createAres(owner, aresFactory.ARES_TYPE_ROLE,
                                               self.owner.GetPlayerInfo(ePlayerInfo.NAME));
            self.dirty = true;
        } else {
            self.ares = data[0];
        }

        if (self.ares[eAresInfo.RANK_KEY] == 0) {
            self.ares[eAresInfo.RANK_KEY] = aresManager.getRankID();
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
    this.ares = null;
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
    pvpSql.LoadInfoIndex(ARES_TABLE, this.owner.getID(), 0, function (err, data) {
        if (!!err) {
            logger.error('ares player module init error： %s', utils.getErrorMessage(err));
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
    pvpSql.SaveInfo(ARES_TABLE, this.owner.getID(), this.GetSqlStr(), 0, function (err) {
        if (!!err) {
            logger.error('ares player module save error： %s', utils.getErrorMessage(err));
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
        var round = aresManager.getRoundByID(this.roundID);

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
 * 获取存储字符串
 * */
handler.GetSqlStr = function () {
    var sqlStr = '';
    var temp = this.ares;
    sqlStr += '(';
    for (var i = 0; i < eAresInfo.MAX; i++) {
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

    var sqlString = utilSql.BuildSqlValues([this.ares]);

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
handler.getAresInfo = function (index) {
    return this.ares[index];
};

/**
 * 替换玩家所有信息
 *
 * @param {Array} ares 数据
 * @api public
 * */
handler.setAllAresInfo = function (ares) {
    this.ares = ares;
};

/**
 * 设置 战神榜信息
 *
 * @param {Number} index 数据枚举下标
 * @param {Object} value 玩家数据
 * @api public
 * */
handler.setAresInfo = function (index, value) {
    this.dirty = true;
    this.ares[index] = value;
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

    if (deductValue > this.getAresInfo(eAresInfo.TOTAL_MEDAL)) {
        return callback(errorCodes.ARES_EXCHANGE_MADEL_LIMIT);
    }

    this.setAresInfo(eAresInfo.TOTAL_MEDAL, this.getAresInfo(eAresInfo.TOTAL_MEDAL) - deductValue);

    /**　更新redis 数据*/
    this.addToRedis();
    return callback(null, {'totalMedal': this.getAresInfo(eAresInfo.TOTAL_MEDAL)});
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

    this.setAresInfo(eAresInfo.TOTAL_MEDAL, this.getAresInfo(eAresInfo.TOTAL_MEDAL) + addValue);

    /**　更新redis 数据*/
    this.addToRedis();
    return callback(null, {'totalMedal': this.getAresInfo(eAresInfo.TOTAL_MEDAL)});
};

/**
 * 打开界面时 结算 勋章
 *
 * @param {Number} rank 当前排名
 * @api public
 * */
handler.openCalculateMedal = function (rank) {

    if (!this.calculateMedalTime || utils.getCurMinute() -
                                    this.calculateMedalTime > defaultValues.ARES_REFRESH_MEDAL_TIME) {

        this.calculateMedalTime = utils.getCurMinute();
        /** 此处 会有问题 RANK_KEY 和 真实的排名会有区别 如删号等*/
        var medal = aresFormula.calculateEarnings(rank,
                                                  this.getAresInfo(eAresInfo.OCCUPY_TIME));

        if (0 == medal) {
            logger.error('roleID: %d openCalculateMedal medal = 0 curTime: %s,  OCCUPY_TIME: %s , rankKey: %d',
                         this.owner.getID(), utils.dateString(utils.getCurTime()),
                         utils.dateString(utils.minuteToSec(this.getAresInfo(eAresInfo.OCCUPY_TIME))),
                         this.getAresInfo(eAresInfo.RANK_KEY));
            return;
        }

        /** 服务器调时间 引起赋值 添加判断*/
        if (medal < 0) {
            logger.warn('openCalculateMedal medal < %d curTime: %s,  OCCUPY_TIME: %s',
                        medal, utils.dateString(utils.getCurTime()),
                        utils.dateString(utils.minuteToSec(this.getAresInfo(eAresInfo.OCCUPY_TIME))));
            medal = 0;
        }

        /** 因为有玩家报 勋章个数不对 添加log*/
        var roleID = this.owner.getID();
        var curTime = utils.dateString(utils.getCurTime());
        var occupyTime = utils.dateString(utils.minuteToSec(this.getAresInfo(eAresInfo.OCCUPY_TIME)));
        var rankKey = this.getAresInfo(eAresInfo.RANK_KEY);
        var beforeRank = this.getAresInfo(eAresInfo.RANK_KEY);
        var afterRank = this.getAresInfo(eAresInfo.RANK_KEY);
        var changeReason = 1; // 改变类型 1 主动 内置cd 2 被挑战 3 主动挑战

        logger.warn('AresMedalChange: %j',
            [roleID, curTime, occupyTime, rankKey, beforeRank, afterRank, changeReason, medal, this.getAresInfo(eAresInfo.TOTAL_MEDAL) + medal]);

        this.setAresInfo(eAresInfo.MEDAL, this.getAresInfo(eAresInfo.MEDAL) + medal);
        this.setAresInfo(eAresInfo.TOTAL_MEDAL, this.getAresInfo(eAresInfo.TOTAL_MEDAL) + medal);

        this.setAresInfo(eAresInfo.OCCUPY_TIME, utils.getCurMinute());

        /**　更新redis 数据*/
        this.addToRedis();
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
    var owner = this.owner;

    if (bRank == cRank || bRank != this.getAresInfo(eAresInfo.RANK_KEY)) {
        logger.warn('battle win rank key error bRank: %d, cRank: %d, myMaxRank: %d, bCurRank: %d, cCurRank', bRank,
                    cRank,
                    this.getAresInfo(eAresInfo.RANK_KEY), bCurRank, cCurRank);
        cRank += cCurRank < bCurRank ? 0 : 1;
    }

    if (cRank < bRank && cRank < defaultValues.ARES_DEFAULT_RANK_NUM) {
        /** 挑战获胜情况 判断历史最大排名*/
        if (this.getAresInfo(eAresInfo.MAX_RANK) == 0 || cRank < this.getAresInfo(eAresInfo.MAX_RANK)) {
            /** 改变历史最大值*/
            this.setAresInfo(eAresInfo.MAX_RANK, cRank);
            var addValue = aresFormula.calculateMasonry(bCurRank, cCurRank);
            var csID = this.owner.GetPlayerCs();


            var mailDetail = {
                recvID: owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                subject: stringValue.sPvpString.title,
                mailType: gameConst.eMailType.System,
                content: stringValue.sPvpString.content_1,
                items: []
            };
            mailDetail.content = util.format(stringValue.sPvpString.content_1, bRank, cRank, addValue);
            mailDetail.items = [[globalFunction.GetYuanBaoTemp(),addValue]];

            pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);

//            pomelo.app.rpc.cs.pvpRemote.aresMaxRankReward(null, csID, owner.getID(), addValue, function (err) {
//                if (!!err) {
//                    logger.error('ares max rank history roleID: %d -- bRank: %d, cRank: %d error: %s',
//                                 owner.getID(), bRank, cRank, utils.getErrorMessage(err));
//                }
//
//                logger.warn('ares medal max rank  history roleID: %d -- bRank: %d, cRank: %d, ' +
//                            'bCurRank: %d, cCurRank: %d, info: ', owner.getID(), bRank, cRank, bCurRank, cCurRank,
//                            self.ares);
//            });
        }
    }


    var medal = aresFormula.calculateEarnings(bCurRank, this.getAresInfo(eAresInfo.OCCUPY_TIME));


    if (0 == medal) {
        logger.warn('roleID: %d openCalculateMedal medal = 0 curTime: %s,  OCCUPY_TIME: %s , rankKey: %d',
                     this.owner.getID(), utils.dateString(utils.getCurTime()),
                     utils.dateString(utils.minuteToSec(this.getAresInfo(eAresInfo.OCCUPY_TIME))),
                     this.getAresInfo(eAresInfo.RANK_KEY));
        //return;
    }

    /** 服务器调时间 引起赋值 添加判断*/
    if (medal < 0) {
        logger.warn('openCalculateMedal medal < %d curTime: %s,  OCCUPY_TIME: %s',
                    medal, utils.dateString(utils.getCurTime()),
                    utils.dateString(utils.minuteToSec(this.getAresInfo(eAresInfo.OCCUPY_TIME))));
        medal = 0;
    }

    /** 因为有玩家报 勋章个数不对 添加log*/
    var roleID = this.owner.getID();
    var curTime = utils.dateString(utils.getCurTime());
    var occupyTime = utils.dateString(utils.minuteToSec(this.getAresInfo(eAresInfo.OCCUPY_TIME)));
    var rankKey = this.getAresInfo(eAresInfo.RANK_KEY);
    var beforeRank = this.getAresInfo(eAresInfo.RANK_KEY);
    var afterRank = this.getAresInfo(eAresInfo.RANK_KEY);
    var changeReason = 2; // 改变类型 1 主动 内置cd 2 挑战 在线 3 挑战 不在线

    logger.warn('AresMedalChange: %j',
        [roleID, curTime, occupyTime, rankKey, beforeRank, afterRank, changeReason, medal, this.getAresInfo(eAresInfo.TOTAL_MEDAL) + medal]);


    this.setAresInfo(eAresInfo.MEDAL, this.getAresInfo(eAresInfo.MEDAL) + medal);
    this.setAresInfo(eAresInfo.TOTAL_MEDAL, this.getAresInfo(eAresInfo.TOTAL_MEDAL) + medal);

    this.setAresInfo(eAresInfo.RANK_KEY, cRank);
    this.setAresInfo(eAresInfo.OCCUPY_TIME, utils.getCurMinute());

    /**　更新redis 数据*/
    this.addToRedis();
    this.SaveToDB(this.owner);
    Q.resolve();

    //公告
    var noticeID = "pvpRank_" + cRank;
    this.owner.GetNoticeManager().SendRepeatableGM(gameConst.eGmType.PvpRank, noticeID);
};

/**
 * 升级时开启系统
 *
 * @api public
 * */
handler.openAresByUpLevel = function () {
    if (this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel) >= defaultValues.ARES_DEFAULT_OPEN_LEVEL) {
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
    return this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel) >= defaultValues.ARES_DEFAULT_OPEN_LEVEL;
};

/**
 * 战神榜请求战斗
 *
 * @param {Number} rivalID 对手id
 * @param {Number} myRank 我的排名
 * @param {Number} rivalRank 对手排名
 * @param {Number} isVipShop 是否使用vip购买
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.requestBattle = function (rivalID, myRank, rivalRank, isVipShop, cb) {
    var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);
    var hGet = Q.nbind(client.hget, client);

    var jobs = [
        zRank(pvpRedisManager.getAresSetName(), this.owner.getID()),
        zRank(pvpRedisManager.getAresSetName(), rivalID),
        aresManager.getDetails(this.owner.getID(), myRank),
        aresManager.getDetails(rivalID, rivalRank)
    ];

    Q.all(jobs)
        .then(function (datas) {

                  var rank = (datas[0] || 0) + 1;
                  var rRank = (datas[1] || 0) + 1;
                  var myData = datas[2].aresInfo;
                  var riData = datas[3].aresInfo;

                  var diffZhanli = templateManager.GetTemplateByID('AllTemplate', 242);
                  if(diffZhanli != null){
                      var myInfo = datas[2].roleInfo;
                      var riInfo = datas[3].roleInfo;

                      if(riInfo.zhanli -  myInfo.zhanli >= diffZhanli['attnum']){
                          return Q.resolve({result: errorCodes.ARES_ZHANLI_DIFF});
                      }
                  }

                  //logger.error('myRank: %j, rank: %j, rivalRank: %j, rRank: %j', myRank, rank, rivalRank, rRank);
                  /** 检查自己等级*/
                  if (myRank !== rank) {
                      return Q.resolve({result: errorCodes.ARES_MY_LEVEL_CHANGE});
                  }

                  /** 检查目标等级*/
                  if (rivalRank !== rRank) {
                      return Q.resolve({result: errorCodes.ARES_RIVAL_LEVEL_CHANGE});
                  }

                  if (myData.rankKey == riData.rankKey) {
                      logger.warn('why will happen this my rankKey: %d, roleID: %d  rival rankKey: %d, roleID: %d',
                                  myData.rankKey, self.owner.getID(), riData.rankKey, rivalID);
                      //return Q.resolve({result: errorCodes.ARES_RIVAL_TYPE_BATTLED});
                  }

                  /** 检查自己等级是否大于目标等级 */
                  if (rank <= rRank) {
                      return Q.resolve({result: errorCodes.ARES_MY_LEVEL_CHANGE});
                  }

                  /** 检查战斗状态*/
                  var check = aresManager.checkBattleType(self.owner.getID(), rivalID);
                  if (!!check) {
                      return Q.resolve({result: check});
                  }

                  /** 判断剩余次数*/
                  if (self.getCanBattleTimes() <= 0) {

                      if (!isVipShop) {
                          return Q.resolve({result: errorCodes.ARES_USER_UP_TIMES});
                      }
                      var temp = templateManager.GetTemplateByID('AllTemplate', ARES_SHOP_FACTOR_ID);
                      var value = (self.getAresInfo(eAresInfo.SHOP_TIMES) + 1) * temp.attnum;

                      /** cs rpc 存在异步 不加 状态控制 有空能前面两次判断 通过 */
                      aresManager.addBattleType(self.owner.getID(), BATTLE_TYPE.READY);
                      aresManager.addBattleType(rivalID, BATTLE_TYPE.READY);

                      var deferred = Q.defer();
                      var csID = self.owner.GetPlayerCs();
                      pomelo.app.rpc.cs.pvpRemote.areVipShop(null, csID, self.owner.getID(), value, function (err) {
                          if (!!err) {

                              /** 如果 vip 购买扣除砖石不成功！删除玩家 战斗状态*/
                              aresManager.deleteBattleType(self.owner.getID());
                              aresManager.deleteBattleType(rivalID);
                              return deferred.resolve({result: errorCodes.toClientCode(err)});
                          }

                          /** 纪录购买次数*/
                          self.deductShopTimes();

                          var gId = aresManager.battle(self.owner.getID(), rivalID, myData.rankKey,
                                                       riData.rankKey, datas[2], datas[3], rank, rRank);

                          self.roundID = gId;
                          return deferred.resolve({result: errorCodes.OK, gId: gId});
                      });
                      return deferred.promise;
                  } else {

                      /** 扣除战斗次数*/
                      self.deductTimes();

                      var gId = aresManager.battle(self.owner.getID(), rivalID, myData.rankKey, riData.rankKey,
                                                   datas[2], datas[3], rank, rRank);
                      self.roundID = gId;
                      return Q.resolve({result: errorCodes.OK, gId: gId});
                  }
              })
        .then(function (res) {
                  if (res.result != errorCodes.OK) {
                      return cb(res.result);
                  }
                  return cb(null, {roundID: res.gId});
              })
        .catch(function (err) {
                   /** 破需求 请求战斗的玩家删除角色， 重置对手列表 内置cd时间*/
                   if (errorCodes.toClientCode(err) == errorCodes.ARES_DELETE_ROLE) {
                       self.refreshRivalTime = 0;
                   }
                   logger.error("error when requestBattle %s", utils.getErrorMessage(err));
                   return cb(errorCodes.toClientCode(err));
               })
        .done();
};

/**
 * 战神榜战斗结算进行结算
 *
 * @param {Number} winID 获胜者id
 * @param {Number} roundID 回合id
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.battleOver = function (winID, roundID, cb) {
    var self = this;

    var round = aresManager.getRoundByID(roundID);

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
                   logger.error("error when battleOver %s", utils.getErrorMessage(err));
                   return cb(errorCodes.ParameterWrong);
               })
        .finally(function () {
                     self.resetRivalTime();
                     self.roundID = 0;
                 })
        .done();
};


/**
 * 获取主界面信息
 *
 * @param {Function} cb 回调函数
 * @api public
 * */
handler.getMainInfo = function (cb) {
    var self = this;

    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);
    var hGet = Q.nbind(client.hget, client);

    var myScore = {};

    zRank(pvpRedisManager.getAresSetName(), this.owner.getID())
        .then(function (rank) {

                  myScore['rank'] = (rank || 0) + 1;

                  /** 打开界面时结算勋章*/
                  self.openCalculateMedal(myScore['rank']);

                  myScore['totalMedal'] = self.getAresInfo(eAresInfo.TOTAL_MEDAL);
                  myScore['medal'] = self.getCurMedal();
                  myScore['battleTimes'] = self.getCanBattleTimes();
                  myScore['shopTimes'] = self.getCurShopTimes();
                  myScore['max_rank'] = self.getAresInfo(eAresInfo.MAX_RANK);
                  if(0 == myScore['max_rank']){
                      myScore['max_rank'] = myScore['rank'];
                  }
                  /** 获取日志 列表*/
                  //myScore['aresLogList'] = self.owner.GetRoleAresLogManager().getAllAresLogShowInfo();

                  var rewardData = aresTMgr.getDataByRank(aresTMgr.REAL_TIME_TYPE, myScore['rank']);
                  myScore['reward'] = !!rewardData ? rewardData.Num1 * 60 : 0;

                  return self.getRivalList(myScore['rank'], function (err, rivalLists) {
                      if (!!err) {
                          logger.error("error when getMainInfo %s", utils.getErrorMessage(err));
                          return cb(errorCodes.toClientCode(err));
                      }
                      myScore['rivalList'] = rivalLists;
                      return cb(null, myScore);
                  });
              })
        .catch(function (err) {
                   logger.error("error when getMainInfo %s", utils.getErrorMessage(err));
                   return cb(errorCodes.ParameterWrong);
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
                                  defaultValues.ARES_REFRESH_RIVAL_TIME) {
        this.refreshRivalTime = utils.getCurSecond();
        aresManager.getRivalList(rank, function (err, rivalLists) {
            if (!!err) {
                logger.error("error when getMainInfo %s", utils.getErrorMessage(err));
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

    if (!utils.isTheSameDay(utils.getCurTime(), utils.minuteToSec(this.getAresInfo(eAresInfo.LAST_BATTLE_TIME)))) {
        this.setAresInfo(eAresInfo.BATTLE_TIMES, 0);
        this.setAresInfo(eAresInfo.LAST_BATTLE_TIME, utils.getCurMinute());
    }

    return defaultValues.ARES_DEFAULT_BATTLE_TIMES - this.getAresInfo(eAresInfo.BATTLE_TIMES);
};

/**
 * 获取 当前vip购买次数
 *
 * @return {Number}
 * */
handler.getCurShopTimes = function () {

    if (!utils.isTheSameDay(utils.getCurTime(), utils.minuteToSec(this.getAresInfo(eAresInfo.LAST_SHOP_TIME)))) {
        this.setAresInfo(eAresInfo.SHOP_TIMES, 0);
        this.setAresInfo(eAresInfo.LAST_SHOP_TIME, utils.getCurMinute());
    }

    return this.getAresInfo(eAresInfo.SHOP_TIMES);
};

/**
 * 获取 当前结算勋章数
 * 获取一次后清空
 *
 * @return {Number}
 * */
handler.getCurMedal = function () {
    var medal = this.getAresInfo(eAresInfo.MEDAL);
    //this.setAresInfo(eAresInfo.MEDAL, 0);
    return medal;
};

/**
 * 扣除可战斗次数
 *
 * @api public
 * */
handler.deductTimes = function () {
    this.setAresInfo(eAresInfo.BATTLE_TIMES, this.getAresInfo(eAresInfo.BATTLE_TIMES) + 1);

    //this.setAresInfo(eAresInfo.LAST_BATTLE_TIME, utils.getCurMinute());
    /**　更新redis 数据*/
    this.addToRedis();
};

/**
 * 添加购买次数次数
 *
 * @api public
 * */
handler.deductShopTimes = function () {

    this.setAresInfo(eAresInfo.SHOP_TIMES, this.getAresInfo(eAresInfo.SHOP_TIMES) + 1);

    //this.setAresInfo(eAresInfo.LAST_SHOP_TIME, utils.getCurMinute());
    /**　更新redis 数据*/
    this.addToRedis();
};

/**
 * add data to redis
 *
 * @api public
 * */
handler.addToRedis = function () {
    var client = pvpRedisManager.getClient(eRedisClientType.Chart);
    var redisData = aresFactory.buildToRedis(this.ares);

    var jobs = [
        client.zPAdd(pvpRedisManager.getAresSetName(), this.owner.getID(), this.ares[eAresInfo.RANK_KEY]),
        client.hPSet(pvpRedisManager.getAresInfoSetName(), this.owner.getID(), JSON.stringify(redisData))
    ];

    Q.all(jobs)
        .then(function () {

              })
        .catch(function (err) {
                   logger.error('ares to plyaer info to redis error %s', utils.getErrorMessage(err));
               });

};

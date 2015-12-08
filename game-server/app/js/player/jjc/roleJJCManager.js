/**
 * The file roleJjcManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/14 13:07:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var templateManager = require('../../../tools/templateManager');
var utilSql = require('../../../tools/mysql/utilSql');
var jsSql = require('../../../tools/mysql/jsSql');
var defaultValues = require('../../../tools/defaultValues');
var redisManager = require('../../redis/jsRedisManager');
var config = require('../../../tools/config');
var roleJjcInfoFactory = require('../../common/roleJjcInfoFactory');
var errorCodes = require('../../../tools/errorCodes');
var JjcInfo = require('./jjcInfo');
var jjcMedalTMgr = require('../../../tools/template/jjcMedalTMgr');
var jjcRewardTMgr = require('../../../tools/template/jjcRewardTMgr');
var jjcDayRewardTMgr = require('../../../tools/template/jjcDayRewardTMgr');
var jjcManager = require('../../jjc/jjcManager');
var jjcFormula = require('../../common/jjcFormula');

var _ = require('underscore');
var Q = require('q');

var eRedisClientType = gameConst.eRedisClientType;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttLevel = gameConst.eAttLevel;
var eJJCInfo = gameConst.eJJCInfo;
var ePlayerEventType = gameConst.ePlayerEventType;
var BATTLE_TYPE = jjcFormula.BATTLE_TYPE;
var eRankingRewardType = gameConst.eRankingRewardType;
var eRoundType = gameConst.eRoundType;

/** 玩家jjc 表名*/
var JJC_TABLE = 'rolejjc';
/** vip购买 */

/**
 * 玩家JJC 同步pvp 管理器
 * */
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /** 玩家竞技场消息*/
    this.data = [];
    /** 数据标识位*/
    this.dirty = false;
    /** 玩家战斗回合id*/
    this.roundID = 0;
};

var handler = Handler.prototype;


/**
 * 初始化方法
 * @api public
 */
handler.Init = function (owner) {
    var self = this;

    if (!this.isOpenJJC()) {
        /** 等级不足 不开启该系统*/
        this.owner.on(ePlayerEventType.UP_LEVEL, function () {
            self.openAresByUpLevel();
        });
        return Q.resolve(owner);
    }

    /** 花钱战斗 玩家直接 关 客户端 不解除战斗状态 补救机制 找到问题未用*/
    var deferred = Q.defer();
    /**加载数据*/
    this.LoadDataByDB(function (err, data) {

        if (!!err) {
            return deferred.reject(err);
        }

        /** 如果数据为空则初始化数据*/
        if (!data || data.length == 0) {
            // 新建数据添加 dirty 标识
            self.data = new JjcInfo();
            self.data.Insert(roleJjcInfoFactory.createDefaultInfo(owner));
        } else {
            self.data = new JjcInfo(data[0]);
        }

        /** 检查是否是当前期数 不是重置玩家信息*/
        if (!self.data.CheckIsCurPhase()) {
            self.data.Insert(roleJjcInfoFactory.createDefaultInfo(owner));
        }

        /** 添加到 redis*/
        self.addCreditsToRedis(self.data.GetJJCInfo(eJJCInfo.CREDIS));

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
    var roleID = this.owner.GetId();
    /** 如果回合存在 默认失败处理*/
    if (!!this.roundID) {
        var round = jjcManager.getRoundByID(this.roundID);
        if (!round) {
            return this.SaveToDB(owner);
        }

        if (!round.IsHavePlayer(roleID)) {
            return this.SaveToDB(owner);
        }

        var self = this;
        var deferred = Q.defer();
        round.battleOver(round.getRival(roleID).roleID)
            .catch(function (err) {
                       logger.error("error when Down battleOver default fail  %s", utils.getErrorMessage(err));
                   })
            .finally(function () {
                         /** 删除战斗状态*/
                         jjcManager.deleteBattleType(roleID);
                         self.roundID = 0;

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
 * Brief: 玩家销毁事件
 *  1, 添加销毁事件, 防止泄露
 * ------------------------
 * @api private
 *
 * */
handler.destroy = function () {
    this.data = null;
    if (!!this.owner) {
        this.owner.removeAllListeners(ePlayerEventType.UP_LEVEL);
        this.owner = null;
    }
};

/**
 * 判断系统是否开启
 *
 * @return {Boolean}
 * @api public
 * */
handler.isOpenJJC = function () {
//    return true;
    return this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel) >= defaultValues.JJC_DEFAULT_OPEN_LEVEL;
};

/**
 * 升级时开启系统
 *
 * @api public
 * */
handler.openAresByUpLevel = function () {
    if (this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel) >= defaultValues.JJC_DEFAULT_OPEN_LEVEL) {
        this.Init(this.owner);
    }
};

/**
 * 从数据库加载数据：
 * @param {function} cb 回调函数
 * */
handler.LoadDataByDB = function (cb) {
    jsSql.LoadInfo(JJC_TABLE, this.owner.GetId(), function (err, data) {
        if (!!err) {
            logger.error('js player module init error： %j', utils.getErrorMessage(err));
            return cb(err);
        }
        return cb(null, data);
    });
};

/**
 * 保存数据到数据库
 * */
handler.SaveToDB = function (owner) {

    var data = this.data;
    var deferred = Q.defer();

    if (!data.IsDirty()) {
        return Q.resolve(owner);
    }
    jsSql.SaveInfo(JJC_TABLE, owner.GetId(), data.GetSqlStr(), function (err) {
        if (!!err) {
            logger.error('js player module init error： %j', utils.getErrorMessage(err));
        }

        /** 标记数据为干净数据*/
        data.RemarkDirty();

        return deferred.resolve(owner);
    });

    return deferred.promise;
};

/**
 * 干架获胜
 *
 * @param {Number} type 战斗类型
 * @param {Object} other 其他玩家
 * @api public
 * */
handler.win = function (type, other) {

    var data = this.data;

    var addCoin = 0;
    var addCredits = 0;
    var streakingCoin = 0;
    var streakingCredits = 0;

    if (type == eRoundType.Battle) {
        /** 添加获胜场次 和总次数*/
        data.SetJJCInfo(eJJCInfo.WINNUM, data.GetJJCInfo(eJJCInfo.WINNUM) + 1);
        data.SetJJCInfo(eJJCInfo.TOTALNUM, data.GetJJCInfo(eJJCInfo.TOTALNUM) + 1);

        /**连胜次数加1 */
        data.SetJJCInfo(eJJCInfo.Streaking, data.GetJJCInfo(eJJCInfo.Streaking) + 1);

        /** 连胜超过历史 修改*/
        if (data.GetJJCInfo(eJJCInfo.Streaking) > data.GetJJCInfo(eJJCInfo.MaxStreaking)) {
            data.SetJJCInfo(eJJCInfo.MaxStreaking, data.GetJJCInfo(eJJCInfo.Streaking));
        }

        addCoin = 0; //jjcMedalTMgr.GetWinJJCCoinByCredits(data.GetJJCInfo(eJJCInfo.CREDIS));
        addCredits = jjcMedalTMgr.GetWinCreditsByCredits(data.GetJJCInfo(eJJCInfo.CREDIS));
        streakingCoin = 0;//data.GetStreakingAddCoin();
        streakingCredits = data.GetStreakingAddCredits();

        /** 添加获胜竞技币*/
        data.SetJJCInfo(eJJCInfo.JjcCoin, data.GetJJCInfo(eJJCInfo.JjcCoin) + addCoin + streakingCoin);

        /**添加获胜积分*/
        this.changerCredits(addCredits + streakingCredits);
    }
    var msg = {
        isSccuess: 1,
        credits: data.GetJJCInfo(eJJCInfo.CREDIS),
        streaking: data.GetJJCInfo(eJJCInfo.Streaking),
        addCoin: addCoin,
        addCredits: addCredits,
        streakingCoin: streakingCoin,
        streakingCredits: streakingCredits
    };
    var route = 'ServerBattleEndStats';

    this.SendMessage(route, msg);

    /** 判断自己连胜纪录*/
    var streaking = data.GetJJCInfo(eJJCInfo.Streaking);
    if (streaking >= defaultValues.JJC_GM_NOTICE_MIN_TIMES) {
        //公告
        var noticeID = "jjc_win_over_5";
        this.owner.GetNoticeManager().SendJJCWinOverFire(gameConst.eGmType.JJC, noticeID, streaking);
    }

    /** 判断他人连胜纪录*/
    var otherStreaking = other.GetRoleJJCManager().GetData().GetJJCInfo(eJJCInfo.Streaking);
    if (otherStreaking >= defaultValues.JJC_GM_NOTICE_MIN_TIMES) {
        var noticeID = "jjc_lose_over_5";
        var otherName = other.playerInfo[gameConst.ePlayerInfo.NAME];
        this.owner.GetNoticeManager().SendJJCWinOverFire(gameConst.eGmType.JJC, noticeID, otherStreaking, otherName);
    }

};

/**
 * 干架没打赢
 *
 * @param {Number} type 战斗类型
 * @param {Object} other 其他玩家
 * @api public
 * */
handler.fail = function (type, other) {

    var data = this.data;

    var addCoin = 0;
    var deleteCredits = 0;

    if (type == eRoundType.Battle) {

        /** 添加总次数*/
        data.SetJJCInfo(eJJCInfo.TOTALNUM, data.GetJJCInfo(eJJCInfo.TOTALNUM) + 1);

        /**连胜次数清零 */
        data.SetJJCInfo(eJJCInfo.Streaking, 0);

        addCoin = 0; //jjcMedalTMgr.GetFailJJCCoinByCredits(data.GetJJCInfo(eJJCInfo.CREDIS));
        deleteCredits = -jjcMedalTMgr.GetFailCreditsByCredits(data.GetJJCInfo(eJJCInfo.CREDIS));

        /** 添加失败竞技币*/
        data.SetJJCInfo(eJJCInfo.JjcCoin, data.GetJJCInfo(eJJCInfo.JjcCoin) + addCoin);

        /**添加失败积分*/
        this.changerCredits(deleteCredits);
    }
    var msg = {
        isSccuess: 0,
        credits: data.GetJJCInfo(eJJCInfo.CREDIS),
        streaking: data.GetJJCInfo(eJJCInfo.Streaking),
        addCoin: addCoin,
        addCredits: deleteCredits,
        streakingCoin: 0,
        streakingCredits: 0
    };

    var route = 'ServerBattleEndStats';

    this.SendMessage(route, msg);
};

/**
 * @Brief: 向客户端发送消息
 *
 * @param {String} route 消息号
 * @param {Object} msg 消息体
 * */
handler.SendMessage = function (route, msg) {
    this.owner.SendMessage(route, msg);
};

/**
 * Brief: 玩家战斗结束 从cs 发回的战斗结果
 *
 * */
handler.BattleOver = function () {
    var roleID = this.owner.GetId();

    /** 如果回合存在 默认失败处理*/
    if (!this.roundID) {
        logger.error('jjc battle over but role(roleID: %d) not roundID', roleID);
        return;
    }

    var round = jjcManager.getRoundByID(this.roundID);

    if (!round) {
        logger.error('jjc battle over but role(roleID: %d) not round', roleID);
        return;
    }

    if (!round.IsHavePlayer(roleID)) {
        logger.error('jjc battle over but role(roleID: %d) is not round role', roleID);
        return;
    }

    var self = this;
    round.battleOver(roleID)
        .catch(function (err) {
                   logger.error("error when Down battleOver default fail  %s", utils.getErrorMessage(err));
               })
        .finally(function () {
                     /** 删除战斗状态*/
                     jjcManager.deleteBattleType(roleID);
                     return self.SaveToDB(self.owner);
                 })
        .done();
};

/**
 * 修改玩家积分 特殊添加， 以为需要修改redis 积分排行榜
 * @param {number} value change value
 * @api public
 * */
handler.changerCredits = function (value) {
    var data = this.data;

    if (value < 0) {
        return;
    }
    /** 值修改*/
    var total = data.GetJJCInfo(eJJCInfo.CREDIS) + value;
    data.SetJJCInfo(eJJCInfo.CREDIS, total);

    /** 添加到 redis*/
    this.addCreditsToRedis(total);
};

/**
 * @添加数据到redis
 *
 * @param {Number} total
 * */
handler.addCreditsToRedis = function (total) {
    /** 添加到 redis*/
    var data = this.data;
    var roleID = this.owner.GetId();


    var jjcInfo = roleJjcInfoFactory.buildInfoToRedis(roleID, data);
    var client = redisManager.getClient(eRedisClientType.Chart);
    client.zAdd(redisManager.getZSetName(), roleID, total, function (err, count) {
        if (!!err) {
            logger.error('jjc add credits addCreditsToRedis: %s', utils.getErrorMessage(err));
        }
    });


    client.hSet(redisManager.getJJCInfoZSetName(), roleID, JSON.stringify(jjcInfo), function (err) {
        if (!!err) {
            logger.error('jjc add credits addCreditsToRedis: %s', utils.getErrorMessage(err));
        }
    });

};

/**
 * 获取玩家界面显示信息
 * @param {function} cb 回调函数
 * @api public
 * */
handler.GetShowMainMessage = function (cb) {
    var self = this;
    var data = this.data;
    var roleID = this.owner.GetId();
    /** 添加到 redis*/
    var client = redisManager.getClient(eRedisClientType.Chart).client;

    /** 检查是否是当前期数 不是重置玩家信息*/
    if (!self.data.CheckIsCurPhase()) {
        self.data.Insert(roleJjcInfoFactory.createDefaultInfo(self.owner));
        self.addCreditsToRedis(self.data.GetJJCInfo(eJJCInfo.CREDIS));
    }

    /** 绑定相关方法 用于流程控制*/
    var zRevRank = Q.nbind(client.zrevrank, client);
    var hGet = Q.nbind(client.hget, client);

    var jobs = [
        zRevRank(redisManager.getZSetName(), roleID),
        hGet(redisManager.getRoleInfoSetName(), roleID)
    ];

    Q.all(jobs)
        .then(function (datas) {
                  if (!datas || !datas[1]) {
                      cb(errorCodes.JJC_REDIS_NO_DATA);
                  }

                  var roleInfo = JSON.parse(datas[1]);
                  var rank = null == datas[0] ? 0 : (datas[0] || 0) + 1;

                  var mainInfo = roleJjcInfoFactory.buildMainPageInfo(rank, data);
                  mainInfo['myInfo'] = roleJjcInfoFactory.buildPersonShowInfo(rank, data, roleInfo);
                  cb(null, mainInfo);
              })
        .catch(function (err) {
                   logger.error("JJC GetShowMainMessage %d, %s", roleID, utils.getErrorMessage(err));
                   return cb(err);
               })
        .done();

};

/**
 * @Brief 获取玩家个人显示信息
 *
 * @api public
 * */
handler.GetPersonMessage = function () {

    var deferred = Q.defer();
    var data = this.data;
    var roleID = this.owner.GetId();
    /** 添加到 redis*/
    var client = redisManager.getClient(eRedisClientType.Chart).client;

    /** 绑定相关方法 用于流程控制*/
    var zRank = Q.nbind(client.zrank, client);
    var hGet = Q.nbind(client.hget, client);

    var jobs = [
        zRank(redisManager.getZSetName(), roleID),
        hGet(redisManager.getRoleInfoSetName(), roleID)
    ];

    Q.all(jobs)
        .then(function (datas) {
                  if (!datas || !datas[1]) {
                      return deferred.reject(errorCodes.JJC_REDIS_NO_DATA);
                  }

                  var roleInfo = JSON.parse(datas[1]);
                  var rank = null == datas[0] ? 0 : (datas[0] || 0) + 1;

                  var personInfo = roleJjcInfoFactory.buildPersonShowInfo(rank, data, roleInfo);
                  return deferred.resolve(personInfo);
              })
        .catch(function (err) {
                   logger.error("JJC GetPersonMessage %d, %s", roleID, utils.getErrorMessage(err));
                   return deferred.reject(err);
               })
        .done();

    return deferred.promise;

};

/**
 * @Brief: 获取本服排行榜奖励
 *
 * @param {Function} cb 回调函数
 * @return {number}
 * */
handler.GetRankingReward = function (cb) {
    var self = this;
    var roleID = this.owner.GetId();
    var data = this.data;
    /** 添加到 redis*/
    var client = redisManager.getClient(eRedisClientType.Chart).client;

    if (data.IsGetReward()) {
        // 你已经领取过该奖励了
        return cb(null,errorCodes.JJC_HAS_GET_REWARD);
    }

    /** 绑定相关方法 用于流程控制*/
    var zRevRank = Q.nbind(client.zrevrank, client);

    var jobs = [
        zRevRank(redisManager.getPreZSetName(), roleID)
    ];

    Q.all(jobs)
        .then(function (datas) {

                  if (null == datas) {
                      return cb(null, errorCodes.JJC_REDIS_NO_DATA);
                  }

                  var rank = +(datas || 0) + 1;
                  var temp = jjcRewardTMgr.GetTempByRank(rank, utils.getPreMonthOfYear(new Date()));
                  if (!temp) {
                      logger.error('GetRankingReward get template null rank: %d, roleID: %d', rank, roleID);
                      return cb(null, errorCodes.JJC_RANK_CAN_NOT_GET_REWARD);
                  }

                  var csID = self.owner.GetPlayerCs();
                  /** 到cs给玩家添加奖励物品*/
                  pomelo.app.rpc.cs.jsRemote.JjcRankingReward(null, csID, roleID, rank, function (err, res) {
                      if (!!err || (!!res && res.result > 0)) {
                          logger.error('JjcRankingReward err: %s, res： %j', utils.getErrorMessage(err));
                          return cb(errorCodes.toClientCode(err));
                      }

                      /** 标识玩家领取时间记录*/
                      data.SetJJCInfo(eJJCInfo.LastRewardTime, utils.getCurMinute());
                      res['preRanking'] = rank;
                      return cb(null, res);
                  });
              })
        .catch(function (err) {
                   logger.error("JJC GetRankingReward %d, %s", roleID, utils.getErrorMessage(err));
                   return cb(err);
               })
        .done();
};

/**
 * @Brief: 获取每日奖励
 *
 * @param {Function} cb 回调函数
 * @return {number}
 * */
handler.GetDayReward = function (cb) {
    var self = this;
    var roleID = this.owner.GetId();
    var data = this.data;

    /**　检查是否完成今日挑战*/
    if (!data.IsFinishDayBattle()) {
        return cb(null, errorCodes.JJC_NOT_FINISH_DAY_BATTLE);
    }

    /** 检查是否领取过奖励*/
    if (data.IsGetDayReward()) {
        // 你已经领取过该奖励了
        return cb(null, errorCodes.JJC_HAS_GET_REWARD);
    }

    /** 根据积分获取奖励模板*/
    var credits = data.GetJJCInfo(eJJCInfo.CREDIS);
    var temp = jjcDayRewardTMgr.GetTempByCredits(credits);
    if (!temp) {
        logger.error('GetDayReward get template null credits: %d, roleID: %d', credits, roleID);
        return cb(null, errorCodes.JJC_NOT_FINISH_DAY_BATTLE);
    }

    var csID = self.owner.GetPlayerCs();
    /** 到cs给玩家添加奖励物品*/
    pomelo.app.rpc.cs.jsRemote.JjcDayReward(null, csID, roleID, credits, function (err, res) {
        if (!!err || (!!res && res.result > 0)) {
            logger.error('GetDayReward err: %s, res： %j', utils.getErrorMessage(err));
            return cb(errorCodes.toClientCode(err));
        }

        /** 标识玩家每日领取时间记录*/
        data.SetJJCInfo(eJJCInfo.LastDayRewardTime, utils.getCurMinute());
        return cb(null, res);
    });
};

/**
 * 是否是当前期数， 当月排行榜
 * */
handler.isCurPhase = function () {
    return utils.getMonthOfYear2(new Date()) == this.GetJJCInfo(eJJCInfo.Phase);
};

/**
 * @Brief: 请求匹配
 *
 * @return {number}
 * */
handler.requestBattle = function () {

    var owner = this.owner;
    var roleID = owner.GetId();
    var data = this.data;

    if (!jjcManager.isStartBattle()) {
        return errorCodes.JJC_UN_START;
    }

    /** 检查玩家的战斗状态*/
    var result = jjcManager.checkBattleType(roleID);

    if (result != errorCodes.OK) {
        return result;
    }

    /** 判断是否有可战斗次数*/
    if (data.GetReBattleTimes() <= 0) {
        return errorCodes.JJC_NOT_IN_MATCHING;
    }

    /** 添加战斗状态*/
    jjcManager.addBattleType(roleID, BATTLE_TYPE.MATCHING);
    /** 添加匹配*/
    jjcManager.requestBattle(owner);

    return errorCodes.OK;
};

/**
 * @Brief: 添加回合ID;
 *
 * @param {Number} roundID 回合ID
 * */
handler.AddRoundID = function (roundID) {
    this.roundID = roundID
};

/**
 * @Brief: 取消战斗请求
 *
 * @param {Number} type 类型
 * @param {Function} cb 回调函数
 * @return {number}
 * */
handler.breakRequireBattle = function (type, cb) {

    var roleID = this.owner.GetId();
    var data = this.data;

    /*   if (type == eRankingRewardType.LOCAL && !jjcManager.isStartBattle()) {
     return cb(errorCodes.JJC_UN_START);
     }*/

    /** 检查玩家是否正在匹配*/
    if (!jjcManager.checkIsMatching(roleID)) {
        return cb(null,{result :errorCodes.JJC_NOT_IN_MATCHING});
    }

    /** 判断是否有可战斗次数*/
    /*  if (data.GetReBattleTimes() <= 0) {
     return cb(errorCodes.JJC_NOT_IN_MATCHING);
     }*/

    /** 添加匹配*/
    jjcManager.breakRequestBattle(type, roleID);

    /** 删除战斗状态*/
    jjcManager.deleteBattleType(roleID);

    return cb(null, {result: errorCodes.OK});
};

/**
 * @ 获取竞技场数据
 *
 * @return {Object}
 * */
handler.GetData = function () {
    return this.data;
};

/**
 * @Brief: 请求练习匹配
 *
 * @return {number}
 * */
handler.requestPracticeBattle = function () {

    var owner = this.owner;
    var roleID = owner.GetId();

    /** 检查玩家的战斗状态*/
    var result = jjcManager.checkBattleType(roleID);

    if (result != errorCodes.OK) {
        return result;
    }

    /** 添加战斗状态*/
    jjcManager.addBattleType(roleID, BATTLE_TYPE.MATCHING);

    /** 添加匹配*/
    jjcManager.requestPracticeBattle(owner);

    return errorCodes.OK;
};

/**
 * @Brief: 获取本服排行榜奖励
 *
 * @param {Function} cb 回调函数
 * @return {number}
 * */
handler.GetThreeShow = function (cb) {

    var roleID = this.owner.GetId();

    /** 添加到 redis*/
    var client = redisManager.getClient(eRedisClientType.Chart).client;
    var zRevRange = Q.nbind(client.zrevrange, client);

    var jobs = [
        zRevRange(redisManager.getPreZSetName(), 0, 2, 'WITHSCORES')
    ];

    var showInfo = {};

    Q.all(jobs)
        .then(function (datas) {

                  if (null == datas) {
                      showInfo['firstID'] = 0;
                      showInfo['secondID'] = 0;
                      showInfo['thirdID'] = 0;
                  } else {
                      /** 获取前三名数据*/
                      showInfo['firstID'] = !!datas[0] ? datas[0] : 0;
                      showInfo['secondID'] = !!datas[2] ? datas[2] : 0;
                      showInfo['thirdID'] = !!datas[4] ? datas[4] : 0;
                  }
                  cb(null, showInfo)
              })
        .catch(function (err) {
                   logger.error("JJC GetThreeShow %d, %s", roleID, utils.getErrorMessage(err));
                   return cb(err);
               })
        .done();
};

/**
 * @Brief: 请求jjc vip 购买次数信息
 *
 * @return {number}
 * */
handler.getBugTimesInfo = function (cb) {

    var owner = this.owner;
    var data = this.data;
    var vipLevel = owner.GetPlayerInfo(ePlayerInfo.VipLevel);

    var vipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }

    if (null == vipTemplate) {
        return cb(errorCodes.SystemWrong);
    }

    var shopTimes = data.GetVipBugTimes();
    var totalShopTimes = vipTemplate['buySyncPVPNum'];

    if (shopTimes > totalShopTimes) {
        return cb(errorCodes.JJC_USED_UP_VIP_SHOP_TIMES);
    }

    var result = {
        reTimes: totalShopTimes - shopTimes,
        price: vipTemplate['buySyncPVPPrice']
    };
    return cb(null, result);
};

/**
 * @Brief: 请求jjc vip 购买次数
 *
 * @return {number}
 * */
handler.getBugTimes = function (cb) {

    var owner = this.owner;
    var data = this.data;
    var roleID = this.owner.GetId();
    var vipLevel = owner.GetPlayerInfo(ePlayerInfo.VipLevel);

    var vipTemplate = null;

    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }

    if (null == vipTemplate) {
        return cb(errorCodes.SystemWrong);
    }

    var shopTimes = data.GetVipBugTimes();
    var totalShopTimes = vipTemplate['buySyncPVPNum'];

    if (shopTimes >= totalShopTimes) {
        return cb(errorCodes.JJC_USED_UP_VIP_SHOP_TIMES);
    }

    var csID = this.owner.GetPlayerCs();
    /** 扣除玩家砖石*/
    pomelo.app.rpc.cs.jsRemote.ShopBattleTimes(null, csID, roleID, vipTemplate['buySyncPVPPrice'], function (err, res) {
        if (!!err) {
            return cb(errorCodes.toClientCode(err));
        }

        /** 添加购买次数*/
        data.SetJJCInfo(eJJCInfo.VipBugTimes, data.GetJJCInfo(eJJCInfo.VipBugTimes) + 1);
        return cb(null, {result: errorCodes.OK});
    });
};



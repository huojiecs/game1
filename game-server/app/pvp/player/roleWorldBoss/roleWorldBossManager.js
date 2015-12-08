/**
 * Created with JetBrains WebStorm.
 * User: wangwenping
 * Date: 15-07-02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../../tools/constValue');
var globalFunction = require('../../../tools/globalFunction');
var utilSql = require('../../../tools/mysql/utilSql');
var utils = require('../../../tools/utils');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var worldBossManager = require('./../../worldBoss/worldBossManager');
var playerManager = require('../../../pvp/player/playerManager');
var pvpRedisManager = require('../../redis/pvpRedisManager');
var errorCodes = require('../../../tools/errorCodes');
var Q = require('q');
var _ = require('underscore');
var defaultValues = require('../../../tools/defaultValues');
var tNotice = templateConst.tNotice;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eRedisClientType = gameConst.eRedisClientType;
var tBossReward = gameConst.tBossReward;
var eWorldBoss = gameConst.eWorldBossInfo;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
};
var handler = Handler.prototype;


/**加载数据*/
handler.Init = function (owner) {
    var self = this;

    self.attATTACK = 0;
    self.nowWorldBossDamage = 0;

    worldBossManager.GetPlayerDamageByID(owner.getID(), function (err, playerChart) {
        self.nowWorldBossDamage = playerChart['myScore'];
        self.SendWorldBossMsg();

    });
    return Q.resolve(owner);
};
handler.SendWorldBossMsg = function () {
    var self = this;
    if (null == self.owner) {
        logger.error('SendWorldBossMsg玩家是空的');
        return;
    }
    var route = "ServerLoginWorldBoss";

    var worldBossMsg = {
        result: errorCodes.OK,
        countDownTime: worldBossManager.DistanceBeginTime()
    };
    self.owner.SendMessage(route, worldBossMsg);
};
handler.GetPlayerDamage = function () {
    return this.nowWorldBossDamage;
};
handler.SetPlayerDamage = function (damageValue) {
    this.nowWorldBossDamage = damageValue;
};
handler.GetAttATTACK = function () {
    return this.attATTACK;
};
handler.SetAttATTACK = function (attackValue) {
    this.attATTACK = attackValue;
};

handler.ClickWorldBoss = function (roleID, callback) {
    var self = this;
    var openTimes = _.keys(worldBossManager.GetWorldBossTimes());
    var msg = {
        timeState: worldBossManager.GetTimesState(),//活动时间段状态 0 未开启 1 开启中 2为已经 
        myRank: 0,
        myDamage: 0,
        prideID: 0,
        bossID: worldBossManager.GetBossInfo(eWorldBoss.BossID),
        nextCountDownTime: self.GetCountDownTime(worldBossManager.GetTimesState(), openTimes) //下次boss战倒计时
    };
    worldBossManager.GetPlayerDamageByID(roleID, function (err, playerChart) {
        if (!!err) {
            logger.error('ERROR! ClickWorldBoss error: %j',
                utils.getErrorMessage(err));
            return callback(err);
        }
        msg.myRank = playerChart['myChartID'];
        msg.myDamage = playerChart['myScore'];
        if(msg.myRank == 0) {
            msg.prideID = 0;
        } else {
            msg.prideID = worldBossManager.GetPrideByRank(msg.myRank);
        }
        var worldBossMsg = {
            result: errorCodes.OK,
            bossInfo: msg
        };
        return callback(null, worldBossMsg);
    });
};

handler.GetCountDownTime = function (timeStateList, timeAttList) {
    var nowDate = utils.getCurTime();
    var bossTemplate = null;
    var beginTime = 0;
    var startTime = 0;
    var countDownTime = 0;
    if (-1 == timeStateList.indexOf(1)) {
        if(-1 == timeStateList.lastIndexOf(2)){
            bossTemplate = worldBossManager.GetBossOpenTemplateByID(parseInt(timeAttList[0]));
            beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
            startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
            countDownTime = new Date(startTime).getTime() - nowDate;
        }else if(timeStateList.lastIndexOf(2) == (timeStateList.length-1)) {
            bossTemplate = worldBossManager.GetBossOpenTemplateByID(parseInt(timeAttList[0]));
            beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
            startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
            countDownTime = defaultValues.WORLD_BOSS_COUNTDOWN + new Date(startTime).getTime() - nowDate;
        } else {
            bossTemplate = worldBossManager.GetBossOpenTemplateByID(parseInt(timeAttList[timeStateList.lastIndexOf(2) +1]));
            beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
            startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
            countDownTime = defaultValues.WORLD_BOSS_COUNTDOWN + new Date(startTime).getTime() - nowDate;
        }       
    } else {
        bossTemplate = worldBossManager.GetBossOpenTemplateByID(parseInt(timeAttList[timeStateList.indexOf(1)]));
        beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
        startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
        var delayTime = bossTemplate[templateConst.tBossOpenList.delayTime];
        countDownTime = new Date(startTime).getTime() + delayTime * 1000 - nowDate;
    }
    return Math.floor(countDownTime / 1000);
};
//进入关卡
handler.EnterBossFight = function (roleID, callback) {
    var self = this;    
    var fightMsg = {
        npcID: worldBossManager.GetBossInfo(eWorldBoss.NpcID),
        curHpPercent: worldBossManager.GetCurBossHpPercent(),
        myRank: 0,
        myDamage: 0,
        topFiveRankList: [],
        prePlayerName:null,
        prePlayerRank:0,
        prePlayerDamage:0
    };
    self.GetWorldBossChart(roleID, function (err, chartInfo) {
        if (!!err) {
            logger.error('ERROR! GetWorldBossChart error: %j',
                utils.getErrorMessage(err));
            return;
        }
        fightMsg.myRank = chartInfo['myChartID'];
        fightMsg.myDamage = chartInfo['myScore'];
        fightMsg.topFiveRankList = chartInfo['rankList'];

        self.OverStepPlayer(fightMsg.myRank,function(err,prePlayer) {
            if(!!err) {
                logger.error('ERROR！OverStepPlayer error:%j',
                    utils.getErrorMessage(err));
                return;
            }
            if (null != prePlayer) {
                fightMsg.prePlayerName = prePlayer['roleName'];
                fightMsg.prePlayerRank = prePlayer['rank'];
                fightMsg.prePlayerDamage = prePlayer['damage'];
            }
            var bossMsg = {
                result: errorCodes.OK,
                fightInfo: fightMsg
            };
            return callback(null, bossMsg);
        });
    });
};
//worldBoss等级限制
handler.LevelLimit = function (player) {
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var needLevel = templateManager.GetTemplateByID('AllTemplate', 201);
    if (expLevel < needLevel) {
        return next(null, {
            'result': errorCodes.ExpLevel
        });
    }
};
/**获取玩家自己的排行和前5名*/
handler.GetWorldBossChart = function (roleID, callback) {
    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var zRevRank = Q.nbind(client.zrevrank, client);
    var zRevRange = Q.nbind(client.zrevrange, client);
    var zScore = Q.nbind(client.zscore, client);
    var hmGet = Q.nbind(client.hmget, client);

    var chartInfo = {
        myChartID: 0,
        myScore: 0,
        rankList: []
    };
    var scores = {};

    var jobs = [zRevRank(pvpRedisManager.getWorldBossSetName(), roleID), zScore(pvpRedisManager.getWorldBossSetName(), roleID)];

    Q.all(jobs)
        .spread(function (rank, score) {
            chartInfo['myScore'] = !!score ? parseInt(score) : 0;
            chartInfo['myChartID'] = !!score ? ((rank || 0) + 1) : 0;
            return zRevRange(pvpRedisManager.getWorldBossSetName(), 0, defaultValues.chartWorldBossTop - 1,
                'WITHSCORES');
        })
        .then(function (roleIDs) {
            var keys = [];
            for (var i = 0; i < roleIDs.length; i += 2) {
                keys.push(roleIDs[i]);
                scores[roleIDs[i]] = roleIDs[i + 1];
            }

            if (keys.length === 0) {
                return Q.resolve([]);
            }

            return hmGet(pvpRedisManager.getRoleInfoSetName(), keys);
        })
        .then(function (roles) {
            var rank = 0;
            var rankList = _.map(roles, function (role) {
                var newRole = JSON.parse(role);
                newRole.id = ++rank;
                newRole.worldBoss = scores[newRole.roleID];
                return {
                    id: newRole.id,
                    roleID: newRole.roleID,
                    name: newRole.name,
                    damage: parseInt(newRole.worldBoss)
                };
            });
            chartInfo['rankList'] = rankList;
            return callback(null, chartInfo);
        })
        .catch(function (err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return callback(err);
        })
        .done();
};
//下个档位的玩家
handler.OverStepPlayer = function (myRank,callback) {
    var prePlayer = {
        rank: 0,
        roleName: null,
        damage: 0
    };
    if (myRank > 1) {
        var rewardAllTemplate = worldBossManager.GetAllBossRewardTemplate();
        var preTemp = 0;
        for (var index in rewardAllTemplate) {
            var temp = rewardAllTemplate[index];
            var minRank = temp['minRank'];
            var maxRank = temp['maxRank'];
            if (myRank >= minRank && myRank <= maxRank) {
                preTemp = parseInt(index) -1;
                break;
            }
        }
        var preTemplate = worldBossManager.GetRewardTemplateByID(preTemp);
        if (null == preTemplate) {
            return callback(null,{'result':errorCodes.NoTemplate});
        }
        var preMaxRank = preTemplate['maxRank'];
        prePlayer.rank = preMaxRank;
        var roleID = 0;
        worldBossManager.GetWorldBossRankingList(prePlayer.rank-1,prePlayer.rank-1, function (err, chartInfo) {
            if (!!err) {
                logger.error('ERROR! worldBossGetChart error: %j',
                    utils.getErrorMessage(err));
                return;
            }
            roleID = chartInfo['roleIds'];
            var player = playerManager.GetPlayer(parseInt(roleID));
            if (null == player) {
                return callback(null,{'result':errorCodes.NoRole});;
            }
            prePlayer.roleName = player.GetPlayerInfo(ePlayerInfo.NAME);
            var roleScores = chartInfo['roleScores'];
            if (null != roleID) {
                prePlayer.damage = parseInt(roleScores[roleID]);
            }
            return callback(null,prePlayer);
        });
    } else {
        return callback(null,prePlayer);
    }
};
/**
 * 给玩家添加伤害
 * @param damage
 * @returns {*}
 * @constructor
 */
handler.AddPlayerDamage = function (damage,callback) {
    var self = this;
    if (_.values(worldBossManager.GetWorldBossTimes()).indexOf(1) == -1) {
        return callback(null,{'result':errorCodes.WORLD_BOSS_IS_END});
    }
    var curHp = worldBossManager.GetBossInfo(eWorldBoss.Hp) - damage;
    var addDamage = 0;
    if (curHp <= 0) {
        addDamage = worldBossManager.GetBossInfo(eWorldBoss.Hp)
    } else {
        addDamage = damage;
    }
    self.nowWorldBossDamage += addDamage;
    var roleInfo = {};
    roleInfo['roleID'] = self.owner.getID();
    roleInfo['damage'] = self.nowWorldBossDamage;

    worldBossManager.UpdatePlayerScore(roleInfo, utils.done);

    if (worldBossManager.UpdateCurHp(self.owner.getID(), addDamage) == false) {
        return callback(null,{'result':errorCodes.WORLD_BOSS_IS_END});
    } else {
        return callback(null,{'result':errorCodes.OK});
    }
};


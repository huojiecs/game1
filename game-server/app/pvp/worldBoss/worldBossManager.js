/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 15-7-01
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var pvpRedisManager = require('./../redis/pvpRedisManager');
var playerManager = require('./../player/playerManager')
var templateConst = require('../../../template/templateConst');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var util = require('util');
var utilSql = require('../../tools/mysql/utilSql');
var messageService = require('./../../tools/messageService');
var pvpSql = require('../../tools/mysql/pvpSql')
var errorCodes = require('../../tools/errorCodes');
var stringValue = require('../../tools/stringValue');
var worldBoss = require('./worldBoss');
var sPublicString = stringValue.sPublicString;
var sWorldBossString = stringValue.sWorldBossString;
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttFactor = gameConst.eAttFactor;
var eWorldBoss = gameConst.eWorldBossInfo;
var tBossOpenList = templateConst.tBossOpenList;
var tWorldBossNpc = templateConst.tWorldBossNpc;
var eRedisClientType = gameConst.eRedisClientType;
var tBossReward = templateConst.tBossReward;
var eWorldBossInfo = gameConst.eWorldBossInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var Q = require('q');
var _ = require('underscore');
var Handler = module.exports;

Handler.Init = function () {
    var deferred = Q.defer();
    var self = this;
    self.worldBoss = new Array(eWorldBossInfo.Max);
    for (var index = 0; index < eWorldBossInfo.Max; index++) {
        self.worldBoss[index] = 0;
    }
    pvpSql.LoadBossData(function (err, res) {
        if (err) {
            logger.error(utils.getErrorMessage(err));
            return deferred.reject(err);
        }
        if (_.isEmpty(res) == false) {
            self.worldBoss[eWorldBoss.BossID] = res['bossId'];
            self.worldBoss[eWorldBoss.NpcID] = res['npmId'];
            self.worldBoss[eWorldBoss.Hp] = res['hp'];
            self.worldBoss[eWorldBoss.LastRoleID] = res['lastRoleID'];
        }
        if (self.worldBoss[eWorldBoss.BossID] == 0 && utils.getCurTime() > self.GetFirstOpenTime()) {
            self.worldBoss[eWorldBoss.BossID] = self.CreateBoss();
            self.SaveWorldBossToDB();
        }
        self.bossTimesState = _.values(self.GetWorldBossTimes());
    });

    return deferred.promise;

};
Handler.GetBossInfo = function (index) {
    return this.worldBoss[index];
};
Handler.SetBossInfo = function (index, value) {
    return this.worldBoss[index] = value;
};
Handler.GetTimesState = function () {
    return this.bossTimesState;
};

//世界boss时间段状态
Handler.GetWorldBossTimes = function () {
    var openTimeTemplates = this.GetAllBossOpenTemplate();
    if (null == openTimeTemplates) {
        return errorCodes.SystemWrong;
    }
    var timeState = {};
    var nowDate = new Date();
    var curTime = utils.getCurTime();
    for (var index in openTimeTemplates) {
        var temp = openTimeTemplates[index];
        var attID = temp[tBossOpenList.attID];
        var beginTime = temp[tBossOpenList.beginTime];
        var delayTime = temp[tBossOpenList.delayTime];
        var startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
        var endTime = new Date(startTime).getTime() + delayTime * 1000;
        if (nowDate <= new Date(startTime)) {
            timeState[attID] = 0;
        }
        if (nowDate >= new Date(startTime) && curTime < endTime) {
            timeState[attID] = 1;
        }
        if (curTime > endTime) {
            timeState[attID] = 2;
        }
    }
    return timeState;
};
/**距离当前boss倒计时*/
Handler.DistanceBeginTime = function () {
    var self = this;
    var nowTime = utils.getCurTime();
    var timeStas = self.GetTimesState();
    var timeAtts = _.keys(self.GetWorldBossTimes());
    var bossTemplate = null;
    var beginTime = 0;
    var startTime = 0;
    var countBeginTime = 0;
    if (-1 == timeStas.indexOf(1)) {
        if(-1 == timeStas.lastIndexOf(2)){
            bossTemplate = self.GetBossOpenTemplateByID(parseInt(timeAtts[0]));
            beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
            startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
            countBeginTime = new Date(startTime).getTime() - nowTime;
        }else if(timeStas.lastIndexOf(2) == (timeStas.length-1)) {
            bossTemplate = self.GetBossOpenTemplateByID(parseInt(timeAtts[0]));
            beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
            startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
            countBeginTime = defaultValues.WORLD_BOSS_COUNTDOWN + new Date(startTime).getTime() - nowTime;
        } else {
            bossTemplate = self.GetBossOpenTemplateByID(parseInt(timeAtts[timeStas.lastIndexOf(2) +1]));
            beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
            startTime = utils.GetDateNYR(new Date()) + " " + beginTime;
            countBeginTime = defaultValues.WORLD_BOSS_COUNTDOWN + new Date(startTime).getTime() - nowTime;
        }
    }
    return Math.floor(countBeginTime / 1000);
};
Handler.GetFirstOpenTime = function () {
    var self = this;
    var timeAtts = _.keys(self.GetWorldBossTimes());
    var bossTemplate = self.GetBossOpenTemplateByID(parseInt(timeAtts[0]));
    var beginTime = bossTemplate[templateConst.tBossOpenList.beginTime];
    var startTime = new Date(utils.GetDateNYR(new Date()) + " " + beginTime).getTime();
    return startTime;
};

//12点更新 
Handler.WorldBossUpdate12Info = function () {
    var self = this;
    pvpSql.DelBossData(function (err, res) {

    });
    self.ClearWorldBoss();
    self.worldBoss[eWorldBossInfo.BossID] = 0;
    self.worldBoss[eWorldBossInfo.NpcID] = 0;
    self.worldBoss[eWorldBossInfo.Hp] = 0;
    self.bossTimesState = _.values(self.GetWorldBossTimes());
};
/**boss战开启*/
Handler.CreateBossFight = function(attID) {
    var self = this;
    var openAttIds = _.keys(self.GetWorldBossTimes());
    var index = openAttIds.indexOf(attID);
    self.SendNotice();  //发送世界boss开启公告
    
    self.ClearWorldBoss();  //清除redis数据
    for (var playerID in playerManager.GetAllPlayer()) { //在线玩家缓存
        var player = playerManager.GetPlayer(playerID);
        var roleWorldBossManager = player.GetRoleWorldBossManager();
        roleWorldBossManager.SetPlayerDamage(0);
    }
    
    setTimeout(function () {
        if(index == 0) {
            self.worldBoss[eWorldBossInfo.BossID] = self.CreateBoss();
        }
        //先初始化
        if(self.bossTimesState[index] >= 1) {
            return;
        }
        self.bossTimesState[index] = 1;
        self.GetNpmIndex(function (err, npcIndex) {
            self.worldBoss[eWorldBossInfo.NpcID] = npcIndex;
            self.BuildBossInfo();
            self.SaveWorldBossToDB();
        });
    }, defaultValues.WORLD_BOSS_NOTICE);
};
/**boss战结束*/
Handler.EndBossFight = function(attID) {
    var self = this;
    var endAttIds = _.keys(self.GetWorldBossTimes());
    var index = endAttIds.indexOf(attID);
    if (self.bossTimesState[index] == 1) {
        self.bossTimesState[index] = 2;
        self.WorldBossEnd(0,null);
    }
};
Handler.WorldBossEnd = function (isDead,lastRoleID) {
    var self = this;
    var lastName = "";
    if (null != lastRoleID) {
        var lastPlayer = playerManager.GetPlayer(lastRoleID);
        lastName = lastPlayer.GetPlayerInfo(ePlayerInfo.NAME);
        
        //公告
        lastPlayer.GetNoticeManager().SendRepeatableGM(gameConst.eGmType.WorldBoss, 'worldboss_2');
    }
    var route = 'ServerBossFightEnd';
    var msg = {
        bossEndReason: errorCodes.WORLD_BOSS_TIMEOUT,
        lastRole: lastName,
        isLastSword: 0,
        myRank: 0,
        myDamage: 0,
        prideID: 0
    };
    if (isDead == 1) {
        msg.bossEndReason = errorCodes.WORLD_BOSS_DEAD
    }
    var playerList = playerManager.GetAllPlayer();//获取当前所有的在线玩家           
    _.each(playerList, function (tempPlayer) {

        var index = tempPlayer.GetPlayerInfo(ePlayerInfo.ROLEID);
        
        self.GetPlayerDamageByID(index, function (err, playerChart) {
            if (!!err) {
                logger.error('ERROR! SendMessage error: %j',
                    utils.getErrorMessage(err));
                return callback(err);
            }
            msg.myRank = playerChart['myChartID'];
            msg.myDamage = playerChart['myScore'];
            msg.prideID = self.GetPrideByRank(msg.myRank);
            if(lastRoleID == index) {
                msg.isLastSword = 1;
            } else {
                msg.isLastSword = 0;
            }
            var endInfo = {
                'result':errorCodes.OK,
                'fightEndInfo':msg
            };
            tempPlayer.SendMessage(route, endInfo);
        });
    });
    //发奖
    setTimeout(function () {
        self.RewardByChart();
        if (null != lastRoleID) {
            //最后一刀发奖
            self.SendLastSwordMail(self.worldBoss[eWorldBossInfo.LastRoleID]);
            self.SetBossInfo(eWorldBoss.LastRoleID, 0);
        }
    }, defaultValues.WORLD_BOSS_REWARD_TIME);
   
};
/**根据排行获取奖励ＩＤ*/
Handler.GetPrideByRank = function (rank) {
    var rewardTemplate = this.GetAllBossRewardTemplate();
    var rewardID = 0;
    for (var id in rewardTemplate) {
        var temp = rewardTemplate[id];
        var minRank = temp[templateConst.tBossReward.minRank];
        var maxRank = temp[templateConst.tBossReward.maxRank];
        if (rank >= minRank && rank <= maxRank) {
            rewardID = temp[templateConst.tBossReward.attID];
            break;
        }
    }
    return rewardID;
};
Handler.GetPlayerDamageByID = function (roleID, callback) {
    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;

    var zRevRank = Q.nbind(client.zrevrank, client);
    var zScore = Q.nbind(client.zscore, client);

    var chartInfo = {
        myChartID: 0,
        myScore: 0
    };
    var jobs = [zRevRank(pvpRedisManager.getWorldBossSetName(), roleID), zScore(pvpRedisManager.getWorldBossSetName(), roleID)];
    Q.all(jobs)
        .spread(function (rank, score) {
            chartInfo['myScore'] = !!score ? parseInt(score) : 0;
            chartInfo['myChartID'] = !!score ? ((rank || 0) + 1) : 0;
            return callback(null, chartInfo);
        })
        .catch(function (err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return callback(err);
        })
        .done();

};

Handler.UpdateCurHp = function (lastRoleID, value) {
    var self = this;
    if (self.worldBoss[eWorldBoss.Hp] <= 0) {
        return false;
    }
    self.SetBossInfo(eWorldBoss.LastRoleID, lastRoleID);
    self.worldBoss[eWorldBoss.Hp] -= value;
    
    if (self.worldBoss[eWorldBoss.Hp] <= 0) {
        var i = self.bossTimesState.indexOf(1);
        self.bossTimesState[i] = 2;
        self.WorldBossEnd(1,self.GetBossInfo(eWorldBossInfo.LastRoleID));
    }
    return true;
};
/**获得boss当前的血条*/
Handler.GetCurBossHpPercent = function () {
    var self = this;
    var curHp = self.worldBoss[eWorldBoss.Hp];//最大血量
    return curHp;
};

/**
 * 根据前N名玩家的战力随机出npcID
 * @param callback
 * @constructor
 */
Handler.GetNpmIndex = function (callback) {
    pomelo.app.rpc.chart.chartRemote.GetChart(null, 0, gameConst.eChartType.Zhanli, function (err, myChartID, rankList) {
        if (!!err) {
            logger.error('get zhanli error: %s', utils.getErrorMessage(err));
            return;
        }

        var allTemplate = templateManager.GetTemplateByID('AllTemplate', 200);
        if (allTemplate == null) {
            return;
        }
        var zhanli = 0;
        var num = 0;
        var maxRank = parseInt(allTemplate['attnum']);
        for (var i in rankList) {
            if (rankList[i].id <= maxRank) {
                ++num;
                zhanli += parseInt(rankList[i].zhanli);
            }
        }

        if (num <= 0) {
            return;
        }

        var powerful = Math.floor(zhanli / num);

        var worldBossNpcTemplate = templateManager.GetAllTemplate('WorldBossNpcTemplate');
        if (worldBossNpcTemplate == null) {
            return;
        }

        var index = 0;
        for (var i in worldBossNpcTemplate) {
            if (powerful >= worldBossNpcTemplate[i]['rankLow'] && powerful <= worldBossNpcTemplate[i]['rankHigh']) {
                index = parseInt(i);
                break;
            }
        }

        if (worldBossNpcTemplate[index] == null) {
            return;
        }

        logger.fatal('worldBoss fight created by npc mode  npcID is %j', index);
        return callback(null, index);
    });
};

/**
 * 每日第一次活动开始随机出当天的boss
 * @returns {Number}
 * @constructor
 */
Handler.CreateBoss = function () {
    var self = this;
    var bossWeightList = self.GetBossWeightList();
    var bossIds = _.keys(bossWeightList);
    var bossWeights = _.values(bossWeightList);
    var index = self.GetRandomBossIndex(bossWeights);
    var worldBossID = parseInt(bossIds[index]);
    return worldBossID;
};
/**获取所有随机boss权重数组*/
Handler.GetBossWeightList = function () {
    var self = this;
    var bossWeightList = {};
    var allBossTemplate = self.GetAllBossTemplate();

    for (var bossId in allBossTemplate) {
        var temp = allBossTemplate[bossId];
        var bossAttID = temp[templateConst.tWorldBoss.attID];
        var bossWeight = temp[templateConst.tWorldBoss.weight];
        bossWeightList[bossAttID] = bossWeight;
    }

    return bossWeightList;
};
/**根据权重数组获得奖励下标*/
Handler.GetRandomBossIndex = function (bossWeights) {
    var min = 1;
    var max = defaultValues.RandomNum;

    var rand = utils.randomAtoB(min, max);
    var index = 0; //概率下标
    for (var i = 0; i < bossWeights.length; i++) {
        if (rand <= bossWeights[i]) {
            index = i;
            break;
        }
        rand = rand - bossWeights[i];
    }

    return index;
};

/**封装boss对象*/
Handler.BuildBossInfo = function () {
    var self = this;
    var bossNpcTemplate = self.GetBossNpcTemplateByID(self.worldBoss[eWorldBossInfo.NpcID]);
    var maxHp = bossNpcTemplate[tWorldBossNpc.att_4];//最大血量

    self.worldBoss[eWorldBoss.Hp] = maxHp;
};

Handler.GetWorldBossInfoInfoSqlStr = function (worldBossInfo) {

    var strInfo = '(';
    for (var t in worldBossInfo) {
        if (typeof (worldBossInfo[t]) == 'string' || worldBossInfo[t] instanceof Array) {
            strInfo += "'" + worldBossInfo[t] + "',";
        } else {
            strInfo += worldBossInfo[t] + ',';
        }
    }
    strInfo = strInfo.substring(0, strInfo.length - 1) + ')';

    var sqlString = utilSql.BuildSqlValues(new Array(worldBossInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }

    return sqlString;
};

/**
 * 保存数据到数据库
 * */
Handler.SaveWorldBossToDB = function () {
    var deferred = Q.defer();
    var self = this;
    pvpSql.SaveBossData(self.worldBoss[eWorldBossInfo.BossID], this.GetWorldBossInfoInfoSqlStr(self.worldBoss), function (err) {
        if (!!err) {
            logger.error('worldBoss player module save error： %s', utils.getErrorMessage(err));
        }
        return deferred.resolve();
    });

    return deferred.promise;
};

/**
 * 世界boss预知公告
 * @constructor
 */
Handler.SendNotice = function () {
    var noticeID = 'worldboss_1';
    var NoticeTemplate = templateManager.GetTemplateByID('NoticeTempalte', noticeID);
    if (null != NoticeTemplate) {
        var content = NoticeTemplate[templateConst.tNotice.noticeBeginStr];
        pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.WorldBoss, 0, content, utils.done);
    }
};

/**清空世界boss排行榜*/
Handler.ClearWorldBoss = function () {
    var self = this;
    var chartClient = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var del = Q.nbind(chartClient.del, chartClient);
    var jobs = [del(pvpRedisManager.getWorldBossSetName())];
    Q.all(jobs)
        .catch(function (err) {
            logger.error("redis error when del %j, error: %s", self.worldBoss, utils.getErrorMessage(err));
        })
        .done();
};

/**
 * 更新玩家的伤害
 * @param roleID
 * @param score
 * @param callback
 * @constructor
 */
Handler.AddPlayerScore = function (roleID, score, callback) {
    var chartClient = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var zadd = Q.nbind(chartClient.zadd, chartClient);
    zadd(pvpRedisManager.getWorldBossSetName(), score, roleID)
        .then(function (count) {
            return callback(null, count);
        })
        .catch(function (err) {
            logger.error("error when add player %d, %d, %s", roleID, score, utils.getErrorMessage(err));
            return callback(err);
        })
        .done();
};

Handler.UpdatePlayerScore = function (roleInfo, callback) {
    return this.AddPlayerScore(roleInfo.roleID, roleInfo.damage || 0, callback);
};

Handler.GetWorldBossRankingList = function (min, max, callback) {
    var client = pvpRedisManager.getClient(eRedisClientType.Chart).client;
    var zRevRange = Q.nbind(client.zrevrange, client);
    var bossRankInfo = {
        roleIds: [],
        roleScores: {}

    };
    zRevRange(pvpRedisManager.getWorldBossSetName(), min, max, 'WITHSCORES')
        .then(function (roleIDs) {
            var keys = [];
            var scores = {};
            for (var i = 0; i < roleIDs.length; i += 2) {
                keys.push(roleIDs[i]);
                scores[roleIDs[i]] = roleIDs[i + 1];
            }
            if (keys.length === 0) {
                return Q.resolve([]);
            }
            bossRankInfo.roleIds = keys;
            bossRankInfo.roleScores = scores;
            return callback(null, bossRankInfo);
        })
        .catch(function (err) {
            logger.error("error when GetChart %s", utils.getErrorMessage(err));
            return callback(err);
        })
        .done();
};

/**排行榜发送邮件*/
Handler.RewardByChart = function () {
    var self = this;

    self.GetWorldBossRankingList(0, -1, function (err, chartInfo) {
        if (!!err || !chartInfo['roleIds']) {
            logger.error("error when worldBossReward %s %j",
                utils.getErrorMessage(err), chartInfo['roleIds']);
            return;
        }
        var sendBossMail = function () {
            var mailDetails = [];
            var rank = 1;
            for (var i = 0; i < 2000; i++) {
                if (chartInfo['roleIds'].length <= 0) {
                    break;
                }
                var roleID = chartInfo['roleIds'].shift();
                mailDetails.push(self.SendMailByRankList(parseInt(roleID), rank));
                rank++;
                if (mailDetails.length >= 30) {
                    pomelo.app.rpc.ms.msRemote.SendMails(null, mailDetails, utils.done);
                    mailDetails = [];
                }
            }
            if (mailDetails.length > 0) {
                pomelo.app.rpc.ms.msRemote.SendMails(null, mailDetails, utils.done);
            }
        };
        sendBossMail();
    });
};

Handler.SendMailByRankList = function (roleID, rank) {
    var self = this;
    var mailDetail = {};
    var rewardAllTemplate = self.GetAllBossRewardTemplate();
    for (var rewardIndex in rewardAllTemplate) {
        var rewardTemp = rewardAllTemplate[rewardIndex];
        var minRank = rewardTemp[tBossReward.minRank];
        var maxRank = rewardTemp[tBossReward.maxRank];
        if (rank >= minRank && rank <= maxRank) {

            mailDetail = self.PlayerMailDetail(roleID, rank, rewardTemp);
        }
    }
    return mailDetail;
};

Handler.GetRewardItems = function (rewardTemplate) {
    var rewardItems = [];
    var prideNum = rewardTemplate[tBossReward.prizeNum];
    for (var i = 0; i < prideNum; i++) {
        var item = [];
        var itemID = rewardTemplate['prizeID_' + i];
        item.push(itemID);
        var itemNum = rewardTemplate['prizeNum_' + i];
        item.push(itemNum);
        rewardItems.push(item);
    }
    return rewardItems;
};

Handler.PlayerMailDetail = function (roleID, id, rewardTemp) {
    var self = this;
    var mailDetail = {
        recvID: roleID,
        subject: sPublicString.mailTitle_1,
        mailType: gameConst.eMailType.System,
        content: util.format(sWorldBossString.content_1, id),
        items: self.GetRewardItems(rewardTemp)
    };
    return mailDetail;
};
//最后一刀的邮件
Handler.SendLastSwordMail = function (roleID) {
    var self = this;
    var lastRewardTemp = self.GetRewardTemplateByID(2001);
    var mailDetail = {
        recvID: roleID,
        subject: sPublicString.mailTitle_1,
        mailType: gameConst.eMailType.System,
        content: util.format(sWorldBossString.content_2),
        items: self.GetRewardItems(lastRewardTemp)
    };
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
};

Handler.GetAllBossOpenTemplate = function () {
    return templateManager.GetAllTemplate("BossOpenListTemplate");
};
/**获取表记录*/

Handler.GetBossOpenTemplateByID = function (templateID) {
    return templateManager.GetTemplateByID("BossOpenListTemplate", templateID);
};
/**获取所有boss模板*/
Handler.GetAllBossTemplate = function () {
    return templateManager.GetAllTemplate("WorldBossTemplate");
};

/**获取单个boss模板*/
Handler.GetBossTemplateByID = function (templateID) {
    return templateManager.GetTemplateByID("WorldBossTemplate", templateID);
};
/**获取单个boss模板*/
Handler.GetCustomTemplateByID = function (templateID) {
    return templateManager.GetTemplateByID("CustomTemplate", templateID);
};
/**获取单个boss模板*/
Handler.GetBossNpcTemplateByID = function (templateID) {
    return templateManager.GetTemplateByID("WorldBossNpcTemplate", templateID);
};
/**获得bossReward模板*/
Handler.GetAllBossRewardTemplate = function () {
    return templateManager.GetAllTemplate("BossRewardTemplate");
};
/**获取单个bossReward模板*/
Handler.GetRewardTemplateByID = function (templateID) {
    return templateManager.GetTemplateByID("BossRewardTemplate", templateID);
};
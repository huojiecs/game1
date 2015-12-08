/**
 * Created by LiJianhua on 2015/7/27.
 * @email ljhdhr@gmail.com
 * 斗兽场管理类
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var errorCodes = require('../../tools/errorCodes');
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var utilSql = require('../../tools/mysql/utilSql');
var csSql = require('../../tools/mysql/csSql');
var ePlayerInfo = gameConst.ePlayerInfo;
var _ = require('underscore');
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var weeklyFreeNpc = require('./weeklyFreeNpc');
var async = require('async');
var globalFunction = require('../../tools/globalFunction');

/** NPC刷新消耗钻石数量 */
var CLEAR_REFRESH_NPC_YUAN_BAO = 206;
/** 免费刷新时间毫秒数 */
var CLEAR_REFRESH_NPC_CD_TIME = 207;
/** 每日次数限制 */
var TIME_PER_DAY = 208;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.npcCollectInfoArr = [];
    this.npcCollectRewardArr = [];
    this.teamCollectRewardArr = [];
    this.refreshTime = 0;

    this.npcIndex = 0;
    this.npcWave1 = [];
    this.npcWave2 = [];
    this.npcWave3 = [];
    this.npcWave4 = [];
    this.npcWave5 = [];
    this.npcTeam = [];
};

var handler = Handler.prototype;

/**
 * npcCollectInfoArr 数据格式 [[id, rank, star],...]
 * 数据库里面只存储[id,rank],star从配置表中动态读取.
 * 这样如果策划修改怪物星级不会影响数据库数据
 * @param dbInfo
 * @constructor
 */
handler.LoadDataByDB = function (dbInfo) {
    var self = this;
    if (dbInfo) {
        if (dbInfo['collect'] && dbInfo['collect'] != '') {
            self.npcCollectInfoArr = JSON.parse(dbInfo['collect']);
        }
        if (dbInfo['npcReward'] && dbInfo['npcReward'] != '') {
            self.npcCollectRewardArr = JSON.parse(dbInfo['npcReward']);
        }
        if (dbInfo['teamReward'] && dbInfo['teamReward'] != '') {
            self.teamCollectRewardArr = JSON.parse(dbInfo['teamReward']);
        }
        if (dbInfo['refreshTime'] && dbInfo['refreshTime'] != '') {
            self.refreshTime = dbInfo['refreshTime'];
        }
        if (dbInfo['npcInfo'] && dbInfo['npcInfo'] != '') {
            var npcInfo = JSON.parse(dbInfo['npcInfo']);
            self.npcWave1 = npcInfo.wave1;
            self.npcWave2 = npcInfo.wave2;
            self.npcWave3 = npcInfo.wave3;
            self.npcWave4 = npcInfo.wave4;
            self.npcWave5 = npcInfo.wave5;
            self.npcTeam = self.getTeamInfoFromWave(self.npcWave1, self.npcWave2, self.npcWave3, self.npcWave4, self.npcWave5);
        }
    }
};

/**
 * 主动推送怪物图鉴信息
 * 数据结构
 * [[npcId1, rank1],[npcId2, rank2]，[npcId3, rank3]]
 * [[1001,3],[1002,2],[1005,5]]
 * @constructor
 */
handler.SendColiseumInfo = function () {
    var self = this;
    if (null == self.owner) {
        logger.error('SendColiseumInfo null == self.owner');
        return;
    }
    var route = 'SendColiseumInfo';
    var msg = {
        result: errorCodes.OK,
        collect: self.npcCollectInfoArr,
        npcReward: self.npcCollectRewardArr,
        teamReward: self.teamCollectRewardArr,
        freeNpc: weeklyFreeNpc.getWeeklyFreeNpc(),
        cdTime: self.getRefreshCD(),
        team: self.getNpcTeamId(),
        wave1: self.npcWave1,
        wave2: self.npcWave2,
        wave3: self.npcWave3,
        wave4: self.npcWave4,
        wave5: self.npcWave5
    };
    self.owner.SendMessage(route, msg);
};


handler.SendColiseumOver = function () {
    var self = this;
    if (null == self.owner) {
        logger.error('SendColiseumOver null == self.owner');
        return;
    }
    var route = 'SendColiseumOver';
    var msg = {
        result: errorCodes.OK,
        cdTime: self.getRefreshCD(),
        team: self.getNpcTeamId(),
        wave1: self.npcWave1,
        wave2: self.npcWave2,
        wave3: self.npcWave3,
        wave4: self.npcWave4,
        wave5: self.npcWave5
    };
    self.owner.SendMessage(route, msg);
};

/**
 * 发送每周免费NPC列表
 * freeNpc NPC基础ID
 */
handler.SendWeeklyFreeNpc = function () {
    var self = this;
    var npcList = weeklyFreeNpc.getWeeklyFreeNpc();
    var route = 'SendWeeklyFreeNpc';
    if (_.size(npcList) > 0) {
        var msg = {
            result: errorCodes.OK,
            freeNpc: npcList
        };
        self.owner.SendMessage(route, msg);
    } else {
        logger.error('handler.SendWeeklyFreeNpc npcList size == 0');
    }
};

/**
 * 解锁和升级指定NPC
 * @param baseNpcID 对应 baseNpcID
 * @returns {*} 消息字符串
 * @constructor
 */
handler.GetCollectNpcLevelUpMsg = function (baseNpcID) {
    var self = this;
    var coliseumNpcStarTemplate = templateManager.GetAllTemplate('ColiseumNpcStarTemplate');
    if (null == coliseumNpcStarTemplate) {
        return {'result': errorCodes.NoTemplate};
    }

    var has = false;
    var npcTemp = {};
    for (var index in coliseumNpcStarTemplate) {
        if (coliseumNpcStarTemplate[index]['baseNpcID'] == baseNpcID) {
            npcTemp = coliseumNpcStarTemplate[index];
            has = true;
            break;
        }
    }

    if (!has) {
        return {'result': errorCodes.NPC_NOT_EXIST};
    }


    var itemID = npcTemp['itemID'];
    var star = npcTemp['star'];

    var newLevel = 0;
    for (var index in self.npcCollectInfoArr) {
        if (self.npcCollectInfoArr[index][0] == baseNpcID) {
            newLevel = self.npcCollectInfoArr[index][1] + 1;
            break;
        }
    }

    if (newLevel == 0) {
        newLevel = 1;
    }
    var numKey = 'num_' + newLevel;
    var msg = {
        baseNpcID: 0,
        newLevel: 0
    };

    if (npcTemp.hasOwnProperty(numKey)) {
        var num = npcTemp[numKey];
        if (self.owner.GetAssetsManager().CanConsumeAssets(itemID, num) == false) {
            return {'result': errorCodes.NoAssets};
        }

        self.owner.GetAssetsManager().AlterAssetsValue(itemID, -num, eAssetsReduce.NpcCollectLevelUp);
        var levelUp = false;
        for (var index in self.npcCollectInfoArr) {
            if (self.npcCollectInfoArr[index][0] == baseNpcID) {
                levelUp = true;
                self.npcCollectInfoArr[index][1] = newLevel;
                break;
            }
        }

        if (!levelUp) {
            // unlock
            var unlockNpc = [baseNpcID, 1];
            self.npcCollectInfoArr.push(unlockNpc);
        }

        msg.result = errorCodes.OK;
        msg.baseNpcID = baseNpcID;
        msg.newLevel = newLevel;
        logger.warn('GetCollectNpcLevelUpMsg roleId %j npcID %j newLevel %j ',
                    self.owner.GetPlayerInfo(ePlayerInfo.ROLEID), baseNpcID, newLevel);
        return msg;
    } else {
        logger.error('GetCollectNpcLevelUpMsg hasOwnProperty numKey %j self.npcCollectInfo %j ', numKey,
                     self.npcCollectInfoArr);
        return {'result': errorCodes.LEVEL_NOT_EXIST};
    }
};

handler.GetSqlStr = function () {
    var self = this;
    var rows = [];
    var row = [];
    row.push(self.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
    row.push(JSON.stringify(self.npcCollectInfoArr));
    row.push(JSON.stringify(self.npcCollectRewardArr));
    row.push(JSON.stringify(self.teamCollectRewardArr));
    row.push(self.refreshTime);
    var info = {};
    info.wave1 = self.npcWave1;
    info.wave2 = self.npcWave2;
    info.wave3 = self.npcWave3;
    info.wave4 = self.npcWave4;
    info.wave5 = self.npcWave5;
    row.push(JSON.stringify(info));
    rows.push(row);
    var sqlString = utilSql.BuildSqlValues(rows);
    return sqlString;
};

/**
 * 获取奖励消息
 *
 * 斗兽场怪物图鉴奖励注意事项
 * 需要多少能达到奖励要求的数字不能改.
 * 可以通过添加新的次数和奖励的方式扩展
 *
 * 举个栗子：
 * 解锁怪物奖励需要5个，现在解锁了5个，进度是5/5.玩家领完奖会记录领奖状态。
 * 总共需要的次数“5”，这个值就不能变了.
 * 比如说改成10，就会出现5/10 已领取 这样不符合逻辑的显示
 *
 * 奖励物品可以修改
 *
 * 解锁NPC奖励
 *
 * ColiseumNpcCollectTemplate 配置表说明：
 * type 0：解锁奖励
 *      1：升级奖励
 * star 0：任意星级
 *      1~10：指定星级
 * num: 获得奖励要求的数量
 * giftID：礼包ID
 *
 * 升级怪物奖励和解锁奖励类似
 * @param attID 奖励魔板ID
 */
handler.getCollectNpcRewardMsg = function (attID) {
    var self = this;
    if (-1 != self.npcCollectRewardArr.indexOf(attID)) {
        return {result: errorCodes.REWARD_ALREADY_TAKEN};
    }
    var coliseumNpcRewardTemplate = templateManager.GetTemplateByID('ColiseumNpcCollectTemplate', attID);
    if (null == coliseumNpcRewardTemplate) {
        return {result: errorCodes.NoTemplate};
    }
    var type = coliseumNpcRewardTemplate['type'];
    var star = coliseumNpcRewardTemplate['star'];
    var num = coliseumNpcRewardTemplate['num'];
    var giftID = coliseumNpcRewardTemplate['giftID'];
    var msg = {};
    if (type == 0) {
        var starCount = self.GetNpcStarCountByStar(star);
        if (starCount >= num) {
            // 发奖
            self.npcCollectRewardArr.push(attID);
            msg = self.getCollectNpcRewardInfo(giftID);
        } else {
            msg = {result: errorCodes.NO_ENOUGH_STAR};
        }
    } else if (type == 1) {
        var levelCount = self.GetNpcLevelCountByStar(star);
        if (levelCount >= num) {
            // 发奖
            self.npcCollectRewardArr.push(attID);
            msg = self.getCollectNpcRewardInfo(giftID);
            msg.npcReward = self.npcCollectRewardArr;
        } else {
            msg = {result: errorCodes.NO_ENOUGH_LEVEL};
        }
    }

    if (msg.result === errorCodes.OK) {
        msg.npcReward = self.npcCollectRewardArr;
    }
    return msg;
};

/**
 * 获取解锁NPC队伍奖励消息
 * @param attID
 * @returns {*}
 */
handler.getCollectTeamRewardMsg = function (attID) {
    var self = this;
    if (-1 != self.teamCollectRewardArr.indexOf(attID)) {
        return {result: errorCodes.REWARD_ALREADY_TAKEN};
    }
    var coliseumNpcTeamTemplate = templateManager.GetTemplateByID('ColiseumNpcTeamTemplate', attID);
    if (null == coliseumNpcTeamTemplate) {
        return {result: errorCodes.NoTemplate};
    }

    var npcCount = coliseumNpcTeamTemplate['npcCount'];
    var giftID = coliseumNpcTeamTemplate['giftID'];

    var teamNpcId = [];
    for (var i = 1; i <= npcCount; i++) {
        var key = 'npcID_' + i;
        var npcId = coliseumNpcTeamTemplate[key];
        teamNpcId.push(npcId);
    }

    if (_.size(teamNpcId) == 0) {
        return {result: errorCodes.NPC_TEAM_CONF_ERROR};
    }

    var hasTeam = true;
    for (var teamIndex in teamNpcId) {
        var has = false;
        for (var npcIndex in self.npcCollectInfoArr) {
            var npcInfo = self.npcCollectInfoArr[npcIndex];
            if (teamNpcId[teamIndex] === npcInfo[0]) {
                has = true;
                break;
            }
        }

        if (!has) {
            hasTeam = false;
            break;
        }
    }

    if (!hasTeam) {
        return {result: errorCodes.NPC_NO_TEAM};
    }

    // 发奖
    self.teamCollectRewardArr.push(attID);
    var msg = self.getCollectNpcRewardInfo(giftID);
    if (msg.result === errorCodes.OK) {
        msg.teamReward = self.teamCollectRewardArr;
    }
    return msg;
};

handler.GetNpcStarCountByStar = function (star) {
    var self = this;
    if (star == 0) {
        return _.size(self.npcCollectInfoArr);
    } else {
        var num = 0;
        _.each(self.npcCollectInfoArr, function (npcInfo) {
            var baseNpcID = npcInfo[0];
            var npcStar = self.GetNpcStarByBaseNpcID(baseNpcID);
            if (npcStar == star) {
                ++num;
            }
        });
        return num;
    }
};


/**
 * npcInfo数据格式 [ID, 等级, 星级]
 */
handler.GetNpcLevelCountByStar = function (star) {
    var self = this;
    var count = 0;
    _.each(self.npcCollectInfoArr, function (npcInfo) {
        if (star == 0) {
            count += npcInfo[1];
        } else {
            var baseNpcID = npcInfo[0];
            var npcStar = self.GetNpcStarByBaseNpcID(baseNpcID);
            if (npcStar == star) {
                count += npcInfo[1];
            }
        }
    });
    return count;
};

handler.GetNpcStarByBaseNpcID = function (baseNpcID) {
    var temp = templateManager.GetAllTemplate('ColiseumNpcStarTemplate');
    if (null == temp) {
        return -1;
    }
    for (var index in temp) {
        if (temp[index]['baseNpcID'] == baseNpcID) {
            return temp[index]['star'];
        }
    }
    return -1;
};

/**
 * 获取NPC解锁礼包奖励信息
 * 获取NPC队伍解锁礼包奖励信息
 * @param giftID 活动礼包ID
 */
handler.getCollectNpcRewardInfo = function (giftID) {
    var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (null == giftTemplate) {
        logger.error('handler.getCollectNpcRewardInfo null == giftTemplate giftID %j ', giftID);
        return {result: errorCodes.NoTemplate};
    }
    var msg = {
        items: []
    };
    var rewardArr = [];
    var allNum = giftTemplate['itemNum'];
    var nextID = giftTemplate['nextID'];
    for (var i = 0; i < allNum; ++i) {
        var itemID = giftTemplate['itemID_' + i];
        var itemNum = giftTemplate['itemNum_' + i];
        var item = [itemID, itemNum];
        rewardArr.push(item);
        this.owner.AddItem(itemID, itemNum, eAssetsAdd.NpcCollectReward, 0);
    }

    msg.result = errorCodes.OK;
    msg.items = rewardArr;
    logger.warn('getCollectNpcRewardInfo roleID %j msg %j ', this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                msg);
    return msg;
};

/**
 * 返回刷新NPC消息
 * NPCId 计算方法: 基础ID * 100 + 怪物星级
 * var id = npcInfo[0] * 100 + npcInfo[2]
 * monsterPool 数据结构 [[id, rank, star],...]
 * @returns {*}
 */
handler.getRefreshNpcMsg = function () {
    var self = this;
    var monsterPool = [];

    //重置npcIndex
    self.npcIndex = 0;

    var refreshNpcTemplate = templateManager.GetAllTemplate('ColiseumNpcShowTemplate');
    if (null == refreshNpcTemplate) {
        logger.error('null == ColiseumNpcShowTemplate');
        return {result: errorCodes.NoTemplate};
    }

    if (null == self.owner) {
        return {result: errorCodes.SystemWrong};
    }

    if (_.size(self.npcWave1) > 0) {
        // 有怪物队列的时候才计算CD和钻石，没有怪物的时候直接刷怪
        var cdTime = self.getRefreshCD();
        if (cdTime == 0) {
            var allTemplate = templateManager.GetTemplateByID('AllTemplate', CLEAR_REFRESH_NPC_CD_TIME);
            var refreshCdTime = allTemplate['attnum'];
            cdTime = Math.floor(refreshCdTime / 1000);
            // 免费刷新,更新倒计时
            this.refreshTime = new Date().getTime();
        } else if (cdTime > 0) {
            var allTemplate = templateManager.GetTemplateByID('AllTemplate', CLEAR_REFRESH_NPC_YUAN_BAO);
            var refreshYuanBao = allTemplate['attnum'];
            var assetsManager = this.owner.GetAssetsManager();
            if (!assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), refreshYuanBao)) {
                return {result: errorCodes.NoYuanBao};
            }
            this.owner.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -refreshYuanBao,
                                                           eAssetsReduce.RefreshNpc);
        } else {
            return {result: errorCodes.NPC_REFRESH_CD_TIME_ERROR};
        }
    }

    var waveNumCount1 = 0;
    var waveNumCount2 = 0;
    var waveNumCount3 = 0;
    var waveNumCount4 = 0;
    var waveNumCount5 = 0;
    _.each(refreshNpcTemplate, function (waveTemp) {
        switch (waveTemp['waveNum']) {
            case 1:
                waveNumCount1++;
                break;
            case 2:
                waveNumCount2++;
                break;
            case 3:
                waveNumCount3++;
                break;
            case 4:
                waveNumCount4++;
                break;
            case 5:
                waveNumCount5++;
                break;
        }
    });

    if (waveNumCount1 == 0 || waveNumCount2 == 0 || waveNumCount3 == 0 || waveNumCount4 == 0 || waveNumCount5 == 0) {
        logger.error('waveNumCount1 %j waveNumCount2 %j waveNumCount3 %j waveNumCount4 %j waveNumCount5 %j ',
                     waveNumCount1, waveNumCount2, waveNumCount3, waveNumCount4, waveNumCount5);
        return {result: errorCodes.NPC_WAVE_COUNT_ERROR};
    }

    var waveNumIndex1 = Math.floor(Math.random() * waveNumCount1);
    var waveNumIndex2 = Math.floor(Math.random() * waveNumCount2);
    var waveNumIndex3 = Math.floor(Math.random() * waveNumCount3);
    var waveNumIndex4 = Math.floor(Math.random() * waveNumCount4);
    var waveNumIndex5 = Math.floor(Math.random() * waveNumCount5);

    var waveTemp1 = null;
    var waveTemp2 = null;
    var waveTemp3 = null;
    var waveTemp4 = null;
    var waveTemp5 = null;
    // 重置waveNumCount
    waveNumCount1 = 0;
    waveNumCount2 = 0;
    waveNumCount3 = 0;
    waveNumCount4 = 0;
    waveNumCount5 = 0;
    _.each(refreshNpcTemplate, function (waveTemp) {
        switch (waveTemp['waveNum']) {
            case 1:
                if (waveNumCount1 == waveNumIndex1) {
                    waveTemp1 = waveTemp;
                }
                waveNumCount1++;
                break;
            case 2:
                if (waveNumCount2 == waveNumIndex2) {
                    waveTemp2 = waveTemp;
                }
                waveNumCount2++;
                break;
            case 3:
                if (waveNumCount3 == waveNumIndex3) {
                    waveTemp3 = waveTemp;
                }
                waveNumCount3++;
                break;
            case 4:
                if (waveNumCount4 == waveNumIndex4) {
                    waveTemp4 = waveTemp;
                }
                waveNumCount4++;
                break;
            case 5:
                if (waveNumCount5 == waveNumIndex5) {
                    waveTemp5 = waveTemp;
                }
                waveNumCount5++;
                break;
        }
    });

    if (waveTemp1 == null || waveTemp2 == null || waveTemp3 == null || waveTemp4 == null || waveTemp5 == null) {
        logger.error('waveTemp1 %j waveTemp2 %j waveTemp3 %j waveTemp4 %j waveTemp5 %j ', waveTemp1, waveTemp2,
                     waveTemp3, waveTemp4, waveTemp5);
        return {result: errorCodes.NPC_WAVE_TEMP_ERROR};
    }

    _.each(self.npcCollectInfoArr, function (npc) {
        var npcTemp = self.getNpcTempByBaseNpcID(npc[0]);
        if (null == npcTemp) {
            logger.error('null == npcTemp npc %j ', npc);
        } else {
            if (npcTemp['star'] > 0) {
                var monsterInfo = _.clone(npc);
                monsterInfo.push(npcTemp['star']);
                monsterPool.push(monsterInfo);
            } else {
                logger.error('self.npcCollectInfoArr npc %j ', npc);
            }
        }
    });

    _.each(weeklyFreeNpc.getWeeklyFreeNpc(), function (freeNpcId) {
        /** 检查已经解锁的NPC中是否包含免费NPC */
        var has = false;
        for (var index in self.npcCollectInfoArr) {
            if (self.npcCollectInfoArr[index][0] == freeNpcId) {
                has = true;
                break;
            }
        }
        if (!has) {
            /** 每周免费NPC没有解锁，默认等级1级 */
            var star = self.getStarByNpcBaseId(freeNpcId);
            if (star > 0) {
                var monsterInfo = [freeNpcId, 1, star];
                monsterPool.push(monsterInfo);
            } else {
                logger.error('star %j weeklyFreeNpc.getWeeklyFreeNpc %j freeNpcId %j  monsterPool %j ', star,
                             weeklyFreeNpc.getWeeklyFreeNpc(), freeNpcId, monsterPool);
            }
        }
    });

    self.npcWave1 = self.getNpcFromMonsterPool(waveTemp1, monsterPool);
    self.npcWave2 = self.getNpcFromMonsterPool(waveTemp2, monsterPool);
    self.npcWave3 = self.getNpcFromMonsterPool(waveTemp3, monsterPool);
    self.npcWave4 = self.getNpcFromMonsterPool(waveTemp4, monsterPool);
    self.npcWave5 = self.getNpcFromMonsterPool(waveTemp5, monsterPool);

    self.npcTeam = self.getTeamInfoFromWave(self.npcWave1, self.npcWave2, self.npcWave3, self.npcWave4, self.npcWave5);
    var msg = {
        result: errorCodes.OK,
        cdTime: cdTime,
        team: self.getNpcTeamId(),
        wave1: self.npcWave1,
        wave2: self.npcWave2,
        wave3: self.npcWave3,
        wave4: self.npcWave4,
        wave5: self.npcWave5
    };
    return msg;
};

handler.getStarByNpcBaseId = function (baseNpcID) {
    var coliseumNpcStarTemplate = templateManager.GetAllTemplate('ColiseumNpcStarTemplate');
    if (null == coliseumNpcStarTemplate) {
        logger.error('null == ColiseumNpcStarTemplate');
        return -1;
    }

    for (var index in coliseumNpcStarTemplate) {
        var temp = coliseumNpcStarTemplate[index];
        if (temp['baseNpcID'] == baseNpcID) {
            return temp['star'];
        }
    }
    return -1;
};

/**
 * 从怪物池中获取对应数量的怪物
 * @param waveTemp 没波次的配置模板
 * @param monsterPool 怪物池
 * @returns {Array} 每组最1~2种怪物 数组格式 [[id1,star1,num1],[id2,star2,num2]]
 */
handler.getNpcFromMonsterPool = function (waveTemp, monsterPool) {
    var self = this;
    var waveNum = waveTemp['waveNum'];
    var star_1 = waveTemp['star_1'];
    var num_1 = waveTemp['num_1'];
    var star_2 = waveTemp['star_2'];
    var num_2 = waveTemp['num_2'];

    var ownStarCount1 = 0;
    var ownStarCount2 = 0;

    _.each(monsterPool, function (npcInfo) {
        if (npcInfo[2] == star_1) {
            ownStarCount1++;
        }
        if (npcInfo[2] == star_2) {
            ownStarCount2++;
        }
    });

    var ownStarIndex1 = Math.floor(Math.random() * ownStarCount1);
    var ownStarIndex2 = Math.floor(Math.random() * ownStarCount2);
    // 重置waveNumCount
    ownStarCount1 = 0;
    ownStarCount2 = 0;

    var waveNpc = [];
    /** npcInfo 数据结构 [[id, rank, star],...]  */
    _.each(monsterPool, function (npcInfo) {
        if (npcInfo[2] == star_1 && num_1 > 0) {
            if (ownStarCount1 == ownStarIndex1) {
                var npc = self.getWaveInfo(npcInfo, num_1);
                waveNpc.push(npc);
            }
            ownStarCount1++;
        }
        if (npcInfo[2] == star_2 && num_2 > 0) {
            if (ownStarCount2 == ownStarIndex2) {
                var npc = self.getWaveInfo(npcInfo, num_2);
                waveNpc.push(npc);
            }
            ownStarCount2++;
        }
    });
    return waveNpc;
};

/**
 * 获取每波中NPC的ID，数量，掉落
 * @param npcInfo 数据结构 [[id, rank, star],...]
 * @param num 一波中相同NPC数量
 * @returns 获取每波中NPC的ID，数量，掉落
 */
handler.getWaveInfo = function (npcInfo, num) {
    var self = this;
    var power = self.owner.GetPlayerInfo(ePlayerInfo.ZHANLI);
    var waveInfo = {};
    /**转化baseId为配置表中的ID npcID 计算方法为 baseId * 100 + 等级 */
    waveInfo.id = npcInfo[0] * 100 + npcInfo[1];
    waveInfo.rank = npcInfo[1];
    waveInfo.star = npcInfo[2];
    waveInfo.num = num;
    waveInfo.drop = [];

    for (var i = 0; i < num; ++i) {
        /** dropList 数据格式[{id,num},...] */
        var dropList = self.owner.GetItemManager().getItemDropListByNpcId(waveInfo.id);
        for (var index in dropList) {
            for (var itemId in dropList[index]) {
                var rate = self.getRateByPower(power, +itemId);
                dropList[index][itemId] = Math.floor(dropList[index][itemId] * rate);
            }
        }

        var dropInfo = {};
        dropInfo.index = self.npcIndex;
        dropInfo.items = dropList;
        waveInfo.drop.push(dropInfo);
        /** NPC index 递增    */
        self.npcIndex++;
    }
    return waveInfo;
};

/**
 * 根据战力和物品ID计算掉落倍率
 * @param power 战力
 * @param itemId 物品ID
 * @returns {number} 掉落倍率
 */
handler.getRateByPower = function (power, itemId) {
    var rate = 1;
    var coliseumZhanLiTemplate = templateManager.GetAllTemplate('ColiseumZhanLiTemplate');
    if (null == coliseumZhanLiTemplate) {
        logger.error('null == ColiseumZhanLiTemplate');
        return rate;
    }

    for (var index in coliseumZhanLiTemplate) {
        var powerEdge = coliseumZhanLiTemplate[index]['zhanLiMax'];
        if (power <= powerEdge) {
            for (var i = 0; i < 20; i++) {
                var key = 'dropItemID_' + i;
                if (coliseumZhanLiTemplate[index][key] == itemId) {
                    var rateKey = 'dropItemRate_' + i;
                    // 配置表倍率除以100
                    rate = coliseumZhanLiTemplate[index][rateKey] / 100;
                    break;
                }
            }
            break;
        }
    }
    return rate;
};

handler.getTeamInfoFromWave = function (wave1, wave2, wave3, wave4, wave5) {
    var teamInfo = [];
    var allId = [];

    var coliseumNpcTeamTemplate = templateManager.GetAllTemplate('ColiseumNpcTeamTemplate');
    if (null == coliseumNpcTeamTemplate) {
        logger.error('null == coliseumNpcTeamTemplate');
        return teamInfo;
    }

    async.each([wave1, wave2, wave3, wave4, wave5],
        function (wave) {
            _.each(wave, function (npcInfo) {
                var baseNpcId = Math.floor(npcInfo.id / 100);
                if (-1 == allId.indexOf(baseNpcId)) {
                    allId.push(baseNpcId);
                }
            });
        },
        function (err) {
            logger.error('err %j ', err);
        });

    for (var index in coliseumNpcTeamTemplate) {
        var npcTeam = coliseumNpcTeamTemplate[index];
        var npcCount = npcTeam['npcCount'];
        var isTeam = true;
        for (var i = 1; i <= npcCount; i++) {
            var key = 'npcID_' + i;
            if (-1 == allId.indexOf(npcTeam[key])) {
                isTeam = false;
                break;
            }
        }

        if (isTeam) {
            // NPC怪物组合
            var team = {};
            team.id = index;
            teamInfo.push(team);
        }
    }

    return teamInfo;
};

handler.getNpcTempByBaseNpcID = function (baseNpcID) {
    var coliseumNpcStarTemplate = templateManager.GetAllTemplate('ColiseumNpcStarTemplate');
    if (null != coliseumNpcStarTemplate) {
        for (var index in coliseumNpcStarTemplate) {
            if (coliseumNpcStarTemplate[index]['baseNpcID'] == baseNpcID) {
                return coliseumNpcStarTemplate[index];
            }
        }
    }
    return null;
};

/**
 * 获取免费刷新冷却时间(秒)
 * 0 为可以免费，
 * 其他数字为倒计时秒数
 */
handler.getRefreshCD = function () {
    var allTemplate = templateManager.GetTemplateByID('AllTemplate', CLEAR_REFRESH_NPC_CD_TIME);
    var refreshCdTime = allTemplate['attnum'];
    var nowTime = new Date().getTime();
    if (this.refreshTime == 0) {
        return 0;
    } else {
        if (nowTime - this.refreshTime >= refreshCdTime) {
            return 0;
        } else {
            var cdTime = refreshCdTime - (nowTime - this.refreshTime);
            if (cdTime < 0) {
                cdTime = 0;
            }
            return Math.floor(cdTime / 1000);
        }
    }
};

handler.getNpcTeamId = function () {
    var self = this;
    var teamId = [];
    _.each(self.npcTeam, function (teamInfo) {
        teamId.push(teamInfo.id);
    });
    return teamId;
};

/**
 * 客户端上传杀掉斗兽场中的NPC
 * 记录玩家得到的道具
 * @param index 被杀掉的NPC索引
 */
handler.killNpc = function (index) {
    var self = this;
    logger.warn('killNpc roleID %j npcIndex %j ', self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), index);
    async.each([self.npcWave1, self.npcWave2, self.npcWave3, self.npcWave4, self.npcWave5],
        function (wave) {
            _.each(wave, function (npcInfo) {
                for (var i in npcInfo.drop) {
                    if (npcInfo.drop[i].index == index) {
                        npcInfo.drop[i].killed = true;
                        break;
                    }
                }
            });
        },
        function (err) {
            logger.error('err %j ', err);
        });
};

/**
 * 杀死指定组合全部怪物
 * @param teamID
 */
handler.killNpcTeam = function (teamID) {
    var self = this;
    logger.warn('killNpcTeam roleID %j teamID %j ', self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), teamID);
    _.each(self.npcTeam, function (team) {
        if (+team.id == teamID) {
            team.killed = true;
        }
    });
};

/**
 * 添加斗兽场奖励
 */
handler.addColiseumItem = function () {
    var self = this;
    // 添加击败怪物奖励
    var getItems = [];
    async.each([self.npcWave1, self.npcWave2, self.npcWave3, self.npcWave4, self.npcWave5],
        function (wave) {
            _.each(wave, function (npcInfo) {
                for (var i in npcInfo.drop) {
                    if (npcInfo.drop[i].hasOwnProperty('killed') && npcInfo.drop[i].killed) {
                        var items = npcInfo.drop[i].items;
                        _.each(items, function (item) {
                            // 添加到获得道具列表
                            getItems.push(item);
                        });
                    }
                }
            });
        },
        function (err) {
            logger.error('err %j ', err);
        });

    // 添加击败队伍奖励
    _.each(self.npcTeam, function (team) {
        if (team.hasOwnProperty('killed') && team.killed) {
            var teamReward = self.getTeamRewardByTeamID(team.id);
            _.each(teamReward, function (item) {
                // 添加到获得道具列表
                getItems.push(item);
            });
        }
    });

    logger.warn(' addColiseumItem playerId %j getItems %j ', self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), getItems);
    // 给玩家添加道具
    for (var key in getItems) {
        for(var id in getItems[key]) {
            self.owner.AddItem(id, getItems[key][id], eAssetsAdd.ColiseumReward, 0);
        }
    }
    self.clear();
};

/**
 * 根据NPC队伍ID获取对应的奖励物品
 * @param teamID NPC组合ID
 * @returns {Array} 奖励物品
 */
handler.getTeamRewardByTeamID = function (teamID) {
    var teamReward = [];
    var coliseumNpcTeamTemplate = templateManager.GetTemplateByID('ColiseumNpcTeamTemplate', teamID);
    if (null == coliseumNpcTeamTemplate) {
        return teamReward;
    }

    var dropCount = coliseumNpcTeamTemplate['dropCount'];
    for (var i = 1; i <= dropCount; i++) {
        var idKey = 'dropItemID_' + i;
        var numKey = 'dropItemNum_' + i;
        var key = coliseumNpcTeamTemplate[idKey];
        var num = coliseumNpcTeamTemplate[numKey];
        var item = {};
        item[key] = num;
        teamReward.push(item);
    }
    return teamReward;
};

/**
 * 清空斗兽场怪物数据
 */
handler.clear = function () {
    var self = this;
    this.npcIndex = 0;
    self.npcIndex = 0;
    self.npcWave1 = [];
    self.npcWave2 = [];
    self.npcWave3 = [];
    self.npcWave4 = [];
    self.npcWave5 = [];
    self.npcTeam = [];
};
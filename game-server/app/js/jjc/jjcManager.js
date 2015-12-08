/**
 * The file jjcManager.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/15 0:41:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValue = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var Round = require('./round');
var playerManager = require('../player/playerManager');
var errorCodes = require('../../tools/errorCodes');
var jjcFormula = require('../common/jjcFormula');

var _ = require('underscore');
var Q = require('q');

var eJJCInfo = gameConst.eJJCInfo;
var eRoundType = gameConst.eRoundType;
var eSideType = gameConst.eSideType;
var BATTLE_TYPE = jjcFormula.BATTLE_TYPE;

/** 关卡默认副本id*/
var Default__CustomID = 58001;

/**
 * jjc管理器
 * */
var Handler = module.exports;
Handler.Init = function () {
    /** 活动阶段标识字段*/
    this.section = 0;
    /** 是否开启战斗*/
    this.isBattleTime = false;
    /** 显示时间*/
    this.showTime = '';
    /** 刷新时间*/
    this.refreshTime = new Date().getTime();
    /** 练习刷新时间*/
    this.refreshPracticeTime = new Date().getTime();

    /** 战斗匹配队列*/
    this.queue = [];
    /**连续匹配队列*/
    this.practiceQueue = [];

    /**round 回合id */
    this.roundGid = 1;

    /** 回合map*/
    this.roundMap = {};

    /** battle status map 玩家战斗状态 map <roleID, type>*/
    this.battleTypeMap = {};
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
 * @param {Number} roleID 删除玩家战神榜状态
 * @api public
 * */
Handler.deleteBattleType = function (roleID) {
    delete this.battleTypeMap[roleID];
};

/**
 * 检查 是否可以战斗
 *
 * @param {Number} roleID 挑战者id
 * @api public
 * */
Handler.checkBattleType = function (roleID) {
    /** 正在进行匹配*/
    if (this.battleTypeMap[roleID] == BATTLE_TYPE.MATCHING) {
        return errorCodes.JJC_BATTLE_MATCHING;
    }

    /** 准备战斗、战斗中、战斗结束结算*/
    if (this.battleTypeMap[roleID] == BATTLE_TYPE.READY ||
        this.battleTypeMap[roleID] == BATTLE_TYPE.BALANCE ||
        this.battleTypeMap[roleID] == BATTLE_TYPE.BATTLING) {
        return errorCodes.JJC_BATTLE_BATTLING;
    }

    return errorCodes.OK;
};

/**
 * 检查 正在匹配中
 *
 * @param {Number} roleID 玩家ID
 * @api public
 * */
Handler.checkIsMatching = function (roleID) {
    /** 正在进行匹配*/
    if (this.battleTypeMap[roleID] == BATTLE_TYPE.MATCHING) {
        return true;
    }

    return false;
};

/**
 * player 刷帧方法， 定时更新操作， interval 1000
 * @param {Date} nowTime 当前时间
 * */
Handler.Update = function (nowTime) {
    var self = this;
    var nowSec = nowTime.getTime();

    /** 刷新赛季周期*/
    self.UpdateJJCSection(nowSec);

    /** 刷新每天战斗时间*/
    self.UpdateJJCDay(nowSec);

    /** 刷新玩家超时*/
    if (this.isStartBattle()) {
        this.refreshTimeOut();
        if(this.isRefreshQueue(nowSec)){
            this.refreshQueue();
        }
    }else{
        this.deleteAllQueue();
    }

    this.refreshPracticeTimeOut();

    /** pvp 开始后并且 有玩家请求 battle 刷新队列*/
    if (this.isRefreshPracticeQueue(nowSec)) {
        this.refreshPracticeQueue();
    }
};

/**
 * player 刷新一月竞技场周期
 * @param {number} nowTime 当前时间
 * */
Handler.UpdateJJCSection = function (nowSec) {

    if (utils.isInTimeExpression(defaultValue.JJC_FirstSectionTime, nowSec)) {
        /**jjc活动第一阶段*/
        this.section = 1;

    } else if (utils.isInTimeExpression(defaultValue.JJC_SecondSectionTime, nowSec)) {
        /**jjc活动第二阶段*/
        this.section = 2;

    } else if (utils.isInTimeExpression(defaultValue.JJC_ThirdSectionTime, nowSec) && !utils.isLastDayInMonth()) {
        /**jjc活动第三阶段*/
        this.section = 3;

    } else if (utils.isInTimeExpression(defaultValue.JJC_FourSectionTime, nowSec) && utils.isLastDayInMonth()) {
        /**jjc活动第四阶段*/
        this.section = 4;
    } else {
        logger.error("UpdateJJCSection error %d", nowSec);
    }
};

/**
 * player 刷新每天 两个阶段战斗时间
 * @param {number} nowTime 当前时间
 * */
Handler.UpdateJJCDay = function (nowSec) {

    if (utils.isInTimeExpression(defaultValue.JJC_FirstDayUnTime, nowSec)) {
        /**每天活动第一非战斗时间段 00:00 - 12:00*/
        this.SetBattleStats(false, defaultValue.JJC_FirstDayTimeStr);

    } else if (utils.isInTimeExpression(defaultValue.JJC_FirstDayTime, nowSec)) {
        /**每天活动第一战斗时间段 12:00 - 14:00*/
        this.SetBattleStats(true, defaultValue.JJC_FirstDayTimeStr);

    } else if (utils.isInTimeExpression(defaultValue.JJC_SecondDayUnTime, nowSec)) {
        /**每天活动第二非战斗时间段 14:00 - 20:00*/
        this.SetBattleStats(false, defaultValue.JJC_SecondDayTimeStr);

    } else if (utils.isInTimeExpression(defaultValue.JJC_SecondDayTime, nowSec)) {
        /**每天活动第二战斗时间段 20:00 - 22:00*/
        this.SetBattleStats(true, defaultValue.JJC_SecondDayTimeStr);

    } else if (utils.isInTimeExpression(defaultValue.JJC_ThirdDayUnTime, nowSec)) {
        /**每天活动第三战斗时间段 22:00 - 24:00*/
        this.SetBattleStats(false, defaultValue.JJC_FirstDayTimeStr);

    } else {
        logger.error("UpdateJJCDay error %d", nowSec);
    }
};

/**
 * 设置每天状态
 * @param {boolean} isBattleTime 每天战争是否开启
 * @param {string} showTime 当前时间
 * */
Handler.SetBattleStats = function (isBattleTime, showTime) {
    if(this.isBattleTime != isBattleTime){
        for (var playerID in playerManager.playerList) { //在线玩家缓存
            this.sendFightChange(playerID, isBattleTime);
        }
    }
    this.isBattleTime = isBattleTime;
    this.showTime = showTime;
};

/**
 * 是否可以竞技了
 * @return {boolean}
 * */
Handler.isStartBattle = function () {
    return this.section > 0 && this.section < 4&& this.isBattleTime;
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
 * 获取展示时间
 * @return {boolean}
 * */
Handler.getShowTime = function () {
    return this.showTime;
};

/**
 * 获取截至时间时间
 * @return {string}
 * */
Handler.getCutTime = function () {
    return (new Date().getMonth() + 1) + "-" + utils.curMaxDay() + " 22:00";
};

/**
 * 请求匹配
 * @param {object} player 请求匹配玩家
 * @return {number}
 * */
Handler.requestBattle = function (player) {

    /** 请求加入队列*/
    this.queue.push({
                        roleID: player.GetId(),
                        credits: player.GetRoleJJCManager().GetData().GetJJCInfo(eJJCInfo.CREDIS),
                        jjcMgr: player.GetRoleJJCManager(),
                        refreshTime: new Date().getTime()
                    });

    /*    _.sortedIndex(this.queue,
     {
     roleID: player.GetId(),
     credits: player.GetRoleJJCManager().GetJJCInfo(eJJCInfo.CREDIS),
     refreshTime: new Date().getTime()
     },
     function(obj) {
     return obj.credits;
     }
     );*/
    /*    var stooges = [{name: 'moe', age: 40}, {name: 'curly', age: 60}, {name: 'larry', age: 50}];
     var key = stooges.sort(function(a, b) {
     return a.age > b.age;
     });*/
    logger.info('%d enter jjc battle queue and size: %d', player.GetId(), this.queue.length);
    return errorCodes.OK;
};

/**
 * 取消请求匹配
 *
 * @param {Number} type 匹配类型
 * @param {Number} roleID 请求匹配玩家ID
 * @return {number}
 * */
Handler.breakRequestBattle = function (type, roleID) {
    if (type == eRoundType.Battle) {
        for (var i in this.queue) {
            var temp = this.queue[i];
            if (temp['roleID'] == roleID) {
                this.queue.splice(i, 1);
                break;
            }
        }
    } else if (type == eRoundType.Practice) {
        for (var i in this.practiceQueue) {
            var temp = this.practiceQueue[i];
            if (temp['roleID'] == roleID) {
                this.practiceQueue.splice(i, 1);
                break;
            }
        }
    }
};

/**
 * 请求练习匹配
 * @param {object} player 请求匹配玩家
 * @return {number}
 * */
Handler.requestPracticeBattle = function (player) {
    /** 请求加入队列*/
    this.practiceQueue.push({
                                roleID: player.GetId(),
                                credits: player.GetRoleJJCManager().GetData().GetJJCInfo(eJJCInfo.CREDIS),
                                jjcMgr: player.GetRoleJJCManager(),
                                refreshTime: new Date().getTime()
                            });
    logger.info('%d enter jjc battle practiceQueue and size: %d', player.GetId(), this.queue.length);
    return errorCodes.OK;
};

/**
 * 刷新队列请求匹配 并进行匹配
 * */
Handler.refreshQueue = function () {
    var self = this;
    /**数组排序*/
    var queue = this.queue.sort(function (a, b) {
        return a.credits < b.credits;
    });
    this.queue = [];


    var length = queue.length;
    logger.info('refreshQueue length: [%d], ', length);
    for (var i = 0; i < length && queue.length > 0; i + 2) {
        var red = queue.pop();
        var blue = queue.pop();
        //logger.error('red roleID: %d, credits: %d', red.roleID, red.credits);
        /** 最后blue 为空时， 红重新回到队列*/
        if (!blue && !red) {
            continue;
        } else if (!blue && !!red) {
            this.queue.push(red);
            continue;
        } else if (!!blue && !red) {
            this.queue.push(blue);
            continue;
        }


        if (!playerManager.GetPlayer(red.roleID)) {
            self.sendFailRequireBattle(blue.roleID);
            continue;
        }

        if (!playerManager.GetPlayer(blue.roleID)) {
            self.sendFailRequireBattle(red.roleID);
            continue;
        }

        /** 匹配成功*/
        red.type = eSideType.Red;
        blue.type = eSideType.Blue;

        /** rs 创建队伍*/
        self.CreateRoundRoom(red, blue, eRoundType.Battle);
    }
};

/**
 * 创建房间
 * */
Handler.CreateRoundRoom = function(red, blue, roundType) {
    var self = this;

    pomelo.app.rpc.rs.roomRemote.CreateTeam(null, red.roleID, blue.roleID, Default__CustomID, gameConst.eLevelTarget.JJC,
                                            {}, function (err, res) {

            if (!!err || res['result'] != errorCodes.OK) {
                logger.error('jjc round create refreshQueue Team err: %s res: %j', utils.getErrorMessage(err), res);

                self.sendFailRequireBattle(red.roleID);
                self.deleteBattleType(red.roleID);

                self.sendFailRequireBattle(blue.roleID);
                self.deleteBattleType(blue.roleID);
                return ;
            }

            self.createRound(red, blue, roundType);
        });
};


/**
 * 刷新练习队列请求匹配 并进行匹配
 * */
Handler.refreshPracticeQueue = function () {
    var self = this;

    /**数组排序*/
    var queue = this.practiceQueue.sort(function (a, b) {
        return a.credits < b.credits;
    });
    this.practiceQueue = [];

    var length = queue.length;
    for (var i = 0; i < length && queue.length > 0; i + 2) {
        var red = queue.pop();
        var blue = queue.pop();
        /** 最后blue 为空时， 红重新回到队列*/
        if (!blue && !red) {
            continue;
        } else if (!blue && !!red) {
            this.practiceQueue.push(red);
            continue;
        } else if (!!blue && !red) {
            this.practiceQueue.push(blue);
            continue;
        }

        if (!playerManager.GetPlayer(red.roleID)) {
            self.sendFailRequireBattle(blue.roleID);
            continue;
        }

        if (!playerManager.GetPlayer(blue.roleID)) {
            self.sendFailRequireBattle(red.roleID);
            continue;
        }

        /** 匹配成功*/
        red.type = eSideType.Red;
        blue.type = eSideType.Blue;
        /** rs 创建队伍*/
        self.CreateRoundRoom(red, blue, eRoundType.Practice);
    }
};

/**
 * 匹配成功进入房间
 * @param {Object} red 红方
 * @param {Object} blue 蓝方
 * @param {number} type 类型（0:练习, 1:战斗, 2: 跨服）
 * */
Handler.createRound = function (red, blue, type) {
    var id = this.roundGid++;
    /** 创建回合*/
    this.roundMap[id] = new Round({
                                      id: id,
                                      type: type,
                                      red: red,
                                      blue: blue,
                                      mgr: this
                                  });
};

/**
 * 获取回合
 * @param {number} roundID 回合id
 * */
Handler.getRound = function (roundID) {
    return this.roundMap[roundID];
};

/**
 * 是否刷新匹配队列
 * @param {number} nowSec 当前时间（毫秒）
 * */
Handler.isRefreshQueue = function (nowSec) {
    if (nowSec - this.refreshTime >= defaultValue.JJC_RefreshInterval) {
        this.refreshTime = nowSec;
        return true;
    }
    return false;
};

/**
 * 是否刷新联系匹配队列
 * @param {number} nowSec 当前时间（毫秒）
 * */
Handler.isRefreshPracticeQueue = function (nowSec) {
    if (nowSec - this.refreshPracticeTime >= defaultValue.JJC_RefreshInterval) {
        this.refreshPracticeTime = nowSec;
        return true;
    }
    return false;
};

/**
 * 刷新队列中超时的玩家， 匹配失败
 * */
Handler.refreshTimeOut = function () {
    var queue = this.queue.slice(0);
    this.queue = [];
    var length = queue.length;
    for (var i = 0; i < length && queue.length > 0; i++) {
        var temp = queue[i];
        if (this.isTimeOut(temp.refreshTime)) {
            this.sendFailRequireBattle(temp.roleID);
            this.deleteBattleType(temp.roleID);
        } else {
            this.queue.push(temp);
        }
    }
};

/**
 * 检查玩家对战回合是否有超时
 * @param {number} nowSec 当前时间
 * */
Handler.checkRoundTimeOut = function (nowSec) {
    var map = this.roundMap;
    for (var i in map) {
        map[i].timeOut(nowSec);
    }
};

/**
 * 刷新练习队列中超时的玩家， 匹配失败
 * */
Handler.refreshPracticeTimeOut = function () {
    var queue = this.practiceQueue.slice(0);
    this.practiceQueue = [];
    var length = queue.length;
    for (var i = 0; i < length && queue.length > 0; i++) {
        var temp = queue[i];
        if (this.isTimeOut(temp.refreshTime)) {
            this.sendFailRequireBattle(temp.roleID);
            this.deleteBattleType(temp.roleID);
        } else {
            this.practiceQueue.push(temp);
        }
    }
};

/**
 * 是否超时
 * @param {number} nowSec 指定时间
 * @return {boolean}
 * */
Handler.isTimeOut = function (nowSec) {
    if (new Date().getTime() - nowSec >= defaultValue.JJC_RefreshTimeOut) {
        return true;
    }
    return false;
};

/**
 * 发送匹配失败
 * @param {number} roleID 玩家id
 * */
Handler.sendFailRequireBattle = function (roleID) {
    var route = 'ServerBattleStats';
    var msg = {
        isSccuess: 0,
        roleID: 0
    };
    var player = playerManager.GetPlayer(roleID);
    if (player) {
        player.SendMessage(route, msg);
    }
};

// 发送战斗变化状态
Handler.sendFightChange = function (roleID, isBegin) {
    var route = 'ServerFightChange';
    var msg = {
        isBegin: isBegin,
        roleID: 0
    };
    var player = playerManager.GetPlayer(roleID);
    if (player) {
        player.SendMessage(route, msg);
    }
};

// 活动结束取消所有队列信息
Handler.deleteAllQueue = function () {
    var self = this;
    var queue = this.queue;

    //logger.info('jjc active is done');
    for (var i = 0; i < queue.length; ++i) {
        var temp = queue[i];
        this.sendFailRequireBattle(temp.roleID);
        this.deleteBattleType(temp.roleID);
    }


    this.queue = [];

};
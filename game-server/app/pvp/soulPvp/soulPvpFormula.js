/**
 * The file soulPvpFormula.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/01/04 16:10:00
 * To change this template use File | Setting |File Template
 */

var utils = require('../../tools/utils');
var soulPvpTMgr = require('../../tools/template/soulPvpTMgr');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);

var Handler = module.exports;


/**
 * 根据自己排行榜 获取对手
 *
 2.2 显示对手规则
 	对手列表为10人，为比自己排名高的9人与自己
 	当自己排名在1000名之后时，排名前9人选择规则为：
 排名高100的玩家
 排名高75的玩家
 排名高50的玩家
 排名高30的玩家
 排名高20的玩家
 排名高10的玩家
 排名高5的玩家
 排名高3的玩家
 排名高1的玩家
 	当自己排名在1000-101时，排名前9人选择规则为：
 排名高70的玩家
 排名高55的玩家
 排名高40的玩家
 排名高25的玩家
 排名高20的玩家
 排名高10的玩家
 排名高5的玩家
 排名高3的玩家
 排名高1的玩家
 	当自己排名在100-51时，排名前9人选择规则为：
 排名高40的玩家
 排名高25的玩家
 排名高20的玩家
 排名高15的玩家
 排名高10的玩家
 排名高8的玩家
 排名高5的玩家
 排名高3的玩家
 排名高1的玩家
 	当自己排名在50-31时，排名前9人选择规则为：
 排名高30的玩家
 排名高25的玩家
 排名高20的玩家
 排名高15的玩家
 排名高10的玩家
 排名高8的玩家
 排名高5的玩家
 排名高3的玩家
 排名高1的玩家
 	当自己排名在30-11时，排名前9人选择规则为：
 排名高10的玩家
 排名高8的玩家
 排名高7的玩家
 排名高6的玩家
 排名高5的玩家
 排名高4的玩家
 排名高3的玩家
 排名高2的玩家
 排名高1的玩家


 	当自己排名在10-1时，显示前10玩家即可
 	每次打开界面时，对手列表中自己显示在列表最下方
 	每次打开界面，刷新列表信息

 后面添加需求 ----------

 4.4对手选择规则优化
 原1001名之后的分档，改为1001-2000名
 新增2001名之后对手选择区间
 排名高1000的玩家
 排名高750的玩家
 排名高500的玩家
 排名高300的玩家
 排名高200的玩家
 排名高100的玩家
 排名高50的玩家
 排名高30的玩家
 排名高10的玩家


 从 列表中 随机出 三个 对手

 * */
Handler.findRival = function (rankKey) {
    var list = null;
    if (rankKey >= 2001) {
        return [rankKey - 1000, rankKey - 750, rankKey - 500, rankKey - 300, rankKey - 200,
                rankKey - 100, rankKey - 50, rankKey - 30, rankKey - 10];
    }else if(rankKey < 2001 && rankKey >= 1001){
        return [rankKey - 70, rankKey - 55, rankKey - 40, rankKey - 25, rankKey - 20,
                rankKey - 10, rankKey - 5, rankKey - 3, rankKey - 1];
    } else if(rankKey < 1001 && rankKey >= 101){
        list = [rankKey - 70, rankKey - 55, rankKey - 40, rankKey - 25, rankKey - 20,
                rankKey - 10, rankKey - 5, rankKey - 3, rankKey - 1];
    } else if(rankKey < 101 && rankKey >= 51){
        list = [rankKey - 40, rankKey - 25, rankKey - 20, rankKey - 15, rankKey - 10,
                rankKey - 8, rankKey - 5, rankKey - 3, rankKey - 1];
    } else if(rankKey < 51 && rankKey >= 31){
        list = [rankKey - 30, rankKey - 25, rankKey - 20, rankKey - 15, rankKey - 10,
                rankKey - 8, rankKey - 5, rankKey - 3, rankKey - 1];
    } else if(rankKey < 31 && rankKey >= 11){
        list = [rankKey - 10, rankKey - 8, rankKey - 7, rankKey - 6, rankKey - 5,
                rankKey - 4, rankKey - 3, rankKey - 2, rankKey - 1];
    } else if(rankKey < 11 && rankKey >= 1){

        list = [];
        for (var i = 1; i <= 10; i++){
            list.push(i);
        }
    }


    var rivalList = [];

    /** 10个中随机 3个 10 一下特殊处理*/
    if (rankKey >= 10) {
        rivalList.push(list[Math.floor(Math.random() * 3)]);
        rivalList.push(list[Math.floor(Math.random() * 3) + 3]);
        rivalList.push(list[Math.floor(Math.random() * 3) + 6]);
    } else if(rankKey < 10 && rankKey >= 9){
        rivalList.push(list[Math.floor(Math.random() * 2)]);
        rivalList.push(list[Math.floor(Math.random() * 3) + 2]);
        rivalList.push(list[Math.floor(Math.random() * 3) + 5]);
    } else if(rankKey < 9 && rankKey >= 8){
        rivalList.push(list[0]);
        rivalList.push(list[Math.floor(Math.random() * 3) + 1]);
        rivalList.push(list[Math.floor(Math.random() * 3) + 4]);
    } else if(rankKey < 8 && rankKey >= 7){
        rivalList.push(list[Math.floor(Math.random() * 2)]);
        rivalList.push(list[Math.floor(Math.random() * 2) + 2]);
        rivalList.push(list[Math.floor(Math.random() * 2) + 4]);
    } else if(rankKey < 7 && rankKey >= 6){
        rivalList.push(list[0]);
        rivalList.push(list[Math.floor(Math.random() * 2) + 1]);
        rivalList.push(list[Math.floor(Math.random() * 2) + 3]);
    } else if(rankKey < 6 && rankKey >= 5){
        rivalList.push(list[0]);
        rivalList.push(list[1]);
        rivalList.push(list[Math.floor(Math.random() * 2) + 2]);
    } else if(rankKey < 5 && rankKey >= 4){
        rivalList.push(list[0]);
        rivalList.push(list[1]);
        rivalList.push(list[2]);
    } else if(rankKey < 4 && rankKey >= 3){
        rivalList.push(list[0]);
        rivalList.push(list[1]);
        rivalList.push(list[3]);
    } else if(rankKey < 3 && rankKey >= 2){
        rivalList.push(list[0]);
        rivalList.push(list[2]);
        rivalList.push(list[3]);
    } else if(rankKey < 2 && rankKey >= 1){
        rivalList.push(list[1]);
        rivalList.push(list[2]);
        rivalList.push(list[3]);
    }

    return rivalList;
};

/**
 * 历史最高奖励
 *
 * @param {Number} bRank 之前排名
 * @param {Number} cRank 提高后的排名
 * */
Handler.calculateMasonry = function(bRank, cRank) {
    if (bRank <= cRank) {
        return 0;
    }

    var temps = soulPvpTMgr.GetAllTemplate();
    var sum = 0;
    for (var id in temps) {
        var temp = temps[id];
        //logger.info('****************************: %j  -- %d -- %d -- %d', temp, bRank, cRank, sum);
        /*     if (bRank > temp.maxLevel || cRank < temp.minLevel) {
         *//*                 501          1000
         ＊　　　＊　　x x　　＊　　　　　＊　×　×
         * ***********************************
         **//*
         *//** 改变前排行 > 最大排行  或 改变后排行  < 最小排行 *//*
         continue;
         } else*/ if (cRank == temp.maxLevel && cRank == temp.minLevel) {
            //logger.info('**************5**************: %j  -- %d -- %d -- %d', temp, bRank, cRank, sum);
            /** 第一名特殊情况处理 */
            sum += temp.Num1;
            continue;
        } else if (cRank <= temp.maxLevel && cRank >= temp.minLevel && bRank > temp.maxLevel) {
            //logger.info('*************1***************: %j  -- %d -- %d -- %d', temp, bRank, cRank, sum);
            /*                 501          1000
             ＊　　　＊　　　　＊　　　　×　＊　　×
             * ***********************************
             **/
            /** 改变前排行 > 最大排行  并 改变后排行  >= 最小排行 并 改变后排行  <= 最大排行*/
            sum += (temp.Num1 * (temp.maxLevel - cRank));
            continue;
        } else if (cRank >= temp.minLevel && bRank <= temp.maxLevel) {
            //logger.info('***********2*****************: %j  -- %d -- %d -- %d', temp, bRank, cRank, sum);
            /*                501          1000
             ＊　　　＊　　　　＊　　×　　×　＊　
             * ***********************************
             **/
            /** 改变前排行 <= 最大排行 并  改变后排行  >= 最小排行*/
            sum += (temp.Num1 * (bRank - cRank));
            break;
        }
        else if (bRank <= temp.maxLevel && bRank >= temp.minLevel && cRank < temp.minLevel) {
            //logger.info('************3****************: %j  -- %d -- %d -- %d', temp, bRank, cRank, sum);
            /*                501          1000
             ＊　　　＊　　　×　＊　　　　×　＊　
             * ***********************************
             **/
            /** 改变前排行 <= 最大排行 并 改变前排行 > 最大排行 并  改变后排行  <= 最小排行*/
            sum += (temp.Num1 * (bRank - temp.minLevel));
            continue;
        }  else if (bRank > temp.maxLevel && cRank < temp.minLevel) {
//            /logger.info('***********4*****************: %j  -- %d -- %d -- %d', temp, bRank, cRank, sum);
            /*                501          1000
             ＊　　　＊　　　×　＊　　　　　＊　×
             * ***********************************
             **/
            /** 改变前排行 > 最大排行 并  改变后排行  < 最小排行*/
            sum += (temp.Num1 * (temp.maxLevel - temp.minLevel));
            continue;
        }

    }
    return sum;
};

/**
 * 计算收益
 *
 * @param {Number} rank 当前排名
 * @param {Number} startTime 占领开始时间 分钟
 * @return {Number}
 * @api public
 * */
Handler.calculateEarnings = function(rank, startTime) {

    if (startTime == 0) {
        return 0;
    }

    var rewardData = soulPvpTMgr.getDataByRank(rank);
    if (!!rewardData) {
        return rewardData.Num1 * (utils.getCurMinute() - startTime);
    }
    return 0;
};

/**
 * 玩家战神榜 状态
 * */
Handler.BATTLE_TYPE = {
    FREE: 0,   // 空闲
    READY: 1,   // 准备进入战斗
    BATTLING: 2, //战斗中， 挑战别人
    BATTLED: 3,  // 被挑战中
    BALANCE: 4,  //结算中
    PERSISTENCE: 5   // 需要持久化
};


/**
 * 获取日志类型
 *
 * @param {Number} bRank 改变前排名
 * @param {Number} cRank 改变后排名
 * @return {Number}
 * */
Handler.getSoulPvpLogType = function (bRank, cRank) {
    if (bRank == cRank) {
        return this.ARES_LOG_TYPE.UN_CHANGED_FAIL;
    } else if (bRank > cRank){
        return this.ARES_LOG_TYPE.UP;
    } else {
        return this.ARES_LOG_TYPE.DOWN;
    }
};

Handler.ARES_LOG_TYPE = {
    /*获胜*/
    UP: 0,   //排民上升
    DOWN: 1,  //排名下降
    UN_CHANGED_FAIL: 2, // 排名不变 挑战者 失败
    UN_CHANGED_WIN: 3 // 排名不变 被挑战者 成功
};

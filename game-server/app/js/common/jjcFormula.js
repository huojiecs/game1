/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/6/18
 * To change this template use File | Setting |File Template
 */

var utils = require('../../tools/utils');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);

var Handler = module.exports;

/**
 * 玩家战神榜 状态
 * */
Handler.BATTLE_TYPE = {
    FREE: 0,         // 空闲
    MATCHING: 1,     //进行匹配
    READY: 2,        // 准备进入战斗
    BATTLING: 3,     //战斗中， 挑战别人
    BALANCE: 4,      //结算中
    PERSISTENCE: 5   // 需要持久化
};
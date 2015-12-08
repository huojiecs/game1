/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/7/3
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var Room = require('./room');
var JjcRoom = require('./jjcRoom');

var Factory = module.exports;

/**
 * 创建房间
 *
 * @param {Number} levelTarget 关卡类型
 * @param {Object} teamInfo 组队数据
 * @param {Number} customID 关卡id
 * */
Factory.CreateRoom = function (levelTarget, teamInfo, customID) {

    var newRoom = null;

    switch (levelTarget) {
        case gameConst.eLevelTarget.JJC :
            newRoom = new JjcRoom(teamInfo, customID);
            break;
        default :
            newRoom = new Room(teamInfo, customID);
            break;
    }
    return newRoom;
};